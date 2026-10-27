using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Đọc/ghi dữ liệu nghiệp vụ dùng chung cho mọi phân hệ, có kiểm tra quyền chức năng, phạm vi dự án và ghi nhật ký.</summary>
[Authorize, Route("api/data")]
public class DataController : ApiControllerBase
{
    public DataController(AppDbContext db, UserContext uc) : base(db, uc) { }

    private async Task<string?> ProjectOf(EntityBase e) => e switch
    {
        Project p => p.Id,
        IHasProject hp => hp.ProjectId,
        IHasContract hc => hc.ContractId is null ? null :
            await Db.Contracts.AsNoTracking().Where(c => c.Id == hc.ContractId).Select(c => c.ProjectId).FirstOrDefaultAsync(),
        _ => null
    };
    private static bool Scoped(EntityBase e) => e is Project or IHasProject or IHasContract;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var contractProject = await Db.Contracts.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.ProjectId);
        bool Visible(EntityBase e) => e switch
        {
            Project p => Uc.InScope(p.Id),
            IHasProject hp => Uc.InScope(hp.ProjectId),
            IHasContract hc => Uc.InScope(hc.ContractId != null && contractProject.TryGetValue(hc.ContractId, out var pid) ? pid : null),
            _ => true
        };
        var result = new Dictionary<string, object>();
        foreach (var def in Collections.All)
        {
            var list = await def.Query(Db).AsNoTracking().ToListAsync();
            result[def.Name] = list.Where(Visible).Cast<object>().ToList();
        }
        if (Uc.Can("quan-tri"))
        {
            result["users"] = await Db.Users.AsNoTracking().OrderBy(u => u.Username).Cast<object>().ToListAsync();
            result["logs"] = await Db.Logs.AsNoTracking().OrderByDescending(l => l.Ts).Take(500).Cast<object>().ToListAsync();
        }
        else
        {
            result["users"] = await Db.Users.AsNoTracking().Select(u => new { u.Id, u.Username, u.Name, u.Unit, u.GroupId, u.Active }).Cast<object>().ToListAsync();
            result["logs"] = new List<object>();
        }
        return Ok(result);
    }

    [HttpPut("{collection}/{id}")]
    public async Task<IActionResult> Put(string collection, string id, [FromBody] JsonElement body)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var def = Collections.Find(collection);
        if (def is null || !ValidId(id)) return Error(400, "Dữ liệu không hợp lệ.");
        if (!Uc.Can(def.Module, true)) return Denied();
        EntityBase obj;
        try { obj = (EntityBase)JsonSerializer.Deserialize(body.GetRawText(), def.Type, JsonConfig.Options)!; }
        catch (JsonException ex) { return Error(400, "Dữ liệu không hợp lệ: " + ex.Message); }
        obj.Id = id;
        var existing = (EntityBase?)await Db.FindAsync(def.Type, id);

        if (Scoped(obj))
        {
            if (!Uc.InScope(await ProjectOf(obj))) return Denied("Dự án này nằm ngoài phạm vi dữ liệu được giao.");
            if (existing is not null && !Uc.InScope(await ProjectOf(existing))) return Denied("Dự án này nằm ngoài phạm vi dữ liệu được giao.");
            if (obj is Project && existing is null && Uc.Scope is not null) return Denied("Tài khoản bị giới hạn phạm vi dự án nên không thêm được dự án mới.");
        }
        if (obj is UserGroup g)
        {
            var old = existing as UserGroup;
            if (!Uc.IsAdmin) g.Admin = old?.Admin ?? false;
            if (id == "g-admin") g.Admin = true;
            if (old?.Admin == true && !Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được sửa nhóm có toàn quyền.");
        }

        obj.UpdatedAt = DateTime.UtcNow; obj.UpdatedBy = Uc.User.Username;
        if (existing is null) Db.Add(obj); else Db.Entry(existing).CurrentValues.SetValues(obj);
        Uc.Log(existing is null ? "Thêm mới" : "Cập nhật", def.Label, Collections.LabelOf(obj));
        await Db.SaveChangesAsync();
        return Ok(obj);
    }

    [HttpDelete("{collection}/{id}")]
    public async Task<IActionResult> Delete(string collection, string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var def = Collections.Find(collection);
        if (def is null) return Error(400, "Dữ liệu không hợp lệ.");
        if (!Uc.Can(def.Module, true)) return Denied();
        var existing = (EntityBase?)await Db.FindAsync(def.Type, id);
        if (existing is null) return Error(404, "Bản ghi không còn tồn tại.");
        if (Scoped(existing) && !Uc.InScope(await ProjectOf(existing))) return Denied("Dự án này nằm ngoài phạm vi dữ liệu được giao.");
        if (id == "g-admin") return Denied("Không thể xóa nhóm quản trị hệ thống.");
        foreach (var (dc, fk) in def.Dependents)
        {
            var n = await Collections.CountDependents(Db, dc, fk, id);
            if (n > 0) return Error(409, $"Không xóa được: còn {n} bản ghi \"{(Collections.Find(dc)?.Label ?? "Người dùng")}\" liên quan. Hãy xử lý các bản ghi đó trước.");
        }
        Db.Remove(existing);
        Uc.Log("Xóa", def.Label, Collections.LabelOf(existing));
        await Db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    public record LogRequest(string Action, string? Module, string? Target);

    /// <summary>Ghi nhận các thao tác không thay đổi dữ liệu (xuất báo cáo, sao lưu…).</summary>
    [HttpPost("logs")]
    public async Task<IActionResult> AddLog([FromBody] LogRequest r)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        Uc.Log(r.Action.Length > 100 ? r.Action[..100] : r.Action, r.Module ?? "", r.Target ?? "");
        await Db.SaveChangesAsync();
        return Ok(new { ok = true });
    }
}

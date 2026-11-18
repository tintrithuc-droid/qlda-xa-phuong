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

    private Task<string?> ProjectOf(EntityBase e) => ProjectScope.ProjectOf(Db, e);
    private static bool Scoped(EntityBase e) => ProjectScope.Scoped(e);

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
            // Sắp theo mã để thứ tự ổn định trên mọi CSDL (PostgreSQL không giữ thứ tự dòng sau khi cập nhật)
            var list = await def.Query(Db).AsNoTracking().OrderBy(e => e.Id).ToListAsync();
            result[def.Name] = list.Where(Visible).Where(e => e is not Guide g || Uc.SeesGuide(g)).Cast<object>().ToList();
        }
        var hiddenGuides = (await Db.Guides.AsNoTracking().ToListAsync()).Where(g => !Uc.SeesGuide(g)).Select(g => g.Id).ToHashSet();
        // Tệp đính kèm (không gồm thùng rác) trong phạm vi dự án được giao
        result["attachments"] = (await Db.Attachments.AsNoTracking().Where(a => a.DeletedAt == null).OrderBy(a => a.UploadedAt).ToListAsync())
            .Where(a => a.Collection == "guides" ? !hiddenGuides.Contains(a.RecordId) : Uc.InScope(a.ProjectId)).Cast<object>().ToList();
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
        // Bản 1.7: quản trị chính, các loại hồ sơ có bước kiểm tra
        result["ownerId"] = Owner.Ensure(Db) ?? "";
        result["wfCheck"] = Workflow.All.Where(w => Workflow.CheckEnabled(Db, w)).Select(w => w.Collection).ToList();
        return Ok(result);
    }

    public record CheckStepRequest(string Collection, bool Enabled);

    /// <summary>Bật, tắt bước kiểm tra của một loại hồ sơ (quản trị hệ thống).</summary>
    [HttpPost("wf-check")]
    public async Task<IActionResult> SetCheckStep([FromBody] CheckStepRequest r)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được thay đổi quy trình duyệt.");
        var w = Workflow.Find(r.Collection); if (w is null) return Error(400, "Loại hồ sơ không hợp lệ.");
        // Tắt bước kiểm tra: hồ sơ đang chờ kiểm tra chuyển thẳng sang chờ duyệt
        if (!r.Enabled && Collections.Find(w.Collection) is { } cd)
            foreach (var e in (await cd.Query(Db).ToListAsync()).Where(e => Workflow.StatusOf(e) == WorkflowDef.Checking)) Workflow.SetStatus(e, w.Waiting);
        var key = Workflow.CheckKey(w.Collection);
        var s = await Db.Settings.FirstOrDefaultAsync(x => x.Key == key);
        if (s is null) Db.Settings.Add(new AppSetting { Key = key, Value = r.Enabled ? "1" : "0", UpdatedAt = DateTime.UtcNow, UpdatedBy = Uc.User.Username });
        else { s.Value = r.Enabled ? "1" : "0"; s.UpdatedAt = DateTime.UtcNow; s.UpdatedBy = Uc.User.Username; }
        Uc.Log(r.Enabled ? "Bật bước kiểm tra" : "Tắt bước kiểm tra", "Quy trình duyệt", Collections.Find(w.Collection)?.Label ?? w.Collection);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true });
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

        var wf = Workflow.Find(collection);
        if (wf is not null)
        {
            if (existing is null && string.IsNullOrEmpty(Workflow.StatusOf(obj))) Workflow.SetStatus(obj, wf.Draft);
            if (!Workflow.CanApprove(Uc, wf) && Workflow.CheckDirectWrite(wf, existing, obj) is { } msg) return Denied(msg);
            if (Workflow.CheckStatusChange(wf, existing, obj) is { } msg2) return Denied(msg2);
        }
        // Dòng khối lượng thuộc đợt nghiệm thu (bản 1.7): đợt đang chờ hoặc đã duyệt thì khóa với người không có quyền duyệt
        if (obj is VolumeEntry ve && await VolumeLock(ve, existing as VolumeEntry) is { } vmsg) return Denied(vmsg);

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
        if (Workflow.Find(collection) is { } wfd && !Workflow.CanApprove(Uc, wfd))
        {
            var st = Workflow.StatusOf(existing);
            if (wfd.IsPending(st) || wfd.IsLocked(st)) return Denied("Hồ sơ đang chờ duyệt hoặc đã duyệt nên không xóa được. Liên hệ người có quyền duyệt.");
        }
        if (existing is VolumeEntry dv && await VolumeLock(dv, dv) is { } vmsg) return Denied(vmsg);
        foreach (var (dc, fk) in def.Dependents)
        {
            var n = await Collections.CountDependents(Db, dc, fk, id);
            if (n > 0) return Error(409, $"Không xóa được: còn {n} bản ghi \"{(Collections.Find(dc)?.Label ?? "Người dùng")}\" liên quan. Hãy xử lý các bản ghi đó trước.");
        }
        Db.Remove(existing);
        // Tệp đính kèm của bản ghi chuyển vào thùng rác (quản trị khôi phục/xóa hẳn trong 30 ngày)
        foreach (var a in await Db.Attachments.Where(a => a.Collection == collection && a.RecordId == id && a.DeletedAt == null).ToListAsync())
        { a.DeletedAt = DateTime.UtcNow; a.DeletedBy = Uc.User.Name + " (xóa bản ghi)"; }
        Uc.Log("Xóa", def.Label, Collections.LabelOf(existing));
        await Db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    private async Task<string?> VolumeLock(VolumeEntry v, VolumeEntry? old)
    {
        var wf = Workflow.Find("vbatches")!;
        if (Workflow.CanApprove(Uc, wf)) return null;
        foreach (var bid in new[] { v.BatchId, old?.BatchId }.Where(x => !string.IsNullOrEmpty(x)).Distinct())
        {
            var b = await Db.VolumeBatches.AsNoTracking().FirstOrDefaultAsync(x => x.Id == bid);
            if (b is null) continue;
            if (wf.IsPending(b.Status) || wf.IsLocked(b.Status))
                return $"Đợt nghiệm thu \"{b.Name}\" đang chờ kiểm tra, chờ duyệt hoặc đã duyệt nên không sửa được khối lượng. Người có quyền duyệt trả lại hoặc thu hồi thì mới sửa được.";
        }
        if (old is not null && string.IsNullOrEmpty(old.BatchId)) return null; // dữ liệu trước bản 1.7
        return null;
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

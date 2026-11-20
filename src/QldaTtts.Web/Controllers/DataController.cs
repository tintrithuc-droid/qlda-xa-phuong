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
    private Task<string?> PackageOf(EntityBase e) => ProjectScope.PackageOf(Db, e);

    /// <summary>Tập dữ liệu chỉ gửi cho nhóm được xem phân hệ tương ứng.</summary>
    private static readonly Dictionary<string, string> Private = new()
    {
        ["capitals"] = "von", ["settlements"] = "quyet-toan", ["clearances"] = "gpmb", ["diaries"] = "nhat-ky", ["payplans"] = "thanh-toan",
    };

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var contractProject = await Db.Contracts.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.ProjectId);
        var contractPackage = Uc.Packages is null ? null : await Db.Contracts.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.PackageId);
        bool InPkg(EntityBase e) => Uc.Packages is null || Uc.InPackage(e switch
        {
            Package k => k.Id,
            IHasContract hc => hc.ContractId != null && contractPackage!.TryGetValue(hc.ContractId, out var kid) ? kid : null,
            _ => e.GetType().GetProperty("PackageId")?.GetValue(e) as string
        });
        bool Visible(EntityBase e) => e switch
        {
            Project p => Uc.InScope(p.Id),
            IHasProject hp => Uc.InScope(hp.ProjectId) && InPkg(e),
            IHasContract hc => Uc.InScope(hc.ContractId != null && contractProject.TryGetValue(hc.ContractId, out var pid) ? pid : null) && InPkg(e),
            _ => true
        };
        // Phân hệ nhóm không được xem (vốn, quyết toán, giải phóng mặt bằng, nhật ký, kế hoạch thanh toán) thì máy chủ không gửi dữ liệu,
        // để tài khoản người ngoài (nhà thầu, khách hàng) không đọc được qua trình duyệt. Các tập dữ liệu dùng chung để tính tiến độ vẫn gửi.
        bool Hidden(string col) => Private.TryGetValue(col, out var mod) && !Uc.Can(mod);
        var result = new Dictionary<string, object>();
        foreach (var def in Collections.All)
        {
            if (Hidden(def.Name)) { result[def.Name] = new List<object>(); continue; }
            // Sắp theo mã để thứ tự ổn định trên mọi CSDL (PostgreSQL không giữ thứ tự dòng sau khi cập nhật)
            var list = await def.Query(Db).AsNoTracking().OrderBy(e => e.Id).ToListAsync();
            result[def.Name] = list.Where(Visible).Where(e => e is not Guide g || Uc.SeesGuide(g)).Where(e => e is not ApprovalLog a || !Hidden(a.Collection)).Cast<object>().ToList();
        }
        var hiddenGuides = (await Db.Guides.AsNoTracking().ToListAsync()).Where(g => !Uc.SeesGuide(g)).Select(g => g.Id).ToHashSet();
        // Tệp đính kèm (không gồm thùng rác) trong phạm vi dự án được giao
        result["attachments"] = (await Db.Attachments.AsNoTracking().Where(a => a.DeletedAt == null).OrderBy(a => a.UploadedAt).ToListAsync())
            .Where(a => a.Collection == "guides" ? !hiddenGuides.Contains(a.RecordId) : Uc.InScope(a.ProjectId) && !Hidden(a.Collection)).Cast<object>().ToList();
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
        // Bản 1.8: quy trình duyệt do quản trị thiết lập
        var wfc = Workflow.Load(Db);
        result["wf"] = wfc;
        result["wfCheck"] = wfc.Flows.Where(f => f.Value.Steps.Count > 1).Select(f => f.Key).ToList();
        result["orgId"] = Uc.User.OrgId ?? "";
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
        // Bật: thêm bước kiểm tra trước bước cuối; tắt: bỏ các bước trước bước cuối, hồ sơ đang chờ kiểm tra chuyển thẳng sang chờ duyệt
        var cfg = Workflow.Load(Db); var fc = cfg.Flows[w.Collection];
        if (r.Enabled && fc.Steps.Count < 2) fc.Steps.Insert(0, Workflow.CheckStep(w));
        if (!r.Enabled && fc.Steps.Count > 1)
        {
            fc.Steps = new() { fc.Steps[^1] };
            if (Collections.Find(w.Collection) is { } cd)
                foreach (var e in (await cd.Query(Db).ToListAsync()).Where(e => Workflow.StatusOf(e) == WorkflowDef.Checking)) Workflow.SetStatus(e, w.Waiting);
        }
        Workflow.Save(Db, cfg, Uc.User.Username);
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
            if (!g.Admin) g.Perms = new Dictionary<string, string>(g.Perms ?? new()) { ["quan-tri"] = "none" };
        }

        var wf = Workflow.Find(collection);
        if (wf is not null)
        {
            // Bản 1.8: loại hồ sơ tắt quy trình duyệt thì ghi nhận ngay (đã duyệt), không khóa sửa
            var active = Workflow.Active(Workflow.Load(Db), wf, await ProjectOf(obj));
            var ns = Workflow.StatusOf(obj);
            if (existing is null && (string.IsNullOrEmpty(ns) || (!active && ns == wf.Draft))) Workflow.SetStatus(obj, active ? wf.Draft : wf.Approved);
            if (active && !Workflow.CanApprove(Uc, wf) && Workflow.CheckDirectWrite(wf, existing, obj) is { } msg) return Denied(msg);
            if (Workflow.CheckStatusChange(wf, existing, obj, active) is { } msg2) return Denied(msg2);
        }
        if (Uc.Packages is not null && (!Uc.InPackage(await PackageOf(obj)) || (existing is not null && !Uc.InPackage(await PackageOf(existing)))))
            return Denied("Gói thầu này không thuộc đơn vị của bạn.");
        if (obj is Package pk && (pk.ContractorIds.Count > 0 || pk.SupervisorIds.Count > 0))
        {
            var ids = pk.ContractorIds.Concat(pk.SupervisorIds).Distinct().ToList();
            if (await Db.Organizations.CountAsync(o => ids.Contains(o.Id)) != ids.Count) return Error(400, "Nhà thầu hoặc đơn vị giám sát được chọn không có trong danh mục.");
        }
        // Bản 1.8.3: tỷ lệ liên danh chỉ cho thành viên của gói, mỗi tỷ lệ 0–100%, cộng không quá 100%
        if (obj is Package ps && ps.ContractorShares.Count > 0)
        {
            if (ps.ContractorShares.Keys.Any(k => !ps.ContractorIds.Contains(k))) return Error(400, "Tỷ lệ liên danh có đơn vị không phải thành viên của gói thầu.");
            if (ps.ContractorShares.Values.Any(v => v < 0 || v > 100) || Math.Abs(ps.ContractorShares.Values.Sum() - 100m) > 0.01m || ps.ContractorIds.Any(k => !ps.ContractorShares.ContainsKey(k)))
                return Error(400, "Tỷ lệ liên danh phải có cho từng thành viên, mỗi tỷ lệ từ 0 đến 100%, cộng lại đúng 100%.");
        }
        // Dòng khối lượng thuộc đợt nghiệm thu (bản 1.7): đợt đang chờ hoặc đã duyệt thì khóa với người không có quyền duyệt
        if (obj is VolumeEntry ve && await VolumeLock(ve, existing as VolumeEntry) is { } vmsg) return Denied(vmsg);
        // Hợp đồng tư vấn giai đoạn chuẩn bị đầu tư nghiệm thu theo giá trị sản phẩm: lũy kế nghiệm thu không vượt giá trị sản phẩm
        if (obj is VolumeEntry pv && await PrepOver(pv) is { } pmsg) return Error(409, pmsg);

        obj.UpdatedAt = DateTime.UtcNow; obj.UpdatedBy = Uc.User.Username;
        var what = existing is null ? "" : Fields.Describe(Workflow.Changed(existing, obj));
        if (existing is null) Db.Add(obj); else Db.Entry(existing).CurrentValues.SetValues(obj);
        Uc.Log(existing is null ? "Thêm mới" : "Cập nhật", def.Label, Collections.LabelOf(obj) + (what == "" ? "" : " (" + what + ")"), collection, id);
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
        if (Uc.Packages is not null && !Uc.InPackage(await PackageOf(existing))) return Denied("Gói thầu này không thuộc đơn vị của bạn.");
        if (existing is Organization org)
        {
            var nk = (await Db.Packages.AsNoTracking().Select(k => new { k.ContractorIds, k.SupervisorIds }).ToListAsync()).Count(k => k.ContractorIds.Contains(org.Id) || k.SupervisorIds.Contains(org.Id));
            var nu = await Db.Users.CountAsync(u => u.OrgId == org.Id);
            if (nk + nu > 0) return Error(409, $"Không xóa được: đơn vị đang được chọn ở {nk} gói thầu và gắn với {nu} tài khoản. Có thể chuyển sang ngừng sử dụng.");
        }
        if (Workflow.Find(collection) is { } wfd && !Workflow.CanApprove(Uc, wfd) && Workflow.Active(Workflow.Load(Db), wfd, await ProjectOf(existing)))
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
        Uc.Log("Xóa", def.Label, Collections.LabelOf(existing), collection, id);
        await Db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    private async Task<string?> PrepOver(VolumeEntry v)
    {
        if (string.IsNullOrEmpty(v.BoqId) || !await Phases.IsPrepContract(Db, v.ContractId)) return null;
        var b = await Db.Boq.AsNoTracking().FirstOrDefaultAsync(x => x.Id == v.BoqId);
        if (b is null) return null;
        var rejected = await Db.VolumeBatches.AsNoTracking().Where(x => x.ContractId == v.ContractId && x.Status == "Từ chối").Select(x => x.Id).ToListAsync();
        var others = await Db.Volumes.AsNoTracking().Where(x => x.BoqId == v.BoqId && x.Id != v.Id).ToListAsync();
        var acc = others.Where(x => x.BatchId is null || !rejected.Contains(x.BatchId)).Sum(x => x.AcceptedQty ?? 0) + (v.AcceptedQty ?? 0);
        var qty = b.Qty ?? 0;
        if (acc <= qty * 1.0001 + 1e-9) return null;
        var price = b.Price ?? 0;
        return $"Lũy kế nghiệm thu sản phẩm \"{b.Name}\" ({acc * (double)price:N0} đồng) vượt giá trị theo hợp đồng ({qty * (double)price:N0} đồng). Cần phụ lục điều chỉnh hợp đồng trước.";
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

    /// <summary>Bản 1.8.9: lịch sử thay đổi của một hồ sơ (ai tạo, ai sửa, đính kèm, trình duyệt), cho người được xem hồ sơ đó.</summary>
    [HttpGet("history/{collection}/{id}")]
    public async Task<IActionResult> History(string collection, string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var def = Collections.Find(collection);
        if (def is null || !ValidId(id)) return Error(400, "Dữ liệu không hợp lệ.");
        if (!Uc.Can(def.Module) || (Private.TryGetValue(collection, out var mod) && !Uc.Can(mod))) return Denied();
        var rec = (EntityBase?)await Db.FindAsync(def.Type, id);
        if (rec is not null && Scoped(rec) && !Uc.InScope(await ProjectOf(rec))) return Denied("Dự án này nằm ngoài phạm vi dữ liệu được giao.");
        if (rec is not null && Uc.Packages is not null && !Uc.InPackage(await PackageOf(rec))) return Denied("Gói thầu này không thuộc đơn vị của bạn.");
        var logs = await Db.Logs.AsNoTracking().Where(l => l.Collection == collection && l.RecordId == id).OrderByDescending(l => l.Ts).Take(300)
            .Select(l => new { l.Ts, l.Username, l.Fullname, l.Action, l.Target }).ToListAsync();
        return Ok(logs);
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

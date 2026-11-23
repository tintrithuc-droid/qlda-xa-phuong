using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>
/// Bản 1.10.11: hồ sơ nhân sự làm lại theo góp ý anh Trí (23/11/2026): mỗi mục (bằng cấp, hợp đồng, giấy tờ…) đính được nhiều tệp,
/// xem, tải, xóa từng tệp ngay trên hồ sơ. Tệp lưu ở bảng Attachments với Collection = "ho-so-ns", RecordId = mã mục hồ sơ,
/// KHÔNG gửi kèm /api/data (thông tin riêng), chỉ trả qua các API dưới đây.
/// Quyền: người quản lý nhân sự (nhan-su: sửa) làm mọi việc; người xem nhân sự (nhan-su: xem) xem, trừ kỷ luật và giấy tờ riêng;
/// chính người lao động xem đủ hồ sơ của mình và tự thêm bằng cấp, giấy tờ của mình (không sửa hợp đồng, khen thưởng, kỷ luật).
/// </summary>
[Authorize, Route("api/vp/ho-so")]
public class HoSoNhanSuController : ApiControllerBase
{
    public const string Col = "ho-so-ns";
    /// <summary>Loại mục người lao động tự thêm cho mình được.</summary>
    public static readonly string[] SelfKinds = { "bang-cap", "giay-to" };
    private readonly FileStore _store;
    public HoSoNhanSuController(AppDbContext db, UserContext uc, FileStore store) : base(db, uc) { _store = store; }

    private record Access(Employee E, bool Full, bool Edit, bool Self);

    private async Task<Access?> Load(string empId)
    {
        var e = await Db.Employees.AsNoTracking().FirstOrDefaultAsync(x => x.Id == empId);
        if (e is null) return null;
        var edit = Uc.Can("nhan-su", true); var self = e.UserId != null && e.UserId == Uc.User!.Id;
        if (!edit && !self && !Uc.Can("nhan-su")) return null;
        return new Access(e, edit || self, edit, self);
    }
    private static bool CanEditKind(Access a, string kind) => a.Edit || (a.Self && SelfKinds.Contains(kind));

    private static object FileDto(Attachment f) => new { id = f.Id, fileId = f.FileId, name = f.FileName, type = f.ContentType, size = f.Size, by = f.UploadedBy, at = f.UploadedAt };

    /// <summary>Số mục và số tệp của từng người (cột "Hồ sơ" trong danh sách nhân sự).</summary>
    [HttpGet("tong-hop")]
    public async Task<IActionResult> Summary()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("nhan-su")) return Denied();
        var recs = await Db.EmployeeRecords.AsNoTracking().Select(r => new { r.Id, r.EmployeeId, r.Kind, r.FileId }).ToListAsync();
        var files = (await Db.Attachments.AsNoTracking().Where(a => a.Collection == Col && a.DeletedAt == null).Select(a => a.RecordId).ToListAsync())
            .GroupBy(x => x).ToDictionary(g => g.Key, g => g.Count());
        return Ok(recs.GroupBy(r => r.EmployeeId).ToDictionary(g => g.Key, g => new
        {
            bangCap = g.Count(r => r.Kind == "bang-cap"), muc = g.Count(),
            tep = g.Sum(r => (files.TryGetValue(r.Id, out var n) ? n : 0) + (r.FileId != null ? 1 : 0)),
            bangCapTep = g.Where(r => r.Kind == "bang-cap").Sum(r => (files.TryGetValue(r.Id, out var n) ? n : 0) + (r.FileId != null ? 1 : 0))
        }));
    }

    /// <summary>Hồ sơ đầy đủ một người: các mục, mỗi mục kèm danh sách tệp; quyền thao tác để giao diện chỉ hiện nút dùng được.</summary>
    [HttpGet("{empId}")]
    public async Task<IActionResult> Get(string empId)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var a = await Load(empId); if (a is null) return Denied("Bạn chỉ xem được hồ sơ của chính mình.");
        var recs = await Db.EmployeeRecords.AsNoTracking().Where(r => r.EmployeeId == empId && (a.Full || (r.Kind != "giay-to" && r.Kind != "ky-luat"))).ToListAsync();
        var ids = recs.Select(r => r.Id).ToList();
        var files = (await Db.Attachments.AsNoTracking().Where(x => x.Collection == Col && x.DeletedAt == null && ids.Contains(x.RecordId)).OrderBy(x => x.UploadedAt).ToListAsync())
            .GroupBy(x => x.RecordId).ToDictionary(g => g.Key, g => g.ToList());
        // Tệp cũ (bản 1.10.4, một tệp mỗi mục) hiện như tệp thường; xóa thì gỡ khỏi mục
        var legacy = recs.Where(r => r.FileId != null).Select(r => r.FileId!).ToList();
        var lf = await Db.Files.AsNoTracking().Where(f => legacy.Contains(f.Id)).ToDictionaryAsync(f => f.Id);
        return Ok(new
        {
            canEdit = a.Edit, self = a.Self, selfKinds = a.Self && !a.Edit ? SelfKinds : null,
            records = recs.OrderBy(r => Array.IndexOf(VanPhongController.RecordKinds, r.Kind)).ThenByDescending(r => r.FromDate).Select(r => new
            {
                r.Id, r.Kind, r.Title, r.Org, r.Number, r.FromDate, r.ToDate, r.Amount, r.Note, fromEwork = r.EworkId != null, r.UpdatedAt, r.UpdatedBy,
                canEdit = CanEditKind(a, r.Kind),
                files = (r.FileId != null && lf.TryGetValue(r.FileId, out var sf)
                        ? new[] { (object)new { id = "cu:" + r.Id, fileId = sf.Id, name = r.FileName ?? sf.FileName, type = sf.ContentType, size = sf.Size, by = sf.UploadedBy, at = sf.UploadedAt } }
                        : Array.Empty<object>())
                    .Concat(files.TryGetValue(r.Id, out var l) ? l.Select(FileDto) : Enumerable.Empty<object>()).ToList()
            })
        });
    }

    [HttpPut("{empId}/muc/{rid}")]
    public async Task<IActionResult> Put(string empId, string rid, [FromBody] EmployeeRecord r)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var a = await Load(empId); if (a is null) return Denied();
        if (!ValidId(rid) || !VanPhongController.RecordKinds.Contains(r.Kind)) return Error(400, "Dữ liệu không hợp lệ.");
        if (string.IsNullOrWhiteSpace(r.Title)) return Error(400, "Nhập tên mục (ví dụ: Bằng kỹ sư Công nghệ thông tin).");
        var x = await Db.EmployeeRecords.FirstOrDefaultAsync(o => o.Id == rid);
        if (x is not null && x.EmployeeId != empId) return Error(400, "Dữ liệu không hợp lệ.");
        if (!CanEditKind(a, r.Kind) || (x is not null && !CanEditKind(a, x.Kind))) return Denied("Mục này do bộ phận nhân sự cập nhật.");
        if (x is null) { x = new EmployeeRecord { Id = rid, EmployeeId = empId }; Db.EmployeeRecords.Add(x); }
        x.Kind = r.Kind; x.Title = r.Title.Trim(); x.Org = r.Org?.Trim(); x.Number = r.Number?.Trim(); x.FromDate = r.FromDate; x.ToDate = r.ToDate;
        x.Amount = r.Amount; x.Note = r.Note?.Trim(); x.UpdatedAt = DateTime.UtcNow; x.UpdatedBy = Uc.User.Username;
        Uc.Log("Cập nhật hồ sơ nhân sự", "Nhân sự", $"{a.E.Name}: {x.Title}", "employees", empId);
        await Db.SaveChangesAsync(); return Ok(new { x.Id });
    }

    [HttpDelete("{empId}/muc/{rid}")]
    public async Task<IActionResult> Delete(string empId, string rid)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var a = await Load(empId); if (a is null) return Denied();
        var x = await Db.EmployeeRecords.FirstOrDefaultAsync(o => o.Id == rid && o.EmployeeId == empId); if (x is null) return NotFound();
        if (!CanEditKind(a, x.Kind)) return Denied("Mục này do bộ phận nhân sự cập nhật.");
        foreach (var f in await Db.Attachments.Where(t => t.Collection == Col && t.RecordId == rid && t.DeletedAt == null).ToListAsync()) f.DeletedAt = DateTime.UtcNow;
        Db.EmployeeRecords.Remove(x); Uc.Log("Xóa mục hồ sơ nhân sự", "Nhân sự", $"{a.E.Name}: {x.Title}", "employees", empId);
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    /// <summary>Đính một hoặc nhiều tệp vào một mục (ảnh chụp, bản scan PDF, Word…).</summary>
    [HttpPost("{empId}/muc/{rid}/tep"), RequestSizeLimit(FileStore.MaxBytes + 1024 * 1024), RequestFormLimits(MultipartBodyLengthLimit = FileStore.MaxBytes + 1024 * 1024)]
    public async Task<IActionResult> AddFiles(string empId, string rid, [FromForm] List<IFormFile> files)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var a = await Load(empId); if (a is null) return Denied();
        var x = await Db.EmployeeRecords.AsNoTracking().FirstOrDefaultAsync(o => o.Id == rid && o.EmployeeId == empId); if (x is null) return NotFound();
        if (!CanEditKind(a, x.Kind)) return Denied("Mục này do bộ phận nhân sự cập nhật.");
        if (files is null || files.Count == 0) return Error(400, "Chưa chọn tệp.");
        foreach (var f in files) if (FileStore.Check(f) is { } err) return Error(415, $"{f.FileName}: {err}");
        var added = new List<object>();
        foreach (var f in files)
        {
            var sf = await _store.SaveAsync(f, Uc.User.Username); Db.Files.Add(sf);
            var t = new Attachment
            {
                Id = "att-" + Guid.NewGuid().ToString("N")[..20], Collection = Col, RecordId = rid, Kind = x.Kind, FileId = sf.Id, FileName = sf.FileName,
                ContentType = sf.ContentType, Size = sf.Size, UploadedBy = Uc.User.Name, UploadedAt = DateTime.UtcNow
            };
            Db.Attachments.Add(t); added.Add(FileDto(t));
        }
        Uc.Log("Đính tệp hồ sơ nhân sự", "Nhân sự", $"{a.E.Name}: {x.Title} ({files.Count} tệp)", "employees", empId);
        await Db.SaveChangesAsync(); return Ok(added);
    }

    /// <summary>Gỡ một tệp khỏi mục (chuyển thùng rác 30 ngày, quản trị khôi phục được).</summary>
    [HttpDelete("{empId}/tep/{fid}")]
    public async Task<IActionResult> DeleteFile(string empId, string fid)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var a = await Load(empId); if (a is null) return Denied();
        if (fid.StartsWith("cu:"))
        {
            var r = await Db.EmployeeRecords.FirstOrDefaultAsync(o => o.Id == fid.Substring(3) && o.EmployeeId == empId); if (r is null) return NotFound();
            if (!CanEditKind(a, r.Kind)) return Denied("Mục này do bộ phận nhân sự cập nhật.");
            Uc.Log("Gỡ tệp hồ sơ nhân sự", "Nhân sự", $"{a.E.Name}: {r.Title}: {r.FileName}", "employees", empId);
            r.FileId = null; r.FileName = null; await Db.SaveChangesAsync(); return Ok(new { ok = true });
        }
        var t = await Db.Attachments.FirstOrDefaultAsync(o => o.Id == fid && o.Collection == Col && o.DeletedAt == null); if (t is null) return NotFound();
        var rec = await Db.EmployeeRecords.AsNoTracking().FirstOrDefaultAsync(o => o.Id == t.RecordId && o.EmployeeId == empId); if (rec is null) return NotFound();
        if (!CanEditKind(a, rec.Kind)) return Denied("Mục này do bộ phận nhân sự cập nhật.");
        t.DeletedAt = DateTime.UtcNow;
        Uc.Log("Gỡ tệp hồ sơ nhân sự", "Nhân sự", $"{a.E.Name}: {rec.Title}: {t.FileName}", "employees", empId);
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    /// <summary>Người sở hữu hồ sơ của một tệp (để FilesController kiểm tra quyền tải); null nếu tệp không thuộc hồ sơ nhân sự.</summary>
    public static async Task<string?> OwnerOfFile(AppDbContext db, string fileId)
    {
        var legacy = await db.EmployeeRecords.AsNoTracking().Where(r => r.FileId == fileId).Select(r => r.EmployeeId).FirstOrDefaultAsync();
        if (legacy is not null) return legacy;
        var rid = await db.Attachments.AsNoTracking().Where(a => a.FileId == fileId && a.Collection == Col).Select(a => a.RecordId).FirstOrDefaultAsync();
        return rid is null ? null : await db.EmployeeRecords.AsNoTracking().Where(r => r.Id == rid).Select(r => r.EmployeeId).FirstOrDefaultAsync() ?? "";
    }
}

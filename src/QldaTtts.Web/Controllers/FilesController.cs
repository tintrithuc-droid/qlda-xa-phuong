using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Kho tệp: tải lên (tệp mô hình, ảnh hiện trường) và xem/tải tệp có kiểm tra phạm vi dự án.</summary>
[Authorize, Route("api/files")]
public class FilesController : ApiControllerBase
{
    public const long MaxBytes = FileStore.MaxBytes;
    private readonly FileStore _store;

    public FilesController(AppDbContext db, UserContext uc, FileStore store) : base(db, uc) { _store = store; }

    [HttpPost, RequestSizeLimit(MaxBytes + 1024 * 1024), RequestFormLimits(MultipartBodyLengthLimit = MaxBytes + 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (FileStore.Check(file) is { } err) return Error(err.Contains("500 MB") ? 413 : err.StartsWith("Chưa") ? 400 : 415, err);
        var sf = await _store.SaveAsync(file, Uc.User.Username);
        Db.Files.Add(sf);
        await Db.SaveChangesAsync();
        return Ok(new { id = sf.Id, url = "/api/files/" + sf.Id, sizeBytes = sf.Size, contentType = sf.ContentType, name = sf.FileName });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, [FromQuery] bool download = false)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var sf = await Db.Files.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id);
        if (sf is null) return Error(404, "Tệp không còn tồn tại.");
        // Bản 1.10.4: tệp đính kèm hồ sơ nhân sự (bằng cấp, CCCD, hợp đồng): chỉ người quản lý nhân sự và chính người đó
        // Bản 1.10.12: tệp hồ sơ nhân sự (một tệp cũ trên mục, hoặc nhiều tệp ở Attachments "ho-so-ns"): người quản lý nhân sự, chính người đó;
        // người xem nhân sự chỉ xem được tệp bằng cấp, hợp đồng, công tác, khen thưởng (không xem kỷ luật, giấy tờ riêng)
        var hrOwner = await HoSoNhanSuController.OwnerOfFile(Db, id);
        if (hrOwner is not null && sf.UploadedBy != Uc.User.Username && !Uc.Can("nhan-su", true)
            && !await Db.Employees.AsNoTracking().AnyAsync(e => e.Id == hrOwner && e.UserId == Uc.User.Id))
        {
            var kinds = await Db.EmployeeRecords.AsNoTracking().Where(r => r.FileId == id).Select(r => r.Kind)
                .Concat(Db.Attachments.AsNoTracking().Where(a => a.FileId == id && a.Collection == HoSoNhanSuController.Col).Select(a => a.Kind ?? "")).ToListAsync();
            if (!Uc.Can("nhan-su") || kinds.Any(k => k is "ky-luat" or "giay-to" or "")) return Denied("Tệp thuộc hồ sơ nhân sự riêng.");
        }
        // Bản 1.10.12: tệp của đề xuất (nghỉ phép, thanh toán…) chỉ người gửi, trưởng phòng, người xem mọi đề xuất
        var reqIds = await Db.Attachments.AsNoTracking().Where(a => a.FileId == id && a.Collection == "vp-de-xuat").Select(a => a.RecordId).ToListAsync();
        if (reqIds.Count > 0 && sf.UploadedBy != Uc.User.Username && await VpTepController.Visible(Db, Uc, "vp-de-xuat", reqIds) is { } vis && vis.Count == 0)
            return Denied("Tệp thuộc đề xuất của người khác.");
        var guideIds = await Db.Attachments.AsNoTracking().Where(a => a.FileId == id && a.Collection == "guides").Select(a => a.RecordId).ToListAsync();
        if (guideIds.Count > 0)
        {
            // Tệp của hướng dẫn sử dụng: chỉ nhóm người dùng được giao hướng dẫn đó mới xem được
            var gs = await Db.Guides.AsNoTracking().Where(g => guideIds.Contains(g.Id)).ToListAsync();
            if (sf.UploadedBy != Uc.User.Username && !gs.Any(Uc.SeesGuide)) return Denied("Hướng dẫn này không dành cho nhóm người dùng của bạn.");
        }
        // Tài khoản bị giới hạn phạm vi chỉ xem được tệp của dự án được giao (hoặc tệp do chính mình tải lên)
        else if (Uc.Scope is not null && sf.UploadedBy != Uc.User.Username)
        {
            var pids = await ProjectScope.ProjectsOfFile(Db, id);
            if (!pids.Any(Uc.InScope)) return Denied("Tệp này thuộc dự án nằm ngoài phạm vi dữ liệu được giao.");
        }
        var full = _store.FullPath(sf);
        if (full is null || !System.IO.File.Exists(full)) return Error(404, "Tệp không còn tồn tại trên máy chủ.");
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Cache-Control"] = "private, max-age=86400";
        var inline = !download && (sf.ContentType.StartsWith("image/") || sf.ContentType.StartsWith("video/") || sf.ContentType == "application/pdf");
        return PhysicalFile(full, sf.ContentType, inline ? null : sf.FileName, enableRangeProcessing: true);
    }
}

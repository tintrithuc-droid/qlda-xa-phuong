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
        // Tài khoản bị giới hạn phạm vi chỉ xem được tệp của dự án được giao (hoặc tệp do chính mình tải lên)
        if (Uc.Scope is not null && sf.UploadedBy != Uc.User.Username)
        {
            var pids = await ProjectScope.ProjectsOfFile(Db, id);
            if (!pids.Any(Uc.InScope)) return Denied("Tệp này thuộc dự án nằm ngoài phạm vi dữ liệu được giao.");
        }
        var full = _store.FullPath(sf);
        if (full is null || !System.IO.File.Exists(full)) return Error(404, "Tệp không còn tồn tại trên máy chủ.");
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Cache-Control"] = "private, max-age=86400";
        var inline = !download && (sf.ContentType.StartsWith("image/") || sf.ContentType == "application/pdf");
        return PhysicalFile(full, sf.ContentType, inline ? null : sf.FileName, enableRangeProcessing: true);
    }
}

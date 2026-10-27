using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Kho tệp đính kèm: tệp mô hình, hồ sơ pháp lý, ảnh hiện trường, chứng từ thanh toán.</summary>
[Authorize, Route("api/files")]
public class FilesController : ApiControllerBase
{
    public const long MaxBytes = 500L * 1024 * 1024;
    private static readonly HashSet<string> Blocked = new(StringComparer.OrdinalIgnoreCase)
        { ".exe", ".dll", ".bat", ".cmd", ".com", ".msi", ".ps1", ".vbs", ".js", ".jse", ".scr", ".hta", ".cpl", ".jar", ".sh", ".html", ".htm", ".svg", ".aspx", ".asp", ".config" };
    private static readonly FileExtensionContentTypeProvider Types = new();
    private readonly string _root;

    public FilesController(AppDbContext db, UserContext uc, IConfiguration cfg, IWebHostEnvironment env) : base(db, uc)
    {
        _root = cfg["Storage:FilesPath"] is { Length: > 0 } p ? p : Path.Combine(env.ContentRootPath, "App_Data", "files");
    }

    [HttpPost, RequestSizeLimit(MaxBytes + 1024 * 1024), RequestFormLimits(MultipartBodyLengthLimit = MaxBytes + 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (file is null || file.Length == 0) return Error(400, "Chưa chọn tệp.");
        if (file.Length > MaxBytes) return Error(413, "Tệp vượt quá 500 MB.");
        var name = Path.GetFileName(file.FileName);
        var ext = Path.GetExtension(name);
        if (Blocked.Contains(ext)) return Error(415, $"Không cho phép tải lên tệp {ext} vì lý do an toàn.");
        var id = "f" + Guid.NewGuid().ToString("N");
        var rel = Path.Combine(DateTime.UtcNow.ToString("yyyy"), DateTime.UtcNow.ToString("MM"), id + ext.ToLowerInvariant());
        var full = Path.Combine(_root, rel);
        Directory.CreateDirectory(Path.GetDirectoryName(full)!);
        await using (var fs = System.IO.File.Create(full)) await file.CopyToAsync(fs);
        var ct = Types.TryGetContentType(name, out var t) ? t : "application/octet-stream";
        var sf = new StoredFile { Id = id, FileName = name.Length > 300 ? name[^300..] : name, ContentType = ct, Size = file.Length, RelPath = rel, UploadedBy = Uc.User.Username, UploadedAt = DateTime.UtcNow };
        Db.Files.Add(sf);
        await Db.SaveChangesAsync();
        return Ok(new { id, url = "/api/files/" + id, sizeBytes = file.Length, contentType = ct, name = sf.FileName });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, [FromQuery] bool download = false)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var sf = await Db.Files.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id);
        if (sf is null) return Error(404, "Tệp không còn tồn tại.");
        var full = Path.GetFullPath(Path.Combine(_root, sf.RelPath));
        if (!full.StartsWith(Path.GetFullPath(_root)) || !System.IO.File.Exists(full)) return Error(404, "Tệp không còn tồn tại trên máy chủ.");
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Cache-Control"] = "private, max-age=86400";
        var inline = !download && (sf.ContentType.StartsWith("image/") || sf.ContentType == "application/pdf");
        return PhysicalFile(full, sf.ContentType, inline ? null : sf.FileName, enableRangeProcessing: true);
    }
}

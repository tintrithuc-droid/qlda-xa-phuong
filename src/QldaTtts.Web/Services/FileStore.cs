using Microsoft.AspNetCore.StaticFiles;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>Kho tệp vật lý trên máy chủ (mặc định App_Data/files, cấu hình Storage:FilesPath).</summary>
public class FileStore
{
    public const long MaxBytes = 500L * 1024 * 1024;
    private static readonly HashSet<string> Blocked = new(StringComparer.OrdinalIgnoreCase)
        { ".exe", ".dll", ".bat", ".cmd", ".com", ".msi", ".ps1", ".vbs", ".js", ".jse", ".scr", ".hta", ".cpl", ".jar", ".sh", ".html", ".htm", ".svg", ".aspx", ".asp", ".config" };
    private static readonly FileExtensionContentTypeProvider Types = new();

    public string Root { get; }

    public FileStore(IConfiguration cfg, IWebHostEnvironment env)
    {
        Root = Path.GetFullPath(cfg["Storage:FilesPath"] is { Length: > 0 } p ? p : Path.Combine(env.ContentRootPath, "App_Data", "files"));
    }

    /// <summary>Trả về thông báo lỗi nếu tệp không được phép tải lên, ngược lại null.</summary>
    public static string? Check(IFormFile? file)
    {
        if (file is null || file.Length == 0) return "Chưa chọn tệp.";
        if (file.Length > MaxBytes) return "Tệp vượt quá 500 MB.";
        var ext = Path.GetExtension(Path.GetFileName(file.FileName));
        if (Blocked.Contains(ext)) return $"Không cho phép tải lên tệp {ext} vì lý do an toàn.";
        return null;
    }

    public async Task<StoredFile> SaveAsync(IFormFile file, string? by)
    {
        var name = Path.GetFileName(file.FileName);
        var ext = Path.GetExtension(name);
        var id = "f" + Guid.NewGuid().ToString("N");
        var rel = Path.Combine(DateTime.UtcNow.ToString("yyyy"), DateTime.UtcNow.ToString("MM"), id + ext.ToLowerInvariant());
        var full = Path.Combine(Root, rel);
        Directory.CreateDirectory(Path.GetDirectoryName(full)!);
        await using (var fs = File.Create(full)) await file.CopyToAsync(fs);
        var ct = Types.TryGetContentType(name, out var t) ? t : "application/octet-stream";
        return new StoredFile { Id = id, FileName = name.Length > 300 ? name[^300..] : name, ContentType = ct, Size = file.Length, RelPath = rel, UploadedBy = by, UploadedAt = DateTime.UtcNow };
    }

    /// <summary>Đường dẫn đầy đủ của tệp, null nếu đường dẫn không hợp lệ.</summary>
    public string? FullPath(StoredFile f)
    {
        var full = Path.GetFullPath(Path.Combine(Root, f.RelPath));
        return full.StartsWith(Root + Path.DirectorySeparatorChar) ? full : null;
    }

    public void DeletePhysical(StoredFile f)
    {
        var full = FullPath(f);
        if (full is not null && File.Exists(full)) File.Delete(full);
    }
}

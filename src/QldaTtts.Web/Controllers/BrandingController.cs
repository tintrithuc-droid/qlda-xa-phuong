using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>
/// Thông tin đơn vị và nhận diện giao diện (logo, tên phần mềm, banner trang đăng nhập, chân trang…),
/// do quản trị hệ thống cập nhật để triển khai cho nhiều đơn vị khác nhau.
/// </summary>
[Route("api/branding")]
public class BrandingController : ApiControllerBase
{
    public const string Key = "branding", LogoKey = "logo";
    public const long LogoMaxBytes = 2 * 1024 * 1024;
    private static readonly HashSet<string> LogoTypes = new(StringComparer.OrdinalIgnoreCase) { ".png", ".jpg", ".jpeg", ".webp", ".gif" };

    /// <summary>Các mục được phép cấu hình và giá trị mặc định (bản dùng chung cho xã/phường).</summary>
    public static readonly (string Key, string Default, int Max)[] Fields =
    {
        ("appName", "Quản lý dự án, nhiệm vụ", 120),
        ("orgShort", "Ban QLDA xã/phường …", 120),
        ("orgName", "Ủy ban nhân dân xã/phường …", 200),
        ("unitName", "Ban Quản lý dự án đầu tư xây dựng", 200),
        ("bannerTitle", "Phần mềm quản lý dự án đầu tư xây dựng", 200),
        ("bannerText", "Theo dõi dự án, gói thầu, hợp đồng, tiến độ, khối lượng và thanh toán trên một hệ thống thống nhất.", 500),
        ("address", "Địa chỉ: …", 300),
        ("footer", "© {năm} Ban Quản lý dự án đầu tư xây dựng xã/phường …", 300),
        ("reportOrg", "Ban QLDA đầu tư xây dựng xã/phường …", 200),
        ("ownerDefault", "UBND xã/phường …", 200),
        ("support", "Hỗ trợ: quản trị hệ thống của đơn vị", 200),
    };

    private readonly FileStore _store;
    public BrandingController(AppDbContext db, UserContext uc, FileStore store) : base(db, uc) { _store = store; }

    public static async Task<Dictionary<string, object?>> Load(AppDbContext db)
    {
        var rows = await db.Settings.AsNoTracking().Where(s => s.Key == Key || s.Key == LogoKey).ToListAsync();
        JsonObject? saved = null;
        try { if (rows.FirstOrDefault(r => r.Key == Key)?.Value is { } v) saved = JsonNode.Parse(v) as JsonObject; } catch (JsonException) { }
        var r = new Dictionary<string, object?>();
        foreach (var (k, d, _) in Fields) r[k] = saved?[k]?.GetValue<string>() is { Length: > 0 } x ? x : d;
        var logo = rows.FirstOrDefault(x => x.Key == LogoKey);
        r["logo"] = logo?.Value is { Length: > 0 } ? "/api/branding/logo?v=" + (logo.UpdatedAt?.Ticks ?? 0) : null;
        return r;
    }

    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> Get() => Ok(await Load(Db));

    [HttpGet("logo"), AllowAnonymous]
    public async Task<IActionResult> Logo()
    {
        var id = (await Db.Settings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == LogoKey))?.Value;
        var sf = id is null ? null : await Db.Files.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id);
        var full = sf is null ? null : _store.FullPath(sf);
        if (full is null || !System.IO.File.Exists(full)) return NotFound();
        Response.Headers["Cache-Control"] = "public, max-age=86400";
        return PhysicalFile(full, sf!.ContentType);
    }

    [HttpPut, Authorize]
    public async Task<IActionResult> Put([FromBody] Dictionary<string, string?> body)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("quan-tri", true)) return Denied();
        var o = new JsonObject();
        foreach (var (k, _, max) in Fields)
            if (body.TryGetValue(k, out var v) && !string.IsNullOrWhiteSpace(v)) o[k] = v.Trim().Length > max ? v.Trim()[..max] : v.Trim();
        await Upsert(Key, o.ToJsonString());
        Uc.Log("Cập nhật", "Quản trị hệ thống", "Thông tin đơn vị, giao diện");
        await Db.SaveChangesAsync();
        return Ok(await Load(Db));
    }

    [HttpPost("logo"), Authorize, RequestSizeLimit(LogoMaxBytes + 64 * 1024)]
    public async Task<IActionResult> UploadLogo(IFormFile file)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("quan-tri", true)) return Denied();
        if (file is null || file.Length == 0) return Error(400, "Chưa chọn tệp.");
        if (file.Length > LogoMaxBytes) return Error(413, "Logo tối đa 2 MB.");
        if (!LogoTypes.Contains(Path.GetExtension(file.FileName))) return Error(415, "Logo phải là ảnh PNG, JPG, WEBP hoặc GIF.");
        var sf = await _store.SaveAsync(file, Uc.User.Username);
        Db.Files.Add(sf);
        await RemoveLogo();
        await Upsert(LogoKey, sf.Id);
        Uc.Log("Cập nhật", "Quản trị hệ thống", "Logo đơn vị: " + sf.FileName);
        await Db.SaveChangesAsync();
        return Ok(await Load(Db));
    }

    [HttpDelete("logo"), Authorize]
    public async Task<IActionResult> DeleteLogo()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("quan-tri", true)) return Denied();
        await RemoveLogo();
        var s = await Db.Settings.FirstOrDefaultAsync(x => x.Key == LogoKey);
        if (s is not null) Db.Settings.Remove(s);
        Uc.Log("Xóa", "Quản trị hệ thống", "Logo đơn vị (dùng lại biểu tượng mặc định)");
        await Db.SaveChangesAsync();
        return Ok(await Load(Db));
    }

    private async Task RemoveLogo()
    {
        var old = (await Db.Settings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == LogoKey))?.Value;
        var sf = old is null ? null : await Db.Files.FirstOrDefaultAsync(f => f.Id == old);
        if (sf is null) return;
        _store.DeletePhysical(sf); Db.Files.Remove(sf);
    }

    private async Task Upsert(string key, string value)
    {
        var s = await Db.Settings.FirstOrDefaultAsync(x => x.Key == key);
        if (s is null) Db.Settings.Add(s = new AppSetting { Key = key });
        s.Value = value; s.UpdatedAt = DateTime.UtcNow; s.UpdatedBy = Uc.User?.Username;
    }
}

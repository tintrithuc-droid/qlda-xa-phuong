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
    public const string Key = "branding", LogoKey = "logo", BgKey = "loginbg";
    public const long LogoMaxBytes = 2 * 1024 * 1024, BgMaxBytes = 5 * 1024 * 1024;
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
        // Trang đăng nhập
        ("loginTitle", "Đăng nhập hệ thống", 120),
        ("loginHint", "Sử dụng tài khoản do quản trị hệ thống cấp.", 300),
        ("forgotText", "Quên mật khẩu: liên hệ quản trị hệ thống để đặt lại.", 300),
        ("bannerDeco", "1", 1),   // 1: họa tiết trống đồng và vạch màu đỏ, vàng; 0: banner trơn
        // Màu chủ đạo mặc định của đơn vị (người dùng chưa tự chọn màu thì dùng màu này)
        ("color", "navy", 20),
        // Phong cách giao diện của đơn vị: gov (hành chính: quốc hiệu, trống đồng), tech (công nghệ: tối giản, hiện đại)
        ("style", "gov", 10),
        // Màu nền thanh menu và banner trang đăng nhập (phong cách Công nghệ): peach (mặc định), blue, night, teal, slate
        ("sideBg", "peach", 12),
        // Mẫu in (báo cáo, phiếu trình, bảng đối soát)
        ("printNation", "1", 1),  // 1: in quốc hiệu, tiêu ngữ; 0: không in
        ("place", "…", 80),       // địa danh trước "ngày … tháng … năm …"
        ("signReport", "THỦ TRƯỞNG ĐƠN VỊ", 120),
        ("signApprove", "LÃNH ĐẠO BAN QUẢN LÝ DỰ ÁN", 120),
        ("signTech", "CÁN BỘ KỸ THUẬT", 120),
        ("signAcc", "KẾ TOÁN", 120),
        // Lĩnh vực dự án của đơn vị: xd (đầu tư xây dựng, mặc định), cntt (CNTT, chuyển đổi số, đổi mới sáng tạo)
        ("field", "xd", 10),
        // Bản 1.10: phân hệ không dùng (ẩn khỏi menu, phân quyền), mã phân hệ cách nhau dấu phẩy; dữ liệu giữ nguyên
        ("hideMods", "", 400),
    };

    /// <summary>Tông màu được phép (trùng danh sách trong hộp thoại Giao diện) và màu nền thanh tiêu đề trình duyệt tương ứng.</summary>
    public static readonly Dictionary<string, string> Colors = new()
    { ["navy"] = "#0d2a57", ["teal"] = "#0a3431", ["indigo"] = "#1e1b4b", ["green"] = "#0f2f1c", ["earth"] = "#2e1608", ["slate"] = "#111827" };
    public static readonly HashSet<string> SideBgs = new() { "peach", "blue", "night", "teal", "slate" };
    private static readonly HashSet<string> Flags = new() { "bannerDeco", "printNation" };

    private readonly FileStore _store;
    public BrandingController(AppDbContext db, UserContext uc, FileStore store) : base(db, uc) { _store = store; }

    public static async Task<Dictionary<string, object?>> Load(AppDbContext db)
    {
        var rows = await db.Settings.AsNoTracking().Where(s => s.Key == Key || s.Key == LogoKey || s.Key == BgKey).ToListAsync();
        JsonObject? saved = null;
        try { if (rows.FirstOrDefault(r => r.Key == Key)?.Value is { } v) saved = JsonNode.Parse(v) as JsonObject; } catch (JsonException) { }
        var r = new Dictionary<string, object?>();
        foreach (var (k, d, _) in Fields) r[k] = saved?[k]?.GetValue<string>() is { Length: > 0 } x ? x : d;
        var logo = rows.FirstOrDefault(x => x.Key == LogoKey);
        r["logo"] = logo?.Value is { Length: > 0 } ? "/api/branding/logo?v=" + (logo.UpdatedAt?.Ticks ?? 0) : null;
        var bg = rows.FirstOrDefault(x => x.Key == BgKey);
        r["loginBg"] = bg?.Value is { Length: > 0 } ? "/api/branding/loginbg?v=" + (bg.UpdatedAt?.Ticks ?? 0) : null;
        if (!Colors.ContainsKey((string)r["color"]!)) r["color"] = "navy";
        foreach (var f in Flags) if ((string)r[f]! != "0") r[f] = "1";
        if ((string)r["field"]! != "cntt") r["field"] = "xd";
        if ((string)r["style"]! != "tech") r["style"] = "gov";
        if (!SideBgs.Contains((string)r["sideBg"]!)) r["sideBg"] = "peach";
        return r;
    }

    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> Get() => Ok(await Load(Db));

    [HttpGet("logo"), AllowAnonymous]
    public Task<IActionResult> Logo() => Image(LogoKey);

    [HttpGet("loginbg"), AllowAnonymous]
    public Task<IActionResult> LoginBg() => Image(BgKey);

    /// <summary>Tệp kê khai ứng dụng (cài lên màn hình điện thoại): tên, màu và biểu tượng theo đơn vị.</summary>
    [HttpGet("manifest.webmanifest"), AllowAnonymous]
    public async Task<IActionResult> Manifest()
    {
        var b = await Load(Db);
        var icons = new List<object>();
        if (b["logo"] is string lg) icons.Add(new { src = lg, sizes = "any", purpose = "any" });
        icons.Add(new { src = "/icons/icon-192.png", sizes = "192x192", type = "image/png" });
        icons.Add(new { src = "/icons/icon-512.png", sizes = "512x512", type = "image/png", purpose = "any maskable" });
        icons.Add(new { src = "/icons/icon.svg", sizes = "any", type = "image/svg+xml" });
        var app = (string)b["appName"]!; var org = (string)b["orgShort"]!;
        var m = new
        {
            name = app + " – " + org, short_name = org.Length <= 24 ? org : app.Length <= 24 ? app : org[..24],
            description = app + " – " + b["unitName"], lang = "vi", start_url = "/#hien-truong", scope = "/", display = "standalone",
            background_color = "#f5f6f8", theme_color = Colors[(string)b["color"]!], icons
        };
        Response.Headers["Cache-Control"] = "no-cache";
        return new JsonResult(m) { ContentType = "application/manifest+json; charset=utf-8" };
    }

    private async Task<IActionResult> Image(string key)
    {
        var id = (await Db.Settings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == key))?.Value;
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
            if (body.TryGetValue(k, out var v) && !string.IsNullOrWhiteSpace(v))
            {
                v = v.Trim(); if (v.Length > max) v = v[..max];
                if (Flags.Contains(k) && v != "0" && v != "1") continue;
                if (k == "color" && !Colors.ContainsKey(v)) continue;
                if (k == "style" && v != "gov" && v != "tech") continue;
                if (k == "sideBg" && !SideBgs.Contains(v)) continue;
                o[k] = v;
            }
        await Upsert(Key, o.ToJsonString());
        Uc.Log("Cập nhật", "Quản trị hệ thống", "Thông tin đơn vị, giao diện");
        await Db.SaveChangesAsync();
        return Ok(await Load(Db));
    }

    [HttpPost("logo"), Authorize, RequestSizeLimit(LogoMaxBytes + 64 * 1024)]
    public Task<IActionResult> UploadLogo(IFormFile file) => Upload(LogoKey, file, LogoMaxBytes, "Logo đơn vị");

    [HttpPost("loginbg"), Authorize, RequestSizeLimit(BgMaxBytes + 64 * 1024)]
    public Task<IActionResult> UploadBg(IFormFile file) => Upload(BgKey, file, BgMaxBytes, "Ảnh nền trang đăng nhập");

    [HttpDelete("logo"), Authorize]
    public Task<IActionResult> DeleteLogo() => Delete(LogoKey, "Logo đơn vị (dùng lại biểu tượng mặc định)");

    [HttpDelete("loginbg"), Authorize]
    public Task<IActionResult> DeleteBg() => Delete(BgKey, "Ảnh nền trang đăng nhập (dùng lại nền màu)");

    private async Task<IActionResult> Upload(string key, IFormFile file, long maxBytes, string what)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("quan-tri", true)) return Denied();
        if (file is null || file.Length == 0) return Error(400, "Chưa chọn tệp.");
        if (file.Length > maxBytes) return Error(413, $"{what} tối đa {maxBytes / 1024 / 1024} MB.");
        if (!LogoTypes.Contains(Path.GetExtension(file.FileName))) return Error(415, $"{what} phải là ảnh PNG, JPG, WEBP hoặc GIF.");
        var sf = await _store.SaveAsync(file, Uc.User.Username);
        Db.Files.Add(sf);
        await RemoveFile(key);
        await Upsert(key, sf.Id);
        Uc.Log("Cập nhật", "Quản trị hệ thống", what + ": " + sf.FileName);
        await Db.SaveChangesAsync();
        return Ok(await Load(Db));
    }

    private async Task<IActionResult> Delete(string key, string what)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("quan-tri", true)) return Denied();
        await RemoveFile(key);
        var s = await Db.Settings.FirstOrDefaultAsync(x => x.Key == key);
        if (s is not null) Db.Settings.Remove(s);
        Uc.Log("Xóa", "Quản trị hệ thống", what);
        await Db.SaveChangesAsync();
        return Ok(await Load(Db));
    }

    private async Task RemoveFile(string key)
    {
        var old = (await Db.Settings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == key))?.Value;
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

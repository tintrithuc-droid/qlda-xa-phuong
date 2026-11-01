using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Sao lưu / phục hồi dữ liệu (chỉ quản trị hệ thống): tệp JSON, bản sao lưu tự động hằng đêm, bản .zip đầy đủ kèm tệp đính kèm.</summary>
[Authorize, Route("api/backup")]
public class BackupController : ApiControllerBase
{
    private readonly BackupService _bk;
    public BackupController(AppDbContext db, UserContext uc, BackupService bk) : base(db, uc) { _bk = bk; }

    private record UserBackup(AppUser User, string PasswordHash);

    [HttpGet]
    public async Task<IActionResult> Export()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được sao lưu dữ liệu.");
        Uc.Log("Sao lưu dữ liệu", "Hệ thống", "Toàn bộ dữ liệu");
        await Db.SaveChangesAsync();
        var bytes = await BackupService.ExportJson(Db);
        return File(bytes, "application/json", $"SaoLuu_QLDA_{DateTime.Now:yyyy-MM-dd_HHmm}.json");
    }

    /// <summary>Ghi đè/thêm các bản ghi trong tệp sao lưu (không xóa bản ghi đang có).</summary>
    [HttpPost, RequestSizeLimit(200L * 1024 * 1024)]
    public async Task<IActionResult> Restore([FromBody] JsonElement body)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được phục hồi dữ liệu.");
        if (!body.TryGetProperty("app", out var app) || app.GetString() != "qlda-ttts" || !body.TryGetProperty("data", out var data))
            return Error(400, "Tệp không đúng định dạng sao lưu của phần mềm.");
        var n = 0;
        try
        {
            foreach (var def in Collections.All)
            {
                if (!data.TryGetProperty(def.Name, out var arr) || arr.ValueKind != JsonValueKind.Array) continue;
                foreach (var el in arr.EnumerateArray())
                {
                    var o = (EntityBase)JsonSerializer.Deserialize(el.GetRawText(), def.Type, JsonConfig.Options)!;
                    if (!ValidId(o.Id)) continue;
                    var ex = await Db.FindAsync(def.Type, o.Id);
                    if (ex is null) Db.Add(o); else Db.Entry(ex).CurrentValues.SetValues(o);
                    n++;
                }
            }
            var pw = body.TryGetProperty("passwords", out var p) && p.ValueKind == JsonValueKind.Object ? p : default;
            if (data.TryGetProperty("users", out var ua) && ua.ValueKind == JsonValueKind.Array)
                foreach (var el in ua.EnumerateArray())
                {
                    var u = el.Deserialize<AppUser>(JsonConfig.Options)!;
                    if (!ValidId(u.Id) || u.Id == Uc.User.Id) continue;
                    var hash = pw.ValueKind == JsonValueKind.Object && pw.TryGetProperty(u.Id, out var h) ? h.GetString() ?? "" : "";
                    var ex = await Db.Users.FirstOrDefaultAsync(x => x.Id == u.Id);
                    if (ex is null)
                    {
                        if (await Db.Users.AnyAsync(x => x.Username == u.Username)) continue;
                        u.PasswordHash = hash; Db.Users.Add(u);
                    }
                    else
                    {
                        var (keep, totp, step, rc) = (ex.PasswordHash, ex.TotpSecret, ex.TotpLastStep, ex.RecoveryCodes);
                        Db.Entry(ex).CurrentValues.SetValues(u);
                        ex.PasswordHash = hash.Length > 0 ? hash : keep;
                        // Giữ nguyên xác thực 2 lớp đang có (không nằm trong tệp sao lưu)
                        (ex.TotpSecret, ex.TotpLastStep, ex.RecoveryCodes) = (totp, step, rc);
                    }
                    n++;
                }
            if (data.TryGetProperty("files", out var fa) && fa.ValueKind == JsonValueKind.Array)
                foreach (var el in fa.EnumerateArray())
                {
                    var f = el.Deserialize<StoredFile>(JsonConfig.Options)!;
                    if (!ValidId(f.Id) || f.RelPath.Contains("..")) continue;
                    if (await Db.Files.AnyAsync(x => x.Id == f.Id)) continue;
                    Db.Files.Add(f);
                }
            if (data.TryGetProperty("attachments", out var aa) && aa.ValueKind == JsonValueKind.Array)
                foreach (var el in aa.EnumerateArray())
                {
                    var a = el.Deserialize<Attachment>(JsonConfig.Options)!;
                    if (!ValidId(a.Id)) continue;
                    var ex = await Db.Attachments.FirstOrDefaultAsync(x => x.Id == a.Id);
                    if (ex is null) Db.Attachments.Add(a); else Db.Entry(ex).CurrentValues.SetValues(a);
                    n++;
                }
        }
        catch (JsonException ex) { return Error(400, "Tệp sao lưu bị lỗi: " + ex.Message); }
        // Nhóm quản trị hệ thống luôn giữ toàn quyền, kể cả khi tệp sao lưu ghi khác
        if (await Db.Groups.FindAsync("g-admin") is { } ga) ga.Admin = true;
        Uc.Log("Phục hồi dữ liệu", "Hệ thống", n + " bản ghi");
        await Db.SaveChangesAsync();
        return Ok(new { restored = n });
    }

    /// <summary>Danh sách bản sao lưu tự động trên máy chủ và cấu hình.</summary>
    [HttpGet("auto")]
    public async Task<IActionResult> AutoList()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied();
        return Ok(new { enabled = _bk.Enabled, hour = _bk.Hour, keep = _bk.Keep, dir = _bk.Dir, items = _bk.List() });
    }

    [HttpPost("auto")]
    public async Task<IActionResult> AutoRun()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied();
        var (name, copied) = await _bk.RunAsync(Db);
        Uc.Log("Sao lưu lên máy chủ", "Hệ thống", $"{name}; chép thêm {copied} tệp");
        await Db.SaveChangesAsync();
        return Ok(new { name, copied });
    }

    [HttpGet("auto/{name}")]
    public async Task<IActionResult> AutoDownload(string name)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied();
        var p = _bk.PathOf(name);
        if (p is null) return Error(404, "Không tìm thấy bản sao lưu.");
        return PhysicalFile(p, "application/json", name);
    }

    /// <summary>Tải bản sao lưu đầy đủ: dữ liệu + toàn bộ tệp đính kèm (.zip).</summary>
    [HttpGet("full")]
    public async Task<IActionResult> Full()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được sao lưu dữ liệu.");
        Uc.Log("Sao lưu đầy đủ (dữ liệu + tệp)", "Hệ thống", "Tải về .zip");
        await Db.SaveChangesAsync();
        var fs = await _bk.FullZipAsync(Db);
        return File(fs, "application/zip", $"SaoLuuDayDu_QLDA_{DateTime.Now:yyyy-MM-dd_HHmm}.zip");
    }
}

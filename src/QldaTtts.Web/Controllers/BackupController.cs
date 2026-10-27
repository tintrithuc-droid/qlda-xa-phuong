using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Sao lưu / phục hồi toàn bộ dữ liệu nghiệp vụ dạng JSON (chỉ quản trị hệ thống). Tệp đính kèm sao lưu riêng theo thư mục App_Data/files.</summary>
[Authorize, Route("api/backup")]
public class BackupController : ApiControllerBase
{
    public BackupController(AppDbContext db, UserContext uc) : base(db, uc) { }

    private record UserBackup(AppUser User, string PasswordHash);

    [HttpGet]
    public async Task<IActionResult> Export()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được sao lưu dữ liệu.");
        var data = new Dictionary<string, object>();
        foreach (var def in Collections.All) data[def.Name] = await def.Query(Db).AsNoTracking().Cast<object>().ToListAsync();
        var users = await Db.Users.AsNoTracking().ToListAsync();
        data["users"] = users;
        data["files"] = await Db.Files.AsNoTracking().ToListAsync();
        var payload = new { app = "qlda-ttts", version = 2, exportedAt = DateTime.UtcNow, data, passwords = users.ToDictionary(u => u.Id, u => u.PasswordHash) };
        Uc.Log("Sao lưu dữ liệu", "Hệ thống", "Toàn bộ dữ liệu");
        await Db.SaveChangesAsync();
        var bytes = JsonSerializer.SerializeToUtf8Bytes(payload, JsonConfig.Options);
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
                        var keep = ex.PasswordHash;
                        Db.Entry(ex).CurrentValues.SetValues(u);
                        ex.PasswordHash = hash.Length > 0 ? hash : keep;
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
        }
        catch (JsonException ex) { return Error(400, "Tệp sao lưu bị lỗi: " + ex.Message); }
        // Nhóm quản trị hệ thống luôn giữ toàn quyền, kể cả khi tệp sao lưu ghi khác
        if (await Db.Groups.FindAsync("g-admin") is { } ga) ga.Admin = true;
        Uc.Log("Phục hồi dữ liệu", "Hệ thống", n + " bản ghi");
        await Db.SaveChangesAsync();
        return Ok(new { restored = n });
    }
}

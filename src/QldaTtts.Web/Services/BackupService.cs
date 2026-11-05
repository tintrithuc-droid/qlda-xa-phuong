using System.IO.Compression;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Controllers;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Sao lưu: tệp dữ liệu JSON (mọi bảng nghiệp vụ, người dùng, danh sách tệp, tệp đính kèm) và bản sao kho tệp.
/// Sao lưu tự động hằng đêm ghi vào Storage:BackupPath (mặc định App_Data/backups), giữ Backup:Keep bản gần nhất.
/// </summary>
public class BackupService
{
    private readonly FileStore _store;
    private readonly IConfiguration _cfg;
    public string Dir { get; }
    public int Keep => Math.Max(1, _cfg.GetValue("Backup:Keep", 14));
    public int Hour => Math.Clamp(_cfg.GetValue("Backup:Hour", 1), 0, 23);
    public bool Enabled => _cfg.GetValue("Backup:Enabled", true);

    public BackupService(FileStore store, IConfiguration cfg, TenantContext tc)
    {
        _store = store; _cfg = cfg;
        Dir = Path.GetFullPath(tc.BackupPath);
    }

    public static async Task<byte[]> ExportJson(AppDbContext db)
    {
        var data = new Dictionary<string, object>();
        foreach (var def in Collections.All) data[def.Name] = await def.Query(db).AsNoTracking().Cast<object>().ToListAsync();
        var users = await db.Users.AsNoTracking().ToListAsync();
        data["users"] = users;
        data["files"] = await db.Files.AsNoTracking().ToListAsync();
        data["attachments"] = await db.Attachments.AsNoTracking().ToListAsync();
        data["settings"] = await db.Settings.AsNoTracking().ToListAsync();
        var payload = new { app = "qlda-ttts", version = 3, exportedAt = DateTime.UtcNow, data, passwords = users.ToDictionary(u => u.Id, u => u.PasswordHash) };
        return JsonSerializer.SerializeToUtf8Bytes(payload, JsonConfig.Options);
    }

    public record BackupInfo(string Name, long Size, DateTime CreatedAt);

    public List<BackupInfo> List()
    {
        if (!Directory.Exists(Dir)) return new();
        return new DirectoryInfo(Dir).GetFiles("SaoLuu_QLDA_*.json").OrderByDescending(f => f.LastWriteTimeUtc)
            .Select(f => new BackupInfo(f.Name, f.Length, f.LastWriteTimeUtc)).ToList();
    }

    public string? PathOf(string name)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(name, @"^SaoLuu_QLDA_[0-9_-]+\.json$")) return null;
        var p = Path.Combine(Dir, name);
        return File.Exists(p) ? p : null;
    }

    /// <summary>Ghi một bản sao lưu dữ liệu và đồng bộ bản sao kho tệp (chỉ chép tệp mới). Trả về tên tệp và số tệp mới chép.</summary>
    public async Task<(string name, int copied)> RunAsync(AppDbContext db, CancellationToken ct = default)
    {
        Directory.CreateDirectory(Dir);
        var name = $"SaoLuu_QLDA_{DateTime.Now:yyyy-MM-dd_HHmm}.json";
        await File.WriteAllBytesAsync(Path.Combine(Dir, name), await ExportJson(db), ct);
        var copied = 0;
        var mirror = Path.Combine(Dir, "files");
        foreach (var f in await db.Files.AsNoTracking().ToListAsync(ct))
        {
            var src = _store.FullPath(f); if (src is null || !File.Exists(src)) continue;
            var dst = Path.GetFullPath(Path.Combine(mirror, f.RelPath));
            if (!dst.StartsWith(mirror + Path.DirectorySeparatorChar) || File.Exists(dst)) continue;
            Directory.CreateDirectory(Path.GetDirectoryName(dst)!);
            File.Copy(src, dst); copied++;
        }
        foreach (var old in List().Skip(Keep)) File.Delete(Path.Combine(Dir, old.Name));
        return (name, copied);
    }

    /// <summary>Tạo tệp .zip đầy đủ (dữ liệu + toàn bộ tệp đính kèm) vào tệp tạm; tệp tạm tự xóa khi đóng luồng.</summary>
    public async Task<FileStream> FullZipAsync(AppDbContext db)
    {
        var tmp = Path.Combine(Path.GetTempPath(), "qlda-" + Guid.NewGuid().ToString("N") + ".zip");
        await using (var fs = File.Create(tmp))
        using (var zip = new ZipArchive(fs, ZipArchiveMode.Create))
        {
            var e = zip.CreateEntry("du-lieu.json", CompressionLevel.Optimal);
            await using (var s = e.Open()) await s.WriteAsync(await ExportJson(db));
            foreach (var f in await db.Files.AsNoTracking().ToListAsync())
            {
                var src = _store.FullPath(f); if (src is null || !File.Exists(src)) continue;
                zip.CreateEntryFromFile(src, "files/" + f.RelPath.Replace('\\', '/'), CompressionLevel.Fastest);
            }
        }
        return new FileStream(tmp, FileMode.Open, FileAccess.Read, FileShare.None, 81920, FileOptions.DeleteOnClose | FileOptions.Asynchronous);
    }
}

/// <summary>Tác vụ nền: sao lưu tự động hằng đêm và dọn thùng rác tệp đính kèm quá 30 ngày.</summary>
public class MaintenanceService : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<MaintenanceService> _log;
    public MaintenanceService(IServiceProvider sp, ILogger<MaintenanceService> log) { _sp = sp; _log = log; }

    protected override async Task ExecuteAsync(CancellationToken stop)
    {
        await Task.Delay(TimeSpan.FromSeconds(30), stop).ContinueWith(_ => { });
        while (!stop.IsCancellationRequested)
        {
            try
            {
                var tenancy = _sp.GetRequiredService<TenancyOptions>();
                if (!tenancy.Enabled) { using var scope = _sp.CreateScope(); await Tick(scope, stop); }
                else
                {
                    // Chế độ cho thuê: lần lượt từng xã đang hoạt động; lỗi ở một xã không chặn các xã khác
                    var reg = _sp.GetRequiredService<TenantRegistry>(); var ops = _sp.GetRequiredService<TenantOps>();
                    foreach (var t in await reg.All())
                    {
                        if (stop.IsCancellationRequested) break;
                        if (t.Status != TenantStatus.Active || reg.StateOf(t.Code).state != TenantRegistry.State.Ready) continue;
                        try { using var scope = ops.ScopeFor(t); await Tick(scope, stop); }
                        catch (Exception ex) when (ex is not OperationCanceledException) { _log.LogError(ex, "Lỗi tác vụ sao lưu / dọn thùng rác của xã {Code}", t.Code); }
                    }
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException) { _log.LogError(ex, "Lỗi tác vụ sao lưu / dọn thùng rác"); }
            await Task.Delay(TimeSpan.FromMinutes(15), stop).ContinueWith(_ => { });
        }
    }

    private async Task Tick(IServiceScope scope, CancellationToken ct)
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var backup = scope.ServiceProvider.GetRequiredService<BackupService>();
        var store = scope.ServiceProvider.GetRequiredService<FileStore>();
        if (!await db.Users.AnyAsync(ct)) return; // hệ thống chưa khởi tạo

        // Dọn thùng rác quá hạn
        var cutoff = DateTime.UtcNow.AddDays(-AttachmentsController.TrashDays);
        var expired = await db.Attachments.Where(a => a.DeletedAt != null && a.DeletedAt < cutoff).ToListAsync(ct);
        if (expired.Count > 0)
        {
            await AttachmentsController.PurgeAsync(db, store, expired);
            Log(db, "Tự động xóa tệp quá hạn trong thùng rác", $"{expired.Count} tệp");
            await db.SaveChangesAsync(ct);
        }

        // Sao lưu hằng đêm (một lần mỗi ngày, từ giờ cấu hình trở đi)
        var now = DateTime.Now;
        if (backup.Enabled && now.Hour >= backup.Hour && !backup.List().Any(b => b.CreatedAt.ToLocalTime().Date == now.Date))
        {
            var (name, copied) = await backup.RunAsync(db, ct);
            Log(db, "Sao lưu tự động", $"{name}; chép thêm {copied} tệp");
            await db.SaveChangesAsync(ct);
            _log.LogInformation("Đã sao lưu tự động {Name}", name);
        }
    }

    private static void Log(AppDbContext db, string action, string target) =>
        db.Logs.Add(new AuditLog { Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = DateTime.UtcNow, Username = "he-thong", Fullname = "Hệ thống", Action = action, Module = "Hệ thống", Target = target });
}

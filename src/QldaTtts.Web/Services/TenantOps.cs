using System.Security.Cryptography;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using QldaTtts.Web.Controllers;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>Tạo mới, nâng cấp cơ sở dữ liệu của từng xã (chế độ cho thuê).</summary>
public class TenantOps
{
    public static string AppVersion => typeof(TenantOps).Assembly.GetName().Version?.ToString(3) ?? "?";
    private readonly IServiceProvider _root;
    private readonly TenantRegistry _reg;
    private readonly IDbContextFactory<PlatformDbContext> _pf;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<TenantOps> _log;
    private readonly SemaphoreSlim _one = new(1, 1);

    public TenantOps(IServiceProvider root, TenantRegistry reg, IDbContextFactory<PlatformDbContext> pf, IWebHostEnvironment env, ILogger<TenantOps> log)
    { _root = root; _reg = reg; _pf = pf; _env = env; _log = log; }

    /// <summary>Tạo một phạm vi dịch vụ gắn với xã (dùng cho tác vụ nền, nâng cấp).</summary>
    public IServiceScope ScopeFor(Tenant t)
    {
        var scope = _root.CreateScope();
        scope.ServiceProvider.GetRequiredService<TenantContext>().Use(t);
        return scope;
    }

    /// <summary>Cập nhật cấu trúc CSDL, dữ liệu nâng cấp, tài liệu HDSD cho một xã. Lỗi ở xã này không ảnh hưởng xã khác.</summary>
    public async Task<bool> UpgradeAsync(Tenant t, CancellationToken ct = default)
    {
        _reg.SetState(t.Code, TenantRegistry.State.Upgrading);
        string? error = null;
        try
        {
            using var scope = ScopeFor(t);
            var tc = scope.ServiceProvider.GetRequiredService<TenantContext>();
            Directory.CreateDirectory(tc.FilesPath); Directory.CreateDirectory(tc.BackupPath);
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.MigrateAsync(ct);
            Upgrades.Run(db);
            GuideSeed.Run(db, scope.ServiceProvider.GetRequiredService<FileStore>(), Path.Combine(_env.ContentRootPath, "hdsd"));
            _reg.SetState(t.Code, TenantRegistry.State.Ready);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            error = ex.GetBaseException().Message;
            _log.LogError(ex, "Nâng cấp CSDL xã {Code} lỗi", t.Code);
            _reg.SetState(t.Code, TenantRegistry.State.Failed, error);
        }
        await using var pdb = await _pf.CreateDbContextAsync(ct);
        var row = await pdb.Tenants.FirstOrDefaultAsync(x => x.Code == t.Code, ct);
        if (row is not null)
        {
            row.LastError = error;
            if (error is null) row.AppVersion = AppVersion;
            pdb.Logs.Add(new PlatformLog { Ts = DateTime.UtcNow, Username = "he-thong", Action = error is null ? "Nâng cấp CSDL xã" : "Nâng cấp CSDL xã bị lỗi", Target = $"{t.Code} → {AppVersion}" + (error is null ? "" : ": " + Trim(error, 400)) });
            await pdb.SaveChangesAsync(ct);
        }
        return error is null;
    }

    /// <summary>Nâng cấp lần lượt mọi xã (khi khởi động phần mềm sau khi thay bản mới).</summary>
    public async Task UpgradeAllAsync(CancellationToken ct)
    {
        await _reg.ReloadAsync(ct);
        foreach (var t in await _reg.All())
        {
            if (ct.IsCancellationRequested) break;
            if (t.Status == TenantStatus.Creating) continue;
            await UpgradeAsync(t, ct);
        }
    }

    public record Created(Tenant Tenant, string SetupToken);

    /// <summary>
    /// Cấp một xã mới: tạo tài khoản và cơ sở dữ liệu PostgreSQL riêng (chỉ tài khoản đó vào được), thư mục tệp riêng,
    /// cấu trúc dữ liệu, tên đơn vị trên giao diện, mã khởi tạo dùng một lần.
    /// </summary>
    public async Task<Created> CreateAsync(Tenant input, string by, CancellationToken ct = default)
    {
        await _one.WaitAsync(ct);
        try
        {
            await using var pdb = await _pf.CreateDbContextAsync(ct);
            if (await pdb.Tenants.AnyAsync(x => x.Code == input.Code, ct)) throw new InvalidOperationException($"Mã xã '{input.Code}' đã có.");
            var ident = "qlda_x_" + input.Code.Replace('-', '_');
            var password = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
            await using (var c = new NpgsqlConnection(_reg.AdminConnection()))
            {
                await c.OpenAsync(ct);
                async Task<bool> Exists(string sql) { await using var cmd = new NpgsqlCommand(sql, c); cmd.Parameters.AddWithValue("n", ident); return await cmd.ExecuteScalarAsync(ct) is not null; }
                async Task Exec(string sql) { await using var cmd = new NpgsqlCommand(sql, c); await cmd.ExecuteNonQueryAsync(ct); }
                if (await Exists("select 1 from pg_database where datname=@n")) throw new InvalidOperationException($"Cơ sở dữ liệu {ident} đã tồn tại trên máy chủ (có thể của xã đã xóa trước đây). Kiểm tra lại trước khi tạo.");
                // ident và password chỉ gồm a-z, 0-9, gạch dưới: an toàn khi ghép vào câu lệnh
                if (await Exists("select 1 from pg_roles where rolname=@n")) await Exec($"ALTER ROLE \"{ident}\" LOGIN PASSWORD '{password}'");
                else await Exec($"CREATE ROLE \"{ident}\" LOGIN PASSWORD '{password}' NOSUPERUSER NOCREATEDB NOCREATEROLE");
                await Exec($"GRANT \"{ident}\" TO CURRENT_USER");
                await Exec($"CREATE DATABASE \"{ident}\" OWNER \"{ident}\" ENCODING 'UTF8' TEMPLATE template0");
                await Exec($"REVOKE ALL ON DATABASE \"{ident}\" FROM PUBLIC");
            }
            var token = SetupGuard.NewToken();
            var t = new Tenant
            {
                Code = input.Code, Name = input.Name, Hosts = input.Hosts, ExpiresAt = input.ExpiresAt, Contact = input.Contact, Note = input.Note,
                Status = TenantStatus.Creating, DbName = ident, DbUser = ident, DbSecret = _reg.Protect(password),
                SetupTokenHash = SetupGuard.Hash(token), SetupTokenExpires = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow, UpdatedBy = by
            };
            pdb.Tenants.Add(t);
            await pdb.SaveChangesAsync(ct);

            if (!await UpgradeAsync(t, ct)) throw new InvalidOperationException("Đã tạo cơ sở dữ liệu nhưng khởi tạo cấu trúc bị lỗi: " + _reg.StateOf(t.Code).error);
            using (var scope = ScopeFor(t))
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                SeedBranding(db, t.Name, by);
                await db.SaveChangesAsync(ct);
            }
            t.Status = TenantStatus.Active;
            pdb.Logs.Add(new PlatformLog { Ts = DateTime.UtcNow, Username = by, Action = "Tạo xã mới", Target = $"{t.Code} – {t.Name}" });
            await pdb.SaveChangesAsync(ct);
            _reg.Invalidate();
            return new Created(t, token);
        }
        finally { _one.Release(); }
    }

    /// <summary>Điền sẵn tên đơn vị trên giao diện, báo cáo theo tên xã (quản trị xã sửa lại được trong phân hệ Giao diện).</summary>
    private static void SeedBranding(AppDbContext db, string name, string by)
    {
        // name ví dụ "xã Tân Hòa" / "phường An Lạc"
        var n = name.Trim();
        var cap = n.Length > 0 ? char.ToUpper(n[0]) + n[1..] : n;
        var o = new JsonObject
        {
            ["orgShort"] = "Ban QLDA " + n,
            ["orgName"] = "Ủy ban nhân dân " + n,
            ["footer"] = "© {năm} Ban Quản lý dự án đầu tư xây dựng " + n,
            ["reportOrg"] = "Ban QLDA đầu tư xây dựng " + n,
            ["ownerDefault"] = "UBND " + n,
            ["address"] = cap,
        };
        var s = db.Settings.FirstOrDefault(x => x.Key == BrandingController.Key);
        if (s is null) db.Settings.Add(s = new AppSetting { Key = BrandingController.Key });
        s.Value = o.ToJsonString(); s.UpdatedAt = DateTime.UtcNow; s.UpdatedBy = by;
    }

    private static string Trim(string s, int n) => s.Length > n ? s[..n] : s;
}

/// <summary>Khi khởi động: nâng cấp CSDL lần lượt từng xã; xã chưa xong thì người dùng thấy thông báo "đang nâng cấp".</summary>
public class TenantStartup : BackgroundService
{
    private readonly TenantOps _ops;
    public TenantStartup(TenantOps ops) { _ops = ops; }
    protected override Task ExecuteAsync(CancellationToken stop) => _ops.UpgradeAllAsync(stop);
}

/// <summary>Nhận diện xã theo tên miền của lượt truy cập; chặn xã tạm khóa/hết hạn; tách trang quản lý thuê bao.</summary>
public class TenantMiddleware
{
    private readonly RequestDelegate _next;
    public TenantMiddleware(RequestDelegate next) { _next = next; }

    public async Task Invoke(HttpContext c, TenantRegistry reg, TenancyOptions opt, TenantContext tc)
    {
        var path = c.Request.Path;
        // Cổng vào (Caddy) hỏi trước khi xin chứng chỉ HTTPS cho một tên miền: chỉ cấp cho tên miền đã đăng ký
        if (path == "/api/tls-ask")
        {
            var d = c.Request.Query["domain"].ToString();
            c.Response.StatusCode = d.Length > 0 && await reg.KnownHost(d) ? 200 : 404;
            return;
        }
        var host = c.Request.Host.Host.ToLowerInvariant();
        if (host == opt.Portal)
        {
            tc.Portal = true;
            if (path == "/" || path == "/index.html") c.Request.Path = "/nentang.html";
            else if (path.StartsWithSegments("/api") && !path.StartsWithSegments("/api/portal") && path != "/api/health")
            { await Json(c, 404, "Không tìm thấy."); return; }
            await _next(c);
            return;
        }
        if (path.StartsWithSegments("/api/portal") || path == "/nentang.html" || path.StartsWithSegments("/js/nentang.js"))
        { c.Response.StatusCode = 404; return; }

        var t = await reg.FindByHost(host);
        if (t is null) { await Page(c, 404, "Không tìm thấy đơn vị", "Địa chỉ này chưa được đăng ký sử dụng phần mềm. Vui lòng kiểm tra lại đường dẫn."); return; }
        if (t.Status == TenantStatus.Locked)
        { await Page(c, 403, "Tạm ngừng phục vụ", (t.LockReason is { Length: > 0 } r ? r + " " : "") + "Vui lòng liên hệ đơn vị cung cấp dịch vụ."); return; }
        if (t.Expired(DateTime.Now))
        { await Page(c, 403, "Hết hạn sử dụng dịch vụ", $"Thời hạn sử dụng đã hết ngày {t.ExpiresAt:dd/MM/yyyy}. Dữ liệu của đơn vị vẫn được lưu giữ nguyên vẹn; vui lòng liên hệ đơn vị cung cấp dịch vụ để gia hạn."); return; }
        var (state, _) = reg.StateOf(t.Code);
        if (state != TenantRegistry.State.Ready)
        {
            c.Response.Headers.RetryAfter = "30";
            await Page(c, 503, "Đang nâng cấp phần mềm", "Hệ thống đang cập nhật phiên bản mới cho đơn vị, vui lòng quay lại sau ít phút.");
            return;
        }
        tc.Use(t);
        await _next(c);
    }

    private static async Task Json(HttpContext c, int status, string msg)
    {
        c.Response.StatusCode = status; c.Response.ContentType = "application/json; charset=utf-8";
        await c.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new { code = status, message = msg }));
    }

    private static async Task Page(HttpContext c, int status, string title, string text)
    {
        if (c.Request.Path.StartsWithSegments("/api")) { await Json(c, status, title + ". " + text); return; }
        c.Response.StatusCode = status; c.Response.ContentType = "text/html; charset=utf-8";
        Func<string, string> e = s => System.Net.WebUtility.HtmlEncode(s);
        await c.Response.WriteAsync($@"<!doctype html><html lang=""vi""><head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1"">
<title>{e(title)}</title><style>body{{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,'Segoe UI',Roboto,Arial,sans-serif;background:#eef3f9;color:#16263d}}
.c{{max-width:480px;margin:16px;background:#fff;border-radius:14px;padding:32px;box-shadow:0 8px 30px rgba(13,42,87,.12);border-top:5px solid #0d4f8a}}h1{{font-size:22px;margin:0 0 12px;color:#0d2a57}}p{{line-height:1.6;margin:0;color:#3b4b61}}</style></head>
<body><div class=""c""><h1>{e(title)}</h1><p>{e(text)}</p></div></body></html>");
    }
}

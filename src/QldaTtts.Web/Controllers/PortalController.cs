using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>
/// Trang quản lý thuê bao (chế độ cho thuê): đăng nhập quản trị nền tảng (mật khẩu + xác thực 2 lớp bắt buộc),
/// tạo xã, sửa thông tin, gia hạn, tạm khóa/mở, cấp lại mã khởi tạo, thống kê sử dụng. Không đọc dữ liệu nghiệp vụ của xã.
/// </summary>
[ApiController, Route("api/portal")]
public class PortalController : ControllerBase
{
    private const string Tn = "__nentang";
    private const int MaxFailed = 5;
    private readonly IDbContextFactory<PlatformDbContext> _pf;
    private readonly TenantRegistry _reg;
    private readonly TenantOps _ops;
    private readonly TenancyOptions _opt;
    private readonly TenantContext _tc;
    private readonly IDataProtector _enroll, _secret;

    public PortalController(IDbContextFactory<PlatformDbContext> pf, TenantRegistry reg, TenantOps ops, TenancyOptions opt, TenantContext tc, IDataProtectionProvider dp)
    {
        _pf = pf; _reg = reg; _ops = ops; _opt = opt; _tc = tc;
        _enroll = dp.CreateProtector("QldaTtts.Portal.Enroll");
        _secret = dp.CreateProtector("QldaTtts.Portal.Totp");
    }

    private ObjectResult Error(int status, string message) => StatusCode(status, new { code = status, message });
    private string Ip => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";

    private async Task<(PlatformDbContext db, PlatformAdmin? me)> Me()
    {
        var db = await _pf.CreateDbContextAsync();
        if (!_tc.Portal || User.FindFirstValue(UserContext.TenantClaim) != Tn || User.FindFirstValue("amr") != "mfa") return (db, null);
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var me = await db.Admins.FirstOrDefaultAsync(a => a.Id == id && a.Active);
        if (me is not null && User.FindFirstValue("stamp") != Stamp(me)) me = null;
        return (db, me);
    }

    private static string Stamp(PlatformAdmin a) => Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(
        System.Text.Encoding.UTF8.GetBytes(a.Id + "|" + a.PasswordHash + "|" + a.TotpSecret)))[..16];

    private static void Log(PlatformDbContext db, string? who, string action, string target, string ip) =>
        db.Logs.Add(new PlatformLog { Ts = DateTime.UtcNow, Username = who, Action = action, Target = target.Length > 500 ? target[..500] : target, Ip = ip });

    // ---------- Đăng nhập ----------

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var (db, me) = await Me(); await using var _ = db;
        return Ok(new { user = me is null ? null : new { me.Username, me.Name }, baseDomain = _opt.BaseDomain, version = TenantOps.AppVersion });
    }

    public record LoginRequest(string? Username, string? Password, string? Code, string? Ticket);

    /// <summary>Đăng nhập: mật khẩu + mã 6 số. Lần đầu (chưa có khóa 2 lớp) trả về mã QR để quét, gửi lại kèm mã và phiếu để hoàn tất.</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest r)
    {
        const string bad = "Tên đăng nhập hoặc mật khẩu không đúng.";
        await using var db = await _pf.CreateDbContextAsync();
        var un = (r.Username ?? "").Trim().ToLowerInvariant();
        var a = await db.Admins.FirstOrDefaultAsync(x => x.Username == un && x.Active);
        if (a is null) { PlatformCli.Hasher.VerifyHashedPassword(new PlatformAdmin(), PlatformCli.Hasher.HashPassword(new PlatformAdmin(), "x"), r.Password ?? ""); return Error(401, bad); }
        if (a.LockoutUntil is { } until && until > DateTime.UtcNow) return Error(423, $"Tài khoản tạm khóa do nhập sai nhiều lần. Thử lại sau {Math.Ceiling((until - DateTime.UtcNow).TotalMinutes)} phút.");
        async Task<IActionResult> Fail(string msg)
        {
            if (++a.FailedCount >= MaxFailed) { a.LockoutUntil = DateTime.UtcNow.AddMinutes(15); a.FailedCount = 0; }
            Log(db, un, "Đăng nhập không thành công", msg, Ip);
            await db.SaveChangesAsync();
            return Error(401, msg);
        }
        if (PlatformCli.Hasher.VerifyHashedPassword(a, a.PasswordHash, r.Password ?? "") == PasswordVerificationResult.Failed) return await Fail(bad);

        if (a.TotpSecret is null)
        {
            // Bật xác thực 2 lớp lần đầu
            if (r.Ticket is { Length: > 0 } && r.Code is { Length: > 0 })
            {
                string? secret = null;
                try
                {
                    var t = JsonSerializer.Deserialize<EnrollTicket>(_enroll.Unprotect(r.Ticket));
                    if (t is not null && t.Id == a.Id && t.Exp > DateTimeOffset.UtcNow.ToUnixTimeSeconds()) secret = t.Secret;
                }
                catch (Exception ex) when (ex is System.Security.Cryptography.CryptographicException or JsonException or FormatException) { }
                if (secret is null) return Error(400, "Phiên thiết lập đã hết hạn, vui lòng đăng nhập lại.");
                var step = TwoFactor.Verify(secret, r.Code, 0);
                if (step is null) return await Fail("Mã xác thực không đúng. Hãy nhập mã đang hiển thị trên ứng dụng.");
                a.TotpSecret = _secret.Protect(secret); a.TotpLastStep = step.Value;
                Log(db, un, "Bật xác thực 2 lớp", un, Ip);
            }
            else
            {
                var secret = TwoFactor.NewSecret();
                var ticket = _enroll.Protect(JsonSerializer.Serialize(new EnrollTicket(a.Id, secret, DateTimeOffset.UtcNow.AddMinutes(10).ToUnixTimeSeconds())));
                const string issuer = "QLDA Quan tri nen tang";
                var uri = $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{Uri.EscapeDataString(un)}?secret={secret}&issuer={Uri.EscapeDataString(issuer)}&algorithm=SHA1&digits=6&period=30";
                return Ok(new { mfa = "enroll", secret, ticket, qrSvg = TwoFactor.QrSvg(uri) });
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(r.Code)) return Ok(new { mfa = "verify" });
            string? secret;
            try { secret = _secret.Unprotect(a.TotpSecret); } catch (System.Security.Cryptography.CryptographicException) { secret = null; }
            if (secret is null) return Error(500, "Không đọc được khóa xác thực 2 lớp. Đặt lại tài khoản bằng lệnh trên máy chủ.");
            var step = TwoFactor.Verify(secret, r.Code, a.TotpLastStep);
            if (step is null) return await Fail("Mã xác thực không đúng hoặc đã hết hạn.");
            a.TotpLastStep = step.Value;
        }
        a.FailedCount = 0; a.LockoutUntil = null; a.LastLogin = DateTime.UtcNow;
        Log(db, un, "Đăng nhập", un, Ip);
        await db.SaveChangesAsync();
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, a.Id), new(ClaimTypes.Name, a.Username), new("stamp", Stamp(a)), new("amr", "mfa"), new(UserContext.TenantClaim, Tn) };
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)), new AuthenticationProperties { IsPersistent = false });
        return Ok(new { user = new { a.Username, a.Name } });
    }
    private record EnrollTicket(string Id, string Secret, long Exp);

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok(new { ok = true });
    }

    public record PasswordRequest(string? Old, string? Password);

    [HttpPost("password")]
    public async Task<IActionResult> ChangePassword([FromBody] PasswordRequest r)
    {
        var (db, me) = await Me(); await using var _ = db;
        if (me is null) return Error(401, "Phiên đăng nhập đã hết hạn.");
        if (PlatformCli.Hasher.VerifyHashedPassword(me, me.PasswordHash, r.Old ?? "") == PasswordVerificationResult.Failed) return Error(400, "Mật khẩu hiện tại không đúng.");
        if (!Passwords.Strong(r.Password) || r.Password!.Length < 10) return Error(400, "Mật khẩu quản trị nền tảng cần tối thiểu 10 ký tự, gồm cả chữ và số.");
        me.PasswordHash = PlatformCli.Hasher.HashPassword(me, r.Password);
        Log(db, me.Username, "Đổi mật khẩu", me.Username, Ip);
        await db.SaveChangesAsync();
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok(new { ok = true });
    }

    // ---------- Danh sách xã ----------

    private object View(Tenant t)
    {
        var (state, error) = _reg.StateOf(t.Code);
        var now = DateTime.Now;
        return new
        {
            t.Code, t.Name, t.Hosts, t.Status, statusLabel = TenantStatus.Label(t.Status), t.LockReason, t.ExpiresAt, t.Contact, t.Note,
            t.CreatedAt, t.UpdatedAt, t.UpdatedBy, t.AppVersion, t.LastError,
            url = "https://" + _opt.HostOf(t.Code), expired = t.Expired(now),
            daysLeft = t.ExpiresAt is { } e ? (int?)(e.Date - now.Date).TotalDays : null,
            ready = state.ToString(), readyError = error,
            setupPending = t.SetupTokenHash is not null
        };
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> List()
    {
        var (db, me) = await Me(); await using var _ = db;
        if (me is null) return Error(401, "Phiên đăng nhập đã hết hạn.");
        var all = await db.Tenants.AsNoTracking().OrderBy(t => t.Code).ToListAsync();
        return Ok(all.Select(View));
    }

    public class TenantInput
    {
        public string? Code { get; set; }
        public string? Name { get; set; }
        public string? Hosts { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? Contact { get; set; }
        public string? Note { get; set; }
    }

    private string? Validate(TenantInput r)
    {
        if (string.IsNullOrWhiteSpace(r.Name) || r.Name.Length > 200) return "Vui lòng nhập tên xã/phường (ví dụ: xã Tân Hòa).";
        foreach (var h in (r.Hosts ?? "").Split(new[] { ',', ';', ' ', '\n' }, StringSplitOptions.RemoveEmptyEntries))
            if (!System.Text.RegularExpressions.Regex.IsMatch(h.Trim().ToLowerInvariant(), @"^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$") || h.Trim().ToLowerInvariant().EndsWith("." + _opt.BaseDomain) || h.Trim().ToLowerInvariant() == _opt.Portal)
                return $"Tên miền riêng '{h.Trim()}' không hợp lệ.";
        return null;
    }

    private async Task<string?> HostTaken(PlatformDbContext db, string? hosts, string? exceptCode)
    {
        var mine = new Tenant { Hosts = hosts }.CustomHosts().ToHashSet();
        if (mine.Count == 0) return null;
        foreach (var t in await db.Tenants.AsNoTracking().Where(t => t.Code != exceptCode).ToListAsync())
            if (t.CustomHosts().FirstOrDefault(mine.Contains) is { } h) return $"Tên miền {h} đang dùng cho xã {t.Code}.";
        return null;
    }

    /// <summary>Tạo xã mới: tạo CSDL riêng, trả về địa chỉ truy cập và mã khởi tạo (chỉ hiện một lần).</summary>
    [HttpPost("tenants")]
    public async Task<IActionResult> Create([FromBody] TenantInput r)
    {
        var (db, me) = await Me(); await using var _ = db;
        if (me is null) return Error(401, "Phiên đăng nhập đã hết hạn.");
        var code = (r.Code ?? "").Trim().ToLowerInvariant();
        if (!TenancyOptions.ValidCode(code)) return Error(400, TenancyOptions.CodeMessage);
        if (Validate(r) is { } err) return Error(400, err);
        if (await HostTaken(db, r.Hosts, null) is { } taken) return Error(409, taken);
        try
        {
            var c = await _ops.CreateAsync(new Tenant { Code = code, Name = r.Name!.Trim(), Hosts = Clean(r.Hosts), ExpiresAt = r.ExpiresAt?.Date, Contact = r.Contact?.Trim(), Note = r.Note }, me.Username);
            return Ok(new { tenant = View(c.Tenant), setupToken = c.SetupToken, setupUrl = $"https://{_opt.HostOf(code)}/?ma={c.SetupToken}" });
        }
        catch (Exception ex) when (ex is InvalidOperationException or NpgsqlException)
        {
            await using var ldb = await _pf.CreateDbContextAsync();
            Log(ldb, me.Username, "Tạo xã không thành công", code + ": " + ex.Message, Ip); await ldb.SaveChangesAsync();
            return Error(409, ex.Message);
        }
    }

    private static string? Clean(string? hosts) => string.Join(",", new Tenant { Hosts = hosts }.CustomHosts().Distinct()) is { Length: > 0 } s ? s : null;

    [HttpPut("tenants/{code}")]
    public async Task<IActionResult> Update(string code, [FromBody] TenantInput r)
    {
        var (db, me) = await Me(); await using var _ = db;
        if (me is null) return Error(401, "Phiên đăng nhập đã hết hạn.");
        var t = await db.Tenants.FirstOrDefaultAsync(x => x.Code == code);
        if (t is null) return Error(404, "Không tìm thấy xã.");
        if (Validate(r) is { } err) return Error(400, err);
        if (await HostTaken(db, r.Hosts, code) is { } taken) return Error(409, taken);
        var changes = new List<string>();
        if (t.Name != r.Name!.Trim()) changes.Add($"tên: {t.Name} → {r.Name.Trim()}");
        if (t.ExpiresAt?.Date != r.ExpiresAt?.Date) changes.Add($"hạn: {t.ExpiresAt:dd/MM/yyyy} → {r.ExpiresAt:dd/MM/yyyy}");
        if (t.Hosts != Clean(r.Hosts)) changes.Add($"tên miền riêng: {t.Hosts} → {Clean(r.Hosts)}");
        t.Name = r.Name.Trim(); t.Hosts = Clean(r.Hosts); t.ExpiresAt = r.ExpiresAt?.Date; t.Contact = r.Contact?.Trim(); t.Note = r.Note;
        t.UpdatedAt = DateTime.UtcNow; t.UpdatedBy = me.Username;
        Log(db, me.Username, "Sửa thông tin xã", code + (changes.Count > 0 ? ": " + string.Join("; ", changes) : ""), Ip);
        await db.SaveChangesAsync();
        _reg.Invalidate();
        return Ok(View(t));
    }

    public record LockRequest(string? Reason);

    [HttpPost("tenants/{code}/lock")]
    public async Task<IActionResult> Lock(string code, [FromBody] LockRequest r) => await SetStatus(code, TenantStatus.Locked, r.Reason);

    [HttpPost("tenants/{code}/unlock")]
    public async Task<IActionResult> Unlock(string code) => await SetStatus(code, TenantStatus.Active, null);

    private async Task<IActionResult> SetStatus(string code, string status, string? reason)
    {
        var (db, me) = await Me(); await using var _ = db;
        if (me is null) return Error(401, "Phiên đăng nhập đã hết hạn.");
        var t = await db.Tenants.FirstOrDefaultAsync(x => x.Code == code);
        if (t is null) return Error(404, "Không tìm thấy xã.");
        if (t.Status == TenantStatus.Creating) return Error(409, "Xã đang tạo dở, chưa đổi trạng thái được.");
        t.Status = status; t.LockReason = status == TenantStatus.Locked ? reason?.Trim() : null;
        t.UpdatedAt = DateTime.UtcNow; t.UpdatedBy = me.Username;
        Log(db, me.Username, status == TenantStatus.Locked ? "Tạm khóa xã" : "Mở lại xã", code + (reason is { Length: > 0 } ? ": " + reason : ""), Ip);
        await db.SaveChangesAsync();
        _reg.Invalidate();
        return Ok(View(t));
    }

    /// <summary>Cấp lại mã khởi tạo (chỉ khi xã chưa tạo tài khoản quản trị).</summary>
    [HttpPost("tenants/{code}/setup-token")]
    public async Task<IActionResult> NewToken(string code)
    {
        var (db, me) = await Me(); await using var _ = db;
        if (me is null) return Error(401, "Phiên đăng nhập đã hết hạn.");
        var t = await db.Tenants.FirstOrDefaultAsync(x => x.Code == code);
        if (t is null) return Error(404, "Không tìm thấy xã.");
        using (var scope = _ops.ScopeFor(t))
            if (await scope.ServiceProvider.GetRequiredService<AppDbContext>().Users.AnyAsync())
                return Error(409, "Xã đã khởi tạo tài khoản quản trị. Quên mật khẩu thì quản trị xã đặt lại cho nhau; mất điện thoại xác thực thì dùng chức năng đặt lại xác thực 2 lớp.");
        var token = SetupGuard.NewToken();
        t.SetupTokenHash = SetupGuard.Hash(token); t.SetupTokenExpires = DateTime.UtcNow.AddDays(30);
        t.UpdatedAt = DateTime.UtcNow; t.UpdatedBy = me.Username;
        Log(db, me.Username, "Cấp lại mã khởi tạo", code, Ip);
        await db.SaveChangesAsync();
        return Ok(new { setupToken = token, setupUrl = $"https://{_opt.HostOf(code)}/?ma={token}" });
    }

    public record ResetRequest(string? Username);

    /// <summary>Hỗ trợ xã: đặt lại xác thực 2 lớp cho một tài khoản (ví dụ quản trị xã mất điện thoại). Ghi vào nhật ký của xã.</summary>
    [HttpPost("tenants/{code}/reset-2fa")]
    public async Task<IActionResult> Reset2fa(string code, [FromBody] ResetRequest r)
    {
        var (db, me) = await Me(); await using var _ = db;
        if (me is null) return Error(401, "Phiên đăng nhập đã hết hạn.");
        var t = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code);
        if (t is null) return Error(404, "Không tìm thấy xã.");
        var un = (r.Username ?? "").Trim().ToLowerInvariant();
        using var scope = _ops.ScopeFor(t);
        var xdb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var u = await xdb.Users.FirstOrDefaultAsync(x => x.Username == un);
        if (u is null) return Error(404, $"Xã không có tài khoản '{un}'.");
        u.TotpSecret = null; u.RecoveryCodes = null; u.TotpLastStep = 0; u.FailedCount = 0; u.LockoutUntil = null; u.UpdatedAt = DateTime.UtcNow; u.UpdatedBy = "nen-tang:" + me.Username;
        xdb.Logs.Add(new AuditLog { Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = DateTime.UtcNow, Username = "nen-tang:" + me.Username, Fullname = "Quản trị nền tảng (hỗ trợ)", Action = "Đặt lại xác thực 2 lớp theo yêu cầu hỗ trợ", Module = "Người dùng", Target = u.Username, Ip = Ip });
        await xdb.SaveChangesAsync();
        Log(db, me.Username, "Đặt lại xác thực 2 lớp cho tài khoản của xã", $"{code}/{un}", Ip);
        await db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    /// <summary>Chạy lại nâng cấp CSDL cho xã (sau khi đã khắc phục lỗi).</summary>
    [HttpPost("tenants/{code}/upgrade")]
    public async Task<IActionResult> Upgrade(string code)
    {
        var (db, me) = await Me(); await using var _ = db;
        if (me is null) return Error(401, "Phiên đăng nhập đã hết hạn.");
        var t = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code);
        if (t is null) return Error(404, "Không tìm thấy xã.");
        var ok = await _ops.UpgradeAsync(t);
        return ok ? Ok(View(t)) : Error(500, "Nâng cấp chưa thành công: " + _reg.StateOf(code).error);
    }

    /// <summary>Thống kê sử dụng của xã: chỉ số liệu đếm, không đọc nội dung nghiệp vụ.</summary>
    [HttpGet("tenants/{code}/stats")]
    public async Task<IActionResult> Stats(string code)
    {
        var (db, me) = await Me(); await using var _ = db;
        if (me is null) return Error(401, "Phiên đăng nhập đã hết hạn.");
        var t = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code);
        if (t is null) return Error(404, "Không tìm thấy xã.");
        if (_reg.StateOf(code).state != TenantRegistry.State.Ready) return Error(409, "Xã chưa sẵn sàng (đang nâng cấp hoặc lỗi).");
        using var scope = _ops.ScopeFor(t);
        var x = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var since = DateTime.UtcNow.AddDays(-30);
        long dbSize = 0;
        await using (var c = new NpgsqlConnection(_reg.AdminConnection()))
        {
            await c.OpenAsync();
            await using var cmd = new NpgsqlCommand("select pg_database_size(@n)", c); cmd.Parameters.AddWithValue("n", t.DbName);
            dbSize = (long)(await cmd.ExecuteScalarAsync() ?? 0L);
        }
        var dir = scope.ServiceProvider.GetRequiredService<TenantContext>().Dir!;
        long DirSize(string d) => Directory.Exists(d) ? new DirectoryInfo(d).EnumerateFiles("*", SearchOption.AllDirectories).Sum(f => f.Length) : 0;
        return Ok(new
        {
            users = await x.Users.CountAsync(u => !u.Sample),
            activeUsers30 = await x.Users.CountAsync(u => !u.Sample && u.LastLogin != null && u.LastLogin > since),
            lastLogin = await x.Users.MaxAsync(u => (DateTime?)u.LastLogin),
            projects = await x.Projects.CountAsync(),
            files = await x.Files.CountAsync(),
            dbSize, filesSize = DirSize(Path.Combine(dir, "files")), backupSize = DirSize(Path.Combine(dir, "backups")),
            lastBackup = Directory.Exists(Path.Combine(dir, "backups")) ? new DirectoryInfo(Path.Combine(dir, "backups")).GetFiles("SaoLuu_QLDA_*.json").Select(f => (DateTime?)f.LastWriteTimeUtc).Max() : null,
            initialized = await x.Users.AnyAsync()
        });
    }

    [HttpGet("logs")]
    public async Task<IActionResult> Logs()
    {
        var (db, me) = await Me(); await using var _ = db;
        if (me is null) return Error(401, "Phiên đăng nhập đã hết hạn.");
        return Ok(await db.Logs.AsNoTracking().OrderByDescending(l => l.Ts).Take(300).ToListAsync());
    }
}

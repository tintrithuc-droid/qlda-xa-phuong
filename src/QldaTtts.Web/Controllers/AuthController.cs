using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Khởi tạo hệ thống, đăng nhập/đăng xuất (kể cả bước xác thực 2 lớp), đổi mật khẩu.</summary>
[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private const int MaxFailed = 5;
    private static readonly TimeSpan LockoutTime = TimeSpan.FromMinutes(15);
    private readonly TwoFactor _tf;
    public AuthController(AppDbContext db, UserContext uc, TwoFactor tf) : base(db, uc) { _tf = tf; }

    /// <summary>Trạng thái: hệ thống đã khởi tạo chưa, người dùng hiện tại là ai.</summary>
    [HttpGet("state")]
    public async Task<IActionResult> State()
    {
        await Uc.LoadAsync();
        var initialized = await Db.Users.AnyAsync();
        object? mfa = null;
        if (Uc.User is not null)
        {
            var me = await Db.Users.AsNoTracking().FirstAsync(x => x.Id == Uc.User.Id);
            mfa = new { enabled = me.TotpSecret is not null, required = _tf.Required(me, Uc.Group), recoveryLeft = TwoFactor.RecoveryLeft(me) };
        }
        return Ok(new { initialized, user = Uc.User, mfa, sampleUsers = initialized && await Db.Users.AnyAsync(u => u.Sample) });
    }

    public class SetupRequest
    {
        public string Name { get; set; } = "";
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
        public List<JsonElement> Groups { get; set; } = new();
        public List<JsonElement> Catalogs { get; set; } = new();
        /// <summary>Dữ liệu mẫu theo tập: {"projects":[…], "packages":[…], …}</summary>
        public Dictionary<string, List<JsonElement>>? Sample { get; set; }
        public List<SampleUser>? SampleUsers { get; set; }
    }
    public record SampleUser(string Username, string Name, string GroupId, string? Unit);

    /// <summary>Chỉ chạy được khi chưa có người dùng nào: tạo nhóm quyền, danh mục, (tùy chọn) dữ liệu mẫu và tài khoản quản trị.</summary>
    [HttpPost("setup")]
    public async Task<IActionResult> Setup([FromBody] SetupRequest r)
    {
        if (await Db.Users.AnyAsync()) return Error(409, "Hệ thống đã được khởi tạo.");
        var username = r.Username.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(r.Name)) return Error(400, "Vui lòng nhập họ tên.");
        if (!Passwords.ValidUsername(username)) return Error(400, Passwords.UsernameMessage);
        if (!Passwords.Strong(r.Password)) return Error(400, Passwords.WeakMessage);

        var now = DateTime.UtcNow;
        void AddAll(string collection, IEnumerable<JsonElement> items)
        {
            var def = Collections.Find(collection) ?? throw new InvalidOperationException("Tập dữ liệu không hợp lệ: " + collection);
            foreach (var el in items)
            {
                var o = (EntityBase)JsonSerializer.Deserialize(el.GetRawText(), def.Type, JsonConfig.Options)!;
                if (!ValidId(o.Id)) throw new InvalidOperationException("Mã bản ghi không hợp lệ: " + o.Id);
                o.UpdatedAt = now; o.UpdatedBy = username;
                Db.Add(o);
            }
        }
        try
        {
            AddAll("groups", r.Groups);
            AddAll("catalogs", r.Catalogs);
            if (r.Sample is not null) foreach (var (col, items) in r.Sample) AddAll(col, items);
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException) { return Error(400, "Dữ liệu khởi tạo không hợp lệ: " + ex.Message); }

        var admin = Db.ChangeTracker.Entries<UserGroup>().Select(e => e.Entity).FirstOrDefault(g => g.Id == "g-admin");
        if (admin is null) Db.Add(new UserGroup { Id = "g-admin", Name = "Quản trị hệ thống", Admin = true, UpdatedAt = now, UpdatedBy = username });
        else admin.Admin = true;

        foreach (var s in r.SampleUsers ?? new())
        {
            var su = new AppUser { Id = "u-" + s.Username, Username = s.Username, Name = s.Name, GroupId = s.GroupId, Unit = s.Unit, Active = true, Sample = true, CreatedAt = now, UpdatedAt = now, UpdatedBy = username };
            su.PasswordHash = Passwords.Hash(su, r.Password);
            Db.Users.Add(su);
        }
        var u = new AppUser { Id = "u-admin", Username = username, Name = r.Name.Trim(), GroupId = "g-admin", Unit = "Ban QL Trung tâm Thủy sản", Active = true, CreatedAt = now, LastLogin = now, UpdatedAt = now, UpdatedBy = username };
        u.PasswordHash = Passwords.Hash(u, r.Password);
        Db.Users.Add(u);
        Db.Logs.Add(new AuditLog { Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = now, UserId = u.Id, Username = u.Username, Fullname = u.Name, Action = "Khởi tạo hệ thống", Module = "Người dùng", Target = "Tài khoản quản trị " + username, Ip = Uc.Ip });
        await Db.SaveChangesAsync();
        // Tài khoản quản trị đầu tiên phải thiết lập xác thực 2 lớp ngay
        if (_tf.RequiredForAdmins) return Ok(MfaChallenge(u));
        await SignIn(u, false);
        return Ok(new { user = u });
    }

    public record LoginRequest(string Username, string Password);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest r)
    {
        const string bad = "Tên đăng nhập hoặc mật khẩu không đúng.";
        var un = (r.Username ?? "").Trim().ToLowerInvariant();
        var u = await Db.Users.FirstOrDefaultAsync(x => x.Username == un);
        if (u is null) { Passwords.VerifyDummy(r.Password ?? ""); return Error(401, bad); }
        if (u.LockoutUntil is { } until && until > DateTime.UtcNow)
            return Error(423, $"Tài khoản tạm khóa do nhập sai mật khẩu nhiều lần. Thử lại sau {Math.Ceiling((until - DateTime.UtcNow).TotalMinutes)} phút.");
        if (!Passwords.Verify(u, r.Password ?? ""))
        {
            u.FailedCount++;
            if (u.FailedCount >= MaxFailed) { u.LockoutUntil = DateTime.UtcNow + LockoutTime; u.FailedCount = 0; }
            await Db.SaveChangesAsync();
            return Error(401, bad);
        }
        if (!u.Active) return Error(403, "Tài khoản đã bị khóa. Liên hệ quản trị hệ thống.");
        var g = u.GroupId is null ? null : await Db.Groups.AsNoTracking().FirstOrDefaultAsync(x => x.Id == u.GroupId);
        if (_tf.Required(u, g))
        {
            // Mật khẩu đúng nhưng chưa đăng nhập: chờ bước mã xác thực (giữ nguyên số lần sai để tính chung với bước mã)
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(MfaChallenge(u));
        }
        await Complete(u, false);
        return Ok(new { user = u });
    }

    /// <summary>Phát phiếu tạm cho bước 2: "verify" nếu đã có khóa, "enroll" kèm khóa mới và mã QR nếu chưa thiết lập.</summary>
    private object MfaChallenge(AppUser u)
    {
        if (u.TotpSecret is not null) { _tf.IssueTicket(HttpContext, u, null); return new { mfa = "verify", recoveryLeft = TwoFactor.RecoveryLeft(u) }; }
        var secret = TwoFactor.NewSecret();
        _tf.IssueTicket(HttpContext, u, secret);
        var uri = _tf.OtpAuthUri(u.Username, secret);
        return new { mfa = "enroll", secret, issuer = _tf.Issuer, account = u.Username, otpauthUri = uri, qrSvg = TwoFactor.QrSvg(uri) };
    }

    private async Task Complete(AppUser u, bool mfa)
    {
        u.FailedCount = 0; u.LockoutUntil = null; u.LastLogin = DateTime.UtcNow;
        Db.Logs.Add(new AuditLog { Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = DateTime.UtcNow, UserId = u.Id, Username = u.Username, Fullname = u.Name, Action = mfa ? "Đăng nhập (xác thực 2 lớp)" : "Đăng nhập", Module = "Người dùng", Target = u.Username, Ip = Uc.Ip });
        await Db.SaveChangesAsync();
        await SignIn(u, mfa);
    }

    public record MfaRequest(string? Code, bool Recovery = false);

    /// <summary>Bước 2 đăng nhập: nhập mã 6 số từ ứng dụng xác thực (hoặc mã khôi phục). Lần đầu thì đồng thời lưu khóa và cấp mã khôi phục.</summary>
    [HttpPost("mfa")]
    public async Task<IActionResult> Mfa([FromBody] MfaRequest r)
    {
        const string expired = "Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.";
        var t = _tf.ReadTicket(HttpContext);
        if (t is null) return Error(401, expired);
        var u = await Db.Users.FirstOrDefaultAsync(x => x.Id == t.UserId);
        if (u is null || !u.Active || Passwords.Stamp(u) != t.Stamp) { TwoFactor.ClearTicket(HttpContext); return Error(401, expired); }
        if (u.LockoutUntil is { } until && until > DateTime.UtcNow)
            return Error(423, $"Tài khoản tạm khóa do nhập sai nhiều lần. Thử lại sau {Math.Ceiling((until - DateTime.UtcNow).TotalMinutes)} phút.");

        List<string>? codes = null;
        var enroll = t.Secret is not null;
        bool ok;
        if (enroll)
        {
            var step = TwoFactor.Verify(t.Secret!, r.Code, 0);
            ok = step is not null;
            if (ok)
            {
                u.TotpSecret = _tf.Protect(t.Secret!); u.TotpLastStep = step!.Value;
                (codes, u.RecoveryCodes) = TwoFactor.NewRecoveryCodes();
                u.UpdatedAt = DateTime.UtcNow; u.UpdatedBy = u.Username;
            }
        }
        else if (r.Recovery) ok = TwoFactor.UseRecovery(u, r.Code);
        else
        {
            var secret = _tf.Unprotect(u.TotpSecret);
            if (secret is null) return Error(500, "Không đọc được khóa xác thực 2 lớp (khóa mã hóa của máy chủ đã thay đổi). Liên hệ quản trị hệ thống để đặt lại.");
            var step = TwoFactor.Verify(secret, r.Code, u.TotpLastStep);
            ok = step is not null;
            if (ok) u.TotpLastStep = step!.Value;
        }
        if (!ok)
        {
            u.FailedCount++;
            var locked = u.FailedCount >= MaxFailed;
            if (locked) { u.LockoutUntil = DateTime.UtcNow + LockoutTime; u.FailedCount = 0; TwoFactor.ClearTicket(HttpContext); }
            await Db.SaveChangesAsync();
            return Error(locked ? 423 : 400, locked ? "Nhập sai quá nhiều lần, tài khoản tạm khóa 15 phút."
                : r.Recovery ? "Mã khôi phục không đúng hoặc đã được dùng." : "Mã xác thực không đúng hoặc đã hết hạn. Hãy nhập mã đang hiển thị trên ứng dụng.");
        }
        if (enroll) Db.Logs.Add(new AuditLog { Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = DateTime.UtcNow, UserId = u.Id, Username = u.Username, Fullname = u.Name, Action = "Bật xác thực 2 lớp", Module = "Người dùng", Target = u.Username, Ip = Uc.Ip });
        if (r.Recovery) Db.Logs.Add(new AuditLog { Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = DateTime.UtcNow, UserId = u.Id, Username = u.Username, Fullname = u.Name, Action = "Dùng mã khôi phục", Module = "Người dùng", Target = $"{u.Username} (còn {TwoFactor.RecoveryLeft(u)} mã)", Ip = Uc.Ip });
        TwoFactor.ClearTicket(HttpContext);
        await Complete(u, true);
        return Ok(new { user = u, recoveryCodes = codes, recoveryLeft = TwoFactor.RecoveryLeft(u) });
    }

    public record PasswordConfirm(string? Password);

    /// <summary>Tạo bộ mã khôi phục mới (bộ cũ hết hiệu lực); cần nhập lại mật khẩu.</summary>
    [Authorize, HttpPost("recovery-codes")]
    public async Task<IActionResult> RecoveryCodes([FromBody] PasswordConfirm r)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var u = await Db.Users.FirstAsync(x => x.Id == Uc.User.Id);
        if (u.TotpSecret is null) return Error(400, "Tài khoản chưa bật xác thực 2 lớp.");
        if (!Passwords.Verify(u, r.Password ?? "")) return Error(400, "Mật khẩu không đúng.");
        (var codes, u.RecoveryCodes) = TwoFactor.NewRecoveryCodes();
        Uc.Log("Tạo lại mã khôi phục", "Người dùng", u.Username);
        await Db.SaveChangesAsync();
        return Ok(new { recoveryCodes = codes });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await Uc.LoadAsync();
        if (Uc.User is not null) { Uc.Log("Đăng xuất", "Người dùng", Uc.User.Username); await Db.SaveChangesAsync(); }
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        TwoFactor.ClearTicket(HttpContext);
        return Ok(new { ok = true });
    }

    public record ChangePasswordRequest(string Old, string Password);

    [Authorize, HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest r)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var u = await Db.Users.FirstAsync(x => x.Id == Uc.User.Id);
        if (!Passwords.Verify(u, r.Old ?? "")) return Error(400, "Mật khẩu hiện tại không đúng.");
        if (!Passwords.Strong(r.Password)) return Error(400, Passwords.WeakMessage);
        u.PasswordHash = Passwords.Hash(u, r.Password);
        u.UpdatedAt = DateTime.UtcNow; u.UpdatedBy = u.Username;
        Uc.Log("Đổi mật khẩu", "Người dùng", u.Username);
        await Db.SaveChangesAsync();
        await SignIn(u, Uc.Mfa);
        return Ok(new { ok = true });
    }

    private Task SignIn(AppUser u, bool mfa)
    {
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, u.Id), new(ClaimTypes.Name, u.Username), new("stamp", Passwords.Stamp(u)) };
        if (mfa) claims.Add(new Claim("amr", "mfa"));
        var id = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        return HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(id),
            new AuthenticationProperties { IsPersistent = false });
    }
}

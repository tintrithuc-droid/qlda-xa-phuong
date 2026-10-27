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

/// <summary>Khởi tạo hệ thống, đăng nhập/đăng xuất, đổi mật khẩu.</summary>
[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private const int MaxFailed = 5;
    private static readonly TimeSpan LockoutTime = TimeSpan.FromMinutes(15);
    public AuthController(AppDbContext db, UserContext uc) : base(db, uc) { }

    /// <summary>Trạng thái: hệ thống đã khởi tạo chưa, người dùng hiện tại là ai.</summary>
    [HttpGet("state")]
    public async Task<IActionResult> State()
    {
        await Uc.LoadAsync();
        var initialized = await Db.Users.AnyAsync();
        return Ok(new { initialized, user = Uc.User, sampleUsers = initialized && await Db.Users.AnyAsync(u => u.Sample) });
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
        await SignIn(u);
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
        u.FailedCount = 0; u.LockoutUntil = null; u.LastLogin = DateTime.UtcNow;
        Db.Logs.Add(new AuditLog { Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = DateTime.UtcNow, UserId = u.Id, Username = u.Username, Fullname = u.Name, Action = "Đăng nhập", Module = "Người dùng", Target = u.Username, Ip = Uc.Ip });
        await Db.SaveChangesAsync();
        await SignIn(u);
        return Ok(new { user = u });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await Uc.LoadAsync();
        if (Uc.User is not null) { Uc.Log("Đăng xuất", "Người dùng", Uc.User.Username); await Db.SaveChangesAsync(); }
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
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
        await SignIn(u);
        return Ok(new { ok = true });
    }

    private Task SignIn(AppUser u)
    {
        var id = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, u.Id), new Claim(ClaimTypes.Name, u.Username), new Claim("stamp", Passwords.Stamp(u)) },
            CookieAuthenticationDefaults.AuthenticationScheme);
        return HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(id),
            new AuthenticationProperties { IsPersistent = false });
    }
}

using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>Người dùng đang đăng nhập cùng nhóm quyền; cung cấp kiểm tra quyền chức năng và phạm vi dữ liệu.</summary>
public class UserContext
{
    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _http;
    private bool _loaded;
    public AppUser? User { get; private set; }
    public UserGroup? Group { get; private set; }

    private readonly TwoFactor _tf;
    private readonly TenantContext _tc;
    public UserContext(AppDbContext db, IHttpContextAccessor http, TwoFactor tf, TenantContext tc) { _db = db; _http = http; _tf = tf; _tc = tc; }

    /// <summary>Mã xã ghi trong phiên đăng nhập (chế độ cho thuê); phiên của xã khác bị từ chối.</summary>
    public const string TenantClaim = "tn";

    /// <summary>Phiên hiện tại đã qua bước xác thực 2 lớp.</summary>
    public bool Mfa => _http.HttpContext?.User.FindFirstValue("amr") == "mfa";

    public async Task<UserContext> LoadAsync()
    {
        if (_loaded) return this;
        _loaded = true;
        var id = _http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id is null) return this;
        if (_tc.Multi && _http.HttpContext!.User.FindFirstValue(TenantClaim) != _tc.Code) return this;
        User = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id && u.Active);
        if (User is not null && _http.HttpContext!.User.FindFirstValue("stamp") != Passwords.Stamp(User)) User = null;
        if (User?.GroupId is not null) Group = await _db.Groups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == User.GroupId);
        // Tài khoản bắt buộc 2 lớp (quản trị, hoặc đã tự bật) mà phiên chưa qua bước mã thì coi như chưa đăng nhập
        if (User is not null && _tf.Required(User, Group) && !Mfa) { User = null; Group = null; }
        return this;
    }

    public bool IsAdmin => Group?.Admin == true;

    public bool Can(string module, bool edit = false)
    {
        if (User is null || Group is null) return false;
        if (Group.Admin) return true;
        var p = Group.Perms.TryGetValue(module, out var v) ? v : "none";
        return edit ? p == "edit" : p != "none";
    }

    /// <summary>null = được khai thác tất cả dự án.</summary>
    public HashSet<string>? Scope => Group is null || Group.Admin || Group.Scope.Count == 0 ? null : Group.Scope.ToHashSet();

    public bool InScope(string? projectId) => Scope is null || (projectId is not null && Scope.Contains(projectId));

    /// <summary>Hướng dẫn sử dụng dành cho nhóm của người dùng (quản trị cập nhật được thì xem tất cả).</summary>
    public bool SeesGuide(Guide g) => Can("quan-tri", true) || g.Groups.Count == 0 || (User?.GroupId is { } gid && g.Groups.Contains(gid));

    public string Ip => _http.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "";

    public void Log(string action, string module, string target)
    {
        _db.Logs.Add(new AuditLog
        {
            Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = DateTime.UtcNow, UserId = User?.Id, Username = User?.Username,
            Fullname = User?.Name, Action = action, Module = module, Target = target.Length > 500 ? target[..500] : target, Ip = Ip
        });
    }
}

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

    public UserContext(AppDbContext db, IHttpContextAccessor http) { _db = db; _http = http; }

    public async Task<UserContext> LoadAsync()
    {
        if (_loaded) return this;
        _loaded = true;
        var id = _http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id is null) return this;
        User = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id && u.Active);
        if (User?.GroupId is not null) Group = await _db.Groups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == User.GroupId);
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

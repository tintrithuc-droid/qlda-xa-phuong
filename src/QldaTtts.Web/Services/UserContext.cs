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
        // Bản 1.8: tài khoản thuộc đơn vị nhà thầu / tư vấn giám sát chỉ thấy các gói thầu có đơn vị này (và dự án của các gói đó)
        if (User?.OrgId is { Length: > 0 } oid && Group is { Admin: false })
        {
            var ks = await _db.Packages.AsNoTracking().Select(k => new { k.Id, k.ProjectId, k.ContractorIds, k.SupervisorIds }).ToListAsync();
            var mine = ks.Where(k => k.ContractorIds.Contains(oid) || k.SupervisorIds.Contains(oid)).ToList();
            Packages = mine.Select(k => k.Id).ToHashSet();
            _orgProjects = mine.Where(k => k.ProjectId is not null).Select(k => k.ProjectId!).ToHashSet();
        }
        // Bản 1.8.2: nhóm "chỉ thấy dự án được gán" (khách hàng): chỉ các dự án có tài khoản này trong danh sách người được xem
        if (User is not null && Group is { Admin: false, AssignedOnly: true })
        {
            var uid = User.Id;
            _assigned = (await _db.Projects.AsNoTracking().Select(p => new { p.Id, p.ViewerIds }).ToListAsync())
                .Where(p => p.ViewerIds.Contains(uid)).Select(p => p.Id).ToHashSet();
        }
        return this;
    }

    private HashSet<string>? _assigned;

    public bool IsAdmin => Group?.Admin == true;

    /// <summary>Bản 1.10.24 (anh Trí 26/11: "Bỏ quyền xóa của nhân viên"): nhóm có quyền cập nhật nhưng đánh dấu "&lt;phân hệ&gt;:khongxoa" thì thêm, sửa được, không xóa được.</summary>
    public bool CanDelete(string module) => Can(module, true) && (Group!.Admin || !(Group.Perms.TryGetValue(module + ":khongxoa", out var v) && v == "1"));
    public bool Can(string module, bool edit = false)
    {
        if (User is null || Group is null) return false;
        if (Group.Admin) return true;
        if (module == "quan-tri") return false;   // Quản trị hệ thống: chỉ nhóm toàn quyền
        var p = Group.Perms.TryGetValue(module, out var v) ? v : "none";
        return edit ? p == "edit" : p != "none";
    }

    private HashSet<string>? _orgProjects;
    /// <summary>Gói thầu được khai thác (tài khoản thuộc đơn vị); null = không giới hạn theo gói thầu.</summary>
    public HashSet<string>? Packages { get; private set; }
    /// <summary>Bản ghi không gắn gói thầu thì chỉ xét dự án.</summary>
    public bool InPackage(string? packageId) => Packages is null || string.IsNullOrEmpty(packageId) || Packages.Contains(packageId);

    /// <summary>null = được khai thác tất cả dự án.</summary>
    public HashSet<string>? Scope { get { if (!_scopeDone) { _scope = BuildScope(); _scopeDone = true; } return _scope; } }
    private bool _scopeDone; private HashSet<string>? _scope;
    private HashSet<string>? BuildScope()
    {
        var s = _orgProjects ?? (Group is null || Group.Admin || Group.Scope.Count == 0 ? null : Group.Scope.ToHashSet());
        if (_assigned is null) return s;
        return s is null ? _assigned : s.Where(_assigned.Contains).ToHashSet();
    }

    public bool InScope(string? projectId) => Scope is null || (projectId is not null && Scope.Contains(projectId));

    /// <summary>Hướng dẫn sử dụng dành cho nhóm của người dùng (quản trị cập nhật được thì xem tất cả).</summary>
    public bool SeesGuide(Guide g) => Can("quan-tri", true) || g.Groups.Count == 0 || (User?.GroupId is { } gid && g.Groups.Contains(gid));

    public string Ip => _http.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "";

    /// <param name="collection">Bản 1.8.9: loại dữ liệu, mã hồ sơ của thao tác (để xem lịch sử thay đổi trên từng hồ sơ).</param>
    public void Log(string action, string module, string target, string? collection = null, string? recordId = null)
    {
        _db.Logs.Add(new AuditLog
        {
            Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = DateTime.UtcNow, UserId = User?.Id, Username = User?.Username,
            Fullname = User?.Name, Action = action, Module = module, Target = target.Length > 500 ? target[..500] : target, Ip = Ip,
            Collection = collection, RecordId = recordId
        });
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>
/// Bản 1.10.4: công việc theo dự án → nhiệm vụ → công việc (bảng ProjectTasks dùng chung với tab Công việc của dự án).
/// Giao việc: quyền sửa Công việc, KPI hoặc dự án giao cho mọi người; trưởng phòng giao cho người trong phòng.
/// Bản 1.10.17: Dự án (cha) › Gói thầu (con, không bắt buộc) › Công việc › việc con; không chọn người nhận = việc của tôi.
/// Việc tự tạo của người không có quyền giao việc: người giao việc cha, trưởng phòng hoặc Ban giám đốc xác nhận mới tính KPI.
/// Gia hạn (dời hạn muộn hơn) giữ hạn ban đầu và đếm số lần; nghiệm thu chấm chất lượng 1–5 sao hoặc mở lại (đếm số lần mở lại).
/// </summary>
[Authorize, Route("api/vp/viec")]
public class ViecController : ApiControllerBase
{
    private readonly FileStore _store;
    public ViecController(AppDbContext db, UserContext uc, FileStore store) : base(db, uc) { _store = store; }

    public static readonly string[] Open = { "Chưa bắt đầu", "Đang thực hiện" };
    private const string Done = "Hoàn thành", Cancelled = "Đã hủy";

    private HashSet<string> _managed = new();
    private HashSet<string> _pendingExt = new();
    private Dictionary<string, Employee> _empByUser = new();
    /// <summary>Quyền "cong-viec": xem = xem mọi công việc; sửa = giao việc cho mọi người. Người quản lý KPI, dự án (quyền sửa) cũng giao được.</summary>
    private bool Boss => Uc.IsAdmin || Uc.Can("cong-viec", true) || Uc.Can("kpi", true) || Uc.Can("du-an", true);
    private bool SeeAll => Boss || Uc.Can("cong-viec") || Uc.Can("kpi");
    private string Me => Uc.User!.Id;

    private async Task Prepare()
    {
        _managed = (await Db.Departments.AsNoTracking().Where(d => d.ManagerUserId == Me).Select(d => d.Id).ToListAsync()).ToHashSet();
        _empByUser = (await Db.Employees.AsNoTracking().Where(e => e.UserId != null).ToListAsync()).GroupBy(e => e.UserId!).ToDictionary(g => g.Key, g => g.First());
        _pendingExt = (await Db.TaskLogs.AsNoTracking().Where(l => l.Kind == "xin-gia-han" && l.State == "Chờ duyệt").Select(l => l.TaskId).ToListAsync()).ToHashSet();
    }
    private bool ManagerOf(string? userId) => userId is not null && _empByUser.TryGetValue(userId, out var e) && e.DepartmentId is not null && _managed.Contains(e.DepartmentId);
    private bool CanAssignTo(string userId) => Boss || ManagerOf(userId);
    private bool CanManage(ProjectTask t) => Boss || (t.AssignedByUserId == Me && t.AssigneeUserId != Me) || (ManagerOf(t.AssigneeUserId) && t.AssigneeUserId != Me);
    private bool Mine(ProjectTask t) => t.AssigneeUserId == Me || KpiController.CollabIds(t).Contains(Me);
    public static List<string> WatchIds(ProjectTask t) => (t.Watchers ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
    /// <summary>Bản 1.10.17 (anh Trí 26/11, như e-work): Việc của tôi = tôi tự làm (tự tạo cho mình); Được giao = người khác giao tôi làm chính, phối hợp hoặc theo dõi;
    /// Tôi giao = tôi giao cho người khác.</summary>
    private bool SelfMade(ProjectTask t) => t.AssigneeUserId == Me && (t.AssignedByUserId == null || t.AssignedByUserId == Me);
    private bool Given(ProjectTask t) => (t.AssigneeUserId == Me && t.AssignedByUserId != null && t.AssignedByUserId != Me) || KpiController.CollabIds(t).Contains(Me) || WatchIds(t).Contains(Me);
    private bool GaveOut(ProjectTask t) => t.AssignedByUserId == Me && t.AssigneeUserId != Me;
    private IEnumerable<ProjectTask> InScopeOf(string scope, IEnumerable<ProjectTask> all) => scope switch
    {
        "my" => all.Where(SelfMade),
        "duoc" => all.Where(Given),
        "giao" => all.Where(GaveOut),
        "dept" => all.Where(t => (ManagerOf(t.AssigneeUserId) || (Boss && t.AssigneeUserId != null)) && t.AssigneeUserId != Me),
        _ => all.Where(CanSee)
    };
    /// <summary>Bản 1.10.17: việc thuộc dự án mở xem cho mọi người xem được dự án ("không gì phải giấu", anh Trí 22/11).</summary>
    private bool CanSee(ProjectTask t) => Mine(t) || WatchIds(t).Contains(Me) || t.AssignedByUserId == Me || CanManage(t) || (SeeAll && (t.ProjectId is null || Uc.InScope(t.ProjectId)))
        || (t.ProjectId is not null && Uc.Can("du-an") && Uc.InScope(t.ProjectId));
    private bool CanConfirm(ProjectTask t, ProjectTask? parent) => t.Arising && t.ArisingConfirmedAt is null && t.Status != Cancelled && t.AssigneeUserId != Me
        && (Boss || ManagerOf(t.AssigneeUserId) || (parent is not null && (parent.AssignedByUserId == Me || parent.AssigneeUserId == Me)));
    /// <summary>Bản 1.10.17: việc báo xong mà người giao chưa nghiệm thu, quá ReviewDays ngày làm việc thì tự Đạt (anh Trí chọn 26/11/2026):
    /// không trừ người làm, không còn chờ nghiệm thu. Tính theo lúc báo xong (cũ thì theo ngày xong).</summary>
    public const int ReviewDays = 3;
    public static bool AutoAccepted(ProjectTask t, DateOnly today, VpSettings vs)
    {
        if (t.Status != Done || t.Quality != null) return false;
        var from = t.ReportedAt is { } ra ? DateOnly.FromDateTime(VnTime.ToVn(ra)) : t.DoneDate;
        if (from is null) return false;
        var n = 0; for (var d = from.Value.AddDays(1); d <= today && n <= ReviewDays; d = d.AddDays(1)) if (VnTime.WorkValue(d, vs) > 0) n++;
        return n > ReviewDays;
    }
    /// <summary>Việc tự làm của người có quyền giao việc (không phải việc tự tạo chờ xác nhận) thì báo xong là xong, không chờ ai nghiệm thu.</summary>
    public static bool NoReviewer(ProjectTask t) => t.AssignedByUserId is not null && t.AssignedByUserId == t.AssigneeUserId && !t.Arising;
    public static bool PendingReview(ProjectTask t, DateOnly today, VpSettings vs) => t.Status == Done && t.Quality == null && !NoReviewer(t) && !AutoAccepted(t, today, vs);

    /// <summary>Bản 1.10.17: đơn vị dùng Văn phòng (có nhân sự, không ẩn mục Công việc) thì mọi thêm/sửa công việc phải qua mục Công việc;
    /// tab Công việc của dự án chỉ là khung xem. Đơn vị chỉ dùng phần dự án giữ cách nhập cũ.</summary>
    public static async Task<bool> Unified(AppDbContext db)
    {
        if (!await db.Employees.AnyAsync()) return false;
        var br = await BrandingController.Load(db);
        var hide = br.TryGetValue("hideMods", out var h) ? h?.ToString() ?? "" : "";
        return !hide.Split(',').Select(x => x.Trim()).Contains("cong-viec");
    }

    private string NameOf(string? userId) => userId is not null && _empByUser.TryGetValue(userId, out var e) ? e.Name : "";

    private object Row(ProjectTask t, Dictionary<string, string> projects, Dictionary<string, string> packages, Dictionary<string, ProjectTask> byId, HashSet<string> parents, DateOnly today, int remind, VpSettings vs)
    {
        var auto = AutoAccepted(t, today, vs);
        byId.TryGetValue(t.ParentId ?? "", out var parent);
        var open = Open.Contains(t.Status ?? "Chưa bắt đầu");
        var col = KpiController.CollabIds(t); var wat = WatchIds(t);
        return new
        {
            t.Id, t.Name, t.ProjectId, projectName = t.ProjectId is not null && projects.TryGetValue(t.ProjectId, out var pn) ? pn : null,
            t.PackageId, packageName = t.PackageId is not null && packages.TryGetValue(t.PackageId, out var kn) ? kn : null,
            t.ParentId, parentName = parent?.Name, hasChildren = parents.Contains(t.Id), autoAccepted = auto, pendingReview = PendingReview(t, today, vs),
            t.AssigneeUserId, assignee = t.AssigneeUserId is not null && NameOf(t.AssigneeUserId) is { Length: > 0 } an ? an : t.Assignee,
            collaborators = col, collabNames = col.Select(NameOf).Where(x => x.Length > 0).ToList(), watchers = wat, watcherNames = wat.Select(NameOf).Where(x => x.Length > 0).ToList(),
            t.Progress, role = t.AssigneeUserId == Me ? (SelfMade(t) ? "tu-lam" : "chinh") : col.Contains(Me) ? "phoi-hop" : wat.Contains(Me) ? "theo-doi" : t.AssignedByUserId == Me ? "giao" : "",
            extendPending = _pendingExt.Contains(t.Id),
            t.AssignedByUserId, assignedBy = NameOf(t.AssignedByUserId),
            level = t.Priority, t.StartDate, t.Due, t.OriginalDue, t.ExtendCount, status = t.Status ?? "Chưa bắt đầu", t.DoneDate, t.Quality, t.ReopenCount,
            t.Arising, arisingConfirmed = t.ArisingConfirmedAt != null, t.Note, fromEwork = t.EworkId != null,
            overdue = open && t.Due < today, dueSoon = open && t.Due >= today && t.Due <= today.AddDays(remind),
            canEdit = CanManage(t) || (t.AssigneeUserId == Me && t.Arising && t.ArisingConfirmedAt is null),
            canWork = open && t.AssigneeUserId == Me,
            canUpdate = open && (t.AssigneeUserId == Me || col.Contains(Me)),
            canAskExtend = open && t.AssigneeUserId == Me && !_pendingExt.Contains(t.Id) && t.Due != null,
            canReview = CanManage(t) && PendingReview(t, today, vs),
            canConfirm = CanConfirm(t, parent)
        };
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? scope, [FromQuery] string? status, [FromQuery] string? project, [FromQuery] string? q, [FromQuery] string? month, [FromQuery] string? package)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        await Prepare();
        var k = KpiSettings.Load(Db); var today = DateOnly.FromDateTime(VnTime.Now);
        var all = await Db.Tasks.AsNoTracking().ToListAsync();
        var byId = all.ToDictionary(t => t.Id);
        var parents = all.Where(t => t.ParentId != null).Select(t => t.ParentId!).ToHashSet();
        var projects = await Db.Projects.AsNoTracking().ToDictionaryAsync(p => p.Id, p => p.Name);
        var pkgs = await Db.Packages.AsNoTracking().Select(p => new { p.Id, p.ProjectId, p.Code, p.Name }).ToListAsync();
        var packages = pkgs.ToDictionary(p => p.Id, p => string.IsNullOrWhiteSpace(p.Code) ? p.Name : p.Code + " · " + p.Name);
        var vs = VpSettings.Load(Db);
        scope = scope is "dept" or "all" or "giao" or "duoc" ? scope : "my";
        var list = InScopeOf(scope, all);
        if (scope == "all" && !SeeAll) list = list.Where(CanSee);
        list = (status ?? "open") switch
        {
            "open" => list.Where(t => Open.Contains(t.Status ?? "Chưa bắt đầu")),
            "overdue" => list.Where(t => Open.Contains(t.Status ?? "Chưa bắt đầu") && t.Due < today),
            "confirm" => list.Where(t => t.Arising && t.ArisingConfirmedAt == null && t.Status != Cancelled),
            "review" => list.Where(t => PendingReview(t, today, vs)),
            "done" => list.Where(t => t.Status == Done),
            _ => list
        };
        if (!string.IsNullOrEmpty(project)) list = project == "-" ? list.Where(t => t.ProjectId == null) : list.Where(t => t.ProjectId == project);
        if (!string.IsNullOrEmpty(package)) list = package == "-" ? list.Where(t => t.PackageId == null) : list.Where(t => t.PackageId == package);
        if (!string.IsNullOrEmpty(month) && DateOnly.TryParse(month + "-01", out var mf))
        { var mt = mf.AddMonths(1); list = list.Where(t => (t.Due >= mf && t.Due < mt) || (t.DoneDate >= mf && t.DoneDate < mt)); }
        if (!string.IsNullOrWhiteSpace(q)) { var nq = KpiController.Norm(q); list = list.Where(t => KpiController.Norm(t.Name).Contains(nq) || KpiController.Norm(t.Assignee).Contains(nq)); }
        var rows = list.OrderBy(t => Open.Contains(t.Status ?? "Chưa bắt đầu") ? 0 : 1).ThenBy(t => t.Due ?? DateOnly.MaxValue).Take(1000)
            .Select(t => Row(t, projects, packages, byId, parents, today, k.RemindDays, vs)).ToList();
        // tổng hợp theo dự án → gói thầu trên toàn bộ việc người xem được thấy trong phạm vi đang chọn (không theo bộ lọc trạng thái):
        // tổng số việc (không tính nhiệm vụ đã chia việc con), đang làm, quá hạn, chờ nghiệm thu, đã xong
        var basis = InScopeOf(scope, all).Where(t => t.Status != Cancelled && !parents.Contains(t.Id)).ToList();
        object Sum(IEnumerable<ProjectTask> xs)
        {
            var l = xs.ToList(); var open = l.Where(t => Open.Contains(t.Status ?? "Chưa bắt đầu")).ToList();
            var done = l.Count(t => t.Status == Done);
            return new { total = l.Count, open = open.Count, overdue = open.Count(t => t.Due < today), review = l.Count(t => PendingReview(t, today, vs)), done, pct = l.Count == 0 ? 0 : (int)Math.Round(100.0 * done / l.Count) };
        }
        var summary = basis.GroupBy(t => t.ProjectId ?? "").Select(g => new
        {
            projectId = g.Key.Length == 0 ? null : g.Key, projectName = g.Key.Length == 0 ? null : projects.GetValueOrDefault(g.Key),
            sum = Sum(g),
            packages = g.GroupBy(t => t.PackageId ?? "").Select(h => new { packageId = h.Key.Length == 0 ? null : h.Key, packageName = h.Key.Length == 0 ? null : packages.GetValueOrDefault(h.Key), sum = Sum(h) })
                .OrderBy(x => x.packageId is null ? 1 : 0).ThenBy(x => x.packageName).ToList()
        }).OrderBy(x => x.projectId is null ? 1 : 0).ThenBy(x => x.projectName).ToList();
        // việc cha có thể chọn khi tạo việc phát sinh: nhiệm vụ, công việc đang mở của tôi hoặc trong phạm vi
        var parentOpts = all.Where(t => Open.Contains(t.Status ?? "Chưa bắt đầu") && (Mine(t) || CanManage(t) || (t.AssigneeUserId == null && (t.ProjectId == null || Uc.InScope(t.ProjectId)))))
            .OrderBy(t => t.ProjectId is null ? "" : projects.GetValueOrDefault(t.ProjectId, "")).ThenBy(t => t.Name).Take(400)
            .Select(t => new { t.Id, t.Name, t.ProjectId, t.PackageId, projectName = t.ProjectId is null ? null : projects.GetValueOrDefault(t.ProjectId), packageName = t.PackageId is null ? null : packages.GetValueOrDefault(t.PackageId) }).ToList();
        return Ok(new
        {
            counts = new { my = all.Count(t => SelfMade(t) && Open.Contains(t.Status ?? "Chưa bắt đầu")), duoc = all.Count(t => Given(t) && Open.Contains(t.Status ?? "Chưa bắt đầu")),
                giao = all.Count(t => GaveOut(t) && (Open.Contains(t.Status ?? "Chưa bắt đầu") || PendingReview(t, today, vs))) },
            unified = await Unified(Db), scope, rows, total = rows.Count, parents = parentOpts, levels = k.Levels.Select(l => l.Name), summary, reviewDays = ReviewDays,
            packages = pkgs.Where(p => p.ProjectId != null && Uc.InScope(p.ProjectId)).OrderBy(p => p.Code).ThenBy(p => p.Name).Select(p => new { id = p.Id, p.ProjectId, name = packages[p.Id] }),
            projects = projects.Where(p => Uc.InScope(p.Key)).OrderBy(p => p.Value).Select(p => new { id = p.Key, name = p.Value }),
            perms = new { boss = Boss, seeAll = SeeAll, managed = _managed, assignable = Boss ? null : _empByUser.Values.Where(e => e.DepartmentId != null && _managed.Contains(e.DepartmentId)).Select(e => e.UserId).ToList() }
        });
    }

    public record TaskBody(string? Name, string? Note, string? ProjectId, string? ParentId, string? AssigneeUserId, List<string>? Collaborators, string? Level,
        DateOnly? StartDate, DateOnly? Due, bool Correct = false, string? PackageId = null, List<string>? Watchers = null);

    /// <summary>Gói thầu phải thuộc đúng dự án của việc; trống = việc chung của dự án.</summary>
    private async Task<(string? id, string? err)> CheckPackage(string? packageId, string? projectId)
    {
        if (string.IsNullOrEmpty(packageId)) return (null, null);
        if (projectId is null) return (null, "Chọn dự án trước khi chọn gói thầu.");
        if (!ValidId(packageId) || !await Db.Packages.AnyAsync(p => p.Id == packageId && p.ProjectId == projectId)) return (null, "Gói thầu không thuộc dự án đã chọn.");
        return (packageId, null);
    }

    private async Task<(ProjectTask? parent, string? err)> CheckParent(string? parentId, string? selfId = null)
    {
        if (string.IsNullOrEmpty(parentId)) return (null, null);
        if (!ValidId(parentId) || parentId == selfId) return (null, "Việc cha không hợp lệ.");
        var p = await Db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == parentId);
        if (p is null || !CanSee(p)) return (null, "Không thấy nhiệm vụ/công việc cha.");
        // không tạo vòng: việc cha không được là con cháu của chính việc này
        for (var x = p; selfId is not null && x?.ParentId is not null;) { if (x.ParentId == selfId) return (null, "Việc cha không được là việc con của chính việc này."); x = await Db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == x.ParentId); }
        return (p, null);
    }
    private string? Collab(List<string>? ids, string? assignee) => ids is null ? null :
        string.Join(",", ids.Where(i => i != assignee && _empByUser.ContainsKey(i)).Distinct().Take(20)) is { Length: > 0 } s ? s : null;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TaskBody b)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        await Prepare();
        var name = (b.Name ?? "").Trim(); if (name.Length == 0) return Error(400, "Nhập tên công việc.");
        if (b.Due is null) return Error(400, "Nhập hạn hoàn thành.");
        if (b.StartDate is { } sd && sd > b.Due) return Error(400, "Ngày bắt đầu sau hạn hoàn thành.");
        var assignee = string.IsNullOrEmpty(b.AssigneeUserId) ? Me : b.AssigneeUserId;
        if (!_empByUser.ContainsKey(assignee)) return Error(400, "Người được giao chưa có hồ sơ nhân sự.");
        var (parent, perr) = await CheckParent(b.ParentId); if (perr is not null) return Error(400, perr);
        var self = assignee == Me && !Boss;
        if (assignee != Me && !CanAssignTo(assignee)) return Denied("Chỉ trưởng phòng giao việc cho người trong phòng; người quản lý KPI, dự án giao cho mọi người.");
        // Bản 1.10.17 (anh Trí 26/11): không chọn người nhận = người tạo tự xử lý; tạo ngay ở dự án, gói thầu hoặc việc nội bộ, không bắt chọn việc cha.
        // Người không có quyền giao việc tự tạo thì vẫn là việc tự nhận: trưởng phòng hoặc Ban giám đốc xác nhận mới tính KPI.
        var projectId = parent?.ProjectId ?? (string.IsNullOrEmpty(b.ProjectId) ? null : b.ProjectId);
        if (projectId is not null && (!await Db.Projects.AnyAsync(p => p.Id == projectId) || !Uc.InScope(projectId))) return Error(400, "Dự án không hợp lệ hoặc ngoài phạm vi được giao.");
        var (packageId, kerr) = parent is not null ? (parent.PackageId, null) : await CheckPackage(b.PackageId, projectId); if (kerr is not null) return Error(400, kerr);
        var t = new ProjectTask
        {
            Id = "cv-" + Guid.NewGuid().ToString("N")[..20], Name = name.Length > 500 ? name[..500] : name, Note = b.Note?.Trim(), ProjectId = projectId, PackageId = packageId, ParentId = parent?.Id,
            AssigneeUserId = assignee, Assignee = NameOf(assignee), Collaborators = Collab(b.Collaborators, assignee), Watchers = Collab(b.Watchers, assignee), AssignedByUserId = Me,
            Priority = string.IsNullOrWhiteSpace(b.Level) ? KpiSettings.Load(Db).Levels.FirstOrDefault()?.Name : b.Level.Trim(), StartDate = b.StartDate ?? DateOnly.FromDateTime(VnTime.Now), Due = b.Due,
            Status = "Chưa bắt đầu", Arising = self, UpdatedAt = DateTime.UtcNow, UpdatedBy = Uc.User.Username
        };
        Db.Tasks.Add(t);
        AddLog(t, "giao", assignee == Me ? "Tạo việc của tôi" : $"Giao cho {t.Assignee}, hạn {t.Due:dd/MM/yyyy}");
        Uc.Log(self ? "Tạo việc phát sinh" : "Giao việc", "Công việc", $"{t.Name} → {t.Assignee}", "tasks", t.Id);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true, id = t.Id, arising = t.Arising });
    }

    private async Task<(ProjectTask? t, IActionResult? err)> Load(string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return (null, NotSignedIn());
        if (!ValidId(id)) return (null, Error(400, "Mã không hợp lệ."));
        await Prepare();
        var t = await Db.Tasks.FirstOrDefaultAsync(x => x.Id == id);
        if (t is null || !CanSee(t)) return (null, NotFound());
        return (t, null);
    }
    private void Touch(ProjectTask t) { t.UpdatedAt = DateTime.UtcNow; t.UpdatedBy = Uc.User!.Username; }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] TaskBody b)
    {
        var (t, err) = await Load(id); if (err is not null) return err;
        var ownDraft = t!.AssigneeUserId == Me && t.Arising && t.ArisingConfirmedAt is null;
        if (!CanManage(t) && !ownDraft) return Denied("Chỉ người giao việc, trưởng phòng hoặc người quản lý được sửa.");
        if (!string.IsNullOrWhiteSpace(b.Name)) t.Name = b.Name.Trim().Length > 500 ? b.Name.Trim()[..500] : b.Name.Trim();
        if (b.Note is not null) t.Note = b.Note.Trim();
        if (b.Level is not null) t.Priority = b.Level.Trim();
        if (b.StartDate is not null) t.StartDate = b.StartDate;
        if (b.Collaborators is not null) t.Collaborators = Collab(b.Collaborators, t.AssigneeUserId);
        if (b.Watchers is not null) t.Watchers = Collab(b.Watchers, t.AssigneeUserId);
        if (!string.IsNullOrEmpty(b.AssigneeUserId) && b.AssigneeUserId != t.AssigneeUserId)
        {
            if (!CanAssignTo(b.AssigneeUserId) || !_empByUser.ContainsKey(b.AssigneeUserId)) return Denied("Không giao được cho người này.");
            t.AssigneeUserId = b.AssigneeUserId; t.Assignee = NameOf(b.AssigneeUserId); t.Collaborators = Collab(KpiController.CollabIds(t), t.AssigneeUserId);
        }
        if (b.ParentId is not null && b.ParentId != (t.ParentId ?? ""))
        {
            var (parent, perr) = await CheckParent(b.ParentId, t.Id); if (perr is not null) return Error(400, perr);
            t.ParentId = parent?.Id; if (parent is not null) { t.ProjectId = parent.ProjectId; t.PackageId = parent.PackageId; }
        }
        if (t.ParentId is null && b.ProjectId is not null)
        {
            var pid = b.ProjectId.Length == 0 ? null : b.ProjectId;
            if (pid is not null && (!await Db.Projects.AnyAsync(p => p.Id == pid) || !Uc.InScope(pid))) return Error(400, "Dự án không hợp lệ.");
            if (pid != t.ProjectId) t.PackageId = null;
            t.ProjectId = pid;
        }
        if (t.ParentId is null && b.PackageId is not null && b.PackageId != (t.PackageId ?? ""))
        {
            var (kid, kerr) = await CheckPackage(b.PackageId, t.ProjectId); if (kerr is not null) return Error(400, kerr);
            t.PackageId = kid;
        }
        if (b.Due is { } nd && nd != t.Due)
        {
            if (t.StartDate is { } s0 && s0 > nd) return Error(400, "Hạn trước ngày bắt đầu.");
            // dời hạn muộn hơn khi việc đã giao (không phải sửa nhầm) là gia hạn
            if (t.Due is { } od && nd > od && !ownDraft && !(b.Correct && Boss)) { t.OriginalDue ??= od; t.ExtendCount++; AddLog(t, "gia-han", $"Người giao gia hạn từ {od:dd/MM/yyyy}", newDue: nd); }
            t.Due = nd;
        }
        Touch(t);
        Uc.Log("Cập nhật công việc", "Công việc", t.Name, "tasks", t.Id);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true, t.ExtendCount });
    }

    public record StatusBody(string? Status, DateOnly? DoneDate, string? Result);

    /// <summary>Người làm hoặc người quản lý cập nhật trạng thái; báo hoàn thành kèm ngày xong và kết quả.</summary>
    [HttpPost("{id}/trang-thai")]
    public async Task<IActionResult> SetStatus(string id, [FromBody] StatusBody b)
    {
        var (t, err) = await Load(id); if (err is not null) return err;
        if (t!.AssigneeUserId != Me && !CanManage(t)) return Denied("Chỉ người được giao hoặc người quản lý cập nhật.");
        if (b.Status == Done && t.AssigneeUserId != Me) return Denied("Người làm chính báo xong; người giao việc nghiệm thu.");
        var st = b.Status ?? "";
        if (st is not ("Chưa bắt đầu" or "Đang thực hiện" or "Tạm dừng" or Done)) return Error(400, "Trạng thái không hợp lệ.");
        if (t.Status == Cancelled) return Error(409, "Việc đã hủy.");
        if (st == "Tạm dừng" && !CanManage(t)) return Denied("Tạm dừng việc do người giao việc quyết định.");
        var today = DateOnly.FromDateTime(VnTime.Now);
        if (st == Done)
        {
            if (parentHasOpenChildren(t.Id)) return Error(409, "Còn việc con chưa xong.");
            var dd = b.DoneDate ?? today; if (dd > today) return Error(400, "Ngày hoàn thành không được sau hôm nay.");
            t.DoneDate = dd; t.ReportedAt = DateTime.UtcNow; t.Progress = 100;
            AddLog(t, "bao-xong", string.IsNullOrWhiteSpace(b.Result) ? $"Báo xong ngày {dd:dd/MM/yyyy}" : b.Result.Trim(), 100);
            if (!string.IsNullOrWhiteSpace(b.Result)) t.Note = string.Join("\n", new[] { t.Note, $"Kết quả ({dd:dd/MM/yyyy}): {b.Result.Trim()}" }.Where(x => !string.IsNullOrEmpty(x)));
        }
        else { t.DoneDate = null; t.ReportedAt = null; if (st != t.Status) AddLog(t, "cap-nhat", "Chuyển sang " + st.ToLower()); }
        t.Status = st; Touch(t);
        Uc.Log(st == Done ? "Báo hoàn thành công việc" : "Cập nhật trạng thái công việc", "Công việc", $"{t.Name}: {st}", "tasks", t.Id);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true });
    }
    private bool parentHasOpenChildren(string id) => Db.Tasks.Any(x => x.ParentId == id && x.Status != Done && x.Status != Cancelled);

    public record ReviewBody(int? Quality, bool Reopen, DateOnly? NewDue, string? Note);

    /// <summary>Nghiệm thu: chấm chất lượng 1–5 sao, hoặc mở lại (yêu cầu làm lại, có thể cho hạn mới, không tính là gia hạn).</summary>
    [HttpPost("{id}/nghiem-thu")]
    public async Task<IActionResult> Review(string id, [FromBody] ReviewBody b)
    {
        var (t, err) = await Load(id); if (err is not null) return err;
        if (!CanManage(t!)) return Denied("Người giao việc, trưởng phòng hoặc người quản lý nghiệm thu (không tự nghiệm thu việc của mình).");
        if (t!.Status != Done) return Error(409, "Việc chưa báo hoàn thành.");
        if (t.Quality != null) return Error(409, "Việc đã nghiệm thu.");
        if (AutoAccepted(t, DateOnly.FromDateTime(VnTime.Now), VpSettings.Load(Db))) return Error(409, $"Quá {ReviewDays} ngày làm việc không nghiệm thu nên việc đã tự Đạt.");
        var line = b.Note?.Trim();
        if (b.Reopen)
        {
            t.Status = "Đang thực hiện"; t.DoneDate = null; t.ReportedAt = null; t.Quality = null; t.ReopenCount++;
            if (b.NewDue is { } nd) t.Due = nd;
            AddLog(t, "mo-lai", b.Note?.Trim() is { Length: > 0 } rn ? rn : "Yêu cầu làm lại", newDue: b.NewDue);
            line = $"Mở lại lần {t.ReopenCount} ({VnTime.Now:dd/MM/yyyy}){(string.IsNullOrEmpty(line) ? "" : ": " + line)}";
        }
        else
        {
            if (b.Quality is not (>= 1 and <= 5)) return Error(400, "Chấm chất lượng từ 1 đến 5 sao.");
            t.Quality = b.Quality;
            AddLog(t, "nghiem-thu", $"{b.Quality} sao" + (string.IsNullOrWhiteSpace(b.Note) ? "" : ": " + b.Note.Trim()));
            line = $"Nghiệm thu {b.Quality} sao ({VnTime.Now:dd/MM/yyyy}){(string.IsNullOrEmpty(line) ? "" : ": " + line)}";
        }
        t.Note = string.Join("\n", new[] { t.Note, line }.Where(x => !string.IsNullOrEmpty(x)));
        Touch(t);
        Uc.Log(b.Reopen ? "Mở lại công việc" : "Nghiệm thu công việc", "Công việc", t.Name, "tasks", t.Id);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    public record ConfirmBody(bool Accept, string? Note);

    [HttpPost("{id}/xac-nhan")]
    public async Task<IActionResult> Confirm(string id, [FromBody] ConfirmBody b)
    {
        var (t, err) = await Load(id); if (err is not null) return err;
        var parent = t!.ParentId is null ? null : await Db.Tasks.AsNoTracking().FirstOrDefaultAsync(x => x.Id == t.ParentId);
        if (!CanConfirm(t, parent)) return Denied("Người giao nhiệm vụ, trưởng phòng hoặc người quản lý xác nhận việc phát sinh (không tự xác nhận).");
        AddLog(t, b.Accept ? "xac-nhan" : "huy", b.Accept ? "Xác nhận việc, tính KPI" : "Không xác nhận" + (string.IsNullOrWhiteSpace(b.Note) ? "" : ": " + b.Note.Trim()));
        if (b.Accept) { t.ArisingConfirmedAt = DateTime.UtcNow; }
        else { t.Status = Cancelled; t.Note = string.Join("\n", new[] { t.Note, $"Không xác nhận việc phát sinh ({VnTime.Now:dd/MM/yyyy}){(string.IsNullOrWhiteSpace(b.Note) ? "" : ": " + b.Note.Trim())}" }.Where(x => !string.IsNullOrEmpty(x))); }
        Touch(t);
        Uc.Log(b.Accept ? "Xác nhận việc phát sinh" : "Không xác nhận việc phát sinh", "Công việc", t.Name, "tasks", t.Id);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    private TaskLog AddLog(ProjectTask t, string kind, string? content, int? progress = null, DateOnly? newDue = null, string? state = null)
    {
        var l = new TaskLog { Id = "tl-" + Guid.NewGuid().ToString("N")[..20], TaskId = t.Id, Kind = kind, Content = content, Progress = progress, NewDue = newDue, State = state,
            ByUserId = Uc.User!.Id, ByName = Uc.User.Name, At = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow, UpdatedBy = Uc.User.Username };
        Db.TaskLogs.Add(l); return l;
    }

    /// <summary>Chi tiết một việc: thông tin, nhật ký (giao, cập nhật tiến độ, gia hạn, báo xong, nghiệm thu, mở lại) và tệp đính kèm.</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> Detail(string id)
    {
        var (t, err) = await Load(id); if (err is not null) return err;
        var all = await Db.Tasks.AsNoTracking().Where(x => x.Id == t!.Id || x.Id == t.ParentId || x.ParentId == t.Id).ToListAsync();
        var byId = all.ToDictionary(x => x.Id); var parents = all.Where(x => x.ParentId == t!.Id).Any() ? new HashSet<string> { t!.Id } : new HashSet<string>();
        var projects = await Db.Projects.AsNoTracking().Where(p => p.Id == t!.ProjectId).ToDictionaryAsync(p => p.Id, p => p.Name);
        var packages = await Db.Packages.AsNoTracking().Where(p => p.Id == t!.PackageId).ToDictionaryAsync(p => p.Id, p => string.IsNullOrWhiteSpace(p.Code) ? p.Name : p.Code + " · " + p.Name);
        var k = KpiSettings.Load(Db); var vs = VpSettings.Load(Db); var today = DateOnly.FromDateTime(VnTime.Now);
        var logs = await Db.TaskLogs.AsNoTracking().Where(l => l.TaskId == t!.Id).OrderBy(l => l.At).ToListAsync();
        var files = await Db.Attachments.AsNoTracking().Where(a => a.Collection == "tasks" && a.RecordId == t!.Id && a.DeletedAt == null).OrderBy(a => a.UploadedAt)
            .Select(a => new { a.Id, a.FileId, a.FileName, a.Size, a.Kind, a.Ref, a.UploadedBy, a.UploadedAt }).ToListAsync();
        var children = all.Where(x => x.ParentId == t!.Id).OrderBy(x => x.Due).Select(x => new { x.Id, x.Name, x.Status, x.Due, assignee = NameOf(x.AssigneeUserId) is { Length: > 0 } n ? n : x.Assignee }).ToList();
        return Ok(new
        {
            row = Row(t!, projects, packages, byId, parents, today, k.RemindDays, vs), children,
            logs = logs.Select(l => new { l.Id, l.Kind, l.Content, l.Progress, l.NewDue, l.State, l.ByName, l.At, decidedBy = NameOf(l.DecidedByUserId), l.DecidedAt,
                canDecide = l.Kind == "xin-gia-han" && l.State == "Chờ duyệt" && CanManage(t!) }),
            files, canAttach = Mine(t!) || CanManage(t!) || t!.AssignedByUserId == Me
        });
    }

    public record ProgressBody(string? Content, int? Progress);

    /// <summary>Cập nhật tiến độ (như e-work TaskCapNhats): nội dung đã làm, % hoàn thành; người làm chính, phối hợp hoặc người quản lý.</summary>
    [HttpPost("{id}/cap-nhat")]
    public async Task<IActionResult> Update2(string id, [FromBody] ProgressBody b)
    {
        var (t, err) = await Load(id); if (err is not null) return err;
        if (!Mine(t!)) return Denied("Người làm chính hoặc người phối hợp cập nhật tiến độ.");
        if (!Open.Contains(t!.Status ?? "Chưa bắt đầu")) return Error(409, "Việc không còn đang làm.");
        var c = (b.Content ?? "").Trim(); if (c.Length == 0) return Error(400, "Ghi nội dung đã làm.");
        if (b.Progress is { } pg && (pg < 0 || pg > 99)) return Error(400, "Tiến độ từ 0 đến 99% (xong hẳn thì bấm Báo xong).");
        if (b.Progress is { } p2 && t.AssigneeUserId == Me) t.Progress = p2;
        if ((t.Status ?? "Chưa bắt đầu") == "Chưa bắt đầu" && t.AssigneeUserId == Me) t.Status = "Đang thực hiện";
        var l = AddLog(t, "cap-nhat", c.Length > 4000 ? c[..4000] : c, b.Progress);
        Touch(t); Uc.Log("Cập nhật tiến độ công việc", "Công việc", t.Name, "tasks", t.Id);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true, logId = l.Id });
    }

    public record ExtendBody(DateOnly? NewDue, string? Reason);

    /// <summary>Người làm xin gia hạn (như e-work TaskGiaHans): hạn mới và lý do; người giao, trưởng phòng hoặc Ban giám đốc duyệt.</summary>
    [HttpPost("{id}/xin-gia-han")]
    public async Task<IActionResult> AskExtend(string id, [FromBody] ExtendBody b)
    {
        var (t, err) = await Load(id); if (err is not null) return err;
        if (t!.AssigneeUserId != Me) return Denied("Người làm chính xin gia hạn.");
        if (!Open.Contains(t.Status ?? "Chưa bắt đầu")) return Error(409, "Việc không còn đang làm.");
        if (b.NewDue is not { } nd || t.Due is not { } od || nd <= od) return Error(400, "Hạn mới phải sau hạn hiện tại.");
        if (string.IsNullOrWhiteSpace(b.Reason)) return Error(400, "Ghi lý do xin gia hạn.");
        if (await Db.TaskLogs.AnyAsync(l => l.TaskId == t.Id && l.Kind == "xin-gia-han" && l.State == "Chờ duyệt")) return Error(409, "Đang có đề nghị gia hạn chờ duyệt.");
        if (SelfMade(t)) { t.OriginalDue ??= od; t.Due = nd; t.ExtendCount++; AddLog(t, "gia-han", b.Reason.Trim(), newDue: nd); }
        else AddLog(t, "xin-gia-han", b.Reason.Trim(), newDue: nd, state: "Chờ duyệt");
        Touch(t); Uc.Log("Xin gia hạn công việc", "Công việc", $"{t.Name} → {nd:dd/MM/yyyy}", "tasks", t.Id);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    public record DecideBody(string LogId, bool Accept, string? Note);

    [HttpPost("{id}/duyet-gia-han")]
    public async Task<IActionResult> DecideExtend(string id, [FromBody] DecideBody b)
    {
        var (t, err) = await Load(id); if (err is not null) return err;
        if (!CanManage(t!)) return Denied("Người giao việc, trưởng phòng hoặc Ban giám đốc duyệt gia hạn.");
        var l = await Db.TaskLogs.FirstOrDefaultAsync(x => x.Id == b.LogId && x.TaskId == t!.Id && x.Kind == "xin-gia-han" && x.State == "Chờ duyệt");
        if (l is null) return Error(404, "Không còn đề nghị gia hạn chờ duyệt.");
        l.State = b.Accept ? "Đã duyệt" : "Từ chối"; l.DecidedByUserId = Me; l.DecidedAt = DateTime.UtcNow;
        if (b.Accept && l.NewDue is { } nd) { if (t!.Due is { } od && nd > od) { t.OriginalDue ??= od; t.ExtendCount++; } t!.Due = nd; }
        if (!string.IsNullOrWhiteSpace(b.Note)) l.Content = (l.Content + "\nÝ kiến: " + b.Note.Trim()).Trim();
        Touch(t!); Uc.Log(b.Accept ? "Duyệt gia hạn công việc" : "Từ chối gia hạn công việc", "Công việc", t!.Name, "tasks", t.Id);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    /// <summary>Tệp đính kèm của việc (văn bản giao việc, sản phẩm, kết quả): người làm, phối hợp, người giao, người quản lý.</summary>
    [HttpPost("{id}/tep"), RequestSizeLimit(FileStore.MaxBytes + 1024 * 1024), RequestFormLimits(MultipartBodyLengthLimit = FileStore.MaxBytes + 1024 * 1024)]
    public async Task<IActionResult> AddFile(string id, [FromForm] IFormFile file, [FromForm] string? kind, [FromForm(Name = "ref")] string? reference)
    {
        var (t, err) = await Load(id); if (err is not null) return err;
        if (!Mine(t!) && !CanManage(t!) && t!.AssignedByUserId != Me) return Denied();
        if (FileStore.Check(file) is { } ferr) return Error(ferr.Contains("500 MB") ? 413 : 400, ferr);
        var sf = await _store.SaveAsync(file, Uc.User!.Username); Db.Files.Add(sf);
        var a = new Attachment { Id = "att-" + Guid.NewGuid().ToString("N")[..20], Collection = "tasks", RecordId = t!.Id, ProjectId = t.ProjectId,
            Kind = kind is { Length: > 0 } ? (kind.Length > 200 ? kind[..200] : kind) : null, Ref = reference is { Length: > 0 and <= 100 } ? reference : null,
            FileId = sf.Id, FileName = sf.FileName, ContentType = sf.ContentType, Size = sf.Size, UploadedBy = Uc.User.Name, UploadedAt = DateTime.UtcNow };
        Db.Attachments.Add(a); Uc.Log("Đính kèm tệp công việc", "Công việc", $"{t.Name}: {sf.FileName}", "tasks", t.Id);
        await Db.SaveChangesAsync();
        return Ok(new { a.Id, a.FileId, a.FileName });
    }

    [HttpDelete("{id}/tep/{attId}")]
    public async Task<IActionResult> DelFile(string id, string attId)
    {
        var (t, err) = await Load(id); if (err is not null) return err;
        var a = await Db.Attachments.FirstOrDefaultAsync(x => x.Id == attId && x.Collection == "tasks" && x.RecordId == t!.Id && x.DeletedAt == null);
        if (a is null) return NotFound();
        if (a.UploadedBy != Uc.User!.Name && !CanManage(t!)) return Denied("Người tải tệp hoặc người giao việc gỡ tệp.");
        a.DeletedAt = DateTime.UtcNow; a.DeletedBy = Uc.User.Name; await Db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var (t, err) = await Load(id); if (err is not null) return err;
        var ownDraft = t!.AssigneeUserId == Me && t.Arising && t.ArisingConfirmedAt is null;
        if (!CanManage(t) && !ownDraft) return Denied();
        if (await Db.Tasks.AnyAsync(x => x.ParentId == t.Id)) return Error(409, "Còn việc con: xóa hoặc chuyển việc con trước.");
        Db.Tasks.Remove(t);
        Uc.Log("Xóa công việc", "Công việc", t.Name, "tasks", t.Id);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    /// <summary>Nhắc việc trên trang Điểm danh và Công việc: việc của tôi sắp đến hạn, quá hạn, KPI tạm tính tháng này so với ngưỡng xếp loại tối thiểu;
    /// người quản lý: việc quá hạn của phòng, việc phát sinh chờ xác nhận, việc chờ nghiệm thu, người KPI tạm tính dưới ngưỡng.</summary>
    [HttpGet("nhac")]
    public async Task<IActionResult> Remind()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        await Prepare();
        var k = KpiSettings.Load(Db); var today = DateOnly.FromDateTime(VnTime.Now);
        var open = await Db.Tasks.AsNoTracking().Where(t => t.Status == null || Open.Contains(t.Status) || t.Status == Done && t.Quality == null || t.Arising && t.ArisingConfirmedAt == null && t.Status != Cancelled).ToListAsync();
        var parentIds = open.Where(t => t.ParentId != null).Select(t => t.ParentId!).Distinct().ToList();
        var parents = (await Db.Tasks.AsNoTracking().Where(t => parentIds.Contains(t.Id)).ToListAsync()).ToDictionary(t => t.Id);
        var hasKids = await KpiController.Containers(Db);
        bool IsOpen(ProjectTask t) => Open.Contains(t.Status ?? "Chưa bắt đầu");
        var mine = open.Where(t => IsOpen(t) && t.AssigneeUserId == Me && !hasKids.Contains(t.Id) && t.Due != null).OrderBy(t => t.Due).ToList();
        object Brief(ProjectTask t) => new { t.Id, t.Name, t.Due, assignee = NameOf(t.AssigneeUserId) is { Length: > 0 } n ? n : t.Assignee, late = t.Due < today ? Lateness(t.Due!.Value, today) : 0 };
        var vs = VpSettings.Load(Db);
        int Lateness(DateOnly due, DateOnly to) { var n = 0; for (var d = due.AddDays(1); d <= to; d = d.AddDays(1)) if (VnTime.WorkValue(d, vs) > 0) n++; return n; }
        var overdue = mine.Where(t => t.Due < today).ToList();
        var soon = mine.Where(t => t.Due >= today && t.Due <= today.AddDays(k.RemindDays)).ToList();
        var myPending = open.Count(t => t.AssigneeUserId == Me && t.Arising && t.ArisingConfirmedAt == null && t.Status != Cancelled);

        // KPI tạm tính tháng này (dùng chung cách tính của trang KPI)
        object? kpi = null; var low = new List<object>();
        var month = today.ToString("yyyy-MM");
        if (await new KpiController(Db, Uc).Get(month) is OkObjectResult { Value: not null } res)
        {
            var minName = k.RankMinGrade is { Length: > 0 } rg ? rg : "B";
            var min = k.Grades.FirstOrDefault(g => g.Name == minName)?.Min ?? 0;
            foreach (dynamic r in (System.Collections.IEnumerable)((dynamic)res.Value).rows)
            {
                if ((bool)r.self) kpi = new { total = (decimal)r.total, grade = (string)r.grade, estimate = (bool)r.estimate, target = minName, targetMin = min, work = (decimal?)r.work, missing = r.missing };
                else if ((decimal)r.total < min && !(bool)r.locked && !(bool)r.estimate) low.Add(new { name = (string)r.Name, total = (decimal)r.total, grade = (string)r.grade });
            }
        }
        object? team = null;
        if (Boss || _managed.Count > 0)
        {
            bool Mine2(ProjectTask t) => t.AssigneeUserId != Me && (ManagerOf(t.AssigneeUserId) || (Boss && t.AssigneeUserId != null) || t.AssignedByUserId == Me);
            var tOver = open.Where(t => IsOpen(t) && t.Due < today && !hasKids.Contains(t.Id) && Mine2(t)).OrderBy(t => t.Due).ToList();
            var tConfirm = open.Where(t => CanConfirm(t, t.ParentId is null ? null : parents.GetValueOrDefault(t.ParentId))).ToList();
            var tReview = open.Where(t => PendingReview(t, today, vs) && CanManage(t)).ToList();
            team = new
            {
                overdue = tOver.Count, overdueList = tOver.Take(8).Select(Brief), byPerson = tOver.GroupBy(t => NameOf(t.AssigneeUserId) is { Length: > 0 } n ? n : t.Assignee ?? "").Select(g => new { name = g.Key, n = g.Count() }).OrderByDescending(x => x.n).Take(10),
                confirm = tConfirm.Count, confirmList = tConfirm.Take(8).Select(Brief), review = tReview.Count, lowKpi = low.Take(10)
            };
        }
        return Ok(new { remindDays = k.RemindDays, overdue = overdue.Select(Brief), soon = soon.Select(Brief), openCount = mine.Count, myPending, kpi, team });
    }
}

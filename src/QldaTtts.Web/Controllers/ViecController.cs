using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>
/// Bản 1.10.4: công việc theo dự án → nhiệm vụ → công việc (bảng ProjectTasks dùng chung với tab Công việc của dự án).
/// Giao việc: quyền sửa Công việc, KPI hoặc dự án giao cho mọi người; trưởng phòng giao cho người trong phòng.
/// Việc tự tạo là việc phát sinh: phải chọn nhiệm vụ/công việc đang làm (việc cha, kế thừa dự án), người giao việc cha hoặc trưởng phòng xác nhận mới tính KPI.
/// Gia hạn (dời hạn muộn hơn) giữ hạn ban đầu và đếm số lần; nghiệm thu chấm chất lượng 1–5 sao hoặc mở lại (đếm số lần mở lại).
/// </summary>
[Authorize, Route("api/vp/viec")]
public class ViecController : ApiControllerBase
{
    public ViecController(AppDbContext db, UserContext uc) : base(db, uc) { }

    public static readonly string[] Open = { "Chưa bắt đầu", "Đang thực hiện" };
    private const string Done = "Hoàn thành", Cancelled = "Đã hủy";

    private HashSet<string> _managed = new();
    private Dictionary<string, Employee> _empByUser = new();
    /// <summary>Quyền "cong-viec": xem = xem mọi công việc; sửa = giao việc cho mọi người. Người quản lý KPI, dự án (quyền sửa) cũng giao được.</summary>
    private bool Boss => Uc.IsAdmin || Uc.Can("cong-viec", true) || Uc.Can("kpi", true) || Uc.Can("du-an", true);
    private bool SeeAll => Boss || Uc.Can("cong-viec") || Uc.Can("kpi");
    private string Me => Uc.User!.Id;

    private async Task Prepare()
    {
        _managed = (await Db.Departments.AsNoTracking().Where(d => d.ManagerUserId == Me).Select(d => d.Id).ToListAsync()).ToHashSet();
        _empByUser = (await Db.Employees.AsNoTracking().Where(e => e.UserId != null).ToListAsync()).GroupBy(e => e.UserId!).ToDictionary(g => g.Key, g => g.First());
    }
    private bool ManagerOf(string? userId) => userId is not null && _empByUser.TryGetValue(userId, out var e) && e.DepartmentId is not null && _managed.Contains(e.DepartmentId);
    private bool CanAssignTo(string userId) => Boss || ManagerOf(userId);
    private bool CanManage(ProjectTask t) => Boss || (t.AssignedByUserId == Me && t.AssigneeUserId != Me) || (ManagerOf(t.AssigneeUserId) && t.AssigneeUserId != Me);
    private bool Mine(ProjectTask t) => t.AssigneeUserId == Me || KpiController.CollabIds(t).Contains(Me);
    private bool CanSee(ProjectTask t) => Mine(t) || t.AssignedByUserId == Me || CanManage(t) || (SeeAll && (t.ProjectId is null || Uc.InScope(t.ProjectId)));
    private bool CanConfirm(ProjectTask t, ProjectTask? parent) => t.Arising && t.ArisingConfirmedAt is null && t.Status != Cancelled && t.AssigneeUserId != Me
        && (Boss || ManagerOf(t.AssigneeUserId) || (parent is not null && (parent.AssignedByUserId == Me || parent.AssigneeUserId == Me)));
    private string NameOf(string? userId) => userId is not null && _empByUser.TryGetValue(userId, out var e) ? e.Name : "";

    private object Row(ProjectTask t, Dictionary<string, string> projects, Dictionary<string, ProjectTask> byId, HashSet<string> parents, DateOnly today, int remind)
    {
        byId.TryGetValue(t.ParentId ?? "", out var parent);
        var open = Open.Contains(t.Status ?? "Chưa bắt đầu");
        var col = KpiController.CollabIds(t);
        return new
        {
            t.Id, t.Name, t.ProjectId, projectName = t.ProjectId is not null && projects.TryGetValue(t.ProjectId, out var pn) ? pn : null,
            t.ParentId, parentName = parent?.Name, hasChildren = parents.Contains(t.Id),
            t.AssigneeUserId, assignee = t.AssigneeUserId is not null && NameOf(t.AssigneeUserId) is { Length: > 0 } an ? an : t.Assignee,
            collaborators = col, collabNames = col.Select(NameOf).Where(x => x.Length > 0).ToList(),
            t.AssignedByUserId, assignedBy = NameOf(t.AssignedByUserId),
            level = t.Priority, t.StartDate, t.Due, t.OriginalDue, t.ExtendCount, status = t.Status ?? "Chưa bắt đầu", t.DoneDate, t.Quality, t.ReopenCount,
            t.Arising, arisingConfirmed = t.ArisingConfirmedAt != null, t.Note, fromEwork = t.EworkId != null,
            overdue = open && t.Due < today, dueSoon = open && t.Due >= today && t.Due <= today.AddDays(remind),
            canEdit = CanManage(t) || (t.AssigneeUserId == Me && t.Arising && t.ArisingConfirmedAt is null),
            canWork = open && (t.AssigneeUserId == Me || CanManage(t)),
            canReview = CanManage(t) && t.Status == Done,
            canConfirm = CanConfirm(t, parent)
        };
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? scope, [FromQuery] string? status, [FromQuery] string? project, [FromQuery] string? q, [FromQuery] string? month)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        await Prepare();
        var k = KpiSettings.Load(Db); var today = DateOnly.FromDateTime(VnTime.Now);
        var all = await Db.Tasks.AsNoTracking().ToListAsync();
        var byId = all.ToDictionary(t => t.Id);
        var parents = all.Where(t => t.ParentId != null).Select(t => t.ParentId!).ToHashSet();
        var projects = await Db.Projects.AsNoTracking().ToDictionaryAsync(p => p.Id, p => p.Name);
        scope = scope is "dept" or "all" or "giao" ? scope : "my";
        IEnumerable<ProjectTask> list = scope switch
        {
            "my" => all.Where(Mine),
            "giao" => all.Where(t => t.AssignedByUserId == Me && t.AssigneeUserId != Me),
            "dept" => all.Where(t => (ManagerOf(t.AssigneeUserId) || (Boss && t.AssigneeUserId != null)) && t.AssigneeUserId != Me),
            _ => all.Where(CanSee)
        };
        if (scope == "all" && !SeeAll) list = list.Where(CanSee);
        list = (status ?? "open") switch
        {
            "open" => list.Where(t => Open.Contains(t.Status ?? "Chưa bắt đầu")),
            "overdue" => list.Where(t => Open.Contains(t.Status ?? "Chưa bắt đầu") && t.Due < today),
            "confirm" => list.Where(t => t.Arising && t.ArisingConfirmedAt == null && t.Status != Cancelled),
            "review" => list.Where(t => t.Status == Done && t.Quality == null && CanManage(t)),
            "done" => list.Where(t => t.Status == Done),
            _ => list
        };
        if (!string.IsNullOrEmpty(project)) list = project == "-" ? list.Where(t => t.ProjectId == null) : list.Where(t => t.ProjectId == project);
        if (!string.IsNullOrEmpty(month) && DateOnly.TryParse(month + "-01", out var mf))
        { var mt = mf.AddMonths(1); list = list.Where(t => (t.Due >= mf && t.Due < mt) || (t.DoneDate >= mf && t.DoneDate < mt)); }
        if (!string.IsNullOrWhiteSpace(q)) { var nq = KpiController.Norm(q); list = list.Where(t => KpiController.Norm(t.Name).Contains(nq) || KpiController.Norm(t.Assignee).Contains(nq)); }
        var rows = list.OrderBy(t => Open.Contains(t.Status ?? "Chưa bắt đầu") ? 0 : 1).ThenBy(t => t.Due ?? DateOnly.MaxValue).Take(1000)
            .Select(t => Row(t, projects, byId, parents, today, k.RemindDays)).ToList();
        // việc cha có thể chọn khi tạo việc phát sinh: nhiệm vụ, công việc đang mở của tôi hoặc trong phạm vi
        var parentOpts = all.Where(t => Open.Contains(t.Status ?? "Chưa bắt đầu") && (Mine(t) || CanManage(t) || (t.AssigneeUserId == null && (t.ProjectId == null || Uc.InScope(t.ProjectId)))))
            .OrderBy(t => t.ProjectId is null ? "" : projects.GetValueOrDefault(t.ProjectId, "")).ThenBy(t => t.Name).Take(400)
            .Select(t => new { t.Id, t.Name, t.ProjectId, projectName = t.ProjectId is null ? null : projects.GetValueOrDefault(t.ProjectId) }).ToList();
        return Ok(new
        {
            scope, rows, total = rows.Count, parents = parentOpts, levels = k.Levels.Select(l => l.Name),
            projects = projects.Where(p => Uc.InScope(p.Key)).OrderBy(p => p.Value).Select(p => new { id = p.Key, name = p.Value }),
            perms = new { boss = Boss, seeAll = SeeAll, managed = _managed, assignable = Boss ? null : _empByUser.Values.Where(e => e.DepartmentId != null && _managed.Contains(e.DepartmentId)).Select(e => e.UserId).ToList() }
        });
    }

    public record TaskBody(string? Name, string? Note, string? ProjectId, string? ParentId, string? AssigneeUserId, List<string>? Collaborators, string? Level,
        DateOnly? StartDate, DateOnly? Due, bool Correct = false);

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
        if (self && parent is null) return Error(400, "Việc tự tạo là việc phát sinh: chọn nhiệm vụ hoặc công việc đang làm mà việc này phát sinh từ đó.");
        var projectId = parent?.ProjectId ?? (string.IsNullOrEmpty(b.ProjectId) ? null : b.ProjectId);
        if (projectId is not null && (!await Db.Projects.AnyAsync(p => p.Id == projectId) || !Uc.InScope(projectId))) return Error(400, "Dự án không hợp lệ hoặc ngoài phạm vi được giao.");
        var t = new ProjectTask
        {
            Id = "cv-" + Guid.NewGuid().ToString("N")[..20], Name = name.Length > 500 ? name[..500] : name, Note = b.Note?.Trim(), ProjectId = projectId, ParentId = parent?.Id,
            AssigneeUserId = assignee, Assignee = NameOf(assignee), Collaborators = Collab(b.Collaborators, assignee), AssignedByUserId = Me,
            Priority = string.IsNullOrWhiteSpace(b.Level) ? KpiSettings.Load(Db).Levels.FirstOrDefault()?.Name : b.Level.Trim(), StartDate = b.StartDate ?? DateOnly.FromDateTime(VnTime.Now), Due = b.Due,
            Status = "Chưa bắt đầu", Arising = self, UpdatedAt = DateTime.UtcNow, UpdatedBy = Uc.User.Username
        };
        Db.Tasks.Add(t);
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
        if (!string.IsNullOrEmpty(b.AssigneeUserId) && b.AssigneeUserId != t.AssigneeUserId)
        {
            if (!CanAssignTo(b.AssigneeUserId) || !_empByUser.ContainsKey(b.AssigneeUserId)) return Denied("Không giao được cho người này.");
            t.AssigneeUserId = b.AssigneeUserId; t.Assignee = NameOf(b.AssigneeUserId); t.Collaborators = Collab(KpiController.CollabIds(t), t.AssigneeUserId);
        }
        if (b.ParentId is not null && b.ParentId != (t.ParentId ?? ""))
        {
            var (parent, perr) = await CheckParent(b.ParentId, t.Id); if (perr is not null) return Error(400, perr);
            if (parent is null && t.Arising) return Error(400, "Việc phát sinh phải có việc cha.");
            t.ParentId = parent?.Id; if (parent is not null) t.ProjectId = parent.ProjectId;
        }
        if (t.ParentId is null && b.ProjectId is not null)
        {
            var pid = b.ProjectId.Length == 0 ? null : b.ProjectId;
            if (pid is not null && (!await Db.Projects.AnyAsync(p => p.Id == pid) || !Uc.InScope(pid))) return Error(400, "Dự án không hợp lệ.");
            t.ProjectId = pid;
        }
        if (b.Due is { } nd && nd != t.Due)
        {
            if (t.StartDate is { } s0 && s0 > nd) return Error(400, "Hạn trước ngày bắt đầu.");
            // dời hạn muộn hơn khi việc đã giao (không phải sửa nhầm) là gia hạn
            if (t.Due is { } od && nd > od && !ownDraft && !(b.Correct && Boss)) { t.OriginalDue ??= od; t.ExtendCount++; }
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
        var st = b.Status ?? "";
        if (st is not ("Chưa bắt đầu" or "Đang thực hiện" or "Tạm dừng" or Done)) return Error(400, "Trạng thái không hợp lệ.");
        if (t.Status == Cancelled) return Error(409, "Việc đã hủy.");
        if (st == "Tạm dừng" && !CanManage(t)) return Denied("Tạm dừng việc do người giao việc quyết định.");
        var today = DateOnly.FromDateTime(VnTime.Now);
        if (st == Done)
        {
            if (parentHasOpenChildren(t.Id)) return Error(409, "Còn việc con chưa xong.");
            var dd = b.DoneDate ?? today; if (dd > today) return Error(400, "Ngày hoàn thành không được sau hôm nay.");
            t.DoneDate = dd;
            if (!string.IsNullOrWhiteSpace(b.Result)) t.Note = string.Join("\n", new[] { t.Note, $"Kết quả ({dd:dd/MM/yyyy}): {b.Result.Trim()}" }.Where(x => !string.IsNullOrEmpty(x)));
        }
        else t.DoneDate = null;
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
        var line = b.Note?.Trim();
        if (b.Reopen)
        {
            t.Status = "Đang thực hiện"; t.DoneDate = null; t.Quality = null; t.ReopenCount++;
            if (b.NewDue is { } nd) t.Due = nd;
            line = $"Mở lại lần {t.ReopenCount} ({VnTime.Now:dd/MM/yyyy}){(string.IsNullOrEmpty(line) ? "" : ": " + line)}";
        }
        else
        {
            if (b.Quality is not (>= 1 and <= 5)) return Error(400, "Chấm chất lượng từ 1 đến 5 sao.");
            t.Quality = b.Quality;
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
        if (b.Accept) { t.ArisingConfirmedAt = DateTime.UtcNow; t.AssignedByUserId = Me; }
        else { t.Status = Cancelled; t.Note = string.Join("\n", new[] { t.Note, $"Không xác nhận việc phát sinh ({VnTime.Now:dd/MM/yyyy}){(string.IsNullOrWhiteSpace(b.Note) ? "" : ": " + b.Note.Trim())}" }.Where(x => !string.IsNullOrEmpty(x))); }
        Touch(t);
        Uc.Log(b.Accept ? "Xác nhận việc phát sinh" : "Không xác nhận việc phát sinh", "Công việc", t.Name, "tasks", t.Id);
        await Db.SaveChangesAsync();
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
            var tReview = open.Where(t => t.Status == Done && t.Quality == null && CanManage(t) && t.DoneDate >= today.AddDays(-45)).ToList();
            team = new
            {
                overdue = tOver.Count, overdueList = tOver.Take(8).Select(Brief), byPerson = tOver.GroupBy(t => NameOf(t.AssigneeUserId) is { Length: > 0 } n ? n : t.Assignee ?? "").Select(g => new { name = g.Key, n = g.Count() }).OrderByDescending(x => x.n).Take(10),
                confirm = tConfirm.Count, confirmList = tConfirm.Take(8).Select(Brief), review = tReview.Count, lowKpi = low.Take(10)
            };
        }
        return Ok(new { remindDays = k.RemindDays, overdue = overdue.Select(Brief), soon = soon.Select(Brief), openCount = mine.Count, myPending, kpi, team });
    }
}

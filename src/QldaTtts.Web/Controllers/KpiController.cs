using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Thiết lập KPI (bảng Settings, khóa "kpi"): trọng số bốn nhóm, cách trừ chuyên cần, ngưỡng xếp loại và mức thưởng.</summary>
public class KpiSettings
{
    public decimal WWork { get; set; } = 40;
    public decimal WProject { get; set; } = 20;
    public decimal WAttendance { get; set; } = 10;
    public decimal WManager { get; set; } = 30;
    /// <summary>Điểm chuyên cần (thang 100) trừ mỗi lần đi muộn, về sớm, quên điểm danh ra, mỗi ngày nghỉ không lý do.</summary>
    public decimal PenLate { get; set; } = 5;
    public decimal PenEarly { get; set; } = 5;
    public decimal PenNoOut { get; set; } = 2;
    public decimal PenAbsent { get; set; } = 20;
    /// <summary>Đi muộn không quá số phút này không bị trừ (phút ân hạn).</summary>
    public int GraceMinutes { get; set; } = 5;
    public class GradeRule { public string Name { get; set; } = ""; public decimal Min { get; set; } public decimal Bonus { get; set; } }
    public List<GradeRule> Grades { get; set; } = new()
    {
        new() { Name = "A", Min = 90, Bonus = 1000000 }, new() { Name = "B", Min = 75, Bonus = 500000 },
        new() { Name = "C", Min = 60, Bonus = 0 }, new() { Name = "D", Min = 0, Bonus = 0 }
    };

    /// <summary>Bản 1.10.4: thưởng theo hạng trong nhóm như e-work: mỗi phòng ban xếp hạng theo điểm KPI, hạng 1, 2… nhận mức thưởng của bảng
    /// có tháng áp dụng gần nhất; phải đạt xếp loại tối thiểu. Cộng với thưởng theo xếp loại (đặt thưởng xếp loại = 0 nếu chỉ thưởng theo hạng).</summary>
    public bool RankOn { get; set; }
    public string RankMinGrade { get; set; } = "B";
    public class RankTable { public string From { get; set; } = ""; public List<decimal> Amounts { get; set; } = new(); }
    public List<RankTable> RankTables { get; set; } = new();
    public decimal RankBonus(string month, int rank)
    {
        var tb = RankTables.Where(x => string.CompareOrdinal(x.From, month) <= 0).OrderByDescending(x => x.From).FirstOrDefault();
        return tb is not null && rank >= 1 && rank <= tb.Amounts.Count ? tb.Amounts[rank - 1] : 0;
    }

    /// <summary>Bản 1.10.4: cách tính điểm công việc (thiết lập được). Mỗi việc: hệ số mức độ × hệ số đúng hạn × hệ số chất lượng × (1 − trừ mở lại − trừ gia hạn);
    /// người phối hợp tính hệ số mức độ × CollabFactor. Điểm = 100 × tổng được / tổng hệ số mức độ. Nhiệm vụ đã chia việc con không tính, chỉ tính việc con (việc phát sinh không làm mất việc cha).</summary>
    public class LevelRule { public string Name { get; set; } = ""; public decimal Weight { get; set; } = 1; }
    public List<LevelRule> Levels { get; set; } = new() { new() { Name = "Bình thường", Weight = 1 }, new() { Name = "Quan trọng", Weight = 1.5m }, new() { Name = "Khẩn cấp", Weight = 2 } };
    public class LateStep { public int Days { get; set; } public decimal Factor { get; set; } }
    /// <summary>Trễ không quá Days ngày làm việc thì nhân Factor; quá bậc cuối thì nhân LateOver.</summary>
    public List<LateStep> LateSteps { get; set; } = new() { new() { Days = 0, Factor = 1 }, new() { Days = 1, Factor = 0.75m }, new() { Days = 3, Factor = 0.5m } };
    public decimal LateOver { get; set; } = 0;
    /// <summary>Hệ số theo nghiệm thu 1–5 sao (chưa nghiệm thu: 1).</summary>
    public List<decimal> QualityFactors { get; set; } = new() { 0.25m, 0.5m, 0.75m, 0.9m, 1m };
    public decimal ReopenPenalty { get; set; } = 0.2m;
    public decimal ExtendPenalty { get; set; } = 0.1m;
    public decimal CollabFactor { get; set; } = 0.3m;
    /// <summary>Nhắc việc: số ngày trước hạn bắt đầu nhắc.</summary>
    public int RemindDays { get; set; } = 2;

    public decimal LevelWeight(string? level)
    {
        var l = (level ?? "").Trim();
        var r = Levels.FirstOrDefault(x => string.Equals(x.Name, l, StringComparison.OrdinalIgnoreCase));
        if (r is not null) return r.Weight;
        // mức ưu tiên cũ của công việc dự án
        return l switch { "Cao" => Levels.ElementAtOrDefault(1)?.Weight ?? 1.5m, "Thấp" => 0.5m, _ => Levels.FirstOrDefault()?.Weight ?? 1m };
    }
    public decimal LateFactor(int lateDays)
    {
        foreach (var st in LateSteps.OrderBy(x => x.Days)) if (lateDays <= st.Days) return st.Factor;
        return LateOver;
    }
    public decimal QualityFactor(int? q) => q is int v && v >= 1 && v <= QualityFactors.Count ? QualityFactors[v - 1] : 1m;

    public const string Key = "kpi";
    private static readonly JsonSerializerOptions Opts = new(JsonSerializerDefaults.Web);
    public static KpiSettings Load(AppDbContext db)
    {
        var s = db.Settings.AsNoTracking().FirstOrDefault(x => x.Key == Key)?.Value;
        if (string.IsNullOrEmpty(s)) return new KpiSettings();
        try { return JsonSerializer.Deserialize<KpiSettings>(s, Opts) ?? new KpiSettings(); } catch { return new KpiSettings(); }
    }
    public void Save(AppDbContext db, string by)
    {
        var row = db.Settings.FirstOrDefault(x => x.Key == Key); var json = JsonSerializer.Serialize(this, Opts);
        if (row is null) db.Settings.Add(new AppSetting { Key = Key, Value = json, UpdatedAt = DateTime.UtcNow, UpdatedBy = by });
        else { row.Value = json; row.UpdatedAt = DateTime.UtcNow; row.UpdatedBy = by; }
    }
    public string GradeOf(decimal total) => Grades.OrderByDescending(g => g.Min).FirstOrDefault(g => total >= g.Min)?.Name ?? "";
}

/// <summary>
/// Bản 1.10: KPI tháng, thang 100 điểm = công việc × trọng số + kết quả dự án × trọng số + chuyên cần × trọng số + đánh giá quản lý × trọng số.
/// Công việc: tỷ lệ việc hoàn thành có tính mức ưu tiên (Cao 1,5; Trung bình 1; Thấp 0,5) và trễ hạn theo bậc (trễ đến 1 ngày làm việc còn 75%, đến 3 ngày còn 50%, quá 3 ngày 0).
/// Chuyên cần: 100 trừ theo lần đi muộn (quá phút ân hạn), về sớm, quên điểm danh ra, ngày nghỉ không lý do. Đánh giá quản lý: 1–5 sao quy ra 20–100.
/// Quyền: "kpi" (xem: toàn công ty; sửa: chấm mọi người, chốt tháng, thiết lập); trưởng phòng chấm người trong phòng (không tự chấm mình); mọi người xem phiếu của mình và phản hồi trước khi chốt.
/// </summary>
[Authorize, Route("api/vp")]
public class KpiController : ApiControllerBase
{
    public KpiController(AppDbContext db, UserContext uc) : base(db, uc) { }

    private async Task<HashSet<string>> ManagedDepts() => Uc.User is null ? new() :
        (await Db.Departments.AsNoTracking().Where(d => d.ManagerUserId == Uc.User.Id).Select(d => d.Id).ToListAsync()).ToHashSet();
    public static string Norm(string? s) => System.Text.RegularExpressions.Regex.Replace((s ?? "").Normalize(System.Text.NormalizationForm.FormC).Trim().ToLowerInvariant(), @"\s+", " ");

    public record WorkDetail(int Total, int OnTime, int Late, int Overdue, decimal Score, int Collab = 0);

    public static bool IsDone(ProjectTask t) => t.Status == "Hoàn thành";
    /// <summary>Việc được tính KPI: không phải nhiệm vụ có việc con, chưa hủy, việc phát sinh đã được xác nhận.</summary>
    public static bool Countable(ProjectTask t, HashSet<string> parents) => t.Due != null && !parents.Contains(t.Id) && t.Status != "Đã hủy" && t.Status != "Tạm dừng" && (!t.Arising || t.ArisingConfirmedAt != null);
    public static List<string> CollabIds(ProjectTask t) => (t.Collaborators ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

    /// <summary>Người phụ trách của việc: theo tài khoản (việc giao trên Văn phòng, chuyển từ e-work), không có thì theo họ tên, tên đăng nhập ghi ở công việc dự án.</summary>
    public static bool IsAssignee(ProjectTask t, Employee e, string? username)
    {
        if (t.AssigneeUserId is not null) return e.UserId is not null && t.AssigneeUserId == e.UserId;
        var name = Norm(e.Name); var un = Norm(username); var a = Norm(t.Assignee);
        return a.Length > 0 && (a == name || a == un || a.Split(new[] { ',', ';' }).Select(x => x.Trim()).Any(x => x == name || (un.Length > 0 && x == un)));
    }

    /// <summary>Điểm công việc của tháng: việc có hạn hoặc ngày xong rơi vào tháng; việc chưa đến hạn chưa tính.</summary>
    public static WorkDetail? WorkOf(Employee e, string? username, List<ProjectTask> tasks, HashSet<string> parents, DateOnly from, DateOnly to, VpSettings vs, KpiSettings k, DateOnly? asOf = null)
    {
        var today = asOf ?? DateOnly.FromDateTime(VnTime.Now);
        decimal sw = 0, got = 0; int onTime = 0, late = 0, overdue = 0, n = 0, collab = 0;
        foreach (var t in tasks)
        {
            if (!Countable(t, parents)) continue;
            var mineMain = IsAssignee(t, e, username);
            var mineCo = !mineMain && e.UserId is not null && CollabIds(t).Contains(e.UserId);
            if (!mineMain && !mineCo) continue;
            var d = t.Due!.Value;
            if (!((d >= from && d < to) || (t.DoneDate is { } dd && dd >= from && dd < to))) continue;
            var done = IsDone(t);
            if (!done && d >= today) continue; // chưa đến hạn: chưa tính
            var w = k.LevelWeight(t.Priority) * (mineCo ? k.CollabFactor : 1m); if (w <= 0) continue;
            sw += w; n++; if (mineCo) collab++;
            if (!done) { overdue++; continue; }
            var fin = t.DoneDate ?? today; var lateDays = 0;
            for (var x = d.AddDays(1); x <= fin; x = x.AddDays(1)) if (VnTime.WorkValue(x, vs) > 0) lateDays++;
            if (lateDays == 0) onTime++; else late++;
            var c = k.LateFactor(lateDays) * k.QualityFactor(t.Quality) * Math.Max(0m, 1m - t.ReopenCount * k.ReopenPenalty - t.ExtendCount * k.ExtendPenalty);
            got += w * c;
        }
        return n == 0 ? null : new WorkDetail(n, onTime, late, overdue, Math.Round(100 * got / sw, 1, MidpointRounding.AwayFromZero), collab);
    }

    /// <summary>Nhiệm vụ đã chia thành việc con (do người giao chia, không tính việc phát sinh): KPI tính theo việc con, không tính chính nhiệm vụ.</summary>
    public static async Task<HashSet<string>> Containers(AppDbContext db) =>
        (await db.Tasks.AsNoTracking().Where(t => t.ParentId != null && !t.Arising).Select(t => t.ParentId!).Distinct().ToListAsync()).ToHashSet();

    /// <summary>Công việc cần để tính KPI của khoảng tháng (kèm danh sách nhiệm vụ có việc con).</summary>
    public static async Task<(List<ProjectTask> tasks, HashSet<string> parents)> TasksFor(AppDbContext db, DateOnly from, DateOnly to)
    {
        var tasks = await db.Tasks.AsNoTracking().Where(t => t.Due != null && ((t.Due >= from && t.Due < to) || (t.DoneDate >= from && t.DoneDate < to))).ToListAsync();
        return (tasks, await Containers(db));
    }

    private static decimal AttendanceOf(VpCalc.Row r, List<Attendance> atts, KpiSettings k)
    {
        var late = atts.Count(a => a.LateMinutes > k.GraceMinutes);
        var v = 100 - late * k.PenLate - r.Early * k.PenEarly - r.NoOut * k.PenNoOut - r.Absent * k.PenAbsent;
        return Math.Max(0, Math.Min(100, v));
    }

    [HttpGet("kpi")]
    public async Task<IActionResult> Get([FromQuery] string month)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!DateOnly.TryParse(month + "-01", out var from)) return Error(400, "Tháng không hợp lệ.");
        var to = from.AddMonths(1);
        var k = KpiSettings.Load(Db); var vs = VpSettings.Load(Db);
        var depts = await ManagedDepts(); var all = Uc.Can("kpi"); var edit = Uc.Can("kpi", true);
        // Tính cho mọi người (để xếp hạng trong phòng), trả về phần được xem
        var emps = await Db.Employees.AsNoTracking().Where(e => e.Status != "Nghỉ việc" || e.UpdatedAt >= from.ToDateTime(TimeOnly.MinValue)).OrderBy(e => e.Name).ToListAsync();
        bool Visible(Employee e) => all || e.UserId == Uc.User.Id || (e.DepartmentId != null && depts.Contains(e.DepartmentId));
        var deptNames = await Db.Departments.AsNoTracking().ToDictionaryAsync(d => d.Id, d => d.Name);
        var sheets = await Db.KpiSheets.AsNoTracking().Where(x => x.Month == month).ToDictionaryAsync(x => x.EmployeeId);
        var (_, stats) = await VpCalc.Month(Db, vs, emps, from);
        var atts = (await Db.Attendances.AsNoTracking().Where(a => a.Date >= from && a.Date < to).ToListAsync()).GroupBy(a => a.EmployeeId).ToDictionary(g => g.Key, g => g.ToList());
        var (tasks, parents) = await TasksFor(Db, from, to);
        var users = await Db.Users.AsNoTracking().ToDictionaryAsync(u => u.Id, u => u.Username);
        // Hạng trong phòng (tạm tính khi chưa chốt; đã chốt thì dùng hạng lưu cố định)
        var minG = k.Grades.FirstOrDefault(g => g.Name == k.RankMinGrade)?.Min ?? 0;
        var pre = emps.Select(e =>
        {
            sheets.TryGetValue(e.Id, out var sh);
            if (sh?.LockedAt != null) return (e, total: sh.Total ?? 0m);
            var st = stats.First(x => x.EmployeeId == e.Id);
            var wd = WorkOf(e, e.UserId != null && users.TryGetValue(e.UserId, out var un) ? un : null, tasks, parents, from, to, vs, k);
            var att = e.Attendance ? AttendanceOf(st, atts.TryGetValue(e.Id, out var l) ? l : new(), k) : (decimal?)null;
            return (e, total: Total(k, sh?.WorkScore ?? wd?.Score, sh?.ProjectScore, att, sh?.ManagerRating is { } mr ? mr * 20m : null));
        }).ToList();
        var rankOf = new Dictionary<string, int>();
        if (k.RankOn)
            foreach (var g in pre.Where(x => x.e.DepartmentId != null && x.total > 0 && x.total >= minG).GroupBy(x => x.e.DepartmentId!))
            {
                int rank = 0; decimal? prev = null; int i = 0;
                foreach (var x in g.OrderByDescending(x => x.total)) { i++; if (prev != x.total) rank = i; prev = x.total; rankOf[x.e.Id] = rank; } // bằng điểm thì cùng hạng
            }
        var rows = emps.Where(Visible).Select(e =>
        {
            sheets.TryGetValue(e.Id, out var sh); var locked = sh?.LockedAt != null;
            var st = stats.First(x => x.EmployeeId == e.Id);
            var wd = WorkOf(e, e.UserId != null && users.TryGetValue(e.UserId, out var un) ? un : null, tasks, parents, from, to, vs, k);
            var work = locked ? sh!.WorkFinal : sh?.WorkScore ?? wd?.Score;
            var att = locked ? sh!.AttendanceFinal : e.Attendance ? AttendanceOf(st, atts.TryGetValue(e.Id, out var l) ? l : new(), k) : (decimal?)null;
            var mgr = sh?.ManagerRating is { } mr ? mr * 20m : (decimal?)null;
            var total = locked ? sh!.Total ?? 0 : Total(k, work, sh?.ProjectScore, att, mgr);
            var missing = new List<string>();
            if (work is null) missing.Add("Công việc"); if (sh?.ProjectScore is null) missing.Add("Kết quả dự án"); if (sh?.ManagerRating is null) missing.Add("Đánh giá quản lý");
            var canRate = !locked && e.UserId != Uc.User.Id && (edit || (e.DepartmentId != null && depts.Contains(e.DepartmentId)));
            return new
            {
                employeeId = e.Id, e.Name, e.DepartmentId, work, workAuto = wd, workOverride = sh?.WorkScore, project = sh?.ProjectScore, attendance = att,
                attDetail = new { st.Late, st.LateMinutes, st.Early, st.NoOut, st.Absent, st.Worked, st.Standard },
                rating = sh?.ManagerRating, ratingNote = sh?.ManagerNote, ratedBy = sh?.RatedBy, employeeNote = sh?.EmployeeNote,
                total, grade = locked ? sh!.Grade : k.GradeOf(total), bonus = k.Grades.FirstOrDefault(g => g.Name == (locked ? sh!.Grade : k.GradeOf(total)))?.Bonus ?? 0,
                rank = locked ? sh!.Rank : rankOf.TryGetValue(e.Id, out var rk) ? rk : (int?)null,
                rankBonus = locked ? sh!.RankBonus ?? 0 : rankOf.TryGetValue(e.Id, out var rk2) ? k.RankBonus(month, rk2) : 0,
                rankLabel = (locked ? sh!.Rank : rankOf.TryGetValue(e.Id, out var rk3) ? rk3 : (int?)null) is int rr && (locked ? sh!.RankBonus ?? 0 : k.RankBonus(month, rr)) > 0
                    ? $"{(e.DepartmentId != null && deptNames.TryGetValue(e.DepartmentId, out var dn) ? dn : "")} - Hạng {rr}" : null,
                missing, locked, lockedAt = sh?.LockedAt, canRate, self = e.UserId == Uc.User.Id
            };
        }).ToList();
        return Ok(new { month, settings = k, canEdit = edit, rows });
    }

    private static decimal Total(KpiSettings k, decimal? work, decimal? project, decimal? att, decimal? mgr)
    {
        // Người không điểm danh: phần chuyên cần chia đều cho ba nhóm còn lại để vẫn đủ thang 100
        decimal ww = k.WWork, wp = k.WProject, wa = k.WAttendance, wm = k.WManager;
        if (att is null && ww + wp + wm > 0) { var f = (ww + wp + wa + wm) / (ww + wp + wm); ww *= f; wp *= f; wm *= f; wa = 0; }
        var sum = ww + wp + wa + wm; if (sum <= 0) return 0;
        return Math.Round(((work ?? 0) * ww + (project ?? 0) * wp + (att ?? 0) * wa + (mgr ?? 0) * wm) / sum, 1);
    }

    public record RateBody(decimal? WorkScore, bool ClearWork, decimal? ProjectScore, int? Rating, string? Note);

    /// <summary>Quản lý chấm: điểm kết quả dự án, đánh giá 1–5 sao, ghi đè điểm công việc (kèm lý do).</summary>
    [HttpPut("kpi/{month}/{employeeId}")]
    public async Task<IActionResult> Rate(string month, string employeeId, [FromBody] RateBody b)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!DateOnly.TryParse(month + "-01", out _) || !ValidId(employeeId)) return Error(400, "Tháng không hợp lệ.");
        var e = await Db.Employees.AsNoTracking().FirstOrDefaultAsync(x => x.Id == employeeId); if (e is null) return NotFound();
        if (e.UserId == Uc.User.Id) return Denied("Không tự chấm KPI của mình.");
        if (!Uc.Can("kpi", true) && !(e.DepartmentId != null && (await ManagedDepts()).Contains(e.DepartmentId))) return Denied("Chỉ trưởng phòng hoặc người quản lý KPI được chấm.");
        if (b.Rating is < 1 or > 5 || b.ProjectScore is < 0 or > 100 || b.WorkScore is < 0 or > 100) return Error(400, "Điểm ngoài thang (dự án, công việc 0–100; đánh giá 1–5).");
        var sh = await Sheet(month, employeeId);
        if (sh.LockedAt != null) return Error(409, "KPI tháng này đã chốt.");
        if (b.ProjectScore is not null) sh.ProjectScore = b.ProjectScore;
        if (b.Rating is not null) { sh.ManagerRating = b.Rating; sh.RatedBy = Uc.User.Name; }
        if (b.ClearWork) sh.WorkScore = null; else if (b.WorkScore is not null) sh.WorkScore = b.WorkScore;
        if (b.Note is not null) sh.ManagerNote = b.Note.Trim();
        sh.UpdatedAt = DateTime.UtcNow; sh.UpdatedBy = Uc.User.Username;
        Uc.Log("Chấm KPI", "KPI", $"{e.Name} tháng {month}", "kpi", sh.Id);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    private async Task<KpiSheet> Sheet(string month, string employeeId)
    {
        var sh = await Db.KpiSheets.FirstOrDefaultAsync(x => x.Month == month && x.EmployeeId == employeeId);
        if (sh is null) { sh = new KpiSheet { Id = "kpi-" + Guid.NewGuid().ToString("N")[..20], Month = month, EmployeeId = employeeId }; Db.KpiSheets.Add(sh); }
        return sh;
    }

    public record NoteBody(string? Note);

    /// <summary>Người được đánh giá phản hồi, khiếu nại phiếu KPI của mình trước khi chốt.</summary>
    [HttpPost("kpi/{month}/phan-hoi")]
    public async Task<IActionResult> Feedback(string month, [FromBody] NoteBody b)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var e = await Db.Employees.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == Uc.User.Id); if (e is null) return Denied("Tài khoản chưa gắn hồ sơ nhân sự.");
        if (!DateOnly.TryParse(month + "-01", out _)) return Error(400, "Tháng không hợp lệ.");
        var sh = await Sheet(month, e.Id); if (sh.LockedAt != null) return Error(409, "KPI tháng này đã chốt.");
        sh.EmployeeNote = (b.Note ?? "").Trim(); sh.UpdatedAt = DateTime.UtcNow; sh.UpdatedBy = Uc.User.Username;
        Uc.Log("Phản hồi KPI", "KPI", $"{e.Name} tháng {month}", "kpi", sh.Id);
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    public record LockBody(bool Lock);

    /// <summary>Chốt (lưu cố định điểm, xếp loại để tính thưởng) hoặc mở chốt KPI tháng.</summary>
    [HttpPost("kpi/{month}/chot")]
    public async Task<IActionResult> Lock(string month, [FromBody] LockBody b)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("kpi", true)) return Denied("Chỉ người quản lý KPI được chốt.");
        var res = await Get(month) as OkObjectResult; if (res?.Value is null) return Error(400, "Tháng không hợp lệ.");
        var rows = ((dynamic)res.Value).rows as System.Collections.IEnumerable;
        var n = 0;
        foreach (dynamic r in rows!)
        {
            var sh = await Sheet(month, (string)r.employeeId);
            if (b.Lock && sh.LockedAt == null)
            { sh.WorkFinal = r.work; sh.AttendanceFinal = r.attendance; sh.Total = r.total; sh.Grade = r.grade; sh.Rank = r.rank; sh.RankBonus = r.rankBonus; sh.LockedAt = DateTime.UtcNow; sh.LockedBy = Uc.User.Name; n++; }
            else if (!b.Lock && sh.LockedAt != null) { sh.LockedAt = null; sh.LockedBy = null; n++; }
        }
        Uc.Log(b.Lock ? "Chốt KPI tháng" : "Mở chốt KPI tháng", "KPI", $"Tháng {month}: {n} người");
        await Db.SaveChangesAsync();
        return Ok(new { ok = true, n });
    }

    [HttpGet("kpi-settings")]
    public async Task<IActionResult> GetSettings()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        return Ok(KpiSettings.Load(Db));
    }

    [HttpPut("kpi-settings")]
    public async Task<IActionResult> PutSettings([FromBody] KpiSettings k)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("kpi", true)) return Denied();
        if (k.WWork + k.WProject + k.WAttendance + k.WManager != 100) return Error(400, "Tổng trọng số bốn nhóm phải bằng 100.");
        if (k.Grades.Count == 0 || k.Grades.Any(g => string.IsNullOrWhiteSpace(g.Name))) return Error(400, "Nhập ngưỡng xếp loại.");
        k.Grades = k.Grades.OrderByDescending(g => g.Min).ToList();
        if (k.RankTables.Any(x => !System.Text.RegularExpressions.Regex.IsMatch(x.From ?? "", @"^\d{4}-\d{2}$") || x.Amounts.Any(a => a < 0))) return Error(400, "Bảng thưởng theo hạng: tháng áp dụng dạng 2026-05, số tiền không âm.");
        k.Levels = k.Levels.Where(x => !string.IsNullOrWhiteSpace(x.Name)).Select(x => new KpiSettings.LevelRule { Name = x.Name.Trim(), Weight = x.Weight }).ToList();
        if (k.Levels.Count == 0 || k.Levels.Any(x => x.Weight < 0 || x.Weight > 10)) return Error(400, "Mức độ công việc: cần ít nhất một mức, hệ số từ 0 đến 10.");
        if (k.LateSteps.Any(x => x.Days < 0 || x.Factor < 0 || x.Factor > 1) || k.LateOver is < 0 or > 1) return Error(400, "Hệ số trễ hạn từ 0 đến 1, số ngày không âm.");
        k.LateSteps = k.LateSteps.OrderBy(x => x.Days).ToList();
        if (k.QualityFactors.Count != 5 || k.QualityFactors.Any(x => x < 0 || x > 1.5m)) return Error(400, "Hệ số chất lượng: đủ 5 mức (1–5 sao), từ 0 đến 1,5.");
        if (k.ReopenPenalty is < 0 or > 1 || k.ExtendPenalty is < 0 or > 1 || k.CollabFactor is < 0 or > 1 || k.RemindDays is < 0 or > 30) return Error(400, "Hệ số trừ, hệ số phối hợp từ 0 đến 1; nhắc trước 0–30 ngày.");
        k.Save(Db, Uc.User.Username);
        Uc.Log("Cập nhật thiết lập KPI", "KPI", $"Trọng số {k.WWork}/{k.WProject}/{k.WAttendance}/{k.WManager}");
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }
}

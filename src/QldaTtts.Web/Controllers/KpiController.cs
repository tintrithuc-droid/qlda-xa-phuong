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
    /// <summary>Bản 1.10.16 (anh Trí 25/11): KPI tự động hoàn toàn, không ai chấm tay: chỉ công việc + chuyên cần; tháng không có việc thì chỉ tính chuyên cần.</summary>
    public bool Auto { get; set; }
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
    /// <summary>Bản 1.10.16 (anh Trí 25/11): xếp hạng chung toàn công ty (không chia phòng) và chỉ RankTop người đứng đầu được thưởng (0 = theo bảng).</summary>
    public bool RankCompany { get; set; }
    /// <summary>Bản 1.10.16 (anh Trí 25/11): công khai điểm KPI, xếp loại, hạng cho mọi người để cùng phấn đấu (số tiền thưởng của người khác vẫn ẩn).</summary>
    public bool Public { get; set; }
    public int RankTop { get; set; }
    public decimal RankBonus(string month, int rank)
    {
        if (RankTop > 0 && rank > RankTop) return 0;
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
    /// <summary>Bản 1.10.13: tự chốt KPI tháng trước vào ngày AutoLockDay của tháng sau (0 giờ), để bảng lương có thưởng trước kỳ tự xác nhận lương.
    /// Người quản lý KPI vẫn mở chốt để sửa rồi chốt lại. Tháng đã có bảng lương e-work thì không tự chốt (thưởng lấy theo e-work).</summary>
    public bool AutoLock { get; set; } = true;
    public int AutoLockDay { get; set; } = 1;

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

    /// <summary>Bản 1.10.18 (anh Trí 26/11/2026): quản lý theo kết quả sản phẩm, áp dụng cho KPI từ tháng ResultFrom (yyyy-MM; trống = tắt).
    /// Giao việc phải ghi sản phẩm bàn giao; nghiệm thu Đạt tốt (GoodFactor) / Đạt (PassFactor, kể cả tự Đạt) / Chưa đạt (trả lại sửa, trừ ReopenPenalty);
    /// gia hạn xin trước hạn và được duyệt không trừ điểm, xin khi đã quá hạn thì trễ tính theo hạn cũ (KpiDue).</summary>
    public string? ResultFrom { get; set; }
    public decimal GoodFactor { get; set; } = 1m;
    public decimal PassFactor { get; set; } = 0.85m;
    /// <summary>Theo dõi tiến độ % trên từng việc (mặc định tắt ở chế độ theo kết quả).</summary>
    public bool TrackProgress { get; set; }
    /// <summary>Bản 1.10.24 (anh Trí chọn 60/20/20): tỷ trọng các tháng theo kết quả: sản phẩm / chuyên cần / tương tác (tự đếm từ thao tác trên phần mềm).</summary>
    public decimal RWork { get; set; } = 60;
    public decimal RAttendance { get; set; } = 20;
    public decimal RInteract { get; set; } = 20;
    /// <summary>Tương tác đủ 100 điểm khi số ngày làm việc có cập nhật trên phần mềm đạt tỷ lệ này so với số ngày đi làm (0,6 = khoảng 3 ngày mỗi tuần).</summary>
    public decimal InteractTarget { get; set; } = 0.6m;
    /// <summary>Bản 1.10.25 (anh Trí 26/11): hồ sơ nhân sự không đánh giá KPI (không lên danh sách KPI, không xếp hạng, không thưởng KPI). Lương chính không đổi.</summary>
    public List<string> Exclude { get; set; } = new();
    public bool ResultMode => !string.IsNullOrWhiteSpace(ResultFrom);
    public bool ResultFor(DateOnly monthStart) => ResultMode && string.CompareOrdinal(monthStart.ToString("yyyy-MM"), ResultFrom!.Trim()) >= 0;
    public decimal ResultQuality(int? q) => q is >= 4 ? GoodFactor : PassFactor;

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
        (await Db.Departments.AsNoTracking().Where(d => d.ManagerUserId == Uc.User.Id || d.DeputyUserId == Uc.User.Id).Select(d => d.Id).ToListAsync()).ToHashSet();
    public static string Norm(string? s) => System.Text.RegularExpressions.Regex.Replace((s ?? "").Normalize(System.Text.NormalizationForm.FormC).Trim().ToLowerInvariant(), @"\s+", " ");

    public record WorkDetail(int Total, int OnTime, int Late, int Overdue, decimal Score, int Collab = 0);

    public static bool IsDone(ProjectTask t) => t.Status == "Hoàn thành";
    /// <summary>Việc được tính KPI: không phải nhiệm vụ có việc con, chưa hủy, việc phát sinh đã được xác nhận.</summary>
    public static bool Countable(ProjectTask t, HashSet<string> parents) => t.Due != null && !parents.Contains(t.Id) && t.Status != "Đã hủy" && t.Status != "Tạm dừng" && (!t.Arising || t.ArisingConfirmedAt != null);
    public static List<string> CollabIds(ProjectTask t) => (t.Collaborators ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

    /// <summary>Người phụ trách của việc: chỉ theo tài khoản (bản 1.10.17 bỏ cách đoán theo họ tên gõ tay, vì việc gõ tay không hiện ở "Việc của tôi"
    /// nên người bị tính không thấy việc để làm; việc cũ ghi tên được gán tài khoản một lần khi nâng cấp).</summary>
    public static bool IsAssignee(ProjectTask t, Employee e, string? username) => t.AssigneeUserId is not null && e.UserId is not null && t.AssigneeUserId == e.UserId;

    /// <summary>Điểm công việc của tháng: việc có hạn hoặc ngày xong rơi vào tháng; việc chưa đến hạn chưa tính.</summary>
    public static WorkDetail? WorkOf(Employee e, string? username, List<ProjectTask> tasks, HashSet<string> parents, DateOnly from, DateOnly to, VpSettings vs, KpiSettings k, DateOnly? asOf = null, IReadOnlyDictionary<string, decimal>? factor = null)
    {
        var today = asOf ?? DateOnly.FromDateTime(VnTime.Now);
        decimal sw = 0, got = 0; int onTime = 0, late = 0, overdue = 0, n = 0, collab = 0; var rm = k.ResultFor(from);
        foreach (var t in tasks)
        {
            if (!Countable(t, parents)) continue;
            if (rm && t.Scale is null) continue; // anh Trí 26/11: cách tính theo sản phẩm chỉ cho việc giao từ 27/11 (bản 1.10.24); việc cũ không tính
            var mineMain = IsAssignee(t, e, username);
            var mineCo = !mineMain && e.UserId is not null && CollabIds(t).Contains(e.UserId);
            if (!mineMain && !mineCo) continue;
            var d = t.Due!.Value;
            if (!((d >= from && d < to) || (t.DoneDate is { } dd && dd >= from && dd < to))) continue;
            var done = IsDone(t);
            if (!done && d >= today) continue; // chưa đến hạn: chưa tính
            var w = k.LevelWeight(t.Priority) * (mineCo ? k.CollabFactor : 1m) * (rm && factor is not null && factor.TryGetValue(t.Id, out var fx) ? fx : 1m); if (w <= 0) continue;
            sw += w; n++; if (mineCo) collab++;
            if (!done) { overdue++; continue; }
            var fin = t.DoneDate ?? today; var lateDays = 0; var ld = rm && t.KpiDue is { } kd && kd < d ? kd : d;
            for (var x = ld.AddDays(1); x <= fin; x = x.AddDays(1)) if (VnTime.WorkValue(x, vs) > 0) lateDays++;
            if (lateDays == 0) onTime++; else late++;
            var c = rm
                ? k.LateFactor(lateDays) * k.ResultQuality(t.Quality) * Math.Max(0m, 1m - t.ReopenCount * k.ReopenPenalty)
                : k.LateFactor(lateDays) * k.QualityFactor(t.Quality) * Math.Max(0m, 1m - t.ReopenCount * k.ReopenPenalty - t.ExtendCount * k.ExtendPenalty);
            got += w * c;
        }
        return n == 0 ? null : new WorkDetail(n, onTime, late, overdue, Math.Round(100 * got / sw, 1, MidpointRounding.AwayFromZero), collab);
    }

    /// <summary>Bản 1.10.24 (anh Trí 26/11/2026): hệ số của từng việc theo quy mô sản phẩm (Nhỏ 1, Vừa 2, Lớn 4) và tỷ lệ mốc kết quả.
    /// Sản phẩm không chia mốc: hệ số = quy mô. Mốc kết quả (việc con của sản phẩm đã chia mốc): quy mô của sản phẩm gốc × tỷ lệ mốc (Share %, trống thì chia đều).</summary>
    public static async Task<Dictionary<string, decimal>> MilestoneFactors(AppDbContext db, List<ProjectTask> tasks, HashSet<string> parents)
    {
        var all = await db.Tasks.AsNoTracking().Where(t => t.ParentId != null || t.Scale != null || parents.Contains(t.Id))
            .Select(t => new { t.Id, t.ParentId, t.Scale, t.Share, t.Status, t.Arising }).ToListAsync();
        var byId = all.ToDictionary(t => t.Id);
        decimal ScaleOf(string id) { for (var i = 0; i < 20 && byId.TryGetValue(id, out var x); i++) { if (x.ParentId is null || !byId.ContainsKey(x.ParentId)) return Norm(x.Scale); id = x.ParentId; } return 1m; }
        static decimal Norm(int? v) => v switch { 2 => 2m, 4 => 4m, _ => 1m };
        var res = new Dictionary<string, decimal>();
        foreach (var t in tasks)
        {
            if (!byId.TryGetValue(t.Id, out var x)) { res[t.Id] = Norm(t.Scale); continue; }
            var f = ScaleOf(t.Id);
            if (x.ParentId is { } pid && parents.Contains(pid) && !x.Arising)
            {
                var sib = all.Where(y => y.ParentId == pid && !y.Arising && y.Status != "Đã hủy").ToList();
                var share = x.Share is int sh && sh > 0 ? sh : sib.Count > 0 ? 100m / sib.Count : 100m;
                // tỷ lệ các mốc cộng lại khác 100 thì quy về 100 để sản phẩm không vượt hoặc thiếu điểm
                var tot = sib.Sum(y => y.Share is int s1 && s1 > 0 ? s1 : (sib.Count > 0 ? 100m / sib.Count : 100m));
                f *= tot > 0 ? share / tot : 1m;
            }
            res[t.Id] = f;
        }
        return res;
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

    /// <summary>Kết quả tính KPI một người trong tháng (dùng chung cho xem, chốt tay, tự chốt).</summary>
    public record Calc(Employee E, KpiSheet? Sh, VpCalc.Row St, WorkDetail? Wd, decimal? Work, decimal? Att, decimal? Mgr, decimal Total, string Grade,
        int? Rank, decimal RankBonus, string? RankLabel, bool Locked, List<string> Missing, decimal? Inter = null, int InterDays = 0);

    /// <summary>Tính KPI cả công ty của tháng. strict = true khi chốt: phần chưa có điểm tính 0.</summary>
    public static async Task<List<Calc>?> Compute(AppDbContext db, string month, bool strict)
    {
        if (!DateOnly.TryParse(month + "-01", out var from)) return null;
        var to = from.AddMonths(1);
        var k = KpiSettings.Load(db); var vs = VpSettings.Load(db);
        var sheets = await db.KpiSheets.AsNoTracking().Where(x => x.Month == month).ToDictionaryAsync(x => x.EmployeeId);
        // Bản 1.10.21 (anh Trí): KPI chỉ tính người đang làm việc; bỏ người đã nghỉ việc hoặc tài khoản đã khóa.
        // Tháng đã chốt thì giữ nguyên dòng đã chốt để không mất lịch sử.
        var lockedIds = sheets.Values.Where(x => x.LockedAt != null).Select(x => x.EmployeeId).ToHashSet();
        var lockedUsers = await StaffFilter.LockedUsers(db);
        var emps = (await db.Employees.AsNoTracking().OrderBy(e => e.Name).ToListAsync())
            .Where(e => lockedIds.Contains(e.Id) || (StaffFilter.Working(e, lockedUsers, from) && !k.Exclude.Contains(e.Id))).ToList();
        var deptNames = await db.Departments.AsNoTracking().ToDictionaryAsync(d => d.Id, d => d.Name);
        var (_, stats) = await VpCalc.Month(db, vs, emps, from);
        var atts = (await db.Attendances.AsNoTracking().Where(a => a.Date >= from && a.Date < to).ToListAsync()).GroupBy(a => a.EmployeeId).ToDictionary(g => g.Key, g => g.ToList());
        var (tasks, parents) = await TasksFor(db, from, to);
        var factor = k.ResultFor(from) ? await MilestoneFactors(db, tasks, parents) : null;
        // bản 1.10.24: sản phẩm dài (hạn sau tháng này) đang làm trong tháng: tháng đó không bị tính 0 điểm công việc vì "không có sản phẩm"
        var longOpen = k.ResultFor(from) ? await db.Tasks.AsNoTracking().Where(t => t.Scale != null && t.Due != null && t.Due >= to && t.Status != "Đã hủy" && (t.StartDate == null || t.StartDate < to) && (t.DoneDate == null || t.DoneDate >= to)).ToListAsync() : new List<ProjectTask>();
        var users = await db.Users.AsNoTracking().ToDictionaryAsync(u => u.Id, u => u.Username);
        // bản 1.10.24: chiều Tương tác tự đếm số ngày làm việc có cập nhật trên phần mềm (mỗi ngày tính 1 lần, bấm nhiều không cộng thêm)
        var rmode = k.Auto && k.ResultFor(from) && k.RInteract > 0;
        var actDays = rmode ? await InteractDays(db, from, to, vs) : new Dictionary<string, int>();
        var pre = emps.Select(e =>
        {
            sheets.TryGetValue(e.Id, out var sh); var locked = sh?.LockedAt != null;
            var st = stats.First(x => x.EmployeeId == e.Id);
            var wd = WorkOf(e, e.UserId != null && users.TryGetValue(e.UserId, out var un) ? un : null, tasks, parents, from, to, vs, k, null, factor);
            var work = locked ? sh!.WorkFinal : sh?.WorkScore ?? wd?.Score;
            // bản 1.10.24 (anh Trí: "kết quả sản phẩm xác định KPI"): theo kết quả, cả tháng không có sản phẩm nào đến hạn hoặc nộp thì phần công việc 0 điểm khi chốt,
            // không để KPI chỉ còn chuyên cần mà vẫn xếp loại cao
            if (!locked && work is null && strict && k.Auto && k.ResultFor(from)
                && !longOpen.Any(t => IsAssignee(t, e, e.UserId != null && users.TryGetValue(e.UserId, out var u2) ? u2 : null) || (e.UserId is not null && CollabIds(t).Contains(e.UserId)))) work = 0m;
            var att = locked ? sh!.AttendanceFinal : e.Attendance ? AttendanceOf(st, atts.TryGetValue(e.Id, out var l) ? l : new(), k) : (decimal?)null;
            var iDays = e.UserId is not null ? actDays.GetValueOrDefault(e.UserId) : 0;
            decimal? inter = !rmode ? null : locked ? sh!.ProjectScore : e.UserId is null ? null
                : Math.Min(100m, Math.Round(100m * iDays / Math.Max(1m, (st.Worked > 0 ? st.Worked : st.Standard) * Math.Clamp(k.InteractTarget, 0.1m, 1m)), 1));
            var mgr = sh?.ManagerRating is { } mr ? mr * 20m : (decimal?)null;
            var total = locked ? sh!.Total ?? 0 : rmode ? TotalR(k, work, att, inter) : Total(k, work, sh?.ProjectScore, att, mgr, strict);
            return (e, sh, st, wd, work, att, mgr, total, locked, inter, iDays);
        }).ToList();
        // Hạng trong phòng (tạm tính khi chưa chốt; đã chốt thì dùng hạng lưu cố định)
        var minG = k.Grades.FirstOrDefault(g => g.Name == k.RankMinGrade)?.Min ?? 0;
        var rankOf = new Dictionary<string, int>();
        if (k.RankOn)
            foreach (var g in pre.Where(x => (k.RankCompany || x.e.DepartmentId != null) && x.total > 0 && x.total >= minG).GroupBy(x => k.RankCompany ? "" : x.e.DepartmentId!))
            {
                int rank = 0; decimal? prev = null; int i = 0;
                if (k.RankTop > 0)
                {
                    // Bản 1.10.16 (anh Trí: thưởng "chỉ 2 người"): không để trùng hạng; bằng tổng điểm thì xét chuyên cần, rồi công việc, cuối cùng theo tên
                    foreach (var x in g.OrderByDescending(x => x.total).ThenByDescending(x => x.att ?? -1).ThenByDescending(x => x.work ?? -1)
                        .ThenBy(x => x.e.Name, StringComparer.Create(new System.Globalization.CultureInfo("vi-VN"), false)).ThenBy(x => x.e.Id, StringComparer.Ordinal))
                        rankOf[x.e.Id] = ++i;
                    continue;
                }
                foreach (var x in g.OrderByDescending(x => x.total)) { i++; if (prev != x.total) rank = i; prev = x.total; rankOf[x.e.Id] = rank; } // bằng điểm thì cùng hạng
            }
        return pre.Select(x =>
        {
            var (e, sh, st, wd, work, att, mgr, total, locked, inter, iDays) = x;
            var missing = new List<string>();
            if (!k.Auto) { if (work is null) missing.Add("Công việc"); if (k.WProject > 0 && sh?.ProjectScore is null) missing.Add("Kết quả dự án"); if (k.WManager > 0 && sh?.ManagerRating is null) missing.Add("Đánh giá quản lý"); }
            var grade = locked ? sh!.Grade ?? "" : (k.Auto ? work is null && att is null : work is null) && !strict ? "Chưa đủ dữ liệu" : k.GradeOf(total);
            int? rank = locked ? sh!.Rank : rankOf.TryGetValue(e.Id, out var rk) ? rk : null;
            var rb = locked ? sh!.RankBonus ?? 0 : rank is int r0 ? k.RankBonus(month, r0) : 0;
            var label = rank is int rr && rb > 0 ? (k.RankCompany ? $"Toàn công ty - Hạng {rr}" : $"{(e.DepartmentId != null && deptNames.TryGetValue(e.DepartmentId, out var dn) ? dn : "")} - Hạng {rr}") : null;
            return new Calc(e, sh, st, wd, work, att, mgr, total, grade, rank, rb, label, locked, missing, inter, iDays);
        }).ToList();
    }

    [HttpGet("kpi")]
    public async Task<IActionResult> Get([FromQuery] string month)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var calc = await Compute(Db, month, false); if (calc is null) return Error(400, "Tháng không hợp lệ.");
        var k = KpiSettings.Load(Db);
        var depts = await ManagedDepts(); var all = Uc.Can("kpi"); var edit = Uc.Can("kpi", true);
        bool Full(Employee e) => all || e.UserId == Uc.User.Id || (e.DepartmentId != null && depts.Contains(e.DepartmentId));
        bool Visible(Employee e) => k.Public || Full(e);
        var rows = calc.Where(c => Visible(c.E)).Select(c =>
        {
            var (e, sh, st) = (c.E, c.Sh, c.St);
            var canRate = !c.Locked && e.UserId != Uc.User.Id && (edit || (e.DepartmentId != null && depts.Contains(e.DepartmentId)));
            var full = Full(e);
            return new
            {
                employeeId = e.Id, e.Name, e.DepartmentId, work = c.Work, workAuto = c.Wd, workOverride = sh?.WorkScore, project = sh?.ProjectScore, interact = c.Inter, interactDays = c.InterDays, attendance = c.Att,
                attDetail = new { st.Late, st.LateMinutes, st.Early, st.NoOut, st.Absent, st.Worked, st.Standard },
                rating = sh?.ManagerRating, ratingNote = full ? sh?.ManagerNote : null, ratedBy = full ? sh?.RatedBy : null, employeeNote = full ? sh?.EmployeeNote : null,
                total = c.Total, grade = c.Grade, estimate = !c.Locked && c.Work is null && !k.Auto, bonus = full ? k.Grades.FirstOrDefault(g => g.Name == c.Grade)?.Bonus ?? 0 : 0,
                rank = c.Rank, rankBonus = full ? c.RankBonus : 0, rankLabel = c.RankLabel,
                missing = c.Missing, locked = c.Locked, lockedAt = sh?.LockedAt, lockedBy = sh?.LockedAt != null ? sh.LockedBy : null, canRate, self = e.UserId == Uc.User.Id
            };
        }).ToList();
        return Ok(new { month, settings = k, canEdit = edit, rows, autoLockAt = k.AutoLock ? DateOnly.Parse(month + "-01").AddMonths(1).AddDays(Math.Clamp(k.AutoLockDay, 1, 28) - 1).ToString("yyyy-MM-dd") : null });
    }

    /// <summary>Bản 1.10.12: true khi chốt KPI: phần chưa có điểm tính 0 (như trước). Khi xem tạm tính, chỉ tính trên các phần đã có điểm
    /// (giữa tháng chưa chấm dự án, chưa đánh giá thì không còn ra loại D cho mọi người).</summary>
    /// <summary>Tháng theo kết quả: sản phẩm / chuyên cần / tương tác theo RWork/RAttendance/RInteract; người không chấm công thì phần chuyên cần chia cho hai phần còn lại.</summary>
    private static decimal TotalR(KpiSettings k, decimal? work, decimal? att, decimal? inter)
    {
        decimal aw = 0, av = 0;
        if (work is { } w0) { aw += k.RWork; av += w0 * k.RWork; }
        if (att is { } a0) { aw += k.RAttendance; av += a0 * k.RAttendance; }
        if (inter is { } i0) { aw += k.RInteract; av += i0 * k.RInteract; }
        return aw <= 0 ? 0 : Math.Round(av / aw, 1);
    }

    /// <summary>Số ngày làm việc trong tháng mỗi tài khoản có thao tác cập nhật (công việc, dự án, đề xuất, lịch, thông báo, xác nhận lương…).
    /// Không tính đăng nhập, đổi mật khẩu, nhận nhiệm vụ (đã ở chuyên cần), thao tác quản trị, sao lưu.</summary>
    public static async Task<Dictionary<string, int>> InteractDays(AppDbContext db, DateOnly from, DateOnly to, VpSettings vs)
    {
        var f = from.ToDateTime(TimeOnly.MinValue).AddHours(-7); var t2 = to.ToDateTime(TimeOnly.MinValue).AddHours(-7);
        var skipMods = new[] { "Người dùng", "Hệ thống", "Kho tệp", "Quản trị hệ thống", "Điểm danh", "Quy trình duyệt" };
        var logs = await db.Logs.AsNoTracking().Where(l => l.Ts >= f && l.Ts < t2 && l.UserId != null && !skipMods.Contains(l.Module!))
            .Select(l => new { l.UserId, l.Ts, l.Action }).ToListAsync();
        return logs.Where(l => l.Action is null || !(l.Action.Contains("Đăng nhập") || l.Action.Contains("Đăng xuất") || l.Action.Contains("thiết lập")))
            .Select(l => new { l.UserId, d = DateOnly.FromDateTime(l.Ts.AddHours(7)) }).Where(x => VnTime.WorkValue(x.d, vs) > 0)
            .Distinct().GroupBy(x => x.UserId!).ToDictionary(g => g.Key, g => g.Count());
    }

    private static decimal Total(KpiSettings k, decimal? work, decimal? project, decimal? att, decimal? mgr, bool strict = true)
    {
        if (k.Auto)
        {
            decimal aw = 0, av = 0;
            if (work is { } w0 && k.WWork > 0) { aw += k.WWork; av += w0 * k.WWork; }
            if (att is { } a0 && k.WAttendance > 0) { aw += k.WAttendance; av += a0 * k.WAttendance; }
            return aw <= 0 ? 0 : Math.Round(av / aw, 1);
        }
        if (!strict && (work is null || (project is null && k.WProject > 0) || mgr is null))
        {
            decimal sw = 0, sv = 0;
            void Add(decimal? v, decimal w) { if (v is { } x && w > 0) { sw += w; sv += x * w; } }
            Add(work, k.WWork); Add(project, k.WProject); Add(att, k.WAttendance); Add(mgr, k.WManager);
            return sw <= 0 ? 0 : Math.Round(sv / sw, 1);
        }
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
        var n = await SetLock(Db, month, b.Lock, Uc.User.Name); if (n is null) return Error(400, "Tháng không hợp lệ.");
        Uc.Log(b.Lock ? "Chốt KPI tháng" : "Mở chốt KPI tháng", "KPI", $"Tháng {month}: {n} người");
        await Db.SaveChangesAsync();
        return Ok(new { ok = true, n });
    }

    /// <summary>Chốt hoặc mở chốt KPI tháng cho mọi người (chưa lưu, người gọi SaveChanges). Trả về số phiếu thay đổi.</summary>
    public static async Task<int?> SetLock(AppDbContext db, string month, bool lck, string by)
    {
        var calc = await Compute(db, month, true); if (calc is null) return null;
        var n = 0;
        foreach (var r in calc)
        {
            var sh = await db.KpiSheets.FirstOrDefaultAsync(x => x.Month == month && x.EmployeeId == r.E.Id)
                ?? db.KpiSheets.Local.FirstOrDefault(x => x.Month == month && x.EmployeeId == r.E.Id);
            if (sh is null) { if (!lck) continue; sh = new KpiSheet { Id = "kpi-" + Guid.NewGuid().ToString("N")[..20], Month = month, EmployeeId = r.E.Id }; db.KpiSheets.Add(sh); }
            if (lck && sh.LockedAt == null)
            { sh.WorkFinal = r.Work; sh.AttendanceFinal = r.Att; if (r.Inter is not null) sh.ProjectScore = r.Inter; sh.Total = r.Total; sh.Grade = r.Grade; sh.Rank = r.Rank; sh.RankBonus = r.RankBonus; sh.LockedAt = DateTime.UtcNow; sh.LockedBy = by; n++; }
            else if (!lck && sh.LockedAt != null) { sh.LockedAt = null; sh.LockedBy = "Mở chốt: " + by; n++; } // dấu vết để tác vụ tự chốt không chốt lại
        }
        return n;
    }

    /// <summary>Bản 1.10.13: tác vụ nền gọi mỗi 15 phút. Từ 0 giờ ngày AutoLockDay, tự chốt KPI tháng trước một lần;
    /// tháng đã có người mở chốt (để sửa) thì không tự chốt lại; tháng có bảng lương e-work thì bỏ qua.</summary>
    public static async Task<string?> AutoLockTick(AppDbContext db, DateTime nowVn)
    {
        var k = KpiSettings.Load(db); if (!k.AutoLock) return null;
        if (nowVn.Day < Math.Clamp(k.AutoLockDay, 1, 28)) return null;
        var month = new DateOnly(nowVn.Year, nowVn.Month, 1).AddMonths(-1).ToString("yyyy-MM");
        var sheets = await db.KpiSheets.AsNoTracking().Where(x => x.Month == month).ToListAsync();
        if (sheets.Any(x => x.LockedAt != null || x.LockedBy != null)) return null; // đã chốt, hoặc người quản lý đã mở chốt để sửa
        if (await db.EworkArchive.AsNoTracking().AnyAsync(r => r.TableName == "BangLuongs" && r.Period == month)) return null;
        if (!await db.Employees.AsNoTracking().AnyAsync()) return null;
        var n = await SetLock(db, month, true, "Hệ thống (tự chốt)");
        return n > 0 ? month + ": " + n + " người" : null;
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
        k.ResultFrom = string.IsNullOrWhiteSpace(k.ResultFrom) ? null : k.ResultFrom.Trim();
        if (k.ResultFrom is not null && !System.Text.RegularExpressions.Regex.IsMatch(k.ResultFrom, @"^\d{4}-\d{2}$")) return Error(400, "Quản lý theo kết quả: tháng áp dụng dạng 2026-12, hoặc để trống để tắt.");
        if (k.GoodFactor is < 0 or > 1.5m || k.PassFactor is < 0 or > 1.5m) return Error(400, "Hệ số Đạt tốt, Đạt từ 0 đến 1,5.");
        if (k.RWork < 0 || k.RAttendance < 0 || k.RInteract < 0 || k.RWork + k.RAttendance + k.RInteract != 100) return Error(400, "Tỷ trọng sản phẩm, chuyên cần, tương tác phải cộng bằng 100.");
        if (k.InteractTarget is < 0.1m or > 1m) return Error(400, "Mức tương tác đủ điểm từ 0,1 đến 1.");
        k.Save(Db, Uc.User.Username);
        Uc.Log("Cập nhật thiết lập KPI", "KPI", $"Trọng số {k.WWork}/{k.WProject}/{k.WAttendance}/{k.WManager}");
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }
}

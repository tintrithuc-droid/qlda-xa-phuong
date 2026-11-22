using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Thiết lập lương (bảng Settings, khóa "luong"): tỷ lệ bảo hiểm, mức trần, giảm trừ gia cảnh, biểu thuế TNCN theo ngày hiệu lực, hệ số tăng ca.</summary>
public class PaySettings
{
    /// <summary>Người lao động đóng: BHXH, BHYT, BHTN (%).</summary>
    public decimal EmpBhxh { get; set; } = 8; public decimal EmpBhyt { get; set; } = 1.5m; public decimal EmpBhtn { get; set; } = 1;
    /// <summary>Doanh nghiệp đóng: BHXH (gồm ốm đau, thai sản, TNLĐ-BNN), BHYT, BHTN, kinh phí công đoàn (%).</summary>
    public decimal CoBhxh { get; set; } = 17.5m; public decimal CoBhyt { get; set; } = 3; public decimal CoBhtn { get; set; } = 1; public decimal CoKpcd { get; set; } = 2;
    /// <summary>Lương cơ sở (trần BHXH, BHYT = 20 lần) và lương tối thiểu vùng (trần BHTN = 20 lần).</summary>
    public decimal BaseWage { get; set; } = 2340000; public decimal RegionMinWage { get; set; } = 4960000;
    /// <summary>Giảm trừ gia cảnh bản thân, mỗi người phụ thuộc (đồng/tháng).</summary>
    public decimal PersonalDeduction { get; set; } = 15500000; public decimal DependentDeduction { get; set; } = 6200000;
    /// <summary>Hệ số tăng ca (%), áp cho giờ tăng ca trong đề xuất đã duyệt.</summary>
    public decimal OtRate { get; set; } = 150;
    /// <summary>Ngày trả lương ghi trên phiếu (ví dụ "05 tháng sau").</summary>
    public string PayDay { get; set; } = "Ngày 05 tháng sau";
    /// <summary>Bản 1.10.4: người lao động tự xác nhận lương từ ngày ConfirmFrom đến hết ngày ConfirmTo của tháng sau; quá hạn coi như đồng ý.</summary>
    public int ConfirmFrom { get; set; } = 1; public int ConfirmTo { get; set; } = 3;
    /// <summary>Bản 1.10.4: danh sách chuyển khoản ngân hàng: tài khoản trích nợ của công ty, nội dung chuyển khoản ({thang}, {nam}, {ten}), tên người hưởng (giữ dấu như mẫu MB Bank hoặc viết hoa không dấu), tên trang tính.</summary>
    public string? PayAccount { get; set; } public string? PayBank { get; set; }
    public string TransferNote { get; set; } = "THANH TOAN LUONG T{thang}.{nam}";
    public bool TransferAscii { get; set; }
    public string TransferSheet { get; set; } = "Chuyển lương";
    /// <summary>Bản 1.10.4: công tác phí theo ngày công tác được duyệt (bật/tắt, mức đồng/ngày); không tính thuế TNCN.</summary>
    public bool TripOn { get; set; } public decimal TripRate { get; set; }
    /// <summary>Nghỉ phép vượt số ngày phép năm được hưởng thì trừ lương như nghỉ không lương.</summary>
    public bool LeaveOverDeduct { get; set; } = true;
    /// <summary>Tháng 12: ngày phép năm chưa nghỉ hết được trả vào lương (lương chính ÷ công chuẩn × số ngày).</summary>
    public bool PayUnusedLeave { get; set; } = true;
    /// <summary>Mặc định đưa đề xuất xăng xe (cộng, không tính thuế) và tạm ứng (trừ) đã duyệt vào lương; từng đề xuất có thể chọn khác.</summary>
    public bool FuelToPayroll { get; set; } = true; public bool AdvanceToPayroll { get; set; }
    /// <summary>Hạn xác nhận lương của tháng: từ ngày ConfirmFrom tháng sau; nếu chốt muộn hơn thì mở từ ngày chốt và kéo dài đủ số ngày.</summary>
    public (DateOnly from, DateOnly to) ConfirmWindow(string month, DateTime? lockedAtUtc)
    {
        var next = DateOnly.Parse(month + "-01").AddMonths(1);
        int f = Math.Clamp(ConfirmFrom, 1, 28), t = Math.Clamp(ConfirmTo, f, 28);
        var from = next.AddDays(f - 1); var to = next.AddDays(t - 1);
        if (lockedAtUtc is { } l && DateOnly.FromDateTime(VnTime.ToVn(l)) is var ld && ld > from) { from = ld; if (ld.AddDays(t - f) > to) to = ld.AddDays(t - f); }
        return (from, to);
    }
    public class Bracket { public decimal UpTo { get; set; } public decimal Rate { get; set; } }
    public class TaxTable { public string From { get; set; } = ""; public List<Bracket> Brackets { get; set; } = new(); }
    /// <summary>Biểu thuế lũy tiến từng phần theo tháng; chọn biểu có ngày hiệu lực gần nhất trước tháng tính lương. UpTo = 0 là bậc cuối.</summary>
    public List<TaxTable> TaxTables { get; set; } = new()
    {
        new() { From = "2009-01-01", Brackets = new() { new() { UpTo = 5000000, Rate = 5 }, new() { UpTo = 10000000, Rate = 10 }, new() { UpTo = 18000000, Rate = 15 },
            new() { UpTo = 32000000, Rate = 20 }, new() { UpTo = 52000000, Rate = 25 }, new() { UpTo = 80000000, Rate = 30 }, new() { UpTo = 0, Rate = 35 } } },
        new() { From = "2026-01-01", Brackets = new() { new() { UpTo = 10000000, Rate = 5 }, new() { UpTo = 30000000, Rate = 10 }, new() { UpTo = 60000000, Rate = 20 },
            new() { UpTo = 100000000, Rate = 30 }, new() { UpTo = 0, Rate = 35 } } }
    };

    public const string Key = "luong";
    private static readonly JsonSerializerOptions Opts = new(JsonSerializerDefaults.Web);
    public static PaySettings Load(AppDbContext db)
    {
        var s = db.Settings.AsNoTracking().FirstOrDefault(x => x.Key == Key)?.Value;
        if (string.IsNullOrEmpty(s)) return new PaySettings();
        try { return JsonSerializer.Deserialize<PaySettings>(s, Opts) ?? new PaySettings(); } catch { return new PaySettings(); }
    }
    public void Save(AppDbContext db, string by)
    {
        var row = db.Settings.FirstOrDefault(x => x.Key == Key); var json = JsonSerializer.Serialize(this, Opts);
        if (row is null) db.Settings.Add(new AppSetting { Key = Key, Value = json, UpdatedAt = DateTime.UtcNow, UpdatedBy = by });
        else { row.Value = json; row.UpdatedAt = DateTime.UtcNow; row.UpdatedBy = by; }
    }
    public decimal Pit(decimal assessable, string month)
    {
        if (assessable <= 0) return 0;
        var t = TaxTables.Where(x => string.CompareOrdinal(x.From, month + "-01") <= 0).OrderByDescending(x => x.From).FirstOrDefault() ?? TaxTables.FirstOrDefault();
        if (t is null) return 0;
        decimal tax = 0, prev = 0;
        foreach (var b in t.Brackets)
        {
            var top = b.UpTo <= 0 ? decimal.MaxValue : b.UpTo;
            if (assessable > prev) tax += (Math.Min(assessable, top) - prev) * b.Rate / 100;
            if (assessable <= top) break; prev = top;
        }
        return Math.Round(tax, 0);
    }
}

/// <summary>
/// Bản 1.10: bảng lương tháng tính tự động từ hồ sơ lương, bảng công (ngày công hưởng lương = công chuẩn − vắng không lý do), tăng ca được duyệt,
/// thưởng KPI đã chốt, ứng lương được duyệt; bảo hiểm và thuế TNCN theo thiết lập. Kế toán điều chỉnh thưởng/khấu trừ khác, chốt tháng (lưu cố định),
/// người lao động xem phiếu lương của mình sau khi chốt. Quyền "luong": xem toàn bộ / sửa (hồ sơ lương, điều chỉnh, chốt, thiết lập).
/// </summary>
[Authorize, Route("api/vp")]
public class LuongController : ApiControllerBase
{
    public LuongController(AppDbContext db, UserContext uc) : base(db, uc) { }
    private static readonly JsonSerializerOptions Opts = new(JsonSerializerDefaults.Web);

    public class Allowance { public string Name { get; set; } = ""; public decimal Amount { get; set; } public decimal Exempt { get; set; } }
    public static List<Allowance> Allow(string? json) { try { return string.IsNullOrEmpty(json) ? new() : JsonSerializer.Deserialize<List<Allowance>>(json, Opts) ?? new(); } catch { return new(); } }

    public record Line(string Code, string Label, decimal Amount, string? Note = null);
    /// <summary>Đề xuất tạm ứng, xăng xe trong tháng: có đưa vào lương không (theo thiết lập hoặc chọn riêng).</summary>
    public record PayItem(string Id, string Code, string Type, decimal Amount, bool Included, bool? Choice, string? Title);
    public class Slip
    {
        public string EmployeeId { get; set; } = ""; public string Name { get; set; } = ""; public string? DepartmentId { get; set; } public string? Position { get; set; }
        public decimal Standard { get; set; } public decimal Paid { get; set; } public decimal Absent { get; set; } public decimal OtHours { get; set; }
        public decimal BaseSalary { get; set; } public decimal TimePay { get; set; } public decimal Allowances { get; set; } public decimal OtPay { get; set; }
        public decimal KpiBonus { get; set; } public string? KpiGrade { get; set; } public decimal Bonus { get; set; } public decimal Gross { get; set; }
        public decimal InsBase { get; set; } public decimal Bhxh { get; set; } public decimal Bhyt { get; set; } public decimal Bhtn { get; set; } public decimal Insurance { get; set; }
        public int Dependents { get; set; } public decimal Taxable { get; set; } public decimal Assessable { get; set; } public decimal Pit { get; set; }
        // Bản 1.10.4: phép năm, công tác phí, xăng xe, tạm ứng
        public decimal LeaveDays { get; set; } public decimal LeaveOver { get; set; } public decimal LeaveTotal { get; set; } public decimal LeaveUsedYear { get; set; }
        public decimal UnusedLeave { get; set; } public decimal UnusedLeavePay { get; set; }
        public decimal TripDays { get; set; } public decimal TripPay { get; set; } public decimal FuelPay { get; set; } public decimal TempAdvance { get; set; }
        public List<PayItem> Items { get; set; } = new();
        public decimal Advance { get; set; } public decimal Deduction { get; set; } public decimal Net { get; set; } public decimal EmployerIns { get; set; } public decimal Cost { get; set; }
        public List<Line> AllowanceLines { get; set; } = new(); public string? Note { get; set; }
        public bool HasProfile { get; set; } public bool Locked { get; set; } public DateTime? LockedAt { get; set; }
        // Bản 1.10.4: xác nhận lương (lấy từ phiếu lương mỗi lần xem, không thuộc số liệu chốt)
        public DateTime? ConfirmedAt { get; set; } public string? Feedback { get; set; } public DateTime? FeedbackAt { get; set; } public string? FeedbackStatus { get; set; }
        public string? Reply { get; set; } public DateTime? RepliedAt { get; set; } public string? RepliedBy { get; set; }
        public string? ConfirmFrom { get; set; } public string? ConfirmTo { get; set; } public bool ConfirmOpen { get; set; } public string? ConfirmState { get; set; }
        public DateTime? ApprovedAt { get; set; } public string? ApprovedBy { get; set; }
    }


    /// <summary>Trạng thái xác nhận: Đã xác nhận / Có kiến nghị / Đã trả lời kiến nghị / Chưa đến hạn / Chưa xác nhận / Quá hạn, coi như đồng ý.</summary>
    private static void Confirm(Slip s, Payslip sl, PaySettings ps, string month)
    {
        var (f, t) = ps.ConfirmWindow(month, sl.LockedAt); var today = DateOnly.FromDateTime(VnTime.Now);
        s.ApprovedAt = sl.ApprovedAt; s.ApprovedBy = sl.ApprovedBy;
        s.ConfirmedAt = sl.ConfirmedAt; s.Feedback = sl.Feedback; s.FeedbackAt = sl.FeedbackAt; s.FeedbackStatus = sl.FeedbackStatus; s.Reply = sl.Reply; s.RepliedAt = sl.RepliedAt; s.RepliedBy = sl.RepliedBy;
        s.ConfirmFrom = f.ToString("yyyy-MM-dd"); s.ConfirmTo = t.ToString("yyyy-MM-dd"); s.ConfirmOpen = today >= f && today <= t && sl.ConfirmedAt is null;
        s.ConfirmState = sl.ConfirmedAt is not null ? "Đã xác nhận" : sl.FeedbackStatus == "Chờ xử lý" ? "Có kiến nghị" : sl.FeedbackStatus == "Đã trả lời" ? "Đã trả lời kiến nghị"
            : today < f ? "Chưa đến hạn" : today <= t ? "Chưa xác nhận" : "Quá hạn, coi như đồng ý";
    }

    /// <summary>Phiếu lương đã chốt đang trong hạn xác nhận mà người này chưa xác nhận (để nhắc trên màn hình điểm danh).</summary>
    public static async Task<object?> PendingConfirm(AppDbContext db, string employeeId)
    {
        var ps = PaySettings.Load(db); var today = DateOnly.FromDateTime(VnTime.Now);
        var list = await db.Payslips.AsNoTracking().Where(x => x.EmployeeId == employeeId && x.LockedAt != null && x.ConfirmedAt == null).OrderByDescending(x => x.Month).Take(3).ToListAsync();
        foreach (var sl in list)
        {
            var (f, t) = ps.ConfirmWindow(sl.Month, sl.LockedAt);
            if (today >= f && today <= t) return new { month = sl.Month, to = t.ToString("yyyy-MM-dd"), feedbackStatus = sl.FeedbackStatus, reply = sl.Reply };
        }
        return null;
    }

    private async Task<List<Slip>> Compute(string month, List<Employee> emps)
    {
        var from = DateOnly.Parse(month + "-01"); var to = from.AddMonths(1);
        var ps = PaySettings.Load(Db); var ks = KpiSettings.Load(Db); var vs = VpSettings.Load(Db);
        var ids = emps.Select(e => e.Id).ToHashSet();
        var profiles = (await Db.PayProfiles.AsNoTracking().ToListAsync()).Where(p => ids.Contains(p.EmployeeId)).ToDictionary(p => p.EmployeeId);
        var slips = (await Db.Payslips.AsNoTracking().Where(x => x.Month == month).ToListAsync()).ToDictionary(x => x.EmployeeId);
        var kpi = (await Db.KpiSheets.AsNoTracking().Where(x => x.Month == month && x.LockedAt != null).ToListAsync()).ToDictionary(x => x.EmployeeId);
        var (standard, stats) = await VpCalc.Month(Db, vs, emps, from);
        var f = VnTime.ToUtc(from.ToDateTime(TimeOnly.MinValue)); var t = VnTime.ToUtc(to.ToDateTime(TimeOnly.MinValue));
        var monthReqs = (await Db.Requests.AsNoTracking().Where(r => r.Status == "Đã duyệt" && (r.Type == "Ứng lương" || r.Type == "Tạm ứng" || r.Type == "Xăng xe")).ToListAsync())
            .Where(r => (r.FromAt ?? r.CreatedAt) >= f && (r.FromAt ?? r.CreatedAt) < t).ToList();
        var adv = monthReqs.Where(r => r.Type == "Ứng lương").GroupBy(r => r.EmployeeId).ToDictionary(g => g.Key, g => g.Sum(r => r.Amount ?? 0));
        // Phép năm đã nghỉ trong năm trước tháng này (để biết tháng này còn phép hay đã vượt)
        var y0 = VnTime.ToUtc(new DateTime(from.Year, 1, 1));
        var leaveBefore = (await Db.Requests.AsNoTracking().Where(r => r.Status == "Đã duyệt" && r.Type == "Nghỉ phép" && r.FromAt != null && r.FromAt >= y0 && r.FromAt < f).ToListAsync())
            .GroupBy(r => r.EmployeeId).ToDictionary(g => g.Key, g => g.Sum(r => r.Days ?? 0));
        var res = new List<Slip>();
        foreach (var e in emps)
        {
            if (slips.TryGetValue(e.Id, out var sl) && sl.LockedAt != null && sl.Data is { } d)
            {
                var fixedSlip = JsonSerializer.Deserialize<Slip>(d, Opts)!; fixedSlip.Locked = true; fixedSlip.LockedAt = sl.LockedAt; Confirm(fixedSlip, sl, ps, month); res.Add(fixedSlip); continue;
            }
            profiles.TryGetValue(e.Id, out var p); var st = stats.First(x => x.EmployeeId == e.Id);
            var s = new Slip { EmployeeId = e.Id, Name = e.Name, DepartmentId = e.DepartmentId, Position = e.Position, Standard = standard, HasProfile = p is not null, Dependents = e.Dependents };
            s.Absent = e.Attendance ? st.Absent : 0;
            // Phép năm (Điều 113, 114 BLLĐ): còn phép thì hưởng lương, vượt số ngày được hưởng thì trừ như nghỉ không lương
            s.LeaveTotal = VnTime.LeaveEntitlement(e, vs, from.Year); s.LeaveDays = st.Leave;
            var before = leaveBefore.TryGetValue(e.Id, out var lb) ? lb : 0; s.LeaveUsedYear = before + st.Leave;
            s.LeaveOver = ps.LeaveOverDeduct ? Math.Min(st.Leave, Math.Max(0, s.LeaveUsedYear - s.LeaveTotal)) : 0;
            s.Paid = Math.Max(0, standard - s.Absent - s.LeaveOver); s.OtHours = st.Overtime;
            s.BaseSalary = p?.BaseSalary ?? 0;
            s.TimePay = standard > 0 ? Math.Round(s.BaseSalary * s.Paid / standard, 0) : 0;
            var daily = standard > 0 ? s.BaseSalary / standard : 0;
            if (from.Month == 12 && ps.PayUnusedLeave && p is not null)
            {
                s.UnusedLeave = Math.Max(0, s.LeaveTotal - s.LeaveUsedYear); s.UnusedLeavePay = Math.Round(daily * s.UnusedLeave, 0);
            }
            if (ps.TripOn && ps.TripRate > 0) { s.TripDays = st.Trip; s.TripPay = Math.Round(st.Trip * ps.TripRate, 0); }
            foreach (var r in monthReqs.Where(r => r.EmployeeId == e.Id && r.Type != "Ứng lương"))
            {
                var inc = r.Payroll ?? (r.Type == "Xăng xe" ? ps.FuelToPayroll : ps.AdvanceToPayroll);
                s.Items.Add(new PayItem(r.Id, r.Code, r.Type, r.Amount ?? 0, inc, r.Payroll, r.Title ?? r.Place));
                if (!inc) continue;
                if (r.Type == "Xăng xe") s.FuelPay += r.Amount ?? 0; else s.TempAdvance += r.Amount ?? 0;
            }
            var al = Allow(p?.Allowances); decimal exempt = 0;
            foreach (var a in al) { s.AllowanceLines.Add(new Line("pc", a.Name, a.Amount, a.Exempt > 0 ? $"không tính thuế {a.Exempt:#,0}" : null)); exempt += Math.Min(a.Amount, a.Exempt); }
            s.Allowances = al.Sum(a => a.Amount);
            var hourly = standard > 0 ? s.BaseSalary / standard / 8 : 0;
            s.OtPay = Math.Round(hourly * s.OtHours * ps.OtRate / 100, 0);
            var otPremium = Math.Max(0, s.OtPay - Math.Round(hourly * s.OtHours, 0)); // phần trả cao hơn giờ bình thường không chịu thuế
            if (kpi.TryGetValue(e.Id, out var k))
            {
                s.KpiGrade = k.Grade; s.KpiBonus = (ks.Grades.FirstOrDefault(g => g.Name == k.Grade)?.Bonus ?? 0) + (k.RankBonus ?? 0);
                if (k.RankBonus > 0 && k.Rank is { } rk) s.KpiGrade += $", hạng {rk} trong phòng"; // 1.10.4: thưởng theo hạng như e-work
            }
            s.Bonus = sl?.Bonus ?? 0; s.Deduction = sl?.Deduction ?? 0; s.Note = sl?.Note;
            // Công tác phí, xăng xe đi công việc là khoản chi theo chế độ, không tính thuế TNCN; tiền phép năm chưa nghỉ tính thuế như tiền lương
            s.Gross = s.TimePay + s.Allowances + s.OtPay + s.KpiBonus + s.Bonus + s.UnusedLeavePay + s.TripPay + s.FuelPay;
            exempt += s.TripPay + s.FuelPay;
            if (p is { NoInsurance: false } && s.BaseSalary > 0)
            {
                var ib = p.InsuranceSalary ?? p.BaseSalary; s.InsBase = ib;
                var capS = ps.BaseWage * 20; var capU = ps.RegionMinWage * 20;
                s.Bhxh = Math.Round(Math.Min(ib, capS) * ps.EmpBhxh / 100, 0); s.Bhyt = Math.Round(Math.Min(ib, capS) * ps.EmpBhyt / 100, 0); s.Bhtn = Math.Round(Math.Min(ib, capU) * ps.EmpBhtn / 100, 0);
                s.EmployerIns = Math.Round(Math.Min(ib, capS) * (ps.CoBhxh + ps.CoBhyt + ps.CoKpcd) / 100 + Math.Min(ib, capU) * ps.CoBhtn / 100, 0);
            }
            s.Insurance = s.Bhxh + s.Bhyt + s.Bhtn;
            s.Taxable = Math.Max(0, s.Gross - exempt - otPremium);
            if (p?.FlatTax == true) { s.Assessable = s.Taxable; s.Pit = s.Taxable >= 2000000 ? Math.Round(s.Taxable * 0.1m, 0) : 0; }
            else { s.Assessable = Math.Max(0, s.Taxable - s.Insurance - ps.PersonalDeduction - e.Dependents * ps.DependentDeduction); s.Pit = ps.Pit(s.Assessable, month); }
            s.Advance = adv.TryGetValue(e.Id, out var av) ? av : 0;
            s.Advance += s.TempAdvance;
            s.Net = s.Gross - s.Insurance - s.Pit - s.Advance - s.Deduction;
            s.Cost = s.Gross + s.EmployerIns;
            res.Add(s);
        }
        return res;
    }

    private async Task<List<Employee>> Staff(DateOnly from) =>
        await Db.Employees.AsNoTracking().Where(e => e.Status != "Nghỉ việc" || e.UpdatedAt >= from.ToDateTime(TimeOnly.MinValue)).OrderBy(e => e.Name).ToListAsync();

    [HttpGet("luong")]
    public async Task<IActionResult> Get([FromQuery] string month)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!DateOnly.TryParse(month + "-01", out var from)) return Error(400, "Tháng không hợp lệ.");
        var all = Uc.Can("luong"); var emps = await Staff(from);
        if (!all)
        {
            // Người lao động: chỉ phiếu lương của mình, khi tháng đã chốt
            var me = emps.Where(e => e.UserId == Uc.User.Id).ToList();
            var mine = me.Count == 0 ? new List<Slip>() : (await Compute(month, me)).Where(s => s.Locked).ToList();
            return Ok(new { month, canEdit = false, all = false, settings = (object?)null, rows = mine });
        }
        var rows = await Compute(month, emps);
        // tài khoản nhận lương: chỉ người quản lý lương, người duyệt chi (để lập danh sách chuyển khoản)
        var bank = Uc.Can("luong", true) || CanApprove ? emps.Select(e => new { employeeId = e.Id, account = e.BankAccount, bankName = e.BankName, idNumber = e.IdNumber }).ToList() : null;
        return Ok(new { month, canEdit = Uc.Can("luong", true), canApprove = CanApprove, all = true, settings = PaySettings.Load(Db), rows, bank });
    }

    public record AdjustBody(decimal Bonus, decimal Deduction, string? Note);

    [HttpPut("luong/{month}/{employeeId}")]
    public async Task<IActionResult> Adjust(string month, string employeeId, [FromBody] AdjustBody b)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("luong", true)) return Denied("Chỉ người quản lý lương được điều chỉnh.");
        if (!DateOnly.TryParse(month + "-01", out _) || !ValidId(employeeId)) return Error(400, "Tháng không hợp lệ.");
        if (b.Bonus < 0 || b.Deduction < 0) return Error(400, "Số tiền không âm.");
        var sl = await Db.Payslips.FirstOrDefaultAsync(x => x.Month == month && x.EmployeeId == employeeId);
        if (sl?.LockedAt != null) return Error(409, "Bảng lương tháng này đã chốt.");
        if (sl is null) { sl = new Payslip { Id = "pl-" + Guid.NewGuid().ToString("N")[..20], Month = month, EmployeeId = employeeId }; Db.Payslips.Add(sl); }
        sl.Bonus = b.Bonus; sl.Deduction = b.Deduction; sl.Note = b.Note?.Trim(); sl.UpdatedAt = DateTime.UtcNow; sl.UpdatedBy = Uc.User.Username;
        Uc.Log("Điều chỉnh lương", "Lương", $"{employeeId} tháng {month}: thưởng {b.Bonus:#,0}, khấu trừ {b.Deduction:#,0}");
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    public record LockBody(bool Lock);

    [HttpPost("luong/{month}/chot")]
    public async Task<IActionResult> Lock(string month, [FromBody] LockBody b)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("luong", true)) return Denied("Chỉ người quản lý lương được chốt.");
        if (!DateOnly.TryParse(month + "-01", out var from)) return Error(400, "Tháng không hợp lệ.");
        var emps = await Staff(from); var rows = b.Lock ? await Compute(month, emps) : new();
        var slips = await Db.Payslips.Where(x => x.Month == month).ToListAsync(); var n = 0;
        if (!b.Lock && slips.Any(x => x.ApprovedAt != null)) return Error(409, "Bảng lương đã duyệt chi: Giám đốc hoặc Kế toán hủy duyệt trước khi mở chốt.");
        if (b.Lock)
            foreach (var s in rows.Where(r => !r.Locked && r.HasProfile))
            {
                var sl = slips.FirstOrDefault(x => x.EmployeeId == s.EmployeeId);
                if (sl is null) { sl = new Payslip { Id = "pl-" + Guid.NewGuid().ToString("N")[..20], Month = month, EmployeeId = s.EmployeeId }; Db.Payslips.Add(sl); }
                sl.Data = JsonSerializer.Serialize(s, Opts); sl.Net = s.Net; sl.LockedAt = DateTime.UtcNow; sl.LockedBy = Uc.User.Name; sl.ConfirmedAt = null; n++;
            }
        else foreach (var sl in slips.Where(x => x.LockedAt != null)) { sl.LockedAt = null; sl.LockedBy = null; sl.Data = null; sl.Net = null; n++; }
        Uc.Log(b.Lock ? "Chốt bảng lương" : "Mở chốt bảng lương", "Lương", $"Tháng {month}: {n} người");
        await Db.SaveChangesAsync(); return Ok(new { ok = true, n });
    }

    /// <summary>Quyền duyệt chi lương (Giám đốc hoặc Kế toán): nhóm có "Duyệt hồ sơ" ở phân hệ Lương.</summary>
    private bool CanApprove => Uc.IsAdmin || (Uc.Group?.Perms.TryGetValue("luong:duyet", out var v) == true && v == "1");

    public record ApproveBody(bool Approve);

    /// <summary>Bản 1.10.4: duyệt chi (hoặc hủy duyệt) bảng lương đã chốt. Còn kiến nghị chưa trả lời thì chưa duyệt được.</summary>
    [HttpPost("luong/{month}/duyet")]
    public async Task<IActionResult> Approve(string month, [FromBody] ApproveBody b)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!CanApprove) return Denied("Chỉ Giám đốc hoặc Kế toán (quyền duyệt lương) được duyệt chi.");
        if (!DateOnly.TryParse(month + "-01", out _)) return Error(400, "Tháng không hợp lệ.");
        var slips = await Db.Payslips.Where(x => x.Month == month && x.LockedAt != null).ToListAsync();
        if (slips.Count == 0) return Error(409, "Bảng lương tháng này chưa chốt.");
        if (b.Approve)
        {
            var fb = slips.Count(x => x.FeedbackStatus == "Chờ xử lý");
            if (fb > 0) return Error(409, $"Còn {fb} kiến nghị lương chưa trả lời: trả lời trước khi duyệt chi.");
            foreach (var sl in slips.Where(x => x.ApprovedAt == null)) { sl.ApprovedAt = DateTime.UtcNow; sl.ApprovedBy = Uc.User.Name; }
        }
        else foreach (var sl in slips) { sl.ApprovedAt = null; sl.ApprovedBy = null; }
        var unconfirmed = slips.Count(x => x.ConfirmedAt == null);
        Uc.Log(b.Approve ? "Duyệt chi bảng lương" : "Hủy duyệt chi bảng lương", "Lương", $"Tháng {month}: {slips.Count} người" + (b.Approve && unconfirmed > 0 ? $", {unconfirmed} người chưa xác nhận" : ""));
        await Db.SaveChangesAsync(); return Ok(new { ok = true, n = slips.Count, unconfirmed });
    }

    public record ConfirmBody(bool Agree, string? Feedback);

    /// <summary>Bản 1.10.4: người lao động xác nhận phiếu lương của mình trong hạn; không đồng ý thì gửi kiến nghị (bắt buộc ghi nội dung).</summary>
    [HttpPost("luong/{month}/xac-nhan")]
    public async Task<IActionResult> ConfirmMine(string month, [FromBody] ConfirmBody b)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!DateOnly.TryParse(month + "-01", out _)) return Error(400, "Tháng không hợp lệ.");
        var me = await Db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.UserId == Uc.User.Id);
        if (me is null) return Error(400, "Tài khoản chưa gắn với hồ sơ nhân sự.");
        var sl = await Db.Payslips.FirstOrDefaultAsync(x => x.Month == month && x.EmployeeId == me.Id);
        if (sl?.LockedAt is null) return Error(409, "Bảng lương tháng này chưa chốt.");
        if (sl.ConfirmedAt is not null) return Error(409, "Bạn đã xác nhận lương tháng này.");
        var (f, t) = PaySettings.Load(Db).ConfirmWindow(month, sl.LockedAt); var today = DateOnly.FromDateTime(VnTime.Now);
        if (today < f || today > t) return Error(409, $"Chỉ xác nhận lương từ {f:dd/MM} đến hết {t:dd/MM/yyyy}.");
        var fb = b.Feedback?.Trim();
        if (!b.Agree && string.IsNullOrEmpty(fb)) return Error(400, "Ghi nội dung kiến nghị.");
        if (!string.IsNullOrEmpty(fb))
        {
            var all = string.IsNullOrEmpty(sl.Feedback) ? fb : sl.Feedback + "\n---\n" + fb;
            sl.Feedback = all.Length <= 2000 ? all : all[^2000..];
            sl.FeedbackAt = DateTime.UtcNow; sl.FeedbackStatus = "Chờ xử lý"; sl.Reply = null; sl.RepliedAt = null; sl.RepliedBy = null;
        }
        if (b.Agree) sl.ConfirmedAt = DateTime.UtcNow;
        sl.UpdatedAt = DateTime.UtcNow; sl.UpdatedBy = Uc.User.Username;
        Uc.Log(b.Agree ? "Xác nhận lương" : "Gửi kiến nghị lương", "Lương", $"{me.Name} tháng {month}" + (string.IsNullOrEmpty(fb) ? "" : " (có kiến nghị)"));
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    public record ReplyBody(string Reply);

    /// <summary>Người quản lý lương trả lời kiến nghị; người lao động xem trả lời rồi xác nhận (nếu còn hạn).</summary>
    [HttpPost("luong/{month}/{employeeId}/tra-loi")]
    public async Task<IActionResult> ReplyFeedback(string month, string employeeId, [FromBody] ReplyBody b)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("luong", true)) return Denied("Chỉ người quản lý lương được trả lời kiến nghị.");
        if (string.IsNullOrWhiteSpace(b.Reply)) return Error(400, "Ghi nội dung trả lời.");
        var sl = await Db.Payslips.FirstOrDefaultAsync(x => x.Month == month && x.EmployeeId == employeeId);
        if (sl?.Feedback is null) return Error(404, "Không có kiến nghị.");
        var r = b.Reply.Trim(); sl.Reply = r.Length > 2000 ? r[..2000] : r; sl.RepliedAt = DateTime.UtcNow; sl.RepliedBy = Uc.User.Name; sl.FeedbackStatus = "Đã trả lời";
        sl.UpdatedAt = DateTime.UtcNow; sl.UpdatedBy = Uc.User.Username;
        Uc.Log("Trả lời kiến nghị lương", "Lương", $"{employeeId} tháng {month}");
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    [HttpGet("luong-ho-so")]
    public async Task<IActionResult> Profiles()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("luong")) return Denied();
        var l = await Db.PayProfiles.AsNoTracking().ToListAsync();
        return Ok(l.Select(p => new { p.EmployeeId, p.BaseSalary, p.InsuranceSalary, allowances = Allow(p.Allowances), p.NoInsurance, p.FlatTax, p.FromMonth }));
    }

    public record ProfileBody(decimal BaseSalary, decimal? InsuranceSalary, List<Allowance>? Allowances, bool NoInsurance, bool FlatTax, string? FromMonth, int? Dependents);

    [HttpPut("luong-ho-so/{employeeId}")]
    public async Task<IActionResult> PutProfile(string employeeId, [FromBody] ProfileBody b)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("luong", true)) return Denied();
        if (!ValidId(employeeId)) return Error(400, "Mã không hợp lệ.");
        var e = await Db.Employees.FirstOrDefaultAsync(x => x.Id == employeeId); if (e is null) return NotFound();
        if (b.BaseSalary < 0 || b.InsuranceSalary < 0 || (b.Allowances ?? new()).Any(a => a.Amount < 0 || string.IsNullOrWhiteSpace(a.Name))) return Error(400, "Số tiền không hợp lệ.");
        var p = await Db.PayProfiles.FirstOrDefaultAsync(x => x.EmployeeId == employeeId);
        if (p is null) { p = new PayProfile { Id = "hl-" + Guid.NewGuid().ToString("N")[..20], EmployeeId = employeeId }; Db.PayProfiles.Add(p); }
        p.BaseSalary = b.BaseSalary; p.InsuranceSalary = b.InsuranceSalary; p.Allowances = JsonSerializer.Serialize(b.Allowances ?? new(), Opts);
        p.NoInsurance = b.NoInsurance; p.FlatTax = b.FlatTax; p.FromMonth = b.FromMonth; p.UpdatedAt = DateTime.UtcNow; p.UpdatedBy = Uc.User.Username;
        if (b.Dependents is { } dp && dp >= 0) e.Dependents = dp;
        Uc.Log("Cập nhật hồ sơ lương", "Lương", e.Name);
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    [HttpGet("luong-settings")]
    public async Task<IActionResult> GetSettings()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("luong")) return Denied();
        return Ok(PaySettings.Load(Db));
    }

    [HttpPut("luong-settings")]
    public async Task<IActionResult> PutSettings([FromBody] PaySettings s)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("luong", true)) return Denied();
        if (s.TaxTables.Count == 0 || s.TaxTables.Any(t => !DateOnly.TryParse(t.From, out _) || t.Brackets.Count == 0)) return Error(400, "Biểu thuế cần ngày hiệu lực và ít nhất một bậc.");
        foreach (var t in s.TaxTables) t.Brackets = t.Brackets.OrderBy(x => x.UpTo <= 0 ? decimal.MaxValue : x.UpTo).ToList();
        s.Save(Db, Uc.User.Username);
        Uc.Log("Cập nhật thiết lập lương", "Lương", $"Giảm trừ {s.PersonalDeduction:#,0}/{s.DependentDeduction:#,0}");
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }
}

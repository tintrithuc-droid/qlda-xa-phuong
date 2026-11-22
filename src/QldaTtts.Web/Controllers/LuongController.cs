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
    public class Slip
    {
        public string EmployeeId { get; set; } = ""; public string Name { get; set; } = ""; public string? DepartmentId { get; set; } public string? Position { get; set; }
        public decimal Standard { get; set; } public decimal Paid { get; set; } public decimal Absent { get; set; } public decimal OtHours { get; set; }
        public decimal BaseSalary { get; set; } public decimal TimePay { get; set; } public decimal Allowances { get; set; } public decimal OtPay { get; set; }
        public decimal KpiBonus { get; set; } public string? KpiGrade { get; set; } public decimal Bonus { get; set; } public decimal Gross { get; set; }
        public decimal InsBase { get; set; } public decimal Bhxh { get; set; } public decimal Bhyt { get; set; } public decimal Bhtn { get; set; } public decimal Insurance { get; set; }
        public int Dependents { get; set; } public decimal Taxable { get; set; } public decimal Assessable { get; set; } public decimal Pit { get; set; }
        public decimal Advance { get; set; } public decimal Deduction { get; set; } public decimal Net { get; set; } public decimal EmployerIns { get; set; } public decimal Cost { get; set; }
        public List<Line> AllowanceLines { get; set; } = new(); public string? Note { get; set; }
        public bool HasProfile { get; set; } public bool Locked { get; set; } public DateTime? LockedAt { get; set; }
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
        var adv = (await Db.Requests.AsNoTracking().Where(r => r.Status == "Đã duyệt" && r.Type == "Ứng lương").ToListAsync())
            .Where(r => (r.FromAt ?? r.CreatedAt) >= f && (r.FromAt ?? r.CreatedAt) < t).GroupBy(r => r.EmployeeId).ToDictionary(g => g.Key, g => g.Sum(r => r.Amount ?? 0));
        var res = new List<Slip>();
        foreach (var e in emps)
        {
            if (slips.TryGetValue(e.Id, out var sl) && sl.LockedAt != null && sl.Data is { } d)
            {
                var fixedSlip = JsonSerializer.Deserialize<Slip>(d, Opts)!; fixedSlip.Locked = true; fixedSlip.LockedAt = sl.LockedAt; res.Add(fixedSlip); continue;
            }
            profiles.TryGetValue(e.Id, out var p); var st = stats.First(x => x.EmployeeId == e.Id);
            var s = new Slip { EmployeeId = e.Id, Name = e.Name, DepartmentId = e.DepartmentId, Position = e.Position, Standard = standard, HasProfile = p is not null, Dependents = e.Dependents };
            s.Absent = e.Attendance ? st.Absent : 0;
            s.Paid = Math.Max(0, standard - s.Absent); s.OtHours = st.Overtime;
            s.BaseSalary = p?.BaseSalary ?? 0;
            s.TimePay = standard > 0 ? Math.Round(s.BaseSalary * s.Paid / standard, 0) : 0;
            var al = Allow(p?.Allowances); decimal exempt = 0;
            foreach (var a in al) { s.AllowanceLines.Add(new Line("pc", a.Name, a.Amount, a.Exempt > 0 ? $"không tính thuế {a.Exempt:#,0}" : null)); exempt += Math.Min(a.Amount, a.Exempt); }
            s.Allowances = al.Sum(a => a.Amount);
            var hourly = standard > 0 ? s.BaseSalary / standard / 8 : 0;
            s.OtPay = Math.Round(hourly * s.OtHours * ps.OtRate / 100, 0);
            var otPremium = Math.Max(0, s.OtPay - Math.Round(hourly * s.OtHours, 0)); // phần trả cao hơn giờ bình thường không chịu thuế
            if (kpi.TryGetValue(e.Id, out var k)) { s.KpiGrade = k.Grade; s.KpiBonus = ks.Grades.FirstOrDefault(g => g.Name == k.Grade)?.Bonus ?? 0; }
            s.Bonus = sl?.Bonus ?? 0; s.Deduction = sl?.Deduction ?? 0; s.Note = sl?.Note;
            s.Gross = s.TimePay + s.Allowances + s.OtPay + s.KpiBonus + s.Bonus;
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
        return Ok(new { month, canEdit = Uc.Can("luong", true), all = true, settings = PaySettings.Load(Db), rows });
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
        if (b.Lock)
            foreach (var s in rows.Where(r => !r.Locked && r.HasProfile))
            {
                var sl = slips.FirstOrDefault(x => x.EmployeeId == s.EmployeeId);
                if (sl is null) { sl = new Payslip { Id = "pl-" + Guid.NewGuid().ToString("N")[..20], Month = month, EmployeeId = s.EmployeeId }; Db.Payslips.Add(sl); }
                sl.Data = JsonSerializer.Serialize(s, Opts); sl.Net = s.Net; sl.LockedAt = DateTime.UtcNow; sl.LockedBy = Uc.User.Name; n++;
            }
        else foreach (var sl in slips.Where(x => x.LockedAt != null)) { sl.LockedAt = null; sl.LockedBy = null; sl.Data = null; sl.Net = null; n++; }
        Uc.Log(b.Lock ? "Chốt bảng lương" : "Mở chốt bảng lương", "Lương", $"Tháng {month}: {n} người");
        await Db.SaveChangesAsync(); return Ok(new { ok = true, n });
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

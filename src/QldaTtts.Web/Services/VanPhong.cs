using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>Thiết lập phân hệ Văn phòng (lưu trong bảng Settings, khóa "vp").</summary>
public class VpSettings
{
    public class Place { public string Name { get; set; } = ""; public double Lat { get; set; } public double Lng { get; set; } public int Radius { get; set; } = 500; }
    public List<Place> Places { get; set; } = new();
    /// <summary>Địa chỉ IP mạng công ty (điểm danh từ mạng này tính là trong công ty).</summary>
    public List<string> Ips { get; set; } = new();
    public string CheckIn { get; set; } = "08:15";
    public string CheckOut { get; set; } = "17:30";
    public string MorningStart { get; set; } = "08:00";
    public string MorningEnd { get; set; } = "12:30";
    public string AfternoonStart { get; set; } = "13:30";
    public string AfternoonEnd { get; set; } = "17:30";
    public decimal HoursPerDay { get; set; } = 8;
    public decimal LeavePerYear { get; set; } = 12;
    /// <summary>Làm việc thứ Bảy: "khong", "sang" (buổi sáng), "ca-ngay", "cach-tuan" (tuần làm cả ngày, tuần nghỉ, luân phiên).</summary>
    public string Saturday { get; set; } = "khong";
    /// <summary>Bản 1.10.4: một thứ Bảy có đi làm (yyyy-MM-dd) làm mốc cho chế độ "cach-tuan"; các thứ Bảy cách mốc số chẵn tuần là ngày làm.</summary>
    public string SaturdayAnchor { get; set; } = "2026-10-10";
    /// <summary>Số công của một ngày thứ Bảy theo thiết lập (chưa xét lễ, làm bù).</summary>
    public decimal SaturdayValue(DateOnly d) => Saturday switch
    {
        "ca-ngay" => 1,
        "sang" => 0.5m,
        "cach-tuan" => DateOnly.TryParse(SaturdayAnchor, out var a) && ((d.DayNumber - a.DayNumber) / 7) % 2 == 0 ? 1 : 0,
        _ => 0
    };
    /// <summary>Cho phép điểm danh ngoài công ty (ghi nhận "Ngoài công ty" để trưởng phòng xem).</summary>
    public bool AllowOutside { get; set; } = true;
    /// <summary>Ngày nghỉ lễ, tết (yyyy-MM-dd), nửa ngày ghi thêm ":s" (sáng) hoặc ":c" (chiều).</summary>
    public List<string> Holidays { get; set; } = new();
    /// <summary>Bản 1.10.4: ngày đi làm bù (làm việc dù là cuối tuần hoặc ngày nghỉ), dạng yyyy-MM-dd, làm nửa ngày ghi thêm ":s"; có thể kèm ghi chú sau dấu cách.</summary>
    public List<string> Workdays { get; set; } = new();
    /// <summary>Bản 1.10.7: tự áp dụng ngày lễ, tết theo luật (Điều 112 BLLĐ 2019, kèm nghỉ bù) cho mọi năm, không cần nhập; danh sách Holidays chỉ còn ngày phát sinh.
    /// Ngày Chính phủ hoán đổi: ghi ngày nghỉ thay vào Holidays và ngày đi làm vào Workdays (Workdays luôn được ưu tiên).</summary>
    public bool AutoLegal { get; set; } = true;
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, Dictionary<DateOnly, string>> LegalCache = new();
    /// <summary>Ngày lễ theo luật của một năm (theo thiết lập thứ Bảy hiện tại, để tính nghỉ bù).</summary>
    public Dictionary<DateOnly, string> LegalOf(int year) => LegalCache.GetOrAdd($"{year}|{Saturday}|{SaturdayAnchor}",
        _ => LichNghi.Legal(year, this).GroupBy(x => DateOnly.Parse(x.Date)).ToDictionary(g => g.Key, g => g.First().Name));
    /// <summary>Ngày nghỉ hiệu lực (phát sinh + theo luật nếu bật) của các năm cho trước, cùng dạng chuỗi với Holidays.</summary>
    public List<string> EffectiveHolidays(IEnumerable<int> years)
    {
        var have = Holidays.Select(h => h.Length >= 10 ? h[..10] : h).ToHashSet();
        var extra = AutoLegal ? years.SelectMany(y => LegalOf(y)).Where(kv => !have.Contains(kv.Key.ToString("yyyy-MM-dd")))
            .Select(kv => kv.Key.ToString("yyyy-MM-dd") + " " + kv.Value) : Enumerable.Empty<string>();
        return Holidays.Concat(extra).OrderBy(x => x).ToList();
    }
    /// <summary>Lời chúc trên màn hình điểm danh: ngày làm việc, ngày nghỉ (ngày lễ thêm tên lễ ở đầu).</summary>
    public string GreetWork { get; set; } = "Chúc ngày làm việc mới vui vẻ, thành công!";
    public string GreetOff { get; set; } = "Hôm nay là ngày nghỉ. Chúc anh chị ngày nghỉ vui vẻ!";
    /// <summary>Băm SHA-256 của khóa chép chấm công sang e-work.</summary>
    public string? SyncKeyHash { get; set; }
    /// <summary>Ngày bắt đầu chép chấm công sang e-work (lượt điểm danh trên QLDA từ ngày này).</summary>
    public string? SyncFrom { get; set; }

    public const string Key = "vp";
    private static readonly JsonSerializerOptions Opts = new(JsonSerializerDefaults.Web);
    public static VpSettings Load(AppDbContext db)
    {
        var s = db.Settings.AsNoTracking().FirstOrDefault(x => x.Key == Key)?.Value;
        if (string.IsNullOrEmpty(s)) return new VpSettings();
        try { return JsonSerializer.Deserialize<VpSettings>(s, Opts) ?? new VpSettings(); } catch { return new VpSettings(); }
    }
    public static void Save(AppDbContext db, VpSettings v, string by)
    {
        var row = db.Settings.FirstOrDefault(x => x.Key == Key);
        var json = JsonSerializer.Serialize(v, Opts);
        if (row is null) db.Settings.Add(new AppSetting { Key = Key, Value = json, UpdatedAt = DateTime.UtcNow, UpdatedBy = by });
        else { row.Value = json; row.UpdatedAt = DateTime.UtcNow; row.UpdatedBy = by; }
    }
}

/// <summary>Giờ Việt Nam và các phép tính chấm công.</summary>
public static class VnTime
{
    private static readonly TimeZoneInfo Tz = Find();
    private static TimeZoneInfo Find()
    {
        foreach (var id in new[] { "Asia/Ho_Chi_Minh", "SE Asia Standard Time", "Asia/Bangkok" })
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); } catch { }
        return TimeZoneInfo.CreateCustomTimeZone("VN", TimeSpan.FromHours(7), "VN", "VN");
    }
    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Tz);
    public static DateTime ToVn(DateTime utc) => TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), Tz);
    public static DateTime ToUtc(DateTime vn) => TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(vn, DateTimeKind.Unspecified), Tz);
    public static TimeSpan Hm(string? s, string def) => TimeSpan.TryParse(string.IsNullOrWhiteSpace(s) ? def : s, out var t) ? t : TimeSpan.Parse(def);

    /// <summary>Khoảng cách (mét) giữa hai tọa độ.</summary>
    public static double Meters(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371000; double r(double d) => d * Math.PI / 180;
        var dLat = r(lat2 - lat1); var dLng = r(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) + Math.Cos(r(lat1)) * Math.Cos(r(lat2)) * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return 2 * R * Math.Asin(Math.Min(1, Math.Sqrt(a)));
    }

    /// <summary>Ngày làm việc trong tháng: 1 = cả ngày, 0.5 = nửa ngày (thứ Bảy buổi sáng, lễ nửa ngày), 0 = nghỉ.</summary>
    public static decimal WorkValue(DateOnly d, VpSettings s) => Day(d, s).Value;

    /// <summary>Bản 1.10.4: số ngày phép năm được hưởng (Điều 113, 114 Bộ luật Lao động 2019): mức chung của công ty, cứ đủ 5 năm làm việc thêm 1 ngày;
    /// năm đầu vào làm tính theo số tháng làm việc trong năm; nghỉ việc trong năm tính đến tháng nghỉ.</summary>
    public static decimal LeaveEntitlement(Employee e, VpSettings s, int year)
    {
        var baseDays = s.LeavePerYear;
        if (e.StartDate is { } sd)
        {
            if (sd.Year > year) return 0;
            var years = year - sd.Year - (new DateOnly(year, 12, 31) < sd.AddYears(year - sd.Year) ? 1 : 0);
            baseDays += Math.Max(0, years / 5);
        }
        int fromM = e.StartDate is { } st && st.Year == year ? st.Month : 1;
        int toM = e.EndDate is { } en && en.Year == year ? en.Month : 12;
        if (e.EndDate is { } en2 && en2.Year < year) return 0;
        var months = Math.Max(0, toM - fromM + 1);
        return months >= 12 ? baseDays : Math.Round(baseDays * months / 12m * 2, MidpointRounding.AwayFromZero) / 2;
    }

    /// <summary>Một dòng ngày trong thiết lập: "2026-09-02", "2026-09-02:s", "2026-09-02 Quốc khánh", "2026-09-02:c Nghỉ chiều".</summary>
    public record DayLine(DateOnly Date, string? Half, string? Name);
    public static DayLine? ParseDay(string? line)
    {
        var m = System.Text.RegularExpressions.Regex.Match(line ?? "", @"^\s*(\d{4}-\d{2}-\d{2})(?::([sc]))?(?:\s+(.*))?$");
        if (!m.Success || !DateOnly.TryParseExact(m.Groups[1].Value, "yyyy-MM-dd", out var d)) return null;
        return new DayLine(d, m.Groups[2].Success ? m.Groups[2].Value : null, m.Groups[3].Success && m.Groups[3].Value.Trim().Length > 0 ? m.Groups[3].Value.Trim() : null);
    }

    /// <summary>Loại ngày: "work" (làm cả ngày), "half" (làm nửa ngày), "off" (nghỉ cuối tuần), "holiday" (nghỉ lễ, nghỉ theo lịch công ty).</summary>
    public record DayInfo(decimal Value, string Kind, string? Name);
    /// <summary>Ghi chú ngày nghỉ là nghỉ cuối tuần (để trống, "nghỉ thứ 7", "thứ Bảy", "cuối tuần").</summary>
    public static bool WeekendNote(string? name) => string.IsNullOrWhiteSpace(name)
        || System.Text.RegularExpressions.Regex.IsMatch(name, @"th[ứu]\s*(7|b[ảa]y)|cu[ốo]i\s*tu[ầa]n|saturday|weekend|phi[êe]n|ch[ủu]\s*nh[ậa]t", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    public static DayInfo Day(DateOnly d, VpSettings s)
    {
        var key = d.ToString("yyyy-MM-dd");
        var wk = s.Workdays.Select(ParseDay).FirstOrDefault(x => x is not null && x.Date == d);
        if (wk is not null) return new DayInfo(wk.Half is null ? 1 : 0.5m, wk.Half is null ? "work" : "half", wk.Name ?? "Ngày làm bù");
        decimal v = d.DayOfWeek switch
        {
            DayOfWeek.Sunday => 0,
            DayOfWeek.Saturday => s.SaturdayValue(d),
            _ => 1
        };
        var hol = s.Holidays.Select(ParseDay).FirstOrDefault(x => x is not null && x.Date == d);
        if (hol is null && s.AutoLegal && s.LegalOf(d.Year).TryGetValue(d, out var lname)) return new DayInfo(0, "holiday", lname);
        // Bản 1.10.4: thứ Bảy nghỉ luân phiên ghi trong danh sách ngày nghỉ (e-work ghi từng ngày) là nghỉ hằng tuần, không phải ngày lễ (tăng ca 200%, không 300%)
        if (hol is not null && d.DayOfWeek == DayOfWeek.Saturday && hol.Half is null && WeekendNote(hol.Name)) return new DayInfo(0, "off", hol.Name);
        if (hol is not null)
        {
            if (hol.Half is null || v == 0) return new DayInfo(0, "holiday", hol.Name ?? "Nghỉ lễ");
            return new DayInfo(Math.Max(0, v - 0.5m), v - 0.5m > 0 ? "half" : "holiday", hol.Name ?? "Nghỉ nửa ngày");
        }
        return new DayInfo(v, v == 1 ? "work" : v > 0 ? "half" : "off", null);
    }
}

/// <summary>Số liệu công tháng của từng người (bảng công, KPI chuyên cần, lương dùng chung một cách tính).</summary>
public static class VpCalc
{
    public record Row(string EmployeeId, string Name, string? DepartmentId, decimal Standard, decimal Worked, int Late, int LateMinutes, int Early,
        int Outside, int Online, int NoOut, decimal Leave, decimal Trip, decimal Overtime, decimal Absent, decimal PrivateLeave = 0, decimal Unpaid = 0);

    /// <summary>Bản 1.10.4: các loại nghỉ có đề xuất được duyệt (không tính vắng không lý do).</summary>
    public static readonly string[] LeaveTypes = { "Nghỉ phép", "Nghỉ việc riêng có lương", "Nghỉ không lương", "Nghỉ ốm, thai sản (BHXH)" };

    public static async Task<(decimal standard, List<Row> rows)> Month(AppDbContext db, VpSettings s, List<Employee> emps, DateOnly from)
    {
        var to = from.AddMonths(1);
        var ids = emps.Select(e => e.Id).ToHashSet();
        var atts = (await db.Attendances.AsNoTracking().Where(a => a.Date >= from && a.Date < to).ToListAsync())
            .Where(a => ids.Contains(a.EmployeeId)).GroupBy(a => a.EmployeeId).ToDictionary(g => g.Key, g => g.ToList());
        var reqs = (await db.Requests.AsNoTracking().Where(r => r.Status == "Đã duyệt" && r.FromAt != null).ToListAsync())
            .Where(r => r.FromAt < VnTime.ToUtc(to.ToDateTime(TimeOnly.MinValue)) && (r.ToAt ?? r.FromAt) >= VnTime.ToUtc(from.ToDateTime(TimeOnly.MinValue))).ToList();
        decimal standard = 0; for (var d = from; d < to; d = d.AddDays(1)) standard += VnTime.WorkValue(d, s);
        var today = DateOnly.FromDateTime(VnTime.Now);
        // Chỉ tính vắng từ ngày hệ thống có dữ liệu điểm danh đầu tiên (tránh tính vắng cả tháng khi mới đưa vào dùng)
        var first = await db.Attendances.AsNoTracking().OrderBy(a => a.Date).Select(a => (DateOnly?)a.Date).FirstOrDefaultAsync() ?? today.AddDays(1);
        var rows = emps.Select(e =>
        {
            var xs = atts.TryGetValue(e.Id, out var l) ? l : new();
            var mine = reqs.Where(r => r.EmployeeId == e.Id).ToList();
            decimal Days(string type) => mine.Where(r => r.Type == type).Sum(r => r.Days ?? 0);
            var worked = xs.Where(a => a.InAt != null || a.OutAt != null).Sum(a => Math.Max(0.5m, VnTime.WorkValue(a.Date, s) == 0 ? 1 : VnTime.WorkValue(a.Date, s)));
            // Ngày làm việc đã qua không có điểm danh, không có đề xuất nghỉ/công tác/online được duyệt
            var absent = 0m;
            for (var d = from; d < to && d <= today; d = d.AddDays(1))
            {
                if (d < first || (e.StartDate is { } sd && d < sd)) continue;
                var wv = VnTime.WorkValue(d, s); if (wv == 0 || xs.Any(a => a.Date == d)) continue;
                var covered = mine.Any(r => r.FromAt is { } f && DateOnly.FromDateTime(VnTime.ToVn(f)) <= d && DateOnly.FromDateTime(VnTime.ToVn(r.ToAt ?? f)) >= d
                    && (LeaveTypes.Contains(r.Type) || r.Type is "Công tác" or "Làm việc online"));
                if (!covered) absent += wv;
            }
            return new Row(e.Id, e.Name, e.DepartmentId, standard, worked, xs.Count(a => a.LateMinutes > 0), xs.Sum(a => a.LateMinutes), xs.Count(a => a.EarlyMinutes > 0),
                xs.Count(a => a.InPlace == "Ngoài công ty"), xs.Count(a => a.InPlace == "Làm việc online"), xs.Count(a => a.InAt != null && a.OutAt == null && a.Date < today),
                Days("Nghỉ phép"), Days("Công tác"), mine.Where(r => r.Type == "Tăng ca").Sum(r => r.Hours ?? 0), absent,
                Days("Nghỉ việc riêng có lương"), Days("Nghỉ không lương") + Days("Nghỉ ốm, thai sản (BHXH)"));
        }).ToList();
        return (standard, rows);
    }
}

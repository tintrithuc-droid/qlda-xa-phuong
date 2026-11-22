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
    /// <summary>Làm việc thứ Bảy: "khong", "sang" (buổi sáng), "ca-ngay".</summary>
    public string Saturday { get; set; } = "khong";
    /// <summary>Cho phép điểm danh ngoài công ty (ghi nhận "Ngoài công ty" để trưởng phòng xem).</summary>
    public bool AllowOutside { get; set; } = true;
    /// <summary>Ngày nghỉ lễ, tết (yyyy-MM-dd), nửa ngày ghi thêm ":s" (sáng) hoặc ":c" (chiều).</summary>
    public List<string> Holidays { get; set; } = new();
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
    public static decimal WorkValue(DateOnly d, VpSettings s)
    {
        var hol = s.Holidays.FirstOrDefault(h => h.StartsWith(d.ToString("yyyy-MM-dd")));
        decimal v = d.DayOfWeek switch
        {
            DayOfWeek.Sunday => 0,
            DayOfWeek.Saturday => s.Saturday == "ca-ngay" ? 1 : s.Saturday == "sang" ? 0.5m : 0,
            _ => 1
        };
        if (hol is not null) v = hol.Length > 10 ? Math.Max(0, v - 0.5m) : 0;
        return v;
    }
}

namespace QldaTtts.Web.Services;

/// <summary>
/// Bản 1.10.4: gợi ý ngày nghỉ lễ, tết hưởng nguyên lương theo Điều 112 Bộ luật Lao động 2019 và Nghị quyết 28/2026/QH16 (Ngày Văn hóa Việt Nam 24/11),
/// kèm ngày nghỉ bù khi ngày lễ trùng ngày nghỉ hằng tuần. Ngày âm lịch tính theo thuật toán Hồ Ngọc Đức, múi giờ +7.
/// Chính phủ có thể hoán đổi ngày nghỉ từng năm (Tết, Quốc khánh): quản trị sửa lại theo thông báo chính thức trước khi lưu.
/// </summary>
public static class LichNghi
{
    public record Item(string Date, string Name);

    public static List<Item> Legal(int year, VpSettings s)
    {
        var list = new List<(DateOnly d, string n)>();
        void Add(DateOnly d, string n) { if (!list.Any(x => x.d == d)) list.Add((d, n)); }
        Add(new DateOnly(year, 1, 1), "Tết Dương lịch");
        // Tết Nguyên đán: 05 ngày, gợi ý ngày cuối năm âm lịch và 04 ngày đầu năm mới (năm âm lịch bắt đầu trong năm dương lịch này)
        var tet = Solar(1, 1, year);
        Add(tet.AddDays(-1), "Tết Nguyên đán");
        for (var i = 0; i < 4; i++) Add(tet.AddDays(i), "Tết Nguyên đán");
        Add(Solar(10, 3, year), "Giỗ Tổ Hùng Vương");
        Add(new DateOnly(year, 4, 30), "Ngày Chiến thắng");
        Add(new DateOnly(year, 5, 1), "Quốc tế Lao động");
        // Quốc khánh: 02/9 và 01 ngày liền kề (gợi ý 01/9; nếu 02/9 là thứ Hai thì gợi ý 03/9 để nghỉ liền cuối tuần)
        var qk = new DateOnly(year, 9, 2);
        Add(qk.DayOfWeek == DayOfWeek.Monday ? qk.AddDays(1) : qk.AddDays(-1), "Quốc khánh");
        Add(qk, "Quốc khánh");
        if (year >= 2026) Add(new DateOnly(year, 11, 24), "Ngày Văn hóa Việt Nam");
        list = list.OrderBy(x => x.d).ToList();

        // Nghỉ bù (Điều 112 khoản 3): lễ trùng ngày nghỉ hằng tuần thì nghỉ bù vào ngày làm việc kế tiếp
        bool Weekly(DateOnly d) => d.DayOfWeek == DayOfWeek.Sunday || (d.DayOfWeek == DayOfWeek.Saturday && s.Saturday != "ca-ngay");
        var taken = list.Select(x => x.d).ToHashSet();
        var comp = new List<(DateOnly d, string n)>();
        foreach (var (d, n) in list.Where(x => Weekly(x.d)))
        {
            var c = d.AddDays(1);
            while (Weekly(c) || taken.Contains(c)) c = c.AddDays(1);
            taken.Add(c); comp.Add((c, "Nghỉ bù " + n));
        }
        return list.Concat(comp).OrderBy(x => x.d).Select(x => new Item(x.d.ToString("yyyy-MM-dd"), x.n)).ToList();
    }

    // ---- âm lịch (Hồ Ngọc Đức), múi giờ 7
    private const double Tz = 7;
    private static int Int(double d) => (int)Math.Floor(d);
    private static int Jd(int dd, int mm, int yy)
    {
        var a = Int((14 - mm) / 12.0); var y = yy + 4800 - a; var m = mm + 12 * a - 3;
        var jd = dd + Int((153 * m + 2) / 5.0) + 365 * y + Int(y / 4.0) - Int(y / 100.0) + Int(y / 400.0) - 32045;
        if (jd < 2299161) jd = dd + Int((153 * m + 2) / 5.0) + 365 * y + Int(y / 4.0) - 32083;
        return jd;
    }
    private static DateOnly FromJd(int jd)
    {
        int a, b, c;
        if (jd > 2299160) { a = jd + 32044; b = Int((4 * a + 3) / 146097.0); c = a - Int(b * 146097 / 4.0); }
        else { b = 0; c = jd + 32082; }
        var d = Int((4 * c + 3) / 1461.0); var e = c - Int(1461 * d / 4.0); var m = Int((5 * e + 2) / 153.0);
        var day = e - Int((153 * m + 2) / 5.0) + 1; var month = m + 3 - 12 * Int(m / 10.0); var year = b * 100 + d - 4800 + Int(m / 10.0);
        return new DateOnly(year, month, day);
    }
    private static int NewMoon(int k)
    {
        double T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = Math.PI / 180;
        var Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3 + 0.00033 * Math.Sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
        var M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
        var Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
        var F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
        var C1 = (0.1734 - 0.000393 * T) * Math.Sin(M * dr) + 0.0021 * Math.Sin(2 * dr * M) - 0.4068 * Math.Sin(Mpr * dr) + 0.0161 * Math.Sin(dr * 2 * Mpr)
            - 0.0004 * Math.Sin(dr * 3 * Mpr) + 0.0104 * Math.Sin(dr * 2 * F) - 0.0051 * Math.Sin(dr * (M + Mpr)) - 0.0074 * Math.Sin(dr * (M - Mpr))
            + 0.0004 * Math.Sin(dr * (2 * F + M)) - 0.0004 * Math.Sin(dr * (2 * F - M)) - 0.0006 * Math.Sin(dr * (2 * F + Mpr))
            + 0.0010 * Math.Sin(dr * (2 * F - Mpr)) + 0.0005 * Math.Sin(dr * (2 * Mpr + M));
        var deltat = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
        return Int(Jd1 + C1 - deltat + 0.5 + Tz / 24);
    }
    private static int SunLong(int jdn)
    {
        double T = (jdn - 2451545.5 - Tz / 24) / 36525, T2 = T * T, dr = Math.PI / 180;
        var M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
        var L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
        var DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.Sin(dr * M) + (0.019993 - 0.000101 * T) * Math.Sin(dr * 2 * M) + 0.000290 * Math.Sin(dr * 3 * M);
        var L = (L0 + DL) * dr; L -= Math.PI * 2 * Int(L / (Math.PI * 2));
        return Int(L / Math.PI * 6);
    }
    private static int Month11(int yy)
    {
        var off = Jd(31, 12, yy) - 2415021; var k = Int(off / 29.530588853);
        var nm = NewMoon(k);
        if (SunLong(nm) >= 9) nm = NewMoon(k - 1);
        return nm;
    }
    private static int LeapOffset(int a11)
    {
        var k = Int((a11 - 2415021.076998695) / 29.530588853 + 0.5); int last, i = 1;
        var arc = SunLong(NewMoon(k + i));
        do { last = arc; i++; arc = SunLong(NewMoon(k + i)); } while (arc != last && i < 14);
        return i - 1;
    }
    /// <summary>Ngày dương của ngày âm (không nhuận) dd/mm trong năm âm lịch "yy" (năm bắt đầu bằng Tết trong năm dương yy).</summary>
    public static DateOnly Solar(int dd, int mm, int yy)
    {
        int a11, b11;
        if (mm < 11) { a11 = Month11(yy - 1); b11 = Month11(yy); }
        else { a11 = Month11(yy); b11 = Month11(yy + 1); }
        var k = Int(0.5 + (a11 - 2415021.076998695) / 29.530588853);
        var off = mm - 11; if (off < 0) off += 12;
        if (b11 - a11 > 365)
        {
            var leapOff = LeapOffset(a11); var leapMonth = leapOff - 2; if (leapMonth < 0) leapMonth += 12;
            if (off >= leapOff) off += 1;
        }
        return FromJd(NewMoon(k + off) + dd - 1);
    }
}

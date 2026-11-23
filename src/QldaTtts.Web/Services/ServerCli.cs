using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using QldaTtts.Web.Controllers;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Bản 1.10.2: lệnh thiết lập chạy trên máy chủ (chế độ một đơn vị), dành cho quản trị máy chủ khi không tiện đăng nhập giao diện.
/// Chỉ người có quyền quản trị Windows trên máy chủ chạy được (cần đọc tệp cấu hình chứa chuỗi kết nối CSDL); mọi lệnh đều ghi nhật ký.
///   --nhap-ework &lt;tệp json&gt; [--tai-khoan-ra &lt;tệp csv&gt;]   nạp dữ liệu e-work như nút "Chuyển dữ liệu từ e-work"; tài khoản mới ghi ra tệp CSV.
///        Biến môi trường QLDA_MAT_KHAU_CHUNG: mật khẩu ban đầu chung cho tài khoản mới (bắt đổi ở lần đăng nhập đầu); không có thì cấp mật khẩu tạm riêng
///   --thong-tin-don-vi &lt;tệp json&gt;                       gộp các mục Thông tin đơn vị (appName, bannerTitle…) vào cài đặt hiện có
///   --tao-khoa-chep &lt;tệp khóa&gt; [--tu-ngay yyyy-MM-dd]   tạo khóa chép chấm công sang e-work, ghi thẳng ra tệp (không in ra màn hình)
///   --doi-chieu-luong &lt;yyyy-MM&gt; [--ra &lt;tệp csv&gt;]        bản 1.10.4: đối chiếu bảng lương QLDA tính với bảng lương e-work đã chuyển (BangLuongs), ghi tệp CSV; màn hình chỉ in số người lệch
/// </summary>
public static class ServerCli
{
    public const string By = "he-thong";

    public static async Task<bool> RunAsync(AppDbContext db, string[] args)
    {
        string? Arg(string name) { var i = Array.IndexOf(args, name); return i >= 0 && i + 1 < args.Length ? args[i + 1] : null; }
        void Fail(string m) { Console.Error.WriteLine(m); Environment.Exit(1); }
        void Log(string action, string module, string target) => db.Logs.Add(new AuditLog
        {
            Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = DateTime.UtcNow, Username = By, Action = action, Module = module,
            Target = target.Length > 500 ? target[..500] : target
        });

        if (args.Contains("--nhap-ework"))
        {
            var file = Arg("--nhap-ework");
            if (file is null || !File.Exists(file)) Fail($"Không thấy tệp: {file}");
            var outCsv = Arg("--tai-khoan-ra") ?? Path.Combine(Path.GetDirectoryName(Path.GetFullPath(file!))!, $"tai_khoan_moi_{DateTime.Now:yyyyMMdd_HHmm}.csv");
            await using var fs = File.OpenRead(file!);
            using var doc = await JsonDocument.ParseAsync(fs);
            // Mật khẩu ban đầu chung: quản trị gõ trên máy chủ (thiet-lap-may-chu.ps1 -MatKhauChung), truyền qua biến môi trường, không qua dòng lệnh
            var common = Environment.GetEnvironmentVariable("QLDA_MAT_KHAU_CHUNG");
            if (string.IsNullOrEmpty(common)) common = null;
            else if (!Passwords.Strong(common)) Fail("Mật khẩu ban đầu chung phải có ít nhất 8 ký tự, gồm chữ và số.");
            db.Database.SetCommandTimeout(600);
            EworkImport.Report rep;
            try { rep = await EworkImport.Run(db, doc.RootElement, By, common); }
            catch (Exception ex)
            {
                var root = ex; while (root.InnerException is not null) root = root.InnerException;
                Fail("Nạp e-work lỗi: " + root.Message + "\nChạy lại lệnh sau khi xử lý (chạy lại không sinh trùng)."); return true;
            }
            Log("Chuyển dữ liệu từ e-work (dòng lệnh trên máy chủ)", "Văn phòng", rep.Summary);
            await db.SaveChangesAsync();
            if (rep.NewAccounts.Count > 0) // 1.10.11: chỉ ghi tệp khi có tài khoản mới (chạy lại không sinh tệp)
            {
                var sb = new StringBuilder("Họ tên,Tên đăng nhập,Mật khẩu ban đầu,Phòng ban\r\n");
                string C(string? s) => "\"" + (s ?? "").Replace("\"", "\"\"") + "\"";
                foreach (var a in rep.NewAccounts) sb.Append($"{C(a.Name)},{C(a.Username)},{C(a.Password)},{C(a.Department)}\r\n");
                foreach (var l in rep.LinkedAccounts) sb.Append($"{C(l)},,{C("(tài khoản đã có, giữ mật khẩu)")},\r\n");
                await File.WriteAllTextAsync(outCsv, sb.ToString(), new UTF8Encoding(true));
                Console.WriteLine($"Tài khoản mới và mật khẩu tạm: {outCsv} (chỉ giao quản trị; người dùng đổi mật khẩu khi đăng nhập lần đầu).");
            }
            Console.WriteLine("Đã chuyển: " + rep.Summary);
            foreach (var w in rep.Warnings) Console.WriteLine("Lưu ý: " + w);
            return true;
        }

        if (args.Contains("--thong-tin-don-vi"))
        {
            var file = Arg("--thong-tin-don-vi");
            if (file is null || !File.Exists(file)) Fail($"Không thấy tệp: {file}");
            JsonObject? input = null;
            try { input = JsonNode.Parse(await File.ReadAllTextAsync(file!)) as JsonObject; } catch (JsonException e) { Fail("Tệp không đúng JSON: " + e.Message); }
            if (input is null) { Fail("Tệp phải là một đối tượng JSON."); return true; }
            var row = db.Settings.FirstOrDefault(s => s.Key == BrandingController.Key);
            JsonObject cur;
            try { cur = (row?.Value is { Length: > 0 } v ? JsonNode.Parse(v) as JsonObject : null) ?? new JsonObject(); } catch (JsonException) { cur = new JsonObject(); }
            var changed = new List<string>();
            foreach (var (k, _, max) in BrandingController.Fields)
            {
                if (!input.TryGetPropertyValue(k, out var node) || node is null) continue;
                var val = node.ToString().Trim();
                if (val.Length == 0) continue;
                if (val.Length > max) val = val[..max];
                if (k is "bannerDeco" or "printNation" && val is not ("0" or "1")) continue;
                if (k == "color" && !BrandingController.Colors.ContainsKey(val)) continue;
                if (k == "style" && val is not ("gov" or "tech")) continue;
                // Đổi lĩnh vực cần nạp danh mục theo nghề: làm trong giao diện (Quản trị hệ thống → Thông tin đơn vị)
                if (k == "field") { Console.WriteLine("Bỏ qua 'field': đổi lĩnh vực trong giao diện để nạp danh mục kèm theo."); continue; }
                cur[k] = val; changed.Add(k);
            }
            foreach (var p in input) if (!BrandingController.Fields.Any(f => f.Key == p.Key)) Console.WriteLine($"Bỏ qua mục không hỗ trợ: {p.Key}");
            if (changed.Count == 0) { Console.WriteLine("Không có mục nào thay đổi."); return true; }
            if (row is null) db.Settings.Add(new AppSetting { Key = BrandingController.Key, Value = cur.ToJsonString(), UpdatedAt = DateTime.UtcNow, UpdatedBy = By });
            else { row.Value = cur.ToJsonString(); row.UpdatedAt = DateTime.UtcNow; row.UpdatedBy = By; }
            Log("Cập nhật thông tin đơn vị (dòng lệnh trên máy chủ)", "Quản trị hệ thống", string.Join(", ", changed));
            await db.SaveChangesAsync();
            Console.WriteLine("Đã cập nhật: " + string.Join(", ", changed));
            return true;
        }

        if (args.Contains("--tao-khoa-chep"))
        {
            var file = Arg("--tao-khoa-chep");
            if (string.IsNullOrWhiteSpace(file) || file.StartsWith("--")) Fail("Cần đường dẫn tệp lưu khóa: --tao-khoa-chep <tệp>");
            var from = Arg("--tu-ngay");
            if (from is not null && !DateOnly.TryParseExact(from, "yyyy-MM-dd", out _)) Fail("--tu-ngay phải dạng yyyy-MM-dd");
            var dir = Path.GetDirectoryName(Path.GetFullPath(file!));
            if (dir is null || !Directory.Exists(dir)) Fail($"Không có thư mục: {dir}");
            var key = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
            await File.WriteAllTextAsync(file!, key, Encoding.ASCII);
            var s = VpSettings.Load(db);
            s.SyncKeyHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(key)));
            s.SyncFrom = from ?? s.SyncFrom ?? VnTime.Now.ToString("yyyy-MM-dd");
            VpSettings.Save(db, s, By);
            Log("Tạo khóa chép chấm công sang e-work (dòng lệnh trên máy chủ)", "Điểm danh", "từ ngày " + s.SyncFrom);
            await db.SaveChangesAsync();
            Console.WriteLine($"Đã tạo khóa chép chấm công (từ ngày {s.SyncFrom}), lưu tại {Path.GetFullPath(file!)}. Khóa cũ (nếu có) hết hiệu lực.");
            return true;
        }
        if (args.Contains("--doi-chieu-luong"))
        {
            var month = Arg("--doi-chieu-luong");
            if (month is null || !System.Text.RegularExpressions.Regex.IsMatch(month, @"^\d{4}-\d{2}$")) { Fail("Cần tháng dạng yyyy-MM: --doi-chieu-luong 2026-10"); return true; }
            var outCsv = Arg("--ra") ?? Path.Combine(AppContext.BaseDirectory, $"doi_chieu_luong_{month}.csv");
            var (y, m) = (int.Parse(month[..4]), int.Parse(month[5..]));
            var ew = (await db.EworkArchive.AsNoTracking().Where(r => r.TableName == "BangLuongs").ToListAsync())
                .Select(r => JsonNode.Parse(r.Data) as JsonObject).Where(o => o is not null && (int?)Num(o!, "Nam") == y && (int?)Num(o!, "Thang") == m).ToList();
            if (ew.Count == 0) { Fail($"Không có bảng lương e-work tháng {month} trong dữ liệu đã chuyển."); return true; }
            var emps = await db.Employees.AsNoTracking().Where(e => e.EworkId != null).ToListAsync();
            var slips = await LuongController.ComputeFor(db, month);
            var cols = new (string Name, string Ew, Func<LuongController.Slip, decimal> Q)[]
            {
                ("Lương cơ bản", "LuongCoBan", s => s.BaseSalary), ("Công chuẩn", "NgayCongChuan", s => s.Standard), ("Công hưởng lương", "NgayCongThucTe", s => s.Paid),
                ("Phụ cấp", "TongPhuCap", s => s.Allowances), ("Tăng ca", "TienTangCa", s => s.OtPay), ("Công tác phí", "CongTacPhi", s => s.TripPay),
                ("Thưởng", "Thuong", s => s.KpiBonus + s.Bonus), ("BHXH người lao động", "BHXH_NLD", s => s.Bhxh), ("BHYT người lao động", "BHYT_NLD", s => s.Bhyt),
                ("BHTN người lao động", "BHTN_NLD", s => s.Bhtn), ("Thuế TNCN", "ThueTNCN", s => s.Pit), ("Tạm ứng", "TamUng", s => s.Advance), ("Thực lĩnh", "LuongThucNhan", s => s.Net)
            };
            string C(string? v) => "\"" + (v ?? "").Replace("\"", "\"\"") + "\"";
            var sb = new StringBuilder("Họ tên,Mục," + "e-work,QLDA,Chênh lệch\r\n");
            int lech = 0, khop = 0, thieu = 0;
            foreach (var o in ew)
            {
                var uid = o!["UserId"]?.ToString(); var name = o["FullName"]?.ToString() ?? uid;
                var e = emps.FirstOrDefault(x => x.EworkId == uid); var sl = e is null ? null : slips.FirstOrDefault(x => x.EmployeeId == e.Id);
                if (sl is null) { thieu++; sb.Append($"{C(name)},{C("Không có trên QLDA")},,,\r\n"); continue; }
                var any = false;
                foreach (var (cn, ek, q) in cols)
                {
                    var a = (decimal)(Num(o, ek) ?? 0); var b = q(sl);
                    var diff = b - a; var tol = cn.StartsWith("Công") ? 0.01m : 1000m; // lệch dưới 1.000 đồng do làm tròn bỏ qua
                    if (Math.Abs(diff) > tol) { any = true; sb.Append($"{C(name)},{C(cn)},{a:0.##},{b:0.##},{diff:0.##}\r\n"); }
                }
                if (any) lech++; else { khop++; sb.Append($"{C(name)},{C("Khớp")},,,\r\n"); }
            }
            await File.WriteAllTextAsync(outCsv, sb.ToString(), new UTF8Encoding(true));
            Log("Đối chiếu lương với e-work (dòng lệnh trên máy chủ)", "Lương", $"Tháng {month}: {khop} khớp, {lech} lệch, {thieu} không có");
            await db.SaveChangesAsync();
            Console.WriteLine($"Đối chiếu lương tháng {month}: {ew.Count} người trên e-work, {khop} khớp, {lech} có lệch, {thieu} không có trên QLDA. Chi tiết: {outCsv} (có số tiền lương: chỉ giao Kế toán, xem xong xóa).");
            // chẩn đoán (không có dữ liệu cá nhân): thiết lập thứ Bảy, công chuẩn, ngày nghỉ trong tháng
            var vsd = VpSettings.Load(db); var m0 = DateOnly.Parse(month + "-01");
            var offs = Enumerable.Range(0, m0.AddMonths(1).DayNumber - m0.DayNumber).Select(k => m0.AddDays(k)).Select(d => (d, i: VnTime.Day(d, vsd))).Where(x => x.i.Value < 1 && x.d.DayOfWeek != DayOfWeek.Sunday).Select(x => $"{x.d:dd/MM} {x.i.Kind}");
            var stdD = Enumerable.Range(0, m0.AddMonths(1).DayNumber - m0.DayNumber).Sum(k => VnTime.Day(m0.AddDays(k), vsd).Value);
            var lockedN = await db.Payslips.CountAsync(x => x.Month == month && x.LockedAt != null);
            if (lockedN > 0) Console.WriteLine($"Lưu ý: bảng lương tháng {month} đã chốt {lockedN} phiếu, đối chiếu dùng số liệu lúc chốt. Muốn tính theo thiết lập mới: Mở chốt rồi chạy lại.");
            Console.WriteLine($"Thiết lập thứ Bảy: {vsd.Saturday}{(vsd.Saturday == "cach-tuan" ? " (mốc " + vsd.SaturdayAnchor + ")" : "")}; công chuẩn tháng theo lịch: {stdD:0.#}; ngày nghỉ, nửa ngày (trừ Chủ nhật): {string.Join(", ", offs)}");
            return true;
        }
        return false;
    }

    private static double? Num(JsonObject o, string k) => o[k] is JsonValue v && double.TryParse(v.ToString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : null;
}

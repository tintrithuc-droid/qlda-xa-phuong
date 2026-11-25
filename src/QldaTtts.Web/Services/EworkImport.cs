using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Chuyển dữ liệu từ e-work (tệp JSON do deploy/ework/xuat-ework.ps1 xuất từ SQL Server) vào phân hệ Văn phòng.
/// Khớp theo mã e-work nên chạy lại nhiều lần không sinh trùng; dữ liệu đã sửa trên QLDA không bị ghi đè (trừ chấm công, đề xuất chuyển từ e-work).
/// </summary>
public static class EworkImport
{
    public class Report
    {
        public int Departments { get; set; }
        public int Employees { get; set; }
        public int Attendances { get; set; }
        public int Requests { get; set; }
        public int Holidays { get; set; }
        public int Meetings { get; set; }
        public int Notices { get; set; }
        public int PayProfiles { get; set; }
        public int HrRecords { get; set; }
        public int Projects { get; set; }
        public int Tasks { get; set; }
        public int Groups { get; set; }
        /// <summary>Bản 1.10.10: phiếu xác nhận tăng ca e-work (TaskTangCas).</summary>
        public int OtSlips { get; set; }
        /// <summary>Bản 1.10.12: đề xuất đã nạp trước được sửa lại loại (nghỉ ngoài phép -> nghỉ không lương).</summary>
        public int Fixed { get; set; }
        /// <summary>Số dòng lưu trữ theo từng bảng e-work.</summary>
        public Dictionary<string, int> Archive { get; set; } = new();
        public List<string> LinkedAccounts { get; set; } = new();
        /// <summary>Tài khoản mới tạo kèm mật khẩu tạm (chỉ trả về một lần cho quản trị, không lưu).</summary>
        public List<NewAccount> NewAccounts { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
        public string Summary => $"{Departments} phòng ban, {Employees} nhân sự, {Attendances} lượt chấm công, {Requests} đề xuất, {OtSlips} phiếu tăng ca, {Fixed} đề xuất sửa loại, {Meetings} lịch họp, {Notices} thông báo, {PayProfiles} hồ sơ lương, {HrRecords} mục hồ sơ nhân sự (bằng cấp, khen thưởng, kỷ luật), {Projects} dự án, {Tasks} nhiệm vụ và công việc, {Groups} nhóm vai trò mới, {NewAccounts.Count} tài khoản mới, lưu trữ {Archive.Values.Sum()} dòng / {Archive.Count} bảng";
    }
    public record NewAccount(string Name, string Username, string Password, string? Department);

    private static string? S(JsonElement e, string k) => e.TryGetProperty(k, out var v) && v.ValueKind != JsonValueKind.Null ? (v.ValueKind == JsonValueKind.String ? v.GetString() : v.ToString()) : null;
    private static double? Num(JsonElement e, string k) => double.TryParse(S(e, k), NumberStyles.Any, CultureInfo.InvariantCulture, out var d) ? d : null;
    private static bool Bool(JsonElement e, string k, bool def) => S(e, k) is { } s ? s is "true" or "True" or "1" : def;
    private static DateTime? Dt(string? s) => DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d) ? d : null;
    private static DateOnly? Date(string? s) => Dt(s) is { } d && d.Year > 1900 ? DateOnly.FromDateTime(d) : null;
    private static IEnumerable<JsonElement> Arr(JsonElement root, string k) => root.TryGetProperty(k, out var a) && a.ValueKind == JsonValueKind.Array ? a.EnumerateArray() : Enumerable.Empty<JsonElement>();
    private static string Norm(string? s) => (s ?? "").Trim().ToLowerInvariant();

    /// <param name="commonPassword">Bản 1.10.2: mật khẩu ban đầu chung do quản trị đặt (bắt đổi ở lần đăng nhập đầu); null thì cấp mật khẩu tạm ngẫu nhiên riêng từng người.</param>
    public static async Task<Report> Run(AppDbContext db, JsonElement root, string by, string? commonPassword = null)
    {
        var rep = new Report(); var now = DateTime.UtcNow;

        // ---- phòng ban
        var depts = await db.Departments.ToListAsync();
        var deptByEw = new Dictionary<string, Department>();
        foreach (var p in Arr(root, "phongbans"))
        {
            var ew = S(p, "Id"); if (ew is null) continue;
            var d = depts.FirstOrDefault(x => x.EworkId == ew) ?? depts.FirstOrDefault(x => Norm(x.Name) == Norm(S(p, "Name")));
            if (d is null) { d = new Department { Id = "pb-" + Guid.NewGuid().ToString("N")[..12], Name = S(p, "Name") ?? "", Code = S(p, "Code") ?? "", Order = (int)(Num(p, "Sort") ?? 0) }; db.Departments.Add(d); depts.Add(d); rep.Departments++; }
            d.EworkId = ew; d.UpdatedAt = now; d.UpdatedBy = by; deptByEw[ew] = d;
        }

        // ---- nhân sự, tài khoản
        var users = await db.Users.ToListAsync();
        // Bản 1.10.4: bộ vai trò doanh nghiệp (Nhân viên, Trưởng phòng, Kế toán, Ban giám đốc); tài khoản mới hoặc chưa có nhóm nhận nhóm theo vai trò e-work
        rep.Groups = CompanyRoles.Ensure(db, by);
        var emps = await db.Employees.ToListAsync();
        var hoso = Arr(root, "hoso").GroupBy(h => S(h, "UserId") ?? "").ToDictionary(g => g.Key, g => g.OrderByDescending(h => S(h, "CreatedDate")).First());
        var empByEw = new Dictionary<string, Employee>();
        var userNameOf = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var u in Arr(root, "users"))
        {
            var ew = S(u, "Id"); if (ew is null) continue;
            var role = S(u, "RoleName") ?? S(u, "UserRole") ?? "";
            var pos = S(u, "TenChucVu");
            if (Regex.IsMatch(role, "API|KETNOI", RegexOptions.IgnoreCase)) continue;
            var uname = Norm(S(u, "UserName")); userNameOf[ew] = uname;
            var email = Norm(S(u, "Email"));
            var active = Bool(u, "Status", true) && !Bool(u, "IsLock", false) && !Bool(u, "LockedOut", false);
            hoso.TryGetValue(ew, out var h);
            var e = emps.FirstOrDefault(x => x.EworkId == ew);
            var acc = users.FirstOrDefault(x => x.Username == uname) ?? (email.Length > 0 ? users.FirstOrDefault(x => Norm(x.Email) == email) : null);
            var name = S(u, "FullName") ?? (h.ValueKind == JsonValueKind.Object ? S(h, "FullName") : null) ?? acc?.Name ?? uname;
            var deptEw = S(u, "PhongBan") ?? (h.ValueKind == JsonValueKind.Object ? S(h, "PhongBan") : null);
            Department? dept = deptEw is not null && deptByEw.TryGetValue(deptEw, out var dd) ? dd : null;
            if (acc is null && active)
            {
                var un = Passwords.ValidUsername(uname) ? uname : Regex.Replace(email.Split('@')[0], "[^a-z0-9._-]", "");
                if (!Passwords.ValidUsername(un) || users.Any(x => x.Username == un)) { rep.Warnings.Add($"Không tạo được tài khoản cho {name} (tên đăng nhập '{uname}')."); }
                else
                {
                    var pw = commonPassword ?? TempPassword();
                    acc = new AppUser { Id = "u-" + Guid.NewGuid().ToString("N")[..12], Username = un, Name = name, Email = S(u, "Email"), Phone = S(u, "PhoneNumber"),
                        Unit = dept?.Name, GroupId = CompanyRoles.GroupFor(role, pos), Active = true, MustChangePassword = true, CreatedAt = now, UpdatedAt = now, UpdatedBy = by };
                    acc.PasswordHash = Passwords.Hash(acc, pw);
                    db.Users.Add(acc); users.Add(acc);
                    rep.NewAccounts.Add(new NewAccount(name, un, commonPassword is null ? pw : "(mật khẩu ban đầu chung)", dept?.Name));
                }
            }
            else if (acc is not null)
            {
                rep.LinkedAccounts.Add($"{name} → {acc.Username}");
                if (acc.GroupId is null) { acc.GroupId = CompanyRoles.GroupFor(role, pos); acc.UpdatedAt = now; }
                // 1.10.15: tài khoản có sẵn từ trước ở nhóm khác bộ vai trò công ty thì không tự đổi (có thể đang dùng phần dự án), chỉ báo để quản trị chọn
                else if (!CompanyRoles.All.Any(x => x.Id == acc.GroupId) && acc.GroupId != "g-admin")
                    rep.Warnings.Add($"{name} ({acc.Username}) đang ở nhóm khác bộ vai trò công ty; theo e-work nên là {CompanyRoles.NameOf(CompanyRoles.GroupFor(role, pos))}. Quản trị đổi nhóm ở Người dùng.");
            }
            if (Regex.IsMatch(role, "ADMIN|QUANTRI", RegexOptions.IgnoreCase)) rep.Warnings.Add($"{name} là quản trị trên e-work: tài khoản nhận nhóm {CompanyRoles.NameOf(CompanyRoles.GroupFor(role, pos))}, quản trị chính tự gán quyền quản trị nếu cần.");
            if (acc is not null && emps.Any(x => x.UserId == acc.Id && x.EworkId != ew)) acc = null; // tài khoản đã gắn hồ sơ khác
            if (e is null)
            {
                e = emps.FirstOrDefault(x => acc is not null && x.UserId == acc.Id) ?? new Employee { Id = "ns-" + Guid.NewGuid().ToString("N")[..12] };
                if (db.Entry(e).State == EntityState.Detached) { db.Employees.Add(e); emps.Add(e); rep.Employees++; }
                e.Name = name; e.DepartmentId = dept?.Id; e.Position = S(u, "TenChucVu") ?? (h.ValueKind == JsonValueKind.Object ? S(h, "TenChucVu") : null);
                e.Email = S(u, "Email"); e.Phone = S(u, "PhoneNumber") ?? (h.ValueKind == JsonValueKind.Object ? S(h, "DienThoai") : null);
                e.Attendance = Bool(u, "IsChamCong", true);
                e.Status = active ? "Đang làm việc" : "Nghỉ việc";
                if (h.ValueKind == JsonValueKind.Object)
                {
                    e.IdNumber = S(h, "CCCD"); e.Birthday = Date(S(h, "NgaySinh")); e.Gender = S(h, "TenGioiTinh"); e.IdDate = Date(S(h, "NgayCap"));
                    e.IdPlace = S(h, "TenNoiCap") ?? S(h, "NoiCap"); e.Address = S(h, "DiaChi"); e.BankAccount = S(h, "TaiKhoanNH"); e.BankName = S(h, "TenNganHang") ?? S(h, "NganHang");
                    e.StartDate = Date(S(h, "NgayLamChinhThuc"));
                    if (Date(S(h, "NgayNghiViec")) is { } nv && nv <= DateOnly.FromDateTime(DateTime.Today)) e.Status = "Nghỉ việc";
                }
            }
            e.EworkId = ew; e.UserId ??= acc?.Id; e.UpdatedAt = now; e.UpdatedBy = by;
            if (h.ValueKind == JsonValueKind.Object && e.EndDate is null && Date(S(h, "NgayNghiViec")) is { } nd) e.EndDate = nd; // 1.10.4
            empByEw[ew] = e;
            // 1.10.12: e-work bỏ cờ IsChamCong khi người lao động nghỉ việc nhưng vẫn tính công theo chấm công thực tế -> người đã nghỉ việc vẫn tính theo điểm danh
            if (!active && !e.Attendance) e.Attendance = true;
            // Trưởng phòng theo vai trò e-work
            if (dept is not null && dept.ManagerUserId is null && acc is not null && Regex.IsMatch(role, "LANHDAO", RegexOptions.IgnoreCase)) dept.ManagerUserId = acc.Id;
        }
        await Save(db, rep);

        // ---- chấm công (mỗi người mỗi ngày một dòng: giờ vào sớm nhất)
        var have = (await db.Attendances.AsNoTracking().Select(a => new { a.EmployeeId, a.Date }).ToListAsync()).Select(a => a.EmployeeId + "|" + a.Date.ToString("yyyy-MM-dd")).ToHashSet();
        foreach (var g in Arr(root, "chamcong").Select(c => new { c, uid = S(c, "UserId"), t = Dt(S(c, "NgayChamCong")) })
                     .Where(x => x.uid is not null && x.t is not null && empByEw.ContainsKey(x.uid!)).GroupBy(x => (x.uid, DateOnly.FromDateTime(x.t!.Value))))
        {
            var e = empByEw[g.Key.uid!]; var key = e.Id + "|" + g.Key.Item2.ToString("yyyy-MM-dd");
            if (have.Contains(key)) continue;
            var first = g.OrderBy(x => x.t).First(); var c = first.c;
            var txt = Norm((S(c, "ViTriDiemDanh") ?? "") + " " + (S(c, "TrangThaiDiemDanh") ?? "") + " " + (S(c, "ChamCongDacThu") ?? ""));
            var place = txt.Contains("online") ? "Làm việc online"
                : txt.Contains("ngoài") || txt.Contains("6a80c00a") ? "Ngoài công ty"
                : txt.Contains("cty") || txt.Contains("công ty") ? "Trong công ty" : "Ngoài công ty";
            db.Attendances.Add(new Attendance
            {
                Id = "cc-" + Guid.NewGuid().ToString("N")[..16], EmployeeId = e.Id, Date = g.Key.Item2, InAt = VnTime.ToUtc(first.t!.Value), InPlace = place,
                InLat = Num(c, "ViDo"), InLng = Num(c, "KinhDo"), InIp = S(c, "IPDiemDanh"), Site = S(c, "ViTriDiemDanh"),
                LateMinutes = (int)Math.Max(0, Num(c, "SoPhutDiMuon") ?? 0), Source = "e-work", EworkId = S(c, "Id"), SyncedAt = now, UpdatedAt = now, UpdatedBy = by
            });
            have.Add(key); rep.Attendances++;
        }

        // ---- đề xuất
        var reqs = await db.Requests.AsNoTracking().Where(r => r.EworkId != null).Select(r => r.EworkId!).ToListAsync();
        var haveReq = reqs.ToHashSet();
        var byUserName = empByEw.ToDictionary(kv => userNameOf.TryGetValue(kv.Key, out var un) ? un : kv.Key, kv => kv.Value);
        var seq = await db.Requests.CountAsync();
        foreach (var x in Arr(root, "dexuat"))
        {
            var ew = S(x, "Id"); if (ew is null) continue;
            // 1.10.12: e-work ghi loại nghỉ trong JsonDeXuat: LoaiNghiPhep = NghiNgoaiPhep (hết phép) thì không hưởng lương
            bool OutOfLeave()
            {
                try { var jj = JsonDocument.Parse(S(x, "JsonDeXuat") ?? "{}").RootElement; return jj.ValueKind == JsonValueKind.Object && Norm(S(jj, "LoaiNghiPhep")) == "nghingoaiphep"; } catch { return false; }
            }
            if (haveReq.Contains(ew))
            {
                if (OutOfLeave()) foreach (var q in await db.Requests.Where(r => r.EworkId == ew && r.Type == "Nghỉ phép").ToListAsync()) { q.Type = "Nghỉ không lương"; q.DecisionNote = "Nghỉ ngoài phép (e-work)"; rep.Fixed++; }
                continue;
            }
            var cb = S(x, "CreatedBy") ?? "";
            var e = empByEw.TryGetValue(cb, out var ee) ? ee : byUserName.TryGetValue(Norm(cb), out var e2) ? e2 : null;
            if (e is null) continue;
            JsonElement j = default; try { j = JsonDocument.Parse(S(x, "JsonDeXuat") ?? "{}").RootElement; } catch { }
            string? J(params string[] ks) { if (j.ValueKind != JsonValueKind.Object) return null; foreach (var k in ks) if (S(j, k) is { Length: > 0 } v) return v; return null; }
            decimal? Jn(params string[] ks) => decimal.TryParse(J(ks), NumberStyles.Any, CultureInfo.InvariantCulture, out var d) ? d : null;
            var created = Dt(S(x, "CreatedDate")) ?? DateTime.Now;
            var st = Norm(S(x, "TenTrangThaiXuLy"));
            var status = st.Contains("từ chối") || st.Contains("không duyệt") ? "Từ chối" : st.Contains("hủy") ? "Đã hủy"
                : st.Contains("chờ") || st.Contains("chưa") || st.Length == 0 ? "Chờ duyệt" : st.Contains("duyệt") || st.Contains("hoàn thành") ? "Đã duyệt" : "Chờ duyệt";
            string? note = null;
            if (status == "Chờ duyệt" && created < DateTime.Now.AddDays(-30)) { status = "Đã hủy"; note = "Chờ duyệt quá 30 ngày trên e-work"; }
            var from = Dt(J("ThoiGianBatDau", "TuNgay", "NgayBatDau", "ThoiGian", "Ngay"));
            var to = Dt(J("ThoiGianKetThuc", "DenNgay", "NgayKetThuc"));
            // Bản 1.10.3: mô tả dài hơn tiêu đề (300 ký tự) thì giữ nguyên văn trong phần lý do
            var desc = S(x, "RefObjectDescription"); var reason = S(x, "LyDo");
            if (desc is { Length: > 300 }) reason = string.IsNullOrWhiteSpace(reason) ? desc : reason + "\n\n" + desc;
            db.Requests.Add(new Request
            {
                Id = "dx-" + Guid.NewGuid().ToString("N")[..16], Code = $"DX-EW{++seq:0000}", Type = MapType(S(x, "TenDeXuat")) is var mt && mt == "Nghỉ phép" && OutOfLeave() ? "Nghỉ không lương" : mt, EmployeeId = e.Id,
                Title = Cut(desc, 300), FromAt = from is { } f ? VnTime.ToUtc(f) : null, ToAt = to is { } t ? VnTime.ToUtc(t) : null,
                Days = Jn("SoNgay", "SoNgayNghi", "SoNgayCongTac"), Hours = Jn("SoGio", "SoGioTangCa", "TongSoGio"), Amount = Jn("SoTien", "TongTien", "ThanhTien", "SoTienDeNghi"),
                Place = J("DiaDiem", "NoiCongTac", "DiaDiemCongTac", "LoTrinh"), Reason = reason, Status = status,
                ApproverName = S(x, "TenNguoiDuyet"), DecidedAt = Dt(S(x, "NgayHoanThanh")) is { } dc ? VnTime.ToUtc(dc) : null, DecisionNote = note,
                CreatedAt = VnTime.ToUtc(created), EworkId = ew, UpdatedAt = now, UpdatedBy = by
            });
            rep.Requests++;
        }

        // ---- thiết lập điểm danh (chỉ điền khi còn trống), ngày nghỉ
        var s = VpSettings.Load(db);
        var radius = 500;
        foreach (var p in Arr(root, "thamso"))
        {
            var k = (S(p, "TenThamSo") ?? "").ToUpperInvariant(); var v = S(p, "GiaTri") ?? "";
            if (k.Contains("BAN_KINH") && int.TryParse(Regex.Match(v, @"\d+").Value, out var r)) radius = r;
            // 1.10.15: lấy đủ giờ ca của e-work (trước chỉ lấy giờ điểm danh, ca sáng/chiều và giờ ra để mặc định 07:30-12:00, 13:00-17:00)
            var hm = Regex.Match(v, @"^(\d{1,2}):(\d{2})"); var t = hm.Success ? hm.Groups[1].Value.PadLeft(2, '0') + ":" + hm.Groups[2].Value : null;
            if (t is null) continue;
            if (k == "GIO_DIEM_DANH") s.CheckIn = t;
            else if (k == "GIO_CA_SANG") s.MorningStart = t;
            else if (k == "GIO_HET_CA_SANG") s.MorningEnd = t;
            else if (k == "GIO_CA_CHIEU") s.AfternoonStart = t;
            else if (k == "GIO_HET_CA_CHIEU") { s.AfternoonEnd = t; s.CheckOut = t; }
        }
        if (s.Places.Count == 0)
            foreach (var p in Arr(root, "toado").Where(p => Bool(p, "Status", true)))
                if (Num(p, "ViDo") is { } la && Num(p, "KinhDo") is { } ln) s.Places.Add(new VpSettings.Place { Name = S(p, "Description") ?? "Văn phòng", Lat = la, Lng = ln, Radius = radius });
        if (s.Ips.Count == 0) s.Ips = Arr(root, "ip").Where(p => Bool(p, "Status", true)).Select(p => (S(p, "IPCongTy") ?? "").Trim()).Where(x => x.Length > 0).Distinct().ToList();
        foreach (var n in Arr(root, "ngaynghi"))
        {
            if (Date(S(n, "Ngay")) is not { } d) continue;
            var half = Num(n, "Buoi") is { } b && b > 0 && b < 1;
            var name = Cut(Plain(S(n, "MoTa")).Replace("\n", " "), 100);
            var key = d.ToString("yyyy-MM-dd") + (half ? ":s" : "") + (string.IsNullOrEmpty(name) ? "" : " " + name);
            var i0 = s.Holidays.FindIndex(h => h.StartsWith(d.ToString("yyyy-MM-dd")));
            if (i0 < 0) { s.Holidays.Add(key); rep.Holidays++; }
            else if (s.Holidays[i0].Length <= 12 && !string.IsNullOrEmpty(name)) s.Holidays[i0] = s.Holidays[i0] + " " + name; // 1.10.4: bổ sung tên ngày nghỉ cho bản nạp trước
        }
        // Bản 1.10.4: e-work ghi từng thứ Bảy nghỉ (tuần làm, tuần nghỉ) vào ngày nghỉ: nhận ra lịch cách tuần, đặt thứ Bảy "cach-tuan" với mốc là một thứ Bảy đi làm
        var satOff = s.Holidays.Select(VnTime.ParseDay).Where(x => x is not null && x.Date.DayOfWeek == DayOfWeek.Saturday && x.Half is null && VnTime.WeekendNote(x.Name))
            .Select(x => x!.Date).OrderBy(x => x).ToList();
        if (s.Saturday == "khong" && satOff.Count >= 6 && satOff.Zip(satOff.Skip(1)).Count(p => p.Second.DayNumber - p.First.DayNumber == 14) >= (satOff.Count - 1) * 0.8)
        {
            s.Saturday = "cach-tuan"; s.SaturdayAnchor = satOff[^1].AddDays(7).ToString("yyyy-MM-dd");
            rep.Warnings.Add($"Thứ Bảy làm cách tuần (nhận từ {satOff.Count} thứ Bảy nghỉ trên e-work), mốc thứ Bảy đi làm {satOff[^1].AddDays(7):dd/MM/yyyy}. Kiểm tra ở Bảng công → Thiết lập điểm danh.");
        }
        VpSettings.Save(db, s, by);
        await Save(db, rep);

        var lt = root.TryGetProperty("luutru", out var l0) && l0.ValueKind == JsonValueKind.Object ? l0 : default;
        IEnumerable<JsonElement> Luu(string t) => lt.ValueKind == JsonValueKind.Object ? Arr(lt, t) : Arr(root, t);
        string? UserOf(string? ew) => ew is not null && empByEw.TryGetValue(ew, out var e) ? e.UserId : null;

        // ---- bản 1.10.10: phiếu xác nhận tăng ca e-work (TaskTangCas, lập sau khi làm) -> đề xuất "Tăng ca" tính lương (khóa "tc-<Id>").
        // Đề xuất tăng ca trước khi làm (QuanLyDeXuats) chỉ là đăng ký, không tính lương, để không cộng hai lần.
        var tcRows = Luu("TaskTangCas").ToList();
        if (tcRows.Count > 0)
        {
            foreach (var q in await db.Requests.Where(r => r.EworkId != null && !r.EworkId.StartsWith("tc-") && r.Type == "Tăng ca").ToListAsync())
                q.Type = OtRegisterType;
            var haveTc = (await db.Requests.AsNoTracking().Where(r => r.EworkId != null && r.EworkId.StartsWith("tc-")).Select(r => r.EworkId!).ToListAsync()).ToHashSet();
            var seqTc = await db.Requests.CountAsync();
            foreach (var x in tcRows)
            {
                var ew = S(x, "Id"); if (ew is null) continue; var key = Cut("tc-" + ew, 64)!;
                if (haveTc.Contains(key)) continue;
                Employee? e = null;
                foreach (var k in new[] { "UserId", "NguoiTangCa", "NguoiThucHien", "NguoiNhan", "CreatedBy" })
                    if (S(x, k) is { Length: > 0 } u && (empByEw.TryGetValue(u, out e) || byUserName.TryGetValue(Norm(u), out e))) break;
                if (e is null) { rep.Warnings.Add($"Phiếu tăng ca e-work {ew}: không tìm thấy người tăng ca, bỏ qua."); continue; }
                var day = Date(S(x, "NgayTangCa"));
                var t0 = Dt(S(x, "ThoiGianBatDau")); var t1 = Dt(S(x, "ThoiGianKetThuc"));
                DateTime? At(DateTime? t) => t is not { } v ? (day is { } d0 ? d0.ToDateTime(TimeOnly.MinValue) : null) : day is { } d && DateOnly.FromDateTime(v) != d ? d.ToDateTime(TimeOnly.FromDateTime(v)) : v;
                var from = At(t0); var to = t1 is null ? null : At(t1);
                if (from is null) { rep.Warnings.Add($"Phiếu tăng ca e-work {ew}: thiếu ngày tăng ca, bỏ qua."); continue; }
                if (to is { } tt && tt <= from) to = tt.AddDays(1);
                var hours = Num(x, "SoGio") is { } h && h > 0 ? (decimal)h : to is { } t2 ? Math.Round((decimal)(t2 - from.Value).TotalHours, 2) : 0;
                var st = Norm(S(x, "RefTenTrangThaiXuLy") ?? S(x, "TenTrangThaiXuLy"));
                var created = Dt(S(x, "CreatedDate")) ?? from.Value;
                var status = st.Contains("từ chối") || st.Contains("không duyệt") ? "Từ chối" : st.Contains("hủy") ? "Đã hủy"
                    : st.Contains("trình") || st.Contains("chờ") || st.Contains("chưa") || st.Length == 0 ? "Chờ duyệt" : st.Contains("duyệt") || st.Contains("hoàn thành") ? "Đã duyệt" : "Chờ duyệt";
                string? note = null;
                if (status == "Chờ duyệt" && created < DateTime.Now.AddDays(-30)) { status = "Đã hủy"; note = "Chờ duyệt quá 30 ngày trên e-work"; }
                var decided = status == "Đã duyệt" ? Dt(S(x, "NgayDuyet") ?? S(x, "NgayHoanThanh") ?? S(x, "ModifiedDate")) ?? created : (DateTime?)null;
                var apr = S(x, "TenNguoiDuyet") ?? (S(x, "NguoiDuyet") is { } nd && (empByEw.TryGetValue(nd, out var ae) || byUserName.TryGetValue(Norm(nd), out ae)) ? ae.Name : null);
                var kind = Norm(S(x, "TenLoaiTangCa"));
                db.Requests.Add(new Request
                {
                    Id = "dx-" + Guid.NewGuid().ToString("N")[..16], Code = $"DX-EW{++seqTc:0000}", Type = "Tăng ca", EmployeeId = e.Id,
                    Title = kind.Contains("gấp") || kind.Contains("yêu cầu") ? "Tăng ca theo yêu cầu (gấp)" : "Tăng ca đảm bảo tiến độ dự án (bình thường)",
                    FromAt = VnTime.ToUtc(from.Value), ToAt = to is { } t3 ? VnTime.ToUtc(t3) : null, Hours = hours,
                    Reason = Plain(S(x, "NoiDung")) is { Length: > 0 } rs ? rs : null, Status = status, ApproverName = Cut(apr, 200),
                    DecidedAt = decided is { } dd ? VnTime.ToUtc(dd) : null, DecisionNote = note,
                    CreatedAt = VnTime.ToUtc(created), EworkId = key, UpdatedAt = now, UpdatedBy = by
                });
                haveTc.Add(key); rep.OtSlips++;
            }
            await Save(db, rep);
        }

        // ---- lịch họp (khóa theo mã e-work: lh-ew-<Id>; đã có thì giữ bản trên QLDA)
        var haveM = (await db.Meetings.AsNoTracking().Where(m => m.Id.StartsWith("lh-ew-")).Select(m => m.Id).ToListAsync()).ToHashSet();
        var ketQua = Luu("KetQuaLichHops").Where(k => S(k, "RefId") is not null).GroupBy(k => S(k, "RefId")!)
            .ToDictionary(g => g.Key, g => string.Join("\n", g.OrderBy(k => Num(k, "Sort") ?? 0).Select(k => Plain(S(k, "NoiDung"))).Where(x => x.Length > 0)));
        var rooms = Luu("PhongHops").Where(r => S(r, "Id") is not null).ToDictionary(r => S(r, "Id")!, r => S(r, "Ten") ?? "");
        foreach (var m in Luu("LichHops"))
        {
            var ew = S(m, "Id"); if (ew is null) continue; var id = Cut("lh-ew-" + ew, 64);
            if (haveM.Contains(id) || Dt(S(m, "NgayBatDau")) is not { } st) continue;
            var content = Plain(S(m, "NoiDung"));
            var concl = string.Join("\n", new[] { Plain(S(m, "KetQuaCuocHop")), ketQua.TryGetValue(ew, out var kq) ? kq : "" }.Where(x => x.Length > 0));
            var stat = Norm(S(m, "TenTrangThaiXuLy"));
            var att = Regex.Split(S(m, "ThanhPhanThamDu") ?? "", "[,;\\s]+").Where(x => empByEw.ContainsKey(x)).Select(x => empByEw[x].Id).Distinct();
            var roomId = S(m, "PhongHop");
            db.Meetings.Add(new Meeting
            {
                Id = id, Kind = "Họp", Title = Cut(content.Split('\n')[0], 500) is { Length: > 0 } t ? t : "Cuộc họp", Content = content,
                StartAt = VnTime.ToUtc(st), EndAt = Dt(S(m, "NgayKetThuc")) is { } en && en > st ? VnTime.ToUtc(en) : null,
                Place = Cut(S(m, "TenPhongHop") ?? (roomId is not null && rooms.TryGetValue(roomId, out var rn) ? rn : null), 300),
                Chair = Cut(S(m, "TenNguoiChuTri"), 200), Participants = Cut(S(m, "TenThanhPhanThamDu"), 1000), AttendeeIds = string.Join(",", att) is { Length: > 0 } a ? a : null,
                Preparer = S(m, "TenThuKy") is { Length: > 0 } tk ? Cut("Thư ký: " + tk, 300) : null, Conclusion = concl.Length > 0 ? concl : null,
                Status = stat.Contains("hủy") ? "Đã hủy" : stat.Contains("hoãn") ? "Đã hoãn" : "Đã lên lịch",
                CreatedByUserId = UserOf(S(m, "CreatedBy")), CreatedAt = VnTime.ToUtc(Dt(S(m, "CreatedDate")) ?? st), UpdatedAt = now, UpdatedBy = by
            });
            haveM.Add(id); rep.Meetings++;
        }

        // ---- thông báo (tb-ew-<Id>; coi như mọi người đã đọc để không dồn vào hộp thư)
        var haveN = (await db.Notices.AsNoTracking().Where(n => n.Id.StartsWith("tb-ew-")).Select(n => n.Id).ToListAsync()).ToHashSet();
        foreach (var n in Luu("ThongBaos"))
        {
            var ew = S(n, "Id"); if (ew is null) continue; var id = Cut("tb-ew-" + ew, 64);
            if (haveN.Contains(id)) continue;
            var depIds = Regex.Split(S(n, "PhamViThongBao") ?? "", "[,;\\s]+").Where(x => deptByEw.ContainsKey(x)).Select(x => deptByEw[x].Id).Distinct();
            db.Notices.Add(new Notice
            {
                Id = id, Title = Cut(S(n, "TieuDe"), 500) is { Length: > 0 } t ? t : "Thông báo", Body = Plain(S(n, "NoiDung")),
                DeptIds = string.Join(",", depIds) is { Length: > 0 } dp ? dp : null, PublishedAt = VnTime.ToUtc(Dt(S(n, "CreatedDate")) ?? DateTime.Now),
                AuthorName = Cut(S(n, "TenNguoiNhap"), 200), CreatedByUserId = UserOf(S(n, "CreatedBy") ?? S(n, "NguoiNhap")), UpdatedAt = now, UpdatedBy = by
            });
            haveN.Add(id); rep.Notices++;
        }
        await Save(db, rep);

        // ---- hồ sơ lương: lương cơ bản, phụ cấp, người phụ thuộc mới nhất theo ngày áp dụng (chỉ tạo khi QLDA chưa có)
        var hsUser = Luu("BangLuongCoBans").Where(h => S(h, "Id") is not null && S(h, "UserId") is not null).GroupBy(h => S(h, "Id")!).ToDictionary(g => g.Key, g => S(g.First(), "UserId")!);
        string? UserOfRef(JsonElement r) => S(r, "RefId") is { } rid && hsUser.TryGetValue(rid, out var u) ? u : null;
        DateTime Applied(JsonElement r) => Dt(S(r, "NgayApDung")) ?? (Num(r, "NamApDung") is { } y && y > 1900 ? new DateTime((int)y, (int)Math.Clamp(Num(r, "ThangApDung") ?? 1, 1, 12), 1) : Dt(S(r, "CreatedDate")) ?? DateTime.MinValue);
        var today0 = DateTime.Today.AddMonths(1);
        var baseOf = Luu("RefBangLuongCoBans").Select(r => (u: UserOfRef(r), r)).Where(x => x.u is not null && Applied(x.r) <= today0)
            .GroupBy(x => x.u!).ToDictionary(g => g.Key, g => g.OrderByDescending(x => Applied(x.r)).First().r);
        var allowOf = Luu("RefPhuCaps").Select(r => (u: UserOfRef(r), r)).Where(x => x.u is not null && Applied(x.r) <= today0).GroupBy(x => x.u!)
            .ToDictionary(g => g.Key, g => g.GroupBy(x => S(x.r, "TenPhuCap") ?? S(x.r, "PhuCap") ?? "Phụ cấp").Select(t => t.OrderByDescending(x => Applied(x.r)).First().r)
                .Select(r => new { name = S(r, "TenPhuCap") ?? "Phụ cấp", amount = (decimal)(Num(r, "SoTien") ?? 0), exempt = (decimal)(Num(r, "SoTienTruThue") ?? 0) }).Where(a => a.amount > 0).ToList());
        var depOf = Luu("RefGiamTruGiaCanhs").Select(r => (u: UserOfRef(r), r)).Where(x => x.u is not null && Norm(S(x.r, "TenGiamTru")).Contains("phụ thuộc")).GroupBy(x => x.u!)
            .ToDictionary(g => g.Key, g => (int)(Num(g.OrderByDescending(x => Applied(x.r)).First().r, "SoLuong") ?? 0));
        var haveP = (await db.PayProfiles.AsNoTracking().Select(x => x.EmployeeId).ToListAsync()).ToHashSet();
        foreach (var (ew, e) in empByEw)
        {
            if (depOf.TryGetValue(ew, out var dn) && dn > 0 && e.Dependents == 0) { db.Attach(e); e.Dependents = dn; }
            if (haveP.Contains(e.Id) || !baseOf.TryGetValue(ew, out var br) || (Num(br, "LuongCoBan") ?? 0) <= 0) continue;
            db.PayProfiles.Add(new PayProfile
            {
                Id = "hl-" + Guid.NewGuid().ToString("N")[..20], EmployeeId = e.Id, BaseSalary = (decimal)(Num(br, "LuongCoBan") ?? 0),
                Allowances = JsonSerializer.Serialize(allowOf.TryGetValue(ew, out var al) ? (object)al : Array.Empty<object>()), FromMonth = Applied(br).ToString("yyyy-MM"), UpdatedAt = now, UpdatedBy = by
            });
            haveP.Add(e.Id); rep.PayProfiles++;
        }
        await Save(db, rep);

        // ---- bản 1.10.4: mục hồ sơ nhân sự (bằng cấp, khen thưởng, kỷ luật, người liên hệ); khóa theo mã e-work, đã có thì giữ bản trên QLDA
        var haveR = (await db.EmployeeRecords.AsNoTracking().Where(r => r.EworkId != null).Select(r => r.EworkId!).ToListAsync()).ToHashSet();
        void AddRec(string? ewId, string? ewUser, string kind, string? title, Action<EmployeeRecord> fill)
        {
            if (ewId is null || ewUser is null || !empByEw.TryGetValue(ewUser, out var emp) || string.IsNullOrWhiteSpace(title)) return;
            var key = Cut(kind + ":" + ewId, 64)!; if (haveR.Contains(key)) return;
            var r = new EmployeeRecord { Id = "hs-" + Guid.NewGuid().ToString("N")[..20], EmployeeId = emp.Id, Kind = kind, Title = Cut(title.Trim(), 300)!, EworkId = key, UpdatedAt = now, UpdatedBy = by };
            fill(r); db.EmployeeRecords.Add(r); haveR.Add(key); rep.HrRecords++;
        }
        foreach (var b in Luu("RefBangCaps"))
            AddRec(S(b, "Id"), UserOfRef(b), "bang-cap", S(b, "TenVanBang") ?? S(b, "NganhDaoTao"), r =>
            {
                r.Org = Cut(S(b, "DonViCapBang"), 300); r.Number = Cut(S(b, "SoHieuBang"), 100);
                if (Num(b, "NamTotNghiep") is { } y && y > 1900 && y < 2200) r.FromDate = new DateOnly((int)y, 1, 1);
                r.Note = Cut(string.Join("; ", new[] { S(b, "NganhDaoTao") is { Length: > 0 } ng ? "Ngành: " + ng : null, Num(b, "NamTotNghiep") is { } yy ? "Năm tốt nghiệp " + (int)yy : null }.Where(x => x is not null)), 2000);
            });
        foreach (var k in Luu("KhenThuongKyLuats"))
        {
            var loai = Norm(S(k, "TenLoaiThuongPhat") ?? S(k, "LoaiThuongPhat"));
            var kind = Regex.IsMatch(loai, "kỷ luật|ky luat|phạt|phat|khiển trách") ? "ky-luat" : "khen-thuong";
            AddRec(S(k, "Id"), S(k, "UserId"), kind, Plain(S(k, "LyDo")) is { Length: > 0 } ld ? ld.Split('\n')[0] : S(k, "TenLoaiThuongPhat") ?? "Khen thưởng", r =>
            {
                r.Org = Cut(S(k, "TenLoaiThuongPhat"), 300); r.Amount = Num(k, "SoTien") is { } st ? (decimal)st : null; r.Note = Cut(Plain(S(k, "LyDo")), 2000);
                if (Num(k, "Nam") is { } y && y > 1900 && y < 2200) r.FromDate = new DateOnly((int)y, (int)Math.Clamp(Num(k, "Thang") ?? 1, 1, 12), 1);
                else if (Dt(S(k, "CreatedDate")) is { } cd) r.FromDate = DateOnly.FromDateTime(cd);
            });
        }
        foreach (var c in Luu("RefNguoiLienHes"))
            if (UserOfRef(c) is { } cu && empByEw.TryGetValue(cu, out var ce) && string.IsNullOrEmpty(ce.EmergencyName) && S(c, "HoVaTen") is { Length: > 0 } hn)
            {
                ce.EmergencyName = Cut(hn, 200); ce.EmergencyPhone = Cut(S(c, "DienThoai"), 50); ce.EmergencyRelation = Cut(S(c, "TenChucVu") ?? S(c, "ChucVu"), 50);
                if (db.Entry(ce).State == EntityState.Detached) db.Attach(ce);
                db.Entry(ce).Property(x => x.EmergencyName).IsModified = true; db.Entry(ce).Property(x => x.EmergencyPhone).IsModified = true; db.Entry(ce).Property(x => x.EmergencyRelation).IsModified = true;
            }
        await Save(db, rep);

        // ---- bản 1.10.4: thưởng KPI theo hạng (CauHinhThuongKPIs: mỗi mốc tháng áp dụng, mỗi hạng một mức); chỉ điền khi QLDA chưa có bảng nào
        var ck = Luu("CauHinhThuongKPIs").Select(x => new
        {
            from = Num(x, "NamApDung") is { } y && y > 1900 ? $"{(int)y:0000}-{(int)Math.Clamp(Num(x, "ThangApDung") ?? 1, 1, 12):00}" : Dt(S(x, "NgayApDung"))?.ToString("yyyy-MM"),
            rank = int.TryParse(Regex.Match(S(x, "TenMucDo") ?? S(x, "MucDo") ?? "", @"\d+").Value, out var rn) ? rn : 0, amount = (decimal)(Num(x, "GiaTri") ?? 0)
        }).Where(x => x.from is not null && x.rank > 0).ToList();
        if (ck.Count > 0)
        {
            var ks = Controllers.KpiSettings.Load(db);
            if (ks.RankTables.Count == 0)
            {
                ks.RankOn = true;
                ks.RankTables = ck.GroupBy(x => x.from!).OrderBy(g => g.Key).Select(g => new Controllers.KpiSettings.RankTable
                {
                    From = g.Key, Amounts = Enumerable.Range(1, g.Max(x => x.rank)).Select(r => g.FirstOrDefault(x => x.rank == r)?.amount ?? 0).ToList()
                }).ToList();
                foreach (var gr in ks.Grades) gr.Bonus = 0; // e-work chỉ thưởng theo hạng
                ks.Save(db, by); rep.Warnings.Add($"Thưởng KPI theo hạng trong phòng từ e-work: {string.Join("; ", ks.RankTables.Select(x => x.From + ": " + string.Join(" / ", x.Amounts.Select(a => a.ToString("#,0")))))}. Thưởng theo xếp loại đặt 0.");
                await Save(db, rep);
            }
        }

        // ---- bản 1.10.4: nội dung chuyển khoản lương theo lần chuyển gần nhất trên e-work (ví dụ "TRI THUC THANH TOAN LUONG T10.2026" → "... T{thang}.{nam}")
        var lastCl = Luu("ChuyenLuongs").Where(x => !string.IsNullOrWhiteSpace(S(x, "NoiDung"))).OrderByDescending(x => (Num(x, "Nam") ?? 0) * 100 + (Num(x, "Thang") ?? 0)).FirstOrDefault();
        if (lastCl.ValueKind == JsonValueKind.Object)
        {
            var ps = Controllers.PaySettings.Load(db);
            if (ps.TransferNote == new Controllers.PaySettings().TransferNote)
            {
                var nd = S(lastCl, "NoiDung")!.Trim();
                var tpl = Regex.Replace(nd, @"(\d{1,2})([./-])(\d{4})", m => "{thang}" + m.Groups[2].Value + "{nam}");
                if (tpl != nd && tpl.Length <= 200) { ps.TransferNote = tpl; ps.Save(db, by); rep.Warnings.Add($"Nội dung chuyển khoản lương theo e-work: {tpl}"); await Save(db, rep); }
            }
        }

        // ---- bản 1.10.4: dự án (QuanLyDuAns) → nhiệm vụ (NhomViecs) → công việc (QuanLyCongViecs); khóa theo mã e-work, đã có thì giữ bản trên QLDA
        var projByEw = new Dictionary<string, string>();
        var existingProj = await db.Projects.AsNoTracking().ToListAsync();
        foreach (var d in Luu("QuanLyDuAns"))
        {
            var ew = S(d, "Id"); if (ew is null) continue; var id = Cut("da-ew-" + ew, 64)!;
            var nm = (S(d, "TenGoiThau") ?? "").Trim(); if (nm.Length == 0) nm = "Dự án " + (S(d, "MaHopDong") ?? ew);
            var code = (S(d, "MaHopDong") ?? "").Trim();
            var same = existingProj.FirstOrDefault(p => p.Id == id) ?? existingProj.FirstOrDefault(p => Norm(p.Name) == Norm(nm) || (code.Length > 0 && Norm(p.Code) == Norm(code)));
            if (same is not null) { projByEw[ew] = same.Id; continue; }
            var stt = Norm(S(d, "TenTrangThaiXuLy"));
            var pr = new Project
            {
                Id = id, Code = Cut(code.Length > 0 ? code : "EW-" + (existingProj.Count + rep.Projects + 1), 50)!, Name = Cut(nm, 500)!, Owner = Cut(S(d, "TenChuDauTu"), 300),
                Tmdt = Num(d, "GiaTriHopDong") is { } gt && gt > 0 ? (decimal)gt : null, Start = Date(S(d, "NgayBatDau")), End = Date(S(d, "HanXuLy")),
                Status = Regex.IsMatch(stt, "hoàn thành|kết thúc|đã xử lý") || Date(S(d, "NgayHoanThanh")) is not null ? "Hoàn thành" : "Đang thực hiện",
                Desc = Plain(S(d, "MoTa")) is { Length: > 0 } mt ? mt : null, ProjectKind = "Nhiệm vụ khác", UpdatedAt = now, UpdatedBy = by
            };
            db.Projects.Add(pr); existingProj.Add(pr); projByEw[ew] = id; rep.Projects++;
        }
        await Save(db, rep);
        var haveT = (await db.Tasks.AsNoTracking().Where(t => t.EworkId != null).Select(t => new { t.EworkId, t.Id }).ToListAsync()).ToDictionary(x => x.EworkId!, x => x.Id);
        var nvId = new Dictionary<string, string>();
        foreach (var g in Luu("NhomViecs"))
        {
            var ew = S(g, "Id"); if (ew is null) continue; var key = Cut("nv:" + ew, 64)!;
            if (haveT.TryGetValue(key, out var hid)) { nvId[ew] = hid; continue; }
            var id = Cut("nv-ew-" + ew, 64)!;
            var pid = S(g, "RefIdQuanLyDuAn") is { } rp && projByEw.TryGetValue(rp, out var pp) ? pp : null;
            var stt = Norm(S(g, "RefTenTrangThai"));
            db.Tasks.Add(new ProjectTask
            {
                Id = id, EworkId = key, Name = Cut((S(g, "Ten") ?? "").Trim() is { Length: > 0 } tn ? tn : "Nhiệm vụ", 500)!, ProjectId = pid, Note = Plain(S(g, "MoTa")) is { Length: > 0 } mt ? mt : null,
                Status = Regex.IsMatch(stt, "hoàn thành|kết thúc|đóng") ? "Hoàn thành" : "Đang thực hiện", AssignedByUserId = UserOf(S(g, "CreatedBy")),
                StartDate = Date(S(g, "CreatedDate")), UpdatedAt = now, UpdatedBy = by
            });
            nvId[ew] = id; haveT[key] = id; rep.Tasks++;
        }
        await Save(db, rep);
        // công việc: hai lượt (việc tạo ra từ công việc khác là việc phát sinh, cha là công việc đó)
        var cvs = Luu("QuanLyCongViecs").Where(c => S(c, "Id") is not null).ToList();
        string CvId(string ew) => Cut("cv-ew-" + ew, 64)!;
        var cvSet = cvs.Select(c => S(c, "Id")!).ToHashSet();
        var statusStat = new Dictionary<string, int>();
        var n0 = 0;
        foreach (var c in cvs)
        {
            var ew = S(c, "Id")!; var key = Cut("cv:" + ew, 64)!;
            if (haveT.ContainsKey(key)) continue;
            var stRaw = (S(c, "TenTrangThaiXuLy") ?? S(c, "TrangThaiCongViec") ?? "").Trim();
            statusStat[stRaw] = statusStat.GetValueOrDefault(stRaw) + 1;
            var stt = Norm(stRaw);
            var isDone = Regex.IsMatch(stt, "hoàn thành|đã xử lý|kết thúc|đã duyệt|chờ duyệt|chờ nghiệm thu|chờ đánh giá") || (stt.Length == 0 && Date(S(c, "NgayHoanThanh")) is not null);
            var status = Regex.IsMatch(stt, "hủy|huỷ|từ chối") ? "Đã hủy" : isDone ? "Hoàn thành" : Regex.IsMatch(stt, "tạm dừng|dừng") ? "Tạm dừng"
                : Regex.IsMatch(stt, "chưa|mới|chờ") ? "Chưa bắt đầu" : "Đang thực hiện";
            var doneAt = isDone ? Date(S(c, "NgayHoanThanh")) ?? Date(S(c, "NgayKetThucXuLy")) ?? Date(S(c, "ModifiedDate")) ?? Date(S(c, "HanXuLy")) : null;
            string? parent = null; var arising = false;
            if (Norm(S(c, "RefTableNameCreate")).Contains("congviec") && S(c, "TableCreateRefId") is { } tc && cvSet.Contains(tc) && tc != ew) { parent = CvId(tc); arising = true; }
            else if (S(c, "NhomViec") is { } nv && nvId.TryGetValue(nv, out var nvi)) parent = nvi;
            var assignee = UserOf(S(c, "NguoiXuLy"));
            var co = Regex.Split((S(c, "ThongTinPhoiHop") ?? "") + "," + (S(c, "ThongTinXuLyPhu") ?? ""), "[^A-Za-z0-9-]+").Where(x => x.Length > 0 && empByEw.ContainsKey(x))
                .Select(x => empByEw[x].UserId).Where(x => x is not null && x != assignee).Distinct().ToList();
            var created = Dt(S(c, "CreatedDate"));
            db.Tasks.Add(new ProjectTask
            {
                Id = CvId(ew), EworkId = key, Name = Cut((S(c, "TenCongViec") ?? "").Trim() is { Length: > 0 } tn ? tn : Plain(S(c, "NoiDung")).Split('\n')[0] is { Length: > 0 } nd ? nd : "Công việc", 500)!,
                Note = Cut(string.Join("\n", new[] { Plain(S(c, "NoiDung")), Plain(S(c, "KetQuaXuLy")) is { Length: > 0 } kq ? "Kết quả: " + kq : "" }.Where(x => x.Length > 0)), 8000) is { Length: > 0 } nt ? nt : null,
                ParentId = parent, Arising = arising, ArisingConfirmedAt = arising ? (created is { } cd ? VnTime.ToUtc(cd) : DateTime.UtcNow) : null,
                AssigneeUserId = assignee, Assignee = Cut(S(c, "TenNguoiXuLy"), 200), AssignedByUserId = UserOf(S(c, "NguoiGiaoViec") ?? S(c, "NguoiNhap")),
                Collaborators = co.Count > 0 ? Cut(string.Join(",", co), 1000) : null, Priority = Cut(S(c, "TenCapDo"), 50),
                StartDate = Date(S(c, "NgayBatDau")) ?? (created is { } c2 ? DateOnly.FromDateTime(c2) : null), Due = Date(S(c, "HanXuLy")), Status = status,
                DoneDate = status == "Hoàn thành" ? doneAt : null, ExtendCount = (int)(Num(c, "SoLanGiaHan") ?? 0), ReopenCount = (int)(Num(c, "SoLanMoLai") ?? 0),
                UpdatedAt = now, UpdatedBy = by
            });
            haveT[key] = CvId(ew); rep.Tasks++;
            if (++n0 % 2000 == 0) await Save(db, rep);
        }
        await Save(db, rep);
        // việc cha phát sinh trỏ đến công việc không có trong bản xuất: bỏ liên kết; dự án theo việc cha
        var ewTasks = await db.Tasks.Where(t => t.EworkId != null && t.EworkId.StartsWith("cv:")).ToListAsync();
        var tById = (await db.Tasks.AsNoTracking().Select(t => new { t.Id, t.ProjectId, t.ParentId }).ToListAsync()).ToDictionary(t => t.Id);
        foreach (var t in ewTasks.Where(t => t.ParentId is not null && t.ProjectId is null))
        {
            var p = t.ParentId; var guard = 0;
            while (p is not null && tById.TryGetValue(p, out var pt) && guard++ < 20) { if (pt.ProjectId is not null) { t.ProjectId = pt.ProjectId; break; } p = pt.ParentId; }
        }
        // hạn ban đầu từ lịch sử gia hạn (TaskGiaHans), lần mở lại từ TaskMoLais nếu bảng công việc không ghi
        var giaHan = Luu("TaskGiaHans").Where(x => S(x, "RefId") is not null).GroupBy(x => S(x, "RefId")!).ToDictionary(g => g.Key, g => g.Count());
        var moLai = Luu("TaskMoLais").Where(x => S(x, "RefId") is not null).GroupBy(x => S(x, "RefId")!).ToDictionary(g => g.Key, g => g.Count());
        foreach (var t in ewTasks)
        {
            var ew = t.EworkId![3..];
            if (t.ExtendCount == 0 && giaHan.TryGetValue(ew, out var gh)) t.ExtendCount = gh;
            if (t.ReopenCount == 0 && moLai.TryGetValue(ew, out var ml)) t.ReopenCount = ml;
        }
        await Save(db, rep); db.ChangeTracker.Clear();
        if (statusStat.Count > 0) rep.Warnings.Add("Trạng thái công việc e-work: " + string.Join("; ", statusStat.OrderByDescending(x => x.Value).Take(12).Select(x => $"{(x.Key.Length > 0 ? x.Key : "(trống)")}: {x.Value}")));

        // ---- lưu trữ nguyên vẹn mọi bảng nghiệp vụ e-work (thay theo từng bảng, chạy lại không trùng)
        if (lt.ValueKind == JsonValueKind.Object)
            foreach (var tb in lt.EnumerateObject())
            {
                if (tb.Value.ValueKind != JsonValueKind.Array) continue;
                var name = Cut(tb.Name, 100)!;
                await db.EworkArchive.Where(r => r.TableName == name).ExecuteDeleteAsync();
                int i = 0, n = 0;
                foreach (var r in tb.Value.EnumerateArray())
                {
                    i++;
                    var period = Num(r, "Nam") is { } y && Num(r, "Thang") is { } mo && y > 1900 && mo is >= 1 and <= 12 ? $"{(int)y:0000}-{(int)mo:00}"
                        : Dt(S(r, "CreatedDate")) is { } cd ? cd.ToString("yyyy-MM") : null;
                    db.EworkArchive.Add(new EworkRow
                    {
                        Id = "ew-" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(name + "|" + (S(r, "Id") ?? i.ToString()))))[..40].ToLowerInvariant(),
                        TableName = name, RowKey = Cut(S(r, "Id") ?? i.ToString(), 100)!,
                        EworkUserId = Cut(S(r, "UserId") ?? S(r, "NguoiXuLy") ?? S(r, "CreatedBy"), 64), Period = period, Data = r.GetRawText(), UpdatedAt = now, UpdatedBy = by
                    });
                    if (++n % 2000 == 0) { await Save(db, rep); db.ChangeTracker.Clear(); }
                }
                await Save(db, rep); db.ChangeTracker.Clear();
                rep.Archive[name] = i;
            }
        rep.Warnings.AddRange(await TripRatesFromArchive(db) is var tr && tr > 0 ? new[] { $"Mức công tác phí riêng từ bảng lương e-work: {tr} người" } : Array.Empty<string>());
        return rep;
    }

    /// <summary>Bản 1.10.14: e-work đặt mức công tác phí riêng từng người (BangLuongs.MucCongTacPhi, có người 0 = không hưởng).
    /// Lấy mức ở tháng gần nhất người đó có ngày công tác, ghi vào hồ sơ lương còn trống mức riêng. Trả về số người được điền.</summary>
    public static async Task<int> TripRatesFromArchive(AppDbContext db)
    {
        var rows = await db.EworkArchive.AsNoTracking().Where(r => r.TableName == "BangLuongs").Select(r => new { r.Period, r.Data }).ToListAsync();
        var latest = new Dictionary<string, (string period, decimal rate)>();
        foreach (var r in rows)
        {
            using var doc = JsonDocument.Parse(r.Data); var o = doc.RootElement;
            var uid = S(o, "UserId"); if (uid is null || (Num(o, "NgayCongTac") ?? 0) <= 0 || Num(o, "MucCongTacPhi") is not { } rate) continue;
            var per = r.Period ?? "";
            if (!latest.TryGetValue(uid, out var cur) || string.CompareOrdinal(per, cur.period) > 0) latest[uid] = (per, (decimal)rate);
        }
        if (latest.Count == 0) return 0;
        var emps = await db.Employees.AsNoTracking().Where(e => e.EworkId != null).ToDictionaryAsync(e => e.Id, e => e.EworkId!);
        var n = 0;
        foreach (var p in await db.PayProfiles.Where(p => p.TripRate == null).ToListAsync())
            if (emps.TryGetValue(p.EmployeeId, out var ew) && latest.TryGetValue(ew, out var v)) { p.TripRate = v.rate; p.UpdatedAt = DateTime.UtcNow; p.UpdatedBy = "he-thong"; n++; }
        if (n > 0)
        {
            db.Logs.Add(new AuditLog { Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = DateTime.UtcNow, Username = "he-thong", Fullname = "Hệ thống", Action = "Mức công tác phí riêng từ bảng lương e-work", Module = "Lương", Target = n + " người" });
            await db.SaveChangesAsync();
        }
        return n;
    }

    /// <summary>Bản 1.10.3: dữ liệu e-work dài hơn cột của QLDA thì cắt vừa cột (ghi lưu ý) thay vì dừng cả lần nạp.</summary>
    private static async Task Save(AppDbContext db, Report rep)
    {
        foreach (var en in db.ChangeTracker.Entries().Where(x => x.State is EntityState.Added or EntityState.Modified))
            foreach (var pr in en.Properties)
                if (pr.CurrentValue is string v && pr.Metadata.GetMaxLength() is int max && v.Length > max)
                {
                    pr.CurrentValue = v[..max];
                    if (rep.Warnings.Count < 200) rep.Warnings.Add($"Cắt bớt {en.Metadata.ClrType.Name}.{pr.Metadata.Name} ({v.Length} → {max} ký tự).");
                }
        await db.SaveChangesAsync();
    }

    private static string? Cut(string? s, int n) => s is null ? null : s.Length <= n ? s : s[..n];
    /// <summary>Bỏ thẻ HTML (nội dung e-work soạn bằng trình soạn thảo), giữ xuống dòng.</summary>
    private static string Plain(string? h)
    {
        if (string.IsNullOrWhiteSpace(h)) return "";
        var t = Regex.Replace(h, @"<\s*(br|/p|/div|/li|/tr|/h\d)\s*/?>", "\n", RegexOptions.IgnoreCase);
        t = Regex.Replace(t, "<[^>]+>", "");
        t = System.Net.WebUtility.HtmlDecode(t);
        return Regex.Replace(Regex.Replace(t, "[ \t\u00a0]+", " "), @"\s*\n\s*", "\n").Trim();
    }

    /// <summary>Đề xuất tăng ca e-work trước khi làm: chỉ là đăng ký, không tính lương (lương tính theo phiếu xác nhận tăng ca).</summary>
    public const string OtRegisterType = "Đăng ký tăng ca (e-work)";

    private static string MapType(string? t)
    {
        var n = Norm(t);
        if (n.Contains("không lương") || n.Contains("khong luong") || n.Contains("ngoài phép")) return "Nghỉ không lương";
        if (n.Contains("ốm") || n.Contains("thai sản") || n.Contains("bhxh")) return "Nghỉ ốm, thai sản (BHXH)";
        if (n.Contains("việc riêng") || n.Contains("hiếu hỷ") || n.Contains("hiếu hỉ") || n.Contains("kết hôn")) return "Nghỉ việc riêng có lương";
        if (n.Contains("nghỉ phép") || n.Contains("nghi phep")) return "Nghỉ phép";
        if (n.Contains("online")) return "Làm việc online";
        if (n.Contains("tăng ca")) return "Tăng ca";
        if (n.Contains("công tác")) return "Công tác";
        if (n.Contains("gia hạn")) return "Gia hạn công việc";
        if (n.Contains("mở lại")) return "Mở lại công việc";
        if (n.Contains("tạm ứng")) return "Tạm ứng";
        if (n.Contains("ứng lương")) return "Ứng lương";
        if (n.Contains("xăng")) return "Xăng xe";
        if (n.Contains("kiểm tra thanh toán")) return "Kiểm tra thanh toán";
        if (n.Contains("giải chi")) return "Giải chi";
        if (n.Contains("thanh toán")) return "Thanh toán";
        if (n.Contains("làm việc")) return "Làm việc";
        return "Khác";
    }

    private static string TempPassword()
    {
        const string L = "abcdefghjkmnpqrstuvwxyz", D = "23456789";
        var sb = new StringBuilder();
        for (var i = 0; i < 6; i++) sb.Append(L[RandomNumberGenerator.GetInt32(L.Length)]);
        for (var i = 0; i < 4; i++) sb.Append(D[RandomNumberGenerator.GetInt32(D.Length)]);
        return sb.ToString();
    }
}

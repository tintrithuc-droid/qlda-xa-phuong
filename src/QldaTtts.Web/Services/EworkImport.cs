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
        /// <summary>Số dòng lưu trữ theo từng bảng e-work.</summary>
        public Dictionary<string, int> Archive { get; set; } = new();
        public List<string> LinkedAccounts { get; set; } = new();
        /// <summary>Tài khoản mới tạo kèm mật khẩu tạm (chỉ trả về một lần cho quản trị, không lưu).</summary>
        public List<NewAccount> NewAccounts { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
        public string Summary => $"{Departments} phòng ban, {Employees} nhân sự, {Attendances} lượt chấm công, {Requests} đề xuất, {Meetings} lịch họp, {Notices} thông báo, {NewAccounts.Count} tài khoản mới, lưu trữ {Archive.Values.Sum()} dòng / {Archive.Count} bảng";
    }
    public record NewAccount(string Name, string Username, string Password, string? Department);

    private static string? S(JsonElement e, string k) => e.TryGetProperty(k, out var v) && v.ValueKind != JsonValueKind.Null ? (v.ValueKind == JsonValueKind.String ? v.GetString() : v.ToString()) : null;
    private static double? Num(JsonElement e, string k) => double.TryParse(S(e, k), NumberStyles.Any, CultureInfo.InvariantCulture, out var d) ? d : null;
    private static bool Bool(JsonElement e, string k, bool def) => S(e, k) is { } s ? s is "true" or "True" or "1" : def;
    private static DateTime? Dt(string? s) => DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d) ? d : null;
    private static DateOnly? Date(string? s) => Dt(s) is { } d && d.Year > 1900 ? DateOnly.FromDateTime(d) : null;
    private static IEnumerable<JsonElement> Arr(JsonElement root, string k) => root.TryGetProperty(k, out var a) && a.ValueKind == JsonValueKind.Array ? a.EnumerateArray() : Enumerable.Empty<JsonElement>();
    private static string Norm(string? s) => (s ?? "").Trim().ToLowerInvariant();

    public static async Task<Report> Run(AppDbContext db, JsonElement root, string by)
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
        var groups = await db.Groups.AsNoTracking().ToListAsync();
        var staffGroup = groups.FirstOrDefault(g => !g.Admin && Regex.IsMatch(g.Name, "nhân viên", RegexOptions.IgnoreCase));
        var emps = await db.Employees.ToListAsync();
        var hoso = Arr(root, "hoso").GroupBy(h => S(h, "UserId") ?? "").ToDictionary(g => g.Key, g => g.OrderByDescending(h => S(h, "CreatedDate")).First());
        var empByEw = new Dictionary<string, Employee>();
        var userNameOf = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var u in Arr(root, "users"))
        {
            var ew = S(u, "Id"); if (ew is null) continue;
            var role = S(u, "RoleName") ?? S(u, "UserRole") ?? "";
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
                    var pw = TempPassword();
                    acc = new AppUser { Id = "u-" + Guid.NewGuid().ToString("N")[..12], Username = un, Name = name, Email = S(u, "Email"), Phone = S(u, "PhoneNumber"),
                        Unit = dept?.Name, GroupId = staffGroup?.Id, Active = true, MustChangePassword = true, CreatedAt = now, UpdatedAt = now, UpdatedBy = by };
                    acc.PasswordHash = Passwords.Hash(acc, pw);
                    db.Users.Add(acc); users.Add(acc);
                    rep.NewAccounts.Add(new NewAccount(name, un, pw, dept?.Name));
                }
            }
            else if (acc is not null) rep.LinkedAccounts.Add($"{name} → {acc.Username}");
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
            empByEw[ew] = e;
            // Trưởng phòng theo vai trò e-work
            if (dept is not null && dept.ManagerUserId is null && acc is not null && Regex.IsMatch(role, "LANHDAO", RegexOptions.IgnoreCase)) dept.ManagerUserId = acc.Id;
        }
        await db.SaveChangesAsync();

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
            var ew = S(x, "Id"); if (ew is null || haveReq.Contains(ew)) continue;
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
            db.Requests.Add(new Request
            {
                Id = "dx-" + Guid.NewGuid().ToString("N")[..16], Code = $"DX-EW{++seq:0000}", Type = MapType(S(x, "TenDeXuat")), EmployeeId = e.Id,
                Title = S(x, "RefObjectDescription"), FromAt = from is { } f ? VnTime.ToUtc(f) : null, ToAt = to is { } t ? VnTime.ToUtc(t) : null,
                Days = Jn("SoNgay", "SoNgayNghi", "SoNgayCongTac"), Hours = Jn("SoGio", "SoGioTangCa", "TongSoGio"), Amount = Jn("SoTien", "TongTien", "ThanhTien", "SoTienDeNghi"),
                Place = J("DiaDiem", "NoiCongTac", "DiaDiemCongTac", "LoTrinh"), Reason = S(x, "LyDo"), Status = status,
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
            if (k == "GIO_DIEM_DANH" && Regex.IsMatch(v, @"^\d{1,2}:\d{2}")) s.CheckIn = v[..5].PadLeft(5, '0');
        }
        if (s.Places.Count == 0)
            foreach (var p in Arr(root, "toado").Where(p => Bool(p, "Status", true)))
                if (Num(p, "ViDo") is { } la && Num(p, "KinhDo") is { } ln) s.Places.Add(new VpSettings.Place { Name = S(p, "Description") ?? "Văn phòng", Lat = la, Lng = ln, Radius = radius });
        if (s.Ips.Count == 0) s.Ips = Arr(root, "ip").Where(p => Bool(p, "Status", true)).Select(p => (S(p, "IPCongTy") ?? "").Trim()).Where(x => x.Length > 0).Distinct().ToList();
        foreach (var n in Arr(root, "ngaynghi"))
        {
            if (Date(S(n, "Ngay")) is not { } d) continue;
            var half = Num(n, "Buoi") is { } b && b > 0 && b < 1;
            var key = d.ToString("yyyy-MM-dd") + (half ? ":s" : "");
            if (!s.Holidays.Any(h => h.StartsWith(d.ToString("yyyy-MM-dd")))) { s.Holidays.Add(key); rep.Holidays++; }
        }
        VpSettings.Save(db, s, by);
        await db.SaveChangesAsync();

        var lt = root.TryGetProperty("luutru", out var l0) && l0.ValueKind == JsonValueKind.Object ? l0 : default;
        IEnumerable<JsonElement> Luu(string t) => lt.ValueKind == JsonValueKind.Object ? Arr(lt, t) : Arr(root, t);
        string? UserOf(string? ew) => ew is not null && empByEw.TryGetValue(ew, out var e) ? e.UserId : null;

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
        await db.SaveChangesAsync();

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
                    if (++n % 2000 == 0) { await db.SaveChangesAsync(); db.ChangeTracker.Clear(); }
                }
                await db.SaveChangesAsync(); db.ChangeTracker.Clear();
                rep.Archive[name] = i;
            }
        return rep;
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

    private static string MapType(string? t)
    {
        var n = Norm(t);
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

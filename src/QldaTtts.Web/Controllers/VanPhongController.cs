using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>
/// Bản 1.9: phân hệ Văn phòng: nhân sự, điểm danh, đề xuất.
/// Quyền: "nhan-su" (xem: danh sách; sửa: quản lý hồ sơ và thông tin riêng), "diem-danh" (xem: chấm công toàn công ty; sửa: điều chỉnh, thiết lập),
/// "de-xuat" (xem: mọi đề xuất; duyệt: "de-xuat:duyet"). Trưởng phòng xem chấm công và duyệt đề xuất của phòng mình.
/// Mọi tài khoản có hồ sơ nhân sự đều tự điểm danh, xem công và gửi đề xuất của chính mình.
/// </summary>
[Authorize, Route("api/vp")]
public class VanPhongController : ApiControllerBase
{
    public VanPhongController(AppDbContext db, UserContext uc) : base(db, uc) { }

    public static readonly string[] RequestTypes =
    {
        "Nghỉ phép", "Nghỉ việc riêng có lương", "Nghỉ không lương", "Nghỉ ốm, thai sản (BHXH)", "Làm việc online", "Tăng ca", "Công tác", "Đi muộn, về sớm", "Quên điểm danh", "Xăng xe", "Tạm ứng", "Ứng lương",
        "Thanh toán", "Giải chi", "Kiểm tra thanh toán", "Gia hạn công việc", "Mở lại công việc", "Làm việc", "Khác"
    };

    private bool CanApproveAll => Uc.IsAdmin || (Uc.Group?.Perms.TryGetValue("de-xuat:duyet", out var v) == true && v == "1");
    private static string NewId(string p) => p + "-" + Guid.NewGuid().ToString("N")[..16];

    private async Task<Employee?> Me() => Uc.User is null ? null : await Db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.UserId == Uc.User.Id);
    private async Task<HashSet<string>> ManagedDepts() => Uc.User is null ? new() :
        (await Db.Departments.AsNoTracking().Where(d => d.ManagerUserId == Uc.User.Id).Select(d => d.Id).ToListAsync()).ToHashSet();

    /// <summary>Hồ sơ người dùng hiện tại được xem: null = tất cả.</summary>
    private async Task<HashSet<string>?> AttendanceScope(Employee? me)
    {
        if (Uc.Can("diem-danh")) return null;
        var depts = await ManagedDepts();
        var ids = await Db.Employees.AsNoTracking().Where(e => e.DepartmentId != null && depts.Contains(e.DepartmentId)).Select(e => e.Id).ToListAsync();
        if (me is not null) ids.Add(me.Id);
        return ids.ToHashSet();
    }

    private static object Public(Employee e) => new
    {
        e.Id, e.UserId, e.Code, e.Name, e.DepartmentId, e.Position, e.Phone, e.Email, e.Status, e.Attendance, e.StartDate, e.Birthday, e.Gender
    };

    // ------------------------------------------------------------------ trạng thái chung

    [HttpGet("state")]
    public async Task<IActionResult> State()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var me = await Me(); var s = VpSettings.Load(Db);
        var today = DateOnly.FromDateTime(VnTime.Now);
        var att = me is null ? null : await Db.Attendances.AsNoTracking().FirstOrDefaultAsync(a => a.EmployeeId == me.Id && a.Date == today);
        var depts = await ManagedDepts();
        var year = today.Year;
        decimal used = 0;
        if (me is not null)
            used = (await Db.Requests.AsNoTracking().Where(r => r.EmployeeId == me.Id && r.Type == "Nghỉ phép" && r.Status == "Đã duyệt" && r.FromAt != null).ToListAsync())
                .Where(r => VnTime.ToVn(r.FromAt!.Value).Year == year).Sum(r => r.Days ?? 0);
        var pending = await PendingForMe();
        var di = VnTime.Day(today, s);
        var greet = di.Value > 0 ? s.GreetWork : (di.Kind == "holiday" && di.Name is { } hn ? hn + ". " : "") + s.GreetOff;
        return Ok(new
        {
            day = new { value = di.Value, kind = di.Kind, name = di.Name, greeting = greet, canCheck = di.Value > 0 || att?.InAt != null },
            payConfirm = me is null ? null : await LuongController.PendingConfirm(Db, me.Id),
            payFeedback = Uc.Can("luong", true) ? await Db.Payslips.CountAsync(x => x.FeedbackStatus == "Chờ xử lý") : 0,
            me = me is null ? null : Public(me), today = today.ToString("yyyy-MM-dd"), now = VnTime.Now.ToString("yyyy-MM-ddTHH:mm:ss"), attendance = att,
            settings = new { s.CheckIn, s.CheckOut, s.MorningStart, s.MorningEnd, s.AfternoonStart, s.AfternoonEnd, s.HoursPerDay, s.LeavePerYear, s.Saturday, s.SaturdayAnchor, s.AllowOutside,
                places = s.Places.Select(p => new { p.Name, p.Lat, p.Lng, p.Radius }), holidays = s.EffectiveHolidays(new[] { year - 1, year, year + 1 }), s.Workdays, s.AutoLegal, ipCount = s.Ips.Count, syncOn = s.SyncKeyHash != null, s.SyncFrom },
            leave = new { year, total = me is null ? s.LeavePerYear : VnTime.LeaveEntitlement(me, s, year), used, left = (me is null ? s.LeavePerYear : VnTime.LeaveEntitlement(me, s, year)) - used },
            perms = new { hr = Uc.Can("nhan-su"), hrEdit = Uc.Can("nhan-su", true), att = Uc.Can("diem-danh"), attEdit = Uc.Can("diem-danh", true),
                req = Uc.Can("de-xuat"), approve = CanApproveAll || depts.Count > 0, admin = Uc.IsAdmin, managed = depts },
            pending, types = RequestTypes, ip = Uc.Ip, otMax = new { normal = PaySettings.Load(Db).OtMaxPerDay, urgent = PaySettings.Load(Db).OtMaxUrgent }
        });
    }

    private async Task<int> PendingForMe()
    {
        var list = await Db.Requests.AsNoTracking().Where(r => r.Status == "Chờ duyệt").ToListAsync();
        var n = 0;
        foreach (var r in list) if (await CanDecide(r)) n++;
        return n;
    }

    // ------------------------------------------------------------------ phòng ban, nhân sự

    [HttpGet("departments")]
    public async Task<IActionResult> Departments()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        return Ok(await Db.Departments.AsNoTracking().OrderBy(d => d.Order).ThenBy(d => d.Name).ToListAsync());
    }

    [HttpPut("departments/{id}")]
    public async Task<IActionResult> PutDepartment(string id, [FromBody] Department d)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("nhan-su", true)) return Denied();
        if (!ValidId(id) || string.IsNullOrWhiteSpace(d.Name)) return Error(400, "Nhập tên phòng ban.");
        var x = await Db.Departments.FindAsync(id);
        if (x is null) { x = new Department { Id = id }; Db.Departments.Add(x); }
        x.Code = d.Code?.Trim() ?? ""; x.Name = d.Name.Trim(); x.ManagerUserId = d.ManagerUserId; x.CheckinTime = string.IsNullOrWhiteSpace(d.CheckinTime) ? null : d.CheckinTime; x.Order = d.Order;
        x.UpdatedAt = DateTime.UtcNow; x.UpdatedBy = Uc.User.Username;
        Uc.Log("Cập nhật phòng ban", "Nhân sự", x.Name, "departments", x.Id);
        await Db.SaveChangesAsync();
        return Ok(x);
    }

    [HttpDelete("departments/{id}")]
    public async Task<IActionResult> DeleteDepartment(string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("nhan-su", true)) return Denied();
        if (await Db.Employees.AnyAsync(e => e.DepartmentId == id)) return Error(409, "Phòng ban còn nhân sự, chuyển nhân sự sang phòng khác trước.");
        var x = await Db.Departments.FindAsync(id); if (x is null) return NotFound();
        Db.Departments.Remove(x); Uc.Log("Xóa phòng ban", "Nhân sự", x.Name, "departments", x.Id);
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    [HttpGet("employees")]
    public async Task<IActionResult> Employees()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var all = await Db.Employees.AsNoTracking().OrderBy(e => e.Name).ToListAsync();
        var full = Uc.Can("nhan-su", true);
        return Ok(all.Select(e => full || e.UserId == Uc.User.Id ? (object)e : Public(e)));
    }

    [HttpPut("employees/{id}")]
    public async Task<IActionResult> PutEmployee(string id, [FromBody] Employee e)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!ValidId(id) || string.IsNullOrWhiteSpace(e.Name)) return Error(400, "Nhập họ tên.");
        var x = await Db.Employees.FindAsync(id);
        var hr = Uc.Can("nhan-su", true);
        if (!hr)
        {
            // Tự cập nhật thông tin liên hệ của chính mình
            if (x is null || x.UserId != Uc.User.Id) return Denied();
            x.Phone = e.Phone; x.Email = e.Email; x.Address = e.Address; x.BankAccount = e.BankAccount; x.BankName = e.BankName;
            x.CurrentAddress = e.CurrentAddress; x.EmergencyName = e.EmergencyName; x.EmergencyPhone = e.EmergencyPhone; x.EmergencyRelation = e.EmergencyRelation; x.Marital = e.Marital;
        }
        else
        {
            if (x is null) { x = new Employee { Id = id }; Db.Employees.Add(x); }
            if (!string.IsNullOrEmpty(e.UserId) && await Db.Employees.AnyAsync(o => o.UserId == e.UserId && o.Id != id)) return Error(409, "Tài khoản này đã gắn với hồ sơ nhân sự khác.");
            var keepEw = x.EworkId;
            // Bản 1.10.4: đổi phòng ban, chức vụ thì tự ghi một dòng quá trình công tác
            var isNew = Db.Entry(x).State == EntityState.Added;
            var oldDept = x.DepartmentId; var oldPos = x.Position;
            e.Id = id; e.EworkId = keepEw ?? e.EworkId;
            Db.Entry(x).CurrentValues.SetValues(e);
            if (!isNew && (oldDept != e.DepartmentId || (oldPos ?? "") != (e.Position ?? "")))
            {
                var names = await Db.Departments.AsNoTracking().ToDictionaryAsync(d => d.Id, d => d.Name);
                string D(string? d) => d is not null && names.TryGetValue(d, out var n) ? n : "—";
                var parts = new List<string>();
                if (oldDept != e.DepartmentId) parts.Add($"Phòng ban: {D(oldDept)} → {D(e.DepartmentId)}");
                if ((oldPos ?? "") != (e.Position ?? "")) parts.Add($"Chức vụ: {(string.IsNullOrEmpty(oldPos) ? "—" : oldPos)} → {(string.IsNullOrEmpty(e.Position) ? "—" : e.Position)}");
                Db.EmployeeRecords.Add(new EmployeeRecord { Id = NewId("hs"), EmployeeId = id, Kind = "cong-tac", Title = string.Join("; ", parts), Org = D(e.DepartmentId), FromDate = DateOnly.FromDateTime(VnTime.Now), UpdatedAt = DateTime.UtcNow, UpdatedBy = Uc.User.Username });
            }
            x.Name = e.Name.Trim();
        }
        x.UpdatedAt = DateTime.UtcNow; x.UpdatedBy = Uc.User.Username;
        Uc.Log("Cập nhật hồ sơ nhân sự", "Nhân sự", x.Name, "employees", x.Id);
        await Db.SaveChangesAsync();
        return Ok(x);
    }

    public record PayrollBody(bool? Include);

    /// <summary>Bản 1.10.4: Ban giám đốc, kế toán quyết định đưa hay không đưa một đề xuất (tạm ứng, xăng xe) vào bảng lương; null = theo thiết lập lương.</summary>
    [HttpPut("requests/{id}/payroll")]
    public async Task<IActionResult> RequestPayroll(string id, [FromBody] PayrollBody b)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("luong", true)) return Denied("Chỉ người quản lý lương được quyết định.");
        var r = await Db.Requests.FirstOrDefaultAsync(x => x.Id == id); if (r is null) return NotFound();
        if (r.Type is not ("Tạm ứng" or "Xăng xe")) return Error(400, "Chỉ áp dụng cho đề xuất tạm ứng, xăng xe.");
        var m = VnTime.ToVn(r.FromAt ?? r.CreatedAt).ToString("yyyy-MM");
        if (await Db.Payslips.AnyAsync(x => x.Month == m && x.EmployeeId == r.EmployeeId && x.LockedAt != null)) return Error(409, $"Bảng lương tháng {m} đã chốt.");
        r.Payroll = b.Include; r.UpdatedAt = DateTime.UtcNow; r.UpdatedBy = Uc.User.Username;
        Uc.Log(b.Include == true ? "Đưa đề xuất vào lương" : b.Include == false ? "Không đưa đề xuất vào lương" : "Đề xuất theo thiết lập lương", "Lương", $"{r.Code} {r.Type}");
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    // ------------------------------------------------------------------ bản 1.10.4: các mục hồ sơ nhân sự
    public static readonly string[] RecordKinds = { "bang-cap", "khen-thuong", "ky-luat", "cong-tac", "hop-dong", "giay-to" };

    private async Task<(Employee? e, bool view, bool edit)> RecordAccess(string id)
    {
        var e = await Db.Employees.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        var edit = Uc.Can("nhan-su", true);
        return (e, e is not null && (edit || Uc.Can("nhan-su") || e.UserId == Uc.User!.Id), e is not null && edit);
    }

    [HttpGet("employees/{id}/records")]
    public async Task<IActionResult> Records(string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var (e, view, _) = await RecordAccess(id); if (e is null) return NotFound(); if (!view) return Denied();
        // Người xem toàn bộ nhân sự (không có quyền sửa) không thấy giấy tờ riêng; chính người đó và người quản lý nhân sự thấy đủ
        var all = Uc.Can("nhan-su", true) || e.UserId == Uc.User.Id;
        var l = await Db.EmployeeRecords.AsNoTracking().Where(r => r.EmployeeId == id && (all || (r.Kind != "giay-to" && r.Kind != "ky-luat"))).ToListAsync();
        return Ok(l.OrderBy(r => Array.IndexOf(RecordKinds, r.Kind)).ThenByDescending(r => r.FromDate));
    }

    [HttpPut("employees/{id}/records/{rid}")]
    public async Task<IActionResult> PutRecord(string id, string rid, [FromBody] EmployeeRecord r)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var (e, _, edit) = await RecordAccess(id); if (e is null) return NotFound(); if (!edit) return Denied();
        if (!ValidId(rid) || !RecordKinds.Contains(r.Kind) || string.IsNullOrWhiteSpace(r.Title)) return Error(400, "Chọn loại và nhập tên mục.");
        var x = await Db.EmployeeRecords.FirstOrDefaultAsync(o => o.Id == rid);
        if (x is not null && x.EmployeeId != id) return Error(400, "Dữ liệu không hợp lệ.");
        if (x is null) { x = new EmployeeRecord { Id = rid, EmployeeId = id }; Db.EmployeeRecords.Add(x); }
        x.Kind = r.Kind; x.Title = r.Title.Trim(); x.Org = r.Org?.Trim(); x.Number = r.Number?.Trim(); x.FromDate = r.FromDate; x.ToDate = r.ToDate;
        x.Amount = r.Amount; x.Note = r.Note?.Trim(); x.FileId = r.FileId; x.FileName = r.FileName;
        x.UpdatedAt = DateTime.UtcNow; x.UpdatedBy = Uc.User.Username;
        Uc.Log("Cập nhật hồ sơ nhân sự", "Nhân sự", $"{e.Name}: {x.Title}", "employees", e.Id);
        await Db.SaveChangesAsync(); return Ok(x);
    }

    [HttpDelete("employees/{id}/records/{rid}")]
    public async Task<IActionResult> DeleteRecord(string id, string rid)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var (e, _, edit) = await RecordAccess(id); if (e is null) return NotFound(); if (!edit) return Denied();
        var x = await Db.EmployeeRecords.FirstOrDefaultAsync(o => o.Id == rid && o.EmployeeId == id); if (x is null) return NotFound();
        Db.EmployeeRecords.Remove(x); Uc.Log("Xóa mục hồ sơ nhân sự", "Nhân sự", $"{e.Name}: {x.Title}", "employees", e.Id);
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    [HttpDelete("employees/{id}")]
    public async Task<IActionResult> DeleteEmployee(string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("nhan-su", true)) return Denied();
        var x = await Db.Employees.FindAsync(id); if (x is null) return NotFound();
        if (await Db.Attendances.AnyAsync(a => a.EmployeeId == id) || await Db.Requests.AnyAsync(r => r.EmployeeId == id))
            return Error(409, "Nhân sự đã có chấm công hoặc đề xuất: chuyển trạng thái sang Nghỉ việc thay vì xóa.");
        Db.Employees.Remove(x); Uc.Log("Xóa hồ sơ nhân sự", "Nhân sự", x.Name, "employees", x.Id);
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    // ------------------------------------------------------------------ điểm danh

    public record CheckRequest(string Kind, double? Lat, double? Lng, double? Accuracy, string? Mode, string? Note);

    /// <summary>Điểm danh vào (Kind = "in") hoặc ra ("out"). Giờ lấy theo máy chủ, không theo máy người dùng.</summary>
    [HttpPost("check")]
    public async Task<IActionResult> Check([FromBody] CheckRequest r)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var me = await Me(); if (me is null) return Error(400, "Tài khoản chưa gắn với hồ sơ nhân sự. Liên hệ người quản lý nhân sự.");
        if (!me.Attendance) return Error(400, "Hồ sơ của bạn được thiết lập không điểm danh.");
        var s = VpSettings.Load(Db);
        var now = VnTime.Now; var today = DateOnly.FromDateTime(now);
        var online = r.Mode == "online" || r.Mode == "congtac";
        var dOff = VnTime.Day(today, s);
        if (dOff.Value == 0 && !await Db.Attendances.AnyAsync(a => a.EmployeeId == me.Id && a.Date == today && a.InAt != null))
            return Error(400, $"Hôm nay là ngày nghỉ{(dOff.Name is { } dn ? " (" + dn + ")" : "")}, không điểm danh. Có làm thêm giờ thì sau khi làm xong lập phiếu xác nhận tăng ca.");
        // Nơi điểm danh: theo IP mạng công ty hoặc khoảng cách tới địa điểm đã khai báo
        string place; string? site = null;
        var ip = Uc.Ip; var ipOk = s.Ips.Any(x => !string.IsNullOrWhiteSpace(x) && (ip == x.Trim() || ip.EndsWith(":" + x.Trim())));
        (VpSettings.Place p, double m)? near = null;
        if (r.Lat is { } la && r.Lng is { } ln)
            near = s.Places.Select(p => (p, m: VnTime.Meters(la, ln, p.Lat, p.Lng))).OrderBy(x => x.m).Cast<(VpSettings.Place, double)?>().FirstOrDefault();
        if (online) place = r.Mode == "congtac" ? "Công tác" : "Làm việc online";
        else if (near is { } n && n.m <= Math.Max(50, n.p.Radius)) { place = "Trong công ty"; site = n.p.Name; }
        else if (ipOk) { place = "Trong công ty"; site = "Mạng công ty"; }
        else
        {
            if (!s.AllowOutside) return Error(400, "Bạn đang ở ngoài phạm vi công ty. Bật định vị, hoặc kết nối mạng công ty rồi điểm danh lại.");
            place = "Ngoài công ty"; site = near is { } n2 ? $"Cách {n2.p.Name} {Math.Round(n2.m):0} m" : (r.Lat is null ? "Không có định vị" : null);
        }
        if (online && r.Mode == "online")
        {
            // Làm việc online cần đề xuất đã duyệt cho ngày hôm nay
            var ok = (await Db.Requests.AsNoTracking().Where(x => x.EmployeeId == me.Id && x.Type == "Làm việc online" && x.Status == "Đã duyệt").ToListAsync())
                .Any(x => x.FromAt is { } f && DateOnly.FromDateTime(VnTime.ToVn(f)) <= today && DateOnly.FromDateTime(VnTime.ToVn(x.ToAt ?? f)) >= today);
            if (!ok) site = "Chưa có đề xuất làm việc online được duyệt";
        }
        var a = await Db.Attendances.FirstOrDefaultAsync(x => x.EmployeeId == me.Id && x.Date == today);
        var dept = me.DepartmentId is null ? null : await Db.Departments.AsNoTracking().FirstOrDefaultAsync(d => d.Id == me.DepartmentId);
        if (r.Kind == "in")
        {
            if (a?.InAt is not null) return Error(409, $"Bạn đã điểm danh vào lúc {VnTime.ToVn(a.InAt.Value):HH:mm}.");
            if (a is null) { a = new Attendance { Id = NewId("cc"), EmployeeId = me.Id, Date = today }; Db.Attendances.Add(a); }
            a.InAt = DateTime.UtcNow; a.InPlace = place; a.InLat = r.Lat; a.InLng = r.Lng; a.InIp = ip; a.Site = site; a.Note = r.Note;
            var allow = VnTime.Hm(dept?.CheckinTime, s.CheckIn);
            // Bản 1.10.4: ngày nghỉ (cuối tuần, lễ) đi làm thì không tính đi muộn; nghỉ sáng thì giờ vào là đầu ca chiều
            var dv = VnTime.Day(today, s);
            if (dv.Kind == "half" && s.Holidays.Select(VnTime.ParseDay).Any(x => x is not null && x.Date == today && x.Half == "s")) allow = VnTime.Hm(s.AfternoonStart, "13:30");
            a.LateMinutes = dv.Value == 0 ? 0 : Math.Max(0, (int)Math.Floor((now.TimeOfDay - allow).TotalMinutes));
            if (dv.Value == 0 && string.IsNullOrEmpty(a.Note)) a.Note = "Đi làm ngày nghỉ" + (dv.Name is { } nn ? " (" + nn + ")" : "");
        }
        else if (r.Kind == "out")
        {
            if (a is null) { a = new Attendance { Id = NewId("cc"), EmployeeId = me.Id, Date = today, Note = "Không điểm danh vào" }; Db.Attendances.Add(a); }
            a.OutAt = DateTime.UtcNow; a.OutPlace = place; a.OutLat = r.Lat; a.OutLng = r.Lng; a.OutIp = ip;
            if (!string.IsNullOrWhiteSpace(r.Note)) a.Note = string.IsNullOrEmpty(a.Note) ? r.Note : a.Note + "; " + r.Note;
            var end = VnTime.Hm(null, s.CheckOut);
            var dv = VnTime.Day(today, s);
            // Làm nửa ngày (thứ Bảy buổi sáng, nghỉ chiều): giờ ra là hết ca sáng
            if (dv.Kind == "half" && (today.DayOfWeek == DayOfWeek.Saturday || s.Holidays.Select(VnTime.ParseDay).Any(x => x is not null && x.Date == today && x.Half == "c"))) end = VnTime.Hm(s.MorningEnd, "12:00");
            a.EarlyMinutes = dv.Value == 0 ? 0 : Math.Max(0, (int)Math.Floor((end - now.TimeOfDay).TotalMinutes));
        }
        else return Error(400, "Dữ liệu không hợp lệ.");
        a.UpdatedAt = DateTime.UtcNow; a.UpdatedBy = Uc.User.Username;
        await Db.SaveChangesAsync();
        return Ok(a);
    }

    [HttpGet("attendance")]
    public async Task<IActionResult> Attendance([FromQuery] string month, [FromQuery] string? employeeId)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!DateOnly.TryParse(month + "-01", out var from)) return Error(400, "Tháng không hợp lệ.");
        var to = from.AddMonths(1);
        var scope = await AttendanceScope(await Me());
        var q = Db.Attendances.AsNoTracking().Where(a => a.Date >= from && a.Date < to);
        if (!string.IsNullOrEmpty(employeeId)) q = q.Where(a => a.EmployeeId == employeeId);
        var list = await q.OrderBy(a => a.Date).ToListAsync();
        if (scope is not null) list = list.Where(a => scope.Contains(a.EmployeeId)).ToList();
        return Ok(list);
    }

    public record FixRequest(string EmployeeId, string Date, string? In, string? Out, string? InPlace, string? Note);

    /// <summary>Điều chỉnh chấm công (người có quyền sửa điểm danh), bắt buộc ghi lý do.</summary>
    [HttpPost("attendance/fix")]
    public async Task<IActionResult> Fix([FromBody] FixRequest r)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("diem-danh", true)) return Denied();
        if (string.IsNullOrWhiteSpace(r.Note)) return Error(400, "Ghi lý do điều chỉnh.");
        if (!DateOnly.TryParse(r.Date, out var d)) return Error(400, "Ngày không hợp lệ.");
        var emp = await Db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == r.EmployeeId); if (emp is null) return Error(400, "Không có nhân sự này.");
        var s = VpSettings.Load(Db);
        var a = await Db.Attendances.FirstOrDefaultAsync(x => x.EmployeeId == r.EmployeeId && x.Date == d);
        if (a is null) { a = new Attendance { Id = NewId("cc"), EmployeeId = r.EmployeeId, Date = d }; Db.Attendances.Add(a); }
        DateTime? T(string? hm) => TimeSpan.TryParse(hm, out var t) ? VnTime.ToUtc(d.ToDateTime(TimeOnly.FromTimeSpan(t))) : null;
        a.InAt = T(r.In); a.OutAt = T(r.Out); a.InPlace = r.InPlace ?? a.InPlace ?? "Trong công ty";
        var dept = emp.DepartmentId is null ? null : await Db.Departments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == emp.DepartmentId);
        a.LateMinutes = a.InAt is { } i ? Math.Max(0, (int)(VnTime.ToVn(i).TimeOfDay - VnTime.Hm(dept?.CheckinTime, s.CheckIn)).TotalMinutes) : 0;
        a.EarlyMinutes = a.OutAt is { } o ? Math.Max(0, (int)(VnTime.Hm(null, s.CheckOut) - VnTime.ToVn(o).TimeOfDay).TotalMinutes) : 0;
        a.Note = $"Điều chỉnh bởi {Uc.User.Name}: {r.Note}"; a.SyncedAt = null;
        a.UpdatedAt = DateTime.UtcNow; a.UpdatedBy = Uc.User.Username;
        Uc.Log("Điều chỉnh chấm công", "Điểm danh", $"{emp.Name} ngày {d:dd/MM/yyyy}: {r.Note}", "attendance", a.Id);
        await Db.SaveChangesAsync();
        return Ok(a);
    }

    /// <summary>Bảng công tháng: mỗi người số ngày công, đi muộn, nghỉ phép, online, công tác.</summary>
    [HttpGet("timesheet")]
    public async Task<IActionResult> Timesheet([FromQuery] string month)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!DateOnly.TryParse(month + "-01", out var from)) return Error(400, "Tháng không hợp lệ.");
        var to = from.AddMonths(1);
        var s = VpSettings.Load(Db);
        var scope = await AttendanceScope(await Me());
        var emps = (await Db.Employees.AsNoTracking().Where(e => e.Attendance).OrderBy(e => e.Name).ToListAsync()).Where(e => scope is null || scope.Contains(e.Id)).ToList();
        var (standard, rows) = await VpCalc.Month(Db, s, emps, from);
        return Ok(new { month, standard, rows });
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("diem-danh", true)) return Denied();
        var s = VpSettings.Load(Db); s.SyncKeyHash = s.SyncKeyHash is null ? null : "đã thiết lập";
        return Ok(s);
    }

    [HttpPut("settings")]
    public async Task<IActionResult> PutSettings([FromBody] VpSettings v)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("diem-danh", true)) return Denied();
        var old = VpSettings.Load(Db);
        v.SyncKeyHash = old.SyncKeyHash;
        v.Ips = v.Ips.Select(x => x.Trim()).Where(x => x.Length > 0).Distinct().ToList();
        v.Holidays = Days(v.Holidays); v.Workdays = Days(v.Workdays);
        if (v.Saturday is not ("khong" or "sang" or "ca-ngay" or "cach-tuan")) v.Saturday = "khong";
        if (v.Saturday == "cach-tuan" && !(DateOnly.TryParse(v.SaturdayAnchor, out var sa) && sa.DayOfWeek == DayOfWeek.Saturday))
            return Error(400, "Thứ Bảy làm cách tuần: chọn ngày mốc là một thứ Bảy có đi làm.");
        v.GreetWork = string.IsNullOrWhiteSpace(v.GreetWork) ? new VpSettings().GreetWork : v.GreetWork.Trim()[..Math.Min(300, v.GreetWork.Trim().Length)];
        v.GreetOff = string.IsNullOrWhiteSpace(v.GreetOff) ? new VpSettings().GreetOff : v.GreetOff.Trim()[..Math.Min(300, v.GreetOff.Trim().Length)];
        VpSettings.Save(Db, v, Uc.User.Username);
        Uc.Log("Cập nhật thiết lập điểm danh", "Điểm danh", $"{v.Places.Count} địa điểm, {v.Ips.Count} IP, giờ vào {v.CheckIn}");
        await Db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    /// <summary>Chuẩn hóa danh sách ngày: bỏ dòng sai, mỗi ngày một dòng (dòng sau ghi đè), sắp theo ngày.</summary>
    private static List<string> Days(List<string>? l) => (l ?? new()).Select(VnTime.ParseDay).Where(x => x is not null).GroupBy(x => x!.Date).Select(g => g.Last()!)
        .OrderBy(x => x.Date).Select(x => x.Date.ToString("yyyy-MM-dd") + (x.Half is null ? "" : ":" + x.Half) + (x.Name is null ? "" : " " + x.Name[..Math.Min(100, x.Name.Length)])).ToList();

    /// <summary>Bản 1.10.4: gợi ý ngày nghỉ lễ, tết theo luật (kèm nghỉ bù) cho một năm; quản trị xem lại rồi lưu.</summary>
    [HttpGet("holidays/legal")]
    public async Task<IActionResult> LegalHolidays([FromQuery] int year)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("diem-danh", true)) return Denied();
        if (year < 2000 || year > 2100) return Error(400, "Năm không hợp lệ.");
        return Ok(LichNghi.Legal(year, VpSettings.Load(Db)));
    }

    // ------------------------------------------------------------------ đề xuất

    private async Task<bool> CanDecide(Request r)
    {
        if (Uc.User is null || r.Status != "Chờ duyệt") return false;
        var emp = await Db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == r.EmployeeId);
        if (emp?.UserId == Uc.User.Id) return Uc.IsAdmin; // không tự duyệt đề xuất của mình (trừ quản trị)
        if (CanApproveAll) return true;
        if (emp?.DepartmentId is null) return false;
        var d = await Db.Departments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == emp.DepartmentId);
        return d?.ManagerUserId == Uc.User.Id;
    }

    [HttpGet("requests")]
    public async Task<IActionResult> Requests([FromQuery] string? scope)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var me = await Me();
        var all = await Db.Requests.AsNoTracking().OrderByDescending(r => r.CreatedAt).ToListAsync();
        var depts = await ManagedDepts();
        var deptOf = await Db.Employees.AsNoTracking().ToDictionaryAsync(e => e.Id, e => e.DepartmentId);
        IEnumerable<Request> res = scope switch
        {
            "mine" => all.Where(r => me is not null && r.EmployeeId == me.Id),
            "approve" => all.Where(r => r.Status == "Chờ duyệt").ToList().Where(r => CanDecide(r).GetAwaiter().GetResult()),
            _ => Uc.Can("de-xuat") || CanApproveAll ? all
                : all.Where(r => (me is not null && r.EmployeeId == me.Id) || (deptOf.TryGetValue(r.EmployeeId, out var d) && d is not null && depts.Contains(d)))
        };
        return Ok(res.Take(2000));
    }

    [HttpPut("requests/{id}")]
    public async Task<IActionResult> PutRequest(string id, [FromBody] Request r)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!ValidId(id)) return Error(400, "Dữ liệu không hợp lệ.");
        var me = await Me(); if (me is null) return Error(400, "Tài khoản chưa gắn với hồ sơ nhân sự. Liên hệ người quản lý nhân sự.");
        if (!RequestTypes.Contains(r.Type)) return Error(400, "Chọn loại đề xuất.");
        if (r.FromAt is { } f && r.ToAt is { } t && t < f) return Error(400, "Thời gian kết thúc phải sau thời gian bắt đầu.");
        if (r.Type == "Tăng ca")
        {
            // Bản 1.10.9: phiếu xác nhận tăng ca lập sau khi đã làm, trong một ngày, không quá số giờ tối đa
            if (r.FromAt is null || r.Hours is not > 0) return Error(400, "Phiếu tăng ca: chọn ngày và ghi số giờ đã làm thêm.");
            var od = DateOnly.FromDateTime(VnTime.ToVn(r.FromAt.Value));
            if (od > DateOnly.FromDateTime(VnTime.Now)) return Error(400, "Phiếu tăng ca lập sau khi đã làm thêm giờ, không lập trước.");
            if (r.ToAt is { } te && DateOnly.FromDateTime(VnTime.ToVn(te)) != od) return Error(400, "Mỗi phiếu tăng ca ghi cho một ngày.");
            var pset = PaySettings.Load(Db); bool Urgent(string? t) => (t ?? "").Contains("gấp", StringComparison.OrdinalIgnoreCase);
            var f0 = VnTime.ToUtc(od.ToDateTime(TimeOnly.MinValue)); var t0 = VnTime.ToUtc(od.AddDays(1).ToDateTime(TimeOnly.MinValue));
            var others = await Db.Requests.AsNoTracking().Where(q => q.EmployeeId == me.Id && q.Id != id && q.Type == "Tăng ca" && q.Status != "Từ chối" && q.Status != "Đã hủy"
                && q.FromAt != null && q.FromAt >= f0 && q.FromAt < t0).ToListAsync();
            var other = others.Sum(q => q.Hours ?? 0);
            var max = Urgent(r.Title) || others.Any(q => Urgent(q.Title)) ? pset.OtMaxUrgent : pset.OtMaxPerDay;
            if (max > 0 && other + r.Hours > max) return Error(400, $"Một ngày tăng ca không quá {max:0.#} giờ" + (other > 0 ? $" (ngày {od:dd/MM} đã ghi {other:0.#} giờ)." : "."));
        }
        var x = await Db.Requests.FindAsync(id);
        if (x is null)
        {
            var year = VnTime.Now.Year;
            var n = await Db.Requests.CountAsync(q => q.Code.StartsWith($"DX{year}-")) + 1;
            x = new Request { Id = id, EmployeeId = me.Id, CreatedAt = DateTime.UtcNow, Code = $"DX{year}-{n:0000}" };
            Db.Requests.Add(x);
        }
        else if (x.EmployeeId != me.Id || x.Status != "Chờ duyệt") return Denied("Chỉ sửa được đề xuất của mình khi chưa duyệt.");
        x.Type = r.Type; x.Title = r.Title; x.FromAt = r.FromAt; x.ToAt = r.ToAt; x.Days = r.Days; x.Hours = r.Hours; x.Amount = r.Amount; x.Place = r.Place; x.Reason = r.Reason;
        x.Status = "Chờ duyệt"; x.UpdatedAt = DateTime.UtcNow; x.UpdatedBy = Uc.User.Username;
        Uc.Log("Gửi đề xuất", "Đề xuất", $"{x.Code} {x.Type}", "requests", x.Id);
        await Db.SaveChangesAsync();
        return Ok(x);
    }

    public record DecideRequest(string Action, string? Note);

    [HttpPost("requests/{id}/decide")]
    public async Task<IActionResult> Decide(string id, [FromBody] DecideRequest d)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var x = await Db.Requests.FindAsync(id); if (x is null) return NotFound();
        if (d.Action == "cancel")
        {
            var me = await Me();
            if (me?.Id != x.EmployeeId || x.Status != "Chờ duyệt") return Denied("Chỉ người gửi hủy được đề xuất đang chờ duyệt.");
            x.Status = "Đã hủy";
        }
        else
        {
            if (!await CanDecide(x)) return Denied("Bạn không có quyền duyệt đề xuất này.");
            if (d.Action == "reject" && string.IsNullOrWhiteSpace(d.Note)) return Error(400, "Ghi lý do không duyệt.");
            x.Status = d.Action == "approve" ? "Đã duyệt" : d.Action == "reject" ? "Từ chối" : x.Status;
            x.ApproverUserId = Uc.User.Id; x.ApproverName = Uc.User.Name;
        }
        x.DecidedAt = DateTime.UtcNow; x.DecisionNote = d.Note; x.UpdatedAt = DateTime.UtcNow; x.UpdatedBy = Uc.User.Username;
        Uc.Log(x.Status == "Đã duyệt" ? "Duyệt đề xuất" : x.Status == "Từ chối" ? "Không duyệt đề xuất" : "Hủy đề xuất", "Đề xuất", $"{x.Code} {x.Type}", "requests", x.Id);
        await Db.SaveChangesAsync();
        return Ok(x);
    }

    // ------------------------------------------------------------------ chuyển dữ liệu từ e-work, chép chấm công ngược lại

    /// <summary>Nạp tệp xuất từ e-work (xuat-ework.ps1): phòng ban, nhân sự, tài khoản, chấm công, ngày nghỉ, đề xuất. Chạy lại được (khớp theo mã e-work).</summary>
    [HttpPost("import-ework"), RequestSizeLimit(600L * 1024 * 1024), RequestFormLimits(MultipartBodyLengthLimit = 600L * 1024 * 1024)]
    public async Task<IActionResult> ImportEwork(IFormFile file)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được chuyển dữ liệu.");
        using var doc = await JsonDocument.ParseAsync(file.OpenReadStream());
        var rep = await EworkImport.Run(Db, doc.RootElement, Uc.User.Username);
        Uc.Log("Chuyển dữ liệu từ e-work", "Văn phòng", rep.Summary);
        await Db.SaveChangesAsync();
        return Ok(rep);
    }

    /// <summary>Lưu trữ e-work: danh sách bảng đã chuyển và số dòng (chỉ quản trị).</summary>
    [HttpGet("ework-archive")]
    public async Task<IActionResult> EworkTables()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được tra cứu dữ liệu e-work cũ.");
        var l = await Db.EworkArchive.AsNoTracking().GroupBy(r => r.TableName).Select(g => new { table = g.Key, rows = g.Count(), updatedAt = g.Max(r => r.UpdatedAt) }).ToListAsync();
        return Ok(l.OrderBy(x => x.table));
    }

    /// <summary>Các dòng của một bảng e-work đã lưu trữ; q tìm trong mọi cột, period lọc kỳ yyyy-MM.</summary>
    [HttpGet("ework-archive/{table}")]
    public async Task<IActionResult> EworkRows(string table, [FromQuery] string? q, [FromQuery] string? period, [FromQuery] int skip = 0, [FromQuery] int take = 200)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được tra cứu dữ liệu e-work cũ.");
        var x = Db.EworkArchive.AsNoTracking().Where(r => r.TableName == table);
        if (!string.IsNullOrWhiteSpace(period)) x = x.Where(r => r.Period == period);
        if (!string.IsNullOrWhiteSpace(q)) { var k = q.Trim().ToLower(); x = x.Where(r => r.Data.ToLower().Contains(k)); }
        var total = await x.CountAsync();
        var rows = await x.OrderBy(r => r.Period == null).ThenByDescending(r => r.Period).ThenBy(r => r.RowKey).Skip(Math.Max(0, skip)).Take(Math.Clamp(take, 1, 50000)).Select(r => r.Data).ToListAsync();
        var periods = await Db.EworkArchive.AsNoTracking().Where(r => r.TableName == table && r.Period != null).Select(r => r.Period!).Distinct().OrderByDescending(p => p).ToListAsync();
        return Ok(new { total, periods, rows = rows.Select(d => JsonDocument.Parse(d).RootElement) });
    }

    /// <summary>Tạo khóa mới cho tác vụ chép chấm công sang e-work (chỉ hiện một lần).</summary>
    [HttpPost("sync-key")]
    public async Task<IActionResult> SyncKey([FromQuery] string? from)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied();
        var key = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
        var s = VpSettings.Load(Db); s.SyncKeyHash = Hash(key); s.SyncFrom = from ?? s.SyncFrom ?? VnTime.Now.ToString("yyyy-MM-dd");
        VpSettings.Save(Db, s, Uc.User.Username);
        Uc.Log("Tạo khóa chép chấm công sang e-work", "Điểm danh", "từ ngày " + s.SyncFrom);
        await Db.SaveChangesAsync();
        return Ok(new { key, s.SyncFrom });
    }

    private static string Hash(string k) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(k)));
    private bool SyncAuthorized(VpSettings s)
    {
        var k = Request.Headers["X-Sync-Key"].ToString();
        return s.SyncKeyHash is not null && k.Length > 0 && CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(Hash(k)), Encoding.UTF8.GetBytes(s.SyncKeyHash));
    }

    /// <summary>Lượt điểm danh trên QLDA chưa chép sang e-work (tác vụ đặt lịch trên máy e-work gọi, xác thực bằng khóa).</summary>
    [AllowAnonymous, HttpGet("sync/pending")]
    public async Task<IActionResult> SyncPending()
    {
        var s = VpSettings.Load(Db); if (!SyncAuthorized(s)) return Error(403, "Sai khóa.");
        var from = DateOnly.TryParse(s.SyncFrom, out var f) ? f : DateOnly.FromDateTime(VnTime.Now);
        var list = await Db.Attendances.AsNoTracking().Where(a => a.Source == "QLDA" && a.InAt != null && a.SyncedAt == null && a.Date >= from).OrderBy(a => a.Date).Take(2000).ToListAsync();
        var emps = await Db.Employees.AsNoTracking().Where(e => e.EworkId != null).ToDictionaryAsync(e => e.Id);
        var users = await Db.Users.AsNoTracking().ToDictionaryAsync(u => u.Id, u => u.Username);
        return Ok(list.Where(a => emps.ContainsKey(a.EmployeeId)).Select(a =>
        {
            var e = emps[a.EmployeeId];
            return new
            {
                a.Id, eworkUserId = e.EworkId, userName = e.UserId != null && users.TryGetValue(e.UserId, out var un) ? un : "", fullName = e.Name,
                checkIn = VnTime.ToVn(a.InAt!.Value).ToString("yyyy-MM-ddTHH:mm:ss"), lateMinutes = a.LateMinutes, inside = a.InPlace == "Trong công ty",
                online = a.InPlace == "Làm việc online", place = a.InPlace, site = a.Site, ip = a.InIp, lat = a.InLat, lng = a.InLng, eworkId = a.EworkId
            };
        }));
    }

    public record SyncAck(List<SyncAckItem> Items);
    public record SyncAckItem(string Id, string? EworkId);

    [AllowAnonymous, HttpPost("sync/ack")]
    public async Task<IActionResult> SyncAckPost([FromBody] SyncAck r)
    {
        var s = VpSettings.Load(Db); if (!SyncAuthorized(s)) return Error(403, "Sai khóa.");
        var ids = r.Items.Select(i => i.Id).ToHashSet();
        var list = await Db.Attendances.Where(a => ids.Contains(a.Id)).ToListAsync();
        foreach (var a in list) { a.SyncedAt = DateTime.UtcNow; a.EworkId = r.Items.First(i => i.Id == a.Id).EworkId ?? a.EworkId; }
        await Db.SaveChangesAsync();
        return Ok(new { ok = list.Count });
    }
}

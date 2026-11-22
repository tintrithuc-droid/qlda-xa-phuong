using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QldaTtts.Web.Data;

/* Bản 1.9: phân hệ Văn phòng (nhân sự, điểm danh, đề xuất) cho đơn vị dùng QLDA điều hành chung (Công ty Tri Thức). */

/// <summary>Phòng ban, bộ phận.</summary>
[Table("Departments")]
public class Department : EntityBase
{
    [MaxLength(50)] public string Code { get; set; } = "";
    [MaxLength(200)] public string Name { get; set; } = "";
    /// <summary>Tài khoản trưởng phòng: duyệt đề xuất, xem chấm công của phòng.</summary>
    [MaxLength(64)] public string? ManagerUserId { get; set; }
    /// <summary>Giờ vào cho phép riêng của phòng (HH:mm); trống = theo thiết lập chung.</summary>
    [MaxLength(5)] public string? CheckinTime { get; set; }
    public int Order { get; set; }
    [MaxLength(64)] public string? EworkId { get; set; }
}

/// <summary>Hồ sơ nhân sự. Thông tin riêng (CCCD, ngân hàng, mã số thuế, BHXH) chỉ người quản lý nhân sự và chính người đó xem được.</summary>
[Table("Employees")]
public class Employee : EntityBase
{
    [MaxLength(64)] public string? UserId { get; set; }
    [MaxLength(50)] public string? Code { get; set; }
    [MaxLength(200)] public string Name { get; set; } = "";
    [MaxLength(64)] public string? DepartmentId { get; set; }
    [MaxLength(200)] public string? Position { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    [MaxLength(200)] public string? Email { get; set; }
    public DateOnly? Birthday { get; set; }
    [MaxLength(10)] public string? Gender { get; set; }
    [MaxLength(500)] public string? Address { get; set; }
    public DateOnly? StartDate { get; set; }
    [MaxLength(50)] public string Status { get; set; } = "Đang làm việc";
    /// <summary>Có điểm danh (giống cờ IsChamCong của e-work).</summary>
    public bool Attendance { get; set; } = true;
    // ---- thông tin riêng
    [MaxLength(30)] public string? IdNumber { get; set; }
    public DateOnly? IdDate { get; set; }
    [MaxLength(200)] public string? IdPlace { get; set; }
    [MaxLength(50)] public string? TaxCode { get; set; }
    [MaxLength(50)] public string? InsuranceNo { get; set; }
    [MaxLength(50)] public string? BankAccount { get; set; }
    [MaxLength(200)] public string? BankName { get; set; }
    [MaxLength(100)] public string? ContractType { get; set; }
    [MaxLength(100)] public string? ContractNo { get; set; }
    public DateOnly? ContractStart { get; set; }
    public DateOnly? ContractEnd { get; set; }
    public int Dependents { get; set; }
    public string? Note { get; set; }
    /// <summary>Mã tài khoản bên e-work (AspNetUsers.Id) để chuyển dữ liệu và chép chấm công ngược lại.</summary>
    [MaxLength(64)] public string? EworkId { get; set; }
    // ---- bản 1.10.4: lý lịch đầy đủ
    public DateOnly? EndDate { get; set; }
    [MaxLength(100)] public string? Education { get; set; }
    [MaxLength(200)] public string? Major { get; set; }
    [MaxLength(300)] public string? Hometown { get; set; }
    [MaxLength(500)] public string? CurrentAddress { get; set; }
    [MaxLength(50)] public string? Ethnicity { get; set; }
    [MaxLength(50)] public string? Nationality { get; set; }
    [MaxLength(30)] public string? Marital { get; set; }
    [MaxLength(200)] public string? EmergencyName { get; set; }
    [MaxLength(50)] public string? EmergencyPhone { get; set; }
    [MaxLength(50)] public string? EmergencyRelation { get; set; }
}

/// <summary>Bản 1.10.4: các mục của hồ sơ nhân sự: bằng cấp, chứng chỉ (bang-cap), khen thưởng (khen-thuong), kỷ luật (ky-luat),
/// quá trình công tác (cong-tac), hợp đồng lao động (hop-dong), giấy tờ khác (giay-to). Mỗi mục có thể đính một tệp.</summary>
[Table("EmployeeRecords")]
public class EmployeeRecord : EntityBase
{
    [MaxLength(64)] public string EmployeeId { get; set; } = "";
    [MaxLength(32)] public string Kind { get; set; } = "";
    [MaxLength(300)] public string Title { get; set; } = "";
    [MaxLength(300)] public string? Org { get; set; }
    [MaxLength(100)] public string? Number { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
    [Column(TypeName = "decimal(18,0)")] public decimal? Amount { get; set; }
    [MaxLength(2000)] public string? Note { get; set; }
    [MaxLength(64)] public string? FileId { get; set; }
    [MaxLength(300)] public string? FileName { get; set; }
    [MaxLength(64)] public string? EworkId { get; set; }
}

/// <summary>Một ngày điểm danh của một người: giờ vào, giờ ra, nơi điểm danh.</summary>
[Table("Attendances")]
public class Attendance : EntityBase
{
    [MaxLength(64)] public string EmployeeId { get; set; } = "";
    public DateOnly Date { get; set; }
    public DateTime? InAt { get; set; }
    public DateTime? OutAt { get; set; }
    /// <summary>Trong công ty / Ngoài công ty / Làm việc online / Công tác.</summary>
    [MaxLength(50)] public string? InPlace { get; set; }
    [MaxLength(50)] public string? OutPlace { get; set; }
    public double? InLat { get; set; }
    public double? InLng { get; set; }
    public double? OutLat { get; set; }
    public double? OutLng { get; set; }
    [MaxLength(60)] public string? InIp { get; set; }
    [MaxLength(60)] public string? OutIp { get; set; }
    /// <summary>Tên địa điểm khớp (văn phòng, công trình…).</summary>
    [MaxLength(200)] public string? Site { get; set; }
    public int LateMinutes { get; set; }
    public int EarlyMinutes { get; set; }
    [MaxLength(500)] public string? Note { get; set; }
    /// <summary>QLDA hoặc e-work (lịch sử chuyển sang).</summary>
    [MaxLength(20)] public string Source { get; set; } = "QLDA";
    [MaxLength(64)] public string? EworkId { get; set; }
    /// <summary>Đã chép sang bảng ChamCongs của e-work (để tính lương trong thời gian chuyển tiếp).</summary>
    public DateTime? SyncedAt { get; set; }
}

/// <summary>Đề xuất: nghỉ phép, làm việc online, tăng ca, công tác, … Duyệt bởi trưởng phòng hoặc người có quyền duyệt đề xuất.</summary>
[Table("Requests")]
public class Request : EntityBase
{
    [MaxLength(50)] public string Code { get; set; } = "";
    [MaxLength(100)] public string Type { get; set; } = "";
    [MaxLength(64)] public string EmployeeId { get; set; } = "";
    [MaxLength(300)] public string? Title { get; set; }
    public DateTime? FromAt { get; set; }
    public DateTime? ToAt { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? Days { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? Hours { get; set; }
    [Column(TypeName = "decimal(20,0)")] public decimal? Amount { get; set; }
    [MaxLength(300)] public string? Place { get; set; }
    public string? Reason { get; set; }
    /// <summary>Chờ duyệt / Đã duyệt / Từ chối / Đã hủy.</summary>
    [MaxLength(30)] public string Status { get; set; } = "Chờ duyệt";
    [MaxLength(64)] public string? ApproverUserId { get; set; }
    [MaxLength(200)] public string? ApproverName { get; set; }
    public DateTime? DecidedAt { get; set; }
    [MaxLength(1000)] public string? DecisionNote { get; set; }
    public DateTime CreatedAt { get; set; }
    [MaxLength(64)] public string? EworkId { get; set; }
    /// <summary>Bản 1.10.4: đưa đề xuất (tạm ứng, xăng xe) vào bảng lương: null = theo thiết lập lương, true/false = Ban giám đốc, kế toán quyết định riêng.</summary>
    public bool? Payroll { get; set; }
}

/* Bản 1.10: lịch công tác, lịch họp và thông báo nội bộ. */

/// <summary>Một mục lịch công tác tuần: cuộc họp, buổi làm việc, đi công tác, sự kiện.</summary>
[Table("Meetings")]
public class Meeting : EntityBase
{
    /// <summary>Họp / Làm việc / Công tác / Sự kiện.</summary>
    [MaxLength(30)] public string Kind { get; set; } = "Họp";
    [MaxLength(500)] public string Title { get; set; } = "";
    public DateTime StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    [MaxLength(300)] public string? Place { get; set; }
    [MaxLength(500)] public string? OnlineLink { get; set; }
    /// <summary>Người chủ trì (tên hiển thị, ghi tự do: "Giám đốc", "Ông A").</summary>
    [MaxLength(200)] public string? Chair { get; set; }
    /// <summary>Thành phần (ghi tự do, in ra lịch tuần).</summary>
    [MaxLength(1000)] public string? Participants { get; set; }
    /// <summary>Mã hồ sơ nhân sự được mời, cách nhau dấu phẩy (hiện ở "Lịch của tôi").</summary>
    public string? AttendeeIds { get; set; }
    /// <summary>Đơn vị, người chuẩn bị nội dung.</summary>
    [MaxLength(300)] public string? Preparer { get; set; }
    public string? Content { get; set; }
    /// <summary>Kết luận, ghi chép sau cuộc họp.</summary>
    public string? Conclusion { get; set; }
    /// <summary>Đã lên lịch / Đã hoãn / Đã hủy.</summary>
    [MaxLength(30)] public string Status { get; set; } = "Đã lên lịch";
    [MaxLength(64)] public string? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>Thông báo nội bộ gửi toàn công ty hoặc một số phòng ban.</summary>
[Table("Notices")]
public class Notice : EntityBase
{
    [MaxLength(500)] public string Title { get; set; } = "";
    public string? Body { get; set; }
    /// <summary>Quan trọng: hiện nổi trên trang Điểm danh đến khi người nhận đã xem.</summary>
    public bool Important { get; set; }
    public bool Pinned { get; set; }
    /// <summary>Phòng ban nhận, cách nhau dấu phẩy; trống = toàn công ty.</summary>
    public string? DeptIds { get; set; }
    public DateTime PublishedAt { get; set; }
    public DateOnly? ExpireOn { get; set; }
    [MaxLength(200)] public string? AuthorName { get; set; }
    [MaxLength(64)] public string? CreatedByUserId { get; set; }
    [MaxLength(500)] public string? Link { get; set; }
}

/// <summary>Ai đã xem thông báo, lúc nào.</summary>
[Table("NoticeReads")]
public class NoticeRead : EntityBase
{
    [MaxLength(64)] public string NoticeId { get; set; } = "";
    [MaxLength(64)] public string UserId { get; set; } = "";
    public DateTime ReadAt { get; set; }
}

/* Bản 1.10: KPI tháng nhiều nguồn (công việc, kết quả dự án, chuyên cần, đánh giá của quản lý). */

/// <summary>Phiếu KPI một người một tháng. Điểm công việc, chuyên cần tự tính khi chưa chốt; chốt thì lưu cố định.</summary>
[Table("KpiSheets")]
public class KpiSheet : EntityBase
{
    [MaxLength(64)] public string EmployeeId { get; set; } = "";
    /// <summary>Tháng dạng yyyy-MM.</summary>
    [MaxLength(7)] public string Month { get; set; } = "";
    /// <summary>Điểm hoàn thành công việc (0–100) do quản lý ghi đè; trống = theo số liệu công việc.</summary>
    [Column(TypeName = "decimal(6,2)")] public decimal? WorkScore { get; set; }
    [Column(TypeName = "decimal(6,2)")] public decimal? ProjectScore { get; set; }
    /// <summary>Đánh giá của quản lý, thang 1–5.</summary>
    public int? ManagerRating { get; set; }
    [MaxLength(1000)] public string? ManagerNote { get; set; }
    [MaxLength(200)] public string? RatedBy { get; set; }
    /// <summary>Phản hồi, khiếu nại của người được đánh giá (trước khi chốt).</summary>
    [MaxLength(1000)] public string? EmployeeNote { get; set; }
    // ---- giá trị cố định khi chốt
    [Column(TypeName = "decimal(6,2)")] public decimal? WorkFinal { get; set; }
    [Column(TypeName = "decimal(6,2)")] public decimal? AttendanceFinal { get; set; }
    [Column(TypeName = "decimal(6,2)")] public decimal? Total { get; set; }
    [MaxLength(10)] public string? Grade { get; set; }
    /// <summary>Bản 1.10.4: hạng trong phòng ban và tiền thưởng theo hạng (lưu khi chốt).</summary>
    public int? Rank { get; set; }
    [Column(TypeName = "decimal(18,0)")] public decimal? RankBonus { get; set; }
    public DateTime? LockedAt { get; set; }
    [MaxLength(200)] public string? LockedBy { get; set; }
}

/// <summary>Bản 1.10: bản lưu nguyên dữ liệu e-work (mọi bảng nghiệp vụ) để tra cứu và để phân hệ lương, công việc chuyển tiếp không phải nhập lại.
/// Chỉ quản trị hệ thống xem. Nạp lại tệp xuất thì thay toàn bộ bản lưu của bảng đó.</summary>
[Table("EworkArchive")]
public class EworkRow : EntityBase
{
    [MaxLength(100)] public string TableName { get; set; } = "";
    [MaxLength(100)] public string RowKey { get; set; } = "";
    /// <summary>Mã tài khoản e-work của dòng (cột UserId nếu có) để tra theo người.</summary>
    [MaxLength(64)] public string? EworkUserId { get; set; }
    /// <summary>Kỳ yyyy-MM (cột Nam, Thang nếu có).</summary>
    [MaxLength(7)] public string? Period { get; set; }
    public string Data { get; set; } = "";
}

/// <summary>Hồ sơ lương hiện hành của một người: lương chính, lương đóng bảo hiểm, các khoản phụ cấp cố định.</summary>
[Table("PayProfiles")]
public class PayProfile : EntityBase
{
    [MaxLength(64)] public string EmployeeId { get; set; } = "";
    [Column(TypeName = "decimal(18,0)")] public decimal BaseSalary { get; set; }
    /// <summary>Lương đóng bảo hiểm; trống = bằng lương chính.</summary>
    [Column(TypeName = "decimal(18,0)")] public decimal? InsuranceSalary { get; set; }
    /// <summary>Phụ cấp cố định: JSON [{name, amount, exempt}] (exempt = phần không tính thuế TNCN).</summary>
    public string? Allowances { get; set; }
    /// <summary>Không đóng bảo hiểm (thử việc, cộng tác viên…).</summary>
    public bool NoInsurance { get; set; }
    /// <summary>Khấu trừ thuế 10% (cộng tác viên, hợp đồng dưới 3 tháng) thay cho biểu lũy tiến.</summary>
    public bool FlatTax { get; set; }
    [MaxLength(7)] public string? FromMonth { get; set; }
}

/// <summary>Phiếu lương một người một tháng: điều chỉnh tay (thưởng, khấu trừ) và số liệu cố định khi chốt.</summary>
[Table("Payslips")]
public class Payslip : EntityBase
{
    [MaxLength(64)] public string EmployeeId { get; set; } = "";
    [MaxLength(7)] public string Month { get; set; } = "";
    [Column(TypeName = "decimal(18,0)")] public decimal Bonus { get; set; }
    [Column(TypeName = "decimal(18,0)")] public decimal Deduction { get; set; }
    [MaxLength(500)] public string? Note { get; set; }
    /// <summary>Toàn bộ các dòng phiếu lương (JSON) lưu cố định khi chốt.</summary>
    public string? Data { get; set; }
    [Column(TypeName = "decimal(18,0)")] public decimal? Net { get; set; }
    public DateTime? LockedAt { get; set; }
    [MaxLength(200)] public string? LockedBy { get; set; }
    /// <summary>Bản 1.10.4: người lao động tự xác nhận phiếu lương (từ ngày 1 đến ngày 3 tháng sau theo thiết lập), có thể kèm kiến nghị.</summary>
    public DateTime? ConfirmedAt { get; set; }
    [MaxLength(2000)] public string? Feedback { get; set; }
    public DateTime? FeedbackAt { get; set; }
    /// <summary>"Chờ xử lý" hoặc "Đã trả lời".</summary>
    [MaxLength(32)] public string? FeedbackStatus { get; set; }
    [MaxLength(2000)] public string? Reply { get; set; }
    public DateTime? RepliedAt { get; set; }
    [MaxLength(200)] public string? RepliedBy { get; set; }
}

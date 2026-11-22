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
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace QldaTtts.Web.Data;

/// <summary>Lớp cơ sở cho mọi bản ghi nghiệp vụ: khóa chuỗi và dấu vết cập nhật.</summary>
public abstract class EntityBase
{
    [Key, MaxLength(64)] public string Id { get; set; } = "";
    public DateTime? UpdatedAt { get; set; }
    [MaxLength(64)] public string? UpdatedBy { get; set; }
}

/// <summary>Bản ghi gắn trực tiếp với một dự án (phục vụ phân quyền phạm vi dữ liệu).</summary>
public interface IHasProject { string? ProjectId { get; } }
/// <summary>Bản ghi gắn với hợp đồng; dự án được suy ra qua hợp đồng.</summary>
public interface IHasContract { string? ContractId { get; } }

[Table("Projects")]
public class Project : EntityBase
{
    [MaxLength(50)] public string Code { get; set; } = "";
    [MaxLength(500)] public string Name { get; set; } = "";
    [MaxLength(100)] public string? Group { get; set; }
    [Column(TypeName = "decimal(20,0)")] public decimal? Tmdt { get; set; }
    [MaxLength(200)] public string? Capital { get; set; }
    [MaxLength(300)] public string? Owner { get; set; }
    [MaxLength(300)] public string? Location { get; set; }
    public DateOnly? Start { get; set; }
    public DateOnly? End { get; set; }
    [MaxLength(100)] public string? Status { get; set; }
    [MaxLength(100)] public string? Phase { get; set; }
    [MaxLength(500)] public string? Decision { get; set; }
    public string? Desc { get; set; }
}

[Table("ProjectTasks")]
public class ProjectTask : EntityBase, IHasProject
{
    [MaxLength(64)] public string? ProjectId { get; set; }
    [MaxLength(500)] public string Name { get; set; } = "";
    [MaxLength(200)] public string? Assignee { get; set; }
    public DateOnly? Due { get; set; }
    [MaxLength(50)] public string? Status { get; set; }
    [MaxLength(50)] public string? Priority { get; set; }
    public string? Note { get; set; }
    public DateOnly? DoneDate { get; set; }
}

[Table("LegalDocuments")]
public class LegalDocument : EntityBase, IHasProject
{
    [MaxLength(64)] public string? ProjectId { get; set; }
    [MaxLength(64)] public string? PackageId { get; set; }
    [MaxLength(200)] public string? Type { get; set; }
    [MaxLength(200)] public string? Number { get; set; }
    public DateOnly? Date { get; set; }
    [MaxLength(300)] public string? Issuer { get; set; }
    public string? Title { get; set; }
    [MaxLength(300)] public string? FileName { get; set; }
    public long? FileSize { get; set; }
    [MaxLength(64)] public string? AssetId { get; set; }
    [MaxLength(300)] public string? Url { get; set; }
    /// <summary>Hiệu lực đến (bảo lãnh, giấy phép…) để cảnh báo sắp hết hạn.</summary>
    public DateOnly? ValidUntil { get; set; }
}

[Table("ConstructionItems")]
public class ConstructionItem : EntityBase, IHasProject
{
    [MaxLength(64)] public string? ProjectId { get; set; }
    [MaxLength(50)] public string Code { get; set; } = "";
    [MaxLength(300)] public string Name { get; set; } = "";
    [MaxLength(300)] public string? Structure { get; set; }
    public double? Area { get; set; }
    public int? Floors { get; set; }
    public double? Progress { get; set; }
    public string? Desc { get; set; }
}

[Table("ModelFiles")]
public class ModelFile : EntityBase, IHasProject
{
    [MaxLength(64)] public string? FileKey { get; set; }
    [MaxLength(64)] public string? ProjectId { get; set; }
    [MaxLength(64)] public string? ItemId { get; set; }
    [MaxLength(300)] public string Name { get; set; } = "";
    [MaxLength(20)] public string? Format { get; set; }
    public int Version { get; set; } = 1;
    public DateOnly? Date { get; set; }
    [MaxLength(200)] public string? By { get; set; }
    public long? Size { get; set; }
    public string? Note { get; set; }
    [MaxLength(64)] public string? AssetId { get; set; }
    [MaxLength(300)] public string? Url { get; set; }
}

[Table("Packages")]
public class Package : EntityBase, IHasProject
{
    [MaxLength(64)] public string? ProjectId { get; set; }
    [MaxLength(50)] public string Code { get; set; } = "";
    [MaxLength(500)] public string Name { get; set; } = "";
    [MaxLength(100)] public string? Type { get; set; }
    [MaxLength(100)] public string? Method { get; set; }
    [Column(TypeName = "decimal(20,0)")] public decimal? Estimate { get; set; }
    [MaxLength(100)] public string? Status { get; set; }
    [MaxLength(200)] public string? Duration { get; set; }
}

[Table("Contracts")]
public class Contract : EntityBase, IHasProject
{
    [MaxLength(64)] public string? PackageId { get; set; }
    [MaxLength(64)] public string? ProjectId { get; set; }
    [MaxLength(100)] public string Number { get; set; } = "";
    [MaxLength(300)] public string? Contractor { get; set; }
    public DateOnly? SignDate { get; set; }
    [Column(TypeName = "decimal(20,0)")] public decimal? Value { get; set; }
    public DateOnly? Start { get; set; }
    public DateOnly? End { get; set; }
    [MaxLength(100)] public string? Ctype { get; set; }
    [MaxLength(100)] public string? Guarantee { get; set; }
    public DateOnly? GuaranteeUntil { get; set; }
    public DateOnly? AdvanceGuaranteeUntil { get; set; }
    public double? AdvanceRate { get; set; }
    public string? Note { get; set; }
}

[Table("ContractAddenda")]
public class Addendum : EntityBase, IHasContract
{
    [MaxLength(64)] public string? ContractId { get; set; }
    [MaxLength(100)] public string? Number { get; set; }
    public DateOnly? Date { get; set; }
    public string? Content { get; set; }
    [Column(TypeName = "decimal(20,0)")] public decimal? ValueChange { get; set; }
    public int? DaysChange { get; set; }
}

public class ProgressPoint
{
    public string? Date { get; set; }
    public double? Progress { get; set; }
    public string? Note { get; set; }
    public string? By { get; set; }
}

[Table("ScheduleItems")]
public class ScheduleItem : EntityBase, IHasProject
{
    [MaxLength(64)] public string? ProjectId { get; set; }
    [MaxLength(64)] public string? PackageId { get; set; }
    [MaxLength(64)] public string? ItemId { get; set; }
    [MaxLength(500)] public string Name { get; set; } = "";
    public DateOnly? PlanStart { get; set; }
    public DateOnly? PlanEnd { get; set; }
    public DateOnly? ActualStart { get; set; }
    public DateOnly? ActualEnd { get; set; }
    public double? Progress { get; set; }
    public double? Weight { get; set; }
    public List<ProgressPoint> History { get; set; } = new();
}

public class Photo
{
    public string? Url { get; set; }
    public string? AssetId { get; set; }
    public string? Name { get; set; }
    public string? Date { get; set; }
    public string? By { get; set; }
    public string? Caption { get; set; }
}

[Table("ConstructionDiaries")]
public class Diary : EntityBase, IHasProject
{
    [MaxLength(64)] public string? ProjectId { get; set; }
    [MaxLength(64)] public string? PackageId { get; set; }
    public DateOnly? Date { get; set; }
    [MaxLength(50)] public string? Shift { get; set; }
    [MaxLength(50)] public string? Weather { get; set; }
    public int? Workers { get; set; }
    public string? Machines { get; set; }
    public string? Works { get; set; }
    public string? Issues { get; set; }
    [MaxLength(200)] public string? Supervisor { get; set; }
    [MaxLength(200)] public string? ByName { get; set; }
    public List<Photo> Photos { get; set; } = new();
}

[Table("BoqItems")]
public class BoqItem : EntityBase, IHasContract
{
    [MaxLength(64)] public string? ContractId { get; set; }
    [MaxLength(50)] public string? Code { get; set; }
    [MaxLength(500)] public string Name { get; set; } = "";
    [MaxLength(30)] public string? Unit { get; set; }
    public double? Qty { get; set; }
    [Column(TypeName = "decimal(20,0)")] public decimal? Price { get; set; }
}

[Table("VolumeEntries")]
public class VolumeEntry : EntityBase, IHasContract
{
    [MaxLength(64)] public string? BoqId { get; set; }
    [MaxLength(64)] public string? ContractId { get; set; }
    public DateOnly? Date { get; set; }
    [MaxLength(100)] public string? Period { get; set; }
    public double? DoneQty { get; set; }
    public double? AcceptedQty { get; set; }
    public string? Note { get; set; }
}

[Table("PaymentPlans")]
public class PayPlan : EntityBase, IHasContract
{
    [MaxLength(64)] public string? ContractId { get; set; }
    [MaxLength(100)] public string? Phase { get; set; }
    public DateOnly? PlanDate { get; set; }
    [Column(TypeName = "decimal(20,0)")] public decimal? Amount { get; set; }
    public string? Note { get; set; }
}

[Table("Payments")]
public class Payment : EntityBase, IHasContract
{
    [MaxLength(64)] public string? ContractId { get; set; }
    [MaxLength(100)] public string? Number { get; set; }
    public DateOnly? Date { get; set; }
    [MaxLength(100)] public string? Kind { get; set; }
    [Column(TypeName = "decimal(20,0)")] public decimal? Amount { get; set; }
    [MaxLength(50)] public string? Status { get; set; }
    public string? Content { get; set; }
    public DateOnly? PaidDate { get; set; }
    [MaxLength(300)] public string? FileName { get; set; }
    public long? FileSize { get; set; }
    [MaxLength(64)] public string? AssetId { get; set; }
    [MaxLength(300)] public string? Url { get; set; }
}

[Table("Users")]
public class AppUser : EntityBase
{
    [MaxLength(64)] public string Username { get; set; } = "";
    [MaxLength(200)] public string Name { get; set; } = "";
    [MaxLength(200)] public string? Unit { get; set; }
    [MaxLength(64)] public string? GroupId { get; set; }
    [MaxLength(200)] public string? Email { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    public bool Active { get; set; } = true;
    public bool Sample { get; set; }
    [JsonIgnore] public string PasswordHash { get; set; } = "";
    [JsonIgnore] public int FailedCount { get; set; }
    [JsonIgnore] public DateTime? LockoutUntil { get; set; }
    /// <summary>Khóa bí mật TOTP (đã mã hóa bằng Data Protection); null = chưa bật xác thực 2 lớp.</summary>
    [JsonIgnore, MaxLength(1000)] public string? TotpSecret { get; set; }
    /// <summary>Chu kỳ 30 giây của mã đã dùng gần nhất, chặn dùng lại một mã.</summary>
    [JsonIgnore] public long TotpLastStep { get; set; }
    /// <summary>Mã khôi phục dạng băm, cách nhau bởi dấu ;</summary>
    [JsonIgnore, MaxLength(1000)] public string? RecoveryCodes { get; set; }
    [NotMapped] public bool TwoFactor => TotpSecret is not null;
    public DateTime? CreatedAt { get; set; }
    public DateTime? LastLogin { get; set; }
}

[Table("UserGroups")]
public class UserGroup : EntityBase
{
    [MaxLength(200)] public string Name { get; set; } = "";
    public string? Desc { get; set; }
    public bool Admin { get; set; }
    public Dictionary<string, string> Perms { get; set; } = new();
    public List<string> Scope { get; set; } = new();
}

[Table("Catalogs")]
public class Catalog : EntityBase
{
    [MaxLength(200)] public string Type { get; set; } = "";
    [MaxLength(300)] public string Value { get; set; } = "";
    public int Order { get; set; }
}

[Table("AuditLogs")]
public class AuditLog : EntityBase
{
    public DateTime Ts { get; set; }
    [MaxLength(64)] public string? UserId { get; set; }
    [MaxLength(64)] public string? Username { get; set; }
    [MaxLength(200)] public string? Fullname { get; set; }
    [MaxLength(100)] public string? Action { get; set; }
    [MaxLength(100)] public string? Module { get; set; }
    [MaxLength(500)] public string? Target { get; set; }
    [MaxLength(64)] public string? Ip { get; set; }
}

[Table("StoredFiles")]
public class StoredFile
{
    [Key, MaxLength(64)] public string Id { get; set; } = "";
    [MaxLength(300)] public string FileName { get; set; } = "";
    [MaxLength(200)] public string ContentType { get; set; } = "application/octet-stream";
    public long Size { get; set; }
    [MaxLength(300)] public string RelPath { get; set; } = "";
    [MaxLength(64)] public string? UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; }
}

/// <summary>Tệp đính kèm của một bản ghi nghiệp vụ (dùng chung cho mọi màn hình). Xóa = chuyển vào thùng rác 30 ngày.</summary>
[Table("Attachments")]
public class Attachment
{
    [Key, MaxLength(64)] public string Id { get; set; } = "";
    [MaxLength(40)] public string Collection { get; set; } = "";
    [MaxLength(64)] public string RecordId { get; set; } = "";
    [MaxLength(64)] public string? ProjectId { get; set; }
    /// <summary>Loại tài liệu (vd: Hợp đồng đã ký, Biên bản nghiệm thu).</summary>
    [MaxLength(200)] public string? Kind { get; set; }
    /// <summary>Tham chiếu phụ trong bản ghi (vd: đợt nghiệm thu, ngày cập nhật tiến độ).</summary>
    [MaxLength(100)] public string? Ref { get; set; }
    [MaxLength(64)] public string FileId { get; set; } = "";
    [MaxLength(300)] public string FileName { get; set; } = "";
    [MaxLength(200)] public string ContentType { get; set; } = "application/octet-stream";
    public long Size { get; set; }
    [MaxLength(200)] public string? UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    [MaxLength(200)] public string? DeletedBy { get; set; }
}

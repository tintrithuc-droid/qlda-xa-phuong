using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace QldaTtts.Web.Data;

/// <summary>
/// Cơ sở dữ liệu nền tảng (chế độ cho thuê nhiều xã/phường): danh sách đơn vị thuê, tài khoản quản trị nền tảng, nhật ký nền tảng.
/// Không chứa dữ liệu nghiệp vụ; dữ liệu của mỗi xã nằm trong cơ sở dữ liệu riêng của xã đó.
/// </summary>
public class PlatformDbContext : DbContext
{
    public PlatformDbContext(DbContextOptions<PlatformDbContext> options) : base(options) { }
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<PlatformAdmin> Admins => Set<PlatformAdmin>();
    public DbSet<PlatformLog> Logs => Set<PlatformLog>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Tenant>().ToTable("tenants");
        b.Entity<PlatformAdmin>().ToTable("admins").HasIndex(x => x.Username).IsUnique();
        b.Entity<PlatformLog>().ToTable("logs").HasIndex(x => x.Ts);
    }
}

public static class TenantStatus
{
    public const string Creating = "dang-tao", Active = "hoat-dong", Locked = "tam-khoa";
    public static string Label(string s) => s switch { Active => "Đang hoạt động", Locked => "Tạm khóa", Creating => "Đang tạo", _ => s };
}

/// <summary>Một đơn vị thuê (xã/phường).</summary>
public class Tenant
{
    /// <summary>Mã xã: chữ thường không dấu, số, gạch ngang; dùng làm tên miền con và tên cơ sở dữ liệu.</summary>
    [Key, MaxLength(40)] public string Code { get; set; } = "";
    [MaxLength(200)] public string Name { get; set; } = "";
    /// <summary>Tên miền riêng của xã (nếu có), cách nhau bởi dấu phẩy. Tên miền con mặc định &lt;mã&gt;.&lt;tên miền gốc&gt; luôn dùng được.</summary>
    [MaxLength(500)] public string? Hosts { get; set; }
    [MaxLength(20)] public string Status { get; set; } = TenantStatus.Creating;
    /// <summary>Lý do tạm khóa, hiển thị cho người dùng của xã.</summary>
    [MaxLength(300)] public string? LockReason { get; set; }
    /// <summary>Hạn thuê (ngày cuối cùng được dùng); null = không giới hạn.</summary>
    public DateTime? ExpiresAt { get; set; }
    [MaxLength(80)] public string DbName { get; set; } = "";
    [MaxLength(80)] public string DbUser { get; set; } = "";
    /// <summary>Mật khẩu tài khoản cơ sở dữ liệu riêng của xã, đã mã hóa.</summary>
    public string DbSecret { get; set; } = "";
    /// <summary>Băm của mã khởi tạo (dùng một lần để xã tạo tài khoản quản trị đầu tiên).</summary>
    [MaxLength(100)] public string? SetupTokenHash { get; set; }
    public DateTime? SetupTokenExpires { get; set; }
    [MaxLength(300)] public string? Contact { get; set; }
    public string? Note { get; set; }
    [MaxLength(40)] public string? AppVersion { get; set; }
    public string? LastError { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    [MaxLength(64)] public string? UpdatedBy { get; set; }

    public bool Expired(DateTime nowLocal) => ExpiresAt is { } e && nowLocal.Date > e.Date;
    public IEnumerable<string> CustomHosts() =>
        (Hosts ?? "").Split(new[] { ',', ';', ' ', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Select(h => h.ToLowerInvariant());
}

/// <summary>Tài khoản quản trị nền tảng của công ty (không phải tài khoản của xã; không xem được dữ liệu nghiệp vụ của xã).</summary>
public class PlatformAdmin
{
    [Key, MaxLength(64)] public string Id { get; set; } = "";
    [MaxLength(32)] public string Username { get; set; } = "";
    [MaxLength(200)] public string Name { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string? TotpSecret { get; set; }
    public long TotpLastStep { get; set; }
    public int FailedCount { get; set; }
    public DateTime? LockoutUntil { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLogin { get; set; }
}

public class PlatformLog
{
    [Key] public long Id { get; set; }
    public DateTime Ts { get; set; }
    [MaxLength(64)] public string? Username { get; set; }
    [MaxLength(300)] public string Action { get; set; } = "";
    [MaxLength(500)] public string? Target { get; set; }
    [MaxLength(64)] public string? Ip { get; set; }
}

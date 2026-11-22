using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Design;

namespace QldaTtts.Web.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    /// <summary>Cho lớp con theo từng loại CSDL (mỗi loại một bộ migration riêng).</summary>
    protected AppDbContext(DbContextOptions options) : base(options) { }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectTask> Tasks => Set<ProjectTask>();
    public DbSet<LegalDocument> LegalDocuments => Set<LegalDocument>();
    public DbSet<ConstructionItem> Items => Set<ConstructionItem>();
    public DbSet<ModelFile> ModelFiles => Set<ModelFile>();
    public DbSet<Package> Packages => Set<Package>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<Addendum> Addenda => Set<Addendum>();
    public DbSet<ScheduleItem> Schedule => Set<ScheduleItem>();
    public DbSet<Diary> Diaries => Set<Diary>();
    public DbSet<BoqItem> Boq => Set<BoqItem>();
    public DbSet<VolumeEntry> Volumes => Set<VolumeEntry>();
    public DbSet<VolumeBatch> VolumeBatches => Set<VolumeBatch>();
    public DbSet<PayPlan> PayPlans => Set<PayPlan>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<CapitalPlan> CapitalPlans => Set<CapitalPlan>();
    public DbSet<Acceptance> Acceptances => Set<Acceptance>();
    public DbSet<Settlement> Settlements => Set<Settlement>();
    public DbSet<Clearance> Clearances => Set<Clearance>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<UserGroup> Groups => Set<UserGroup>();
    public DbSet<Catalog> Catalogs => Set<Catalog>();
    public DbSet<AuditLog> Logs => Set<AuditLog>();
    public DbSet<StoredFile> Files => Set<StoredFile>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<Guide> Guides => Set<Guide>();
    public DbSet<AppSetting> Settings => Set<AppSetting>();
    public DbSet<ApprovalLog> ApprovalLogs => Set<ApprovalLog>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Request> Requests => Set<Request>();
    public DbSet<Meeting> Meetings => Set<Meeting>();
    public DbSet<Notice> Notices => Set<Notice>();
    public DbSet<NoticeRead> NoticeReads => Set<NoticeRead>();
    public DbSet<KpiSheet> KpiSheets => Set<KpiSheet>();
    public DbSet<PayProfile> PayProfiles => Set<PayProfile>();
    public DbSet<Payslip> Payslips => Set<Payslip>();
    public DbSet<EmployeeRecord> EmployeeRecords => Set<EmployeeRecord>();
    public DbSet<EworkRow> EworkArchive => Set<EworkRow>();

    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    private static void JsonColumn<TEntity, TProp>(ModelBuilder b, System.Linq.Expressions.Expression<Func<TEntity, TProp>> prop)
        where TEntity : class where TProp : class, new()
    {
        b.Entity<TEntity>().Property(prop)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonOpts),
                s => string.IsNullOrEmpty(s) ? new TProp() : (JsonSerializer.Deserialize<TProp>(s, JsonOpts) ?? new TProp()))
            .Metadata.SetValueComparer(new ValueComparer<TProp>(
                (a, c) => JsonSerializer.Serialize(a, JsonOpts) == JsonSerializer.Serialize(c, JsonOpts),
                v => JsonSerializer.Serialize(v, JsonOpts).GetHashCode(),
                v => JsonSerializer.Deserialize<TProp>(JsonSerializer.Serialize(v, JsonOpts), JsonOpts)!));
    }

    protected override void OnModelCreating(ModelBuilder b)
    {
        JsonColumn<ScheduleItem, List<ProgressPoint>>(b, x => x.History);
        JsonColumn<Diary, List<Photo>>(b, x => x.Photos);
        JsonColumn<UserGroup, Dictionary<string, string>>(b, x => x.Perms);
        JsonColumn<UserGroup, List<string>>(b, x => x.Scope);
        JsonColumn<Project, List<string>>(b, x => x.ViewerIds);
        JsonColumn<Guide, List<string>>(b, x => x.Groups);
        JsonColumn<Package, List<string>>(b, x => x.ContractorIds);
        JsonColumn<Package, Dictionary<string, decimal>>(b, x => x.ContractorShares);
        JsonColumn<Package, List<string>>(b, x => x.SupervisorIds);

        b.Entity<AppUser>().HasIndex(x => x.Username).IsUnique();
        b.Entity<Project>().HasIndex(x => x.Code);
        b.Entity<Package>().HasIndex(x => x.ProjectId);
        b.Entity<Contract>().HasIndex(x => x.PackageId);
        b.Entity<ScheduleItem>().HasIndex(x => x.PackageId);
        b.Entity<Diary>().HasIndex(x => new { x.PackageId, x.Date });
        b.Entity<BoqItem>().HasIndex(x => x.ContractId);
        b.Entity<VolumeEntry>().HasIndex(x => x.BoqId);
        b.Entity<VolumeEntry>().HasIndex(x => x.BatchId);
        b.Entity<VolumeBatch>().HasIndex(x => x.ContractId);
        b.Entity<Payment>().HasIndex(x => x.ContractId);
        b.Entity<CapitalPlan>().HasIndex(x => new { x.ProjectId, x.Year });
        b.Entity<Acceptance>().HasIndex(x => x.ProjectId);
        b.Entity<Settlement>().HasIndex(x => x.ProjectId);
        b.Entity<Clearance>().HasIndex(x => x.ProjectId);
        b.Entity<AuditLog>().HasIndex(x => x.Ts);
        b.Entity<AuditLog>().HasIndex(x => new { x.Collection, x.RecordId });
        b.Entity<Catalog>().HasIndex(x => x.Type);
        b.Entity<Attachment>().HasIndex(x => new { x.Collection, x.RecordId });
        b.Entity<Attachment>().HasIndex(x => x.FileId);
        b.Entity<ApprovalLog>().HasIndex(x => new { x.Collection, x.RecordId });
        b.Entity<Employee>().HasIndex(x => x.UserId);
        b.Entity<Attendance>().HasIndex(x => new { x.EmployeeId, x.Date }).IsUnique();
        b.Entity<Attendance>().HasIndex(x => x.Date);
        b.Entity<Request>().HasIndex(x => x.EmployeeId);
        b.Entity<Request>().HasIndex(x => x.Status);
        b.Entity<Meeting>().HasIndex(x => x.StartAt);
        b.Entity<Notice>().HasIndex(x => x.PublishedAt);
        b.Entity<NoticeRead>().HasIndex(x => new { x.NoticeId, x.UserId }).IsUnique();
        b.Entity<KpiSheet>().HasIndex(x => new { x.Month, x.EmployeeId }).IsUnique();
        b.Entity<PayProfile>().HasIndex(x => x.EmployeeId).IsUnique();
        b.Entity<Payslip>().HasIndex(x => new { x.Month, x.EmployeeId }).IsUnique();
        b.Entity<EmployeeRecord>().HasIndex(x => x.EmployeeId);
        b.Entity<EworkRow>().HasIndex(x => new { x.TableName, x.RowKey });
        b.Entity<EworkRow>().HasIndex(x => x.EworkUserId);
    }
}

/// <summary>
/// Ngữ cảnh dùng khi chạy PostgreSQL: cùng mô hình dữ liệu, bộ migration riêng ở Data/MigrationsPg
/// (dotnet ef migrations add &lt;Ten&gt; --context PgDbContext -o Data/MigrationsPg).
/// </summary>
public class PgDbContext : AppDbContext
{
    // DateTime lưu dạng timestamp không múi giờ, giống SQL Server/SQLite (áp dụng cả khi chạy lẫn khi sinh migration)
    static PgDbContext() => AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
    public PgDbContext(DbContextOptions<PgDbContext> options) : base(options) { }
}

/// <summary>Dùng cho lệnh "dotnet ef migrations" với PostgreSQL (không cần CSDL thật để sinh migration).</summary>
public class PgDesignTimeFactory : IDesignTimeDbContextFactory<PgDbContext>
{
    public PgDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<PgDbContext>().UseNpgsql("Host=localhost;Database=qlda;Username=qlda;Password=x").Options);
}

/// <summary>Dùng cho lệnh "dotnet ef migrations" (sinh migration cho SQL Server).</summary>
public class DesignTimeFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=.;Database=QLDA_TTTS;Trusted_Connection=True;TrustServerCertificate=True").Options);
}

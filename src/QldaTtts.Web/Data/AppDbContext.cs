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
    public DbSet<PayPlan> PayPlans => Set<PayPlan>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<UserGroup> Groups => Set<UserGroup>();
    public DbSet<Catalog> Catalogs => Set<Catalog>();
    public DbSet<AuditLog> Logs => Set<AuditLog>();
    public DbSet<StoredFile> Files => Set<StoredFile>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<Guide> Guides => Set<Guide>();
    public DbSet<AppSetting> Settings => Set<AppSetting>();

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
        JsonColumn<Guide, List<string>>(b, x => x.Groups);

        b.Entity<AppUser>().HasIndex(x => x.Username).IsUnique();
        b.Entity<Project>().HasIndex(x => x.Code);
        b.Entity<Package>().HasIndex(x => x.ProjectId);
        b.Entity<Contract>().HasIndex(x => x.PackageId);
        b.Entity<ScheduleItem>().HasIndex(x => x.PackageId);
        b.Entity<Diary>().HasIndex(x => new { x.PackageId, x.Date });
        b.Entity<BoqItem>().HasIndex(x => x.ContractId);
        b.Entity<VolumeEntry>().HasIndex(x => x.BoqId);
        b.Entity<Payment>().HasIndex(x => x.ContractId);
        b.Entity<AuditLog>().HasIndex(x => x.Ts);
        b.Entity<Catalog>().HasIndex(x => x.Type);
        b.Entity<Attachment>().HasIndex(x => new { x.Collection, x.RecordId });
        b.Entity<Attachment>().HasIndex(x => x.FileId);
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

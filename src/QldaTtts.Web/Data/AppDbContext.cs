using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Design;

namespace QldaTtts.Web.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

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
    }
}

/// <summary>Dùng cho lệnh "dotnet ef migrations" (sinh migration cho SQL Server).</summary>
public class DesignTimeFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=.;Database=QLDA_TTTS;Trusted_Connection=True;TrustServerCertificate=True").Options);
}

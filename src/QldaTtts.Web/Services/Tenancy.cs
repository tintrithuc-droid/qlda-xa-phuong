using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.WebUtilities;
using Npgsql;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Cấu hình chế độ cho thuê nhiều xã/phường (mục "Tenancy" trong cấu hình).
/// Tắt (mặc định): phần mềm chạy cho một đơn vị như các bản trước.
/// </summary>
public class TenancyOptions
{
    public bool Enabled { get; set; }
    /// <summary>Tên miền gốc, ví dụ trithucsoft.vn: mỗi xã dùng &lt;mã-xã&gt;.trithucsoft.vn (các tên con của công ty như www, mail nằm trong danh sách dành riêng).</summary>
    public string BaseDomain { get; set; } = "trithucsoft.vn";
    /// <summary>Tên miền trang quản lý thuê bao; mặc định quantri.&lt;tên miền gốc&gt;.</summary>
    public string? PortalHost { get; set; }
    /// <summary>Thư mục gốc chứa kho tệp, bản sao lưu của từng xã (mỗi xã một thư mục con theo mã).</summary>
    public string DataRoot { get; set; } = "App_Data/xa";
    /// <summary>Số kết nối cơ sở dữ liệu tối đa của mỗi xã.</summary>
    public int MaxPoolSize { get; set; } = 20;

    public string Portal => (PortalHost is { Length: > 0 } p ? p : "quantri." + BaseDomain).ToLowerInvariant();
    public string HostOf(string code) => $"{code}.{BaseDomain}".ToLowerInvariant();

    /// <summary>Mã không được dùng cho xã (trùng tên miền dịch vụ).</summary>
    public static readonly HashSet<string> Reserved = new() { "quantri", "admin", "www", "api", "mail", "nentang", "portal", "static", "cdn", "demo-trithuc",
        "webmail", "smtp", "imap", "pop", "ftp", "cpanel", "ns1", "ns2", "blog", "shop", "app", "demo", "test", "dev", "staging", "support", "hotro" };
    public static bool ValidCode(string? c) => c is not null && System.Text.RegularExpressions.Regex.IsMatch(c, "^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$") && !c.Contains("--") && !Reserved.Contains(c);
    public const string CodeMessage = "Mã xã 3–40 ký tự, chỉ gồm chữ thường không dấu, số và gạch ngang (không đứng đầu/cuối), ví dụ tan-hoa.";
}

/// <summary>Đơn vị (xã/phường) mà lượt truy cập hoặc tác vụ nền hiện tại đang phục vụ.</summary>
public class TenantContext
{
    private readonly IConfiguration _cfg;
    private readonly IWebHostEnvironment _env;
    private readonly TenancyOptions _opt;
    private readonly TenantRegistry? _reg;
    public TenantContext(IConfiguration cfg, IWebHostEnvironment env, TenancyOptions opt, IServiceProvider sp)
    {
        _cfg = cfg; _env = env; _opt = opt; _reg = opt.Enabled ? sp.GetRequiredService<TenantRegistry>() : null;
    }

    public bool Multi => _opt.Enabled;
    public Tenant? Current { get; private set; }
    /// <summary>Lượt truy cập trang quản lý thuê bao (không gắn với xã nào).</summary>
    public bool Portal { get; set; }
    public string? Code => Current?.Code;

    public void Use(Tenant t) => Current = t;

    /// <summary>Chuỗi kết nối tới cơ sở dữ liệu của xã hiện tại.</summary>
    public string ConnectionString => Current is null
        ? throw new InvalidOperationException("Chưa xác định xã/phường cho lượt truy cập này.")
        : _reg!.ConnectionString(Current);

    /// <summary>Thư mục dữ liệu riêng của xã (kho tệp, sao lưu); null ở chế độ một đơn vị.</summary>
    public string? Dir => Current is null ? null : Path.Combine(_reg!.DataRoot, Current.Code);

    public string FilesPath => Dir is { } d ? Path.Combine(d, "files")
        : _cfg["Storage:FilesPath"] is { Length: > 0 } p ? p : Path.Combine(_env.ContentRootPath, "App_Data", "files");
    public string BackupPath => Dir is { } d ? Path.Combine(d, "backups")
        : _cfg["Storage:BackupPath"] is { Length: > 0 } p ? p : Path.Combine(_env.ContentRootPath, "App_Data", "backups");

    /// <summary>Mục đích bảo vệ dữ liệu theo xã: phiên đăng nhập, khóa xác thực 2 lớp của xã này không giải mã được ở xã khác.</summary>
    public string[] Purpose(string name) => Multi ? new[] { name, "xa:" + (Portal ? "__nentang" : Code ?? "-") } : new[] { name };
}

/// <summary>Danh sách xã (đọc từ cơ sở dữ liệu nền tảng, giữ trong bộ nhớ), trạng thái sẵn sàng của từng xã, chuỗi kết nối.</summary>
public class TenantRegistry
{
    public enum State { Pending, Upgrading, Ready, Failed }
    private readonly IDbContextFactory<PlatformDbContext> _pf;
    private readonly IDataProtector _secret;
    private readonly TenancyOptions _opt;
    private readonly NpgsqlConnectionStringBuilder _admin;
    private readonly ConcurrentDictionary<string, (State state, string? error)> _states = new();
    private volatile Dictionary<string, Tenant> _byHost = new(), _byCode = new();
    private DateTime _loadedAt = DateTime.MinValue;
    private readonly SemaphoreSlim _lock = new(1, 1);
    public string DataRoot { get; }

    public TenantRegistry(IDbContextFactory<PlatformDbContext> pf, IDataProtectionProvider dp, TenancyOptions opt, IConfiguration cfg, IWebHostEnvironment env)
    {
        _pf = pf; _opt = opt;
        _secret = dp.CreateProtector("QldaTtts.Tenancy.DbSecret");
        _admin = new NpgsqlConnectionStringBuilder(cfg.GetConnectionString("PostgreSQL"));
        DataRoot = Path.GetFullPath(Path.IsPathRooted(opt.DataRoot) ? opt.DataRoot : Path.Combine(env.ContentRootPath, opt.DataRoot));
    }

    /// <summary>Kết nối quản trị PostgreSQL (tạo cơ sở dữ liệu, tài khoản cho xã mới).</summary>
    public string AdminConnection(string? database = null)
    {
        var b = new NpgsqlConnectionStringBuilder(_admin.ConnectionString);
        if (database is not null) b.Database = database;
        return b.ConnectionString;
    }

    public string Protect(string s) => _secret.Protect(s);

    public string ConnectionString(Tenant t)
    {
        var b = new NpgsqlConnectionStringBuilder
        {
            Host = _admin.Host, Port = _admin.Port, Database = t.DbName, Username = t.DbUser, Password = _secret.Unprotect(t.DbSecret),
            MaxPoolSize = _opt.MaxPoolSize, MinPoolSize = 0, ConnectionIdleLifetime = 60, SslMode = _admin.SslMode, Timeout = 15
        };
        return b.ConnectionString;
    }

    public async Task ReloadAsync(CancellationToken ct = default)
    {
        await using var db = await _pf.CreateDbContextAsync(ct);
        var all = await db.Tenants.AsNoTracking().ToListAsync(ct);
        var byHost = new Dictionary<string, Tenant>();
        foreach (var t in all)
        {
            byHost[_opt.HostOf(t.Code)] = t;
            foreach (var h in t.CustomHosts()) byHost.TryAdd(h, t);
        }
        _byHost = byHost; _byCode = all.ToDictionary(t => t.Code);
        _loadedAt = DateTime.UtcNow;
    }

    /// <summary>Đọc lại danh sách sau mỗi 30 giây, hoặc ngay khi trang quản lý thay đổi.</summary>
    private async Task Fresh()
    {
        if (DateTime.UtcNow - _loadedAt < TimeSpan.FromSeconds(30)) return;
        await _lock.WaitAsync();
        try { if (DateTime.UtcNow - _loadedAt >= TimeSpan.FromSeconds(30)) await ReloadAsync(); }
        finally { _lock.Release(); }
    }

    public async Task<Tenant?> FindByHost(string host) { await Fresh(); return _byHost.GetValueOrDefault(host.ToLowerInvariant()); }
    public async Task<Tenant?> Find(string code) { await Fresh(); return _byCode.GetValueOrDefault(code); }
    public async Task<List<Tenant>> All() { await Fresh(); return _byCode.Values.OrderBy(t => t.Code).ToList(); }
    public async Task<bool> KnownHost(string host) { await Fresh(); var h = host.ToLowerInvariant(); return h == _opt.Portal || _byHost.ContainsKey(h); }
    public void Invalidate() => _loadedAt = DateTime.MinValue;

    public (State state, string? error) StateOf(string code) => _states.GetValueOrDefault(code, (State.Pending, null));
    public void SetState(string code, State s, string? error = null) => _states[code] = (s, error);
}

/// <summary>Mã hóa phiếu đăng nhập (cookie) bằng khóa riêng của từng xã: phiếu của xã này không dùng được ở xã khác.</summary>
public class TenantTicketFormat : ISecureDataFormat<AuthenticationTicket>
{
    private readonly IHttpContextAccessor _http;
    private readonly IDataProtectionProvider _dp;
    public TenantTicketFormat(IHttpContextAccessor http, IDataProtectionProvider dp) { _http = http; _dp = dp; }

    private IDataProtector Protector()
    {
        var tc = _http.HttpContext?.RequestServices.GetRequiredService<TenantContext>()
            ?? throw new InvalidOperationException("Không có lượt truy cập.");
        return _dp.CreateProtector(tc.Purpose("QldaTtts.Auth.Cookie"));
    }

    public string Protect(AuthenticationTicket data) => Protect(data, null);
    public string Protect(AuthenticationTicket data, string? purpose) =>
        WebEncoders.Base64UrlEncode(Protector().Protect(TicketSerializer.Default.Serialize(data)));
    public AuthenticationTicket? Unprotect(string? protectedText) => Unprotect(protectedText, null);
    public AuthenticationTicket? Unprotect(string? protectedText, string? purpose)
    {
        if (string.IsNullOrEmpty(protectedText)) return null;
        try { return TicketSerializer.Default.Deserialize(Protector().Unprotect(WebEncoders.Base64UrlDecode(protectedText))); }
        catch (Exception ex) when (ex is CryptographicException or FormatException or ArgumentException) { return null; }
    }
}

/// <summary>
/// Mã khởi tạo: khi được đặt, trang "Khởi tạo hệ thống" chỉ chạy khi nhập đúng mã (ngăn người lạ chiếm quyền quản trị của bản cài mới).
/// Chế độ cho thuê: mỗi xã một mã do trang quản lý thuê bao cấp, dùng một lần. Chế độ một đơn vị: tùy chọn Setup:Token.
/// </summary>
public class SetupGuard
{
    private readonly TenantContext _tc;
    private readonly IConfiguration _cfg;
    private readonly IServiceProvider _sp;
    public SetupGuard(TenantContext tc, IConfiguration cfg, IServiceProvider sp) { _tc = tc; _cfg = cfg; _sp = sp; }

    public bool Required => _tc.Multi || _cfg["Setup:Token"] is { Length: > 0 };

    public static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Normalize(token))));
    public static string Normalize(string? t) => new((t ?? "").ToUpperInvariant().Where(char.IsAsciiLetterOrDigit).ToArray());

    /// <summary>Mã ngẫu nhiên 12 ký tự dễ đọc, dạng XXXX-XXXX-XXXX.</summary>
    public static string NewToken()
    {
        const string a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var s = new string(RandomNumberGenerator.GetBytes(12).Select(b => a[b % a.Length]).ToArray());
        return $"{s[..4]}-{s[4..8]}-{s[8..]}";
    }

    public async Task<string?> Check(string? token)
    {
        if (!Required) return null;
        if (string.IsNullOrWhiteSpace(token)) return "Vui lòng nhập mã khởi tạo do đơn vị cung cấp dịch vụ gửi.";
        if (!_tc.Multi)
            return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(Hash(token)), Encoding.UTF8.GetBytes(Hash(_cfg["Setup:Token"]!))) ? null : "Mã khởi tạo không đúng.";
        await using var db = await _sp.GetRequiredService<IDbContextFactory<PlatformDbContext>>().CreateDbContextAsync();
        var t = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(x => x.Code == _tc.Code);
        if (t?.SetupTokenHash is null) return "Đơn vị chưa được cấp mã khởi tạo. Liên hệ đơn vị cung cấp dịch vụ.";
        if (t.SetupTokenExpires is { } e && e < DateTime.UtcNow) return "Mã khởi tạo đã hết hạn. Liên hệ đơn vị cung cấp dịch vụ để cấp mã mới.";
        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(Hash(token)), Encoding.UTF8.GetBytes(t.SetupTokenHash)) ? null : "Mã khởi tạo không đúng.";
    }

    /// <summary>Hủy mã sau khi đã khởi tạo xong.</summary>
    public async Task Consume()
    {
        if (!_tc.Multi) return;
        await using var db = await _sp.GetRequiredService<IDbContextFactory<PlatformDbContext>>().CreateDbContextAsync();
        var t = await db.Tenants.FirstOrDefaultAsync(x => x.Code == _tc.Code);
        if (t is null) return;
        t.SetupTokenHash = null; t.SetupTokenExpires = null; t.UpdatedAt = DateTime.UtcNow; t.UpdatedBy = "xa:" + t.Code;
        db.Logs.Add(new PlatformLog { Ts = DateTime.UtcNow, Username = "xa:" + t.Code, Action = "Xã đã khởi tạo tài khoản quản trị", Target = t.Code });
        await db.SaveChangesAsync();
    }
}

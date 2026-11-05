using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting.WindowsServices;
using QldaTtts.Web.Controllers;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

// Chạy như dịch vụ Windows (gói cài Windows): thư mục gốc là thư mục chứa QldaTtts.Web.exe; chạy thường/Linux không ảnh hưởng
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = WindowsServiceHelpers.IsWindowsService() ? AppContext.BaseDirectory : null
});
builder.Services.AddWindowsService(o => o.ServiceName = "QLDA");
var cfg = builder.Configuration;

// Chế độ cho thuê nhiều xã/phường (Tenancy:Enabled): mỗi xã một CSDL PostgreSQL riêng, chọn theo tên miền truy cập
var tenancy = cfg.GetSection("Tenancy").Get<TenancyOptions>() ?? new TenancyOptions();
builder.Services.AddSingleton(tenancy);
builder.Services.AddScoped<TenantContext>();
builder.Services.AddScoped<SetupGuard>();

// Cơ sở dữ liệu: PostgreSQL (máy chủ Linux/Docker, chi phí thấp), SQL Server (máy chủ Windows) hoặc SQLite (bản demo, đơn vị rất nhỏ)
var provider = tenancy.Enabled ? "PostgreSQL" : cfg["Database:Provider"] ?? "SqlServer";
if (tenancy.Enabled)
{
    AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
    // CSDL nền tảng: danh sách xã, quản trị nền tảng (chuỗi kết nối PostgreSQL trong cấu hình, tài khoản có quyền tạo CSDL)
    builder.Services.AddDbContextFactory<PlatformDbContext>(o => o.UseNpgsql(cfg.GetConnectionString("PostgreSQL")));
    builder.Services.AddSingleton<TenantRegistry>();
    builder.Services.AddSingleton<TenantOps>();
    builder.Services.AddHostedService<TenantStartup>();
    // CSDL nghiệp vụ: của xã đang được truy cập (TenantContext do TenantMiddleware hoặc tác vụ nền đặt)
    builder.Services.AddDbContext<AppDbContext, PgDbContext>((sp, o) =>
        o.UseNpgsql(sp.GetRequiredService<TenantContext>().ConnectionString, n => n.EnableRetryOnFailure()));
}
else if (provider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase) || provider.Equals("Postgres", StringComparison.OrdinalIgnoreCase))
{
    // Giữ cách lưu DateTime như SQL Server/SQLite (timestamp không múi giờ); đặt trước khi Npgsql nạp
    AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
    builder.Services.AddDbContext<AppDbContext, PgDbContext>(o =>
        o.UseNpgsql(cfg.GetConnectionString("PostgreSQL"), n => n.EnableRetryOnFailure()));
}
else
    builder.Services.AddDbContext<AppDbContext>(o =>
    {
        if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
            o.UseSqlite(cfg.GetConnectionString("Sqlite") ?? "Data Source=App_Data/qlda.db");
        else
            o.UseSqlServer(cfg.GetConnectionString("SqlServer"), s => s.EnableRetryOnFailure());
    });

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<UserContext>();
builder.Services.AddScoped<TwoFactor>();
builder.Services.AddScoped<FileStore>();
builder.Services.AddScoped<BackupService>();
builder.Services.AddHostedService<MaintenanceService>();
builder.Services.AddControllersWithViews().AddJsonOptions(o => JsonConfig.Apply(o.JsonSerializerOptions));

var keysDir = cfg["Storage:KeysPath"] is { Length: > 0 } kp ? kp : Path.Combine(builder.Environment.ContentRootPath, "App_Data", "keys");
Directory.CreateDirectory(keysDir);
builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(keysDir)).SetApplicationName("QldaTtts");

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(o =>
{
    o.Cookie.Name = "qlda.auth";
    o.Cookie.HttpOnly = true;
    o.Cookie.SameSite = SameSiteMode.Strict;
    o.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    o.ExpireTimeSpan = TimeSpan.FromHours(cfg.GetValue("Auth:SessionHours", 10));
    o.SlidingExpiration = true;
    o.Events.OnRedirectToLogin = c => { c.Response.StatusCode = 401; return Task.CompletedTask; };
    o.Events.OnRedirectToAccessDenied = c => { c.Response.StatusCode = 403; return Task.CompletedTask; };
});
// Chế độ cho thuê: phiếu đăng nhập mã hóa bằng khóa con riêng của từng xã
if (tenancy.Enabled)
    builder.Services.AddOptions<CookieAuthenticationOptions>(CookieAuthenticationDefaults.AuthenticationScheme)
        .Configure<IHttpContextAccessor, IDataProtectionProvider>((o, h, dp) => o.TicketDataFormat = new TenantTicketFormat(h, dp));
builder.Services.AddAuthorization();

builder.Services.Configure<FormOptions>(o => o.MultipartBodyLengthLimit = FilesController.MaxBytes + 1024 * 1024);
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = FilesController.MaxBytes + 1024 * 1024);

var app = builder.Build();

// Chế độ cho thuê: CSDL nền tảng, lệnh quản trị trên máy chủ; CSDL của từng xã do TenantStartup nâng cấp lần lượt
if (tenancy.Enabled)
{
    if (await PlatformCli.RunAsync(app, args)) return;
}
// Chế độ một đơn vị: khởi tạo/cập nhật lược đồ cơ sở dữ liệu
else using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Gỡ hẳn một xã khỏi máy chủ (go-cai-dat.ps1 -XoaDuLieu): QldaTtts.Web.exe --xoa-csdl
    if (args.Contains("--xoa-csdl"))
    {
        Console.WriteLine(db.Database.EnsureDeleted() ? "Đã xóa cơ sở dữ liệu." : "Không có cơ sở dữ liệu để xóa.");
        return;
    }
    if (db.Database.IsSqlServer() || db.Database.IsNpgsql()) db.Database.Migrate();
    else
    {
        Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "App_Data"));
        db.Database.EnsureCreated();
        // CSDL SQLite tạo từ bản trước: bổ sung cột mới (EnsureCreated không tự thêm cột)
        var conn = db.Database.GetDbConnection(); conn.Open();
        HashSet<string> Cols(string table)
        {
            var cols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            using var cmd = conn.CreateCommand(); cmd.CommandText = $"PRAGMA table_info({table})";
            using var rd = cmd.ExecuteReader(); while (rd.Read()) cols.Add(rd.GetString(1));
            return cols;
        }
        foreach (var (table, col, type) in new[] {
            ("Users", "TotpSecret", "TEXT NULL"), ("Users", "TotpLastStep", "INTEGER NOT NULL DEFAULT 0"), ("Users", "RecoveryCodes", "TEXT NULL"),
            ("LegalDocuments", "ValidUntil", "TEXT NULL"), ("Contracts", "GuaranteeUntil", "TEXT NULL"), ("Contracts", "AdvanceGuaranteeUntil", "TEXT NULL") })
            if (!Cols(table).Contains(col)) db.Database.ExecuteSqlRaw($"ALTER TABLE {table} ADD COLUMN {col} {type}");
        if (Cols("Attachments").Count == 0)
        {
            db.Database.ExecuteSqlRaw(@"CREATE TABLE Attachments (Id TEXT NOT NULL PRIMARY KEY, Collection TEXT NOT NULL, RecordId TEXT NOT NULL, ProjectId TEXT NULL,
                Kind TEXT NULL, Ref TEXT NULL, FileId TEXT NOT NULL, FileName TEXT NOT NULL, ContentType TEXT NOT NULL, Size INTEGER NOT NULL,
                UploadedBy TEXT NULL, UploadedAt TEXT NOT NULL, DeletedAt TEXT NULL, DeletedBy TEXT NULL)");
            db.Database.ExecuteSqlRaw("CREATE INDEX IX_Attachments_Collection_RecordId ON Attachments (Collection, RecordId)");
            db.Database.ExecuteSqlRaw("CREATE INDEX IX_Attachments_FileId ON Attachments (FileId)");
        }
        if (Cols("Guides").Count == 0)
            db.Database.ExecuteSqlRaw(@"CREATE TABLE Guides (Id TEXT NOT NULL PRIMARY KEY, Title TEXT NOT NULL, Category TEXT NULL, Content TEXT NULL,
                Groups TEXT NOT NULL, ""Order"" INTEGER NOT NULL, UpdatedAt TEXT NULL, UpdatedBy TEXT NULL)");
        if (Cols("Settings").Count == 0)
            db.Database.ExecuteSqlRaw("CREATE TABLE Settings (\"Key\" TEXT NOT NULL PRIMARY KEY, Value TEXT NULL, UpdatedAt TEXT NULL, UpdatedBy TEXT NULL)");
        // Bảng, cột mới của các phiên bản sau (1.1 trở đi): lấy từ mô hình dữ liệu, chỉ thêm phần còn thiếu
        var script = db.Database.GenerateCreateScript().Split(';', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        foreach (var et in db.Model.GetEntityTypes())
        {
            var table = et.GetTableName(); if (table is null) continue;
            var cols = Cols(table);
            if (cols.Count == 0)
            {
                foreach (var stmt in script.Where(x => x.Contains($"CREATE TABLE \"{table}\"") || x.Contains($"ON \"{table}\" (")))
                    db.Database.ExecuteSqlRaw(stmt);
                continue;
            }
            var so = Microsoft.EntityFrameworkCore.Metadata.StoreObjectIdentifier.Table(table, null);
            foreach (var prop in et.GetProperties())
            {
                var col = prop.GetColumnName(so);
                if (col is null || cols.Contains(col) || !prop.IsNullable) continue;
                db.Database.ExecuteSqlRaw($"ALTER TABLE \"{table}\" ADD COLUMN \"{col}\" {prop.GetColumnType()} NULL");
            }
        }
        conn.Close();
    }

    Upgrades.Run(db);
    GuideSeed.Run(db, scope.ServiceProvider.GetRequiredService<FileStore>(), Path.Combine(app.Environment.ContentRootPath, "hdsd"));

    // Lệnh khẩn cấp khi quản trị duy nhất mất điện thoại: QldaTtts.Web.exe --reset-2fa <tên đăng nhập>
    var i = Array.IndexOf(args, "--reset-2fa");
    if (i >= 0)
    {
        var un = i + 1 < args.Length ? args[i + 1].Trim().ToLowerInvariant() : "";
        var u = db.Users.FirstOrDefault(x => x.Username == un);
        if (u is null) { Console.Error.WriteLine($"Không tìm thấy tài khoản '{un}'."); Environment.Exit(1); }
        u.TotpSecret = null; u.RecoveryCodes = null; u.TotpLastStep = 0; u.FailedCount = 0; u.LockoutUntil = null; u.UpdatedAt = DateTime.UtcNow; u.UpdatedBy = "he-thong";
        db.Logs.Add(new AuditLog { Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = DateTime.UtcNow, Username = "he-thong", Action = "Đặt lại xác thực 2 lớp (dòng lệnh trên máy chủ)", Module = "Người dùng", Target = u.Username });
        db.SaveChanges();
        Console.WriteLine($"Đã đặt lại xác thực 2 lớp cho '{un}'. Lần đăng nhập sau sẽ thiết lập lại bằng ứng dụng xác thực.");
        return;
    }
}

// Chạy sau cổng vào (Caddy/Nginx): nhận đúng địa chỉ IP người dùng và giao thức HTTPS (cookie Secure)
if (cfg.GetValue("ReverseProxy:Enabled", false))
{
    var fo = new Microsoft.AspNetCore.Builder.ForwardedHeadersOptions { ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto };
    fo.KnownNetworks.Clear(); fo.KnownProxies.Clear(); // chỉ bật khi cổng phần mềm không mở trực tiếp ra ngoài
    app.UseForwardedHeaders(fo);
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(a => a.Run(async c =>
    {
        c.Response.StatusCode = 500; c.Response.ContentType = "application/json; charset=utf-8";
        await c.Response.WriteAsync("{\"code\":500,\"message\":\"Lỗi máy chủ. Vui lòng thử lại hoặc liên hệ quản trị hệ thống.\"}");
    }));
    if (cfg.GetValue("Https:Redirect", false)) { app.UseHsts(); app.UseHttpsRedirection(); }
}

app.Use(async (c, next) =>
{
    var h = c.Response.Headers;
    h["X-Content-Type-Options"] = "nosniff";
    h["X-Frame-Options"] = "SAMEORIGIN";
    h["Referrer-Policy"] = "same-origin";
    h["Permissions-Policy"] = "camera=(self), geolocation=(self), microphone=()";
    // Chống CSRF: mọi lệnh ghi qua API phải kèm header X-QLDA do giao diện gửi (trình duyệt không cho trang khác tự đặt header này)
    if (c.Request.Path.StartsWithSegments("/api") && !HttpMethods.IsGet(c.Request.Method) && !HttpMethods.IsHead(c.Request.Method)
        && c.Request.Headers["X-QLDA"] != "1")
    {
        c.Response.StatusCode = 400; c.Response.ContentType = "application/json; charset=utf-8";
        await c.Response.WriteAsync("{\"code\":400,\"message\":\"Yêu cầu không hợp lệ.\"}");
        return;
    }
    await next();
});

if (tenancy.Enabled) app.UseMiddleware<TenantMiddleware>();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", async (HttpContext c) =>
{
    // Trang quản lý thuê bao: kiểm tra CSDL nền tảng; trang của xã: kiểm tra CSDL của xã
    var tc = c.RequestServices.GetRequiredService<TenantContext>();
    bool ok;
    if (tc.Portal) { await using var p = await c.RequestServices.GetRequiredService<IDbContextFactory<PlatformDbContext>>().CreateDbContextAsync(); ok = await p.Database.CanConnectAsync(); }
    else ok = await c.RequestServices.GetRequiredService<AppDbContext>().Database.CanConnectAsync();
    return Results.Ok(new { status = "ok", db = ok ? "ok" : "error", xa = tc.Code, version = TenantOps.AppVersion, time = DateTime.UtcNow });
});
app.MapControllers();
app.MapFallback("/api/{**rest}", () => Results.NotFound(new { code = 404, message = "Không tìm thấy." }));

app.Run();

public partial class Program { }

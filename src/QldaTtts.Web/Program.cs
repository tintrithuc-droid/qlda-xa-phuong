using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Controllers;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

// Cơ sở dữ liệu: SQL Server (vận hành, theo BC KTKT) hoặc SQLite (phát triển/kiểm thử)
var provider = cfg["Database:Provider"] ?? "SqlServer";
builder.Services.AddDbContext<AppDbContext>(o =>
{
    if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
        o.UseSqlite(cfg.GetConnectionString("Sqlite") ?? "Data Source=App_Data/qlda.db");
    else
        o.UseSqlServer(cfg.GetConnectionString("SqlServer"), s => s.EnableRetryOnFailure());
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<UserContext>();
builder.Services.AddSingleton<TwoFactor>();
builder.Services.AddSingleton<FileStore>();
builder.Services.AddSingleton<BackupService>();
builder.Services.AddHostedService<MaintenanceService>();
builder.Services.AddControllersWithViews().AddJsonOptions(o => JsonConfig.Apply(o.JsonSerializerOptions));

var keysDir = Path.Combine(builder.Environment.ContentRootPath, "App_Data", "keys");
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
builder.Services.AddAuthorization();

builder.Services.Configure<FormOptions>(o => o.MultipartBodyLengthLimit = FilesController.MaxBytes + 1024 * 1024);
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = FilesController.MaxBytes + 1024 * 1024);

var app = builder.Build();

// Khởi tạo/cập nhật lược đồ cơ sở dữ liệu
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.IsSqlServer()) db.Database.Migrate();
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
        conn.Close();
    }

    Upgrades.Run(db);

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

app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", async (AppDbContext db) =>
    Results.Ok(new { status = "ok", db = await db.Database.CanConnectAsync() ? "ok" : "error", time = DateTime.UtcNow }));
app.MapControllers();
app.MapFallback("/api/{**rest}", () => Results.NotFound(new { code = 404, message = "Không tìm thấy." }));

app.Run();

public partial class Program { }

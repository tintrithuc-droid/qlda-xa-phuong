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

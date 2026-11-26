using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Khởi tạo CSDL nền tảng và các lệnh quản trị chạy trên máy chủ (chế độ cho thuê):
///   --tao-quan-tri-nen-tang &lt;tên đăng nhập&gt; ["Họ tên"]   tạo (hoặc đặt lại) tài khoản quản trị nền tảng, in mật khẩu tạm
///   --reset-2fa &lt;tên đăng nhập&gt; --xa &lt;mã xã&gt;             đặt lại xác thực 2 lớp cho một tài khoản của xã
///   --dat-lai-mat-khau &lt;tên đăng nhập&gt; --xa &lt;mã xã&gt;      đặt mật khẩu tạm cho một tài khoản của xã (xã chỉ có một quản trị, quên mật khẩu)
///   --danh-sach-xa                                         in danh sách xã (mã, CSDL, trạng thái) cho script sao lưu
/// </summary>
public static class PlatformCli
{
    public static readonly PasswordHasher<PlatformAdmin> Hasher = new();

    public static async Task<bool> RunAsync(WebApplication app, string[] args)
    {
        var pf = app.Services.GetRequiredService<IDbContextFactory<PlatformDbContext>>();
        await using (var db = await pf.CreateDbContextAsync())
        {
            await db.Database.EnsureCreatedAsync();
            // Tài khoản CSDL của các xã không được kết nối vào CSDL nền tảng
            await db.Database.ExecuteSqlRawAsync("DO $$ BEGIN EXECUTE format('REVOKE ALL ON DATABASE %I FROM PUBLIC', current_database()); END $$;");
        }
        string? Arg(string name) { var i = Array.IndexOf(args, name); return i >= 0 && i + 1 < args.Length ? args[i + 1] : null; }

        if (args.Contains("--tao-quan-tri-nen-tang"))
        {
            var un = (Arg("--tao-quan-tri-nen-tang") ?? "").Trim().ToLowerInvariant();
            if (!Passwords.ValidUsername(un)) { Console.Error.WriteLine(Passwords.UsernameMessage); Environment.Exit(1); }
            var name = args.SkipWhile(a => a != "--tao-quan-tri-nen-tang").Skip(2).FirstOrDefault(a => !a.StartsWith("--")) ?? un;
            await using var db = await pf.CreateDbContextAsync();
            var a = await db.Admins.FirstOrDefaultAsync(x => x.Username == un);
            if (a is null) db.Admins.Add(a = new PlatformAdmin { Id = "pa-" + Guid.NewGuid().ToString("N")[..12], Username = un, CreatedAt = DateTime.UtcNow });
            var pw = SetupGuard.NewToken();
            a.Name = name; a.PasswordHash = Hasher.HashPassword(a, pw); a.TotpSecret = null; a.TotpLastStep = 0; a.FailedCount = 0; a.LockoutUntil = null; a.Active = true;
            db.Logs.Add(new PlatformLog { Ts = DateTime.UtcNow, Username = "may-chu", Action = "Tạo/đặt lại tài khoản quản trị nền tảng (dòng lệnh)", Target = un });
            await db.SaveChangesAsync();
            Console.WriteLine($"Tài khoản quản trị nền tảng: {un}\nMật khẩu tạm: {pw}\nĐăng nhập trang quản lý thuê bao, quét mã QR để bật xác thực 2 lớp, rồi đổi mật khẩu.");
            return true;
        }
        if (args.Contains("--danh-sach-xa"))
        {
            await using var db = await pf.CreateDbContextAsync();
            foreach (var t in await db.Tenants.AsNoTracking().OrderBy(t => t.Code).ToListAsync())
                Console.WriteLine($"{t.Code}\t{t.DbName}\t{t.Status}\t{t.Name}");
            return true;
        }
        if (args.Contains("--reset-2fa") || args.Contains("--dat-lai-mat-khau"))
        {
            var pwMode = args.Contains("--dat-lai-mat-khau");
            var un = (Arg(pwMode ? "--dat-lai-mat-khau" : "--reset-2fa") ?? "").Trim().ToLowerInvariant();
            var code = Arg("--xa");
            var reg = app.Services.GetRequiredService<TenantRegistry>();
            await reg.ReloadAsync();
            var t = code is null ? null : await reg.Find(code);
            if (t is null) { Console.Error.WriteLine("Thiếu hoặc sai mã xã (--xa <mã xã>)."); Environment.Exit(1); }
            using var scope = app.Services.GetRequiredService<TenantOps>().ScopeFor(t);
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var u = await db.Users.FirstOrDefaultAsync(x => x.Username == un);
            if (u is null) { Console.Error.WriteLine($"Xã {code} không có tài khoản '{un}'."); Environment.Exit(1); }
            string? temp = null;
            if (pwMode) { temp = SetupGuard.NewToken(); u.PasswordHash = Passwords.Hash(u, temp); }
            else { u.TotpSecret = null; u.RecoveryCodes = null; u.TotpLastStep = 0; }
            u.FailedCount = 0; u.LockoutUntil = null; u.UpdatedAt = DateTime.UtcNow; u.UpdatedBy = "he-thong";
            db.Logs.Add(new AuditLog { Id = "log-" + Guid.NewGuid().ToString("N")[..16], Ts = DateTime.UtcNow, Username = "he-thong", Action = pwMode ? "Đặt mật khẩu tạm (dòng lệnh trên máy chủ, theo yêu cầu hỗ trợ)" : "Đặt lại xác thực 2 lớp (dòng lệnh trên máy chủ)", Module = "Người dùng", Target = u.Username });
            await db.SaveChangesAsync();
            Console.WriteLine(pwMode ? $"Mật khẩu tạm của '{un}' (xã {code}): {temp}\nNgười dùng đăng nhập rồi đổi mật khẩu ngay (menu tài khoản → Đổi mật khẩu)." : $"Đã đặt lại xác thực 2 lớp cho '{un}' của xã {code}.");
            return true;
        }
        return false;
    }
}

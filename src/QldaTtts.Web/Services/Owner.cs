using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>Quản trị chính (bản 1.7, mục 19): một tài khoản quản trị duy nhất được tạo, sửa, khóa, xóa, đặt lại mật khẩu
/// và xác thực 2 lớp cho các quản trị viên khác. Quản trị viên thường chỉ tự sửa tài khoản của mình và quản lý tài khoản nghiệp vụ.</summary>
public static class Owner
{
    public const string Key = "admin:owner";

    /// <summary>Mã người dùng là quản trị chính; chưa có (bản cũ nâng cấp, hoặc quản trị chính bị gỡ quyền) thì chọn một quản trị đang hoạt động:
    /// ưu tiên tài khoản "admin", sau đó tài khoản tạo sớm nhất.</summary>
    public static string? Ensure(AppDbContext db)
    {
        var admins = db.Groups.AsNoTracking().Where(g => g.Admin).Select(g => g.Id).ToList();
        var users = db.Users.Where(u => u.GroupId != null && admins.Contains(u.GroupId)).ToList();
        var s = db.Settings.FirstOrDefault(x => x.Key == Key);
        if (s?.Value is { } id && users.Any(u => u.Id == id)) return id;
        var pick = users.Where(u => u.Active).OrderBy(u => u.Username == "admin" ? 0 : 1).ThenBy(u => u.CreatedAt).FirstOrDefault()
                   ?? users.OrderBy(u => u.CreatedAt).FirstOrDefault();
        if (pick is null) return null;
        if (s is null) db.Settings.Add(new AppSetting { Key = Key, Value = pick.Id, UpdatedAt = DateTime.UtcNow, UpdatedBy = "he-thong" });
        else { s.Value = pick.Id; s.UpdatedAt = DateTime.UtcNow; s.UpdatedBy = "he-thong"; }
        db.SaveChanges();
        return pick.Id;
    }

    public static void Set(AppDbContext db, string userId, string by)
    {
        var s = db.Settings.FirstOrDefault(x => x.Key == Key);
        if (s is null) db.Settings.Add(new AppSetting { Key = Key, Value = userId, UpdatedAt = DateTime.UtcNow, UpdatedBy = by });
        else { s.Value = userId; s.UpdatedAt = DateTime.UtcNow; s.UpdatedBy = by; }
    }
}

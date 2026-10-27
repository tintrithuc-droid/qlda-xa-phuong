using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Quản lý tài khoản người dùng (UC50): thêm, sửa, khóa/mở khóa, đặt lại mật khẩu, xóa.</summary>
[Authorize, Route("api/users")]
public class UsersController : ApiControllerBase
{
    private const string Mod = "Người dùng";
    public UsersController(AppDbContext db, UserContext uc) : base(db, uc) { }

    public class UserRequest
    {
        public string Username { get; set; } = "";
        public string Name { get; set; } = "";
        public string? Unit { get; set; }
        public string? GroupId { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Password { get; set; }
    }

    private async Task<IActionResult?> Guard()
    {
        await Uc.LoadAsync();
        if (Uc.User is null) return NotSignedIn();
        return Uc.Can("quan-tri", true) ? null : Denied();
    }

    private async Task<string?> CheckGroup(string? groupId)
    {
        var g = groupId is null ? null : await Db.Groups.AsNoTracking().FirstOrDefaultAsync(x => x.Id == groupId);
        if (g is null) return "Vui lòng chọn nhóm người dùng hợp lệ.";
        if (g.Admin && !Uc.IsAdmin) return "Chỉ quản trị hệ thống được gán nhóm có toàn quyền.";
        return null;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UserRequest r)
    {
        if (await Guard() is { } deny) return deny;
        var un = r.Username.Trim().ToLowerInvariant();
        if (!Passwords.ValidUsername(un)) return Error(400, Passwords.UsernameMessage);
        if (string.IsNullOrWhiteSpace(r.Name)) return Error(400, "Vui lòng nhập họ tên.");
        if (await Db.Users.AnyAsync(u => u.Username == un)) return Error(409, "Tên đăng nhập đã tồn tại.");
        if (!Passwords.Strong(r.Password)) return Error(400, Passwords.WeakMessage);
        if (await CheckGroup(r.GroupId) is { } gerr) return Error(400, gerr);
        var now = DateTime.UtcNow;
        var u = new AppUser { Id = "u-" + Guid.NewGuid().ToString("N")[..12], Username = un, Name = r.Name.Trim(), Unit = r.Unit, GroupId = r.GroupId, Email = r.Email, Phone = r.Phone, Active = true, CreatedAt = now, UpdatedAt = now, UpdatedBy = Uc.User!.Username };
        u.PasswordHash = Passwords.Hash(u, r.Password!);
        Db.Users.Add(u);
        Uc.Log("Thêm mới", Mod, un);
        await Db.SaveChangesAsync();
        return Ok(u);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UserRequest r)
    {
        if (await Guard() is { } deny) return deny;
        var u = await Db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return Error(404, "Người dùng không còn tồn tại.");
        var un = r.Username.Trim().ToLowerInvariant();
        if (!Passwords.ValidUsername(un)) return Error(400, Passwords.UsernameMessage);
        if (await Db.Users.AnyAsync(x => x.Username == un && x.Id != id)) return Error(409, "Tên đăng nhập đã tồn tại.");
        if (r.GroupId != u.GroupId)
        {
            if (await CheckGroup(r.GroupId) is { } gerr) return Error(400, gerr);
            var oldAdmin = await Db.Groups.AnyAsync(g => g.Id == u.GroupId && g.Admin);
            if (oldAdmin && !Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được đổi nhóm của tài khoản quản trị.");
            if (id == Uc.User!.Id && Uc.IsAdmin) return Error(400, "Không thể tự bỏ quyền quản trị của chính mình.");
        }
        u.Username = un; u.Name = r.Name.Trim(); u.Unit = r.Unit; u.GroupId = r.GroupId; u.Email = r.Email; u.Phone = r.Phone;
        u.UpdatedAt = DateTime.UtcNow; u.UpdatedBy = Uc.User!.Username;
        Uc.Log("Cập nhật", Mod, un);
        await Db.SaveChangesAsync();
        return Ok(u);
    }

    public record PasswordRequest(string Password);

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] PasswordRequest r)
    {
        if (await Guard() is { } deny) return deny;
        var u = await Db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return Error(404, "Người dùng không còn tồn tại.");
        if (!Passwords.Strong(r.Password)) return Error(400, Passwords.WeakMessage);
        if (!Uc.IsAdmin && await Db.Groups.AnyAsync(g => g.Id == u.GroupId && g.Admin)) return Denied("Chỉ quản trị hệ thống được đặt lại mật khẩu tài khoản quản trị.");
        u.PasswordHash = Passwords.Hash(u, r.Password); u.FailedCount = 0; u.LockoutUntil = null;
        u.UpdatedAt = DateTime.UtcNow; u.UpdatedBy = Uc.User!.Username;
        Uc.Log("Đặt lại mật khẩu", Mod, u.Username);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    public record ActiveRequest(bool Active);

    [HttpPost("{id}/active")]
    public async Task<IActionResult> SetActive(string id, [FromBody] ActiveRequest r)
    {
        if (await Guard() is { } deny) return deny;
        if (id == Uc.User!.Id) return Error(400, "Không thể tự khóa tài khoản của chính mình.");
        var u = await Db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return Error(404, "Người dùng không còn tồn tại.");
        if (!Uc.IsAdmin && await Db.Groups.AnyAsync(g => g.Id == u.GroupId && g.Admin)) return Denied("Chỉ quản trị hệ thống được khóa tài khoản quản trị.");
        u.Active = r.Active; if (r.Active) { u.FailedCount = 0; u.LockoutUntil = null; }
        u.UpdatedAt = DateTime.UtcNow; u.UpdatedBy = Uc.User.Username;
        Uc.Log(r.Active ? "Mở khóa" : "Khóa", Mod, u.Username);
        await Db.SaveChangesAsync();
        return Ok(u);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (await Guard() is { } deny) return deny;
        if (id == Uc.User!.Id) return Error(400, "Không thể tự xóa tài khoản của chính mình.");
        var u = await Db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return Error(404, "Người dùng không còn tồn tại.");
        if (!Uc.IsAdmin && await Db.Groups.AnyAsync(g => g.Id == u.GroupId && g.Admin)) return Denied("Chỉ quản trị hệ thống được xóa tài khoản quản trị.");
        Db.Users.Remove(u);
        Uc.Log("Xóa", Mod, u.Username);
        await Db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }
}

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
    private readonly TwoFactor _tf;
    public UsersController(AppDbContext db, UserContext uc, TwoFactor tf) : base(db, uc) { _tf = tf; }

    private async Task<bool> IsAdminUser(AppUser u) => u.GroupId != null && await Db.Groups.AnyAsync(g => g.Id == u.GroupId && g.Admin);

    /// <summary>Mục 19 (bản 1.7): thao tác lên tài khoản quản trị khác chỉ dành cho Quản trị chính.</summary>
    private async Task<string?> PeerGuard(AppUser target, string what)
    {
        if (!await IsAdminUser(target)) return null;
        if (!Uc.IsAdmin) return $"Chỉ quản trị hệ thống được {what} tài khoản quản trị.";
        if (target.Id == Uc.User!.Id) return null;
        return Owner.Ensure(Db) == Uc.User.Id ? null : $"Chỉ Quản trị chính được {what} tài khoản quản trị khác. Mỗi quản trị viên chỉ tự sửa tài khoản của mình.";
    }

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
        if (g.Admin && Owner.Ensure(Db) != Uc.User!.Id) return "Chỉ Quản trị chính được tạo hoặc gán tài khoản vào nhóm quản trị.";
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
        if (await PeerGuard(u, "sửa") is { } pg) return Denied(pg);
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
        if (await PeerGuard(u, "đặt lại mật khẩu") is { } pg) return Denied(pg);
        u.PasswordHash = Passwords.Hash(u, r.Password); u.FailedCount = 0; u.LockoutUntil = null;
        u.UpdatedAt = DateTime.UtcNow; u.UpdatedBy = Uc.User!.Username;
        Uc.Log("Đặt lại mật khẩu", Mod, u.Username);
        await Db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    /// <summary>Đặt lại xác thực 2 lớp (người dùng mất điện thoại): xóa khóa và mã khôi phục, lần đăng nhập sau phải thiết lập lại.</summary>
    [HttpPost("{id}/reset-2fa")]
    public async Task<IActionResult> ResetTwoFactor(string id)
    {
        if (await Guard() is { } deny) return deny;
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được đặt lại xác thực 2 lớp.");
        if (id == Uc.User!.Id) return Error(400, "Không thể tự đặt lại xác thực 2 lớp của chính mình. Nhờ một quản trị khác thực hiện.");
        var u = await Db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return Error(404, "Người dùng không còn tồn tại.");
        if (await PeerGuard(u, "đặt lại xác thực 2 lớp") is { } pg) return Denied(pg);
        if (u.TotpSecret is null) return Error(400, "Tài khoản này chưa bật xác thực 2 lớp.");
        u.TotpSecret = null; u.RecoveryCodes = null; u.TotpLastStep = 0;
        u.UpdatedAt = DateTime.UtcNow; u.UpdatedBy = Uc.User.Username;
        Uc.Log("Đặt lại xác thực 2 lớp", Mod, u.Username);
        await Db.SaveChangesAsync();
        return Ok(u);
    }

    public record ActiveRequest(bool Active);

    [HttpPost("{id}/active")]
    public async Task<IActionResult> SetActive(string id, [FromBody] ActiveRequest r)
    {
        if (await Guard() is { } deny) return deny;
        if (id == Uc.User!.Id) return Error(400, "Không thể tự khóa tài khoản của chính mình.");
        var u = await Db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return Error(404, "Người dùng không còn tồn tại.");
        if (await PeerGuard(u, "khóa, mở khóa") is { } pg) return Denied(pg);
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
        if (await PeerGuard(u, "xóa") is { } pg) return Denied(pg);
        Db.Users.Remove(u);
        Uc.Log("Xóa", Mod, u.Username);
        await Db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    public record OwnerRequest(string? Code);

    /// <summary>Chuyển giao quyền Quản trị chính cho một quản trị viên khác (người đang là Quản trị chính xác nhận bằng mã 2 lớp).</summary>
    [HttpPost("{id}/owner")]
    public async Task<IActionResult> TransferOwner(string id, [FromBody] OwnerRequest r)
    {
        if (await Guard() is { } deny) return deny;
        if (Owner.Ensure(Db) != Uc.User!.Id) return Denied("Chỉ Quản trị chính được chuyển giao quyền này.");
        var u = await Db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return Error(404, "Người dùng không còn tồn tại.");
        if (id == Uc.User.Id) return Error(400, "Tài khoản này đang là Quản trị chính.");
        if (!await IsAdminUser(u) || !u.Active) return Error(400, "Chỉ chuyển giao được cho tài khoản quản trị đang hoạt động.");
        var me = await Db.Users.FirstAsync(x => x.Id == Uc.User.Id);
        if (_tf.Unprotect(me.TotpSecret) is { } sec)
        {
            var step = TwoFactor.Verify(sec, r.Code?.Replace(" ", ""), me.TotpLastStep);
            if (step is null) return Error(400, "Mã xác thực 2 lớp không đúng.");
            me.TotpLastStep = step.Value;
        }
        Owner.Set(Db, u.Id, Uc.User.Username);
        Uc.Log("Chuyển giao Quản trị chính", Mod, Uc.User.Username + " → " + u.Username);
        await Db.SaveChangesAsync();
        return Ok(new { ownerId = u.Id });
    }
}

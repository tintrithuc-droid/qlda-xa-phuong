using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace QldaTtts.Web.Services;

/// <summary>Tài khoản đang dùng mật khẩu ban đầu do quản trị cấp (tạo mới, đặt lại mật khẩu) chỉ được đổi mật khẩu,
/// đăng xuất, xem thông tin đơn vị; các chức năng khác bị chặn cho tới khi tự đặt mật khẩu của mình.</summary>
public class PasswordChangeFilter : IAsyncActionFilter
{
    private static readonly string[] Allowed = { "/api/auth", "/api/branding", "/api/health", "/api/portal" };

    public async Task OnActionExecutionAsync(ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        var path = ctx.HttpContext.Request.Path.Value ?? "";
        if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) && !Allowed.Any(a => path.StartsWith(a, StringComparison.OrdinalIgnoreCase)))
        {
            var uc = ctx.HttpContext.RequestServices.GetRequiredService<UserContext>();
            await uc.LoadAsync();
            if (uc.User?.MustChangePassword == true)
            {
                ctx.Result = new ObjectResult(new { code = 403, pwchange = true, message = "Tài khoản đang dùng mật khẩu ban đầu. Vui lòng đổi mật khẩu trước khi sử dụng phần mềm." }) { StatusCode = 403 };
                return;
            }
        }
        await next();
    }
}

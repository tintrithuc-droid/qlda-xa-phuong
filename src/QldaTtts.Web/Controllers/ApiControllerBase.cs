using Microsoft.AspNetCore.Mvc;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected readonly AppDbContext Db;
    protected readonly UserContext Uc;
    protected ApiControllerBase(AppDbContext db, UserContext uc) { Db = db; Uc = uc; }

    protected ObjectResult Error(int status, string message) => StatusCode(status, new { code = status, message });
    protected ObjectResult NotSignedIn() => Error(401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    protected ObjectResult Denied(string? msg = null) => Error(403, msg ?? "Bạn không có quyền thực hiện thao tác này.");

    protected static bool ValidId(string id) => System.Text.RegularExpressions.Regex.IsMatch(id, "^[A-Za-z0-9_.:@+-]{1,64}$");
}

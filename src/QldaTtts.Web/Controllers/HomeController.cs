using Microsoft.AspNetCore.Mvc;

namespace QldaTtts.Web.Controllers;

/// <summary>Trang ứng dụng (giao diện một trang); điều hướng phân hệ xử lý phía trình duyệt.</summary>
public class HomeController : Controller
{
    [HttpGet("/")]
    public IActionResult Index() => View();
}

using Microsoft.AspNetCore.Mvc;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Controllers;

/// <summary>Trang ứng dụng (giao diện một trang); điều hướng phân hệ xử lý phía trình duyệt.</summary>
public class HomeController : Controller
{
    private readonly AppDbContext _db;
    public HomeController(AppDbContext db) { _db = db; }

    /// <summary>Tiêu đề, biểu tượng, màu thanh trình duyệt lấy theo thông tin đơn vị ngay từ lúc mở trang.</summary>
    [HttpGet("/")]
    public async Task<IActionResult> Index()
    {
        Dictionary<string, object?>? b = null;
        try { b = await BrandingController.Load(_db); } catch (Exception) { /* CSDL chưa sẵn sàng: dùng giá trị mặc định */ }
        ViewData["Title"] = b is null ? "Quản lý dự án đầu tư xây dựng" : $"{b["appName"]} – {b["orgShort"]}";
        ViewData["Desc"] = b is null ? "Phần mềm quản lý dự án đầu tư xây dựng" : $"{b["bannerTitle"]} – {b["unitName"]}";
        ViewData["Icon"] = b?["logo"] as string;
        ViewData["Theme"] = b is null ? "#0d2a57" : BrandingController.Colors[(string)b["color"]!];
        return View();
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>
/// Bản 1.10.12: tệp đính kèm của lịch họp, thông báo, đề xuất ở phân hệ Văn phòng (chủ yếu tệp chuyển từ e-work cũ).
/// Lưu ở Attachments với Collection "vp-lich-hop", "vp-thong-bao", "vp-de-xuat"; không gửi kèm /api/data.
/// Lịch họp, thông báo: mọi tài khoản xem được (như nội dung). Đề xuất: người gửi, người xem mọi đề xuất (de-xuat), trưởng phòng của người gửi.
/// </summary>
[Authorize, Route("api/vp/tep")]
public class VpTepController : ApiControllerBase
{
    public static readonly string[] Cols = { "vp-lich-hop", "vp-thong-bao", "vp-de-xuat" };
    public VpTepController(AppDbContext db, UserContext uc) : base(db, uc) { }

    /// <summary>Các mã bản ghi người dùng hiện tại được xem tệp (null = mọi bản ghi của loại đó).</summary>
    public static async Task<HashSet<string>?> Visible(AppDbContext db, UserContext uc, string col, IEnumerable<string> ids)
    {
        if (col != "vp-de-xuat" || uc.Can("de-xuat") || uc.IsAdmin) return null;
        var me = await db.Employees.AsNoTracking().Where(e => e.UserId == uc.User!.Id).Select(e => e.Id).FirstOrDefaultAsync();
        var depts = await db.Departments.AsNoTracking().Where(d => (d.ManagerUserId == uc.User!.Id || d.DeputyUserId == uc.User!.Id)).Select(d => d.Id).ToListAsync();
        var l = ids.ToList();
        var reqs = await db.Requests.AsNoTracking().Where(r => l.Contains(r.Id)).Select(r => new { r.Id, r.EmployeeId }).ToListAsync();
        var empDept = await db.Employees.AsNoTracking().Where(e => e.DepartmentId != null && depts.Contains(e.DepartmentId)).Select(e => e.Id).ToListAsync();
        return reqs.Where(r => r.EmployeeId == me || empDept.Contains(r.EmployeeId)).Select(r => r.Id).ToHashSet();
    }

    /// <summary>Số tệp theo bản ghi (để hiện nút "n tệp" trong danh sách).</summary>
    [HttpGet("{col}/dem")]
    public async Task<IActionResult> Count(string col)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Cols.Contains(col)) return Error(400, "Dữ liệu không hợp lệ.");
        var g = (await Db.Attachments.AsNoTracking().Where(a => a.Collection == col && a.DeletedAt == null).Select(a => a.RecordId).ToListAsync())
            .GroupBy(x => x).ToDictionary(x => x.Key, x => x.Count());
        var vis = await Visible(Db, Uc, col, g.Keys);
        return Ok(vis is null ? g : g.Where(x => vis.Contains(x.Key)).ToDictionary(x => x.Key, x => x.Value));
    }

    [HttpGet("{col}/{id}")]
    public async Task<IActionResult> List(string col, string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Cols.Contains(col) || !ValidId(id)) return Error(400, "Dữ liệu không hợp lệ.");
        var vis = await Visible(Db, Uc, col, new[] { id }); if (vis is not null && !vis.Contains(id)) return Denied();
        var l = await Db.Attachments.AsNoTracking().Where(a => a.Collection == col && a.RecordId == id && a.DeletedAt == null).OrderBy(a => a.UploadedAt).ToListAsync();
        return Ok(l.Select(a => new { id = a.Id, fileId = a.FileId, name = a.FileName, type = a.ContentType, size = a.Size, by = a.UploadedBy, at = a.UploadedAt }));
    }
}

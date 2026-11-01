using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>Xác định một bản ghi / một tệp thuộc dự án nào để kiểm tra phạm vi dữ liệu được giao.</summary>
public static class ProjectScope
{
    public static async Task<string?> ProjectOf(AppDbContext db, EntityBase e) => e switch
    {
        Project p => p.Id,
        IHasProject hp => hp.ProjectId,
        IHasContract hc => hc.ContractId is null ? null :
            await db.Contracts.AsNoTracking().Where(c => c.Id == hc.ContractId).Select(c => c.ProjectId).FirstOrDefaultAsync(),
        _ => null
    };

    public static bool Scoped(EntityBase e) => e is Project or IHasProject or IHasContract;

    /// <summary>Phân hệ được phép đính kèm tệp cho từng loại bản ghi (cần quyền cập nhật một trong các phân hệ).</summary>
    public static readonly Dictionary<string, string[]> AttachModules = new()
    {
        ["projects"] = new[] { "du-an" },
        ["tasks"] = new[] { "du-an" },
        ["legal"] = new[] { "du-an", "goi-thau" },
        ["items"] = new[] { "mo-hinh" },
        ["packages"] = new[] { "goi-thau" },
        ["contracts"] = new[] { "goi-thau", "khoi-luong", "thanh-toan" },
        ["addenda"] = new[] { "goi-thau" },
        ["schedule"] = new[] { "tien-do" },
        ["diaries"] = new[] { "nhat-ky" },
        ["boq"] = new[] { "khoi-luong" },
        ["volumes"] = new[] { "khoi-luong" },
        ["payplans"] = new[] { "thanh-toan" },
        ["payments"] = new[] { "thanh-toan" },
        ["guides"] = new[] { "quan-tri" },
    };

    /// <summary>
    /// Các dự án mà tệp đang được dùng (qua tệp đính kèm, hồ sơ pháp lý, tệp mô hình, hồ sơ thanh toán, ảnh nhật ký).
    /// Danh sách rỗng = tệp chưa gắn với bản ghi nào.
    /// </summary>
    public static async Task<List<string?>> ProjectsOfFile(AppDbContext db, string fileId)
    {
        var res = new List<string?>();
        res.AddRange(await db.Attachments.AsNoTracking().Where(a => a.FileId == fileId && a.DeletedAt == null).Select(a => a.ProjectId).ToListAsync());
        res.AddRange(await db.LegalDocuments.AsNoTracking().Where(l => l.AssetId == fileId).Select(l => l.ProjectId).ToListAsync());
        res.AddRange(await db.ModelFiles.AsNoTracking().Where(m => m.AssetId == fileId).Select(m => m.ProjectId).ToListAsync());
        var payContracts = await db.Payments.AsNoTracking().Where(p => p.AssetId == fileId).Select(p => p.ContractId).ToListAsync();
        if (payContracts.Count > 0)
            res.AddRange(await db.Contracts.AsNoTracking().Where(c => payContracts.Contains(c.Id)).Select(c => c.ProjectId).ToListAsync());
        // Ảnh nhật ký lưu trong cột JSON: lọc thô theo chuỗi rồi kiểm tra chính xác
        var like = "%" + fileId + "%";
        var diaries = await db.Diaries.FromSqlInterpolated($"SELECT * FROM \"ConstructionDiaries\" WHERE \"Photos\" LIKE {like}").AsNoTracking().ToListAsync();
        res.AddRange(diaries.Where(d => d.Photos.Any(p => p.AssetId == fileId)).Select(d => d.ProjectId));
        return res;
    }
}

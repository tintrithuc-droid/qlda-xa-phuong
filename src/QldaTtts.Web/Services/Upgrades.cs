using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>Nâng cấp dữ liệu khi cài bản mới (chạy mỗi lần khởi động, không làm gì nếu đã nâng cấp).</summary>
public static class Upgrades
{
    public static void Run(AppDbContext db)
    {
        // 1) Tệp đính kèm đơn lẻ của hồ sơ pháp lý / hồ sơ thanh toán (bản cũ) chuyển sang danh sách tệp đính kèm
        var known = db.Attachments.AsNoTracking().Select(a => a.FileId).ToHashSet();
        var files = db.Files.AsNoTracking().ToDictionary(f => f.Id);
        var contractProject = db.Contracts.AsNoTracking().ToDictionary(c => c.Id, c => c.ProjectId);
        void Add(string col, string recId, string? pid, string? assetId, string? kind)
        {
            if (assetId is null || known.Contains(assetId) || !files.TryGetValue(assetId, out var f)) return;
            db.Attachments.Add(new Attachment
            {
                Id = "att-" + Guid.NewGuid().ToString("N")[..20], Collection = col, RecordId = recId, ProjectId = pid, Kind = kind,
                FileId = f.Id, FileName = f.FileName, ContentType = f.ContentType, Size = f.Size, UploadedBy = f.UploadedBy, UploadedAt = f.UploadedAt
            });
            known.Add(assetId);
        }
        foreach (var l in db.LegalDocuments.AsNoTracking().Where(l => l.AssetId != null).ToList()) Add("legal", l.Id, l.ProjectId, l.AssetId, null);
        foreach (var p in db.Payments.AsNoTracking().Where(p => p.AssetId != null).ToList())
            Add("payments", p.Id, p.ContractId != null && contractProject.TryGetValue(p.ContractId, out var pid) ? pid : null, p.AssetId, "Hồ sơ đề nghị thanh toán");

        // 2) Bổ sung giá trị danh mục mới (khi hệ thống đã có danh mục loại hồ sơ pháp lý)
        const string type = "Loại hồ sơ pháp lý";
        var cats = db.Catalogs.Where(c => c.Type == type).ToList();
        if (cats.Count > 0)
        {
            var order = cats.Max(c => c.Order);
            foreach (var v in new[] { "Quyết định điều chỉnh dự án", "Bảo lãnh tạm ứng" })
                if (!cats.Any(c => c.Value == v))
                    db.Catalogs.Add(new Catalog { Id = "cat-" + Guid.NewGuid().ToString("N")[..12], Type = type, Value = v, Order = ++order, UpdatedAt = DateTime.UtcNow, UpdatedBy = "he-thong" });
        }
        db.SaveChanges();
    }
}

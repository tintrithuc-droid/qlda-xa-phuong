using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>Số liệu thanh toán dùng chung cho kiểm tra ở máy chủ (bản 1.7).</summary>
public static class Payments
{
    /// <summary>Hồ sơ thanh toán khối lượng hoàn thành (không gồm tạm ứng, thu hồi tạm ứng).</summary>
    public static bool IsVolumeKind(string? kind) => kind is not null && kind.Contains("khối lượng", StringComparison.OrdinalIgnoreCase) && !kind.Contains("tạm ứng", StringComparison.OrdinalIgnoreCase);

    /// <summary>Giá trị khối lượng đã nghiệm thu của hợp đồng: dòng thuộc đợt đã duyệt, hoặc dòng nhập trước bản 1.7 (không có đợt).</summary>
    public static async Task<decimal> AcceptedValue(AppDbContext db, string contractId)
    {
        var ok = (await db.VolumeBatches.AsNoTracking().Where(b => b.ContractId == contractId).ToListAsync())
            .Where(b => string.IsNullOrEmpty(b.Status) || b.Status == "Đã duyệt").Select(b => b.Id).ToHashSet();
        var price = await db.Boq.AsNoTracking().Where(b => b.ContractId == contractId).ToDictionaryAsync(b => b.Id, b => b.Price ?? 0);
        var vols = await db.Volumes.AsNoTracking().Where(v => v.ContractId == contractId).ToListAsync();
        return vols.Where(v => string.IsNullOrEmpty(v.BatchId) || ok.Contains(v.BatchId))
            .Sum(v => (decimal)(v.AcceptedQty ?? 0) * (v.BoqId != null && price.TryGetValue(v.BoqId, out var p) ? p : 0));
    }
}

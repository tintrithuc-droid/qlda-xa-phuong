using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Bản 1.8: giai đoạn của gói thầu. Menu Nghiệp vụ chia Chuẩn bị đầu tư và Thực hiện đầu tư; gói thầu, hợp đồng và hồ sơ của hợp đồng
/// (nghiệm thu, thanh toán) thuộc giai đoạn của gói thầu. Một kho dữ liệu, hai lát cắt, không nhập trùng.
/// </summary>
public static class Phases
{
    public const string Prep = "cb", Invest = "dt";

    /// <summary>Gói tư vấn giám sát thi công thuộc giai đoạn thực hiện đầu tư.</summary>
    public static bool IsSupervision(Package k) =>
        ((k.Name ?? "") + " " + (k.Type ?? "")).Contains("giám sát", StringComparison.OrdinalIgnoreCase)
        || ((k.Code ?? "").Contains("GS", StringComparison.OrdinalIgnoreCase) && (k.Type ?? "").Contains("tư vấn", StringComparison.OrdinalIgnoreCase));

    /// <summary>Gợi ý theo loại gói thầu: gói tư vấn (khảo sát, thiết kế, lập dự toán…) thuộc chuẩn bị đầu tư, trừ tư vấn giám sát; loại khác thuộc thực hiện đầu tư.</summary>
    public static string Default(Package k) =>
        (k.Type ?? "").Contains("Tư vấn", StringComparison.OrdinalIgnoreCase) && !(k.Type ?? "").Contains("Phi tư vấn", StringComparison.OrdinalIgnoreCase) && !IsSupervision(k) ? Prep : Invest;

    public static string Of(Package k) => k.Phase is Prep or Invest ? k.Phase : Default(k);

    /// <summary>Nhận mã (cb/dt) hoặc chữ (Chuẩn bị đầu tư / Thực hiện đầu tư); không hợp lệ thì để trống.</summary>
    public static string? Normalize(string? v)
    {
        var s = (v ?? "").Trim();
        if (s.Length == 0) return null;
        if (s.Equals(Prep, StringComparison.OrdinalIgnoreCase) || s.Contains("chuẩn bị", StringComparison.OrdinalIgnoreCase)) return Prep;
        if (s.Equals(Invest, StringComparison.OrdinalIgnoreCase) || s.Contains("đầu tư", StringComparison.OrdinalIgnoreCase) || s.Contains("thực hiện", StringComparison.OrdinalIgnoreCase)) return Invest;
        return null;
    }

    /// <summary>Hợp đồng thuộc gói thầu giai đoạn chuẩn bị đầu tư.</summary>
    public static async Task<bool> IsPrepContract(AppDbContext db, string? contractId)
    {
        if (string.IsNullOrEmpty(contractId)) return false;
        var kid = await db.Contracts.AsNoTracking().Where(c => c.Id == contractId).Select(c => c.PackageId).FirstOrDefaultAsync();
        var k = kid is null ? null : await db.Packages.AsNoTracking().FirstOrDefaultAsync(x => x.Id == kid);
        return k is not null && Of(k) == Prep;
    }
}

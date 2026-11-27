using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Bản 1.10.27: mã dự án và mã gói thầu tự sinh theo một quy tắc cố định.
/// Dự án: DA-&lt;năm&gt;-&lt;số thứ tự 2 chữ số, đầu năm đếm lại&gt; (DA-2026-01).
/// Gói thầu: &lt;mã dự án&gt;-GT&lt;số thứ tự 2 chữ số trong dự án&gt; (DA-2026-01-GT01).
/// Khóa nhập (anh chốt 27/11): máy chủ luôn cấp mã khi thêm mới, hai người cùng thêm thì người lưu sau được số kế tiếp.
/// Dự án, gói thầu đã có giữ nguyên mã; chỉ quản trị sửa được mã khi cần (không trùng).
/// </summary>
public static class CodeRules
{
    public const string ProjectPrefix = "DA";
    public const string PackageInfix = "-GT";

    static string Key(string? s) => (s ?? "").Trim().ToUpperInvariant();

    static int Seq(string? code, string prefix)
    {
        var c = (code ?? "").Trim();
        if (!c.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) return 0;
        var rest = c[prefix.Length..];
        return rest.Length is > 0 and <= 6 && rest.All(char.IsAsciiDigit) ? int.Parse(rest) : 0;
    }

    public static string ProjectBase(int year) => $"{ProjectPrefix}-{year}-";

    public static string NextProject(IEnumerable<string?> codes, int year)
    {
        var b = ProjectBase(year);
        var n = codes.Select(c => Seq(c, b)).DefaultIfEmpty(0).Max();
        return b + (n + 1).ToString("00");
    }

    /// <summary>Số thứ tự gói = lớn hơn cả số gói đang có của dự án và số lớn nhất đã cấp theo quy tắc.</summary>
    public static string NextPackage(string projectCode, IReadOnlyCollection<string?> codes)
    {
        var b = projectCode.Trim() + PackageInfix;
        var n = Math.Max(codes.Count, codes.Select(c => Seq(c, b)).DefaultIfEmpty(0).Max());
        return b + (n + 1).ToString("00");
    }

    static int Year() => VnTime.Now.Year;

    /// <summary>Gán mã dự án trước khi lưu (anh chốt 27/11: khóa nhập). Thêm mới: máy luôn cấp, bỏ qua mã gửi lên.
    /// Sửa: giữ mã cũ; chỉ quản trị đổi được (để sửa dữ liệu cũ), mã đổi không được trùng. Trả về thông báo lỗi nếu có.</summary>
    public static async Task<string?> Apply(AppDbContext db, Project p, Project? old, bool admin)
    {
        var want = (p.Code ?? "").Trim();
        if (old is not null && (!admin || want.Length == 0 || Key(want) == Key(old.Code)))
        {
            if (!string.IsNullOrWhiteSpace(old.Code)) { p.Code = old.Code; return null; }
            if (!admin) want = "";
        }
        var others = await db.Projects.AsNoTracking().Where(x => x.Id != p.Id).Select(x => x.Code).ToListAsync();
        if (old is null || want.Length == 0) { p.Code = NextProject(others, Year()); return null; }
        if (others.Select(Key).Contains(Key(want))) return $"Mã dự án {want} đã có, hãy nhập mã khác.";
        p.Code = want; return null;
    }

    /// <summary>Gán mã gói thầu (không trùng trong cùng dự án). Thêm mới hoặc chuyển sang dự án khác: máy cấp theo mã dự án.
    /// Sửa trong cùng dự án: giữ mã cũ; chỉ quản trị đổi được.</summary>
    public static async Task<string?> Apply(AppDbContext db, Package k, Package? old, bool admin)
    {
        var want = (k.Code ?? "").Trim();
        var same = old is not null && old.ProjectId == k.ProjectId;
        if (same && (!admin || want.Length == 0 || Key(want) == Key(old!.Code)) && !string.IsNullOrWhiteSpace(old!.Code)) { k.Code = old.Code; return null; }
        var pcode = k.ProjectId is null ? null : await db.Projects.AsNoTracking().Where(x => x.Id == k.ProjectId).Select(x => x.Code).FirstOrDefaultAsync();
        var others = await db.Packages.AsNoTracking().Where(x => x.ProjectId == k.ProjectId && x.Id != k.Id).Select(x => x.Code).ToListAsync();
        if (!(same && admin && want.Length > 0))
        {
            if (string.IsNullOrWhiteSpace(pcode)) return "Dự án chưa có mã nên chưa cấp được ký hiệu gói thầu.";
            k.Code = NextPackage(pcode, others); return null;
        }
        if (others.Select(Key).Contains(Key(want))) return $"Dự án đã có gói thầu ký hiệu {want}, hãy nhập ký hiệu khác.";
        k.Code = want; return null;
    }
}

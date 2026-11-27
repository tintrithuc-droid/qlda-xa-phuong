using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Bản 1.10.27: mã dự án và mã gói thầu tự sinh theo một quy tắc cố định.
/// Dự án: DA-&lt;năm&gt;-&lt;số thứ tự 2 chữ số, đầu năm đếm lại&gt; (DA-2026-01).
/// Gói thầu: &lt;mã dự án&gt;-GT&lt;số thứ tự 2 chữ số trong dự án&gt; (DA-2026-01-GT01).
/// Biểu mẫu điền sẵn mã gợi ý, người dùng vẫn sửa được; để trống thì máy chủ tự cấp. Dự án, gói thầu đã có giữ nguyên mã.
/// Hai người cùng thêm một lúc mà trùng mã tự sinh thì người lưu sau được cấp số kế tiếp; mã tự gõ bị trùng thì báo lỗi.
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

    public static bool IsAutoProject(string code) => Regex.IsMatch(code.Trim(), $@"^{ProjectPrefix}-\d{{4}}-\d{{1,6}}$", RegexOptions.IgnoreCase);
    public static bool IsAutoPackage(string code, string projectCode) => Seq(code, projectCode.Trim() + PackageInfix) > 0;

    static int Year() => VnTime.Now.Year;

    /// <summary>Gán/kiểm tra mã dự án trước khi lưu; trả về thông báo lỗi khi mã gõ tay bị trùng.</summary>
    public static async Task<string?> Apply(AppDbContext db, Project p, Project? old)
    {
        p.Code = (p.Code ?? "").Trim();
        if (p.Code.Length == 0) { if (old is not null && !string.IsNullOrWhiteSpace(old.Code)) { p.Code = old.Code; return null; } }
        else if (old is not null && Key(old.Code) == Key(p.Code)) return null; // không đổi mã: không xét trùng (dữ liệu cũ)
        var others = await db.Projects.AsNoTracking().Where(x => x.Id != p.Id).Select(x => x.Code).ToListAsync();
        var taken = others.Select(Key).ToHashSet();
        if (p.Code.Length == 0 || (taken.Contains(Key(p.Code)) && IsAutoProject(p.Code) && old is null))
        {
            p.Code = NextProject(others, Year());
            return null;
        }
        if (taken.Contains(Key(p.Code))) return $"Mã dự án {p.Code} đã có. Hãy để trống để máy tự cấp mã, hoặc nhập mã khác.";
        return null;
    }

    /// <summary>Gán/kiểm tra mã gói thầu (không trùng trong cùng dự án).</summary>
    public static async Task<string?> Apply(AppDbContext db, Package k, Package? old)
    {
        k.Code = (k.Code ?? "").Trim();
        var sameProject = old is not null && old.ProjectId == k.ProjectId;
        if (k.Code.Length == 0 && old is not null && !string.IsNullOrWhiteSpace(old.Code)) { k.Code = old.Code; if (sameProject) return null; }
        else if (sameProject && Key(old!.Code) == Key(k.Code)) return null;
        var pcode = k.ProjectId is null ? null : await db.Projects.AsNoTracking().Where(x => x.Id == k.ProjectId).Select(x => x.Code).FirstOrDefaultAsync();
        var others = await db.Packages.AsNoTracking().Where(x => x.ProjectId == k.ProjectId && x.Id != k.Id).Select(x => x.Code).ToListAsync();
        var taken = others.Select(Key).ToHashSet();
        if (!string.IsNullOrWhiteSpace(pcode) && (k.Code.Length == 0 || (taken.Contains(Key(k.Code)) && IsAutoPackage(k.Code, pcode) && old is null)))
        {
            k.Code = NextPackage(pcode, others);
            return null;
        }
        if (k.Code.Length == 0) return "Vui lòng nhập ký hiệu gói thầu.";
        if (taken.Contains(Key(k.Code))) return $"Dự án đã có gói thầu ký hiệu {k.Code}. Hãy để trống để máy tự cấp, hoặc nhập ký hiệu khác.";
        return null;
    }
}

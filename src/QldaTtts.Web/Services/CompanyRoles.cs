using System.Text.RegularExpressions;
using QldaTtts.Web.Controllers;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Bản 1.10.4: bộ vai trò của doanh nghiệp dùng phân hệ Văn phòng (e-work). Mỗi vai trò là một nhóm quyền cố định;
/// nhân sự thay đổi thì chỉ đổi nhóm của tài khoản, quyền của vai trò giữ nguyên.
/// Mọi tài khoản đều tự điểm danh, gửi đề xuất, nhận việc, xem phiếu lương và KPI của mình (không cần quyền riêng).
/// Quyền "xem" một phân hệ Văn phòng nghĩa là xem dữ liệu của mọi người, nên Nhân viên không có.
/// Trưởng phòng: quyền như Nhân viên, thêm quyền với phòng mình do phòng ban ghi người phụ trách (Nhân sự → Phòng ban).
/// </summary>
public static class CompanyRoles
{
    public const string Staff = "g-nv", Manager = "g-tp", Accountant = "g-ketoan", Director = "g-bgd";

    static Dictionary<string, string> P(params string[] kv) { var d = new Dictionary<string, string>(); for (var i = 0; i + 1 < kv.Length; i += 2) d[kv[i]] = kv[i + 1]; return d; }

    /// <summary>Thông tin dự án mở cho mọi vai trò (chỉ xem) để nắm bắt công việc (anh Trí dặn 22/11/2026).</summary>
    static readonly string[] ProjectView = DataController.ProjectModules;

    public static readonly (string Id, string Name, string Desc, Dictionary<string, string> Perms)[] All =
    {
        (Staff, "Nhân viên", "Tự điểm danh, gửi đề xuất, làm công việc được giao, xem phiếu lương và KPI của mình. Không xem dữ liệu của người khác.",
            Merge(P("lich-hop", "view", "thong-bao", "view"), ProjectView)),
        (Manager, "Trưởng phòng", "Như Nhân viên; thêm: giao việc, nghiệm thu, chấm KPI, duyệt đề xuất, xem bảng công của phòng mình (phòng ban ghi tên người phụ trách).",
            Merge(P("lich-hop", "edit", "thong-bao", "view"), ProjectView)),
        (Accountant, "Kế toán", "Như Nhân viên; thêm: hồ sơ nhân sự, bảng công, lập và chốt bảng lương, trả lời kiến nghị, duyệt chi lương, xuất danh sách chuyển khoản.",
            Merge(P("lich-hop", "view", "thong-bao", "view", "nhan-su", "edit", "diem-danh", "edit", "de-xuat", "view", "kpi", "view", "luong", "edit", "luong:duyet", "1"), ProjectView)),
        (Director, "Ban giám đốc", "Làm việc như mọi người (điểm danh, đề xuất, nhận việc); thêm: xem toàn công ty, giao việc, chấm và chốt KPI, duyệt đề xuất, duyệt chi lương, thông báo, lịch họp, dự án.",
            Merge(P("lich-hop", "edit", "thong-bao", "edit", "nhan-su", "edit", "diem-danh", "edit", "de-xuat", "edit", "de-xuat:duyet", "1",
                "cong-viec", "edit", "kpi", "edit", "luong", "edit", "luong:duyet", "1", "du-an", "edit"), ProjectView)),
    };

    static Dictionary<string, string> Merge(Dictionary<string, string> d, string[] view) { foreach (var m in view) d.TryAdd(m, "view"); return d; }

    /// <summary>Tạo các nhóm vai trò còn thiếu (không sửa nhóm đã có, quản trị có thể đã điều chỉnh). Trả về số nhóm tạo mới.</summary>
    public static int Ensure(AppDbContext db, string by)
    {
        var have = db.Groups.Select(g => g.Id).ToHashSet(); var n = 0;
        foreach (var (id, name, desc, perms) in All)
        {
            if (have.Contains(id)) continue;
            db.Groups.Add(new UserGroup { Id = id, Name = name, Desc = desc, Perms = new(perms), UpdatedAt = DateTime.UtcNow, UpdatedBy = by }); n++;
        }
        return n;
    }

    public static string NameOf(string id) => All.FirstOrDefault(x => x.Id == id).Name ?? id;

    /// <summary>Vai trò (RoleName) và chức vụ (TenChucVu) trên e-work → nhóm. Tài khoản quản trị e-work không tự nhận quyền quản trị (quản trị gán tay).
    /// 1.10.15 (dữ liệu thật Tri Thức): bỏ dấu tiếng Việt trước khi so (trước đây "Giám đốc" thành "Gimc");
    /// chức vụ Giám đốc/Phó giám đốc → Ban giám đốc; có KETOAN ở vai trò hoặc chức vụ → Kế toán (kể cả trưởng phòng kế toán);
    /// lãnh đạo PHÒNG/trưởng phòng → Trưởng phòng; "lãnh đạo cơ quan" không kèm chức vụ giám đốc, "doanh nghiệp" → Nhân viên.</summary>
    public static string GroupFor(string? ewRole, string? position = null)
    {
        string K(string? s)
        {
            var d = (s ?? "").Replace('đ', 'd').Replace('Đ', 'D').Normalize(System.Text.NormalizationForm.FormD);
            return Regex.Replace(new string(d.Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark).ToArray()), "[^A-Za-z]", "").ToUpperInvariant();
        }
        var r = K(ewRole); var p = K(position);
        if (Regex.IsMatch(p, "GIAMDOC|DIRECTOR|CEO") || Regex.IsMatch(r, "GIAMDOC|BANGIAMDOC|^BGD|DIRECTOR|CEO")) return Director;
        if (Regex.IsMatch(r + "|" + p, "KETOAN|ACCOUNT")) return Accountant;
        if (Regex.IsMatch(r, "LANHDAOPHONG|TRUONGPHONG|TRUONGBOPHAN|QUANLYPHONG|MANAGER") || Regex.IsMatch(p, "^(TRUONGPHONG|TRUONGBOPHAN|QUANLYPHONG|PHUTRACHPHONG)")) return Manager;
        return Staff;
    }
}

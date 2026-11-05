using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Quy trình trình duyệt (bản 1.2): Soạn thảo → Trình duyệt → Đã duyệt / Trả lại (về soạn thảo, ghi ý kiến) / Từ chối.
/// Áp dụng cho phụ lục hợp đồng, hồ sơ thanh toán, nghiệm thu. Người duyệt là người có quyền "Duyệt" của phân hệ
/// (khóa "&lt;phân hệ&gt;:duyet" = "1" trong quyền của nhóm) hoặc quản trị hệ thống.
/// </summary>
public record WorkflowDef(string Collection, string Module, string Draft, string Waiting, string Approved, string Rejected, string[] LockedStates)
{
    public bool IsLocked(string? status) => status is null || status == "" ? LegacyLocked : LockedStates.Contains(status);
    /// <summary>Bản ghi trước bản 1.2 không có trạng thái: coi là đã duyệt.</summary>
    public bool LegacyLocked => true;
}

public static class Workflow
{
    public static readonly WorkflowDef[] All =
    {
        new("addenda", "goi-thau", "Soạn thảo", "Chờ duyệt", "Đã duyệt", "Từ chối", new[] { "Đã duyệt", "Từ chối" }),
        // Hồ sơ thanh toán: Lãnh đạo Ban duyệt thì chuyển sang trình Kho bạc; kế toán xác nhận đã chi khi Kho bạc chi
        new("payments", "thanh-toan", "Đề nghị", "Chờ duyệt", "Đang trình KBNN", "Từ chối", new[] { "Đang trình KBNN", "Đã thanh toán", "Từ chối" }),
        new("acceptances", "nghiem-thu", "Soạn thảo", "Chờ duyệt", "Đã duyệt", "Từ chối", new[] { "Đã duyệt", "Từ chối" }),
        // Kế hoạch tiến độ (bản 1.5): kế hoạch đã duyệt vẫn được cập nhật tiến độ thực tế, nhưng không sửa được nội dung kế hoạch
        new("schedule", "tien-do", "Soạn thảo", "Chờ duyệt", "Đã duyệt", "Từ chối", new[] { "Đã duyệt", "Từ chối" }),
    };

    public static WorkflowDef? Find(string collection) => All.FirstOrDefault(w => w.Collection == collection);

    public static string? StatusOf(EntityBase e) => e switch { Addendum a => a.Status, Payment p => p.Status, Acceptance x => x.Status, ScheduleItem s => s.Status, _ => null };
    public static void SetStatus(EntityBase e, string s) { switch (e) { case Addendum a: a.Status = s; break; case Payment p: p.Status = s; break; case Acceptance x: x.Status = s; break; case ScheduleItem si: si.Status = s; break; } }

    public static bool CanApprove(UserContext uc, WorkflowDef w)
    {
        if (uc.User is null || uc.Group is null) return false;
        if (uc.Group.Admin) return true;
        return uc.Group.Perms.TryGetValue(w.Module + ":duyet", out var v) && v == "1";
    }

    /// <summary>
    /// Kiểm tra một lần ghi trực tiếp (PUT) của người không có quyền duyệt: không được tự đặt trạng thái đã duyệt/từ chối,
    /// không được sửa hồ sơ đang chờ duyệt hoặc đã duyệt. Riêng hồ sơ thanh toán đang trình Kho bạc được xác nhận "Đã thanh toán".
    /// Trả về thông báo lỗi, hoặc null nếu hợp lệ.
    /// </summary>
    public static string? CheckDirectWrite(WorkflowDef w, EntityBase? existing, EntityBase incoming)
    {
        var oldS = existing is null ? null : StatusOf(existing);
        var newS = StatusOf(incoming);
        if (existing is null)
            return newS is null || newS == "" || newS == w.Draft ? null : $"Hồ sơ mới phải ở trạng thái \"{w.Draft}\", sau đó bấm Trình duyệt.";
        if (w.Collection == "payments" && oldS == "Đang trình KBNN" && newS == "Đã thanh toán") return null;
        if (existing is ScheduleItem os && incoming is ScheduleItem ns)
        {
            var planSame = os.Name == ns.Name && os.PlanStart == ns.PlanStart && os.PlanEnd == ns.PlanEnd && os.Weight == ns.Weight
                && (os.PackageId ?? "") == (ns.PackageId ?? "") && (os.ItemId ?? "") == (ns.ItemId ?? "") && (oldS ?? "") == (newS ?? "");
            var progSame = os.Progress == ns.Progress && os.ActualStart == ns.ActualStart && os.ActualEnd == ns.ActualEnd
                && System.Text.Json.JsonSerializer.Serialize(os.History) == System.Text.Json.JsonSerializer.Serialize(ns.History);
            var approved = string.IsNullOrEmpty(oldS) || oldS == w.Approved;
            if (approved && planSame) return null; // cập nhật tiến độ thực tế trên kế hoạch đã duyệt
            if (!approved && !progSame) return "Kế hoạch tiến độ chưa được duyệt nên chưa cập nhật tiến độ thực tế được. Bấm Trình duyệt để Lãnh đạo Ban duyệt kế hoạch.";
            if (approved) return "Kế hoạch tiến độ đã được duyệt nên không sửa được nội dung kế hoạch. Người có quyền duyệt thu hồi về soạn thảo thì mới điều chỉnh được.";
        }
        if (oldS == w.Waiting) return "Hồ sơ đang chờ duyệt, không sửa được. Người duyệt trả lại thì mới sửa tiếp.";
        if (w.IsLocked(oldS)) return "Hồ sơ đã được duyệt (hoặc đã từ chối) nên bị khóa. Người có quyền duyệt thu hồi về soạn thảo thì mới sửa được.";
        if (newS != oldS && newS != w.Draft) return "Trạng thái hồ sơ chỉ thay đổi qua các nút Trình duyệt, Duyệt, Trả lại.";
        return null;
    }
}

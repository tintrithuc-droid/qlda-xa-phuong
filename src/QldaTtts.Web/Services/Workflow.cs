using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Loại hồ sơ đi qua trình duyệt. Trạng thái hồ sơ vẫn ghi bằng chữ (Soạn thảo, Chờ kiểm tra, Chờ duyệt, Đã duyệt, Từ chối…)
/// để các báo cáo, cảnh báo dùng như cũ; bước cụ thể đang xử lý ghi trong lịch sử trình duyệt (ApprovalLog.Step).
/// </summary>
public record WorkflowDef(string Collection, string Module, string Label, string Draft, string Waiting, string Approved, string Rejected,
    string[] LockedStates, bool CheckDefault = false, bool DefaultOn = true, string? AmountProp = null, string[]? FreeWhenLocked = null)
{
    /// <summary>Hồ sơ đang ở một bước chưa phải bước cuối (kiểm tra, xác nhận, thẩm định…).</summary>
    public const string Checking = "Chờ kiểm tra";
    public bool IsPending(string? status) => status == Waiting || status == Checking;
    public bool IsLocked(string? status) => status is null || status == "" ? LegacyLocked : LockedStates.Contains(status);
    /// <summary>Bản ghi trước khi áp dụng quy trình không có trạng thái: coi là đã duyệt.</summary>
    public bool LegacyLocked => true;
}

/// <summary>Một bước của quy trình do quản trị tự đặt (bản 1.8).</summary>
public class StepConfig
{
    /// <summary>Mã bước cố định (không đổi khi đổi tên).</summary>
    public string Key { get; set; } = "";
    public string Label { get; set; } = "";
    /// <summary>Chữ trên nút xử lý: Kiểm tra đạt, Xác nhận, Thẩm định, Duyệt…</summary>
    public string Verb { get; set; } = "Duyệt";
    /// <summary>Nhóm người dùng được xử lý bước. Để trống cả nhóm và người: theo quyền "Kiểm tra hồ sơ" (bước giữa) hoặc "Duyệt" (bước cuối) của phân hệ.</summary>
    public List<string> Groups { get; set; } = new();
    /// <summary>Người cụ thể được xử lý bước.</summary>
    public List<string> Users { get; set; } = new();
    /// <summary>Trả lại về: "author" người lập; "prev" bước liền trước.</summary>
    public string ReturnTo { get; set; } = "author";
    /// <summary>Hạn xử lý (ngày làm việc), 0 = không đặt hạn.</summary>
    public int DueDays { get; set; }
    /// <summary>Chỉ áp dụng bước khi giá trị hồ sơ trong khoảng [MinAmount, MaxAmount).</summary>
    public decimal? MinAmount { get; set; }
    public decimal? MaxAmount { get; set; }
    public bool NoteRequired { get; set; }

    public StepConfig Copy() => new()
    {
        Key = Key, Label = Label, Verb = Verb, Groups = Groups.ToList(), Users = Users.ToList(), ReturnTo = ReturnTo, DueDays = DueDays,
        MinAmount = MinAmount, MaxAmount = MaxAmount, NoteRequired = NoteRequired
    };
}

public class FlowConfig
{
    public bool Enabled { get; set; }
    public List<StepConfig> Steps { get; set; } = new();
}

/// <summary>Quy trình duyệt: quy trình chung theo loại hồ sơ và quy trình riêng của từng dự án (nếu có).</summary>
public class WfConfig
{
    public Dictionary<string, FlowConfig> Flows { get; set; } = new();
    /// <summary>{mã dự án: {loại hồ sơ: quy trình riêng}}</summary>
    public Dictionary<string, Dictionary<string, FlowConfig>> Projects { get; set; } = new();
    /// <summary>Chuyển đích danh thì chỉ người được chọn (hoặc quản trị) xử lý bước đó.</summary>
    public bool AssignedOnly { get; set; } = true;
    /// <summary>Người đã chuyển hồ sơ đi duyệt không tự xử lý các bước sau của chính hồ sơ đó.</summary>
    public bool NoSelfReview { get; set; } = true;
}

/// <summary>Tình trạng xử lý hiện tại của một hồ sơ: các bước, bước đang chờ, lần trình gần nhất, thao tác gần nhất.</summary>
public record WfRecordState(List<StepConfig> Route, int Index, ApprovalLog? Submit, ApprovalLog? Last)
{
    public StepConfig? Step => Index >= 0 && Index < Route.Count ? Route[Index] : null;
    public bool IsLast => Index == Route.Count - 1;
}

public static class Workflow
{
    public const string ConfigKey = "workflow.xa";
    private static readonly string[] AddFree = Array.Empty<string>();

    public static readonly WorkflowDef[] All =
    {
        new("addenda", "goi-thau", "Phụ lục hợp đồng", "Soạn thảo", "Chờ duyệt", "Đã duyệt", "Từ chối", new[] { "Đã duyệt", "Từ chối" }, AmountProp: nameof(Addendum.ValueChange)),
        // Hồ sơ thanh toán: duyệt xong chuyển sang trình Kho bạc; kế toán xác nhận đã chi khi Kho bạc chi
        new("payments", "thanh-toan", "Hồ sơ thanh toán", "Đề nghị", "Chờ duyệt", "Đang trình KBNN", "Từ chối", new[] { "Đang trình KBNN", "Đã thanh toán", "Từ chối" },
            AmountProp: nameof(Payment.Amount)),
        new("acceptances", "nghiem-thu", "Nghiệm thu, bàn giao", "Soạn thảo", "Chờ duyệt", "Đã duyệt", "Từ chối", new[] { "Đã duyệt", "Từ chối" }),
        new("schedule", "tien-do", "Kế hoạch tiến độ", "Soạn thảo", "Chờ duyệt", "Đã duyệt", "Từ chối", new[] { "Đã duyệt", "Từ chối" }),
        new("vbatches", "khoi-luong", "Đợt nghiệm thu khối lượng", "Soạn thảo", "Chờ duyệt", "Đã duyệt", "Từ chối", new[] { "Đã duyệt", "Từ chối" }, true),
        // Bản 1.8: loại hồ sơ bổ sung, mặc định tắt (quản trị bật khi cần)
        new("contracts", "goi-thau", "Hợp đồng", "Soạn thảo", "Chờ duyệt", "Đã duyệt", "Từ chối", new[] { "Đã duyệt", "Từ chối" }, false, false, nameof(Contract.Value),
            new[] { nameof(Contract.Note), nameof(Contract.GuaranteeUntil), nameof(Contract.AdvanceGuaranteeUntil) }),
        new("payplans", "thanh-toan", "Kế hoạch thanh toán", "Soạn thảo", "Chờ duyệt", "Đã duyệt", "Từ chối", new[] { "Đã duyệt", "Từ chối" }, false, false, nameof(PayPlan.Amount),
            new[] { nameof(PayPlan.Note) }),
        new("legal", "du-an", "Hồ sơ pháp lý", "Soạn thảo", "Chờ duyệt", "Đã duyệt", "Từ chối", new[] { "Đã duyệt", "Từ chối" }, false, false, null,
            new[] { nameof(LegalDocument.ValidUntil), nameof(LegalDocument.FileName), nameof(LegalDocument.FileSize), nameof(LegalDocument.AssetId), nameof(LegalDocument.Url) }),
    };

    public static WorkflowDef? Find(string collection) => All.FirstOrDefault(w => w.Collection == collection);

    public static string? StatusOf(EntityBase e) => e switch
    {
        Addendum a => a.Status, Payment p => p.Status, Acceptance x => x.Status, ScheduleItem s => s.Status, VolumeBatch v => v.Status,
        Contract c => c.Status, PayPlan pp => pp.Status, LegalDocument l => l.Status, _ => null
    };
    public static void SetStatus(EntityBase e, string? s)
    {
        switch (e)
        {
            case Addendum a: a.Status = s; break; case Payment p: p.Status = s; break; case Acceptance x: x.Status = s; break;
            case ScheduleItem si: si.Status = s; break; case VolumeBatch v: v.Status = s; break; case Contract c: c.Status = s; break;
            case PayPlan pp: pp.Status = s; break; case LegalDocument l: l.Status = s; break;
        }
    }

    /// <summary>Quyền duyệt của phân hệ: khóa "&lt;phân hệ&gt;:duyet" = "1" trong quyền của nhóm, hoặc quản trị hệ thống.</summary>
    public static bool CanApprove(UserContext uc, WorkflowDef w) => PermOf(uc.Group, w.Module + ":duyet");
    /// <summary>Quyền kiểm tra: khóa "&lt;phân hệ&gt;:kiemtra" = "1" trong quyền của nhóm, hoặc quản trị hệ thống.</summary>
    public static bool CanCheck(UserContext uc, WorkflowDef w) => PermOf(uc.Group, w.Module + ":kiemtra");
    private static bool PermOf(UserGroup? g, string key) => g is not null && (g.Admin || (g.Perms.TryGetValue(key, out var v) && v == "1"));

    // ---------- thiết lập quy trình ----------
    /// <summary>Thiết lập bước kiểm tra trước bản 1.8 (bật, tắt theo loại hồ sơ).</summary>
    public static string CheckKey(string collection) => "wf:kiem-tra:" + collection;
    private static bool LegacyCheck(AppDbContext db, WorkflowDef w)
    {
        var v = db.Settings.AsNoTracking().Where(x => x.Key == CheckKey(w.Collection)).Select(x => x.Value).FirstOrDefault();
        return v is null ? w.CheckDefault : v == "1";
    }

    public static StepConfig CheckStep(WorkflowDef w) => w.Collection == "vbatches"
        ? new StepConfig { Key = "check", Label = "Tư vấn giám sát xác nhận", Verb = "Xác nhận khối lượng" }
        : new StepConfig { Key = "check", Label = "Bộ phận chuyên môn kiểm tra", Verb = "Kiểm tra đạt" };
    public static StepConfig ApproveStep() => new() { Key = "approve", Label = "Lãnh đạo Ban duyệt", Verb = "Duyệt" };

    private static FlowConfig Default(AppDbContext db, WorkflowDef w) => new()
    {
        Enabled = w.DefaultOn,
        Steps = (LegacyCheck(db, w) ? new[] { CheckStep(w), ApproveStep() } : new[] { ApproveStep() }).ToList()
    };

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <summary>Quy trình đang áp dụng (đọc từ CSDL; chưa thiết lập thì dựng theo bước kiểm tra cũ: các xã đang chạy giữ nguyên cách duyệt).</summary>
    public static WfConfig Load(AppDbContext db)
    {
        var raw = db.Settings.AsNoTracking().Where(s => s.Key == ConfigKey).Select(s => s.Value).FirstOrDefault();
        WfConfig? cfg = null;
        if (!string.IsNullOrEmpty(raw)) { try { cfg = JsonSerializer.Deserialize<WfConfig>(raw, Json); } catch (JsonException) { } }
        return Clean(db, cfg ?? new WfConfig());
    }

    /// <summary>Chuẩn hóa: đủ các loại hồ sơ, mã bước hợp lệ và không trùng, tên bước không rỗng.</summary>
    public static WfConfig Clean(AppDbContext db, WfConfig cfg)
    {
        FlowConfig Fix(FlowConfig c)
        {
            var seen = new HashSet<string>(); var steps = new List<StepConfig>();
            foreach (var s in c.Steps ?? new())
            {
                var key = (s.Key ?? "").Trim();
                if (key.Length == 0 || key.Length > 20 || !key.All(ch => char.IsAsciiLetterOrDigit(ch) || ch is '-' or '_') || !seen.Add(key))
                    do key = "s-" + Guid.NewGuid().ToString("N")[..8]; while (!seen.Add(key));
                var label = (s.Label ?? "").Trim(); var verb = (s.Verb ?? "").Trim();
                steps.Add(new StepConfig
                {
                    Key = key, Label = label.Length == 0 ? "Bước " + (steps.Count + 1) : label[..Math.Min(label.Length, 150)],
                    Verb = verb.Length == 0 ? "Duyệt" : verb[..Math.Min(verb.Length, 40)],
                    Groups = (s.Groups ?? new()).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToList(),
                    Users = (s.Users ?? new()).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToList(),
                    ReturnTo = s.ReturnTo == "prev" ? "prev" : "author", DueDays = Math.Clamp(s.DueDays, 0, 365),
                    MinAmount = s.MinAmount is > 0 ? s.MinAmount : null, MaxAmount = s.MaxAmount is > 0 ? s.MaxAmount : null, NoteRequired = s.NoteRequired
                });
            }
            return new FlowConfig { Enabled = c.Enabled && steps.Count > 0, Steps = steps };
        }
        var o = new WfConfig { AssignedOnly = cfg.AssignedOnly, NoSelfReview = cfg.NoSelfReview };
        foreach (var w in All)
        {
            var c = cfg.Flows?.GetValueOrDefault(w.Collection);
            o.Flows[w.Collection] = c is null ? Default(db, w) : Fix(c);
            if (c is not null && o.Flows[w.Collection].Steps.Count == 0) o.Flows[w.Collection] = new FlowConfig { Enabled = false, Steps = new() { ApproveStep() } };
        }
        foreach (var (pid, map) in cfg.Projects ?? new())
        {
            var m = new Dictionary<string, FlowConfig>();
            foreach (var w in All) if (map.TryGetValue(w.Collection, out var pc)) m[w.Collection] = Fix(pc);
            if (m.Count > 0) o.Projects[pid] = m;
        }
        return o;
    }

    public static WfConfig Save(AppDbContext db, WfConfig cfg, string by)
    {
        cfg = Clean(db, cfg);
        var json = JsonSerializer.Serialize(cfg, Json);
        var row = db.Settings.FirstOrDefault(s => s.Key == ConfigKey);
        if (row is null) db.Settings.Add(new AppSetting { Key = ConfigKey, Value = json, UpdatedAt = DateTime.UtcNow, UpdatedBy = by });
        else { row.Value = json; row.UpdatedAt = DateTime.UtcNow; row.UpdatedBy = by; }
        return cfg;
    }

    /// <summary>Quy trình áp dụng cho hồ sơ của một dự án: quy trình riêng của dự án (nếu có), nếu không là quy trình chung.</summary>
    public static FlowConfig For(WfConfig cfg, WorkflowDef w, string? projectId) =>
        projectId is not null && cfg.Projects.TryGetValue(projectId, out var m) && m.TryGetValue(w.Collection, out var pc) ? pc : cfg.Flows[w.Collection];

    public static bool Active(WfConfig cfg, WorkflowDef w, string? projectId) => For(cfg, w, projectId).Enabled;

    public static decimal? AmountOf(WorkflowDef w, object rec) =>
        w.AmountProp is null ? null : rec.GetType().GetProperty(w.AmountProp)?.GetValue(rec) is decimal d ? Math.Abs(d) : null;

    /// <summary>Các bước thực tế của hồ sơ: bỏ các bước có điều kiện giá trị không thỏa.</summary>
    public static List<StepConfig> RouteFor(FlowConfig fc, decimal? amount) =>
        fc.Steps.Where(s => (s.MinAmount is null || (amount ?? 0) >= s.MinAmount) && (s.MaxAmount is null || (amount ?? 0) < s.MaxAmount)).Select(s => s.Copy()).ToList();

    public static string SerializeRoute(List<StepConfig> route) => JsonSerializer.Serialize(route, Json);
    public static List<StepConfig>? ParseRoute(string? raw)
    {
        if (string.IsNullOrEmpty(raw)) return null;
        try { return JsonSerializer.Deserialize<List<StepConfig>>(raw, Json); } catch (JsonException) { return null; }
    }

    /// <summary>Trạng thái chữ ứng với bước thứ i: bước cuối là "Chờ duyệt", các bước trước là "Chờ kiểm tra".</summary>
    public static string StatusAt(WorkflowDef w, List<StepConfig> route, int i) => i >= route.Count - 1 ? w.Waiting : WorkflowDef.Checking;

    /// <summary>Đọc tình trạng xử lý của hồ sơ từ lịch sử trình duyệt; hồ sơ trình trước bản 1.8 suy theo trạng thái chữ.</summary>
    public static async Task<WfRecordState> StateOf(AppDbContext db, WfConfig cfg, WorkflowDef w, EntityBase rec, string? pid)
    {
        var logs = await db.ApprovalLogs.AsNoTracking().Where(a => a.Collection == w.Collection && a.RecordId == rec.Id).OrderByDescending(a => a.At).ToListAsync();
        var last = logs.FirstOrDefault();
        var submit = logs.FirstOrDefault(a => a.Route != null);
        var route = ParseRoute(submit?.Route) ?? RouteFor(For(cfg, w, pid), AmountOf(w, rec));
        if (route.Count == 0) route = new() { ApproveStep() };
        var st = StatusOf(rec); var idx = -1;
        if (w.IsPending(st))
        {
            idx = last?.Step is { } k ? route.FindIndex(s => s.Key == k) : -1;
            if (idx < 0) idx = st == WorkflowDef.Checking ? 0 : route.Count - 1;
        }
        return new WfRecordState(route, idx, submit, last);
    }

    /// <summary>Người dùng được xử lý bước: quản trị; người, nhóm được chỉ định; để trống thì theo quyền của phân hệ.</summary>
    public static bool Handles(AppUser? u, UserGroup? g, WorkflowDef w, StepConfig s, bool isLast)
    {
        if (u is null || g is null) return false;
        if (g.Admin) return true;
        if (s.Users.Contains(u.Id) || s.Groups.Contains(g.Id)) return true;
        if (s.Users.Count == 0 && s.Groups.Count == 0) return PermOf(g, w.Module + (isLast ? ":duyet" : ":kiemtra"));
        return false;
    }

    /// <summary>Cộng số ngày làm việc (bỏ thứ Bảy, Chủ nhật).</summary>
    public static DateOnly AddWorkdays(DateOnly d, int n)
    {
        while (n > 0) { d = d.AddDays(1); if (d.DayOfWeek is not (DayOfWeek.Saturday or DayOfWeek.Sunday)) n--; }
        return d;
    }

    /// <summary>Các thuộc tính khác nhau giữa hai bản ghi (bỏ qua thời điểm, người cập nhật).</summary>
    public static List<string> Changed(EntityBase a, EntityBase b)
    {
        var res = new List<string>();
        foreach (var p in a.GetType().GetProperties())
        {
            if (p.Name is nameof(EntityBase.UpdatedAt) or nameof(EntityBase.UpdatedBy) || !p.CanWrite) continue;
            if (p.GetCustomAttributes(typeof(System.ComponentModel.DataAnnotations.Schema.NotMappedAttribute), true).Length > 0) continue;
            if (JsonSerializer.Serialize(p.GetValue(a), Json) != JsonSerializer.Serialize(p.GetValue(b), Json)) res.Add(p.Name);
        }
        return res;
    }

    /// <summary>
    /// Trạng thái hồ sơ chỉ thay đổi qua /api/approvals. Ngoại lệ: kế toán xác nhận hồ sơ thanh toán đang trình Kho bạc đã được chi.
    /// Loại hồ sơ đang tắt quy trình: hồ sơ mới ghi nhận luôn là đã duyệt.
    /// </summary>
    public static string? CheckStatusChange(WorkflowDef w, EntityBase? existing, EntityBase incoming, bool active)
    {
        var oldS = existing is null ? null : StatusOf(existing);
        var newS = StatusOf(incoming);
        if (existing is null)
        {
            if (!active) return newS is null || newS == "" || newS == w.Draft || newS == w.Approved ? null : $"Hồ sơ mới phải ở trạng thái \"{w.Approved}\".";
            return newS is null || newS == "" || newS == w.Draft ? null : $"Hồ sơ mới phải ở trạng thái \"{w.Draft}\", sau đó bấm Chuyển duyệt.";
        }
        if ((newS ?? "") == (oldS ?? "")) return null;
        if (w.Collection == "payments" && oldS == "Đang trình KBNN" && newS == "Đã thanh toán") return null;
        return "Trạng thái hồ sơ chỉ thay đổi qua các nút Chuyển duyệt, Kiểm tra, Duyệt, Trả lại, Thu hồi (hoặc Xác nhận đã chi với hồ sơ thanh toán).";
    }

    public static string? CheckDirectWrite(WorkflowDef w, EntityBase? existing, EntityBase incoming)
    {
        var oldS = existing is null ? null : StatusOf(existing);
        var newS = StatusOf(incoming);
        if (existing is null)
            return newS is null || newS == "" || newS == w.Draft ? null : $"Hồ sơ mới phải ở trạng thái \"{w.Draft}\", sau đó bấm Chuyển duyệt.";
        if (w.Collection == "payments" && oldS == "Đang trình KBNN" && newS == "Đã thanh toán") return null;
        if (existing is ScheduleItem os && incoming is ScheduleItem ns)
        {
            var planSame = os.Name == ns.Name && os.PlanStart == ns.PlanStart && os.PlanEnd == ns.PlanEnd && os.Weight == ns.Weight
                && (os.PackageId ?? "") == (ns.PackageId ?? "") && (os.ItemId ?? "") == (ns.ItemId ?? "") && (oldS ?? "") == (newS ?? "");
            var progSame = os.Progress == ns.Progress && os.ActualStart == ns.ActualStart && os.ActualEnd == ns.ActualEnd
                && JsonSerializer.Serialize(os.History) == JsonSerializer.Serialize(ns.History);
            var approved = string.IsNullOrEmpty(oldS) || oldS == w.Approved;
            if (approved && planSame) return null; // cập nhật tiến độ thực tế trên kế hoạch đã duyệt
            if (!approved && !progSame) return "Kế hoạch tiến độ chưa được duyệt nên chưa cập nhật tiến độ thực tế được. Bấm Chuyển duyệt để Lãnh đạo Ban duyệt kế hoạch.";
            if (approved) return "Kế hoạch tiến độ đã được duyệt nên không sửa được nội dung kế hoạch. Người có quyền duyệt thu hồi về soạn thảo thì mới điều chỉnh được.";
        }
        if (w.IsPending(oldS)) return "Hồ sơ đang trong quy trình duyệt, không sửa được. Người xử lý trả lại hoặc người chuyển thu hồi thì mới sửa tiếp.";
        if (w.IsLocked(oldS))
        {
            // Một số thông tin vẫn được cập nhật khi hồ sơ đã duyệt (gia hạn bảo lãnh, tệp quét, ghi chú…)
            if (w.FreeWhenLocked is { Length: > 0 } free && (newS ?? "") == (oldS ?? "") && Changed(existing, incoming).All(free.Contains)) return null;
            return "Hồ sơ đã được duyệt (hoặc đã từ chối) nên bị khóa. Người có quyền duyệt thu hồi về soạn thảo thì mới sửa được.";
        }
        if (newS != oldS && newS != w.Draft) return "Trạng thái hồ sơ chỉ thay đổi qua các nút Chuyển duyệt, Duyệt, Trả lại.";
        return null;
    }
}

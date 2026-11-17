using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>
/// Tạo lập dữ liệu đầu kỳ khi đưa hệ thống vào sử dụng (chỉ quản trị hệ thống):
/// nhập bộ mẫu Excel đầu kỳ (giao diện đọc tệp, gửi các dòng lên đây), kiểm tra toàn bộ rồi ghi trong một lần;
/// số liệu khối lượng (một đợt nghiệm thu lũy kế cho mỗi hợp đồng), thanh toán, phụ lục, tiến độ được đánh dấu "Số liệu đầu kỳ"
/// (đã duyệt, không qua luồng trình duyệt); bổ sung trang Kế hoạch vốn cho cấp xã;
/// dọn dữ liệu chạy thử trước khi nhập chính thức.
/// </summary>
[Authorize, Route("api/opening")]
public class OpeningController : ApiControllerBase
{
    public const string SettingKey = "opening", Mark = "Số liệu đầu kỳ";
    private readonly BackupService _bk;
    public OpeningController(AppDbContext db, UserContext uc, BackupService bk) : base(db, uc) { _bk = bk; }

    public class OpeningInfo
    {
        public string? Cutoff { get; set; }
        public string? Basis { get; set; }
        public DateTime? ImportedAt { get; set; }
        public string? ImportedBy { get; set; }
    }

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private OpeningInfo LoadInfo()
    {
        var raw = Db.Settings.AsNoTracking().Where(s => s.Key == SettingKey).Select(s => s.Value).FirstOrDefault();
        if (string.IsNullOrEmpty(raw)) return new();
        try { return JsonSerializer.Deserialize<OpeningInfo>(raw, Json) ?? new(); } catch (JsonException) { return new(); }
    }

    private void SaveInfo(OpeningInfo info)
    {
        var json = JsonSerializer.Serialize(info, Json);
        var row = Db.Settings.FirstOrDefault(s => s.Key == SettingKey);
        if (row is null) Db.Settings.Add(new AppSetting { Key = SettingKey, Value = json, UpdatedAt = DateTime.UtcNow, UpdatedBy = Uc.User!.Username });
        else { row.Value = json; row.UpdatedAt = DateTime.UtcNow; row.UpdatedBy = Uc.User!.Username; }
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được tạo lập dữ liệu đầu kỳ.");
        var marks = await Db.ApprovalLogs.AsNoTracking().Where(a => a.Action == Mark).GroupBy(a => a.Collection)
            .Select(g => new { collection = g.Key, records = g.Select(x => x.RecordId).Distinct().Count() }).ToListAsync();
        return Ok(new { info = LoadInfo(), marks, sampleUsers = await Db.Users.CountAsync(u => u.Sample), projects = await Db.Projects.CountAsync() });
    }

    // ===================== NHẬP DỮ LIỆU ĐẦU KỲ =====================

    public class ImportRequest
    {
        public bool DryRun { get; set; } = true;
        public string Cutoff { get; set; } = "";
        public string? Basis { get; set; }
        public Dictionary<string, List<JsonElement>> Sheets { get; set; } = new();
    }

    public record Issue(string Sheet, int Line, string Message);

    public class SheetCount { public int Add { get; set; } public int Update { get; set; } public int Same { get; set; } }

    /// <summary>Thứ tự xử lý: tập sau tham chiếu mã của tập trước.</summary>
    public static readonly (string Key, string Label)[] Sheets =
    {
        ("catalogs", "Danh mục"), ("projects", "Dự án"), ("items", "Hạng mục công trình"), ("packages", "Gói thầu"), ("legal", "Hồ sơ pháp lý"),
        ("contracts", "Hợp đồng"), ("addenda", "Phụ lục hợp đồng"), ("boq", "Bảng khối lượng hợp đồng"), ("schedule", "Kế hoạch tiến độ"),
        ("volumes", "Khối lượng lũy kế đã nghiệm thu"), ("payments", "Tạm ứng, thanh toán đã thực hiện"), ("payplans", "Kế hoạch thanh toán còn lại"),
        ("capitals", "Kế hoạch vốn"),
    };

    [HttpPost("import"), RequestSizeLimit(50L * 1024 * 1024)]
    public async Task<IActionResult> Import([FromBody] ImportRequest r)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được tạo lập dữ liệu đầu kỳ.");
        if (!DateOnly.TryParseExact(r.Cutoff ?? "", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var cutoff))
            return Error(400, "Vui lòng nhập mốc chốt số liệu (ngày dd/mm/yyyy).");
        var unknown = r.Sheets.Keys.Where(k => Sheets.All(s => s.Key != k)).ToList();
        if (unknown.Count > 0) return Error(400, "Trang tính không hợp lệ: " + string.Join(", ", unknown));
        if (r.Sheets.Values.Sum(v => v.Count) == 0) return Error(400, "Tệp không có dòng dữ liệu nào.");

        var job = new ImportJob(Db, Uc, cutoff, r.Basis?.Trim());
        await job.LoadAsync();
        foreach (var (key, label) in Sheets)
            if (r.Sheets.TryGetValue(key, out var rows) && rows.Count > 0) job.Run(key, label, rows);

        var ok = job.Errors.Count == 0;
        if (ok && !r.DryRun)
        {
            SaveInfo(new OpeningInfo { Cutoff = r.Cutoff, Basis = r.Basis?.Trim(), ImportedAt = DateTime.UtcNow, ImportedBy = Uc.User.Name });
            var total = job.Counts.Values.Sum(c => c.Add + c.Update);
            Uc.Log("Tạo lập dữ liệu đầu kỳ", "Quản trị hệ thống",
                $"Mốc chốt {cutoff:dd/MM/yyyy}: " + string.Join(", ", job.Counts.Where(c => c.Value.Add + c.Value.Update > 0)
                    .Select(c => $"{Sheets.First(s => s.Key == c.Key).Label} +{c.Value.Add}/~{c.Value.Update}")) + (string.IsNullOrEmpty(r.Basis) ? "" : " · " + r.Basis));
            await Db.SaveChangesAsync();
        }
        return Ok(new
        {
            ok, saved = ok && !r.DryRun, errors = job.Errors, warnings = job.Warnings,
            counts = Sheets.Where(s => job.Counts.ContainsKey(s.Key)).Select(s => new { sheet = s.Key, label = s.Label, job.Counts[s.Key].Add, job.Counts[s.Key].Update, job.Counts[s.Key].Same })
        });
    }

    /// <summary>Một lần nhập: giữ bản sao dữ liệu đang có (được theo dõi thay đổi), bản ghi mới thêm vào danh sách để các trang sau tham chiếu.</summary>
    private class ImportJob
    {
        private readonly AppDbContext _db; private readonly UserContext _uc; private readonly DateOnly _cutoff; private readonly string? _basis;
        public readonly List<Issue> Errors = new(), Warnings = new();
        public readonly Dictionary<string, SheetCount> Counts = new();
        private List<Catalog> _cats = new(); private List<Project> _projects = new(); private List<ConstructionItem> _items = new();
        private List<Package> _packages = new(); private List<LegalDocument> _legal = new(); private List<Contract> _contracts = new();
        private List<Addendum> _addenda = new(); private List<BoqItem> _boq = new(); private List<ScheduleItem> _schedule = new();
        private List<VolumeEntry> _volumes = new(); private List<Payment> _payments = new(); private List<PayPlan> _plans = new();
        private List<VolumeBatch> _batches = new(); private List<CapitalPlan> _capitals = new();
        private HashSet<(string, string)> _marked = new();
        private readonly DateTime _now = DateTime.UtcNow;
        private string _sheet = ""; private int _line;

        public ImportJob(AppDbContext db, UserContext uc, DateOnly cutoff, string? basis) { _db = db; _uc = uc; _cutoff = cutoff; _basis = basis; }

        public async Task LoadAsync()
        {
            _cats = await _db.Catalogs.ToListAsync(); _projects = await _db.Projects.ToListAsync(); _items = await _db.Items.ToListAsync();
            _packages = await _db.Packages.ToListAsync(); _legal = await _db.LegalDocuments.ToListAsync(); _contracts = await _db.Contracts.ToListAsync();
            _addenda = await _db.Addenda.ToListAsync(); _boq = await _db.Boq.ToListAsync(); _schedule = await _db.Schedule.ToListAsync();
            _volumes = await _db.Volumes.ToListAsync(); _payments = await _db.Payments.ToListAsync(); _plans = await _db.PayPlans.ToListAsync();
            _batches = await _db.VolumeBatches.ToListAsync(); _capitals = await _db.CapitalPlans.ToListAsync();
            _marked = (await _db.ApprovalLogs.AsNoTracking().Where(a => a.Action == Mark).Select(a => new { a.Collection, a.RecordId }).ToListAsync())
                .Select(a => (a.Collection, a.RecordId)).ToHashSet();
        }

        private void Err(string m) => Errors.Add(new(_sheet, _line, m));
        /// <summary>Mã dự án / gói thầu / số hợp đồng có dòng khai báo bị lỗi trong tệp (để báo đúng nguyên nhân ở các trang sau).</summary>
        private readonly HashSet<string> _failed = new();
                private void Warn(string m) => Warnings.Add(new(_sheet, _line, m));

        // ---------- đọc giá trị ô ----------
        private JsonElement _row;
        private string S(string k) => _row.TryGetProperty(k, out var v) ? v.ValueKind switch
        {
            JsonValueKind.String => System.Text.RegularExpressions.Regex.Replace(v.GetString() ?? "", @"\s+", " ").Trim(),
            JsonValueKind.Number => v.GetRawText(),
            _ => ""
        } : "";
        private string? SN(string k) { var s = S(k); return s.Length == 0 ? null : s; }
        private string Req(string k, string label) { var s = S(k); if (s.Length == 0) Err($"Thiếu \"{label}\""); return s; }
        private double? Num(string k, string label, bool req = false)
        {
            if (_row.TryGetProperty(k, out var v) && v.ValueKind == JsonValueKind.Number) return v.GetDouble();
            var s = S(k);
            if (s.Length == 0) { if (req) Err($"Thiếu \"{label}\""); return null; }
            if (double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var d)) return d;
            Err($"\"{label}\" không phải số"); return null;
        }
        private decimal? Money(string k, string label, bool req = false) { var d = Num(k, label, req); return d is null ? null : Math.Round((decimal)d.Value); }
        private DateOnly? Date(string k, string label, bool req = false)
        {
            var s = S(k);
            if (s.Length == 0) { if (req) Err($"Thiếu \"{label}\""); return null; }
            if (DateOnly.TryParseExact(s, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d)) return d;
            Err($"\"{label}\" không đúng ngày dd/mm/yyyy"); return null;
        }
        private static string Fd(DateOnly d) => d.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

        /// <summary>Khóa so sánh không dấu, không phân biệt hoa thường, bỏ khoảng trắng và dấu câu.</summary>
        public static string K(string? s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            var t = s.Replace('đ', 'd').Replace('Đ', 'D').Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (var ch in t)
                if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark && char.IsLetterOrDigit(ch)) sb.Append(char.ToLowerInvariant(ch));
            return sb.ToString();
        }
        /// <summary>Mã bản ghi mới ổn định theo khóa nghiệp vụ (nhập lại cùng tệp không sinh bản ghi trùng).</summary>
        private static string NewId(string prefix, string key) =>
            "dk-" + prefix + "-" + Convert.ToHexString(SHA1.HashData(Encoding.UTF8.GetBytes(key))).ToLowerInvariant()[..16];

        /// <summary>Giá trị phải có trong danh mục (nếu danh mục loại đó đã khai báo); trả giá trị đúng chính tả của danh mục.</summary>
        private string? Cat(string type, string? value, string label, bool req = false)
        {
            if (string.IsNullOrEmpty(value)) { if (req) Err($"Thiếu \"{label}\""); return value; }
            var list = _cats.Where(c => c.Type == type).ToList();
            if (list.Count == 0) return value;
            var hit = list.FirstOrDefault(c => K(c.Value) == K(value));
            if (hit is null) { Err($"\"{label}\" = \"{value}\" chưa có trong danh mục \"{type}\" (thêm ở trang Danh mục hoặc màn hình Danh mục dùng chung)"); return value; }
            return hit.Value;
        }

        private Project? Proj(string code)
        {
            if (code.Length == 0) return null;
            var p = _projects.FirstOrDefault(x => K(x.Code) == K(code));
            if (p is null) Err(_failed.Contains("pj|" + K(code)) ? $"Dự án \"{code}\" chưa ghi được do dòng khai báo ở trang Dự án đang lỗi"
                : $"Không có dự án mã \"{code}\" (khai báo ở trang Dự án hoặc đã có trên hệ thống)");
            return p;
        }
        private Package? Pkg(Project? p, string code, bool req)
        {
            if (code.Length == 0) { if (req) Err("Thiếu \"Mã gói thầu\""); return null; }
            if (p is null) return null;
            var k = _packages.FirstOrDefault(x => x.ProjectId == p.Id && K(x.Code) == K(code));
            if (k is null) Err(_failed.Contains("gt|" + K(p.Code) + "|" + K(code)) ? $"Gói thầu \"{code}\" chưa ghi được do dòng khai báo ở trang Gói thầu đang lỗi"
                : $"Dự án {p.Code} không có gói thầu \"{code}\"");
            return k;
        }
        private Contract? Ctr(string number)
        {
            if (number.Length == 0) return null;
            var l = _contracts.Where(x => K(x.Number) == K(number)).ToList();
            if (l.Count == 0) { Err(_failed.Contains("hd|" + K(number)) ? $"Hợp đồng số \"{number}\" chưa ghi được do dòng khai báo ở trang Hợp đồng đang lỗi"
                : $"Không có hợp đồng số \"{number}\" (khai báo ở trang Hợp đồng hoặc đã có trên hệ thống)"); return null; }
            if (l.Count > 1) { Err($"Có {l.Count} hợp đồng cùng số \"{number}\" trên hệ thống, không xác định được hợp đồng nào"); return null; }
            return l[0];
        }
        private string? PidOfContract(Contract c) => c.ProjectId ?? _packages.FirstOrDefault(k => k.Id == c.PackageId)?.ProjectId;

        private static readonly HashSet<string> Skip = new() { "id", "updatedAt", "updatedBy", "status" };
        /// <summary>Trạng thái "đã xong" của hồ sơ có trình duyệt: số liệu đầu kỳ được ghi nhận đã duyệt (hồ sơ thanh toán: đã chi).</summary>
        private static string? Done(string col) => col switch { "payments" => "Đã thanh toán", "addenda" or "schedule" or "vbatches" => "Đã duyệt", _ => null };
        private static string Snap(object o)
        {
            var e = JsonSerializer.SerializeToElement(o, o.GetType(), JsonConfig.Options);
            return string.Join("|", e.EnumerateObject().Where(p => !Skip.Contains(p.Name)).Select(p => p.Name + "=" + p.Value.GetRawText()));
        }

        /// <summary>Ghi một bản ghi: mới thì thêm, đã có thì cập nhật các thuộc tính (đếm thêm / cập nhật / không đổi).</summary>
        private void Upsert<T>(string col, List<T> list, T? existing, string newId, Action<T> fill, string? pid = null, bool mark = false) where T : EntityBase, new()
        {
            var c = Counts[col];
            if (existing is null)
            {
                var o = new T { Id = newId }; fill(o);
                if (Errors.Any(e => e.Sheet == _sheet && e.Line == _line)) return;
                o.UpdatedAt = _now; o.UpdatedBy = _uc.User!.Username;
                if (mark && Done(col) is { } d0) Workflow.SetStatus(o, d0);
                _db.Add(o); list.Add(o); c.Add++;
                if (mark) Stamp(col, o.Id, null, pid, "Nhập số liệu đầu kỳ");
                return;
            }
            var before = Snap(existing);
            var prevState = Workflow.StatusOf(existing);
            fill(existing);
            if (Errors.Any(e => e.Sheet == _sheet && e.Line == _line)) return;
            var marked = _marked.Contains((col, existing.Id));
            if (Snap(existing) == before && (!mark || marked)) { c.Same++; return; }
            existing.UpdatedAt = _now; existing.UpdatedBy = _uc.User!.Username;
            if (mark && Done(col) is { } d1) Workflow.SetStatus(existing, d1);
            c.Update++;
            if (mark) Stamp(col, existing.Id, prevState, pid, marked ? "Cập nhật số liệu đầu kỳ" : "Nhập số liệu đầu kỳ");
        }

        private void Stamp(string col, string id, string? from, string? pid, string what)
        {
            _db.ApprovalLogs.Add(new ApprovalLog
            {
                Id = "apr-" + Guid.NewGuid().ToString("N")[..20], Collection = col, RecordId = id, ProjectId = pid, Action = Mark, Target = what,
                FromStatus = from, ToStatus = Done(col), By = _uc.User!.Username, ByName = _uc.User.Name, At = _now, UpdatedAt = _now, UpdatedBy = _uc.User.Username,
                Note = $"{what} đến {Fd(_cutoff)}" + (string.IsNullOrEmpty(_basis) ? "" : " · Căn cứ: " + _basis)
            });
            _marked.Add((col, id));
        }

        /// <summary>Hồ sơ nghiệp vụ đã nhập theo luồng thường thì không ghi đè bằng số liệu đầu kỳ.</summary>
        private bool Foreign(string col, EntityBase? e, string what)
        {
            if (e is null || _marked.Contains((col, e.Id)) || e.Id.StartsWith("dk-")) return false;
            if (string.IsNullOrEmpty(Workflow.StatusOf(e))) return false; // hồ sơ chưa có trạng thái trình duyệt: coi như đầu kỳ
            Err($"{what} đã được nhập trên phần mềm theo nghiệp vụ thường, không ghi đè bằng số liệu đầu kỳ (xóa dòng này khỏi tệp hoặc điều chỉnh trực tiếp hồ sơ đó)");
            return true;
        }

        private void AfterCutoff(DateOnly? d, string label)
        {
            if (d is { } x && x > _cutoff) Err($"\"{label}\" {Fd(x)} sau mốc chốt {Fd(_cutoff)}: phát sinh sau mốc chốt nhập như nghiệp vụ thường, không đưa vào số liệu đầu kỳ");
        }

        public void Run(string key, string label, List<JsonElement> rows)
        {
            _sheet = label; Counts[key] = new SheetCount();
            var seen = new Dictionary<string, int>();
            foreach (var row in rows)
            {
                _row = row;
                _line = row.TryGetProperty("line", out var ln) && ln.ValueKind == JsonValueKind.Number ? ln.GetInt32() : 0;
                var dupKey = key switch
                {
                    "catalogs" => K(S("type")) + "|" + K(S("value")),
                    "projects" => K(S("code")),
                    "items" or "packages" => K(S("projectCode")) + "|" + K(S("code")),
                    "legal" => K(S("projectCode")) + "|" + K(S("number")),
                    "contracts" => K(S("number")),
                    "addenda" => K(S("contractNumber")) + "|" + K(S("number")),
                    "boq" => K(S("contractNumber")) + "|" + K(S("code")),
                    "schedule" => K(S("projectCode")) + "|" + K(S("packageCode")) + "|" + K(S("name")),
                    "volumes" => K(S("contractNumber")) + "|" + K(S("boqCode")),
                    "payments" => K(S("contractNumber")) + "|" + K(S("number")),
                    "payplans" => K(S("contractNumber")) + "|" + K(S("phase")),
                    "capitals" => K(S("projectCode")) + "|" + K(S("year")) + "|" + K(S("kind")) + "|" + K(S("number")),
                    _ => ""
                };
                if (dupKey.Trim('|').Length > 0)
                {
                    if (seen.TryGetValue(dupKey, out var first)) { Err($"Trùng với dòng {first} trong cùng trang"); continue; }
                    seen[dupKey] = _line;
                }
                var n0 = Errors.Count;
                switch (key)
                {
                    case "catalogs": Catalogs(); break;
                    case "projects": Projects(); break;
                    case "items": Items(); break;
                    case "packages": Packages(); break;
                    case "legal": Legal(); break;
                    case "contracts": Contracts(); break;
                    case "addenda": Addenda(); break;
                    case "boq": Boq(); break;
                    case "schedule": Schedule(); break;
                    case "volumes": Volumes(); break;
                    case "payments": Payments(); break;
                    case "payplans": PayPlans(); break;
                    case "capitals": Capitals(); break;
                }
                if (Errors.Count > n0)
                {
                    if (key == "projects") _failed.Add("pj|" + K(S("code")));
                    else if (key == "packages") _failed.Add("gt|" + K(S("projectCode")) + "|" + K(S("code")));
                    else if (key == "contracts") _failed.Add("hd|" + K(S("number")));
                }
            }
            if (key == "payments") PaymentTotals();
        }

        private void Catalogs()
        {
            var type = Req("type", "Loại danh mục"); var value = Req("value", "Giá trị"); var order = Num("order", "Thứ tự");
            if (type.Length == 0 || value.Length == 0) return;
            var ex = _cats.FirstOrDefault(c => c.Type == type && K(c.Value) == K(value));
            Upsert("catalogs", _cats, ex, NewId("cat", type + "|" + K(value)), c =>
            {
                c.Type = type; c.Value = value;
                if (order is not null) c.Order = (int)order.Value;
                else if (ex is null) c.Order = _cats.Where(x => x.Type == type).Select(x => x.Order).DefaultIfEmpty(0).Max() + 1;
            });
        }

        private void Projects()
        {
            var code = Req("code", "Mã dự án"); var name = Req("name", "Tên dự án");
            if (code.Length == 0) return;
            var ex = _projects.FirstOrDefault(p => K(p.Code) == K(code));
            var group = Cat("Nhóm dự án", SN("group"), "Nhóm dự án"); var status = Cat("Trạng thái dự án", SN("status"), "Trạng thái");
            var phase = Cat("Giai đoạn", SN("phase"), "Giai đoạn");
            var boardRole = Cat("Vai trò của Ban", SN("boardRole"), "Vai trò của Ban"); var mgmt = Cat("Hình thức quản lý dự án", SN("mgmtForm"), "Hình thức quản lý dự án");
            var kind = Cat("Loại dự án", SN("projectKind"), "Loại dự án"); var report = Cat("Hồ sơ dự án", SN("reportType"), "Hồ sơ dự án");
            var tmdt = Money("tmdt", "Tổng mức đầu tư"); var start = Date("start", "Ngày bắt đầu"); var end = Date("end", "Ngày kết thúc");
            if (start is not null && end is not null && end < start) Err("Ngày kết thúc trước ngày bắt đầu");
            if (tmdt is < 0) Err("Tổng mức đầu tư không được âm");
            Upsert("projects", _projects, ex, NewId("pj", K(code)), p =>
            {
                p.Code = code; p.Name = name; p.Group = group; p.Tmdt = tmdt; p.Capital = SN("capital"); p.Owner = SN("owner"); p.Location = SN("location");
                p.Start = start; p.End = end; p.Status = status ?? p.Status ?? "Đang thực hiện"; p.Phase = phase; p.Decision = SN("decision"); p.Desc = SN("desc") ?? p.Desc;
                p.BoardRole = boardRole ?? p.BoardRole; p.DecisionMaker = SN("decisionMaker") ?? p.DecisionMaker; p.MgmtForm = mgmt ?? p.MgmtForm;
                p.ProjectKind = kind ?? p.ProjectKind; p.ReportType = report ?? p.ReportType;
            });
        }

        private void Items()
        {
            var p = Proj(Req("projectCode", "Mã dự án")); var code = Req("code", "Mã hạng mục"); var name = Req("name", "Tên hạng mục");
            var area = Num("area", "Diện tích"); var floors = Num("floors", "Số tầng");
            if (p is null || code.Length == 0) return;
            var ex = _items.FirstOrDefault(i => i.ProjectId == p.Id && K(i.Code) == K(code));
            Upsert("items", _items, ex, NewId("hm", p.Id + "|" + K(code)), i =>
            {
                i.ProjectId = p.Id; i.Code = code; i.Name = name; i.Structure = SN("structure"); i.Area = area;
                i.Floors = floors is null ? null : (int)floors.Value; i.Desc = SN("desc") ?? i.Desc;
            });
        }

        private void Packages()
        {
            var p = Proj(Req("projectCode", "Mã dự án")); var code = Req("code", "Mã gói thầu"); var name = Req("name", "Tên gói thầu");
            var type = Cat("Loại gói thầu", SN("type"), "Loại gói thầu"); var method = Cat("Hình thức lựa chọn nhà thầu", SN("method"), "Hình thức LCNT");
            var status = Cat("Trạng thái gói thầu", SN("status"), "Trạng thái"); var est = Money("estimate", "Giá gói thầu");
            if (p is null || code.Length == 0) return;
            var ex = _packages.FirstOrDefault(k => k.ProjectId == p.Id && K(k.Code) == K(code));
            Upsert("packages", _packages, ex, NewId("gt", p.Id + "|" + K(code)), k =>
            {
                k.ProjectId = p.Id; k.Code = code; k.Name = name; k.Type = type; k.Method = method; k.Estimate = est;
                k.Status = status ?? k.Status; k.Duration = SN("duration"); k.Phase = Phases.Normalize(SN("phase")) ?? k.Phase;
            });
        }

        private void Legal()
        {
            var p = Proj(Req("projectCode", "Mã dự án")); var k = Pkg(p, S("packageCode"), false);
            var type = Cat("Loại hồ sơ pháp lý", SN("type"), "Loại hồ sơ", true); var number = Req("number", "Số hiệu");
            var date = Date("date", "Ngày ban hành"); var valid = Date("validUntil", "Hiệu lực đến");
            if (p is null || number.Length == 0) return;
            var ex = _legal.FirstOrDefault(l => l.ProjectId == p.Id && K(l.Number) == K(number));
            Upsert("legal", _legal, ex, NewId("pl", p.Id + "|" + K(number)), l =>
            {
                l.ProjectId = p.Id; l.PackageId = k?.Id; l.Type = type; l.Number = number; l.Date = date; l.Issuer = SN("issuer");
                l.Title = SN("title"); l.ValidUntil = valid;
            });
        }

        private void Contracts()
        {
            var p = Proj(Req("projectCode", "Mã dự án")); var k = Pkg(p, S("packageCode"), true);
            var number = Req("number", "Số hợp đồng"); var contractor = Req("contractor", "Nhà thầu");
            var ctype = Cat("Loại hợp đồng", SN("ctype"), "Loại hợp đồng");
            var value = Money("value", "Giá trị hợp đồng", true); var sign = Date("signDate", "Ngày ký");
            var start = Date("start", "Ngày bắt đầu"); var end = Date("end", "Ngày kết thúc");
            var gu = Date("guaranteeUntil", "Bảo lãnh thực hiện hiệu lực đến"); var agu = Date("advanceGuaranteeUntil", "Bảo lãnh tạm ứng hiệu lực đến");
            var rate = Num("advanceRate", "Tỷ lệ tạm ứng");
            if (start is not null && end is not null && end < start) Err("Ngày kết thúc trước ngày bắt đầu");
            if (rate is < 0 or > 100) Err("Tỷ lệ tạm ứng phải từ 0 đến 100");
            if (value is <= 0) Err("Giá trị hợp đồng phải lớn hơn 0");
            if (p is null || k is null || number.Length == 0) return;
            var same = _contracts.Where(c => K(c.Number) == K(number)).ToList();
            if (same.Count > 1) { Err($"Có {same.Count} hợp đồng cùng số \"{number}\" trên hệ thống"); return; }
            var ex = same.FirstOrDefault();
            if (ex is not null && PidOfContract(ex) != p.Id) { Err($"Số hợp đồng \"{number}\" đã có ở dự án khác"); return; }
            if (k.Estimate is > 0 && value > k.Estimate) Warn($"Giá trị hợp đồng vượt giá gói thầu {k.Code}");
            Upsert("contracts", _contracts, ex, NewId("hd", K(number)), c =>
            {
                c.ProjectId = p.Id; c.PackageId = k.Id; c.Number = number; c.Contractor = contractor; c.SignDate = sign; c.Value = value;
                c.Start = start; c.End = end; c.Ctype = ctype; c.Guarantee = SN("guarantee"); c.GuaranteeUntil = gu;
                c.AdvanceGuaranteeUntil = agu; c.AdvanceRate = rate; c.Note = SN("note") ?? c.Note;
            });
        }

        private void Addenda()
        {
            var c = Ctr(Req("contractNumber", "Số hợp đồng")); var number = Req("number", "Số phụ lục");
            var date = Date("date", "Ngày ký"); var vc = Money("valueChange", "Giá trị tăng/giảm"); var dc = Num("daysChange", "Số ngày gia hạn");
            AfterCutoff(date, "Ngày ký");
            if (c is null || number.Length == 0) return;
            var ex = _addenda.FirstOrDefault(a => a.ContractId == c.Id && K(a.Number) == K(number));
            if (Foreign("addenda", ex, $"Phụ lục {number}")) return;
            Upsert("addenda", _addenda, ex, NewId("pl", c.Id + "|" + K(number)), a =>
            {
                a.ContractId = c.Id; a.Number = number; a.Date = date; a.Content = SN("content"); a.ValueChange = vc;
                a.DaysChange = dc is null ? null : (int)dc.Value;
            }, PidOfContract(c), true);
        }

        private void Boq()
        {
            var c = Ctr(Req("contractNumber", "Số hợp đồng")); var code = Req("code", "Mã hiệu"); var name = Req("name", "Nội dung công việc");
            var unit = Cat("Đơn vị tính", SN("unit"), "Đơn vị tính", true);
            var qty = Num("qty", "Khối lượng hợp đồng", true); var price = Money("price", "Đơn giá", true);
            if (qty is <= 0) Err("Khối lượng hợp đồng phải lớn hơn 0");
            if (price is < 0) Err("Đơn giá không được âm");
            if (c is null || code.Length == 0) return;
            var ex = _boq.FirstOrDefault(b => b.ContractId == c.Id && K(b.Code) == K(code));
            Upsert("boq", _boq, ex, NewId("kl", c.Id + "|" + K(code)), b =>
            {
                b.ContractId = c.Id; b.Code = code; b.Section = SN("section"); b.Name = name; b.Unit = unit; b.Qty = qty; b.Price = price;
            });
        }

        private void Schedule()
        {
            var p = Proj(Req("projectCode", "Mã dự án")); var k = Pkg(p, S("packageCode"), true); var name = Req("name", "Tên công việc");
            var ps = Date("planStart", "Bắt đầu kế hoạch", true); var pe = Date("planEnd", "Kết thúc kế hoạch", true);
            var a1 = Date("actualStart", "Bắt đầu thực tế"); var a2 = Date("actualEnd", "Kết thúc thực tế");
            var weight = Num("weight", "Trọng số"); var prog = Num("progress", "Hoàn thành (%)");
            if (ps is not null && pe is not null && pe < ps) Err("Kết thúc kế hoạch trước bắt đầu kế hoạch");
            if (prog is < 0 or > 100) Err("Hoàn thành (%) phải từ 0 đến 100");
            if (weight is < 0) Err("Trọng số không được âm");
            AfterCutoff(a1, "Bắt đầu thực tế"); AfterCutoff(a2, "Kết thúc thực tế");
            var itemCode = S("itemCode"); ConstructionItem? it = null;
            if (itemCode.Length > 0 && p is not null)
            {
                it = _items.FirstOrDefault(i => i.ProjectId == p.Id && K(i.Code) == K(itemCode));
                if (it is null) Warn($"Không có hạng mục công trình \"{itemCode}\", bỏ qua liên kết hạng mục");
            }
            if (p is null || k is null || name.Length == 0) return;
            var ex = _schedule.FirstOrDefault(s => s.PackageId == k.Id && K(s.Name) == K(name));
            if (Foreign("schedule", ex, $"Công việc \"{name}\"")) return;
            Upsert("schedule", _schedule, ex, NewId("td", k.Id + "|" + K(name)), s =>
            {
                s.ProjectId = p.Id; s.PackageId = k.Id; s.ItemId = it?.Id ?? s.ItemId; s.Name = name; s.PlanStart = ps; s.PlanEnd = pe;
                s.ActualStart = a1; s.ActualEnd = a2; s.Weight = weight; s.Progress = prog ?? 0;
                var cut = _cutoff.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                s.History = s.History.Where(h => h.Date != cut || h.Note != "Số liệu đầu kỳ").ToList();
                if (prog is > 0) s.History.Add(new ProgressPoint { Date = cut, Progress = prog, Note = "Số liệu đầu kỳ", By = _uc.User!.Name });
                s.History = s.History.OrderBy(h => h.Date).ToList();
            }, p.Id, true);
        }

        private void Volumes()
        {
            var c = Ctr(Req("contractNumber", "Số hợp đồng")); var code = Req("boqCode", "Mã hiệu");
            var done = Num("doneQty", "KL thực hiện lũy kế"); var acc = Num("acceptedQty", "KL nghiệm thu lũy kế", true);
            if (done is < 0 || acc is < 0) Err("Khối lượng không được âm");
            if (c is null || code.Length == 0) return;
            var b = _boq.FirstOrDefault(x => x.ContractId == c.Id && K(x.Code) == K(code));
            if (b is null) { Err($"Hợp đồng {c.Number} không có công việc mã hiệu \"{code}\" trong bảng khối lượng"); return; }
            if (done is not null && acc is not null && acc > done) Warn("KL nghiệm thu lớn hơn KL thực hiện; lấy KL thực hiện bằng KL nghiệm thu");
            var d = done is null || (acc is not null && acc > done) ? acc : done;
            if (acc is not null && b.Qty is > 0 && acc > b.Qty) Warn($"KL nghiệm thu lũy kế {acc:0.###} vượt KL hợp đồng {b.Qty:0.###} (chỉ cảnh báo)");
            // Một đợt nghiệm thu "Lũy kế đến <mốc chốt>" cho mỗi hợp đồng, ghi nhận đã duyệt
            var bid = NewId("dot", c.Id);
            var bt = _batches.FirstOrDefault(x => x.Id == bid);
            var bname = "Lũy kế đến " + Fd(_cutoff);
            if (Errors.Any(e => e.Sheet == _sheet && e.Line == _line)) return;
            if (bt is null)
            {
                bt = new VolumeBatch { Id = bid, ContractId = c.Id, Name = bname, Date = _cutoff, Note = "Số liệu đầu kỳ" + (string.IsNullOrEmpty(_basis) ? "" : " · " + _basis), Status = "Đã duyệt", UpdatedAt = _now, UpdatedBy = _uc.User!.Username };
                _db.Add(bt); _batches.Add(bt); Stamp("vbatches", bt.Id, null, PidOfContract(c), "Nhập số liệu đầu kỳ");
            }
            else if (bt.Name != bname || bt.Date != _cutoff) { bt.Name = bname; bt.Date = _cutoff; bt.UpdatedAt = _now; bt.UpdatedBy = _uc.User!.Username; }
            var id = NewId("vl", b.Id);
            var ex = _volumes.FirstOrDefault(v => v.Id == id);
            Upsert("volumes", _volumes, ex, id, v =>
            {
                v.BoqId = b.Id; v.ContractId = c.Id; v.BatchId = bt.Id; v.Date = _cutoff; v.Period = bname;
                v.DoneQty = d; v.AcceptedQty = acc; v.Note = SN("note") ?? "Số liệu đầu kỳ";
            }, PidOfContract(c), true);
        }

        private readonly Dictionary<string, decimal> _paid = new();
        private void Payments()
        {
            var c = Ctr(Req("contractNumber", "Số hợp đồng")); var number = Req("number", "Số hồ sơ, chứng từ");
            var kind = Cat("Loại thanh toán", SN("kind"), "Loại", true);
            var amount = Money("amount", "Số tiền", true); var date = Date("date", "Ngày đề nghị"); var paid = Date("paidDate", "Ngày chi", true);
            if (amount is <= 0) Err("Số tiền phải lớn hơn 0");
            AfterCutoff(paid, "Ngày chi"); AfterCutoff(date, "Ngày đề nghị");
            if (c is null || number.Length == 0) return;
            var ex = _payments.FirstOrDefault(x => x.ContractId == c.Id && K(x.Number) == K(number));
            if (Foreign("payments", ex, $"Hồ sơ thanh toán {number}")) return;
            Upsert("payments", _payments, ex, NewId("tt", c.Id + "|" + K(number)), x =>
            {
                x.ContractId = c.Id; x.Number = number; x.Kind = kind; x.Amount = amount; x.Date = date ?? paid; x.PaidDate = paid;
                x.Content = SN("content") ?? x.Content;
            }, PidOfContract(c), true);
            if (Errors.All(e => e.Sheet != _sheet || e.Line != _line) && !K(kind).Contains("thuhoi")) _paid[c.Id] = _paid.GetValueOrDefault(c.Id) + (amount ?? 0);
        }

        /// <summary>Tổng tạm ứng, thanh toán đầu kỳ vượt giá trị hợp đồng (kể cả phụ lục): chỉ cảnh báo.</summary>
        private void PaymentTotals()
        {
            foreach (var (cid, total) in _paid)
            {
                var c = _contracts.First(x => x.Id == cid);
                var value = (c.Value ?? 0) + _addenda.Where(a => a.ContractId == cid && (string.IsNullOrEmpty(a.Status) || a.Status == "Đã duyệt")).Sum(a => a.ValueChange ?? 0);
                if (total > value) { _line = 0; Warn($"Hợp đồng {c.Number}: tổng tạm ứng, thanh toán đầu kỳ {total:#,0} đ vượt giá trị hợp đồng {value:#,0} đ (chỉ cảnh báo)"); }
            }
        }

        private void PayPlans()
        {
            var c = Ctr(Req("contractNumber", "Số hợp đồng")); var phase = Req("phase", "Đợt");
            var date = Date("planDate", "Ngày dự kiến", true); var amount = Money("amount", "Số tiền", true);
            if (amount is <= 0) Err("Số tiền phải lớn hơn 0");
            if (c is null || phase.Length == 0) return;
            var ex = _plans.FirstOrDefault(x => x.ContractId == c.Id && K(x.Phase) == K(phase));
            Upsert("payplans", _plans, ex, NewId("kh", c.Id + "|" + K(phase)), x =>
            {
                x.ContractId = c.Id; x.Phase = phase; x.PlanDate = date; x.Amount = amount; x.Note = SN("note") ?? x.Note;
            });
        }

        /// <summary>Kế hoạch vốn đầu tư công của dự án (riêng cấp xã): trung hạn, giao năm, bổ sung, điều chỉnh giảm; kịch bản giải ngân theo quý.</summary>
        private void Capitals()
        {
            var p = Proj(Req("projectCode", "Mã dự án")); var yr = Num("year", "Năm kế hoạch", true);
            var kind = Cat("Loại kế hoạch vốn", SN("kind"), "Loại kế hoạch", true); var source = Cat("Nguồn vốn", SN("source"), "Nguồn vốn");
            var amount = Money("amount", "Giá trị", true); var date = Date("date", "Ngày quyết định");
            double? Pct(string k, string l) { var v = Num(k, l); if (v is < 0 or > 100) Err($"\"{l}\" phải từ 0 đến 100"); return v; }
            var q1 = Pct("targetQ1", "Giải ngân hết quý I (%)"); var q2 = Pct("targetQ2", "Giải ngân hết quý II (%)"); var q3 = Pct("targetQ3", "Giải ngân hết quý III (%)");
            if (yr is { } y0 && (y0 < 2000 || y0 > 2100)) Err("Năm kế hoạch không hợp lệ");
            if (amount is <= 0) Err("Giá trị phải lớn hơn 0");
            if (p is null || yr is null || string.IsNullOrEmpty(kind)) return;
            var year = (int)yr.Value; var number = SN("number");
            var ex = _capitals.FirstOrDefault(x => x.ProjectId == p.Id && x.Year == year && K(x.Kind) == K(kind) && K(x.Number) == K(number));
            Upsert("capitals", _capitals, ex, NewId("vo", p.Id + "|" + year + "|" + K(kind) + "|" + K(number)), x =>
            {
                x.ProjectId = p.Id; x.Year = year; x.Kind = kind; x.Source = source ?? x.Source; x.Amount = amount; x.Number = number; x.Date = date;
                x.TargetQ1 = q1 ?? x.TargetQ1; x.TargetQ2 = q2 ?? x.TargetQ2; x.TargetQ3 = q3 ?? x.TargetQ3; x.Note = SN("note") ?? x.Note;
            });
        }
    }

    // ===================== DỌN DỮ LIỆU CHẠY THỬ =====================

    public record PurgeRequest(string? Confirm);
    public const string PurgeWord = "XOA DU LIEU";

    /// <summary>
    /// Trước khi nhập dữ liệu chính thức: sao lưu lên máy chủ, rồi xóa toàn bộ dữ liệu nghiệp vụ (dự án và mọi dữ liệu con,
    /// lịch sử trình duyệt, kế hoạch vốn, giải phóng mặt bằng, nghiệm thu, quyết toán; tệp đính kèm chuyển vào thùng rác) và tài khoản mẫu. Giữ nhóm quyền, danh mục, hướng dẫn sử dụng,
    /// tài khoản thật, thiết lập và nhật ký hoạt động.
    /// </summary>
    [HttpPost("purge")]
    public async Task<IActionResult> Purge([FromBody] PurgeRequest r)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được dọn dữ liệu.");
        if ((r.Confirm ?? "").Trim().ToUpperInvariant() != PurgeWord) return Error(400, $"Gõ đúng \"{PurgeWord}\" để xác nhận.");
        string backup;
        try { backup = (await _bk.RunAsync(Db)).name; }
        catch (Exception ex) { return Error(500, "Không sao lưu được nên chưa dọn dữ liệu: " + ex.Message); }

        var counts = new Dictionary<string, int>
        {
            ["Dự án"] = await Db.Projects.CountAsync(), ["Hợp đồng"] = await Db.Contracts.CountAsync(),
            ["Hồ sơ thanh toán"] = await Db.Payments.CountAsync(), ["Kế hoạch vốn"] = await Db.CapitalPlans.CountAsync(), ["Tài khoản mẫu"] = await Db.Users.CountAsync(u => u.Sample),
        };
        var business = Collections.All.Where(c => c.Module is not "quan-tri").Select(c => c.Name).ToHashSet();
        var now = DateTime.UtcNow;
        var sampleIds = await Db.Users.Where(u => u.Sample).Select(u => u.Id).ToListAsync();
        var by = Uc.User.Name + " (dọn dữ liệu chạy thử)";
        // SQL Server bật thử lại khi lỗi kết nối: giao dịch tự mở phải chạy trong chiến lược thực thi.
        Db.ChangeTracker.Clear();
        var strategy = Db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            Db.ChangeTracker.Clear();
            await using var tx = await Db.Database.BeginTransactionAsync();
            foreach (var a in await Db.Attachments.Where(a => a.DeletedAt == null && business.Contains(a.Collection)).ToListAsync())
            { a.DeletedAt = now; a.DeletedBy = by; }
            await Db.SaveChangesAsync();
            await Db.ApprovalLogs.ExecuteDeleteAsync();
            await Db.Volumes.ExecuteDeleteAsync(); await Db.VolumeBatches.ExecuteDeleteAsync(); await Db.Boq.ExecuteDeleteAsync(); await Db.Payments.ExecuteDeleteAsync(); await Db.PayPlans.ExecuteDeleteAsync();
            await Db.CapitalPlans.ExecuteDeleteAsync(); await Db.Acceptances.ExecuteDeleteAsync(); await Db.Settlements.ExecuteDeleteAsync(); await Db.Clearances.ExecuteDeleteAsync();
            await Db.Addenda.ExecuteDeleteAsync(); await Db.Contracts.ExecuteDeleteAsync(); await Db.Schedule.ExecuteDeleteAsync(); await Db.Diaries.ExecuteDeleteAsync();
            await Db.LegalDocuments.ExecuteDeleteAsync(); await Db.ModelFiles.ExecuteDeleteAsync(); await Db.Items.ExecuteDeleteAsync(); await Db.Packages.ExecuteDeleteAsync();
            await Db.Tasks.ExecuteDeleteAsync(); await Db.Projects.ExecuteDeleteAsync();
            await Db.Users.Where(u => u.Sample).ExecuteDeleteAsync();
            await Db.Settings.Where(s => s.Key == SettingKey).ExecuteDeleteAsync();
            // Phạm vi dự án/gói thầu của nhóm, tài khoản trỏ tới dự án đã xóa
            foreach (var g in await Db.Groups.ToListAsync()) if (g.Scope.Count > 0) g.Scope = new();
            Uc.Log("Dọn dữ liệu chạy thử", "Quản trị hệ thống",
                string.Join(", ", counts.Select(c => $"{c.Key}: {c.Value}")) + $" · bản sao lưu trước khi dọn: {backup}");
            await Db.SaveChangesAsync();
            await tx.CommitAsync();
        });
        return Ok(new { backup, counts });
    }
}

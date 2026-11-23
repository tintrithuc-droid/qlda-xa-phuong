using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Controllers;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Bản 1.10.11: chép TỆP ĐÍNH KÈM của e-work cũ sang QLDA (lần nạp 22/11 chỉ chép chữ, bỏ sót tệp: anh Trí không thấy bằng cấp).
/// Đọc cột DinhKem (và MatTruocCCCD, MatSauCCCD) trong ework_xuat.json, cùng bảng LogFileUploaders (UrlFile gắn RefId, RefTableName),
/// tìm tệp thật trong thư mục site e-work trên máy chủ, chép vào kho tệp QLDA và gắn vào đúng bản ghi đã nạp:
///   bằng cấp, khen thưởng, kỷ luật, CCCD -> hồ sơ nhân sự (Attachments "ho-so-ns", không gửi kèm /api/data);
///   lịch họp, thông báo, đề xuất -> Attachments "vp-lich-hop", "vp-thong-bao", "vp-de-xuat" (xem qua API Văn phòng);
///   công việc -> Attachments "tasks" (như tệp công việc thường).
/// Chạy lại không chép trùng (khóa: bản ghi + tên tệp). Chỉ ĐỌC thư mục e-work.
/// Dòng lệnh: --nhap-tep-ework &lt;ework_xuat.json&gt; --thu-muc &lt;thư mục site e-work&gt;[;thư mục khác] [--thu]
/// </summary>
public static class EworkFiles
{
    public class Report
    {
        public Dictionary<string, int> Copied { get; } = new();
        public Dictionary<string, int> Missing { get; } = new();
        public Dictionary<string, int> NoTarget { get; } = new();
        public int Skipped { get; set; }
        public long Bytes { get; set; }
        public List<string> MissingSamples { get; } = new();
        public string Summary => $"Đã chép {Copied.Values.Sum()} tệp ({Bytes / 1048576.0:0.#} MB): " + string.Join(", ", Copied.Select(k => $"{k.Key} {k.Value}"))
            + $". Đã có từ trước {Skipped}. Không tìm thấy tệp {Missing.Values.Sum()}" + (Missing.Count > 0 ? " (" + string.Join(", ", Missing.Select(k => $"{k.Key} {k.Value}")) + ")" : "")
            + $". Không thấy bản ghi đích {NoTarget.Values.Sum()}" + (NoTarget.Count > 0 ? " (" + string.Join(", ", NoTarget.Select(k => $"{k.Key} {k.Value}")) + ")" : "") + ".";
    }

    private static readonly Regex FileTok = new(@"[^\s""'<>|;,\[\]{}]+?\.(pdf|jpe?g|png|gif|webp|bmp|heic|tiff?|docx?|xlsx?|pptx?|txt|rtf|zip|rar|7z|dwg|mp4|mov|xml|csv|odt|ods)(?=$|[\s""'<>|;,\]}?#])", RegexOptions.IgnoreCase);
    private static readonly HashSet<string> Blocked = new(StringComparer.OrdinalIgnoreCase) { ".exe", ".dll", ".bat", ".cmd", ".ps1", ".js", ".html", ".htm", ".svg", ".aspx", ".config" };

    /// <summary>Tách các đường dẫn tệp trong một ô DinhKem (JSON, danh sách phân cách, đường dẫn hoặc URL); kèm tên hiển thị nếu JSON có.</summary>
    public static List<(string path, string? name)> Parse(string? raw)
    {
        var res = new List<(string, string?)>();
        if (string.IsNullOrWhiteSpace(raw)) return res;
        raw = raw.Trim();
        if (raw.StartsWith("[") || raw.StartsWith("{"))
        {
            try
            {
                using var doc = JsonDocument.Parse(raw);
                void Walk(JsonElement e)
                {
                    if (e.ValueKind == JsonValueKind.Array) { foreach (var x in e.EnumerateArray()) Walk(x); return; }
                    if (e.ValueKind == JsonValueKind.String) { foreach (Match m in FileTok.Matches(e.GetString() ?? "")) res.Add((m.Value, null)); return; }
                    if (e.ValueKind != JsonValueKind.Object) return;
                    string? path = null, name = null;
                    foreach (var p in e.EnumerateObject())
                    {
                        var k = p.Name.ToLowerInvariant(); var v = p.Value.ValueKind == JsonValueKind.String ? p.Value.GetString() : null;
                        if (v is null) { if (p.Value.ValueKind is JsonValueKind.Array or JsonValueKind.Object) Walk(p.Value); continue; }
                        if (path is null && Regex.IsMatch(k, "url|path|link|duongdan|src|file$|filepath|location") && FileTok.IsMatch(v)) path = v;
                        else if (name is null && Regex.IsMatch(k, "^(name|ten|filename|tenfile|tentep|originalname|title|displayname)$")) name = v;
                    }
                    if (path is null) foreach (var p in e.EnumerateObject()) if (p.Value.ValueKind == JsonValueKind.String && FileTok.Match(p.Value.GetString() ?? "") is { Success: true } m) { path = m.Value; break; }
                    if (path is not null) res.Add((path, name));
                }
                Walk(doc.RootElement);
                return res.DistinctBy(x => x.Item1).ToList();
            }
            catch (JsonException) { }
        }
        foreach (Match m in FileTok.Matches(raw)) res.Add((m.Value, null));
        return res.DistinctBy(x => x.Item1).ToList();
    }

    /// <summary>Chỉ mục tệp trong các thư mục gốc: theo đường dẫn tương đối và theo tên tệp (chữ thường).</summary>
    public class Index
    {
        public readonly List<string> Roots;
        private readonly Dictionary<string, List<string>> _byName = new(StringComparer.OrdinalIgnoreCase);
        public int Count { get; private set; }
        public Index(IEnumerable<string> roots)
        {
            Roots = roots.Where(Directory.Exists).Select(Path.GetFullPath).ToList();
            foreach (var r in Roots)
                foreach (var f in Directory.EnumerateFiles(r, "*", new EnumerationOptions { RecurseSubdirectories = true, IgnoreInaccessible = true }))
                {
                    var n = Path.GetFileName(f); if (!_byName.TryGetValue(n, out var l)) _byName[n] = l = new(); l.Add(f); Count++;
                }
        }
        public string? Find(string token)
        {
            var t = Uri.UnescapeDataString(token.Trim()).Replace('\\', '/');
            t = Regex.Replace(t, @"^[a-z]+://[^/]+", "", RegexOptions.IgnoreCase); t = t.Split('?', '#')[0].TrimStart('~').TrimStart('/');
            if (t.Length == 0 || t.Contains("..")) return null;
            foreach (var r in Roots)
                foreach (var c in new[] { Path.Combine(r, t), Path.Combine(r, "wwwroot", t) })
                {
                    var full = Path.GetFullPath(c);
                    if (full.StartsWith(r, StringComparison.OrdinalIgnoreCase) && File.Exists(full)) return full;
                }
            // Đường dẫn trong CSDL không khớp thư mục (đổi máy, đổi site): tìm theo tên tệp, nhiều tệp cùng tên thì chọn tệp có đuôi đường dẫn khớp nhất
            var name = Path.GetFileName(t);
            if (!_byName.TryGetValue(name, out var l)) return null;
            if (l.Count == 1) return l[0];
            var segs = t.Split('/', StringSplitOptions.RemoveEmptyEntries);
            return l.OrderByDescending(p => { var ps = p.Replace('\\', '/').Split('/'); int k = 0; while (k < segs.Length && k < ps.Length && string.Equals(segs[^(k + 1)], ps[^(k + 1)], StringComparison.OrdinalIgnoreCase)) k++; return k; }).First();
        }
    }

    private static string? S(JsonElement e, string k) => e.ValueKind == JsonValueKind.Object && e.TryGetProperty(k, out var v) && v.ValueKind != JsonValueKind.Null ? (v.ValueKind == JsonValueKind.String ? v.GetString() : v.ToString()) : null;
    private static IEnumerable<JsonElement> Arr(JsonElement o, string k) => o.ValueKind == JsonValueKind.Object && o.TryGetProperty(k, out var a) && a.ValueKind == JsonValueKind.Array ? a.EnumerateArray() : Enumerable.Empty<JsonElement>();

    /// <summary>Tên hiển thị dễ hiểu: bỏ tiền tố mã ngẫu nhiên e-work thường gắn (guid_, timestamp_).</summary>
    public static string CleanName(string path, string? name)
    {
        var n = !string.IsNullOrWhiteSpace(name) ? name!.Trim() : Path.GetFileName(Uri.UnescapeDataString(path).Replace('\\', '/').Split('?')[0]);
        n = Regex.Replace(n, @"^([0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}|[0-9a-f]{32}|\d{10,17})[_\-\s]+", "", RegexOptions.IgnoreCase);
        if (Path.GetExtension(n).Length == 0) n += Path.GetExtension(path.Split('?')[0]);
        return n.Length > 300 ? n[^300..] : n;
    }

    public static async Task<Report> Run(AppDbContext db, FileStore store, JsonElement root, Index idx, string by, bool dryRun = false)
    {
        var rep = new Report();
        var lt = root.TryGetProperty("luutru", out var l0) && l0.ValueKind == JsonValueKind.Object ? l0 : root;
        IEnumerable<JsonElement> Luu(string t) => Arr(lt, t);

        var emps = await db.Employees.AsNoTracking().Where(e => e.EworkId != null).ToListAsync();
        var empByEw = emps.GroupBy(e => e.EworkId!).ToDictionary(g => g.Key, g => g.First());
        var recByEw = (await db.EmployeeRecords.AsNoTracking().Where(r => r.EworkId != null).ToListAsync()).GroupBy(r => r.EworkId!).ToDictionary(g => g.Key, g => g.First());
        var have = (await db.Attachments.AsNoTracking().Where(a => a.DeletedAt == null).Select(a => new { a.Collection, a.RecordId, a.FileName }).ToListAsync())
            .Select(a => a.Collection + "|" + a.RecordId + "|" + a.FileName.ToLowerInvariant()).ToHashSet();
        var hsUser = Luu("BangLuongCoBans").Where(h => S(h, "Id") is not null && S(h, "UserId") is not null).GroupBy(h => S(h, "Id")!).ToDictionary(g => g.Key, g => S(g.First(), "UserId")!);
        // Tệp gắn theo nhật ký tải lên (khi ô DinhKem trống hoặc thiếu)
        var logFiles = Luu("LogFileUploaders").Where(x => S(x, "RefId") is not null && S(x, "UrlFile") is not null && S(x, "IsActive") is not ("false" or "False" or "0"))
            .GroupBy(x => (S(x, "RefTableName") ?? "").ToLowerInvariant() + "|" + S(x, "RefId")).ToDictionary(g => g.Key, g => g.Select(x => S(x, "UrlFile")!).ToList());
        List<(string path, string? name)> FilesOf(string table, JsonElement row, params string[] cols)
        {
            var l = cols.SelectMany(c => Parse(S(row, c))).ToList();
            if (S(row, "Id") is { } id && logFiles.TryGetValue(table.ToLowerInvariant() + "|" + id, out var lf))
                foreach (var u in lf) foreach (var p in Parse(u)) if (!l.Any(x => string.Equals(Path.GetFileName(x.path), Path.GetFileName(p.path), StringComparison.OrdinalIgnoreCase))) l.Add(p);
            return l;
        }
        void Inc(Dictionary<string, int> d, string k, int n = 1) => d[k] = d.GetValueOrDefault(k) + n;

        async Task Copy(string label, string col, string recordId, string? projectId, string? kind, List<(string path, string? name)> files)
        {
            foreach (var (path, name) in files)
            {
                var nm = CleanName(path, name);
                if (Blocked.Contains(Path.GetExtension(nm))) continue;
                if (have.Contains(col + "|" + recordId + "|" + nm.ToLowerInvariant())) { rep.Skipped++; continue; }
                var full = idx.Find(path);
                if (full is null) { Inc(rep.Missing, label); if (rep.MissingSamples.Count < 15) rep.MissingSamples.Add(label + ": " + path); continue; }
                Inc(rep.Copied, label); rep.Bytes += new FileInfo(full).Length; have.Add(col + "|" + recordId + "|" + nm.ToLowerInvariant());
                if (dryRun) continue;
                var sf = store.SaveFromPath(full, by); sf.FileName = nm; sf.UploadedAt = File.GetLastWriteTimeUtc(full); db.Files.Add(sf);
                db.Attachments.Add(new Attachment
                {
                    Id = "att-" + Guid.NewGuid().ToString("N")[..20], Collection = col, RecordId = recordId, ProjectId = projectId, Kind = kind, Ref = "e-work",
                    FileId = sf.Id, FileName = nm, ContentType = sf.ContentType, Size = sf.Size, UploadedBy = "Chuyển từ e-work", UploadedAt = sf.UploadedAt
                });
            }
            if (!dryRun && db.ChangeTracker.Entries().Count() > 200) { await db.SaveChangesAsync(); db.ChangeTracker.Clear(); }
        }

        // ---- hồ sơ nhân sự: bằng cấp, khen thưởng / kỷ luật
        foreach (var b in Luu("RefBangCaps"))
        {
            var f = FilesOf("RefBangCaps", b, "DinhKem"); if (f.Count == 0) continue;
            if (S(b, "Id") is { } id && recByEw.TryGetValue("bang-cap:" + id, out var r)) await Copy("bằng cấp", HoSoNhanSuController.Col, r.Id, null, r.Kind, f);
            else Inc(rep.NoTarget, "bằng cấp");
        }
        foreach (var k in Luu("KhenThuongKyLuats"))
        {
            var f = FilesOf("KhenThuongKyLuats", k, "DinhKem"); if (f.Count == 0) continue;
            var id = S(k, "Id"); var r = id is null ? null : recByEw.GetValueOrDefault("khen-thuong:" + id) ?? recByEw.GetValueOrDefault("ky-luat:" + id);
            if (r is not null) await Copy("khen thưởng, kỷ luật", HoSoNhanSuController.Col, r.Id, null, r.Kind, f); else Inc(rep.NoTarget, "khen thưởng, kỷ luật");
        }
        // ---- CCCD hai mặt (BangLuongCoBans.MatTruocCCCD, MatSauCCCD) -> mục "Căn cước công dân" trong Giấy tờ
        foreach (var h in Luu("BangLuongCoBans"))
        {
            var f = FilesOf("BangLuongCoBans", h, "MatTruocCCCD", "MatSauCCCD"); if (f.Count == 0) continue;
            var u = S(h, "UserId"); if (u is null || !empByEw.TryGetValue(u, out var e)) { Inc(rep.NoTarget, "CCCD"); continue; }
            var key = "cccd:" + u;
            if (!recByEw.TryGetValue(key, out var r))
            {
                r = new EmployeeRecord { Id = "hs-" + Guid.NewGuid().ToString("N")[..20], EmployeeId = e.Id, Kind = "giay-to", Title = "Căn cước công dân", Org = S(h, "TenNoiCap") ?? S(h, "NoiCap"),
                    Number = e.IdNumber, FromDate = e.IdDate, Note = "Ảnh hai mặt chuyển từ e-work", EworkId = key, UpdatedAt = DateTime.UtcNow, UpdatedBy = by };
                if (!dryRun) db.EmployeeRecords.Add(r); recByEw[key] = r;
            }
            await Copy("CCCD", HoSoNhanSuController.Col, r.Id, null, "giay-to", f.Select((x, i) => (x.path, x.name ?? (i == 0 ? "CCCD mặt trước" + Path.GetExtension(x.path.Split('?')[0]) : i == 1 ? "CCCD mặt sau" + Path.GetExtension(x.path.Split('?')[0]) : null))).ToList());
        }
        if (!dryRun) await db.SaveChangesAsync();

        // ---- lịch họp (kể cả tệp kết quả cuộc họp), thông báo, đề xuất, công việc
        var meetings = (await db.Meetings.AsNoTracking().Where(m => m.Id.StartsWith("lh-ew-")).Select(m => m.Id).ToListAsync()).ToHashSet();
        var kq = Luu("KetQuaLichHops").Where(x => S(x, "RefId") is not null).GroupBy(x => S(x, "RefId")!).ToDictionary(g => g.Key, g => g.SelectMany(x => FilesOf("KetQuaLichHops", x, "DinhKem")).ToList());
        foreach (var m in Luu("LichHops"))
        {
            var id = S(m, "Id"); if (id is null) continue;
            var f = FilesOf("LichHops", m, "DinhKem"); if (kq.TryGetValue(id, out var k2)) f.AddRange(k2); if (f.Count == 0) continue;
            var mid = ("lh-ew-" + id) is var x && x.Length > 64 ? x[..64] : x;
            if (meetings.Contains(mid)) await Copy("lịch họp", "vp-lich-hop", mid, null, null, f); else Inc(rep.NoTarget, "lịch họp");
        }
        var notices = (await db.Notices.AsNoTracking().Where(n => n.Id.StartsWith("tb-ew-")).Select(n => n.Id).ToListAsync()).ToHashSet();
        foreach (var n in Luu("ThongBaos"))
        {
            var id = S(n, "Id"); if (id is null) continue; var f = FilesOf("ThongBaos", n, "DinhKem"); if (f.Count == 0) continue;
            var nid = ("tb-ew-" + id) is var x && x.Length > 64 ? x[..64] : x;
            if (notices.Contains(nid)) await Copy("thông báo", "vp-thong-bao", nid, null, null, f); else Inc(rep.NoTarget, "thông báo");
        }
        var reqs = (await db.Requests.AsNoTracking().Where(r => r.EworkId != null).Select(r => new { r.Id, r.EworkId }).ToListAsync()).GroupBy(r => r.EworkId!).ToDictionary(g => g.Key, g => g.First().Id);
        foreach (var x in Arr(root, "dexuat").Concat(Luu("QuanLyDeXuats")).DistinctBy(x => S(x, "Id")))
        {
            var id = S(x, "Id"); if (id is null) continue; var f = FilesOf("QuanLyDeXuats", x, "DinhKem"); if (f.Count == 0) continue;
            if (reqs.TryGetValue(id, out var rid)) await Copy("đề xuất", "vp-de-xuat", rid, null, null, f); else Inc(rep.NoTarget, "đề xuất");
        }
        var tasks = (await db.Tasks.AsNoTracking().Where(t => t.EworkId != null).Select(t => new { t.Id, t.EworkId, t.ProjectId }).ToListAsync()).GroupBy(t => t.EworkId!).ToDictionary(g => g.Key, g => g.First());
        var upd = Luu("TaskCapNhats").Where(x => S(x, "RefId") is not null).GroupBy(x => S(x, "RefId")!).ToDictionary(g => g.Key, g => g.SelectMany(x => FilesOf("TaskCapNhats", x, "DinhKem")).ToList());
        foreach (var c in Luu("QuanLyCongViecs"))
        {
            var id = S(c, "Id"); if (id is null) continue; var f = FilesOf("QuanLyCongViecs", c, "DinhKem"); if (upd.TryGetValue(id, out var u2)) f.AddRange(u2); if (f.Count == 0) continue;
            if (tasks.TryGetValue("cv:" + id, out var t)) await Copy("công việc", "tasks", t.Id, t.ProjectId, null, f); else Inc(rep.NoTarget, "công việc");
        }
        if (!dryRun) await db.SaveChangesAsync();
        return rep;
    }
}

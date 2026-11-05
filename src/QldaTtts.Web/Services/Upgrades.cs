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

        // 3) Phiên bản 1.1: chức năng Ban QLDA cấp xã (Luật Xây dựng 2025, NĐ 217/2026, NĐ 207/2026), chạy một lần
        CapXa(db);

        // 4) Phiên bản 1.2: trạng thái phụ lục, gắn hồ sơ thanh toán với đợt kế hoạch, chạy một lần
        V12(db);

        // 5) Vai trò Lãnh đạo xã/phường (Bí thư, Chủ tịch, Phó Chủ tịch…), chạy một lần
        LanhDaoXa(db);

        // 6) Phiên bản 1.5: trình duyệt kế hoạch tiến độ, chạy một lần
        V15(db);
    }

    /// <summary>Bản 1.5: kế hoạch tiến độ đang có được coi là đã duyệt (không đổi số liệu của đơn vị đang dùng);
    /// nhóm Lãnh đạo Ban được quyền duyệt kế hoạch tiến độ.</summary>
    private static void V15(AppDbContext db)
    {
        const string key = "upgrade:1.5-duyet-ke-hoach-tien-do";
        if (db.Settings.Any(x => x.Key == key)) return;
        foreach (var s in db.Schedule.Where(s => s.Status == null || s.Status == "").ToList()) s.Status = "Đã duyệt";
        foreach (var g in db.Groups.ToList().Where(g => !g.Admin && (g.Id == "g-lead" || g.Name.Contains("Lãnh đạo Ban", StringComparison.OrdinalIgnoreCase))))
        {
            var p = new Dictionary<string, string>(g.Perms) { ["tien-do:duyet"] = "1" };
            g.Perms = p;
        }
        db.Settings.Add(new AppSetting { Key = key, Value = DateTime.UtcNow.ToString("O"), UpdatedAt = DateTime.UtcNow, UpdatedBy = "he-thong" });
        db.SaveChanges();
    }

    public const string LanhDaoXaName = "Lãnh đạo xã/phường";
    public const string LanhDaoXaDesc = "Bí thư, Phó Bí thư Đảng ủy; Chủ tịch, Phó Chủ tịch HĐND, UBND xã/phường (người quyết định đầu tư): theo dõi tiến độ, giải ngân, giải phóng mặt bằng, nghiệm thu, quyết toán, cảnh báo và báo cáo trên máy tính hoặc điện thoại. Chỉ xem.";

    /// <summary>Nhóm "Lãnh đạo UBND xã" mặc định đổi tên thành "Lãnh đạo xã/phường" (giữ nguyên quyền, thành viên);
    /// hệ thống chưa có nhóm này thì tạo mới với quyền chỉ xem.</summary>
    private static void LanhDaoXa(AppDbContext db)
    {
        const string key = "upgrade:1.2-lanh-dao-xa-phuong";
        if (db.Settings.Any(x => x.Key == key)) return;
        if (!db.Users.Any()) return; // chưa khởi tạo: nhóm tạo theo bộ mặc định khi khởi tạo
        var g = db.Groups.FirstOrDefault(x => x.Id == "g-ubnd");
        if (g is not null)
        {
            if (g.Name.StartsWith("Lãnh đạo UBND xã")) { g.Name = LanhDaoXaName; g.Desc = LanhDaoXaDesc; g.UpdatedAt = DateTime.UtcNow; g.UpdatedBy = "he-thong"; }
        }
        else if (!db.Groups.Any(x => x.Name == LanhDaoXaName))
        {
            var view = new[] { "tong-quan", "du-an", "von", "gpmb", "tien-do", "nghiem-thu", "thanh-toan", "quyet-toan", "bao-cao" };
            var perms = db.Groups.AsNoTracking().Where(x => x.Admin).Select(x => x.Perms).FirstOrDefault()?.Keys.Where(k => !k.Contains(':')).ToList() ?? view.ToList();
            db.Groups.Add(new UserGroup { Id = "g-ubnd", Name = LanhDaoXaName, Desc = LanhDaoXaDesc, Admin = false,
                Perms = perms.Union(view).Distinct().ToDictionary(k => k, k => view.Contains(k) ? "view" : "none"), Scope = new(),
                UpdatedAt = DateTime.UtcNow, UpdatedBy = "he-thong" });
        }
        db.Settings.Add(new AppSetting { Key = key, Value = DateTime.UtcNow.ToString("O"), UpdatedAt = DateTime.UtcNow, UpdatedBy = "he-thong" });
        db.SaveChanges();
    }

    /// <summary>
    /// Phụ lục đã nhập trước bản 1.2 coi là đã duyệt (giữ nguyên giá trị hợp đồng đang hiển thị).
    /// Hồ sơ thanh toán chưa gắn đợt kế hoạch: tự gắn theo ngày (hồ sơ đầu tiên từ 45 ngày trước hạn đợt đến trước khoảng của đợt sau),
    /// kế toán kiểm tra lại tại Quản lý thanh toán → Kế hoạch thanh toán.
    /// </summary>
    private static void V12(AppDbContext db)
    {
        const string key = "upgrade:1.2-phu-luc-dot-thanh-toan";
        if (db.Settings.Any(x => x.Key == key)) return;
        foreach (var a in db.Addenda.Where(a => a.Status == null || a.Status == "").ToList()) a.Status = "Đã duyệt";
        foreach (var a in db.Acceptances.Where(a => a.Status == null || a.Status == "").ToList()) a.Status = "Đã duyệt";
        // Quy trình trình duyệt: trạng thái "Chờ duyệt" của hồ sơ thanh toán; nhóm Lãnh đạo Ban được quyền duyệt
        var pcats = db.Catalogs.Where(c => c.Type == "Trạng thái thanh toán").ToList();
        if (pcats.Count > 0 && !pcats.Any(c => c.Value == "Chờ duyệt"))
        {
            foreach (var c in pcats.Where(c => c.Order >= 1)) c.Order++;
            db.Catalogs.Add(new Catalog { Id = "cat-" + Guid.NewGuid().ToString("N")[..12], Type = "Trạng thái thanh toán", Value = "Chờ duyệt", Order = 1, UpdatedAt = DateTime.UtcNow, UpdatedBy = "he-thong" });
        }
        foreach (var g in db.Groups.ToList().Where(g => !g.Admin && (g.Id == "g-lead" || g.Name.Contains("Lãnh đạo Ban", StringComparison.OrdinalIgnoreCase))))
        {
            var p = new Dictionary<string, string>(g.Perms);
            foreach (var m in new[] { "goi-thau", "thanh-toan", "nghiem-thu" }) p[m + ":duyet"] = "1";
            g.Perms = p;
        }
        var pays = db.Payments.Where(p => p.ContractId != null).ToList();
        foreach (var g in db.PayPlans.AsNoTracking().Where(p => p.ContractId != null && p.PlanDate != null).ToList().GroupBy(p => p.ContractId))
        {
            var plans = g.OrderBy(p => p.PlanDate).ToList();
            var free = pays.Where(p => p.ContractId == g.Key && p.Date != null && p.Status != "Từ chối" && string.IsNullOrEmpty(p.PayPlanId)).OrderBy(p => p.Date).ToList();
            if (pays.Any(p => p.ContractId == g.Key && !string.IsNullOrEmpty(p.PayPlanId))) continue; // hợp đồng đã được gắn tay
            for (var i = 0; i < plans.Count; i++)
            {
                var from = plans[i].PlanDate!.Value.AddDays(-45);
                DateOnly? to = i + 1 < plans.Count ? plans[i + 1].PlanDate!.Value.AddDays(-45) : null;
                var hit = free.FirstOrDefault(p => p.Date >= from && (to is null || p.Date < to));
                if (hit is null) continue;
                hit.PayPlanId = plans[i].Id; free.Remove(hit);
            }
        }
        db.Settings.Add(new AppSetting { Key = key, Value = DateTime.UtcNow.ToString("O"), UpdatedAt = DateTime.UtcNow, UpdatedBy = "he-thong" });
        db.SaveChanges();
    }

    /// <summary>Danh mục và quyền cho 4 phân hệ mới (kế hoạch vốn, nghiệm thu bàn giao, quyết toán, GPMB) trên hệ thống đã khởi tạo.</summary>
    private static void CapXa(AppDbContext db)
    {
        const string key = "upgrade:1.1-cap-xa";
        if (db.Settings.Any(x => x.Key == key)) return;
        if (!db.Catalogs.Any()) return; // chưa khởi tạo: danh mục mặc định do bước khởi tạo nạp đủ
        foreach (var (type, values) in NewCatalogValues)
        {
            var cats = db.Catalogs.Where(c => c.Type == type).ToList();
            var order = cats.Count > 0 ? cats.Max(c => c.Order) : -1;
            foreach (var v in values)
                if (!cats.Any(c => c.Value == v))
                    db.Catalogs.Add(new Catalog { Id = "cat-" + Guid.NewGuid().ToString("N")[..12], Type = type, Value = v, Order = ++order, UpdatedAt = DateTime.UtcNow, UpdatedBy = "he-thong" });
        }
        // Kế hoạch vốn, quyết toán: cùng quyền với phân hệ thanh toán (kế toán cập nhật, lãnh đạo xem).
        // Nhóm cập nhật tiến độ/khối lượng (kỹ thuật) được cập nhật nghiệm thu, GPMB; nhóm xem dự án được xem các phân hệ mới.
        foreach (var g in db.Groups.ToList())
        {
            if (g.Admin) continue;
            var p = new Dictionary<string, string>(g.Perms);
            string Get(string m) => p.TryGetValue(m, out var v) ? v : "none";
            void Set(string m, string v) { if (!p.ContainsKey(m)) p[m] = v; }
            var pay = Get("thanh-toan"); var tech = Get("khoi-luong") == "edit" || Get("tien-do") == "edit"; var proj = Get("du-an");
            Set("von", pay);
            Set("quyet-toan", pay);
            Set("nghiem-thu", tech && Get("khoi-luong") == "edit" ? "edit" : proj != "none" ? "view" : "none");
            Set("gpmb", tech && Get("khoi-luong") == "edit" ? "edit" : proj != "none" ? "view" : "none");
            g.Perms = p;
        }
        db.Settings.Add(new AppSetting { Key = key, Value = DateTime.UtcNow.ToString("O"), UpdatedAt = DateTime.UtcNow, UpdatedBy = "he-thong" });
        db.SaveChanges();
    }

    private static readonly (string Type, string[] Values)[] NewCatalogValues =
    {
        ("Vai trò của Ban", new[] { "Chủ đầu tư", "Quản lý dự án được giao", "Tư vấn quản lý dự án" }),
        ("Hình thức quản lý dự án", new[] { "Ban QLDA đầu tư xây dựng", "Chủ đầu tư thuê tư vấn quản lý dự án", "Chủ đầu tư thành lập ban trực thuộc", "Chủ đầu tư tự quản lý" }),
        ("Loại dự án", new[] { "Xây dựng mới", "Sửa chữa, cải tạo, nâng cấp", "Mua sắm", "Nhiệm vụ khác" }),
        ("Hồ sơ dự án", new[] { "Báo cáo nghiên cứu khả thi", "Báo cáo kinh tế - kỹ thuật", "Không yêu cầu (mua sắm, nhiệm vụ)" }),
        ("Nguồn vốn", new[] { "Ngân sách thành phố đầu tư trên địa bàn" }),
        ("Trạng thái dự án", new[] { "Đã bàn giao đưa vào sử dụng", "Đang quyết toán" }),
        ("Loại hồ sơ pháp lý", new[] { "Quyết định giao chủ đầu tư, giao quản lý dự án", "Quyết định giao kế hoạch vốn", "Báo cáo nghiên cứu khả thi / kinh tế - kỹ thuật",
            "Kết quả thẩm định", "Phương án bồi thường, giải phóng mặt bằng", "Biên bản nghiệm thu giai đoạn", "Biên bản nghiệm thu hoàn thành, bàn giao",
            "Báo cáo quyết toán", "Quyết định phê duyệt quyết toán" }),
        ("Hình thức lựa chọn nhà thầu", new[] { "Mua sắm trực tuyến", "Đàm phán giá", "Lựa chọn nhà thầu trong trường hợp đặc biệt", "Tham gia thực hiện của cộng đồng" }),
        ("Loại kế hoạch vốn", new[] { "Kế hoạch trung hạn 2026–2030", "Kế hoạch vốn năm", "Bổ sung kế hoạch năm", "Điều chỉnh giảm kế hoạch năm" }),
        ("Loại nghiệm thu, bàn giao", new[] { "Nghiệm thu giai đoạn thi công", "Nghiệm thu hoàn thành hạng mục", "Nghiệm thu hoàn thành công trình",
            "Kiểm tra công tác nghiệm thu (cơ quan chuyên môn)", "Bàn giao đưa vào sử dụng" }),
        ("Kết quả nghiệm thu", new[] { "Đạt", "Đạt, có tồn tại phải khắc phục", "Không đạt" }),
        ("Trạng thái quyết toán", new[] { "Đang lập hồ sơ", "Đã trình thẩm tra", "Đã phê duyệt", "Đã tất toán tài khoản" }),
    };
}

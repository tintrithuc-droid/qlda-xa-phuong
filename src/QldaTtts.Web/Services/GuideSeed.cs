using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>
/// Nạp sẵn bộ hướng dẫn sử dụng theo vai trò (tệp PDF trong thư mục hdsd của gói cài) vào trang Hướng dẫn sử dụng.
/// Chỉ chạy một lần; sau đó quản trị hệ thống tự thêm, sửa, xóa.
/// </summary>
public static class GuideSeed
{
    public const string Flag = "guides-seeded";

    private static readonly (string File, string Title, string[] Groups, string Content)[] Roles =
    {
        ("Quan tri he thong", "Hướng dẫn sử dụng dành cho Quản trị hệ thống", new[] { "g-admin" },
            "Khởi tạo hệ thống, xác thực 2 lớp, quản lý người dùng, nhóm và phân quyền, danh mục dùng chung, thông tin đơn vị và giao diện, hướng dẫn sử dụng, kho tệp, thùng rác, sao lưu và phục hồi dữ liệu."),
        ("Lanh dao Ban", "Hướng dẫn sử dụng dành cho Lãnh đạo Ban", new[] { "g-lead" },
            "Theo dõi Tổng quan, cảnh báo, tình hình thực hiện dự án, hợp đồng, thanh toán; chỉ đạo công việc; khai thác báo cáo."),
        ("Can bo ky thuat", "Hướng dẫn sử dụng dành cho Cán bộ kỹ thuật", new[] { "g-tech" },
            "Quản lý dự án, hồ sơ pháp lý, mô hình công trình, gói thầu và hợp đồng, tiến độ, nhật ký thi công, khối lượng và nghiệm thu."),
        ("Ke toan", "Hướng dẫn sử dụng dành cho Kế toán", new[] { "g-acc" },
            "Kế hoạch thanh toán, hồ sơ thanh toán, xác nhận đã chi kèm chứng từ Kho bạc, tổng hợp giải ngân, đối chiếu khối lượng nghiệm thu."),
        ("Tu van giam sat - Nha thau", "Hướng dẫn sử dụng dành cho Tư vấn giám sát / Nhà thầu", new[] { "g-site" },
            "Ghi nhật ký thi công kèm ảnh hiện trường, cập nhật tiến độ trong phạm vi dự án được giao."),
        ("Su dung tren dien thoai", "Hướng dẫn sử dụng trên điện thoại", new[] { "g-site", "g-tech", "g-lead" },
            "Cài ứng dụng Android, thêm vào màn hình chính iPhone, ghi nhật ký và chụp ảnh tại hiện trường, cập nhật tiến độ, tra cứu."),
    };

    public static void Run(AppDbContext db, FileStore store, string dir)
    {
        if (db.Settings.Any(s => s.Key == Flag) || !Directory.Exists(dir)) return;
        var pdfs = Directory.GetFiles(dir, "*.pdf");
        if (pdfs.Length == 0) return;
        var order = 1;
        foreach (var (file, title, groups, content) in Roles)
        {
            var pdf = pdfs.FirstOrDefault(p => Path.GetFileName(p).Contains(" - " + file + " - ", StringComparison.OrdinalIgnoreCase));
            var g = new Guide { Id = "gd-" + Guid.NewGuid().ToString("N")[..12], Title = title, Category = "Tài liệu hướng dẫn sử dụng",
                Content = content, Groups = groups.ToList(), Order = order++, UpdatedAt = DateTime.UtcNow, UpdatedBy = "he-thong" };
            db.Guides.Add(g);
            if (pdf is null) continue;
            var sf = store.SaveFromPath(pdf, "he-thong");
            db.Files.Add(sf);
            db.Attachments.Add(new Attachment { Id = "att-" + Guid.NewGuid().ToString("N")[..20], Collection = "guides", RecordId = g.Id, Kind = "Tài liệu",
                FileId = sf.Id, FileName = sf.FileName, ContentType = sf.ContentType, Size = sf.Size, UploadedBy = "Hệ thống", UploadedAt = DateTime.UtcNow });
        }
        db.Settings.Add(new AppSetting { Key = Flag, Value = "1", UpdatedAt = DateTime.UtcNow, UpdatedBy = "he-thong" });
        db.SaveChanges();
    }
}

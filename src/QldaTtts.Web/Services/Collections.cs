using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>Mô tả một tập dữ liệu nghiệp vụ mà giao diện đọc/ghi qua /api/data/{name}.</summary>
public record CollectionDef(string Name, Type Type, string Module, string Label,
    Func<AppDbContext, IQueryable<EntityBase>> Query, (string Collection, string ForeignKey)[] Dependents);

public static class Collections
{
    private static IQueryable<EntityBase> Q<T>(AppDbContext db) where T : EntityBase => db.Set<T>();

    public static readonly CollectionDef[] All =
    {
        new("projects", typeof(Project), "du-an", "Dự án", Q<Project>,
            new[] { ("packages","ProjectId"),("tasks","ProjectId"),("legal","ProjectId"),("items","ProjectId"),("schedule","ProjectId"),("diaries","ProjectId"),("models","ProjectId"),
                     ("capitals","ProjectId"),("acceptances","ProjectId"),("settlements","ProjectId"),("clearances","ProjectId") }),
        new("tasks", typeof(ProjectTask), "du-an", "Công việc", Q<ProjectTask>, Array.Empty<(string,string)>()),
        new("legal", typeof(LegalDocument), "du-an", "Hồ sơ pháp lý", Q<LegalDocument>, Array.Empty<(string,string)>()),
        new("items", typeof(ConstructionItem), "mo-hinh", "Hạng mục công trình", Q<ConstructionItem>, new[] { ("schedule","ItemId") }),
        new("models", typeof(ModelFile), "mo-hinh", "Tệp mô hình", Q<ModelFile>, Array.Empty<(string,string)>()),
        new("packages", typeof(Package), "goi-thau", "Gói thầu", Q<Package>,
            new[] { ("contracts","PackageId"),("schedule","PackageId"),("diaries","PackageId"),("legal","PackageId"),("acceptances","PackageId") }),
        new("contracts", typeof(Contract), "goi-thau", "Hợp đồng", Q<Contract>,
            new[] { ("boq","ContractId"),("payments","ContractId"),("payplans","ContractId"),("addenda","ContractId") }),
        new("addenda", typeof(Addendum), "goi-thau", "Phụ lục hợp đồng", Q<Addendum>, Array.Empty<(string,string)>()),
        new("schedule", typeof(ScheduleItem), "tien-do", "Tiến độ", Q<ScheduleItem>, Array.Empty<(string,string)>()),
        new("diaries", typeof(Diary), "nhat-ky", "Nhật ký thi công", Q<Diary>, Array.Empty<(string,string)>()),
        new("boq", typeof(BoqItem), "khoi-luong", "Khối lượng hợp đồng", Q<BoqItem>, new[] { ("volumes","BoqId") }),
        new("volumes", typeof(VolumeEntry), "khoi-luong", "Khối lượng thực hiện", Q<VolumeEntry>, Array.Empty<(string,string)>()),
        new("payplans", typeof(PayPlan), "thanh-toan", "Kế hoạch thanh toán", Q<PayPlan>, Array.Empty<(string,string)>()),
        new("payments", typeof(Payment), "thanh-toan", "Hồ sơ thanh toán", Q<Payment>, Array.Empty<(string,string)>()),
        new("capitals", typeof(CapitalPlan), "von", "Kế hoạch vốn", Q<CapitalPlan>, Array.Empty<(string,string)>()),
        new("acceptances", typeof(Acceptance), "nghiem-thu", "Nghiệm thu, bàn giao", Q<Acceptance>, Array.Empty<(string,string)>()),
        new("settlements", typeof(Settlement), "quyet-toan", "Quyết toán dự án", Q<Settlement>, Array.Empty<(string,string)>()),
        new("clearances", typeof(Clearance), "gpmb", "Giải phóng mặt bằng", Q<Clearance>, Array.Empty<(string,string)>()),
        new("groups", typeof(UserGroup), "quan-tri", "Nhóm người dùng", Q<UserGroup>, new[] { ("users","GroupId") }),
        new("catalogs", typeof(Catalog), "quan-tri", "Danh mục", Q<Catalog>, Array.Empty<(string,string)>()),
        new("guides", typeof(Guide), "quan-tri", "Hướng dẫn sử dụng", Q<Guide>, Array.Empty<(string,string)>()),
        // Chỉ ghi qua /api/approvals (quản trị mới sửa trực tiếp được); có trong sao lưu, phục hồi
        new("approvals", typeof(ApprovalLog), "quan-tri", "Lịch sử trình duyệt", Q<ApprovalLog>, Array.Empty<(string,string)>()),
    };

    public static CollectionDef? Find(string name) => All.FirstOrDefault(c => c.Name == name);

    public static async Task<int> CountDependents(AppDbContext db, string collection, string fk, string id)
    {
        var def = Find(collection) ?? (collection == "users" ? null : null);
        if (collection == "users") return await db.Users.CountAsync(u => u.GroupId == id);
        if (def is null) return 0;
        return await def.Query(db).Where(e => EF.Property<string>(e, fk) == id).CountAsync();
    }

    public static string LabelOf(object e)
    {
        foreach (var p in new[] { "Name", "Title", "Code", "Number", "Value", "Phase", "Username" })
        {
            var v = e.GetType().GetProperty(p)?.GetValue(e) as string;
            if (!string.IsNullOrWhiteSpace(v)) return v;
        }
        return (e as EntityBase)?.Id ?? "";
    }
}

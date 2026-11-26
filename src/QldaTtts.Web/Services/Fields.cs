namespace QldaTtts.Web.Services;

/// <summary>Bản 1.8.9: tên tiếng Việt của các thông tin hay sửa, để nhật ký ghi rõ "Cập nhật (số hợp đồng, ngày ký)".</summary>
public static class Fields
{
    private static readonly Dictionary<string, string> Names = new()
    {
        ["Number"] = "số", ["Name"] = "tên", ["Code"] = "mã", ["Value"] = "giá trị", ["Amount"] = "số tiền", ["SignDate"] = "ngày ký",
        ["Start"] = "ngày bắt đầu", ["End"] = "ngày kết thúc", ["Date"] = "ngày", ["Status"] = "trạng thái", ["Contractor"] = "nhà thầu",
        ["Note"] = "ghi chú", ["Content"] = "nội dung", ["Progress"] = "tiến độ", ["Assignee"] = "người thực hiện", ["Due"] = "hạn",
        ["DoneDate"] = "ngày hoàn thành", ["Priority"] = "mức ưu tiên", ["Price"] = "đơn giá", ["Qty"] = "khối lượng", ["Kind"] = "loại",
        ["Type"] = "loại", ["Title"] = "trích yếu", ["Issuer"] = "cơ quan ban hành", ["PlanStart"] = "ngày bắt đầu kế hoạch",
        ["PlanEnd"] = "ngày kết thúc kế hoạch", ["ActualStart"] = "ngày bắt đầu thực tế", ["ActualEnd"] = "ngày kết thúc thực tế",
        ["PlanDate"] = "ngày dự kiến", ["PaidDate"] = "ngày chi", ["Phase"] = "giai đoạn", ["PackageId"] = "gói thầu", ["ProjectId"] = "dự án",
        ["ContractId"] = "hợp đồng", ["ValueChange"] = "giá trị điều chỉnh", ["Budget"] = "dự toán", ["Tmdt"] = "tổng mức đầu tư",
        ["Location"] = "địa điểm", ["Owner"] = "chủ đầu tư", ["Weight"] = "trọng số", ["DoneQty"] = "khối lượng thực hiện",
        ["AcceptedQty"] = "khối lượng nghiệm thu", ["Result"] = "kết quả", ["Works"] = "công việc", ["Field"] = "lĩnh vực",
    };

    /// <summary>Danh sách thông tin đã đổi, bỏ các thuộc tính kỹ thuật; quá 6 mục thì rút gọn.</summary>
    public static string Describe(IEnumerable<string> props)
    {
        var all = props.ToList();
        var named = all.Select(p => Names.GetValueOrDefault(p)).Where(n => n is not null).Distinct().ToList();
        if (named.Count == 0) return all.Count == 0 ? "" : "thông tin khác";
        var s = string.Join(", ", named.Take(6));
        if (named.Count > 6 || all.Count > named.Count) s += ", …";
        return s;
    }
}

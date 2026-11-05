using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Trình duyệt hồ sơ: trình, duyệt, trả lại, từ chối, thu hồi (bản 1.2).</summary>
[Route("api/approvals")]
public class ApprovalsController : ApiControllerBase
{
    public ApprovalsController(AppDbContext db, UserContext uc) : base(db, uc) { }

    private static string Vnd(decimal v) => v.ToString("#,0", System.Globalization.CultureInfo.InvariantCulture).Replace(",", ".");

    public record ActRequest(string Collection, string Id, string Action, string? Note);

    [HttpPost]
    public async Task<IActionResult> Act([FromBody] ActRequest r)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var w = Workflow.Find(r.Collection); var def = Collections.Find(r.Collection);
        if (w is null || def is null || !ValidId(r.Id)) return Error(400, "Dữ liệu không hợp lệ.");
        var rec = (EntityBase?)await Db.FindAsync(def.Type, r.Id);
        if (rec is null) return Error(404, "Hồ sơ không còn tồn tại.");
        var pid = await ProjectScope.ProjectOf(Db, rec);
        if (!Uc.InScope(pid)) return Denied("Dự án này nằm ngoài phạm vi dữ liệu được giao.");
        var approver = Workflow.CanApprove(Uc, w); var editor = Uc.Can(w.Module, true);
        var from = Workflow.StatusOf(rec); var note = (r.Note ?? "").Trim();
        string to, label;
        switch (r.Action)
        {
            case "submit": // người lập trình duyệt
                if (!editor && !approver) return Denied();
                if (from != w.Draft) return Error(409, $"Chỉ trình duyệt được hồ sơ đang \"{w.Draft}\".");
                to = w.Waiting; label = "Trình duyệt"; break;
            case "withdraw": // người lập rút lại khi chưa duyệt
                if (!editor && !approver) return Denied();
                if (from != w.Waiting) return Error(409, "Hồ sơ không ở trạng thái chờ duyệt.");
                to = w.Draft; label = "Rút lại"; break;
            case "approve":
                if (!approver) return Denied("Bạn không có quyền duyệt hồ sơ của phân hệ này.");
                if (from != w.Waiting && from != w.Draft) return Error(409, "Hồ sơ không ở trạng thái chờ duyệt.");
                to = w.Approved; label = "Duyệt"; break;
            case "return":
                if (!approver) return Denied("Bạn không có quyền duyệt hồ sơ của phân hệ này.");
                if (from != w.Waiting) return Error(409, "Hồ sơ không ở trạng thái chờ duyệt.");
                if (note == "") return Error(400, "Vui lòng ghi ý kiến (lý do trả lại).");
                to = w.Draft; label = "Trả lại"; break;
            case "reject":
                if (!approver) return Denied("Bạn không có quyền duyệt hồ sơ của phân hệ này.");
                if (from != w.Waiting) return Error(409, "Hồ sơ không ở trạng thái chờ duyệt.");
                if (note == "") return Error(400, "Vui lòng ghi lý do từ chối.");
                to = w.Rejected; label = "Từ chối"; break;
            case "recall": // người duyệt thu hồi hồ sơ đã duyệt về soạn thảo để điều chỉnh
                if (!approver) return Denied("Bạn không có quyền duyệt hồ sơ của phân hệ này.");
                if (!w.IsLocked(from) || from == "Đã thanh toán") return Error(409, "Chỉ thu hồi được hồ sơ đã duyệt hoặc đã từ chối (hồ sơ thanh toán đã được Kho bạc chi thì không thu hồi).");
                if (note == "") return Error(400, "Vui lòng ghi lý do thu hồi.");
                to = w.Draft; label = "Thu hồi"; break;
            default: return Error(400, "Thao tác không hợp lệ.");
        }
        // Hồ sơ thanh toán: khi trình hoặc duyệt, tổng các hồ sơ đã trình trở lên (chờ duyệt, trình Kho bạc, đã chi) cộng hồ sơ này
        // không được vượt giá trị hợp đồng sau phụ lục đã duyệt. Hồ sơ đang lập hoặc bị trả lại không chiếm hạn mức (bản 1.5).
        if (rec is Payment pay && (r.Action == "submit" || r.Action == "approve") && pay.ContractId is { } cid)
        {
            var c = await Db.Contracts.AsNoTracking().FirstOrDefaultAsync(x => x.Id == cid);
            if (c is not null)
            {
                var adds = await Db.Addenda.AsNoTracking().Where(a => a.ContractId == cid).ToListAsync();
                var cv = (c.Value ?? 0) + adds.Where(a => string.IsNullOrEmpty(a.Status) || a.Status == "Đã duyệt").Sum(a => a.ValueChange ?? 0);
                var held = new[] { "Chờ duyệt", "Đang trình KBNN", "Đã thanh toán" };
                var others = (await Db.Payments.AsNoTracking().Where(x => x.ContractId == cid && x.Id != pay.Id).ToListAsync())
                    .Where(x => held.Contains(x.Status ?? "")).Sum(x => x.Amount ?? 0);
                if (others + (pay.Amount ?? 0) > cv + 1)
                    return Error(409, $"Tổng giá trị thanh toán đã trình ({Vnd(others + (pay.Amount ?? 0))} đ) vượt giá trị hợp đồng ({Vnd(cv)} đ). Kiểm tra lại số tiền hoặc các hồ sơ khác của hợp đồng.");
            }
        }
        Workflow.SetStatus(rec, to); rec.UpdatedAt = DateTime.UtcNow; rec.UpdatedBy = Uc.User.Username;
        var target = Collections.LabelOf(rec);
        var log = new ApprovalLog
        {
            Id = "apv-" + Guid.NewGuid().ToString("N")[..20], Collection = w.Collection, RecordId = rec.Id, ProjectId = pid, Target = target,
            Action = label, FromStatus = from, ToStatus = to, Note = note == "" ? null : note, By = Uc.User.Username, ByName = Uc.User.Name, At = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow, UpdatedBy = Uc.User.Username
        };
        Db.ApprovalLogs.Add(log);
        Uc.Log(label, def.Label, target + (note == "" ? "" : " – " + note));
        await Db.SaveChangesAsync();
        return Ok(new { record = (object)rec, log });
    }
}

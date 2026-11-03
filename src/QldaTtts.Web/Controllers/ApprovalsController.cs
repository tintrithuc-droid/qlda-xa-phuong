using Microsoft.AspNetCore.Mvc;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Trình duyệt hồ sơ: trình, duyệt, trả lại, từ chối, thu hồi (bản 1.2).</summary>
[Route("api/approvals")]
public class ApprovalsController : ApiControllerBase
{
    public ApprovalsController(AppDbContext db, UserContext uc) : base(db, uc) { }

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

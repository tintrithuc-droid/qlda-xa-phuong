using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>
/// Trình duyệt hồ sơ theo quy trình do quản trị thiết lập (bản 1.8): chuyển duyệt (có thể chuyển đích danh), xử lý từng bước,
/// trả lại (về người lập hoặc bước trước), từ chối, rút lại khi bước sau chưa xử lý, thu hồi hồ sơ đã duyệt.
/// </summary>
[Route("api/approvals")]
public class ApprovalsController : ApiControllerBase
{
    public ApprovalsController(AppDbContext db, UserContext uc) : base(db, uc) { }

    private static string Vnd(decimal v) => v.ToString("#,0", System.Globalization.CultureInfo.InvariantCulture).Replace(",", ".");

    public record ActRequest(string Collection, string Id, string Action, string? Note, string? AssignTo);

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
        var cfg = Workflow.Load(Db);
        var fc = Workflow.For(cfg, w, pid);
        var manager = Workflow.CanApprove(Uc, w); var editor = Uc.Can(w.Module, true); var admin = Uc.IsAdmin;
        var from = Workflow.StatusOf(rec); var note = (r.Note ?? "").Trim();
        var st = await Workflow.StateOf(Db, cfg, w, rec, pid);
        var me = Uc.User.Id;
        bool Handles(StepConfig s, bool last) => Workflow.Handles(Uc.User, Uc.Group, w, s, last);

        string? to; string label; int next = -1; List<StepConfig>? route = null;
        switch (r.Action)
        {
            case "submit": // người lập chuyển duyệt
            {
                if (!editor && !manager) return Denied();
                if (from != w.Draft && !(string.IsNullOrEmpty(from) && !fc.Enabled)) return Error(409, $"Chỉ chuyển duyệt được hồ sơ đang \"{w.Draft}\".");
                route = Workflow.RouteFor(fc, Workflow.AmountOf(w, rec));
                // Nghiệm thu sản phẩm tư vấn giai đoạn chuẩn bị đầu tư: không có tư vấn giám sát nên bỏ bước TVGS xác nhận
                if (rec is VolumeBatch pb && await Phases.IsPrepContract(Db, pb.ContractId)) route = route.Where(x => x.Key != "check").ToList();
                if (!fc.Enabled || route.Count == 0) { to = w.Approved; label = "Ghi nhận"; route = null; break; }
                next = 0; to = Workflow.StatusAt(w, route, 0); label = "Chuyển duyệt"; break;
            }
            case "check":
            case "approve": // xử lý bước đang chờ
            {
                var s = st.Step;
                if (s is null)
                {
                    // Hồ sơ đang soạn, quy trình chỉ một bước: người duyệt được duyệt ngay (như các bản trước)
                    if (from == w.Draft && r.Action == "approve" && fc.Enabled && st.Route.Count == 1 && Handles(st.Route[0], true))
                    { route = Workflow.RouteFor(fc, Workflow.AmountOf(w, rec)); if (route.Count == 0) route = st.Route; to = w.Approved; label = st.Route[0].Verb; break; }
                    if (!manager && !Handles(st.Route[^1], true)) return Denied("Bạn không có quyền duyệt hồ sơ của phân hệ này.");
                    return Error(409, "Hồ sơ không ở bước chờ xử lý.");
                }
                if (!Handles(s, st.IsLast)) return Denied($"Bạn không được phân công xử lý bước \"{s.Label}\".");
                if (cfg.AssignedOnly && !admin && st.Last?.Assignee is { Length: > 0 } asg && asg != me)
                    return Denied($"Hồ sơ đã được chuyển đích danh cho {st.Last.AssigneeName ?? "người khác"} xử lý.");
                if (cfg.NoSelfReview && !admin && st.Submit?.By == Uc.User.Username)
                    return Denied("Bạn là người chuyển duyệt hồ sơ này nên không tự xử lý các bước sau.");
                if (s.NoteRequired && note == "") return Error(400, $"Bước \"{s.Label}\" yêu cầu ghi ý kiến.");
                label = s.Verb;
                if (!st.IsLast) { next = st.Index + 1; to = Workflow.StatusAt(w, st.Route, next); }
                else to = w.Approved;
                break;
            }
            case "return":
            {
                var s = st.Step;
                if (s is null) return Error(409, "Hồ sơ không ở bước chờ xử lý.");
                if (!Handles(s, st.IsLast) && !manager) return Denied("Bạn không có quyền trả lại hồ sơ này.");
                if (note == "") return Error(400, "Vui lòng ghi ý kiến (lý do trả lại).");
                label = "Trả lại";
                if (s.ReturnTo == "prev" && st.Index > 0) { next = st.Index - 1; to = Workflow.StatusAt(w, st.Route, next); }
                else to = w.Draft;
                break;
            }
            case "reject":
            {
                var s = st.Step;
                if (s is null) return Error(409, "Hồ sơ không ở trạng thái chờ duyệt.");
                if (!(st.IsLast && Handles(s, true)) && !manager) return Denied("Chỉ người duyệt bước cuối được từ chối hồ sơ.");
                if (note == "") return Error(400, "Vui lòng ghi lý do từ chối.");
                to = w.Rejected; label = "Từ chối"; break;
            }
            case "withdraw": // người vừa chuyển rút lại khi bước sau chưa xử lý
            {
                if (st.Step is null) return Error(409, "Hồ sơ không ở bước chờ xử lý.");
                var mine = st.Last?.By == Uc.User.Username;
                if (!mine && !admin && !(st.Index == 0 && (editor || manager) && st.Last?.By is null)) return Denied("Chỉ người vừa chuyển hồ sơ được rút lại.");
                label = "Rút lại";
                if (st.Index > 0) { next = st.Index - 1; to = Workflow.StatusAt(w, st.Route, next); }
                else to = w.Draft;
                break;
            }
            case "recall": // người duyệt thu hồi hồ sơ đã duyệt về soạn thảo để điều chỉnh
            {
                var lastStep = st.Route.LastOrDefault();
                if (!manager && !(lastStep is not null && Handles(lastStep, true))) return Denied("Bạn không có quyền duyệt hồ sơ của phân hệ này.");
                if (!w.IsLocked(from) || from == "Đã thanh toán") return Error(409, "Chỉ thu hồi được hồ sơ đã duyệt hoặc đã từ chối (hồ sơ thanh toán đã được Kho bạc chi thì không thu hồi).");
                if (note == "") return Error(400, "Vui lòng ghi lý do thu hồi.");
                to = w.Draft; label = "Thu hồi"; break;
            }
            default: return Error(400, "Thao tác không hợp lệ.");
        }

        // Người được chuyển đích danh: phải xử lý được bước tiếp theo
        var useRoute = route ?? st.Route;
        AppUser? assignee = null;
        if (next >= 0 && !string.IsNullOrEmpty(r.AssignTo))
        {
            assignee = await Db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == r.AssignTo && u.Active);
            var ag = assignee?.GroupId is null ? null : await Db.Groups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == assignee.GroupId);
            if (assignee is null || !Workflow.Handles(assignee, ag, w, useRoute[next], next == useRoute.Count - 1))
                return Error(400, $"Người được chọn không được phân công xử lý bước \"{useRoute[next].Label}\".");
        }
        else if (r.Action == "return" && next >= 0)
        {
            // Trả về bước trước: giao lại cho người đã chuyển hồ sơ tới bước đang xử lý
            var by = st.Last?.By; assignee = by is null ? null : await Db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username == by);
        }
        else if (r.Action == "withdraw" && next >= 0) assignee = Uc.User;

        // Đợt nghiệm thu phải có ít nhất một công việc mới chuyển duyệt được
        if (rec is VolumeBatch vb && r.Action == "submit" && !await Db.Volumes.AnyAsync(v => v.BatchId == vb.Id))
            return Error(409, "Đợt nghiệm thu chưa có công việc nào.");
        // Hồ sơ thanh toán: khi chuyển duyệt hoặc duyệt xong, tổng các hồ sơ đã chuyển trở lên cộng hồ sơ này không vượt giá trị hợp đồng
        if (rec is Payment pay && (r.Action == "submit" || to == w.Approved) && r.Action != "recall" && pay.ContractId is { } cid)
        {
            var c = await Db.Contracts.AsNoTracking().FirstOrDefaultAsync(x => x.Id == cid);
            if (c is not null)
            {
                var adds = await Db.Addenda.AsNoTracking().Where(a => a.ContractId == cid).ToListAsync();
                var cv = (c.Value ?? 0) + adds.Where(a => string.IsNullOrEmpty(a.Status) || a.Status == "Đã duyệt").Sum(a => a.ValueChange ?? 0);
                var held = new[] { WorkflowDef.Checking, "Chờ duyệt", "Đang trình KBNN", "Đã thanh toán" };
                var otherPays = (await Db.Payments.AsNoTracking().Where(x => x.ContractId == cid && x.Id != pay.Id).ToListAsync())
                    .Where(x => held.Contains(x.Status ?? "")).ToList();
                var others = otherPays.Sum(Payments.Signed);
                if (!Payments.IsRecovery(pay.Kind) && others + (pay.Amount ?? 0) > cv + 1)
                    return Error(409, $"Tổng giá trị thanh toán đã trình ({Vnd(others + (pay.Amount ?? 0))} đ) vượt giá trị hợp đồng ({Vnd(cv)} đ). Kiểm tra lại số tiền hoặc các hồ sơ khác của hợp đồng.");
                if (Payments.IsVolumeKind(pay.Kind) && await Db.Boq.AnyAsync(b => b.ContractId == cid))
                {
                    var acc = await Payments.AcceptedValue(Db, cid);
                    var paidVol = otherPays.Where(x => Payments.IsVolumeKind(x.Kind)).Sum(x => x.Amount ?? 0) + (pay.Amount ?? 0);
                    if (paidVol > acc + 1)
                        return Error(409, $"Lũy kế thanh toán khối lượng hoàn thành ({Vnd(paidVol)} đ) vượt giá trị khối lượng đã nghiệm thu được duyệt ({Vnd(acc)} đ). Chỉ được thanh toán tối đa {Vnd(Math.Max(0, acc - (paidVol - (pay.Amount ?? 0))))} đ.");
                }
            }
        }

        Workflow.SetStatus(rec, to); rec.UpdatedAt = DateTime.UtcNow; rec.UpdatedBy = Uc.User.Username;
        var target = Collections.LabelOf(rec);
        var stepCfg = next >= 0 ? useRoute[next] : null;
        var log = new ApprovalLog
        {
            Id = "apv-" + Guid.NewGuid().ToString("N")[..20], Collection = w.Collection, RecordId = rec.Id, ProjectId = pid, Target = target,
            Action = label, FromStatus = from, ToStatus = to, Note = note == "" ? null : note, By = Uc.User.Username, ByName = Uc.User.Name, At = DateTime.UtcNow,
            Step = stepCfg?.Key, Assignee = stepCfg is null ? null : assignee?.Id, AssigneeName = stepCfg is null ? null : assignee?.Name,
            Due = stepCfg is { DueDays: > 0 } ? Workflow.AddWorkdays(DateOnly.FromDateTime(DateTime.Now), stepCfg.DueDays) : null,
            // Các bước của lần chuyển duyệt được ghi lại để quy trình đổi sau này không ảnh hưởng hồ sơ đang xử lý
            Route = r.Action == "submit" && route is not null ? Workflow.SerializeRoute(route) : null,
            UpdatedAt = DateTime.UtcNow, UpdatedBy = Uc.User.Username
        };
        Db.ApprovalLogs.Add(log);
        Uc.Log(label, def.Label, target + (note == "" ? "" : " – " + note));
        await Db.SaveChangesAsync();
        return Ok(new { record = (object)rec, log });
    }
}

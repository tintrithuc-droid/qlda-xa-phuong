using Microsoft.AspNetCore.Mvc;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Thiết lập quy trình duyệt (bản 1.8): quản trị thêm, đổi tên, sắp xếp bước, chọn người xử lý, hạn xử lý, quy trình riêng của dự án.</summary>
[Route("api/workflow")]
public class WorkflowController : ApiControllerBase
{
    public WorkflowController(AppDbContext db, UserContext uc) : base(db, uc) { }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        return Ok(Workflow.Load(Db));
    }

    [HttpPut]
    public async Task<IActionResult> Put([FromBody] WfConfig cfg)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được thiết lập quy trình duyệt.");
        var pids = Db.Projects.Select(p => p.Id).ToHashSet();
        cfg.Projects = (cfg.Projects ?? new()).Where(x => pids.Contains(x.Key)).ToDictionary(x => x.Key, x => x.Value);
        var saved = Workflow.Save(Db, cfg, Uc.User.Username);
        Uc.Log("Cập nhật", "Quy trình duyệt", string.Join(", ", Workflow.All.Where(w => saved.Flows[w.Collection].Enabled).Select(w => w.Label)));
        await Db.SaveChangesAsync();
        return Ok(saved);
    }
}

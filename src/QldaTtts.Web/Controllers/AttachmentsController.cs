using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>Tệp đính kèm dùng chung cho các bản ghi nghiệp vụ; thùng rác và quản lý dung lượng kho tệp (quản trị).</summary>
[Authorize, Route("api/attachments")]
public class AttachmentsController : ApiControllerBase
{
    public const int TrashDays = 30;
    private readonly FileStore _store;

    public AttachmentsController(AppDbContext db, UserContext uc, FileStore store) : base(db, uc) { _store = store; }

    private bool CanAttach(string collection) =>
        ProjectScope.AttachModules.TryGetValue(collection, out var mods) && mods.Any(m => Uc.Can(m, true));

    /// <summary>Kiểm tra bản ghi tồn tại và thuộc phạm vi; trả về dự án của bản ghi.</summary>
    private async Task<(bool ok, string? projectId, IActionResult? error)> Target(string collection, string recordId)
    {
        var def = Collections.Find(collection);
        if (def is null || !ProjectScope.AttachModules.ContainsKey(collection) || !ValidId(recordId)) return (false, null, Error(400, "Dữ liệu không hợp lệ."));
        var rec = (EntityBase?)await Db.FindAsync(def.Type, recordId);
        if (rec is null) return (false, null, Error(404, "Bản ghi không còn tồn tại."));
        var pid = await ProjectScope.ProjectOf(Db, rec);
        if (!Uc.InScope(pid)) return (false, null, Denied("Dự án này nằm ngoài phạm vi dữ liệu được giao."));
        return (true, pid, null);
    }

    [HttpPost, RequestSizeLimit(FileStore.MaxBytes + 1024 * 1024), RequestFormLimits(MultipartBodyLengthLimit = FileStore.MaxBytes + 1024 * 1024)]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string collection, [FromForm] string recordId, [FromForm] string? kind, [FromForm(Name = "ref")] string? reference)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!CanAttach(collection ?? "")) return Denied();
        var (ok, pid, error) = await Target(collection!, recordId ?? "");
        if (!ok) return error!;
        if (FileStore.Check(file) is { } err) return Error(err.Contains("500 MB") ? 413 : err.StartsWith("Chưa") ? 400 : 415, err);
        var sf = await _store.SaveAsync(file, Uc.User.Username);
        Db.Files.Add(sf);
        var a = new Attachment
        {
            Id = "att-" + Guid.NewGuid().ToString("N")[..20], Collection = collection!, RecordId = recordId!, ProjectId = pid,
            Kind = Trim(kind, 200), Ref = Trim(reference, 100), FileId = sf.Id, FileName = sf.FileName, ContentType = sf.ContentType,
            Size = sf.Size, UploadedBy = Uc.User.Name, UploadedAt = DateTime.UtcNow
        };
        Db.Attachments.Add(a);
        Uc.Log("Đính kèm tệp", Collections.Find(collection!)!.Label, $"{sf.FileName} ({a.Kind ?? "tệp"})");
        await Db.SaveChangesAsync();
        return Ok(a);
    }

    /// <summary>Gỡ tệp đính kèm: chuyển vào thùng rác, quản trị khôi phục được trong 30 ngày.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var a = await Db.Attachments.FirstOrDefaultAsync(x => x.Id == id && x.DeletedAt == null);
        if (a is null) return Error(404, "Tệp đính kèm không còn tồn tại.");
        if (!CanAttach(a.Collection)) return Denied();
        if (!Uc.InScope(a.ProjectId)) return Denied("Dự án này nằm ngoài phạm vi dữ liệu được giao.");
        a.DeletedAt = DateTime.UtcNow; a.DeletedBy = Uc.User.Name;
        Uc.Log("Gỡ tệp đính kèm (vào thùng rác)", Collections.Find(a.Collection)?.Label ?? a.Collection, a.FileName);
        await Db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    // ===== Quản trị kho tệp =====

    /// <summary>Thống kê dung lượng, thùng rác và tệp không còn được dùng.</summary>
    [HttpGet("storage")]
    public async Task<IActionResult> Storage()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied("Chỉ quản trị hệ thống được xem kho tệp.");
        var files = await Db.Files.AsNoTracking().ToListAsync();
        var atts = await Db.Attachments.AsNoTracking().ToListAsync();
        var byCol = atts.Where(a => a.DeletedAt == null).GroupBy(a => a.Collection)
            .Select(g => new { collection = g.Key, label = Collections.Find(g.Key)?.Label ?? g.Key, count = g.Count(), size = g.Sum(x => x.Size) })
            .OrderByDescending(x => x.size).ToList();
        var trash = atts.Where(a => a.DeletedAt != null).OrderByDescending(a => a.DeletedAt).ToList();
        var orphans = await Orphans(files);
        return Ok(new
        {
            files = files.Count, size = files.Sum(f => f.Size), byCollection = byCol, trashDays = TrashDays,
            trash, orphans = new { count = orphans.Count, size = orphans.Sum(f => f.Size) }
        });
    }

    [HttpPost("{id}/restore")]
    public async Task<IActionResult> Restore(string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied();
        var a = await Db.Attachments.FirstOrDefaultAsync(x => x.Id == id && x.DeletedAt != null);
        if (a is null) return Error(404, "Không tìm thấy tệp trong thùng rác.");
        var def = Collections.Find(a.Collection);
        if (def is null || await Db.FindAsync(def.Type, a.RecordId) is null) return Error(409, "Bản ghi gốc của tệp đã bị xóa nên không khôi phục được. Hãy tải tệp về và đính kèm lại vào bản ghi khác.");
        a.DeletedAt = null; a.DeletedBy = null;
        Uc.Log("Khôi phục tệp đính kèm", def.Label, a.FileName);
        await Db.SaveChangesAsync();
        return Ok(a);
    }

    /// <summary>Xóa vĩnh viễn một tệp trong thùng rác.</summary>
    [HttpDelete("{id}/purge")]
    public async Task<IActionResult> Purge(string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied();
        var a = await Db.Attachments.FirstOrDefaultAsync(x => x.Id == id && x.DeletedAt != null);
        if (a is null) return Error(404, "Không tìm thấy tệp trong thùng rác.");
        await PurgeAsync(Db, _store, new[] { a });
        Uc.Log("Xóa vĩnh viễn tệp", "Kho tệp", a.FileName);
        await Db.SaveChangesAsync();
        return Ok(new { purged = 1 });
    }

    /// <summary>Xóa các tệp không còn bản ghi nào sử dụng (tải lên quá 1 ngày).</summary>
    [HttpPost("cleanup")]
    public async Task<IActionResult> Cleanup()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.IsAdmin) return Denied();
        var orphans = await Orphans(await Db.Files.ToListAsync());
        foreach (var f in orphans) { _store.DeletePhysical(f); Db.Files.Remove(f); }
        Uc.Log("Dọn tệp không còn sử dụng", "Kho tệp", $"{orphans.Count} tệp, {orphans.Sum(f => f.Size) / 1048576.0:0.#} MB");
        await Db.SaveChangesAsync();
        return Ok(new { removed = orphans.Count, size = orphans.Sum(f => f.Size) });
    }

    /// <summary>Tệp không được bản ghi nào tham chiếu (kể cả thùng rác) và đã tải lên quá 1 ngày.</summary>
    private async Task<List<StoredFile>> Orphans(List<StoredFile> files)
    {
        var used = new HashSet<string>(await Db.Attachments.AsNoTracking().Select(a => a.FileId).ToListAsync());
        used.UnionWith((await Db.LegalDocuments.AsNoTracking().Select(x => x.AssetId).ToListAsync()).OfType<string>());
        used.UnionWith((await Db.ModelFiles.AsNoTracking().Select(x => x.AssetId).ToListAsync()).OfType<string>());
        used.UnionWith((await Db.Payments.AsNoTracking().Select(x => x.AssetId).ToListAsync()).OfType<string>());
        foreach (var d in await Db.Diaries.AsNoTracking().ToListAsync()) used.UnionWith(d.Photos.Select(p => p.AssetId).OfType<string>());
        used.UnionWith((await Db.Settings.AsNoTracking().Where(s => s.Key == BrandingController.LogoKey).Select(s => s.Value).ToListAsync()).OfType<string>());
        var cutoff = DateTime.UtcNow.AddDays(-1);
        return files.Where(f => !used.Contains(f.Id) && f.UploadedAt < cutoff).ToList();
    }

    /// <summary>Xóa vĩnh viễn: bỏ bản ghi đính kèm; tệp vật lý chỉ xóa khi không còn nơi nào dùng.</summary>
    public static async Task PurgeAsync(AppDbContext db, FileStore store, IEnumerable<Attachment> items)
    {
        foreach (var a in items.ToList())
        {
            db.Attachments.Remove(a);
            var stillUsed = await db.Attachments.AnyAsync(x => x.FileId == a.FileId && x.Id != a.Id)
                || (await ProjectScope.ProjectsOfFile(db, a.FileId)).Count > 0;
            if (!stillUsed && await db.Files.FirstOrDefaultAsync(f => f.Id == a.FileId) is { } sf) { store.DeletePhysical(sf); db.Files.Remove(sf); }
        }
    }

    private static string? Trim(string? s, int max) => string.IsNullOrWhiteSpace(s) ? null : (s.Trim().Length > max ? s.Trim()[..max] : s.Trim());
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QldaTtts.Web.Data;
using QldaTtts.Web.Services;

namespace QldaTtts.Web.Controllers;

/// <summary>
/// Bản 1.10: lịch công tác, lịch họp và thông báo nội bộ.
/// Lịch: mọi tài khoản xem lịch công tác của công ty và tự đăng ký lịch; người tạo sửa lịch của mình; quyền "lich-hop" (sửa) quản lý mọi lịch.
/// Thông báo: người nhận (toàn công ty hoặc phòng ban) xem; quyền "thong-bao" (sửa) đăng, sửa, gỡ và xem ai chưa đọc.
/// </summary>
[Authorize, Route("api/vp")]
public class LichThongBaoController : ApiControllerBase
{
    public LichThongBaoController(AppDbContext db, UserContext uc) : base(db, uc) { }

    public static readonly string[] Kinds = { "Họp", "Làm việc", "Công tác", "Sự kiện" };
    private static string NewId(string p) => p + "-" + Guid.NewGuid().ToString("N")[..16];
    private static List<string> Split(string? s) => (s ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
    private async Task<Employee?> Me() => Uc.User is null ? null : await Db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.UserId == Uc.User.Id);

    // ------------------------------------------------------------------ lịch công tác, lịch họp

    /// <summary>Lịch trong khoảng ngày (giờ Việt Nam, from..to bao gồm cả hai đầu).</summary>
    [HttpGet("meetings")]
    public async Task<IActionResult> Meetings([FromQuery] string from, [FromQuery] string to)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!DateOnly.TryParse(from, out var f) || !DateOnly.TryParse(to, out var t) || t < f || t.DayNumber - f.DayNumber > 400) return Error(400, "Khoảng ngày không hợp lệ.");
        var a = VnTime.ToUtc(f.ToDateTime(TimeOnly.MinValue)); var b = VnTime.ToUtc(t.AddDays(1).ToDateTime(TimeOnly.MinValue));
        var list = await Db.Meetings.AsNoTracking().Where(m => m.StartAt >= a && m.StartAt < b).OrderBy(m => m.StartAt).ToListAsync();
        return Ok(list);
    }

    public record MeetingSave(Meeting M, bool Force);

    [HttpPut("meetings/{id}")]
    public async Task<IActionResult> PutMeeting(string id, [FromBody] MeetingSave body)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var m = body.M;
        if (!ValidId(id) || string.IsNullOrWhiteSpace(m.Title)) return Error(400, "Nhập nội dung.");
        if (m.EndAt is { } e && e <= m.StartAt) return Error(400, "Giờ kết thúc phải sau giờ bắt đầu.");
        if (!Kinds.Contains(m.Kind)) m.Kind = "Họp";
        var x = await Db.Meetings.FindAsync(id);
        if (x is not null && x.CreatedByUserId != Uc.User.Id && !Uc.Can("lich-hop", true)) return Denied("Chỉ người tạo lịch hoặc người quản lý lịch được sửa.");
        // Trùng phòng họp: cùng địa điểm, thời gian giao nhau (không tính lịch đã hủy, hoãn)
        if (!body.Force && !string.IsNullOrWhiteSpace(m.Place))
        {
            var end = m.EndAt ?? m.StartAt.AddHours(1); var place = m.Place.Trim().ToLower();
            var clash = (await Db.Meetings.AsNoTracking().Where(o => o.Id != id && o.Status == "Đã lên lịch" && o.StartAt < end && o.StartAt > m.StartAt.AddDays(-1)).ToListAsync())
                .FirstOrDefault(o => (o.Place ?? "").Trim().ToLower() == place && (o.EndAt ?? o.StartAt.AddHours(1)) > m.StartAt);
            if (clash is not null)
                return Error(409, $"{m.Place.Trim()} đã có lịch \"{clash.Title}\" lúc {VnTime.ToVn(clash.StartAt):HH:mm dd/MM}. Vẫn lưu?");
        }
        if (x is null) { x = new Meeting { Id = id, CreatedByUserId = Uc.User.Id, CreatedAt = DateTime.UtcNow }; Db.Meetings.Add(x); }
        x.Kind = m.Kind; x.Title = m.Title.Trim(); x.StartAt = m.StartAt; x.EndAt = m.EndAt; x.Place = m.Place?.Trim(); x.OnlineLink = m.OnlineLink?.Trim();
        x.Chair = m.Chair?.Trim(); x.Participants = m.Participants?.Trim(); x.AttendeeIds = string.Join(",", Split(m.AttendeeIds).Where(ValidId).Distinct());
        x.Preparer = m.Preparer?.Trim(); x.Content = m.Content; x.Conclusion = m.Conclusion;
        x.Status = m.Status is "Đã hoãn" or "Đã hủy" ? m.Status : "Đã lên lịch";
        x.UpdatedAt = DateTime.UtcNow; x.UpdatedBy = Uc.User.Username;
        Uc.Log("Cập nhật lịch công tác", "Lịch công tác", $"{x.Title} ({VnTime.ToVn(x.StartAt):dd/MM/yyyy HH:mm})", "meetings", x.Id);
        await Db.SaveChangesAsync();
        return Ok(x);
    }

    [HttpDelete("meetings/{id}")]
    public async Task<IActionResult> DeleteMeeting(string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var x = await Db.Meetings.FindAsync(id); if (x is null) return NotFound();
        if (x.CreatedByUserId != Uc.User.Id && !Uc.Can("lich-hop", true)) return Denied();
        Db.Meetings.Remove(x); Uc.Log("Xóa lịch công tác", "Lịch công tác", x.Title, "meetings", x.Id);
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    // ------------------------------------------------------------------ thông báo

    private async Task<bool> ForMe(Notice n, Employee? me)
    {
        if (Uc.Can("thong-bao", true) || n.CreatedByUserId == Uc.User!.Id) return true;
        var d = Split(n.DeptIds); if (d.Count == 0) return true;
        return me?.DepartmentId is { } md && d.Contains(md);
    }

    /// <summary>Thông báo của tôi (còn hạn, đúng phòng ban), mới nhất trước; kèm đã đọc và (người đăng) số người đã xem.</summary>
    [HttpGet("notices")]
    public async Task<IActionResult> Notices([FromQuery] bool all = false)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var me = await Me(); var today = DateOnly.FromDateTime(VnTime.Now); var mgr = Uc.Can("thong-bao", true);
        var list = await Db.Notices.AsNoTracking().OrderByDescending(n => n.Pinned).ThenByDescending(n => n.PublishedAt).Take(500).ToListAsync();
        var reads = await Db.NoticeReads.AsNoTracking().Where(r => r.UserId == Uc.User.Id).Select(r => r.NoticeId).ToListAsync();
        var counts = mgr ? await Db.NoticeReads.AsNoTracking().GroupBy(r => r.NoticeId).Select(g => new { g.Key, n = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.n) : new();
        var outp = new List<object>();
        foreach (var n in list)
        {
            if (!await ForMe(n, me)) continue;
            var expired = n.ExpireOn is { } ex && ex < today;
            if (expired && !(all && (mgr || n.CreatedByUserId == Uc.User.Id))) continue;
            outp.Add(new { n.Id, n.Title, n.Body, n.Important, n.Pinned, n.DeptIds, n.PublishedAt, n.ExpireOn, n.AuthorName, n.Link, n.CreatedByUserId,
                read = reads.Contains(n.Id) || n.CreatedByUserId == Uc.User.Id, expired, readCount = counts.TryGetValue(n.Id, out var c) ? c : (int?)null });
        }
        return Ok(outp);
    }

    [HttpPut("notices/{id}")]
    public async Task<IActionResult> PutNotice(string id, [FromBody] Notice n)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("thong-bao", true)) return Denied("Bạn chưa có quyền đăng thông báo.");
        if (!ValidId(id) || string.IsNullOrWhiteSpace(n.Title)) return Error(400, "Nhập tiêu đề.");
        var x = await Db.Notices.FindAsync(id);
        if (x is null) { x = new Notice { Id = id, CreatedByUserId = Uc.User.Id, PublishedAt = DateTime.UtcNow, AuthorName = Uc.User.Name }; Db.Notices.Add(x); }
        x.Title = n.Title.Trim(); x.Body = n.Body; x.Important = n.Important; x.Pinned = n.Pinned; x.ExpireOn = n.ExpireOn; x.Link = n.Link?.Trim();
        x.DeptIds = string.Join(",", Split(n.DeptIds).Where(ValidId).Distinct());
        x.UpdatedAt = DateTime.UtcNow; x.UpdatedBy = Uc.User.Username;
        Uc.Log("Đăng thông báo", "Thông báo", x.Title, "notices", x.Id);
        await Db.SaveChangesAsync();
        return Ok(x);
    }

    [HttpDelete("notices/{id}")]
    public async Task<IActionResult> DeleteNotice(string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!Uc.Can("thong-bao", true)) return Denied();
        var x = await Db.Notices.FindAsync(id); if (x is null) return NotFound();
        Db.NoticeReads.RemoveRange(Db.NoticeReads.Where(r => r.NoticeId == id));
        Db.Notices.Remove(x); Uc.Log("Gỡ thông báo", "Thông báo", x.Title, "notices", x.Id);
        await Db.SaveChangesAsync(); return Ok(new { ok = true });
    }

    /// <summary>Đánh dấu đã xem.</summary>
    [HttpPost("notices/{id}/read")]
    public async Task<IActionResult> ReadNotice(string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        if (!await Db.Notices.AnyAsync(n => n.Id == id)) return NotFound();
        if (!await Db.NoticeReads.AnyAsync(r => r.NoticeId == id && r.UserId == Uc.User.Id))
        {
            Db.NoticeReads.Add(new NoticeRead { Id = NewId("xem"), NoticeId = id, UserId = Uc.User.Id, ReadAt = DateTime.UtcNow });
            try { await Db.SaveChangesAsync(); } catch (DbUpdateException) { /* bấm hai lần cùng lúc */ }
        }
        return Ok(new { ok = true });
    }

    /// <summary>Người nhận đã xem, chưa xem (người đăng, quản lý thông báo).</summary>
    [HttpGet("notices/{id}/reads")]
    public async Task<IActionResult> NoticeReads(string id)
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var n = await Db.Notices.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id); if (n is null) return NotFound();
        if (!Uc.Can("thong-bao", true) && n.CreatedByUserId != Uc.User.Id) return Denied();
        var d = Split(n.DeptIds);
        var emps = await Db.Employees.AsNoTracking().Where(e => e.UserId != null && e.Status != "Nghỉ việc").ToListAsync();
        emps = emps.Where(e => d.Count == 0 || (e.DepartmentId != null && d.Contains(e.DepartmentId))).OrderBy(e => e.Name).ToList();
        var reads = await Db.NoticeReads.AsNoTracking().Where(r => r.NoticeId == id).ToDictionaryAsync(r => r.UserId, r => r.ReadAt);
        return Ok(emps.Select(e => new { e.Id, e.Name, e.DepartmentId, readAt = reads.TryGetValue(e.UserId!, out var t) ? t : (DateTime?)null }));
    }

    /// <summary>Số thông báo chưa xem, thông báo quan trọng chưa xem, lịch hôm nay và sắp tới của tôi (trang Điểm danh, menu).</summary>
    [HttpGet("inbox")]
    public async Task<IActionResult> Inbox()
    {
        await Uc.LoadAsync(); if (Uc.User is null) return NotSignedIn();
        var me = await Me(); var now = VnTime.Now; var today = DateOnly.FromDateTime(now);
        var reads = (await Db.NoticeReads.AsNoTracking().Where(r => r.UserId == Uc.User.Id).Select(r => r.NoticeId).ToListAsync()).ToHashSet();
        var since = DateTime.UtcNow.AddDays(-60);
        var ns = await Db.Notices.AsNoTracking().Where(n => n.PublishedAt >= since || n.Pinned).OrderByDescending(n => n.PublishedAt).ToListAsync();
        var unread = new List<Notice>();
        foreach (var n in ns)
            if (!reads.Contains(n.Id) && !(n.ExpireOn is { } ex && ex < today) && n.CreatedByUserId != Uc.User.Id && await ForMe(n, me)) unread.Add(n);
        var a = VnTime.ToUtc(today.ToDateTime(TimeOnly.MinValue)); var b = VnTime.ToUtc(today.AddDays(8).ToDateTime(TimeOnly.MinValue));
        var ms = await Db.Meetings.AsNoTracking().Where(m => m.StartAt >= a && m.StartAt < b && m.Status != "Đã hủy").OrderBy(m => m.StartAt).ToListAsync();
        var mine = ms.Where(m => (me is not null && Split(m.AttendeeIds).Contains(me.Id)) || m.CreatedByUserId == Uc.User.Id).Take(10);
        return Ok(new
        {
            unread = unread.Count,
            important = unread.Where(n => n.Important).Take(3).Select(n => new { n.Id, n.Title, n.PublishedAt }),
            meetings = mine
        });
    }
}

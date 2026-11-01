using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using QldaTtts.Web.Data;
using QRCoder;

namespace QldaTtts.Web.Services;

/// <summary>
/// Xác thực 2 lớp bằng mã dùng một lần theo thời gian (TOTP, RFC 6238: HMAC-SHA1, 6 số, chu kỳ 30 giây),
/// dùng được với Google Authenticator, Microsoft Authenticator và các ứng dụng tương đương.
/// Khóa bí mật được mã hóa bằng Data Protection trước khi lưu; mã khôi phục chỉ lưu dạng băm, mỗi mã dùng một lần.
/// </summary>
public class TwoFactor
{
    public const int Digits = 6, Period = 30, RecoveryCount = 10;
    public const string TicketCookie = "qlda.mfa";
    public static readonly TimeSpan TicketLife = TimeSpan.FromMinutes(5);
    private const string B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private readonly IDataProtector _secret, _ticket;
    private readonly IConfiguration _cfg;

    public TwoFactor(IDataProtectionProvider dp, IConfiguration cfg)
    {
        _secret = dp.CreateProtector("QldaTtts.TwoFactor.Secret");
        _ticket = dp.CreateProtector("QldaTtts.TwoFactor.Ticket");
        _cfg = cfg;
    }

    /// <summary>Bắt buộc xác thực 2 lớp với nhóm có toàn quyền (mặc định bật).</summary>
    public bool RequiredForAdmins => _cfg.GetValue("Security:RequireTwoFactorForAdmins", true);
    public string Issuer => _cfg["Security:TwoFactorIssuer"] is { Length: > 0 } s ? s : "QLDA Xa Phuong";

    public bool Required(AppUser u, UserGroup? g) => u.TotpSecret is not null || (RequiredForAdmins && g?.Admin == true);

    // ---- Khóa bí mật ----
    public static string NewSecret() => Base32(RandomNumberGenerator.GetBytes(20));
    public string Protect(string secret) => _secret.Protect(secret);
    public string? Unprotect(string? stored)
    {
        if (stored is null) return null;
        try { return _secret.Unprotect(stored); } catch (CryptographicException) { return null; }
    }

    public string OtpAuthUri(string username, string secret) =>
        $"otpauth://totp/{Uri.EscapeDataString(Issuer)}:{Uri.EscapeDataString(username)}?secret={secret}&issuer={Uri.EscapeDataString(Issuer)}&algorithm=SHA1&digits={Digits}&period={Period}";

    public static string QrSvg(string text)
    {
        using var gen = new QRCodeGenerator();
        using var data = gen.CreateQrCode(text, QRCodeGenerator.ECCLevel.M);
        return new SvgQRCode(data).GetGraphic(new System.Drawing.Size(220, 220), "#000000", "#ffffff", true, SvgQRCode.SizingMode.ViewBoxAttribute);
    }

    /// <summary>Kiểm tra mã 6 số, cho phép lệch ±1 chu kỳ; trả về chu kỳ khớp (để chặn dùng lại) hoặc null.</summary>
    public static long? Verify(string secret, string? code, long lastStep, DateTime? now = null)
    {
        code = Normalize(code);
        if (code.Length != Digits || !code.All(char.IsAsciiDigit)) return null;
        var key = FromBase32(secret);
        var step = new DateTimeOffset(now ?? DateTime.UtcNow).ToUnixTimeSeconds() / Period;
        for (var s = step - 1; s <= step + 1; s++)
            if (s > lastStep && CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(Code(key, s)), Encoding.ASCII.GetBytes(code)))
                return s;
        return null;
    }

    public static string Code(byte[] key, long step)
    {
        var msg = BitConverter.GetBytes(step); if (BitConverter.IsLittleEndian) Array.Reverse(msg);
        var h = HMACSHA1.HashData(key, msg);
        var o = h[^1] & 0x0f;
        var bin = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
        return (bin % 1_000_000).ToString("D6");
    }

    // ---- Mã khôi phục ----
    /// <summary>Tạo bộ mã mới: trả về mã hiển thị cho người dùng và chuỗi băm để lưu.</summary>
    public static (List<string> codes, string stored) NewRecoveryCodes()
    {
        var codes = Enumerable.Range(0, RecoveryCount).Select(_ =>
        {
            var s = Base32(RandomNumberGenerator.GetBytes(7))[..10].ToLowerInvariant();
            return s[..5] + "-" + s[5..];
        }).ToList();
        return (codes, string.Join(";", codes.Select(HashRecovery)));
    }
    public static int RecoveryLeft(AppUser u) => string.IsNullOrEmpty(u.RecoveryCodes) ? 0 : u.RecoveryCodes.Split(';').Length;
    /// <summary>Dùng một mã khôi phục: đúng thì gạch bỏ mã đó khỏi danh sách.</summary>
    public static bool UseRecovery(AppUser u, string? code)
    {
        if (string.IsNullOrEmpty(u.RecoveryCodes)) return false;
        var c = Normalize(code).ToLowerInvariant();
        if (c.Length != 10) return false;
        var h = HashRecovery(c[..5] + "-" + c[5..]);
        var list = u.RecoveryCodes.Split(';').ToList();
        var i = list.FindIndex(x => CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(x), Encoding.ASCII.GetBytes(h)));
        if (i < 0) return false;
        list.RemoveAt(i);
        u.RecoveryCodes = list.Count == 0 ? null : string.Join(";", list);
        return true;
    }
    private static string HashRecovery(string c) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("qlda-rc|" + c)));
    private static string Normalize(string? s) => new((s ?? "").Where(ch => !char.IsWhiteSpace(ch) && ch != '-').ToArray());

    // ---- Phiếu tạm giữa bước mật khẩu và bước mã (cookie HttpOnly, mã hóa, sống 5 phút) ----
    public record Ticket(string UserId, string Stamp, long Exp, string? Secret);

    public void IssueTicket(HttpContext http, AppUser u, string? enrollSecret)
    {
        var t = new Ticket(u.Id, Passwords.Stamp(u), DateTimeOffset.UtcNow.Add(TicketLife).ToUnixTimeSeconds(), enrollSecret);
        http.Response.Cookies.Append(TicketCookie, _ticket.Protect(JsonSerializer.Serialize(t)), new CookieOptions
        {
            HttpOnly = true, SameSite = SameSiteMode.Strict, Secure = http.Request.IsHttps, Path = "/api/auth", MaxAge = TicketLife, IsEssential = true
        });
    }
    public Ticket? ReadTicket(HttpContext http)
    {
        if (!http.Request.Cookies.TryGetValue(TicketCookie, out var raw)) return null;
        try
        {
            var t = JsonSerializer.Deserialize<Ticket>(_ticket.Unprotect(raw));
            return t is not null && t.Exp > DateTimeOffset.UtcNow.ToUnixTimeSeconds() ? t : null;
        }
        catch (Exception ex) when (ex is CryptographicException or JsonException) { return null; }
    }
    public static void ClearTicket(HttpContext http) => http.Response.Cookies.Delete(TicketCookie, new CookieOptions { Path = "/api/auth" });

    // ---- Base32 (RFC 4648, không đệm) ----
    public static string Base32(byte[] data)
    {
        var sb = new StringBuilder(); int buf = 0, bits = 0;
        foreach (var b in data)
        {
            buf = (buf << 8) | b; bits += 8;
            while (bits >= 5) { sb.Append(B32[(buf >> (bits - 5)) & 31]); bits -= 5; }
        }
        if (bits > 0) sb.Append(B32[(buf << (5 - bits)) & 31]);
        return sb.ToString();
    }
    public static byte[] FromBase32(string s)
    {
        var bytes = new List<byte>(); int buf = 0, bits = 0;
        foreach (var ch in s.ToUpperInvariant())
        {
            var v = B32.IndexOf(ch); if (v < 0) continue;
            buf = (buf << 5) | v; bits += 5;
            if (bits >= 8) { bytes.Add((byte)(buf >> (bits - 8))); bits -= 8; }
        }
        return bytes.ToArray();
    }
}

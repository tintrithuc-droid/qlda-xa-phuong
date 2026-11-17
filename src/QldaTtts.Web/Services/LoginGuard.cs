using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

namespace QldaTtts.Web.Services;

/// <summary>
/// Mục 32: chống dò mật khẩu và chống cố tình làm khóa tài khoản người khác.
/// - Không khóa cứng tài khoản trên toàn hệ thống khi nhập sai mật khẩu; chỉ chặn tạm cặp (địa chỉ IP, tài khoản) đang nhập sai liên tục,
///   máy khác (ví dụ máy của chính lãnh đạo) vẫn đăng nhập bình thường.
/// - Chặn tạm địa chỉ IP dò quét nhiều tài khoản.
/// - Sau vài lần sai (theo IP hoặc theo tài khoản) bắt buộc nhập mã kiểm tra (CAPTCHA) do chính máy chủ sinh ra,
///   không phụ thuộc dịch vụ bên ngoài, chạy được cả khi máy chủ không ra Internet.
/// Dữ liệu đếm giữ trong bộ nhớ, tự hết hạn sau cửa sổ 15 phút.
/// </summary>
public class LoginGuard
{
    public static readonly TimeSpan Window = TimeSpan.FromMinutes(15);
    public const int UserCaptchaAfter = 3;  // một tài khoản bị nhập sai từ 3 lần (từ bất kỳ máy nào) → phải nhập mã kiểm tra
    public const int IpCaptchaAfter = 10;   // một IP nhập sai từ 10 lần → phải nhập mã kiểm tra (cả cơ quan có thể dùng chung một IP Internet)
    public const int PairBlockAfter = 10;   // cùng một IP nhập sai một tài khoản 10 lần → chặn cặp IP–tài khoản 15 phút
    public const int IpBlockAfter = 30;     // một IP nhập sai 30 lần (nhiều tài khoản) → chặn IP 15 phút

    private sealed class Counter { public int Count; public DateTime Since = DateTime.UtcNow; public DateTime? BlockedUntil; }
    private readonly ConcurrentDictionary<string, Counter> _c = new();
    private sealed record Captcha(string Answer, DateTime Expires);
    private readonly ConcurrentDictionary<string, Captcha> _cap = new();

    private static string IpKey(string ip) => "ip:" + ip;
    private static string UserKey(string user) => "u:" + user;
    private static string PairKey(string ip, string user) => "p:" + ip + "|" + user;

    private Counter? Get(string key)
    {
        if (!_c.TryGetValue(key, out var c)) return null;
        var now = DateTime.UtcNow;
        if (c.BlockedUntil is { } b && b > now) return c;
        if (now - c.Since > Window) { _c.TryRemove(key, out _); return null; }
        return c;
    }
    private int Count(string key) => Get(key)?.Count ?? 0;

    /// <summary>Còn bị chặn bao lâu (null = không bị chặn).</summary>
    public TimeSpan? Blocked(string ip, string user)
    {
        var now = DateTime.UtcNow;
        foreach (var k in new[] { IpKey(ip), PairKey(ip, user) })
            if (Get(k)?.BlockedUntil is { } b && b > now) return b - now;
        return null;
    }

    public bool NeedCaptcha(string ip, string user) => Count(IpKey(ip)) >= IpCaptchaAfter || (user.Length > 0 && Count(UserKey(user)) >= UserCaptchaAfter);

    public void Fail(string ip, string user)
    {
        Bump(IpKey(ip), IpBlockAfter);
        if (user.Length == 0) return;
        Bump(UserKey(user), int.MaxValue);   // theo tài khoản chỉ dùng để bật CAPTCHA, không bao giờ khóa tài khoản
        Bump(PairKey(ip, user), PairBlockAfter);
        if (_c.Count > 50_000) Sweep();
    }

    public void Success(string ip, string user)
    {
        _c.TryRemove(PairKey(ip, user), out _);
        _c.TryRemove(UserKey(user), out _);
    }

    private void Bump(string key, int blockAfter)
    {
        var now = DateTime.UtcNow;
        var c = _c.AddOrUpdate(key, _ => new Counter { Count = 1 }, (_, old) =>
        {
            if (old.BlockedUntil is { } b && b > now) return old;
            if (now - old.Since > Window) return new Counter { Count = 1 };
            old.Count++; return old;
        });
        if (c.Count >= blockAfter && c.BlockedUntil is null) c.BlockedUntil = now + Window;
    }

    private void Sweep()
    {
        var now = DateTime.UtcNow;
        foreach (var (k, v) in _c) if ((v.BlockedUntil ?? v.Since + Window) < now) _c.TryRemove(k, out _);
        foreach (var (k, v) in _cap) if (v.Expires < now) _cap.TryRemove(k, out _);
    }

    // ---- Mã kiểm tra (CAPTCHA) hình ảnh tự sinh ----
    private const string Alphabet = "ACDEFHJKMNPRTUVWXY34679";   // bỏ ký tự dễ nhầm (0/O, 1/I/L, 2/Z, 5/S, 8/B)

    public (string id, string img) NewCaptcha()
    {
        if (_cap.Count > 20_000) Sweep();
        var code = new string(Enumerable.Range(0, 5).Select(_ => Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)]).ToArray());
        var id = Convert.ToHexString(RandomNumberGenerator.GetBytes(12)).ToLowerInvariant();
        _cap[id] = new Captcha(code, DateTime.UtcNow.AddMinutes(5));
        return (id, Svg(code));
    }

    /// <summary>Kiểm tra mã; mỗi mã chỉ dùng một lần (đúng hay sai đều hủy).</summary>
    public bool CheckCaptcha(string? id, string? answer)
    {
        if (string.IsNullOrEmpty(id) || !_cap.TryRemove(id, out var c) || c.Expires < DateTime.UtcNow) return false;
        var a = (answer ?? "").Trim().ToUpperInvariant();
        return CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(a), Encoding.ASCII.GetBytes(c.Answer));
    }

    private static int R(int max) => RandomNumberGenerator.GetInt32(max);

    /* Mục 42: chữ của mã kiểm tra được vẽ thành nét (path) ngay trên máy chủ từ bộ nét chữ riêng, mỗi ký tự biến dạng ngẫu nhiên
       (xoay, nghiêng, co giãn, rung từng điểm) và trộn nét nhiễu; ảnh gửi về dạng data:image/svg+xml;base64 hiển thị bằng <img>.
       Trong ảnh không còn ký tự văn bản nào (không có thẻ text, không có font) nên không bôi đen/sao chép được và bot không đọc được mã từ mã nguồn trang. */
    private static readonly Dictionary<char, int[][]> Glyph = new()
    {
        ['A'] = new[] { new[] { 0, 14, 5, 0, 10, 14 }, new[] { 2, 9, 8, 9 } },
        ['C'] = new[] { new[] { 10, 2, 8, 0, 3, 0, 0, 3, 0, 11, 3, 14, 8, 14, 10, 12 } },
        ['D'] = new[] { new[] { 0, 0, 0, 14, 6, 14, 10, 10, 10, 4, 6, 0, 0, 0 } },
        ['E'] = new[] { new[] { 10, 0, 0, 0, 0, 14, 10, 14 }, new[] { 0, 7, 7, 7 } },
        ['F'] = new[] { new[] { 10, 0, 0, 0, 0, 14 }, new[] { 0, 7, 7, 7 } },
        ['H'] = new[] { new[] { 0, 0, 0, 14 }, new[] { 10, 0, 10, 14 }, new[] { 0, 7, 10, 7 } },
        ['J'] = new[] { new[] { 10, 0, 10, 11, 7, 14, 3, 14, 0, 11 } },
        ['K'] = new[] { new[] { 0, 0, 0, 14 }, new[] { 10, 0, 0, 9 }, new[] { 3, 6, 10, 14 } },
        ['M'] = new[] { new[] { 0, 14, 0, 0, 5, 8, 10, 0, 10, 14 } },
        ['N'] = new[] { new[] { 0, 14, 0, 0, 10, 14, 10, 0 } },
        ['P'] = new[] { new[] { 0, 14, 0, 0, 7, 0, 10, 2, 10, 5, 7, 7, 0, 7 } },
        ['R'] = new[] { new[] { 0, 14, 0, 0, 7, 0, 10, 2, 10, 5, 7, 7, 0, 7 }, new[] { 5, 7, 10, 14 } },
        ['T'] = new[] { new[] { 0, 0, 10, 0 }, new[] { 5, 0, 5, 14 } },
        ['U'] = new[] { new[] { 0, 0, 0, 11, 3, 14, 7, 14, 10, 11, 10, 0 } },
        ['V'] = new[] { new[] { 0, 0, 5, 14, 10, 0 } },
        ['W'] = new[] { new[] { 0, 0, 2, 14, 5, 5, 8, 14, 10, 0 } },
        ['X'] = new[] { new[] { 0, 0, 10, 14 }, new[] { 10, 0, 0, 14 } },
        ['Y'] = new[] { new[] { 0, 0, 5, 7, 10, 0 }, new[] { 5, 7, 5, 14 } },
        ['3'] = new[] { new[] { 0, 1, 3, 0, 8, 0, 10, 2, 10, 5, 7, 7, 3, 7 }, new[] { 7, 7, 10, 9, 10, 12, 8, 14, 3, 14, 0, 13 } },
        ['4'] = new[] { new[] { 8, 14, 8, 0, 0, 10, 10, 10 } },
        ['6'] = new[] { new[] { 9, 1, 6, 0, 3, 0, 0, 4, 0, 11, 3, 14, 7, 14, 10, 11, 10, 9, 7, 7, 3, 7, 0, 9 } },
        ['7'] = new[] { new[] { 0, 0, 10, 0, 4, 14 } },
        ['9'] = new[] { new[] { 10, 5, 7, 7, 3, 7, 0, 5, 0, 3, 3, 0, 7, 0, 10, 3, 10, 10, 7, 14, 3, 14, 1, 13 } },
    };

    private static string F(double v) => v.ToString("0.#", System.Globalization.CultureInfo.InvariantCulture);
    private static double Rd(double a, double b) => a + RandomNumberGenerator.GetInt32(0, 10_000) / 10_000.0 * (b - a);

    private static string Svg(string code)
    {
        var sb = new StringBuilder();
        sb.Append("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 160 52\" width=\"160\" height=\"52\">");
        sb.Append("<rect width=\"160\" height=\"52\" rx=\"6\" fill=\"#f1f4f9\"/>");
        for (var i = 0; i < 6; i++)
            sb.Append($"<path d=\"M{R(160)} {R(52)} Q{R(160)} {R(52)} {R(160)} {R(52)}\" stroke=\"#{R(0x80) + 0x50:x2}{R(0x80) + 0x50:x2}{R(0x80) + 0x60:x2}\" stroke-width=\"{1 + R(2)}\" fill=\"none\"/>");
        for (var i = 0; i < code.Length; i++)
        {
            var g = Glyph[code[i]];
            double sx = Rd(1.75, 2.15), sy = Rd(2.15, 2.6), rot = Rd(-0.4, 0.4), sh = Rd(-0.25, 0.25);
            double cx = 18 + i * 28 + Rd(-2, 3), cy = 26 + Rd(-3, 3);
            double cos = Math.Cos(rot), sin = Math.Sin(rot);
            var d = new StringBuilder();
            foreach (var st in g)
                for (var p = 0; p < st.Length; p += 2)
                {
                    double x = (st[p] - 5 + sh * (st[p + 1] - 7)) * sx + Rd(-0.9, 0.9), y = (st[p + 1] - 7) * sy + Rd(-0.9, 0.9);
                    double X = cx + x * cos - y * sin, Y = cy + x * sin + y * cos;
                    d.Append(p == 0 ? 'M' : 'L').Append(F(X)).Append(' ').Append(F(Y)).Append(' ');
                }
            sb.Append($"<path d=\"{d.ToString().TrimEnd()}\" fill=\"none\" stroke=\"#{R(0x50) + 0x10:x2}{R(0x50) + 0x20:x2}{R(0x60) + 0x40:x2}\" stroke-width=\"{F(Rd(2.6, 3.4))}\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
        }
        for (var i = 0; i < 3; i++)   // nét nhiễu cắt ngang chữ
            sb.Append($"<path d=\"M0 {R(52)} C{R(60)} {R(52)} {60 + R(60)} {R(52)} 160 {R(52)}\" stroke=\"#6b7a92\" stroke-opacity=\".55\" stroke-width=\"1.3\" fill=\"none\"/>");
        for (var i = 0; i < 30; i++) sb.Append($"<circle cx=\"{R(160)}\" cy=\"{R(52)}\" r=\"1\" fill=\"#8a94a6\"/>");
        sb.Append("</svg>");
        return "data:image/svg+xml;base64," + Convert.ToBase64String(Encoding.UTF8.GetBytes(sb.ToString()));
    }
}

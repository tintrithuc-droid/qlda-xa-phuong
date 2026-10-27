using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using QldaTtts.Web.Data;

namespace QldaTtts.Web.Services;

/// <summary>Băm mật khẩu PBKDF2 (ASP.NET Core Identity) và quy tắc độ mạnh mật khẩu.</summary>
public static class Passwords
{
    private static readonly PasswordHasher<AppUser> Hasher = new();
    public static string Hash(AppUser u, string pw) => Hasher.HashPassword(u, pw);
    public static bool Verify(AppUser u, string pw) =>
        !string.IsNullOrEmpty(u.PasswordHash) && Hasher.VerifyHashedPassword(u, u.PasswordHash, pw) != PasswordVerificationResult.Failed;
    public static bool Strong(string? pw) => pw is { Length: >= 8 } && Regex.IsMatch(pw, "[A-Za-z]") && Regex.IsMatch(pw, "\\d");
    public static bool ValidUsername(string? u) => u is not null && Regex.IsMatch(u, "^[a-z0-9._-]{3,32}$");
    public const string WeakMessage = "Mật khẩu cần tối thiểu 8 ký tự, gồm cả chữ và số.";
    public const string UsernameMessage = "Tên đăng nhập 3–32 ký tự, chỉ gồm chữ thường không dấu, số, dấu chấm, gạch.";
}

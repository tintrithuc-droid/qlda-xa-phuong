using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace QldaTtts.Web.Data;

/// <summary>Đọc ngày dạng "yyyy-MM-dd"; chuỗi rỗng được hiểu là không có giá trị.</summary>
public class LenientDateOnlyConverter : JsonConverter<DateOnly?>
{
    public override DateOnly? Read(ref Utf8JsonReader r, Type t, JsonSerializerOptions o)
    {
        if (r.TokenType == JsonTokenType.Null) return null;
        var s = r.GetString();
        if (string.IsNullOrWhiteSpace(s)) return null;
        if (s.Length > 10) s = s[..10];
        return DateOnly.TryParseExact(s, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d) ? d : null;
    }
    public override void Write(Utf8JsonWriter w, DateOnly? v, JsonSerializerOptions o)
    {
        if (v is null) w.WriteNullValue(); else w.WriteStringValue(v.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
    }
}

/// <summary>Số từ giao diện có thể là chuỗi rỗng hoặc null.</summary>
public class LenientNumberConverter<T> : JsonConverter<T?> where T : struct
{
    public override T? Read(ref Utf8JsonReader r, Type t, JsonSerializerOptions o)
    {
        switch (r.TokenType)
        {
            case JsonTokenType.Null: return null;
            case JsonTokenType.Number:
                if (typeof(T) == typeof(int)) return (T)(object)(int)Math.Round(r.GetDouble());
                if (typeof(T) == typeof(long)) return (T)(object)(long)Math.Round(r.GetDouble());
                if (typeof(T) == typeof(decimal)) return (T)(object)r.GetDecimal();
                return (T)(object)r.GetDouble();
            case JsonTokenType.String:
                var s = r.GetString();
                if (string.IsNullOrWhiteSpace(s)) return null;
                return (T)Convert.ChangeType(double.Parse(s, CultureInfo.InvariantCulture), typeof(T), CultureInfo.InvariantCulture);
            default: throw new JsonException("Giá trị số không hợp lệ");
        }
    }
    public override void Write(Utf8JsonWriter w, T? v, JsonSerializerOptions o)
    {
        if (v is null) { w.WriteNullValue(); return; }
        switch (v.Value)
        {
            case int i: w.WriteNumberValue(i); break;
            case long l: w.WriteNumberValue(l); break;
            case decimal d: w.WriteNumberValue(d); break;
            case double db: w.WriteNumberValue(db); break;
        }
    }
}

public static class JsonConfig
{
    public static void Apply(JsonSerializerOptions o)
    {
        o.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.PropertyNameCaseInsensitive = true;
        o.Converters.Add(new LenientDateOnlyConverter());
        o.Converters.Add(new LenientNumberConverter<int>());
        o.Converters.Add(new LenientNumberConverter<long>());
        o.Converters.Add(new LenientNumberConverter<double>());
        o.Converters.Add(new LenientNumberConverter<decimal>());
    }
    public static readonly JsonSerializerOptions Options = Create();
    private static JsonSerializerOptions Create() { var o = new JsonSerializerOptions(); Apply(o); return o; }
}

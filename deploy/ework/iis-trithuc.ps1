# Tạo site IIS chuyển tiếp tên miền QLDA sang dịch vụ Kestrel nội bộ (cần URL Rewrite + ARR).
param([string]$TenMien = "trithuc.qlda.trithucsoft.vn", [int]$Cong = 8090, [string]$ThuMuc = "D:\QLDA\trithuc")
$ErrorActionPreference = "Stop"
Import-Module WebAdministration
$ah = 'MACHINE/WEBROOT/APPHOST'
Set-WebConfigurationProperty -pspath $ah -filter 'system.webServer/proxy' -name enabled -value True
Set-WebConfigurationProperty -pspath $ah -filter 'system.webServer/proxy' -name preserveHostHeader -value True
Set-WebConfigurationProperty -pspath $ah -filter 'system.webServer/proxy' -name reverseRewriteHostInResponseHeaders -value False
Set-WebConfigurationProperty -pspath $ah -filter 'system.webServer/proxy' -name timeout -value '00:10:00'
$sv = Get-WebConfigurationProperty -pspath $ah -filter 'system.webServer/rewrite/allowedServerVariables' -name collection
if (-not ($sv | Where-Object name -eq 'HTTP_X_FORWARDED_PROTO')) {
  Add-WebConfigurationProperty -pspath $ah -filter 'system.webServer/rewrite/allowedServerVariables' -name . -value @{ name = 'HTTP_X_FORWARDED_PROTO' }
}
$root = Join-Path $ThuMuc "iis"
New-Item -ItemType Directory -Force $root | Out-Null
@"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="QLDA https" stopProcessing="true">
          <match url="(.*)" />
          <conditions><add input="{HTTPS}" pattern="^ON$" /></conditions>
          <serverVariables><set name="HTTP_X_FORWARDED_PROTO" value="https" /></serverVariables>
          <action type="Rewrite" url="http://127.0.0.1:$Cong/{R:1}" />
        </rule>
        <rule name="QLDA http" stopProcessing="true">
          <match url="(.*)" />
          <serverVariables><set name="HTTP_X_FORWARDED_PROTO" value="http" /></serverVariables>
          <action type="Rewrite" url="http://127.0.0.1:$Cong/{R:1}" />
        </rule>
      </rules>
    </rewrite>
    <security><requestFiltering allowDoubleEscaping="true"><requestLimits maxAllowedContentLength="1073741824" /></requestFiltering></security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
"@ | Set-Content -Encoding UTF8 (Join-Path $root "web.config")
if (-not (Get-Website -Name $TenMien -ErrorAction SilentlyContinue)) {
  New-Website -Name $TenMien -PhysicalPath $root -HostHeader $TenMien -Port 80 | Out-Null
}
Start-Website -Name $TenMien
# Dịch vụ chỉ nghe nội bộ, bật nhận X-Forwarded-*, đóng tường lửa cổng riêng
$cfg = Join-Path $ThuMuc "app\appsettings.Production.json"
$j = Get-Content -Raw -Encoding UTF8 $cfg | ConvertFrom-Json
$j.Urls = "http://127.0.0.1:$Cong"
$j | Add-Member -Force -NotePropertyName ReverseProxy -NotePropertyValue @{ Enabled = $true }
$j | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $cfg
Get-NetFirewallRule -DisplayName "QLDA *(TCP $Cong)" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
$svc = "QLDA_" + (Split-Path $ThuMuc -Leaf)
Restart-Service $svc
Start-Sleep 15
try { (Invoke-WebRequest "http://127.0.0.1/api/health" -Headers @{ Host = $TenMien } -UseBasicParsing).Content } catch { "Lỗi kiểm tra: $_" }

# Chuyển tên miền e-work.vn (và www.e-work.vn nếu có) từ site e-work cũ sang site QLDA Tri Thức (bản mới). Anh Trí duyệt 26/11/2026.
# Chỉ chuyển các binding có tên máy CHÍNH XÁC là e-work.vn / www.e-work.vn. Không đụng hkdhaugiang.e-work.vn, hdndcantho.e-work.vn, trithucsoft.vn,
# không đụng chứng chỉ (http.sys giữ nguyên ánh xạ chứng chỉ *.e-work.vn), không đụng cấu hình cấp máy chủ.
#   Chuyển:   powershell -ExecutionPolicy Bypass -File chuyen-ten-mien-ework.ps1
#   Hoàn tác: powershell -ExecutionPolicy Bypass -File chuyen-ten-mien-ework.ps1 -HoanTac
param([string[]]$TenMien = @("e-work.vn", "www.e-work.vn"), [string]$SiteMoi = "trithuc.qlda.trithucsoft.vn", [string]$SiteCu = "e-work.vn", [switch]$HoanTac)
$ErrorActionPreference = "Stop"
Import-Module WebAdministration
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$appcmd = "$env:windir\system32\inetsrv\appcmd.exe"
function Kiem($u) { try { $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 20 -MaximumRedirection 0 -ErrorAction Stop; "$($r.StatusCode)" } catch { if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "LOI: $($_.Exception.Message)" } } }
$canhBen = @("https://trithucsoft.vn/", "https://hkdhaugiang.e-work.vn/", "https://hdndcantho.e-work.vn/", "https://$SiteMoi/api/health")
"== Trước khi đổi"; foreach ($u in $canhBen) { "  $u -> $(Kiem $u)" }

$tu, $den = if ($HoanTac) { $SiteMoi, $SiteCu } else { $SiteCu, $SiteMoi }
foreach ($s in @($tu, $den)) { if (-not (Get-Website -Name $s -ErrorAction SilentlyContinue)) { throw "Không thấy site IIS '$s'." } }
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
& $appcmd add backup "truoc_chuyen_ework_$ts" | Out-Host

$tuPath = "IIS:\Sites\$tu"; $denPath = "IIS:\Sites\$den"
$bTu = @((Get-ItemProperty $tuPath -Name bindings).Collection)
$chuyen = @($bTu | Where-Object { $h = ($_.bindingInformation -split ':')[2]; $TenMien -contains $h })
if ($chuyen.Count -eq 0) { "Site '$tu' không có binding nào cho $($TenMien -join ', '). Không đổi gì."; exit 0 }
"== Chuyển $($chuyen.Count) binding từ '$tu' sang '$den':"; $chuyen | ForEach-Object { "  $($_.protocol) $($_.bindingInformation) sslFlags=$($_.sslFlags)" }
$bDen = @((Get-ItemProperty $denPath -Name bindings).Collection)
foreach ($b in $chuyen) {
  if ($bDen | Where-Object { $_.protocol -eq $b.protocol -and $_.bindingInformation -eq $b.bindingInformation }) { continue }
  New-ItemProperty $denPath -Name bindings -Value @{ protocol = $b.protocol; bindingInformation = $b.bindingInformation; sslFlags = $b.sslFlags } | Out-Null
}
foreach ($b in $chuyen) {
  Remove-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.applicationHost/sites/site[@name='$tu']/bindings" -name . -AtElement @{ protocol = $b.protocol; bindingInformation = $b.bindingInformation }
}
Start-Sleep 3
"== Binding hiện tại:"; foreach ($s in @($SiteCu, $SiteMoi)) { "  [$s]"; (Get-ItemProperty "IIS:\Sites\$s" -Name bindings).Collection | ForEach-Object { "    $($_.protocol) $($_.bindingInformation)" } }
"== Sau khi đổi"
foreach ($h in $TenMien) { foreach ($u in @("https://$h/api/health", "http://$h/")) { "  $u -> $(Kiem $u)" } }
foreach ($u in $canhBen) { "  $u -> $(Kiem $u)" }
"Sao lưu cấu hình IIS: truoc_chuyen_ework_$ts (khôi phục: appcmd restore backup truoc_chuyen_ework_$ts)"

<#
.SYNOPSIS
  Cài Phần mềm QLDA xã/phường trên Windows (Windows Server 2016 trở lên, Windows 10/11 64-bit) với PostgreSQL đi kèm.

.DESCRIPTION
  Không cần IIS, SQL Server hay cài .NET: gói cài đã có sẵn phần mềm (app\) và PostgreSQL 16 (pgsql\).
  Script tạo hai dịch vụ Windows tự khởi động cùng máy:
    - QLDA_PostgreSQL : cơ sở dữ liệu, chỉ nghe trên máy này (127.0.0.1), dùng chung cho mọi xã cài trên máy;
    - QLDA_<mã-xã>    : phần mềm của từng xã/phường, mỗi xã một CSDL, một kho tệp, một cổng riêng.
  Chạy lại đúng lệnh để cập nhật phiên bản mới: dữ liệu, cấu hình và mật khẩu CSDL giữ nguyên.

.EXAMPLE
  .\cai-dat.ps1                                  # hỏi mã xã và cổng
  .\cai-dat.ps1 -MaXa xa-tan-hoa -Cong 8080
  .\cai-dat.ps1 -MaXa phuong-an-lac -Cong 8081   # xã thứ hai trên cùng máy chủ
#>
[CmdletBinding()]
param(
  [string]$MaXa = "",
  [int]$Cong = 0,
  [string]$ThuMuc = "C:\QLDA",
  [int]$CongCsdl = 5433
)
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
function Buoc($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Loi($m) { Write-Host "`nLỖI: $m" -ForegroundColor Red; exit 1 }
# Chạy chương trình ngoài (initdb, pg_ctl, sc, icacls): không coi dòng ghi ra stderr là lỗi, trả về mã thoát
function Chay {
  $ErrorActionPreference = "Continue"
  $exe, $rest = $args
  & $exe @rest 2>&1 | ForEach-Object { "$_" } | Out-Host
  return $LASTEXITCODE
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path (Join-Path $here "app\QldaTtts.Web.exe"))) { Loi "Không thấy app\QldaTtts.Web.exe cạnh cai-dat.ps1. Hãy giải nén toàn bộ gói cài rồi chạy lại." }
if (-not (Test-Path (Join-Path $here "pgsql\bin\postgres.exe"))) { Loi "Không thấy pgsql\bin\postgres.exe trong gói cài." }
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) { Loi "Hãy chạy bằng quyền Administrator (bấm đúp CAI_DAT.bat, hoặc mở PowerShell bằng Run as administrator)." }
if (-not [Environment]::Is64BitOperatingSystem) { Loi "Cần Windows 64-bit." }
if ($ThuMuc -match '\s') { Loi "Thư mục cài không được có khoảng trắng: $ThuMuc" }

if (-not $MaXa) {
  $MaXa = (Read-Host "Mã xã/phường (chữ thường không dấu, số, gạch ngang; ví dụ xa-tan-hoa)").Trim()
}
$MaXa = $MaXa.ToLowerInvariant()
if ($MaXa -notmatch '^[a-z0-9-]{3,40}$') { Loi "Mã xã chỉ gồm chữ thường không dấu, số, gạch ngang (3 đến 40 ký tự), ví dụ xa-tan-hoa." }
$svc = "QLDA_$MaXa"
$xaDir = Join-Path $ThuMuc $MaXa
$appDir = Join-Path $xaDir "app"
$dataDir = Join-Path $xaDir "du-lieu"
$cfgFile = Join-Path $appDir "appsettings.Production.json"
$capNhat = Test-Path $cfgFile

if (-not $Cong) {
  if ($capNhat) {
    try { $Cong = [int](([uri]((Get-Content -Raw -Encoding UTF8 $cfgFile | ConvertFrom-Json).Urls -replace '0\.0\.0\.0|\*|\+', 'localhost')).Port) } catch { $Cong = 0 }
  }
  if (-not $Cong) {
    $nhap = (Read-Host "Cổng truy cập (Enter để dùng 8080)").Trim()
    $Cong = if ($nhap) { [int]$nhap } else { 8080 }
  }
}
if ($Cong -lt 1 -or $Cong -gt 65535) { Loi "Cổng không hợp lệ: $Cong" }

Write-Host "Cài cho: $MaXa, cổng $Cong, thư mục $xaDir" -ForegroundColor Green
if ($capNhat) { Write-Host "Đã có bản cài trước: cập nhật phần mềm, giữ nguyên dữ liệu và cấu hình." -ForegroundColor Yellow }

# ---------------------------------------------------------------- PostgreSQL dùng chung
$pgSvc = "QLDA_PostgreSQL"
$pgDir = Join-Path $ThuMuc "pgsql"
$pgData = Join-Path $ThuMuc "pgdata"
$pwFile = Join-Path $ThuMuc "csdl-matkhau.txt"
New-Item -ItemType Directory -Force -Path $ThuMuc | Out-Null

if (-not (Get-Service $pgSvc -ErrorAction SilentlyContinue)) {
  Buoc "Cài PostgreSQL 16 (dịch vụ $pgSvc, cổng nội bộ $CongCsdl)"
  if (Get-NetTCPConnection -LocalPort $CongCsdl -State Listen -ErrorAction SilentlyContinue) {
    Loi "Cổng $CongCsdl đang có chương trình khác dùng. Chạy lại với tham số -CongCsdl 5434 (hoặc cổng trống khác)."
  }
  robocopy (Join-Path $here "pgsql") $pgDir /E /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { Loi "Chép PostgreSQL thất bại (robocopy $LASTEXITCODE)." }
  if (Test-Path (Join-Path $pgData "PG_VERSION")) {
    Write-Host "Dùng lại dữ liệu PostgreSQL có sẵn trong $pgData."
    if (-not (Test-Path $pwFile)) { Loi "Có $pgData nhưng thiếu $pwFile (mật khẩu CSDL)." }
  } else {
    if (Test-Path $pgData) { Remove-Item -Recurse -Force $pgData }
    New-Item -ItemType Directory -Force -Path $pgData | Out-Null
    $me = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    icacls $pgData /grant "${me}:(OI)(CI)F" "*S-1-5-20:(OI)(CI)F" /Q | Out-Null   # S-1-5-20 = NETWORK SERVICE
    $pw = -join ((1..32) | ForEach-Object { "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"[(Get-Random -Maximum 56)] })
    [IO.File]::WriteAllText($pwFile, $pw)
    $tmpPw = Join-Path $env:TEMP ("qlda-pw-" + [guid]::NewGuid().ToString("N") + ".txt")
    [IO.File]::WriteAllText($tmpPw, $pw)
    $rc = Chay (Join-Path $pgDir "bin\initdb.exe") -D $pgData -U qlda "--pwfile=$tmpPw" -A scram-sha-256 -E UTF8 --locale=C
    Remove-Item -Force $tmpPw
    if ($rc) { Loi "Khởi tạo PostgreSQL thất bại (initdb $rc)." }
    Add-Content -Encoding ASCII (Join-Path $pgData "postgresql.conf") @"

# --- QLDA xa/phuong
listen_addresses = 'localhost'
port = $CongCsdl
max_connections = 200
shared_buffers = 256MB
logging_collector = on
log_directory = 'log'
log_truncate_on_rotation = on
log_filename = 'postgresql-%a.log'
log_rotation_age = 1d
timezone = 'Asia/Ho_Chi_Minh'
log_timezone = 'Asia/Ho_Chi_Minh'
"@
  }
  # Tệp mật khẩu: chỉ Administrators và SYSTEM đọc được
  icacls $pwFile /inheritance:r /grant:r "*S-1-5-32-544:F" "*S-1-5-18:F" /Q | Out-Null
  icacls $pgData /grant "*S-1-5-20:(OI)(CI)F" /T /Q | Out-Null
  if (Chay (Join-Path $pgDir "bin\pg_ctl.exe") register -N $pgSvc -U "NT AUTHORITY\NetworkService" -D $pgData -S auto -w) { Loi "Không đăng ký được dịch vụ $pgSvc." }
  sc.exe description $pgSvc "Cơ sở dữ liệu PostgreSQL của phần mềm QLDA xã/phường" | Out-Null
  sc.exe failure $pgSvc reset= 86400 actions= restart/5000/restart/10000/restart/30000 | Out-Null
}
$pgConf = Get-Content (Join-Path $pgData "postgresql.conf")
$m = $pgConf | Select-String '^\s*port\s*=\s*(\d+)' | Select-Object -Last 1
if ($m) { $CongCsdl = [int]$m.Matches[0].Groups[1].Value }
if ((Get-Service $pgSvc).Status -ne "Running") {
  Buoc "Khởi động $pgSvc"
  Start-Service $pgSvc
}
for ($i = 0; $i -lt 30; $i++) {
  if (Test-NetConnection 127.0.0.1 -Port $CongCsdl -InformationLevel Quiet -WarningAction SilentlyContinue) { break }
  Start-Sleep 2
}
$pw = (Get-Content -Raw $pwFile).Trim()

# ---------------------------------------------------------------- Phần mềm của xã
Buoc "Chép phần mềm vào $appDir"
$s = Get-Service $svc -ErrorAction SilentlyContinue
if ($s -and $s.Status -ne "Stopped") { Stop-Service $svc -Force; Start-Sleep 2 }
New-Item -ItemType Directory -Force -Path $appDir, (Join-Path $appDir "App_Data"), (Join-Path $dataDir "files"), (Join-Path $dataDir "backups"), (Join-Path $xaDir "logs") | Out-Null
robocopy (Join-Path $here "app") $appDir /E /XF appsettings.Production.json /XD App_Data /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { Loi "Chép tệp thất bại (robocopy $LASTEXITCODE)." }
# Tài liệu HDSD cũ không còn trong gói mới: xóa để phần mềm nạp bộ mới
$hdsdMoi = Join-Path $here "app\hdsd"
if (Test-Path $hdsdMoi) {
  Get-ChildItem (Join-Path $appDir "hdsd") -Filter *.pdf -ErrorAction SilentlyContinue |
    Where-Object { -not (Test-Path (Join-Path $hdsdMoi $_.Name)) } | Remove-Item -Force
}

Buoc "Ghi cấu hình"
$db = "qlda_" + ($MaXa -replace '-', '_')
if (-not $capNhat) {
  [ordered]@{
    Urls = "http://0.0.0.0:$Cong"
    Database = @{ Provider = "PostgreSQL" }
    ConnectionStrings = @{ PostgreSQL = "Host=127.0.0.1;Port=$CongCsdl;Database=$db;Username=qlda;Password=$pw" }
    Storage = @{ FilesPath = (Join-Path $dataDir "files"); BackupPath = (Join-Path $dataDir "backups") }
    Https = @{ Redirect = $false }
    Logging = @{ EventLog = @{ LogLevel = @{ Default = "Warning" } } }
  } | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $cfgFile
} else {
  $old = Get-Content -Raw -Encoding UTF8 $cfgFile | ConvertFrom-Json
  if ($PSBoundParameters.ContainsKey("Cong")) { $old.Urls = "http://0.0.0.0:$Cong"; $old | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $cfgFile }
  Write-Host "Giữ nguyên cấu hình đang có."
}

Buoc "Tạo dịch vụ $svc"
$exe = Join-Path $appDir "QldaTtts.Web.exe"
if (-not (Get-Service $svc -ErrorAction SilentlyContinue)) {
  if (Chay sc.exe create $svc binPath= $exe start= delayed-auto obj= "NT SERVICE\$svc" DisplayName= "QLDA xa/phuong - $MaXa" depend= $pgSvc) { Loi "Không tạo được dịch vụ $svc." }
} else {
  sc.exe config $svc binPath= $exe depend= $pgSvc | Out-Null
}
sc.exe description $svc "Phần mềm quản lý dự án xã/phường ($MaXa), cổng $Cong" | Out-Null
sc.exe failure $svc reset= 86400 actions= restart/5000/restart/10000/restart/30000 | Out-Null
$id = "NT SERVICE\$svc"
icacls $appDir /grant "${id}:(OI)(CI)RX" /T /Q | Out-Null
icacls $cfgFile /inheritance:r /grant:r "*S-1-5-32-544:F" "*S-1-5-18:F" "${id}:R" /Q | Out-Null   # chứa mật khẩu CSDL
icacls (Join-Path $appDir "App_Data") /grant "${id}:(OI)(CI)M" /T /Q | Out-Null
icacls $dataDir /grant "${id}:(OI)(CI)M" /T /Q | Out-Null
icacls (Join-Path $xaDir "logs") /grant "${id}:(OI)(CI)M" /T /Q | Out-Null

Buoc "Mở tường lửa cổng $Cong"
$fw = "QLDA $MaXa (TCP $Cong)"
Get-NetFirewallRule -DisplayName "QLDA $MaXa (TCP *" -ErrorAction SilentlyContinue | Where-Object DisplayName -ne $fw | Remove-NetFirewallRule
if (-not (Get-NetFirewallRule -DisplayName $fw -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName $fw -Direction Inbound -Protocol TCP -LocalPort $Cong -Action Allow -Profile Any | Out-Null
}

Buoc "Khởi động phần mềm"
Start-Service $svc
$ok = $false
for ($i = 0; $i -lt 90; $i++) {
  try { $h = Invoke-RestMethod "http://127.0.0.1:$Cong/api/health" -TimeoutSec 5; $ok = $true; break } catch { Start-Sleep 2 }
}
if (-not $ok) {
  Write-Host "`nPhần mềm chưa phản hồi sau 3 phút. Xem nhật ký: Event Viewer > Windows Logs > Application, hoặc chạy:" -ForegroundColor Red
  Write-Host "  Get-WinEvent -LogName Application -MaxEvents 30 | Where-Object ProviderName -like '*Qlda*' | Format-List TimeCreated, Message" -ForegroundColor Red
  Write-Host "Nhật ký PostgreSQL: $pgData\log" -ForegroundColor Red
  exit 1
}
$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' } | Select-Object -ExpandProperty IPAddress
Write-Host "`nXONG. Tình trạng: $($h.status), CSDL: $($h.db)" -ForegroundColor Green
Write-Host "Trên máy này:       http://localhost:$Cong" -ForegroundColor Green
foreach ($ip in $ips) { Write-Host "Máy khác trong mạng: http://${ip}:$Cong" -ForegroundColor Green }
if (-not $capNhat) { Write-Host "Mở địa chỉ trên để khởi tạo tài khoản quản trị (bỏ chọn Nạp dữ liệu mẫu khi dùng thật)." -ForegroundColor Green }
exit 0

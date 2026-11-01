<#
.SYNOPSIS
  Cài đặt Phần mềm QLDA Trung tâm Thủy sản TP.HCM lên IIS (Windows Server 2019+ / SQL Server 2019+).

.DESCRIPTION
  Chạy bằng PowerShell "Run as Administrator" trong thư mục gói cài (có thư mục app\ và tệp install.ps1).
  Script: bật IIS, kiểm tra ASP.NET Core Hosting Bundle 8, chép ứng dụng, tạo Application Pool + Website,
  ghi chuỗi kết nối SQL Server, cấp quyền thư mục dữ liệu, tạo login SQL cho Application Pool (nếu dùng Windows Authentication).
  Chạy lại script để cập nhật phiên bản mới: dữ liệu trong App_Data và appsettings.Production.json được giữ nguyên.

.EXAMPLE
  .\install.ps1 -SqlServer "SQLSRV01" -Port 80
  .\install.ps1 -SqlServer "10.0.0.5,1433" -SqlUser qlda_app -SqlPassword "MatKhauManh#2026" -HostName qlda.tttshcm.gov.vn -Port 443 -CertThumbprint ABC123...
#>
[CmdletBinding()]
param(
  [string]$SiteName = "QLDA_TTTS",
  [string]$InstallPath = "C:\inetpub\QLDA_TTTS",
  [string]$DataPath = "D:\QLDA_TTTS_Data",
  [string]$SqlServer = ".",
  [string]$Database = "QLDA_TTTS",
  [string]$SqlUser = "",
  [string]$SqlPassword = "",
  [string]$HostName = "",
  [int]$Port = 80,
  [string]$CertThumbprint = ""
)
$ErrorActionPreference = "Stop"
function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $here "app"
if (-not (Test-Path (Join-Path $src "QldaTtts.Web.dll"))) { throw "Không thấy thư mục app\ chứa QldaTtts.Web.dll cạnh install.ps1." }
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw "Hãy chạy PowerShell bằng quyền Administrator." }

Step "Bật IIS"
$features = "Web-Server","Web-Default-Doc","Web-Static-Content","Web-Http-Errors","Web-Http-Logging","Web-Request-Monitor","Web-Filtering","Web-Stat-Compression","Web-Mgmt-Console"
if (Get-Command Install-WindowsFeature -ErrorAction SilentlyContinue) { Install-WindowsFeature $features | Out-Null }
else { Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole,IIS-WebServer,IIS-StaticContent,IIS-RequestFiltering,IIS-ManagementConsole -All -NoRestart | Out-Null }
Import-Module WebAdministration

Step "Kiểm tra ASP.NET Core Hosting Bundle 8"
$anc = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\IIS AspNetCore Module V2" -ErrorAction SilentlyContinue
$rt = & dotnet --list-runtimes 2>$null | Select-String "Microsoft.AspNetCore.App 8\."
if (-not $anc -or -not $rt) {
  Write-Warning "Chưa có ASP.NET Core 8 Hosting Bundle. Tải tại https://dotnet.microsoft.com/download/dotnet/8.0 (mục Hosting Bundle), cài xong chạy lại script."
  throw "Thiếu ASP.NET Core 8 Hosting Bundle."
}

Step "Dừng website (nếu đang chạy) và chép ứng dụng vào $InstallPath"
if (Test-Path "IIS:\Sites\$SiteName") { Stop-Website $SiteName -ErrorAction SilentlyContinue }
if (Test-Path "IIS:\AppPools\$SiteName") { if ((Get-WebAppPoolState $SiteName).Value -ne "Stopped") { Stop-WebAppPool $SiteName; Start-Sleep 3 } }
New-Item -ItemType Directory -Force -Path $InstallPath, $DataPath, (Join-Path $DataPath "files"), (Join-Path $InstallPath "logs") | Out-Null
robocopy $src $InstallPath /E /XF appsettings.Production.json /XD App_Data /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Chép tệp thất bại (robocopy $LASTEXITCODE)." }

Step "Ghi cấu hình appsettings.Production.json"
$cfgFile = Join-Path $InstallPath "appsettings.Production.json"
if ($SqlUser) { $cs = "Server=$SqlServer;Database=$Database;User Id=$SqlUser;Password=$SqlPassword;TrustServerCertificate=True;Encrypt=True" }
else { $cs = "Server=$SqlServer;Database=$Database;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=True" }
if (-not (Test-Path $cfgFile) -or $PSBoundParameters.ContainsKey("SqlServer") -or $SqlUser) {
  @{ Database = @{ Provider = "SqlServer" }; ConnectionStrings = @{ SqlServer = $cs }; Storage = @{ FilesPath = (Join-Path $DataPath "files"); BackupPath = (Join-Path $DataPath "backups") }; Https = @{ Redirect = [bool]$CertThumbprint } } |
    ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 $cfgFile
} else {
  Write-Host "Giữ nguyên cấu hình đang có."
  # Nâng cấp từ bản 1.0: bổ sung thư mục sao lưu tự động nếu cấu hình cũ chưa có
  $old = Get-Content -Raw -Encoding UTF8 $cfgFile | ConvertFrom-Json
  if (-not $old.Storage) { $old | Add-Member -NotePropertyName Storage -NotePropertyValue ([pscustomobject]@{}) }
  if (-not $old.Storage.BackupPath) {
    $old.Storage | Add-Member -Force -NotePropertyName BackupPath -NotePropertyValue (Join-Path $DataPath "backups")
    $old | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $cfgFile
    Write-Host "Đã thêm thư mục sao lưu tự động: $(Join-Path $DataPath 'backups')"
  }
}

Step "Tạo Application Pool và Website"
if (-not (Test-Path "IIS:\AppPools\$SiteName")) { New-WebAppPool $SiteName | Out-Null }
Set-ItemProperty "IIS:\AppPools\$SiteName" -Name managedRuntimeVersion -Value ""
Set-ItemProperty "IIS:\AppPools\$SiteName" -Name startMode -Value "AlwaysRunning"
Set-ItemProperty "IIS:\AppPools\$SiteName" -Name processModel.idleTimeout -Value ([TimeSpan]::Zero)
Set-ItemProperty "IIS:\AppPools\$SiteName" -Name processModel.loadUserProfile -Value $true
$proto = if ($CertThumbprint) { "https" } else { "http" }
if (-not (Test-Path "IIS:\Sites\$SiteName")) {
  New-Website -Name $SiteName -PhysicalPath $InstallPath -ApplicationPool $SiteName -Port $Port -HostHeader $HostName -Ssl:([bool]$CertThumbprint) | Out-Null
} else { Set-ItemProperty "IIS:\Sites\$SiteName" -Name physicalPath -Value $InstallPath }
if ($CertThumbprint) {
  $b = Get-WebBinding -Name $SiteName -Protocol https
  $b.AddSslCertificate($CertThumbprint, "my")
}

Step "Cấp quyền thư mục cho IIS APPPOOL\$SiteName"
$id = "IIS APPPOOL\$SiteName"
icacls $InstallPath /grant "${id}:(OI)(CI)RX" /T /Q | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $InstallPath "App_Data") | Out-Null
icacls (Join-Path $InstallPath "App_Data") /grant "${id}:(OI)(CI)M" /T /Q | Out-Null
icacls (Join-Path $InstallPath "logs") /grant "${id}:(OI)(CI)M" /T /Q | Out-Null
icacls $DataPath /grant "${id}:(OI)(CI)M" /T /Q | Out-Null

if (-not $SqlUser) {
  Step "Tạo login SQL Server cho $id (Windows Authentication)"
  $sql = @"
IF DB_ID(N'$Database') IS NULL CREATE DATABASE [$Database] COLLATE Vietnamese_CI_AS;
IF SUSER_ID(N'$id') IS NULL CREATE LOGIN [$id] FROM WINDOWS;
"@
  $sql2 = @"
IF USER_ID(N'$id') IS NULL CREATE USER [$id] FOR LOGIN [$id];
ALTER ROLE db_owner ADD MEMBER [$id];
"@
  if (Get-Command sqlcmd -ErrorAction SilentlyContinue) {
    sqlcmd -S $SqlServer -E -C -b -Q $sql; if ($LASTEXITCODE) { throw "Không tạo được CSDL/login. Kiểm tra quyền sysadmin của tài khoản đang chạy script." }
    sqlcmd -S $SqlServer -E -C -b -d $Database -Q $sql2; if ($LASTEXITCODE) { throw "Không cấp quyền được cho login." }
  } else {
    Write-Warning "Không có sqlcmd. Hãy chạy đoạn lệnh sau trong SQL Server Management Studio:`n$sql`nUSE [$Database];`n$sql2"
  }
}

Step "Khởi động"
Start-WebAppPool $SiteName
Start-Website $SiteName
$url = "${proto}://" + ($(if ($HostName) { $HostName } else { "localhost" })) + ":$Port"
Start-Sleep 5
try { $h = Invoke-RestMethod "$url/api/health" -TimeoutSec 60; Write-Host "Tình trạng: $($h.status), CSDL: $($h.db)" -ForegroundColor Green }
catch { Write-Warning "Chưa gọi được $url/api/health: $($_.Exception.Message). Xem nhật ký trong Event Viewer > Application hoặc bật stdoutLogEnabled trong web.config." }
Write-Host "`nHoàn tất. Mở $url để khởi tạo tài khoản quản trị đầu tiên." -ForegroundColor Green

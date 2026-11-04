<#
.SYNOPSIS
  Gỡ phần mềm QLDA của một xã/phường khỏi máy Windows.
.EXAMPLE
  .\go-cai-dat.ps1 -MaXa xa-tan-hoa              # gỡ dịch vụ, GIỮ dữ liệu (cài lại cùng mã xã là dùng tiếp)
  .\go-cai-dat.ps1 -MaXa xa-tan-hoa -XoaDuLieu   # gỡ hẳn: xóa CSDL, tệp đính kèm, bản sao lưu của xã này
  Gỡ xã cuối cùng kèm -XoaDuLieu thì gỡ luôn PostgreSQL đi kèm và thư mục C:\QLDA.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$MaXa,
  [string]$ThuMuc = "C:\QLDA",
  [switch]$XoaDuLieu,
  [switch]$KhongHoi
)
$ErrorActionPreference = "Continue"
$MaXa = $MaXa.ToLowerInvariant()
$svc = "QLDA_$MaXa"; $xaDir = Join-Path $ThuMuc $MaXa; $appDir = Join-Path $xaDir "app"
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "Hãy chạy bằng quyền Administrator." -ForegroundColor Red; exit 1
}
if (-not (Test-Path $xaDir) -and -not (Get-Service $svc -ErrorAction SilentlyContinue)) { Write-Host "Không thấy bản cài của $MaXa trong $ThuMuc."; exit 1 }
if ($XoaDuLieu -and -not $KhongHoi) {
  $xn = Read-Host "Sẽ xóa TOÀN BỘ dữ liệu của $MaXa, không khôi phục được. Gõ lại mã xã để xác nhận"
  if ($xn -ne $MaXa) { Write-Host "Đã hủy."; exit 1 }
}
if (Get-Service $svc -ErrorAction SilentlyContinue) {
  Stop-Service $svc -Force -ErrorAction SilentlyContinue
  sc.exe delete $svc | Out-Null
  Write-Host "Đã gỡ dịch vụ $svc."
}
Get-NetFirewallRule -DisplayName "QLDA $MaXa (TCP *" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
if (-not $XoaDuLieu) {
  Write-Host "Dữ liệu vẫn giữ trong CSDL và thư mục $xaDir. Cài lại cùng mã xã để dùng tiếp." -ForegroundColor Yellow
  exit 0
}
if (Test-Path "$appDir\QldaTtts.Web.exe") {
  Push-Location $appDir
  & .\QldaTtts.Web.exe --xoa-csdl
  Pop-Location
}
Remove-Item -Recurse -Force $xaDir
Write-Host "Đã xóa dữ liệu và thư mục $xaDir." -ForegroundColor Green

# Không còn xã nào: gỡ PostgreSQL đi kèm
$conLai = Get-Service "QLDA_*" -ErrorAction SilentlyContinue | Where-Object Name -ne "QLDA_PostgreSQL"
if (-not $conLai) {
  if (Get-Service QLDA_PostgreSQL -ErrorAction SilentlyContinue) {
    Stop-Service QLDA_PostgreSQL -Force -ErrorAction SilentlyContinue
    & "$ThuMuc\pgsql\bin\pg_ctl.exe" unregister -N QLDA_PostgreSQL 2>&1 | Out-Null
    if (Get-Service QLDA_PostgreSQL -ErrorAction SilentlyContinue) { sc.exe delete QLDA_PostgreSQL 2>&1 | Out-Null }
  }
  Start-Sleep 2
  Remove-Item -Recurse -Force $ThuMuc -ErrorAction SilentlyContinue
  Write-Host "Không còn xã nào trên máy: đã gỡ PostgreSQL và thư mục $ThuMuc." -ForegroundColor Green
}
exit 0

<#
.SYNOPSIS  Đặt lại xác thực 2 lớp khi quản trị mất điện thoại.
.EXAMPLE   .\dat-lai-2fa.ps1 -MaXa xa-tan-hoa -TenDangNhap admin
#>
param([Parameter(Mandatory = $true)][string]$MaXa, [Parameter(Mandatory = $true)][string]$TenDangNhap, [string]$ThuMuc = "C:\QLDA")
$app = Join-Path $ThuMuc "$($MaXa.ToLowerInvariant())\app"
if (-not (Test-Path "$app\QldaTtts.Web.exe")) { Write-Host "Không thấy $app\QldaTtts.Web.exe" -ForegroundColor Red; exit 1 }
Push-Location $app
& .\QldaTtts.Web.exe --reset-2fa $TenDangNhap
Pop-Location

<#
.SYNOPSIS  Thiết lập đơn vị ngay trên máy chủ (bản 1.10.2), không cần đăng nhập giao diện. Chạy PowerShell quyền Administrator.
.EXAMPLE   .\thiet-lap-may-chu.ps1 -MaXa trithuc -ThuMuc D:\QLDA -ThongTinDonVi .\thongtin.json
.EXAMPLE   .\thiet-lap-may-chu.ps1 -MaXa trithuc -ThuMuc D:\QLDA -NhapEwork D:\QLDA_CHUYEN\ework_xuat.json
.EXAMPLE   .\thiet-lap-may-chu.ps1 -MaXa trithuc -ThuMuc D:\QLDA -TaoKhoaChep -ThuMucChep D:\QLDA\ework-dongbo
.NOTES
  -NhapEwork      như nút "Chuyển dữ liệu từ e-work"; tài khoản mới ghi ra tệp CSV cạnh tệp nạp (chỉ Administrators đọc được).
  -MatKhauChung   (kèm -NhapEwork) hỏi một mật khẩu ban đầu chung cho mọi tài khoản mới; người dùng phải đổi ở lần đăng nhập đầu.
  -ThongTinDonVi  tệp JSON gồm các mục Thông tin đơn vị (appName, orgName, unitName, bannerTitle, reportOrg, style…); gộp vào cài đặt hiện có.
  -TaoKhoaChep    tạo khóa chép chấm công sang e-work, ghi thẳng vào khoa-chep-cham-cong.txt trong -ThuMucChep (không hiện khóa),
                  rồi đặt lịch 5 phút bằng chep-cham-cong-ework.ps1 -Khoa FILE -CaiLich nếu có -Qlda.
#>
param([Parameter(Mandatory = $true)][string]$MaXa, [string]$ThuMuc = "C:\QLDA",
      [string]$NhapEwork, [string]$ThongTinDonVi, [switch]$TaoKhoaChep, [string]$ThuMucChep = "C:\QLDA\ework-dongbo", [string]$TuNgay, [string]$Qlda, [switch]$MatKhauChung)
$ErrorActionPreference = "Stop"
$app = Join-Path $ThuMuc "$($MaXa.ToLowerInvariant())\app"
if (-not (Test-Path "$app\QldaTtts.Web.exe")) { Write-Host "Không thấy $app\QldaTtts.Web.exe" -ForegroundColor Red; exit 1 }
function Chay([string[]]$a) { Push-Location $app; try { & .\QldaTtts.Web.exe @a; if ($LASTEXITCODE -ne 0) { throw "Lệnh lỗi (mã $LASTEXITCODE)" } } finally { Pop-Location } }
function KhoaQuyen($f) { icacls $f /inheritance:r /grant:r "*S-1-5-32-544:F" "*S-1-5-18:F" | Out-Null }

if ($ThongTinDonVi) { Chay @("--thong-tin-don-vi", (Resolve-Path $ThongTinDonVi).Path) }
if ($NhapEwork) {
  $src = (Resolve-Path $NhapEwork).Path
  $csv = Join-Path (Split-Path -Parent $src) ("tai_khoan_moi_{0:yyyyMMdd_HHmm}.csv" -f (Get-Date))
  New-Item -ItemType File -Path $csv -Force | Out-Null; KhoaQuyen $csv
  if ($MatKhauChung) {
    # Quản trị tự gõ mật khẩu ban đầu chung (không hiện trên màn hình, không lưu vào tệp)
    $ss = Read-Host "Mật khẩu ban đầu chung cho tài khoản mới (ít nhất 8 ký tự, có chữ và số)" -AsSecureString
    $env:QLDA_MAT_KHAU_CHUNG = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ss))
  }
  try { Chay @("--nhap-ework", $src, "--tai-khoan-ra", $csv) } finally { Remove-Item Env:QLDA_MAT_KHAU_CHUNG -ErrorAction SilentlyContinue }
  if ((Get-Item $csv).Length -eq 0) { Remove-Item $csv }
}
if ($TaoKhoaChep) {
  if (-not (Test-Path $ThuMucChep)) { New-Item -ItemType Directory -Path $ThuMucChep | Out-Null }
  $kf = Join-Path $ThuMucChep "khoa-chep-cham-cong.txt"
  New-Item -ItemType File -Path $kf -Force | Out-Null; KhoaQuyen $kf
  $a = @("--tao-khoa-chep", $kf); if ($TuNgay) { $a += @("--tu-ngay", $TuNgay) }
  Chay $a
  $sc = Join-Path $ThuMucChep "chep-cham-cong-ework.ps1"
  if ($Qlda -and (Test-Path $sc)) { & $sc -Qlda $Qlda -Khoa FILE -CaiLich }
  elseif ($Qlda) { Write-Host "Chưa có ${sc}: chép từ thư mục ework của gói cài đặt rồi chạy lại." -ForegroundColor Yellow }
}

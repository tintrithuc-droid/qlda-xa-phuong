<#
.SYNOPSIS
  Xuất dữ liệu e-work (SQL Server) để chuyển sang phân hệ Văn phòng của QLDA: phòng ban, tài khoản, hồ sơ nhân sự,
  chấm công, ngày nghỉ, tọa độ và IP công ty, đề xuất. Chỉ ĐỌC CSDL e-work, không sửa gì.
.EXAMPLE
  .\xuat-ework.ps1                       # ghi ework_xuat.json cạnh script
  .\xuat-ework.ps1 -May ".\SQL2022" -Csdl "e-work"
.NOTES
  Tệp có thông tin riêng của nhân viên (CCCD, tài khoản ngân hàng): nạp xong vào QLDA (Bảng công > Thiết lập điểm danh > Chuyển dữ liệu từ e-work) thì XÓA tệp.
#>
param([string]$May = ".\SQL2022", [string]$Csdl = "e-work", [string]$Ra = "")
$ErrorActionPreference = "Stop"
if (-not $Ra) { $Ra = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "ework_xuat.json" }
$cn = New-Object System.Data.SqlClient.SqlConnection "Server=$May;Database=$Csdl;Integrated Security=True;TrustServerCertificate=True"
$cn.Open()
function Json($sql) {
  $cmd = $cn.CreateCommand(); $cmd.CommandText = "$sql FOR JSON PATH"; $cmd.CommandTimeout = 300
  $rd = $cmd.ExecuteReader(); $sb = New-Object System.Text.StringBuilder
  while ($rd.Read()) { [void]$sb.Append($rd.GetString(0)) }
  $rd.Close(); if ($sb.Length -eq 0) { "[]" } else { $sb.ToString() }
}
$phan = [ordered]@{
  phongbans = "SELECT Id, Code, Name, Sort FROM PhongBans"
  users     = "SELECT u.Id, u.UserName, u.Email, u.PhoneNumber, i.FullName, i.PhongBan, i.TenChucVu, i.Status, i.IsLock, i.IsChamCong, i.RoleName FROM AspNetUsers u OUTER APPLY (SELECT TOP 1 * FROM UserInfos x WHERE x.UserId = u.Id ORDER BY x.CreatedDate DESC) i"
  hoso      = "SELECT UserId, FullName, PhongBan, TenChucVu, CCCD, NgaySinh, TenGioiTinh, NgayCap, NoiCap, TenNoiCap, Email, DienThoai, DiaChi, TaiKhoanNH, NganHang, TenNganHang, NgayLamChinhThuc, NgayNghiViec, CreatedDate FROM BangLuongCoBans"
  chamcong  = "SELECT Id, UserId, NgayChamCong, SoPhutDiMuon, ViTriDiemDanh, TrangThaiDiemDanh, IPDiemDanh, KinhDo, ViDo, ChamCongDacThu FROM ChamCongs"
  ngaynghi  = "SELECT Ngay, MoTa, Buoi FROM NgayNghis"
  toado     = "SELECT Description, KinhDo, ViDo, Status FROM ToaDoChamCongs"
  ip        = "SELECT IPCongTy, Description, Status FROM IPChamCongs"
  thamso    = "SELECT TenThamSo, GiaTri FROM SysParameters WHERE TenThamSo IN ('BAN_KINH_CHAM_CONG','GIO_DIEM_DANH')"
  dexuat    = "SELECT Id, LoaiDeXuat, TenDeXuat, JsonDeXuat, LyDo, RefObjectDescription, TenTrangThaiXuLy, NguoiDuyet, TenNguoiDuyet, NgayHoanThanh, CreatedBy, CreatedDate FROM QuanLyDeXuats"
}
$parts = foreach ($k in $phan.Keys) { Write-Host "Đọc $k..."; '"' + $k + '":' + (Json $phan[$k]) }
$cn.Close()
[IO.File]::WriteAllText($Ra, "{" + ($parts -join ",") + "}", (New-Object System.Text.UTF8Encoding $false))
Write-Host "XONG: $Ra ($([math]::Round((Get-Item $Ra).Length/1MB,1)) MB). Nạp vào QLDA xong thì xóa tệp này." -ForegroundColor Green

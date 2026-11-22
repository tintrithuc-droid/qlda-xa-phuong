<#
.SYNOPSIS
  Chép lượt điểm danh trên QLDA sang bảng ChamCongs của e-work (thời gian chuyển tiếp: lương còn tính trên e-work).
  Chỉ THÊM dòng mới, không sửa, không xóa dữ liệu cũ; người đã có chấm công trên e-work trong ngày thì bỏ qua.
.EXAMPLE
  .\chep-cham-cong-ework.ps1 -Qlda https://trithuc.qlda.trithucsoft.vn -Khoa <khóa>            # chạy một lần
  .\chep-cham-cong-ework.ps1 -Qlda https://trithuc.qlda.trithucsoft.vn -Khoa <khóa> -CaiLich    # đặt lịch 5 phút một lần
.NOTES
  Khóa tạo trong QLDA: Bảng công, chấm công > Thiết lập điểm danh > Tạo khóa chép chấm công.
#>
param([Parameter(Mandatory)][string]$Qlda, [Parameter(Mandatory)][string]$Khoa, [string]$May = ".\SQL2022", [string]$Csdl = "e-work", [switch]$CaiLich)
$ErrorActionPreference = "Stop"
$me = $MyInvocation.MyCommand.Path
if ($CaiLich) {
  $kf = Join-Path (Split-Path -Parent $me) "khoa-chep-cham-cong.txt"
  Set-Content -Path $kf -Value $Khoa -Encoding ASCII
  icacls $kf /inheritance:r /grant:r "*S-1-5-32-544:F" "*S-1-5-18:F" | Out-Null
  $arg = "-NoProfile -ExecutionPolicy Bypass -File `"$me`" -Qlda $Qlda -Khoa FILE -May `"$May`" -Csdl `"$Csdl`""
  $act = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arg
  $trg = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes 5)
  Register-ScheduledTask -TaskName "QLDA - chep cham cong sang e-work" -Action $act -Trigger $trg -User "SYSTEM" -RunLevel Highest -Force | Out-Null
  Write-Host "Đã đặt lịch 5 phút một lần (tác vụ 'QLDA - chep cham cong sang e-work')." -ForegroundColor Green; exit 0
}
if ($Khoa -eq "FILE") { $Khoa = (Get-Content (Join-Path (Split-Path -Parent $me) "khoa-chep-cham-cong.txt") -Raw).Trim() }
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$log = Join-Path (Split-Path -Parent $me) "chep-cham-cong.log"
function Ghi($m) { Add-Content -Path $log -Value ("{0:yyyy-MM-dd HH:mm:ss} {1}" -f (Get-Date), $m) -Encoding UTF8 }
$ds = Invoke-RestMethod -Uri "$Qlda/api/vp/sync/pending" -Headers @{ "X-Sync-Key" = $Khoa } -TimeoutSec 60
if (-not $ds -or $ds.Count -eq 0) { exit 0 }
$cn = New-Object System.Data.SqlClient.SqlConnection "Server=$May;Database=$Csdl;Integrated Security=True;TrustServerCertificate=True"; $cn.Open()
$ack = @(); $them = 0
foreach ($a in $ds) {
  $t = [datetime]::Parse($a.checkIn)
  $q = $cn.CreateCommand()
  $q.CommandText = "SELECT TOP 1 u.UserName, ISNULL(i.FullName, u.UserName) FROM AspNetUsers u LEFT JOIN UserInfos i ON i.UserId = u.Id WHERE u.Id = @u; SELECT COUNT(*) FROM ChamCongs WHERE UserId = @u AND CAST(NgayChamCong AS date) = @d"
  [void]$q.Parameters.AddWithValue("@u", $a.eworkUserId); [void]$q.Parameters.AddWithValue("@d", $t.Date)
  $rd = $q.ExecuteReader(); $un = $null; $fn = $null
  if ($rd.Read()) { $un = $rd.GetString(0); $fn = $rd.GetString(1) }
  [void]$rd.NextResult(); [void]$rd.Read(); $co = $rd.GetInt32(0); $rd.Close()
  if (-not $un) { Ghi "Bỏ qua $($a.fullName): không có tài khoản e-work $($a.eworkUserId)"; $ack += @{ id = $a.id; eworkId = $null }; continue }
  if ($co -gt 0) { $ack += @{ id = $a.id; eworkId = $null }; continue }   # đã có chấm công trên e-work trong ngày
  if ($a.online) { $vt = "Làm việc Online"; $tt = $(if ($a.lateMinutes -gt 0) { "Đi trễ" } else { "Đúng giờ" }); $dt = "ONLINE" }
  elseif ($a.inside) { $vt = $(if ($a.site -and $a.site -ne "Mạng công ty") { $a.site } else { "CTY TRI THỨC" }); $tt = $(if ($a.lateMinutes -gt 0) { "Đi trễ" } else { "Đúng giờ" }); $dt = $null }
  else { $vt = "Làm việc ngoài Cty"; $tt = "6a80c00a-a5eb-4c2b-b14a-26000cc1750b"; $dt = $null }
  $id = [guid]::NewGuid().ToString()
  $c = $cn.CreateCommand()
  $c.CommandText = "INSERT INTO ChamCongs (Id, UserId, UserName, FullName, NgayChamCong, Thang, Nam, SoPhutDiMuon, ViTriDiemDanh, TrangThaiDiemDanh, ThietBiChamCong, IPDiemDanh, KinhDo, ViDo, ChamCongDacThu, CreatedDate, CreatedBy, TrangThaiXuLy) VALUES (@id, @u, @un, @fn, @t, @m, @y, @late, @vt, @tt, N'QLDA', @ip, @lng, @lat, @dt, GETDATE(), @un, 'HOANTAT')"
  $p = @{ "@id" = $id; "@u" = $a.eworkUserId; "@un" = $un; "@fn" = $fn; "@t" = $t; "@m" = $t.Month; "@y" = $t.Year; "@late" = [int]$a.lateMinutes; "@vt" = $vt; "@tt" = $tt
         "@ip" = [string]$a.ip; "@lng" = $(if ($a.lng -ne $null) { [double]$a.lng } else { [DBNull]::Value }); "@lat" = $(if ($a.lat -ne $null) { [double]$a.lat } else { [DBNull]::Value }); "@dt" = $(if ($dt) { $dt } else { [DBNull]::Value }) }
  foreach ($k in $p.Keys) { [void]$c.Parameters.AddWithValue($k, $p[$k]) }
  [void]$c.ExecuteNonQuery(); $them++
  $ack += @{ id = $a.id; eworkId = $id }
}
$cn.Close()
Invoke-RestMethod -Uri "$Qlda/api/vp/sync/ack" -Method Post -Headers @{ "X-Sync-Key" = $Khoa } -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes((@{ items = $ack } | ConvertTo-Json -Depth 4))) -TimeoutSec 60 | Out-Null
Ghi "Đã chép $them lượt, đánh dấu $($ack.Count)."

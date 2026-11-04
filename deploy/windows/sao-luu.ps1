<#
.SYNOPSIS
  Chép các bản sao lưu tự động (phần mềm tạo lúc 1 giờ sáng mỗi đêm, giữ 14 bản) của mọi xã sang ổ khác/ổ mạng.
.EXAMPLE
  .\sao-luu.ps1 -Den "E:\SaoLuu_QLDA"
  .\sao-luu.ps1 -Den "\\NAS01\SaoLuu\QLDA" -DatLich     # đặt lịch chạy 2 giờ sáng hằng ngày
#>
param([Parameter(Mandatory = $true)][string]$Den, [string]$ThuMuc = "C:\QLDA", [switch]$DatLich)
if ($DatLich) {
  $me = $MyInvocation.MyCommand.Path
  $a = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$me`" -Den `"$Den`" -ThuMuc `"$ThuMuc`""
  $t = New-ScheduledTaskTrigger -Daily -At 2am
  Register-ScheduledTask -TaskName "QLDA - Chep sao luu" -Action $a -Trigger $t -User "SYSTEM" -RunLevel Highest -Force | Out-Null
  Write-Host "Đã đặt lịch chép sao lưu lúc 2 giờ sáng hằng ngày sang $Den." -ForegroundColor Green
}
Get-ChildItem $ThuMuc -Directory | Where-Object { Test-Path "$($_.FullName)\du-lieu\backups" } | ForEach-Object {
  $dich = Join-Path $Den $_.Name
  robocopy "$($_.FullName)\du-lieu" $dich /E /XO /NFL /NDL /NJH /NJS /NP | Out-Null
  Write-Host "Đã chép $($_.Name) -> $dich"
}

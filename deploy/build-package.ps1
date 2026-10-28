<#
.SYNOPSIS  Tạo gói cài đặt (chạy trên máy có .NET 8 SDK):  .\deploy\build-package.ps1
           Kết quả: dist\QLDA_TTTS_<ngày>.zip gồm app\, install.ps1, sql\, HUONG_DAN_CAI_DAT.md
#>
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$out = Join-Path $root "dist\pkg"
Remove-Item -Recurse -Force (Join-Path $root "dist") -ErrorAction SilentlyContinue
dotnet publish (Join-Path $root "src\QldaTtts.Web\QldaTtts.Web.csproj") -c Release -r win-x64 --self-contained false -o (Join-Path $out "app")
if ($LASTEXITCODE) { throw "Build thất bại." }
Copy-Item (Join-Path $root "deploy\install.ps1") $out
Copy-Item -Recurse (Join-Path $root "deploy\sql") (Join-Path $out "sql")
Copy-Item (Join-Path $root "docs\HUONG_DAN_CAI_DAT.md") $out
$zip = Join-Path $root ("dist\QLDA_TTTS_" + (Get-Date -Format "yyyyMMdd") + ".zip")
Compress-Archive -Path (Join-Path $out "*") -DestinationPath $zip
Write-Host "Đã tạo $zip" -ForegroundColor Green

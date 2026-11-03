@echo off
chcp 65001 >nul
title QLDA xa/phuong - DEMO (mang LAN)
cd /d "%~dp0app"
if not exist "App_Data" mkdir "App_Data"
set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_URLS=http://0.0.0.0:5080
set Database__Provider=Sqlite
set ConnectionStrings__Sqlite=Data Source=App_Data\qlda-demo.db
set Storage__FilesPath=%~dp0app\App_Data\files
set Storage__BackupPath=%~dp0app\App_Data\backups
echo ==============================================================
echo   PHAN MEM QLDA XA/PHUONG - BAN DEMO CHO MANG NOI BO (LAN)
echo   May nay: http://localhost:5080
echo   May khac / dien thoai cung mang Wi-Fi: http://[dia chi IPv4 ben duoi]:5080
echo ==============================================================
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do echo     IPv4:%%a
echo.
echo   Neu may khac khong vao duoc: chay PowerShell (Run as administrator) mot lan:
echo   New-NetFirewallRule -DisplayName "QLDA demo 5080" -Direction Inbound -Protocol TCP -LocalPort 5080 -Action Allow
echo.
echo   KHONG DONG cua so nay trong khi dung phan mem.
echo ==============================================================
start "" cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:5080"
QldaTtts.Web.exe
echo.
pause

@echo off
chcp 65001 >nul
title QLDA xa/phuong - DEMO
cd /d "%~dp0app"
if not exist "App_Data" mkdir "App_Data"
set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_URLS=http://localhost:5080
set Database__Provider=Sqlite
set ConnectionStrings__Sqlite=Data Source=App_Data\qlda-demo.db
set Storage__FilesPath=%~dp0app\App_Data\files
set Storage__BackupPath=%~dp0app\App_Data\backups
echo ==============================================================
echo   PHAN MEM QLDA DAU TU XAY DUNG XA/PHUONG - BAN DEMO
echo   Dia chi: http://localhost:5080
echo   Trinh duyet se tu mo sau vai giay.
echo   KHONG DONG cua so nay trong khi dung phan mem.
echo   Dung demo: dong cua so nay (hoac bam Ctrl+C).
echo ==============================================================
start "" cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:5080"
QldaTtts.Web.exe
echo.
echo Phan mem da dung. Neu bao loi cong 5080 dang dung, hay dong cua so demo khac roi chay lai.
pause

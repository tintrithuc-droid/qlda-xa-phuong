@echo off
chcp 65001 >nul
title Cai dat phan mem QLDA xa/phuong
rem Bam dup tep nay: tu xin quyen Administrator roi chay cai-dat.ps1 (hoi ma xa va cong)
net session >nul 2>&1
if %errorlevel% neq 0 (
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0cai-dat.ps1"
echo.
pause

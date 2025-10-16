@echo off
REM Launch Remote Trackpad Server with system tray icon

REM Get the directory where the batch file is located
set "SCRIPT_DIR=%~dp0"

REM Launch PowerShell script hidden
powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "%SCRIPT_DIR%launch-tray.ps1"

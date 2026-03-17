@echo off
setlocal enabledelayedexpansion
title AZIMUTH IMS - Synchronization System

echo ------------------------------------------------------------
echo      AZIMUTH - INTELLIGENCE MANAGEMENT SYSTEM (IMS)
echo             GIT SYNCHRONIZATION UTILITY
echo ------------------------------------------------------------
echo.

:: 1/4 – Pull latest
echo [1/4] Pulling latest changes...
git pull origin main
if errorlevel 1 (
    echo [ERROR] git pull failed. Check your network/credentials.
    goto end
)

:: 2/4 – Stage files
echo.
echo [2/4] Staging files...
git add -A
if errorlevel 1 (
    echo [ERROR] git add failed.
    goto end
)

:: Short‑circuit if nothing to commit
git diff --cached --quiet
if %errorlevel%==0 (
    echo.
    echo [INFO] No changes to commit. Skipping commit/push.
    goto end
)

:: 3/4 – Commit message (with default)
set "msg="
set /p msg="[3/4] ENTER MISSION/COMMIT LOG: "
if "%msg%"=="" set "msg=Intelligence Registry Update [Manual Sync]"

echo.
echo [4/4] Committing and pushing...

git commit -m "%msg%"
if errorlevel 1 (
    echo [ERROR] git commit failed.
    goto end
)

git push origin main
if errorlevel 1 (
    echo [ERROR] git push failed.
    goto end
)

echo.
echo [ SYNCHRONIZATION COMPLETE // CONNECTION SECURE ]
goto done

:end
echo.
echo [ SYNC ABORTED // CHECK ERROR LOG ABOVE ]

:done
echo.
pause
endlocal

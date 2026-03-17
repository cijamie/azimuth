@echo off
title "AZIMUTH IMS - Synchronization System"
echo ------------------------------------------------------------
echo      AZIMUTH - INTELLIGENCE MANAGEMENT SYSTEM (IMS)
echo             GIT SYNCHRONIZATION UTILITY
echo ------------------------------------------------------------
echo.

echo [1/4] Pulling latest changes...
git pull origin main

echo [2/4] Staging files...
git add -A

set /p msg="[3/4] ENTER MISSION/COMMIT LOG: "
if "%msg%"=="" set msg="Intelligence Registry Update [Manual Sync]"

echo [4/4] Committing and Pushing...
git commit -m "%msg%"
git push origin main

echo.
echo [ SYNCHRONIZATION COMPLETE // CONNECTION SECURE ]
echo.
pause

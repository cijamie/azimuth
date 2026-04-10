@echo off
setlocal enabledelayedexpansion

:: 1. Enable ANSI Escape Codes (Windows 10+)
for /f "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do set "ESC=%%b"
if not defined ESC set "ESC= "

set "G=%ESC%[92m"  & :: Green
set "R=%ESC%[91m"  & :: Red
set "C=%ESC%[96m"  & :: Cyan
set "Y=%ESC%[93m"  & :: Yellow
set "W=%ESC%[0m"   & :: White/Reset

:: 2. Pre-Check: Is Git installed?
where git >nul 2>1
if %errorlevel% neq 0 (
    echo %R%[ERROR]%W% Git is not installed or not in your PATH.
    pause
    exit /b 1
)

:: 3. Dynamic Identity Detection
for /f "tokens=*" %%i in ('git rev-parse --show-toplevel 2^>nul') do set "REPO_ROOT=%%i"
if "%REPO_ROOT%"=="" (
    echo %R%[ERROR]%W% This folder is not a Git repository.
    pause
    exit /b 1
)

:: Try to detect upstream tracking branch
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref @{u} 2^>nul') do set "UPSTREAM=%%i"
if defined UPSTREAM (
    for /f "tokens=1 delims=/" %%a in ("%UPSTREAM%") do set "REMOTE=%%a"
    for /f "tokens=1,* delims=/" %%a in ("%UPSTREAM%") do set "BRANCH=%%b"
) else (
    for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set "BRANCH=%%i"
    for /f "tokens=*" %%i in ('git remote 2^>nul ^| findstr "origin"') do set "REMOTE=%%i"
    if "!REMOTE!"=="" (for /f "tokens=*" %%i in ('git remote 2^>nul') do set "REMOTE=%%i")
)

title RepoSync - %BRANCH% @ %REMOTE%
echo %C%================================================================%W%
echo           %G%UNIVERSAL REPOSITORY SYNC UTILITY%W%
echo           Target: %Y%%BRANCH%%W% on %Y%%REMOTE%%W%
echo %C%================================================================%W%
echo.

:: 4. Self-Healing: Check for "Stale" States
if exist "%REPO_ROOT%\.git\rebase-merge" (
    echo %R%[ALERT]%W% A previous rebase was interrupted.
    set /p fix="Resolve and continue? (y/n): "
    if /i "!fix!"=="y" (
        git rebase --continue
    ) else (
        echo %Y%[ABORT]%W% Resolve manually with 'git rebase --abort'.
        pause
        exit /b 1
    )
)

:: Check for existing "TEMP" commit from previous failed run
git log -1 --pretty=format:%%s | findstr "TEMP: RepoSync auto-save" >nul
if %errorlevel% equ 0 (
    echo %Y%[RECOVERY]%W% Found a leftover 'TEMP' commit. Removing it safely...
    git reset --soft HEAD~1
)

:: 5. Pre-flight Connection Check
echo [%C%0/7%W%] Verifying remote connectivity...
git ls-remote --exit-code %REMOTE% >nul 2>&1
if %errorlevel% neq 0 (
    echo %R%[ERROR]%W% Remote '%REMOTE%' is unreachable. Check internet/credentials.
    pause
    exit /b 1
)

:: 6. Sync Logic
echo [%C%1/7%W%] Detecting repo state...
git status --porcelain | findstr . >nul
if %errorlevel% neq 0 (
    echo      No local changes detected.
    goto :pull_only
)

echo [%C%2/7%W%] %Y%Changes detected%W% - creating temp commit...
git add -A
git commit -m "TEMP: RepoSync auto-save" || goto :pull_only

:staged
echo [%C%3/7%W%] Pulling from %REMOTE%/%BRANCH% (rebase)...
git pull --rebase %REMOTE% %BRANCH%

if %errorlevel% neq 0 (
    echo.
    echo %R%[CONFLICT]%W% Resolve manually: %Y%git add . ^&^& git rebase --continue%W%
    pause
    exit /b 1
)

echo [%C%4/7%W%] Removing temp commit...
git reset --soft HEAD~1

:pull_only
echo [%C%5/7%W%] Checking for final changes...
git status --porcelain | findstr . >nul
if %errorlevel% neq 0 (
    echo      No changes to commit.
    goto :push
)

:: 7. Change Summary & Final Commit
echo.
echo %G%[ CHANGELOG SUMMARY ]%W%
git status --short
echo.

echo [%C%6/7%W%] %G%Ready to commit%W%...
set "msg="
set /p msg="[%G%ENTER COMMIT MESSAGE%W% (blank for auto)]: "

:: Robust ISO-8601 Timestamp
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm'"`) do set "TS=%%i"
if "%msg%"=="" set "msg=Update %TS%"

git add -A
git commit -m "%msg%"

:push
echo [%C%7/7%W%] Pushing to %REMOTE%/%BRANCH%...
git push %REMOTE% %BRANCH%

if %errorlevel% equ 0 (
    echo.
    echo %G%[ SUCCESS - Repository synced! ]%W%
) else (
    echo %R%[ PUSH FAILED ]%W% Check remote status or permissions.
)

echo.
pause

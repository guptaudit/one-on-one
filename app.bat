@echo off
rem =====================================================================
rem  1:1 Ledger Offline Application Runner for Windows
rem =====================================================================
title 1:1 Ledger Offline Runner
cls

:: Check for Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo =====================================================================
    echo  [!] Warning: Node.js was not detected in your system PATH.
    echo      You will need Node.js to install dependencies and compile the app.
    echo      Get it here: https://nodejs.org/
    echo =====================================================================
    echo.
)

:: Check for Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    where py >nul 2>&1
    if %errorlevel% neq 0 (
        echo =====================================================================
        echo  [!] Error: Python was not detected in your system PATH.
        echo      You need Python to run the offline simple server.
        echo      Get it here: https://www.python.org/
        echo =====================================================================
        pause
        exit /b
    )
)

:menu
cls
echo =====================================================================
echo                 1:1 LEDGER OFFLINE MANAGER (WINDOWS)
echo =====================================================================
echo.
echo   [1] Full Setup and Run (Installs dependencies, builds, and starts server)
echo   [2] Quick Start (Skip build, start local Python server immediately)
echo   [3] Rebuild App (Re-compile React production frontend)
echo   [4] Install Dependencies (npm install)
echo   [5] Exit
echo.
echo =====================================================================
set /p choice="Please select an option (1-5): "

if "%choice%"=="1" goto full_setup
if "%choice%"=="2" goto quick_start
if "%choice%"=="3" goto rebuild
if "%choice%"=="4" goto install_deps
if "%choice%"=="5" goto exit_app
goto menu

:full_setup
cls
echo =====================================================================
echo  [Step 1 of 3] Installing dependencies...
echo =====================================================================
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  [!] npm install failed. Please verify Node.js is installed correctly.
    pause
    goto menu
)

:rebuild
cls
echo =====================================================================
echo  [Step 2 of 3] Building the production assets...
echo =====================================================================
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo  [!] Build failed. Please verify your React TypeScript code builds successfully.
    pause
    goto menu
)
if "%choice%"=="3" (
    echo.
    echo  [+] Build completed successfully!
    pause
    goto menu
)

:quick_start
cls
if not exist "dist" (
    echo =====================================================================
    echo  [!] Error: "dist" folder not found!
    echo      We need to build the React application first.
    echo =====================================================================
    echo.
    echo  [1] Build now
    echo  [2] Back to menu
    echo.
    set /p build_choice="Select an option (1-2): "
    if "%build_choice%"=="1" goto rebuild
    goto menu
)

echo =====================================================================
echo  [Step 3 of 3] Launching Python Server...
echo =====================================================================
echo.
:: Try standard "python" first, fallback to "py" if needed
where python >nul 2>&1
if %errorlevel% equ 0 (
    python server.py
) else (
    py server.py
)
pause
goto menu

:install_deps
cls
echo =====================================================================
echo  Installing NPM packages...
echo =====================================================================
call npm install
echo.
echo  [+] Installation complete!
pause
goto menu

:exit_app
echo.
echo  Goodbye!
timeout /t 2 >nul
exit /b

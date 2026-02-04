@echo off
REM Product Builder - Quick Start Script for Windows

echo.
echo ========================================
echo   Product Builder - MVP Quick Start
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env and configure your ANTHROPIC_API_KEY
    echo.
    pause
    exit /b 1
)

echo [1/4] Checking configuration...
node health-check.js
if errorlevel 1 (
    echo.
    echo [ERROR] Health check failed. Please fix the issues above.
    pause
    exit /b 1
)

echo.
echo [2/4] Installing dependencies...
if not exist "node_modules" (
    echo Installing server dependencies...
    call npm install
)

if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
)

echo.
echo [3/4] Creating export directories...
if not exist "exports\cad" mkdir exports\cad
if not exist "exports\pcb" mkdir exports\pcb

echo.
echo [4/4] Starting application...
echo.
echo ========================================
echo   Server: http://localhost:3001
echo   Client: http://localhost:3000
echo ========================================
echo.
echo Press Ctrl+C to stop the servers
echo.

REM Start the app
call npm run dev:full

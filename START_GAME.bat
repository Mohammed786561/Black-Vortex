@echo off
title Black Vortex - Server Launcher
color 0A
echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║                  BLACK VORTEX                             ║
echo  ║                  Server Launcher                          ║
echo  ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
echo [1/4] Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ╔════════════════════════════════════════════════════════════╗
    echo  ║  ❌ ERROR: Node.js is NOT installed!                      ║
    echo  ╠════════════════════════════════════════════════════════════╣
    echo  ║  The backend servers require Node.js to run.              ║
    echo  ║                                                          ║
    echo  ║  Please install Node.js:                                 ║
    echo  ║  1. Go to https://nodejs.org/                            ║
    echo  ║  2. Download the LTS version                             ║
    echo  ║  3. Run the installer                                    ║
    echo  ║  4. Make sure "Add to PATH" is checked                   ║
    echo  ║  5. Restart your computer                                ║
    echo  ║                                                          ║
    echo  ║  Then run this script again.                             ║
    echo  ╚════════════════════════════════════════════════════════════╝
    echo.
    echo  Opening Node.js download page...
    start https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo    ✓ Node.js found: %NODE_VERSION%
echo.

REM Check if we're in the right directory
echo [2/4] Checking for server files...
if not exist "server\package.json" (
    echo    ❌ ERROR: Cannot find server\package.json
    echo    Please run this script from the Black Vortex root directory.
    pause
    exit /b 1
)
echo    ✓ Found server files
echo.

REM Check if dependencies are installed
echo [3/4] Checking dependencies...
if not exist "server\node_modules" (
    echo    Installing dependencies (this may take a minute)...
    echo.
    cd server
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo    ❌ ERROR: Failed to install dependencies
        echo    Please try manually: cd server ^&^& npm install
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo    ✓ Dependencies installed
) else (
    echo    ✓ Dependencies already installed
)
echo.

REM Start the servers
echo [4/4] Starting servers...
echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║                  SERVERS STARTING                          ║
echo  ╠════════════════════════════════════════════════════════════╣
echo  ║  Auth Server:      http://localhost:4000                  ║
echo  ║  Multiplayer:      ws://localhost:4010                    ║
echo  ║  Health Check:     http://localhost:4010/health           ║
echo  ╠════════════════════════════════════════════════════════════╣
echo  ║  Press Ctrl+C to stop the servers                        ║
echo  ╚════════════════════════════════════════════════════════════╝
echo.

cd server
node start-server.js

echo.
echo  Servers stopped.
pause

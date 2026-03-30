@echo off
title Black Vortex - Complete Setup
color 0B
echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║                  BLACK VORTEX                             ║
echo  ║              Complete Setup Script                        ║
echo  ╚════════════════════════════════════════════════════════════╝
echo.

REM Check for Node.js
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ╔════════════════════════════════════════════════════════════╗
    echo  ║  ❌ Node.js is NOT installed!                            ║
    echo  ╠════════════════════════════════════════════════════════════╣
    echo  ║  Please install Node.js first:                           ║
    echo  ║  1. Go to https://nodejs.org/                            ║
    echo  ║  2. Download LTS version                                 ║
    echo  ║  3. Run installer (check "Add to PATH")                  ║
    echo  ║  4. Restart computer and run this script again           ║
    echo  ╚════════════════════════════════════════════════════════════╝
    start https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo    ✓ Node.js %NODE_VERSION% found

REM Create .env file if it doesn't exist
echo [2/5] Setting up environment configuration...
if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo    ✓ Created .env file from template
    echo    ⚠️  Please edit .env file with your settings
) else (
    echo    ✓ .env file already exists
)

REM Install server dependencies
echo [3/5] Installing server dependencies...
cd server
if not exist "node_modules" (
    echo    Installing npm packages (this may take a minute)...
    call npm install
    if %errorlevel% neq 0 (
        echo    ❌ Failed to install dependencies
        cd ..
        pause
        exit /b 1
    )
    echo    ✓ Dependencies installed
) else (
    echo    ✓ Dependencies already installed
)
cd ..

REM Create logs directory
echo [4/5] Creating directories...
if not exist "server\logs" mkdir "server\logs"
echo    ✓ Logs directory ready

REM Verify setup
echo [5/5] Verifying setup...
if exist "server\auth-api.js" (
    echo    ✓ Auth server file exists
) else (
    echo    ❌ Auth server file missing
)
if exist "server\multiplayer-server-improved.js" (
    echo    ✓ Multiplayer server file exists
) else (
    echo    ❌ Multiplayer server file missing
)
if exist "server\database.js" (
    echo    ✓ Database module exists
) else (
    echo    ❌ Database module missing
)

echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║                  SETUP COMPLETE!                          ║
echo  ╠════════════════════════════════════════════════════════════╣
echo  ║  Next steps:                                             ║
echo  ║  1. Edit .env file with your configuration               ║
echo  ║  2. Run START_GAME.bat to start servers                  ║
echo  ║  3. Open index.html in your browser                      ║
echo  ╠════════════════════════════════════════════════════════════╣
echo  ║  Servers:                                                ║
echo  ║  - Auth: http://localhost:4000                           ║

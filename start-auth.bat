@echo off
echo.
echo ==========================================
echo  Black Vortex Authentication Server
echo ==========================================
echo.
echo Starting Authentication Server on port 4000...
echo.
echo Features:
echo   - AI-powered Google email verification
echo   - User registration and login
echo   - Admin dashboard access
echo.
echo Admin Credentials:
echo   Email: admin@blackvortex.com
echo   Password: admin123
echo.
echo Health Check: http://localhost:4000/health
echo.
echo Press Ctrl+C to stop the server
echo ==========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo and ensure it's added to your system PATH.
    echo.
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist "server\package.json" (
    echo ERROR: package.json not found in server directory.
    echo Please ensure you are in the correct directory.
    echo.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "server\node_modules" (
    echo Installing dependencies...
    cd server
    npm install
    cd ..
)

REM Start the authentication server
cd server
node start-server.js
cd ..

echo.
echo Server stopped.
pause
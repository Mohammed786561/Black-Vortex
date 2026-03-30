@echo off
echo.
echo ==========================================
echo  Black Vortex Multiplayer Server
echo ==========================================
echo.
echo Starting Multiplayer Server on port 4010...
echo.
echo Features:
echo   - 1v1, 2v2, 3v3, 4v4 matchmaking
echo   - 4 unique maps with custom layouts
echo   - Real-time combat and scoring
echo   - AI coach integration (optional)
echo.
echo Health Check: http://localhost:4010/health
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

REM Check for optional AI dependencies
echo Checking for AI coach dependencies...
cd server
if exist "node_modules\@google\generative-ai" (
    echo ✓ AI coach dependencies found
) else (
    echo ⚠ AI coach dependencies not found
    echo   To enable AI coach, set GEMINI_API_KEY environment variable
    echo   and ensure @google/generative-ai is installed
)
cd ..

echo.
echo Starting server...
echo.

REM Start the multiplayer server
cd server
node multiplayer-server.js
cd ..

echo.
echo Server stopped.
pause
@echo off
echo Starting Black Vortex Authentication System...
echo =============================================
echo.

echo 1. Starting Authentication API Server...
start "Auth API" cmd /k "npm start"

echo 2. Starting Log Monitor...
start "Log Monitor" cmd /k "npm run monitor"

echo 3. Opening Dashboard in 5 seconds...
timeout /t 5 >nul
start dashboard.html

echo.
echo =============================================
echo System Status:
echo - Authentication API: Running on port 4000
echo - Log Monitor: Active and watching logs
echo - Dashboard: Opened in browser
echo.
echo To view logs manually:
echo   - Security logs: server/logs/security.log
echo   - Activity logs: server/logs/activity.log
echo.
echo Press Ctrl+C in any window to stop that service.
echo =============================================
pause
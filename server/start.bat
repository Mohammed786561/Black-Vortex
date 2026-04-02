@echo off
echo Starting Black Vortex AI Authentication API...
echo =============================================
echo.
echo Make sure you have installed dependencies:
echo npm install
echo.
echo Setting up environment variables...
set PORT=4000
set JWT_SECRET=your-secret-key-here
set GEMINI_API_KEY=your-gemini-api-key-here
echo.
echo Starting server on port %PORT%...
echo.
node auth-api.js
pause
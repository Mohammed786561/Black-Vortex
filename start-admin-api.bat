echo Starting Black Vortex Admin API Server...
echo.
echo Make sure you have Node.js and Express installed.
echo.
echo Server will start on: http://localhost:4000
echo.
echo Admin Interface: Open simple-admin-interface.html in your browser
echo Admin Credentials: admin@blackvortex.com / admin123
echo.
echo API Endpoints:
echo   POST /api/admin-login - Admin authentication
echo   GET  /api/admin/users - Get all users
echo   DELETE /api/admin/users/:id - Delete user
echo   GET  /api/admin/logs - Get activity logs
echo   GET  /api/admin/stats - Get system statistics
echo.
node server/admin-api.js
pause
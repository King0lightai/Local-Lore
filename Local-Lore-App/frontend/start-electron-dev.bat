@echo off
echo Starting Local Lore Electron App in Development Mode...
echo.
echo Make sure the following are running:
echo 1. Backend server (npm start in backend directory)
echo 2. MCP server (npm start in mcp-server directory) 
echo 3. Frontend dev server (npm start in frontend directory)
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

npm run electron-dev
@echo off
echo Starting Scribber MCP Server...
cd Local-Lore-App\mcp-server
call npm install
echo.
echo Starting server...
node server.js
pause
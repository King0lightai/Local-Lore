@echo off
title Local Lore - Electron Development Environment
echo ========================================
echo    Local Lore Electron Development
echo ========================================
echo.

cd /d "%~dp0Local-Lore-App"

echo Starting all required services for Electron development...
echo.

REM Check if directories exist
if not exist "backend" (
    echo Error: Backend directory not found
    pause
    exit /b 1
)

if not exist "mcp-server" (
    echo Error: MCP Server directory not found
    pause
    exit /b 1
)

if not exist "frontend" (
    echo Error: Frontend directory not found
    pause
    exit /b 1
)

echo Starting Backend Server...
start "Backend Server" cmd /c "cd backend && npm start"
echo Waiting for backend to initialize...
timeout /t 3 >nul

echo Starting MCP Server...
start "MCP Server" cmd /c "cd mcp-server && npm start"
echo Waiting for MCP server to initialize...
timeout /t 3 >nul

echo Starting Frontend Development Server...
start "Frontend Dev Server" cmd /c "cd frontend && npm start"
echo Waiting for frontend to build...
timeout /t 10 >nul

echo.
echo All services should now be starting...
echo Please wait for all services to be ready, then press any key to start Electron
pause >nul

echo Starting Electron Application...
cd frontend
npm run electron-dev

echo.
echo Electron development session ended.
pause
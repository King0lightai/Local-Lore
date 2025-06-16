@echo off
echo Building Local Lore Electron Application...
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
)

REM Build the React app
echo Building React application...
npm run build

if %errorlevel% neq 0 (
    echo Failed to build React application
    pause
    exit /b 1
)

REM Install backend dependencies if needed
if not exist "../backend/node_modules" (
    echo Installing backend dependencies...
    cd ../backend
    npm install
    cd ../frontend
)

REM Install MCP server dependencies if needed
if not exist "../mcp-server/node_modules" (
    echo Installing MCP server dependencies...
    cd ../mcp-server
    npm install
    cd ../frontend
)

REM Build Electron application
echo Building Electron application...
npm run electron-dist

if %errorlevel% equ 0 (
    echo.
    echo Build completed successfully!
    echo Electron application can be found in the dist-electron directory.
    echo.
) else (
    echo Build failed. Please check the error messages above.
)

pause
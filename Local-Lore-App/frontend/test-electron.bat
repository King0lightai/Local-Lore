@echo off
echo Testing Electron Configuration...
echo.

REM Test if Electron can start with built files
echo Testing Electron with built files...
timeout /t 2 >nul

npm run electron

echo.
echo If Electron window opened successfully, the configuration is working!
pause
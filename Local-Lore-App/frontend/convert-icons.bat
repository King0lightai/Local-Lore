@echo off
echo Converting logo.png to ICO format for Windows...

REM Check if ImageMagick is installed
magick -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ImageMagick not found. Please install ImageMagick from https://imagemagick.org/
    echo Or use an online converter to convert public/logo.png to public/logo.ico
    pause
    exit /b 1
)

REM Create ICO file with multiple sizes
magick public/logo.png -resize 256x256 -define icon:auto-resize=256,128,64,48,32,16 public/logo.ico

if %errorlevel% equ 0 (
    echo Successfully converted logo.png to logo.ico
    echo Icon file created at: public/logo.ico
) else (
    echo Failed to convert icon. Please check if public/logo.png exists.
)

pause
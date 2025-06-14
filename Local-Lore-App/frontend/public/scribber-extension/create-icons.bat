@echo off
echo Creating placeholder icons...

:: Create a simple 16x16 icon using PowerShell
powershell -Command "Add-Type -AssemblyName System.Drawing; $bitmap = New-Object System.Drawing.Bitmap(16, 16); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.Clear([System.Drawing.Color]::FromArgb(99, 102, 241)); $font = New-Object System.Drawing.Font('Arial', 8, [System.Drawing.FontStyle]::Bold); $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White); $graphics.DrawString('S', $font, $brush, 2, 2); $bitmap.Save('icon16.png', [System.Drawing.Imaging.ImageFormat]::Png); $graphics.Dispose(); $bitmap.Dispose()"

:: Create a 48x48 icon
powershell -Command "Add-Type -AssemblyName System.Drawing; $bitmap = New-Object System.Drawing.Bitmap(48, 48); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.Clear([System.Drawing.Color]::FromArgb(99, 102, 241)); $font = New-Object System.Drawing.Font('Arial', 24, [System.Drawing.FontStyle]::Bold); $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White); $graphics.DrawString('S', $font, $brush, 12, 12); $bitmap.Save('icon48.png', [System.Drawing.Imaging.ImageFormat]::Png); $graphics.Dispose(); $bitmap.Dispose()"

:: Create a 128x128 icon
powershell -Command "Add-Type -AssemblyName System.Drawing; $bitmap = New-Object System.Drawing.Bitmap(128, 128); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.Clear([System.Drawing.Color]::FromArgb(99, 102, 241)); $font = New-Object System.Drawing.Font('Arial', 64, [System.Drawing.FontStyle]::Bold); $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White); $graphics.DrawString('S', $font, $brush, 32, 32); $bitmap.Save('icon128.png', [System.Drawing.Imaging.ImageFormat]::Png); $graphics.Dispose(); $bitmap.Dispose()"

echo Icons created!
pause
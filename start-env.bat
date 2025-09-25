@echo off
echo ========================================
echo Restarting Family 100 Game Server
echo ========================================
echo.

echo Stopping any running servers...
taskkill /F /IM node.exe >nul 2>&1

echo Starting server with environment variables...
echo.
echo ========================================
echo Server is running with .env configuration!
echo ========================================
echo.

REM Get IPv4 address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r /c:"IPv4 Address"') do (
    set ip=%%a
    goto :found
)
:found
set ip=%ip: =%

echo Local Access:
echo http://localhost:3000/             - Login Page
echo http://localhost:3000/family      - Panel Admin  
echo http://localhost:3000/host        - Panel Host
echo http://localhost:3000/player      - Tombol Peserta
echo.

echo Network Access:
echo http://%ip%:3000/                  - Login Page
echo http://%ip%:3000/family           - Panel Admin
echo http://%ip%:3000/host             - Panel Host
echo http://%ip%:3000/player           - Tombol Peserta
echo.

echo ========================================
echo Environment: Loading from .env file
echo Press Ctrl+C to stop the server
echo ========================================
echo.

npm start
@echo off
SETLOCAL

:: Kiểm tra xem Node.js đã được cài đặt chưa
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js first.
    pause
    EXIT /B 1
)

:: Kiểm tra xem PM2 đã được cài đặt chưa
pm2 -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Installing PM2...
    npm install -g pm2
)

:: Khởi động ứng dụng với PM2
echo Starting NestJS application with PM2...
pm2 start dist/src/main.js --name "nail-service-container"

:: Lưu trạng thái của PM2
echo Saving PM2 process list...
pm2 save

:: Thiết lập PM2 để khởi động cùng Windows
echo Setting up PM2 to start at boot...
pm2 startup
IF %ERRORLEVEL% NEQ 0 (
    echo Run the following command with administrator privileges:
    pm2 startup ^| FIND "pm2 startup -u" > temp.txt
    SET /p PM2_STARTUP_CMD=<temp.txt
    echo %PM2_STARTUP_CMD%
    DEL temp.txt
    pause
)

:: Hoàn tất
echo Setup complete. Nail application service is now running as a service with PM2.
pause
ENDLOCAL
EXIT /B 0

@echo off
setlocal

:: Check if the system is 64-bit or 32-bit
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set "ARCH=x64"
) else (
    if "%PROCESSOR_ARCHITEW6432%"=="AMD64" (
        set "ARCH=x64"
    ) else (
        set "ARCH=x86"
    )
)

echo System architecture: %ARCH%

:: Define the URL for MongoDB version 7.0 installer based on system architecture
if "%ARCH%"=="x64" (
    set "MONGO_URL=https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.3-signed.msi"
) else (
    set "MONGO_URL=https://fastdl.mongodb.org/windows/mongodb-windows-x86-7.0.3-signed.msi"
)
set "MONGO_INSTALLER=mongodb-installer.msi"

:: Define the path to check for MongoDB installation
set "MONGO_PATH=C:\Program Files\MongoDB\Server\7.0\bin"

:: Check if the MongoDB path exists
echo Checking for MongoDB...
if exist "%MONGO_PATH%" (
    echo MongoDB is already installed at: %MONGO_PATH%
) else (
    echo MongoDB is not installed.
    echo Downloading MongoDB version 7.0 installer...
    powershell -Command "Invoke-WebRequest -Uri %MONGO_URL% -OutFile %MONGO_INSTALLER%"
    echo Installing MongoDB...
    msiexec /i %MONGO_INSTALLER% /quiet
    echo Cleaning up the installer file...
    del %MONGO_INSTALLER%
    echo MongoDB installation complete!
)

:: Get the IP address
for /f "tokens=14" %%i in ('ipconfig ^| findstr /i "IPv4"') do set IP_ADDRESS=%%i

:: Create or update .env.production file with IP_ADDRESS
echo Creating or updating .env.production file...
(
    echo IP_ADDRESS=%IP_ADDRESS%
    echo CORS_ORIGIN_ADMIN="%IP_ADDRESS%:3000"
    echo CORS_ORIGIN_STAFF="%IP_ADDRESS%:3001"
) > .env.production

:: Define the URL for the latest Node.js installer based on system architecture
if "%ARCH%"=="x64" (
    set "NODE_URL=https://nodejs.org/dist/latest/node-v23.2.0-x64.msi"
) else (
    set "NODE_URL=https://nodejs.org/dist/latest/node-v23.2.0-x86.msi"
)
set "NODE_INSTALLER=nodejs-installer.msi"

:: Define the path to check for Node.js installation
set "NODE_PATH=C:\Program Files\nodejs"

:: Check if Node.js is installed
echo Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed.
    echo Downloading the latest Node.js installer...
    powershell -Command "Invoke-WebRequest -Uri %NODE_URL% -OutFile %NODE_INSTALLER%"
    echo Installing Node.js...
    msiexec /i %NODE_INSTALLER% /quiet
    echo Cleaning up the installer file...
    del %NODE_INSTALLER%
    echo Node.js installation complete!
) else (
    echo Node.js is already installed at: %NODE_PATH%
)

:: Install application dependencies
echo Installing application dependencies...
npm install --production

:: Start the application
echo Starting the application...
node dist/main.js

exit
endlocal

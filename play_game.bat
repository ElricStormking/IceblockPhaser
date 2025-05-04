@echo off
echo Starting Beauty Ice Breaker game server...
echo.

REM Check if Python is installed
python --version > nul 2>&1
if %errorlevel% equ 0 (
    echo Python found! Starting game with Python server...
    echo.
    python serve.py
    goto :end
)

REM Check if Python3 is installed
python3 --version > nul 2>&1
if %errorlevel% equ 0 (
    echo Python3 found! Starting game with Python server...
    echo.
    python3 serve.py
    goto :end
)

REM Check if Node.js is installed
node --version > nul 2>&1
if %errorlevel% equ 0 (
    echo Node.js found! Starting game with Node.js server...
    echo.
    
    REM Check if Express is installed
    npm list express -g > nul 2>&1
    if %errorlevel% neq 0 (
        echo Installing Express...
        npm install express --save
    )
    
    node server.js
    goto :end
)

echo.
echo ERROR: Could not find Python or Node.js installed.
echo Please install either Python or Node.js to run the game server.
echo.
echo Alternatively, you can use a local web server like XAMPP, WAMP, or http-server.
echo.
pause

:end 
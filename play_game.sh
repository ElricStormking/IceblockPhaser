#!/bin/bash

echo "Starting Beauty Ice Breaker game server..."
echo ""

# Check if Python is installed
if command -v python3 &> /dev/null; then
    echo "Python3 found! Starting game with Python server..."
    echo ""
    python3 serve.py
    exit 0
elif command -v python &> /dev/null; then
    echo "Python found! Starting game with Python server..."
    echo ""
    python serve.py
    exit 0
fi

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo "Node.js found! Starting game with Node.js server..."
    echo ""
    
    # Check if Express is installed
    if ! npm list express -g &> /dev/null; then
        echo "Installing Express..."
        npm install express --save
    fi
    
    node server.js
    exit 0
fi

echo ""
echo "ERROR: Could not find Python or Node.js installed."
echo "Please install either Python or Node.js to run the game server."
echo ""
echo "Alternatively, you can use a local web server like XAMPP, MAMP, or http-server."
echo "" 
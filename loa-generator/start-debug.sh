#!/bin/bash

echo "===========================================" 
echo " LoA Generator - Starting with Debug Mode"
echo "==========================================="

# Check Node.js
echo "[CHECK] Node.js version: $(node -v)"

# Check if port 8888 is already in use
if lsof -i:8888 >/dev/null 2>&1; then
    echo "[WARNING] Port 8888 is already in use!"
    echo "[INFO] Killing existing process on port 8888..."
    kill $(lsof -t -i:8888) 2>/dev/null
    sleep 2
fi

# Check if port 3003 is already in use  
if lsof -i:3003 >/dev/null 2>&1; then
    echo "[WARNING] Port 3003 is already in use!"
    echo "[INFO] Killing existing process on port 3003..."
    kill $(lsof -t -i:3003) 2>/dev/null
    sleep 2
fi

# Start the server
echo "[INFO] Starting server..."
node server.js
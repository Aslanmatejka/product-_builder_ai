#!/bin/bash

# Product Builder - Quick Start Script for Unix/Mac

echo ""
echo "========================================"
echo "  Product Builder - MVP Quick Start"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "[ERROR] .env file not found!"
    echo "Please copy .env.example to .env and configure your ANTHROPIC_API_KEY"
    echo ""
    exit 1
fi

echo "[1/4] Checking configuration..."
node health-check.js
if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Health check failed. Please fix the issues above."
    exit 1
fi

echo ""
echo "[2/4] Installing dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client
    npm install
    cd ..
fi

echo ""
echo "[3/4] Creating export directories..."
mkdir -p exports/cad
mkdir -p exports/pcb

echo ""
echo "[4/4] Starting application..."
echo ""
echo "========================================"
echo "  Server: http://localhost:3001"
echo "  Client: http://localhost:3000"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop the servers"
echo ""

# Start the app
npm run dev:full

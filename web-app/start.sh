#!/bin/bash

# Road Works Monitor - Web App Development Setup Script

echo "🛣️ Road Works Monitor - Web App Setup"
echo "======================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null
then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✓ npm version: $(npm --version)"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

echo ""
echo "🚀 Starting development server..."
echo "======================================"
echo ""
echo "The app will be available at: http://localhost:5174"
echo "API is expected at: http://localhost:8000/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev

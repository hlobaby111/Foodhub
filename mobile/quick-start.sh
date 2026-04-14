#!/bin/bash

# FoodHub Mobile App - Quick Start Script
# This script helps you set up and run the mobile app quickly

echo "================================================"
echo "   FoodHub Mobile App - Quick Start Setup"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the /app/mobile directory"
    echo "   cd /app/mobile && bash quick-start.sh"
    exit 1
fi

echo "Step 1/5: Installing dependencies..."
echo "This may take a few minutes..."
echo ""

npm install

if [ $? -ne 0 ]; then
    echo "❌ Error: npm install failed"
    echo "Try: rm -rf node_modules && npm install"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

echo "Step 2/5: Checking .env file..."
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file with default localhost configuration..."
    echo "BACKEND_URL=http://localhost:8001" > .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi
echo ""

echo "Step 3/5: Backend URL Configuration"
echo ""
echo "Current backend URL in .env:"
cat .env
echo ""
echo "📱 For testing on different devices, update BACKEND_URL in .env:"
echo "   - Android Emulator: http://10.0.2.2:8001"
echo "   - iOS Simulator: http://localhost:8001"
echo "   - Physical Device: http://YOUR_COMPUTER_IP:8001"
echo ""
echo "   To get your IP address:"
echo "   - Mac/Linux: ifconfig | grep 'inet '"
echo "   - Windows: ipconfig"
echo ""

echo "Step 4/5: Checking Backend Status..."
echo ""

# Check if backend is running
BACKEND_RUNNING=$(curl -s http://localhost:8001/api/health 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Backend is running on http://localhost:8001"
else
    echo "⚠️  Backend not detected on http://localhost:8001"
    echo ""
    echo "Please start the backend first:"
    echo "   cd /app/backend"
    echo "   node server.js"
    echo ""
fi

echo ""
echo "Step 5/5: Ready to launch!"
echo ""
echo "================================================"
echo "   🚀 Mobile App Setup Complete!"
echo "================================================"
echo ""
echo "To start the app:"
echo "   npm start"
echo ""
echo "Then:"
echo "   📱 Scan QR code with Expo Go app (download from App/Play Store)"
echo "   🖥️  Press 'a' for Android emulator"
echo "   🍎 Press 'i' for iOS simulator"
echo ""
echo "Test Credentials:"
echo "   Email: customer@test.com"
echo "   Password: customer123"
echo ""
echo "📚 For detailed instructions, see SETUP_GUIDE.md"
echo ""
echo "================================================"

# Ask if user wants to start now
read -p "Would you like to start the app now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting Expo development server..."
    echo ""
    npm start
fi

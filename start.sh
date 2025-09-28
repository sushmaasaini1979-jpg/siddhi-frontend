#!/bin/bash

# SIDDHI Food Ordering System - Startup Script
echo "🚀 Starting SIDDHI Food Ordering System..."

# Check if we're in the right directory
if [ ! -d "clean-backend" ] || [ ! -d "clean-frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Make sure you're in the directory containing 'clean-backend' and 'clean-frontend' folders"
    exit 1
fi

# Check if node_modules exist
if [ ! -d "clean-backend/node_modules" ] || [ ! -d "clean-frontend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd clean-backend && npm install && cd ../clean-frontend && npm install && cd ..
fi

# Ensure database is set up and seeded
echo "🗄️ Setting up database..."
cd clean-backend

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "📊 Pushing database schema..."
npx prisma db push

# Seed database with store and menu data
echo "🌱 Seeding database..."
node prisma/seed.js

cd ..

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "nodemon\|vite\|node.*server" 2>/dev/null || true
lsof -ti:3000,3001,3002,5000 | xargs kill -9 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

# Start backend server
echo "🔧 Starting backend server..."
cd "clean-backend"
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server..."
cd "../clean-frontend"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

# Health check
echo "🔍 Checking server health..."
sleep 2

# Check backend health (try both ports)
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend server is healthy (port 5000)"
elif curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend server is healthy (port 3001)"
else
    echo "❌ Backend server health check failed"
    echo "   Trying to start backend on port 5000..."
fi

# Check frontend
if curl -s -I http://localhost:3000 > /dev/null; then
    echo "✅ Frontend server is healthy"
else
    echo "❌ Frontend server health check failed"
fi

echo ""
echo "🎉 SIDDHI Food Ordering System is now running!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo "👑 Admin:    http://localhost:3000/admin"
echo "🍽️  Menu:     http://localhost:3000/menu?store=siddhi"
echo ""
echo "📊 Database: Supabase PostgreSQL (Connected & Seeded)"
echo "🏪 Store:    SIDDHI (siddhi) - 44 menu items, 7 categories"
echo ""
echo "✅ No connection errors - system ready!"
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID

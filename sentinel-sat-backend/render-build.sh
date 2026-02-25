#!/bin/bash

# Render Build Script for SENTINEL.SAT
echo "🚀 Building SENTINEL.SAT for Render..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Build frontend
echo "🏗️ Building frontend..."
cd frontend
npm install
npm run build

# Move frontend build to static directory
echo "📁 Moving frontend to static..."
mkdir -p ../static
cp -r dist/* ../static/
cd ..

echo "✅ Build completed successfully!"
echo "🌐 Frontend served from: /static"
echo "🔧 Backend API at: /api/*"
echo "📹 Video stream at: /stream"

#!/bin/bash

# SENTINEL.SAT Build Script for Render

echo "🚀 Building SENTINEL.SAT for Render deployment..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build

# Move frontend build to backend static directory
echo "📁 Moving frontend build to backend..."
mkdir -p ../backend/static
cp -r dist/* ../backend/static/
cd ..

# Build backend Docker image (optional for local testing)
echo "🐳 Building Docker image..."
docker build -t sentinel-sat .

echo "✅ Build complete!"
echo ""
echo "📋 Deployment checklist for Render:"
echo "1. Push code to GitHub repository"
echo "2. Create new Web Service on Render"
echo "3. Connect repository"
echo "4. Set environment variables:"
echo "   - HF_TOKEN=Bearer YOUR_HUGGINGFACE_TOKEN"
echo "   - ESP_STREAM_URL=http://your-esp32-ip:81/stream"
echo "   - SUPABASE_URL=your_supabase_url (optional)"
echo "   - SUPABASE_KEY=your_supabase_key (optional)"
echo "5. Deploy! 🎉"

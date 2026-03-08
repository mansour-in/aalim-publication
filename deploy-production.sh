#!/bin/bash
# ============================================
# Production Deployment Script
# ============================================

set -e

echo "🚀 Starting Production Deployment..."

# Check if .env.production exists
if [ ! -f "backend/.env.production" ]; then
    echo "❌ Error: backend/.env.production not found!"
    echo "Please create it from backend/.env.production.example"
    exit 1
fi

# Switch to production environment
echo "📋 Switching to production environment..."
cp backend/.env.production backend/.env

# Build frontend with production API URL
echo "🏗️  Building frontend..."
npm run build

# Verify build
echo "✅ Build completed!"
echo ""
echo "📦 Files ready for deployment:"
echo "   - dist/ (frontend build)"
echo "   - backend/ (API server)"
echo ""
echo "🚀 Next steps:"
echo "   1. Upload dist/ folder to your web root"
echo "   2. Upload backend/ folder to your server"
echo "   3. Start the backend: cd backend && npm start"
echo "   4. Visit: https://donation.aalimpublications.com/setup"
echo ""
echo "🔄 To switch back to local development:"
echo "   git checkout backend/.env"

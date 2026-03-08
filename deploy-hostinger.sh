#!/bin/bash
# ============================================
# HOSTINGER DEPLOYMENT SCRIPT
# ============================================
# This script builds the frontend and prepares 
# the backend for deployment on Hostinger
#
# Run this locally before pushing to GitHub:
#   chmod +x deploy-hostinger.sh
#   ./deploy-hostinger.sh
# ============================================

set -e  # Exit on error

echo "========================================"
echo "  AALIM FUNDRAISER - DEPLOY TO HOSTINGER"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install dependencies (including devDependencies)
echo -e "${YELLOW}[1/6] Installing frontend dependencies...${NC}"
npm ci --include=dev

# Step 2: Build frontend
echo -e "${YELLOW}[2/6] Building frontend for production...${NC}"
npm run build

# Step 3: Install backend dependencies
echo -e "${YELLOW}[3/6] Installing backend dependencies...${NC}"
cd backend
npm ci
cd ..

# Step 4: Verify build output
echo -e "${YELLOW}[4/6] Verifying build output...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: dist folder not found. Build failed.${NC}"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}Error: index.html not found in dist folder.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"
echo "   - dist/index.html: $(ls -lh dist/index.html | awk '{print $5}')"
echo "   - dist/assets: $(ls dist/assets/ | wc -l) files"

# Step 5: Check for required images
echo -e "${YELLOW}[5/6] Checking for required images...${NC}"
REQUIRED_IMAGES=("logo.png" "moon_glow.png" "mosque.png" "pattern_geo.png")
MISSING_IMAGES=()

for img in "${REQUIRED_IMAGES[@]}"; do
    if [ ! -f "public/$img" ]; then
        MISSING_IMAGES+=("$img")
    fi
done

if [ ${#MISSING_IMAGES[@]} -ne 0 ]; then
    echo -e "${RED}Warning: Missing images in public/ folder:${NC}"
    for img in "${MISSING_IMAGES[@]}"; do
        echo "   - $img"
    done
    echo ""
    echo "Please add these images before deploying:"
    echo "   cp /path/to/your/images/* public/"
    echo ""
fi

# Step 6: Git commit and push
echo -e "${YELLOW}[6/6] Preparing for deployment...${NC}"
echo ""
echo -e "${GREEN}✓ Local build complete!${NC}"
echo ""
echo "Next steps:"
echo "   1. Commit and push to GitHub:"
echo "      git add ."
echo "      git commit -m 'Deploy: Build for production'"
echo "      git push origin main"
echo ""
echo "   2. On Hostinger server:"
echo "      - Pull the latest code"
echo "      - Import .env.hostinger environment variables"
echo "      - Run: cd backend && npm install"
echo "      - Start the server with PM2 or Node.js hosting"
echo ""
echo "========================================"
echo "  DEPLOYMENT PREP COMPLETE"
echo "========================================"

# Hostinger Deployment Guide - Full Stack

This guide explains how to deploy the Aalim Fundraiser application (frontend + backend) on Hostinger.

## Overview

Instead of using Hostinger's static site hosting, you'll use **Node.js hosting** to run both the backend API and serve the frontend.

## Prerequisites

1. Hostinger VPS or Node.js hosting plan
2. SSH access to your server
3. MySQL database created on Hostinger
4. Domain pointed to your Hostinger server

## File Structure on Server

```
/home/u145912236/domains/donation.aalimpublications.com/
├── backend/              # Backend code
│   ├── server.js
│   ├── package.json
│   ├── node_modules/
│   └── ...
├── dist/                 # Frontend build output
│   ├── index.html
│   └── assets/
├── public/               # Static images (logo, etc.)
│   ├── logo.png
│   ├── moon_glow.png
│   ├── mosque.png
│   └── pattern_geo.png
├── logs/                 # Application logs
├── .env                  # Environment variables
├── ecosystem.config.js   # PM2 configuration
└── package.json          # Root package.json
```

## Step-by-Step Deployment

### 1. Prepare Environment Files

Two environment files have been created for you:

- **`.env.hostinger`** - Backend environment variables
- **`frontend.env.hostinger`** - Frontend build variables

**IMPORTANT:** Update these values before importing:
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (get from Razorpay dashboard)
- `JWT_SECRET` (generate a strong random string)
- `SMTP_USER` and `SMTP_PASS` (for email notifications)
- `RAZORPAY_WEBHOOK_SECRET` (for payment webhooks)

### 2. Local Build

Run the deployment script locally:

```bash
chmod +x deploy-hostinger.sh
./deploy-hostinger.sh
```

This will:
- Install dependencies
- Build the frontend
- Verify the build
- Show next steps

### 3. Add Missing Images

Before pushing, add your images to the `public/` folder:

```bash
cp /path/to/your/logo.png public/
cp /path/to/your/moon_glow.png public/
cp /path/to/your/mosque.png public/
cp /path/to/your/pattern_geo.png public/
```

### 4. Push to GitHub

```bash
git add .
git commit -m "Deploy: Production build with backend"
git push origin main
```

### 5. Server Setup (SSH into Hostinger)

Connect to your server:

```bash
ssh u145912236@your-server.hostinger.com
cd /home/u145912236/domains/donation.aalimpublications.com
```

### 6. Import Environment Variables

In Hostinger's control panel:
1. Go to **Advanced** → **Node.js**
2. Find **Environment Variables** section
3. Import the `.env.hostinger` file contents

Or manually set them via SSH:

```bash
nano .env
# Paste contents of .env.hostinger
# Save: Ctrl+O, Enter, Ctrl+X
```

### 7. Install Dependencies & Build

```bash
# Install frontend dependencies (including devDependencies for TypeScript)
npm ci --include=dev

# Build frontend
npm run build

# Install backend dependencies
cd backend
npm ci
cd ..
```

### 8. Start the Application

**Option A: Using PM2 (Recommended)**

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup auto-start on boot
pm2 startup
```

**Option B: Using Hostinger Node.js Panel**

1. In Hostinger control panel, go to **Advanced** → **Node.js**
2. Set **Application root**: `/home/u145912236/domains/donation.aalimpublications.com/backend`
3. Set **Application startup file**: `server.js`
4. Set **Environment variables**: Import from `.env.hostinger`
5. Click **Create**

### 9. Configure Domain

In Hostinger control panel:
1. Go to **Domains** → **your domain**
2. Set document root to: `/home/u145912236/domains/donation.aalimpublications.com`
3. Ensure Node.js app is mapped to your domain

### 10. Setup Database

Run the database setup script (if needed):

```bash
cd backend
npm run setup
```

Or manually import the SQL schema from `backend/database/schema.sql`

## Verification

Check if everything is working:

```bash
# Check if server is running
curl https://donation.aalimpublications.com/api/health

# Expected response:
# {"success":true,"message":"Ramadan Hadith Fundraiser API is running",...}
```

## Troubleshooting

### 404 on API routes
- Check if backend is running: `pm2 status`
- Check logs: `pm2 logs aalim-fundraiser`
- Verify environment variables are loaded

### Images not loading
- Verify images exist in `public/` folder
- Check file permissions: `chmod 644 public/*.png`

### Database connection errors
- Verify DB credentials in `.env`
- Check if MySQL is running
- Ensure database exists: `u145912236_aalim_publicat`

### CORS errors
- Verify `FRONTEND_URL` matches your actual domain
- Check if `https://` is included

## Useful Commands

```bash
# View logs
pm2 logs aalim-fundraiser

# Restart app
pm2 restart aalim-fundraiser

# Stop app
pm2 stop aalim-fundraiser

# Monitor
pm2 monit

# Update after code changes
git pull
npm run build
cd backend && npm ci && cd ..
pm2 restart aalim-fundraiser
```

## Security Checklist

- [ ] Changed default JWT_SECRET to a strong random string
- [ ] Updated Razorpay keys to production (when ready)
- [ ] Set strong database password
- [ ] Enabled SSL/HTTPS
- [ ] Set up firewall rules
- [ ] Disabled debug mode (NODE_ENV=production)

## Support

If you encounter issues:
1. Check logs: `pm2 logs` or `tail -f logs/error.log`
2. Verify environment variables: `cat .env`
3. Test database connection manually

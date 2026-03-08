# Production Deployment Guide

## Database Configuration ✅

**Database credentials configured in:** `backend/.env`

```
DB_HOST=localhost
DB_NAME=u145912236_aalim_publicat
DB_USER=u145912236_aalim_hadiths
DB_PASSWORD=6s!C$iGD4*&&
```

## Frontend Configuration ✅

**Production API URL:** `https://donation.aalimpublications.com/api`

Configured in `.env.production`

## Build Status ✅

Frontend built successfully in `dist/` folder.

## Deployment Steps

### 1. Upload Frontend Files
Upload all files from `dist/` folder to your web root:
```
/home/u145912236/domains/aalimpublications.com/public_html/donation/
```

### 2. Upload Backend Files
Upload backend folder to a non-public location:
```
/home/u145912236/aalim-backend/
```

### 3. Configure Node.js on Server

If your hosting supports Node.js (like cPanel with Node.js Selector):

1. Go to cPanel → Node.js Selector
2. Create application with:
   - Node.js version: 18.x
   - Application root: `aalim-backend`
   - Application URL: `donation.aalimpublications.com/api`
   - Startup file: `server.js`

### 4. Setup Database

The database is already created. The setup wizard will create tables automatically when you visit:
```
https://donation.aalimpublications.com/setup
```

### 5. Configure .htaccess (if using Apache)

Create `.htaccess` in the web root:

```apache
# Redirect all requests to index.html (for React Router)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# API Proxy to Node.js backend (if backend on same server)
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]
```

### 6. Setup Wizard

Visit: **https://donation.aalimpublications.com/setup**

The wizard will guide you through:
1. Database initialization
2. Admin account creation
3. Campaign settings
4. Payment gateway setup

## Post-Setup Admin Access

After setup is complete:
- **Admin Login:** https://donation.aalimpublications.com/admin
- **Main Site:** https://donation.aalimpublications.com/

## Important Notes

1. **Razorpay Keys:** Update the test keys with live keys in `backend/.env` when ready for production
2. **JWT Secret:** Change `JWT_SECRET` to a secure random string
3. **Email:** Update SMTP settings with your email provider
4. **Webhook:** Configure Razorpay webhook URL to: `https://donation.aalimpublications.com/api/webhooks/razorpay`

## Files to Upload

### Frontend (dist/ folder):
- index.html
- assets/ (all CSS and JS files)

### Backend (backend/ folder):
- server.js
- config/
- database/
- middleware/
- routes/
- services/
- package.json
- .env (already configured with your DB credentials)

## Troubleshooting

If you get "Connection refused" errors:
- Make sure Node.js backend is running
- Check if port 5000 is allowed
- Verify database credentials

If API calls fail:
- Check browser console for CORS errors
- Verify `VITE_API_URL` is set correctly
- Ensure backend is responding at the API endpoint

# Deployment Guide

## 🏠 Local Development vs 🚀 Production

This project has **two separate environments**:

| Environment | Database | Frontend URL | Backend URL |
|-------------|----------|--------------|-------------|
| **Local** | MySQL on localhost | http://localhost:5173 | http://localhost:5000 |
| **Production** | Your server MySQL | https://donation.aalimpublications.com | https://donation.aalimpublications.com/api |

---

## 🏠 Option 1: Local Development

### Step 1: Install MySQL Locally

```bash
# macOS with Homebrew
brew install mysql
brew services start mysql

# Create local database
mysql -u root -e "CREATE DATABASE hadith_fundraiser_local;"
```

> **Don't have MySQL?** You can use [DBngin](https://dbngin.com/) (free Mac app) for easy MySQL setup.

### Step 2: Start Backend

```bash
cd backend
npm install
npm start
```

Backend will run at: http://localhost:5000

### Step 3: Start Frontend (separate terminal)

```bash
# In project root
npm install
npm run dev
```

Frontend will run at: http://localhost:5173

### Step 4: Run Setup

Visit: http://localhost:5173/setup

Create your admin account and configure the database.

---

## 🚀 Option 2: Deploy to Production

### Quick Deploy

```bash
# Run the deployment script
chmod +x deploy-production.sh
./deploy-production.sh
```

### Manual Deploy

#### 1. Configure Production Environment

```bash
# Copy production config
cp backend/.env.production backend/.env
```

#### 2. Build Frontend

```bash
npm run build
```

#### 3. Upload to Server

**Frontend files (dist/ folder):**
```
Upload to: /home/u145912236/domains/aalimpublications.com/public_html/donation/
Files:
  - dist/index.html
  - dist/assets/
```

**Backend files (backend/ folder):**
```
Upload to: /home/u145912236/aalim-backend/
Files:
  - backend/server.js
  - backend/config/
  - backend/database/
  - backend/middleware/
  - backend/routes/
  - backend/services/
  - backend/package.json
  - backend/.env (with production credentials)
```

#### 4. Start Backend on Server

Via SSH on your server:
```bash
cd /home/u145912236/aalim-backend
npm install
npm start
```

Or using PM2 (recommended):
```bash
npm install -g pm2
pm2 start server.js --name "aalim-api"
pm2 save
pm2 startup
```

#### 5. Run Setup Wizard

Visit: **https://donation.aalimpublications.com/setup**

---

## 🔧 Environment Files

### backend/.env (Local Development)
```
NODE_ENV=development
DB_HOST=localhost
DB_NAME=hadith_fundraiser_local
DB_USER=root
DB_PASSWORD=
RAZORPAY_MODE=test
...
```

### backend/.env.production (Production - Never Commit!)
```
NODE_ENV=production
DB_HOST=localhost
DB_NAME=u145912236_aalim_publicat
DB_USER=u145912236_aalim_hadiths
DB_PASSWORD=6s!C$iGD4*&&
...
```

---

## 📋 Post-Setup Checklist

After running `/setup`:

- [ ] **Admin Account Created** - Remember your email/password
- [ ] **Database Initialized** - Tables created automatically
- [ ] **Campaign Settings** - Goal amount, price per Hadith configured
- [ ] **Test Donation** - Make a test payment (use Razorpay test cards)

---

## 🔐 Security Notes

1. **Never commit `backend/.env.production`** - It's in `.gitignore`
2. **Change JWT_SECRET** in production to a random string
3. **Update Razorpay keys** to live keys when ready
4. **Enable HTTPS** on your production domain

---

## 🆘 Troubleshooting

### "Connection refused" Error
MySQL is not running. Start it:
```bash
brew services start mysql
```

### "Database does not exist" Error
Create the database:
```bash
mysql -u root -e "CREATE DATABASE hadith_fundraiser_local;"
```

### "Port already in use" Error
Kill processes on port 5000:
```bash
lsof -ti:5000 | xargs kill -9
```

### Setup Already Completed
Delete the lock file to re-run setup:
```bash
rm backend/.setup-complete
```

---

## 📞 Support

- **Setup Page:** `/setup` - Database & admin configuration
- **Admin Panel:** `/admin` - Manage donations & settings
- **API Health:** `/api/health` - Check backend status

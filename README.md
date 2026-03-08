# Aalim Hadith Fundraiser

A complete production-ready fundraising platform for Hadith sponsorship during Ramadan.

## Features

- **Beautiful Islamic UI**: Ramadan-themed design with starfield background, golden accents
- **Razorpay Integration**: Secure payment processing with test/live mode support
- **Multi-language**: English and Tamil language support
- **Donor Dashboard**: Track donations, download receipts
- **Admin Panel**: Full campaign management, donation tracking, CSV export
- **Email System**: SMTP-based email notifications with templates
- **PDF Receipts**: Automatic receipt generation
- **OTP/Magic Link Login**: Secure donor authentication

## Project Structure

```
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   │   ├── App.tsx
│   │   ├── services/api.ts
│   │   └── ...
│   └── package.json
│
├── backend/           # Node.js + Express + MySQL
│   ├── server.js
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── config/
│   └── database/schema.sql
│
└── README.md
```

## Quick Start

### 1. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE aalim_fundraiser CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Run schema
mysql -u root -p aalim_fundraiser < backend/database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
# - Database credentials
# - Razorpay test keys (for development)
# - SMTP settings

# Start server
npm start
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start development server
npm run dev
```

### 4. Installation Wizard

On first load, the setup wizard will guide you through:
- Database configuration
- Admin account creation
- Campaign settings
- Payment gateway setup
- Email configuration

## Razorpay Configuration

### Test Mode (Development)

1. Create a Razorpay account at https://razorpay.com
2. Get test keys from Dashboard → Settings → API Keys
3. Add to `.env`:
```
RAZORPAY_MODE=test
RAZORPAY_TEST_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_TEST_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### Live Mode (Production)

1. Complete KYC verification in Razorpay dashboard
2. Get live keys
3. Update `.env`:
```
RAZORPAY_MODE=live
RAZORPAY_LIVE_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_LIVE_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

## Email Configuration

### Gmail SMTP

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Note: Use an App Password, not your regular password.

## Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start backend/server.js --name "aalim-api"

# Build frontend
cd frontend && npm run build

# Serve frontend (using nginx or any static server)
```

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# Database
DB_HOST=your-db-host
DB_NAME=aalim_fundraiser
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Razorpay (LIVE KEYS)
RAZORPAY_MODE=live
RAZORPAY_LIVE_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_LIVE_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# JWT (Generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
EMAIL_FROM_NAME="Aalim Foundation"
EMAIL_FROM_EMAIL=noreply@yourdomain.com
```

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/donations/stats/public` - Public campaign stats
- `POST /api/donations` - Create donation
- `POST /api/payments/verify` - Verify payment
- `POST /api/webhooks/razorpay` - Razorpay webhook

### Donor Endpoints (Authenticated)
- `GET /api/donors/profile` - Get profile
- `GET /api/donors/donations` - Get donation history
- `GET /api/donors/dashboard` - Dashboard data

### Admin Endpoints (Admin Auth)
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/donations` - List all donations
- `GET /api/admin/donors` - List all donors
- `GET /api/admin/export/donations` - CSV export
- `PUT /api/admin/settings/campaign` - Update campaign

## Security Features

- JWT authentication
- Rate limiting on auth endpoints
- SQL injection protection (prepared statements)
- XSS protection (input sanitization)
- CSRF protection
- Helmet security headers
- Input validation

## License

MIT License - Aalim Foundation

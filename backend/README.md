# Ramadan Hadith Fundraiser - Backend API

A production-ready Node.js/Express backend for the Ramadan Hadith Fundraiser platform with Razorpay payment integration, MySQL database, email notifications, and PDF receipt generation.

## Features

- **Payment Integration**: Razorpay payment gateway (test/live modes)
- **Database**: MySQL with connection pooling and prepared statements
- **Authentication**: JWT-based auth with OTP and Magic Link login
- **Email Service**: SMTP email with HTML templates
- **PDF Receipts**: Automatic receipt generation with PDFKit
- **Admin Panel**: Full admin dashboard API with CSV export
- **Security**: Helmet, CORS, rate limiting, SQL injection protection
- **Webhooks**: Razorpay webhook handling

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Database

```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE hadith_fundraiser;"

# Import schema
mysql -u root -p hadith_fundraiser < database/schema.sql
```

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:5173` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `hadith_fundraiser` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | - |
| `RAZORPAY_KEY_ID` | Razorpay key ID | - |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | - |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook secret | - |
| `JWT_SECRET` | JWT signing secret | - |
| `SMTP_HOST` | SMTP server host | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |

## API Endpoints

### Authentication
- `POST /api/auth/otp/request` - Request OTP
- `POST /api/auth/otp/verify` - Verify OTP and login
- `POST /api/auth/magic-link/request` - Request magic link
- `POST /api/auth/magic-link/verify` - Verify magic link
- `GET /api/auth/profile` - Get donor profile
- `PUT /api/auth/profile` - Update donor profile

### Donations
- `GET /api/donations/stats` - Get public stats
- `GET /api/donations/history` - Get donor's donation history
- `GET /api/donations/:id` - Get donation details

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/status/:orderId` - Get payment status
- `POST /api/payments/retry` - Retry failed payment

### Donors
- `GET /api/donors/wall` - Get public donor wall
- `GET /api/donors/leaderboard` - Get top donors

### Admin (Protected)
- `GET /api/admin/stats` - Admin dashboard stats
- `GET /api/admin/donations` - List all donations
- `PUT /api/admin/donations/:id` - Update donation
- `GET /api/admin/export/donations` - Export to CSV
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

### Receipts
- `GET /api/receipts/:donationId` - View receipt
- `GET /api/receipts/:donationId/download` - Download receipt

### Webhooks
- `POST /api/webhooks/razorpay` - Razorpay webhook

## Database Schema

### Tables
- `donors` - Donor information
- `donations` - Donation records
- `receipts` - Generated receipts
- `admin_users` - Admin accounts
- `settings` - Application settings
- `admin_logs` - Admin action logs
- `webhook_logs` - Webhook event logs

## Razorpay Setup

1. Create account at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Get test keys from Settings > API Keys
3. Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
4. Set webhook secret in environment variables

## Email Templates

- `otp` - OTP login code
- `magic_link` - Magic login link
- `donation_confirmation` - Donation thank you email

## Security Features

- Helmet.js security headers
- CORS protection
- Rate limiting
- SQL injection protection (prepared statements)
- JWT authentication
- Password hashing with bcrypt

## License

MIT

/**
 * RAMADAN HADITH FUNDRAISER - MAIN SERVER
 * ========================================
 * Production-ready Express.js backend API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const paymentRoutes = require('./routes/payments');
const donorRoutes = require('./routes/donors');
const adminRoutes = require('./routes/admin');
const receiptRoutes = require('./routes/receipts');
const webhookRoutes = require('./routes/webhooks');
const setupRoutes = require('./routes/setup');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const { authenticateToken } = require('./middleware/auth');

// Import database and services
const db = require('./config/database');
const { initializeDefaults } = require('./services/settings');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.razorpay.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// ============================================
// RATE LIMITING
// ============================================

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for OTP/login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.OTP_RATE_LIMIT_MAX) || 5,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/otp/', authLimiter);
app.use('/api/auth/magic-link/', authLimiter);

// ============================================
// STATIC FILES
// ============================================

// Serve receipt PDFs
app.use('/receipts', express.static(path.join(__dirname, 'public', 'receipts')));

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  // Support both Hostinger structure (dist in root) and local dev structure
  const possiblePaths = [
    path.join(__dirname, '..', 'dist'),           // Local: backend/../dist
    path.join(__dirname, '..', '..', 'dist'),     // Hostinger: backend/../../dist
    path.join(process.cwd(), 'dist'),             // Current working directory
  ];
  
  let frontendBuildPath = null;
  for (const p of possiblePaths) {
    if (require('fs').existsSync(p)) {
      frontendBuildPath = p;
      console.log(`✓ Found frontend build at: ${p}`);
      break;
    }
  }
  
  if (!frontendBuildPath) {
    console.error('✗ Frontend build (dist folder) not found!');
    console.error('  Searched paths:', possiblePaths);
  } else {
    app.use(express.static(frontendBuildPath));
    
    // Handle React routing, return all requests to React app
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.url.startsWith('/api/') || req.url.startsWith('/receipts/')) {
        return next();
      }
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
  }
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Ramadan Hadith Fundraiser API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Setup/Installation routes (no auth required)
app.use('/api/setup', setupRoutes);

// Webhook routes (special handling, no auth)
app.use('/api/webhooks', webhookRoutes);

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/donations/stats', donationRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/payments', paymentRoutes);

// Protected routes (require authentication)
app.use('/api/donations/history', authenticateToken, donationRoutes);
app.use('/api/donations/:id', authenticateToken, donationRoutes);
app.use('/api/receipts', authenticateToken, receiptRoutes);

// Admin routes (protected with admin auth)
app.use('/api/admin', authenticateToken, adminRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    // Test database connection
    console.log('Connecting to database...');
    await db.testConnection();
    console.log('Database connected successfully');
    
    // Initialize settings
    console.log('Initializing settings...');
    await initializeDefaults();
    console.log('Settings initialized');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`
========================================
  RAMADAN HADITH FUNDRAISER API
========================================
  Server running on port ${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Razorpay Mode: ${process.env.RAZORPAY_MODE || 'test'}
========================================
      `);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;

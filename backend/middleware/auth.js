/**
 * AUTHENTICATION MIDDLEWARE
 * =========================
 * JWT token verification and route protection
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify JWT token and attach user to request
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      throw new AuthenticationError('Access token required');
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if it's a donor or admin token
    if (decoded.type === 'donor') {
      // Verify donor exists
      const donor = await db.queryOne(
        'SELECT id, email, name, is_verified FROM donors WHERE id = ?',
        [decoded.id]
      );
      
      if (!donor) {
        throw new AuthenticationError('Invalid token');
      }
      
      req.user = {
        id: donor.id,
        email: donor.email,
        name: donor.name,
        type: 'donor',
      };
    } else if (decoded.type === 'admin') {
      // Verify admin exists and is active
      const admin = await db.queryOne(
        'SELECT id, email, name, role FROM admin_users WHERE id = ? AND is_active = TRUE',
        [decoded.id]
      );
      
      if (!admin) {
        throw new AuthenticationError('Invalid token');
      }
      
      req.user = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        type: 'admin',
      };
    } else {
      throw new AuthenticationError('Invalid token type');
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token expired'));
    }
    next(error);
  }
}

/**
 * Require donor authentication
 */
function requireDonor(req, res, next) {
  if (!req.user || req.user.type !== 'donor') {
    return next(new AuthenticationError('Donor authentication required'));
  }
  next();
}

/**
 * Require admin authentication
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.type !== 'admin') {
    return next(new AuthenticationError('Admin authentication required'));
  }
  next();
}

/**
 * Require superadmin role
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.type !== 'admin' || req.user.role !== 'superadmin') {
    return next(new AuthorizationError('Superadmin access required'));
  }
  next();
}

/**
 * Optional authentication - attaches user if token valid, doesn't fail if not
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type === 'donor') {
      const donor = await db.queryOne(
        'SELECT id, email, name FROM donors WHERE id = ?',
        [decoded.id]
      );
      
      if (donor) {
        req.user = {
          id: donor.id,
          email: donor.email,
          name: donor.name,
          type: 'donor',
        };
      }
    }
    
    next();
  } catch (error) {
    // Silently continue without user
    next();
  }
}

/**
 * Generate JWT token for donor
 */
function generateDonorToken(donor) {
  return jwt.sign(
    {
      id: donor.id,
      email: donor.email,
      type: 'donor',
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_DONOR_EXPIRES_IN || '24h' }
  );
}

/**
 * Generate JWT token for admin
 */
function generateAdminToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin',
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Generate temporary token (for OTP/magic link verification)
 */
function generateTempToken(payload, expiresIn = '10m') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify temporary token
 */
function verifyTempToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  authenticateToken,
  requireDonor,
  requireAdmin,
  requireSuperAdmin,
  optionalAuth,
  generateDonorToken,
  generateAdminToken,
  generateTempToken,
  verifyTempToken,
  JWT_SECRET,
};

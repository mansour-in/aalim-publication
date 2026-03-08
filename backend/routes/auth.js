/**
 * AUTHENTICATION ROUTES
 * =====================
 * Donor authentication via OTP and Magic Link
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');
const { sendEmail } = require('../services/email');
const { generateTempToken, verifyTempToken, generateDonorToken } = require('../middleware/auth');
const { asyncHandler, ValidationError, AuthenticationError } = require('../middleware/errorHandler');

/**
 * Request OTP for donor login
 * POST /api/auth/otp/request
 */
router.post('/otp/request', asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError('Valid email is required');
  }
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Find or create donor
  let donor = await db.queryOne('SELECT id, name FROM donors WHERE email = ?', [email]);
  
  if (donor) {
    // Update existing donor with new OTP
    await db.query(
      'UPDATE donors SET otp_hash = ?, otp_expires_at = ? WHERE id = ?',
      [otpHash, expiresAt, donor.id]
    );
  } else {
    // Create new donor
    const result = await db.query(
      'INSERT INTO donors (email, otp_hash, otp_expires_at, is_verified) VALUES (?, ?, ?, FALSE)',
      [email, otpHash, expiresAt]
    );
    donor = { id: result.insertId, name: null };
  }
  
  // Send OTP email
  await sendEmail({
    to: email,
    template: 'otp',
    data: {
      otp,
      expiresIn: '10 minutes',
    },
  });
  
  res.json({
    success: true,
    message: 'OTP sent to your email',
    email,
  });
}));

/**
 * Verify OTP and login
 * POST /api/auth/otp/verify
 */
router.post('/otp/verify', asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    throw new ValidationError('Email and OTP are required');
  }
  
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  
  // Find donor with valid OTP
  const donor = await db.queryOne(
    `SELECT id, email, name, is_verified 
     FROM donors 
     WHERE email = ? AND otp_hash = ? AND otp_expires_at > NOW()`,
    [email, otpHash]
  );
  
  if (!donor) {
    throw new AuthenticationError('Invalid or expired OTP');
  }
  
  // Clear OTP and mark as verified
  await db.query(
    'UPDATE donors SET otp_hash = NULL, otp_expires_at = NULL, is_verified = TRUE, last_login = NOW() WHERE id = ?',
    [donor.id]
  );
  
  // Generate JWT token
  const token = generateDonorToken(donor);
  
  res.json({
    success: true,
    message: 'Login successful',
    token,
    donor: {
      id: donor.id,
      email: donor.email,
      name: donor.name,
    },
  });
}));

/**
 * Request magic link for donor login
 * POST /api/auth/magic-link/request
 */
router.post('/magic-link/request', asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError('Valid email is required');
  }
  
  // Find or create donor
  let donor = await db.queryOne('SELECT id, name FROM donors WHERE email = ?', [email]);
  
  if (!donor) {
    const result = await db.query(
      'INSERT INTO donors (email, is_verified) VALUES (?, FALSE)',
      [email]
    );
    donor = { id: result.insertId, name: null };
  }
  
  // Generate magic link token
  const token = generateTempToken({
    donorId: donor.id,
    email: donor.email,
    type: 'magic_link',
  }, '1h');
  
  const magicLink = `${process.env.FRONTEND_URL}/auth/magic-link?token=${token}`;
  
  // Send magic link email
  await sendEmail({
    to: email,
    template: 'magic_link',
    data: {
      magicLink,
      expiresIn: '1 hour',
    },
  });
  
  res.json({
    success: true,
    message: 'Magic link sent to your email',
    email,
  });
}));

/**
 * Verify magic link token
 * POST /api/auth/magic-link/verify
 */
router.post('/magic-link/verify', asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    throw new ValidationError('Token is required');
  }
  
  const decoded = verifyTempToken(token);
  
  if (!decoded || decoded.type !== 'magic_link') {
    throw new AuthenticationError('Invalid or expired magic link');
  }
  
  // Get donor
  const donor = await db.queryOne(
    'SELECT id, email, name FROM donors WHERE id = ?',
    [decoded.donorId]
  );
  
  if (!donor) {
    throw new AuthenticationError('Donor not found');
  }
  
  // Mark as verified and update last login
  await db.query(
    'UPDATE donors SET is_verified = TRUE, last_login = NOW() WHERE id = ?',
    [donor.id]
  );
  
  // Generate JWT token
  const jwtToken = generateDonorToken(donor);
  
  res.json({
    success: true,
    message: 'Login successful',
    token: jwtToken,
    donor: {
      id: donor.id,
      email: donor.email,
      name: donor.name,
    },
  });
}));

/**
 * Get current donor profile
 * GET /api/auth/profile
 */
router.get('/profile', asyncHandler(async (req, res) => {
  const donor = await db.queryOne(
    `SELECT d.id, d.email, d.name, d.phone, d.address, d.city, d.country, 
            d.is_anonymous, d.is_verified, d.created_at,
            COUNT(DISTINCT dn.id) as total_donations,
            COALESCE(SUM(dn.amount), 0) as total_amount
     FROM donors d
     LEFT JOIN donations dn ON d.id = dn.donor_id AND dn.status = 'completed'
     WHERE d.id = ?
     GROUP BY d.id`,
    [req.user.id]
  );
  
  if (!donor) {
    throw new AuthenticationError('Donor not found');
  }
  
  res.json({
    success: true,
    donor: {
      id: donor.id,
      email: donor.email,
      name: donor.name,
      phone: donor.phone,
      address: donor.address,
      city: donor.city,
      country: donor.country,
      isAnonymous: donor.is_anonymous === 1,
      isVerified: donor.is_verified === 1,
      createdAt: donor.created_at,
      totalDonations: donor.total_donations,
      totalAmount: donor.total_amount,
    },
  });
}));

/**
 * Update donor profile
 * PUT /api/auth/profile
 */
router.put('/profile', asyncHandler(async (req, res) => {
  const { name, phone, address, city, country, isAnonymous } = req.body;
  
  await db.query(
    `UPDATE donors 
     SET name = ?, phone = ?, address = ?, city = ?, country = ?, is_anonymous = ?
     WHERE id = ?`,
    [name, phone, address, city, country, isAnonymous ? 1 : 0, req.user.id]
  );
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
  });
}));

module.exports = router;

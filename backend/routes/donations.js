/**
 * DONATIONS ROUTES
 * ================
 * Donation management and history
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

/**
 * Get donation statistics
 * GET /api/donations/stats
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await db.queryOne(`
    SELECT 
      COUNT(*) as total_donations,
      COALESCE(SUM(amount), 0) as total_raised,
      COUNT(DISTINCT donor_id) as total_donors,
      COALESCE(SUM(hadith_count), 0) as hadiths_sponsored
    FROM donations 
    WHERE status = 'completed'
  `);
  
  // Get goal from settings
  const goalSetting = await db.queryOne(
    "SELECT value FROM settings WHERE key_name = 'fundraising_goal'"
  );
  const goal = goalSetting ? parseFloat(goalSetting.value) : 500000;
  
  // Get recent donations (last 10)
  const recentDonations = await db.query(`
    SELECT 
      d.id,
      d.amount,
      d.hadith_count,
      d.status,
      d.created_at,
      dn.name as donor_name,
      dn.is_anonymous
    FROM donations d
    LEFT JOIN donors dn ON d.donor_id = dn.id
    WHERE d.status = 'completed'
    ORDER BY d.created_at DESC
    LIMIT 10
  `);
  
  res.json({
    success: true,
    stats: {
      totalDonations: stats.total_donations,
      totalRaised: stats.total_raised,
      totalDonors: stats.total_donors,
      hadithsSponsored: stats.hadiths_sponsored,
      goal: goal,
      progress: Math.min(100, (stats.total_raised / goal) * 100),
    },
    recentDonations: recentDonations.map(d => ({
      id: d.id,
      amount: d.amount,
      hadithCount: d.hadith_count,
      donorName: d.is_anonymous ? 'Anonymous' : (d.donor_name || 'Anonymous'),
      createdAt: d.created_at,
    })),
  });
}));

/**
 * Get donor's donation history
 * GET /api/donations/history
 */
router.get('/history', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  const donations = await db.query(`
    SELECT 
      d.id,
      d.amount,
      d.hadith_count,
      d.status,
      d.payment_method,
      d.created_at,
      d.completed_at,
      r.receipt_number,
      r.file_path as receipt_url
    FROM donations d
    LEFT JOIN receipts r ON d.id = r.donation_id
    WHERE d.donor_id = ?
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `, [req.user.id, parseInt(limit), parseInt(offset)]);
  
  const total = await db.queryOne(
    'SELECT COUNT(*) as count FROM donations WHERE donor_id = ?',
    [req.user.id]
  );
  
  res.json({
    success: true,
    donations: donations.map(d => ({
      id: d.id,
      amount: d.amount,
      hadithCount: d.hadith_count,
      status: d.status,
      paymentMethod: d.payment_method,
      createdAt: d.created_at,
      completedAt: d.completed_at,
      receiptNumber: d.receipt_number,
      receiptUrl: d.receipt_url,
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total.count,
      totalPages: Math.ceil(total.count / limit),
    },
  });
}));

/**
 * Get donation details by ID
 * GET /api/donations/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const donation = await db.queryOne(`
    SELECT 
      d.*,
      dn.name as donor_name,
      dn.email as donor_email,
      dn.phone as donor_phone,
      dn.address,
      dn.city,
      dn.country,
      dn.is_anonymous,
      r.receipt_number,
      r.file_path as receipt_url,
      r.generated_at as receipt_generated_at
    FROM donations d
    LEFT JOIN donors dn ON d.donor_id = dn.id
    LEFT JOIN receipts r ON d.id = r.donation_id
    WHERE d.id = ? AND d.donor_id = ?
  `, [id, req.user.id]);
  
  if (!donation) {
    throw new NotFoundError('Donation not found');
  }
  
  res.json({
    success: true,
    donation: {
      id: donation.id,
      amount: donation.amount,
      hadithCount: donation.hadith_count,
      status: donation.status,
      paymentMethod: donation.payment_method,
      razorpayOrderId: donation.razorpay_order_id,
      razorpayPaymentId: donation.razorpay_payment_id,
      donorName: donation.is_anonymous ? 'Anonymous' : donation.donor_name,
      donorEmail: donation.donor_email,
      donorPhone: donation.donor_phone,
      address: donation.address,
      city: donation.city,
      country: donation.country,
      message: donation.message,
      createdAt: donation.created_at,
      completedAt: donation.completed_at,
      receiptNumber: donation.receipt_number,
      receiptUrl: donation.receipt_url,
      receiptGeneratedAt: donation.receipt_generated_at,
    },
  });
}));

module.exports = router;

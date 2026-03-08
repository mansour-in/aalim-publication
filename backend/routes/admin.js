/**
 * ADMIN ROUTES
 * ============
 * Admin panel API for managing donations and settings
 */

const express = require('express');
const router = express.Router();
const { Parser } = require('@json2csv/plainjs');
const db = require('../config/database');
const { requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

// Apply admin authentication to all routes
router.use(requireAdmin);

/**
 * Get admin dashboard stats
 * GET /api/admin/dashboard
 * GET /api/admin/stats (alias)
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7); // YYYY-MM
  
  const stats = await db.queryOne(`
    SELECT 
      COUNT(*) as total_donations,
      COALESCE(SUM(amount), 0) as total_raised,
      COUNT(DISTINCT donor_id) as total_donors,
      COALESCE(SUM(hadith_count), 0) as hadiths_sponsored,
      COALESCE(SUM(CASE WHEN DATE(completed_at) = ? THEN amount ELSE 0 END), 0) as today_raised,
      COALESCE(SUM(CASE WHEN DATE_FORMAT(completed_at, '%Y-%m') = ? THEN amount ELSE 0 END), 0) as month_raised
    FROM donations 
    WHERE status = 'completed'
  `, [today, thisMonth]);
  
  const pending = await db.queryOne(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
    FROM donations WHERE status = 'pending'
  `);
  
  const failed = await db.queryOne(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
    FROM donations WHERE status = 'failed'
  `);
  
  // Get recent donations
  const recentDonations = await db.query(`
    SELECT 
      d.id,
      d.amount,
      d.hadith_count,
      d.status,
      d.created_at,
      dn.name as donor_name,
      dn.email as donor_email,
      dn.is_anonymous
    FROM donations d
    LEFT JOIN donors dn ON d.donor_id = dn.id
    ORDER BY d.created_at DESC
    LIMIT 10
  `);
  
  res.json({
    success: true,
    data: {
      totalDonations: stats.total_donations,
      totalRaised: stats.total_raised,
      totalDonors: stats.total_donors,
      hadithsSponsored: stats.hadiths_sponsored,
      todayRaised: stats.today_raised,
      monthRaised: stats.month_raised,
      pendingCount: pending.count,
      pendingAmount: pending.amount,
      failedCount: failed.count,
      failedAmount: failed.amount,
      recentDonations: recentDonations.map(d => ({
        id: d.id,
        amount: d.amount,
        hadithCount: d.hadith_count,
        status: d.status,
        createdAt: d.created_at,
        donorName: d.is_anonymous ? 'Anonymous' : (d.donor_name || 'Anonymous'),
        donorEmail: d.donor_email,
      })),
    },
  });
}));

/**
 * Get admin stats (alias for dashboard)
 * GET /api/admin/stats
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7); // YYYY-MM
  
  const stats = await db.queryOne(`
    SELECT 
      COUNT(*) as total_donations,
      COALESCE(SUM(amount), 0) as total_raised,
      COUNT(DISTINCT donor_id) as total_donors,
      COALESCE(SUM(hadith_count), 0) as hadiths_sponsored,
      COALESCE(SUM(CASE WHEN DATE(completed_at) = ? THEN amount ELSE 0 END), 0) as today_raised,
      COALESCE(SUM(CASE WHEN DATE_FORMAT(completed_at, '%Y-%m') = ? THEN amount ELSE 0 END), 0) as month_raised
    FROM donations 
    WHERE status = 'completed'
  `, [today, thisMonth]);
  
  const pending = await db.queryOne(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
    FROM donations WHERE status = 'pending'
  `);
  
  const failed = await db.queryOne(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
    FROM donations WHERE status = 'failed'
  `);
  
  res.json({
    success: true,
    stats: {
      totalDonations: stats.total_donations,
      totalRaised: stats.total_raised,
      totalDonors: stats.total_donors,
      hadithsSponsored: stats.hadiths_sponsored,
      todayRaised: stats.today_raised,
      monthRaised: stats.month_raised,
      pendingCount: pending.count,
      pendingAmount: pending.amount,
      failedCount: failed.count,
      failedAmount: failed.amount,
    },
  });
}));

/**
 * Get all donations with filters
 * GET /api/admin/donations
 */
router.get('/donations', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    search,
    startDate,
    endDate,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;
  
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = 'WHERE 1=1';
  
  if (status) {
    whereClause += ' AND d.status = ?';
    params.push(status);
  }
  
  if (startDate) {
    whereClause += ' AND DATE(d.created_at) >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    whereClause += ' AND DATE(d.created_at) <= ?';
    params.push(endDate);
  }
  
  if (search) {
    whereClause += ' AND (dn.name LIKE ? OR dn.email LIKE ? OR d.razorpay_order_id LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  const donations = await db.query(`
    SELECT 
      d.id,
      d.amount,
      d.hadith_count,
      d.status,
      d.payment_method,
      d.razorpay_order_id,
      d.razorpay_payment_id,
      d.created_at,
      d.completed_at,
      dn.id as donor_id,
      dn.name as donor_name,
      dn.email as donor_email,
      dn.phone as donor_phone,
      dn.is_anonymous,
      r.receipt_number
    FROM donations d
    LEFT JOIN donors dn ON d.donor_id = dn.id
    LEFT JOIN receipts r ON d.id = r.donation_id
    ${whereClause}
    ORDER BY d.${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `, [...params, parseInt(limit), parseInt(offset)]);
  
  const total = await db.queryOne(
    `SELECT COUNT(*) as count FROM donations d LEFT JOIN donors dn ON d.donor_id = dn.id ${whereClause}`,
    params
  );
  
  res.json({
    success: true,
    donations: donations.map(d => ({
      id: d.id,
      amount: d.amount,
      hadithCount: d.hadith_count,
      status: d.status,
      paymentMethod: d.payment_method,
      razorpayOrderId: d.razorpay_order_id,
      razorpayPaymentId: d.razorpay_payment_id,
      createdAt: d.created_at,
      completedAt: d.completed_at,
      donor: {
        id: d.donor_id,
        name: d.is_anonymous ? 'Anonymous' : d.donor_name,
        email: d.donor_email,
        phone: d.donor_phone,
      },
      receiptNumber: d.receipt_number,
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
 * Update donation status (manual override)
 * PUT /api/admin/donations/:id
 */
router.put('/donations/:id', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  if (!status || !['pending', 'completed', 'failed', 'refunded'].includes(status)) {
    throw new ValidationError('Valid status is required');
  }
  
  const donation = await db.queryOne('SELECT * FROM donations WHERE id = ?', [id]);
  
  if (!donation) {
    throw new NotFoundError('Donation not found');
  }
  
  await db.query(
    'UPDATE donations SET status = ?, admin_notes = ? WHERE id = ?',
    [status, notes || null, id]
  );
  
  // Log admin action
  await db.query(
    'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
    [req.user.id, 'update_donation', JSON.stringify({ donationId: id, newStatus: status }), req.ip]
  );
  
  res.json({
    success: true,
    message: 'Donation updated successfully',
  });
}));

/**
 * Export donations to CSV
 * GET /api/admin/export/donations
 */
router.get('/export/donations', asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query;
  
  const params = [];
  let whereClause = 'WHERE 1=1';
  
  if (status) {
    whereClause += ' AND d.status = ?';
    params.push(status);
  }
  
  if (startDate) {
    whereClause += ' AND DATE(d.created_at) >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    whereClause += ' AND DATE(d.created_at) <= ?';
    params.push(endDate);
  }
  
  const donations = await db.query(`
    SELECT 
      d.id,
      d.amount,
      d.hadith_count,
      d.status,
      d.razorpay_payment_id,
      d.created_at,
      d.completed_at,
      dn.name as donor_name,
      dn.email as donor_email,
      dn.phone as donor_phone,
      dn.address,
      dn.city,
      dn.country
    FROM donations d
    LEFT JOIN donors dn ON d.donor_id = dn.id
    ${whereClause}
    ORDER BY d.created_at DESC
  `, params);
  
  const fields = [
    { label: 'ID', value: 'id' },
    { label: 'Donor Name', value: 'donor_name' },
    { label: 'Email', value: 'donor_email' },
    { label: 'Phone', value: 'donor_phone' },
    { label: 'Amount', value: 'amount' },
    { label: 'Hadith Count', value: 'hadith_count' },
    { label: 'Status', value: 'status' },
    { label: 'Payment ID', value: 'razorpay_payment_id' },
    { label: 'Address', value: 'address' },
    { label: 'City', value: 'city' },
    { label: 'Country', value: 'country' },
    { label: 'Created At', value: 'created_at' },
    { label: 'Completed At', value: 'completed_at' },
  ];
  
  const parser = new Parser({ fields });
  const csv = parser.parse(donations);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=donations-${Date.now()}.csv`);
  res.send(csv);
}));

/**
 * Get admin settings
 * GET /api/admin/settings
 */
router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await db.query('SELECT key_name, value, description FROM settings');
  
  const settingsObj = {};
  settings.forEach(s => {
    settingsObj[s.key_name] = s.value;
  });
  
  res.json({
    success: true,
    settings: settingsObj,
  });
}));

/**
 * Update admin settings
 * PUT /api/admin/settings
 */
router.put('/settings', requireSuperAdmin, asyncHandler(async (req, res) => {
  const updates = req.body;
  
  for (const [key, value] of Object.entries(updates)) {
    await db.query(
      'INSERT INTO settings (key_name, value, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?, updated_by = ?',
      [key, value, req.user.id, value, req.user.id]
    );
  }
  
  res.json({
    success: true,
    message: 'Settings updated successfully',
  });
}));

/**
 * Get admin users
 * GET /api/admin/users
 */
router.get('/users', requireSuperAdmin, asyncHandler(async (req, res) => {
  const users = await db.query(
    'SELECT id, email, name, role, is_active, last_login, created_at FROM admin_users'
  );
  
  res.json({
    success: true,
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.is_active === 1,
      lastLogin: u.last_login,
      createdAt: u.created_at,
    })),
  });
}));

module.exports = router;

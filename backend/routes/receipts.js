/**
 * RECEIPTS ROUTES
 * ===============
 * Receipt generation and download
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { generateReceipt } = require('../services/receipt');
const { asyncHandler, NotFoundError, AuthorizationError } = require('../middleware/errorHandler');

/**
 * Get receipt by donation ID
 * GET /api/receipts/:donationId
 */
router.get('/:donationId', asyncHandler(async (req, res) => {
  const { donationId } = req.params;
  
  // Check if user owns this donation
  const donation = await db.queryOne(`
    SELECT d.*, dn.email as donor_email
    FROM donations d
    JOIN donors dn ON d.donor_id = dn.id
    WHERE d.id = ?
  `, [donationId]);
  
  if (!donation) {
    throw new NotFoundError('Donation not found');
  }
  
  // Verify ownership (donor can only see their own receipts)
  if (req.user.type === 'donor' && donation.donor_id !== req.user.id) {
    throw new AuthorizationError('Access denied');
  }
  
  if (donation.status !== 'completed') {
    throw new NotFoundError('Receipt not available for pending donations');
  }
  
  // Check if receipt exists
  let receipt = await db.queryOne(
    'SELECT * FROM receipts WHERE donation_id = ?',
    [donationId]
  );
  
  // Generate receipt if not exists
  if (!receipt) {
    const donor = await db.queryOne('SELECT * FROM donors WHERE id = ?', [donation.donor_id]);
    receipt = await generateReceipt(donation, donor);
  }
  
  // Check if file exists
  if (!fs.existsSync(receipt.file_path)) {
    // Regenerate receipt
    const donor = await db.queryOne('SELECT * FROM donors WHERE id = ?', [donation.donor_id]);
    receipt = await generateReceipt(donation, donor);
  }
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="receipt-${receipt.receipt_number}.pdf"`);
  res.sendFile(path.resolve(receipt.file_path));
}));

/**
 * Download receipt
 * GET /api/receipts/:donationId/download
 */
router.get('/:donationId/download', asyncHandler(async (req, res) => {
  const { donationId } = req.params;
  
  const donation = await db.queryOne(`
    SELECT d.*, dn.email as donor_email
    FROM donations d
    JOIN donors dn ON d.donor_id = dn.id
    WHERE d.id = ?
  `, [donationId]);
  
  if (!donation) {
    throw new NotFoundError('Donation not found');
  }
  
  if (req.user.type === 'donor' && donation.donor_id !== req.user.id) {
    throw new AuthorizationError('Access denied');
  }
  
  if (donation.status !== 'completed') {
    throw new NotFoundError('Receipt not available');
  }
  
  let receipt = await db.queryOne(
    'SELECT * FROM receipts WHERE donation_id = ?',
    [donationId]
  );
  
  if (!receipt) {
    const donor = await db.queryOne('SELECT * FROM donors WHERE id = ?', [donation.donor_id]);
    receipt = await generateReceipt(donation, donor);
  }
  
  if (!fs.existsSync(receipt.file_path)) {
    const donor = await db.queryOne('SELECT * FROM donors WHERE id = ?', [donation.donor_id]);
    receipt = await generateReceipt(donation, donor);
  }
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt.receipt_number}.pdf"`);
  res.sendFile(path.resolve(receipt.file_path));
}));

/**
 * Regenerate receipt (admin only)
 * POST /api/receipts/:donationId/regenerate
 */
router.post('/:donationId/regenerate', asyncHandler(async (req, res) => {
  const { donationId } = req.params;
  
  // Only admins can regenerate
  if (req.user.type !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }
  
  const donation = await db.queryOne(
    'SELECT * FROM donations WHERE id = ?',
    [donationId]
  );
  
  if (!donation) {
    throw new NotFoundError('Donation not found');
  }
  
  const donor = await db.queryOne('SELECT * FROM donors WHERE id = ?', [donation.donor_id]);
  
  // Delete old receipt file if exists
  const oldReceipt = await db.queryOne(
    'SELECT file_path FROM receipts WHERE donation_id = ?',
    [donationId]
  );
  
  if (oldReceipt && fs.existsSync(oldReceipt.file_path)) {
    fs.unlinkSync(oldReceipt.file_path);
  }
  
  // Delete old receipt record
  await db.query('DELETE FROM receipts WHERE donation_id = ?', [donationId]);
  
  // Generate new receipt
  const receipt = await generateReceipt(donation, donor);
  
  res.json({
    success: true,
    message: 'Receipt regenerated successfully',
    receipt: {
      number: receipt.receiptNumber,
      url: receipt.url,
    },
  });
}));

module.exports = router;

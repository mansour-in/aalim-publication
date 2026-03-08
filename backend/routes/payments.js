/**
 * PAYMENTS ROUTES
 * ===============
 * Razorpay payment integration
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');
const razorpay = require('../services/razorpay');
const { generateReceipt } = require('../services/receipt');
const { sendEmail } = require('../services/email');
const { asyncHandler, ValidationError, NotFoundError, PaymentError } = require('../middleware/errorHandler');

// Price per Hadith in INR
const PRICE_PER_HADITH = 500;

/**
 * Create Razorpay order
 * POST /api/payments/create-order
 */
router.post('/create-order', asyncHandler(async (req, res) => {
  const { hadithCount, donorInfo } = req.body;
  
  if (!hadithCount || hadithCount < 1 || hadithCount > 1000) {
    throw new ValidationError('Hadith count must be between 1 and 1000');
  }
  
  if (!donorInfo || !donorInfo.email) {
    throw new ValidationError('Donor email is required');
  }
  
  const amount = hadithCount * PRICE_PER_HADITH;
  
  // Find or create donor
  let donor = await db.queryOne('SELECT id FROM donors WHERE email = ?', [donorInfo.email]);
  
  if (donor) {
    // Update donor info
    await db.query(
      `UPDATE donors 
       SET name = ?, phone = ?, address = ?, city = ?, country = ?, is_anonymous = ?
       WHERE id = ?`,
      [
        donorInfo.name,
        donorInfo.phone,
        donorInfo.address,
        donorInfo.city,
        donorInfo.country,
        donorInfo.isAnonymous ? 1 : 0,
        donor.id,
      ]
    );
  } else {
    // Create new donor
    const result = await db.query(
      `INSERT INTO donors (email, name, phone, address, city, country, is_anonymous, is_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        donorInfo.email,
        donorInfo.name,
        donorInfo.phone,
        donorInfo.address,
        donorInfo.city,
        donorInfo.country,
        donorInfo.isAnonymous ? 1 : 0,
      ]
    );
    donor = { id: result.insertId };
  }
  
  // Create Razorpay order
  const order = await razorpay.createOrder(amount, 'INR', {
    donorId: donor.id,
    hadithCount,
  });
  
  // Create donation record
  const donationResult = await db.query(
    `INSERT INTO donations 
     (donor_id, amount, hadith_count, razorpay_order_id, status, message) 
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    [donor.id, amount, hadithCount, order.id, donorInfo.message || null]
  );
  
  res.json({
    success: true,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    },
    donationId: donationResult.insertId,
    keyId: process.env.RAZORPAY_KEY_ID,
    prefill: {
      name: donorInfo.name || '',
      email: donorInfo.email || '',
      contact: donorInfo.phone || '',
    },
  });
}));

/**
 * Verify payment and update donation
 * POST /api/payments/verify
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ValidationError('Payment verification details are required');
  }
  
  // Verify signature
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  
  if (expectedSignature !== razorpaySignature) {
    throw new PaymentError('Invalid payment signature');
  }
  
  // Get donation
  const donation = await db.queryOne(
    'SELECT * FROM donations WHERE razorpay_order_id = ?',
    [razorpayOrderId]
  );
  
  if (!donation) {
    throw new NotFoundError('Donation not found');
  }
  
  if (donation.status === 'completed') {
    return res.json({
      success: true,
      message: 'Payment already verified',
      donationId: donation.id,
    });
  }
  
  // Update donation status
  await db.query(
    `UPDATE donations 
     SET status = 'completed', 
         razorpay_payment_id = ?, 
         completed_at = NOW(),
         payment_method = 'razorpay'
     WHERE id = ?`,
    [razorpayPaymentId, donation.id]
  );
  
  // Get donor info
  const donor = await db.queryOne(
    'SELECT * FROM donors WHERE id = ?',
    [donation.donor_id]
  );
  
  // Generate receipt
  const receipt = await generateReceipt(donation, donor);
  
  // Send confirmation email
  await sendEmail({
    to: donor.email,
    template: 'donation_confirmation',
    data: {
      donorName: donor.name || 'Valued Donor',
      amount: donation.amount,
      hadithCount: donation.hadith_count,
      paymentId: razorpayPaymentId,
      receiptUrl: receipt.url,
    },
    attachments: receipt.filePath ? [{
      filename: `receipt-${receipt.receiptNumber}.pdf`,
      path: receipt.filePath,
    }] : [],
  });
  
  res.json({
    success: true,
    message: 'Payment verified successfully',
    donationId: donation.id,
    receiptNumber: receipt.receiptNumber,
  });
}));

/**
 * Get payment status
 * GET /api/payments/status/:orderId
 */
router.get('/status/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  const donation = await db.queryOne(
    `SELECT d.*, r.receipt_number, r.file_path as receipt_url
     FROM donations d
     LEFT JOIN receipts r ON d.id = r.donation_id
     WHERE d.razorpay_order_id = ?`,
    [orderId]
  );
  
  if (!donation) {
    throw new NotFoundError('Payment not found');
  }
  
  res.json({
    success: true,
    status: donation.status,
    donationId: donation.id,
    amount: donation.amount,
    hadithCount: donation.hadith_count,
    receiptNumber: donation.receipt_number,
    receiptUrl: donation.receipt_url,
  });
}));

/**
 * Handle payment failure/retry
 * POST /api/payments/retry
 */
router.post('/retry', asyncHandler(async (req, res) => {
  const { donationId } = req.body;
  
  const donation = await db.queryOne(
    'SELECT * FROM donations WHERE id = ?',
    [donationId]
  );
  
  if (!donation) {
    throw new NotFoundError('Donation not found');
  }
  
  if (donation.status === 'completed') {
    throw new ValidationError('Payment already completed');
  }
  
  // Create new Razorpay order
  const order = await razorpay.createOrder(donation.amount, 'INR', {
    donorId: donation.donor_id,
    hadithCount: donation.hadith_count,
    retry: true,
  });
  
  // Update donation with new order ID
  await db.query(
    'UPDATE donations SET razorpay_order_id = ? WHERE id = ?',
    [order.id, donation.id]
  );
  
  res.json({
    success: true,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    },
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}));

module.exports = router;

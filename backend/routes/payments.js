/**
 * PAYMENTS ROUTES
 * ===============
 * Razorpay payment integration with fee coverage and PAN support
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');
const razorpay = require('../services/razorpay');
const { generateReceipt } = require('../services/receipt');
const { sendEmail } = require('../services/email');
const { asyncHandler, ValidationError, NotFoundError, PaymentError } = require('../middleware/errorHandler');
const logger = require('../services/logger');

/**
 * Get price per hadith from settings
 */
async function getPricePerHadith() {
  const setting = await db.queryOne(
    "SELECT value FROM settings WHERE key_name = 'price_per_hadith'"
  );
  return setting ? parseFloat(setting.value) : 500;
}

/**
 * Get fee percentage from settings
 */
async function getFeePercentage() {
  const setting = await db.queryOne(
    "SELECT value FROM settings WHERE key_name = 'fee_percentage'"
  );
  return setting ? parseFloat(setting.value) : 2.5;
}

/**
 * Check if fee coverage is enabled
 */
async function isFeeCoverageEnabled() {
  const setting = await db.queryOne(
    "SELECT value FROM settings WHERE key_name = 'enable_fee_coverage'"
  );
  return setting ? setting.value === 'true' : true;
}

/**
 * Check if PAN field is enabled
 */
async function isPanFieldEnabled() {
  const setting = await db.queryOne(
    "SELECT value FROM settings WHERE key_name = 'enable_pan_field'"
  );
  return setting ? setting.value === 'true' : false;
}

/**
 * Check if PAN is required
 */
async function isPanRequired() {
  const setting = await db.queryOne(
    "SELECT value FROM settings WHERE key_name = 'pan_required'"
  );
  return setting ? setting.value === 'true' : false;
}

/**
 * Calculate amounts with optional fee coverage
 */
async function calculateAmounts(baseAmount, coverFee) {
  const feePercentage = await getFeePercentage();
  
  if (coverFee) {
    // Fee is added on top: total = base + (base * fee%)
    const feeAmount = Math.round(baseAmount * (feePercentage / 100));
    return {
      baseAmount,
      feeAmount,
      totalAmount: baseAmount + feeAmount,
      feePercentage,
      feeCovered: true,
    };
  } else {
    // No fee coverage
    return {
      baseAmount,
      feeAmount: 0,
      totalAmount: baseAmount,
      feePercentage: 0,
      feeCovered: false,
    };
  }
}

/**
 * Create Razorpay order
 * POST /api/payments/create-order
 */
router.post('/create-order', asyncHandler(async (req, res) => {
  const { hadithCount, donorInfo, coverFee = false } = req.body;
  
  logger.info('Creating payment order', { 
    hadithCount, 
    email: donorInfo?.email,
    coverFee,
    category: 'payment' 
  });
  
  if (!hadithCount || hadithCount < 1 || hadithCount > 1000) {
    throw new ValidationError('Hadith count must be between 1 and 1000');
  }
  
  if (!donorInfo || !donorInfo.email) {
    throw new ValidationError('Donor email is required');
  }
  
  // Validate PAN if enabled and required
  const panEnabled = await isPanFieldEnabled();
  const panRequired = await isPanRequired();
  
  if (panEnabled && panRequired && !donorInfo.panNumber) {
    throw new ValidationError('PAN number is required for donations');
  }
  
  if (donorInfo.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(donorInfo.panNumber.toUpperCase())) {
    throw new ValidationError('Invalid PAN number format');
  }
  
  const pricePerHadith = await getPricePerHadith();
  const baseAmount = hadithCount * pricePerHadith;
  
  // Calculate amounts with fee
  const amounts = await calculateAmounts(baseAmount, coverFee);
  
  // Find or create donor
  let donor = await db.queryOne('SELECT id, pan_number FROM donors WHERE email = ?', [donorInfo.email]);
  
  if (donor) {
    // Update donor info
    await db.query(
      `UPDATE donors 
       SET name = ?, phone = ?, address = ?, city = ?, country = ?, is_anonymous = ?, pan_number = COALESCE(?, pan_number)
       WHERE id = ?`,
      [
        donorInfo.name,
        donorInfo.phone,
        donorInfo.address,
        donorInfo.city,
        donorInfo.country,
        donorInfo.isAnonymous ? 1 : 0,
        donorInfo.panNumber ? donorInfo.panNumber.toUpperCase() : null,
        donor.id,
      ]
    );
  } else {
    // Create new donor
    const result = await db.query(
      `INSERT INTO donors (email, name, phone, address, city, country, pan_number, is_anonymous, is_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        donorInfo.email,
        donorInfo.name,
        donorInfo.phone,
        donorInfo.address,
        donorInfo.city,
        donorInfo.country,
        donorInfo.panNumber ? donorInfo.panNumber.toUpperCase() : null,
        donorInfo.isAnonymous ? 1 : 0,
      ]
    );
    donor = { id: result.insertId };
  }
  
  // Create Razorpay order with total amount
  const order = await razorpay.createOrder(amounts.totalAmount, 'INR', {
    donorId: donor.id,
    hadithCount,
    baseAmount: amounts.baseAmount,
    feeAmount: amounts.feeAmount,
  });
  
  // Create donation record with fee breakdown
  const donationResult = await db.query(
    `INSERT INTO donations 
     (donor_id, amount, base_amount, fee_amount, fee_percentage, fee_covered, hadith_count, razorpay_order_id, status, message, pan_number) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      donor.id, 
      amounts.totalAmount, 
      amounts.baseAmount,
      amounts.feeAmount,
      amounts.feePercentage,
      amounts.feeCovered ? 1 : 0,
      hadithCount, 
      order.id, 
      donorInfo.message || null,
      donorInfo.panNumber ? donorInfo.panNumber.toUpperCase() : null,
    ]
  );
  
  logger.info('Payment order created', { 
    orderId: order.id, 
    donationId: donationResult.insertId,
    totalAmount: amounts.totalAmount,
    category: 'payment' 
  });
  
  res.json({
    success: true,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    },
    amounts: {
      baseAmount: amounts.baseAmount,
      feeAmount: amounts.feeAmount,
      totalAmount: amounts.totalAmount,
      feePercentage: amounts.feePercentage,
      feeCovered: amounts.feeCovered,
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
  
  logger.info('Verifying payment', { orderId: razorpayOrderId, category: 'payment' });
  
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
    logger.error('Invalid payment signature', { orderId: razorpayOrderId, category: 'payment' });
    throw new PaymentError('Invalid payment signature');
  }
  
  // Get donation
  const donation = await db.queryOne(
    'SELECT * FROM donations WHERE razorpay_order_id = ?',
    [razorpayOrderId]
  );
  
  if (!donation) {
    logger.error('Donation not found for verification', { orderId: razorpayOrderId, category: 'payment' });
    throw new NotFoundError('Donation not found');
  }
  
  if (donation.status === 'completed') {
    logger.info('Payment already verified', { donationId: donation.id, category: 'payment' });
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
  
  // Get thank you message from settings
  const thankYouSetting = await db.queryOne(
    "SELECT value FROM settings WHERE key_name = 'thank_you_message'"
  );
  const thankYouMessage = thankYouSetting?.value || 'Thank you for your generous donation! May Allah accept it.';
  
  // Generate receipt
  const receipt = await generateReceipt(donation, donor);
  
  // Send confirmation email
  await sendEmail({
    to: donor.email,
    template: 'donation_confirmation',
    data: {
      donorName: donor.name || 'Valued Donor',
      amount: donation.amount,
      baseAmount: donation.base_amount,
      feeAmount: donation.fee_amount,
      feeCovered: donation.fee_covered === 1,
      hadithCount: donation.hadith_count,
      paymentId: razorpayPaymentId,
      receiptUrl: receipt.url,
      thankYouMessage,
    },
    attachments: receipt.filePath ? [{
      filename: `receipt-${receipt.receiptNumber}.pdf`,
      path: receipt.filePath,
    }] : [],
  });
  
  logger.info('Payment verified successfully', { 
    donationId: donation.id, 
    receiptNumber: receipt.receiptNumber,
    category: 'payment' 
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
    baseAmount: donation.base_amount,
    feeAmount: donation.fee_amount,
    feeCovered: donation.fee_covered === 1,
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
  
  logger.info('Retrying payment', { donationId, category: 'payment' });
  
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
  
  logger.info('Payment retry order created', { 
    donationId, 
    newOrderId: order.id,
    category: 'payment' 
  });
  
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

/**
 * Get payment configuration (for frontend)
 * GET /api/payments/config
 */
router.get('/config', asyncHandler(async (req, res) => {
  const [priceSetting, feeEnabledSetting, feePercentageSetting, feeLabelSetting, panEnabledSetting, panRequiredSetting] = await Promise.all([
    db.queryOne("SELECT value FROM settings WHERE key_name = 'price_per_hadith'"),
    db.queryOne("SELECT value FROM settings WHERE key_name = 'enable_fee_coverage'"),
    db.queryOne("SELECT value FROM settings WHERE key_name = 'fee_percentage'"),
    db.queryOne("SELECT value FROM settings WHERE key_name = 'fee_coverage_label'"),
    db.queryOne("SELECT value FROM settings WHERE key_name = 'enable_pan_field'"),
    db.queryOne("SELECT value FROM settings WHERE key_name = 'pan_required'"),
  ]);
  
  res.json({
    success: true,
    config: {
      pricePerHadith: priceSetting ? parseFloat(priceSetting.value) : 500,
      feeCoverageEnabled: feeEnabledSetting ? feeEnabledSetting.value === 'true' : true,
      feePercentage: feePercentageSetting ? parseFloat(feePercentageSetting.value) : 2.5,
      feeCoverageLabel: feeLabelSetting?.value || 'I would like to cover the 2.5% payment processing fee',
      panEnabled: panEnabledSetting ? panEnabledSetting.value === 'true' : false,
      panRequired: panRequiredSetting ? panRequiredSetting.value === 'true' : false,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    },
  });
}));

module.exports = router;

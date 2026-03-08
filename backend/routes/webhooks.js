/**
 * WEBHOOKS ROUTES
 * ===============
 * Razorpay webhook handlers
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');
const { generateReceipt } = require('../services/receipt');
const { sendEmail } = require('../services/email');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(body, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

/**
 * Razorpay webhook handler
 * POST /api/webhooks/razorpay
 */
router.post('/razorpay', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  
  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' });
  }
  
  // Verify webhook signature
  const isValid = verifyWebhookSignature(
    req.body,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  const event = JSON.parse(req.body);
  
  // Log webhook
  await db.query(
    'INSERT INTO webhook_logs (event_type, payload) VALUES (?, ?)',
    [event.event, JSON.stringify(event)]
  );
  
  switch (event.event) {
    case 'payment.captured':
      await handlePaymentCaptured(event.payload.payment.entity);
      break;
      
    case 'payment.failed':
      await handlePaymentFailed(event.payload.payment.entity);
      break;
      
    case 'order.paid':
      await handleOrderPaid(event.payload.order.entity);
      break;
      
    default:
      console.log(`Unhandled webhook event: ${event.event}`);
  }
  
  res.json({ success: true });
}));

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payment) {
  const orderId = payment.order_id;
  
  if (!orderId) return;
  
  // Find donation
  const donation = await db.queryOne(
    'SELECT * FROM donations WHERE razorpay_order_id = ?',
    [orderId]
  );
  
  if (!donation || donation.status === 'completed') return;
  
  // Update donation
  await db.query(
    `UPDATE donations 
     SET status = 'completed', 
         razorpay_payment_id = ?, 
         completed_at = NOW(),
         payment_method = ?
     WHERE id = ?`,
    [payment.id, payment.method || 'razorpay', donation.id]
  );
  
  // Get donor info
  const donor = await db.queryOne(
    'SELECT * FROM donors WHERE id = ?',
    [donation.donor_id]
  );
  
  if (!donor) return;
  
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
      paymentId: payment.id,
      receiptUrl: receipt.url,
    },
    attachments: receipt.filePath ? [{
      filename: `receipt-${receipt.receiptNumber}.pdf`,
      path: receipt.filePath,
    }] : [],
  });
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payment) {
  const orderId = payment.order_id;
  
  if (!orderId) return;
  
  await db.query(
    `UPDATE donations 
     SET status = 'failed', 
         failure_reason = ?
     WHERE razorpay_order_id = ?`,
    [payment.error_description || 'Payment failed', orderId]
  );
}

/**
 * Handle order.paid event
 */
async function handleOrderPaid(order) {
  // This is handled by payment.captured
  console.log(`Order paid: ${order.id}`);
}

module.exports = router;

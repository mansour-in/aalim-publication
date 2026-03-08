/**
 * RAZORPAY SERVICE
 * ================
 * Razorpay payment gateway integration
 */

const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a new order
 * @param {number} amount - Amount in INR
 * @param {string} currency - Currency code (default: INR)
 * @param {object} notes - Additional notes
 * @returns {Promise<object>} Razorpay order
 */
async function createOrder(amount, currency = 'INR', notes = {}) {
  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    receipt: `receipt_${Date.now()}`,
    notes,
  };
  
  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }
}

/**
 * Fetch order details
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<object>} Order details
 */
async function fetchOrder(orderId) {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error('Razorpay fetch order failed:', error);
    throw new Error(`Failed to fetch order: ${error.message}`);
  }
}

/**
 * Fetch payment details
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<object>} Payment details
 */
async function fetchPayment(paymentId) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay fetch payment failed:', error);
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }
}

/**
 * Capture a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to capture
 * @returns {Promise<object>} Captured payment
 */
async function capturePayment(paymentId, amount) {
  try {
    const payment = await razorpay.payments.capture(
      paymentId,
      Math.round(amount * 100)
    );
    return payment;
  } catch (error) {
    console.error('Razorpay capture payment failed:', error);
    throw new Error(`Failed to capture payment: ${error.message}`);
  }
}

/**
 * Create a refund
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund (optional, full refund if not specified)
 * @returns {Promise<object>} Refund details
 */
async function createRefund(paymentId, amount = null) {
  try {
    const options = {};
    if (amount) {
      options.amount = Math.round(amount * 100);
    }
    
    const refund = await razorpay.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error('Razorpay refund failed:', error);
    throw new Error(`Failed to create refund: ${error.message}`);
  }
}

/**
 * Verify payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} Signature valid
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  const crypto = require('crypto');
  
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  
  return expectedSignature === signature;
}

/**
 * Get Razorpay key ID (for frontend)
 * @returns {string} Key ID
 */
function getKeyId() {
  return process.env.RAZORPAY_KEY_ID;
}

module.exports = {
  createOrder,
  fetchOrder,
  fetchPayment,
  capturePayment,
  createRefund,
  verifyPaymentSignature,
  getKeyId,
  razorpay,
};

/**
 * LOGGER MIDDLEWARE
 * =================
 * Request logging
 */

// Request logger middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };
    
    // Log slow requests as warnings
    if (duration > 1000) {
      console.log('SLOW_REQUEST', `Slow request: ${req.method} ${req.originalUrl}`, logData);
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      console.log('HTTP_ERROR', `HTTP ${res.statusCode}: ${req.method} ${req.originalUrl}`, logData);
    }
  });
  
  next();
}

// Logger object
const logger = {
  info: (category, message, context) => {
    console.log(`[INFO] [${category}] ${message}`, context || '');
  },
  error: (category, message, context) => {
    console.error(`[ERROR] [${category}] ${message}`, context || '');
  },
  warn: (category, message, context) => {
    console.warn(`[WARN] [${category}] ${message}`, context || '');
  },
  payment: {
    created: (donationId, amount, context) => 
      logger.info('PAYMENT', `Payment created for donation ${donationId}`, { donationId, amount, ...context }),
    success: (donationId, paymentId, context) => 
      logger.info('PAYMENT', `Payment successful for donation ${donationId}`, { donationId, paymentId, ...context }),
    failed: (donationId, error, context) => 
      logger.error('PAYMENT', `Payment failed for donation ${donationId}: ${error}`, { donationId, error, ...context }),
  },
  email: {
    sent: (template, recipient, context) => 
      logger.info('EMAIL', `Email sent: ${template} to ${recipient}`, { template, recipient, ...context }),
    failed: (template, recipient, error, context) => 
      logger.error('EMAIL', `Email failed: ${template} to ${recipient}: ${error}`, { template, recipient, error, ...context }),
  },
  auth: {
    login: (userId, method, context) => 
      logger.info('AUTH', `User login: ${userId} via ${method}`, { userId, method, ...context }),
    failed: (email, reason, context) => 
      logger.warn('AUTH', `Login failed for ${email}: ${reason}`, { email, reason, ...context }),
  },
};

module.exports = { logger, requestLogger };

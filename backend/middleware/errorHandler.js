/**
 * ERROR HANDLER MIDDLEWARE
 * ========================
 * Global error handling with proper responses
 */

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class PaymentError extends AppError {
  constructor(message = 'Payment processing failed') {
    super(message, 400, 'PAYMENT_ERROR');
  }
}

// Global error handler
function errorHandler(err, req, res, next) {
  // Log the error
  console.error('ERROR:', err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    code: err.code,
  });
  
  // Handle specific error types
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors || undefined,
    });
  }
  
  // Handle validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errors.map(e => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }
  
  // Handle database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      code: 'DUPLICATE_ERROR',
    });
  }
  
  // Handle Razorpay errors
  if (err.error && err.error.description) {
    return res.status(400).json({
      success: false,
      message: err.error.description,
      code: 'RAZORPAY_ERROR',
    });
  }
  
  // Default error response
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
    code: 'INTERNAL_ERROR',
    ...(isDev && { 
      error: err.message,
      stack: err.stack,
    }),
  });
}

// Async handler wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  PaymentError,
};

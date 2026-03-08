/**
 * Logger Service
 * ==============
 * Centralized logging with categories and levels
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Create format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}] ${info.category ? `[${info.category}]` : ''} ${info.message}`
  )
);

// Create format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  defaultMeta: { service: 'aalim-fundraiser' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'error.log'),
      level: 'error',
      format: fileFormat,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'combined.log'),
      format: fileFormat,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'rejections.log'),
    }),
  ],
});

// Helper methods with categories
const loggerWithCategory = {
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  info: (message, meta = {}) => logger.info(message, meta),
  http: (message, meta = {}) => logger.http(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  
  // Category-specific loggers
  auth: (level, message, meta = {}) => logger.log(level, message, { ...meta, category: 'auth' }),
  donation: (level, message, meta = {}) => logger.log(level, message, { ...meta, category: 'donation' }),
  payment: (level, message, meta = {}) => logger.log(level, message, { ...meta, category: 'payment' }),
  email: (level, message, meta = {}) => logger.log(level, message, { ...meta, category: 'email' }),
  admin: (level, message, meta = {}) => logger.log(level, message, { ...meta, category: 'admin' }),
  system: (level, message, meta = {}) => logger.log(level, message, { ...meta, category: 'system' }),
};

module.exports = loggerWithCategory;

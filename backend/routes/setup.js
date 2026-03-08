/**
 * SETUP ROUTES
 * ============
 * Installation wizard and system setup
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');

const SETUP_LOCK_FILE = path.join(__dirname, '..', '.setup-complete');

/**
 * Check if setup is complete
 */
function isSetupComplete() {
  return fs.existsSync(SETUP_LOCK_FILE);
}

/**
 * Mark setup as complete
 */
function markSetupComplete() {
  fs.writeFileSync(SETUP_LOCK_FILE, new Date().toISOString());
}

/**
 * Check setup status
 * GET /api/setup/status
 */
router.get('/status', asyncHandler(async (req, res) => {
  const setupComplete = isSetupComplete();
  
  let hasAdminUsers = false;
  let dbConnected = false;
  
  try {
    // Check if admin users exist
    const adminCount = await db.queryOne('SELECT COUNT(*) as count FROM admin_users');
    hasAdminUsers = adminCount.count > 0;
    dbConnected = true;
  } catch (error) {
    // Database not initialized yet
    dbConnected = false;
  }
  
  res.json({
    success: true,
    setupComplete: setupComplete && hasAdminUsers,
    hasAdminUsers,
    dbConnected,
  });
}));

/**
 * Test database connection
 * POST /api/setup/test-database
 */
router.post('/test-database', asyncHandler(async (req, res) => {
  if (isSetupComplete()) {
    return res.status(403).json({
      success: false,
      message: 'Setup already completed',
    });
  }
  
  const { host, port, database, user, password } = req.body;
  
  const mysql = require('mysql2/promise');
  
  try {
    const connection = await mysql.createConnection({
      host: host || process.env.DB_HOST,
      port: port || parseInt(process.env.DB_PORT) || 3306,
      database: database || process.env.DB_NAME,
      user: user || process.env.DB_USER,
      password: password || process.env.DB_PASSWORD,
    });
    
    await connection.ping();
    await connection.end();
    
    res.json({
      success: true,
      message: 'Database connection successful',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Database connection failed: ' + error.message,
    });
  }
}));

/**
 * Run complete installation
 * POST /api/setup/install
 */
router.post('/install', asyncHandler(async (req, res) => {
  if (isSetupComplete()) {
    return res.status(403).json({
      success: false,
      message: 'Setup already completed',
    });
  }
  
  const { admin, settings } = req.body;
  
  if (!admin || !admin.email || !admin.name || !admin.password) {
    throw new ValidationError('Admin details are required');
  }
  
  if (admin.password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }
  
  try {
    // 1. Initialize database schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new ValidationError('Database schema file not found');
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }
    
    // 2. Create admin user
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    await db.query(
      'INSERT INTO admin_users (email, name, password_hash, role, is_active) VALUES (?, ?, ?, ?, TRUE)',
      [admin.email, admin.name, hashedPassword, 'superadmin']
    );
    
    // 3. Save settings
    if (settings && typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        await db.query(
          'INSERT INTO settings (key_name, value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?',
          [key, String(value), `Setup setting: ${key}`, String(value)]
        );
      }
    }
    
    // 4. Mark setup complete
    markSetupComplete();
    
    res.json({
      success: true,
      message: 'Installation completed successfully',
    });
  } catch (error) {
    throw new ValidationError('Installation failed: ' + error.message);
  }
}));

/**
 * Initialize database
 * POST /api/setup/init-database
 */
router.post('/init-database', asyncHandler(async (req, res) => {
  if (isSetupComplete()) {
    return res.status(403).json({
      success: false,
      message: 'Setup already completed',
    });
  }
  
  // Read and execute schema
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    throw new ValidationError('Database schema file not found');
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const statements = schema.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      await db.query(statement);
    }
  }
  
  res.json({
    success: true,
    message: 'Database initialized successfully',
  });
}));

/**
 * Create admin user
 * POST /api/setup/create-admin
 */
router.post('/create-admin', asyncHandler(async (req, res) => {
  if (isSetupComplete()) {
    return res.status(403).json({
      success: false,
      message: 'Setup already completed',
    });
  }
  
  const { email, name, password } = req.body;
  
  if (!email || !name || !password) {
    throw new ValidationError('Email, name, and password are required');
  }
  
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create admin user
  await db.query(
    'INSERT INTO admin_users (email, name, password_hash, role, is_active) VALUES (?, ?, ?, ?, TRUE)',
    [email, name, hashedPassword, 'superadmin']
  );
  
  res.json({
    success: true,
    message: 'Admin user created successfully',
  });
}));

/**
 * Save settings
 * POST /api/setup/settings
 */
router.post('/settings', asyncHandler(async (req, res) => {
  if (isSetupComplete()) {
    return res.status(403).json({
      success: false,
      message: 'Setup already completed',
    });
  }
  
  const settings = req.body;
  
  for (const [key, value] of Object.entries(settings)) {
    await db.query(
      'INSERT INTO settings (key_name, value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?',
      [key, value, `Setup setting: ${key}`, value]
    );
  }
  
  res.json({
    success: true,
    message: 'Settings saved successfully',
  });
}));

/**
 * Complete setup
 * POST /api/setup/complete
 */
router.post('/complete', asyncHandler(async (req, res) => {
  if (isSetupComplete()) {
    return res.status(403).json({
      success: false,
      message: 'Setup already completed',
    });
  }
  
  // Verify admin exists
  const adminCount = await db.queryOne('SELECT COUNT(*) as count FROM admin_users');
  
  if (adminCount.count === 0) {
    throw new ValidationError('At least one admin user must be created');
  }
  
  // Mark setup complete
  markSetupComplete();
  
  res.json({
    success: true,
    message: 'Setup completed successfully',
  });
}));

module.exports = router;

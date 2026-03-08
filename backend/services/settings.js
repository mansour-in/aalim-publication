/**
 * SETTINGS SERVICE
 * ================
 * Application settings management
 */

const db = require('../config/database');

// Default settings
const defaultSettings = {
  fundraising_goal: '500000',
  price_per_hadith: '500',
  org_name: 'Ramadan Hadith Fundraiser',
  org_address: '',
  org_phone: '',
  org_email: '',
  campaign_start_date: '',
  campaign_end_date: '',
  enable_anonymous_donations: 'true',
  enable_donor_wall: 'true',
  enable_receipts: 'true',
  smtp_enabled: 'false',
  razorpay_mode: 'test',
};

/**
 * Get setting by key
 * @param {string} key - Setting key
 * @param {string} defaultValue - Default value if not found
 * @returns {Promise<string>} Setting value
 */
async function getSetting(key, defaultValue = null) {
  const result = await db.queryOne(
    'SELECT value FROM settings WHERE key_name = ?',
    [key]
  );
  
  return result ? result.value : (defaultValue || defaultSettings[key] || null);
}

/**
 * Get multiple settings
 * @param {array} keys - Setting keys
 * @returns {Promise<object>} Settings object
 */
async function getSettings(keys = null) {
  let query = 'SELECT key_name, value FROM settings';
  let params = [];
  
  if (keys && keys.length > 0) {
    query += ' WHERE key_name IN (?)';
    params = [keys];
  }
  
  const results = await db.query(query, params);
  
  const settings = { ...defaultSettings };
  results.forEach(row => {
    settings[row.key_name] = row.value;
  });
  
  return settings;
}

/**
 * Set setting value
 * @param {string} key - Setting key
 * @param {string} value - Setting value
 * @param {number} updatedBy - Admin user ID
 * @returns {Promise<void>}
 */
async function setSetting(key, value, updatedBy = null) {
  await db.query(
    `INSERT INTO settings (key_name, value, updated_by) 
     VALUES (?, ?, ?) 
     ON DUPLICATE KEY UPDATE value = ?, updated_by = ?`,
    [key, value, updatedBy, value, updatedBy]
  );
}

/**
 * Set multiple settings
 * @param {object} settings - Settings object
 * @param {number} updatedBy - Admin user ID
 * @returns {Promise<void>}
 */
async function setSettings(settings, updatedBy = null) {
  for (const [key, value] of Object.entries(settings)) {
    await setSetting(key, value, updatedBy);
  }
}

/**
 * Get fundraising progress
 * @returns {Promise<object>} Progress info
 */
async function getFundraisingProgress() {
  const goal = parseFloat(await getSetting('fundraising_goal', '500000'));
  
  const result = await db.queryOne(`
    SELECT COALESCE(SUM(amount), 0) as raised, COUNT(*) as donations
    FROM donations WHERE status = 'completed'
  `);
  
  const raised = parseFloat(result.raised);
  const progress = Math.min(100, (raised / goal) * 100);
  
  return {
    goal,
    raised,
    progress,
    donations: result.donations,
    remaining: Math.max(0, goal - raised),
  };
}

/**
 * Initialize default settings
 * @returns {Promise<void>}
 */
async function initializeDefaults() {
  for (const [key, value] of Object.entries(defaultSettings)) {
    const exists = await db.queryOne(
      'SELECT 1 FROM settings WHERE key_name = ?',
      [key]
    );
    
    if (!exists) {
      await db.query(
        'INSERT INTO settings (key_name, value, description) VALUES (?, ?, ?)',
        [key, value, `Default setting: ${key}`]
      );
    }
  }
}

module.exports = {
  getSetting,
  getSettings,
  setSetting,
  setSettings,
  getFundraisingProgress,
  initializeDefaults,
  defaultSettings,
};

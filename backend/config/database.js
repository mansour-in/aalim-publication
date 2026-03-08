/**
 * DATABASE CONFIGURATION
 * ======================
 * MySQL connection pool with prepared statements
 */

const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'aalim_fundraiser',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Database helper methods
const db = {
  // Get connection from pool
  getConnection: async () => {
    return await pool.getConnection();
  },
  
  // Execute query with prepared statements (SQL injection protection)
  query: async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  },
  
  // Execute query and return single row
  queryOne: async (sql, params = []) => {
    const rows = await db.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },
  
  // Insert and return insertId
  insert: async (sql, params = []) => {
    const [result] = await pool.execute(sql, params);
    return result.insertId;
  },
  
  // Update and return affectedRows
  update: async (sql, params = []) => {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  },
  
  // Delete and return affectedRows
  delete: async (sql, params = []) => {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  },
  
  // Test database connection
  testConnection: async () => {
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      console.error('Database connection failed:', error.message);
      throw error;
    }
  },
  
  // Close pool (for graceful shutdown)
  close: async () => {
    await pool.end();
  },
};

module.exports = db;

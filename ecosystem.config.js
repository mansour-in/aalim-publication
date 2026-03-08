/**
 * PM2 Ecosystem Configuration for Hostinger
 * ==========================================
 * This file configures PM2 to manage the Node.js backend process
 * 
 * Usage on Hostinger:
 * 1. Install PM2: npm install -g pm2
 * 2. Start: pm2 start ecosystem.config.js
 * 3. Save config: pm2 save
 * 4. Setup startup: pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'aalim-fundraiser',
      script: './backend/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Auto-restart on failure
      autorestart: true,
      // Restart memory limit (512MB)
      max_memory_restart: '512M',
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Don't run as daemon (for Hostinger compatibility)
      daemon: false,
      // Kill timeout
      kill_timeout: 5000,
      // Listen timeout
      listen_timeout: 10000,
      // Max restarts
      max_restarts: 10,
      // Min uptime before considering start successful
      min_uptime: '10s'
    }
  ]
};

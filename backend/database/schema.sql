--
-- RAMADAN HADITH FUNDRAISER DATABASE SCHEMA
-- ==========================================
--

-- Donors table
CREATE TABLE IF NOT EXISTS donors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  pan_number VARCHAR(10),
  pan_verified BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  otp_hash VARCHAR(255),
  otp_expires_at DATETIME,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_pan_number (pan_number),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  fee_covered BOOLEAN DEFAULT FALSE,
  hadith_count INT NOT NULL DEFAULT 1,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  message TEXT,
  pan_number VARCHAR(10),
  admin_notes TEXT,
  failure_reason TEXT,
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE,
  INDEX idx_donor_id (donor_id),
  INDEX idx_status (status),
  INDEX idx_pan_number (pan_number),
  INDEX idx_fee_covered (fee_covered),
  INDEX idx_razorpay_order (razorpay_order_id),
  INDEX idx_created_at (created_at),
  INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donation_id INT NOT NULL UNIQUE,
  receipt_number VARCHAR(100) NOT NULL UNIQUE,
  file_path VARCHAR(500) NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  INDEX idx_receipt_number (receipt_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'superadmin') DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_key_name (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  payload TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO settings (key_name, value, description) VALUES
('fundraising_goal', '500000', 'Total fundraising goal in INR'),
('price_per_hadith', '500', 'Price per Hadith in INR'),
('org_name', 'Ramadan Hadith Fundraiser', 'Organization name'),
('org_address', '', 'Organization address'),
('org_phone', '', 'Organization phone'),
('org_email', '', 'Organization email'),
('campaign_start_date', '', 'Campaign start date'),
('campaign_end_date', '', 'Campaign end date'),
('enable_anonymous_donations', 'true', 'Enable anonymous donations'),
('enable_donor_wall', 'true', 'Enable public donor wall'),
('enable_receipts', 'true', 'Enable automatic receipt generation'),
('enable_fee_coverage', 'true', 'Enable optional payment fee coverage'),
('fee_percentage', '2.5', 'Payment processing fee percentage'),
('fee_coverage_label', 'I would like to cover the 2.5% payment processing fee', 'Label for fee coverage checkbox'),
('enable_pan_field', 'false', 'Enable PAN card number field'),
('pan_required', 'false', 'Make PAN field required'),
('show_pan_on_receipt', 'false', 'Show PAN number on receipt'),
('site_title', 'Ramadan Hadith Fundraiser', 'Website title'),
('site_description', 'Support the translation of Hadiths this Ramadan', 'Website meta description'),
('share_message', 'I just donated to support Hadith translation. Join me!', 'Default social share message'),
('thank_you_message', 'Thank you for your generous donation! May Allah accept it.', 'Thank you message after donation'),
('footer_text', '© 2026 Aalim Publications. All rights reserved.', 'Footer copyright text')
ON DUPLICATE KEY UPDATE value = VALUES(value);

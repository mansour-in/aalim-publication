-- Migration: Add PAN and Payment Fee Fields
-- ===========================================

-- Add PAN field to donors table
ALTER TABLE donors 
ADD COLUMN pan_number VARCHAR(10) NULL AFTER country,
ADD COLUMN pan_verified BOOLEAN DEFAULT FALSE AFTER pan_number,
ADD INDEX idx_pan_number (pan_number);

-- Add fee-related fields to donations table
ALTER TABLE donations 
ADD COLUMN base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER amount,
ADD COLUMN fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER base_amount,
ADD COLUMN fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0 AFTER fee_amount,
ADD COLUMN fee_covered BOOLEAN DEFAULT FALSE AFTER fee_percentage,
ADD COLUMN pan_number VARCHAR(10) NULL AFTER message,
ADD INDEX idx_pan_number (pan_number),
ADD INDEX idx_fee_covered (fee_covered);

-- Update existing donations to set base_amount = amount
UPDATE donations SET base_amount = amount WHERE base_amount = 0;

-- Add new settings for fee configuration
INSERT INTO settings (key_name, value, description) VALUES
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

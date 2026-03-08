/**
 * RECEIPT SERVICE
 * ===============
 * PDF receipt generation using PDFKit
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

const RECEIPTS_DIR = path.join(__dirname, '..', 'public', 'receipts');

// Ensure receipts directory exists
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

/**
 * Generate receipt number
 * @returns {string} Receipt number
 */
function generateReceiptNumber() {
  const prefix = 'RHF';
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${year}-${random}`;
}

/**
 * Format currency
 * @param {number} amount - Amount
 * @returns {string} Formatted amount
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

/**
 * Format date
 * @param {Date} date - Date
 * @returns {string} Formatted date
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Generate PDF receipt
 * @param {object} donation - Donation record
 * @param {object} donor - Donor record
 * @returns {Promise<object>} Receipt info
 */
async function generateReceipt(donation, donor) {
  // Check if receipt already exists
  let receipt = await db.queryOne(
    'SELECT * FROM receipts WHERE donation_id = ?',
    [donation.id]
  );
  
  if (receipt) {
    return {
      receiptNumber: receipt.receipt_number,
      filePath: receipt.file_path,
      url: `/receipts/${path.basename(receipt.file_path)}`,
    };
  }
  
  // Generate new receipt number
  const receiptNumber = generateReceiptNumber();
  const fileName = `receipt-${receiptNumber}.pdf`;
  const filePath = path.join(RECEIPTS_DIR, fileName);
  
  // Create PDF
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  
  // Header
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#0B3D3D');
  doc.text('RAMADAN HADITH FUNDRAISER', { align: 'center' });
  
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica').fillColor('#D4AF37');
  doc.text('Official Donation Receipt', { align: 'center' });
  
  // Decorative line
  doc.moveDown(0.5);
  doc.strokeColor('#D4AF37').lineWidth(2);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  
  doc.moveDown(1);
  
  // Receipt details
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#333');
  doc.text('Receipt Details', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(11).font('Helvetica');
  doc.text(`Receipt Number: ${receiptNumber}`);
  doc.text(`Date: ${formatDate(donation.completed_at || new Date())}`);
  doc.text(`Payment ID: ${donation.razorpay_payment_id || 'N/A'}`);
  
  doc.moveDown(1);
  
  // Donor details
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('Donor Information', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(11).font('Helvetica');
  doc.text(`Name: ${donor.name || 'Anonymous'}`);
  doc.text(`Email: ${donor.email}`);
  if (donor.phone) doc.text(`Phone: ${donor.phone}`);
  if (donor.address) {
    const address = [donor.address, donor.city, donor.country]
      .filter(Boolean)
      .join(', ');
    doc.text(`Address: ${address}`);
  }
  
  doc.moveDown(1);
  
  // Donation details
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('Donation Details', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(11).font('Helvetica');
  doc.text(`Hadiths Sponsored: ${donation.hadith_count}`);
  doc.text(`Amount per Hadith: ${formatCurrency(500)}`);
  
  doc.moveDown(0.5);
  
  // Total box
  doc.rect(50, doc.y, 495, 40).stroke('#D4AF37');
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0B3D3D');
  doc.text(`Total Amount: ${formatCurrency(donation.amount)}`, 60, doc.y + 10);
  
  doc.moveDown(2);
  
  // Thank you message
  doc.fontSize(12).font('Helvetica').fillColor('#333');
  doc.text('JazakAllah Khair for your generous contribution!', { align: 'center' });
  doc.moveDown(0.5);
  doc.text(
    'Your donation will help spread the teachings of Hadith to communities around the world.',
    { align: 'center' }
  );
  
  doc.moveDown(2);
  
  // Footer
  doc.fontSize(10).fillColor('#666');
  doc.text('This is a computer-generated receipt and does not require a signature.', {
    align: 'center',
  });
  doc.moveDown(0.5);
  doc.text('For any queries, please contact us at support@example.com', { align: 'center' });
  
  // Organization info
  doc.moveDown(1);
  const settings = await db.query('SELECT key_name, value FROM settings WHERE key_name LIKE "org_%"');
  const orgSettings = {};
  settings.forEach(s => orgSettings[s.key_name] = s.value);
  
  if (orgSettings.org_name) {
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(orgSettings.org_name, { align: 'center' });
    if (orgSettings.org_address) {
      doc.fontSize(9).font('Helvetica');
      doc.text(orgSettings.org_address, { align: 'center' });
    }
  }
  
  doc.end();
  
  // Wait for file to be written
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
  
  // Save receipt to database
  await db.query(
    'INSERT INTO receipts (donation_id, receipt_number, file_path) VALUES (?, ?, ?)',
    [donation.id, receiptNumber, filePath]
  );
  
  return {
    receiptNumber,
    filePath,
    url: `/receipts/${fileName}`,
  };
}

/**
 * Get receipt by donation ID
 * @param {number} donationId - Donation ID
 * @returns {Promise<object|null>} Receipt info
 */
async function getReceipt(donationId) {
  const receipt = await db.queryOne(
    'SELECT * FROM receipts WHERE donation_id = ?',
    [donationId]
  );
  
  if (!receipt) return null;
  
  return {
    receiptNumber: receipt.receipt_number,
    filePath: receipt.file_path,
    url: `/receipts/${path.basename(receipt.file_path)}`,
    generatedAt: receipt.generated_at,
  };
}

module.exports = {
  generateReceipt,
  getReceipt,
  generateReceiptNumber,
  formatCurrency,
  formatDate,
};

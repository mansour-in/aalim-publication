/**
 * EMAIL SERVICE
 * =============
 * SMTP email sending with template support
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Email templates
const templates = {
  otp: {
    subject: 'Your Login OTP - Ramadan Hadith Fundraiser',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #D4AF37; text-align: center;">Ramadan Hadith Fundraiser</h2>
        <p>Assalamu Alaikum,</p>
        <p>Your One-Time Password (OTP) for login is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0B3D3D; border-radius: 4px; margin: 20px 0;">
          ${data.otp}
        </div>
        <p>This OTP will expire in ${data.expiresIn}.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          This is an automated email from Ramadan Hadith Fundraiser.<br>
          Please do not reply to this email.
        </p>
      </div>
    `,
  },
  magic_link: {
    subject: 'Your Magic Login Link - Ramadan Hadith Fundraiser',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #D4AF37; text-align: center;">Ramadan Hadith Fundraiser</h2>
        <p>Assalamu Alaikum,</p>
        <p>Click the button below to log in to your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.magicLink}" style="background: #D4AF37; color: #05101A; padding: 15px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Log In
          </a>
        </div>
        <p>Or copy and paste this link:</p>
        <p style="word-break: break-all; color: #0B3D3D;">${data.magicLink}</p>
        <p>This link will expire in ${data.expiresIn}.</p>
        <p>If you didn't request this link, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          This is an automated email from Ramadan Hadith Fundraiser.<br>
          Please do not reply to this email.
        </p>
      </div>
    `,
  },
  donation_confirmation: {
    subject: 'Thank You for Your Donation - Ramadan Hadith Fundraiser',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #D4AF37; text-align: center;">Ramadan Hadith Fundraiser</h2>
        <p>Assalamu Alaikum ${data.donorName},</p>
        <p style="font-size: 18px; color: #0B3D3D;"><strong>JazakAllah Khair!</strong></p>
        <p>Thank you for your generous donation. Your contribution will help spread the teachings of Hadith to communities around the world.</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0B3D3D;">Donation Details</h3>
          <p><strong>Amount:</strong> ₹${data.amount}</p>
          <p><strong>Hadiths Sponsored:</strong> ${data.hadithCount}</p>
          <p><strong>Payment ID:</strong> ${data.paymentId}</p>
        </div>
        <p>Your receipt is attached to this email. You can also download it from your donor dashboard.</p>
        <p>May Allah accept your donation and multiply your rewards in this blessed month of Ramadan.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          This is an automated email from Ramadan Hadith Fundraiser.<br>
          Please do not reply to this email.
        </p>
      </div>
    `,
  },
  receipt: {
    subject: 'Your Donation Receipt - Ramadan Hadith Fundraiser',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #D4AF37; text-align: center;">Ramadan Hadith Fundraiser</h2>
        <p>Assalamu Alaikum ${data.donorName},</p>
        <p>Please find your donation receipt attached to this email.</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Receipt Number:</strong> ${data.receiptNumber}</p>
          <p><strong>Amount:</strong> ₹${data.amount}</p>
          <p><strong>Date:</strong> ${data.date}</p>
        </div>
        <p>Thank you for your support!</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          This is an automated email from Ramadan Hadith Fundraiser.<br>
          Please do not reply to this email.
        </p>
      </div>
    `,
  },
};

// Create transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

/**
 * Send email
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.template - Template name
 * @param {object} options.data - Template data
 * @param {array} options.attachments - Email attachments
 * @returns {Promise<object>} Send result
 */
async function sendEmail({ to, template, data = {}, attachments = [] }) {
  const templateConfig = templates[template];
  
  if (!templateConfig) {
    throw new Error(`Unknown email template: ${template}`);
  }
  
  const from = process.env.SMTP_FROM || 'Ramadan Hadith Fundraiser <noreply@example.com>';
  
  const mailOptions = {
    from,
    to,
    subject: templateConfig.subject,
    html: templateConfig.body(data),
    attachments,
  };
  
  try {
    const result = await getTransporter().sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

/**
 * Send custom email
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {array} options.attachments - Email attachments
 * @returns {Promise<object>} Send result
 */
async function sendCustomEmail({ to, subject, html, attachments = [] }) {
  const from = process.env.SMTP_FROM || 'Ramadan Hadith Fundraiser <noreply@example.com>';
  
  const mailOptions = {
    from,
    to,
    subject,
    html,
    attachments,
  };
  
  try {
    const result = await getTransporter().sendMail(mailOptions);
    console.log(`Custom email sent to ${to}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('Custom email sending failed:', error);
    throw error;
  }
}

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>} Connection status
 */
async function verifyConnection() {
  try {
    await getTransporter().verify();
    return true;
  } catch (error) {
    console.error('SMTP connection verification failed:', error);
    return false;
  }
}

module.exports = {
  sendEmail,
  sendCustomEmail,
  verifyConnection,
  templates,
};

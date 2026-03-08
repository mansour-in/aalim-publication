/**
 * DONORS ROUTES
 * =============
 * Donor management and public donor wall
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');

/**
 * Get public donor wall (non-anonymous donors)
 * GET /api/donors/wall
 */
router.get('/wall', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  const donors = await db.query(`
    SELECT 
      d.id,
      d.name,
      dn.total_amount,
      dn.total_hadiths,
      dn.last_donation
    FROM donors d
    INNER JOIN (
      SELECT 
        donor_id,
        SUM(amount) as total_amount,
        SUM(hadith_count) as total_hadiths,
        MAX(completed_at) as last_donation
      FROM donations
      WHERE status = 'completed'
      GROUP BY donor_id
    ) dn ON d.id = dn.donor_id
    WHERE d.is_anonymous = FALSE AND d.name IS NOT NULL
    ORDER BY dn.total_amount DESC
    LIMIT ? OFFSET ?
  `, [parseInt(limit), parseInt(offset)]);
  
  const total = await db.queryOne(`
    SELECT COUNT(DISTINCT d.id) as count
    FROM donors d
    INNER JOIN donations dn ON d.id = dn.donor_id
    WHERE d.is_anonymous = FALSE AND d.name IS NOT NULL AND dn.status = 'completed'
  `);
  
  res.json({
    success: true,
    donors: donors.map(d => ({
      id: d.id,
      name: d.name,
      totalAmount: d.total_amount,
      totalHadiths: d.total_hadiths,
      lastDonation: d.last_donation,
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total.count,
      totalPages: Math.ceil(total.count / limit),
    },
  });
}));

/**
 * Get top donors leaderboard
 * GET /api/donors/leaderboard
 */
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const donors = await db.query(`
    SELECT 
      d.id,
      d.name,
      COALESCE(SUM(dn.amount), 0) as total_amount,
      COALESCE(SUM(dn.hadith_count), 0) as total_hadiths
    FROM donors d
    LEFT JOIN donations dn ON d.id = dn.donor_id AND dn.status = 'completed'
    WHERE d.is_anonymous = FALSE AND d.name IS NOT NULL
    GROUP BY d.id
    ORDER BY total_amount DESC
    LIMIT ?
  `, [parseInt(limit)]);
  
  res.json({
    success: true,
    donors: donors.map((d, index) => ({
      rank: index + 1,
      id: d.id,
      name: d.name,
      totalAmount: d.total_amount,
      totalHadiths: d.total_hadiths,
    })),
  });
}));

module.exports = router;

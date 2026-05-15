const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/public/landing-stats
router.get('/landing-stats', async (req, res) => {
  try {
    const [[usersRow]] = await pool.query(
      `SELECT COUNT(*) AS total_users FROM users`
    );
    const [[ordersRow]] = await pool.query(
      `SELECT COUNT(*) AS total_orders FROM orders`
    );
    const [[ratingRow]] = await pool.query(
      `SELECT ROUND(AVG(rating), 1) AS avg_rating FROM feedback WHERE rating IS NOT NULL`
    );
    const [[shipmentsRow]] = await pool.query(
      `SELECT COUNT(*) AS completed_shipments FROM shipments WHERE status = 'delivered'`
    );

    res.json({
      total_users:          Number(usersRow.total_users)          || 0,
      total_orders:         Number(ordersRow.total_orders)         || 0,
      avg_rating:           Number(ratingRow.avg_rating)           || 0,
      completed_shipments:  Number(shipmentsRow.completed_shipments) || 0,
    });
  } catch (err) {
    console.error('Landing stats error:', err);
    res.status(500).json({ message: 'Failed to fetch landing stats.' });
  }
});

module.exports = router;
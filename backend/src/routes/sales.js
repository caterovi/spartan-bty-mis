const express = require('express');
const router = express.Router();
const sales = require('../controllers/salesController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Sales routes - Sales team and Admin
router.get('/orders', authenticateToken, requireRole(['admin', 'sales']), sales.getOrders);
router.get('/orders/:id', authenticateToken, requireRole(['admin', 'sales']), validate('params', 'order'), sales.getOrderById);
router.post('/orders', authenticateToken, requireRole(['admin', 'sales']), validate('order'), sales.createOrder);
router.put('/orders/:id/status', authenticateToken, requireRole(['admin', 'sales']), validate('order'), sales.updateStatus);
router.put('/orders/:id/confirm', authenticateToken, requireRole(['admin', 'sales']), validate('order'), sales.confirmAndReduceStock);
router.delete('/orders/:id', authenticateToken, requireRole(['admin', 'sales']), sales.deleteOrder);
router.get('/summary', authenticateToken, requireRole(['admin', 'sales']), sales.getSummary);
router.get('/next-code', authenticateToken, requireRole(['admin', 'sales']), sales.getNextOrderCode);

module.exports = router;
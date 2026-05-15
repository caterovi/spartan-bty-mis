const express = require('express');
const router = express.Router();
const sales = require('../controllers/salesController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

router.get('/orders',                    authenticateToken, requireRole(['admin','sales']), sales.getOrders);
router.get('/orders/:id/history',        authenticateToken, requireRole(['admin','sales']), sales.getOrderHistory);
router.get('/orders/:id',                authenticateToken, requireRole(['admin','sales']), sales.getOrderById);
router.post('/orders',                   authenticateToken, requireRole(['admin','sales']), validate('order'), sales.createOrder);
router.put('/orders/:id/confirm',        authenticateToken, requireRole(['admin','sales']), sales.confirmAndReduceStock);
router.put('/orders/:id/cancel',         authenticateToken, requireRole(['admin','sales']), sales.cancelOrder);
router.put('/orders/:id/forward',        authenticateToken, requireRole(['admin','sales']), sales.forwardToLogistics);
router.put('/orders/:id/status',         authenticateToken, requireRole(['admin','sales']), sales.updateStatus);
router.delete('/orders/:id',             authenticateToken, requireRole(['admin','sales']), sales.deleteOrder);
router.get('/summary',                   authenticateToken, requireRole(['admin','sales']), sales.getSummary);
router.get('/next-code',                 authenticateToken, requireRole(['admin','sales']), sales.getNextOrderCode);

module.exports = router;
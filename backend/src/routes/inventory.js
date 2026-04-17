const express = require('express');
const router = express.Router();
const inventory = require('../controllers/inventoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Items - Inventory team, Logistics, and Admin
router.get('/items', authenticateToken, requireRole(['admin', 'inventory', 'logistics']), inventory.getItems);
router.post('/items', authenticateToken, requireRole(['admin', 'inventory']), validate('inventoryItem'), inventory.addItem);
router.put('/items/:id', authenticateToken, requireRole(['admin', 'inventory']), validate('inventoryItem'), inventory.updateItem);
router.delete('/items/:id', authenticateToken, requireRole(['admin', 'inventory']), inventory.deleteItem);

// Stock movements - Inventory team, Logistics, and Admin
router.get('/logs', authenticateToken, requireRole(['admin', 'inventory', 'logistics']), inventory.getLogs);
router.post('/stock-in', authenticateToken, requireRole(['admin', 'inventory']), inventory.stockIn);
router.post('/stock-out', authenticateToken, requireRole(['admin', 'inventory']), inventory.stockOut);

// Summary - Inventory team, Logistics, and Admin
router.get('/summary', authenticateToken, requireRole(['admin', 'inventory', 'logistics']), inventory.getSummary);

module.exports = router;
const express = require('express');
const router = express.Router();
const inventory = require('../controllers/inventoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Items
router.get('/next-code',                  authenticateToken, requireRole(['admin','inventory']), inventory.getNextCode);
router.get('/items',                      authenticateToken, requireRole(['admin','inventory','logistics','sales', 'marketing']), inventory.getItems);
router.get('/items/:id/details',          authenticateToken, requireRole(['admin','inventory']), inventory.getItemDetails);
router.post('/items',                     authenticateToken, requireRole(['admin','inventory']), inventory.addItem);
router.put('/items/:id',                  authenticateToken, requireRole(['admin','inventory']), inventory.updateItem);
router.put('/items/:id/archive',          authenticateToken, requireRole(['admin','inventory']), inventory.archiveItem);
router.delete('/items/:id',               authenticateToken, requireRole(['admin','inventory']), inventory.deleteItem);

// Stock movements
router.get('/logs',                       authenticateToken, requireRole(['admin','inventory','logistics']), inventory.getLogs);
router.post('/stock-in',                  authenticateToken, requireRole(['admin','inventory']), inventory.stockIn);
router.post('/stock-out',                 authenticateToken, requireRole(['admin','inventory']), inventory.stockOut);

// Summary & alerts
router.get('/summary',                    authenticateToken, requireRole(['admin','inventory','logistics']), inventory.getSummary);
router.get('/restock-recommendations',    authenticateToken, requireRole(['admin','inventory']), inventory.getRestockRecommendations);
router.get('/expiry-alerts',              authenticateToken, requireRole(['admin','inventory']), inventory.getExpiryAlerts);

module.exports = router;
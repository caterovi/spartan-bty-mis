const express = require('express');
const router = express.Router();
const logistics = require('../controllers/logisticsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Shipments
router.get('/shipments',                       authenticateToken, requireRole(['admin','logistics']), logistics.getShipments);
router.get('/shipments/:id/checklist',         authenticateToken, requireRole(['admin','logistics']), logistics.getChecklist);
router.get('/shipments/:id/timeline',          authenticateToken, requireRole(['admin','logistics']), logistics.getTimeline);
router.get('/shipments/:id',                   authenticateToken, requireRole(['admin','logistics']), logistics.getShipmentById);
router.post('/shipments',                      authenticateToken, requireRole(['admin','logistics','sales']), logistics.createShipment);
router.put('/shipments/:id',                   authenticateToken, requireRole(['admin','logistics']), logistics.updateShipment);
router.put('/shipments/:id/checklist',         authenticateToken, requireRole(['admin','logistics']), logistics.updateChecklist);
router.delete('/shipments/:id',                authenticateToken, requireRole(['admin','logistics']), logistics.deleteShipment);

// Receipt
router.post('/shipments/:id/receipt',          authenticateToken, requireRole(['admin','logistics']), logistics.uploadMiddleware, logistics.uploadReceipt);
router.delete('/shipments/:id/receipt',        authenticateToken, requireRole(['admin','logistics']), logistics.deleteReceipt);

// Summary
router.get('/summary',                         authenticateToken, requireRole(['admin','logistics']), logistics.getSummary);

module.exports = router;
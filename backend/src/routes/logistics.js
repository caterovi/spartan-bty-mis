const express = require('express');
const router = express.Router();
const logistics = require('../controllers/logisticsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Logistics routes - Logistics team and Admin
router.get('/shipments', authenticateToken, requireRole(['admin', 'logistics']), logistics.getShipments);
router.post('/shipments', authenticateToken, requireRole(['admin', 'logistics', 'sales']), logistics.createShipment);
router.put('/shipments/:id', authenticateToken, requireRole(['admin', 'logistics']), logistics.updateShipment);
router.delete('/shipments/:id', authenticateToken, requireRole(['admin', 'logistics']), logistics.deleteShipment);
router.get('/summary', authenticateToken, requireRole(['admin', 'logistics']), logistics.getSummary);

module.exports = router;
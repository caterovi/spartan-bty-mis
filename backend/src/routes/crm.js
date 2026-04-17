const express = require('express');
const router = express.Router();
const crm = require('../controllers/crmController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Customers - CRM team and Admin
router.get('/customers', authenticateToken, requireRole(['admin', 'crm']), crm.getCustomers);
router.post('/customers', authenticateToken, requireRole(['admin', 'crm']), crm.addCustomer);
router.delete('/customers/:id', authenticateToken, requireRole(['admin', 'crm']), crm.deleteCustomer);

// Feedback - CRM team and Admin
router.get('/feedback', authenticateToken, requireRole(['admin', 'crm']), crm.getFeedback);
router.post('/feedback', authenticateToken, requireRole(['admin', 'crm']), crm.addFeedback);
router.put('/feedback/:id/status', authenticateToken, requireRole(['admin', 'crm']), crm.updateFeedbackStatus);
router.delete('/feedback/:id', authenticateToken, requireRole(['admin', 'crm']), crm.deleteFeedback);
router.post('/generate-suggestions', authenticateToken, requireRole(['admin', 'crm']), crm.generateSuggestions);
router.get('/suggestions', authenticateToken, requireRole(['admin', 'crm']), crm.getSuggestions);

// Analysis summary - CRM team and Admin
router.get('/summary', authenticateToken, requireRole(['admin', 'crm']), crm.getSummary);

module.exports = router;
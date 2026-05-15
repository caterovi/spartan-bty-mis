const express = require('express');
const router = express.Router();
const crm = require('../controllers/crmController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Customers
router.get('/customers',                    authenticateToken, requireRole(['admin','crm']), crm.getCustomers);
router.get('/customers/:id/activity',       authenticateToken, requireRole(['admin','crm']), crm.getCustomerActivity);
router.get('/customers/:id',                authenticateToken, requireRole(['admin','crm']), crm.getCustomerById);
router.post('/customers',                   authenticateToken, requireRole(['admin','crm']), crm.addCustomer);
router.put('/customers/:id',                authenticateToken, requireRole(['admin','crm']), crm.updateCustomer);
router.patch('/customers/:id/archive',      authenticateToken, requireRole(['admin','crm']), crm.archiveCustomer);
router.delete('/customers/:id',             authenticateToken, requireRole(['admin','crm']), crm.deleteCustomer);

// Feedback
router.get('/feedback',                     authenticateToken, requireRole(['admin','crm']), crm.getFeedback);
router.get('/feedback/:id/activity',        authenticateToken, requireRole(['admin','crm']), crm.getFeedbackActivity);
router.post('/feedback',                    authenticateToken, requireRole(['admin','crm']), crm.addFeedback);
router.put('/feedback/:id/status',          authenticateToken, requireRole(['admin','crm']), crm.updateFeedbackStatus);
router.put('/feedback/:id',                 authenticateToken, requireRole(['admin','crm']), crm.updateFeedback);
router.patch('/feedback/:id/archive',       authenticateToken, requireRole(['admin','crm']), crm.archiveFeedback);
router.delete('/feedback/:id',              authenticateToken, requireRole(['admin','crm']), crm.deleteFeedback);

// Activity
router.post('/activity',                    authenticateToken, requireRole(['admin','crm']), crm.addActivity);

// Analysis
router.get('/summary',                      authenticateToken, requireRole(['admin','crm']), crm.getSummary);
router.post('/generate-suggestions',        authenticateToken, requireRole(['admin','crm']), crm.generateSuggestions);
router.get('/suggestions',                  authenticateToken, requireRole(['admin','crm']), crm.getSuggestions);

module.exports = router;
const express = require('express');
const router = express.Router();
const marketing = require('../controllers/marketingController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Campaigns - Marketing team and Admin
router.get('/campaigns', authenticateToken, requireRole(['admin', 'marketing']), marketing.getCampaigns);
router.post('/campaigns', authenticateToken, requireRole(['admin', 'marketing']), marketing.addCampaign);
router.put('/campaigns/:id', authenticateToken, requireRole(['admin', 'marketing']), marketing.updateCampaignStatus);
router.delete('/campaigns/:id', authenticateToken, requireRole(['admin', 'marketing']), marketing.deleteCampaign);

// Campaign tasks - Marketing team and Admin
router.get('/campaigns/:id', authenticateToken, requireRole(['admin', 'marketing']), marketing.getCampaignById);
router.get('/campaigns/:id/tasks', authenticateToken, requireRole(['admin', 'marketing']), marketing.getCampaignTasks);
router.post('/campaigns/:id/tasks', authenticateToken, requireRole(['admin', 'marketing']), marketing.addCampaignTask);
router.put('/campaigns/:id/equipment', authenticateToken, requireRole(['admin', 'marketing']), marketing.updateEquipment);
router.put('/tasks/:id', authenticateToken, requireRole(['admin', 'marketing']), marketing.updateTask);
router.delete('/tasks/:id', authenticateToken, requireRole(['admin', 'marketing']), marketing.deleteTask);

// Performance - Marketing team and Admin
router.get('/performance', authenticateToken, requireRole(['admin', 'marketing']), marketing.getPerformance);
router.get('/performance/:campaign_id', authenticateToken, requireRole(['admin', 'marketing']), marketing.getPerformanceByCampaign);
router.post('/performance', authenticateToken, requireRole(['admin', 'marketing']), marketing.addPerformance);

// Promotions - Marketing team and Admin
router.get('/promotions', authenticateToken, requireRole(['admin', 'marketing']), marketing.getPromotions);
router.post('/promotions', authenticateToken, requireRole(['admin', 'marketing']), marketing.addPromotion);
router.put('/promotions/:id/status', authenticateToken, requireRole(['admin', 'marketing']), marketing.updatePromotionStatus);
router.delete('/promotions/:id', authenticateToken, requireRole(['admin', 'marketing']), marketing.deletePromotion);

// Live Selling - Marketing team and Admin
router.get('/live-selling', authenticateToken, requireRole(['admin', 'marketing']), marketing.getLiveSelling);
router.post('/live-selling', authenticateToken, requireRole(['admin', 'marketing']), marketing.addLiveSelling);
router.put('/live-selling/:id', authenticateToken, requireRole(['admin', 'marketing']), marketing.updateLiveSelling);
router.delete('/live-selling/:id', authenticateToken, requireRole(['admin', 'marketing']), marketing.deleteLiveSelling);

// Content Creation - Marketing team and Admin
router.get('/content', authenticateToken, requireRole(['admin', 'marketing']), marketing.getContent);
router.post('/content', authenticateToken, requireRole(['admin', 'marketing']), marketing.addContent);
router.put('/content/:id', authenticateToken, requireRole(['admin', 'marketing']), marketing.updateContent);
router.delete('/content/:id', authenticateToken, requireRole(['admin', 'marketing']), marketing.deleteContent);

// Suggestions from CRM - Marketing team and Admin
router.get('/suggestions', authenticateToken, requireRole(['admin', 'marketing']), async (req, res) => {
  const db = require('../config/db');
  try {
    const [rows] = await db.query("SELECT * FROM marketing_suggestions WHERE status != 'dismissed' ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.put('/suggestions/:id', authenticateToken, requireRole(['admin', 'marketing']), async (req, res) => {
  const db = require('../config/db');
  const { status } = req.body;
  try {
    await db.query('UPDATE marketing_suggestions SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Suggestion updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
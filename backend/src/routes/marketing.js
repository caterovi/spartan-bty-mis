const express = require('express');
const router = express.Router();
const marketing = require('../controllers/marketingController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ─── CAMPAIGNS ────────────────────────────────────────────
// summary MUST be before /:id
router.get('/campaigns/summary',                  authenticateToken, requireRole(['admin','marketing']), marketing.getCampaignSummary);
router.get('/campaigns',                          authenticateToken, requireRole(['admin','marketing']), marketing.getCampaigns);
router.post('/campaigns',                         authenticateToken, requireRole(['admin','marketing']), marketing.addCampaign);

// Sub-routes under /:id (specific before wildcard /:id)
router.get('/campaigns/:id/tasks',                authenticateToken, requireRole(['admin','marketing']), marketing.getCampaignTasks);
router.post('/campaigns/:id/tasks',               authenticateToken, requireRole(['admin','marketing']), marketing.addCampaignTask);
router.put('/campaigns/:id/equipment',            authenticateToken, requireRole(['admin','marketing']), marketing.updateEquipment);
router.get('/campaigns/:id/products',             authenticateToken, requireRole(['admin','marketing']), marketing.getCampaignProducts);
router.post('/campaigns/:id/products',            authenticateToken, requireRole(['admin','marketing']), marketing.addCampaignProduct);
router.delete('/campaigns/:id/products/:productId', authenticateToken, requireRole(['admin','marketing']), marketing.removeCampaignProduct);
router.get('/campaigns/:id/materials',            authenticateToken, requireRole(['admin','marketing']), marketing.getCampaignMaterials);
router.post('/campaigns/:id/materials',           authenticateToken, requireRole(['admin','marketing']), marketing.addCampaignMaterial);
router.get('/campaigns/:id',                      authenticateToken, requireRole(['admin','marketing']), marketing.getCampaignById);
router.put('/campaigns/:id',                      authenticateToken, requireRole(['admin','marketing']), marketing.updateCampaignStatus);
router.delete('/campaigns/:id',                   authenticateToken, requireRole(['admin','marketing']), marketing.deleteCampaign);

// Campaign tasks (standalone)
router.put('/tasks/:id',                          authenticateToken, requireRole(['admin','marketing']), marketing.updateTask);
router.delete('/tasks/:id',                       authenticateToken, requireRole(['admin','marketing']), marketing.deleteTask);

// Campaign materials (standalone)
router.put('/materials/:materialId',              authenticateToken, requireRole(['admin','marketing']), marketing.updateCampaignMaterial);
router.delete('/materials/:materialId',           authenticateToken, requireRole(['admin','marketing']), marketing.deleteCampaignMaterial);

// ─── PERFORMANCE ──────────────────────────────────────────
router.get('/performance',                        authenticateToken, requireRole(['admin','marketing']), marketing.getPerformance);
router.post('/performance',                       authenticateToken, requireRole(['admin','marketing']), marketing.addPerformance);
router.get('/performance/summary',                authenticateToken, requireRole(['admin','marketing']), marketing.getPerformanceSummary);
router.get('/performance/sync-logs',              authenticateToken, requireRole(['admin','marketing']), marketing.getSyncLogs);
router.post('/performance/sync-log',              authenticateToken, requireRole(['admin','marketing']), marketing.addSyncLog);
router.post('/performance/import-csv',            authenticateToken, requireRole(['admin','marketing']), marketing.importCSV);
router.post('/performance/sync/:platform',        authenticateToken, requireRole(['admin','marketing']), marketing.syncPlatform);
router.get('/performance/:campaign_id',           authenticateToken, requireRole(['admin','marketing']), marketing.getPerformanceByCampaign);

// ─── PLATFORM ACCOUNTS ────────────────────────────────────
router.get('/platform-accounts',                  authenticateToken, requireRole(['admin','marketing']), marketing.getPlatformAccounts);
router.post('/platform-accounts',                 authenticateToken, requireRole(['admin','marketing']), marketing.addPlatformAccount);
router.put('/platform-accounts/:id',              authenticateToken, requireRole(['admin','marketing']), marketing.updatePlatformAccount);
router.delete('/platform-accounts/:id',           authenticateToken, requireRole(['admin','marketing']), marketing.deletePlatformAccount);

// ─── PROMOTIONS ───────────────────────────────────────────
router.get('/promotions/summary',                 authenticateToken, requireRole(['admin','marketing']), marketing.getPromotionsSummary);
router.get('/promotions',                         authenticateToken, requireRole(['admin','marketing']), marketing.getPromotions);
router.post('/promotions',                        authenticateToken, requireRole(['admin','marketing']), marketing.addPromotion);
router.put('/promotions/:id',                     authenticateToken, requireRole(['admin','marketing']), marketing.updatePromotion);
router.put('/promotions/:id/status',              authenticateToken, requireRole(['admin','marketing']), marketing.updatePromotionStatus);
router.delete('/promotions/:id',                  authenticateToken, requireRole(['admin','marketing']), marketing.deletePromotion);

// ─── LIVE SELLING ─────────────────────────────────────────
router.get('/live-selling',                       authenticateToken, requireRole(['admin','marketing']), marketing.getLiveSelling);
router.post('/live-selling',                      authenticateToken, requireRole(['admin','marketing']), marketing.addLiveSelling);
router.put('/live-selling/:id',                   authenticateToken, requireRole(['admin','marketing']), marketing.updateLiveSelling);
router.delete('/live-selling/:id',                authenticateToken, requireRole(['admin','marketing']), marketing.deleteLiveSelling);

// ─── CONTENT CREATION ─────────────────────────────────────
router.get('/content/summary',                    authenticateToken, requireRole(['admin','marketing']), marketing.getContentSummary);
router.get('/content/calendar',                   authenticateToken, requireRole(['admin','marketing']), marketing.getContentCalendar);
router.get('/content',                            authenticateToken, requireRole(['admin','marketing']), marketing.getContent);
router.post('/content',                           authenticateToken, requireRole(['admin','marketing']), marketing.addContent);
router.put('/content/:id',                        authenticateToken, requireRole(['admin','marketing']), marketing.updateContent);
router.delete('/content/:id',                     authenticateToken, requireRole(['admin','marketing']), marketing.deleteContent);
router.patch('/content/:id/status',               authenticateToken, requireRole(['admin','marketing']), marketing.patchContentStatus);
router.patch('/content/:id/approval',             authenticateToken, requireRole(['admin','marketing']), marketing.patchContentApproval);

// ─── SUGGESTIONS ──────────────────────────────────────────
router.get('/suggestions', authenticateToken, requireRole(['admin','marketing']), async (req, res) => {
  const db = require('../config/db');
  try {
    const [rows] = await db.query("SELECT * FROM marketing_suggestions WHERE status != 'dismissed' ORDER BY created_at DESC");
    res.json(rows);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
});

router.put('/suggestions/:id', authenticateToken, requireRole(['admin','marketing']), async (req, res) => {
  const db = require('../config/db');
  const { status } = req.body;
  try {
    await db.query('UPDATE marketing_suggestions SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Suggestion updated' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
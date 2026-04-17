const db = require('../config/db');

// ─── CAMPAIGNS (UPDATED) ──────────────────────────────────

exports.getCampaigns = async (req, res) => {
  try {
    const [campaigns] = await db.query('SELECT * FROM campaigns ORDER BY created_at DESC');
    // Get progress for each campaign
    for (const c of campaigns) {
      const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM campaign_tasks WHERE campaign_id = ?', [c.id]);
      const [[{ done }]]  = await db.query("SELECT COUNT(*) as done FROM campaign_tasks WHERE campaign_id = ? AND status = 'done'", [c.id]);
      c.total_tasks    = total;
      c.completed_tasks = done;
      c.progress = total > 0 ? Math.round((done / total) * 100) : 0;
    }
    res.json(campaigns);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getCampaignById = async (req, res) => {
  try {
    const [[campaign]] = await db.query('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM campaign_tasks WHERE campaign_id = ?', [req.params.id]);
    const [[{ done }]]  = await db.query("SELECT COUNT(*) as done FROM campaign_tasks WHERE campaign_id = ? AND status = 'done'", [req.params.id]);
    campaign.total_tasks     = total;
    campaign.completed_tasks = done;
    campaign.progress        = total > 0 ? Math.round((done / total) * 100) : 0;
    res.json(campaign);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addCampaign = async (req, res) => {
  const { title, description, platform, start_date, end_date, status } = req.body;
  try {
    await db.query(
      'INSERT INTO campaigns (title, description, platform, start_date, end_date, status) VALUES (?,?,?,?,?,?)',
      [title, description, platform, start_date, end_date, status || 'draft']
    );
    res.json({ message: 'Campaign created successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updateCampaignStatus = async (req, res) => {
  const { status, title, description, platform, start_date, end_date } = req.body;
  try {
    if (title) {
      await db.query(
        'UPDATE campaigns SET status=?, title=?, description=?, platform=?, start_date=?, end_date=? WHERE id=?',
        [status, title, description, platform, start_date, end_date, req.params.id]
      );
    } else {
      await db.query('UPDATE campaigns SET status=? WHERE id=?', [status, req.params.id]);
    }
    res.json({ message: 'Campaign updated successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getCampaignTasks = async (req, res) => {
  try {
    const [tasks] = await db.query(
      'SELECT * FROM campaign_tasks WHERE campaign_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addCampaignTask = async (req, res) => {
  const { category, title, description } = req.body;
  try {
    await db.query(
      'INSERT INTO campaign_tasks (campaign_id, category, title, description) VALUES (?,?,?,?)',
      [req.params.id, category, title, description || null]
    );
    res.json({ message: 'Task added' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updateTask = async (req, res) => {
  const { status, title, description } = req.body;
  try {
    await db.query(
      'UPDATE campaign_tasks SET status=?, title=?, description=? WHERE id=?',
      [status, title, description, req.params.id]
    );
    res.json({ message: 'Task updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deleteTask = async (req, res) => {
  try {
    await db.query('DELETE FROM campaign_tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.updateEquipment = async (req, res) => {
  const { equip_lights, equip_mic, equip_camera } = req.body;
  try {
    await db.query(
      'UPDATE campaigns SET equip_lights=?, equip_mic=?, equip_camera=? WHERE id=?',
      [equip_lights ? 1 : 0, equip_mic ? 1 : 0, equip_camera ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Equipment updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deleteCampaign = async (req, res) => {
  try {
    await db.query('DELETE FROM campaigns WHERE id = ?', [req.params.id]);
    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ─── PERFORMANCE ──────────────────────────────────────────

exports.getPerformance = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.title as campaign_title, c.platform
       FROM campaign_performance p
       JOIN campaigns c ON p.campaign_id = c.id
       ORDER BY p.date DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getPerformanceByCampaign = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM campaign_performance WHERE campaign_id = ? ORDER BY date DESC',
      [req.params.campaign_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addPerformance = async (req, res) => {
  const { campaign_id, date, impressions, clicks, conversions, spend, notes } = req.body;
  try {
    await db.query(
      'INSERT INTO campaign_performance (campaign_id, date, impressions, clicks, conversions, spend, notes) VALUES (?,?,?,?,?,?,?)',
      [campaign_id, date, impressions, clicks, conversions, spend, notes]
    );
    res.json({ message: 'Performance data added successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ─── PROMOTIONS ──────────────────────────────────────────

exports.getPromotions = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM promotions ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addPromotion = async (req, res) => {
  const { promo_code, description, discount_type, discount_value, min_order, start_date, end_date } = req.body;
  try {
    await db.query(
      'INSERT INTO promotions (promo_code, description, discount_type, discount_value, min_order, start_date, end_date) VALUES (?,?,?,?,?,?,?)',
      [promo_code, description, discount_type, discount_value, min_order, start_date, end_date]
    );
    res.json({ message: 'Promotion created successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updatePromotionStatus = async (req, res) => {
  try {
    await db.query('UPDATE promotions SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deletePromotion = async (req, res) => {
  try {
    await db.query('DELETE FROM promotions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ─── LIVE SELLING ─────────────────────────────────────────

exports.getLiveSelling = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM live_selling ORDER BY scheduled_date DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addLiveSelling = async (req, res) => {
  const { title, platform, scheduled_date, host, products_featured, target_sales, notes } = req.body;
  try {
    await db.query(
      'INSERT INTO live_selling (title, platform, scheduled_date, host, products_featured, target_sales, notes) VALUES (?,?,?,?,?,?,?)',
      [title, platform, scheduled_date, host, products_featured, target_sales, notes]
    );
    res.json({ message: 'Live selling event created' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updateLiveSelling = async (req, res) => {
  const { status, actual_sales, viewers, notes } = req.body;
  try {
    await db.query(
      'UPDATE live_selling SET status=?, actual_sales=?, viewers=?, notes=? WHERE id=?',
      [status, actual_sales, viewers, notes, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deleteLiveSelling = async (req, res) => {
  try {
    await db.query('DELETE FROM live_selling WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ─── CONTENT CREATION ────────────────────────────────────

exports.getContent = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM content_creation ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addContent = async (req, res) => {
  const { title, platform, content_type, assigned_to, due_date, notes } = req.body;
  try {
    await db.query(
      'INSERT INTO content_creation (title, platform, content_type, assigned_to, due_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [title, platform, content_type, assigned_to || null, due_date || null, notes || null]
    );
    res.json({ message: 'Content task created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateContent = async (req, res) => {
  const { status, views, likes, notes } = req.body;
  try {
    await db.query(
      'UPDATE content_creation SET status=?, views=?, likes=?, notes=? WHERE id=?',
      [status, views, likes, notes, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deleteContent = async (req, res) => {
  try {
    await db.query('DELETE FROM content_creation WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};
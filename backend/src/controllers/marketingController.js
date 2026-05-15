const db = require('../config/db');

// ─── CAMPAIGNS (FULLY UPDATED) ────────────────────────────

const logHistory = async (campaign_id, action, description, old_value, new_value, performed_by) => {
  try {
    await db.query(
      `INSERT INTO campaign_history (campaign_id, action, description, old_value, new_value, performed_by)
       VALUES (?,?,?,?,?,?)`,
      [campaign_id, action, description||null, old_value||null, new_value||null, performed_by||'System']
    );
  } catch(e){ console.error('History log error:', e.message); }
};

const computeDisplayStatus = (c) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(c.start_date); start.setHours(0,0,0,0);
  const end   = new Date(c.end_date);   end.setHours(0,0,0,0);
  if (['completed','cancelled'].includes(c.status)) return c.status;
  if (start > today) return 'upcoming';
  if (end < today)   return 'overdue';
  return 'ongoing';
};

exports.getCampaigns = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*,
        COUNT(ct.id)                              AS total_tasks,
        SUM(ct.status = 'done')                   AS completed_tasks
      FROM campaigns c
      LEFT JOIN campaign_tasks ct ON ct.campaign_id = c.id
      WHERE c.archived_at IS NULL
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    const data = rows.map(r => ({
      ...r,
      progress: r.total_tasks > 0 ? Math.round((r.completed_tasks / r.total_tasks) * 100) : 0,
      display_status: computeDisplayStatus(r),
    }));
    res.json(data);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.getCampaignSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0,10);
    const [[counts]] = await db.query(`
      SELECT
        COUNT(*) AS total_campaigns,
        SUM(status = 'in-progress') AS active_campaigns,
        SUM(approval_status = 'published') AS published_campaigns,
        SUM(approval_status = 'for-review') AS approval_pending,
        SUM(is_featured = 1) AS featured_campaigns
      FROM campaigns WHERE archived_at IS NULL
    `);
    const [[{ overdue_campaigns }]] = await db.query(`
      SELECT COUNT(*) AS overdue_campaigns FROM campaigns
      WHERE archived_at IS NULL AND end_date < ? AND status NOT IN ('completed','cancelled')
    `, [today]);

    const [progressRows] = await db.query(`
      SELECT c.id,
        COUNT(ct.id) AS total_tasks,
        SUM(ct.status='done') AS done_tasks
      FROM campaigns c
      LEFT JOIN campaign_tasks ct ON ct.campaign_id = c.id
      WHERE c.archived_at IS NULL
      GROUP BY c.id
    `);
    const avg = progressRows.length > 0
      ? Math.round(progressRows.reduce((s,r)=>s+(r.total_tasks>0?Math.round((r.done_tasks/r.total_tasks)*100):0),0) / progressRows.length)
      : 0;

    res.json({ ...counts, overdue_campaigns, average_progress: avg });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.getCampaignById = async (req, res) => {
  try {
    const [[campaign]] = await db.query('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const [[{ total_tasks }]]     = await db.query('SELECT COUNT(*) as total_tasks FROM campaign_tasks WHERE campaign_id = ?', [req.params.id]);
    const [[{ completed_tasks }]] = await db.query("SELECT COUNT(*) as completed_tasks FROM campaign_tasks WHERE campaign_id = ? AND status = 'done'", [req.params.id]);
    const [[{ total_materials }]] = await db.query('SELECT COUNT(*) as total_materials FROM campaign_materials WHERE campaign_id = ?', [req.params.id]);
    const [[{ approved_materials }]] = await db.query("SELECT COUNT(*) as approved_materials FROM campaign_materials WHERE campaign_id = ? AND status IN ('approved','published')", [req.params.id]);

    campaign.total_tasks       = total_tasks;
    campaign.completed_tasks   = completed_tasks;
    campaign.progress          = total_tasks > 0 ? Math.round((completed_tasks / total_tasks) * 100) : 0;
    campaign.total_materials   = total_materials;
    campaign.approved_materials = approved_materials;
    campaign.display_status    = computeDisplayStatus(campaign);

    res.json(campaign);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.addCampaign = async (req, res) => {
  const {
    title, description, platform, start_date, end_date, status,
    objective, target_audience, campaign_type, season_event, campaign_month,
    expected_outcome, priority, landing_headline, landing_subtitle,
    is_featured, publish_to_landing, performed_by,
  } = req.body;

  if (!title?.trim()) return res.status(400).json({ message: 'Campaign title is required.' });
  if (!start_date)    return res.status(400).json({ message: 'Start date is required.' });
  if (!end_date)      return res.status(400).json({ message: 'End date is required.' });
  if (new Date(end_date) < new Date(start_date))
    return res.status(400).json({ message: 'End date cannot be earlier than start date.' });

  try {
    const [result] = await db.query(
      `INSERT INTO campaigns
        (title, description, platform, start_date, end_date, status,
         objective, target_audience, campaign_type, season_event, campaign_month,
         expected_outcome, priority, landing_headline, landing_subtitle,
         is_featured, publish_to_landing)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        title.trim(), description||null, platform||'facebook',
        start_date, end_date, status||'draft',
        objective||null, target_audience||null, campaign_type||null,
        season_event||null, campaign_month||null, expected_outcome||null,
        priority||'medium', landing_headline||null, landing_subtitle||null,
        is_featured?1:0, publish_to_landing?1:0,
      ]
    );
    await logHistory(result.insertId, 'Campaign Created',
      `Campaign "${title}" created.`, null, status||'draft', performed_by||'Marketing Staff');
    res.json({ message: 'Campaign created successfully', id: result.insertId });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updateCampaignStatus = async (req, res) => {
  const {
    status, title, description, platform, start_date, end_date,
    objective, target_audience, campaign_type, season_event, campaign_month,
    expected_outcome, priority, landing_headline, landing_subtitle,
    is_featured, publish_to_landing, approval_status, review_comments,
    approved_by, performed_by,
  } = req.body;
  const { id } = req.params;

  if (start_date && end_date && new Date(end_date) < new Date(start_date))
    return res.status(400).json({ message: 'End date cannot be earlier than start date.' });

  try {
    const [[prev]] = await db.query('SELECT * FROM campaigns WHERE id = ?', [id]);
    if (!prev) return res.status(404).json({ message: 'Campaign not found' });

    // If only status is sent (legacy behavior)
    if (status && !title) {
      await db.query('UPDATE campaigns SET status=? WHERE id=?', [status, id]);
      if (status !== prev.status)
        await logHistory(id, 'Status Changed', `Status changed from "${prev.status}" to "${status}".`, prev.status, status, performed_by||'System');
      return res.json({ message: 'Campaign updated successfully' });
    }

    // Set approved_at if approval_status flips to approved
    const finalApprovedAt = approval_status === 'approved' && prev.approval_status !== 'approved'
      ? new Date() : (prev.approved_at || null);
    const finalApprovedBy = approval_status === 'approved' ? (approved_by||prev.approved_by||'System') : (prev.approved_by||null);

    await db.query(
      `UPDATE campaigns SET
        title=?, description=?, platform=?, start_date=?, end_date=?, status=?,
        objective=?, target_audience=?, campaign_type=?, season_event=?, campaign_month=?,
        expected_outcome=?, priority=?, landing_headline=?, landing_subtitle=?,
        is_featured=?, publish_to_landing=?, approval_status=?, review_comments=?,
        approved_by=?, approved_at=?
       WHERE id=?`,
      [
        title||prev.title, description||prev.description, platform||prev.platform,
        start_date||prev.start_date, end_date||prev.end_date, status||prev.status,
        objective||prev.objective, target_audience||prev.target_audience,
        campaign_type||prev.campaign_type, season_event||prev.season_event,
        campaign_month||prev.campaign_month, expected_outcome||prev.expected_outcome,
        priority||prev.priority, landing_headline||prev.landing_headline,
        landing_subtitle||prev.landing_subtitle,
        is_featured !== undefined ? (is_featured?1:0) : prev.is_featured,
        publish_to_landing !== undefined ? (publish_to_landing?1:0) : prev.publish_to_landing,
        approval_status||prev.approval_status, review_comments||prev.review_comments,
        finalApprovedBy, finalApprovedAt,
        id,
      ]
    );

    if (status && status !== prev.status)
      await logHistory(id, 'Status Changed', `Status: "${prev.status}" → "${status}"`, prev.status, status, performed_by||'System');
    if (approval_status && approval_status !== prev.approval_status)
      await logHistory(id, 'Approval Status Changed', `Approval: "${prev.approval_status}" → "${approval_status}"`, prev.approval_status, approval_status, performed_by||'System');

    res.json({ message: 'Campaign updated successfully' });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.deleteCampaign = async (req, res) => {
  try {
    await db.query('UPDATE campaigns SET archived_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ message: 'Campaign archived successfully' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ─── CAMPAIGN TASKS (unchanged) ───────────────────────────

exports.getCampaignTasks = async (req, res) => {
  try {
    const [tasks] = await db.query(
      'SELECT * FROM campaign_tasks WHERE campaign_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(tasks);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.addCampaignTask = async (req, res) => {
  const { category, title, description } = req.body;
  try {
    await db.query(
      'INSERT INTO campaign_tasks (campaign_id, category, title, description) VALUES (?,?,?,?)',
      [req.params.id, category, title, description||null]
    );
    res.json({ message: 'Task added' });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updateTask = async (req, res) => {
  const { status, title, description } = req.body;
  try {
    await db.query(
      'UPDATE campaign_tasks SET status=?, title=?, description=? WHERE id=?',
      [status, title, description, req.params.id]
    );
    res.json({ message: 'Task updated' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.deleteTask = async (req, res) => {
  try {
    await db.query('DELETE FROM campaign_tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.updateEquipment = async (req, res) => {
  const { equip_lights, equip_mic, equip_camera } = req.body;
  try {
    await db.query(
      'UPDATE campaigns SET equip_lights=?, equip_mic=?, equip_camera=? WHERE id=?',
      [equip_lights?1:0, equip_mic?1:0, equip_camera?1:0, req.params.id]
    );
    res.json({ message: 'Equipment updated' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ─── CAMPAIGN PRODUCTS ────────────────────────────────────

exports.getCampaignProducts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT cp.*,
        ii.name, ii.item_code, ii.quantity, ii.reorder_level, ii.status AS stock_status,
        ii.category, ii.product_type
      FROM campaign_products cp
      JOIN inventory_items ii ON cp.inventory_item_id = ii.id
      WHERE cp.campaign_id = ?
      ORDER BY cp.created_at ASC
    `, [req.params.id]);

    const data = rows.map(r => {
      let suggestion = 'Available for campaign';
      if (r.status === 'out-of-stock') suggestion = '⚠️ Out of stock — consider removing';
      else if (r.status === 'low-stock') suggestion = '⚠️ Low stock warning';
      else if (r.quantity > r.reorder_level * 3) suggestion = '✓ High stock — great for Buy 1 Take 1 / bundle / discount';
      return { ...r, suggestion };
    });
    res.json(data);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.addCampaignProduct = async (req, res) => {
  const { inventory_item_id, promo_role, notes } = req.body;
  if (!inventory_item_id) return res.status(400).json({ message: 'Inventory item is required.' });
  try {
    // Prevent duplicate
    const [[dup]] = await db.query(
      'SELECT id FROM campaign_products WHERE campaign_id=? AND inventory_item_id=?',
      [req.params.id, inventory_item_id]
    );
    if (dup) return res.status(400).json({ message: 'This product is already added to the campaign.' });

    await db.query(
      'INSERT INTO campaign_products (campaign_id, inventory_item_id, promo_role, notes) VALUES (?,?,?,?)',
      [req.params.id, inventory_item_id, promo_role||'main_product', notes||null]
    );
    await logHistory(req.params.id, 'Product Added',
      `Inventory item #${inventory_item_id} added as ${promo_role||'main_product'}.`);
    res.json({ message: 'Product added to campaign' });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.removeCampaignProduct = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM campaign_products WHERE campaign_id=? AND id=?',
      [req.params.id, req.params.productId]
    );
    await logHistory(req.params.id, 'Product Removed', `Campaign product #${req.params.productId} removed.`);
    res.json({ message: 'Product removed from campaign' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ─── CAMPAIGN MATERIALS ───────────────────────────────────

exports.getCampaignMaterials = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM campaign_materials WHERE campaign_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.addCampaignMaterial = async (req, res) => {
  const {
    material_type, title, description, file_url, caption, hashtags,
    platform, call_to_action, status, assigned_to, due_date,
    scheduled_date, publish_to_landing,
  } = req.body;

  if (!title?.trim())    return res.status(400).json({ message: 'Material title is required.' });
  if (!material_type)    return res.status(400).json({ message: 'Material type is required.' });

  const canPublish = ['approved','scheduled','published'].includes(status);
  const finalPublish = publish_to_landing && canPublish ? 1 : 0;

  try {
    await db.query(
      `INSERT INTO campaign_materials
        (campaign_id, material_type, title, description, file_url, caption, hashtags,
         platform, call_to_action, status, assigned_to, due_date, scheduled_date, publish_to_landing)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.params.id, material_type, title.trim(), description||null,
        file_url||null, caption||null, hashtags||null,
        platform||null, call_to_action||null, status||'draft',
        assigned_to||null, due_date||null, scheduled_date||null, finalPublish,
      ]
    );
    await logHistory(req.params.id, 'Material Added',
      `Material "${title}" (${material_type}) added.`);
    res.json({ message: 'Material added successfully' });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updateCampaignMaterial = async (req, res) => {
  const {
    material_type, title, description, file_url, caption, hashtags,
    platform, call_to_action, status, assigned_to, due_date,
    scheduled_date, publish_to_landing, review_comments, approved_by,
  } = req.body;
  const { materialId } = req.params;

  try {
    const [[prev]] = await db.query('SELECT * FROM campaign_materials WHERE id=?', [materialId]);
    if (!prev) return res.status(404).json({ message: 'Material not found' });

    const canPublish = ['approved','scheduled','published'].includes(status||prev.status);
    const finalPublish = publish_to_landing !== undefined
      ? (publish_to_landing && canPublish ? 1 : 0)
      : prev.publish_to_landing;

    const finalApprovedAt = status === 'approved' && prev.status !== 'approved' ? new Date() : (prev.approved_at||null);
    const finalApprovedBy = status === 'approved' ? (approved_by||prev.approved_by||'System') : (prev.approved_by||null);

    await db.query(
      `UPDATE campaign_materials SET
        material_type=?, title=?, description=?, file_url=?, caption=?, hashtags=?,
        platform=?, call_to_action=?, status=?, assigned_to=?, due_date=?,
        scheduled_date=?, publish_to_landing=?, review_comments=?,
        approved_by=?, approved_at=?
       WHERE id=?`,
      [
        material_type||prev.material_type, title||prev.title,
        description||prev.description, file_url||prev.file_url,
        caption||prev.caption, hashtags||prev.hashtags,
        platform||prev.platform, call_to_action||prev.call_to_action,
        status||prev.status, assigned_to||prev.assigned_to,
        due_date||prev.due_date, scheduled_date||prev.scheduled_date,
        finalPublish, review_comments||prev.review_comments,
        finalApprovedBy, finalApprovedAt,
        materialId,
      ]
    );
    await logHistory(prev.campaign_id, 'Material Updated', `Material "${title||prev.title}" updated.`);
    res.json({ message: 'Material updated' });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.deleteCampaignMaterial = async (req, res) => {
  try {
    const [[mat]] = await db.query('SELECT * FROM campaign_materials WHERE id=?', [req.params.materialId]);
    if (!mat) return res.status(404).json({ message: 'Material not found' });
    await db.query('DELETE FROM campaign_materials WHERE id=?', [req.params.materialId]);
    await logHistory(mat.campaign_id, 'Material Deleted', `Material "${mat.title}" deleted.`);
    res.json({ message: 'Material deleted' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ─── PERFORMANCE (EXTENDED) ───────────────────────────────

exports.getPerformance = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.title as campaign_title, c.platform as campaign_platform
       FROM campaign_performance p
       JOIN campaigns c ON p.campaign_id = c.id
       ORDER BY p.date DESC`
    );
    // Use campaign platform as fallback if row platform is null
    const data = rows.map(r => ({
      ...r,
      platform: r.platform || r.campaign_platform || '—',
    }));
    res.json(data);
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
  const {
    campaign_id, platform, date,
    impressions, reach, views, clicks,
    conversions, orders, revenue, spend,
    source_type, content_type,
    external_campaign_id, external_ad_id,
    platform_account_id, notes, created_by,
  } = req.body;

  // Calculated fields — guard divide-by-zero
  const imp  = Number(impressions) || 0;
  const clk  = Number(clicks)      || 0;
  const con  = Number(conversions) || 0;
  const spd  = Number(spend)       || 0;
  const rev  = Number(revenue)     || 0;

  const ctr             = imp  > 0 ? ((clk / imp)  * 100).toFixed(4) : 0;
  const cpc             = clk  > 0 ? (spd  / clk).toFixed(2)         : 0;
  const cpm             = imp  > 0 ? ((spd  / imp)  * 1000).toFixed(2): 0;
  const conversion_rate = clk  > 0 ? ((con  / clk)  * 100).toFixed(4) : 0;
  const roas            = spd  > 0 ? (rev   / spd).toFixed(4)          : 0;

  try {
    await db.query(
      `INSERT INTO campaign_performance
        (campaign_id, platform, date, impressions, reach, views, clicks, ctr, cpc, cpm,
         conversions, conversion_rate, orders, revenue, roas, spend,
         source_type, content_type, external_campaign_id, external_ad_id,
         platform_account_id, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        campaign_id, platform || null, date,
        imp, Number(reach)||0, Number(views)||0, clk, ctr, cpc, cpm,
        con, conversion_rate, Number(orders)||0, rev, roas, spd,
        source_type || 'manual', content_type || null,
        external_campaign_id || null, external_ad_id || null,
        platform_account_id || null, notes || null, created_by || null,
      ]
    );
    res.json({ message: 'Performance data added successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.getPerformanceSummary = async (req, res) => {
  try {
    const [[summary]] = await db.query(`
      SELECT
        SUM(impressions)   AS total_impressions,
        SUM(reach)         AS total_reach,
        SUM(views)         AS total_views,
        SUM(clicks)        AS total_clicks,
        SUM(conversions)   AS total_conversions,
        SUM(spend)         AS total_spend,
        SUM(orders)        AS total_orders,
        SUM(revenue)       AS total_revenue,
        CASE WHEN SUM(impressions) > 0
          THEN ROUND((SUM(clicks) / SUM(impressions)) * 100, 2)
          ELSE 0 END AS overall_ctr,
        CASE WHEN SUM(spend) > 0
          THEN ROUND(SUM(revenue) / SUM(spend), 4)
          ELSE 0 END AS overall_roas
      FROM campaign_performance
    `);

    // Top platform by impressions
    const [platforms] = await db.query(`
      SELECT platform, SUM(impressions) as total
      FROM campaign_performance
      WHERE platform IS NOT NULL
      GROUP BY platform ORDER BY total DESC LIMIT 1
    `);

    // Best campaign by revenue
    const [bestCampaign] = await db.query(`
      SELECT c.title, SUM(p.revenue) as total_revenue
      FROM campaign_performance p
      JOIN campaigns c ON p.campaign_id = c.id
      GROUP BY p.campaign_id, c.title
      ORDER BY total_revenue DESC LIMIT 1
    `);

    res.json({
      ...summary,
      top_platform:   platforms[0]?.platform    || '—',
      best_campaign:  bestCampaign[0]?.title    || '—',
    });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ─── PLATFORM ACCOUNTS ───────────────────────────────────

exports.getPlatformAccounts = async (req, res) => {
  try {
    // Never return tokens to frontend
    const [rows] = await db.query(
      `SELECT id, user_id, platform, account_name, external_account_id,
              status, connected_by, last_synced_at, created_at, updated_at
       FROM marketing_platform_accounts ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addPlatformAccount = async (req, res) => {
  const { platform, account_name, external_account_id, connected_by } = req.body;
  try {
    await db.query(
      `INSERT INTO marketing_platform_accounts
        (platform, account_name, external_account_id, status, connected_by)
       VALUES (?,?,?,'pending',?)`,
      [platform, account_name, external_account_id || null, connected_by || null]
    );
    res.json({ message: 'Account connected successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updatePlatformAccount = async (req, res) => {
  const { status, account_name, external_account_id } = req.body;
  try {
    await db.query(
      `UPDATE marketing_platform_accounts
       SET status=?, account_name=?, external_account_id=? WHERE id=?`,
      [status, account_name, external_account_id || null, req.params.id]
    );
    res.json({ message: 'Account updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deletePlatformAccount = async (req, res) => {
  try {
    await db.query('DELETE FROM marketing_platform_accounts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Account disconnected' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ─── SYNC LOGS ────────────────────────────────────────────

exports.getSyncLogs = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM marketing_sync_logs ORDER BY synced_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addSyncLog = async (req, res) => {
  const { platform_account_id, platform, sync_type, status, records_imported, error_message, synced_by } = req.body;
  try {
    await db.query(
      `INSERT INTO marketing_sync_logs
        (platform_account_id, platform, sync_type, status, records_imported, error_message, synced_by)
       VALUES (?,?,?,?,?,?,?)`,
      [platform_account_id||null, platform, sync_type||'manual', status||'pending', records_imported||0, error_message||null, synced_by||null]
    );
    res.json({ message: 'Sync log recorded' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ─── MOCK API SYNC ────────────────────────────────────────
exports.syncPlatform = async (req, res) => {
  const { platform } = req.params;
  const { account_id, synced_by } = req.body;

  try {
    // Log the sync attempt
    await db.query(
      `INSERT INTO marketing_sync_logs
        (platform_account_id, platform, sync_type, status, records_imported, error_message, synced_by)
       VALUES (?,?,?,?,?,?,?)`,
      [
        account_id || null,
        platform,
        'api_sync',
        'pending',
        0,
        null,
        synced_by || 'system',
      ]
    );

    // TODO: Replace this block with real API calls when credentials are available
    // For TikTok: https://business-api.tiktok.com/open_api/
    // For Shopee: https://open.shopee.com/
    // For Meta: https://graph.facebook.com/

    res.json({
      success: false,
      message: `API sync structure is ready. External API credentials are required for live synchronization with ${platform}.`,
      platform,
      status: 'pending',
    });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ─── CSV IMPORT (structure ready) ────────────────────────
exports.importCSV = async (req, res) => {
  // TODO: Implement CSV parsing with 'csv-parse' or 'papaparse' on Node side
  // Expected columns: campaign_id, platform, date, impressions, reach, views,
  //   clicks, conversions, orders, revenue, spend, notes
  // Validate each row before insert
  // Return { imported: N, skipped: N, errors: [] }

  res.json({
    success: false,
    message: 'CSV import endpoint is ready. Full parsing implementation coming in next phase.',
    imported: 0,
    skipped: 0,
    errors: [],
  });
};


// ─── PROMOTIONS ───────────────────────────────────────────

// Helper: compute live status
const computeStatus = (p) => {
  const now = new Date();
  const end = new Date(p.end_date);
  const start = new Date(p.start_date);
  if (end < now) return 'expired';
  if (start > now) return 'inactive';
  return p.status === 'inactive' ? 'inactive' : 'active';
};

exports.getPromotions = async (req, res) => {
  try {
    // Auto-expire past promos
    await db.query(
      `UPDATE promotions SET status = 'expired'
       WHERE end_date < CURDATE() AND status != 'expired'`
    );
    const [rows] = await db.query(`
      SELECT p.*,
             c.title AS campaign_name
      FROM promotions p
      LEFT JOIN campaigns c ON p.campaign_id = c.id
      ORDER BY p.created_at DESC
    `);
    const data = rows.map(p => ({
      ...p,
      computed_status: computeStatus(p),
      is_expiring_soon: (() => {
        const end = new Date(p.end_date);
        const now = new Date();
        const diff = (end - now) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7 && p.status === 'active';
      })(),
    }));
    res.json(data);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addPromotion = async (req, res) => {
  const {
    promo_code, description, discount_type, discount_value,
    min_order, start_date, end_date,
    campaign_id, usage_limit, per_customer_limit,
    max_discount_cap, is_featured,
  } = req.body;

  // Validation
  if (!promo_code?.trim()) return res.status(400).json({ message: 'Promo code is required.' });
  if (!['percentage', 'fixed'].includes(discount_type))
    return res.status(400).json({ message: 'Invalid discount type.' });
  if (!discount_value || Number(discount_value) <= 0)
    return res.status(400).json({ message: 'Discount value must be greater than 0.' });
  if (discount_type === 'percentage' && Number(discount_value) > 100)
    return res.status(400).json({ message: 'Percentage discount cannot exceed 100%.' });
  if (!start_date || !end_date)
    return res.status(400).json({ message: 'Start and end dates are required.' });
  if (new Date(end_date) < new Date(start_date))
    return res.status(400).json({ message: 'End date cannot be earlier than start date.' });
  if (Number(min_order) < 0)
    return res.status(400).json({ message: 'Minimum order cannot be negative.' });

  try {
    await db.query(
      `INSERT INTO promotions
        (promo_code, description, discount_type, discount_value, min_order,
         start_date, end_date, campaign_id, usage_limit, per_customer_limit,
         max_discount_cap, is_featured)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        promo_code.trim().toUpperCase(), description || null,
        discount_type, discount_value, min_order || 0,
        start_date, end_date,
        campaign_id || null, usage_limit || null,
        per_customer_limit || 1, max_discount_cap || null,
        is_featured ? 1 : 0,
      ]
    );
    res.json({ message: 'Promotion created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: `Promo code "${promo_code.toUpperCase()}" already exists.` });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updatePromotion = async (req, res) => {
  const {
    promo_code, description, discount_type, discount_value,
    min_order, start_date, end_date, status,
    campaign_id, usage_limit, per_customer_limit,
    max_discount_cap, is_featured,
  } = req.body;

  if (discount_type === 'percentage' && Number(discount_value) > 100)
    return res.status(400).json({ message: 'Percentage discount cannot exceed 100%.' });
  if (start_date && end_date && new Date(end_date) < new Date(start_date))
    return res.status(400).json({ message: 'End date cannot be earlier than start date.' });

  try {
    await db.query(
      `UPDATE promotions SET
        promo_code=?, description=?, discount_type=?, discount_value=?,
        min_order=?, start_date=?, end_date=?, status=?,
        campaign_id=?, usage_limit=?, per_customer_limit=?,
        max_discount_cap=?, is_featured=?
       WHERE id=?`,
      [
        promo_code?.trim().toUpperCase(), description || null,
        discount_type, discount_value, min_order || 0,
        start_date, end_date, status || 'active',
        campaign_id || null, usage_limit || null,
        per_customer_limit || 1, max_discount_cap || null,
        is_featured ? 1 : 0,
        req.params.id,
      ]
    );
    res.json({ message: 'Promotion updated successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Promo code already exists.' });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePromotionStatus = async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive', 'expired'].includes(status))
    return res.status(400).json({ message: 'Invalid status.' });
  try {
    if (status === 'active') {
      const [[promo]] = await db.query('SELECT end_date FROM promotions WHERE id=?', [req.params.id]);
      if (promo && new Date(promo.end_date) < new Date())
        return res.status(400).json({ message: 'Cannot activate an expired promotion.' });
    }
    await db.query('UPDATE promotions SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deletePromotion = async (req, res) => {
  try {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) as count FROM promotion_redemptions WHERE promotion_id=?',
      [req.params.id]
    );
    if (count > 0) {
      // Soft delete — deactivate instead
      await db.query("UPDATE promotions SET status='inactive' WHERE id=?", [req.params.id]);
      return res.json({ message: 'Promotion has redemptions. It has been deactivated instead of deleted.' });
    }
    await db.query('DELETE FROM promotions WHERE id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getPromotionsSummary = async (req, res) => {
  try {
    const [[counts]] = await db.query(`
      SELECT
        SUM(status = 'active') AS activePromos,
        SUM(status = 'inactive') AS inactivePromos,
        SUM(status = 'expired') AS expiredPromos,
        SUM(is_featured = 1) AS featuredPromos,
        SUM(total_redemptions) AS totalRedemptions,
        SUM(total_discount_given) AS totalDiscountGiven,
        SUM(sales_generated) AS totalSalesGenerated
      FROM promotions
    `);
    const [[{ expiringSoon }]] = await db.query(`
      SELECT COUNT(*) AS expiringSoon FROM promotions
      WHERE status='active'
        AND end_date >= CURDATE()
        AND end_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);
    res.json({ ...counts, expiringSoon });
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
  const {
    title, description, platform, scheduled_date,
    host, products_featured, target_sales, notes, live_url,
  } = req.body;
  try {
    await db.query(
      `INSERT INTO live_selling
        (title, description, platform, scheduled_date, host, products_featured, target_sales, notes, live_url)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [title, description || null, platform, scheduled_date, host, products_featured, target_sales, notes, live_url || null]
    );
    res.json({ message: 'Live selling event created' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updateLiveSelling = async (req, res) => {
  const {
    status, actual_sales, viewers, notes,
    total_views, total_clicks, total_impressions,
    engagement_rate, is_featured, live_url, description,
  } = req.body;
  try {
    await db.query(
      `UPDATE live_selling SET
        status=?, actual_sales=?, viewers=?, notes=?,
        total_views=?, total_clicks=?, total_impressions=?,
        engagement_rate=?, is_featured=?, live_url=?, description=?
       WHERE id=?`,
      [
        status, actual_sales, viewers, notes,
        total_views || 0, total_clicks || 0, total_impressions || 0,
        engagement_rate || 0, is_featured ? 1 : 0,
        live_url || null, description || null,
        req.params.id,
      ]
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

const computeDueStatus = (due_date, status) => {
  if (status === 'published') return 'Completed';
  if (!due_date) return 'No Due Date';
  const now = new Date(); now.setHours(0,0,0,0);
  const due = new Date(due_date); due.setHours(0,0,0,0);
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Due Today';
  if (diff <= 3) return 'Due Soon';
  return 'Scheduled';
};

const calcEngagement = (row) => {
  const v = Number(row.views) || 0;
  if (v === 0) return 0;
  const interactions = (Number(row.likes)||0) + (Number(row.comments)||0) +
    (Number(row.shares)||0) + (Number(row.saves)||0) + (Number(row.clicks)||0);
  return Number(((interactions / v) * 100).toFixed(4));
};

exports.getContent = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT cc.*,
             c.title  AS campaign_name,
             p.promo_code AS promotion_name
      FROM content_creation cc
      LEFT JOIN campaigns c   ON cc.campaign_id  = c.id
      LEFT JOIN promotions p  ON cc.promotion_id = p.id
      ORDER BY cc.created_at DESC
    `);
    const data = rows.map(r => ({
      ...r,
      due_status: computeDueStatus(r.due_date, r.status),
      engagement_rate: calcEngagement(r),
    }));
    res.json(data);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addContent = async (req, res) => {
  const {
    title, platform, content_type, objective, target_audience,
    assigned_to, assigned_employee_id, due_date, notes,
    caption, hashtags, call_to_action,
    campaign_id, promotion_id,
    reviewer_id, review_comments, revision_notes,
  } = req.body;
  try {
    await db.query(
      `INSERT INTO content_creation
        (title, platform, content_type, objective, target_audience,
         assigned_to, assigned_employee_id, due_date, notes,
         caption, hashtags, call_to_action,
         campaign_id, promotion_id,
         reviewer_id, review_comments, revision_notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        title, platform, content_type, objective||null, target_audience||null,
        assigned_to||null, assigned_employee_id||null, due_date||null, notes||null,
        caption||null, hashtags||null, call_to_action||null,
        campaign_id||null, promotion_id||null,
        reviewer_id||null, review_comments||null, revision_notes||null,
      ]
    );
    res.json({ message: 'Content task created' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updateContent = async (req, res) => {
  const {
    title, platform, content_type, objective, target_audience,
    assigned_to, assigned_employee_id, due_date, notes,
    caption, hashtags, call_to_action,
    campaign_id, promotion_id,
    status, reviewer_id, review_comments, revision_notes,
    approved_by, approved_at,
    published_url,
    views, likes, comments, shares, saves, clicks, conversions, revenue_impact,
  } = req.body;

  const v = Number(views)||0;
  const interactions = (Number(likes)||0)+(Number(comments)||0)+
    (Number(shares)||0)+(Number(saves)||0)+(Number(clicks)||0);
  const engagement_rate = v > 0 ? ((interactions/v)*100).toFixed(4) : 0;

  try {
    await db.query(
      `UPDATE content_creation SET
        title=?, platform=?, content_type=?, objective=?, target_audience=?,
        assigned_to=?, assigned_employee_id=?, due_date=?, notes=?,
        caption=?, hashtags=?, call_to_action=?,
        campaign_id=?, promotion_id=?,
        status=?, reviewer_id=?, review_comments=?, revision_notes=?,
        approved_by=?, approved_at=?,
        published_url=?,
        views=?, likes=?, comments=?, shares=?, saves=?, clicks=?,
        conversions=?, revenue_impact=?, engagement_rate=?
       WHERE id=?`,
      [
        title, platform, content_type, objective||null, target_audience||null,
        assigned_to||null, assigned_employee_id||null, due_date||null, notes||null,
        caption||null, hashtags||null, call_to_action||null,
        campaign_id||null, promotion_id||null,
        status||'idea', reviewer_id||null, review_comments||null, revision_notes||null,
        approved_by||null, approved_at||null,
        published_url||null,
        v, Number(likes)||0, Number(comments)||0, Number(shares)||0,
        Number(saves)||0, Number(clicks)||0,
        Number(conversions)||0, Number(revenue_impact)||0, engagement_rate,
        req.params.id,
      ]
    );
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.deleteContent = async (req, res) => {
  try {
    await db.query('DELETE FROM content_creation WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getContentSummary = async (req, res) => {
  try {
    const [[counts]] = await db.query(`
      SELECT
        COUNT(*) AS total_content_tasks,
        SUM(status='idea') AS idea_count,
        SUM(status='in-progress') AS in_progress_count,
        SUM(status='for-review') AS for_review_count,
        SUM(status='approved') AS approved_count,
        SUM(status='published') AS published_count,
        SUM(status='published' AND MONTH(updated_at)=MONTH(NOW()) AND YEAR(updated_at)=YEAR(NOW())) AS published_this_month
      FROM content_creation
    `);

    // Overdue: due_date < today, status not published/cancelled
    const [[{ overdue_count }]] = await db.query(`
      SELECT COUNT(*) AS overdue_count FROM content_creation
      WHERE due_date < CURDATE() AND status NOT IN ('published','cancelled')
    `);
    const [[{ due_today_count }]] = await db.query(`
      SELECT COUNT(*) AS due_today_count FROM content_creation
      WHERE due_date = CURDATE() AND status NOT IN ('published','cancelled')
    `);
    const [[{ due_soon_count }]] = await db.query(`
      SELECT COUNT(*) AS due_soon_count FROM content_creation
      WHERE due_date > CURDATE() AND due_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
      AND status NOT IN ('published','cancelled')
    `);

    res.json({ ...counts, overdue_count, due_today_count, due_soon_count });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getContentCalendar = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT cc.*,
             c.title    AS campaign_name,
             p.promo_code AS promotion_name
      FROM content_creation cc
      LEFT JOIN campaigns c  ON cc.campaign_id  = c.id
      LEFT JOIN promotions p ON cc.promotion_id = p.id
      ORDER BY cc.due_date ASC, cc.created_at DESC
    `);
    const data = rows.map(r => ({
      ...r,
      due_status: computeDueStatus(r.due_date, r.status),
    }));
    res.json(data);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.patchContentStatus = async (req, res) => {
  const { status, approved_by } = req.body;
  try {
    if (status === 'approved') {
      await db.query(
        `UPDATE content_creation SET status=?, approved_by=?, approved_at=NOW() WHERE id=?`,
        [status, approved_by || 'System', req.params.id]
      );
    } else {
      await db.query('UPDATE content_creation SET status=? WHERE id=?', [status, req.params.id]);
    }
    res.json({ message: 'Status updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.patchContentApproval = async (req, res) => {
  const { approved_by, review_comments, revision_notes } = req.body;
  try {
    await db.query(
      `UPDATE content_creation SET
        status='approved', approved_by=?, approved_at=NOW(),
        review_comments=?, revision_notes=?
       WHERE id=?`,
      [approved_by||'System', review_comments||null, revision_notes||null, req.params.id]
    );
    res.json({ message: 'Approved' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};
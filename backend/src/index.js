const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://spartan-bty-mis.vercel.app',
    // Add your Vercel domain here if different
  ],
  credentials: true
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Multer config for receipt uploads
const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/receipts'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `receipt-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];

    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, and PDF files are allowed'));
  },
});

// ── PUBLIC ROUTES (no auth) ──────────────────────────────────────────────────
const db = require('./config/db');

app.get('/api/public/landing-stats', async (req, res) => {
  try {
    const [[usersRow]] = await db.query(
      `SELECT COUNT(*) AS total_users FROM users`
    );
    const [[ordersRow]] = await db.query(
      `SELECT COUNT(*) AS total_orders FROM orders`
    );
    const [[ratingRow]] = await db.query(
      `SELECT ROUND(AVG(rating), 1) AS avg_rating FROM feedback WHERE rating IS NOT NULL`
    );
    const [[shipmentsRow]] = await db.query(
      `SELECT COUNT(*) AS completed_shipments FROM shipments WHERE shipping_status = 'delivered'`
    );

    res.json({
      total_users:         Number(usersRow.total_users)          || 0,
      total_orders:        Number(ordersRow.total_orders)         || 0,
      avg_rating:          Number(ratingRow.avg_rating)           || 0,
      completed_shipments: Number(shipmentsRow.completed_shipments) || 0,
    });
  } catch (err) {
    console.error('Landing stats error:', err);
    res.status(500).json({ message: 'Failed to fetch landing stats.' });
  }
});
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/public/live-selling — no auth required
app.get('/api/public/live-selling', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id, title, description, platform, live_url, thumbnail_url,
        scheduled_date, status, viewers,
        total_views, total_clicks, total_impressions,
        engagement_rate, is_featured
      FROM live_selling
      WHERE
        status = 'live'
        OR status = 'scheduled'
        OR (status = 'completed' AND is_featured = TRUE)
      ORDER BY
        CASE status
          WHEN 'live'      THEN 1
          WHEN 'scheduled' THEN 2
          ELSE 3
        END ASC,
        scheduled_date ASC
      LIMIT 3
    `);

    // Normalize platform display names
    const platformMap = {
      tiktok: 'TikTok',
      shopee: 'Shopee',
      facebook: 'Facebook',
      instagram: 'Instagram',
      youtube: 'YouTube',
    };

    const data = rows.map(r => ({
      ...r,
      platform: platformMap[r.platform?.toLowerCase()] || r.platform,
      // Map MIS status values to landing page badge values
      status:
        r.status === 'live'      ? 'ongoing'  :
        r.status === 'scheduled' ? 'upcoming' :
        r.status === 'completed' ? 'ended'    : r.status,
      // Use viewers as fallback for total_views if not set
      total_views: r.total_views || r.viewers || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('Live selling public endpoint error:', err);
    res.status(500).json({ success: false, data: [] });
  }
});

// POST /api/sales/orders/validate-promo — validate promo before applying
app.post('/api/sales/orders/validate-promo', async (req, res) => {
  const { promo_code, order_total, customer_id } = req.body;
  if (!promo_code) return res.status(400).json({ valid: false, message: 'Promo code is required.' });

  try {
    const [[promo]] = await db.query(
      'SELECT * FROM promotions WHERE promo_code = ?',
      [promo_code.trim().toUpperCase()]
    );

    if (!promo) return res.json({ valid: false, message: 'Promo code not found.' });

    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);

    if (promo.status !== 'active') return res.json({ valid: false, message: 'This promo is not active.' });
    if (now < start) return res.json({ valid: false, message: 'This promo is not yet valid.' });
    if (now > end)   return res.json({ valid: false, message: 'This promo has expired.' });
    if (Number(order_total) < Number(promo.min_order))
      return res.json({ valid: false, message: `Minimum order of ₱${Number(promo.min_order).toLocaleString()} required.` });

    if (promo.usage_limit !== null && promo.total_redemptions >= promo.usage_limit)
      return res.json({ valid: false, message: 'This promo has reached its usage limit.' });

    if (customer_id && promo.per_customer_limit) {
      const [[{ used }]] = await db.query(
        'SELECT COUNT(*) as used FROM promotion_redemptions WHERE promotion_id=? AND customer_id=?',
        [promo.id, customer_id]
      );
      if (used >= promo.per_customer_limit)
        return res.json({ valid: false, message: 'You have already used this promo code.' });
    }

    // Calculate discount
    let discount_amount = 0;
    const total = Number(order_total);
    if (promo.discount_type === 'percentage') {
      discount_amount = (total * Number(promo.discount_value)) / 100;
      if (promo.max_discount_cap && discount_amount > Number(promo.max_discount_cap))
        discount_amount = Number(promo.max_discount_cap);
    } else {
      discount_amount = Number(promo.discount_value);
      if (discount_amount > total) discount_amount = total;
    }

    const final_total = Math.max(0, total - discount_amount);

    res.json({
      valid: true,
      promo_id: promo.id,
      promo_code: promo.promo_code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      discount_amount: Number(discount_amount.toFixed(2)),
      final_total: Number(final_total.toFixed(2)),
      message: 'Promo applied successfully.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, message: 'Server error.' });
  }
});

// GET /api/public/featured-promotions — no auth required
app.get('/api/public/featured-promotions', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, promo_code, description, discount_type, discount_value,
             min_order, start_date, end_date, max_discount_cap
      FROM promotions
      WHERE status = 'active'
        AND is_featured = TRUE
        AND start_date <= CURDATE()
        AND end_date >= CURDATE()
      ORDER BY created_at DESC
      LIMIT 6
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, data: [] });
  }
});

// GET /api/public/featured-campaigns — no auth required
app.get('/api/public/featured-campaigns', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [rows] = await db.query(`
      SELECT
        id, title, description, platform,
        objective, campaign_type, season_event,
        landing_headline, landing_subtitle,
        start_date, end_date,
        is_featured, approval_status
      FROM campaigns
      WHERE publish_to_landing = TRUE
        AND approval_status IN ('approved', 'published')
        AND archived_at IS NULL
        AND start_date <= ?
        AND end_date >= ?
      ORDER BY is_featured DESC, created_at DESC
      LIMIT 3
    `, [today, today]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Featured campaigns error:', err);
    res.status(500).json({ success: false, data: [] });
  }
});

// GET /api/public/landing-materials — no auth required
app.get('/api/public/landing-materials', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        cm.id, cm.campaign_id, cm.material_type, cm.title,
        cm.description, cm.file_url, cm.caption,
        cm.hashtags, cm.platform, cm.call_to_action,
        cm.status, cm.scheduled_date,
        c.title AS campaign_title,
        c.landing_headline, c.landing_subtitle
      FROM campaign_materials cm
      JOIN campaigns c ON cm.campaign_id = c.id
      WHERE cm.publish_to_landing = TRUE
        AND cm.status IN ('approved', 'scheduled', 'published')
        AND c.archived_at IS NULL
        AND c.approval_status IN ('approved', 'published')
      ORDER BY
        CASE cm.material_type
          WHEN 'landing_banner' THEN 1
          WHEN 'poster'         THEN 2
          WHEN 'cover_photo'    THEN 3
          ELSE 4
        END,
        cm.created_at DESC
      LIMIT 6
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Landing materials error:', err);
    res.status(500).json({ success: false, data: [] });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/marketing', require('./routes/marketing'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/logistics', require('./routes/logistics'));
app.use('/api/internal', require('./routes/internal'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'MIS for Spartan BTY Inc.' });
});

const { authenticateToken } = require('./middleware/auth');

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  const db = require('./config/db');

  try {
    const [[{ total_orders }]] = await db.query(
      'SELECT COUNT(*) as total_orders FROM orders'
    );
    const [[{ total_items }]] = await db.query(
      'SELECT COUNT(*) as total_items FROM inventory_items'
    );
    const [[{ total_employees }]] = await db.query(
      'SELECT COUNT(*) as total_employees FROM employees'
    );
    const [[{ total_feedback }]] = await db.query(
      'SELECT COUNT(*) as total_feedback FROM feedback'
    );

    const [top_products] = await db.query(`
      SELECT item_name, SUM(quantity) as total_sold, SUM(subtotal) as total_revenue
      FROM order_items
      JOIN orders ON order_items.order_id = orders.id
      WHERE orders.status != 'cancelled'
      GROUP BY item_name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    const [sales_trend] = await db.query(`
      SELECT DATE(order_date) as date, COUNT(*) as orders, SUM(total_amount) as revenue
      FROM orders
      WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      AND status != 'cancelled'
      GROUP BY DATE(order_date)
      ORDER BY date ASC
    `);

    const [low_stock] = await db.query(`
      SELECT name, item_code, quantity, reorder_level, status
      FROM inventory_items
      WHERE status IN ('low-stock', 'out-of-stock')
      ORDER BY quantity ASC
      LIMIT 5
    `);

    const [[{ pending_deliveries }]] = await db.query(`
      SELECT COUNT(*) as pending_deliveries
      FROM shipments
      WHERE shipping_status IN ('pending', 'shipped', 'in-transit')
    `);

    const [[{ avg_rating, total_ratings }]] = await db.query(`
      SELECT ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as total_ratings
      FROM feedback
    `);

    const [monthly_revenue] = await db.query(`
      SELECT DATE_FORMAT(order_date, '%Y-%m') as month,
             SUM(total_amount) as revenue,
             COUNT(*) as orders
      FROM orders
      WHERE status != 'cancelled'
      AND order_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(order_date, '%Y-%m')
      ORDER BY month ASC
    `);

    const [orders_by_status] = await db.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);

    const [feedback_by_type] = await db.query(`
      SELECT type, COUNT(*) as count
      FROM feedback
      GROUP BY type
    `);

    const [recent_orders] = await db.query(`
      SELECT order_code, customer_name, total_amount, status, order_date
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      total_orders,
      total_items,
      total_employees,
      total_feedback,
      top_products,
      sales_trend,
      low_stock,
      pending_deliveries,
      avg_rating,
      total_ratings,
      monthly_revenue,
      orders_by_status,
      feedback_by_type,
      recent_orders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload receipt for a shipment
app.post(
  '/api/logistics/shipments/:id/receipt',
  uploadReceipt.single('receipt'),
  async (req, res) => {
    const db = require('./config/db');

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const filePath = `/uploads/receipts/${req.file.filename}`;
      const fileName = req.file.originalname;

      await db.query(
        'UPDATE shipments SET receipt_path = ?, receipt_name = ? WHERE id = ?',
        [filePath, fileName, req.params.id]
      );

      res.json({
        message: 'Receipt uploaded successfully',
        path: filePath,
        name: fileName,
      });
    } catch (err) {
      logger.error('Receipt upload error:', { error: err.message, stack: err.stack });
      res.status(500).json({
        message: 'Upload failed',
        error: err.message,
      });
    }
  }
);

// Delete receipt for a shipment
app.delete('/api/logistics/shipments/:id/receipt', async (req, res) => {
  const db = require('./config/db');
  const fs = require('fs');

  try {
    const [[shipment]] = await db.query(
      'SELECT receipt_path FROM shipments WHERE id = ?',
      [req.params.id]
    );

    if (shipment?.receipt_path) {
      const fullPath = path.join(__dirname, '..', shipment.receipt_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await db.query(
      'UPDATE shipments SET receipt_path = NULL, receipt_name = NULL WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Receipt deleted' });
  } catch (err) {
    logger.error('Receipt deletion error:', { error: err.message, stack: err.stack });
    res.status(500).json({ message: 'Error deleting receipt' });
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  const db = require('./config/db');
  try {
    const notifications = [];

    // Low stock alerts
    const [lowStock] = await db.query(
      `SELECT id, name, item_code, quantity, reorder_level, status
       FROM inventory_items
       WHERE status IN ('low-stock', 'out-of-stock')
       ORDER BY quantity ASC`
    );
    lowStock.forEach(item => {
      notifications.push({
        id: `stock-${item.id}`,
        type: 'low-stock',
        priority: item.status === 'out-of-stock' ? 'high' : 'medium',
        title: item.status === 'out-of-stock' ? 'Out of Stock' : 'Low Stock Alert',
        message: `${item.name} (${item.item_code}) — ${item.quantity} units left`,
        link: '/inventory',
        time: null,
      });
    });

    // New/pending orders
    const [pendingOrders] = await db.query(
      `SELECT id, order_code, customer_name, total_amount, created_at
       FROM orders WHERE status = 'pending'
       ORDER BY created_at DESC LIMIT 5`
    );
    pendingOrders.forEach(order => {
      notifications.push({
        id: `order-${order.id}`,
        type: 'new-order',
        priority: 'medium',
        title: 'New Pending Order',
        message: `${order.order_code} from ${order.customer_name} — ₱${Number(order.total_amount).toLocaleString()}`,
        link: '/sales',
        time: order.created_at,
      });
    });

    // New feedback
    const [newFeedback] = await db.query(
      `SELECT id, customer_name, type, subject, created_at
       FROM feedback WHERE status = 'new'
       ORDER BY created_at DESC LIMIT 5`
    );
    newFeedback.forEach(fb => {
      notifications.push({
        id: `feedback-${fb.id}`,
        type: 'new-feedback',
        priority: fb.type === 'complaint' ? 'high' : 'low',
        title: `New ${fb.type.charAt(0).toUpperCase() + fb.type.slice(1)}`,
        message: `${fb.customer_name}: "${fb.subject}"`,
        link: '/crm',
        time: fb.created_at,
      });
    });

    // Pending shipments
    const [pendingShipments] = await db.query(
      `SELECT id, shipment_code, customer_name, shipping_status, created_at
       FROM shipments
       WHERE shipping_status IN ('pending','shipped','in-transit')
       ORDER BY created_at DESC LIMIT 5`
    );
    pendingShipments.forEach(ship => {
      notifications.push({
        id: `ship-${ship.id}`,
        type: 'pending-delivery',
        priority: 'low',
        title: 'Shipment In Progress',
        message: `${ship.shipment_code} to ${ship.customer_name} — ${ship.shipping_status}`,
        link: '/logistics',
        time: ship.created_at,
      });
    });

    // Sort by priority then time
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    res.json({ count: notifications.length, notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
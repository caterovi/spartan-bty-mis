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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/marketing', require('./routes/marketing'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/logistics', require('./routes/logistics'));

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
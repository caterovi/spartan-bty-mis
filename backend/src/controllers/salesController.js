const db = require('../config/db');

// ── Helper: log order history ─────────────────────────────────────────────────
const logHistory = async (order_id, order_code, action, description, old_status, new_status, performed_by) => {
  try {
    await db.query(
      `INSERT INTO sales_order_history
        (order_id, order_code, action, description, old_status, new_status, performed_by)
       VALUES (?,?,?,?,?,?,?)`,
      [order_id, order_code, action, description, old_status || null, new_status || null, performed_by || 'System']
    );
  } catch (err) {
    console.error('History log error:', err.message);
  }
};

// ── GET /sales/orders ─────────────────────────────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /sales/orders/:id ─────────────────────────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /sales/orders/:id/history ─────────────────────────────────────────────
exports.getOrderHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM sales_order_history WHERE order_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /sales/orders ────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  const {
    order_code, customer_name, customer_phone, customer_address,
    order_date, notes, items, salesperson,
    promo_id, promo_code, discount_amount = 0, final_total,
  } = req.body;

  try {
    const total_amount = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price) || 0), 0);
    const discountValue = Number(discount_amount) || 0;
    const finalTotalValue = promo_id && discountValue > 0
      ? Number(final_total) || total_amount
      : total_amount;

    const [result] = await db.query(
      `INSERT INTO orders
        (order_code, customer_name, customer_phone, customer_address,
         order_date, total_amount, notes, salesperson, discount_amount, promo_code)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [order_code, customer_name, customer_phone, customer_address,
       order_date, finalTotalValue, notes, salesperson || null,
       discountValue, promo_code || null]
    );

    const order_id = result.insertId;

    for (const item of items) {
      const subtotal = Number(item.quantity) * Number(item.unit_price);
      await db.query(
        'INSERT INTO order_items (order_id, item_name, quantity, unit_price, subtotal, item_id) VALUES (?,?,?,?,?,?)',
        [order_id, item.item_name, item.quantity, item.unit_price, subtotal, item.item_id || null]
      );
    }

    // Log creation history
    await logHistory(order_id, order_code, 'Order Created',
      `Order created for ${customer_name}${promo_code ? ` with promo ${promo_code}` : ''}`,
      null, 'pending', salesperson || 'System');

    // Promo redemption tracking
    if (promo_id && discountValue > 0) {
      try {
        await db.query(
          `INSERT INTO promotion_redemptions
            (promotion_id, order_id, customer_name, discount_amount,
             order_total_before_discount, order_total_after_discount)
           VALUES (?,?,?,?,?,?)`,
          [promo_id, order_id, customer_name, discountValue,
           finalTotalValue + discountValue, finalTotalValue]
        );
        await db.query(
          `UPDATE promotions SET
            total_redemptions = total_redemptions + 1,
            total_discount_given = total_discount_given + ?,
            sales_generated = sales_generated + ?,
            last_used_at = NOW()
           WHERE id = ?`,
          [discountValue, finalTotalValue || 0, promo_id]
        );
      } catch (promoErr) {
        console.error('Promo redemption error:', promoErr.message);
      }
    }

    res.json({ message: 'Order created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── PUT /sales/orders/:id/status ──────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  try {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    await logHistory(id, order.order_code, 'Status Changed',
      `Status changed from ${order.status} to ${status}`,
      order.status, status, 'System');
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /sales/orders/:id/confirm ─────────────────────────────────────────────
exports.confirmAndReduceStock = async (req, res) => {
  const { id } = req.params;
  try {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending')
      return res.status(400).json({ message: `Only pending orders can be confirmed. Current status: ${order.status}` });

    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);

    // ── Stock validation before deduction ──
    const stockErrors = [];
    for (const item of items) {
      if (item.item_id) {
        const [[inv]] = await db.query('SELECT name, quantity FROM inventory_items WHERE id = ?', [item.item_id]);
        if (!inv || inv.quantity < item.quantity) {
          stockErrors.push({
            item_name: item.item_name || inv?.name || `Item #${item.item_id}`,
            requested: item.quantity,
            available: inv?.quantity ?? 0,
          });
        }
      }
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        message: 'Insufficient stock for some items.',
        stock_errors: stockErrors,
      });
    }

    // ── Deduct stock ──
    for (const item of items) {
      if (item.item_id) {
        const [[inv]] = await db.query('SELECT quantity, reorder_level FROM inventory_items WHERE id = ?', [item.item_id]);
        await db.query('UPDATE inventory_items SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.item_id]);
        await db.query(
          'INSERT INTO inventory_logs (item_id, type, quantity, remarks) VALUES (?,?,?,?)',
          [item.item_id, 'stock-out', item.quantity, `Deducted for Order ${order.order_code}`]
        );
        const newQty = inv.quantity - item.quantity;
        const invStatus = newQty <= 0 ? 'out-of-stock' : newQty <= inv.reorder_level ? 'low-stock' : 'in-stock';
        await db.query('UPDATE inventory_items SET status = ? WHERE id = ?', [invStatus, item.item_id]);
      }
    }

    await db.query(
      'UPDATE orders SET status = ?, stock_deducted = TRUE WHERE id = ?',
      ['confirmed', id]
    );

    await logHistory(id, order.order_code, 'Order Confirmed',
      'Order confirmed. Inventory stock deducted for linked items.',
      'pending', 'confirmed', 'System');

    res.json({ message: 'Order confirmed and stock reduced successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── PUT /sales/orders/:id/cancel ──────────────────────────────────────────────
exports.cancelOrder = async (req, res) => {
  const { id } = req.params;
  const { cancellation_reason, performed_by } = req.body;

  if (!cancellation_reason) return res.status(400).json({ message: 'Cancellation reason is required.' });

  try {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'cancelled') return res.status(400).json({ message: 'Order is already cancelled.' });

    // Return stock if confirmed and stock was deducted
    if (order.status === 'confirmed' && order.stock_deducted && !order.stock_returned) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
      for (const item of items) {
        if (item.item_id) {
          await db.query('UPDATE inventory_items SET quantity = quantity + ? WHERE id = ?', [item.quantity, item.item_id]);
          await db.query(
            'INSERT INTO inventory_logs (item_id, type, quantity, remarks) VALUES (?,?,?,?)',
            [item.item_id, 'stock-in', item.quantity, `Stock returned — Order ${order.order_code} cancelled`]
          );
          const [[inv]] = await db.query('SELECT quantity, reorder_level FROM inventory_items WHERE id = ?', [item.item_id]);
          const invStatus = inv.quantity <= 0 ? 'out-of-stock' : inv.quantity <= inv.reorder_level ? 'low-stock' : 'in-stock';
          await db.query('UPDATE inventory_items SET status = ? WHERE id = ?', [invStatus, item.item_id]);
        }
      }
      await db.query(
        `UPDATE orders SET status='cancelled', cancellation_reason=?, cancelled_at=NOW(),
          stock_returned=TRUE WHERE id=?`,
        [cancellation_reason, id]
      );
      await logHistory(id, order.order_code, 'Order Cancelled + Stock Returned',
        `Cancelled: "${cancellation_reason}". Inventory stock returned.`,
        order.status, 'cancelled', performed_by || 'System');
    } else {
      await db.query(
        `UPDATE orders SET status='cancelled', cancellation_reason=?, cancelled_at=NOW() WHERE id=?`,
        [cancellation_reason, id]
      );
      await logHistory(id, order.order_code, 'Order Cancelled',
        `Cancelled: "${cancellation_reason}". No stock adjustment needed.`,
        order.status, 'cancelled', performed_by || 'System');
    }

    res.json({ message: 'Order cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── PUT /sales/orders/:id/forward ─────────────────────────────────────────────
exports.forwardToLogistics = async (req, res) => {
  const { id } = req.params;
  const { shipment_code, courier, tracking_number, ship_date, estimated_delivery, notes, performed_by } = req.body;

  try {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'confirmed') return res.status(400).json({ message: 'Only confirmed orders can be forwarded.' });

    // Duplicate shipment check
    const [[existing]] = await db.query(
      'SELECT id FROM shipments WHERE order_code = ?', [order.order_code]
    );
    if (existing) return res.status(400).json({ message: 'This order has already been forwarded to Logistics.' });

    await db.query(
      `INSERT INTO shipments
        (shipment_code, order_code, customer_name, customer_address, customer_phone,
         courier, tracking_number, ship_date, estimated_delivery, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [shipment_code, order.order_code, order.customer_name,
       order.customer_address || 'N/A', order.customer_phone || '',
       courier || '', tracking_number || '', ship_date || null,
       estimated_delivery || null, notes || order.notes || '']
    );

    await db.query("UPDATE orders SET status = 'forwarded' WHERE id = ?", [id]);

    await logHistory(id, order.order_code, 'Forwarded to Logistics',
      `Shipment ${shipment_code} created and forwarded to logistics.`,
      'confirmed', 'forwarded', performed_by || 'System');

    res.json({ message: 'Order forwarded to Logistics successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── DELETE /sales/orders/:id ──────────────────────────────────────────────────
exports.deleteOrder = async (req, res) => {
  try {
    await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /sales/summary ────────────────────────────────────────────────────────
exports.getSummary = async (req, res) => {
  const { range, start_date, end_date } = req.query;

  let dateFilter = '';
  let params = [];
  const now = new Date();

  if (range === 'today') {
    dateFilter = 'AND DATE(order_date) = CURDATE()';
  } else if (range === 'week') {
    dateFilter = 'AND order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
  } else if (range === 'month') {
    dateFilter = 'AND MONTH(order_date) = MONTH(NOW()) AND YEAR(order_date) = YEAR(NOW())';
  } else if (range === 'custom' && start_date && end_date) {
    dateFilter = 'AND order_date BETWEEN ? AND ?';
    params = [start_date, end_date];
  }

  try {
    const [[{ total_orders }]]  = await db.query(`SELECT COUNT(*) as total_orders FROM orders WHERE 1=1 ${dateFilter}`, params);
    const [[{ total_revenue }]] = await db.query(`SELECT SUM(total_amount) as total_revenue FROM orders WHERE status != 'cancelled' ${dateFilter}`, params);
    const [[{ pending }]]       = await db.query(`SELECT COUNT(*) as pending FROM orders WHERE status='pending' ${dateFilter}`, params);
    const [[{ confirmed }]]     = await db.query(`SELECT COUNT(*) as confirmed FROM orders WHERE status='confirmed' ${dateFilter}`, params);
    const [[{ forwarded }]]     = await db.query(`SELECT COUNT(*) as forwarded FROM orders WHERE status='forwarded' ${dateFilter}`, params);
    const [[{ cancelled }]]     = await db.query(`SELECT COUNT(*) as cancelled FROM orders WHERE status='cancelled' ${dateFilter}`, params);
    const [[{ avg_order }]]     = await db.query(`SELECT AVG(total_amount) as avg_order FROM orders WHERE status != 'cancelled' ${dateFilter}`, params);
    const [[{ promo_orders }]]  = await db.query(`SELECT COUNT(*) as promo_orders FROM orders WHERE promo_code IS NOT NULL ${dateFilter}`, params);
    const [[{ total_discount }]]= await db.query(`SELECT SUM(discount_amount) as total_discount FROM orders WHERE discount_amount > 0 ${dateFilter}`, params);

    // Top products
    const [top_products] = await db.query(`
      SELECT oi.item_name, SUM(oi.quantity) as total_qty, SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled' ${dateFilter.replace(/AND /g, 'AND o.')}
      GROUP BY oi.item_name
      ORDER BY total_qty DESC
      LIMIT 5
    `, params);

    // Salesperson performance
    const [salesperson_perf] = await db.query(`
      SELECT salesperson, COUNT(*) as total_orders, SUM(total_amount) as total_revenue
      FROM orders
      WHERE status != 'cancelled' AND salesperson IS NOT NULL ${dateFilter}
      GROUP BY salesperson
      ORDER BY total_revenue DESC
      LIMIT 10
    `, params);

    // Pending aging
    const [pending_aging] = await db.query(`
      SELECT id, order_code, customer_name, order_date, created_at,
        DATEDIFF(NOW(), created_at) as days_pending
      FROM orders WHERE status = 'pending'
      ORDER BY created_at ASC
    `);

    // Most used promo
    const [[most_used_promo]] = await db.query(`
      SELECT promo_code, COUNT(*) as uses
      FROM orders WHERE promo_code IS NOT NULL
      GROUP BY promo_code ORDER BY uses DESC LIMIT 1
    `);

    res.json({
      total_orders, total_revenue: total_revenue || 0,
      pending, confirmed, forwarded, cancelled,
      avg_order: avg_order ? Number(avg_order).toFixed(2) : 0,
      promo_orders, total_discount: total_discount || 0,
      top_products, salesperson_perf, pending_aging,
      most_used_promo: most_used_promo?.promo_code || null,
      most_used_promo_count: most_used_promo?.uses || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /sales/next-code ──────────────────────────────────────────────────────
exports.getNextOrderCode = async (req, res) => {
  try {
    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM orders');
    const next = String(count + 1).padStart(3, '0');
    res.json({ order_code: `ORD-${next}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
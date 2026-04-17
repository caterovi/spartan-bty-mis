const db = require('../config/db');

exports.getOrders = async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' }); }
};

exports.getOrderById = async (req, res) => {
  try {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ ...order, items });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.createOrder = async (req, res) => {
  const { order_code, customer_name, customer_phone, customer_address, order_date, notes, items, salesperson } = req.body;
  try {
    const total_amount = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
    const [result] = await db.query(
      'INSERT INTO orders (order_code, customer_name, customer_phone, customer_address, order_date, total_amount, notes, salesperson) VALUES (?,?,?,?,?,?,?,?)',
      [order_code, customer_name, customer_phone, customer_address, order_date, total_amount, notes, salesperson || null]
    );
    const order_id = result.insertId;
    for (const item of items) {
      const subtotal = item.quantity * item.unit_price;
      await db.query(
        'INSERT INTO order_items (order_id, item_name, quantity, unit_price, subtotal, item_id) VALUES (?,?,?,?,?,?)',
        [order_id, item.item_name, item.quantity, item.unit_price, subtotal, item.item_id || null]
      );
    }
    res.json({ message: 'Order created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.confirmAndReduceStock = async (req, res) => {
  const { id } = req.params;
  try {
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      if (item.item_id) {
        const [[inv]] = await db.query('SELECT quantity, reorder_level FROM inventory_items WHERE id = ?', [item.item_id]);
        if (inv && inv.quantity >= item.quantity) {
          await db.query('UPDATE inventory_items SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.item_id]);
          await db.query('INSERT INTO inventory_logs (item_id, type, quantity, remarks) VALUES (?,?,?,?)',
            [item.item_id, 'stock-out', item.quantity, `Auto-deducted for Order #${id}`]);
          const newQty = inv.quantity - item.quantity;
          const status = newQty <= 0 ? 'out-of-stock' : newQty <= inv.reorder_level ? 'low-stock' : 'in-stock';
          await db.query('UPDATE inventory_items SET status = ? WHERE id = ?', [status, item.item_id]);
        }
      }
    }
    await db.query('UPDATE orders SET status = ? WHERE id = ?', ['confirmed', id]);
    res.json({ message: 'Order confirmed and stock reduced successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.deleteOrder = async (req, res) => {
  try {
    await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Order deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getSummary = async (req, res) => {
  try {
    const [[{ total_orders }]]   = await db.query('SELECT COUNT(*) as total_orders FROM orders');
    const [[{ total_revenue }]]  = await db.query("SELECT SUM(total_amount) as total_revenue FROM orders WHERE status != 'cancelled'");
    const [[{ pending }]]        = await db.query("SELECT COUNT(*) as pending FROM orders WHERE status = 'pending'");
    const [[{ confirmed }]]      = await db.query("SELECT COUNT(*) as confirmed FROM orders WHERE status = 'confirmed'");
    const [[{ forwarded }]]      = await db.query("SELECT COUNT(*) as forwarded FROM orders WHERE status = 'forwarded'");
    const [[{ cancelled }]]      = await db.query("SELECT COUNT(*) as cancelled FROM orders WHERE status = 'cancelled'");
    const [salespersons]         = await db.query("SELECT DISTINCT salesperson FROM orders WHERE salesperson IS NOT NULL ORDER BY salesperson ASC");
    res.json({ total_orders, total_revenue: total_revenue || 0, pending, confirmed, forwarded, cancelled, salespersons: salespersons.map(s => s.salesperson) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNextOrderCode = async (req, res) => {
  try {
    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM orders');
    const next = String(count + 1).padStart(3, '0');
    res.json({ order_code: `ORD-${next}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
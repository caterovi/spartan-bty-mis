const db = require('../config/db');

// ─── ITEMS ────────────────────────────────────────────────

exports.getItems = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM inventory_items ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addItem = async (req, res) => {
  const { item_code, name, category, quantity, reorder_level, supplier } = req.body;
  const status = quantity <= 0 ? 'out-of-stock' : quantity <= reorder_level ? 'low-stock' : 'in-stock';
  try {
    await db.query(
      'INSERT INTO inventory_items (item_code, name, category, quantity, reorder_level, supplier, status) VALUES (?,?,?,?,?,?,?)',
      [item_code || null, name, category, quantity, reorder_level, supplier, status]
    );
    res.json({ message: 'Item added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateItem = async (req, res) => {
  const { name, category, reorder_level, supplier } = req.body;
  try {
    await db.query(
      'UPDATE inventory_items SET name=?, category=?, reorder_level=?, supplier=? WHERE id=?',
      [name, category, reorder_level, supplier, req.params.id]
    );
    res.json({ message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    await db.query('DELETE FROM inventory_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── STOCK MOVEMENTS ──────────────────────────────────────

exports.getLogs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, i.name as item_name, i.item_code
       FROM inventory_logs l
       JOIN inventory_items i ON l.item_id = i.id
       ORDER BY l.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.stockIn = async (req, res) => {
  const { item_id, quantity, remarks } = req.body;
  try {
    await db.query('UPDATE inventory_items SET quantity = quantity + ? WHERE id = ?', [quantity, item_id]);
    await db.query('INSERT INTO inventory_logs (item_id, type, quantity, remarks) VALUES (?,?,?,?)', [item_id, 'stock-in', quantity, remarks]);

    // Update status
    const [[item]] = await db.query('SELECT quantity, reorder_level FROM inventory_items WHERE id = ?', [item_id]);
    const status = item.quantity <= 0 ? 'out-of-stock' : item.quantity <= item.reorder_level ? 'low-stock' : 'in-stock';
    await db.query('UPDATE inventory_items SET status = ? WHERE id = ?', [status, item_id]);

    res.json({ message: 'Stock added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.stockOut = async (req, res) => {
  const { item_id, quantity, remarks } = req.body;
  try {
    const [[item]] = await db.query('SELECT quantity, reorder_level FROM inventory_items WHERE id = ?', [item_id]);
    if (item.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    await db.query('UPDATE inventory_items SET quantity = quantity - ? WHERE id = ?', [quantity, item_id]);
    await db.query('INSERT INTO inventory_logs (item_id, type, quantity, remarks) VALUES (?,?,?,?)', [item_id, 'stock-out', quantity, remarks]);

    // Update status
    const newQty = item.quantity - quantity;
    const status = newQty <= 0 ? 'out-of-stock' : newQty <= item.reorder_level ? 'low-stock' : 'in-stock';
    await db.query('UPDATE inventory_items SET status = ? WHERE id = ?', [status, item_id]);

    res.json({ message: 'Stock removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── SUMMARY ──────────────────────────────────────────────

exports.getSummary = async (req, res) => {
  try {
    const [[{ total_items }]]    = await db.query('SELECT COUNT(*) as total_items FROM inventory_items');
    const [[{ total_value }]]    = await db.query('SELECT SUM(quantity * unit_price) as total_value FROM inventory_items');
    const [[{ low_stock }]]      = await db.query("SELECT COUNT(*) as low_stock FROM inventory_items WHERE status = 'low-stock'");
    const [[{ out_of_stock }]]   = await db.query("SELECT COUNT(*) as out_of_stock FROM inventory_items WHERE status = 'out-of-stock'");
    const [[{ in_stock }]]       = await db.query("SELECT COUNT(*) as in_stock FROM inventory_items WHERE status = 'in-stock'");
    res.json({ total_items, total_value: total_value || 0, low_stock, out_of_stock, in_stock });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
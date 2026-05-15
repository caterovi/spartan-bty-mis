const db = require('../config/db');

// ── helpers ───────────────────────────────────────────────────────────────────
const calcStatus = (qty, reorder) => {
  const q = Number(qty);
  const r = Number(reorder);
  if (q <= 0)  return 'out-of-stock';
  if (q <= r)  return 'low-stock';
  return 'in-stock';
};

const expiryStatus = (exp) => {
  if (!exp) return 'No Expiry';
  const now  = new Date(); now.setHours(0,0,0,0);
  const date = new Date(exp); date.setHours(0,0,0,0);
  const diff = Math.ceil((date - now) / 86400000);
  if (diff < 0)  return 'Expired';
  if (diff <= 30) return 'Near Expiry';
  return 'Valid';
};

const nextCode = async (product_type) => {
  const prefixMap = {
    'Product Set / Bundle': 'SET',
    'Promo Bundle':         'PRM',
    'Limited Edition Set':  'LIM',
    'Single Product':       'SKN',
    'Packaging Material':   'PKG',
    'Marketing Material':   'MKT',
    'Supplies':             'SUP',
  };
  const prefix = prefixMap[product_type] || 'INV';
  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) as count FROM inventory_items WHERE item_code LIKE ?`,
    [`${prefix}-%`]
  );
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};

const logMovement = async (item_id, type, prev_qty, move_qty, new_qty, reference_type, reference_id, reference_code, remarks, performed_by) => {
  await db.query(
    `INSERT INTO inventory_logs
      (item_id, type, quantity, previous_quantity, new_quantity,
       reference_type, reference_id, reference_code, remarks, performed_by)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [item_id, type, move_qty, prev_qty, new_qty,
     reference_type||null, reference_id||null, reference_code||null,
     remarks||null, performed_by||null]
  );
};

// ── GET /inventory/items ──────────────────────────────────────────────────────
exports.getItems = async (req, res) => {
  try {
    const { archived } = req.query;
    let where = 'WHERE is_archived = FALSE';
    if (archived === 'true')  where = 'WHERE is_archived = TRUE';
    if (archived === 'all')   where = '';
    const [rows] = await db.query(`SELECT * FROM inventory_items ${where} ORDER BY created_at DESC`);
    const data = rows.map(r => ({ ...r, expiry_status: expiryStatus(r.expiration_date) }));
    res.json(data);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── GET /inventory/next-code ──────────────────────────────────────────────────
exports.getNextCode = async (req, res) => {
  try {
    const code = await nextCode(req.query.product_type || '');
    res.json({ item_code: code });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── GET /inventory/items/:id/details ─────────────────────────────────────────
exports.getItemDetails = async (req, res) => {
  try {
    const [[item]] = await db.query('SELECT * FROM inventory_items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const [logs] = await db.query(
      `SELECT * FROM inventory_logs WHERE item_id = ? ORDER BY created_at DESC LIMIT 10`,
      [req.params.id]
    );
    res.json({ ...item, expiry_status: expiryStatus(item.expiration_date), recent_logs: logs });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── POST /inventory/items ─────────────────────────────────────────────────────
exports.addItem = async (req, res) => {
  const {
    item_code, name, category, product_type, quantity, reorder_level,
    supplier, batch_number, manufacturing_date, expiration_date, received_date,
  } = req.body;

  // Validation
  if (!name?.trim())     return res.status(400).json({ message: 'Item name is required.' });
  if (!category)         return res.status(400).json({ message: 'Category is required.' });
  if (!product_type)     return res.status(400).json({ message: 'Product type is required.' });
  if (quantity === undefined || quantity === '') return res.status(400).json({ message: 'Quantity is required.' });
  if (Number(quantity) < 0)  return res.status(400).json({ message: 'Quantity cannot be negative.' });
  if (Number(reorder_level) < 0) return res.status(400).json({ message: 'Reorder level cannot be negative.' });

  let code = item_code?.trim() || await nextCode(product_type);

  // Unique check
  const [[existing]] = await db.query('SELECT id FROM inventory_items WHERE item_code = ?', [code]);
  if (existing) return res.status(400).json({ message: `Item code "${code}" already exists.` });

  const status = calcStatus(quantity, reorder_level || 10);

  try {
    await db.query(
      `INSERT INTO inventory_items
        (item_code, name, category, product_type, quantity, reorder_level, supplier,
         batch_number, manufacturing_date, expiration_date, received_date, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [code, name, category, product_type, quantity, reorder_level || 10,
       supplier || null, batch_number || null,
       manufacturing_date || null, expiration_date || null,
       received_date || null, status]
    );
    // Log initial stock-in
    const [[{ id }]] = await db.query('SELECT id FROM inventory_items WHERE item_code = ?', [code]);
    if (Number(quantity) > 0) {
      await logMovement(id, 'stock-in', 0, Number(quantity), Number(quantity),
        'Manual Stock In', null, null, 'Initial stock on item creation', 'System');
    }
    res.json({ message: 'Item added successfully', item_code: code });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Item code already exists.' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── PUT /inventory/items/:id ──────────────────────────────────────────────────
exports.updateItem = async (req, res) => {
  const {
    name, category, product_type, reorder_level, supplier,
    batch_number, manufacturing_date, expiration_date, received_date,
  } = req.body;

  if (!name?.trim()) return res.status(400).json({ message: 'Item name is required.' });
  if (Number(reorder_level) < 0) return res.status(400).json({ message: 'Reorder level cannot be negative.' });

  try {
    const [[item]] = await db.query('SELECT quantity FROM inventory_items WHERE id=?', [req.params.id]);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const status = calcStatus(item.quantity, reorder_level);
    await db.query(
      `UPDATE inventory_items SET
        name=?, category=?, product_type=?, reorder_level=?, supplier=?,
        batch_number=?, manufacturing_date=?, expiration_date=?, received_date=?, status=?
       WHERE id=?`,
      [name, category, product_type, reorder_level, supplier||null,
       batch_number||null, manufacturing_date||null, expiration_date||null,
       received_date||null, status, req.params.id]
    );
    res.json({ message: 'Item updated successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── PUT /inventory/items/:id/archive ──────────────────────────────────────────
exports.archiveItem = async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE inventory_items SET is_archived = TRUE WHERE id = ?', [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item archived successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── DELETE /inventory/items/:id ───────────────────────────────────────────────
exports.deleteItem = async (req, res) => {
  try {
    // Check for logs — soft delete if any exist
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) as count FROM inventory_logs WHERE item_id = ?', [req.params.id]
    );
    if (count > 0) {
      await db.query('UPDATE inventory_items SET is_archived = TRUE WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Item has stock history. It has been archived instead of deleted.' });
    }
    await db.query('DELETE FROM inventory_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── GET /inventory/logs ───────────────────────────────────────────────────────
exports.getLogs = async (req, res) => {
  const { range, start_date, end_date, type, search } = req.query;
  let dateFilter = '';
  let params = [];

  if (range === 'today') dateFilter = 'AND DATE(l.created_at) = CURDATE()';
  else if (range === 'week') dateFilter = 'AND l.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  else if (range === 'month') dateFilter = 'AND MONTH(l.created_at)=MONTH(NOW()) AND YEAR(l.created_at)=YEAR(NOW())';
  else if (range === 'custom' && start_date && end_date) {
    dateFilter = 'AND DATE(l.created_at) BETWEEN ? AND ?';
    params = [start_date, end_date];
  }

  let typeFilter = type && type !== 'all' ? `AND l.type = '${type}'` : '';

  try {
    const [rows] = await db.query(
      `SELECT l.*, i.name as item_name, i.item_code, i.product_type
       FROM inventory_logs l
       JOIN inventory_items i ON l.item_id = i.id
       WHERE 1=1 ${dateFilter} ${typeFilter}
       ORDER BY l.created_at DESC`,
      params
    );

    const q = (search||'').toLowerCase();
    const filtered = q ? rows.filter(r =>
      (r.item_name||'').toLowerCase().includes(q) ||
      (r.item_code||'').toLowerCase().includes(q) ||
      (r.type||'').toLowerCase().includes(q) ||
      (r.remarks||'').toLowerCase().includes(q) ||
      (r.reference_code||'').toLowerCase().includes(q)
    ) : rows;

    res.json(filtered);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── POST /inventory/stock-in ──────────────────────────────────────────────────
exports.stockIn = async (req, res) => {
  const { item_id, quantity, remarks, performed_by } = req.body;
  if (!item_id || !quantity) return res.status(400).json({ message: 'Item and quantity are required.' });
  if (Number(quantity) <= 0) return res.status(400).json({ message: 'Quantity must be greater than 0.' });

  try {
    const [[item]] = await db.query('SELECT quantity, reorder_level FROM inventory_items WHERE id=? AND is_archived=FALSE', [item_id]);
    if (!item) return res.status(404).json({ message: 'Item not found or archived.' });

    const prev = Number(item.quantity);
    const newQty = prev + Number(quantity);
    await db.query('UPDATE inventory_items SET quantity=? WHERE id=?', [newQty, item_id]);
    const status = calcStatus(newQty, item.reorder_level);
    await db.query('UPDATE inventory_items SET status=? WHERE id=?', [status, item_id]);
    await logMovement(item_id, 'stock-in', prev, Number(quantity), newQty,
      'Manual Stock In', null, null, remarks||'Manual stock in', performed_by||'System');
    res.json({ message: 'Stock added successfully', previous_quantity: prev, new_quantity: newQty });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ── POST /inventory/stock-out ─────────────────────────────────────────────────
exports.stockOut = async (req, res) => {
  const { item_id, quantity, remarks, performed_by } = req.body;
  if (!item_id || !quantity) return res.status(400).json({ message: 'Item and quantity are required.' });
  if (Number(quantity) <= 0) return res.status(400).json({ message: 'Quantity must be greater than 0.' });

  try {
    const [[item]] = await db.query('SELECT quantity, reorder_level FROM inventory_items WHERE id=? AND is_archived=FALSE', [item_id]);
    if (!item) return res.status(404).json({ message: 'Item not found or archived.' });
    if (Number(item.quantity) < Number(quantity))
      return res.status(400).json({ message: `Cannot stock out more than available. Current stock: ${item.quantity}` });

    const prev = Number(item.quantity);
    const newQty = prev - Number(quantity);
    await db.query('UPDATE inventory_items SET quantity=? WHERE id=?', [newQty, item_id]);
    const status = calcStatus(newQty, item.reorder_level);
    await db.query('UPDATE inventory_items SET status=? WHERE id=?', [status, item_id]);
    await logMovement(item_id, 'stock-out', prev, Number(quantity), newQty,
      'Manual Stock Out', null, null, remarks||'Manual stock out', performed_by||'System');
    res.json({ message: 'Stock removed successfully', previous_quantity: prev, new_quantity: newQty });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ── GET /inventory/summary ────────────────────────────────────────────────────
exports.getSummary = async (req, res) => {
  try {
    const [[counts]] = await db.query(`
      SELECT
        COUNT(*) AS total_items,
        SUM(status='in-stock') AS in_stock,
        SUM(status='low-stock') AS low_stock,
        SUM(status='out-of-stock') AS out_of_stock,
        SUM(quantity) AS total_stock_qty,
        SUM(product_type='Single Product') AS single_products,
        SUM(product_type='Product Set / Bundle') AS product_sets,
        SUM(product_type='Promo Bundle') AS promo_bundles,
        SUM(product_type='Limited Edition Set') AS limited_editions
      FROM inventory_items WHERE is_archived = FALSE
    `);

    const [[{ needs_restock }]] = await db.query(
      `SELECT COUNT(*) as needs_restock FROM inventory_items WHERE status IN ('low-stock','out-of-stock') AND is_archived=FALSE`
    );

    const today = new Date().toISOString().slice(0,10);
    const future30 = new Date(Date.now() + 30*86400000).toISOString().slice(0,10);

    const [[{ near_expiry }]] = await db.query(
      `SELECT COUNT(*) as near_expiry FROM inventory_items
       WHERE expiration_date IS NOT NULL AND expiration_date >= ? AND expiration_date <= ? AND is_archived=FALSE`,
      [today, future30]
    );
    const [[{ expired }]] = await db.query(
      `SELECT COUNT(*) as expired FROM inventory_items
       WHERE expiration_date IS NOT NULL AND expiration_date < ? AND is_archived=FALSE`, [today]
    );

    // Items needing attention
    const [attention] = await db.query(
      `SELECT id, item_code, name, product_type, category, quantity, reorder_level, status
       FROM inventory_items WHERE status IN ('low-stock','out-of-stock') AND is_archived=FALSE
       ORDER BY quantity ASC`
    );

    // Near expiry items
    const [near_expiry_items] = await db.query(
      `SELECT id, item_code, name, batch_number, expiration_date,
        DATEDIFF(expiration_date, CURDATE()) as days_remaining
       FROM inventory_items
       WHERE expiration_date IS NOT NULL AND expiration_date >= CURDATE()
         AND expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND is_archived=FALSE
       ORDER BY expiration_date ASC`
    );

    // Expired items
    const [expired_items] = await db.query(
      `SELECT id, item_code, name, batch_number, expiration_date
       FROM inventory_items
       WHERE expiration_date IS NOT NULL AND expiration_date < CURDATE() AND is_archived=FALSE
       ORDER BY expiration_date DESC`
    );

    // Top stock-out
    const [top_stock_out] = await db.query(
      `SELECT i.name, i.item_code, SUM(l.quantity) as total_out
       FROM inventory_logs l JOIN inventory_items i ON l.item_id=i.id
       WHERE l.type='stock-out' GROUP BY l.item_id ORDER BY total_out DESC LIMIT 5`
    );

    // Top stock-in
    const [top_stock_in] = await db.query(
      `SELECT i.name, i.item_code, SUM(l.quantity) as total_in
       FROM inventory_logs l JOIN inventory_items i ON l.item_id=i.id
       WHERE l.type='stock-in' GROUP BY l.item_id ORDER BY total_in DESC LIMIT 5`
    );

    // Recent movements
    const [recent_movements] = await db.query(
      `SELECT l.*, i.name as item_name, i.item_code
       FROM inventory_logs l JOIN inventory_items i ON l.item_id=i.id
       ORDER BY l.created_at DESC LIMIT 10`
    );

    // Product sets/bundles
    const [sets] = await db.query(
      `SELECT id, item_code, name, product_type, quantity, reorder_level, status
       FROM inventory_items WHERE product_type='Product Set / Bundle' AND is_archived=FALSE ORDER BY name`
    );
    const [promos] = await db.query(
      `SELECT id, item_code, name, product_type, quantity, reorder_level, status
       FROM inventory_items WHERE product_type='Promo Bundle' AND is_archived=FALSE ORDER BY name`
    );
    const [limited] = await db.query(
      `SELECT id, item_code, name, product_type, quantity, reorder_level, status
       FROM inventory_items WHERE product_type='Limited Edition Set' AND is_archived=FALSE ORDER BY name`
    );

    res.json({
      ...counts, needs_restock, near_expiry, expired,
      attention, near_expiry_items, expired_items,
      top_stock_out, top_stock_in, recent_movements,
      sets, promos, limited,
    });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── GET /inventory/restock-recommendations ────────────────────────────────────
exports.getRestockRecommendations = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, item_code, name, product_type, category, quantity, reorder_level, status
       FROM inventory_items WHERE status IN ('low-stock','out-of-stock') AND is_archived=FALSE
       ORDER BY quantity ASC`
    );
    const data = rows.map(r => ({
      ...r,
      suggested_restock: Math.max(0, (Number(r.reorder_level)*2) - Number(r.quantity)),
    }));
    res.json(data);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── GET /inventory/expiry-alerts ──────────────────────────────────────────────
exports.getExpiryAlerts = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, item_code, name, batch_number, expiration_date,
        DATEDIFF(expiration_date, CURDATE()) as days_remaining,
        CASE
          WHEN expiration_date < CURDATE() THEN 'Expired'
          WHEN expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Near Expiry'
          ELSE 'Valid'
        END AS expiry_status
       FROM inventory_items
       WHERE expiration_date IS NOT NULL AND is_archived=FALSE
       ORDER BY expiration_date ASC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};
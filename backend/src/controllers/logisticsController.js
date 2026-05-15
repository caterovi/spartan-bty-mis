const db    = require('../config/db');
const path  = require('path');
const fs    = require('fs');
const multer = require('multer');

// ── Multer setup ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/receipts';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `receipt_${req.params.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
exports.uploadMiddleware = upload.single('receipt');

// ── Helpers ───────────────────────────────────────────────────────────────────
const addTimeline = async (shipment_id, event_type, event_description, created_by = null) => {
  try {
    await db.query(
      `INSERT INTO shipment_timeline (shipment_id, event_type, event_description, created_by)
       VALUES (?,?,?,?)`,
      [shipment_id, event_type, event_description, created_by]
    );
  } catch(e){ console.error('Timeline log error:', e.message); }
};

const ensureChecklist = async (shipment_id) => {
  const [[existing]] = await db.query(
    'SELECT id FROM shipment_checklists WHERE shipment_id = ?', [shipment_id]
  );
  if (!existing) {
    await db.query('INSERT INTO shipment_checklists (shipment_id) VALUES (?)', [shipment_id]);
  }
};

const isDelayed = (s) =>
  s.estimated_delivery &&
  new Date(s.estimated_delivery) < new Date() &&
  !['delivered','returned'].includes(s.shipping_status);

// ── GET /logistics/shipments ──────────────────────────────────────────────────
exports.getShipments = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM shipments ORDER BY created_at DESC');
    const data = rows.map(r => ({ ...r, is_delayed: isDelayed(r) }));
    res.json(data);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ── GET /logistics/shipments/:id ──────────────────────────────────────────────
exports.getShipmentById = async (req, res) => {
  try {
    const [[shipment]] = await db.query('SELECT * FROM shipments WHERE id = ?', [req.params.id]);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.json({ ...shipment, is_delayed: isDelayed(shipment) });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ── POST /logistics/shipments ─────────────────────────────────────────────────
exports.createShipment = async (req, res) => {
  const {
    shipment_code, order_code, customer_name, customer_address, customer_phone,
    courier, tracking_number, ship_date, estimated_delivery, notes,
  } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO shipments
        (shipment_code, order_code, customer_name, customer_address, customer_phone,
         courier, tracking_number, ship_date, estimated_delivery, notes,
         shipping_status, packing_status)
       VALUES (?,?,?,?,?,?,?,?,?,?,'pending','unpacked')`,
      [shipment_code, order_code, customer_name, customer_address||'N/A',
       customer_phone||'', courier||'', tracking_number||'',
       ship_date||null, estimated_delivery||null, notes||'']
    );
    const sid = result.insertId;
    await ensureChecklist(sid);
    await addTimeline(sid, 'Shipment Created',
      `Shipment ${shipment_code} created from order ${order_code} for ${customer_name}.`);
    res.json({ message: 'Shipment created successfully', id: sid });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ── PUT /logistics/shipments/:id ──────────────────────────────────────────────
exports.updateShipment = async (req, res) => {
  const { id } = req.params;
  const {
    shipment_code, order_code, customer_name, customer_address, customer_phone,
    courier, tracking_number, ship_date, estimated_delivery, actual_delivery,
    notes, shipping_status, packing_status, return_reason, proof_type,
  } = req.body;

  const VALID_SHIPPING  = ['pending','shipped','in-transit','delivered','returned'];
  const VALID_PACKING   = ['unpacked','packing','packed'];

  if (shipping_status && !VALID_SHIPPING.includes(shipping_status))
    return res.status(400).json({ message: 'Invalid shipping status.' });
  if (packing_status && !VALID_PACKING.includes(packing_status))
    return res.status(400).json({ message: 'Invalid packing status.' });

  try {
    const [[prev]] = await db.query('SELECT * FROM shipments WHERE id = ?', [id]);
    if (!prev) return res.status(404).json({ message: 'Shipment not found' });

    const nextShippingStatus = shipping_status || prev.shipping_status;
    const nextCourier        = courier !== undefined ? courier : prev.courier;
    const nextTracking       = tracking_number !== undefined ? tracking_number : prev.tracking_number;
    const nextShipDate       = ship_date !== undefined ? ship_date : prev.ship_date;
    const nextPackingStatus  = packing_status || prev.packing_status;

    // ── Status validation rules ──
    if (nextShippingStatus === 'shipped') {
      if (nextPackingStatus === 'unpacked')
        return res.status(400).json({ message: 'Cannot mark as shipped while packing status is unpacked.' });
      if (!nextCourier || !String(nextCourier).trim())
        return res.status(400).json({ message: 'Cannot mark as shipped without a courier assigned.' });
      if (!nextTracking || !String(nextTracking).trim())
        return res.status(400).json({ message: 'Cannot mark as shipped without a tracking number.' });
    }
    if (nextShippingStatus === 'delivered') {
      if (!nextShipDate)
        return res.status(400).json({ message: 'Cannot mark as delivered without a ship date.' });
      if (!nextCourier || !String(nextCourier).trim())
        return res.status(400).json({ message: 'Cannot mark as delivered without a courier assigned.' });
      if (!nextTracking || !String(nextTracking).trim())
        return res.status(400).json({ message: 'Cannot mark as delivered without a tracking number.' });
    }
    if (nextShippingStatus === 'returned' && !return_reason?.trim() && !prev.return_reason)
      return res.status(400).json({ message: 'Return reason is required when marking as returned.' });

    // Auto-set actual_delivery for delivered status
    const finalActualDelivery =
      nextShippingStatus === 'delivered' && !actual_delivery && !prev.actual_delivery
        ? new Date().toISOString().slice(0,10)
        : (actual_delivery !== undefined ? actual_delivery : prev.actual_delivery);

    const finalReturnReason = return_reason !== undefined ? return_reason : prev.return_reason;

    await db.query(
      `UPDATE shipments SET
        shipment_code=?, order_code=?, customer_name=?, customer_address=?,
        customer_phone=?, courier=?, tracking_number=?, ship_date=?,
        estimated_delivery=?, actual_delivery=?, notes=?,
        shipping_status=?, packing_status=?, return_reason=?, proof_type=?
       WHERE id=?`,
      [
        shipment_code || prev.shipment_code,
        order_code    || prev.order_code,
        customer_name || prev.customer_name,
        customer_address !== undefined ? customer_address : prev.customer_address,
        customer_phone   !== undefined ? customer_phone   : prev.customer_phone,
        nextCourier, nextTracking,
        nextShipDate    || null,
        estimated_delivery !== undefined ? estimated_delivery : prev.estimated_delivery,
        finalActualDelivery || null,
        notes !== undefined ? notes : prev.notes,
        nextShippingStatus, nextPackingStatus,
        finalReturnReason || null,
        proof_type || prev.proof_type || 'receipt',
        id,
      ]
    );

    // Timeline events
    if (packing_status && packing_status !== prev.packing_status) {
      await addTimeline(id, 'Packing Status Changed',
        `Packing status changed from "${prev.packing_status}" to "${packing_status}".`);
    }
    if (shipping_status && shipping_status !== prev.shipping_status) {
      await addTimeline(id, 'Shipping Status Changed',
        `Shipping status changed from "${prev.shipping_status}" to "${shipping_status}".`);
    }
    if (nextCourier !== prev.courier || nextTracking !== prev.tracking_number) {
      await addTimeline(id, 'Courier / Tracking Updated',
        `Courier: ${nextCourier||'—'} | Tracking: ${nextTracking||'—'}`);
    }

    res.json({ message: 'Shipment updated successfully' });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ── DELETE /logistics/shipments/:id ──────────────────────────────────────────
exports.deleteShipment = async (req, res) => {
  try {
    await db.query('DELETE FROM shipments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Shipment deleted' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ── POST /logistics/shipments/:id/receipt ─────────────────────────────────────
exports.uploadReceipt = async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  try {
    const [[shipment]] = await db.query('SELECT * FROM shipments WHERE id = ?', [id]);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    const receipt_path = req.file.filename;
    const proof_type   = req.body.proof_type || 'receipt';
    const uploaded_by  = req.user?.id || null;

    await db.query(
      `UPDATE shipments SET receipt_path=?, proof_type=?, receipt_uploaded_by=?, receipt_uploaded_at=NOW() WHERE id=?`,
      [receipt_path, proof_type, uploaded_by, id]
    );
    await addTimeline(id, 'Receipt Uploaded',
      `Proof of delivery (${proof_type}) uploaded.`, uploaded_by);

    res.json({ message: 'Receipt uploaded successfully', filename: receipt_path });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ── DELETE /logistics/shipments/:id/receipt ───────────────────────────────────
exports.deleteReceipt = async (req, res) => {
  const { id } = req.params;
  try {
    const [[shipment]] = await db.query('SELECT receipt_path FROM shipments WHERE id = ?', [id]);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    if (shipment.receipt_path) {
      const filePath = path.join('uploads/receipts', shipment.receipt_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.query(
      'UPDATE shipments SET receipt_path=NULL, receipt_uploaded_by=NULL, receipt_uploaded_at=NULL WHERE id=?',
      [id]
    );
    await addTimeline(id, 'Receipt Removed', 'Proof of delivery was removed.');
    res.json({ message: 'Receipt removed successfully' });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ── GET /logistics/shipments/:id/checklist ────────────────────────────────────
exports.getChecklist = async (req, res) => {
  const { id } = req.params;
  try {
    await ensureChecklist(id);
    const [[checklist]] = await db.query(
      'SELECT * FROM shipment_checklists WHERE shipment_id = ?', [id]
    );
    res.json(checklist);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ── PUT /logistics/shipments/:id/checklist ────────────────────────────────────
exports.updateChecklist = async (req, res) => {
  const { id } = req.params;
  const {
    products_verified, quantity_checked, items_packed,
    address_confirmed, courier_assigned, tracking_number_added,
  } = req.body;

  try {
    await ensureChecklist(id);
    await db.query(
      `UPDATE shipment_checklists SET
        products_verified=?, quantity_checked=?, items_packed=?,
        address_confirmed=?, courier_assigned=?, tracking_number_added=?
       WHERE shipment_id=?`,
      [
        products_verified ? 1 : 0,
        quantity_checked  ? 1 : 0,
        items_packed      ? 1 : 0,
        address_confirmed ? 1 : 0,
        courier_assigned  ? 1 : 0,
        tracking_number_added ? 1 : 0,
        id,
      ]
    );
    const allChecked = [products_verified, quantity_checked, items_packed,
      address_confirmed, courier_assigned, tracking_number_added].every(Boolean);
    if (allChecked) {
      await db.query("UPDATE shipments SET packing_status='packed' WHERE id=?", [id]);
      await addTimeline(id, 'Checklist Completed', 'All packing checklist items confirmed. Packing status set to Packed.');
    }
    res.json({ message: 'Checklist updated', all_checked: allChecked });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ── GET /logistics/shipments/:id/timeline ─────────────────────────────────────
exports.getTimeline = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM shipment_timeline WHERE shipment_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ── GET /logistics/summary ────────────────────────────────────────────────────
exports.getSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0,10);

    const [[counts]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(shipping_status = 'pending')    AS pending,
        SUM(shipping_status = 'shipped')    AS shipped,
        SUM(shipping_status = 'in-transit') AS in_transit,
        SUM(shipping_status = 'delivered')  AS delivered,
        SUM(shipping_status = 'returned')   AS returned,
        SUM(packing_status  = 'packed')     AS packed,
        SUM(packing_status  = 'unpacked')   AS unpacked,
        SUM(receipt_path IS NULL AND shipping_status = 'delivered') AS missing_receipts
      FROM shipments
    `);

    const [[{ delayed_count }]] = await db.query(`
      SELECT COUNT(*) AS delayed_count FROM shipments
      WHERE estimated_delivery < ? AND shipping_status NOT IN ('delivered','returned')
        AND estimated_delivery IS NOT NULL
    `, [today]);

    const [[{ on_time }]] = await db.query(`
      SELECT COUNT(*) AS on_time FROM shipments
      WHERE shipping_status = 'delivered'
        AND actual_delivery IS NOT NULL
        AND estimated_delivery IS NOT NULL
        AND actual_delivery <= estimated_delivery
    `);

    const [[{ average_delivery_days }]] = await db.query(`
      SELECT ROUND(AVG(DATEDIFF(actual_delivery, ship_date)),1) AS average_delivery_days
      FROM shipments
      WHERE shipping_status = 'delivered' AND actual_delivery IS NOT NULL AND ship_date IS NOT NULL
    `);

    res.json({
      total:              Number(counts.total)||0,
      pending:            Number(counts.pending)||0,
      shipped:            Number(counts.shipped)||0,
      in_transit:         Number(counts.in_transit)||0,
      delivered:          Number(counts.delivered)||0,
      returned:           Number(counts.returned)||0,
      packed:             Number(counts.packed)||0,
      unpacked:           Number(counts.unpacked)||0,
      delayed:            Number(delayed_count)||0,
      missing_receipts:   Number(counts.missing_receipts)||0,
      on_time:            Number(on_time)||0,
      average_delivery_days: average_delivery_days||0,
    });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};
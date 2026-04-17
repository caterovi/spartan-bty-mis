const db = require('../config/db');

exports.getShipments = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM shipments ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createShipment = async (req, res) => {
  const {
    shipment_code, order_code, customer_name, customer_address,
    customer_phone, courier, tracking_number, ship_date,
    estimated_delivery, notes
  } = req.body;
  try {
    await db.query(
      `INSERT INTO shipments
       (shipment_code, order_code, customer_name, customer_address, customer_phone,
        courier, tracking_number, ship_date, estimated_delivery, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [shipment_code, order_code, customer_name, customer_address, customer_phone,
       courier, tracking_number, ship_date, estimated_delivery, notes]
    );
    res.json({ message: 'Shipment created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateShipment = async (req, res) => {
  const {
    packing_status, shipping_status, courier, tracking_number,
    ship_date, estimated_delivery, actual_delivery, notes
  } = req.body;
  try {
    await db.query(
      `UPDATE shipments SET
       packing_status=?, shipping_status=?, courier=?, tracking_number=?,
       ship_date=?, estimated_delivery=?, actual_delivery=?, notes=?
       WHERE id=?`,
      [packing_status, shipping_status, courier, tracking_number,
       ship_date, estimated_delivery, actual_delivery, notes, req.params.id]
    );
    res.json({ message: 'Shipment updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteShipment = async (req, res) => {
  try {
    await db.query('DELETE FROM shipments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Shipment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const [[{ total }]]     = await db.query('SELECT COUNT(*) as total FROM shipments');
    const [[{ delivered }]] = await db.query("SELECT COUNT(*) as delivered FROM shipments WHERE shipping_status = 'delivered'");
    const [[{ in_transit }]]= await db.query("SELECT COUNT(*) as in_transit FROM shipments WHERE shipping_status = 'in-transit'");
    const [[{ pending }]]   = await db.query("SELECT COUNT(*) as pending FROM shipments WHERE shipping_status = 'pending'");
    const [[{ failed }]]    = await db.query("SELECT COUNT(*) as failed FROM shipments WHERE shipping_status = 'failed'");
    const [[{ packed }]]    = await db.query("SELECT COUNT(*) as packed FROM shipments WHERE packing_status = 'packed'");
    const [[{ unpacked }]]  = await db.query("SELECT COUNT(*) as unpacked FROM shipments WHERE packing_status = 'unpacked'");
    res.json({ total, delivered, in_transit, pending, failed, packed, unpacked });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
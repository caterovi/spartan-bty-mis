import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

function Orders() {
  const [orders, setOrders]               = useState([]);
  const [showForm, setShowForm]           = useState(false);
  const [message, setMessage]             = useState('');
  const [filter, setFilter]               = useState('all');
  const [expanded, setExpanded]           = useState(null);
  const [search, setSearch]               = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [items, setItems] = useState([{ item_id: null, item_name: '', quantity: 1, unit_price: '' }]);
  const [form, setForm] = useState({
    order_code: '', customer_name: '', customer_phone: '+63',
    customer_address: '', order_date: '', notes: '', salesperson: '',
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchOrders();
    fetchInventoryItems();
    fetchNextCode();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/sales/orders');
      setOrders(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchInventoryItems = async () => {
    try {
      const res = await api.get('/inventory/items');
      setInventoryItems(res.data.filter(i => i.status !== 'out-of-stock'));
    } catch (err) { console.error(err); }
  };

  const fetchNextCode = async () => {
    try {
      const res = await api.get('/sales/next-code');
      setForm(prev => ({ ...prev, order_code: res.data.order_code }));
    } catch (err) { console.error(err); }
  };

  const addItemRow    = () => setItems([...items, { item_id: null, item_name: '', quantity: 1, unit_price: '' }]);
  const removeItemRow = (index) => setItems(items.filter((_, i) => i !== index));

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const selectInventoryItem = (index, itemId) => {
    const selected = inventoryItems.find(i => i.id === Number(itemId));
    const updated  = [...items];
    updated[index] = {
      ...updated[index],
      item_id:    selected ? selected.id        : null,
      item_name:  selected ? selected.name      : '',
      unit_price: selected ? selected.unit_price : updated[index].unit_price,
    };
    setItems(updated);
  };

  const getTotal = () => items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price) || 0), 0);

  const handleOpenForm = async () => {
    if (!showForm) {
      await fetchNextCode();
    }
    setShowForm(!showForm);
  };

  const handleSubmit = async () => {
    try {
      await api.post('/sales/orders', { ...form, items });
      setMessage('success:Order created successfully!');
      setShowForm(false);
      setItems([{ item_id: null, item_name: '', quantity: 1, unit_price: '' }]);
      fetchOrders();
      fetchInventoryItems();
      fetchNextCode();
    } catch (err) {
      setMessage('error:Error creating order.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      if (status === 'confirmed') {
        if (!window.confirm('Confirm this order? This will automatically reduce inventory stock for linked items.')) return;
        await api.put(`/sales/orders/${id}/confirm`);
        setMessage('success:Order confirmed and inventory stock reduced automatically!');
        fetchInventoryItems();
      } else {
        await api.put(`/sales/orders/${id}/status`, { status });
      }
      fetchOrders();
    } catch (err) {
      setMessage('error:' + (err.response?.data?.message || 'Error updating order.'));
    } finally { setTimeout(() => setMessage(''), 4000); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await api.delete(`/sales/orders/${id}`);
      fetchOrders();
    } catch (err) { console.error(err); }
  };

  const handleForward = async (order) => {
    if (!window.confirm(`Forward order ${order.order_code} to Logistics?`)) return;
    try {
      const shipment_code = 'SHIP-' + order.order_code + '-' + Date.now();
      await api.post('/logistics/shipments', {
        shipment_code,
        order_code:         order.order_code,
        customer_name:      order.customer_name,
        customer_address:   order.customer_address || 'N/A',
        customer_phone:     order.customer_phone   || '',
        courier:            '',
        tracking_number:    '',
        ship_date:          null,
        estimated_delivery: null,
        notes:              order.notes || '',
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error creating shipment';
      setMessage('error:' + errorMsg);
      return;
    }

    try {
      await api.put(`/sales/orders/${order.id}/status`, { status: 'forwarded' });
      setMessage('success:Order forwarded to Logistics successfully!');
      fetchOrders();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error updating order status';
      setMessage('error:' + errorMsg);
    } finally { setTimeout(() => setMessage(''), 4000); }
  };

  const toggleExpand = (id) => setExpanded(prev => prev === id ? null : id);

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter;
    const matchSearch =
      o.order_code.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_phone || '').includes(search) ||
      (o.salesperson || '').toLowerCase().includes(search.toLowerCase()) ||
      o.status.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusColors = {
    pending:   { backgroundColor: '#fef9e7', color: '#f39c12' },
    confirmed: { backgroundColor: '#eaf4fb', color: '#2980b9' },
    forwarded: { backgroundColor: '#eafaf1', color: '#27ae60' },
    cancelled: { backgroundColor: '#fdf0f3', color: '#c4607a' },
  };

  const isSuccess = message.startsWith('success:');
  const isError   = message.startsWith('error:');
  const msgText   = message.replace(/^(success:|error:)/, '');

  return (
    <div>
      <div style={styles.topRow} className="mobile-top-row">
        <h3 style={styles.sectionTitle}>Orders</h3>
        <div className="mobile-button-group">
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', width: '220px' }}
            className="mobile-search"
          />
          <button onClick={handleOpenForm} style={styles.addBtn} className="mobile-action-btn">
            {showForm ? '× Cancel' : '+ New Order'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          fontSize: '14px', fontWeight: '500',
          backgroundColor: isError ? '#f8d7da' : '#d4edda',
          color:           isError ? '#721c24' : '#155724',
          border:          `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`,
        }}>
          {isSuccess ? ' ' : ' '}{msgText}
        </div>
      )}

      {/* Filter */}
      <div style={styles.filterRow} className="resp-filters mobile-filter-row">
        {['all','pending','confirmed','forwarded','cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={filter === f ? styles.filterActive : styles.filter}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <p style={{ fontSize: '13px', color: '#888', margin: '0 0 12px' }}>
        {filtered.length} order{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Create Form */}
      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>Create New Order</h4>
          <div style={styles.grid} className="mobile-form-grid">

            {/* Auto-generated Order Code */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Order Code</label>
              <div style={styles.autoCodeBox}>
                <span style={styles.autoCodeText}>{form.order_code}</span>
                <span style={styles.autoCodeBadge}>AUTO</span>
              </div>
            </div>

            {/* Salesperson */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Salesperson</label>
              <input
                type="text"
                placeholder="Your name"
                value={form.salesperson}
                onChange={e => setForm({ ...form, salesperson: e.target.value })}
                style={styles.input}
              />
            </div>

            {/* Customer Name */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Customer Name</label>
              <input
                type="text"
                placeholder="Full name"
                value={form.customer_name}
                onChange={e => setForm({ ...form, customer_name: e.target.value })}
                style={styles.input}
              />
            </div>

            {/* Phone with +63 */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Customer Phone</label>
              <div style={styles.phoneWrapper}>
                <span style={styles.phonePrefix}>🇵🇭 +63</span>
                <input
                  type="text"
                  placeholder="9XX XXX XXXX"
                  value={form.customer_phone.replace('+63', '').replace(/^\s/, '')}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.startsWith('0')) val = val.slice(1);
                    if (val.length > 10) val = val.slice(0, 10);
                    setForm({ ...form, customer_phone: '+63' + val });
                  }}
                  style={styles.phoneInput}
                  maxLength={10}
                />
              </div>
              <span style={styles.phoneHint}>Enter 10-digit number (e.g. 9123456789)</span>
            </div>

            {/* Order Date */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Order Date</label>
              <input
                type="date"
                value={form.order_date}
                onChange={e => setForm({ ...form, order_date: e.target.value })}
                style={styles.input}
              />
            </div>

            {/* Address */}
            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Customer Address</label>
              <input
                type="text"
                placeholder="Delivery address"
                value={form.customer_address}
                onChange={e => setForm({ ...form, customer_address: e.target.value })}
                style={styles.input}
              />
            </div>

            {/* Notes */}
            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Notes</label>
              <input
                type="text"
                placeholder="Optional notes"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          {/* Order Items */}
          <div style={styles.itemsSection}>
            <div style={styles.itemsHeader}>
              <p style={styles.itemsTitle}>Order Items</p>
              <button onClick={addItemRow} style={styles.addRowBtn}>+ Add Row</button>
            </div>
            <table style={styles.itemTable}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Select from Inventory</th>
                  <th style={styles.th}>Item Name</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Unit Price (₱)</th>
                  <th style={styles.th}>Subtotal</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td style={styles.td}>
                      <select
                        value={item.item_id || ''}
                        onChange={e => selectInventoryItem(index, e.target.value)}
                        style={styles.tableInput}
                      >
                        <option value="">-- Select Item --</option>
                        {inventoryItems.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.name} (Stock: {i.quantity})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={styles.td}>
                      <input
                        type="text"
                        placeholder="Or type manually"
                        value={item.item_name}
                        onChange={e => updateItem(index, 'item_name', e.target.value)}
                        style={styles.tableInput}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', e.target.value)}
                        style={{ ...styles.tableInput, width: '70px' }}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={item.unit_price}
                        onChange={e => updateItem(index, 'unit_price', e.target.value)}
                        style={{ ...styles.tableInput, width: '100px' }}
                      />
                    </td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>
                      ₱{(Number(item.quantity) * Number(item.unit_price) || 0).toLocaleString()}
                    </td>
                    <td style={styles.td}>
                      {items.length > 1 && (
                        <button onClick={() => removeItemRow(index)} style={styles.removeBtn}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="3" style={{ ...styles.td, textAlign: 'right', fontWeight: '700' }}>Total:</td>
                  <td style={{ ...styles.td, fontWeight: '700', color: '#c4607a', fontSize: '16px' }}>
                    ₱{getTotal().toLocaleString()}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <button onClick={handleSubmit} style={styles.submitBtn}>Create Order</button>
        </div>
      )}

      {/* Orders Table */}
      <div className="resp-table-wrap mobile-table-container">
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Order Code</th>
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Salesperson</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Total</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="8" style={styles.empty}>No orders found.</td></tr>
          ) : filtered.map((order) => (
            <React.Fragment key={order.id}>
              <tr style={styles.tr}>
                <td style={styles.td}>{order.order_code}</td>
                <td style={styles.td}>
                  <div>{order.customer_name}</div>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>{order.customer_address || ''}</div>
                </td>
                <td style={styles.td}>{order.customer_phone || '—'}</td>
                <td style={styles.td}>{order.salesperson || '—'}</td>
                <td style={styles.td}>{new Date(order.order_date).toLocaleDateString()}</td>
                <td style={{ ...styles.td, fontWeight: '700' }}>
                  ₱{Number(order.total_amount).toLocaleString()}
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, ...statusColors[order.status] }}>
                    {order.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionRow}>
                    <button
                      onClick={() => toggleExpand(order.id)}
                      style={expanded === order.id ? styles.viewBtnActive : styles.viewBtn}
                    >
                      {expanded === order.id ? 'Hide' : 'View'}
                    </button>
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      style={styles.statusSelect}
                    >
                      {['pending','confirmed','forwarded','cancelled'].map(s => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                    {order.status === 'confirmed' && (
                      <button onClick={() => handleForward(order)} style={styles.forwardBtn}>
                        Forward
                      </button>
                    )}
                    <button onClick={() => handleDelete(order.id)} style={styles.deleteBtn}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              {expanded === order.id && (
                <tr>
                  <td colSpan="8" style={{ padding: 0, backgroundColor: '#f8f9fa' }}>
                    <OrderItems orderId={order.id} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

function OrderItems({ orderId }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/sales/orders/${orderId}`)
      .then(res => setItems(res.data.items || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div style={{ padding: '16px 24px' }}>
      <p style={{ fontSize: '13px', fontWeight: '600', color: '#555', margin: '0 0 10px' }}>
         Order Items
      </p>
      {loading ? (
        <p style={{ color: '#aaa', fontSize: '13px' }}>Loading items...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#eee' }}>
              <th style={iStyles.th}>Item Name</th>
              <th style={iStyles.th}>Qty</th>
              <th style={iStyles.th}>Unit Price</th>
              <th style={iStyles.th}>Subtotal</th>
              <th style={iStyles.th}>Linked to Inventory</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '12px', textAlign: 'center', color: '#aaa' }}>
                  No items found.
                </td>
              </tr>
            ) : items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={iStyles.td}>{item.item_name}</td>
                <td style={iStyles.td}>{item.quantity}</td>
                <td style={iStyles.td}>₱{Number(item.unit_price).toLocaleString()}</td>
                <td style={{ ...iStyles.td, fontWeight: '700' }}>
                  ₱{Number(item.subtotal).toLocaleString()}
                </td>
                <td style={iStyles.td}>
                  {item.item_id ? (
                    <span style={{ backgroundColor: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                       Linked
                    </span>
                  ) : (
                    <span style={{ backgroundColor: '#f0f0f0', color: '#888', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                      Manual
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const iStyles = {
  th: { padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#555' },
  td: { padding: '8px 12px', fontSize: '13px', color: '#333' },
};

const styles = {
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#302e2e', margin: 0 },
  addBtn: { padding: '10px 18px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  filterRow: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  filter: { padding: '6px 16px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', color: '#555' },
  filterActive: { padding: '6px 16px', borderRadius: '20px', border: '1px solid #c4607a', backgroundColor: '#c4607a', cursor: 'pointer', fontSize: '13px', color: '#fff' },
  form: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '20px', marginBottom: '24px' },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },

  // Auto-generated code
  autoCodeBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '2px solid #c4607a', backgroundColor: '#fdf0f3' },
  autoCodeText: { fontSize: '16px', fontWeight: '700', color: '#c4607a', letterSpacing: '1px' },
  autoCodeBadge: { backgroundColor: '#c4607a', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' },

  // Phone input
  phoneWrapper: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' },
  phonePrefix: { padding: '10px 12px', backgroundColor: '#f8f9fa', borderRight: '1px solid #ddd', fontSize: '14px', fontWeight: '600', color: '#302e2e', whiteSpace: 'nowrap', flexShrink: 0 },
  phoneInput: { flex: 1, padding: '10px 12px', border: 'none', fontSize: '14px', outline: 'none' },
  phoneHint: { fontSize: '11px', color: '#aaa', marginTop: '2px' },

  // Items
  itemsSection: { backgroundColor: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: '1px solid #eee' },
  itemsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  itemsTitle: { fontSize: '14px', fontWeight: '600', color: '#302e2e', margin: 0 },
  addRowBtn: { padding: '6px 14px', backgroundColor: '#302e2e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  itemTable: { width: '100%', borderCollapse: 'collapse' },
  tableInput: { padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', width: '100%' },
  removeBtn: { padding: '4px 8px', backgroundColor: '#f8d7da', color: '#721c24', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  submitBtn: { padding: '11px 24px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },

  // Table
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  empty: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  actionRow: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  statusSelect: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', cursor: 'pointer' },
  viewBtn: { padding: '6px 12px', backgroundColor: '#eaf4fb', color: '#2980b9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  viewBtnActive: { padding: '6px 12px', backgroundColor: '#2980b9', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  forwardBtn: { padding: '6px 12px', backgroundColor: '#d4edda', color: '#155724', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#f8d7da', color: '#721c24', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
};

export default Orders;
import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

function StockMovement() {
  const [logs, setLogs]         = useState([]);
  const [items, setItems]       = useState([]);
  const [mode, setMode]         = useState('stock-in');
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage]   = useState('');
  const [form, setForm]         = useState({ item_id: '', quantity: '', remarks: '' });

  useEffect(() => { fetchLogs(); fetchItems(); }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/inventory/logs');
      setLogs(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchItems = async () => {
    try {
      const res = await api.get('/inventory/items');
      setItems(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async () => {
    try {
      const endpoint = mode === 'stock-in' ? '/inventory/stock-in' : '/inventory/stock-out';
      await api.post(endpoint, form);
      setMessage(mode === 'stock-in' ? 'Stock added successfully!' : 'Stock removed successfully!');
      setShowForm(false);
      setForm({ item_id: '', quantity: '', remarks: '' });
      fetchLogs();
      fetchItems();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error processing stock movement.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const typeColors = {
    'stock-in':    { backgroundColor: '#eafaf1', color: '#27ae60' },
    'stock-out':   { backgroundColor: '#fdf0f3', color: '#c4607a' },
    'adjustment':  { backgroundColor: '#eaf4fb', color: '#2980b9' },
  };

  const [search, setSearch] = useState('');
  const filteredLogs = logs.filter(l =>
  l.item_name.toLowerCase().includes(search.toLowerCase()) ||
  l.item_code.toLowerCase().includes(search.toLowerCase()) ||
  l.type.toLowerCase().includes(search.toLowerCase()) ||
  (l.remarks || '').toLowerCase().includes(search.toLowerCase())
);

  return (
    <div>
      <div style={styles.topRow} className="mobile-top-row">
  <h3 style={styles.sectionTitle}>Stock Movement</h3>
  <div className="mobile-button-group">
    <input
      type="text"
      placeholder="Search logs..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', width: '200px' }}
      className="mobile-search"
    />
    <div style={styles.btnGroup} className="mobile-button-group">
      <button onClick={() => { setMode('stock-in'); setShowForm(!showForm); }} style={styles.stockInBtn} className="mobile-action-btn">+ Stock In</button>
      <button onClick={() => { setMode('stock-out'); setShowForm(!showForm); }} style={styles.stockOutBtn} className="mobile-action-btn">- Stock Out</button>
    </div>
  </div>
</div>

      {message && (
        <div style={{ ...styles.message, backgroundColor: message.includes('Error') || message.includes('Insufficient') ? '#fdf0f3' : '#eafaf1', color: message.includes('Error') || message.includes('Insufficient') ? '#c4607a' : '#27ae60' }}>
          {message}
        </div>
      )}

      {showForm && (
        <div style={{ ...styles.form, borderLeft: `4px solid ${mode === 'stock-in' ? '#27ae60' : '#c4607a'}` }}>
          <h4 style={styles.formTitle}>
            {mode === 'stock-in' ? 'Stock In' : 'Stock Out'}
          </h4>
          <div style={styles.grid} className="mobile-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Item</label>
              <select value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })} style={styles.input}>
                <option value="">Select item</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.name} (Current: {i.quantity} {i.unit})</option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Quantity</label>
              <input type="number" placeholder="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Remarks</label>
              <input type="text" placeholder="Optional remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} style={styles.input} />
            </div>
          </div>
          <div style={styles.formBtns}>
            <button onClick={handleSubmit} style={mode === 'stock-in' ? styles.submitBtnGreen : styles.submitBtnRed}>
              Confirm {mode === 'stock-in' ? 'Stock In' : 'Stock Out'}
            </button>
            <button onClick={() => setShowForm(false)} style={styles.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      
      <div className="resp-table-wrap mobile-table-container">
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Item</th>
            <th style={styles.th}>Code</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Quantity</th>
            <th style={styles.th}>Remarks</th>
            <th style={styles.th}>Date & Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan="6" style={styles.empty}>No stock movements yet.</td></tr>
          ) : (
            filteredLogs.map((log) => (
              <tr key={log.id} style={styles.tr}>
                <td style={styles.td}>{log.item_name}</td>
                <td style={styles.td}>{log.item_code}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, ...typeColors[log.type] }}>{log.type}</span>
                </td>
                <td style={{ ...styles.td, fontWeight: '700', color: log.type === 'stock-in' ? '#27ae60' : '#c4607a' }}>
                  {log.type === 'stock-in' ? '+' : '-'}{log.quantity}
                </td>
                <td style={styles.td}>{log.remarks || '—'}</td>
                <td style={styles.td}>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}

const styles = {
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#302e2e', margin: 0 },
  btnGroup: { display: 'flex', gap: '8px' },
  stockInBtn: { padding: '10px 18px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  stockOutBtn: { padding: '10px 18px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  message: { padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  form: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '20px', marginBottom: '24px' },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#b5536b', margin: '0 0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  formBtns: { display: 'flex', gap: '8px' },
  submitBtnGreen: { padding: '11px 24px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  submitBtnRed: { padding: '11px 24px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  cancelBtn: { padding: '11px 24px', backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  empty: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
};

export default StockMovement;
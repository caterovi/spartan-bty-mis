import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaFacebook, FaInstagram, FaTiktok, FaShopify, FaYoutube, } from "react-icons/fa";

function LiveSelling() {
  const [events, setEvents]     = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [message, setMessage]   = useState('');
  const [search, setSearch]     = useState('');
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({
    title: '', platform: 'tiktok', scheduled_date: '',
    host: '', products_featured: '', target_sales: '', notes: '',
  });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/marketing/live-selling');
      setEvents(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/marketing/live-selling', form);
      setMessage('Live selling event created!');
      setShowForm(false);
      setForm({ title: '', platform: 'tiktok', scheduled_date: '', host: '', products_featured: '', target_sales: '', notes: '' });
      fetchEvents();
    } catch (err) {
      setMessage('Error creating event.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/marketing/live-selling/${editId}`, editForm);
      setMessage('Event updated!');
      setEditId(null);
      fetchEvents();
    } catch (err) {
      setMessage('Error updating event.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/marketing/live-selling/${id}`);
      fetchEvents();
    } catch (err) { console.error(err); }
  };

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.platform.toLowerCase().includes(search.toLowerCase()) ||
    (e.host || '').toLowerCase().includes(search.toLowerCase()) ||
    e.status.toLowerCase().includes(search.toLowerCase())
  );

  const platformIcons = { tiktok: <FaTiktok />, shopee: <FaShopify />, facebook: <FaFacebook />, instagram: <FaInstagram />, youtube: <FaYoutube /> };

  const statusColors = {
    scheduled:  { backgroundColor: '#eaf4fb', color: '#2980b9' },
    live:       { backgroundColor: '#fdf0f3', color: '#c4607a' },
    completed:  { backgroundColor: '#eafaf1', color: '#27ae60' },
    cancelled:  { backgroundColor: '#f0f0f0', color: '#888' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.topRow} className="mobile-top-row">
        <h3 style={styles.sectionTitle}>Live Selling Events</h3>
        <div style={styles.topRight} className="mobile-button-group">
          <input
            type="text"
            placeholder=" Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
            className="mobile-search"
          />
          <button onClick={() => setShowForm(!showForm)} style={styles.addBtn} className="mobile-action-btn">
            {showForm ? '× Cancel' : '+ Schedule Live'}
          </button>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>Schedule Live Selling</h4>
          <div style={styles.grid} className="mobile-form-grid">
            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Title</label>
              <input type="text" placeholder="e.g. Mega Sale Live!" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Platform</label>
              <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} style={styles.input}>
                {['tiktok','shopee','facebook','instagram','youtube'].map(p => (
                  <option key={p} value={p}>{platformIcons[p]} {p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Scheduled Date & Time</label>
              <input type="datetime-local" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Host</label>
              <input type="text" placeholder="Host name" value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Target Sales (₱)</label>
              <input type="number" placeholder="0" value={form.target_sales} onChange={e => setForm({ ...form, target_sales: e.target.value })} style={styles.input} />
            </div>
            <div style={{ ...styles.inputGroup, gridColumn: 'span 3' }}>
              <label style={styles.label}>Products Featured</label>
              <input type="text" placeholder="e.g. Serum, Toner, Sunscreen" value={form.products_featured} onChange={e => setForm({ ...form, products_featured: e.target.value })} style={styles.input} />
            </div>
            <div style={{ ...styles.inputGroup, gridColumn: 'span 3' }}>
              <label style={styles.label}>Notes</label>
              <input type="text" placeholder="Optional notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={styles.input} />
            </div>
          </div>
          <button onClick={handleSubmit} style={styles.submitBtn}>Save Event</button>
        </div>
      )}

      {editId && (
        <div style={{ ...styles.form, borderLeft: '4px solid #c4607a' }}>
          <h4 style={styles.formTitle}>Update Event Status</h4>
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Status</label>
              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={styles.input}>
                {['scheduled','live','completed','cancelled'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Actual Sales (₱)</label>
              <input type="number" value={editForm.actual_sales} onChange={e => setEditForm({ ...editForm, actual_sales: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Viewers</label>
              <input type="number" value={editForm.viewers} onChange={e => setEditForm({ ...editForm, viewers: e.target.value })} style={styles.input} />
            </div>
            <div style={{ ...styles.inputGroup, gridColumn: 'span 3' }}>
              <label style={styles.label}>Notes</label>
              <input type="text" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} style={styles.input} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleUpdate} style={styles.submitBtn}>Save Changes</button>
            <button onClick={() => setEditId(null)} style={styles.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      <p style={styles.resultCount}>{filtered.length} event{filtered.length !== 1 ? 's' : ''} found</p>

      
      <div className="resp-table-wrap mobile-table-container">
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Platform</th>
            <th style={styles.th}>Scheduled</th>
            <th style={styles.th}>Host</th>
            <th style={styles.th}>Target</th>
            <th style={styles.th}>Actual</th>
            <th style={styles.th}>Viewers</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="9" style={styles.empty}>No events found.</td></tr>
          ) : filtered.map(e => (
            <tr key={e.id} style={styles.tr}>
              <td style={styles.td}>{e.title}</td>
              <td style={styles.td}>{platformIcons[e.platform]} {e.platform}</td>
              <td style={styles.td}>{new Date(e.scheduled_date).toLocaleString()}</td>
              <td style={styles.td}>{e.host || '—'}</td>
              <td style={styles.td}>₱{Number(e.target_sales).toLocaleString()}</td>
              <td style={styles.td}>₱{Number(e.actual_sales).toLocaleString()}</td>
              <td style={styles.td}>{e.viewers.toLocaleString()}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, ...statusColors[e.status] }}>{e.status}</span>
              </td>
              <td style={styles.td}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => { setEditId(e.id); setEditForm({ status: e.status, actual_sales: e.actual_sales, viewers: e.viewers, notes: e.notes || '' }); }} style={styles.editBtn}>Edit</button>
                  <button onClick={() => handleDelete(e.id)} style={styles.deleteBtn}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

const styles = {
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#302e2e', margin: 0 },
  topRight: { display: 'flex', gap: '10px', alignItems: 'center' },
  searchInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', width: '200px' },
  addBtn: { padding: '10px 18px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  message: { backgroundColor: '#eafaf1', color: '#27ae60', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  form: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '20px', marginBottom: '24px' },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  submitBtn: { padding: '11px 24px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  cancelBtn: { padding: '11px 24px', backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  resultCount: { fontSize: '13px', color: '#888', margin: '0 0 12px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  empty: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  editBtn: { padding: '6px 12px', backgroundColor: '#eaf4fb', color: '#2980b9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#fdf0f3', color: '#c4607a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
};

export default LiveSelling;
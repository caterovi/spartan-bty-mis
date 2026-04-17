import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

const SUPPLY_NAMES = [
  'Sunstick Daily Radiance',
  'Insta Glow',
  'Overnight Mask',
  'Bright and Light',
  'Glutaslim',
  'Bondpaper',
  'Bubble Wrap',
  'T4 Box',
];

function Items() {
  const [items, setItems]       = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [message, setMessage]   = useState('');
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({
    item_code: '', name: '', category: '',
    quantity: '', reorder_level: '10', supplier: '',
  });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/inventory/items');
      setItems(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async () => {
    if (!form.name) {
      setMessage('error:Please select a Supply Name.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    try {
      await api.post('/inventory/items', form);
      setMessage('success:Item added successfully!');
      setShowForm(false);
      setForm({ item_code: '', name: '', category: '', quantity: '', reorder_level: '10', supplier: '' });
      fetchItems();
    } catch (err) {
      setMessage('error:Error adding item.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setEditForm({
      name:          item.name,
      category:      item.category || '',
      reorder_level: item.reorder_level,
      supplier:      item.supplier || '',
    });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/inventory/items/${editId}`, editForm);
      setMessage('success:Item updated successfully!');
      setEditId(null);
      fetchItems();
    } catch (err) {
      setMessage('error:Error updating item.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/inventory/items/${id}`);
      fetchItems();
    } catch (err) { console.error(err); }
  };

  const filtered = items.filter(i => {
    const matchFilter = filter === 'all' || i.status === filter;
    const matchSearch =
      (i.item_code || '').toLowerCase().includes(search.toLowerCase()) ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.supplier || '').toLowerCase().includes(search.toLowerCase()) ||
      i.status.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusColors = {
    'in-stock':     { backgroundColor: '#d4edda', color: '#155724' },
    'low-stock':    { backgroundColor: '#fff3cd', color: '#856404' },
    'out-of-stock': { backgroundColor: '#f8d7da', color: '#721c24' },
  };

  const isSuccess = message.startsWith('success:');
  const isError   = message.startsWith('error:');
  const msgText   = message.replace(/^(success:|error:)/, '');

  return (
    <div>
      {/* Top Row */}
      <div style={styles.topRow} className="mobile-top-row">
        <h3 style={styles.sectionTitle}>Inventory Items</h3>
        <div className="mobile-button-group">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
            className="mobile-search"
          />
          <button onClick={() => setShowForm(!showForm)} style={styles.addBtn} className="mobile-action-btn">
            {showForm ? '× Cancel' : '+ Add Item'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          fontSize: '14px', fontWeight: '500',
          backgroundColor: isError ? '#f8d7da' : '#d4edda',
          color:           isError ? '#721c24' : '#155724',
          border:          `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`,
        }}>
          {isSuccess ? '' : ''}{msgText}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={styles.filterRow} className="resp-filters mobile-filter-row">
        {['all','in-stock','low-stock','out-of-stock'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={filter === f ? styles.filterActive : styles.filter}
          >
            {f === 'all' ? 'All' : f.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>Add New Item</h4>
          <div style={styles.grid} className="mobile-form-grid">

            {/* Supply Name Dropdown */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Supply Name <span style={styles.required}>*</span>
              </label>
              <select
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={styles.input}
              >
                <option value="">-- Select Supply --</option>
                {SUPPLY_NAMES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Item Code (Optional) */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Item Code <span style={styles.optional}>(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ITEM-001"
                value={form.item_code}
                onChange={e => setForm({ ...form, item_code: e.target.value })}
                style={styles.input}
              />
            </div>

            {/* Category */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Category</label>
              <input
                type="text"
                placeholder="e.g. Skincare, Packaging"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                style={styles.input}
              />
            </div>

            {/* Quantity */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Quantity <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                placeholder="0"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
                style={styles.input}
              />
            </div>

            {/* Reorder Level */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Reorder Level</label>
              <input
                type="number"
                placeholder="10"
                value={form.reorder_level}
                onChange={e => setForm({ ...form, reorder_level: e.target.value })}
                style={styles.input}
              />
            </div>

            {/* Supplier */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Supplier</label>
              <input
                type="text"
                placeholder="Supplier name"
                value={form.supplier}
                onChange={e => setForm({ ...form, supplier: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>
          <button onClick={handleSubmit} style={styles.submitBtn}>Save Item</button>
        </div>
      )}

      {/* Edit Form */}
      {editId && (
        <div style={{ ...styles.form, borderLeft: '4px solid #c4607a' }}>
          <h4 style={styles.formTitle}>Edit Item</h4>
          <div style={styles.grid} className="mobile-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Supply Name</label>
              <select
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                style={styles.input}
              >
                <option value="">-- Select Supply --</option>
                {SUPPLY_NAMES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Category</label>
              <input
                type="text"
                placeholder="e.g. Skincare"
                value={editForm.category || ''}
                onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Reorder Level</label>
              <input
                type="number"
                value={editForm.reorder_level || ''}
                onChange={e => setEditForm({ ...editForm, reorder_level: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Supplier</label>
              <input
                type="text"
                value={editForm.supplier || ''}
                onChange={e => setEditForm({ ...editForm, supplier: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleUpdate} style={styles.submitBtn}>Save Changes</button>
            <button onClick={() => setEditId(null)} style={styles.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      <p style={styles.resultCount}>
        {filtered.length} item{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Items Table */}
      
      <div className="resp-table-wrap mobile-table-container">
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Item Code</th>
            <th style={styles.th}>Supply Name</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Quantity</th>
            <th style={styles.th}>Reorder Level</th>
            <th style={styles.th}>Supplier</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="8" style={styles.empty}>No items found.</td>
            </tr>
          ) : filtered.map((item) => (
            <tr key={item.id} style={styles.tr}>
              <td style={{ ...styles.td, color: '#aaa', fontSize: '13px' }}>
                {item.item_code || <span style={{ color: '#ddd' }}>—</span>}
              </td>
              <td style={{ ...styles.td, fontWeight: '600' }}>{item.name}</td>
              <td style={styles.td}>{item.category || '—'}</td>
              <td style={{ ...styles.td, fontWeight: '700', fontSize: '16px',
                color: item.status === 'out-of-stock' ? '#721c24' : item.status === 'low-stock' ? '#856404' : '#155724'
              }}>
                {item.quantity}
              </td>
              <td style={styles.td}>{item.reorder_level}</td>
              <td style={styles.td}>{item.supplier || '—'}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, ...statusColors[item.status] }}>
                  {item.status}
                </span>
              </td>
              <td style={styles.td}>
                <div style={styles.actionRow}>
                  <button onClick={() => handleEdit(item)} style={styles.editBtn}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={styles.deleteBtn}>Delete</button>
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
  searchInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', width: '220px' },
  addBtn: { padding: '10px 18px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  filterRow: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  filter: { padding: '6px 16px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', color: '#555' },
  filterActive: { padding: '6px 16px', borderRadius: '20px', border: '1px solid #c4607a', backgroundColor: '#c4607a', cursor: 'pointer', fontSize: '13px', color: '#fff' },
  form: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '20px', marginBottom: '24px' },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  required: { color: '#c4607a', marginLeft: '2px' },
  optional: { color: '#aaa', fontSize: '11px', fontWeight: '400', marginLeft: '4px' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', backgroundColor: '#fff' },
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
  actionRow: { display: 'flex', gap: '6px' },
  editBtn: { padding: '6px 12px', backgroundColor: '#eaf4fb', color: '#2980b9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#f8d7da', color: '#721c24', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
};

export default Items;
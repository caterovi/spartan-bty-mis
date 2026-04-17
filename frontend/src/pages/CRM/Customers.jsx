import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [message, setMessage]     = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '' });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/crm/customers');
      setCustomers(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/crm/customers', form);
      setMessage('Customer added successfully!');
      setShowForm(false);
      setForm({ full_name: '', email: '', phone: '', address: '' });
      fetchCustomers();
    } catch (err) {
      setMessage('Error adding customer.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await api.delete(`/crm/customers/${id}`);
      fetchCustomers();
    } catch (err) { console.error(err); }
  };

  const [search, setSearch] = useState('');
  const filteredCustomers = customers.filter(c =>
  c.full_name.toLowerCase().includes(search.toLowerCase()) ||
  (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
  (c.phone || '').includes(search) ||
  (c.address || '').toLowerCase().includes(search.toLowerCase())
);

  return (
    <div>
      <div style={styles.topRow} className="mobile-top-row">
  <h3 style={styles.sectionTitle}>Customer List</h3>
  <div className="mobile-button-group">
    <input
      type="text"
      placeholder="Search customers..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', width: '220px' }}
      className="mobile-search"
    />
    <button onClick={() => setShowForm(!showForm)} style={styles.addBtn} className="mobile-action-btn">
      {showForm ? '× Cancel' : '+ Add Customer'}
    </button>
  </div>
</div>

      {message && <div style={styles.message}>{message}</div>}

      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>New Customer</h4>
          <div style={styles.grid} className="mobile-form-grid">
            {[
              { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Full name' },
              { label: 'Email',     key: 'email',     type: 'email', placeholder: 'Email address' },
              { label: 'Phone',     key: 'phone',     type: 'text', placeholder: 'Phone number' },
            ].map(f => (
              <div key={f.key} style={styles.inputGroup}>
                <label style={styles.label}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} style={styles.input} />
              </div>
            ))}
            <div style={{ ...styles.inputGroup, gridColumn: 'span 3' }}>
              <label style={styles.label}>Address</label>
              <input type="text" placeholder="Customer address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={styles.input} />
            </div>
          </div>
          <button onClick={handleSubmit} style={styles.submitBtn}>Save Customer</button>
        </div>
      )}

     <div className="tbl mobile-table-container">
     <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Address</th>
            <th style={styles.th}>Date Added</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 ? (
            <tr><td colSpan="6" style={styles.empty}>No customers yet. Add one above.</td></tr>
          ) : (
            customers.map((c) => (
              <tr key={c.id} style={styles.tr}>
                <td style={styles.td}>{c.full_name}</td>
                <td style={styles.td}>{c.email || '—'}</td>
                <td style={styles.td}>{c.phone || '—'}</td>
                <td style={styles.td}>{c.address || '—'}</td>
                <td style={styles.td}>{new Date(c.created_at).toLocaleDateString()}</td>
                <td style={styles.td}>
                  <button onClick={() => handleDelete(c.id)} style={styles.deleteBtn}>Delete</button>
                </td>
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
  addBtn: { padding: '10px 18px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  message: { backgroundColor: '#eafaf1', color: '#27ae60', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  form: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '20px', marginBottom: '24px' },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#b5536b', margin: '0 0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  submitBtn: { padding: '11px 24px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  empty: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#fdf0f3', color: '#c4607a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
};

export default Customers;
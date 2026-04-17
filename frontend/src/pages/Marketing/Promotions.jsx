import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

function Promotions() {
  const [promos, setPromos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    promo_code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order: '0',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const res = await api.get('/marketing/promotions');
      setPromos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/marketing/promotions', form);
      setMessage('Promotion created successfully!');
      setShowForm(false);
      setForm({
        promo_code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order: '0',
        start_date: '',
        end_date: '',
      });
      fetchPromos();
    } catch (err) {
      setMessage('Error creating promotion.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/marketing/promotions/${id}/status`, { status });
      fetchPromos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promotion?')) return;
    try {
      await api.delete(`/marketing/promotions/${id}`);
      fetchPromos();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = promos.filter(
    (p) =>
      p.promo_code.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    active: { backgroundColor: '#eafaf1', color: '#27ae60' },
    inactive: { backgroundColor: '#f0f0f0', color: '#888' },
    expired: { backgroundColor: '#fdf0f3', color: '#c4607a' },
  };

  return (
    <div className="promo-root">
      <style>{`
        .promo-root {
          width: 100%;
          min-width: 0;
        }

        .promo-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .promo-top-right {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .promo-search,
        .promo-add-btn,
        .promo-input,
        .promo-submit-btn,
        .promo-status-select,
        .promo-delete-btn {
          box-sizing: border-box;
        }

        .promo-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .promo-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .promo-card {
          min-width: 0;
        }

        @media (max-width: 768px) {
          .promo-top-row {
            flex-direction: column;
            align-items: stretch;
          }

          .promo-top-right {
            width: 100%;
            flex-direction: row;
            align-items: stretch;
            gap: 10px;
          }

          .promo-search {
            flex: 1;
            width: auto !important;
            min-width: 0;
          }

          .promo-add-btn {
            flex-shrink: 0;
            width: auto !important;
            white-space: normal;
            padding-left: 14px !important;
            padding-right: 14px !important;
          }

          .promo-form-grid {
            grid-template-columns: 1fr 1fr;
          }

          .promo-span-3 {
            grid-column: span 2 !important;
          }

          .promo-grid {
            grid-template-columns: 1fr;
          }

          .promo-actions {
            flex-direction: row;
            align-items: center;
          }

          .promo-status-select {
            flex: 1;
            min-width: 0;
          }

          .promo-delete-btn {
            flex-shrink: 0;
          }
        }

        @media (max-width: 520px) {
          .promo-top-right {
            flex-direction: column;
          }

          .promo-search,
          .promo-add-btn {
            width: 100% !important;
          }

          .promo-form-grid {
            grid-template-columns: 1fr;
          }

          .promo-span-3 {
            grid-column: span 1 !important;
          }

          .promo-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .promo-status-select,
          .promo-delete-btn {
            width: 100%;
          }
        }
      `}</style>

      <div style={styles.topRow} className="resp-top-row promo-top-row">
        <h3 style={styles.sectionTitle}> Promotions</h3>
        <div className="resp-actions">
          <div style={styles.topRight} className="promo-top-right">
            <input
              type="text"
              placeholder="Search promos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
              className="promo-search"
            />
            <button
              onClick={() => setShowForm(!showForm)}
              style={styles.addBtn}
              className="promo-add-btn"
            >
              {showForm ? '✕ Cancel' : '+ New Promo'}
            </button>
          </div>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>Create Promotion</h4>

          <div className="promo-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Promo Code</label>
              <input
                type="text"
                placeholder="e.g. SALE20"
                value={form.promo_code}
                onChange={(e) => setForm({ ...form, promo_code: e.target.value })}
                style={styles.input}
                className="promo-input"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Discount Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                style={styles.input}
                className="promo-input"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₱)</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Discount Value</label>
              <input
                type="number"
                placeholder="e.g. 20"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                style={styles.input}
                className="promo-input"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Min. Order (₱)</label>
              <input
                type="number"
                placeholder="0"
                value={form.min_order}
                onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                style={styles.input}
                className="promo-input"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                style={styles.input}
                className="promo-input"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                style={styles.input}
                className="promo-input"
              />
            </div>

            <div
              style={{ ...styles.inputGroup, gridColumn: 'span 3' }}
              className="promo-span-3"
            >
              <label style={styles.label}>Description</label>
              <input
                type="text"
                placeholder="Promo description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={styles.input}
                className="promo-input"
              />
            </div>
          </div>

          <button onClick={handleSubmit} style={styles.submitBtn} className="promo-submit-btn">
            Save Promotion
          </button>
        </div>
      )}

      <p style={styles.resultCount}>
        {filtered.length} promo{filtered.length !== 1 ? 's' : ''} found
      </p>

      <div style={styles.promoGrid} className="promo-grid">
        {filtered.length === 0 ? (
          <div style={{ ...styles.empty, gridColumn: 'span 3' }}>No promotions found.</div>
        ) : (
          filtered.map((p) => (
            <div key={p.id} style={styles.promoCard} className="promo-card">
              <div style={styles.promoTop}>
                <span style={styles.promoCode}>{p.promo_code}</span>
                <span style={{ ...styles.badge, ...statusColors[p.status] }}>{p.status}</span>
              </div>

              <p style={styles.promoDiscount}>
                {p.discount_type === 'percentage'
                  ? `${p.discount_value}% OFF`
                  : `₱${Number(p.discount_value).toLocaleString()} OFF`}
              </p>

              <p style={styles.promoDesc}>{p.description || 'No description'}</p>
              <p style={styles.promoMeta}>Min. Order: ₱{Number(p.min_order).toLocaleString()}</p>
              <p style={styles.promoMeta}>
                {new Date(p.start_date).toLocaleDateString()} – {new Date(p.end_date).toLocaleDateString()}
              </p>

              <div style={styles.promoActions} className="promo-actions">
                <select
                  value={p.status}
                  onChange={(e) => handleStatus(p.id, e.target.value)}
                  style={styles.statusSelect}
                  className="promo-status-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>

                <button
                  onClick={() => handleDelete(p.id)}
                  style={styles.deleteBtn}
                  className="promo-delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#302e2e', margin: 0 },
  topRight: { display: 'flex', gap: '10px', alignItems: 'center' },
  searchInput: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    width: '200px',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  addBtn: {
    padding: '10px 18px',
    backgroundColor: '#c4607a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  message: {
    backgroundColor: '#eafaf1',
    color: '#27ae60',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  form: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '20px', marginBottom: '24px' },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  submitBtn: {
    padding: '11px 24px',
    backgroundColor: '#c4607a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  resultCount: { fontSize: '13px', color: '#888', margin: '0 0 12px' },
  promoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  promoCard: { border: '1px solid #eee', borderRadius: '12px', padding: '20px' },
  promoTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '10px' },
  promoCode: { fontSize: '18px', fontWeight: '700', color: '#c4607a', letterSpacing: '1px' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', flexShrink: 0 },
  promoDiscount: { fontSize: '22px', fontWeight: '700', color: '#302e2e', margin: '4px 0' },
  promoDesc: { fontSize: '13px', color: '#888', margin: '4px 0' },
  promoMeta: { fontSize: '12px', color: '#aaa', margin: '2px 0' },
  promoActions: { display: 'flex', gap: '8px', marginTop: '12px' },
  statusSelect: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '13px',
    cursor: 'pointer',
    minWidth: 0,
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#fdf0f3',
    color: '#c4607a',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  empty: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
};

export default Promotions;
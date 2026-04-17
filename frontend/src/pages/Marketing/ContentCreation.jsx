import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaFacebook, FaInstagram, FaTiktok, FaShopify, FaYoutube } from "react-icons/fa";

function ContentCreation() {
  const [content, setContent] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [editForm, setEditForm] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({
    title: '',
    platform: 'tiktok',
    content_type: 'product-review',
    assigned_to: '',
    due_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await api.get('/marketing/content');
      setContent(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/marketing/content', form);
      setMessage('Content task created!');
      setShowForm(false);
      setForm({
        title: '',
        platform: 'tiktok',
        content_type: 'product-review',
        assigned_to: '',
        due_date: '',
        notes: '',
      });
      fetchContent();
    } catch (err) {
      setMessage('Error creating content task.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/marketing/content/${editId}`, editForm);
      setMessage('Content updated!');
      setEditId(null);
      fetchContent();
    } catch (err) {
      setMessage('Error updating.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content task?')) return;
    try {
      await api.delete(`/marketing/content/${id}`);
      fetchContent();
    } catch (err) {
      console.error(err);
    }
  };

  const platformIcons = {
    tiktok: <FaTiktok />,
    reels: <FaInstagram />,
    shopee: <FaShopify />,
    youtube: <FaYoutube />,
    facebook: <FaFacebook />
  };

  const statusColors = {
    idea: { backgroundColor: '#f0f0f0', color: '#888' },
    'in-progress': { backgroundColor: '#eaf4fb', color: '#2980b9' },
    'for-review': { backgroundColor: '#fef9e7', color: '#f39c12' },
    published: { backgroundColor: '#eafaf1', color: '#27ae60' },
    cancelled: { backgroundColor: '#fdf0f3', color: '#c4607a' },
  };

  const filtered = content.filter(c => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.platform.toLowerCase().includes(search.toLowerCase()) ||
      c.content_type.toLowerCase().includes(search.toLowerCase()) ||
      (c.assigned_to || '').toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const kanbanStatuses = ['idea', 'in-progress', 'for-review', 'published'];

  return (
    <div className="content-root">
      <style>{`
        .content-root {
          width: 100%;
          min-width: 0;
        }

        .content-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .content-top-right {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .content-search,
        .content-add-btn,
        .content-input,
        .content-submit-btn,
        .content-cancel-btn {
          box-sizing: border-box;
        }

        .content-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .content-edit-actions {
          display: flex;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .content-top-row {
            flex-direction: column;
            align-items: stretch;
          }

          .content-top-right {
            width: 100%;
            flex-direction: row;
            align-items: stretch;
            gap: 10px;
          }

          .content-search {
            flex: 1;
            width: auto !important;
            min-width: 0;
          }

          .content-add-btn {
            flex-shrink: 0;
            width: auto !important;
            white-space: normal;
            padding-left: 14px !important;
            padding-right: 14px !important;
          }

          .content-form-grid {
            grid-template-columns: 1fr 1fr;
          }

          .content-span-3 {
            grid-column: span 2 !important;
          }

          .content-span-2 {
            grid-column: span 2 !important;
          }
        }

        @media (max-width: 520px) {
          .content-top-right {
            flex-direction: column;
          }

          .content-search,
          .content-add-btn {
            width: 100% !important;
          }

          .content-form-grid {
            grid-template-columns: 1fr;
          }

          .content-span-3,
          .content-span-2 {
            grid-column: span 1 !important;
          }

          .content-edit-actions {
            flex-direction: column;
          }

          .content-edit-actions button {
            width: 100%;
          }
        }
      `}</style>

      <div style={styles.topRow} className="resp-top-row content-top-row">
        <h3 style={styles.sectionTitle}> Content Creation</h3>

        <div className="resp-actions">
          <div style={styles.topRight} className="content-top-right">
            <input
              type="text"
              placeholder=" Search content..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
              className="content-search"
            />
            <button
              onClick={() => setShowForm(!showForm)}
              style={styles.addBtn}
              className="content-add-btn"
            >
              {showForm ? '✕ Cancel' : '+ New Content'}
            </button>
          </div>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.filterRow} className="resp-filters">
        {['all', 'idea', 'in-progress', 'for-review', 'published', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={filterStatus === s ? styles.filterActive : styles.filter}
          >
            {s === 'all'
              ? 'All'
              : s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>New Content Task</h4>

          <div className="content-form-grid">
            <div
              style={{ ...styles.inputGroup, gridColumn: 'span 3' }}
              className="content-span-3"
            >
              <label style={styles.label}>Content Title</label>
              <input
                type="text"
                placeholder="e.g. Skin care routine tutorial"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={styles.input}
                className="content-input"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Platform</label>
              <select
                value={form.platform}
                onChange={e => setForm({ ...form, platform: e.target.value })}
                style={styles.input}
                className="content-input"
              >
                {['tiktok', 'reels', 'shopee', 'youtube', 'facebook'].map(p => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Content Type</label>
              <select
                value={form.content_type}
                onChange={e => setForm({ ...form, content_type: e.target.value })}
                style={styles.input}
                className="content-input"
              >
                {['product-review', 'tutorial', 'behind-the-scenes', 'promo', 'testimonial', 'other'].map(t => (
                  <option key={t} value={t}>
                    {t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Assigned To</label>
              <input
                type="text"
                placeholder="Team member name"
                value={form.assigned_to}
                onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                style={styles.input}
                className="content-input"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm({ ...form, due_date: e.target.value })}
                style={styles.input}
                className="content-input"
              />
            </div>

            <div
              style={{ ...styles.inputGroup, gridColumn: 'span 2' }}
              className="content-span-2"
            >
              <label style={styles.label}>Notes</label>
              <input
                type="text"
                placeholder="Optional notes"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={styles.input}
                className="content-input"
              />
            </div>
          </div>

          <button onClick={handleSubmit} style={styles.submitBtn} className="content-submit-btn">
            Create Task
          </button>
        </div>
      )}

      {editId && (
        <div style={{ ...styles.form, borderLeft: '4px solid #c4607a' }}>
          <h4 style={styles.formTitle}>Update Content</h4>

          <div className="content-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Status</label>
              <select
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                style={styles.input}
                className="content-input"
              >
                {['idea', 'in-progress', 'for-review', 'published', 'cancelled'].map(s => (
                  <option key={s} value={s}>
                    {s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Views</label>
              <input
                type="number"
                value={editForm.views}
                onChange={e => setEditForm({ ...editForm, views: e.target.value })}
                style={styles.input}
                className="content-input"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Likes</label>
              <input
                type="number"
                value={editForm.likes}
                onChange={e => setEditForm({ ...editForm, likes: e.target.value })}
                style={styles.input}
                className="content-input"
              />
            </div>

            <div
              style={{ ...styles.inputGroup, gridColumn: 'span 3' }}
              className="content-span-3"
            >
              <label style={styles.label}>Notes</label>
              <input
                type="text"
                value={editForm.notes}
                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                style={styles.input}
                className="content-input"
              />
            </div>
          </div>

          <div className="content-edit-actions">
            <button onClick={handleUpdate} style={styles.submitBtn} className="content-submit-btn">
              Save
            </button>
            <button onClick={() => setEditId(null)} style={styles.cancelBtn} className="content-cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      )}

      <p style={styles.resultCount}>{filtered.length} task{filtered.length !== 1 ? 's' : ''} found</p>

      <div style={styles.kanban}>
        {kanbanStatuses.map(status => {
          const cards = filtered.filter(c => c.status === status);
          return (
            <div key={status} style={styles.kanbanCol}>
              <div style={styles.kanbanHeader}>
                <span style={{ ...styles.kanbanLabel, ...statusColors[status] }}>
                  {status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
                <span style={styles.kanbanCount}>{cards.length}</span>
              </div>

              {cards.length === 0 ? (
                <div style={styles.kanbanEmpty}>No tasks</div>
              ) : cards.map(c => (
                <div key={c.id} style={styles.kanbanCard}>
                  <div style={styles.kanbanCardTop}>
                    <span style={styles.platformBadge}>{platformIcons[c.platform]} {c.platform}</span>
                    <span style={styles.contentType}>{c.content_type}</span>
                  </div>

                  <p style={styles.kanbanTitle}>{c.title}</p>
                  {c.assigned_to && <p style={styles.kanbanMeta}>{c.assigned_to}</p>}
                  {c.due_date && <p style={styles.kanbanMeta}>{new Date(c.due_date).toLocaleDateString()}</p>}

                  {c.status === 'published' && (
                    <div style={styles.kanbanStats}>
                      <span>{c.views.toLocaleString()}</span>
                      <span>{c.likes.toLocaleString()}</span>
                    </div>
                  )}

                  <div style={styles.kanbanActions}>
                    <button
                      onClick={() => {
                        setEditId(c.id);
                        setEditForm({
                          status: c.status,
                          views: c.views,
                          likes: c.likes,
                          notes: c.notes || '',
                        });
                      }}
                      style={styles.editBtn}
                    >
                      Edit
                    </button>

                    <button onClick={() => handleDelete(c.id)} style={styles.deleteBtn}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
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
  message: { backgroundColor: '#eafaf1', color: '#27ae60', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  filterRow: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  filter: { padding: '6px 14px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', color: '#555' },
  filterActive: { padding: '6px 14px', borderRadius: '20px', border: '1px solid #302e2e', backgroundColor: '#302e2e', cursor: 'pointer', fontSize: '13px', color: '#fff' },
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
  submitBtn: { padding: '11px 24px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  cancelBtn: { padding: '11px 24px', backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  resultCount: { fontSize: '13px', color: '#888', margin: '0 0 12px' },
  kanban: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  kanbanCol: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '16px' },
  kanbanHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  kanbanLabel: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  kanbanCount: { backgroundColor: '#ddd', color: '#555', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600' },
  kanbanEmpty: { textAlign: 'center', color: '#ccc', fontSize: '13px', padding: '20px 0' },
  kanbanCard: { backgroundColor: '#fff', borderRadius: '8px', padding: '12px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  kanbanCardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' },
  platformBadge: { fontSize: '11px', color: '#888' },
  contentType: { fontSize: '11px', backgroundColor: '#f0f0f0', color: '#555', padding: '2px 8px', borderRadius: '10px' },
  kanbanTitle: { fontSize: '13px', fontWeight: '600', color: '#302e2e', margin: '0 0 4px' },
  kanbanMeta: { fontSize: '11px', color: '#aaa', margin: '2px 0' },
  kanbanStats: { display: 'flex', gap: '10px', fontSize: '12px', color: '#555', margin: '6px 0' },
  kanbanActions: { display: 'flex', gap: '6px', marginTop: '8px' },
  editBtn: { flex: 1, padding: '5px', backgroundColor: '#eaf4fb', color: '#2980b9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  deleteBtn: { flex: 1, padding: '5px', backgroundColor: '#fdf0f3', color: '#c4607a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
};

export default ContentCreation;
import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaShopify,
  FaYoutube,
  FaPhotoVideo,
  FaPlus,
  FaTimes,
  FaSearch,
  FaSave,
  FaEdit,
  FaTrash,
  FaEye,
  FaHeart,
  FaCalendar,
  FaUser,
} from "react-icons/fa";

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
      setMessage('Content task created successfully!');
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
      setMessage('Content updated successfully!');
      setEditId(null);
      fetchContent();
    } catch (err) {
      setMessage('Error updating content.');
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
    idea: { backgroundColor: '#f8f3f5', color: '#6b5b63', borderColor: '#c9b6bf' },
    'in-progress': { backgroundColor: '#fff7e8', color: '#9a5f0f', borderColor: '#d98a1f' },
    'for-review': { backgroundColor: '#fff1f5', color: '#b5536b', borderColor: '#c4607a' },
    published: { backgroundColor: '#ecfdf3', color: '#2f7d56', borderColor: '#2f9d6a' },
    cancelled: { backgroundColor: '#f8f3f5', color: '#6b5b63', borderColor: '#c9b6bf' },
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
  const filterOptions = ['all', 'idea', 'in-progress', 'for-review', 'published', 'cancelled'];

  const formatStatus = (value) =>
    value === 'all'
      ? 'All'
      : value.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <Layout>
      <style>{`
        .content-page {
          width: 100%;
          min-width: 0;
          animation: contentFadeUp 0.35s ease both;
        }

        .content-hero {
          background:
            radial-gradient(circle at top right, rgba(196, 96, 122, 0.18), transparent 34%),
            linear-gradient(135deg, #fff7fa 0%, #ffffff 100%);
          border: 1px solid #ead1d9;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .content-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .content-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .content-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .content-hero-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          font-size: 24px;
          box-shadow: 0 8px 24px rgba(196, 96, 122, 0.25);
          flex: 0 0 auto;
        }

        .content-toolbar {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .content-search-wrap {
          position: relative;
          width: 300px;
          max-width: 100%;
        }

        .content-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b5536b;
          font-size: 13px;
          pointer-events: none;
        }

        .content-search {
          width: 100%;
          padding: 11px 13px 11px 36px;
          border-radius: 12px;
          border: 1px solid #d8b8c2;
          background: #fff7fa;
          color: #1f2937;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
        }

        .content-search:focus {
          border-color: #c4607a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
        }

        .content-add-btn,
        .content-submit-btn {
          border: none;
          border-radius: 12px;
          padding: 11px 16px;
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 18px rgba(196, 96, 122, 0.22);
          transition: transform 180ms ease, box-shadow 180ms ease;
          white-space: nowrap;
        }

        .content-add-btn:hover,
        .content-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .content-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid #2f9d6a;
          background: #ecfdf3;
          color: #2f7d56;
        }

        .content-filters {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .content-filter-btn {
          padding: 8px 13px;
          border-radius: 9999px;
          border: 1px solid #d8b8c2;
          background: #ffffff;
          color: #64748b;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease;
        }

        .content-filter-btn:hover {
          transform: translateY(-1px);
          border-color: #c4607a;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .content-filter-active {
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          border-color: #c4607a;
          box-shadow: 0 8px 18px rgba(196, 96, 122, 0.18);
        }

        .content-form {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .content-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .content-form-icon {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: #fff1f5;
          border: 1px solid #e8b9c6;
          color: #b5536b;
          flex: 0 0 auto;
        }

        .content-form-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .content-form-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .content-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .content-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .content-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .content-input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border-radius: 12px;
          border: 1px solid #d8b8c2;
          background: #ffffff;
          color: #1f2937;
          font-size: 14px;
          outline: none;
          font-family: Segoe UI, sans-serif;
          transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
        }

        .content-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .content-span-2 {
          grid-column: span 2;
        }

        .content-span-3 {
          grid-column: span 3;
        }

        .content-edit-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .content-cancel-btn {
          border: 1px solid #d8b8c2;
          border-radius: 12px;
          padding: 11px 16px;
          background: #ffffff;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .content-result-count {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .content-kanban {
          display: grid;
          grid-template-columns: repeat(4, minmax(260px, 1fr));
          gap: 16px;
          max-width: 100%;
        }

        .content-kanban-col {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 14px;
          min-width: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .content-kanban-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .content-kanban-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid;
          text-transform: capitalize;
        }

        .content-kanban-count {
          width: 26px;
          height: 26px;
          border-radius: 9999px;
          display: grid;
          place-items: center;
          background: #fff1f5;
          color: #b5536b;
          border: 1px solid #e8b9c6;
          font-size: 12px;
          font-weight: 850;
          flex: 0 0 auto;
        }

        .content-kanban-empty {
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 700;
          padding: 24px 0;
          border: 1px dashed #e2c6cf;
          border-radius: 14px;
          background: #fff7fa;
        }

        .content-kanban-card {
          background: #fff7fa;
          border: 1px solid #ead1d9;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 10px;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .content-kanban-card:hover {
          transform: translateY(-2px);
          border-color: #c4607a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .content-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 10px;
        }

        .content-platform-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #b5536b;
          background: #ffffff;
          border: 1px solid #e8b9c6;
          border-radius: 9999px;
          padding: 6px 9px;
          font-size: 11px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .content-type {
          font-size: 11px;
          background: #ffffff;
          color: #64748b;
          border: 1px solid #ead1d9;
          padding: 6px 9px;
          border-radius: 9999px;
          font-weight: 800;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .content-card-title {
          margin: 0 0 8px;
          color: #1f2937;
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .content-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          margin: 5px 0;
        }

        .content-meta svg {
          color: #b5536b;
          flex: 0 0 auto;
        }

        .content-stats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 10px 0 0;
        }

        .content-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 9999px;
          background: #ffffff;
          color: #374151;
          border: 1px solid #ead1d9;
          font-size: 12px;
          font-weight: 800;
        }

        .content-card-actions {
          display: flex;
          gap: 7px;
          margin-top: 12px;
        }

        .content-edit-btn,
        .content-delete-btn {
          flex: 1;
          border-radius: 10px;
          padding: 8px 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .content-edit-btn {
          background: #fff7e8;
          color: #9a5f0f;
          border-color: #d98a1f;
        }

        .content-delete-btn {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .content-edit-btn:hover,
        .content-delete-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        @keyframes contentFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1300px) {
          .content-kanban {
            grid-template-columns: repeat(2, minmax(260px, 1fr));
          }
        }

        @media (max-width: 900px) {
          .content-form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .content-span-3 {
            grid-column: span 2;
          }

          .content-span-2 {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .content-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .content-title {
            font-size: 24px;
          }

          .content-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .content-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .content-search-wrap,
          .content-add-btn {
            width: 100%;
          }

          .content-kanban {
            grid-template-columns: 1fr;
          }

          .content-edit-actions {
            flex-direction: column;
          }

          .content-submit-btn,
          .content-cancel-btn {
            width: 100%;
          }
        }

        @media (max-width: 520px) {
          .content-hero {
            flex-direction: column-reverse;
          }

          .content-form-grid {
            grid-template-columns: 1fr;
          }

          .content-span-3,
          .content-span-2 {
            grid-column: span 1;
          }

          .content-card-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .content-card-actions {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="content-page">
        <div className="content-hero">
          <div>
            <p className="content-eyebrow">Marketing Content Board</p>
            <h3 className="content-title">Content Creation</h3>
            <p className="content-subtitle">
              Plan, assign, review, and monitor content tasks across social platforms in a clean kanban workflow.
            </p>
          </div>

          <div className="content-hero-icon">
            <FaPhotoVideo />
          </div>
        </div>

        <div className="content-toolbar">
          <div className="content-search-wrap">
            <FaSearch className="content-search-icon" />
            <input
              type="text"
              placeholder="Search content..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="content-search"
            />
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="content-add-btn"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'New Content'}
          </button>
        </div>

        {message && <div className="content-message">{message}</div>}

        <div className="content-filters">
          {filterOptions.map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`content-filter-btn ${filterStatus === status ? 'content-filter-active' : ''}`}
            >
              {formatStatus(status)}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="content-form">
            <div className="content-form-header">
              <div className="content-form-icon">
                <FaPhotoVideo />
              </div>

              <div>
                <h4 className="content-form-title">New Content Task</h4>
                <p className="content-form-note">
                  Add content details, platform, assignee, and due date.
                </p>
              </div>
            </div>

            <div className="content-form-grid">
              <div className="content-field content-span-3">
                <label className="content-label">Content Title</label>
                <input
                  type="text"
                  placeholder="e.g. Skin care routine tutorial"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="content-input"
                />
              </div>

              <div className="content-field">
                <label className="content-label">Platform</label>
                <select
                  value={form.platform}
                  onChange={e => setForm({ ...form, platform: e.target.value })}
                  className="content-input"
                >
                  {['tiktok', 'reels', 'shopee', 'youtube', 'facebook'].map(p => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="content-field">
                <label className="content-label">Content Type</label>
                <select
                  value={form.content_type}
                  onChange={e => setForm({ ...form, content_type: e.target.value })}
                  className="content-input"
                >
                  {['product-review', 'tutorial', 'behind-the-scenes', 'promo', 'testimonial', 'other'].map(t => (
                    <option key={t} value={t}>
                      {formatStatus(t)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="content-field">
                <label className="content-label">Assigned To</label>
                <input
                  type="text"
                  placeholder="Team member name"
                  value={form.assigned_to}
                  onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                  className="content-input"
                />
              </div>

              <div className="content-field">
                <label className="content-label">Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="content-input"
                />
              </div>

              <div className="content-field content-span-2">
                <label className="content-label">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="content-input"
                />
              </div>
            </div>

            <button onClick={handleSubmit} className="content-submit-btn">
              <FaSave />
              Create Task
            </button>
          </div>
        )}

        {editId && (
          <div className="content-form">
            <div className="content-form-header">
              <div className="content-form-icon">
                <FaEdit />
              </div>

              <div>
                <h4 className="content-form-title">Update Content</h4>
                <p className="content-form-note">
                  Update status, views, likes, and notes for this content task.
                </p>
              </div>
            </div>

            <div className="content-form-grid">
              <div className="content-field">
                <label className="content-label">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="content-input"
                >
                  {['idea', 'in-progress', 'for-review', 'published', 'cancelled'].map(s => (
                    <option key={s} value={s}>
                      {formatStatus(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="content-field">
                <label className="content-label">Views</label>
                <input
                  type="number"
                  value={editForm.views}
                  onChange={e => setEditForm({ ...editForm, views: e.target.value })}
                  className="content-input"
                />
              </div>

              <div className="content-field">
                <label className="content-label">Likes</label>
                <input
                  type="number"
                  value={editForm.likes}
                  onChange={e => setEditForm({ ...editForm, likes: e.target.value })}
                  className="content-input"
                />
              </div>

              <div className="content-field content-span-3">
                <label className="content-label">Notes</label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  className="content-input"
                />
              </div>
            </div>

            <div className="content-edit-actions">
              <button onClick={handleUpdate} className="content-submit-btn">
                <FaSave />
                Save
              </button>

              <button onClick={() => setEditId(null)} className="content-cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="content-result-count">
          {filtered.length} task{filtered.length !== 1 ? 's' : ''} found
        </p>

        <div className="content-kanban">
          {kanbanStatuses.map(status => {
            const cards = filtered.filter(c => c.status === status);

            return (
              <div key={status} className="content-kanban-col">
                <div className="content-kanban-header">
                  <span
                    className="content-kanban-label"
                    style={statusColors[status]}
                  >
                    {formatStatus(status)}
                  </span>

                  <span className="content-kanban-count">{cards.length}</span>
                </div>

                {cards.length === 0 ? (
                  <div className="content-kanban-empty">No tasks</div>
                ) : (
                  cards.map(c => (
                    <div key={c.id} className="content-kanban-card">
                      <div className="content-card-top">
                        <span className="content-platform-badge">
                          {platformIcons[c.platform]}
                          {c.platform}
                        </span>

                        <span className="content-type">
                          {formatStatus(c.content_type)}
                        </span>
                      </div>

                      <p className="content-card-title">{c.title}</p>

                      {c.assigned_to && (
                        <p className="content-meta">
                          <FaUser />
                          {c.assigned_to}
                        </p>
                      )}

                      {c.due_date && (
                        <p className="content-meta">
                          <FaCalendar />
                          {new Date(c.due_date).toLocaleDateString()}
                        </p>
                      )}

                      {c.status === 'published' && (
                        <div className="content-stats">
                          <span className="content-stat-pill">
                            <FaEye />
                            {Number(c.views || 0).toLocaleString()}
                          </span>

                          <span className="content-stat-pill">
                            <FaHeart />
                            {Number(c.likes || 0).toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="content-card-actions">
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
                          className="content-edit-btn"
                        >
                          <FaEdit />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(c.id)}
                          className="content-delete-btn"
                        >
                          <FaTrash />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

export default ContentCreation;
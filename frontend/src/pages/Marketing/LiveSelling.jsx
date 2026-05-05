import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaShopify,
  FaYoutube,
  FaBroadcastTower,
  FaPlus,
  FaTimes,
  FaSearch,
  FaSave,
  FaEdit,
  FaTrash,
  FaCalendar,
} from "react-icons/fa";

function LiveSelling() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [search, setSearch] = useState('');
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({
    title: '',
    platform: 'tiktok',
    scheduled_date: '',
    host: '',
    products_featured: '',
    target_sales: '',
    notes: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/marketing/live-selling');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/marketing/live-selling', form);
      setMessage('Live selling event created successfully!');
      setIsError(false);
      setShowForm(false);
      setForm({
        title: '',
        platform: 'tiktok',
        scheduled_date: '',
        host: '',
        products_featured: '',
        target_sales: '',
        notes: '',
      });
      fetchEvents();
    } catch (err) {
      setMessage('Error creating event.');
      setIsError(true);
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/marketing/live-selling/${editId}`, editForm);
      setMessage('Event updated successfully!');
      setIsError(false);
      setEditId(null);
      fetchEvents();
    } catch (err) {
      setMessage('Error updating event.');
      setIsError(true);
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/marketing/live-selling/${id}`);
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.platform.toLowerCase().includes(search.toLowerCase()) ||
    (e.host || '').toLowerCase().includes(search.toLowerCase()) ||
    e.status.toLowerCase().includes(search.toLowerCase())
  );

  const platformIcons = {
    tiktok: <FaTiktok />,
    shopee: <FaShopify />,
    facebook: <FaFacebook />,
    instagram: <FaInstagram />,
    youtube: <FaYoutube />,
  };

  const statusColors = {
    scheduled: { backgroundColor: '#fff7e8', color: '#9a5f0f', borderColor: '#d98a1f' },
    live: { backgroundColor: '#fff1f5', color: '#b5536b', borderColor: '#c4607a' },
    completed: { backgroundColor: '#ecfdf3', color: '#2f7d56', borderColor: '#2f9d6a' },
    cancelled: { backgroundColor: '#f8f3f5', color: '#6b5b63', borderColor: '#c9b6bf' },
  };

  return (
    <Layout>
      <style>{`
        .live-page {
          width: 100%;
          min-width: 0;
          animation: liveFadeUp 0.35s ease both;
        }

        .live-hero {
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

        .live-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .live-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .live-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .live-hero-icon {
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

        .live-toolbar {
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

        .live-search-wrap {
          position: relative;
          width: 300px;
          max-width: 100%;
        }

        .live-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b5536b;
          font-size: 13px;
          pointer-events: none;
        }

        .live-search {
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

        .live-search:focus {
          border-color: #c4607a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
        }

        .live-add-btn,
        .live-submit-btn {
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

        .live-add-btn:hover,
        .live-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .live-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .live-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .live-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .live-form {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .live-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .live-form-icon {
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

        .live-form-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .live-form-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .live-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .live-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .live-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .live-input {
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

        .live-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .live-span-2 {
          grid-column: span 2;
        }

        .live-span-3 {
          grid-column: span 3;
        }

        .live-form-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .live-cancel-btn {
          border: 1px solid #d8b8c2;
          border-radius: 12px;
          padding: 11px 16px;
          background: #ffffff;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .live-result-count {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .live-table-panel {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          max-width: 100%;
          overflow: hidden;
        }

        .live-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #ead1d9;
          border-radius: 14px;
        }

        .live-table {
          width: 100%;
          min-width: 980px;
          border-collapse: collapse;
          background: #ffffff;
        }

        .live-table thead {
          background: #fff7fa;
        }

        .live-table th {
          padding: 13px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #ead1d9;
          white-space: nowrap;
        }

        .live-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #f3e8ec;
          white-space: nowrap;
          vertical-align: middle;
        }

        .live-table tbody tr {
          transition: background-color 180ms ease;
        }

        .live-table tbody tr:hover {
          background: #fff7fa;
        }

        .live-table tbody tr:last-child td {
          border-bottom: none;
        }

        .live-event-title {
          font-weight: 850;
          color: #1f2937;
        }

        .live-platform-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 10px;
          border-radius: 9999px;
          background: #fff1f5;
          color: #b5536b;
          border: 1px solid #e8b9c6;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .live-status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
          border: 1px solid;
          white-space: nowrap;
        }

        .live-money {
          font-weight: 850;
          color: #b5536b;
        }

        .live-action-row {
          display: flex;
          gap: 7px;
        }

        .live-edit-btn,
        .live-delete-btn {
          border-radius: 10px;
          padding: 8px 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .live-edit-btn {
          background: #fff7e8;
          color: #9a5f0f;
          border-color: #d98a1f;
        }

        .live-delete-btn {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .live-edit-btn:hover,
        .live-delete-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .live-empty {
          padding: 40px !important;
          text-align: center;
          color: #94a3b8 !important;
          font-size: 14px !important;
          font-weight: 700;
        }

        @keyframes liveFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1180px) {
          .live-form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .live-span-2,
          .live-span-3 {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .live-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .live-title {
            font-size: 24px;
          }

          .live-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .live-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .live-search-wrap,
          .live-add-btn {
            width: 100%;
          }

          .live-form-grid {
            grid-template-columns: 1fr;
          }

          .live-span-2,
          .live-span-3 {
            grid-column: span 1;
          }

          .live-form-actions {
            flex-direction: column;
          }

          .live-submit-btn,
          .live-cancel-btn {
            width: 100%;
          }

          .live-table-panel {
            padding: 12px;
          }

          .live-table {
            min-width: 860px;
          }

          .live-table th,
          .live-table td {
            padding: 11px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 520px) {
          .live-hero {
            flex-direction: column-reverse;
          }
        }
      `}</style>

      <div className="live-page">
        <div className="live-hero">
          <div>
            <p className="live-eyebrow">Marketing Live Commerce</p>
            <h3 className="live-title">Live Selling Events</h3>
            <p className="live-subtitle">
              Schedule live selling sessions, track hosts, featured products, target sales, actual sales, and viewer turnout.
            </p>
          </div>

          <div className="live-hero-icon">
            <FaBroadcastTower />
          </div>
        </div>

        <div className="live-toolbar">
          <div className="live-search-wrap">
            <FaSearch className="live-search-icon" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="live-search"
            />
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="live-add-btn"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'Schedule Live'}
          </button>
        </div>

        {message && (
          <div className={`live-message ${isError ? 'live-message-error' : 'live-message-success'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="live-form">
            <div className="live-form-header">
              <div className="live-form-icon">
                <FaBroadcastTower />
              </div>

              <div>
                <h4 className="live-form-title">Schedule Live Selling</h4>
                <p className="live-form-note">
                  Add live event details, products, host, schedule, and target sales.
                </p>
              </div>
            </div>

            <div className="live-form-grid">
              <div className="live-field live-span-2">
                <label className="live-label">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Mega Sale Live"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="live-input"
                />
              </div>

              <div className="live-field">
                <label className="live-label">Platform</label>
                <select
                  value={form.platform}
                  onChange={e => setForm({ ...form, platform: e.target.value })}
                  className="live-input"
                >
                  {['tiktok', 'shopee', 'facebook', 'instagram', 'youtube'].map(p => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="live-field">
                <label className="live-label">Scheduled Date and Time</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_date}
                  onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                  className="live-input"
                />
              </div>

              <div className="live-field">
                <label className="live-label">Host</label>
                <input
                  type="text"
                  placeholder="Host name"
                  value={form.host}
                  onChange={e => setForm({ ...form, host: e.target.value })}
                  className="live-input"
                />
              </div>

              <div className="live-field">
                <label className="live-label">Target Sales</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.target_sales}
                  onChange={e => setForm({ ...form, target_sales: e.target.value })}
                  className="live-input"
                />
              </div>

              <div className="live-field live-span-3">
                <label className="live-label">Products Featured</label>
                <input
                  type="text"
                  placeholder="e.g. Serum, Toner, Sunscreen"
                  value={form.products_featured}
                  onChange={e => setForm({ ...form, products_featured: e.target.value })}
                  className="live-input"
                />
              </div>

              <div className="live-field live-span-3">
                <label className="live-label">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="live-input"
                />
              </div>
            </div>

            <button onClick={handleSubmit} className="live-submit-btn">
              <FaSave />
              Save Event
            </button>
          </div>
        )}

        {editId && (
          <div className="live-form">
            <div className="live-form-header">
              <div className="live-form-icon">
                <FaEdit />
              </div>

              <div>
                <h4 className="live-form-title">Update Event Status</h4>
                <p className="live-form-note">
                  Update status, actual sales, viewers, and event notes.
                </p>
              </div>
            </div>

            <div className="live-form-grid">
              <div className="live-field">
                <label className="live-label">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="live-input"
                >
                  {['scheduled', 'live', 'completed', 'cancelled'].map(s => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="live-field">
                <label className="live-label">Actual Sales</label>
                <input
                  type="number"
                  value={editForm.actual_sales}
                  onChange={e => setEditForm({ ...editForm, actual_sales: e.target.value })}
                  className="live-input"
                />
              </div>

              <div className="live-field">
                <label className="live-label">Viewers</label>
                <input
                  type="number"
                  value={editForm.viewers}
                  onChange={e => setEditForm({ ...editForm, viewers: e.target.value })}
                  className="live-input"
                />
              </div>

              <div className="live-field live-span-3">
                <label className="live-label">Notes</label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  className="live-input"
                />
              </div>
            </div>

            <div className="live-form-actions">
              <button onClick={handleUpdate} className="live-submit-btn">
                <FaSave />
                Save Changes
              </button>

              <button onClick={() => setEditId(null)} className="live-cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="live-result-count">
          {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
        </p>

        <div className="live-table-panel">
          <div className="live-table-wrap">
            <table className="live-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Platform</th>
                  <th>Scheduled</th>
                  <th>Host</th>
                  <th>Target</th>
                  <th>Actual</th>
                  <th>Viewers</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="live-empty">
                      No events found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(e => (
                    <tr key={e.id}>
                      <td className="live-event-title">{e.title}</td>
                      <td>
                        <span className="live-platform-pill">
                          {platformIcons[e.platform]}
                          {e.platform}
                        </span>
                      </td>
                      <td>
                        <FaCalendar style={{ color: '#b5536b', marginRight: 6 }} />
                        {new Date(e.scheduled_date).toLocaleString()}
                      </td>
                      <td>{e.host || 'Not assigned'}</td>
                      <td className="live-money">₱{Number(e.target_sales).toLocaleString()}</td>
                      <td className="live-money">₱{Number(e.actual_sales).toLocaleString()}</td>
                      <td>{Number(e.viewers || 0).toLocaleString()}</td>
                      <td>
                        <span
                          className="live-status-badge"
                          style={statusColors[e.status] || statusColors.scheduled}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td>
                        <div className="live-action-row">
                          <button
                            onClick={() => {
                              setEditId(e.id);
                              setEditForm({
                                status: e.status,
                                actual_sales: e.actual_sales,
                                viewers: e.viewers,
                                notes: e.notes || '',
                              });
                            }}
                            className="live-edit-btn"
                          >
                            <FaEdit />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(e.id)}
                            className="live-delete-btn"
                          >
                            <FaTrash />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default LiveSelling;
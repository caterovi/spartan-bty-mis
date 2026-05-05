import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import CampaignDetail from './CampaignDetail';
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaAt,
  FaYoutube,
  FaBars,
  FaCalendar,
  FaLightbulb,
  FaCamera,
  FaMicrophone,
  FaBullhorn,
  FaPlus,
  FaTimes,
  FaTrash,
  FaSearch,
} from "react-icons/fa";

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    platform: 'facebook',
    start_date: '',
    end_date: '',
    status: 'draft',
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/marketing/campaigns');
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/marketing/campaigns', form);
      setMessage('success:Campaign created successfully!');
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        platform: 'facebook',
        start_date: '',
        end_date: '',
        status: 'draft'
      });
      fetchCampaigns();
    } catch (err) {
      setMessage('error:Error creating campaign.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/marketing/campaigns/${id}`, { status });
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/marketing/campaigns/${id}`);
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  if (selectedId) {
    return (
      <CampaignDetail
        campaignId={selectedId}
        onBack={() => {
          setSelectedId(null);
          fetchCampaigns();
        }}
      />
    );
  }

  const filtered = campaigns.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.platform.toLowerCase().includes(search.toLowerCase()) ||
    c.status.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    draft: { backgroundColor: '#f8f3f5', color: '#6b5b63', borderColor: '#c9b6bf' },
    'in-progress': { backgroundColor: '#fff7e8', color: '#9a5f0f', borderColor: '#d98a1f' },
    completed: { backgroundColor: '#ecfdf3', color: '#2f7d56', borderColor: '#2f9d6a' },
    cancelled: { backgroundColor: '#fff1f5', color: '#b5536b', borderColor: '#c4607a' },
  };

  const platformIcons = {
    facebook: <FaFacebook />,
    instagram: <FaInstagram />,
    tiktok: <FaTiktok />,
    email: <FaAt />,
    youtube: <FaYoutube />,
    other: <FaBars />,
  };

  const isError = message.startsWith('error:');
  const msgText = message.replace(/^(success:|error:)/, '');

  return (
    <Layout>
      <style>{`
        .campaigns-page {
          width: 100%;
          animation: campaignsFadeUp 0.35s ease both;
        }

        .campaigns-hero {
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

        .campaigns-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .campaigns-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .campaigns-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .campaigns-hero-icon {
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

        .campaigns-toolbar {
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

        .campaigns-search-wrap {
          position: relative;
          width: 280px;
          max-width: 100%;
        }

        .campaigns-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b5536b;
          font-size: 13px;
          pointer-events: none;
        }

        .campaigns-search {
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

        .campaigns-search:focus {
          border-color: #c4607a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
        }

        .campaigns-add-btn,
        .campaigns-submit-btn {
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
          transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
          white-space: nowrap;
        }

        .campaigns-add-btn:hover,
        .campaigns-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .campaigns-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .campaigns-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .campaigns-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .campaigns-form {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .campaigns-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .campaigns-form-icon {
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

        .campaigns-form-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .campaigns-form-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .campaigns-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .campaigns-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .campaigns-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .campaigns-input {
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

        .campaigns-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .campaigns-title-span-2 {
          grid-column: span 2;
        }

        .campaigns-desc-span-3 {
          grid-column: span 3;
        }

        .campaigns-result-count {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .campaigns-card-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .campaigns-card {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 18px;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .campaigns-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: linear-gradient(180deg, #c4607a, #e58ca3);
        }

        .campaigns-card:hover {
          transform: translateY(-2px);
          border-color: #c4607a;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .campaigns-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .campaigns-platform {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #b5536b;
          background: #fff1f5;
          border: 1px solid #e8b9c6;
          border-radius: 9999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .campaigns-badge {
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

        .campaigns-card-title {
          margin: 0;
          color: #1f2937;
          font-size: 17px;
          font-weight: 850;
          letter-spacing: -0.02em;
          line-height: 1.35;
        }

        .campaigns-card-desc {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 39px;
        }

        .campaigns-progress {
          background: #fff7fa;
          border: 1px solid #ead1d9;
          border-radius: 14px;
          padding: 12px;
        }

        .campaigns-progress-header {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }

        .campaigns-progress-label {
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
        }

        .campaigns-progress-pct {
          color: #1f2937;
          font-size: 13px;
          font-weight: 850;
        }

        .campaigns-progress-track {
          height: 10px;
          border-radius: 9999px;
          background: #f3e8ec;
          overflow: hidden;
          border: 1px solid #ead1d9;
        }

        .campaigns-progress-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 320ms ease;
          min-width: 8px;
        }

        .campaigns-progress-sub {
          margin: 7px 0 0;
          color: #7b8794;
          font-size: 12px;
          font-weight: 600;
        }

        .campaigns-card-dates {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.4;
        }

        .campaigns-equip-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .campaigns-equip-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 800;
          color: #374151;
          background: #fff7fa;
          border: 1px solid #ead1d9;
          padding: 6px 9px;
          border-radius: 9999px;
          transition: background-color 180ms ease, opacity 180ms ease;
        }

        .campaigns-card-actions {
          display: flex;
          gap: 8px;
          margin-top: 2px;
        }

        .campaigns-status-select {
          flex: 1;
          min-width: 0;
          padding: 9px 10px;
          border-radius: 10px;
          border: 1px solid #d8b8c2;
          background: #ffffff;
          color: #374151;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          outline: none;
        }

        .campaigns-delete-btn {
          border: 1px solid #c4607a;
          border-radius: 10px;
          padding: 9px 12px;
          background: #fff1f5;
          color: #b5536b;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
        }

        .campaigns-delete-btn:hover {
          background: #ffe4ec;
          transform: translateY(-1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .campaigns-click-hint {
          margin-top: auto;
          color: #b5536b;
          text-align: center;
          font-size: 12px;
          font-weight: 800;
        }

        .campaigns-empty {
          background: #ffffff;
          border: 1px dashed #e2c6cf;
          border-radius: 18px;
          padding: 42px 20px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 700;
        }

        @keyframes campaignsFadeUp {
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
          .campaigns-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .campaigns-form-grid {
            grid-template-columns: 1fr;
          }

          .campaigns-title-span-2,
          .campaigns-desc-span-3 {
            grid-column: span 1;
          }
        }

        @media (max-width: 768px) {
          .campaigns-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .campaigns-title {
            font-size: 24px;
          }

          .campaigns-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .campaigns-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .campaigns-search-wrap,
          .campaigns-add-btn {
            width: 100%;
          }

          .campaigns-card-grid {
            grid-template-columns: 1fr;
          }

          .campaigns-card-actions {
            flex-direction: column;
          }

          .campaigns-status-select,
          .campaigns-delete-btn {
            width: 100%;
          }
        }

        @media (max-width: 520px) {
          .campaigns-hero {
            flex-direction: column-reverse;
          }

          .campaigns-card-top {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="campaigns-page">
        <div className="campaigns-hero">
          <div>
            <p className="campaigns-eyebrow">Marketing Management</p>
            <h3 className="campaigns-title">Campaign List</h3>
            <p className="campaigns-subtitle">
              Create, monitor, and manage marketing campaigns with progress tracking and equipment preparation.
            </p>
          </div>

          <div className="campaigns-hero-icon">
            <FaBullhorn />
          </div>
        </div>

        <div className="campaigns-toolbar">
          <div className="campaigns-search-wrap">
            <FaSearch className="campaigns-search-icon" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="campaigns-search"
            />
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="campaigns-add-btn"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'New Campaign'}
          </button>
        </div>

        {message && (
          <div
            className={`campaigns-message ${
              isError ? 'campaigns-message-error' : 'campaigns-message-success'
            }`}
          >
            {msgText}
          </div>
        )}

        {showForm && (
          <div className="campaigns-form">
            <div className="campaigns-form-header">
              <div className="campaigns-form-icon">
                <FaBullhorn />
              </div>

              <div>
                <h4 className="campaigns-form-title">Create New Campaign</h4>
                <p className="campaigns-form-note">
                  Add campaign details, schedule, platform, and status.
                </p>
              </div>
            </div>

            <div className="campaigns-form-grid">
              <div className="campaigns-field campaigns-title-span-2">
                <label className="campaigns-label">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Sale 2025"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="campaigns-input"
                />
              </div>

              <div className="campaigns-field">
                <label className="campaigns-label">Platform</label>
                <select
                  value={form.platform}
                  onChange={e => setForm({ ...form, platform: e.target.value })}
                  className="campaigns-input"
                >
                  {['facebook', 'instagram', 'tiktok', 'email', 'youtube', 'other'].map(p => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campaigns-field">
                <label className="campaigns-label">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                  className="campaigns-input"
                />
              </div>

              <div className="campaigns-field">
                <label className="campaigns-label">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                  className="campaigns-input"
                />
              </div>

              <div className="campaigns-field">
                <label className="campaigns-label">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="campaigns-input"
                >
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="campaigns-field campaigns-desc-span-3">
                <label className="campaigns-label">Description</label>
                <textarea
                  placeholder="Campaign description..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="campaigns-input"
                  style={{ minHeight: '88px', resize: 'vertical' }}
                />
              </div>
            </div>

            <button onClick={handleSubmit} className="campaigns-submit-btn">
              <FaPlus />
              Save Campaign
            </button>
          </div>
        )}

        <p className="campaigns-result-count">
          {filtered.length} campaign{filtered.length !== 1 ? 's' : ''} found. Click a card to view details.
        </p>

        {filtered.length === 0 ? (
          <div className="campaigns-empty">No campaigns found.</div>
        ) : (
          <div className="campaigns-card-grid">
            {filtered.map(c => {
              const progressColor =
                c.progress === 100 ? '#2f9d6a' :
                c.progress >= 50 ? '#d98a1f' :
                '#c4607a';

              return (
                <div
                  key={c.id}
                  className="campaigns-card"
                  onClick={() => setSelectedId(c.id)}
                >
                  <div className="campaigns-card-top">
                    <span className="campaigns-platform">
                      {platformIcons[c.platform] || platformIcons.other}
                      {c.platform}
                    </span>

                    <span
                      className="campaigns-badge"
                      style={statusColors[c.status] || statusColors.draft}
                    >
                      {String(c.status).replaceAll('-', ' ')}
                    </span>
                  </div>

                  <h4 className="campaigns-card-title">{c.title}</h4>
                  <p className="campaigns-card-desc">{c.description || 'No description'}</p>

                  <div className="campaigns-progress">
                    <div className="campaigns-progress-header">
                      <span className="campaigns-progress-label">Progress</span>
                      <span className="campaigns-progress-pct">{c.progress}%</span>
                    </div>

                    <div className="campaigns-progress-track">
                      <div
                        className="campaigns-progress-fill"
                        style={{
                          width: `${c.progress}%`,
                          backgroundColor: progressColor,
                        }}
                      />
                    </div>

                    <p className="campaigns-progress-sub">
                      {c.completed_tasks}/{c.total_tasks} tasks completed
                    </p>
                  </div>

                  <p className="campaigns-card-dates">
                    <FaCalendar />
                    {new Date(c.start_date).toLocaleDateString()} to {new Date(c.end_date).toLocaleDateString()}
                  </p>

                  <div className="campaigns-equip-row">
                    <span
                      className="campaigns-equip-item"
                      style={{ opacity: c.equip_lights ? 1 : 0.36 }}
                    >
                      <FaLightbulb /> Lights
                    </span>

                    <span
                      className="campaigns-equip-item"
                      style={{ opacity: c.equip_mic ? 1 : 0.36 }}
                    >
                      <FaMicrophone /> Mic
                    </span>

                    <span
                      className="campaigns-equip-item"
                      style={{ opacity: c.equip_camera ? 1 : 0.36 }}
                    >
                      <FaCamera /> Camera
                    </span>
                  </div>

                  <div
                    className="campaigns-card-actions"
                    onClick={e => e.stopPropagation()}
                  >
                    <select
                      value={c.status}
                      onChange={e => handleStatusChange(c.id, e.target.value)}
                      className="campaigns-status-select"
                    >
                      <option value="draft">Draft</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={e => handleDelete(c.id, e)}
                      className="campaigns-delete-btn"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  </div>

                  <div className="campaigns-click-hint">View campaign details</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Campaigns;
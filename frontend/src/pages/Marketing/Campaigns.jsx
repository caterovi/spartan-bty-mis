import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
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
  FaMicrophone
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
    draft: { backgroundColor: '#f0f0f0', color: '#888' },
    'in-progress': { backgroundColor: '#fff3cd', color: '#856404' },
    completed: { backgroundColor: '#d4edda', color: '#155724' },
    cancelled: { backgroundColor: '#f8d7da', color: '#721c24' },
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
    <div>
      <style>{`
        .campaigns-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .campaigns-top-right {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .campaigns-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .campaigns-card-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .campaigns-card {
          min-width: 0;
        }

        @media (max-width: 1024px) {
          .campaigns-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .campaigns-top-row {
            flex-direction: column;
            align-items: stretch;
          }

          .campaigns-top-right {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .campaigns-search,
          .campaigns-add-btn {
            width: 100% !important;
          }

          .campaigns-form-grid {
            grid-template-columns: 1fr;
          }

          .campaigns-title-span-2,
          .campaigns-desc-span-3 {
            grid-column: span 1 !important;
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
      `}</style>

      <div className="campaigns-top-row">
        <h3 style={styles.sectionTitle}>Campaign List</h3>

        <div className="campaigns-top-right">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
            className="campaigns-search"
          />
          <button
            onClick={() => setShowForm(!showForm)}
            style={styles.addBtn}
            className="campaigns-add-btn"
          >
            {showForm ? '✕ Cancel' : '+ New Campaign'}
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: '500',
            backgroundColor: isError ? '#f8d7da' : '#d4edda',
            color: isError ? '#721c24' : '#155724',
            border: `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`,
          }}
        >
          {msgText}
        </div>
      )}

      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>Create New Campaign</h4>

          <div className="campaigns-form-grid">
            <div
              style={{ ...styles.inputGroup, gridColumn: 'span 2' }}
              className="campaigns-title-span-2"
            >
              <label style={styles.label}>Campaign Title</label>
              <input
                type="text"
                placeholder="e.g. Summer Sale 2025"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Platform</label>
              <select
                value={form.platform}
                onChange={e => setForm({ ...form, platform: e.target.value })}
                style={styles.input}
              >
                {['facebook', 'instagram', 'tiktok', 'email', 'youtube', 'other'].map(p => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                style={styles.input}
              >
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div
              style={{ ...styles.inputGroup, gridColumn: 'span 3' }}
              className="campaigns-desc-span-3"
            >
              <label style={styles.label}>Description</label>
              <textarea
                placeholder="Campaign description..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ ...styles.input, height: '80px', resize: 'vertical' }}
              />
            </div>
          </div>

          <button onClick={handleSubmit} style={styles.submitBtn}>
            Save Campaign
          </button>
        </div>
      )}

      <p style={styles.resultCount}>
        {filtered.length} campaign{filtered.length !== 1 ? 's' : ''} — click a card to view details
      </p>

      {filtered.length === 0 ? (
        <div style={styles.empty}>No campaigns found.</div>
      ) : (
        <div className="campaigns-card-grid">
          {filtered.map(c => (
            <div
              key={c.id}
              style={styles.card}
              className="campaigns-card"
              onClick={() => setSelectedId(c.id)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
              }}
            >
              <div style={styles.cardTop}>
                <span style={styles.platform}>
                  {platformIcons[c.platform]} {c.platform}
                </span>
                <span style={{ ...styles.badge, ...statusColors[c.status] }}>
                  {c.status}
                </span>
              </div>

              <h4 style={styles.cardTitle}>{c.title}</h4>
              <p style={styles.cardDesc}>{c.description || 'No description'}</p>

              <div style={styles.progressSection}>
                <div style={styles.progressHeader}>
                  <span style={styles.progressLabel}>Progress</span>
                  <span style={styles.progressPct}>{c.progress}%</span>
                </div>

                <div style={styles.progressTrack}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${c.progress}%`,
                      backgroundColor:
                        c.progress === 100 ? '#27ae60' :
                        c.progress >= 50 ? '#f39c12' : '#c4607a',
                    }}
                  />
                </div>

                <p style={styles.progressSub}>
                  {c.completed_tasks}/{c.total_tasks} tasks completed
                </p>
              </div>

              <p style={styles.cardDates}>
                <FaCalendar /> {new Date(c.start_date).toLocaleDateString()} – {new Date(c.end_date).toLocaleDateString()}
              </p>

              <div style={styles.equipRow}>
                <span style={{ ...styles.equipItem, opacity: c.equip_lights ? 1 : 0.3 }}>
                  <FaLightbulb /> Lights
                </span>
                <span style={{ ...styles.equipItem, opacity: c.equip_mic ? 1 : 0.3 }}>
                  <FaMicrophone /> Mic
                </span>
                <span style={{ ...styles.equipItem, opacity: c.equip_camera ? 1 : 0.3 }}>
                  <FaCamera /> Camera
                </span>
              </div>

              <div
                style={styles.cardActions}
                className="campaigns-card-actions"
                onClick={e => e.stopPropagation()}
              >
                <select
                  value={c.status}
                  onChange={e => handleStatusChange(c.id, e.target.value)}
                  style={styles.statusSelect}
                  className="campaigns-status-select"
                >
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  onClick={e => handleDelete(c.id, e)}
                  style={styles.deleteBtn}
                  className="campaigns-delete-btn"
                >
                  Delete
                </button>
              </div>

              <div style={styles.clickHint}>Click to view details</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#302e2e',
    margin: 0
  },
  searchInput: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    width: '220px'
  },
  addBtn: {
    padding: '10px 18px',
    backgroundColor: '#c4607a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  form: {
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '24px'
  },
  formTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#302e2e',
    margin: '0 0 16px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#555'
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'Segoe UI, sans-serif',
    backgroundColor: '#fff',
    width: '100%',
    boxSizing: 'border-box'
  },
  submitBtn: {
    padding: '11px 24px',
    backgroundColor: '#c4607a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  resultCount: {
    fontSize: '13px',
    color: '#888',
    margin: '0 0 12px'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '14px'
  },
  card: {
    border: '1px solid #eee',
    borderRadius: '12px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    overflow: 'hidden'
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px'
  },
  platform: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'capitalize'
  },
  badge: {
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#302e2e',
    margin: 0
  },
  cardDesc: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  progressSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '10px 12px'
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px'
  },
  progressLabel: {
    fontSize: '12px',
    color: '#555',
    fontWeight: '500'
  },
  progressPct: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#302e2e'
  },
  progressTrack: {
    backgroundColor: '#eee',
    borderRadius: '10px',
    height: '8px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '8px',
    borderRadius: '10px',
    transition: 'width 0.5s ease'
  },
  progressSub: {
    fontSize: '11px',
    color: '#aaa',
    margin: '4px 0 0'
  },
  cardDates: {
    fontSize: '12px',
    color: '#aaa',
    margin: 0
  },
  equipRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  equipItem: {
    fontSize: '12px',
    color: '#555',
    backgroundColor: '#f8f9fa',
    padding: '3px 8px',
    borderRadius: '6px',
    transition: 'opacity 0.2s'
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px'
  },
  statusSelect: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '13px',
    cursor: 'pointer',
    minWidth: 0
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  clickHint: {
    fontSize: '11px',
    color: '#c4607a',
    textAlign: 'center',
    fontWeight: '500'
  },
};

export default Campaigns;
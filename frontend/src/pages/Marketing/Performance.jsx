import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaEye, FaMousePointer, FaCheck, FaMoneyCheckAlt } from "react-icons/fa";

function Performance() {
  const [performance, setPerformance] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    campaign_id: '',
    date: '',
    impressions: '',
    clicks: '',
    conversions: '',
    spend: '',
    notes: '',
  });

  useEffect(() => {
    fetchPerformance();
    fetchCampaigns();
  }, []);

  const fetchPerformance = async () => {
    try {
      const res = await api.get('/marketing/performance');
      setPerformance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

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
      await api.post('/marketing/performance', form);
      setMessage('Performance data added!');
      setShowForm(false);
      setForm({
        campaign_id: '',
        date: '',
        impressions: '',
        clicks: '',
        conversions: '',
        spend: '',
        notes: '',
      });
      fetchPerformance();
    } catch (err) {
      setMessage('Error adding performance data.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const filtered = performance.filter(
    (p) =>
      p.campaign_title?.toLowerCase().includes(search.toLowerCase()) ||
      p.platform?.toLowerCase().includes(search.toLowerCase())
  );

  const ctr = (clicks, impressions) => {
    if (!impressions || impressions === 0) return '0%';
    return ((clicks / impressions) * 100).toFixed(2) + '%';
  };

  const totalImpressions = filtered.reduce((s, p) => s + p.impressions, 0);
  const totalClicks = filtered.reduce((s, p) => s + p.clicks, 0);
  const totalConversions = filtered.reduce((s, p) => s + p.conversions, 0);
  const totalSpend = filtered.reduce((s, p) => s + Number(p.spend), 0);

  return (
  <div style={{
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  }}>
      <style>{`
        .perf-root {
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .perf-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          margin-bottom: 16px;
        }

        .perf-top-title {
          min-width: 0;
        }

        .perf-top-right {
          display: flex;
          gap: 10px;
          align-items: center;
          min-width: 0;
          max-width: 100%;
          flex-shrink: 1;
        }

        .perf-search {
          width: 260px;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .perf-add-btn {
          flex-shrink: 0;
          white-space: nowrap;
          box-sizing: border-box;
        }

        .perf-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          width: 100%;
          max-width: 100%;
          margin-bottom: 24px;
        }

        .perf-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
          max-width: 100%;
          margin-bottom: 16px;
        }

        .perf-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
        }

        .perf-table {
          min-width: 820px;
          width: 100%;
          border-collapse: collapse;
        }

        @media (max-width: 768px) {
          .perf-top-row {
            flex-direction: column;
            align-items: stretch;
          }

          .perf-top-right {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .perf-search {
            width: 100% !important;
            max-width: 100% !important;
          }

          .perf-add-btn {
            width: 100% !important;
          }

          .perf-summary {
            grid-template-columns: 1fr !important;
          }

          .perf-form-grid {
            grid-template-columns: 1fr !important;
          }

          .perf-notes-full {
            grid-column: span 1 !important;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .perf-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .perf-form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .perf-notes-full {
            grid-column: span 2 !important;
          }
        }

        .perf-summary-card {
          background-color: #f8f9fa;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .perf-summary-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .perf-summary-label {
          font-size: 12px;
          color: #888;
          margin: 0;
        }

        .perf-summary-value {
          font-size: 20px;
          font-weight: 700;
          color: #302e2e;
          margin: 2px 0 0;
        }

        .perf-thead {
          background-color: #f1f3f4;
        }

        .perf-th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #302e2e;
          border-bottom: 1px solid #ddd;
        }

        .perf-tr {
          border-bottom: 1px solid #eee;
        }

        .perf-td {
          padding: 12px 16px;
          color: #555;
        }

        .perf-empty {
          padding: 40px;
          text-align: center;
          color: #888;
          font-style: italic;
        }

        .perf-hide-mobile {
          display: table-cell;
        }

        @media (max-width: 768px) {
          .perf-hide-mobile {
            display: none;
          }
          .perf-th, .perf-td {
            padding: 8px 12px;
            font-size: 12px;
          }
          .perf-table {
            min-width: 600px;
          }
          .perf-summary-icon {
            font-size: 20px;
          }
          .perf-summary-value {
            font-size: 18px;
      `}</style>

      <div className="perf-top-row mobile-top-row">
        <h3 style={styles.sectionTitle} className="perf-top-title">
          Performance Monitoring
        </h3>

        <div className="perf-top-right mobile-button-group">
          <input
            type="text"
            placeholder="Search by campaign or platform..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
            className="perf-search mobile-search"
          />
          <button
            onClick={() => setShowForm(!showForm)}
            style={styles.addBtn}
            className="perf-add-btn mobile-action-btn"
          >
            {showForm ? '× Cancel' : '+ Log Performance'}
          </button>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <div className="perf-summary mobile-summary-grid">
        {[
          { label: 'Total Impressions', value: totalImpressions.toLocaleString(), icon: <FaEye /> },
          { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: <FaMousePointer /> },
          { label: 'Total Conversions', value: totalConversions.toLocaleString(), icon: <FaCheck /> },
          { label: 'Total Spend', value: `₱${totalSpend.toLocaleString()}`, icon: <FaMoneyCheckAlt /> },
        ].map((s) => (
          <div key={s.label} className="perf-summary-card">
            <span className="perf-summary-icon">{s.icon}</span>
            <div style={{ minWidth: 0 }}>
              <p className="perf-summary-label">{s.label}</p>
              <p className="perf-summary-value">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>Log Performance Data</h4>

          <div className="perf-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Campaign</label>
              <select
                value={form.campaign_id}
                onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
                style={styles.input}
              >
                <option value="">Select campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Impressions</label>
              <input
                type="number"
                placeholder="0"
                value={form.impressions}
                onChange={(e) => setForm({ ...form, impressions: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Clicks</label>
              <input
                type="number"
                placeholder="0"
                value={form.clicks}
                onChange={(e) => setForm({ ...form, clicks: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Conversions</label>
              <input
                type="number"
                placeholder="0"
                value={form.conversions}
                onChange={(e) => setForm({ ...form, conversions: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Spend (₱)</label>
              <input
                type="number"
                placeholder="0.00"
                value={form.spend}
                onChange={(e) => setForm({ ...form, spend: e.target.value })}
                style={styles.input}
              />
            </div>

            <div
              className="perf-notes-full"
              style={{ ...styles.inputGroup, gridColumn: 'span 3' }}
            >
              <label style={styles.label}>Notes</label>
              <input
                type="text"
                placeholder="Optional notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <button onClick={handleSubmit} style={styles.submitBtn}>
            Save Performance
          </button>
        </div>
      )}

      <p style={styles.resultCount}>
        {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
      </p>

         <div className="perf-table-wrap mobile-table-container">
        <table className="perf-table">
          <thead>
            <tr className="perf-thead">
              <th className="perf-th">Campaign</th>
              <th className="perf-th">Platform</th>
              <th className="perf-th">Date</th>
              <th className="perf-th">Impressions</th>
              <th className="perf-th">Clicks</th>
              <th className="perf-th perf-hide-mobile">CTR</th>
              <th className="perf-th perf-hide-mobile">Conversions</th>
              <th className="perf-th">Spend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={styles.empty}>
                  No performance data found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} style={styles.tr}>
                  <td style={styles.td}>{p.campaign_title}</td>
                  <td style={styles.td}>{p.platform}</td>
                  <td style={styles.td}>{new Date(p.date).toLocaleDateString()}</td>
                  <td style={styles.td}>{p.impressions.toLocaleString()}</td>
                  <td style={styles.td}>{p.clicks.toLocaleString()}</td>
                  <td style={styles.td}>{ctr(p.clicks, p.impressions)}</td>
                  <td style={styles.td}>{p.conversions.toLocaleString()}</td>
                  <td style={styles.td}>₱{Number(p.spend).toLocaleString()}</td>
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
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#302e2e',
    margin: 0,
  },
  topRight: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  searchInput: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
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
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
  },
  summaryIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#888',
    margin: 0,
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#302e2e',
    margin: '2px 0 0',
  },
  form: {
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '24px',
  },
  formTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#302e2e',
    margin: '0 0 16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#555',
  },
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
  resultCount: {
    fontSize: '13px',
    color: '#888',
    margin: '0 0 12px',
  },
  thead: {
    backgroundColor: '#f8f9fa',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#555',
    borderBottom: '1px solid #eee',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#333',
    whiteSpace: 'nowrap',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '14px',
  },
};

export default Performance;
import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import {
  FaEye,
  FaMousePointer,
  FaCheck,
  FaMoneyCheckAlt,
  FaChartLine,
  FaPlus,
  FaTimes,
  FaSearch,
  FaSave,
} from "react-icons/fa";

function Performance() {
  const [performance, setPerformance] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
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
      setMessage('Performance data added successfully!');
      setIsError(false);
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
      setIsError(true);
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

  const cards = [
    {
      label: 'Total Impressions',
      value: totalImpressions.toLocaleString(),
      icon: <FaEye />,
      helper: 'Total campaign views',
    },
    {
      label: 'Total Clicks',
      value: totalClicks.toLocaleString(),
      icon: <FaMousePointer />,
      helper: 'Engagement actions',
    },
    {
      label: 'Total Conversions',
      value: totalConversions.toLocaleString(),
      icon: <FaCheck />,
      helper: 'Successful outcomes',
    },
    {
      label: 'Total Spend',
      value: `₱${totalSpend.toLocaleString()}`,
      icon: <FaMoneyCheckAlt />,
      helper: 'Marketing cost total',
    },
  ];

  return (
    <Layout>
      <style>{`
        .perf-page {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          animation: perfFadeUp 0.35s ease both;
        }

        .perf-hero {
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

        .perf-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .perf-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .perf-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .perf-hero-icon {
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

        .perf-toolbar {
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

        .perf-search-wrap {
          position: relative;
          width: 310px;
          max-width: 100%;
        }

        .perf-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b5536b;
          font-size: 13px;
          pointer-events: none;
        }

        .perf-search {
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

        .perf-search:focus {
          border-color: #c4607a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
        }

        .perf-add-btn,
        .perf-submit-btn {
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

        .perf-add-btn:hover,
        .perf-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .perf-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .perf-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .perf-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .perf-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .perf-summary-card {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 16px;
          padding: 18px;
          min-height: 122px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          position: relative;
          overflow: hidden;
        }

        .perf-summary-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: linear-gradient(180deg, #c4607a, #e58ca3);
        }

        .perf-summary-card:hover {
          transform: translateY(-2px);
          border-color: #c4607a;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .perf-summary-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .perf-summary-label {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .perf-summary-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          color: #b5536b;
          background: #fff1f5;
          border: 1px solid #e8b9c6;
          font-size: 17px;
          flex: 0 0 auto;
        }

        .perf-summary-value {
          margin: 0;
          color: #1f2937;
          font-size: 24px;
          font-weight: 850;
          letter-spacing: -0.04em;
        }

        .perf-summary-helper {
          margin: 7px 0 0;
          color: #7b8794;
          font-size: 12px;
          line-height: 1.4;
        }

        .perf-form {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .perf-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .perf-form-icon {
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

        .perf-form-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .perf-form-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .perf-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .perf-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .perf-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .perf-input {
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

        .perf-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .perf-notes-full {
          grid-column: span 3;
        }

        .perf-result-count {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .perf-table-panel {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          max-width: 100%;
          overflow: hidden;
        }

        .perf-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #ead1d9;
          border-radius: 14px;
        }

        .perf-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
          background: #ffffff;
        }

        .perf-table thead {
          background: #fff7fa;
        }

        .perf-table th {
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

        .perf-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #f3e8ec;
          white-space: nowrap;
          vertical-align: middle;
        }

        .perf-table tbody tr {
          transition: background-color 180ms ease;
        }

        .perf-table tbody tr:hover {
          background: #fff7fa;
        }

        .perf-table tbody tr:last-child td {
          border-bottom: none;
        }

        .perf-campaign-name {
          font-weight: 800;
          color: #1f2937;
        }

        .perf-platform-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 9999px;
          background: #fff1f5;
          color: #b5536b;
          border: 1px solid #e8b9c6;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .perf-money {
          font-weight: 850;
          color: #b5536b;
        }

        .perf-empty {
          padding: 40px !important;
          text-align: center;
          color: #94a3b8 !important;
          font-size: 14px !important;
          font-weight: 700;
        }

        @keyframes perfFadeUp {
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
          .perf-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .perf-form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .perf-notes-full {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .perf-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .perf-title {
            font-size: 24px;
          }

          .perf-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .perf-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .perf-search-wrap,
          .perf-add-btn {
            width: 100%;
          }

          .perf-summary,
          .perf-form-grid {
            grid-template-columns: 1fr;
          }

          .perf-notes-full {
            grid-column: span 1;
          }

          .perf-table-panel {
            padding: 12px;
          }

          .perf-table {
            min-width: 760px;
          }

          .perf-table th,
          .perf-table td {
            padding: 11px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 520px) {
          .perf-hero {
            flex-direction: column-reverse;
          }

          .perf-summary-card {
            min-height: auto;
          }
        }
      `}</style>

      <div className="perf-page">
        <div className="perf-hero">
          <div>
            <p className="perf-eyebrow">Marketing Analytics</p>
            <h3 className="perf-title">Performance Monitoring</h3>
            <p className="perf-subtitle">
              Track impressions, clicks, conversions, spending, and campaign engagement in one clean view.
            </p>
          </div>

          <div className="perf-hero-icon">
            <FaChartLine />
          </div>
        </div>

        <div className="perf-toolbar">
          <div className="perf-search-wrap">
            <FaSearch className="perf-search-icon" />
            <input
              type="text"
              placeholder="Search by campaign or platform..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="perf-search"
            />
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="perf-add-btn"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'Log Performance'}
          </button>
        </div>

        {message && (
          <div className={`perf-message ${isError ? 'perf-message-error' : 'perf-message-success'}`}>
            {message}
          </div>
        )}

        <div className="perf-summary">
          {cards.map((card) => (
            <div key={card.label} className="perf-summary-card">
              <div className="perf-summary-top">
                <p className="perf-summary-label">{card.label}</p>
                <span className="perf-summary-icon">{card.icon}</span>
              </div>

              <p className="perf-summary-value">{card.value}</p>
              <p className="perf-summary-helper">{card.helper}</p>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="perf-form">
            <div className="perf-form-header">
              <div className="perf-form-icon">
                <FaChartLine />
              </div>

              <div>
                <h4 className="perf-form-title">Log Performance Data</h4>
                <p className="perf-form-note">
                  Add campaign metrics for monitoring and reporting.
                </p>
              </div>
            </div>

            <div className="perf-form-grid">
              <div className="perf-field">
                <label className="perf-label">Campaign</label>
                <select
                  value={form.campaign_id}
                  onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
                  className="perf-input"
                >
                  <option value="">Select campaign</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="perf-field">
                <label className="perf-label">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="perf-input"
                />
              </div>

              <div className="perf-field">
                <label className="perf-label">Impressions</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.impressions}
                  onChange={(e) => setForm({ ...form, impressions: e.target.value })}
                  className="perf-input"
                />
              </div>

              <div className="perf-field">
                <label className="perf-label">Clicks</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.clicks}
                  onChange={(e) => setForm({ ...form, clicks: e.target.value })}
                  className="perf-input"
                />
              </div>

              <div className="perf-field">
                <label className="perf-label">Conversions</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.conversions}
                  onChange={(e) => setForm({ ...form, conversions: e.target.value })}
                  className="perf-input"
                />
              </div>

              <div className="perf-field">
                <label className="perf-label">Spend</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.spend}
                  onChange={(e) => setForm({ ...form, spend: e.target.value })}
                  className="perf-input"
                />
              </div>

              <div className="perf-field perf-notes-full">
                <label className="perf-label">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="perf-input"
                />
              </div>
            </div>

            <button onClick={handleSubmit} className="perf-submit-btn">
              <FaSave />
              Save Performance
            </button>
          </div>
        )}

        <p className="perf-result-count">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
        </p>

        <div className="perf-table-panel">
          <div className="perf-table-wrap">
            <table className="perf-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Platform</th>
                  <th>Date</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Conversions</th>
                  <th>Spend</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="perf-empty">
                      No performance data found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="perf-campaign-name">{p.campaign_title}</td>
                      <td>
                        <span className="perf-platform-pill">{p.platform}</span>
                      </td>
                      <td>{new Date(p.date).toLocaleDateString()}</td>
                      <td>{p.impressions.toLocaleString()}</td>
                      <td>{p.clicks.toLocaleString()}</td>
                      <td>{ctr(p.clicks, p.impressions)}</td>
                      <td>{p.conversions.toLocaleString()}</td>
                      <td className="perf-money">₱{Number(p.spend).toLocaleString()}</td>
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

export default Performance;
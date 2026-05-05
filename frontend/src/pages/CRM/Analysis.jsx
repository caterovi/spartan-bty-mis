import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axiosConfig';
import {
  FaComment,
  FaStar,
  FaCheck,
  FaBell,
  FaUser,
  FaChartBar,
  FaLightbulb,
  FaPaperPlane,
  FaExclamationCircle,
  FaThumbsUp,
  FaQuestionCircle,
} from "react-icons/fa";

function Analysis() {
  const [summary, setSummary] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState('');

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/crm/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/crm/generate-suggestions');
      setGenMsg(`${res.data.message} Suggestions are now visible in Marketing CRM Suggestions.`);
    } catch (err) {
      setGenMsg('Error generating suggestions.');
    } finally {
      setGenerating(false);
      setTimeout(() => setGenMsg(''), 5000);
    }
  };

  if (!summary) {
    return (
      <Layout>
        <div className="analysis-loading">Loading analysis...</div>
      </Layout>
    );
  }

  const typeColors = {
    complaint: { color: '#c4607a', tint: '#fff1f5', icon: <FaExclamationCircle /> },
    suggestion: { color: '#b5536b', tint: '#fff1f5', icon: <FaLightbulb /> },
    compliment: { color: '#2f9d6a', tint: '#ecfdf3', icon: <FaThumbsUp /> },
    inquiry: { color: '#d98a1f', tint: '#fff7e8', icon: <FaQuestionCircle /> },
  };

  const byType = summary.byType || [];
  const byRating = summary.byRating || [];

  const maxCount = Math.max(...byType.map((t) => Number(t.count) || 0), 1);
  const maxRating = Math.max(...byRating.map((r) => Number(r.count) || 0), 1);

  const cards = [
    {
      label: 'Total Feedback',
      value: summary.total,
      icon: <FaComment />,
      helper: 'All customer feedback',
    },
    {
      label: 'Average Rating',
      value: `${summary.avg_rating || 0}`,
      icon: <FaStar />,
      helper: 'Overall satisfaction score',
    },
    {
      label: 'Resolved',
      value: summary.resolved,
      icon: <FaCheck />,
      helper: 'Feedback already handled',
    },
    {
      label: 'New Pending',
      value: summary.new_count,
      icon: <FaBell />,
      helper: 'Needs review or action',
    },
    {
      label: 'Total Customers',
      value: summary.total_customers,
      icon: <FaUser />,
      helper: 'Customers in CRM records',
    },
  ];

  return (
    <Layout>
      <style>{`
        .analysis-page {
          width: 100%;
          animation: analysisFadeUp 0.35s ease both;
        }

        .analysis-hero {
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

        .analysis-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .analysis-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .analysis-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .analysis-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 0 0 auto;
        }

        .analysis-hero-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          font-size: 24px;
          box-shadow: 0 8px 24px rgba(196, 96, 122, 0.25);
        }

        .analysis-generate-btn {
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 18px rgba(196, 96, 122, 0.22);
          transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
          white-space: nowrap;
        }

        .analysis-generate-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .analysis-generate-btn:disabled {
          cursor: not-allowed;
          opacity: 0.68;
          transform: none;
        }

        .analysis-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .analysis-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .analysis-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .analysis-cards {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .analysis-card {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 16px;
          padding: 18px;
          min-height: 128px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          position: relative;
          overflow: hidden;
        }

        .analysis-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: linear-gradient(180deg, #c4607a, #e58ca3);
        }

        .analysis-card:hover {
          transform: translateY(-2px);
          border-color: #c4607a;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .analysis-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .analysis-card-label {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .analysis-card-icon {
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

        .analysis-card-value {
          margin: 0;
          color: #1f2937;
          font-size: 25px;
          font-weight: 850;
          letter-spacing: -0.04em;
        }

        .analysis-card-helper {
          margin: 7px 0 0;
          color: #7b8794;
          font-size: 12px;
          line-height: 1.4;
        }

        .analysis-charts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .analysis-panel {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .analysis-panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .analysis-panel-icon {
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

        .analysis-panel-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .analysis-panel-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .analysis-list {
          display: grid;
          gap: 14px;
        }

        .analysis-bar-row {
          display: grid;
          grid-template-columns: 120px 1fr 52px;
          align-items: center;
          gap: 12px;
        }

        .analysis-bar-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #374151;
          font-size: 13px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .analysis-dot {
          width: 9px;
          height: 9px;
          border-radius: 9999px;
          flex: 0 0 auto;
        }

        .analysis-bar-track {
          height: 14px;
          border-radius: 9999px;
          background: #f3e8ec;
          overflow: hidden;
          border: 1px solid #ead1d9;
        }

        .analysis-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 320ms ease;
          min-width: 8px;
        }

        .analysis-bar-count {
          justify-self: end;
          min-width: 38px;
          padding: 5px 9px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 800;
          text-align: center;
          color: #1f2937;
          border: 1px solid;
        }

        .analysis-stars {
          color: #d98a1f;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .analysis-empty {
          color: #94a3b8;
          font-size: 14px;
          text-align: center;
          padding: 26px 0;
          margin: 0;
          border: 1px dashed #e2c6cf;
          border-radius: 14px;
          background: #fff7fa;
        }

        .analysis-insight-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .analysis-insight-card {
          background: #fff7fa;
          border: 1px solid #e2c6cf;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .analysis-insight-card:hover {
          transform: translateY(-2px);
          border-color: #c4607a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .analysis-insight-icon {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid;
          font-size: 16px;
        }

        .analysis-insight-type {
          margin: 0 0 4px;
          color: #374151;
          font-size: 13px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .analysis-insight-count {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
        }

        .analysis-loading {
          min-height: 240px;
          display: grid;
          place-items: center;
          color: #b5536b;
          font-size: 14px;
          font-weight: 700;
        }

        @keyframes analysisFadeUp {
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
          .analysis-cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .analysis-charts {
            grid-template-columns: 1fr;
          }

          .analysis-insight-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .analysis-hero {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px;
          }

          .analysis-title {
            font-size: 24px;
          }

          .analysis-hero-actions {
            width: 100%;
            justify-content: space-between;
          }

          .analysis-generate-btn {
            flex: 1;
            justify-content: center;
          }

          .analysis-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .analysis-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .analysis-bar-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .analysis-bar-count {
            justify-self: start;
          }
        }

        @media (max-width: 520px) {
          .analysis-cards,
          .analysis-insight-grid {
            grid-template-columns: 1fr;
          }

          .analysis-card {
            min-height: auto;
          }

          .analysis-hero-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .analysis-hero-icon {
            align-self: flex-start;
          }
        }
      `}</style>

      <div className="analysis-page">
        <div className="analysis-hero">
          <div>
            <p className="analysis-eyebrow">CRM Insights</p>
            <h3 className="analysis-title">Feedback Analysis</h3>
            <p className="analysis-subtitle">
              Review customer feedback patterns, ratings, and actionable insights for marketing improvement.
            </p>
          </div>

          <div className="analysis-hero-actions">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="analysis-generate-btn"
            >
              <FaPaperPlane />
              {generating ? 'Generating...' : 'Send Suggestions'}
            </button>

            <div className="analysis-hero-icon">
              <FaChartBar />
            </div>
          </div>
        </div>

        {genMsg && (
          <div
            className={`analysis-message ${
              genMsg.toLowerCase().includes('error')
                ? 'analysis-message-error'
                : 'analysis-message-success'
            }`}
          >
            {genMsg}
          </div>
        )}

        <div className="analysis-cards">
          {cards.map((card) => (
            <div key={card.label} className="analysis-card">
              <div className="analysis-card-top">
                <p className="analysis-card-label">{card.label}</p>
                <span className="analysis-card-icon">{card.icon}</span>
              </div>

              <p className="analysis-card-value">{card.value}</p>
              <p className="analysis-card-helper">{card.helper}</p>
            </div>
          ))}
        </div>

        <div className="analysis-charts">
          <div className="analysis-panel">
            <div className="analysis-panel-header">
              <div className="analysis-panel-icon">
                <FaComment />
              </div>
              <div>
                <h4 className="analysis-panel-title">Feedback by Type</h4>
                <p className="analysis-panel-note">
                  Breakdown of customer feedback categories.
                </p>
              </div>
            </div>

            {byType.length === 0 ? (
              <p className="analysis-empty">No data yet.</p>
            ) : (
              <div className="analysis-list">
                {byType.map((item) => {
                  const meta = typeColors[item.type] || {
                    color: '#8b7280',
                    tint: '#f8f3f5',
                    icon: <FaComment />,
                  };

                  return (
                    <div key={item.type} className="analysis-bar-row">
                      <span className="analysis-bar-label">
                        <span
                          className="analysis-dot"
                          style={{ backgroundColor: meta.color }}
                        />
                        {item.type}
                      </span>

                      <div className="analysis-bar-track">
                        <div
                          className="analysis-bar-fill"
                          style={{
                            width: `${((Number(item.count) || 0) / maxCount) * 100}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>

                      <span
                        className="analysis-bar-count"
                        style={{
                          backgroundColor: meta.tint,
                          borderColor: meta.color,
                        }}
                      >
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="analysis-panel">
            <div className="analysis-panel-header">
              <div className="analysis-panel-icon">
                <FaStar />
              </div>
              <div>
                <h4 className="analysis-panel-title">Rating Distribution</h4>
                <p className="analysis-panel-note">
                  Customer satisfaction grouped by rating.
                </p>
              </div>
            </div>

            {byRating.length === 0 ? (
              <p className="analysis-empty">No data yet.</p>
            ) : (
              <div className="analysis-list">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const found = byRating.find((item) => Number(item.rating) === rating);
                  const count = found ? found.count : 0;
                  const color = rating >= 4 ? '#2f9d6a' : rating === 3 ? '#d98a1f' : '#c4607a';
                  const tint = rating >= 4 ? '#ecfdf3' : rating === 3 ? '#fff7e8' : '#fff1f5';

                  return (
                    <div key={rating} className="analysis-bar-row">
                      <span className="analysis-bar-label analysis-stars">
                        {'★'.repeat(rating)}
                      </span>

                      <div className="analysis-bar-track">
                        <div
                          className="analysis-bar-fill"
                          style={{
                            width: `${((Number(count) || 0) / maxRating) * 100}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>

                      <span
                        className="analysis-bar-count"
                        style={{
                          backgroundColor: tint,
                          borderColor: color,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="analysis-panel">
          <div className="analysis-panel-header">
            <div className="analysis-panel-icon">
              <FaLightbulb />
            </div>
            <div>
              <h4 className="analysis-panel-title">Quick Insights</h4>
              <p className="analysis-panel-note">
                Simple category summary based on current feedback records.
              </p>
            </div>
          </div>

          {byType.length === 0 ? (
            <p className="analysis-empty">No insights available yet.</p>
          ) : (
            <div className="analysis-insight-grid">
              {byType.map((item) => {
                const meta = typeColors[item.type] || {
                  color: '#8b7280',
                  tint: '#f8f3f5',
                  icon: <FaComment />,
                };

                return (
                  <div key={item.type} className="analysis-insight-card">
                    <div
                      className="analysis-insight-icon"
                      style={{
                        color: meta.color,
                        backgroundColor: meta.tint,
                        borderColor: meta.color,
                      }}
                    >
                      {meta.icon}
                    </div>

                    <div>
                      <p className="analysis-insight-type">{item.type}</p>
                      <p className="analysis-insight-count">
                        {item.count} feedback{item.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Analysis;
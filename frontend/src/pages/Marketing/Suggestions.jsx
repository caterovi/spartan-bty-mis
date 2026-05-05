import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import { IoMdRefresh, IoIosHappy } from "react-icons/io";
import {
  FaAngry,
  FaLightbulb,
  FaQuestion,
  FaCommentDots,
  FaBullhorn,
  FaPlay,
  FaCheck,
  FaTimes,
  FaCalendar,
} from "react-icons/fa";

function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('/marketing/suggestions');
      setSuggestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/marketing/suggestions/${id}`, { status });
      setMessage(`Suggestion marked as ${status.replaceAll('-', ' ')}!`);
      fetchSuggestions();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const priorityColors = {
    high: { backgroundColor: '#fff1f5', color: '#b5536b', borderColor: '#c4607a' },
    medium: { backgroundColor: '#fff7e8', color: '#9a5f0f', borderColor: '#d98a1f' },
    low: { backgroundColor: '#ecfdf3', color: '#2f7d56', borderColor: '#2f9d6a' },
  };

  const statusColors = {
    new: { backgroundColor: '#fff1f5', color: '#b5536b', borderColor: '#c4607a' },
    'in-progress': { backgroundColor: '#fff7e8', color: '#9a5f0f', borderColor: '#d98a1f' },
    implemented: { backgroundColor: '#ecfdf3', color: '#2f7d56', borderColor: '#2f9d6a' },
    dismissed: { backgroundColor: '#f8f3f5', color: '#6b5b63', borderColor: '#c9b6bf' },
  };

  const typeIcons = {
    complaint: <FaAngry />,
    compliment: <IoIosHappy />,
    suggestion: <FaLightbulb />,
    inquiry: <FaQuestion />,
  };

  const formatText = (value) =>
    String(value || '').replaceAll('-', ' ');

  return (
    <Layout>
      <style>{`
        .suggestions-page {
          width: 100%;
          min-width: 0;
          animation: suggestionsFadeUp 0.35s ease both;
        }

        .suggestions-hero {
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

        .suggestions-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .suggestions-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .suggestions-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 760px;
        }

        .suggestions-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 0 0 auto;
        }

        .suggestions-refresh-btn {
          border: 1px solid #d8b8c2;
          border-radius: 12px;
          padding: 11px 14px;
          background: #ffffff;
          color: #b5536b;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .suggestions-refresh-btn:hover {
          transform: translateY(-1px);
          border-color: #c4607a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .suggestions-hero-icon {
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

        .suggestions-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid #2f9d6a;
          background: #ecfdf3;
          color: #2f7d56;
        }

        .suggestions-empty {
          background:
            radial-gradient(circle at top right, rgba(196, 96, 122, 0.12), transparent 34%),
            linear-gradient(135deg, #fff7fa 0%, #ffffff 100%);
          border: 1px dashed #e2c6cf;
          border-radius: 18px;
          padding: 42px 22px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .suggestions-empty-icon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          background: #fff1f5;
          color: #b5536b;
          border: 1px solid #e8b9c6;
          font-size: 22px;
        }

        .suggestions-empty-title {
          margin: 0 0 8px;
          color: #1f2937;
          font-size: 18px;
          font-weight: 850;
        }

        .suggestions-empty-desc {
          margin: 0 auto;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 620px;
        }

        .suggestions-list {
          display: grid;
          gap: 16px;
        }

        .suggestions-card {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .suggestions-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: linear-gradient(180deg, #c4607a, #e58ca3);
        }

        .suggestions-card:hover {
          transform: translateY(-2px);
          border-color: #c4607a;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .suggestions-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 14px;
        }

        .suggestions-card-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .suggestions-type-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #fff1f5;
          color: #b5536b;
          border: 1px solid #e8b9c6;
          font-size: 20px;
          flex: 0 0 auto;
        }

        .suggestions-type-text {
          display: block;
          margin-bottom: 6px;
          color: #1f2937;
          font-size: 14px;
          font-weight: 850;
          text-transform: capitalize;
        }

        .suggestions-badge-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .suggestions-priority-badge,
        .suggestions-status-badge {
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

        .suggestions-text {
          margin: 0 0 16px;
          color: #374151;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 600;
        }

        .suggestions-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          border-top: 1px solid #f3e8ec;
          padding-top: 14px;
        }

        .suggestions-date {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .suggestions-date svg {
          color: #b5536b;
        }

        .suggestions-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .suggestions-progress-btn,
        .suggestions-implement-btn,
        .suggestions-dismiss-btn {
          border-radius: 10px;
          padding: 9px 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid;
          transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
        }

        .suggestions-progress-btn {
          background: #fff7e8;
          color: #9a5f0f;
          border-color: #d98a1f;
        }

        .suggestions-implement-btn {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .suggestions-dismiss-btn {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .suggestions-progress-btn:hover,
        .suggestions-implement-btn:hover,
        .suggestions-dismiss-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        @keyframes suggestionsFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .suggestions-hero {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px;
          }

          .suggestions-title {
            font-size: 24px;
          }

          .suggestions-hero-actions {
            width: 100%;
            justify-content: space-between;
          }

          .suggestions-refresh-btn {
            flex: 1;
          }

          .suggestions-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .suggestions-card-top,
          .suggestions-footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .suggestions-actions {
            width: 100%;
            justify-content: stretch;
          }

          .suggestions-progress-btn,
          .suggestions-implement-btn,
          .suggestions-dismiss-btn {
            flex: 1;
          }
        }

        @media (max-width: 520px) {
          .suggestions-hero-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .suggestions-hero-icon {
            align-self: flex-start;
          }

          .suggestions-card-left {
            align-items: flex-start;
          }

          .suggestions-actions {
            flex-direction: column;
          }

          .suggestions-progress-btn,
          .suggestions-implement-btn,
          .suggestions-dismiss-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="suggestions-page">
        <div className="suggestions-hero">
          <div>
            <p className="suggestions-eyebrow">CRM Marketing Insights</p>
            <h3 className="suggestions-title">CRM-Based Marketing Suggestions</h3>
            <p className="suggestions-subtitle">
              Review marketing actions generated from customer feedback analysis and track their implementation status.
            </p>
          </div>

          <div className="suggestions-hero-actions">
            <button onClick={fetchSuggestions} className="suggestions-refresh-btn">
              <IoMdRefresh />
            </button>

            <div className="suggestions-hero-icon">
              <FaBullhorn />
            </div>
          </div>
        </div>

        {message && <div className="suggestions-message">{message}</div>}

        {suggestions.length === 0 ? (
          <div className="suggestions-empty">
            <div className="suggestions-empty-icon">
              <FaLightbulb />
            </div>

            <p className="suggestions-empty-title">No suggestions yet</p>
            <p className="suggestions-empty-desc">
              Go to CRM Analysis and click Send Suggestions to Marketing to generate recommendations based on customer feedback.
            </p>
          </div>
        ) : (
          <div className="suggestions-list">
            {suggestions.map(s => {
              const priorityStyle = priorityColors[s.priority] || priorityColors.low;
              const statusStyle = statusColors[s.status] || statusColors.new;

              return (
                <div key={s.id} className="suggestions-card">
                  <div className="suggestions-card-top">
                    <div className="suggestions-card-left">
                      <span className="suggestions-type-icon">
                        {typeIcons[s.feedback_type] || <FaCommentDots />}
                      </span>

                      <div>
                        <span className="suggestions-type-text">
                          {formatText(s.feedback_type)} feedback
                        </span>

                        <div className="suggestions-badge-row">
                          <span
                            className="suggestions-priority-badge"
                            style={priorityStyle}
                          >
                            {formatText(s.priority)} priority
                          </span>

                          <span
                            className="suggestions-status-badge"
                            style={statusStyle}
                          >
                            {formatText(s.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="suggestions-text">{s.suggestion}</p>

                  <div className="suggestions-footer">
                    <span className="suggestions-date">
                      <FaCalendar />
                      Generated: {new Date(s.created_at).toLocaleDateString()}
                    </span>

                    <div className="suggestions-actions">
                      {s.status === 'new' && (
                        <button
                          onClick={() => handleStatus(s.id, 'in-progress')}
                          className="suggestions-progress-btn"
                        >
                          <FaPlay />
                          Start Working
                        </button>
                      )}

                      {s.status === 'in-progress' && (
                        <button
                          onClick={() => handleStatus(s.id, 'implemented')}
                          className="suggestions-implement-btn"
                        >
                          <FaCheck />
                          Mark Implemented
                        </button>
                      )}

                      {s.status !== 'dismissed' && s.status !== 'implemented' && (
                        <button
                          onClick={() => handleStatus(s.id, 'dismissed')}
                          className="suggestions-dismiss-btn"
                        >
                          <FaTimes />
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Suggestions;
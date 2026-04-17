import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { IoMdRefresh, IoIosHappy } from "react-icons/io";
import { FaAngry, FaLightbulb, FaQuestion, FaCommentDots } from "react-icons/fa";

function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage]         = useState('');

  useEffect(() => { fetchSuggestions(); }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('/marketing/suggestions');
      setSuggestions(res.data);
    } catch (err) { console.error(err); }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/marketing/suggestions/${id}`, { status });
      setMessage(`Suggestion marked as ${status}!`);
      fetchSuggestions();
    } catch (err) { console.error(err); }
    finally { setTimeout(() => setMessage(''), 3000); }
  };

  const priorityColors = {
    high:   { backgroundColor: '#fdf0f3', color: '#c4607a', border: '1px solid #f0b8c4' },
    medium: { backgroundColor: '#fef9e7', color: '#f39c12', border: '1px solid #fad88a' },
    low:    { backgroundColor: '#eafaf1', color: '#27ae60', border: '1px solid #a9dfbf' },
  };

  const statusColors = {
    new:          { backgroundColor: '#eaf4fb', color: '#2980b9' },
    'in-progress':{ backgroundColor: '#fef9e7', color: '#f39c12' },
    implemented:  { backgroundColor: '#eafaf1', color: '#27ae60' },
    dismissed:    { backgroundColor: '#f0f0f0', color: '#888' },
  };

  const typeIcons = {
    complaint:  <FaAngry/>,
    compliment: <IoIosHappy/>,
    suggestion: <FaLightbulb />,
    inquiry:    <FaQuestion />,
  };

  return (
    <div>
      <div style={styles.topRow} className="resp-top-row">
        <div>
          <h3 style={styles.sectionTitle}>CRM-Based Marketing Suggestions</h3>
          <p style={styles.subtitle}>Suggestions automatically generated from customer feedback analysis</p>
          <div className="resp-actions">
        </div>
        <button onClick={fetchSuggestions} style={styles.refreshBtn}> <IoMdRefresh /></button>
      </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {suggestions.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={styles.emptyTitle}>No suggestions yet</p>
          <p style={styles.emptyDesc}>Go to <strong>CRM → Analysis</strong> and click <strong>"Send Suggestions to Marketing"</strong> to generate suggestions based on customer feedback.</p>
        </div>
      ) : (
        <div style={styles.suggestionList}>
          {suggestions.map(s => (
            <div key={s.id} style={{ ...styles.suggestionCard, ...priorityColors[s.priority] }}>
              <div style={styles.cardTop}>
                <div style={styles.cardLeft}>
                  <span style={styles.typeIcon}>{typeIcons[s.feedback_type] || <FaCommentDots /> }</span>
                  <div>
                    <span style={styles.feedbackType}>{s.feedback_type} feedback</span>
                    <span style={{ ...styles.priorityBadge, backgroundColor: priorityColors[s.priority].color, color: '#fff' }}>
                      {s.priority} priority
                    </span>
                  </div>
                </div>
                <span style={{ ...styles.statusBadge, ...statusColors[s.status] }}>{s.status}</span>
              </div>

              <p style={styles.suggestionText}>{s.suggestion}</p>

              <div style={styles.cardFooter}>
                <span style={styles.date}>Generated: {new Date(s.created_at).toLocaleDateString()}</span>
                <div style={styles.actionBtns}>
                  {s.status === 'new' && (
                    <button onClick={() => handleStatus(s.id, 'in-progress')} style={styles.progressBtn}>
                       Start Working
                    </button>
                  )}
                  {s.status === 'in-progress' && (
                    <button onClick={() => handleStatus(s.id, 'implemented')} style={styles.implementBtn}>
                       Mark Implemented
                    </button>
                  )}
                  {s.status !== 'dismissed' && s.status !== 'implemented' && (
                    <button onClick={() => handleStatus(s.id, 'dismissed')} style={styles.dismissBtn}>
                      ✕ Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#302e2e', margin: '0 0 4px' },
  subtitle: { fontSize: '13px', color: '#888', margin: 0 },
  refreshBtn: { padding: '8px 16px', backgroundColor: '#f8f9fa', color: '#555', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  message: { backgroundColor: '#eafaf1', color: '#27ae60', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  emptyBox: { backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '40px', textAlign: 'center' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#555', margin: '0 0 8px' },
  emptyDesc: { fontSize: '14px', color: '#888', margin: 0 },
  suggestionList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  suggestionCard: { borderRadius: '12px', padding: '20px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  cardLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  typeIcon: { fontSize: '28px' },
  feedbackType: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', textTransform: 'capitalize', marginBottom: '4px' },
  priorityBadge: { padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  suggestionText: { fontSize: '15px', color: '#302e2e', lineHeight: '1.6', margin: '0 0 16px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: '12px', color: '#aaa' },
  actionBtns: { display: 'flex', gap: '8px' },
  progressBtn: { padding: '8px 16px', backgroundColor: '#2980b9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  implementBtn: { padding: '8px 16px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  dismissBtn: { padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.1)', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
};

export default Suggestions;
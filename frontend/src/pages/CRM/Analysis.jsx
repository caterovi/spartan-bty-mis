import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaComment, FaStar, FaCheck, FaBell, FaUser } from "react-icons/fa";

function Analysis() {
  const [summary, setSummary]     = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg]         = useState('');

  useEffect(() => { fetchSummary(); }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/crm/summary');
      setSummary(res.data);
    } catch (err) { console.error(err); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/crm/generate-suggestions');
      setGenMsg(` ${res.data.message} — now visible in Marketing → CRM Suggestions!`);
    } catch (err) {
      setGenMsg(' Error generating suggestions.');
    } finally {
      setGenerating(false);
      setTimeout(() => setGenMsg(''), 5000);
    }
  };

  if (!summary) return <div style={styles.loading}>Loading analysis...</div>;

  const typeColors = {
    complaint:  '#c4607a',
    suggestion: '#2980b9',
    compliment: '#27ae60',
    inquiry:    '#f39c12',
  };

  const maxCount  = Math.max(...(summary.byType.map(t => t.count)), 1);

  return (
    <div>
      {/* Header with Generate Button */}
      <div style={styles.headerRow}>
        <h3 style={styles.sectionTitle}>Feedback Analysis</h3>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={generating ? styles.generateBtnDisabled : styles.generateBtn}
        >
          {generating ? 'Generating...' : 'Send Suggestions to Marketing'}
        </button>
      </div>

      {genMsg && (
        <div style={{ ...styles.genMsg, backgroundColor: genMsg.includes('✅') ? '#eafaf1' : '#fdf0f3', color: genMsg.includes('✅') ? '#27ae60' : '#c4607a' }}>
          {genMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div style={styles.cards}>
        {[
          { label: 'Total Feedback',  value: summary.total,           icon: <FaComment/>, color: '#c4607a' },
          { label: 'Average Rating',  value: `${summary.avg_rating || 0} `, icon: <FaStar/>, color: '#c4607a' },
          { label: 'Resolved',        value: summary.resolved,        icon: <FaCheck/>, color: '#c4607a' },
          { label: 'New / Pending',   value: summary.new_count,       icon: <FaBell/>, color: '#c4607a' },
          { label: 'Total Customers', value: summary.total_customers, icon: <FaUser/>, color: '#c4607a' },
        ].map((c) => (
          <div key={c.label} style={{ ...styles.card, borderTop: `4px solid ${c.color}` }}>
            <span style={styles.cardIcon}>{c.icon}</span>
            <div>
              <p style={styles.cardLabel}>{c.label}</p>
              <p style={styles.cardValue}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.chartsRow}>
        {/* Feedback by Type */}
        <div style={styles.chartBox}>
          <h4 style={styles.chartTitle}>Feedback by Type</h4>
          {summary.byType.length === 0 ? (
            <p style={styles.noData}>No data yet.</p>
          ) : (
            summary.byType.map((t) => (
              <div key={t.type} style={styles.barRow}>
                <span style={styles.barLabel}>{t.type}</span>
                <div style={styles.barTrack}>
                  <div style={{
                    ...styles.barFill,
                    width: `${(t.count / maxCount) * 100}%`,
                    backgroundColor: typeColors[t.type] || '#888',
                  }} />
                </div>
                <span style={styles.barCount}>{t.count}</span>
              </div>
            ))
          )}
        </div>

        {/* Rating Distribution */}
        <div style={styles.chartBox}>
          <h4 style={styles.chartTitle}>Rating Distribution</h4>
          {summary.byRating.length === 0 ? (
            <p style={styles.noData}>No data yet.</p>
          ) : (
            [5,4,3,2,1].map((r) => {
              const found = summary.byRating.find(x => x.rating === r);
              const count = found ? found.count : 0;
              const maxR  = Math.max(...summary.byRating.map(x => x.count), 1);
              return (
                <div key={r} style={styles.barRow}>
                  <span style={styles.barLabel}>{'★'.repeat(r)}</span>
                  <div style={styles.barTrack}>
                    <div style={{
                      ...styles.barFill,
                      width: `${(count / maxR) * 100}%`,
                      backgroundColor: r >= 4 ? '#27ae60' : r === 3 ? '#f39c12' : '#c4607a',
                    }} />
                  </div>
                  <span style={styles.barCount}>{count}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Insight Box */}
      <div style={styles.insightBox}>
        <h4 style={styles.insightTitle}>Quick Insights</h4>
        <div style={styles.insightGrid}>
          {summary.byType.map(t => (
            <div key={t.type} style={styles.insightCard}>
              <span style={{ fontSize: '24px' }}>
                {t.type === 'complaint' ? '' : t.type === 'compliment' ? '' : t.type === 'suggestion' ? '' : ''}
              </span>
              <div>
                <p style={styles.insightType}>{t.type}</p>
                <p style={styles.insightCount}>{t.count} feedback{t.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#302e2e', margin: 0 },
  generateBtn: { padding: '10px 18px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  generateBtnDisabled: { padding: '10px 18px', backgroundColor: '#e8a0b0', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontSize: '14px', fontWeight: '600' },
  genMsg: { padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '500' },
  loading: { padding: '40px', textAlign: 'center', color: '#aaa' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' },
  card: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' },
  cardIcon: { fontSize: '24px' },
  cardLabel: { fontSize: '11px', color: '#888', margin: 0 },
  cardValue: { fontSize: '22px', fontWeight: '700', color: '#302e2e', margin: '2px 0 0' },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' },
  chartBox: { border: '1px solid #eee', borderRadius: '10px', padding: '20px' },
  chartTitle: { fontSize: '15px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  barLabel: { fontSize: '13px', color: '#555', width: '90px', textAlign: 'right', textTransform: 'capitalize' },
  barTrack: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: '4px', height: '10px' },
  barFill: { height: '10px', borderRadius: '4px', transition: 'width 0.3s' },
  barCount: { fontSize: '13px', fontWeight: '600', color: '#333', width: '24px' },
  noData: { color: '#aaa', fontSize: '14px', textAlign: 'center', padding: '20px 0' },
  insightBox: { border: '1px solid #eee', borderRadius: '10px', padding: '20px' },
  insightTitle: { fontSize: '15px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  insightGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  insightCard: { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' },
  insightType: { fontSize: '13px', fontWeight: '600', color: '#555', margin: '0 0 4px', textTransform: 'capitalize' },
  insightCount: { fontSize: '18px', fontWeight: '700', color: '#302e2e', margin: 0 },
};

export default Analysis;
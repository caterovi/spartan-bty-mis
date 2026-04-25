import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axiosConfig';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FaComment,
  FaStar,
  FaCheck,
  FaBell,
  FaUser,
  FaLightbulb,
  FaList,
  FaEnvelope,
  FaPlus
} from "react-icons/fa";

function CRMDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/crm/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    setGenerating(true);
    try {
      await api.post('/crm/generate-suggestions');
      alert('Suggestions sent to Marketing team!');
    } catch (err) {
      alert('Error generating suggestions.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading CRM dashboard...</div>;
  if (!summary) return null;

  const typeColors = {
    complaint: '#c4607a',
    suggestion: '#2980b9',
    compliment: '#27ae60',
    inquiry: '#f39c12',
  };

  const feedbackTypeData = (summary.byType || []).map(t => ({
    label: t.type,
    value: t.count,
    color: typeColors[t.type] || '#888',
  }));

  const ratingData = [5, 4, 3, 2, 1].map(r => {
    const found = (summary.byRating || []).find(x => x.rating === r);
    return {
      label: '★'.repeat(r),
      value: found ? found.count : 0,
      raw: r,
    };
  }).filter(d => d.value > 0);

  return (
    <>
      <div style={styles.cards}>
        {[
          { label: 'Total Feedback', value: summary.total || 0, icon: <FaComment /> },
          { label: 'Avg Rating', value: `${summary.avg_rating || 0} / 5`, icon: <FaStar /> },
          { label: 'Resolved', value: summary.resolved || 0, icon: <FaCheck /> },
          { label: 'New / Pending', value: summary.new_count || 0, icon: <FaBell /> },
          { label: 'Total Customers', value: summary.total_customers || 0, icon: <FaUser /> },
        ].map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
            style={styles.card}
          >
            <div style={styles.cardIconBox}>
              <span style={styles.cardIcon}>{card.icon}</span>
            </div>
            <div>
              <p style={styles.cardLabel}>{card.label}</p>
              <p style={styles.cardValue}>{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={styles.sectionTitle}
      >
        Feedback Analytics
      </motion.p>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Feedback by Type</h4>
          {feedbackTypeData.length === 0 ? (
            <div style={styles.noData}>No feedback data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={feedbackTypeData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ label, value }) => `${label}: ${value}`}
                  labelLine={false}
                >
                  {feedbackTypeData.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Rating Distribution</h4>
          {ratingData.length === 0 ? (
            <div style={styles.noData}>No rating data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {ratingData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.raw >= 4 ? '#27ae60' : d.raw === 3 ? '#f39c12' : '#c4607a'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={styles.sectionTitle}
      >
        Monitoring & Actions
      </motion.p>

      <div style={styles.insightsGrid}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          whileHover={{ y: -4 }}
          style={styles.insightCard}
        >
          <div style={styles.insightHeader}>
            <FaComment color="#c4607a" />
            <h4 style={styles.insightTitle}>Recent Feedback</h4>
          </div>

          {(summary.byType || []).length === 0 ? (
            <div style={styles.allGood}>No feedback yet.</div>
          ) : (
            <div style={styles.recentList}>
              {(summary.byType || []).slice(0, 4).map((t, i) => (
                <motion.div
                  key={i}
                  style={styles.recentItem}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  whileHover={{ x: 5, backgroundColor: '#fff4f7' }}
                >
                  <div>
                    <p style={styles.recentCode}>
                      {t.type?.charAt(0).toUpperCase() + t.type?.slice(1)}
                    </p>
                    <p style={styles.recentName}>
                      {t.count} record{t.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: `${typeColors[t.type] || '#888'}18`,
                      color: typeColors[t.type] || '#888',
                    }}
                  >
                    {t.count}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          whileHover={{ y: -4 }}
          style={styles.insightCard}
        >
          <div style={styles.insightHeader}>
            <FaBell color="#f39c12" />
            <h4 style={styles.insightTitle}>Customer Concerns</h4>
          </div>

          <div style={styles.pendingBox}>
            <motion.p
              style={styles.pendingCount}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              {summary.new_count || 0}
            </motion.p>
            <p style={styles.pendingLabel}>
              new / pending feedback{summary.new_count !== 1 ? 's' : ''}
            </p>
            {summary.new_count > 0 && (
              <p style={styles.pendingNote}>
                Review and resolve customer concerns promptly
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
          whileHover={{ y: -4 }}
          style={styles.insightCard}
        >
          <div style={styles.insightHeader}>
            <FaLightbulb color="#27ae60" />
            <h4 style={styles.insightTitle}>Quick Actions</h4>
          </div>

          <div style={styles.actionStack}>
            <motion.button
              onClick={() => navigate('/crm')}
              style={styles.actionBtn}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaPlus /> Add Feedback
            </motion.button>

            <motion.button
              onClick={() => navigate('/crm')}
              style={styles.actionBtnSecondary}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaList /> View All Feedback
            </motion.button>

            <motion.button
              onClick={handleGenerateSuggestions}
              disabled={generating}
              style={generating ? styles.actionBtnDisabled : styles.actionBtnSecondary}
              whileHover={generating ? {} : { y: -3 }}
              whileTap={generating ? {} : { scale: 0.96 }}
            >
              <FaEnvelope /> {generating ? 'Sending...' : 'Send Suggestions to Marketing'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

const styles = {
  loading: { padding: '60px', textAlign: 'center', color: '#aaa', fontSize: '16px' },

  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    borderLeft: '5px solid #c4607a',
    cursor: 'pointer',
  },

  cardIconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    backgroundColor: '#fdf0f3',
    color: '#c4607a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  cardIcon: { fontSize: '24px' },
  cardLabel: { margin: 0, fontSize: '12px', color: '#888', fontWeight: '600' },
  cardValue: { margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: '#c4607a' },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#302e2e',
    margin: '0 0 16px',
  },

  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '28px',
  },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },

  chartTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#302e2e',
    margin: '0 0 16px',
  },

  noData: {
    padding: '40px',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '14px',
  },

  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '28px',
  },

  insightCard: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },

  insightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: '12px',
  },

  insightTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#302e2e',
    margin: 0,
  },

  allGood: {
    backgroundColor: '#eafaf1',
    color: '#27ae60',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '600',
  },

  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  recentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },

  recentCode: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#302e2e',
    margin: 0,
  },

  recentName: {
    fontSize: '11px',
    color: '#aaa',
    margin: '2px 0 0',
  },

  statusBadge: {
    padding: '2px 8px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  pendingBox: { textAlign: 'center' },
  pendingCount: { fontSize: '48px', fontWeight: '800', color: '#2980b9', margin: '0 0 4px' },
  pendingLabel: { fontSize: '14px', color: '#888', margin: '0 0 12px' },

  pendingNote: {
    fontSize: '13px',
    color: '#2980b9',
    backgroundColor: '#eaf4fb',
    padding: '10px 14px',
    borderRadius: '8px',
    margin: 0,
  },

  actionStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  actionBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#c4607a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },

  actionBtnSecondary: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#fdf0f3',
    color: '#c4607a',
    border: '1px solid #f0d0d8',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },

  actionBtnDisabled: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#e8a0b0',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'not-allowed',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};

export default CRMDashboard;
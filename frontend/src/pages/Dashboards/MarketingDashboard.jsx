import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axiosConfig';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FaFlag, FaEye, FaMousePointer, FaCheck, FaMoneyCheckAlt, FaPlus, FaChartLine, FaTags } from "react-icons/fa";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: "easeOut" },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function MarketingDashboard() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns]   = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [campRes, perfRes] = await Promise.all([
        api.get('/marketing/campaigns'),
        api.get('/marketing/performance'),
      ]);
      setCampaigns(campRes.data || []);
      setPerformance(perfRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div style={styles.loading}>Loading marketing dashboard...</div>;

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const draftCampaigns  = campaigns.filter(c => c.status === 'draft');

  const totalImpressions = performance.reduce((s, p) => s + (p.impressions || 0), 0);
  const totalClicks      = performance.reduce((s, p) => s + (p.clicks || 0), 0);
  const totalConversions = performance.reduce((s, p) => s + (p.conversions || 0), 0);
  const totalSpend       = performance.reduce((s, p) => s + Number(p.spend || 0), 0);

  // Performance trend by date (last 7 entries)
  const trendData = performance
    .slice(-7)
    .map(p => ({
      date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      impressions: p.impressions || 0,
      clicks: p.clicks || 0,
      conversions: p.conversions || 0,
    }));

  // Campaign performance bar chart
  const campaignPerf = campaigns
    .filter(c => c.status === 'active' || c.status === 'completed')
    .slice(0, 6)
    .map(c => ({
      name: c.title?.substring(0, 15) || 'Campaign',
      budget: Number(c.budget || 0),
      spent: Number(c.spent || 0),
    }));

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      style={styles.pageWrap}
    >
      {/* Stat Cards */}
      <motion.div variants={stagger} style={styles.cards}>
        {[
          { label: 'Active Campaigns',   value: activeCampaigns.length,   icon: <FaFlag />,          color: '#c4607a', bg: '#fdf0f3' },
          { label: 'Total Impressions',  value: totalImpressions.toLocaleString(), icon: <FaEye />,           color: '#c4607a', bg: '#fdf0f3' },
          { label: 'Total Clicks',       value: totalClicks.toLocaleString(),      icon: <FaMousePointer />,  color: '#c4607a', bg: '#fdf0f3' },
          { label: 'Total Spend',        value: `₱${totalSpend.toLocaleString()}`,    icon: <FaMoneyCheckAlt />, color: '#c4607a', bg: '#fdf0f3' },
        ].map((card) => (
          <motion.div
            key={card.label}
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            style={{ ...styles.card, borderLeft: `5px solid ${card.color}`, cursor: 'pointer' }}
          >
            <div style={{ ...styles.cardIconBox, backgroundColor: card.bg }}>
              <span style={styles.cardIcon}>{card.icon}</span>
            </div>
            <div>
              <p style={styles.cardLabel}>{card.label}</p>
              <p style={{ ...styles.cardValue, color: card.color }}>{card.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.p variants={fadeUp} style={styles.sectionTitle}>
        Campaign Performance
      </motion.p>
      <motion.div variants={stagger} style={styles.chartsGrid}>
        <motion.div
          variants={fadeUp}
          whileHover={{ y: -5, scale: 1.005 }}
          style={styles.chartCard}
        >
          <h4 style={styles.chartTitle}>Engagement Trend</h4>
          {trendData.length === 0 ? (
            <div style={styles.noData}>No performance data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="impressions" stroke="#2980b9" strokeWidth={2} dot={{ fill: '#2980b9', r: 3 }} name="Impressions" />
                <Line type="monotone" dataKey="clicks" stroke="#c4607a" strokeWidth={2} dot={{ fill: '#c4607a', r: 3 }} name="Clicks" />
                <Line type="monotone" dataKey="conversions" stroke="#27ae60" strokeWidth={2} dot={{ fill: '#27ae60', r: 3 }} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          variants={fadeUp}
          whileHover={{ y: -5, scale: 1.005 }}
          style={styles.chartCard}
        >
          <h4 style={styles.chartTitle}>Campaign Budget vs Spent</h4>
          {campaignPerf.length === 0 ? (
            <div style={styles.noData}>No active campaigns.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={campaignPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`]} />
                <Legend />
                <Bar dataKey="budget" fill="#c4607a" radius={[4,4,0,0]} name="Budget" />
                <Bar dataKey="spent" fill="#2980b9" radius={[4,4,0,0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </motion.div>

      {/* Active Campaigns & Actions */}
      <motion.p variants={fadeUp} style={styles.sectionTitle}>
        Monitoring & Actions
      </motion.p>
      <motion.div variants={stagger} style={styles.insightsGrid}>
        <motion.div
          variants={fadeUp}
          whileHover={{ y: -4 }}
          style={styles.insightCard}
        >
          <div style={styles.insightHeader}>
            <FaFlag color="#c4607a" />
            <h4 style={styles.insightTitle}>Active Campaigns</h4>
          </div>
          {activeCampaigns.length === 0 ? (
            <div style={styles.allGood}>No active campaigns.</div>
          ) : (
            <div style={styles.recentList}>
              {activeCampaigns.slice(0, 5).map((c, i) => (
                <motion.div
                  key={i}
                  style={styles.recentItem}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  whileHover={{ x: 5, backgroundColor: '#fff4f7' }}
                >
                  <div>
                    <p style={styles.recentCode}>{c.title}</p>
                    <p style={styles.recentName}>{c.platform || 'All Platforms'}</p>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: '#eafaf1',
                    color: '#27ae60',
                  }}>active</span>
                </motion.div>
              ))}
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/marketing')}
            style={styles.viewAllBtn}
          >
            View All Campaigns →
          </motion.button>
        </motion.div>

        <motion.div
          variants={fadeUp}
          whileHover={{ y: -4 }}
          style={styles.insightCard}
        >
          <div style={styles.insightHeader}>
            <FaTags color="#2980b9" />
            <h4 style={styles.insightTitle}>Upcoming / Draft</h4>
          </div>
          <div style={styles.pendingBox}>
            <p style={styles.pendingCount}>{draftCampaigns.length}</p>
            <p style={styles.pendingLabel}>draft campaign{draftCampaigns.length !== 1 ? 's' : ''} waiting</p>
            {draftCampaigns.length > 0 && (
              <p style={styles.pendingNote}>Review and activate draft campaigns</p>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          whileHover={{ y: -4 }}
          style={styles.insightCard}
        >
          <div style={styles.insightHeader}>
            <FaPlus color="#27ae60" />
            <h4 style={styles.insightTitle}>Quick Actions</h4>
          </div>
          <div style={styles.actionStack}>
            <motion.button
              onClick={() => navigate('/marketing')}
              style={styles.actionBtn}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaPlus /> New Campaign
            </motion.button>
            <motion.button
              onClick={() => navigate('/marketing')}
              style={styles.actionBtnSecondary}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaChartLine /> View Performance
            </motion.button>
            <motion.button
              onClick={() => navigate('/marketing')}
              style={styles.actionBtnSecondary}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaTags /> Manage Promotions
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

const styles = {
  pageWrap: {
    display: 'grid',
    gap: '0px',
  },
  loading: { padding: '60px', textAlign: 'center', color: '#aaa', fontSize: '16px' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' },
  card: { backgroundColor: '#fff', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '5px solid #c4607a', cursor: 'pointer' },
  cardIconBox: { width: '52px', height: '52px', borderRadius: '12px', backgroundColor: '#fdf0f3', color: '#c4607a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardIcon: { fontSize: '24px' },
  cardLabel: { margin: 0, fontSize: '12px', color: '#888', fontWeight: '600' },
  cardValue: { margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: '#c4607a' },
  sectionTitle: { fontSize: '18px', fontWeight: '800', color: '#302e2e', margin: '0 0 16px' },

  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '28px' },
  chartCard: { backgroundColor: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  chartTitle: { fontSize: '15px', fontWeight: '700', color: '#302e2e', margin: '0 0 16px' },
  noData: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },

  insightsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' },
  insightCard: { backgroundColor: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  insightHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' },
  insightTitle: { fontSize: '15px', fontWeight: '700', color: '#302e2e', margin: 0 },

  allGood: { backgroundColor: '#eafaf1', color: '#27ae60', padding: '16px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: '600' },
  recentList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  recentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  recentCode: { fontSize: '13px', fontWeight: '700', color: '#302e2e', margin: 0 },
  recentName: { fontSize: '11px', color: '#aaa', margin: '2px 0 0' },
  statusBadge: { padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
  viewAllBtn: { width: '100%', padding: '9px', backgroundColor: '#fdf0f3', color: '#c4607a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', marginTop: '8px' },

  pendingBox: { textAlign: 'center' },
  pendingCount: { fontSize: '48px', fontWeight: '800', color: '#2980b9', margin: '0 0 4px' },
  pendingLabel: { fontSize: '14px', color: '#888', margin: '0 0 12px' },
  pendingNote: { fontSize: '13px', color: '#2980b9', backgroundColor: '#eaf4fb', padding: '10px 14px', borderRadius: '8px', margin: 0 },

  actionStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  actionBtn: { width: '100%', padding: '10px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  actionBtnSecondary: { width: '100%', padding: '10px', backgroundColor: '#fdf0f3', color: '#c4607a', border: '1px solid #f0d0d8', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
};

export default MarketingDashboard;

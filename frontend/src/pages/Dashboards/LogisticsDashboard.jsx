import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axiosConfig';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FaBox, FaCheck, FaTruck, FaClock,
  FaWindowClose, FaPlus, FaSearch, FaRoute
} from "react-icons/fa";

function LogisticsDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sumRes, shipRes] = await Promise.all([
        api.get('/logistics/summary'),
        api.get('/logistics/shipments'),
      ]);
      setSummary(sumRes.data);
      setShipments(shipRes.data?.slice(0, 6) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading logistics dashboard...</div>;
  if (!summary) return null;

  const statusData = [
    { label: 'Pending', value: summary.pending || 0, color: '#888' },
    { label: 'Shipped', value: summary.shipped || 0, color: '#2980b9' },
    { label: 'In-Transit', value: summary.in_transit || 0, color: '#f39c12' },
    { label: 'Delivered', value: summary.delivered || 0, color: '#27ae60' },
    { label: 'Failed', value: summary.failed || 0, color: '#c4607a' },
  ].filter(s => s.value > 0);

  const deliveryTrend = [
    { label: 'Pending', value: summary.pending || 0, color: '#888' },
    { label: 'Shipped', value: summary.shipped || 0, color: '#2980b9' },
    { label: 'Delivered', value: summary.delivered || 0, color: '#27ae60' },
  ].filter(s => s.value > 0);

  const delayed = shipments.filter(
    s => s.status === 'pending' || s.status === 'in-transit'
  );

  return (
    <>
      <div style={styles.cards}>
        {[
          { label: 'Total Shipments', value: summary.total || 0, icon: <FaBox /> },
          { label: 'Delivered', value: summary.delivered || 0, icon: <FaCheck /> },
          { label: 'In Transit', value: summary.in_transit || 0, icon: <FaTruck /> },
          { label: 'Pending', value: summary.pending || 0, icon: <FaClock /> },
          { label: 'Failed', value: summary.failed || 0, icon: <FaWindowClose /> },
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
        Delivery Analytics
      </motion.p>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Shipment Status Breakdown</h4>
          {statusData.length === 0 ? (
            <div style={styles.noData}>No data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ label, value }) => `${label}: ${value}`}
                  labelLine={false}
                >
                  {statusData.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Delivery Trend</h4>
          {deliveryTrend.length === 0 ? (
            <div style={styles.noData}>No data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deliveryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {deliveryTrend.map((s, i) => (
                    <Cell key={i} fill={s.color} />
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
            <FaRoute color="#2980b9" />
            <h4 style={styles.insightTitle}>Recent Shipments</h4>
          </div>

          {shipments.length === 0 ? (
            <div style={styles.allGood}>No shipments yet.</div>
          ) : (
            <div style={styles.recentList}>
              {shipments.map((s, i) => (
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
                      {s.shipment_code || s.tracking_number || 'N/A'}
                    </p>
                    <p style={styles.recentName}>{s.customer_name}</p>
                  </div>

                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor:
                      s.status === 'delivered' ? '#eafaf1' :
                      s.status === 'in-transit' ? '#fef9e7' :
                      s.status === 'shipped' ? '#eaf4fb' :
                      '#fdf0f3',
                    color:
                      s.status === 'delivered' ? '#27ae60' :
                      s.status === 'in-transit' ? '#f39c12' :
                      s.status === 'shipped' ? '#2980b9' :
                      '#c4607a',
                  }}>
                    {s.status}
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
            <FaClock color="#f39c12" />
            <h4 style={styles.insightTitle}>Delivery Monitoring</h4>
          </div>

          <div style={styles.pendingBox}>
            <motion.p
              style={styles.pendingCount}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              {delayed.length}
            </motion.p>
            <p style={styles.pendingLabel}>
              shipment{delayed.length !== 1 ? 's' : ''} pending or in transit
            </p>
            {delayed.length > 0 && (
              <p style={styles.pendingNote}>Monitor delivery status for updates</p>
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
            <FaPlus color="#27ae60" />
            <h4 style={styles.insightTitle}>Quick Actions</h4>
          </div>

          <div style={styles.actionStack}>
            <motion.button
              onClick={() => navigate('/logistics')}
              style={styles.actionBtn}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaPlus /> New Shipment
            </motion.button>

            <motion.button
              onClick={() => navigate('/logistics')}
              style={styles.actionBtnSecondary}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaSearch /> Track Deliveries
            </motion.button>

            <motion.button
              onClick={() => navigate('/logistics')}
              style={styles.actionBtnSecondary}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaTruck /> View Shipments
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
  pendingCount: { fontSize: '48px', fontWeight: '800', color: '#f39c12', margin: '0 0 4px' },
  pendingLabel: { fontSize: '14px', color: '#888', margin: '0 0 12px' },
  pendingNote: {
    fontSize: '13px',
    color: '#f39c12',
    backgroundColor: '#fef9e7',
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
};

export default LogisticsDashboard;
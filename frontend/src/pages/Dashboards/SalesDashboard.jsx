import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axiosConfig';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FaCartPlus, FaMoneyBill, FaClock, FaTruck, FaWindowClose,
  FaPlus, FaList, FaShippingFast
} from "react-icons/fa";

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

function SalesDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sumRes, ordRes] = await Promise.all([
        api.get('/sales/summary'),
        api.get('/sales/orders'),
      ]);
      setSummary(sumRes.data);
      setOrders(ordRes.data?.slice(0, 6) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading sales dashboard...</div>;
  if (!summary) return null;

  const statusData = [
    { label: 'Pending', value: summary.pending || 0, color: '#f39c12' },
    { label: 'Confirmed', value: summary.confirmed || 0, color: '#2980b9' },
    { label: 'Forwarded', value: summary.forwarded || 0, color: '#27ae60' },
    { label: 'Cancelled', value: summary.cancelled || 0, color: '#c4607a' },
  ];

  const pieData = statusData.filter(s => s.value > 0);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      style={styles.pageWrap}
    >
      <motion.div variants={stagger} style={styles.cards}>
        {[
          {
            label: 'Total Orders',
            value: summary.total_orders || 0,
            icon: <FaCartPlus />,
          },
          {
            label: 'Total Revenue',
            value: `₱${Number(summary.total_revenue || 0).toLocaleString()}`,
            icon: <FaMoneyBill />,
          },
          {
            label: 'Pending',
            value: summary.pending || 0,
            icon: <FaClock />,
          },
          {
            label: 'Forwarded',
            value: summary.forwarded || 0,
            icon: <FaTruck />,
          },
          {
            label: 'Cancelled',
            value: summary.cancelled || 0,
            icon: <FaWindowClose />,
          },
        ].map((card) => (
          <motion.div
            key={card.label}
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.015 }}
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
      </motion.div>

      <motion.p variants={fadeUp} style={styles.sectionTitle}>
        Sales Analytics
      </motion.p>

      <motion.div variants={stagger} style={styles.chartsGrid}>
        <motion.div
          variants={fadeUp}
          whileHover={{ y: -5, scale: 1.005 }}
          style={styles.chartCard}
        >
          <h4 style={styles.chartTitle}>Orders by Status</h4>
          {pieData.length === 0 ? (
            <div style={styles.noData}>No order data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ label, value }) => `${label}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          variants={fadeUp}
          whileHover={{ y: -5, scale: 1.005 }}
          style={styles.chartCard}
        >
          <h4 style={styles.chartTitle}>Status Overview</h4>
          {statusData.length === 0 ? (
            <div style={styles.noData}>No data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </motion.div>

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
            <FaList color="#2980b9" />
            <h4 style={styles.insightTitle}>Recent Orders</h4>
          </div>

          {orders.length === 0 ? (
            <div style={styles.allGood}>No orders yet.</div>
          ) : (
            <div style={styles.recentList}>
              {orders.map((o, i) => (
                <motion.div
                  key={i}
                  style={styles.recentItem}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ x: 5, backgroundColor: '#fff4f7' }}
                >
                  <div>
                    <p style={styles.recentCode}>{o.order_code}</p>
                    <p style={styles.recentName}>{o.customer_name}</p>
                  </div>

                  <div style={styles.recentRight}>
                    <p style={styles.recentAmount}>
                      ₱{Number(o.total_amount || 0).toLocaleString()}
                    </p>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor:
                        o.status === 'forwarded' ? '#eafaf1' :
                        o.status === 'confirmed' ? '#eaf4fb' :
                        o.status === 'cancelled' ? '#fdf0f3' :
                        '#fef9e7',
                      color:
                        o.status === 'forwarded' ? '#27ae60' :
                        o.status === 'confirmed' ? '#2980b9' :
                        o.status === 'cancelled' ? '#c4607a' :
                        '#f39c12',
                    }}>
                      {o.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          variants={fadeUp}
          whileHover={{ y: -4 }}
          style={styles.insightCard}
        >
          <div style={styles.insightHeader}>
            <FaClock color="#f39c12" />
            <h4 style={styles.insightTitle}>Pending Approvals</h4>
          </div>

          <div style={styles.pendingBox}>
            <motion.p
              style={styles.pendingCount}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              {summary.pending || 0}
            </motion.p>
            <p style={styles.pendingLabel}>
              order{summary.pending !== 1 ? 's' : ''} awaiting confirmation
            </p>
            {summary.pending > 0 && (
              <motion.p
                style={styles.pendingNote}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                Review pending orders in Sales module
              </motion.p>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          whileHover={{ y: -4 }}
          style={styles.insightCard}
        >
          <div style={styles.insightHeader}>
            <FaShippingFast color="#27ae60" />
            <h4 style={styles.insightTitle}>Quick Actions</h4>
          </div>

          <div style={styles.actionStack}>
            <motion.button
              onClick={() => navigate('/sales')}
              style={styles.actionBtn}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaPlus /> Create New Order
            </motion.button>

            <motion.button
              onClick={() => navigate('/sales')}
              style={styles.actionBtnSecondary}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaList /> View All Orders
            </motion.button>

            <motion.button
              onClick={() => navigate('/logistics')}
              style={styles.actionBtnSecondary}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaTruck /> Check Shipments
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

  loading: {
    padding: '60px',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '16px',
  },

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

  cardIcon: {
    fontSize: '24px',
  },

  cardLabel: {
    margin: 0,
    fontSize: '12px',
    color: '#888',
    fontWeight: '600',
  },

  cardValue: {
    margin: '4px 0 0',
    fontSize: '28px',
    fontWeight: '800',
    color: '#c4607a',
  },

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

  recentRight: {
    textAlign: 'right',
  },

  recentAmount: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#302e2e',
    margin: '0 0 4px',
  },

  statusBadge: {
    padding: '2px 8px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  pendingBox: {
    textAlign: 'center',
  },

  pendingCount: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#f39c12',
    margin: '0 0 4px',
  },

  pendingLabel: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 12px',
  },

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

export default SalesDashboard;
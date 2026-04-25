import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axiosConfig';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FaBoxOpen, FaChartLine, FaExclamation, FaWindowClose,
  FaMoneyBill, FaPlus, FaArrowUp, FaArrowDown, FaBoxes
} from "react-icons/fa";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

function InventoryDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sumRes, itemsRes] = await Promise.all([
        api.get('/inventory/summary'),
        api.get('/inventory/items'),
      ]);
      setSummary(sumRes.data);
      setItems(itemsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading inventory dashboard...</div>;
  if (!summary) return null;

  const lowAndOut = items.filter(
    i => i.status === 'low-stock' || i.status === 'out-of-stock'
  );

  const stockStatusData = [
    { label: 'In Stock', value: summary.in_stock || 0, color: '#27ae60' },
    { label: 'Low Stock', value: summary.low_stock || 0, color: '#f39c12' },
    { label: 'Out of Stock', value: summary.out_of_stock || 0, color: '#c4607a' },
  ].filter(s => s.value > 0);

  const categoryMap = {};
  items.forEach(i => {
    const category = i.category || 'Uncategorized';
    categoryMap[category] = (categoryMap[category] || 0) + 1;
  });

  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={styles.pageWrap}>
      <motion.div variants={stagger} style={styles.cards}>
        {[
          { label: 'Total Items', value: summary.total_items || 0, icon: <FaBoxOpen /> },
          { label: 'In Stock', value: summary.in_stock || 0, icon: <FaChartLine /> },
          { label: 'Low Stock', value: summary.low_stock || 0, icon: <FaExclamation /> },
          { label: 'Out of Stock', value: summary.out_of_stock || 0, icon: <FaWindowClose /> },
          { label: 'Total Value', value: `₱${Number(summary.total_value || 0).toLocaleString()}`, icon: <FaMoneyBill /> },
        ].map((card) => (
          <motion.div
            key={card.label}
            variants={fadeUp}
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
      </motion.div>

      <motion.p variants={fadeUp} style={styles.sectionTitle}>
        Stock Analytics
      </motion.p>

      <motion.div variants={stagger} style={styles.chartsGrid}>
        <motion.div variants={fadeUp} style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Stock Status Breakdown</h4>
          {stockStatusData.length === 0 ? (
            <div style={styles.noData}>No data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stockStatusData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ label, value }) => `${label}: ${value}`}
                  labelLine={false}
                >
                  {stockStatusData.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div variants={fadeUp} style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Category Distribution</h4>
          {categoryData.length === 0 ? (
            <div style={styles.noData}>No data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#c4607a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </motion.div>

      <motion.p variants={fadeUp} style={styles.sectionTitle}>
        Monitoring & Actions
      </motion.p>

      <motion.div variants={stagger} style={styles.insightsGrid}>
        <motion.div variants={fadeUp} whileHover={{ y: -4 }} style={styles.insightCard}>
          <div style={styles.insightHeader}>
            <FaExclamation color="#f39c12" />
            <h4 style={styles.insightTitle}>Low Stock Alerts</h4>
          </div>

          {lowAndOut.length === 0 ? (
            <div style={styles.allGood}>All items sufficiently stocked!</div>
          ) : (
            <div style={styles.alertList}>
              {lowAndOut.slice(0, 5).map((item, i) => (
                <motion.div
                  key={item.id || i}
                  style={styles.alertItem}
                  whileHover={{ x: 5, backgroundColor: '#fff4f7' }}
                >
                  <div>
                    <p style={styles.alertName}>{item.name}</p>
                    <p style={styles.alertCode}>{item.item_code}</p>
                  </div>
                  <span style={{
                    ...styles.stockBadge,
                    backgroundColor: item.status === 'out-of-stock' ? '#fdf0f3' : '#fef9e7',
                    color: item.status === 'out-of-stock' ? '#c4607a' : '#f39c12',
                  }}>
                    {item.quantity} left
                  </span>
                </motion.div>
              ))}

              {lowAndOut.length > 5 && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/inventory')}
                  style={styles.viewAllBtn}
                >
                  View all {lowAndOut.length} alerts →
                </motion.button>
              )}
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeUp} whileHover={{ y: -4 }} style={styles.insightCard}>
          <div style={styles.insightHeader}>
            <FaBoxes color="#2980b9" />
            <h4 style={styles.insightTitle}>Recent Stock Movements</h4>
          </div>
          <div style={styles.allGood}>
            Check the Stock Movement tab in Inventory module for detailed logs.
          </div>
          <motion.button
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/inventory')}
            style={styles.viewAllBtn}
          >
            View Stock Movement →
          </motion.button>
        </motion.div>

        <motion.div variants={fadeUp} whileHover={{ y: -4 }} style={styles.insightCard}>
          <div style={styles.insightHeader}>
            <FaPlus color="#27ae60" />
            <h4 style={styles.insightTitle}>Quick Actions</h4>
          </div>

          <div style={styles.actionStack}>
            <motion.button onClick={() => navigate('/inventory')} style={styles.actionBtn} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}>
              <FaPlus /> Add New Item
            </motion.button>
            <motion.button onClick={() => navigate('/inventory')} style={styles.actionBtnSecondary} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}>
              <FaArrowUp /> Stock In
            </motion.button>
            <motion.button onClick={() => navigate('/inventory')} style={styles.actionBtnSecondary} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}>
              <FaArrowDown /> Stock Out
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

const styles = {
  pageWrap: { display: 'grid', gap: '0px' },
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
  alertList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  alertItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  alertName: { fontSize: '13px', fontWeight: '700', color: '#302e2e', margin: 0 },
  alertCode: { fontSize: '11px', color: '#aaa', margin: '2px 0 0' },
  stockBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  viewAllBtn: { width: '100%', padding: '9px', backgroundColor: '#fdf0f3', color: '#c4607a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', marginTop: '8px' },
  actionStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  actionBtn: { width: '100%', padding: '10px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  actionBtnSecondary: { width: '100%', padding: '10px', backgroundColor: '#fdf0f3', color: '#c4607a', border: '1px solid #f0d0d8', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
};

export default InventoryDashboard;
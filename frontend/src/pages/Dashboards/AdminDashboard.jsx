import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  FaShoppingBag, FaBoxes, FaUsers, FaComments, FaClock,
  FaTruck, FaFileAlt, FaUserCog, FaClipboardCheck,
  FaBolt
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

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const PIE_COLORS = ['#c4607a', '#2980b9', '#27ae60', '#f39c12', '#8e44ad'];

  const satisfactionColor = (rate) => {
    if (rate >= 4) return '#27ae60';
    if (rate >= 3) return '#f39c12';
    return '#c4607a';
  };

  const satisfactionLabel = (rate) => {
    if (rate >= 4.5) return 'Excellent';
    if (rate >= 4) return 'Very Good';
    if (rate >= 3) return 'Good';
    if (rate >= 2) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) return <div style={styles.loading}>Loading dashboard data...</div>;
  if (!stats) return null;

  const role = String(user?.role || 'admin').toLowerCase();

  const recentOrders = stats.recent_orders || [];
  const lowStock = stats.low_stock || [];
  const topProducts = stats.top_products || [];
  const salesTrend = stats.sales_trend || [];
  const monthlyRevenue = stats.monthly_revenue || [];
  const ordersByStatus = stats.orders_by_status || [];
  const feedbackByType = stats.feedback_by_type || [];

  const recentActivities = [
    ...recentOrders.slice(0, 3).map((o) => ({
      type: 'Sales',
      icon: <FaShoppingBag />,
      title: `Order ${o.order_code || ''}`,
      subtitle: o.customer_name || 'Customer order',
      amount: `₱${Number(o.total_amount || 0).toLocaleString()}`,
      status: o.status || 'updated',
      path: '/sales',
    })),
    ...lowStock.slice(0, 3).map((item) => ({
      type: 'Inventory',
      icon: <FaBoxes />,
      title: item.name || 'Inventory Item',
      subtitle: `${item.item_code || 'Item'} has ${item.quantity || 0} left`,
      amount: 'Stock Alert',
      status: item.status || 'low stock',
      path: '/inventory',
    })),
    ...(Number(stats.pending_deliveries || 0) > 0
      ? [{
          type: 'Logistics',
          icon: <FaTruck />,
          title: 'Pending Deliveries',
          subtitle: `${stats.pending_deliveries} shipment(s) in progress`,
          amount: 'Delivery',
          status: 'pending',
          path: '/logistics',
        }]
      : []),
    ...(Number(stats.total_feedback || 0) > 0
      ? [{
          type: 'CRM',
          icon: <FaComments />,
          title: 'Customer Feedback',
          subtitle: `${stats.total_feedback} feedback record(s) available`,
          amount: `${stats.avg_rating || 0}/5`,
          status: 'feedback',
          path: '/crm',
        }]
      : []),
    ...(Number(stats.total_employees || 0) > 0
      ? [{
          type: 'HR',
          icon: <FaUsers />,
          title: 'Employee Records',
          subtitle: `${stats.total_employees} employee(s) in the system`,
          amount: 'HR',
          status: 'active',
          path: '/hr',
        }]
      : []),
  ].slice(0, 8);

  const workspace = {
    title: `${role.charAt(0).toUpperCase() + role.slice(1)} Workspace`,
    subtitle: 'Quick overview and actions based on your current role.',
    focus: [
      { label: 'Total Orders', value: stats.total_orders || 0, path: '/sales' },
      { label: 'Low Stock Items', value: lowStock.length || 0, path: '/inventory' },
      { label: 'Pending Deliveries', value: stats.pending_deliveries || 0, path: '/logistics' },
    ],
    actions: [
      { label: 'Review Sales Orders', icon: <FaShoppingBag />, path: '/sales' },
      { label: 'Check Inventory', icon: <FaBoxes />, path: '/inventory' },
      { label: 'View Reports', icon: <FaFileAlt />, path: '/reports' },
    ],
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      style={styles.pageWrap}
    >
      <motion.div variants={stagger} style={styles.cards}>
        {[
          { icon: <FaShoppingBag />, label: 'Total Orders', value: stats.total_orders, path: '/sales' },
          { icon: <FaBoxes />, label: 'Inventory Items', value: stats.total_items, path: '/inventory' },
          { icon: <FaUsers />, label: 'Employees', value: stats.total_employees, path: '/hr' },
          { icon: <FaComments />, label: 'Feedbacks', value: stats.total_feedback, path: '/crm' },
        ].map((card) => (
          <motion.div
            key={card.label}
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(card.path)}
            style={styles.card}
          >
            <div style={styles.cardIconBox}>
              <span style={styles.cardIcon}>{card.icon}</span>
            </div>
            <div>
              <p style={styles.cardLabel}>{card.label}</p>
              <p style={styles.cardValue}>{card.value || 0}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={fadeUp}
        whileHover={{ y: -3 }}
        style={styles.workspaceCard}
      >
        <div style={styles.workspaceHeader}>
          <div style={styles.workspaceTitleWrap}>
            <motion.div
              style={styles.workspaceIconBox}
              whileHover={{ rotate: 6, scale: 1.05 }}
            >
              <FaUserCog />
            </motion.div>
            <div>
              <p style={styles.workspaceLabel}>ROLE-BASED WORKSPACE</p>
              <h3 style={styles.workspaceTitle}>{workspace.title}</h3>
              <p style={styles.workspaceSub}>{workspace.subtitle}</p>
            </div>
          </div>
          <span style={styles.workspaceBadge}>{role.toUpperCase()}</span>
        </div>

        <div style={styles.workspaceBody}>
          <div style={styles.focusPanel}>
            <div style={styles.panelHeader}><FaBolt /> Today's Focus</div>
            <div style={styles.focusGrid}>
              {workspace.focus.map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(item.path)}
                  style={styles.focusItem}
                >
                  <p style={styles.focusValue}>{item.value}</p>
                  <p style={styles.focusLabel}>{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={styles.actionsPanel}>
            <div style={styles.panelHeader}><FaClipboardCheck /> Quick Actions</div>
            <div style={styles.actionGrid}>
              {workspace.actions.map((action) => (
                <motion.button
                  key={action.label}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(action.path)}
                  style={styles.workspaceAction}
                >
                  <span style={styles.actionIcon}>{action.icon}</span>
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.p variants={fadeUp} style={styles.sectionTitle}>
        Here's what's happening with your product today.
      </motion.p>

      <motion.div variants={stagger} style={styles.insightsGrid}>
        <motion.div variants={fadeUp} whileHover={{ y: -4 }} style={styles.insightCard}>
          <div style={styles.insightHeader}>
            <h4 style={styles.insightTitle}>Customer Satisfaction Rate</h4>
          </div>
          <div style={styles.satisfactionBox}>
            <p style={{ ...styles.satisfactionRate, color: satisfactionColor(stats.avg_rating) }}>
              {stats.avg_rating || 0} / 5.0
            </p>
            <p style={{ ...styles.satisfactionLabel, color: satisfactionColor(stats.avg_rating) }}>
              {satisfactionLabel(stats.avg_rating)}
            </p>
            <p style={styles.satisfactionSub}>
              Based on {stats.total_ratings || 0} feedbacks
            </p>
            <div style={styles.ratingBar}>
              <motion.div
                style={{
                  ...styles.ratingFill,
                  backgroundColor: satisfactionColor(stats.avg_rating),
                }}
                initial={{ width: 0 }}
                animate={{ width: `${((stats.avg_rating || 0) / 5) * 100}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} whileHover={{ y: -4 }} style={styles.insightCard}>
          <div style={styles.insightHeader}>
            <h4 style={styles.insightTitle}>Low Stock Alerts</h4>
          </div>
          {lowStock.length === 0 ? (
            <div style={styles.allGood}>All items sufficiently stocked!</div>
          ) : (
            <div style={styles.alertList}>
              {lowStock.map((item, i) => (
                <motion.div
                  key={i}
                  style={styles.alertItem}
                  whileHover={{ x: 4 }}
                >
                  <div>
                    <p style={styles.alertName}>{item.name}</p>
                    <p style={styles.alertCode}>{item.item_code}</p>
                  </div>
                  <span style={styles.stockBadge}>{item.quantity} left</span>
                </motion.div>
              ))}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/inventory')} style={styles.viewAllBtn}>
                View Inventory →
              </motion.button>
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeUp} whileHover={{ y: -4 }} style={styles.insightCard}>
          <div style={styles.insightHeader}>
            <h4 style={styles.insightTitle}>Pending Deliveries</h4>
          </div>
          <div style={styles.pendingBox}>
            <p style={styles.pendingCount}>{stats.pending_deliveries || 0}</p>
            <p style={styles.pendingLabel}>shipments in progress</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/logistics')} style={styles.viewAllBtn}>
              View Logistics →
            </motion.button>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} whileHover={{ y: -4 }} style={{ ...styles.insightCard, gridColumn: 'span 2' }}>
          <div style={styles.insightHeader}>
            <h4 style={styles.insightTitle}>Top Selling Products</h4>
          </div>
          {topProducts.length === 0 ? (
            <div style={styles.allGood}>No sales data yet.</div>
          ) : (
            <table style={styles.insightTable}>
              <thead>
                <tr>
                  <th style={styles.ith}>Rank</th>
                  <th style={styles.ith}>Product</th>
                  <th style={styles.ith}>Units Sold</th>
                  <th style={styles.ith}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i}>
                    <td style={styles.itd}>#{i + 1}</td>
                    <td style={styles.itd}>{p.item_name}</td>
                    <td style={styles.itd}>{Number(p.total_sold || 0).toLocaleString()} units</td>
                    <td style={{ ...styles.itd, color: '#c4607a', fontWeight: '700' }}>
                      ₱{Number(p.total_revenue || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        <motion.div variants={fadeUp} whileHover={{ y: -4 }} style={styles.insightCard}>
          <div style={styles.insightHeader}>
            <FaClock />
            <h4 style={styles.insightTitle}>Recent Orders</h4>
          </div>
          {recentOrders.length === 0 ? (
            <div style={styles.allGood}>No orders yet.</div>
          ) : (
            <div style={styles.recentList}>
              {recentOrders.map((o, i) => (
                <motion.div key={i} style={styles.recentItem} whileHover={{ x: 4 }}>
                  <div>
                    <p style={styles.recentCode}>{o.order_code}</p>
                    <p style={styles.recentName}>{o.customer_name}</p>
                  </div>
                  <p style={styles.recentAmount}>₱{Number(o.total_amount || 0).toLocaleString()}</p>
                </motion.div>
              ))}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/sales')} style={styles.viewAllBtn}>
                View All Orders →
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>

      <motion.p variants={fadeUp} style={styles.sectionTitle}>
        Analytics & Charts
      </motion.p>

      <motion.div variants={stagger} style={styles.chartsGrid}>
        {[
          {
            title: 'Sales Trend (Last 7 Days)',
            empty: salesTrend.length === 0,
            emptyText: 'No sales data in the last 7 days.',
            content: (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#c4607a" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="orders" stroke="#2980b9" strokeWidth={2} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            ),
          },
          {
            title: 'Monthly Revenue',
            empty: monthlyRevenue.length === 0,
            emptyText: 'No monthly data available.',
            content: (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#c4607a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ),
          },
          {
            title: 'Orders by Status',
            empty: ordersByStatus.length === 0,
            emptyText: 'No order data available.',
            content: (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={ordersByStatus} dataKey="count" nameKey="status" outerRadius={80} label>
                    {ordersByStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ),
          },
          {
            title: 'Feedback by Type',
            empty: feedbackByType.length === 0,
            emptyText: 'No feedback data available.',
            content: (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={feedbackByType} dataKey="count" nameKey="type" outerRadius={80} label>
                    {feedbackByType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ),
          },
        ].map((chart) => (
          <motion.div
            key={chart.title}
            variants={fadeUp}
            whileHover={{ y: -5, scale: 1.005 }}
            style={styles.chartCard}
          >
            <h4 style={styles.chartTitle}>{chart.title}</h4>
            {chart.empty ? (
              <div style={styles.noData}>{chart.emptyText}</div>
            ) : (
              chart.content
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.p variants={fadeUp} style={styles.sectionTitle}>
        Recent Activity
      </motion.p>

      <motion.div variants={fadeUp} style={styles.activityCard}>
        {recentActivities.length === 0 ? (
          <div style={styles.noData}>No recent activity.</div>
        ) : (
          <div style={styles.activityList}>
            {recentActivities.map((activity, i) => (
              <motion.div
                key={i}
                style={styles.activityItem}
                onClick={() => navigate(activity.path)}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ x: 6, backgroundColor: '#fff4f7' }}
                whileTap={{ scale: 0.98 }}
              >
                <div style={styles.activityLeft}>
                  <div style={styles.activityIcon}>{activity.icon}</div>
                  <div>
                    <p style={styles.activityTitle}>{activity.title}</p>
                    <p style={styles.activitySub}>{activity.type} • {activity.subtitle}</p>
                  </div>
                </div>

                <div style={styles.activityRight}>
                  <span style={styles.statusBadge}>{activity.status}</span>
                  <p style={styles.activityAmount}>{activity.amount}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

const styles = {
  pageWrap: { display: 'grid', gap: '0px' },
  loading: { padding: '60px', textAlign: 'center', color: '#aaa', fontSize: '16px' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' },
  card: { backgroundColor: '#fff', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' },
  cardIconBox: { width: '52px', height: '52px', borderRadius: '12px', backgroundColor: '#fdf0f3', color: '#c4607a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: '24px' },
  cardLabel: { margin: 0, fontSize: '12px', color: '#888', fontWeight: '600' },
  cardValue: { margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: '#c4607a' },
  sectionTitle: { fontSize: '18px', fontWeight: '800', color: '#302e2e', margin: '0 0 16px' },
  workspaceCard: { background: 'linear-gradient(135deg, #ffffff, #fff7fa, #fdf0f3)', border: '1px solid #f1d4dd', borderRadius: '18px', padding: '24px', marginBottom: '28px', boxShadow: '0 8px 24px rgba(196,96,122,0.12)' },
  workspaceHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' },
  workspaceTitleWrap: { display: 'flex', alignItems: 'center', gap: '14px' },
  workspaceIconBox: { width: '54px', height: '54px', borderRadius: '16px', backgroundColor: '#c4607a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  workspaceLabel: { margin: 0, fontSize: '11px', fontWeight: '800', color: '#c4607a', letterSpacing: '1.5px' },
  workspaceTitle: { margin: '4px 0', fontSize: '24px', fontWeight: '800', color: '#302e2e' },
  workspaceSub: { margin: 0, fontSize: '14px', color: '#777' },
  workspaceBadge: { backgroundColor: '#fff', color: '#c4607a', padding: '7px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', border: '1px solid #f0d0d8' },
  workspaceBody: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' },
  focusPanel: { backgroundColor: 'rgba(255,255,255,0.8)', border: '1px solid #f1d4dd', borderRadius: '16px', padding: '16px' },
  actionsPanel: { backgroundColor: 'rgba(255,255,255,0.8)', border: '1px solid #f1d4dd', borderRadius: '16px', padding: '16px' },
  panelHeader: { display: 'flex', alignItems: 'center', gap: '8px', color: '#c4607a', fontSize: '14px', fontWeight: '800', marginBottom: '12px' },
  focusGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  focusItem: { backgroundColor: '#fff', border: '1px solid #f3dbe3', borderRadius: '14px', padding: '14px', cursor: 'pointer' },
  focusValue: { margin: 0, fontSize: '24px', fontWeight: '800', color: '#c4607a' },
  focusLabel: { margin: '5px 0 0', fontSize: '12px', color: '#777', fontWeight: '700' },
  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  workspaceAction: { backgroundColor: '#fff', border: '1px solid #f3dbe3', color: '#302e2e', borderRadius: '14px', padding: '14px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' },
  actionIcon: { color: '#c4607a', fontSize: '16px' },
  insightsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' },
  insightCard: { backgroundColor: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  insightHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' },
  insightTitle: { fontSize: '15px', fontWeight: '700', color: '#302e2e', margin: 0 },
  satisfactionBox: { textAlign: 'center' },
  satisfactionRate: { fontSize: '40px', fontWeight: '800', margin: '0 0 4px' },
  satisfactionLabel: { fontSize: '15px', fontWeight: '700', margin: '0 0 8px' },
  satisfactionSub: { fontSize: '12px', color: '#aaa', margin: '0 0 12px' },
  ratingBar: { backgroundColor: '#f0f0f0', borderRadius: '10px', height: '10px', overflow: 'hidden' },
  ratingFill: { height: '10px', borderRadius: '10px' },
  allGood: { backgroundColor: '#eafaf1', color: '#27ae60', padding: '16px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: '600' },
  alertList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  alertItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  alertName: { fontSize: '13px', fontWeight: '700', color: '#302e2e', margin: 0 },
  alertCode: { fontSize: '11px', color: '#aaa', margin: '2px 0 0' },
  stockBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: '#fef9e7', color: '#f39c12' },
  pendingBox: { textAlign: 'center' },
  pendingCount: { fontSize: '48px', fontWeight: '800', color: '#c4607a', margin: '0 0 4px' },
  pendingLabel: { fontSize: '14px', color: '#888', margin: '0 0 12px' },
  viewAllBtn: { width: '100%', padding: '9px', backgroundColor: '#fdf0f3', color: '#c4607a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', marginTop: '8px' },
  insightTable: { width: '100%', borderCollapse: 'collapse' },
  ith: { padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#555', borderBottom: '1px solid #eee' },
  itd: { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f5f5f5' },
  recentList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  recentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  recentCode: { fontSize: '13px', fontWeight: '700', color: '#302e2e', margin: 0 },
  recentName: { fontSize: '11px', color: '#aaa', margin: '2px 0 0' },
  recentAmount: { fontSize: '13px', fontWeight: '800', color: '#302e2e', margin: 0 },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '28px' },
  chartCard: { backgroundColor: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  chartTitle: { fontSize: '15px', fontWeight: '700', color: '#302e2e', margin: '0 0 16px' },
  noData: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  activityCard: { backgroundColor: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '28px' },
  activityList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  activityItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#f9fafb', cursor: 'pointer' },
  activityLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  activityIcon: { width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fdf0f3', color: '#c4607a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  activityTitle: { margin: 0, fontSize: '13px', fontWeight: '800', color: '#302e2e' },
  activitySub: { margin: '2px 0 0', fontSize: '11px', color: '#888' },
  activityRight: { textAlign: 'right' },
  activityAmount: { margin: '4px 0 0', fontSize: '13px', fontWeight: '800', color: '#302e2e' },
  statusBadge: { padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: '#fdf0f3', color: '#c4607a', textTransform: 'capitalize' },
};

export default AdminDashboard;
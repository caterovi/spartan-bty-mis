import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import logo from '../assets/spartanbtylogo.webp';
import NotificationBell from '../components/NotificationBell';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MdDashboard } from "react-icons/md";
import { FaBullhorn, FaShoppingCart, FaTruck, FaComment, FaBoxes, FaUsers, FaFileAlt, FaUserCog,
  FaShoppingBag, FaComments, FaClock, FaBell
 } from "react-icons/fa";

function Dashboard() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout, getAccessibleModules } = useAuth();
  const [stats, setStats]     = useState(null);
  const [hovered, setHovered] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchStats();
  }, [user, navigate]);

  useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
    if (window.innerWidth > 768) setSidebarOpen(false);
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    logout();
  };

  const allNavItems = [
  { key: 'dashboard',  icon: <MdDashboard />,    label: 'Dashboard',        path: '/dashboard' },
  { key: 'marketing',  icon: <FaBullhorn />,     label: 'Marketing',        path: '/marketing' },
  { key: 'sales',      icon: <FaShoppingCart />, label: 'Sales',            path: '/sales' },
  { key: 'logistics',  icon: <FaTruck />,        label: 'Logistics',        path: '/logistics' },
  { key: 'crm',        icon: <FaComment />,      label: 'CRM',              path: '/crm' },
  { key: 'inventory',  icon: <FaBoxes />,        label: 'Inventory',        path: '/inventory' },
  { key: 'hr',         icon: <FaUsers />,        label: 'Human Resources',  path: '/hr' },
  { key: 'reports',    icon: <FaFileAlt/>,       label: 'Reports',          path: '/reports' },
  { key: 'users',      icon: <FaUserCog/>,       label: 'User Management',  path: '/users' },
];

const accessibleModules = getAccessibleModules();

const navItems = allNavItems.filter(item =>
  accessibleModules.includes(item.key)
);
const handleNav = (path) => {
  if (location.pathname !== path) navigate(path);
};

  const PIE_COLORS = ['#c4607a','#2980b9','#27ae60','#f39c12','#8e44ad'];

  const satisfactionColor = (rate) => {
    if (rate >= 4) return '#27ae60';
    if (rate >= 3) return '#f39c12';
    return '#c4607a';
  };

  const satisfactionLabel = (rate) => {
    if (rate >= 4.5) return 'Excellent';
    if (rate >= 4)   return 'Very Good';
    if (rate >= 3)   return 'Good';
    if (rate >= 2)   return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div style={styles.container}>
      {isMobile && sidebarOpen && (
  <div
    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 998 }}
    onClick={() => setSidebarOpen(false)}
  />
)}
      {/* Sidebar */}
      <div style={{
  ...styles.sidebar,
  transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
  transition: 'transform 0.3s ease',
  zIndex: isMobile ? 999 : 100,
}}>
        <div style={styles.logoSection}>
          <img src={logo} alt="Logo" style={styles.logoImg} />
          <div>
            <h2 style={styles.logoText}>Spartan BTY Inc.</h2>
            <p style={styles.logoSub}>Management Information System</p>
          </div>
           {isMobile && (
    <button
      onClick={() => setSidebarOpen(false)}
      style={{ backgroundColor: 'rgba(255,255,255,0.25)', border: 'none', color: '#302e2e', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >✕</button>
  )}
        </div>
        <nav style={styles.nav}>
          <p style={styles.navSection}>MAIN MENU</p>
          {navItems.map((item) => {
            const isActive  = location.pathname === item.path;
            const isHovered = hovered === item.label;
            return (
              <div
                key={item.label}
                onClick={() => handleNav(item.path)}
                onMouseEnter={() => setHovered(item.label)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...styles.navItem,
                  backgroundColor: isActive ? '#ffffff' : isHovered ? 'rgba(255,255,255,0.15)' : 'transparent',
                  borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
                  transform: isHovered && !isActive ? 'translateX(4px)' : 'translateX(0)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span style={{ fontWeight: isActive ? '700' : '400' }}>{item.label}</span>
                {isActive && <span style={styles.activeDot}>●</span>}
              </div>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          style={styles.logout}
        >
           Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{
  ...styles.main,
  marginLeft: isMobile ? '0' : '260px',
}}>

        {/* Top Bar */}
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '28px',
  backgroundColor: '#fff',
  padding: '16px 24px',
  borderRadius: '14px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  minHeight: '72px',
  flexShrink: 0,
  gap: '12px',
}}>
  {/* LEFT: Hamburger + Title */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    {isMobile && (
      <button
        onClick={() => setSidebarOpen(true)}
        style={{
          display: 'flex', flexDirection: 'column', gap: '5px',
          justifyContent: 'center', alignItems: 'center',
          backgroundColor: '#fdf0f3', border: '1px solid #f0d0d8',
          borderRadius: '8px', padding: '8px 10px', cursor: 'pointer',
          minWidth: '40px', minHeight: '40px', flexShrink: 0,
        }}
      >
        <span style={{ display: 'block', width: '18px', height: '2px', backgroundColor: '#c4607a', borderRadius: '2px' }} />
        <span style={{ display: 'block', width: '18px', height: '2px', backgroundColor: '#c4607a', borderRadius: '2px' }} />
        <span style={{ display: 'block', width: '18px', height: '2px', backgroundColor: '#c4607a', borderRadius: '2px' }} />
      </button>
    )}
    <div>
      <h1 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: '700', color: '#302e2e', margin: '0 0 4px' }}>
        Dashboard
      </h1>
      <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
        Welcome back, {user?.full_name}!
      </p>
    </div>
  </div>

  {/* RIGHT: Bell + Divider + User Info */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
     <NotificationBell />
    <div style={{ width: '1px', height: '32px', backgroundColor: '#eee', flexShrink: 0 }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        backgroundColor: '#c4607a', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: '700', flexShrink: 0,
      }}>
        {user?.full_name?.charAt(0).toUpperCase()}
      </div>
      {!isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#302e2e', margin: 0, whiteSpace: 'nowrap' }}>
            {user?.full_name}
          </p>
          <span style={{ backgroundColor: '#fdf0f3', color: '#c4607a', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', alignSelf: 'flex-start' }}>
            {user?.role?.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  </div>
</div>

        {loading ? (
          <div style={styles.loading}>Loading dashboard data...</div>
        ) : stats ? (
          <>
            {/* Stat Cards */}
            <div style={styles.cards}>
              {[
                { icon: <FaShoppingBag/>, label: 'Total Orders',    value: stats.total_orders,    color: '#c4607a', bg: '#fdf0f3', path: '/sales' },
                { icon: <FaBoxes />, label: 'Inventory Items', value: stats.total_items,     color: '#c4607a', bg: '#fdf0f3', path: '/inventory' },
                { icon: <FaUsers />, label: 'Employees',       value: stats.total_employees, color: '#c4607a', bg: '#fdf0f3', path: '/hr' },
                { icon: <FaComments />, label: 'Feedbacks',       value: stats.total_feedback,  color: '#c4607a', bg: '#fdf0f3', path: '/crm' },
              ].map((card) => (
                <div
                  key={card.label}
                  onClick={() => navigate(card.path)}
                  style={{ ...styles.card, borderLeft: `5px solid ${card.color}`, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ ...styles.cardIconBox, backgroundColor: card.bg }}>
                    <span style={styles.cardIcon}>{card.icon}</span>
                  </div>
                  <div>
                    <p style={styles.cardLabel}>{card.label}</p>
                    <p style={{ ...styles.cardValue, color: card.color }}>{card.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Decision Support Insights */}
            <p style={styles.sectionTitle}>Here's what's happening with your product today.</p>
            <div style={styles.insightsGrid}>

              {/* Customer Satisfaction */}
              <div style={styles.insightCard}>
                <div style={styles.insightHeader}>
                  <span style={styles.insightIcon}> </span>
                  <h4 style={styles.insightTitle}>Customer Satisfaction Rate</h4>
                </div>
                <div style={styles.satisfactionBox}>
                  <p style={{ ...styles.satisfactionRate, color: satisfactionColor(stats.avg_rating) }}>
                    {stats.avg_rating || 0} / 5.0
                  </p>
                  <p style={{ ...styles.satisfactionLabel, color: satisfactionColor(stats.avg_rating) }}>
                    {satisfactionLabel(stats.avg_rating)}
                  </p>
                  <p style={styles.satisfactionSub}>Based on {stats.total_ratings} feedback{stats.total_ratings !== 1 ? 's' : ''}</p>
                  <div style={styles.ratingBar}>
                    <div style={{
                      ...styles.ratingFill,
                      width: `${((stats.avg_rating || 0) / 5) * 100}%`,
                      backgroundColor: satisfactionColor(stats.avg_rating),
                    }} />
                  </div>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div style={styles.insightCard}>
                <div style={styles.insightHeader}>
                  <span style={styles.insightIcon}> </span>
                  <h4 style={styles.insightTitle}>Low Stock Alerts</h4>
                </div>
                {stats.low_stock.length === 0 ? (
                  <div style={styles.allGood}> All items sufficiently stocked!</div>
                ) : (
                  <div style={styles.alertList}>
                    {stats.low_stock.map((item, i) => (
                      <div key={i} style={styles.alertItem}>
                        <div>
                          <p style={styles.alertName}>{item.name}</p>
                          <p style={styles.alertCode}>{item.item_code}</p>
                        </div>
                        <div style={styles.alertRight}>
                          <span style={{
                            ...styles.stockBadge,
                            backgroundColor: item.status === 'out-of-stock' ? '#fdf0f3' : '#fef9e7',
                            color: item.status === 'out-of-stock' ? '#c4607a' : '#f39c12',
                          }}>
                            {item.quantity} left
                          </span>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => navigate('/inventory')} style={styles.viewAllBtn}>
                      View Inventory →
                    </button>
                  </div>
                )}
              </div>

              {/* Pending Deliveries */}
              <div style={styles.insightCard}>
                <div style={styles.insightHeader}>
                  <span style={styles.insightIcon}> </span>
                  <h4 style={styles.insightTitle}>Pending Deliveries</h4>
                </div>
                <div style={styles.pendingBox}>
                  <p style={styles.pendingCount}>{stats.pending_deliveries}</p>
                  <p style={styles.pendingLabel}>shipment{stats.pending_deliveries !== 1 ? 's' : ''} in progress</p>
                  <div style={styles.pendingBreakdown}>
                    {stats.pending_deliveries > 0 ? (
                      <p style={styles.pendingNote}>
                        Action needed — check Logistics module for updates
                      </p>
                    ) : (
                      <p style={{ ...styles.pendingNote, color: '#27ae60' }}>
                         No pending deliveries!
                      </p>
                    )}
                  </div>
                  <button onClick={() => navigate('/logistics')} style={styles.viewAllBtn}>
                    View Logistics →
                  </button>
                </div>
              </div>

              {/* Top Selling Products */}
              <div style={{ ...styles.insightCard, gridColumn: 'span 2' }}>
                <div style={styles.insightHeader}>
                  <span style={styles.insightIcon}> </span>
                  <h4 style={styles.insightTitle}>Top Selling Products</h4>
                </div>
                {stats.top_products.length === 0 ? (
                  <div style={styles.allGood}>No sales data yet.</div>
                ) : (
                  <table style={styles.insightTable}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={styles.ith}>Rank</th>
                        <th style={styles.ith}>Product</th>
                        <th style={styles.ith}>Units Sold</th>
                        <th style={styles.ith}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top_products.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={styles.itd}>
                            <span style={styles.rank}>
                              {i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : `#${i+1}`}
                            </span>
                          </td>
                          <td style={{ ...styles.itd, fontWeight: '600' }}>{p.item_name}</td>
                          <td style={styles.itd}>{Number(p.total_sold).toLocaleString()} units</td>
                          <td style={{ ...styles.itd, fontWeight: '600', color: '#c4607a' }}>
                            ₱{Number(p.total_revenue).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Recent Orders */}
              <div style={styles.insightCard}>
                <div style={styles.insightHeader}>
                  <span style={styles.insightIcon}><FaClock/></span>
                  <h4 style={styles.insightTitle}>Recent Orders</h4>
                </div>
                {stats.recent_orders.length === 0 ? (
                  <div style={styles.allGood}>No orders yet.</div>
                ) : (
                  <div style={styles.recentList}>
                    {stats.recent_orders.map((o, i) => (
                      <div key={i} style={styles.recentItem}>
                        <div>
                          <p style={styles.recentCode}>{o.order_code}</p>
                          <p style={styles.recentName}>{o.customer_name}</p>
                        </div>
                        <div style={styles.recentRight}>
                          <p style={styles.recentAmount}>₱{Number(o.total_amount).toLocaleString()}</p>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: o.status === 'forwarded' ? '#eafaf1' : o.status === 'confirmed' ? '#eaf4fb' : o.status === 'cancelled' ? '#fdf0f3' : '#fef9e7',
                            color: o.status === 'forwarded' ? '#27ae60' : o.status === 'confirmed' ? '#2980b9' : o.status === 'cancelled' ? '#c4607a' : '#f39c12',
                          }}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => navigate('/sales')} style={styles.viewAllBtn}>
                      View All Orders →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Charts Section */}
            <p style={styles.sectionTitle}>Analytics & Charts</p>
            <div style={styles.chartsGrid}>

              {/* Sales Trend - Line Chart */}
              <div style={styles.chartCard}>
                <h4 style={styles.chartTitle}>Sales Trend (Last 7 Days)</h4>
                {stats.sales_trend.length === 0 ? (
                  <div style={styles.noData}>No sales data in the last 7 days.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats.sales_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v, n) => [n === 'revenue' ? `₱${Number(v).toLocaleString()}` : v, n === 'revenue' ? 'Revenue' : 'Orders']} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#c4607a" strokeWidth={2} dot={{ fill: '#c4607a', r: 4 }} name="Revenue" />
                      <Line type="monotone" dataKey="orders" stroke="#2980b9" strokeWidth={2} dot={{ fill: '#2980b9', r: 4 }} name="Orders" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Monthly Revenue - Bar Chart */}
              <div style={styles.chartCard}>
                <h4 style={styles.chartTitle}>Monthly Revenue (Last 6 Months)</h4>
                {stats.monthly_revenue.length === 0 ? (
                  <div style={styles.noData}>No monthly data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.monthly_revenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#c4607a" radius={[4,4,0,0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Orders by Status - Pie Chart */}
              <div style={styles.chartCard}>
                <h4 style={styles.chartTitle}>Orders by Status</h4>
                {stats.orders_by_status.length === 0 ? (
                  <div style={styles.noData}>No order data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={stats.orders_by_status}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ status, count }) => `${status}: ${count}`}
                        labelLine={false}
                      >
                        {stats.orders_by_status.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Feedback by Type - Pie Chart */}
              <div style={styles.chartCard}>
                <h4 style={styles.chartTitle}>Feedback by Type</h4>
                {stats.feedback_by_type.length === 0 ? (
                  <div style={styles.noData}>No feedback data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={stats.feedback_by_type}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ type, count }) => `${type}: ${count}`}
                        labelLine={false}
                      >
                        {stats.feedback_by_type.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Modules Grid */}
            <p style={styles.sectionTitle}>Modules</p>
            <div style={styles.modulesGrid}>
              {[
                { name: 'Marketing',       desc: 'Campaigns & performance',  path: '/marketing',  },
                { name: 'Sales',           desc: 'Orders & customers',       path: '/sales',      },
                { name: 'Logistics',       desc: 'Shipping & delivery',      path: '/logistics',  },
                { name: 'CRM',             desc: 'Feedback & analysis',      path: '/crm',        },
                { name: 'Inventory',       desc: 'Stock & supplies',         path: '/inventory',  },
                { name: 'Human Resources', desc: 'Employees & payroll',      path: '/hr',         },
              ].map((mod) => (
                <div
                  key={mod.name}
                  onClick={() => navigate(mod.path)}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.12)`;
                    e.currentTarget.style.borderTop = `4px solid ${mod.color}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                    e.currentTarget.style.borderTop = '4px solid transparent';
                  }}
                  style={styles.moduleCard}
                >
                  <div style={{ ...styles.moduleIconBox, backgroundColor: `${mod.color}18` }}>
                    <span style={styles.moduleIcon}>{mod.icon}</span>
                  </div>
                  <p style={{ ...styles.moduleName, color: mod.color }}>{mod.name}</p>
                  <p style={styles.moduleDesc}>{mod.desc}</p>
                  <span style={{ ...styles.moduleArrow, color: mod.color }}>→</span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f5f0fa' },
  sidebar: { width: '260px', background: 'linear-gradient(180deg, #F7EEF2, #F4E8ED, #EAD5DC)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', overflowY: 'auto', boxShadow: '4px 0 15px rgba(0,0,0,0.1)', zIndex: 100 },
  logoSection: { display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.2)' },
  logoImg: { width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' },
  logoText: { color: '#302e2e', margin: 0, fontSize: '20px', fontWeight: '700' },
  logoSub: { color: 'rgba(48,46,46,0.7)', margin: '2px 0 0', fontSize: '10px', letterSpacing: '0.5px' },
  nav: { flex: 1, padding: '16px 0' },
  navSection: { color: 'rgba(48,46,46,0.5)', fontSize: '10px', letterSpacing: '1.5px', padding: '0 20px', marginBottom: '8px', fontWeight: '600' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', color: '#302e2e', cursor: 'pointer', fontSize: '14px', borderRadius: '0 8px 8px 0', marginRight: '12px', position: 'relative' },
  navIcon: { fontSize: '18px', minWidth: '24px', textAlign: 'center' },
  activeDot: { position: 'absolute', right: '12px', fontSize: '8px', color: '#302e2e' },
  logout: { margin: '16px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#302e2e', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' },
  main: { marginLeft: '260px', flex: 1, padding: '28px' },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', backgroundColor: '#fff', padding: '20px 24px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#302e2e', margin: '0 0 4px' },
  pageSubtitle: { fontSize: '14px', color: '#888', margin: 0 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  userAvatar: { width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#c4607a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700' },
  userName: { fontSize: '14px', fontWeight: '600', color: '#302e2e', margin: '0 0 2px' },
  userRole: { backgroundColor: '#fdf0f3', color: '#c4607a', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  loading: { padding: '60px', textAlign: 'center', color: '#aaa', fontSize: '16px' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.2s' },
  cardIconBox: { width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardIcon: { fontSize: '24px' },
  cardLabel: { margin: 0, fontSize: '12px', color: '#888', fontWeight: '500' },
  cardValue: { margin: '4px 0 0', fontSize: '28px', fontWeight: '700' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#302e2e', margin: '0 0 16px' },

  // Insights
  insightsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' },
  insightCard: { backgroundColor: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  insightHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' },
  insightIcon: { fontSize: '22px' },
  insightTitle: { fontSize: '15px', fontWeight: '600', color: '#302e2e', margin: 0 },

  // Satisfaction
  satisfactionBox: { textAlign: 'center' },
  satisfactionRate: { fontSize: '40px', fontWeight: '700', margin: '0 0 4px' },
  satisfactionLabel: { fontSize: '15px', fontWeight: '600', margin: '0 0 8px' },
  satisfactionSub: { fontSize: '12px', color: '#aaa', margin: '0 0 12px' },
  ratingBar: { backgroundColor: '#f0f0f0', borderRadius: '10px', height: '10px', overflow: 'hidden' },
  ratingFill: { height: '10px', borderRadius: '10px', transition: 'width 0.5s ease' },

  // Low Stock
  allGood: { backgroundColor: '#eafaf1', color: '#27ae60', padding: '16px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: '500' },
  alertList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  alertItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  alertName: { fontSize: '13px', fontWeight: '600', color: '#302e2e', margin: 0 },
  alertCode: { fontSize: '11px', color: '#aaa', margin: '2px 0 0' },
  alertRight: {},
  stockBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },

  // Pending
  pendingBox: { textAlign: 'center' },
  pendingCount: { fontSize: '48px', fontWeight: '700', color: '#c4607a', margin: '0 0 4px' },
  pendingLabel: { fontSize: '14px', color: '#888', margin: '0 0 12px' },
  pendingBreakdown: {},
  pendingNote: { fontSize: '13px', color: '#f39c12', backgroundColor: '#fef9e7', padding: '10px 14px', borderRadius: '8px', margin: '0 0 12px' },

  viewAllBtn: { width: '100%', padding: '8px', backgroundColor: '#fdf0f3', color: '#c4607a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginTop: '8px' },

  // Top Products Table
  insightTable: { width: '100%', borderCollapse: 'collapse' },
  ith: { padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  itd: { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f5f5f5' },
  rank: { fontSize: '16px' },

  // Recent Orders
  recentList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  recentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  recentCode: { fontSize: '13px', fontWeight: '600', color: '#302e2e', margin: 0 },
  recentName: { fontSize: '11px', color: '#aaa', margin: '2px 0 0' },
  recentRight: { textAlign: 'right' },
  recentAmount: { fontSize: '13px', fontWeight: '700', color: '#302e2e', margin: '0 0 4px' },
  statusBadge: { padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },

  // Charts
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '28px' },
  chartCard: { backgroundColor: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  chartTitle: { fontSize: '15px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  noData: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },

  // Modules
  modulesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' },
  moduleCard: { backgroundColor: '#fff', borderRadius: '14px', padding: '24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.25s ease', borderTop: '4px solid transparent', position: 'relative' },
  moduleIconBox: { width: '60px', height: '60px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' },
  moduleIcon: { fontSize: '28px' },
  moduleName: { fontWeight: '700', fontSize: '16px', margin: '0 0 6px' },
  moduleDesc: { fontSize: '13px', color: '#888', margin: '0 0 12px' },
  moduleArrow: { fontSize: '18px', fontWeight: '700' },
};

export default Dashboard;
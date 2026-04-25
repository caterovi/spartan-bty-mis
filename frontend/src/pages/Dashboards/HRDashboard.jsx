import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axiosConfig';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FaUsers, FaCalendarCheck, FaCalendarTimes, FaMoneyCheckAlt, FaPlus, FaClipboardList, FaChartPie } from "react-icons/fa";

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

function HRDashboard() {
  const navigate = useNavigate();
  const [employees, setEmployees]     = useState([]);
  const [attendance, setAttendance]   = useState([]);
  const [payroll, setPayroll]         = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, attRes, payRes] = await Promise.all([
        api.get('/hr/employees'),
        api.get('/hr/attendance'),
        api.get('/hr/payroll'),
      ]);
      setEmployees(empRes.data || []);
      setAttendance(attRes.data || []);
      setPayroll(payRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div style={styles.loading}>Loading HR dashboard...</div>;

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const absentToday  = todayAttendance.filter(a => a.status === 'absent').length;

  // Employment type distribution
  const empTypeMap = {};
  employees.forEach(e => {
    empTypeMap[e.employment_type || 'Unknown'] = (empTypeMap[e.employment_type || 'Unknown'] || 0) + 1;
  });
  const empTypeData = Object.entries(empTypeMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  const TYPE_COLORS = ['#c4607a','#2980b9','#27ae60','#f39c12'];

  // Attendance trend (last 7 days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const attendanceTrend = last7Days.map(date => {
    const dayAtt = attendance.filter(a => a.date === date);
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      present: dayAtt.filter(a => a.status === 'present').length,
      absent: dayAtt.filter(a => a.status === 'absent').length,
      late: dayAtt.filter(a => a.status === 'late').length,
    };
  });

  // Payroll this month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthPayroll = payroll.filter(p => p.pay_period?.startsWith(thisMonth));
  const totalPayroll = thisMonthPayroll.reduce((s, p) => s + Number(p.net_pay || 0), 0);

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
          { label: 'Total Employees',   value: employees.length,                     icon: <FaUsers />,         color: '#c4607a', bg: '#fdf0f3' },
          { label: 'Present Today',     value: presentToday,                           icon: <FaCalendarCheck />, color: '#c4607a', bg: '#fdf0f3' },
          { label: 'Absent Today',      value: absentToday,                            icon: <FaCalendarTimes />, color: '#c4607a', bg: '#fdf0f3' },
          { label: 'Payroll This Month', value: `₱${totalPayroll.toLocaleString()}`,  icon: <FaMoneyCheckAlt />, color: '#c4607a', bg: '#fdf0f3' },
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
        Workforce Analytics
      </motion.p>
      <motion.div variants={stagger} style={styles.chartsGrid}>
        <motion.div
          variants={fadeUp}
          whileHover={{ y: -5, scale: 1.005 }}
          style={styles.chartCard}
        >
          <h4 style={styles.chartTitle}>Attendance Trend (Last 7 Days)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#27ae60" radius={[4,4,0,0]} name="Present" />
              <Bar dataKey="absent" fill="#c4607a" radius={[4,4,0,0]} name="Absent" />
              <Bar dataKey="late" fill="#f39c12" radius={[4,4,0,0]} name="Late" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          variants={fadeUp}
          whileHover={{ y: -5, scale: 1.005 }}
          style={styles.chartCard}
        >
          <h4 style={styles.chartTitle}>Employment Type Distribution</h4>
          {empTypeData.length === 0 ? (
            <div style={styles.noData}>No employee data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={empTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {empTypeData.map((_, i) => (
                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </motion.div>

      {/* Monitoring & Actions */}
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
            <FaClipboardList color="#2980b9" />
            <h4 style={styles.insightTitle}>Recent Attendance</h4>
          </div>
          {attendance.length === 0 ? (
            <div style={styles.allGood}>No attendance records yet.</div>
          ) : (
            <div style={styles.recentList}>
              {attendance.slice(0, 5).map((a, i) => (
                <motion.div
                  key={i}
                  style={styles.recentItem}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  whileHover={{ x: 5, backgroundColor: '#fff4f7' }}
                >
                  <div>
                    <p style={styles.recentCode}>{a.full_name || a.employee_id}</p>
                    <p style={styles.recentName}>{a.date}</p>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: a.status === 'present' ? '#eafaf1' : a.status === 'late' ? '#fef9e7' : '#fdf0f3',
                    color: a.status === 'present' ? '#27ae60' : a.status === 'late' ? '#f39c12' : '#c4607a',
                  }}>{a.status}</span>
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
            <FaMoneyCheckAlt color="#27ae60" />
            <h4 style={styles.insightTitle}>Payroll Status</h4>
          </div>
          <div style={styles.pendingBox}>
            <p style={styles.pendingCount}>{thisMonthPayroll.length}</p>
            <p style={styles.pendingLabel}>payroll record{thisMonthPayroll.length !== 1 ? 's' : ''} this month</p>
            <p style={{ ...styles.pendingNote, color: '#27ae60' }}>
              Total payout: ₱{totalPayroll.toLocaleString()}
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          whileHover={{ y: -4 }}
          style={styles.insightCard}
        >
          <div style={styles.insightHeader}>
            <FaPlus color="#c4607a" />
            <h4 style={styles.insightTitle}>Quick Actions</h4>
          </div>
          <div style={styles.actionStack}>
            <motion.button
              onClick={() => navigate('/hr')}
              style={styles.actionBtn}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaPlus /> Add Employee
            </motion.button>
            <motion.button
              onClick={() => navigate('/hr')}
              style={styles.actionBtnSecondary}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaClipboardList /> Record Attendance
            </motion.button>
            <motion.button
              onClick={() => navigate('/hr')}
              style={styles.actionBtnSecondary}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaMoneyCheckAlt /> View Payroll
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

  pendingBox: { textAlign: 'center' },
  pendingCount: { fontSize: '48px', fontWeight: '800', color: '#27ae60', margin: '0 0 4px' },
  pendingLabel: { fontSize: '14px', color: '#888', margin: '0 0 12px' },
  pendingNote: { fontSize: '13px', color: '#27ae60', backgroundColor: '#eafaf1', padding: '10px 14px', borderRadius: '8px', margin: 0 },

  actionStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  actionBtn: { width: '100%', padding: '10px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  actionBtnSecondary: { width: '100%', padding: '10px', backgroundColor: '#fdf0f3', color: '#c4607a', border: '1px solid #f0d0d8', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
};

export default HRDashboard;

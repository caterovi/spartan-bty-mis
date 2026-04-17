import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaCartPlus, FaMoneyBill, FaClock, FaTruck, FaWindowClose } from "react-icons/fa";


function SalesSummary() {
  const [summary, setSummary] = useState(null);

  useEffect(() => { fetchSummary(); }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/sales/summary');
      setSummary(res.data);
    } catch (err) { console.error(err); }
  };

  if (!summary) return <div style={styles.loading}>Loading summary...</div>;

  const statusData = [
    { label: 'Pending',   value: summary.pending,   color: '#f39c12' },
    { label: 'Confirmed', value: summary.confirmed,  color: '#2980b9' },
    { label: 'Forwarded', value: summary.forwarded,  color: '#27ae60' },
    { label: 'Cancelled', value: summary.cancelled,  color: '#c4607a' },
  ];

  const maxVal = Math.max(...statusData.map(s => s.value), 1);

  return (
    <div>
      <h3 style={styles.sectionTitle}>Sales Summary</h3>

      {/* Summary Cards */}
      <div style={styles.cards}>
        {[
          { label: 'Total Orders',   value: summary.total_orders,                              icon: <FaCartPlus />, color: '#c4607a' },
          { label: 'Total Revenue',  value: `₱${Number(summary.total_revenue).toLocaleString()}`, icon: <FaMoneyBill />, color: '#c4607a' },
          { label: 'Pending',        value: summary.pending,                                   icon: <FaClock />, color: '#c4607a' },
          { label: 'Forwarded',      value: summary.forwarded,                                 icon: <FaTruck />, color: '#c4607a' },
          { label: 'Cancelled',      value: summary.cancelled,                                 icon: <FaWindowClose />, color: '#c4607a' },
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

      {/* Order Status Chart */}
      <div style={styles.chartBox}>
        <h4 style={styles.chartTitle}>Orders by Status</h4>
        {statusData.map((s) => (
          <div key={s.label} style={styles.barRow}>
            <span style={styles.barLabel}>{s.label}</span>
            <div style={styles.barTrack}>
              <div style={{ ...styles.barFill, width: `${(s.value / maxVal) * 100}%`, backgroundColor: s.color }} />
            </div>
            <span style={styles.barCount}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#b5536b', margin: '0 0 20px' },
  loading: { padding: '40px', textAlign: 'center', color: '#aaa' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' },
  card: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' },
  cardIcon: { fontSize: '24px' },
  cardLabel: { fontSize: '11px', color: '#888', margin: 0 },
  cardValue: { fontSize: '22px', fontWeight: '700', color: '#b5536b', margin: '2px 0 0' },
  chartBox: { border: '1px solid #eee', borderRadius: '10px', padding: '20px' },
  chartTitle: { fontSize: '15px', fontWeight: '600', color: '#b5536b', margin: '0 0 16px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  barLabel: { fontSize: '13px', color: '#555', width: '80px' },
  barTrack: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: '4px', height: '12px' },
  barFill: { height: '12px', borderRadius: '4px', transition: 'width 0.3s' },
  barCount: { fontSize: '13px', fontWeight: '600', color: '#333', width: '24px' },
};

export default SalesSummary;
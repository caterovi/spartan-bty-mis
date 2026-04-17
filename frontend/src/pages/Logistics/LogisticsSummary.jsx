import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaBox, FaTruck, FaClock, FaWindowClose, FaCheck } from "react-icons/fa";

function LogisticsSummary() {
  const [summary, setSummary] = useState(null);

  useEffect(() => { fetchSummary(); }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/logistics/summary');
      setSummary(res.data);
    } catch (err) { console.error(err); }
  };

  if (!summary) return <div style={styles.loading}>Loading summary...</div>;

  const shippingData = [
    { label: 'Pending',    value: summary.pending,    color: '#888' },
    { label: 'Shipped',    value: summary.shipped || 0, color: '#2980b9' },
    { label: 'In-Transit', value: summary.in_transit,  color: '#f39c12' },
    { label: 'Delivered',  value: summary.delivered,   color: '#27ae60' },
    { label: 'Failed',     value: summary.failed,      color: '#c4607a' },
  ];

  const maxVal = Math.max(...shippingData.map(s => s.value), 1);

  return (
    <div>
      <h3 style={styles.sectionTitle}>Logistics Summary</h3>

      {/* Summary Cards */}
      <div style={styles.cards}>
        {[
          { label: 'Total Shipments', value: summary.total,      icon: <FaBox/>, color: '#c4607a' },
          { label: 'Delivered',       value: summary.delivered,  icon: <FaCheck />, color: '#c4607a' },
          { label: 'In Transit',      value: summary.in_transit, icon: <FaTruck />, color: '#c4607a' },
          { label: 'Pending',         value: summary.pending,    icon: <FaClock />, color: '#c4607a' },
          { label: 'Failed',          value: summary.failed,     icon: <FaWindowClose />, color: '#c4607a' },
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
        {/* Shipping Status Chart */}
        <div style={styles.chartBox}>
          <h4 style={styles.chartTitle}>Shipments by Status</h4>
          {shippingData.map((s) => (
            <div key={s.label} style={styles.barRow}>
              <span style={styles.barLabel}>{s.label}</span>
              <div style={styles.barTrack}>
                <div style={{ ...styles.barFill, width: `${(s.value / maxVal) * 100}%`, backgroundColor: s.color }} />
              </div>
              <span style={styles.barCount}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Packing Status */}
        <div style={styles.chartBox}>
          <h4 style={styles.chartTitle}>Packing Status</h4>
          {[
            { label: 'Packed',   value: summary.packed,   color: '#27ae60' },
            { label: 'Unpacked', value: summary.unpacked, color: '#c4607a' },
          ].map((s) => {
            const maxP = Math.max(summary.packed, summary.unpacked, 1);
            return (
              <div key={s.label} style={styles.barRow}>
                <span style={styles.barLabel}>{s.label}</span>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, width: `${(s.value / maxP) * 100}%`, backgroundColor: s.color }} />
                </div>
                <span style={styles.barCount}>{s.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#302e2e', margin: '0 0 20px' },
  loading: { padding: '40px', textAlign: 'center', color: '#aaa' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' },
  card: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' },
  cardIcon: { fontSize: '24px' },
  cardLabel: { fontSize: '11px', color: '#888', margin: 0 },
  cardValue: { fontSize: '22px', fontWeight: '700', color: '#b5536b', margin: '2px 0 0' },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  chartBox: { border: '1px solid #eee', borderRadius: '10px', padding: '20px' },
  chartTitle: { fontSize: '15px', fontWeight: '600', color: '#b5536b', margin: '0 0 16px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  barLabel: { fontSize: '13px', color: '#555', width: '80px' },
  barTrack: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: '4px', height: '12px' },
  barFill: { height: '12px', borderRadius: '4px', transition: 'width 0.3s' },
  barCount: { fontSize: '13px', fontWeight: '600', color: '#333', width: '24px' },
};

export default LogisticsSummary;
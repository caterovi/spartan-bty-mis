import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaBoxOpen, FaChartLine, FaWindowClose, FaMoneyBill, FaExclamation } from "react-icons/fa";

function InventorySummary() {
  const [summary, setSummary] = useState(null);
  const [items, setItems]     = useState([]);

  useEffect(() => { fetchSummary(); fetchItems(); }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/inventory/summary');
      setSummary(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchItems = async () => {
    try {
      const res = await api.get('/inventory/items');
      setItems(res.data);
    } catch (err) { console.error(err); }
  };

  if (!summary) return <div style={styles.loading}>Loading summary...</div>;

  const lowAndOut = items.filter(i => i.status === 'low-stock' || i.status === 'out-of-stock');

  return (
    <div>
      <h3 style={styles.sectionTitle}>Inventory Summary</h3>

      {/* Summary Cards */}
      <div style={styles.cards} className="mobile-summary-grid">
        {[
          { label: 'Total Items',    value: summary.total_items,                       icon: <FaBoxOpen />, color: '#c4607a' },
          { label: 'In Stock',       value: summary.in_stock,                          icon: <FaChartLine />, color: '#c4607a' },
          { label: 'Low Stock',      value: summary.low_stock,                         icon: <FaExclamation />, color: '#c4607a' },
          { label: 'Out of Stock',   value: summary.out_of_stock,                      icon: <FaWindowClose/>, color: '#c4607a' },
          { label: 'Total Value',    value: `₱${Number(summary.total_value).toLocaleString()}`, icon: <FaMoneyBill/>, color: '#c4607a' },
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

      {/* Alerts */}
      {lowAndOut.length > 0 && (
        <div style={styles.alertBox}>
          <h4 style={styles.alertTitle}> <FaExclamation/> Items Needing Attention ({lowAndOut.length})</h4>
          <div className="resp-table-wrap mobile-table-container">
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Current Qty</th>
                <th style={styles.th}>Reorder Level</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {lowAndOut.map((item) => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.td}>{item.name}</td>
                  <td style={styles.td}>{item.item_code}</td>
                  <td style={{ ...styles.td, fontWeight: '700', color: item.status === 'out-of-stock' ? '#c4607a' : '#f39c12' }}>
                    {item.quantity}
                  </td>
                  <td style={styles.td}>{item.reorder_level}</td>
                  <td style={styles.td}>
                    <span style={item.status === 'out-of-stock' ? styles.badgeOut : styles.badgeLow}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {lowAndOut.length === 0 && (
        <div style={styles.allGood}>
           All items are sufficiently stocked!
        </div>
      )}
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
  alertBox: { border: '1px solid #fdf0f3', borderRadius: '10px', padding: '20px', backgroundColor: '#fffaf9' },
  alertTitle: { fontSize: '15px', fontWeight: '600', color: '#c4607a', margin: '0 0 16px' },
  allGood: { backgroundColor: '#eafaf1', color: '#27ae60', padding: '20px', borderRadius: '10px', textAlign: 'center', fontSize: '15px', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  badgeLow: { backgroundColor: '#fef9e7', color: '#f39c12', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  badgeOut: { backgroundColor: '#fdf0f3', color: '#c4607a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
};

export default InventorySummary;
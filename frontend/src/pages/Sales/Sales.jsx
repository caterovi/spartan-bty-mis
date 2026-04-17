import { useState } from 'react';
import Layout from '../../components/Layout';
import Orders from './Orders';
import SalesSummary from './SalesSummary';
import { FaRegChartBar, FaShoppingBag } from "react-icons/fa";

function Sales() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <Layout>
      <div className="mod-wrapper">
        <div className="mod-header resp-tabs-parent">
          <div style={styles.topbar}>
            <div>
              <h1 style={styles.pageTitle}>Sales</h1>
              <p style={styles.pageSubtitle}>
                Manage customer orders and forward to logistics
              </p>
            </div>
          </div>

          <div style={styles.tabs} className="resp-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={activeTab === tab.key ? styles.tabActive : styles.tab}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mod-scroll">
          <div style={styles.content} className="mod-content">
            {activeTab === 'orders' && <Orders />}
            {activeTab === 'summary' && <SalesSummary />}
          </div>
        </div>
      </div>
    </Layout>
  );
}

const tabs = [
  { key: 'orders',  icon: <FaShoppingBag />, label: 'Orders' },
  { key: 'summary', icon: <FaRegChartBar />, label: 'Summary' },
];

const styles = {
  topbar: { backgroundColor: '#fff', padding: '20px 24px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#302e2e', margin: '0 0 4px' },
  pageSubtitle: { fontSize: '14px', color: '#888', margin: 0 },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px' },
  tab: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', color: '#555' },
  tabActive: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #c4607a', backgroundColor: '#c4607a', cursor: 'pointer', fontSize: '14px', color: '#fff', fontWeight: '600' },
  content: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
};

export default Sales;
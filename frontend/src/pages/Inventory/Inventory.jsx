import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Items from './Items';
import StockMovement from './StockMovement';
import InventorySummary from './InventorySummary';
import { FaAirFreshener, FaArrowsAltH, FaChartLine } from "react-icons/fa";

function Inventory() {
  const [activeTab, setActiveTab] = useState('items');

  // Scroll animation observer
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('mod-visible');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.mod-animate');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
  <Layout>
    <style>{`
      @keyframes mod-fadeUp { from{ opacity:0; transform:translateY(30px); } to{ opacity:1; transform:translateY(0); } }
      .mod-animate { opacity: 0; transform: translateY(30px); transition: opacity 0.3s ease-out, transform 0.3s ease-out; }
      .mod-animate.mod-visible { opacity: 1; transform: translateY(0); }
      .mod-stagger-1 { transition-delay: 0.05s; }
      .mod-stagger-2 { transition-delay: 0.1s; }
      .mod-stagger-3 { transition-delay: 0.15s; }
      .mod-stagger-4 { transition-delay: 0.2s; }
    `}</style>
    <div className="mod-wrapper">
      <div className="mod-header resp-tabs-parent">
        <div style={styles.topbar} className="mod-animate">
          <div>
            <h1 style={styles.pageTitle}>Inventory</h1>
            <p style={styles.pageSubtitle}>
              Manage stock levels and monitor inventory
            </p>
          </div>
        </div>

        <div style={styles.tabs} className="resp-tabs mod-animate mod-stagger-1">
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={activeTab === tab.key ? styles.tabActive : styles.tab}
              className={`mod-animate mod-stagger-${index + 2}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mod-scroll">
        <div style={styles.content} className="mod-content mod-animate mod-stagger-4">
          {activeTab === 'items' && <Items />}
          {activeTab === 'stock' && <StockMovement />}
          {activeTab === 'summary' && <InventorySummary />}
        </div>
      </div>
    </div>
  </Layout>
);
}

const tabs = [
  { key: 'items',   icon: <FaAirFreshener />, label: 'Items' },
  { key: 'stock',   icon: <FaArrowsAltH />, label: 'Stock Movement' },
  { key: 'summary', icon: <FaChartLine />, label: 'Summary' },
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

export default Inventory;
import { useState } from 'react';
import Layout from '../../components/Layout';
import Campaigns from './Campaigns';
import Performance from './Performance';
import Promotions from './Promotions';
import LiveSelling from './LiveSelling';
import ContentCreation from './ContentCreation';
import Suggestions from './Suggestions';
import { FaFlag, FaChartLine, FaTags, FaBroadcastTower, FaPenFancy, FaLightbulb } from "react-icons/fa";

function Marketing() {
  const [activeTab, setActiveTab] = useState('campaigns');

  const tabs = [
    { key: 'campaigns',  icon: <FaFlag />,      label: 'Campaigns' },
    { key: 'performance',icon: <FaChartLine />,     label: 'Performance' },
    { key: 'promotions', icon: <FaTags />,          label: 'Promotions' },
    { key: 'live',       icon: <FaBroadcastTower />,label: 'Live Selling' },
    { key: 'content',    icon: <FaPenFancy />,      label: 'Content Creation' },
    { key: 'suggestions',icon: <FaLightbulb />,     label: 'CRM Suggestions' },
  ];

  return (
    <Layout>
    <div className="mod-wrapper">
      <div className="mod-header resp-tabs-parent">
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.pageTitle}>Marketing</h1>
            <p style={styles.pageSubtitle}>
              Campaigns, promotions, live selling and content creation
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
          {activeTab === 'campaigns' && <Campaigns />}
          {activeTab === 'performance' && <Performance />}
          {activeTab === 'promotions' && <Promotions />}
          {activeTab === 'live' && <LiveSelling />}
          {activeTab === 'content' && <ContentCreation />}
          {activeTab === 'suggestions' && <Suggestions />}
        </div>
      </div>
    </div>
  </Layout>
);
}

const styles = {
  topbar: { backgroundColor: '#fff', padding: '20px 24px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#302e2e', margin: '0 0 4px' },
  pageSubtitle: { fontSize: '14px', color: '#888', margin: 0 },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  tab: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', color: '#555' },
  tabActive: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #c4607a', backgroundColor: '#c4607a', cursor: 'pointer', fontSize: '13px', color: '#fff', fontWeight: '600' },
  content: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
};

export default Marketing;
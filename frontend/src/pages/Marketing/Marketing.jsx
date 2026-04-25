import { useState, useEffect } from 'react';
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
    <style>{`
      @keyframes mod-fadeUp { from{ opacity:0; transform:translateY(30px); } to{ opacity:1; transform:translateY(0); } }
      .mod-animate { opacity: 0; transform: translateY(30px); transition: opacity 0.3s ease-out, transform 0.3s ease-out; }
      .mod-animate.mod-visible { opacity: 1; transform: translateY(0); }
      .mod-stagger-1 { transition-delay: 0.05s; }
      .mod-stagger-2 { transition-delay: 0.1s; }
      .mod-stagger-3 { transition-delay: 0.15s; }
      .mod-stagger-4 { transition-delay: 0.2s; }
      .mod-stagger-5 { transition-delay: 0.25s; }
      .mod-stagger-6 { transition-delay: 0.3s; }
    `}</style>
    <div className="mod-wrapper">
      <div className="mod-header resp-tabs-parent">
        <div style={styles.topbar} className="mod-animate">
          <div>
            <h1 style={styles.pageTitle}>Marketing</h1>
            <p style={styles.pageSubtitle}>
              Campaigns, promotions, live selling and content creation
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
        <div style={styles.content} className="mod-content mod-animate mod-stagger-3">
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
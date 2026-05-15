import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axiosConfig';
import {
  FaTruck, FaCheck, FaClock, FaBoxOpen, FaUndoAlt,
  FaExclamationTriangle, FaFileAlt, FaBox, FaChartBar, FaStar,
} from 'react-icons/fa';

function LogisticsSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSummary(); }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try { const r = await api.get('/logistics/summary'); setSummary(r.data); }
    catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <Layout>
      <div style={{minHeight:240,display:'grid',placeItems:'center',color:'#b5536b',fontSize:14,fontWeight:700}}>
        Loading summary...
      </div>
    </Layout>
  );
  if (!summary) return (
    <Layout>
      <div style={{padding:40,textAlign:'center',color:'#b5536b'}}>Failed to load summary.</div>
    </Layout>
  );

  const n = (v) => Number(v||0);

  const cards = [
    { label:'Total Shipments',   value:n(summary.total),           icon:<FaTruck />,            helper:'All shipment records' },
    { label:'Delivered',         value:n(summary.delivered),       icon:<FaCheck />,             helper:'Completed deliveries',  color:'#2f7d56' },
    { label:'In Transit',        value:n(summary.in_transit),      icon:<FaTruck />,             helper:'Currently shipping',    color:'#4f46e5' },
    { label:'Pending',           value:n(summary.pending),         icon:<FaClock />,             helper:'Awaiting shipment',     color:'#9a5f0f' },
    { label:'Returned',          value:n(summary.returned),        icon:<FaUndoAlt />,           helper:'Returned shipments',    color:n(summary.returned)>0?'#b5536b':undefined },
    { label:'Delayed',           value:n(summary.delayed),         icon:<FaExclamationTriangle />,helper:'Past estimated delivery',color:n(summary.delayed)>0?'#dc2626':undefined },
    { label:'Missing Receipts',  value:n(summary.missing_receipts),icon:<FaFileAlt />,           helper:'Delivered, no proof',   color:n(summary.missing_receipts)>0?'#b5536b':undefined },
    { label:'Unpacked',          value:n(summary.unpacked),        icon:<FaBox />,               helper:'Not yet packed',        color:n(summary.unpacked)>0?'#9a5f0f':undefined },
    { label:'On-Time Deliveries',value:n(summary.on_time),         icon:<FaStar />,              helper:'Delivered by estimate', color:'#2f7d56' },
    { label:'Avg Delivery Days', value:summary.average_delivery_days ? `${summary.average_delivery_days}d` : '—', icon:<FaChartBar />, helper:'Ship to delivery' },
  ];

  const statusData = [
    { label:'Pending',    value:n(summary.pending),   color:'#d98a1f', tint:'#fff7e8' },
    { label:'Shipped',    value:n(summary.shipped),   color:'#4a90d9', tint:'#e8f4ff' },
    { label:'In Transit', value:n(summary.in_transit),color:'#4f46e5', tint:'#f0f0ff' },
    { label:'Delivered',  value:n(summary.delivered), color:'#2f9d6a', tint:'#ecfdf3' },
    { label:'Returned',   value:n(summary.returned),  color:'#c4607a', tint:'#fff1f5' },
  ];
  const maxVal = Math.max(...statusData.map(s=>s.value), 1);

  return (
    <Layout>
      <style>{`
        .ls-page { width:100%; animation:lsFadeUp 0.35s ease both; }
        .ls-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .ls-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .ls-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .ls-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .ls-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }
        .ls-cards { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; margin-bottom:20px; }
        .ls-card { background:#fff; border:1px solid #e2c6cf; border-radius:14px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); position:relative; overflow:hidden; transition:all 180ms ease; }
        .ls-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .ls-card:hover { transform:translateY(-2px); border-color:#c4607a; box-shadow:0 4px 16px rgba(0,0,0,.07); }
        .ls-card-top { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
        .ls-card-label { margin:0; color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .ls-card-icon { width:36px; height:36px; border-radius:11px; display:grid; place-items:center; color:#b5536b; background:#fff1f5; border:1px solid #e8b9c6; font-size:15px; flex:0 0 auto; }
        .ls-card-value { margin:0; color:#1f2937; font-size:22px; font-weight:850; letter-spacing:-.04em; }
        .ls-card-helper { margin:5px 0 0; color:#94a3b8; font-size:11px; }
        .ls-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .ls-panel-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .ls-panel-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .ls-panel-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .ls-panel-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .ls-bar-row { display:grid; grid-template-columns:110px 1fr 52px; align-items:center; gap:12px; margin-bottom:14px; }
        .ls-bar-label { display:flex; align-items:center; gap:8px; color:#374151; font-size:13px; font-weight:700; }
        .ls-dot { width:9px; height:9px; border-radius:9999px; flex-shrink:0; }
        .ls-bar-track { height:14px; border-radius:9999px; background:#f3e8ec; overflow:hidden; border:1px solid #ead1d9; }
        .ls-bar-fill { height:100%; border-radius:9999px; transition:width 320ms ease; min-width:8px; }
        .ls-bar-count { justify-self:end; min-width:40px; padding:4px 8px; border-radius:9999px; font-size:12px; font-weight:800; text-align:center; border:1px solid; }
        @keyframes lsFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width:1180px) { .ls-cards { grid-template-columns:repeat(3,minmax(0,1fr)); } }
        @media (max-width:768px) {
          .ls-hero { align-items:flex-start; padding:20px; }
          .ls-title { font-size:24px; }
          .ls-hero-icon { width:48px; height:48px; font-size:20px; }
          .ls-cards { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .ls-bar-row { grid-template-columns:1fr; gap:6px; }
          .ls-bar-count { justify-self:start; }
        }
        @media (max-width:520px) { .ls-hero { flex-direction:column-reverse; } .ls-cards { grid-template-columns:1fr; } }
      `}</style>

      <div className="ls-page">
        {/* HERO */}
        <div className="ls-hero">
          <div>
            <p className="ls-eyebrow">Logistics Overview</p>
            <h3 className="ls-title">Logistics Summary</h3>
            <p className="ls-subtitle">Monitor shipment statuses, delivery performance, and operational logistics metrics.</p>
          </div>
          <div className="ls-hero-icon"><FaChartBar /></div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="ls-cards">
          {cards.map(c=>(
            <div key={c.label} className="ls-card">
              <div className="ls-card-top">
                <p className="ls-card-label">{c.label}</p>
                <span className="ls-card-icon">{c.icon}</span>
              </div>
              <p className="ls-card-value" style={c.color && Number(c.value)>0 ? {color:c.color} : {}}>{c.value}</p>
              <p className="ls-card-helper">{c.helper}</p>
            </div>
          ))}
        </div>

        {/* STATUS BARS */}
        <div className="ls-panel">
          <div className="ls-panel-header">
            <div className="ls-panel-icon"><FaBoxOpen /></div>
            <div>
              <h4 className="ls-panel-title">Shipments by Status</h4>
              <p className="ls-panel-note">Distribution of current shipment workflow</p>
            </div>
          </div>
          {statusData.map(s=>(
            <div key={s.label} className="ls-bar-row">
              <span className="ls-bar-label"><span className="ls-dot" style={{backgroundColor:s.color}}/>{s.label}</span>
              <div className="ls-bar-track">
                <div className="ls-bar-fill" style={{width:`${(s.value/maxVal)*100}%`,backgroundColor:s.color}}/>
              </div>
              <span className="ls-bar-count" style={{backgroundColor:s.tint,borderColor:s.color}}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* PERFORMANCE PANEL */}
        <div className="ls-panel">
          <div className="ls-panel-header">
            <div className="ls-panel-icon"><FaStar /></div>
            <div>
              <h4 className="ls-panel-title">Delivery Performance</h4>
              <p className="ls-panel-note">On-time vs delayed breakdown</p>
            </div>
          </div>
          {[
            ['Total Delivered',        n(summary.delivered),             '#2f7d56'],
            ['On-Time Deliveries',     n(summary.on_time),               '#2f7d56'],
            ['Delayed Shipments',      n(summary.delayed),               n(summary.delayed)>0?'#dc2626':'#2f7d56'],
            ['Returned Shipments',     n(summary.returned),              n(summary.returned)>0?'#b5536b':'#2f7d56'],
            ['Missing Receipts',       n(summary.missing_receipts),      n(summary.missing_receipts)>0?'#b5536b':'#2f7d56'],
            ['Avg Delivery Days',      summary.average_delivery_days ? `${summary.average_delivery_days}d` : '—', '#1f2937'],
          ].map(([label,value,color])=>(
            <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #f3e8ec',fontSize:13}}>
              <span style={{color:'#64748b',fontWeight:700}}>{label}</span>
              <span style={{fontWeight:850,color}}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default LogisticsSummary;
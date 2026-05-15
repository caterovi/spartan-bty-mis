import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axiosConfig';
import {
  FaComment, FaStar, FaCheck, FaBell, FaUser, FaChartBar,
  FaLightbulb, FaPaperPlane, FaExclamationCircle, FaThumbsUp,
  FaQuestionCircle, FaClock, FaFire, FaExclamationTriangle,
} from "react-icons/fa";

const PRIORITY_STYLES = {
  low:    { background:'#ecfdf3', color:'#2f7d56', border:'1px solid #2f9d6a' },
  medium: { background:'#fff7e8', color:'#9a5f0f', border:'1px solid #d98a1f' },
  high:   { background:'#fff1f5', color:'#b5536b', border:'1px solid #c4607a' },
  urgent: { background:'#fef2f2', color:'#dc2626', border:'1px solid #ef4444' },
};
const STATUS_STYLES = {
  new:         { background:'#fff1f5', color:'#b5536b', border:'1px solid #c4607a' },
  assigned:    { background:'#f0f0ff', color:'#4f46e5', border:'1px solid #818cf8' },
  'in-review': { background:'#fff7e8', color:'#9a5f0f', border:'1px solid #d98a1f' },
  contacted:   { background:'#e8f4ff', color:'#1a5f9a', border:'1px solid #4a90d9' },
  resolved:    { background:'#ecfdf3', color:'#2f7d56', border:'1px solid #2f9d6a' },
  closed:      { background:'#f8f3f5', color:'#6b5b63', border:'1px solid #c9b6bf' },
};
const TYPE_ICONS = {
  complaint:  <FaExclamationCircle />,
  suggestion: <FaLightbulb />,
  compliment: <FaThumbsUp />,
  inquiry:    <FaQuestionCircle />,
};
const TYPE_COLORS = {
  complaint:  { color:'#c4607a', tint:'#fff1f5' },
  suggestion: { color:'#d98a1f', tint:'#fff7e8' },
  compliment: { color:'#2f9d6a', tint:'#ecfdf3' },
  inquiry:    { color:'#8b7280', tint:'#f8f3f5' },
};
const fmt = (v) => String(v||'').replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) : '—';

function Analysis() {
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg]       = useState('');
  const [genResult, setGenResult] = useState(null);

  useEffect(() => { fetchSummary(); }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try { const r = await api.get('/crm/summary'); setSummary(r.data); }
    catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true); setGenMsg(''); setGenResult(null);
    try {
      const r = await api.post('/crm/generate-suggestions');
      setGenMsg(r.data.message);
      setGenResult(r.data.suggestions||[]);
    } catch(e){ setGenMsg('Error generating suggestions.'); }
    finally { setGenerating(false); }
  };

  if (loading) return <Layout><div style={{minHeight:240,display:'grid',placeItems:'center',color:'#b5536b',fontSize:14,fontWeight:700}}>⏳ Loading analysis...</div></Layout>;
  if (!summary) return <Layout><div style={{padding:40,textAlign:'center',color:'#b5536b'}}>⚠️ Failed to load summary.</div></Layout>;

  const byType   = summary.byType||[];
  const byRating = summary.byRating||[];
  const byPriority = summary.byPriority||[];
  const maxType  = Math.max(...byType.map(t=>Number(t.count)||0), 1);
  const maxRating = Math.max(...byRating.map(r=>Number(r.count)||0), 1);
  const maxPriority = Math.max(...byPriority.map(p=>Number(p.count)||0), 1);

  const summaryCards = [
    { label:'Total Feedback',      value:summary.total,             icon:<FaComment />,           helper:'All submitted feedback' },
    { label:'Average Rating',       value:`${summary.avg_rating||0} ⭐`, icon:<FaStar />,          helper:'Overall satisfaction' },
    { label:'Resolved',            value:summary.resolved,          icon:<FaCheck />,              helper:'Successfully closed' },
    { label:'New Pending',         value:summary.new_count,         icon:<FaBell />,               helper:'Needs review', warn:summary.new_count>0 },
    { label:'Total Customers',     value:summary.total_customers,   icon:<FaUser />,               helper:'Active CRM customers' },
    { label:'Overdue Feedback',    value:summary.overdue_count||0,  icon:<FaClock />,              helper:'Past due date', warn:summary.overdue_count>0 },
    { label:'Avg Resolution',      value:summary.avg_resolution_hours ? `${summary.avg_resolution_hours}h` : '—', icon:<FaChartBar />, helper:'Average hours to resolve' },
    { label:'High Priority',       value:(summary.high_priority||[]).length, icon:<FaFire />,     helper:'High/urgent unresolved', warn:(summary.high_priority||[]).length>0 },
    { label:'Low Rating',          value:(summary.low_rating_feedback||[]).length, icon:<FaExclamationTriangle />, helper:'Rating ≤ 2', warn:(summary.low_rating_feedback||[]).length>0 },
  ];

  return (
    <Layout>
      <style>{`
        .an-page { width:100%; animation:anFadeUp 0.35s ease both; }
        .an-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .an-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .an-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .an-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .an-hero-right { display:flex; align-items:center; gap:12px; flex-shrink:0; }
        .an-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); }
        .an-gen-btn { border:none; border-radius:12px; padding:12px 16px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
        .an-gen-btn:hover:not(:disabled) { transform:translateY(-1px); }
        .an-gen-btn:disabled { opacity:.65; cursor:not-allowed; }
        .an-gen-msg { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; background:#ecfdf3; color:#2f7d56; border:1px solid #2f9d6a; }
        .an-gen-msg.err { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .an-cards { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; margin-bottom:20px; }
        .an-card { background:#fff; border:1px solid #e2c6cf; border-radius:14px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); position:relative; overflow:hidden; transition:all 180ms ease; }
        .an-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .an-card:hover { transform:translateY(-2px); border-color:#c4607a; }
        .an-card-top { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
        .an-card-label { margin:0; color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .an-card-icon { width:36px; height:36px; border-radius:11px; display:grid; place-items:center; color:#b5536b; background:#fff1f5; border:1px solid #e8b9c6; font-size:15px; flex:0 0 auto; }
        .an-card-value { margin:0; color:#1f2937; font-size:22px; font-weight:850; letter-spacing:-.04em; }
        .an-card-helper { margin:5px 0 0; color:#94a3b8; font-size:11px; }
        .an-charts { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
        .an-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; box-shadow:0 2px 8px rgba(0,0,0,.05); margin-bottom:20px; }
        .an-panel-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .an-panel-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .an-panel-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .an-panel-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .an-list { display:grid; gap:12px; }
        .an-bar-row { display:grid; grid-template-columns:110px 1fr 48px; align-items:center; gap:10px; }
        .an-bar-label { display:flex; align-items:center; gap:7px; color:#374151; font-size:13px; font-weight:700; text-transform:capitalize; }
        .an-dot { width:9px; height:9px; border-radius:9999px; flex-shrink:0; }
        .an-bar-track { height:14px; border-radius:9999px; background:#f3e8ec; overflow:hidden; border:1px solid #ead1d9; }
        .an-bar-fill { height:100%; border-radius:9999px; transition:width 320ms ease; min-width:8px; }
        .an-bar-count { justify-self:end; min-width:36px; padding:4px 8px; border-radius:9999px; font-size:11px; font-weight:800; text-align:center; border:1px solid; }
        .an-stars { color:#d98a1f; letter-spacing:1px; }
        .an-empty { color:#94a3b8; font-size:14px; text-align:center; padding:24px 0; border:1px dashed #e2c6cf; border-radius:12px; background:#fff7fa; }
        .an-insight-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
        .an-insight-card { background:#fff7fa; border:1px solid #e2c6cf; border-radius:14px; padding:14px; display:flex; align-items:center; gap:10px; transition:all 180ms ease; }
        .an-insight-card:hover { transform:translateY(-2px); border-color:#c4607a; }
        .an-insight-icon { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; flex-shrink:0; border:1px solid; font-size:15px; }
        .an-table-wrap { overflow-x:auto; border:1px solid #ead1d9; border-radius:12px; }
        .an-table { width:100%; min-width:500px; border-collapse:collapse; background:#fff; }
        .an-table thead { background:#fff7fa; }
        .an-table th { padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; border-bottom:1px solid #ead1d9; white-space:nowrap; }
        .an-table td { padding:10px 14px; font-size:13px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; }
        .an-table tbody tr:hover { background:#fff7fa; }
        .an-table tbody tr:last-child td { border-bottom:none; }
        .an-badge { display:inline-flex; align-items:center; padding:4px 9px; border-radius:9999px; font-size:11px; font-weight:800; white-space:nowrap; }
        .an-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
        .an-sugg-card { background:#fff7fa; border:1px solid #ead1d9; border-radius:12px; padding:14px; margin-bottom:10px; }
        .an-sugg-title { font-weight:800; color:#1f2937; font-size:13px; margin-bottom:4px; }
        .an-sugg-desc { font-size:12px; color:#64748b; line-height:1.6; }
        @keyframes anFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width:1180px) { .an-cards { grid-template-columns:repeat(3,minmax(0,1fr)); } .an-charts { grid-template-columns:1fr; } .an-insight-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .an-grid-2 { grid-template-columns:1fr; } }
        @media (max-width:768px) {
          .an-hero { flex-direction:column; align-items:flex-start; padding:20px; }
          .an-title { font-size:24px; }
          .an-hero-right { width:100%; justify-content:space-between; }
          .an-gen-btn { flex:1; justify-content:center; }
          .an-hero-icon { width:48px; height:48px; font-size:20px; }
          .an-cards { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .an-bar-row { grid-template-columns:1fr; gap:6px; }
          .an-bar-count { justify-self:start; }
        }
        @media (max-width:520px) { .an-cards,.an-insight-grid { grid-template-columns:1fr; } }
      `}</style>

      <div className="an-page">
        {/* HERO */}
        <div className="an-hero">
          <div>
            <p className="an-eyebrow">CRM Insights</p>
            <h3 className="an-title">Feedback Analysis</h3>
            <p className="an-subtitle">Review customer feedback patterns, priorities, resolution times, and actionable marketing insights.</p>
          </div>
          <div className="an-hero-right">
            <button onClick={handleGenerate} disabled={generating} className="an-gen-btn">
              <FaPaperPlane /> {generating ? 'Generating...' : 'Send Suggestions'}
            </button>
            <div className="an-hero-icon"><FaChartBar /></div>
          </div>
        </div>

        {genMsg && (
          <div className={`an-gen-msg${genMsg.toLowerCase().includes('error')?' err':''}`}>
            {genMsg}
            {genResult?.length > 0 && (
              <div style={{marginTop:12}}>
                {genResult.map((s,i)=>(
                  <div key={i} className="an-sugg-card">
                    <div className="an-sugg-title">{s.title}</div>
                    <div className="an-sugg-desc">{s.suggested_action}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="an-cards">
          {summaryCards.map(c=>(
            <div key={c.label} className="an-card">
              <div className="an-card-top">
                <p className="an-card-label">{c.label}</p>
                <span className="an-card-icon">{c.icon}</span>
              </div>
              <p className="an-card-value" style={c.warn && Number(c.value)>0 ? {color:'#b5536b'} : {}}>{c.value}</p>
              <p className="an-card-helper">{c.helper}</p>
            </div>
          ))}
        </div>

        {/* TYPE + RATING */}
        <div className="an-charts">
          {/* By Type */}
          <div className="an-panel">
            <div className="an-panel-header">
              <div className="an-panel-icon"><FaComment /></div>
              <div>
                <h4 className="an-panel-title">Feedback by Type</h4>
                <p className="an-panel-note">Category breakdown</p>
              </div>
            </div>
            {byType.length === 0 ? <p className="an-empty">No data yet.</p> : (
              <div className="an-list">
                {byType.map(item=>{
                  const meta = TYPE_COLORS[item.type]||{color:'#8b7280',tint:'#f8f3f5'};
                  return (
                    <div key={item.type} className="an-bar-row">
                      <span className="an-bar-label"><span className="an-dot" style={{backgroundColor:meta.color}}/>{item.type}</span>
                      <div className="an-bar-track"><div className="an-bar-fill" style={{width:`${(Number(item.count)||0)/maxType*100}%`,backgroundColor:meta.color}}/></div>
                      <span className="an-bar-count" style={{backgroundColor:meta.tint,borderColor:meta.color}}>{item.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* By Rating */}
          <div className="an-panel">
            <div className="an-panel-header">
              <div className="an-panel-icon"><FaStar /></div>
              <div>
                <h4 className="an-panel-title">Rating Distribution</h4>
                <p className="an-panel-note">Customer satisfaction by score</p>
              </div>
            </div>
            {byRating.length === 0 ? <p className="an-empty">No data yet.</p> : (
              <div className="an-list">
                {[5,4,3,2,1].map(r=>{
                  const found = byRating.find(x=>Number(x.rating)===r);
                  const count = found?.count||0;
                  const color = r>=4?'#2f9d6a':r===3?'#d98a1f':'#c4607a';
                  const tint  = r>=4?'#ecfdf3':r===3?'#fff7e8':'#fff1f5';
                  return (
                    <div key={r} className="an-bar-row">
                      <span className="an-bar-label an-stars">{'★'.repeat(r)}</span>
                      <div className="an-bar-track"><div className="an-bar-fill" style={{width:`${(Number(count)||0)/maxRating*100}%`,backgroundColor:color}}/></div>
                      <span className="an-bar-count" style={{backgroundColor:tint,borderColor:color}}>{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* PRIORITY + UNRESOLVED BY USER */}
        <div className="an-grid-2">
          <div className="an-panel">
            <div className="an-panel-header">
              <div className="an-panel-icon"><FaFire /></div>
              <div>
                <h4 className="an-panel-title">Priority Distribution</h4>
                <p className="an-panel-note">Feedback urgency breakdown</p>
              </div>
            </div>
            {byPriority.length === 0 ? <p className="an-empty">No data.</p> : (
              <div className="an-list">
                {byPriority.map(item=>{
                  const s = PRIORITY_STYLES[item.priority]||PRIORITY_STYLES.medium;
                  const color = s.color;
                  const tint  = s.background;
                  return (
                    <div key={item.priority} className="an-bar-row">
                      <span className="an-bar-label"><span className="an-dot" style={{backgroundColor:color}}/>{item.priority}</span>
                      <div className="an-bar-track"><div className="an-bar-fill" style={{width:`${(Number(item.count)||0)/maxPriority*100}%`,backgroundColor:color}}/></div>
                      <span className="an-bar-count" style={{backgroundColor:tint,borderColor:color}}>{item.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="an-panel">
            <div className="an-panel-header">
              <div className="an-panel-icon"><FaUser /></div>
              <div>
                <h4 className="an-panel-title">Unresolved by Staff</h4>
                <p className="an-panel-note">CRM staff workload</p>
              </div>
            </div>
            {!summary.unresolved_by_user?.length ? <p className="an-empty">No unresolved feedback.</p> : (
              <div className="an-table-wrap">
                <table className="an-table">
                  <thead><tr><th>CRM Staff</th><th>Unresolved</th></tr></thead>
                  <tbody>
                    {summary.unresolved_by_user.map((u,i)=>(
                      <tr key={i}>
                        <td style={{fontWeight:700}}>{u.assigned_to||'Unassigned'}</td>
                        <td><span className="an-badge" style={{background:'#fff1f5',color:'#b5536b',border:'1px solid #c4607a'}}>{u.count}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* OVERDUE FEEDBACK */}
        {summary.overdue_feedback?.length > 0 && (
          <div className="an-panel">
            <div className="an-panel-header">
              <div className="an-panel-icon"><FaClock /></div>
              <div>
                <h4 className="an-panel-title">Overdue Feedback</h4>
                <p className="an-panel-note">Past due date and not yet resolved</p>
              </div>
            </div>
            <div className="an-table-wrap">
              <table className="an-table">
                <thead><tr><th>Customer</th><th>Subject</th><th>Due Date</th><th>Status</th><th>Priority</th></tr></thead>
                <tbody>
                  {summary.overdue_feedback.map(f=>(
                    <tr key={f.id}>
                      <td style={{fontWeight:700}}>{f.customer_name||'—'}</td>
                      <td>{f.subject}</td>
                      <td style={{color:'#dc2626',fontWeight:800}}>{fmtDate(f.due_date)}</td>
                      <td><span className="an-badge" style={STATUS_STYLES[f.status]||{}}>{fmt(f.status)}</span></td>
                      <td><span className="an-badge" style={PRIORITY_STYLES[f.priority]||{}}>{fmt(f.priority)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LOW RATING */}
        {summary.low_rating_feedback?.length > 0 && (
          <div className="an-panel">
            <div className="an-panel-header">
              <div className="an-panel-icon"><FaExclamationTriangle /></div>
              <div>
                <h4 className="an-panel-title">Low Rating Feedback</h4>
                <p className="an-panel-note">Feedback with rating ≤ 2 — needs attention</p>
              </div>
            </div>
            <div className="an-table-wrap">
              <table className="an-table">
                <thead><tr><th>Customer</th><th>Subject</th><th>Rating</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {summary.low_rating_feedback.map(f=>(
                    <tr key={f.id}>
                      <td style={{fontWeight:700}}>{f.customer_name||'—'}</td>
                      <td>{f.subject}</td>
                      <td style={{fontWeight:900,color:'#dc2626'}}>{f.rating}/5</td>
                      <td><span className="an-badge" style={STATUS_STYLES[f.status]||{}}>{fmt(f.status)}</span></td>
                      <td>{fmtDate(f.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HIGH PRIORITY ISSUES */}
        {summary.high_priority?.length > 0 && (
          <div className="an-panel">
            <div className="an-panel-header">
              <div className="an-panel-icon"><FaFire /></div>
              <div>
                <h4 className="an-panel-title">High Priority Issues</h4>
                <p className="an-panel-note">High and urgent unresolved feedback</p>
              </div>
            </div>
            <div className="an-table-wrap">
              <table className="an-table">
                <thead><tr><th>Customer</th><th>Subject</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {summary.high_priority.map(f=>(
                    <tr key={f.id}>
                      <td style={{fontWeight:700}}>{f.customer_name||'—'}</td>
                      <td>{f.subject}</td>
                      <td><span className="an-badge" style={PRIORITY_STYLES[f.priority]||{}}>{fmt(f.priority)}</span></td>
                      <td><span className="an-badge" style={STATUS_STYLES[f.status]||{}}>{fmt(f.status)}</span></td>
                      <td>{fmtDate(f.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* QUICK INSIGHTS */}
        <div className="an-panel">
          <div className="an-panel-header">
            <div className="an-panel-icon"><FaLightbulb /></div>
            <div>
              <h4 className="an-panel-title">Quick CRM Insights</h4>
              <p className="an-panel-note">Category summary from current feedback records</p>
            </div>
          </div>
          {byType.length === 0 ? <p className="an-empty">No insights yet.</p> : (
            <div className="an-insight-grid">
              {byType.map(item=>{
                const meta = TYPE_COLORS[item.type]||{color:'#8b7280',tint:'#f8f3f5'};
                return (
                  <div key={item.type} className="an-insight-card">
                    <div className="an-insight-icon" style={{color:meta.color,background:meta.tint,borderColor:meta.color}}>
                      {TYPE_ICONS[item.type]||<FaComment />}
                    </div>
                    <div>
                      <p style={{margin:'0 0 3px',color:'#374151',fontSize:13,fontWeight:800,textTransform:'capitalize'}}>{item.type}</p>
                      <p style={{margin:0,color:'#64748b',fontSize:12}}>{item.count} feedback{item.count!==1?'s':''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Analysis;
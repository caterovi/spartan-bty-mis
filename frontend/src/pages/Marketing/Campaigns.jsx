import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import CampaignDetail from './CampaignDetail';
import {
  FaFacebook, FaInstagram, FaTiktok, FaAt, FaYoutube, FaBars,
  FaBullhorn, FaPlus, FaTimes, FaTrash, FaSearch, FaFilter,
  FaCalendar, FaLightbulb, FaCamera, FaMicrophone, FaStar,
  FaGlobe, FaChartBar,
} from "react-icons/fa";

const OBJECTIVES = [
  'Product Awareness','Product Education','Seasonal Promotion',
  'Brand Storytelling','Customer Engagement','Product Launch',
  'Promo Advertisement','Live Selling Support',
];
const CAMPAIGN_TYPES = [
  'Monthly Campaign','Seasonal Campaign','Holiday Campaign',
  'Product Launch','Clearance Campaign','Live Selling Campaign','Promo Campaign',
];
const SEASON_EVENTS = [
  "Valentine's Day","Mother's Day","Christmas Sale","New Year Glow",
  "Mid-Year Sale","Back to School","Payday Sale","Monthly Product Spotlight",
];
const PLATFORMS = ['facebook','instagram','tiktok','email','shopee','youtube','other'];

const STATUS_STYLES = {
  draft:        { background:'#f8f3f5', color:'#6b5b63',  border:'1px solid #c9b6bf' },
  'in-progress':{ background:'#fff7e8', color:'#9a5f0f',  border:'1px solid #d98a1f' },
  completed:    { background:'#ecfdf3', color:'#2f7d56',  border:'1px solid #2f9d6a' },
  cancelled:    { background:'#fff1f5', color:'#b5536b',  border:'1px solid #c4607a' },
};
const DISPLAY_STYLES = {
  upcoming:     { background:'#e8f4ff', color:'#1a5f9a',  border:'1px solid #4a90d9' },
  ongoing:      { background:'#ecfdf3', color:'#2f7d56',  border:'1px solid #2f9d6a' },
  overdue:      { background:'#fef2f2', color:'#dc2626',  border:'1px solid #ef4444' },
  completed:    { background:'#ecfdf3', color:'#2f7d56',  border:'1px solid #2f9d6a' },
  cancelled:    { background:'#fff1f5', color:'#b5536b',  border:'1px solid #c4607a' },
};
const PRIORITY_STYLES = {
  low:    { background:'#ecfdf3', color:'#2f7d56', border:'1px solid #2f9d6a' },
  medium: { background:'#fff7e8', color:'#9a5f0f', border:'1px solid #d98a1f' },
  high:   { background:'#fff1f5', color:'#b5536b', border:'1px solid #c4607a' },
};
const APPROVAL_STYLES = {
  draft:       { background:'#f8f3f5', color:'#6b5b63', border:'1px solid #c9b6bf' },
  'in-progress':{ background:'#fff7e8', color:'#9a5f0f', border:'1px solid #d98a1f' },
  'for-review': { background:'#e8f4ff', color:'#1a5f9a', border:'1px solid #4a90d9' },
  approved:    { background:'#ecfdf3', color:'#2f7d56', border:'1px solid #2f9d6a' },
  published:   { background:'#f0f0ff', color:'#4f46e5', border:'1px solid #818cf8' },
  completed:   { background:'#ecfdf3', color:'#2f7d56', border:'1px solid #2f9d6a' },
  rejected:    { background:'#fff1f5', color:'#b5536b', border:'1px solid #c4607a' },
};

const platformIcons = {
  facebook:<FaFacebook/>, instagram:<FaInstagram/>, tiktok:<FaTiktok/>,
  email:<FaAt/>, youtube:<FaYoutube/>, shopee:<FaGlobe/>, other:<FaBars/>,
};

const fmt = (v) => String(v||'').replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) : '—';

const emptyForm = {
  title:'', description:'', platform:'facebook', start_date:'', end_date:'',
  status:'draft', objective:'', target_audience:'', campaign_type:'',
  season_event:'', campaign_month:'', expected_outcome:'', priority:'medium',
  landing_headline:'', landing_subtitle:'', is_featured:false, publish_to_landing:false,
};

function Campaigns() {
  const [campaigns, setCampaigns]   = useState([]);
  const [summary, setSummary]       = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [message, setMessage]       = useState('');
  const [isError, setIsError]       = useState(false);
  const [search, setSearch]         = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterType, setFilterType]       = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = () => { fetchCampaigns(); fetchSummary(); };

  const fetchCampaigns = async () => {
    try { const r = await api.get('/marketing/campaigns'); setCampaigns(r.data||[]); }
    catch(e){ console.error(e); }
  };
  const fetchSummary = async () => {
    try { const r = await api.get('/marketing/campaigns/summary'); setSummary(r.data); }
    catch(e){ console.error(e); }
  };

  const notify = (msg, err=false) => {
    setMessage(msg); setIsError(err);
    setTimeout(()=>setMessage(''), 3500);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return notify('Campaign title is required.', true);
    if (!form.start_date)   return notify('Start date is required.', true);
    if (!form.end_date)     return notify('End date is required.', true);
    if (new Date(form.end_date) < new Date(form.start_date))
      return notify('End date cannot be earlier than start date.', true);
    try {
      await api.post('/marketing/campaigns', form);
      notify('Campaign created successfully!');
      setShowForm(false); setForm(emptyForm);
      fetchAll();
    } catch(e){ notify(e.response?.data?.message||'Error creating campaign.', true); }
  };

  const handleStatusChange = async (id, status, e) => {
    e.stopPropagation();
    try { await api.put(`/marketing/campaigns/${id}`, { status }); fetchCampaigns(); }
    catch(e){ console.error(e); }
  };

  const handleArchive = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Archive this campaign? It will be hidden from the list.')) return;
    try {
      await api.delete(`/marketing/campaigns/${id}`);
      notify('Campaign archived.');
      fetchAll();
    } catch(e){ notify('Error archiving campaign.', true); }
  };

  if (selectedId) {
    return (
      <CampaignDetail
        campaignId={selectedId}
        onBack={() => { setSelectedId(null); fetchAll(); }}
      />
    );
  }

  const clearFilters = () => { setSearch(''); setFilterStatus('all'); setFilterType('all'); setFilterPriority('all'); };
  const hasFilters = search || filterStatus!=='all' || filterType!=='all' || filterPriority!=='all';

  const filtered = campaigns.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (c.title||'').toLowerCase().includes(q) ||
      (c.platform||'').toLowerCase().includes(q) ||
      (c.status||'').toLowerCase().includes(q) ||
      (c.objective||'').toLowerCase().includes(q) ||
      (c.campaign_type||'').toLowerCase().includes(q) ||
      (c.season_event||'').toLowerCase().includes(q);
    const matchStatus   = filterStatus==='all'   || c.status===filterStatus;
    const matchType     = filterType==='all'     || c.campaign_type===filterType;
    const matchPriority = filterPriority==='all' || c.priority===filterPriority;
    return matchSearch && matchStatus && matchType && matchPriority;
  });

  return (
    <Layout>
      <style>{`
        .campaigns-page { width:100%; animation:campFadeUp 0.35s ease both; }
        .campaigns-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .campaigns-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .campaigns-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .campaigns-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .campaigns-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }

        /* SUMMARY CARDS */
        .campaigns-summary { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:11px; margin-bottom:20px; }
        .campaigns-sum-card { background:#fff; border:1px solid #e2c6cf; border-radius:14px; padding:14px 16px; box-shadow:0 2px 8px rgba(0,0,0,.05); position:relative; overflow:hidden; transition:all 180ms ease; }
        .campaigns-sum-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .campaigns-sum-card:hover { transform:translateY(-2px); border-color:#c4607a; }
        .campaigns-sum-label { margin:0 0 8px; color:#64748b; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .campaigns-sum-value { margin:0; color:#1f2937; font-size:20px; font-weight:850; letter-spacing:-.04em; }

        /* TOOLBAR */
        .campaigns-toolbar { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; justify-content:space-between; align-items:center; gap:14px; }
        .campaigns-search-wrap { position:relative; width:280px; max-width:100%; }
        .campaigns-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b5536b; font-size:13px; pointer-events:none; }
        .campaigns-search { width:100%; padding:11px 13px 11px 36px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; color:#1f2937; font-size:14px; outline:none; box-sizing:border-box; transition:all 180ms ease; }
        .campaigns-search:focus { border-color:#c4607a; background:#fff; box-shadow:0 0 0 4px rgba(196,96,122,.12); }
        .campaigns-toolbar-btns { display:flex; gap:8px; flex-shrink:0; }
        .campaigns-add-btn,.campaigns-submit-btn { border:none; border-radius:12px; padding:11px 16px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
        .campaigns-add-btn:hover,.campaigns-submit-btn:hover { transform:translateY(-1px); }
        .campaigns-filter-btn { border:1px solid #d8b8c2; border-radius:12px; padding:10px 14px; background:#fff; color:#64748b; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all 180ms ease; white-space:nowrap; }
        .campaigns-filter-btn:hover,.campaigns-filter-active { border-color:#c4607a; color:#b5536b; background:#fff1f5; }

        /* FILTERS */
        .campaigns-filters { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:14px 16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .campaigns-filter-select { padding:9px 12px; border-radius:10px; border:1px solid #d8b8c2; background:#fff7fa; color:#374151; font-size:13px; font-weight:600; outline:none; }
        .campaigns-clear-btn { padding:9px 14px; border-radius:10px; border:1px solid #d8b8c2; background:#fff; color:#64748b; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
        .campaigns-clear-btn:hover { border-color:#c4607a; color:#b5536b; }

        /* MESSAGE */
        .campaigns-message { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .campaigns-message-success { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .campaigns-message-error { background:#fff1f5; color:#b5536b; border-color:#c4607a; }

        /* FORM */
        .campaigns-form { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .campaigns-form-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .campaigns-form-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .campaigns-form-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .campaigns-form-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .campaigns-form-section { font-size:11px; font-weight:800; color:#b5536b; text-transform:uppercase; letter-spacing:.08em; margin:16px 0 10px; padding-bottom:8px; border-bottom:1px solid #f3e8ec; grid-column:span 3; }
        .campaigns-form-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:14px; }
        .campaigns-field { display:flex; flex-direction:column; gap:6px; }
        .campaigns-label { font-size:13px; font-weight:800; color:#374151; }
        .campaigns-label-opt { font-size:11px; font-weight:400; color:#94a3b8; margin-left:4px; }
        .campaigns-input { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .campaigns-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .campaigns-span-2 { grid-column:span 2; }
        .campaigns-span-3 { grid-column:span 3; }
        .campaigns-toggle-row { display:flex; gap:12px; align-items:center; }
        .campaigns-toggle-label { display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; font-weight:700; color:#374151; }
        .campaigns-toggle-label input[type=checkbox] { width:16px; height:16px; accent-color:#c4607a; cursor:pointer; }

        /* CARDS */
        .campaigns-result-count { margin:0 0 12px; color:#64748b; font-size:13px; font-weight:700; }
        .campaigns-card-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
        .campaigns-card { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:18px; display:flex; flex-direction:column; gap:10px; cursor:pointer; position:relative; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.05); transition:all 180ms ease; }
        .campaigns-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .campaigns-card:hover { transform:translateY(-2px); border-color:#c4607a; box-shadow:0 4px 16px rgba(0,0,0,.07); }
        .campaigns-card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap; }
        .campaigns-platform { display:inline-flex; align-items:center; gap:7px; color:#b5536b; background:#fff1f5; border:1px solid #e8b9c6; border-radius:9999px; padding:5px 10px; font-size:11px; font-weight:800; text-transform:capitalize; }
        .campaigns-badge { display:inline-flex; align-items:center; justify-content:center; padding:5px 10px; border-radius:9999px; font-size:11px; font-weight:800; white-space:nowrap; text-transform:capitalize; }
        .campaigns-card-badges { display:flex; gap:5px; flex-wrap:wrap; margin-top:2px; }
        .campaigns-card-title { margin:0; color:#1f2937; font-size:16px; font-weight:850; letter-spacing:-.02em; line-height:1.35; }
        .campaigns-card-objective { margin:0; color:#64748b; font-size:12px; font-weight:700; }
        .campaigns-card-desc { margin:0; color:#94a3b8; font-size:12px; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .campaigns-progress { background:#fff7fa; border:1px solid #ead1d9; border-radius:12px; padding:10px 12px; }
        .campaigns-progress-header { display:flex; justify-content:space-between; margin-bottom:7px; }
        .campaigns-progress-label { color:#64748b; font-size:11px; font-weight:800; }
        .campaigns-progress-pct { color:#1f2937; font-size:12px; font-weight:850; }
        .campaigns-progress-track { height:8px; border-radius:9999px; background:#f3e8ec; overflow:hidden; border:1px solid #ead1d9; }
        .campaigns-progress-fill { height:100%; border-radius:9999px; transition:width 320ms ease; min-width:6px; }
        .campaigns-progress-sub { margin:6px 0 0; color:#94a3b8; font-size:11px; font-weight:600; }
        .campaigns-card-dates { display:flex; align-items:center; gap:7px; color:#64748b; font-size:11px; font-weight:700; }
        .campaigns-equip-row { display:flex; gap:6px; flex-wrap:wrap; }
        .campaigns-equip-item { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:800; color:#374151; background:#fff7fa; border:1px solid #ead1d9; padding:5px 8px; border-radius:9999px; }
        .campaigns-special-badges { display:flex; gap:6px; flex-wrap:wrap; }
        .campaigns-card-actions { display:flex; gap:8px; margin-top:2px; }
        .campaigns-status-select { flex:1; min-width:0; padding:8px 10px; border-radius:10px; border:1px solid #d8b8c2; background:#fff; color:#374151; font-size:12px; font-weight:700; cursor:pointer; outline:none; }
        .campaigns-archive-btn { border:1px solid #c4607a; border-radius:10px; padding:8px 12px; background:#fff1f5; color:#b5536b; cursor:pointer; font-size:12px; font-weight:800; display:inline-flex; align-items:center; gap:6px; transition:all 180ms ease; }
        .campaigns-archive-btn:hover { background:#ffe4ec; transform:translateY(-1px); }
        .campaigns-click-hint { color:#b5536b; text-align:center; font-size:11px; font-weight:800; }
        .campaigns-empty { background:#fff; border:1px dashed #e2c6cf; border-radius:18px; padding:42px 20px; text-align:center; color:#94a3b8; font-size:14px; font-weight:700; }

        @keyframes campFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width:1180px) { .campaigns-summary { grid-template-columns:repeat(3,minmax(0,1fr)); } .campaigns-card-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width:900px) { .campaigns-form-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .campaigns-form-section,.campaigns-span-3 { grid-column:span 2; } .campaigns-span-2 { grid-column:span 2; } }
        @media (max-width:768px) {
          .campaigns-hero { align-items:flex-start; padding:20px; }
          .campaigns-title { font-size:24px; }
          .campaigns-hero-icon { width:48px; height:48px; font-size:20px; }
          .campaigns-toolbar { flex-direction:column; align-items:stretch; }
          .campaigns-toolbar-btns { flex-direction:column; }
          .campaigns-search-wrap,.campaigns-add-btn,.campaigns-filter-btn { width:100%; }
          .campaigns-summary { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .campaigns-filters { flex-direction:column; align-items:stretch; }
          .campaigns-filter-select,.campaigns-clear-btn { width:100%; }
          .campaigns-form-grid { grid-template-columns:1fr; }
          .campaigns-form-section,.campaigns-span-3,.campaigns-span-2 { grid-column:span 1; }
          .campaigns-card-grid { grid-template-columns:1fr; }
          .campaigns-card-actions { flex-direction:column; }
          .campaigns-status-select,.campaigns-archive-btn { width:100%; }
        }
        @media (max-width:520px) { .campaigns-hero { flex-direction:column-reverse; } .campaigns-summary { grid-template-columns:1fr; } }
      `}</style>

      <div className="campaigns-page">
        {/* HERO */}
        <div className="campaigns-hero">
          <div>
            <p className="campaigns-eyebrow">Marketing Management</p>
            <h3 className="campaigns-title">Campaign & Advertisement Production</h3>
            <p className="campaigns-subtitle">
              Plan monthly and seasonal campaigns, create advertising materials, connect products, and monitor campaign performance.
            </p>
          </div>
          <div className="campaigns-hero-icon"><FaBullhorn /></div>
        </div>

        {/* SUMMARY CARDS */}
        {summary && (
          <div className="campaigns-summary">
            {[
              { label:'Total Campaigns',   value:summary.total_campaigns||0 },
              { label:'Active',            value:summary.active_campaigns||0 },
              { label:'Published',         value:summary.published_campaigns||0 },
              { label:'Need Approval',     value:summary.approval_pending||0,    warn:true },
              { label:'Overdue',           value:summary.overdue_campaigns||0,   warn:true },
              { label:'Avg Progress',      value:`${summary.average_progress||0}%` },
            ].map(c=>(
              <div key={c.label} className="campaigns-sum-card">
                <p className="campaigns-sum-label">{c.label}</p>
                <p className="campaigns-sum-value" style={c.warn && Number(c.value)>0?{color:'#b5536b'}:{}}>{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* TOOLBAR */}
        <div className="campaigns-toolbar">
          <div className="campaigns-search-wrap">
            <FaSearch className="campaigns-search-icon" />
            <input type="text" placeholder="Search campaigns..." value={search}
              onChange={e=>setSearch(e.target.value)} className="campaigns-search" />
          </div>
          <div className="campaigns-toolbar-btns">
            <button className={`campaigns-filter-btn${hasFilters?' campaigns-filter-active':''}`}
              onClick={()=>setShowFilters(!showFilters)}>
              <FaFilter /> Filters {hasFilters?'● Active':''}
            </button>
            <button onClick={()=>setShowForm(!showForm)} className="campaigns-add-btn">
              {showForm?<FaTimes />:<FaPlus />}
              {showForm?'Cancel':'New Campaign'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`campaigns-message ${isError?'campaigns-message-error':'campaigns-message-success'}`}>{message}</div>
        )}

        {/* FILTERS */}
        {showFilters && (
          <div className="campaigns-filters">
            <FaFilter style={{color:'#b5536b',fontSize:13,flexShrink:0}} />
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="campaigns-filter-select">
              <option value="all">All Statuses</option>
              {['draft','in-progress','completed','cancelled'].map(s=><option key={s} value={s}>{fmt(s)}</option>)}
            </select>
            <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="campaigns-filter-select">
              <option value="all">All Types</option>
              {CAMPAIGN_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterPriority} onChange={e=>setFilterPriority(e.target.value)} className="campaigns-filter-select">
              <option value="all">All Priorities</option>
              {['low','medium','high'].map(p=><option key={p} value={p}>{fmt(p)}</option>)}
            </select>
            {hasFilters && <button className="campaigns-clear-btn" onClick={clearFilters}><FaTimes /> Clear</button>}
          </div>
        )}

        {/* CREATE FORM */}
        {showForm && (
          <div className="campaigns-form">
            <div className="campaigns-form-header">
              <div className="campaigns-form-icon"><FaBullhorn /></div>
              <div>
                <h4 className="campaigns-form-title">Create New Campaign</h4>
                <p className="campaigns-form-note">Define campaign goals, schedule, and advertising plan for Spartan BTY.</p>
              </div>
            </div>

            <div className="campaigns-form-grid">
              {/* Basic Info */}
              <div className="campaigns-form-section">Basic Information</div>
              <div className="campaigns-field campaigns-span-2">
                <label className="campaigns-label">Campaign Title *</label>
                <input type="text" placeholder="e.g. BTY Summer Glow Campaign 2026" value={form.title}
                  onChange={e=>setForm({...form,title:e.target.value})} className="campaigns-input" />
              </div>
              <div className="campaigns-field">
                <label className="campaigns-label">Priority</label>
                <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="campaigns-input">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="campaigns-field">
                <label className="campaigns-label">Objective <span className="campaigns-label-opt">optional</span></label>
                <select value={form.objective} onChange={e=>setForm({...form,objective:e.target.value})} className="campaigns-input">
                  <option value="">Select objective</option>
                  {OBJECTIVES.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="campaigns-field">
                <label className="campaigns-label">Campaign Type <span className="campaigns-label-opt">optional</span></label>
                <select value={form.campaign_type} onChange={e=>setForm({...form,campaign_type:e.target.value})} className="campaigns-input">
                  <option value="">Select type</option>
                  {CAMPAIGN_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="campaigns-field">
                <label className="campaigns-label">Season / Event <span className="campaigns-label-opt">optional</span></label>
                <select value={form.season_event} onChange={e=>setForm({...form,season_event:e.target.value})} className="campaigns-input">
                  <option value="">Select event</option>
                  {SEASON_EVENTS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="campaigns-field">
                <label className="campaigns-label">Campaign Month <span className="campaigns-label-opt">optional</span></label>
                <select value={form.campaign_month} onChange={e=>setForm({...form,campaign_month:e.target.value})} className="campaigns-input">
                  <option value="">Select month</option>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="campaigns-field">
                <label className="campaigns-label">Target Audience <span className="campaigns-label-opt">optional</span></label>
                <input type="text" placeholder="e.g. Women 18-35, skincare enthusiasts" value={form.target_audience}
                  onChange={e=>setForm({...form,target_audience:e.target.value})} className="campaigns-input" />
              </div>

              {/* Schedule & Platform */}
              <div className="campaigns-form-section">Schedule & Platform</div>
              <div className="campaigns-field">
                <label className="campaigns-label">Platform</label>
                <select value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})} className="campaigns-input">
                  {PLATFORMS.map(p=><option key={p} value={p}>{fmt(p)}</option>)}
                </select>
              </div>
              <div className="campaigns-field">
                <label className="campaigns-label">Start Date *</label>
                <input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} className="campaigns-input" />
              </div>
              <div className="campaigns-field">
                <label className="campaigns-label">End Date *</label>
                <input type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} className="campaigns-input" />
              </div>
              <div className="campaigns-field">
                <label className="campaigns-label">Status</label>
                <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="campaigns-input">
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Content */}
              <div className="campaigns-form-section">Content & Goals</div>
              <div className="campaigns-field campaigns-span-3">
                <label className="campaigns-label">Description <span className="campaigns-label-opt">optional</span></label>
                <textarea placeholder="Campaign description, concept, and overview..." value={form.description}
                  onChange={e=>setForm({...form,description:e.target.value})}
                  className="campaigns-input" style={{minHeight:80,resize:'vertical'}} />
              </div>
              <div className="campaigns-field campaigns-span-3">
                <label className="campaigns-label">Expected Outcome <span className="campaigns-label-opt">optional</span></label>
                <textarea placeholder="e.g. Increase brand awareness by 20%, generate 50+ orders from promo..." value={form.expected_outcome}
                  onChange={e=>setForm({...form,expected_outcome:e.target.value})}
                  className="campaigns-input" style={{minHeight:70,resize:'vertical'}} />
              </div>

              {/* Landing Page */}
              <div className="campaigns-form-section">Landing Page Settings</div>
              <div className="campaigns-field campaigns-span-2">
                <label className="campaigns-label">Landing Headline <span className="campaigns-label-opt">optional</span></label>
                <input type="text" placeholder="e.g. Shop Our Summer Glow Sale" value={form.landing_headline}
                  onChange={e=>setForm({...form,landing_headline:e.target.value})} className="campaigns-input" />
              </div>
              <div className="campaigns-field campaigns-span-3">
                <label className="campaigns-label">Landing Subtitle <span className="campaigns-label-opt">optional</span></label>
                <input type="text" placeholder="Supporting tagline for landing page..." value={form.landing_subtitle}
                  onChange={e=>setForm({...form,landing_subtitle:e.target.value})} className="campaigns-input" />
              </div>
              <div className="campaigns-field campaigns-span-3">
                <div className="campaigns-toggle-row">
                  <label className="campaigns-toggle-label">
                    <input type="checkbox" checked={form.publish_to_landing}
                      onChange={e=>setForm({...form,publish_to_landing:e.target.checked})} />
                    Publish to Landing Page
                  </label>
                  <label className="campaigns-toggle-label">
                    <input type="checkbox" checked={form.is_featured}
                      onChange={e=>setForm({...form,is_featured:e.target.checked})} />
                    <FaStar style={{color:'#d98a1f',fontSize:13}} /> Featured Campaign
                  </label>
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} className="campaigns-submit-btn">
              <FaPlus /> Save Campaign
            </button>
          </div>
        )}

        <p className="campaigns-result-count">
          {filtered.length} campaign{filtered.length!==1?'s':''} found. Click a card to view details.
        </p>

        {filtered.length === 0 ? (
          <div className="campaigns-empty">
            {hasFilters ? '🔍 No campaigns match your filters. Try clearing them.' : '📣 No campaigns yet. Create your first campaign above.'}
          </div>
        ) : (
          <div className="campaigns-card-grid">
            {filtered.map(c=>{
              const progressColor = c.progress===100?'#2f9d6a':c.progress>=50?'#d98a1f':'#c4607a';
              return (
                <div key={c.id} className="campaigns-card" onClick={()=>setSelectedId(c.id)}>
                  <div className="campaigns-card-top">
                    <span className="campaigns-platform">
                      {platformIcons[c.platform]||platformIcons.other} {c.platform}
                    </span>
                    <span className="campaigns-badge" style={STATUS_STYLES[c.status]||STATUS_STYLES.draft}>
                      {fmt(c.status)}
                    </span>
                  </div>

                  <h4 className="campaigns-card-title">{c.title}</h4>
                  {c.objective && <p className="campaigns-card-objective">🎯 {c.objective}</p>}
                  {c.description && <p className="campaigns-card-desc">{c.description}</p>}

                  <div className="campaigns-card-badges">
                    {c.display_status && !['completed','cancelled'].includes(c.status) && (
                      <span className="campaigns-badge" style={DISPLAY_STYLES[c.display_status]||{}}>{fmt(c.display_status)}</span>
                    )}
                    {c.approval_status && c.approval_status !== 'draft' && (
                      <span className="campaigns-badge" style={APPROVAL_STYLES[c.approval_status]||{}}>{fmt(c.approval_status)}</span>
                    )}
                    {c.priority && c.priority !== 'medium' && (
                      <span className="campaigns-badge" style={PRIORITY_STYLES[c.priority]||{}}>{fmt(c.priority)} Priority</span>
                    )}
                    {c.campaign_type && (
                      <span className="campaigns-badge" style={{background:'#fff1f5',color:'#b5536b',border:'1px solid #e8b9c6',fontSize:10}}>{c.campaign_type}</span>
                    )}
                    {c.season_event && (
                      <span className="campaigns-badge" style={{background:'#fff7e8',color:'#9a5f0f',border:'1px solid #d98a1f',fontSize:10}}>{c.season_event}</span>
                    )}
                  </div>

                  <div className="campaigns-progress">
                    <div className="campaigns-progress-header">
                      <span className="campaigns-progress-label">Progress</span>
                      <span className="campaigns-progress-pct">{c.progress}%</span>
                    </div>
                    <div className="campaigns-progress-track">
                      <div className="campaigns-progress-fill" style={{width:`${c.progress}%`,backgroundColor:progressColor}} />
                    </div>
                    <p className="campaigns-progress-sub">{c.completed_tasks}/{c.total_tasks} tasks completed</p>
                  </div>

                  <p className="campaigns-card-dates">
                    <FaCalendar /> {fmtDate(c.start_date)} → {fmtDate(c.end_date)}
                  </p>

                  <div className="campaigns-equip-row">
                    {[
                      {k:'equip_lights',icon:<FaLightbulb/>,l:'Lights'},
                      {k:'equip_mic',icon:<FaMicrophone/>,l:'Mic'},
                      {k:'equip_camera',icon:<FaCamera/>,l:'Camera'},
                    ].map(e=>(
                      <span key={e.k} className="campaigns-equip-item" style={{opacity:c[e.k]?1:0.3}}>
                        {e.icon} {e.l}
                      </span>
                    ))}
                  </div>

                  <div className="campaigns-special-badges">
                    {c.is_featured && <span className="campaigns-badge" style={{background:'#fefce8',color:'#854d0e',border:'1px solid #ca8a04',fontSize:10}}><FaStar style={{fontSize:9}}/> Featured</span>}
                    {c.publish_to_landing && <span className="campaigns-badge" style={{background:'#f0f0ff',color:'#4f46e5',border:'1px solid #818cf8',fontSize:10}}>🌐 On Landing</span>}
                  </div>

                  <div className="campaigns-card-actions" onClick={e=>e.stopPropagation()}>
                    <select value={c.status}
                      onChange={e=>handleStatusChange(c.id,e.target.value,e)}
                      className="campaigns-status-select">
                      <option value="draft">Draft</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button onClick={e=>handleArchive(c.id,e)} className="campaigns-archive-btn">
                      <FaTrash /> Archive
                    </button>
                  </div>

                  <div className="campaigns-click-hint">Click to open campaign workspace →</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Campaigns;
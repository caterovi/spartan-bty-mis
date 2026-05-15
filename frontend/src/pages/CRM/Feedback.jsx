import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axiosConfig';
import {
  FaComments, FaPlus, FaTimes, FaSearch, FaFilter, FaSave,
  FaUser, FaCalendar, FaStar, FaRegStar, FaCheck, FaEye,
  FaEdit, FaArchive, FaClock, FaExclamationTriangle,
} from "react-icons/fa";

const CRM_USERS = ['CRM User 1', 'CRM User 2', 'CRM User 3', 'CRM User 4'];

const STATUS_FLOW  = ['new','assigned','in-review','contacted','resolved','closed'];
const STATUS_STYLES = {
  new:         { background:'#fff1f5',  color:'#b5536b', border:'1px solid #c4607a' },
  assigned:    { background:'#f0f0ff',  color:'#4f46e5', border:'1px solid #818cf8' },
  'in-review': { background:'#fff7e8',  color:'#9a5f0f', border:'1px solid #d98a1f' },
  contacted:   { background:'#e8f4ff',  color:'#1a5f9a', border:'1px solid #4a90d9' },
  resolved:    { background:'#ecfdf3',  color:'#2f7d56', border:'1px solid #2f9d6a' },
  closed:      { background:'#f8f3f5',  color:'#6b5b63', border:'1px solid #c9b6bf' },
};
const PRIORITY_STYLES = {
  low:    { background:'#ecfdf3', color:'#2f7d56', border:'1px solid #2f9d6a' },
  medium: { background:'#fff7e8', color:'#9a5f0f', border:'1px solid #d98a1f' },
  high:   { background:'#fff1f5', color:'#b5536b', border:'1px solid #c4607a' },
  urgent: { background:'#fef2f2', color:'#dc2626', border:'1px solid #ef4444' },
};
const TYPE_STYLES = {
  complaint:  { background:'#fff1f5', color:'#b5536b', border:'1px solid #c4607a' },
  suggestion: { background:'#fff7e8', color:'#9a5f0f', border:'1px solid #d98a1f' },
  compliment: { background:'#ecfdf3', color:'#2f7d56', border:'1px solid #2f9d6a' },
  inquiry:    { background:'#f8f3f5', color:'#6b5b63', border:'1px solid #c9b6bf' },
};

const fmt = (v) => String(v||'').replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) : '—';
const timeAgo = (d) => {
  const diff = Date.now() - new Date(d); const m=Math.floor(diff/60000), h=Math.floor(diff/3600000), dy=Math.floor(diff/86400000);
  if(dy>0) return `${dy}d ago`; if(h>0) return `${h}h ago`; if(m>0) return `${m}m ago`; return 'just now';
};
const isOverdue = (f) => f.due_date && new Date(f.due_date) < new Date() && !['resolved','closed'].includes(f.status);

const emptyForm = {
  customer_source: 'existing', customer_id: '', customer_name: '',
  email: '', phone: '', address: '',
  type: 'complaint', subject: '', message: '', rating: '5',
  priority: 'medium', assigned_to: '', crm_user: '', due_date: '',
};

function Feedback() {
  const [feedback, setFeedback]         = useState([]);
  const [customers, setCustomers]       = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [viewItem, setViewItem]         = useState(null);
  const [viewActivity, setViewActivity] = useState([]);
  const [message, setMessage]           = useState('');
  const [isError, setIsError]           = useState(false);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNotes, setResolveNotes] = useState({ action_taken:'', resolution_notes:'' });

  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType]     = useState('all');
  const [filterUser, setFilterUser]     = useState('all');
  const [showFilters, setShowFilters]   = useState(false);
  const [form, setForm]                 = useState(emptyForm);

  useEffect(() => { fetchFeedback(); fetchCustomers(); }, []);

  const fetchFeedback  = async () => {
    try { const r = await api.get('/crm/feedback'); setFeedback(r.data||[]); }
    catch(e){ console.error(e); }
  };
  const fetchCustomers = async () => {
    try { const r = await api.get('/crm/customers'); setCustomers(r.data||[]); }
    catch(e){ console.error(e); }
  };

  const notify = (msg, err=false) => {
    setMessage(msg); setIsError(err);
    setTimeout(()=>setMessage(''), 4000);
  };

  const handleSubmit = async () => {
    if (form.customer_source === 'existing' && !form.customer_id) return notify('Please select an existing customer.', true);
    if (form.customer_source === 'new' && !form.customer_name.trim()) return notify('Customer name is required.', true);
    if (!form.subject.trim())  return notify('Subject is required.', true);
    if (!form.message.trim())  return notify('Message is required.', true);
    if (!form.rating)          return notify('Rating is required.', true);
    if (!form.assigned_to)     return notify('Assigned CRM staff is required.', true);
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return notify('Invalid email format.', true);

    try {
      const payload = {
        type: form.type, subject: form.subject, message: form.message,
        rating: form.rating, priority: form.priority,
        assigned_to: form.assigned_to, crm_user: form.crm_user, due_date: form.due_date||null,
      };
      if (form.customer_source === 'existing') {
        payload.customer_id = form.customer_id;
      } else {
        payload.customer_name = form.customer_name;
        payload.email    = form.email||null;
        payload.phone    = form.phone||null;
        payload.address  = form.address||null;
      }
      const r = await api.post('/crm/feedback', payload);
      notify(r.data.message || 'Feedback submitted!');
      setShowForm(false); setForm(emptyForm);
      fetchFeedback(); fetchCustomers();
    } catch(e){ notify(e.response?.data?.message || 'Error submitting feedback.', true); }
  };

  const handleStatusChange = async (id, status, fb) => {
    if (status === 'resolved' && !fb.action_taken && !fb.resolution_notes) {
      setResolveModal({ id, status }); setResolveNotes({action_taken:'',resolution_notes:''}); return;
    }
    try {
      await api.put(`/crm/feedback/${id}/status`, { status });
      fetchFeedback();
    } catch(e){ notify(e.response?.data?.message || 'Error updating status.', true); }
  };

  const handleResolveConfirm = async () => {
    if (!resolveNotes.action_taken.trim() && !resolveNotes.resolution_notes.trim())
      return notify('Please provide Action Taken or Resolution Notes.', true);
    try {
      await api.put(`/crm/feedback/${resolveModal.id}/status`, {
        status: resolveModal.status, ...resolveNotes,
      });
      setResolveModal(null);
      fetchFeedback();
    } catch(e){ notify(e.response?.data?.message || 'Error.', true); }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this feedback?')) return;
    try {
      await api.patch(`/crm/feedback/${id}/archive`);
      notify('Feedback archived.');
      fetchFeedback();
    } catch(e){ notify('Error archiving.', true); }
  };

  const handleViewDetails = async (fb) => {
    setViewItem(fb);
    try {
      const r = await api.get(`/crm/feedback/${fb.id}/activity`);
      setViewActivity(r.data||[]);
    } catch(e){ setViewActivity([]); }
  };

  const clearFilters = () => { setSearch(''); setFilterStatus('all'); setFilterType('all'); setFilterUser('all'); };
  const hasFilters   = search || filterStatus!=='all' || filterType!=='all' || filterUser!=='all';

  const filtered = feedback.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (f.customer_name||'').toLowerCase().includes(q) ||
      (f.subject||'').toLowerCase().includes(q) ||
      (f.message||'').toLowerCase().includes(q);
    const matchStatus = filterStatus==='all' || f.status===filterStatus;
    const matchType   = filterType==='all'   || f.type===filterType;
    const matchUser   = filterUser==='all'   || f.assigned_to===filterUser || f.crm_user===filterUser;
    return matchSearch && matchStatus && matchType && matchUser;
  });

  const selectedCustomer = customers.find(c=>String(c.id)===String(form.customer_id));
  const renderStars = (r) => Array.from({length:5},(_,i)=>
    i < Number(r) ? <FaStar key={i} style={{color:'#d98a1f',fontSize:13}} /> : <FaRegStar key={i} style={{color:'#d8b8c2',fontSize:13}} />
  );

  return (
    <Layout>
      <style>{`
        .fb-page { width:100%; max-width:100%; min-width:0; animation:fbFadeUp 0.35s ease both; }
        .fb-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .fb-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .fb-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .fb-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:760px; }
        .fb-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }
        .fb-toolbar { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; justify-content:space-between; align-items:center; gap:14px; }
        .fb-search-wrap { position:relative; width:280px; max-width:100%; }
        .fb-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b5536b; font-size:13px; pointer-events:none; }
        .fb-search { width:100%; padding:11px 13px 11px 36px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; color:#1f2937; font-size:14px; outline:none; box-sizing:border-box; transition:all 180ms ease; }
        .fb-search:focus { border-color:#c4607a; background:#fff; box-shadow:0 0 0 4px rgba(196,96,122,.12); }
        .fb-toolbar-btns { display:flex; gap:8px; flex-shrink:0; }
        .fb-add-btn,.fb-submit-btn { border:none; border-radius:12px; padding:11px 16px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
        .fb-add-btn:hover,.fb-submit-btn:hover { transform:translateY(-1px); }
        .fb-filter-btn { border:1px solid #d8b8c2; border-radius:12px; padding:10px 14px; background:#fff; color:#64748b; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all 180ms ease; }
        .fb-filter-btn:hover,.fb-filter-active { border-color:#c4607a; color:#b5536b; }
        .fb-filter-active { background:#fff1f5; }
        .fb-msg { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .fb-msg-ok  { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .fb-msg-err { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .fb-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .fb-panel-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .fb-panel-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .fb-panel-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .fb-panel-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .fb-form-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:14px; }
        .fb-field { display:flex; flex-direction:column; gap:6px; }
        .fb-span-2 { grid-column:span 2; }
        .fb-span-3 { grid-column:span 3; }
        .fb-label { font-size:13px; font-weight:800; color:#374151; }
        .fb-label-opt { font-size:11px; font-weight:400; color:#94a3b8; margin-left:4px; }
        .fb-input { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .fb-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .fb-source-toggle { display:flex; gap:8px; margin-bottom:14px; }
        .fb-source-btn { padding:9px 16px; border-radius:10px; border:1px solid #d8b8c2; background:#fff; color:#64748b; font-size:13px; font-weight:800; cursor:pointer; transition:all 180ms ease; }
        .fb-source-btn-active { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; border-color:#c4607a; }
        .fb-cust-info { background:#fff7fa; border:1px solid #ead1d9; border-radius:12px; padding:10px 14px; font-size:12px; color:#64748b; margin-top:6px; }
        .fb-section-divider { font-size:11px; font-weight:800; color:#b5536b; text-transform:uppercase; letter-spacing:.08em; margin:16px 0 12px; padding-bottom:8px; border-bottom:1px solid #f3e8ec; grid-column:span 3; }

        /* PILLS */
        .fb-pill-row { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
        .fb-pill { padding:8px 13px; border-radius:9999px; border:1px solid #d8b8c2; background:#fff; color:#64748b; cursor:pointer; font-size:13px; font-weight:800; transition:all 180ms ease; display:inline-flex; align-items:center; gap:6px; }
        .fb-pill:hover { border-color:#c4607a; transform:translateY(-1px); }
        .fb-pill-active { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; border-color:#c4607a; }
        .fb-pill-count { min-width:20px; height:20px; padding:0 6px; border-radius:9999px; display:inline-flex; align-items:center; justify-content:center; background:rgba(255,255,255,.24); font-size:11px; font-weight:850; }

        /* FILTER PANEL */
        .fb-filter-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }

        /* CARDS */
        .fb-count { margin:0 0 12px; color:#64748b; font-size:13px; font-weight:700; }
        .fb-cards { display:grid; gap:16px; }
        .fb-card { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:20px; position:relative; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.05); transition:all 180ms ease; }
        .fb-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .fb-card:hover { transform:translateY(-2px); border-color:#c4607a; box-shadow:0 4px 16px rgba(0,0,0,.07); }
        .fb-card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:14px; }
        .fb-card-left { display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-width:0; }
        .fb-card-right { display:flex; flex-direction:column; align-items:flex-end; gap:5px; flex-shrink:0; }
        .fb-badge { display:inline-flex; align-items:center; justify-content:center; padding:5px 10px; border-radius:9999px; font-size:11px; font-weight:800; white-space:nowrap; }
        .fb-customer { color:#1f2937; font-size:14px; font-weight:850; }
        .fb-time { display:inline-flex; align-items:center; gap:5px; color:#b5536b; font-size:11px; font-weight:800; }
        .fb-star-row { display:flex; gap:2px; }
        .fb-overdue { display:inline-flex; align-items:center; gap:5px; background:#fef2f2; color:#dc2626; border:1px solid #ef4444; padding:4px 9px; border-radius:9999px; font-size:11px; font-weight:800; }
        .fb-card-body { margin-bottom:14px; padding-bottom:14px; border-bottom:1px solid #f3e8ec; }
        .fb-subject { margin:0 0 6px; color:#1f2937; font-size:15px; font-weight:850; line-height:1.4; }
        .fb-msg-txt { margin:0; color:#374151; font-size:13px; line-height:1.7; }
        .fb-card-meta { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; }
        .fb-meta-item { display:inline-flex; align-items:center; gap:5px; font-size:11px; color:#64748b; font-weight:700; }
        .fb-card-foot { display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap; }
        .fb-status-flow { display:flex; align-items:center; gap:0; overflow-x:auto; padding-bottom:2px; flex:1; }
        .fb-step { display:flex; align-items:center; gap:4px; flex-shrink:0; }
        .fb-step-dot { width:12px; height:12px; border-radius:9999px; display:grid; place-items:center; color:#fff; font-size:7px; flex-shrink:0; }
        .fb-step-label { font-size:11px; white-space:nowrap; font-weight:700; }
        .fb-step-line { width:28px; height:2px; margin:0 4px; border-radius:9999px; flex-shrink:0; }
        .fb-card-actions { display:flex; gap:7px; align-items:center; flex-shrink:0; }
        .fb-btn { border-radius:10px; padding:8px 10px; cursor:pointer; font-size:12px; font-weight:800; display:inline-flex; align-items:center; gap:5px; border:1px solid; transition:all 180ms ease; white-space:nowrap; }
        .fb-btn:hover { transform:translateY(-1px); }
        .fb-btn-view    { background:#e8f4ff; color:#1a5f9a; border-color:#4a90d9; }
        .fb-btn-edit    { background:#fff7e8; color:#9a5f0f; border-color:#d98a1f; }
        .fb-btn-archive { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .fb-status-select { padding:7px 10px; border-radius:10px; border:1px solid #d8b8c2; font-size:12px; font-weight:800; cursor:pointer; outline:none; background:#fff7fa; max-width:140px; }
        .fb-empty { background:radial-gradient(circle at top right,rgba(196,96,122,.1),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px dashed #e2c6cf; border-radius:18px; padding:42px; text-align:center; }
        .fb-empty-title { margin:0 0 8px; color:#1f2937; font-size:18px; font-weight:850; }
        .fb-empty-text { margin:0; color:#64748b; font-size:14px; }

        /* MODALS */
        .fb-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .fb-modal { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:560px; box-shadow:0 20px 60px rgba(0,0,0,.2); max-height:90vh; overflow-y:auto; }
        .fb-modal-lg { max-width:680px; }
        .fb-modal-title { margin:0 0 20px; font-size:20px; font-weight:800; color:#1f2937; padding-bottom:14px; border-bottom:1px solid #f3e8ec; }
        .fb-modal-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f3e8ec; font-size:13px; }
        .fb-modal-row:last-of-type { border-bottom:none; }
        .fb-modal-key { color:#64748b; font-weight:700; }
        .fb-modal-val { color:#1f2937; font-weight:800; text-align:right; max-width:60%; }
        .fb-modal-close { margin-top:20px; width:100%; padding:12px; border:none; border-radius:12px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; }
        .fb-activity-log { margin-top:16px; }
        .fb-activity-item { display:flex; justify-content:space-between; padding:8px 12px; border-radius:10px; background:#fff7fa; border:1px solid #f3e8ec; margin-bottom:6px; font-size:12px; }
        .fb-activity-desc { color:#374151; font-weight:700; }
        .fb-activity-time { color:#94a3b8; font-size:11px; white-space:nowrap; margin-left:10px; }

        @keyframes fbFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width:1180px) { .fb-form-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .fb-span-3,.fb-span-2,.fb-section-divider { grid-column:span 2; } }
        @media (max-width:768px) {
          .fb-hero { align-items:flex-start; padding:20px; }
          .fb-title { font-size:24px; }
          .fb-hero-icon { width:48px; height:48px; font-size:20px; }
          .fb-toolbar { flex-direction:column; align-items:stretch; }
          .fb-toolbar-btns { flex-direction:column; }
          .fb-search-wrap,.fb-add-btn,.fb-filter-btn { width:100%; }
          .fb-form-grid { grid-template-columns:1fr; }
          .fb-span-3,.fb-span-2,.fb-section-divider { grid-column:span 1; }
          .fb-filter-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .fb-card-head,.fb-card-foot { flex-direction:column; align-items:flex-start; }
          .fb-card-actions { width:100%; flex-wrap:wrap; }
          .fb-status-select { width:100%; max-width:100%; }
        }
        @media (max-width:520px) { .fb-hero { flex-direction:column-reverse; } .fb-filter-grid { grid-template-columns:1fr; } }
      `}</style>

      <div className="fb-page">
        {/* HERO */}
        <div className="fb-hero">
          <div>
            <p className="fb-eyebrow">CRM Feedback Center</p>
            <h3 className="fb-title">Customer Feedback</h3>
            <p className="fb-subtitle">Record, assign, track, and resolve customer feedback — customers are auto-created on new submissions.</p>
          </div>
          <div className="fb-hero-icon"><FaComments /></div>
        </div>

        {/* TOOLBAR */}
        <div className="fb-toolbar">
          <div className="fb-search-wrap">
            <FaSearch className="fb-search-icon" />
            <input type="text" placeholder="Search feedback..." value={search}
              onChange={e=>setSearch(e.target.value)} className="fb-search" />
          </div>
          <div className="fb-toolbar-btns">
            <button className={`fb-filter-btn${hasFilters?' fb-filter-active':''}`} onClick={()=>setShowFilters(!showFilters)}>
              <FaFilter /> Filters {hasFilters ? '● Active' : ''}
            </button>
            <button className="fb-add-btn" onClick={()=>{setShowForm(!showForm);setEditItem(null);}}>
              {showForm ? <FaTimes /> : <FaPlus />}
              {showForm ? 'Cancel' : 'Add Feedback'}
            </button>
          </div>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className={`fb-msg ${isError?'fb-msg-err':'fb-msg-ok'}`}>{message}</div>
        )}

        {/* FILTERS */}
        {showFilters && (
          <div className="fb-panel">
            <div className="fb-panel-header">
              <div className="fb-panel-icon"><FaFilter /></div>
              <div>
                <h4 className="fb-panel-title">Filter Options</h4>
                <p className="fb-panel-note">Narrow results by type, status, or assigned staff.</p>
              </div>
              {hasFilters && <button onClick={clearFilters} style={{marginLeft:'auto',padding:'8px 14px',border:'1px solid #c4607a',borderRadius:10,background:'#fff1f5',color:'#b5536b',cursor:'pointer',fontWeight:800,fontSize:12}}>
                <FaTimes /> Clear
              </button>}
            </div>
            <div className="fb-filter-grid">
              {[
                { label:'Type', value:filterType, setter:setFilterType, options:['all','complaint','suggestion','compliment','inquiry'] },
                { label:'Status', value:filterStatus, setter:setFilterStatus, options:['all',...STATUS_FLOW] },
                { label:'Assigned To', value:filterUser, setter:setFilterUser, options:['all',...CRM_USERS] },
              ].map(({label,value,setter,options})=>(
                <div key={label} style={{display:'flex',flexDirection:'column',gap:6}}>
                  <label style={{fontSize:13,fontWeight:800,color:'#374151'}}>{label}</label>
                  <select value={value} onChange={e=>setter(e.target.value)} className="fb-input">
                    {options.map(o=><option key={o} value={o}>{o==='all'?`All ${label}s`:fmt(o)}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATUS PILLS */}
        <div className="fb-pill-row">
          {['all','new','in-review','resolved','closed'].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              className={`fb-pill${filterStatus===s?' fb-pill-active':''}`}>
              {s==='all'?'All':fmt(s)}
              {s!=='all' && <span className="fb-pill-count">{feedback.filter(f=>f.status===s).length}</span>}
            </button>
          ))}
        </div>

        {/* ADD FORM */}
        {showForm && (
          <div className="fb-panel">
            <div className="fb-panel-header">
              <div className="fb-panel-icon"><FaPlus /></div>
              <div>
                <h4 className="fb-panel-title">Add Feedback</h4>
                <p className="fb-panel-note">Select an existing customer or enter new customer details. New customers are auto-created.</p>
              </div>
            </div>

            {/* CUSTOMER SOURCE */}
            <div className="fb-source-toggle">
              <button className={`fb-source-btn${form.customer_source==='existing'?' fb-source-btn-active':''}`}
                onClick={()=>setForm({...form,customer_source:'existing',customer_id:'',customer_name:''})}>
                Select Existing Customer
              </button>
              <button className={`fb-source-btn${form.customer_source==='new'?' fb-source-btn-active':''}`}
                onClick={()=>setForm({...form,customer_source:'new',customer_id:''})}>
                New Customer from Feedback
              </button>
            </div>

            <div className="fb-form-grid">
              {/* CUSTOMER SECTION */}
              {form.customer_source === 'existing' ? (
                <div className="fb-field fb-span-3">
                  <label className="fb-label">Existing Customer *</label>
                  <select value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value})} className="fb-input">
                    <option value="">— Select a customer —</option>
                    {customers.map(c=>(
                      <option key={c.id} value={c.id}>{c.full_name}{c.email?` — ${c.email}`:''}{c.phone?` — ${c.phone}`:''}</option>
                    ))}
                  </select>
                  {selectedCustomer && (
                    <div className="fb-cust-info">
                      📧 {selectedCustomer.email||'No email'} &nbsp;|&nbsp; 📞 {selectedCustomer.phone||'No phone'} &nbsp;|&nbsp; Segment: {selectedCustomer.segment||'New Customer'}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="fb-field fb-span-3"><div className="fb-section-divider">New Customer Details</div></div>
                  <div className="fb-field">
                    <label className="fb-label">Customer Name *</label>
                    <input type="text" placeholder="Full name" value={form.customer_name}
                      onChange={e=>setForm({...form,customer_name:e.target.value})} className="fb-input" />
                  </div>
                  <div className="fb-field">
                    <label className="fb-label">Email <span className="fb-label-opt">optional</span></label>
                    <input type="email" placeholder="email@example.com" value={form.email}
                      onChange={e=>setForm({...form,email:e.target.value})} className="fb-input" />
                  </div>
                  <div className="fb-field">
                    <label className="fb-label">Phone <span className="fb-label-opt">optional</span></label>
                    <input type="text" placeholder="09XXXXXXXXX" value={form.phone}
                      onChange={e=>setForm({...form,phone:e.target.value})} className="fb-input" />
                  </div>
                  <div className="fb-field fb-span-3">
                    <label className="fb-label">Address <span className="fb-label-opt">optional</span></label>
                    <input type="text" placeholder="Customer address" value={form.address}
                      onChange={e=>setForm({...form,address:e.target.value})} className="fb-input" />
                  </div>
                </>
              )}

              {/* FEEDBACK SECTION */}
              <div className="fb-field fb-span-3"><div className="fb-section-divider">Feedback Details</div></div>
              <div className="fb-field">
                <label className="fb-label">Type *</label>
                <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="fb-input">
                  {['complaint','suggestion','compliment','inquiry'].map(t=><option key={t} value={t}>{fmt(t)}</option>)}
                </select>
              </div>
              <div className="fb-field">
                <label className="fb-label">Priority *</label>
                <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="fb-input">
                  {['low','medium','high','urgent'].map(p=><option key={p} value={p}>{fmt(p)}</option>)}
                </select>
              </div>
              <div className="fb-field">
                <label className="fb-label">Rating *</label>
                <select value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})} className="fb-input">
                  {[5,4,3,2,1].map(r=><option key={r} value={r}>{r}/5 {'⭐'.repeat(r)}</option>)}
                </select>
              </div>
              <div className="fb-field fb-span-2">
                <label className="fb-label">Subject *</label>
                <input type="text" placeholder="Brief subject" value={form.subject}
                  onChange={e=>setForm({...form,subject:e.target.value})} className="fb-input" />
              </div>
              <div className="fb-field">
                <label className="fb-label">Due Date <span className="fb-label-opt">optional</span></label>
                <input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} className="fb-input" />
              </div>
              <div className="fb-field">
                <label className="fb-label">Assigned To *</label>
                <select value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})} className="fb-input">
                  <option value="">Select CRM Staff</option>
                  {CRM_USERS.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="fb-field">
                <label className="fb-label">CRM User <span className="fb-label-opt">optional</span></label>
                <select value={form.crm_user} onChange={e=>setForm({...form,crm_user:e.target.value})} className="fb-input">
                  <option value="">Select CRM User</option>
                  {CRM_USERS.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="fb-field fb-span-3">
                <label className="fb-label">Message *</label>
                <textarea placeholder="Detailed feedback message..." value={form.message}
                  onChange={e=>setForm({...form,message:e.target.value})}
                  className="fb-input" style={{minHeight:90,resize:'vertical'}} />
              </div>
            </div>
            <button onClick={handleSubmit} className="fb-submit-btn"><FaSave /> Submit Feedback</button>
          </div>
        )}

        <p className="fb-count">{filtered.length} feedback{filtered.length!==1?'s':''} found</p>

        {filtered.length === 0 ? (
          <div className="fb-empty">
            <p className="fb-empty-title">No feedback found</p>
            <p className="fb-empty-text">{hasFilters ? 'Try adjusting your filters.' : 'No feedback submitted yet. Add the first one above.'}</p>
          </div>
        ) : (
          <div className="fb-cards">
            {filtered.map(f => {
              const curIdx = STATUS_FLOW.indexOf(f.status);
              return (
                <div key={f.id} className="fb-card">
                  <div className="fb-card-head">
                    <div className="fb-card-left">
                      <span className="fb-badge" style={TYPE_STYLES[f.type]||TYPE_STYLES.inquiry}>{fmt(f.type)}</span>
                      <span className="fb-badge" style={PRIORITY_STYLES[f.priority]||PRIORITY_STYLES.medium}>{fmt(f.priority)}</span>
                      <span className="fb-customer">{f.customer_name||'Unknown'}</span>
                      {f.assigned_to && (
                        <span style={{display:'inline-flex',alignItems:'center',gap:5,background:'#fff7fa',border:'1px solid #ead1d9',borderRadius:9999,padding:'4px 9px',fontSize:11,fontWeight:700,color:'#64748b'}}>
                          <FaUser style={{fontSize:9}} /> {f.assigned_to}
                        </span>
                      )}
                      {isOverdue(f) && (
                        <span className="fb-overdue"><FaExclamationTriangle style={{fontSize:9}} /> Overdue</span>
                      )}
                    </div>
                    <div className="fb-card-right">
                      <div className="fb-star-row">{[...Array(5)].map((_,i)=>
                        i<Number(f.rating)
                          ? <FaStar key={i} style={{color:'#d98a1f',fontSize:13}} />
                          : <FaRegStar key={i} style={{color:'#d8b8c2',fontSize:13}} />
                      )}</div>
                      <span className="fb-time"><FaCalendar />{timeAgo(f.created_at)}</span>
                    </div>
                  </div>

                  <div className="fb-card-body">
                    <h4 className="fb-subject">{f.subject}</h4>
                    <p className="fb-msg-txt">{f.message}</p>
                  </div>

                  <div className="fb-card-meta">
                    {f.due_date && (
                      <span className="fb-meta-item">
                        <FaClock style={{color:'#b5536b'}} /> Due: {fmtDate(f.due_date)}
                      </span>
                    )}
                    {f.follow_up_status && f.follow_up_status !== 'not-started' && (
                      <span className="fb-meta-item">Follow-up: {fmt(f.follow_up_status)}</span>
                    )}
                  </div>

                  <div className="fb-card-foot">
                    {/* STATUS FLOW */}
                    <div className="fb-status-flow">
                      {STATUS_FLOW.map((s,i) => {
                        const isCur  = f.status === s;
                        const isDone = curIdx > i;
                        const dotColor = isCur ? '#c4607a' : isDone ? '#2f9d6a' : '#d8b8c2';
                        const lblColor = isCur ? '#c4607a' : isDone ? '#2f9d6a' : '#94a3b8';
                        return (
                          <div key={s} className="fb-step">
                            <div className="fb-step-dot" style={{backgroundColor:dotColor}}>
                              {isDone && <FaCheck />}
                            </div>
                            <span className="fb-step-label" style={{color:lblColor,fontWeight:isCur?850:700}}>{fmt(s)}</span>
                            {i < STATUS_FLOW.length-1 && (
                              <div className="fb-step-line" style={{backgroundColor:isDone?'#2f9d6a':'#ead1d9'}} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="fb-card-actions">
                      <select value={f.status} onChange={e=>handleStatusChange(f.id,e.target.value,f)}
                        className="fb-status-select">
                        {STATUS_FLOW.map(s=><option key={s} value={s}>{fmt(s)}</option>)}
                      </select>
                      <button className="fb-btn fb-btn-view" onClick={()=>handleViewDetails(f)}><FaEye /> View</button>
                      <button className="fb-btn fb-btn-archive" onClick={()=>handleArchive(f.id)}><FaArchive /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RESOLVE MODAL */}
      {resolveModal && (
        <div className="fb-modal-overlay" onClick={()=>setResolveModal(null)}>
          <div className="fb-modal" onClick={e=>e.stopPropagation()}>
            <h3 className="fb-modal-title">Resolve Feedback</h3>
            <p style={{fontSize:13,color:'#64748b',marginBottom:16}}>Please provide Action Taken or Resolution Notes before marking as Resolved.</p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={{fontSize:13,fontWeight:800,color:'#374151',display:'block',marginBottom:6}}>Action Taken</label>
                <textarea value={resolveNotes.action_taken} onChange={e=>setResolveNotes({...resolveNotes,action_taken:e.target.value})}
                  placeholder="What action was taken?" className="fb-input" style={{minHeight:80,resize:'vertical'}} />
              </div>
              <div>
                <label style={{fontSize:13,fontWeight:800,color:'#374151',display:'block',marginBottom:6}}>Resolution Notes</label>
                <textarea value={resolveNotes.resolution_notes} onChange={e=>setResolveNotes({...resolveNotes,resolution_notes:e.target.value})}
                  placeholder="Resolution details..." className="fb-input" style={{minHeight:80,resize:'vertical'}} />
              </div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button onClick={handleResolveConfirm} className="fb-submit-btn" style={{flex:1}}><FaCheck /> Mark Resolved</button>
              <button onClick={()=>setResolveModal(null)} style={{padding:'12px 18px',border:'1px solid #d8b8c2',borderRadius:12,background:'#fff',color:'#64748b',fontWeight:800,cursor:'pointer',fontSize:14}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewItem && (
        <div className="fb-modal-overlay" onClick={()=>setViewItem(null)}>
          <div className="fb-modal fb-modal-lg" onClick={e=>e.stopPropagation()}>
            <h3 className="fb-modal-title">Feedback Details</h3>
            {[
              ['Customer',        viewItem.customer_name||'—'],
              ['Customer Email',  viewItem.customer_email||'—'],
              ['Customer Phone',  viewItem.customer_phone||'—'],
              ['Type',            fmt(viewItem.type)],
              ['Subject',         viewItem.subject],
              ['Rating',          `${viewItem.rating}/5`],
              ['Priority',        fmt(viewItem.priority)],
              ['Assigned To',     viewItem.assigned_to||'—'],
              ['CRM User',        viewItem.crm_user||'—'],
              ['Due Date',        fmtDate(viewItem.due_date)],
              ['Status',          fmt(viewItem.status)],
              ['Follow-up',       fmt(viewItem.follow_up_status)],
              ['Action Taken',    viewItem.action_taken||'—'],
              ['Resolution Notes',viewItem.resolution_notes||'—'],
              ['Resolved At',     viewItem.resolved_at ? new Date(viewItem.resolved_at).toLocaleString() : '—'],
              ['Closed At',       viewItem.closed_at ? new Date(viewItem.closed_at).toLocaleString() : '—'],
              ['Created At',      new Date(viewItem.created_at).toLocaleString()],
            ].map(([k,v])=>(
              <div key={k} className="fb-modal-row">
                <span className="fb-modal-key">{k}</span>
                <span className="fb-modal-val">{v}</span>
              </div>
            ))}
            {viewItem.message && (
              <div style={{marginTop:14,padding:'12px 14px',background:'#fff7fa',borderRadius:12,border:'1px solid #ead1d9',fontSize:13,color:'#374151',lineHeight:1.7}}>
                {viewItem.message}
              </div>
            )}
            {viewActivity.length > 0 && (
              <div className="fb-activity-log">
                <div style={{fontWeight:800,color:'#b5536b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Activity Log</div>
                {viewActivity.map(a=>(
                  <div key={a.id} className="fb-activity-item">
                    <span className="fb-activity-desc">{a.action_type} — {a.description}</span>
                    <span className="fb-activity-time">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="fb-modal-close" onClick={()=>setViewItem(null)}>Close</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Feedback;
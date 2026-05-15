import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaUsers, FaPlus, FaTimes, FaSearch, FaSave, FaEdit,
  FaArchive, FaEye, FaUser, FaEnvelope, FaPhone,
  FaMapMarkerAlt, FaCalendar, FaTag,
} from "react-icons/fa";

const SEGMENTS = [
  'New Customer','Repeat Customer','VIP Customer','At Risk Customer',
  'Inactive Customer','High Satisfaction Customer','Complaint History',
];

const SEGMENT_STYLES = {
  'New Customer':              { background:'#e8f4ff', color:'#1a5f9a', border:'1px solid #4a90d9' },
  'Repeat Customer':           { background:'#ecfdf3', color:'#2f7d56', border:'1px solid #2f9d6a' },
  'VIP Customer':              { background:'#fefce8', color:'#854d0e', border:'1px solid #ca8a04' },
  'At Risk Customer':          { background:'#fef2f2', color:'#dc2626', border:'1px solid #ef4444' },
  'Inactive Customer':         { background:'#f8f3f5', color:'#6b5b63', border:'1px solid #c9b6bf' },
  'High Satisfaction Customer':{ background:'#ecfdf3', color:'#2f7d56', border:'1px solid #2f9d6a' },
  'Complaint History':         { background:'#fff1f5', color:'#b5536b', border:'1px solid #c4607a' },
};

const emptyEditForm = {
  full_name:'', email:'', phone:'', address:'',
  notes:'', segment:'New Customer', last_contacted_at:'',
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [viewActivity, setViewActivity] = useState([]);
  const [message, setMessage]     = useState('');
  const [isError, setIsError]     = useState(false);
  const [search, setSearch]       = useState('');
  const [editForm, setEditForm]   = useState(emptyEditForm);
  const [manualForm, setManualForm] = useState({ full_name:'', email:'', phone:'', address:'', segment:'New Customer', notes:'' });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try { const r = await api.get('/crm/customers'); setCustomers(r.data||[]); }
    catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  const notify = (msg, err=false) => {
    setMessage(msg); setIsError(err);
    setTimeout(()=>setMessage(''), 3500);
  };

  const handleManualAdd = async () => {
    if (!manualForm.full_name.trim()) return notify('Full name is required.', true);
    if (manualForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualForm.email)) return notify('Invalid email format.', true);
    try {
      await api.post('/crm/customers', manualForm);
      notify('Customer added successfully!');
      setShowForm(false); setManualForm({full_name:'',email:'',phone:'',address:'',segment:'New Customer',notes:''});
      fetchCustomers();
    } catch(e){ notify(e.response?.data?.message||'Error adding customer.', true); }
  };

  const handleUpdate = async () => {
    if (!editForm.full_name.trim()) return notify('Full name is required.', true);
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) return notify('Invalid email format.', true);
    try {
      await api.put(`/crm/customers/${editId}`, editForm);
      notify('Customer updated successfully!');
      setEditId(null);
      fetchCustomers();
    } catch(e){ notify(e.response?.data?.message||'Error updating.', true); }
  };

  const handleArchive = async (cust) => {
    if (!window.confirm(`Archive "${cust.full_name}"? They will no longer appear in active CRM lists.`)) return;
    try {
      await api.patch(`/crm/customers/${cust.id}/archive`);
      notify('Customer archived.');
      fetchCustomers();
    } catch(e){ notify('Error archiving.', true); }
  };

  const handleViewDetails = async (cust) => {
    try {
      const [details, activity] = await Promise.all([
        api.get(`/crm/customers/${cust.id}`),
        api.get(`/crm/customers/${cust.id}/activity`),
      ]);
      setViewCustomer(details.data);
      setViewActivity(activity.data||[]);
    } catch(e){ setViewCustomer(cust); setViewActivity([]); }
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q ||
      (c.full_name||'').toLowerCase().includes(q) ||
      (c.email||'').toLowerCase().includes(q) ||
      (c.phone||'').includes(search) ||
      (c.segment||'').toLowerCase().includes(q);
  });

  const money = (v) => `₱${Number(v||0).toLocaleString()}`;

  return (
    <Layout>
      <style>{`
        .cust-page { width:100%; max-width:100%; min-width:0; animation:custFadeUp 0.35s ease both; }
        .cust-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .cust-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .cust-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .cust-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .cust-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }
        .cust-auto-note { background:#fff7e8; border:1px solid #d98a1f; border-radius:12px; padding:10px 14px; margin-bottom:16px; font-size:13px; color:#9a5f0f; font-weight:600; display:flex; align-items:center; gap:8px; }
        .cust-toolbar { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; justify-content:space-between; align-items:center; gap:14px; }
        .cust-search-wrap { position:relative; width:280px; max-width:100%; }
        .cust-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b5536b; font-size:13px; pointer-events:none; }
        .cust-search { width:100%; padding:11px 13px 11px 36px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; color:#1f2937; font-size:14px; outline:none; box-sizing:border-box; transition:all 180ms ease; }
        .cust-search:focus { border-color:#c4607a; background:#fff; box-shadow:0 0 0 4px rgba(196,96,122,.12); }
        .cust-manual-btn { border:1.5px solid #d8b8c2; border-radius:12px; padding:9px 14px; background:#fff; color:#64748b; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all 180ms ease; white-space:nowrap; }
        .cust-manual-btn:hover { border-color:#c4607a; color:#b5536b; }
        .cust-submit-btn { border:none; border-radius:12px; padding:11px 16px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
        .cust-submit-btn:hover { transform:translateY(-1px); }
        .cust-cancel-btn { border:1px solid #d8b8c2; border-radius:12px; padding:11px 16px; background:#fff; color:#64748b; font-size:14px; font-weight:800; cursor:pointer; }
        .cust-msg { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .cust-msg-ok  { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .cust-msg-err { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .cust-form { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .cust-form-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .cust-form-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .cust-form-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .cust-form-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .cust-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:14px; }
        .cust-field { display:flex; flex-direction:column; gap:6px; }
        .cust-span-3 { grid-column:span 3; }
        .cust-label { font-size:13px; font-weight:800; color:#374151; }
        .cust-input { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .cust-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .cust-form-actions { display:flex; gap:10px; flex-wrap:wrap; }
        .cust-count { margin:0 0 12px; color:#64748b; font-size:13px; font-weight:700; }
        .cust-table-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); overflow:hidden; }
        .cust-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; border:1px solid #ead1d9; border-radius:14px; }
        .cust-table { width:100%; min-width:900px; border-collapse:collapse; background:#fff; }
        .cust-table thead { background:#fff7fa; }
        .cust-table th { padding:13px 16px; text-align:left; font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #ead1d9; white-space:nowrap; }
        .cust-table td { padding:14px 16px; font-size:14px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; vertical-align:middle; }
        .cust-table tbody tr:hover { background:#fff7fa; }
        .cust-table tbody tr:last-child td { border-bottom:none; }
        .cust-name { font-weight:850; color:#1f2937; }
        .cust-email { font-size:12px; color:#94a3b8; margin-top:3px; }
        .cust-cell-icon { display:inline-flex; align-items:center; gap:7px; }
        .cust-cell-icon svg { color:#b5536b; flex:0 0 auto; }
        .cust-badge { display:inline-flex; align-items:center; justify-content:center; padding:5px 10px; border-radius:9999px; font-size:11px; font-weight:800; white-space:nowrap; }
        .cust-action-row { display:flex; gap:7px; align-items:center; }
        .cust-btn { border-radius:10px; padding:8px 10px; cursor:pointer; font-size:12px; font-weight:800; display:inline-flex; align-items:center; gap:5px; border:1px solid; transition:all 180ms ease; }
        .cust-btn:hover { transform:translateY(-1px); }
        .cust-btn-view    { background:#e8f4ff; color:#1a5f9a; border-color:#4a90d9; }
        .cust-btn-edit    { background:#fff7e8; color:#9a5f0f; border-color:#d98a1f; }
        .cust-btn-archive { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .cust-empty { padding:40px!important; text-align:center; color:#94a3b8!important; font-size:14px!important; font-weight:700; }
        .cust-stat { display:inline-flex; flex-direction:column; align-items:center; }
        .cust-stat-val { font-weight:850; font-size:15px; color:#1f2937; }
        .cust-stat-lbl { font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; }
        /* MODAL */
        .cust-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .cust-modal { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:620px; box-shadow:0 20px 60px rgba(0,0,0,.2); max-height:90vh; overflow-y:auto; }
        .cust-modal-title { margin:0 0 20px; font-size:20px; font-weight:800; color:#1f2937; padding-bottom:14px; border-bottom:1px solid #f3e8ec; display:flex; align-items:center; justify-content:space-between; }
        .cust-modal-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f3e8ec; font-size:13px; }
        .cust-modal-row:last-of-type { border-bottom:none; }
        .cust-modal-key { color:#64748b; font-weight:700; }
        .cust-modal-val { color:#1f2937; font-weight:800; text-align:right; max-width:60%; }
        .cust-modal-close { margin-top:20px; width:100%; padding:12px; border:none; border-radius:12px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; }
        .cust-feedback-item { background:#fff7fa; border:1px solid #ead1d9; border-radius:12px; padding:12px 14px; margin-bottom:8px; }
        .cust-feedback-subject { font-weight:800; color:#1f2937; font-size:13px; margin-bottom:4px; }
        .cust-feedback-meta { font-size:11px; color:#64748b; display:flex; gap:10px; flex-wrap:wrap; }
        .cust-activity-item { display:flex; justify-content:space-between; padding:7px 10px; border-radius:10px; background:#fff7fa; border:1px solid #f3e8ec; margin-bottom:5px; font-size:12px; }
        @keyframes custFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width:1180px) { .cust-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .cust-span-3 { grid-column:span 2; } }
        @media (max-width:768px) {
          .cust-hero { align-items:flex-start; padding:20px; }
          .cust-title { font-size:24px; }
          .cust-hero-icon { width:48px; height:48px; font-size:20px; }
          .cust-toolbar { flex-direction:column; align-items:stretch; }
          .cust-search-wrap,.cust-manual-btn { width:100%; }
          .cust-grid { grid-template-columns:1fr; }
          .cust-span-3 { grid-column:span 1; }
          .cust-form-actions { flex-direction:column; }
          .cust-submit-btn,.cust-cancel-btn { width:100%; }
          .cust-table-panel { padding:12px; }
          .cust-table { min-width:820px; }
        }
        @media (max-width:520px) { .cust-hero { flex-direction:column-reverse; } }
      `}</style>

      <div className="cust-page">
        {/* HERO */}
        <div className="cust-hero">
          <div>
            <p className="cust-eyebrow">CRM Customer Records</p>
            <h3 className="cust-title">Customers</h3>
            <p className="cust-subtitle">
              Customer records are auto-created when feedback is submitted. View profiles, edit details, and manage segments here.
            </p>
          </div>
          <div className="cust-hero-icon"><FaUsers /></div>
        </div>

        <div className="cust-auto-note">
          ℹ️ Customers are automatically created when new feedback is submitted. Use <strong>Manual Add</strong> only for walk-in, phone inquiry, or pre-existing customers.
        </div>

        {/* TOOLBAR */}
        <div className="cust-toolbar">
          <div className="cust-search-wrap">
            <FaSearch className="cust-search-icon" />
            <input type="text" placeholder="Search customers..." value={search}
              onChange={e=>setSearch(e.target.value)} className="cust-search" />
          </div>
          <button className="cust-manual-btn" onClick={()=>setShowForm(!showForm)}>
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'Manual Add'}
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className={`cust-msg ${isError?'cust-msg-err':'cust-msg-ok'}`}>{message}</div>
        )}

        {/* MANUAL ADD FORM */}
        {showForm && (
          <div className="cust-form">
            <div className="cust-form-header">
              <div className="cust-form-icon"><FaUser /></div>
              <div>
                <h4 className="cust-form-title">Manual Add Customer</h4>
                <p className="cust-form-note">Use for walk-in customers, phone inquiries, or pre-existing customer records.</p>
              </div>
            </div>
            <div className="cust-grid">
              <div className="cust-field">
                <label className="cust-label">Full Name *</label>
                <input type="text" placeholder="Full name" value={manualForm.full_name}
                  onChange={e=>setManualForm({...manualForm,full_name:e.target.value})} className="cust-input" />
              </div>
              <div className="cust-field">
                <label className="cust-label">Email</label>
                <input type="email" placeholder="email@example.com" value={manualForm.email}
                  onChange={e=>setManualForm({...manualForm,email:e.target.value})} className="cust-input" />
              </div>
              <div className="cust-field">
                <label className="cust-label">Phone</label>
                <input type="text" placeholder="09XXXXXXXXX" value={manualForm.phone}
                  onChange={e=>setManualForm({...manualForm,phone:e.target.value})} className="cust-input" />
              </div>
              <div className="cust-field">
                <label className="cust-label">Segment</label>
                <select value={manualForm.segment} onChange={e=>setManualForm({...manualForm,segment:e.target.value})} className="cust-input">
                  {SEGMENTS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="cust-field cust-span-3">
                <label className="cust-label">Address</label>
                <input type="text" placeholder="Customer address" value={manualForm.address}
                  onChange={e=>setManualForm({...manualForm,address:e.target.value})} className="cust-input" />
              </div>
              <div className="cust-field cust-span-3">
                <label className="cust-label">Notes</label>
                <input type="text" placeholder="Optional notes" value={manualForm.notes}
                  onChange={e=>setManualForm({...manualForm,notes:e.target.value})} className="cust-input" />
              </div>
            </div>
            <button onClick={handleManualAdd} className="cust-submit-btn"><FaSave /> Save Customer</button>
          </div>
        )}

        {/* EDIT FORM */}
        {editId && (
          <div className="cust-form">
            <div className="cust-form-header">
              <div className="cust-form-icon"><FaEdit /></div>
              <div>
                <h4 className="cust-form-title">Edit Customer</h4>
                <p className="cust-form-note">Update customer details, segment, and notes.</p>
              </div>
            </div>
            <div className="cust-grid">
              <div className="cust-field">
                <label className="cust-label">Full Name *</label>
                <input type="text" value={editForm.full_name}
                  onChange={e=>setEditForm({...editForm,full_name:e.target.value})} className="cust-input" />
              </div>
              <div className="cust-field">
                <label className="cust-label">Email</label>
                <input type="email" value={editForm.email||''}
                  onChange={e=>setEditForm({...editForm,email:e.target.value})} className="cust-input" />
              </div>
              <div className="cust-field">
                <label className="cust-label">Phone</label>
                <input type="text" value={editForm.phone||''}
                  onChange={e=>setEditForm({...editForm,phone:e.target.value})} className="cust-input" />
              </div>
              <div className="cust-field">
                <label className="cust-label">Segment</label>
                <select value={editForm.segment||'New Customer'}
                  onChange={e=>setEditForm({...editForm,segment:e.target.value})} className="cust-input">
                  {SEGMENTS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="cust-field">
                <label className="cust-label">Last Contacted</label>
                <input type="datetime-local" value={editForm.last_contacted_at||''}
                  onChange={e=>setEditForm({...editForm,last_contacted_at:e.target.value})} className="cust-input" />
              </div>
              <div className="cust-field cust-span-3">
                <label className="cust-label">Address</label>
                <input type="text" value={editForm.address||''}
                  onChange={e=>setEditForm({...editForm,address:e.target.value})} className="cust-input" />
              </div>
              <div className="cust-field cust-span-3">
                <label className="cust-label">Notes</label>
                <textarea value={editForm.notes||''} onChange={e=>setEditForm({...editForm,notes:e.target.value})}
                  className="cust-input" style={{minHeight:70,resize:'vertical'}} />
              </div>
            </div>
            <div className="cust-form-actions">
              <button onClick={handleUpdate} className="cust-submit-btn"><FaSave /> Save Changes</button>
              <button onClick={()=>setEditId(null)} className="cust-cancel-btn">Cancel</button>
            </div>
          </div>
        )}

        <p className="cust-count">{filtered.length} customer{filtered.length!==1?'s':''} found</p>

        {/* TABLE */}
        <div className="cust-table-panel">
          {loading ? (
            <div style={{padding:40,textAlign:'center',color:'#64748b',fontWeight:700}}>⏳ Loading customers...</div>
          ) : (
            <div className="cust-table-wrap">
              <table className="cust-table">
                <thead>
                  <tr>
                    <th>Customer</th><th>Contact</th><th>Segment</th>
                    <th>Feedback</th><th>Avg Rating</th><th>Added</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="cust-empty">
                        {customers.length === 0
                          ? '👥 No customer records yet. Customers will appear automatically after feedback is submitted.'
                          : '🔍 No customers match your search.'}
                      </td>
                    </tr>
                  ) : filtered.map(c=>(
                    <tr key={c.id}>
                      <td>
                        <div className="cust-cell-icon">
                          <FaUser />
                          <div>
                            <div className="cust-name">{c.full_name}</div>
                            <div className="cust-email">{c.email||'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{display:'flex',flexDirection:'column',gap:3}}>
                          {c.phone && <span className="cust-cell-icon"><FaPhone />{c.phone}</span>}
                          {c.address && <span className="cust-cell-icon" style={{fontSize:12,color:'#94a3b8'}}><FaMapMarkerAlt />{c.address.slice(0,25)}{c.address.length>25?'…':''}</span>}
                          {!c.phone && !c.address && <span style={{color:'#94a3b8',fontSize:12}}>—</span>}
                        </div>
                      </td>
                      <td>
                        <span className="cust-badge" style={SEGMENT_STYLES[c.segment]||SEGMENT_STYLES['New Customer']}>
                          <FaTag style={{fontSize:9,marginRight:4}} />{c.segment||'New Customer'}
                        </span>
                      </td>
                      <td style={{textAlign:'center',fontWeight:850,color:'#1f2937'}}>{c.total_feedback||0}</td>
                      <td style={{textAlign:'center',fontWeight:850,color:Number(c.average_rating)>=4?'#2f7d56':Number(c.average_rating)>=3?'#9a5f0f':'#b5536b'}}>
                        {c.average_rating ? `${c.average_rating} ⭐` : '—'}
                      </td>
                      <td>
                        <span className="cust-cell-icon"><FaCalendar />
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td>
                        <div className="cust-action-row">
                          <button className="cust-btn cust-btn-view" onClick={()=>handleViewDetails(c)}><FaEye /> View</button>
                          <button className="cust-btn cust-btn-edit" onClick={()=>{
                            setEditId(c.id);
                            setEditForm({
                              full_name:c.full_name||'', email:c.email||'', phone:c.phone||'',
                              address:c.address||'', notes:c.notes||'', segment:c.segment||'New Customer',
                              last_contacted_at:c.last_contacted_at?.slice(0,16)||'',
                            });
                            setShowForm(false);
                          }}><FaEdit /> Edit</button>
                          <button className="cust-btn cust-btn-archive" onClick={()=>handleArchive(c)}><FaArchive /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* VIEW CUSTOMER MODAL */}
      {viewCustomer && (
        <div className="cust-modal-overlay" onClick={()=>setViewCustomer(null)}>
          <div className="cust-modal" onClick={e=>e.stopPropagation()}>
            <h3 className="cust-modal-title">
              Customer 360 — {viewCustomer.full_name}
              <span className="cust-badge" style={SEGMENT_STYLES[viewCustomer.segment]||SEGMENT_STYLES['New Customer']}>
                {viewCustomer.segment||'New Customer'}
              </span>
            </h3>

            {/* STATS */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:18}}>
              {[
                ['Total Feedback', viewCustomer.total_feedback||0],
                ['Unresolved',     viewCustomer.unresolved_feedback||0],
                ['Avg Rating',     viewCustomer.average_rating||'—'],
                ['Last Feedback',  viewCustomer.last_feedback_date ? new Date(viewCustomer.last_feedback_date).toLocaleDateString() : '—'],
              ].map(([l,v])=>(
                <div key={l} style={{background:'#fff7fa',border:'1px solid #ead1d9',borderRadius:12,padding:'12px',textAlign:'center'}}>
                  <div style={{fontWeight:850,fontSize:18,color:'#1f2937'}}>{v}</div>
                  <div style={{fontSize:10,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>

            {/* DETAILS */}
            {[
              ['Email',         viewCustomer.email||'—'],
              ['Phone',         viewCustomer.phone||'—'],
              ['Address',       viewCustomer.address||'—'],
              ['Notes',         viewCustomer.notes||'—'],
              ['Last Contacted',viewCustomer.last_contacted_at ? new Date(viewCustomer.last_contacted_at).toLocaleString() : '—'],
              ['Added On',      viewCustomer.created_at ? new Date(viewCustomer.created_at).toLocaleDateString() : '—'],
            ].map(([k,v])=>(
              <div key={k} className="cust-modal-row">
                <span className="cust-modal-key">{k}</span>
                <span className="cust-modal-val">{v}</span>
              </div>
            ))}

            {/* FEEDBACK HISTORY */}
            {viewCustomer.feedback_history?.length > 0 && (
              <div style={{marginTop:18}}>
                <div style={{fontWeight:800,color:'#b5536b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Feedback History</div>
                {viewCustomer.feedback_history.slice(0,5).map(f=>(
                  <div key={f.id} className="cust-feedback-item">
                    <div className="cust-feedback-subject">{f.subject}</div>
                    <div className="cust-feedback-meta">
                      <span>{f.type}</span>
                      <span>Rating: {f.rating}/5</span>
                      <span>Status: {f.status}</span>
                      <span>{new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ACTIVITY LOGS */}
            {viewActivity.length > 0 && (
              <div style={{marginTop:18}}>
                <div style={{fontWeight:800,color:'#b5536b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Activity Log</div>
                {viewActivity.slice(0,8).map(a=>(
                  <div key={a.id} className="cust-activity-item">
                    <span style={{color:'#374151',fontWeight:700,fontSize:12}}>{a.action_type} — {a.description}</span>
                    <span style={{color:'#94a3b8',fontSize:11,marginLeft:8,whiteSpace:'nowrap'}}>{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            <button className="cust-modal-close" onClick={()=>setViewCustomer(null)}>Close</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Customers;
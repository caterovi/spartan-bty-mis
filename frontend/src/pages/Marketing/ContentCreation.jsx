import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import {
  FaFacebook, FaInstagram, FaTiktok, FaShopify, FaYoutube,
  FaPhotoVideo, FaPlus, FaTimes, FaSearch, FaSave,
  FaEdit, FaTrash, FaEye, FaHeart, FaCalendar, FaUser,
  FaThLarge, FaCalendarAlt, FaCheck, FaComment,
  FaShare, FaBookmark, FaMousePointer, FaChartLine,
  FaLink, FaExclamationTriangle,
} from "react-icons/fa";

// ── helpers ──────────────────────────────────────────────
const formatStatus = (v='') =>
  v === 'all' ? 'All' :
  v.split('-').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' ');

const computeDueStatus = (due_date, status) => {
  if (status === 'published') return 'Completed';
  if (!due_date) return 'No Due Date';
  const now = new Date(); now.setHours(0,0,0,0);
  const due = new Date(due_date); due.setHours(0,0,0,0);
  const diff = Math.ceil((due - now)/(1000*60*60*24));
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Due Today';
  if (diff <= 3) return 'Due Soon';
  return 'Scheduled';
};

const dueStatusStyle = {
  'Completed':   { background:'#ecfdf3', color:'#2f7d56',  border:'1px solid #2f9d6a' },
  'No Due Date': { background:'#f8f3f5', color:'#6b5b63',  border:'1px solid #c9b6bf' },
  'Overdue':     { background:'#fff1f5', color:'#b5536b',  border:'1px solid #c4607a' },
  'Due Today':   { background:'#fff7e8', color:'#9a5f0f',  border:'1px solid #d98a1f' },
  'Due Soon':    { background:'#e8f4ff', color:'#1a5f9a',  border:'1px solid #4a90d9' },
  'Scheduled':   { background:'#f8f3f5', color:'#6b5b63',  border:'1px solid #c9b6bf' },
};

const statusColors = {
  idea:         { backgroundColor:'#f8f3f5', color:'#6b5b63', borderColor:'#c9b6bf' },
  'in-progress':{ backgroundColor:'#fff7e8', color:'#9a5f0f', borderColor:'#d98a1f' },
  'for-review': { backgroundColor:'#fff1f5', color:'#b5536b', borderColor:'#c4607a' },
  approved:     { backgroundColor:'#e8f4ff', color:'#1a5f9a', borderColor:'#4a90d9' },
  published:    { backgroundColor:'#ecfdf3', color:'#2f7d56', borderColor:'#2f9d6a' },
  cancelled:    { backgroundColor:'#f8f3f5', color:'#6b5b63', borderColor:'#c9b6bf' },
};

const platformIcons = {
  tiktok: <FaTiktok />, reels: <FaInstagram />,
  shopee: <FaShopify />, youtube: <FaYoutube />, facebook: <FaFacebook />,
};

const PLATFORMS = ['tiktok','reels','shopee','youtube','facebook'];
const CONTENT_TYPES = ['product-review','tutorial','behind-the-scenes','promo','testimonial','other'];
const OBJECTIVES = ['Brand awareness','Product promotion','Tutorial','Customer engagement','Sales conversion'];
const ALL_STATUSES = ['idea','in-progress','for-review','approved','published','cancelled'];
const KANBAN_STATUSES = ['idea','in-progress','for-review','approved','published'];
const FILTER_OPTIONS = ['all',...ALL_STATUSES];

const emptyForm = {
  title:'', platform:'tiktok', content_type:'product-review',
  objective:'', target_audience:'', assigned_to:'', due_date:'', notes:'',
  caption:'', hashtags:'', call_to_action:'',
  campaign_id:'', promotion_id:'',
  reviewer_id:'', review_comments:'', revision_notes:'',
  published_url:'',
  views:0, likes:0, comments:0, shares:0, saves:0,
  clicks:0, conversions:0, revenue_impact:0,
  status:'idea',
};

// ── Component ─────────────────────────────────────────────
function ContentCreation() {
  const [content, setContent]       = useState([]);
  const [summary, setSummary]       = useState(null);
  const [calendar, setCalendar]     = useState([]);
  const [campaigns, setCampaigns]   = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [employees, setEmployees]   = useState([]);

  const [view, setView]             = useState('kanban'); // kanban | calendar
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [message, setMessage]       = useState('');
  const [isError, setIsError]       = useState(false);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm]             = useState(emptyForm);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = () => {
    fetchContent(); fetchSummary(); fetchCalendar();
    fetchCampaigns(); fetchPromotions(); fetchEmployees();
  };

  const fetchContent = async () => {
    try { const r = await api.get('/marketing/content'); setContent(r.data); }
    catch(e){ console.error(e); }
  };
  const fetchSummary = async () => {
    try { const r = await api.get('/marketing/content/summary'); setSummary(r.data); }
    catch(e){ console.error(e); }
  };
  const fetchCalendar = async () => {
    try { const r = await api.get('/marketing/content/calendar'); setCalendar(r.data); }
    catch(e){ console.error(e); }
  };
  const fetchCampaigns = async () => {
    try { const r = await api.get('/marketing/campaigns'); setCampaigns(r.data); }
    catch(e){}
  };
  const fetchPromotions = async () => {
    try { const r = await api.get('/marketing/promotions'); setPromotions(r.data); }
    catch(e){}
  };
  const fetchEmployees = async () => {
    try { const r = await api.get('/hr/employees'); setEmployees(r.data || []); }
    catch(e){ setEmployees([]); }
  };

  const notify = (msg, err=false) => {
    setMessage(msg); setIsError(err);
    setTimeout(() => setMessage(''), 3500);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return notify('Title is required.', true);
    try {
      await api.post('/marketing/content', form);
      notify('Content task created!');
      setShowForm(false); setForm(emptyForm);
      fetchAll();
    } catch { notify('Error creating task.', true); }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/marketing/content/${editId}`, form);
      notify('Content updated!');
      setEditId(null); setForm(emptyForm);
      fetchAll();
    } catch { notify('Error updating.', true); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content task?')) return;
    try { await api.delete(`/marketing/content/${id}`); fetchAll(); }
    catch(e){ console.error(e); }
  };

  const openEdit = (c) => {
    setForm({
      title: c.title||'', platform: c.platform||'tiktok',
      content_type: c.content_type||'product-review',
      objective: c.objective||'', target_audience: c.target_audience||'',
      assigned_to: c.assigned_to||'', due_date: c.due_date?.slice(0,10)||'',
      notes: c.notes||'', caption: c.caption||'',
      hashtags: c.hashtags||'', call_to_action: c.call_to_action||'',
      campaign_id: c.campaign_id||'', promotion_id: c.promotion_id||'',
      reviewer_id: c.reviewer_id||'',
      review_comments: c.review_comments||'', revision_notes: c.revision_notes||'',
      approved_by: c.approved_by||'', approved_at: c.approved_at||'',
      published_url: c.published_url||'',
      views: c.views||0, likes: c.likes||0, comments: c.comments||0,
      shares: c.shares||0, saves: c.saves||0, clicks: c.clicks||0,
      conversions: c.conversions||0, revenue_impact: c.revenue_impact||0,
      status: c.status||'idea',
    });
    setEditId(c.id);
    setShowForm(false);
  };

  // preview engagement rate
  const previewEngagement = () => {
    const v = Number(form.views)||0;
    if (v === 0) return '0.00%';
    const i = (Number(form.likes)||0)+(Number(form.comments)||0)+
      (Number(form.shares)||0)+(Number(form.saves)||0)+(Number(form.clicks)||0);
    return ((i/v)*100).toFixed(2)+'%';
  };

  const filtered = content.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.title?.toLowerCase().includes(q) ||
      c.platform?.toLowerCase().includes(q) ||
      c.content_type?.toLowerCase().includes(q) ||
      (c.assigned_to||'').toLowerCase().includes(q);
    const matchStatus = filterStatus==='all' || c.status===filterStatus;
    return matchSearch && matchStatus;
  });

  // calendar groups
  const calGroups = {
    'Overdue Content':   calendar.filter(c => c.due_status==='Overdue'),
    'Due Today':         calendar.filter(c => c.due_status==='Due Today'),
    'Due Soon':          calendar.filter(c => c.due_status==='Due Soon'),
    'Upcoming Posts':    calendar.filter(c => c.due_status==='Scheduled'),
    'Published Content': calendar.filter(c => c.due_status==='Completed'),
    'No Due Date':       calendar.filter(c => c.due_status==='No Due Date'),
  };

  const FormSection = ({ label }) => (
    <div style={{ gridColumn:'span 3', fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#b5536b', paddingBottom:8, borderBottom:'1px solid #f3e8ec', marginTop:8 }}>
      {label}
    </div>
  );

  const Field = ({ label, span, children, opt }) => (
    <div className={`content-field${span ? ` content-span-${span}` : ''}`}>
      <label className="content-label">{label}{opt && <span style={{fontSize:11,fontWeight:400,color:'#94a3b8',marginLeft:4}}>optional</span>}</label>
      {children}
    </div>
  );

  const inp = (key, props={}) => (
    <input {...props} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} className="content-input" />
  );
  const sel = (key, options, props={}) => (
    <select {...props} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} className="content-input">
      {props.placeholder && <option value="">{props.placeholder}</option>}
      {options}
    </select>
  );

  const ContentForm = ({ isEdit }) => (
    <div className="content-form">
      <div className="content-form-header">
        <div className="content-form-icon">{isEdit ? <FaEdit /> : <FaPhotoVideo />}</div>
        <div>
          <h4 className="content-form-title">{isEdit ? 'Edit Content Task' : 'New Content Task'}</h4>
          <p className="content-form-note">Fill in content details across all sections.</p>
        </div>
      </div>

      <div className="content-form-grid">
        <FormSection label="Content Details" />
        <Field label="Content Title" span={3}>
          {inp('title', { placeholder:'e.g. Skincare Routine Tutorial' })}
        </Field>
        <Field label="Platform">
          {sel('platform', PLATFORMS.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>))}
        </Field>
        <Field label="Content Type">
          {sel('content_type', CONTENT_TYPES.map(t=><option key={t} value={t}>{formatStatus(t)}</option>))}
        </Field>
        <Field label="Objective" opt>
          {sel('objective', OBJECTIVES.map(o=><option key={o} value={o}>{o}</option>), { placeholder:'Select objective' })}
        </Field>
        <Field label="Target Audience" span={3} opt>
          {inp('target_audience', { placeholder:'e.g. Women 18-35, skincare enthusiasts' })}
        </Field>

        <FormSection label="Assignment & Schedule" />
        <Field label="Assigned To">
          {employees.length > 0 ? (
            <select value={form.assigned_to||''} onChange={e => {
              const emp = employees.find(x=>String(x.id)===e.target.value);
              setForm({...form, assigned_to: emp ? emp.full_name||emp.name : e.target.value, assigned_employee_id: e.target.value});
            }} className="content-input">
              <option value="">Select employee</option>
              {employees.map(e=><option key={e.id} value={e.id}>{e.full_name||e.name} — {e.position||e.role||''}</option>)}
            </select>
          ) : inp('assigned_to', { placeholder:'Team member name' })}
        </Field>
        <Field label="Due Date" opt>
          {inp('due_date', { type:'date' })}
        </Field>
        <Field label="Notes" opt>
          {inp('notes', { placeholder:'Optional notes' })}
        </Field>

        <FormSection label="Campaign & Promotion Link" />
        <Field label="Linked Campaign" opt>
          {sel('campaign_id', campaigns.map(c=><option key={c.id} value={c.id}>{c.title}</option>), { placeholder:'No campaign' })}
        </Field>
        <Field label="Linked Promotion" opt>
          {sel('promotion_id', promotions.map(p=><option key={p.id} value={p.id}>{p.promo_code}</option>), { placeholder:'No promotion' })}
        </Field>
        <div className="content-field" />

        <FormSection label="Caption & Publishing" />
        <Field label="Caption" span={3} opt>
          <textarea value={form.caption||''} onChange={e=>setForm({...form,caption:e.target.value})}
            className="content-input" rows={3} placeholder="Write your post caption here..." style={{resize:'vertical'}} />
        </Field>
        <Field label="Hashtags" span={2} opt>
          {inp('hashtags', { placeholder:'#BTYAdvance #skincare #glowup' })}
        </Field>
        <Field label="Call to Action" opt>
          {inp('call_to_action', { placeholder:'e.g. Shop now! Link in bio.' })}
        </Field>
        {(isEdit || form.status==='published') && (
          <Field label="Published URL" span={3} opt>
            {inp('published_url', { placeholder:'https://tiktok.com/...' })}
          </Field>
        )}

        <FormSection label="Review & Approval" />
        <Field label="Review Comments" span={2} opt>
          <textarea value={form.review_comments||''} onChange={e=>setForm({...form,review_comments:e.target.value})}
            className="content-input" rows={2} placeholder="Reviewer feedback..." style={{resize:'vertical'}} />
        </Field>
        <Field label="Revision Notes" opt>
          <textarea value={form.revision_notes||''} onChange={e=>setForm({...form,revision_notes:e.target.value})}
            className="content-input" rows={2} placeholder="Changes needed..." style={{resize:'vertical'}} />
        </Field>
        {isEdit && (
          <>
            <Field label="Status">
              {sel('status', ALL_STATUSES.map(s=><option key={s} value={s}>{formatStatus(s)}</option>))}
            </Field>
            {form.approved_by && (
              <div className="content-field content-span-2" style={{background:'#ecfdf3',borderRadius:12,padding:'10px 14px',border:'1px solid #2f9d6a'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#2f7d56'}}>
                  ✓ Approved by <strong>{form.approved_by}</strong>
                  {form.approved_at && ` on ${new Date(form.approved_at).toLocaleString()}`}
                </div>
              </div>
            )}
          </>
        )}

        <FormSection label="Performance Metrics" />
        {[
          ['views','Views',<FaEye />],
          ['likes','Likes',<FaHeart />],
          ['comments','Comments',<FaComment />],
          ['shares','Shares',<FaShare />],
          ['saves','Saves',<FaBookmark />],
          ['clicks','Clicks',<FaMousePointer />],
          ['conversions','Conversions',<FaCheck />],
          ['revenue_impact','Revenue Impact (₱)',<FaChartLine />],
        ].map(([key,label]) => (
          <Field key={key} label={label} opt>
            {inp(key, { type:'number', placeholder:'0', min:'0' })}
          </Field>
        ))}
        <div className="content-field">
          <label className="content-label">Engagement Rate</label>
          <div style={{padding:'11px 12px',borderRadius:12,background:'#fff7fa',border:'1px solid #d8b8c2',fontSize:14,fontWeight:800,color:'#b5536b'}}>
            {previewEngagement()}
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <button onClick={isEdit ? handleUpdate : handleSubmit} className="content-submit-btn">
          <FaSave /> {isEdit ? 'Save Changes' : 'Create Task'}
        </button>
        <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} className="content-cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  );

  const DueBadge = ({ due_date, status }) => {
    const ds = computeDueStatus(due_date, status);
    return (
      <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 8px', borderRadius:9999, fontSize:10, fontWeight:800, ...dueStatusStyle[ds] }}>
        {ds}
      </span>
    );
  };

  const KanbanCard = ({ c }) => (
    <div className="content-kanban-card">
      <div className="content-card-top">
        <span className="content-platform-badge">{platformIcons[c.platform]} {c.platform}</span>
        <span className="content-type">{formatStatus(c.content_type)}</span>
      </div>

      <p className="content-card-title">{c.title || <em style={{color:'#94a3b8'}}>Untitled</em>}</p>

      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:6}}>
        <DueBadge due_date={c.due_date} status={c.status} />
        {c.campaign_name && (
          <span style={{fontSize:10,padding:'3px 7px',borderRadius:9999,background:'#e8f4ff',color:'#1a5f9a',border:'1px solid #4a90d9',fontWeight:700}}>
            🎯 {c.campaign_name}
          </span>
        )}
      </div>

      {c.assigned_to && <p className="content-meta"><FaUser />{c.assigned_to}</p>}
      {c.due_date && <p className="content-meta"><FaCalendar />{new Date(c.due_date).toLocaleDateString()}</p>}
      {c.objective && <p className="content-meta"><FaChartLine />{c.objective}</p>}

      {c.status==='published' && (
        <div className="content-stats">
          <span className="content-stat-pill"><FaEye />{Number(c.views||0).toLocaleString()}</span>
          <span className="content-stat-pill"><FaHeart />{Number(c.likes||0).toLocaleString()}</span>
          {c.engagement_rate > 0 && (
            <span className="content-stat-pill"><FaChartLine />{Number(c.engagement_rate).toFixed(1)}%</span>
          )}
          {c.published_url && (
            <a href={c.published_url} target="_blank" rel="noopener noreferrer"
              style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 9px',borderRadius:9999,background:'#fff',border:'1px solid #ead1d9',fontSize:12,fontWeight:800,color:'#b5536b',textDecoration:'none'}}>
              <FaLink /> View
            </a>
          )}
        </div>
      )}

      <div className="content-card-actions">
        <button onClick={() => openEdit(c)} className="content-edit-btn"><FaEdit /> Edit</button>
        <button onClick={() => handleDelete(c.id)} className="content-delete-btn"><FaTrash /> Delete</button>
      </div>
    </div>
  );

  const CalendarCard = ({ c }) => {
    const ds = computeDueStatus(c.due_date, c.status);
    return (
      <div style={{background:'#fff',border:'1px solid #e2c6cf',borderRadius:14,padding:'12px 14px',marginBottom:10,display:'flex',gap:12,alignItems:'flex-start',transition:'all 180ms ease'}}
        onMouseEnter={e=>e.currentTarget.style.borderColor='#c4607a'}
        onMouseLeave={e=>e.currentTarget.style.borderColor='#e2c6cf'}>
        <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#c4607a,#e58ca3)',display:'grid',placeItems:'center',color:'#fff',fontSize:18,flexShrink:0}}>
          {platformIcons[c.platform]}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
            <span style={{fontWeight:800,fontSize:14,color:'#1f2937'}}>{c.title||'Untitled'}</span>
            <span className="content-kanban-label" style={{...statusColors[c.status],fontSize:10,padding:'3px 8px'}}>
              {formatStatus(c.status)}
            </span>
            <span style={{fontSize:10,padding:'3px 8px',borderRadius:9999,fontWeight:800,...dueStatusStyle[ds]}}>{ds}</span>
          </div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',fontSize:12,color:'#64748b'}}>
            {c.assigned_to && <span><FaUser style={{color:'#b5536b',marginRight:4}}/>{c.assigned_to}</span>}
            {c.due_date && <span><FaCalendar style={{color:'#b5536b',marginRight:4}}/>{new Date(c.due_date).toLocaleDateString()}</span>}
            {c.campaign_name && <span>🎯 {c.campaign_name}</span>}
            {c.promotion_name && <span>🎫 {c.promotion_name}</span>}
          </div>
        </div>
        <button onClick={() => openEdit(c)} style={{padding:'6px 10px',borderRadius:9,border:'1px solid #d98a1f',background:'#fff7e8',color:'#9a5f0f',fontSize:12,fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
          <FaEdit /> Edit
        </button>
      </div>
    );
  };

  return (
    <Layout>
      <style>{`
        .content-page { width:100%; min-width:0; animation:contentFadeUp 0.35s ease both; }
        .content-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .content-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .content-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .content-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .content-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }

        /* SUMMARY */
        .content-summary { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:11px; margin-bottom:20px; }
        .content-summary-card { background:#fff; border:1px solid #e2c6cf; border-radius:14px; padding:14px 16px; box-shadow:0 2px 8px rgba(0,0,0,.05); position:relative; overflow:hidden; transition:all 180ms ease; }
        .content-summary-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .content-summary-card:hover { transform:translateY(-2px); border-color:#c4607a; }
        .content-summary-label { margin:0 0 8px; color:#64748b; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .content-summary-value { margin:0; color:#1f2937; font-size:20px; font-weight:850; letter-spacing:-.04em; }

        /* TOOLBAR */
        .content-toolbar { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; justify-content:space-between; align-items:center; gap:14px; }
        .content-search-wrap { position:relative; width:300px; max-width:100%; }
        .content-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b5536b; font-size:13px; pointer-events:none; }
        .content-search { width:100%; padding:11px 13px 11px 36px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; color:#1f2937; font-size:14px; outline:none; box-sizing:border-box; transition:all 180ms ease; }
        .content-search:focus { border-color:#c4607a; background:#fff; box-shadow:0 0 0 4px rgba(196,96,122,.12); }
        .content-add-btn,.content-submit-btn { border:none; border-radius:12px; padding:11px 16px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
        .content-add-btn:hover,.content-submit-btn:hover { transform:translateY(-1px); box-shadow:0 10px 22px rgba(196,96,122,.28); }
        .content-cancel-btn { border:1px solid #d8b8c2; border-radius:12px; padding:11px 16px; background:#fff; color:#64748b; font-size:14px; font-weight:800; cursor:pointer; }

        /* VIEW TOGGLE */
        .content-view-toggle { display:flex; gap:4px; background:#fff; border:1px solid #e2c6cf; border-radius:12px; padding:4px; }
        .content-view-btn { padding:7px 14px; border-radius:9px; border:none; background:transparent; color:#64748b; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 180ms ease; }
        .content-view-btn:hover { background:#fff7fa; color:#b5536b; }
        .content-view-btn.active { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; box-shadow:0 4px 12px rgba(196,96,122,.25); }

        /* FILTERS */
        .content-filters { display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap; }
        .content-filter-btn { padding:8px 13px; border-radius:9999px; border:1px solid #d8b8c2; background:#fff; color:#64748b; cursor:pointer; font-size:13px; font-weight:800; transition:all 180ms ease; }
        .content-filter-btn:hover { border-color:#c4607a; transform:translateY(-1px); }
        .content-filter-active { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; border-color:#c4607a; box-shadow:0 8px 18px rgba(196,96,122,.18); }

        /* MESSAGE */
        .content-message { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .content-msg-ok  { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .content-msg-err { background:#fff1f5; color:#b5536b; border-color:#c4607a; }

        /* FORM */
        .content-form { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .content-form-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .content-form-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .content-form-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .content-form-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .content-form-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:16px; }
        .content-field { display:flex; flex-direction:column; gap:6px; }
        .content-label { font-size:13px; font-weight:800; color:#374151; }
        .content-input { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .content-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .content-span-2 { grid-column:span 2; }
        .content-span-3 { grid-column:span 3; }
        .content-edit-actions { display:flex; gap:10px; flex-wrap:wrap; }

        /* KANBAN */
        .content-result-count { margin:0 0 12px; color:#64748b; font-size:13px; font-weight:700; }
        .content-kanban { display:grid; grid-template-columns:repeat(5,minmax(220px,1fr)); gap:14px; max-width:100%; }
        .content-kanban-col { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:14px; min-width:0; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .content-kanban-header { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px; }
        .content-kanban-label { display:inline-flex; align-items:center; justify-content:center; padding:6px 10px; border-radius:9999px; font-size:11px; font-weight:800; border:1px solid; text-transform:capitalize; }
        .content-kanban-count { width:26px; height:26px; border-radius:9999px; display:grid; place-items:center; background:#fff1f5; color:#b5536b; border:1px solid #e8b9c6; font-size:12px; font-weight:850; flex:0 0 auto; }
        .content-kanban-empty { text-align:center; color:#94a3b8; font-size:13px; font-weight:700; padding:24px 0; border:1px dashed #e2c6cf; border-radius:14px; background:#fff7fa; }
        .content-kanban-card { background:#fff7fa; border:1px solid #ead1d9; border-radius:16px; padding:14px; margin-bottom:10px; transition:all 180ms ease; }
        .content-kanban-card:hover { transform:translateY(-2px); border-color:#c4607a; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .content-card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:10px; }
        .content-platform-badge { display:inline-flex; align-items:center; gap:6px; color:#b5536b; background:#fff; border:1px solid #e8b9c6; border-radius:9999px; padding:6px 9px; font-size:11px; font-weight:800; text-transform:capitalize; }
        .content-type { font-size:11px; background:#fff; color:#64748b; border:1px solid #ead1d9; padding:6px 9px; border-radius:9999px; font-weight:800; text-transform:capitalize; white-space:nowrap; }
        .content-card-title { margin:0 0 8px; color:#1f2937; font-size:14px; font-weight:850; line-height:1.45; }
        .content-meta { display:flex; align-items:center; gap:7px; color:#64748b; font-size:12px; font-weight:700; margin:5px 0; }
        .content-meta svg { color:#b5536b; flex:0 0 auto; }
        .content-stats { display:flex; gap:8px; flex-wrap:wrap; margin:10px 0 0; }
        .content-stat-pill { display:inline-flex; align-items:center; gap:6px; padding:6px 9px; border-radius:9999px; background:#fff; color:#374151; border:1px solid #ead1d9; font-size:12px; font-weight:800; }
        .content-card-actions { display:flex; gap:7px; margin-top:12px; }
        .content-edit-btn,.content-delete-btn { flex:1; border-radius:10px; padding:8px 10px; cursor:pointer; font-size:12px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; gap:6px; border:1px solid; transition:all 180ms ease; }
        .content-edit-btn { background:#fff7e8; color:#9a5f0f; border-color:#d98a1f; }
        .content-delete-btn { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .content-edit-btn:hover,.content-delete-btn:hover { transform:translateY(-1px); }

        /* CALENDAR */
        .content-cal-section { margin-bottom:24px; }
        .content-cal-heading { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
        .content-cal-label { font-size:13px; font-weight:800; color:#374151; }
        .content-cal-count { width:22px; height:22px; border-radius:9999px; display:grid; place-items:center; background:#fff1f5; color:#b5536b; border:1px solid #e8b9c6; font-size:11px; font-weight:850; }
        .content-cal-empty { padding:16px; background:#fff7fa; border:1px dashed #e2c6cf; border-radius:12px; text-align:center; color:#94a3b8; font-size:13px; font-weight:700; }

        @keyframes contentFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width:1400px) { .content-kanban { grid-template-columns:repeat(3,minmax(220px,1fr)); } }
        @media (max-width:1180px) {
          .content-summary { grid-template-columns:repeat(3,minmax(0,1fr)); }
          .content-kanban { grid-template-columns:repeat(2,minmax(220px,1fr)); }
          .content-form-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .content-span-3 { grid-column:span 2; }
        }
        @media (max-width:768px) {
          .content-hero { align-items:flex-start; padding:20px; }
          .content-title { font-size:24px; }
          .content-hero-icon { width:48px; height:48px; font-size:20px; }
          .content-toolbar { flex-direction:column; align-items:stretch; }
          .content-search-wrap,.content-add-btn { width:100%; }
          .content-summary { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .content-kanban { grid-template-columns:1fr; }
          .content-edit-actions { flex-direction:column; }
          .content-submit-btn,.content-cancel-btn { width:100%; }
        }
        @media (max-width:520px) {
          .content-hero { flex-direction:column-reverse; }
          .content-summary { grid-template-columns:1fr; }
          .content-form-grid { grid-template-columns:1fr; }
          .content-span-3,.content-span-2 { grid-column:span 1; }
          .content-card-top { flex-direction:column; }
          .content-card-actions { flex-direction:column; }
        }
      `}</style>

      <div className="content-page">

        {/* HERO */}
        <div className="content-hero">
          <div>
            <p className="content-eyebrow">Marketing Content Board</p>
            <h3 className="content-title">Content Creation</h3>
            <p className="content-subtitle">
              Plan, assign, review, approve, publish, and evaluate content across all platforms.
            </p>
          </div>
          <div className="content-hero-icon"><FaPhotoVideo /></div>
        </div>

        {/* SUMMARY CARDS */}
        {summary && (
          <div className="content-summary">
            {[
              { label:'Total Tasks',        value: summary.total_content_tasks || 0 },
              { label:'In Progress',        value: summary.in_progress_count   || 0 },
              { label:'For Review',         value: summary.for_review_count    || 0 },
              { label:'Approved',           value: summary.approved_count      || 0 },
              { label:'Published / Month',  value: summary.published_this_month|| 0 },
              { label:'Overdue',            value: summary.overdue_count       || 0, warn: true },
            ].map(c => (
              <div key={c.label} className="content-summary-card">
                <p className="content-summary-label">{c.label}</p>
                <p className="content-summary-value" style={c.warn && Number(c.value) > 0 ? {color:'#b5536b'} : {}}>
                  {c.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TOOLBAR */}
        <div className="content-toolbar">
          <div style={{display:'flex',gap:12,alignItems:'center',flex:1,flexWrap:'wrap'}}>
            <div className="content-search-wrap">
              <FaSearch className="content-search-icon" />
              <input type="text" placeholder="Search content..." value={search}
                onChange={e=>setSearch(e.target.value)} className="content-search" />
            </div>
            <div className="content-view-toggle">
              <button className={`content-view-btn${view==='kanban'?' active':''}`} onClick={()=>setView('kanban')}>
                <FaThLarge /> Kanban
              </button>
              <button className={`content-view-btn${view==='calendar'?' active':''}`} onClick={()=>setView('calendar')}>
                <FaCalendarAlt /> Calendar
              </button>
            </div>
          </div>
          <button onClick={()=>{setShowForm(!showForm);setEditId(null);setForm(emptyForm);}} className="content-add-btn">
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'New Content'}
          </button>
        </div>

        {/* FILTERS */}
        <div className="content-filters">
          {FILTER_OPTIONS.map(s => (
            <button key={s} onClick={()=>setFilterStatus(s)}
              className={`content-filter-btn${filterStatus===s?' content-filter-active':''}`}>
              {formatStatus(s)}
            </button>
          ))}
        </div>

        {/* MESSAGE */}
        {message && (
          <div className={`content-message ${isError?'content-msg-err':'content-msg-ok'}`}>{message}</div>
        )}

        {/* CREATE FORM */}
        {showForm && !editId && <ContentForm isEdit={false} />}

        {/* EDIT FORM */}
        {editId && <ContentForm isEdit={true} />}

        <p className="content-result-count">
          {filtered.length} task{filtered.length!==1?'s':''} found
        </p>

        {/* ── KANBAN VIEW ─────────────────────────────────────────── */}
        {view === 'kanban' && (
          <div className="content-kanban">
            {KANBAN_STATUSES.map(status => {
              const cards = filtered.filter(c => c.status === status);
              return (
                <div key={status} className="content-kanban-col">
                  <div className="content-kanban-header">
                    <span className="content-kanban-label" style={statusColors[status]}>
                      {formatStatus(status)}
                    </span>
                    <span className="content-kanban-count">{cards.length}</span>
                  </div>
                  {cards.length === 0
                    ? <div className="content-kanban-empty">No tasks</div>
                    : cards.map(c => <KanbanCard key={c.id} c={c} />)
                  }
                </div>
              );
            })}
          </div>
        )}

        {/* ── CALENDAR VIEW ───────────────────────────────────────── */}
        {view === 'calendar' && (
          <div>
            {Object.entries(calGroups).map(([groupName, items]) => {
              const groupItems = filterStatus === 'all'
                ? items
                : items.filter(c => c.status === filterStatus);
              return (
                <div key={groupName} className="content-cal-section">
                  <div className="content-cal-heading">
                    <span style={{fontSize:16,fontWeight:800,color:'#1f2937'}}>{groupName}</span>
                    <span className="content-cal-count">{groupItems.length}</span>
                    {groupName==='Overdue Content' && groupItems.length>0 && (
                      <FaExclamationTriangle style={{color:'#c4607a',fontSize:14}} />
                    )}
                  </div>
                  {groupItems.length === 0
                    ? <div className="content-cal-empty">No content here.</div>
                    : groupItems.map(c => <CalendarCard key={c.id} c={c} />)
                  }
                </div>
              );
            })}
          </div>
        )}

      </div>
    </Layout>
  );
}

export default ContentCreation;
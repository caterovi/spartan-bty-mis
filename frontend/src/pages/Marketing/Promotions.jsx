import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import {
  FaTicketAlt, FaPlus, FaTimes, FaSearch, FaSave,
  FaTrash, FaCalendar, FaMoneyBillWave, FaPercent,
  FaEdit, FaEye, FaCopy, FaStar, FaCheck, FaExclamationTriangle,
} from "react-icons/fa";

const statusColors = {
  active:   { backgroundColor: '#ecfdf3', color: '#2f7d56',  borderColor: '#2f9d6a' },
  inactive: { backgroundColor: '#f8f3f5', color: '#6b5b63',  borderColor: '#c9b6bf' },
  expired:  { backgroundColor: '#fff1f5', color: '#b5536b',  borderColor: '#c4607a' },
};

const money = (v) => `₱${Number(v || 0).toLocaleString()}`;

const emptyForm = {
  promo_code: '', description: '', discount_type: 'percentage',
  discount_value: '', min_order: '0', start_date: '', end_date: '',
  campaign_id: '', usage_limit: '', per_customer_limit: '1',
  max_discount_cap: '', is_featured: false,
};

function Promotions() {
  const [promos, setPromos]         = useState([]);
  const [campaigns, setCampaigns]   = useState([]);
  const [summary, setSummary]       = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [editPromo, setEditPromo]   = useState(null);
  const [viewPromo, setViewPromo]   = useState(null);
  const [message, setMessage]       = useState('');
  const [isError, setIsError]       = useState(false);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [form, setForm]             = useState(emptyForm);
  const [copied, setCopied]         = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = () => { fetchPromos(); fetchSummary(); fetchCampaigns(); };

  const fetchPromos = async () => {
    try { const r = await api.get('/marketing/promotions'); setPromos(r.data); }
    catch (e) { console.error(e); }
  };
  const fetchSummary = async () => {
    try { const r = await api.get('/marketing/promotions/summary'); setSummary(r.data); }
    catch (e) { console.error(e); }
  };
  const fetchCampaigns = async () => {
    try { const r = await api.get('/marketing/campaigns'); setCampaigns(r.data); }
    catch (e) { console.error(e); }
  };

  const notify = (msg, err = false) => {
    setMessage(msg); setIsError(err);
    setTimeout(() => setMessage(''), 3500);
  };

  const handleSubmit = async () => {
    if (!form.promo_code.trim()) return notify('Promo code is required.', true);
    if (!form.discount_value || Number(form.discount_value) <= 0) return notify('Discount value must be greater than 0.', true);
    if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) return notify('Percentage cannot exceed 100%.', true);
    if (!form.start_date || !form.end_date) return notify('Start and end dates are required.', true);
    if (new Date(form.end_date) < new Date(form.start_date)) return notify('End date cannot be before start date.', true);

    try {
      await api.post('/marketing/promotions', form);
      notify('Promotion created successfully!');
      setShowForm(false);
      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      notify(err.response?.data?.message || 'Error creating promotion.', true);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/marketing/promotions/${editPromo.id}`, form);
      notify('Promotion updated!');
      setEditPromo(null);
      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      notify(err.response?.data?.message || 'Error updating promotion.', true);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/marketing/promotions/${id}/status`, { status });
      fetchPromos();
    } catch (err) {
      notify(err.response?.data?.message || 'Error updating status.', true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promotion?')) return;
    try {
      const r = await api.delete(`/marketing/promotions/${id}`);
      notify(r.data.message);
      fetchAll();
    } catch (err) {
      notify(err.response?.data?.message || 'Error deleting.', true);
    }
  };

  const openEdit = (p) => {
    setForm({
      promo_code: p.promo_code,
      description: p.description || '',
      discount_type: p.discount_type,
      discount_value: p.discount_value,
      min_order: p.min_order,
      start_date: p.start_date?.slice(0, 10),
      end_date: p.end_date?.slice(0, 10),
      campaign_id: p.campaign_id || '',
      usage_limit: p.usage_limit || '',
      per_customer_limit: p.per_customer_limit || 1,
      max_discount_cap: p.max_discount_cap || '',
      is_featured: !!p.is_featured,
      status: p.status,
    });
    setEditPromo(p);
    setShowForm(false);
  };

  const copyCode = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(code);
        setTimeout(() => setCopied(''), 2000);
      });
    }
  };

  const getDisplayStatus = (p) => p.computed_status || p.status;

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'expired', label: 'Expired' },
    { key: 'expiring_soon', label: '⚡ Expiring Soon' },
    { key: 'featured', label: '⭐ Featured' },
  ];

  const filtered = promos.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.promo_code.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q);
    const ds = getDisplayStatus(p);
    const matchFilter =
      filter === 'all' ? true :
      filter === 'expiring_soon' ? p.is_expiring_soon :
      filter === 'featured' ? p.is_featured :
      ds === filter;
    return matchSearch && matchFilter;
  });

  const FormPanel = ({ isEdit }) => (
    <div className="promo-form">
      <div className="promo-form-header">
        <div className="promo-form-icon">{isEdit ? <FaEdit /> : <FaTicketAlt />}</div>
        <div>
          <h4 className="promo-form-title">{isEdit ? 'Edit Promotion' : 'Create Promotion'}</h4>
          <p className="promo-form-note">Fill in promo details, discount rules, and validity period.</p>
        </div>
      </div>

      <div className="promo-form-grid">
        <div className="promo-form-section">Basic Info</div>

        <div className="promo-field">
          <label className="promo-label">Promo Code</label>
          <input type="text" placeholder="e.g. SALE20" value={form.promo_code}
            onChange={e => setForm({...form, promo_code: e.target.value.toUpperCase()})} className="promo-input" />
        </div>
        <div className="promo-field">
          <label className="promo-label">Discount Type</label>
          <select value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})} className="promo-input">
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₱)</option>
          </select>
        </div>
        <div className="promo-field">
          <label className="promo-label">Discount Value</label>
          <input type="number" placeholder="e.g. 20" value={form.discount_value}
            onChange={e => setForm({...form, discount_value: e.target.value})} className="promo-input" />
        </div>
        <div className="promo-field">
          <label className="promo-label">Min Order (₱)</label>
          <input type="number" placeholder="0" value={form.min_order}
            onChange={e => setForm({...form, min_order: e.target.value})} className="promo-input" />
        </div>
        <div className="promo-field">
          <label className="promo-label">Start Date</label>
          <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="promo-input" />
        </div>
        <div className="promo-field">
          <label className="promo-label">End Date</label>
          <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="promo-input" />
        </div>
        <div className="promo-field promo-span-3">
          <label className="promo-label">Description <span className="promo-label-opt">optional</span></label>
          <input type="text" placeholder="Promo description" value={form.description}
            onChange={e => setForm({...form, description: e.target.value})} className="promo-input" />
        </div>

        <div className="promo-form-section">Advanced Settings</div>

        <div className="promo-field">
          <label className="promo-label">Usage Limit <span className="promo-label-opt">optional</span></label>
          <input type="number" placeholder="Unlimited" value={form.usage_limit}
            onChange={e => setForm({...form, usage_limit: e.target.value})} className="promo-input" />
        </div>
        <div className="promo-field">
          <label className="promo-label">Per Customer Limit</label>
          <input type="number" placeholder="1" value={form.per_customer_limit}
            onChange={e => setForm({...form, per_customer_limit: e.target.value})} className="promo-input" />
        </div>
        <div className="promo-field">
          <label className="promo-label">Max Discount Cap (₱) <span className="promo-label-opt">optional</span></label>
          <input type="number" placeholder="No cap" value={form.max_discount_cap}
            onChange={e => setForm({...form, max_discount_cap: e.target.value})} className="promo-input" />
        </div>
        <div className="promo-field">
          <label className="promo-label">Linked Campaign <span className="promo-label-opt">optional</span></label>
          <select value={form.campaign_id} onChange={e => setForm({...form, campaign_id: e.target.value})} className="promo-input">
            <option value="">No campaign</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        {isEdit && (
          <div className="promo-field">
            <label className="promo-label">Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="promo-input">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        )}
        <div className="promo-field">
          <label className="promo-label">Featured on Landing Page</label>
          <label className="promo-featured-check">
            <input type="checkbox" checked={!!form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} />
            <span>⭐ Feature this promo publicly</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={isEdit ? handleUpdate : handleSubmit} className="promo-submit-btn">
          <FaSave /> {isEdit ? 'Save Changes' : 'Save Promotion'}
        </button>
        <button onClick={() => { setShowForm(false); setEditPromo(null); setForm(emptyForm); }} className="promo-cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <Layout>
      <style>{`
        .promo-page { width:100%; min-width:0; animation:promoFadeUp 0.35s ease both; }
        .promo-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .promo-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .promo-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .promo-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .promo-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }

        /* SUMMARY */
        .promo-summary { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; margin-bottom:20px; }
        .promo-summary-card { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); position:relative; overflow:hidden; transition:all 180ms ease; }
        .promo-summary-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .promo-summary-card:hover { transform:translateY(-2px); border-color:#c4607a; }
        .promo-summary-label { margin:0 0 10px; color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .promo-summary-value { margin:0; color:#1f2937; font-size:22px; font-weight:850; letter-spacing:-.04em; }
        .promo-summary-icon { position:absolute; top:14px; right:14px; width:32px; height:32px; border-radius:9px; display:grid; place-items:center; background:#fff1f5; color:#b5536b; font-size:14px; }

        /* TOOLBAR */
        .promo-toolbar { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; justify-content:space-between; align-items:center; gap:14px; }
        .promo-search-wrap { position:relative; width:280px; max-width:100%; }
        .promo-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b5536b; font-size:13px; pointer-events:none; }
        .promo-search { width:100%; padding:11px 13px 11px 36px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; color:#1f2937; font-size:14px; outline:none; box-sizing:border-box; transition:all 180ms ease; }
        .promo-search:focus { border-color:#c4607a; background:#fff; box-shadow:0 0 0 4px rgba(196,96,122,.12); }
        .promo-add-btn,.promo-submit-btn { border:none; border-radius:12px; padding:11px 16px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
        .promo-add-btn:hover,.promo-submit-btn:hover { transform:translateY(-1px); box-shadow:0 10px 22px rgba(196,96,122,.28); }
        .promo-cancel-btn { border:1px solid #d8b8c2; border-radius:12px; padding:11px 16px; background:#fff; color:#64748b; font-size:14px; font-weight:800; cursor:pointer; }

        /* FILTER CHIPS */
        .promo-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }
        .promo-chip { padding:7px 14px; border-radius:9999px; border:1px solid #d8b8c2; background:#fff; color:#64748b; cursor:pointer; font-size:12px; font-weight:700; transition:all 180ms ease; }
        .promo-chip:hover { border-color:#c4607a; color:#b5536b; }
        .promo-chip.active { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; border-color:#c4607a; box-shadow:0 4px 12px rgba(196,96,122,.2); }

        /* MESSAGE */
        .promo-message { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .promo-message-success { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .promo-message-error { background:#fff1f5; color:#b5536b; border-color:#c4607a; }

        /* FORM */
        .promo-form { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .promo-form-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .promo-form-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .promo-form-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .promo-form-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .promo-form-section { font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#b5536b; grid-column:span 3; margin:8px 0 -4px; padding-bottom:8px; border-bottom:1px solid #f3e8ec; }
        .promo-form-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:16px; }
        .promo-field { display:flex; flex-direction:column; gap:6px; }
        .promo-label { font-size:13px; font-weight:800; color:#374151; }
        .promo-label-opt { font-size:11px; font-weight:400; color:#94a3b8; margin-left:4px; }
        .promo-input { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .promo-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .promo-span-3 { grid-column:span 3; }
        .promo-featured-check { display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; cursor:pointer; font-size:13px; color:#374151; font-weight:600; }
        .promo-featured-check input { width:15px; height:15px; accent-color:#c4607a; cursor:pointer; }

        /* CARDS */
        .promo-result-count { margin:0 0 12px; color:#64748b; font-size:13px; font-weight:700; }
        .promo-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
        .promo-card { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:18px; display:flex; flex-direction:column; gap:12px; position:relative; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.05); transition:all 180ms ease; }
        .promo-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .promo-card:hover { transform:translateY(-2px); border-color:#c4607a; box-shadow:0 4px 16px rgba(0,0,0,.07); }
        .promo-card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap; }
        .promo-code-row { display:flex; align-items:center; gap:7px; }
        .promo-code { display:inline-flex; align-items:center; gap:8px; color:#b5536b; background:#fff1f5; border:1px solid #e8b9c6; border-radius:9999px; padding:7px 11px; font-size:13px; font-weight:850; letter-spacing:.04em; }
        .promo-copy-btn { width:28px; height:28px; border-radius:8px; border:1px solid #e8b9c6; background:#fff1f5; color:#b5536b; display:grid; place-items:center; cursor:pointer; font-size:12px; transition:all 180ms ease; }
        .promo-copy-btn:hover { background:#c4607a; color:#fff; border-color:#c4607a; }
        .promo-badge { display:inline-flex; align-items:center; justify-content:center; padding:5px 10px; border-radius:9999px; font-size:11px; font-weight:800; text-transform:capitalize; border:1px solid; white-space:nowrap; }
        .promo-expiring-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 8px; border-radius:9999px; font-size:10px; font-weight:800; background:#fff7e8; color:#9a5f0f; border:1px solid #d98a1f; }
        .promo-featured-star { color:#d98a1f; font-size:13px; }
        .promo-discount { margin:2px 0 0; color:#1f2937; font-size:24px; font-weight:850; letter-spacing:-.04em; }
        .promo-desc { margin:0; color:#64748b; font-size:13px; line-height:1.5; min-height:36px; }
        .promo-meta-list { display:grid; gap:7px; }
        .promo-meta { display:flex; align-items:center; gap:7px; margin:0; color:#64748b; font-size:12px; font-weight:700; }
        .promo-meta svg { color:#b5536b; flex:0 0 auto; }
        .promo-stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .promo-stat-box { background:#fff7fa; border-radius:10px; padding:8px 10px; text-align:center; }
        .promo-stat-val { font-size:14px; font-weight:850; color:#b5536b; }
        .promo-stat-lbl { font-size:9px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.04em; margin-top:2px; }
        .promo-actions { display:flex; gap:7px; margin-top:auto; flex-wrap:wrap; }
        .promo-status-select { flex:1; min-width:0; padding:8px 10px; border-radius:10px; border:1px solid #d8b8c2; background:#fff; color:#374151; font-size:12px; font-weight:700; cursor:pointer; outline:none; }
        .promo-btn { border-radius:10px; padding:8px 10px; cursor:pointer; font-size:12px; font-weight:800; display:inline-flex; align-items:center; gap:6px; border:1px solid; transition:all 180ms ease; }
        .promo-btn:hover { transform:translateY(-1px); }
        .promo-btn-edit { background:#fff7e8; color:#9a5f0f; border-color:#d98a1f; }
        .promo-btn-view { background:#e8f4ff; color:#1a5f9a; border-color:#4a90d9; }
        .promo-btn-delete { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .promo-empty { grid-column:1/-1; background:#fff; border:1px dashed #e2c6cf; border-radius:18px; padding:42px 20px; text-align:center; color:#94a3b8; font-size:14px; font-weight:700; }

        /* MODAL */
        .promo-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .promo-modal { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:520px; box-shadow:0 20px 60px rgba(0,0,0,.2); max-height:90vh; overflow-y:auto; }
        .promo-modal-title { margin:0 0 4px; font-size:20px; font-weight:800; color:#1f2937; }
        .promo-modal-code { margin:0 0 20px; font-size:13px; color:#b5536b; font-weight:700; }
        .promo-modal-row { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid #f3e8ec; font-size:13px; }
        .promo-modal-row:last-child { border-bottom:none; }
        .promo-modal-key { color:#64748b; font-weight:700; }
        .promo-modal-val { color:#1f2937; font-weight:800; text-align:right; max-width:60%; }
        .promo-modal-close { margin-top:20px; width:100%; padding:12px; border:none; border-radius:12px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; }

        @keyframes promoFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width:1180px) {
          .promo-summary { grid-template-columns:repeat(3,minmax(0,1fr)); }
          .promo-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .promo-form-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .promo-span-3,.promo-form-section { grid-column:span 2; }
        }
        @media (max-width:768px) {
          .promo-hero { align-items:flex-start; padding:20px; }
          .promo-title { font-size:24px; }
          .promo-hero-icon { width:48px; height:48px; font-size:20px; }
          .promo-toolbar { flex-direction:column; align-items:stretch; }
          .promo-search-wrap,.promo-add-btn { width:100%; }
          .promo-summary { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .promo-grid { grid-template-columns:1fr; }
          .promo-form-grid { grid-template-columns:1fr; }
          .promo-span-3,.promo-form-section { grid-column:span 1; }
        }
        @media (max-width:520px) {
          .promo-hero { flex-direction:column-reverse; }
          .promo-summary { grid-template-columns:1fr; }
          .promo-card-top { flex-direction:column; }
          .promo-actions { flex-direction:column; }
          .promo-status-select,.promo-btn { width:100%; justify-content:center; }
        }
      `}</style>

      <div className="promo-page">

        {/* HERO */}
        <div className="promo-hero">
          <div>
            <p className="promo-eyebrow">Marketing Offers</p>
            <h3 className="promo-title">Promotions</h3>
            <p className="promo-subtitle">Create, manage, and track promo codes with real-time redemption analytics.</p>
          </div>
          <div className="promo-hero-icon"><FaTicketAlt /></div>
        </div>

        {/* SUMMARY CARDS */}
        {summary && (
          <div className="promo-summary">
            {[
              { label: 'Active Promos',      value: summary.activePromos || 0,      icon: <FaCheck /> },
              { label: 'Expiring Soon',      value: summary.expiringSoon || 0,      icon: <FaExclamationTriangle /> },
              { label: 'Total Redemptions',  value: summary.totalRedemptions || 0,  icon: <FaTicketAlt /> },
              { label: 'Discount Given',     value: money(summary.totalDiscountGiven), icon: <FaPercent /> },
              { label: 'Sales Generated',    value: money(summary.totalSalesGenerated), icon: <FaMoneyBillWave /> },
            ].map(c => (
              <div key={c.label} className="promo-summary-card">
                <p className="promo-summary-label">{c.label}</p>
                <p className="promo-summary-value">{String(c.value).length > 10
                  ? <span style={{fontSize:14}}>{c.value}</span> : c.value}</p>
                <div className="promo-summary-icon">{c.icon}</div>
              </div>
            ))}
          </div>
        )}

        {/* TOOLBAR */}
        <div className="promo-toolbar">
          <div className="promo-search-wrap">
            <FaSearch className="promo-search-icon" />
            <input type="text" placeholder="Search promos..." value={search}
              onChange={e => setSearch(e.target.value)} className="promo-search" />
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditPromo(null); setForm(emptyForm); }} className="promo-add-btn">
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'New Promo'}
          </button>
        </div>

        {/* FILTER CHIPS */}
        <div className="promo-filters">
          {FILTERS.map(f => (
            <button key={f.key} className={`promo-chip${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
        </div>

        {message && (
          <div className={`promo-message ${isError ? 'promo-message-error' : 'promo-message-success'}`}>{message}</div>
        )}

        {/* CREATE FORM */}
        {showForm && !editPromo && <FormPanel isEdit={false} />}

        {/* EDIT FORM */}
        {editPromo && <FormPanel isEdit={true} />}

        <p className="promo-result-count">{filtered.length} promo{filtered.length !== 1 ? 's' : ''} found</p>

        {/* PROMO CARDS */}
        <div className="promo-grid">
          {filtered.length === 0 ? (
            <div className="promo-empty">No promotions found.</div>
          ) : filtered.map(p => {
            const ds = getDisplayStatus(p);
            return (
              <div key={p.id} className="promo-card">
                <div className="promo-card-top">
                  <div className="promo-code-row">
                    <span className="promo-code"><FaTicketAlt />{p.promo_code}</span>
                    <button className="promo-copy-btn" onClick={() => copyCode(p.promo_code)} title="Copy code">
                      {copied === p.promo_code ? <FaCheck /> : <FaCopy />}
                    </button>
                    {p.is_featured && <FaStar className="promo-featured-star" title="Featured" />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <span className="promo-badge" style={statusColors[ds] || statusColors.inactive}>{ds}</span>
                    {p.is_expiring_soon && (
                      <span className="promo-expiring-badge"><FaExclamationTriangle /> Expiring Soon</span>
                    )}
                  </div>
                </div>

                <p className="promo-discount">
                  {p.discount_type === 'percentage'
                    ? `${p.discount_value}% OFF`
                    : `₱${Number(p.discount_value).toLocaleString()} OFF`}
                </p>

                <p className="promo-desc">{p.description || 'No description'}</p>

                <div className="promo-meta-list">
                  <p className="promo-meta">
                    {p.discount_type === 'percentage' ? <FaPercent /> : <FaMoneyBillWave />}
                    Min order: {money(p.min_order)}
                    {p.max_discount_cap ? ` · Max cap: ${money(p.max_discount_cap)}` : ''}
                  </p>
                  <p className="promo-meta">
                    <FaCalendar />
                    {new Date(p.start_date).toLocaleDateString()} → {new Date(p.end_date).toLocaleDateString()}
                  </p>
                  {p.campaign_name && (
                    <p className="promo-meta">🎯 Campaign: {p.campaign_name}</p>
                  )}
                </div>

                <div className="promo-stats-row">
                  <div className="promo-stat-box">
                    <div className="promo-stat-val">{p.total_redemptions || 0}</div>
                    <div className="promo-stat-lbl">Uses</div>
                  </div>
                  <div className="promo-stat-box">
                    <div className="promo-stat-val" style={{fontSize:12}}>{money(p.total_discount_given)}</div>
                    <div className="promo-stat-lbl">Discounts</div>
                  </div>
                  <div className="promo-stat-box">
                    <div className="promo-stat-val" style={{fontSize:12}}>{money(p.sales_generated)}</div>
                    <div className="promo-stat-lbl">Sales</div>
                  </div>
                </div>

                <div className="promo-actions">
                  <select value={ds} onChange={e => handleStatus(p.id, e.target.value)} className="promo-status-select">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                  </select>
                  <button className="promo-btn promo-btn-edit" onClick={() => openEdit(p)}><FaEdit /> Edit</button>
                  <button className="promo-btn promo-btn-view" onClick={() => setViewPromo(p)}><FaEye /> Details</button>
                  <button className="promo-btn promo-btn-delete" onClick={() => handleDelete(p.id)}><FaTrash /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewPromo && (
        <div className="promo-modal-overlay" onClick={() => setViewPromo(null)}>
          <div className="promo-modal" onClick={e => e.stopPropagation()}>
            <h3 className="promo-modal-title">Promotion Details</h3>
            <p className="promo-modal-code"><FaTicketAlt /> {viewPromo.promo_code}</p>
            {[
              ['Status',           getDisplayStatus(viewPromo)],
              ['Discount',         viewPromo.discount_type === 'percentage' ? `${viewPromo.discount_value}% OFF` : `₱${Number(viewPromo.discount_value).toLocaleString()} OFF`],
              ['Discount Type',    viewPromo.discount_type],
              ['Min Order',        money(viewPromo.min_order)],
              ['Max Discount Cap', viewPromo.max_discount_cap ? money(viewPromo.max_discount_cap) : 'None'],
              ['Usage Limit',      viewPromo.usage_limit ? `${viewPromo.total_redemptions}/${viewPromo.usage_limit} used` : 'Unlimited'],
              ['Per Customer',     `${viewPromo.per_customer_limit || 1} use(s)`],
              ['Valid From',       new Date(viewPromo.start_date).toLocaleDateString()],
              ['Valid Until',      new Date(viewPromo.end_date).toLocaleDateString()],
              ['Linked Campaign',  viewPromo.campaign_name || 'None'],
              ['Featured',         viewPromo.is_featured ? '⭐ Yes' : 'No'],
              ['Total Redemptions',viewPromo.total_redemptions || 0],
              ['Total Discount',   money(viewPromo.total_discount_given)],
              ['Sales Generated',  money(viewPromo.sales_generated)],
              ['Last Used',        viewPromo.last_used_at ? new Date(viewPromo.last_used_at).toLocaleString() : 'Never'],
              ['Description',      viewPromo.description || '—'],
            ].map(([k, v]) => (
              <div key={k} className="promo-modal-row">
                <span className="promo-modal-key">{k}</span>
                <span className="promo-modal-val">{v}</span>
              </div>
            ))}
            <button className="promo-modal-close" onClick={() => setViewPromo(null)}>Close</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Promotions;
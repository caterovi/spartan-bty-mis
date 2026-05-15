import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axiosConfig';
import {
  FaTruck, FaPlus, FaTimes, FaSearch, FaSave, FaEdit,
  FaTrash, FaUpload, FaEye, FaFilter, FaClipboardCheck,
  FaHistory, FaExclamationTriangle,
} from 'react-icons/fa';

const SHIP_STATUSES  = ['pending','shipped','in-transit','delivered','returned'];
const PACK_STATUSES  = ['unpacked','packing','packed'];

const SHIP_STYLES = {
  pending:     { background:'#fff7e8', color:'#9a5f0f',  border:'1px solid #d98a1f' },
  shipped:     { background:'#e8f4ff', color:'#1a5f9a',  border:'1px solid #4a90d9' },
  'in-transit':{ background:'#f0f0ff', color:'#4f46e5',  border:'1px solid #818cf8' },
  delivered:   { background:'#ecfdf3', color:'#2f7d56',  border:'1px solid #2f9d6a' },
  returned:    { background:'#fff1f5', color:'#b5536b',  border:'1px solid #c4607a' },
};
const PACK_STYLES = {
  unpacked: { background:'#fff1f5', color:'#b5536b', border:'1px solid #c4607a' },
  packing:  { background:'#fff7e8', color:'#9a5f0f', border:'1px solid #d98a1f' },
  packed:   { background:'#ecfdf3', color:'#2f7d56', border:'1px solid #2f9d6a' },
};

const fmt = (v) => String(v||'').replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) : '—';

const CHECKLIST_KEYS = [
  { key:'products_verified',    label:'Products Verified' },
  { key:'quantity_checked',     label:'Quantity Checked' },
  { key:'items_packed',         label:'Items Packed' },
  { key:'address_confirmed',    label:'Address Confirmed' },
  { key:'courier_assigned',     label:'Courier Assigned' },
  { key:'tracking_number_added',label:'Tracking Number Added' },
];

const emptyForm = {
  shipment_code:'', order_code:'', customer_name:'', customer_address:'',
  customer_phone:'', courier:'', tracking_number:'', ship_date:'',
  estimated_delivery:'', notes:'', shipping_status:'pending', packing_status:'unpacked',
};

function Shipments() {
  const [shipments, setShipments]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [viewId, setViewId]         = useState(null);
  const [viewShipment, setViewShipment] = useState(null);
  const [viewChecklist, setViewChecklist] = useState(null);
  const [viewTimeline, setViewTimeline]   = useState([]);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [message, setMessage]       = useState('');
  const [isError, setIsError]       = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [editForm, setEditForm]     = useState({});
  const [checklistEdit, setChecklistEdit] = useState({});

  // Filters
  const [search, setSearch]                   = useState('');
  const [filterStatus, setFilterStatus]       = useState('all');
  const [filterPacking, setFilterPacking]     = useState('all');
  const [filterCourier, setFilterCourier]     = useState('all');
  const [filterReceipt, setFilterReceipt]     = useState('all');
  const [delayedOnly, setDelayedOnly]         = useState(false);
  const [showFilters, setShowFilters]         = useState(false);

  useEffect(() => { fetchShipments(); }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try { const r = await api.get('/logistics/shipments'); setShipments(r.data||[]); }
    catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  const notify = (msg, err=false) => {
    setMessage(msg); setIsError(err);
    setTimeout(()=>setMessage(''), 4000);
  };

  const handleSubmit = async () => {
    if (!form.shipment_code || !form.order_code || !form.customer_name)
      return notify('Shipment code, order code, and customer name are required.', true);
    try {
      await api.post('/logistics/shipments', form);
      notify('Shipment created!');
      setShowForm(false); setForm(emptyForm);
      fetchShipments();
    } catch(e){ notify(e.response?.data?.message||'Error creating shipment.', true); }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/logistics/shipments/${editId}`, editForm);
      notify('Shipment updated!');
      setEditId(null);
      fetchShipments();
    } catch(e){ notify(e.response?.data?.message||'Error updating shipment.', true); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shipment?')) return;
    try { await api.delete(`/logistics/shipments/${id}`); fetchShipments(); }
    catch(e){ notify('Error deleting.', true); }
  };

  const handleViewDetails = async (shipment) => {
    setViewShipment(shipment);
    setViewId(shipment.id);
    try {
      const [clRes, tlRes] = await Promise.all([
        api.get(`/logistics/shipments/${shipment.id}/checklist`),
        api.get(`/logistics/shipments/${shipment.id}/timeline`),
      ]);
      setViewChecklist(clRes.data);
      setChecklistEdit({ ...clRes.data });
      setViewTimeline(tlRes.data||[]);
    } catch(e){ console.error(e); }
  };

  const handleSaveChecklist = async () => {
    try {
      const r = await api.put(`/logistics/shipments/${viewId}/checklist`, checklistEdit);
      notify(r.data.all_checked ? 'All items checked! Packing status set to Packed.' : 'Checklist saved.');
      const tlRes = await api.get(`/logistics/shipments/${viewId}/timeline`);
      setViewTimeline(tlRes.data||[]);
      fetchShipments();
    } catch(e){ notify('Error saving checklist.', true); }
  };

  const handleUploadReceipt = async (id, file) => {
    const fd = new FormData();
    fd.append('receipt', file);
    try {
      await api.post(`/logistics/shipments/${id}/receipt`, fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      notify('Receipt uploaded!');
      fetchShipments();
    } catch(e){ notify(e.response?.data?.message||'Upload error.', true); }
  };

  const handleDeleteReceipt = async (id) => {
    if (!window.confirm('Remove this receipt?')) return;
    try { await api.delete(`/logistics/shipments/${id}/receipt`); fetchShipments(); }
    catch(e){ notify('Error removing receipt.', true); }
  };

  const couriers = useMemo(() => [...new Set(shipments.map(s=>s.courier).filter(Boolean))], [shipments]);
  const hasFilters = search||filterStatus!=='all'||filterPacking!=='all'||filterCourier!=='all'||filterReceipt!=='all'||delayedOnly;

  const clearFilters = () => {
    setSearch(''); setFilterStatus('all'); setFilterPacking('all');
    setFilterCourier('all'); setFilterReceipt('all'); setDelayedOnly(false);
  };

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.shipment_code||'').toLowerCase().includes(q) ||
      (s.order_code||'').toLowerCase().includes(q) ||
      (s.customer_name||'').toLowerCase().includes(q) ||
      (s.courier||'').toLowerCase().includes(q) ||
      (s.tracking_number||'').toLowerCase().includes(q);
    const matchStatus  = filterStatus==='all'  || s.shipping_status===filterStatus;
    const matchPacking = filterPacking==='all' || s.packing_status===filterPacking;
    const matchCourier = filterCourier==='all' || s.courier===filterCourier;
    const matchReceipt = filterReceipt==='all' ||
      (filterReceipt==='with' && s.receipt_path) ||
      (filterReceipt==='missing' && !s.receipt_path);
    const matchDelayed = !delayedOnly || s.is_delayed;
    return matchSearch && matchStatus && matchPacking && matchCourier && matchReceipt && matchDelayed;
  });

  return (
    <Layout>
      <style>{`
        .sh-page { width:100%; max-width:100%; min-width:0; animation:shFadeUp 0.35s ease both; }
        .sh-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .sh-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .sh-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .sh-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:760px; }
        .sh-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }
        .sh-toolbar { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; justify-content:space-between; align-items:center; gap:14px; }
        .sh-search-wrap { position:relative; width:280px; max-width:100%; }
        .sh-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b5536b; font-size:13px; pointer-events:none; }
        .sh-search { width:100%; padding:11px 13px 11px 36px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; color:#1f2937; font-size:14px; outline:none; box-sizing:border-box; transition:all 180ms ease; }
        .sh-search:focus { border-color:#c4607a; background:#fff; box-shadow:0 0 0 4px rgba(196,96,122,.12); }
        .sh-toolbar-btns { display:flex; gap:8px; flex-shrink:0; }
        .sh-add-btn,.sh-submit-btn { border:none; border-radius:12px; padding:11px 16px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
        .sh-add-btn:hover,.sh-submit-btn:hover { transform:translateY(-1px); }
        .sh-filter-btn { border:1px solid #d8b8c2; border-radius:12px; padding:10px 14px; background:#fff; color:#64748b; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all 180ms ease; white-space:nowrap; }
        .sh-filter-btn:hover,.sh-filter-active { border-color:#c4607a; color:#b5536b; background:#fff1f5; }
        .sh-cancel-btn { border:1px solid #d8b8c2; border-radius:12px; padding:11px 16px; background:#fff; color:#64748b; font-size:14px; font-weight:800; cursor:pointer; }
        .sh-msg { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .sh-msg-ok  { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .sh-msg-err { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .sh-filters { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:14px 16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .sh-filter-select { padding:9px 12px; border-radius:10px; border:1px solid #d8b8c2; background:#fff7fa; color:#374151; font-size:13px; font-weight:600; outline:none; transition:all 180ms ease; }
        .sh-filter-select:focus { border-color:#c4607a; }
        .sh-delayed-toggle { display:inline-flex; align-items:center; gap:7px; padding:9px 14px; border-radius:10px; border:1px solid; font-size:13px; font-weight:800; cursor:pointer; transition:all 180ms ease; }
        .sh-clear-btn { padding:9px 14px; border-radius:10px; border:1px solid #d8b8c2; background:#fff; color:#64748b; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
        .sh-clear-btn:hover { border-color:#c4607a; color:#b5536b; }
        .sh-form { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .sh-form-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .sh-form-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .sh-form-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .sh-form-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .sh-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:14px; }
        .sh-field { display:flex; flex-direction:column; gap:6px; }
        .sh-label { font-size:13px; font-weight:800; color:#374151; }
        .sh-input { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .sh-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .sh-form-actions { display:flex; gap:10px; flex-wrap:wrap; }
        .sh-count { margin:0 0 12px; color:#64748b; font-size:13px; font-weight:700; }
        .sh-table-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); overflow:hidden; }
        .sh-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; border:1px solid #ead1d9; border-radius:14px; }
        .sh-table { width:100%; min-width:1200px; border-collapse:collapse; background:#fff; }
        .sh-table thead { background:#fff7fa; }
        .sh-table th { padding:13px 16px; text-align:left; font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #ead1d9; white-space:nowrap; }
        .sh-table td { padding:13px 16px; font-size:13px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; vertical-align:middle; }
        .sh-table tbody tr:hover { background:#fff7fa; }
        .sh-table tbody tr:last-child td { border-bottom:none; }
        .sh-code { font-weight:850; color:#1f2937; font-size:13px; }
        .sh-badge { display:inline-flex; align-items:center; justify-content:center; padding:5px 10px; border-radius:9999px; font-size:11px; font-weight:800; white-space:nowrap; }
        .sh-delayed { display:inline-flex; align-items:center; gap:4px; background:#fef2f2; color:#dc2626; border:1px solid #ef4444; padding:3px 8px; border-radius:9999px; font-size:10px; font-weight:800; margin-left:5px; }
        .sh-cell-sub { font-size:11px; color:#94a3b8; margin-top:2px; }
        .sh-action-row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
        .sh-btn { border-radius:9px; padding:7px 9px; cursor:pointer; font-size:11px; font-weight:800; display:inline-flex; align-items:center; gap:5px; border:1px solid; transition:all 180ms ease; white-space:nowrap; }
        .sh-btn:hover { transform:translateY(-1px); }
        .sh-btn-view    { background:#e8f4ff; color:#1a5f9a; border-color:#4a90d9; }
        .sh-btn-edit    { background:#fff7e8; color:#9a5f0f; border-color:#d98a1f; }
        .sh-btn-upload  { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .sh-btn-preview { background:#f0f0ff; color:#4f46e5; border-color:#818cf8; }
        .sh-btn-del-rec { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .sh-btn-delete  { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .sh-empty { padding:40px!important; text-align:center; color:#94a3b8!important; font-size:14px!important; font-weight:700; }
        .sh-loading { padding:40px; text-align:center; color:#64748b; font-size:14px; font-weight:700; }

        /* MODAL */
        .sh-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .sh-modal { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:700px; box-shadow:0 20px 60px rgba(0,0,0,.2); max-height:90vh; overflow-y:auto; }
        .sh-modal-title { margin:0 0 20px; font-size:20px; font-weight:800; color:#1f2937; padding-bottom:14px; border-bottom:1px solid #f3e8ec; }
        .sh-modal-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f3e8ec; font-size:13px; }
        .sh-modal-row:last-of-type { border-bottom:none; }
        .sh-modal-key { color:#64748b; font-weight:700; }
        .sh-modal-val { color:#1f2937; font-weight:800; text-align:right; max-width:55%; }
        .sh-modal-close { margin-top:20px; width:100%; padding:12px; border:none; border-radius:12px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; }
        .sh-section-title { font-size:11px; font-weight:800; color:#b5536b; text-transform:uppercase; letter-spacing:1px; margin:20px 0 10px; padding-bottom:8px; border-bottom:1px solid #f3e8ec; }

        /* CHECKLIST */
        .sh-checklist-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; background:#fff7fa; border:1px solid #ead1d9; margin-bottom:7px; }
        .sh-checklist-label { font-size:13px; font-weight:700; color:#374151; }
        .sh-check-input { width:18px; height:18px; accent-color:#c4607a; cursor:pointer; }

        /* TIMELINE */
        .sh-timeline { position:relative; padding-left:20px; }
        .sh-timeline::before { content:""; position:absolute; left:8px; top:0; bottom:0; width:2px; background:#f3e8ec; border-radius:2px; }
        .sh-timeline-item { position:relative; margin-bottom:14px; }
        .sh-timeline-dot { position:absolute; left:-16px; top:4px; width:10px; height:10px; border-radius:50%; background:#c4607a; border:2px solid #fff; box-shadow:0 0 0 2px #c4607a; }
        .sh-timeline-content { background:#fff7fa; border:1px solid #ead1d9; border-radius:10px; padding:10px 12px; }
        .sh-timeline-event { font-weight:800; color:#1f2937; font-size:13px; margin-bottom:2px; }
        .sh-timeline-desc { font-size:12px; color:#64748b; }
        .sh-timeline-time { font-size:10px; color:#94a3b8; margin-top:4px; }

        /* RECEIPT PREVIEW */
        .sh-receipt-modal { max-width:480px; }
        .sh-receipt-img { width:100%; border-radius:12px; border:1px solid #ead1d9; }
        .sh-receipt-meta { margin-top:14px; }

        /* MOBILE CARDS */
        .sh-mobile-cards { display:none; }
        .sh-mobile-card { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:16px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,.05); position:relative; overflow:hidden; }
        .sh-mobile-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .sh-mobile-card-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
        .sh-mobile-card-code { font-weight:850; color:#1f2937; font-size:14px; }
        .sh-mobile-card-badges { display:flex; gap:6px; flex-wrap:wrap; }
        .sh-mobile-card-row { font-size:12px; color:#64748b; margin-bottom:4px; }
        .sh-mobile-card-row strong { color:#374151; }
        .sh-mobile-card-actions { display:flex; gap:6px; flex-wrap:wrap; margin-top:12px; }

        @keyframes shFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width:1180px) { .sh-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width:768px) {
          .sh-hero { align-items:flex-start; padding:20px; }
          .sh-title { font-size:24px; }
          .sh-hero-icon { width:48px; height:48px; font-size:20px; }
          .sh-toolbar { flex-direction:column; align-items:stretch; }
          .sh-toolbar-btns { flex-direction:column; }
          .sh-search-wrap,.sh-add-btn,.sh-filter-btn { width:100%; }
          .sh-filters { flex-direction:column; align-items:stretch; }
          .sh-filter-select,.sh-delayed-toggle,.sh-clear-btn { width:100%; }
          .sh-grid { grid-template-columns:1fr; }
          .sh-form-actions { flex-direction:column; }
          .sh-submit-btn,.sh-cancel-btn { width:100%; }
          /* Switch to cards on mobile */
          .sh-table-panel { display:none; }
          .sh-mobile-cards { display:block; }
        }
        @media (max-width:520px) { .sh-hero { flex-direction:column-reverse; } }
      `}</style>

      <div className="sh-page">
        {/* HERO */}
        <div className="sh-hero">
          <div>
            <p className="sh-eyebrow">Logistics Management</p>
            <h3 className="sh-title">Shipments</h3>
            <p className="sh-subtitle">Track shipments, packing status, delivery timelines, and proof of delivery.</p>
          </div>
          <div className="sh-hero-icon"><FaTruck /></div>
        </div>

        {/* TOOLBAR */}
        <div className="sh-toolbar">
          <div className="sh-search-wrap">
            <FaSearch className="sh-search-icon" />
            <input type="text" placeholder="Search shipments..." value={search}
              onChange={e=>setSearch(e.target.value)} className="sh-search" />
          </div>
          <div className="sh-toolbar-btns">
            <button className={`sh-filter-btn${hasFilters?' sh-filter-active':''}`}
              onClick={()=>setShowFilters(!showFilters)}>
              <FaFilter /> Filters {hasFilters?'● Active':''}
            </button>
            <button className="sh-add-btn" onClick={()=>setShowForm(!showForm)}>
              {showForm?<FaTimes />:<FaPlus />}
              {showForm?'Cancel':'New Shipment'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`sh-msg ${isError?'sh-msg-err':'sh-msg-ok'}`}>{message}</div>
        )}

        {/* FILTERS */}
        {showFilters && (
          <div className="sh-filters">
            <FaFilter style={{color:'#b5536b',fontSize:13,flexShrink:0}} />
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="sh-filter-select">
              <option value="all">All Statuses</option>
              {SHIP_STATUSES.map(s=><option key={s} value={s}>{fmt(s)}</option>)}
            </select>
            <select value={filterPacking} onChange={e=>setFilterPacking(e.target.value)} className="sh-filter-select">
              <option value="all">All Packing</option>
              {PACK_STATUSES.map(s=><option key={s} value={s}>{fmt(s)}</option>)}
            </select>
            <select value={filterCourier} onChange={e=>setFilterCourier(e.target.value)} className="sh-filter-select">
              <option value="all">All Couriers</option>
              {couriers.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterReceipt} onChange={e=>setFilterReceipt(e.target.value)} className="sh-filter-select">
              <option value="all">All Receipts</option>
              <option value="with">With Receipt</option>
              <option value="missing">Missing Receipt</option>
            </select>
            <button className="sh-delayed-toggle"
              style={delayedOnly?{background:'#fef2f2',color:'#dc2626',borderColor:'#ef4444'}:{background:'#fff',color:'#64748b',borderColor:'#d8b8c2'}}
              onClick={()=>setDelayedOnly(!delayedOnly)}>
              <FaExclamationTriangle /> Delayed Only
            </button>
            {hasFilters && <button className="sh-clear-btn" onClick={clearFilters}><FaTimes /> Clear</button>}
          </div>
        )}

        {/* CREATE FORM */}
        {showForm && (
          <div className="sh-form">
            <div className="sh-form-header">
              <div className="sh-form-icon"><FaPlus /></div>
              <div>
                <h4 className="sh-form-title">New Shipment</h4>
                <p className="sh-form-note">Fill in shipment details. Shipments are usually created from forwarded Sales orders.</p>
              </div>
            </div>
            <div className="sh-grid">
              {[
                {label:'Shipment Code *', key:'shipment_code', placeholder:'SHIP-001'},
                {label:'Order Code *',    key:'order_code',    placeholder:'ORD-001'},
                {label:'Customer Name *', key:'customer_name', placeholder:'Full name'},
                {label:'Customer Phone',  key:'customer_phone',placeholder:'+63XXXXXXXXXX'},
                {label:'Courier',         key:'courier',       placeholder:'J&T, LBC...'},
                {label:'Tracking No.',    key:'tracking_number',placeholder:'Tracking number'},
                {label:'Ship Date',       key:'ship_date',     type:'date'},
                {label:'Est. Delivery',   key:'estimated_delivery', type:'date'},
              ].map(f=>(
                <div key={f.key} className="sh-field">
                  <label className="sh-label">{f.label}</label>
                  <input type={f.type||'text'} placeholder={f.placeholder||''} value={form[f.key]||''}
                    onChange={e=>setForm({...form,[f.key]:e.target.value})} className="sh-input" />
                </div>
              ))}
              <div className="sh-field" style={{gridColumn:'span 3'}}>
                <label className="sh-label">Customer Address</label>
                <input type="text" placeholder="Delivery address" value={form.customer_address||''}
                  onChange={e=>setForm({...form,customer_address:e.target.value})} className="sh-input" />
              </div>
              <div className="sh-field" style={{gridColumn:'span 3'}}>
                <label className="sh-label">Notes</label>
                <input type="text" placeholder="Optional notes" value={form.notes||''}
                  onChange={e=>setForm({...form,notes:e.target.value})} className="sh-input" />
              </div>
            </div>
            <button onClick={handleSubmit} className="sh-submit-btn"><FaSave /> Create Shipment</button>
          </div>
        )}

        {/* EDIT FORM */}
        {editId && (
          <div className="sh-form">
            <div className="sh-form-header">
              <div className="sh-form-icon"><FaEdit /></div>
              <div>
                <h4 className="sh-form-title">Edit Shipment</h4>
                <p className="sh-form-note">Update shipment details, status, and tracking info.</p>
              </div>
            </div>
            <div className="sh-grid">
              {[
                {label:'Customer Name',   key:'customer_name'},
                {label:'Customer Phone',  key:'customer_phone'},
                {label:'Courier',         key:'courier'},
                {label:'Tracking No.',    key:'tracking_number'},
                {label:'Ship Date',       key:'ship_date',       type:'date'},
                {label:'Est. Delivery',   key:'estimated_delivery', type:'date'},
                {label:'Actual Delivery', key:'actual_delivery', type:'date'},
              ].map(f=>(
                <div key={f.key} className="sh-field">
                  <label className="sh-label">{f.label}</label>
                  <input type={f.type||'text'} value={editForm[f.key]||''}
                    onChange={e=>setEditForm({...editForm,[f.key]:e.target.value})} className="sh-input" />
                </div>
              ))}
              <div className="sh-field">
                <label className="sh-label">Shipping Status</label>
                <select value={editForm.shipping_status||'pending'}
                  onChange={e=>setEditForm({...editForm,shipping_status:e.target.value})} className="sh-input">
                  {SHIP_STATUSES.map(s=><option key={s} value={s}>{fmt(s)}</option>)}
                </select>
              </div>
              <div className="sh-field">
                <label className="sh-label">Packing Status</label>
                <select value={editForm.packing_status||'unpacked'}
                  onChange={e=>setEditForm({...editForm,packing_status:e.target.value})} className="sh-input">
                  {PACK_STATUSES.map(s=><option key={s} value={s}>{fmt(s)}</option>)}
                </select>
              </div>
              {editForm.shipping_status === 'returned' && (
                <div className="sh-field" style={{gridColumn:'span 3'}}>
                  <label className="sh-label">Return Reason *</label>
                  <input type="text" placeholder="Reason for return" value={editForm.return_reason||''}
                    onChange={e=>setEditForm({...editForm,return_reason:e.target.value})} className="sh-input" />
                </div>
              )}
              <div className="sh-field" style={{gridColumn:'span 3'}}>
                <label className="sh-label">Customer Address</label>
                <input type="text" value={editForm.customer_address||''}
                  onChange={e=>setEditForm({...editForm,customer_address:e.target.value})} className="sh-input" />
              </div>
              <div className="sh-field" style={{gridColumn:'span 3'}}>
                <label className="sh-label">Notes</label>
                <input type="text" value={editForm.notes||''}
                  onChange={e=>setEditForm({...editForm,notes:e.target.value})} className="sh-input" />
              </div>
            </div>
            <div className="sh-form-actions">
              <button onClick={handleUpdate} className="sh-submit-btn"><FaSave /> Save Changes</button>
              <button onClick={()=>setEditId(null)} className="sh-cancel-btn">Cancel</button>
            </div>
          </div>
        )}

        <p className="sh-count">{filtered.length} shipment{filtered.length!==1?'s':''} found</p>

        {/* DESKTOP TABLE */}
        <div className="sh-table-panel">
          {loading ? (
            <div className="sh-loading">⏳ Loading shipments...</div>
          ) : (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Shipment</th><th>Order</th><th>Customer</th>
                    <th>Courier</th><th>Packing</th><th>Shipping</th>
                    <th>Est. Delivery</th><th>Receipt</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0 ? (
                    <tr><td colSpan="9" className="sh-empty">No shipments found.</td></tr>
                  ) : filtered.map(s=>(
                    <tr key={s.id}>
                      <td>
                        <div className="sh-code">{s.shipment_code}</div>
                      </td>
                      <td style={{color:'#64748b',fontWeight:700}}>{s.order_code}</td>
                      <td>
                        <div style={{fontWeight:700}}>{s.customer_name}</div>
                        <div className="sh-cell-sub">{s.customer_phone||'—'}</div>
                      </td>
                      <td>
                        <div style={{fontWeight:700}}>{s.courier||'—'}</div>
                        <div className="sh-cell-sub">{s.tracking_number||'—'}</div>
                      </td>
                      <td><span className="sh-badge" style={PACK_STYLES[s.packing_status]||{}}>{fmt(s.packing_status)}</span></td>
                      <td>
                        <span className="sh-badge" style={SHIP_STYLES[s.shipping_status]||{}}>{fmt(s.shipping_status)}</span>
                        {s.is_delayed && <span className="sh-delayed"><FaExclamationTriangle style={{fontSize:9}}/> Delayed</span>}
                      </td>
                      <td>
                        <div style={{fontSize:12}}>{fmtDate(s.estimated_delivery)}</div>
                        {s.actual_delivery && <div className="sh-cell-sub">Actual: {fmtDate(s.actual_delivery)}</div>}
                      </td>
                      <td>
                        {s.receipt_path ? (
                          <span style={{color:'#2f7d56',fontWeight:800,fontSize:12}}>✓ Uploaded</span>
                        ) : (
                          <span style={{color:'#94a3b8',fontSize:12}}>—</span>
                        )}
                      </td>
                      <td>
                        <div className="sh-action-row">
                          <button className="sh-btn sh-btn-view" onClick={()=>handleViewDetails(s)}>
                            <FaHistory /> Details
                          </button>
                          <button className="sh-btn sh-btn-edit" onClick={()=>{
                            setEditId(s.id);
                            setEditForm({
                              customer_name:s.customer_name||'', customer_phone:s.customer_phone||'',
                              customer_address:s.customer_address||'', courier:s.courier||'',
                              tracking_number:s.tracking_number||'', ship_date:s.ship_date?.slice(0,10)||'',
                              estimated_delivery:s.estimated_delivery?.slice(0,10)||'',
                              actual_delivery:s.actual_delivery?.slice(0,10)||'',
                              notes:s.notes||'', shipping_status:s.shipping_status||'pending',
                              packing_status:s.packing_status||'unpacked', return_reason:s.return_reason||'',
                            });
                            setShowForm(false);
                          }}>
                            <FaEdit /> Edit
                          </button>
                          <label className="sh-btn sh-btn-upload" style={{cursor:'pointer'}}>
                            <FaUpload /> {s.receipt_path?'Re-Upload':'Upload'}
                            <input type="file" accept="image/*,application/pdf" style={{display:'none'}}
                              onChange={e=>e.target.files[0]&&handleUploadReceipt(s.id,e.target.files[0])} />
                          </label>
                          {s.receipt_path && (
                            <>
                              <button className="sh-btn sh-btn-preview"
                                onClick={()=>setReceiptPreview(s)}>
                                <FaEye /> View
                              </button>
                              <button className="sh-btn sh-btn-del-rec"
                                onClick={()=>handleDeleteReceipt(s.id)}>
                                <FaTrash />
                              </button>
                            </>
                          )}
                          <button className="sh-btn sh-btn-delete" onClick={()=>handleDelete(s.id)}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MOBILE CARDS */}
        <div className="sh-mobile-cards">
          {filtered.length===0 ? (
            <div style={{padding:30,textAlign:'center',color:'#94a3b8',fontWeight:700}}>No shipments found.</div>
          ) : filtered.map(s=>(
            <div key={s.id} className="sh-mobile-card">
              <div className="sh-mobile-card-head">
                <div>
                  <div className="sh-mobile-card-code">{s.shipment_code}</div>
                  <div style={{fontSize:11,color:'#64748b'}}>{s.order_code}</div>
                </div>
                <div className="sh-mobile-card-badges">
                  <span className="sh-badge" style={SHIP_STYLES[s.shipping_status]||{}}>{fmt(s.shipping_status)}</span>
                  <span className="sh-badge" style={PACK_STYLES[s.packing_status]||{}}>{fmt(s.packing_status)}</span>
                  {s.is_delayed && <span className="sh-delayed"><FaExclamationTriangle style={{fontSize:9}}/> Delayed</span>}
                </div>
              </div>
              <div className="sh-mobile-card-row"><strong>Customer:</strong> {s.customer_name}</div>
              <div className="sh-mobile-card-row"><strong>Courier:</strong> {s.courier||'—'} {s.tracking_number?`| ${s.tracking_number}`:''}</div>
              <div className="sh-mobile-card-row"><strong>Est. Delivery:</strong> {fmtDate(s.estimated_delivery)}</div>
              <div className="sh-mobile-card-actions">
                <button className="sh-btn sh-btn-view" onClick={()=>handleViewDetails(s)}><FaHistory /> Details</button>
                <button className="sh-btn sh-btn-edit" onClick={()=>{
                  setEditId(s.id);
                  setEditForm({
                    customer_name:s.customer_name||'', customer_phone:s.customer_phone||'',
                    customer_address:s.customer_address||'', courier:s.courier||'',
                    tracking_number:s.tracking_number||'', ship_date:s.ship_date?.slice(0,10)||'',
                    estimated_delivery:s.estimated_delivery?.slice(0,10)||'',
                    actual_delivery:s.actual_delivery?.slice(0,10)||'',
                    notes:s.notes||'', shipping_status:s.shipping_status||'pending',
                    packing_status:s.packing_status||'unpacked', return_reason:s.return_reason||'',
                  });
                  setShowForm(false);
                }}><FaEdit /> Edit</button>
                <label className="sh-btn sh-btn-upload" style={{cursor:'pointer'}}>
                  <FaUpload /> Upload
                  <input type="file" accept="image/*,application/pdf" style={{display:'none'}}
                    onChange={e=>e.target.files[0]&&handleUploadReceipt(s.id,e.target.files[0])} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILS MODAL */}
      {viewShipment && (
        <div className="sh-modal-overlay" onClick={()=>setViewShipment(null)}>
          <div className="sh-modal" onClick={e=>e.stopPropagation()}>
            <h3 className="sh-modal-title">
              Shipment Details — {viewShipment.shipment_code}
              {viewShipment.is_delayed && (
                <span className="sh-delayed" style={{marginLeft:10}}><FaExclamationTriangle /> Delayed</span>
              )}
            </h3>

            {/* Info */}
            {[
              ['Order Code',        viewShipment.order_code],
              ['Customer',          viewShipment.customer_name],
              ['Phone',             viewShipment.customer_phone||'—'],
              ['Address',           viewShipment.customer_address||'—'],
              ['Courier',           viewShipment.courier||'—'],
              ['Tracking No.',      viewShipment.tracking_number||'—'],
              ['Ship Date',         fmtDate(viewShipment.ship_date)],
              ['Est. Delivery',     fmtDate(viewShipment.estimated_delivery)],
              ['Actual Delivery',   fmtDate(viewShipment.actual_delivery)],
              ['Packing Status',    fmt(viewShipment.packing_status)],
              ['Shipping Status',   fmt(viewShipment.shipping_status)],
              ['Return Reason',     viewShipment.return_reason||'—'],
              ['Proof Type',        viewShipment.proof_type||'—'],
              ['Receipt Uploaded',  viewShipment.receipt_uploaded_at ? new Date(viewShipment.receipt_uploaded_at).toLocaleString() : '—'],
              ['Notes',             viewShipment.notes||'—'],
            ].map(([k,v])=>(
              <div key={k} className="sh-modal-row">
                <span className="sh-modal-key">{k}</span>
                <span className="sh-modal-val">{v}</span>
              </div>
            ))}

            {/* Packing Checklist */}
            {viewChecklist && (
              <>
                <div className="sh-section-title"><FaClipboardCheck style={{marginRight:6}}/>Packing Checklist</div>
                {CHECKLIST_KEYS.map(ck=>(
                  <div key={ck.key} className="sh-checklist-item">
                    <input type="checkbox" className="sh-check-input"
                      checked={!!checklistEdit[ck.key]}
                      onChange={e=>setChecklistEdit({...checklistEdit,[ck.key]:e.target.checked})} />
                    <span className="sh-checklist-label">{ck.label}</span>
                  </div>
                ))}
                <button onClick={handleSaveChecklist} style={{marginTop:10,width:'100%',padding:'10px',border:'none',borderRadius:10,background:'linear-gradient(135deg,#c4607a,#e58ca3)',color:'#fff',fontWeight:800,cursor:'pointer',fontSize:13}}>
                  <FaSave style={{marginRight:6}}/> Save Checklist
                </button>
              </>
            )}

            {/* Timeline */}
            {viewTimeline.length > 0 && (
              <>
                <div className="sh-section-title"><FaHistory style={{marginRight:6}}/>Shipment Timeline</div>
                <div className="sh-timeline">
                  {viewTimeline.map((t,i)=>(
                    <div key={t.id||i} className="sh-timeline-item">
                      <div className="sh-timeline-dot" />
                      <div className="sh-timeline-content">
                        <div className="sh-timeline-event">{t.event_type}</div>
                        <div className="sh-timeline-desc">{t.event_description}</div>
                        <div className="sh-timeline-time">{new Date(t.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button className="sh-modal-close" onClick={()=>setViewShipment(null)}>Close</button>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {receiptPreview && (
        <div className="sh-modal-overlay" onClick={()=>setReceiptPreview(null)}>
          <div className="sh-modal sh-receipt-modal" onClick={e=>e.stopPropagation()}>
            <h3 className="sh-modal-title">Receipt — {receiptPreview.shipment_code}</h3>
            {receiptPreview.receipt_path?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={`${import.meta.env.VITE_API_URL?.replace('/api','')}/uploads/receipts/${receiptPreview.receipt_path}`}
                alt="Receipt" className="sh-receipt-img" />
            ) : (
              <a href={`${import.meta.env.VITE_API_URL?.replace('/api','')}/uploads/receipts/${receiptPreview.receipt_path}`}
                target="_blank" rel="noreferrer"
                style={{display:'block',padding:'20px',textAlign:'center',color:'#b5536b',fontWeight:800,fontSize:14}}>
                📄 View File
              </a>
            )}
            <div className="sh-receipt-meta">
              {[
                ['File',          receiptPreview.receipt_path||'—'],
                ['Proof Type',    fmt(receiptPreview.proof_type||'receipt')],
                ['Uploaded At',   receiptPreview.receipt_uploaded_at ? new Date(receiptPreview.receipt_uploaded_at).toLocaleString() : '—'],
              ].map(([k,v])=>(
                <div key={k} className="sh-modal-row">
                  <span className="sh-modal-key">{k}</span>
                  <span className="sh-modal-val">{v}</span>
                </div>
              ))}
            </div>
            <button className="sh-modal-close" onClick={()=>setReceiptPreview(null)}>Close</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Shipments;
import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaBoxes, FaPlus, FaTimes, FaSearch, FaSave, FaEdit,
  FaArchive, FaEye, FaTag, FaLayerGroup, FaWarehouse,
  FaTruckLoading, FaFilter, FaPrint,
} from "react-icons/fa";

const PRODUCT_TYPES = [
  'Single Product', 'Product Set / Bundle', 'Promo Bundle',
  'Limited Edition Set', 'Packaging Material', 'Marketing Material',
  'Supplies', 'Others',
];

const CATEGORIES = [
  'Glow Package', 'Skincare Set', 'Cleanser', 'Toner', 'Serum',
  'Cream / Mask', 'Sunscreen / Sun Stick', 'Whitening Set',
  'Overnight Mask', 'Selfcare Set', 'Routine Set', 'Limited Edition',
  'Promo Bundle', 'Cosmetics', 'Packaging', 'Marketing Materials',
  'Supplies', 'Others',
];

const STATUS_STYLES = {
  'in-stock':    { backgroundColor:'#ecfdf3', color:'#2f7d56', borderColor:'#2f9d6a' },
  'low-stock':   { backgroundColor:'#fff7e8', color:'#9a5f0f', borderColor:'#d98a1f' },
  'out-of-stock':{ backgroundColor:'#fff1f5', color:'#b5536b', borderColor:'#c4607a' },
};
const STATUS_LABELS = { 'in-stock':'In Stock', 'low-stock':'Low Stock', 'out-of-stock':'Out of Stock' };

const EXPIRY_STYLES = {
  'Expired':    { background:'#fff1f5', color:'#b5536b', border:'1px solid #c4607a' },
  'Near Expiry':{ background:'#fff7e8', color:'#9a5f0f', border:'1px solid #d98a1f' },
  'Valid':      { background:'#ecfdf3', color:'#2f7d56', border:'1px solid #2f9d6a' },
  'No Expiry':  { background:'#f8f3f5', color:'#6b5b63', border:'1px solid #c9b6bf' },
};

const emptyForm = {
  item_code:'', name:'', category:'', product_type:'', quantity:'',
  reorder_level:'10', supplier:'', batch_number:'',
  manufacturing_date:'', expiration_date:'', received_date:'',
};

function Items() {
  const [items, setItems]         = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [viewItem, setViewItem]   = useState(null);
  const [message, setMessage]     = useState('');
  const [isError, setIsError]     = useState(false);
  const [filter, setFilter]       = useState('all');
  const [archivedFilter, setArchivedFilter] = useState('active');
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState(emptyForm);
  const [editForm, setEditForm]   = useState({});
  const [loadingCode, setLoadingCode] = useState(false);

  useEffect(() => { fetchItems(); }, [archivedFilter]);

  const fetchItems = async () => {
    try {
      const archived = archivedFilter === 'active' ? 'false' : archivedFilter === 'archived' ? 'true' : 'all';
      const r = await api.get(`/inventory/items?archived=${archived}`);
      setItems(r.data || []);
    } catch(e){ console.error(e); }
  };

  const fetchNextCode = async (product_type) => {
    setLoadingCode(true);
    try {
      const r = await api.get(`/inventory/next-code?product_type=${encodeURIComponent(product_type||'')}`);
      setForm(f => ({...f, item_code: r.data.item_code}));
    } catch(e){ console.error(e); }
    finally { setLoadingCode(false); }
  };

  const notify = (msg, err=false) => {
    setMessage(msg); setIsError(err);
    setTimeout(()=>setMessage(''), 3500);
  };

  const handleOpenForm = async () => {
    if (!showForm) {
      setForm(emptyForm);
      await fetchNextCode('');
    }
    setShowForm(!showForm);
    setEditId(null);
  };

  const handleProductTypeChange = async (pt) => {
    setForm(f=>({...f, product_type:pt}));
    await fetchNextCode(pt);
  };

  const handleSubmit = async () => {
    if (!form.name?.trim())   return notify('Item name is required.', true);
    if (!form.category)       return notify('Category is required.', true);
    if (!form.product_type)   return notify('Product type is required.', true);
    if (form.quantity === '')  return notify('Quantity is required.', true);
    if (Number(form.quantity) < 0) return notify('Quantity cannot be negative.', true);
    if (Number(form.reorder_level) < 0) return notify('Reorder level cannot be negative.', true);
    try {
      const r = await api.post('/inventory/items', form);
      notify(r.data.message || 'Item added successfully!');
      setShowForm(false); setForm(emptyForm);
      fetchItems();
    } catch(e) { notify(e.response?.data?.message || 'Error adding item.', true); }
  };

  const handleUpdate = async () => {
    if (!editForm.name?.trim()) return notify('Item name is required.', true);
    if (Number(editForm.reorder_level) < 0) return notify('Reorder level cannot be negative.', true);
    try {
      await api.put(`/inventory/items/${editId}`, editForm);
      notify('Item updated successfully!');
      setEditId(null);
      fetchItems();
    } catch(e) { notify(e.response?.data?.message || 'Error updating item.', true); }
  };

  const handleArchive = async (item) => {
    if (!window.confirm(`Archive "${item.name}"? It will no longer appear in active selections but history is preserved.`)) return;
    try {
      await api.put(`/inventory/items/${item.id}/archive`);
      notify('Item archived.');
      fetchItems();
    } catch(e) { notify('Error archiving item.', true); }
  };

  const handleViewDetails = async (item) => {
    try {
      const r = await api.get(`/inventory/items/${item.id}/details`);
      setViewItem(r.data);
    } catch(e) { setViewItem(item); }
  };

  const handlePrint = () => {
    const win = window.open('','_blank');
    if (!win) return;
    const activeItems = items.filter(i => !i.is_archived);
    win.document.write(`
      <html><head><title>Inventory Report</title>
      <style>
        body{font-family:Arial,sans-serif;padding:30px;color:#1f2937}
        h1{color:#c4607a;margin-bottom:4px}
        .sub{color:#64748b;font-size:13px;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th{background:#fff7fa;padding:8px 10px;text-align:left;border-bottom:1px solid #ead1d9;font-size:11px;text-transform:uppercase;color:#64748b}
        td{padding:8px 10px;border-bottom:1px solid #f3e8ec}
        .low{color:#9a5f0f;font-weight:800}
        .out{color:#b5536b;font-weight:800}
        .ok{color:#2f7d56;font-weight:800}
        @media print{button{display:none}}
      </style></head><body>
      <h1>Spartan BTY Inventory Report</h1>
      <div class="sub">Generated: ${new Date().toLocaleString()}</div>
      <button onclick="window.print()" style="margin-bottom:16px;padding:8px 16px;background:#c4607a;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:800">🖨 Print</button>
      <table>
        <thead><tr>
          <th>Code</th><th>Item Name</th><th>Category</th><th>Type</th>
          <th>Qty</th><th>Reorder</th><th>Supplier</th><th>Status</th>
          <th>Batch</th><th>Expiry</th><th>Suggested Restock</th>
        </tr></thead>
        <tbody>
          ${activeItems.map(i=>{
            const sugg = Math.max(0,(Number(i.reorder_level)*2)-Number(i.quantity));
            const cls = i.status==='out-of-stock'?'out':i.status==='low-stock'?'low':'ok';
            return `<tr>
              <td>${i.item_code||'—'}</td><td>${i.name}</td><td>${i.category||'—'}</td>
              <td>${i.product_type||'—'}</td>
              <td class="${cls}">${i.quantity}</td><td>${i.reorder_level}</td>
              <td>${i.supplier||'—'}</td>
              <td class="${cls}">${STATUS_LABELS[i.status]||i.status}</td>
              <td>${i.batch_number||'—'}</td>
              <td>${i.expiration_date?new Date(i.expiration_date).toLocaleDateString():'—'}</td>
              <td class="${sugg>0?'low':'ok'}">${sugg>0?'+'+sugg:'—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      </body></html>
    `);
    win.document.close();
  };

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (item.item_code||'').toLowerCase().includes(q) ||
      (item.name||'').toLowerCase().includes(q) ||
      (item.category||'').toLowerCase().includes(q) ||
      (item.product_type||'').toLowerCase().includes(q) ||
      (item.supplier||'').toLowerCase().includes(q) ||
      (item.status||'').toLowerCase().includes(q);
    const matchFilter = filter==='all' || item.status===filter;
    return matchSearch && matchFilter;
  });

  const FormSection = ({label}) => (
    <div style={{gridColumn:'span 3',fontSize:11,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'#b5536b',paddingBottom:8,borderBottom:'1px solid #f3e8ec',marginTop:8}}>
      {label}
    </div>
  );

  return (
    <Layout>
      <style>{`
        .items-page { width:100%; max-width:100%; min-width:0; animation:itemsFadeUp 0.35s ease both; }
        .items-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .items-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .items-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .items-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .items-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }
        .items-toolbar { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; justify-content:space-between; align-items:center; gap:14px; }
        .items-search-wrap { position:relative; width:280px; max-width:100%; }
        .items-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b5536b; font-size:13px; pointer-events:none; }
        .items-search { width:100%; padding:11px 13px 11px 36px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; color:#1f2937; font-size:14px; outline:none; box-sizing:border-box; transition:all 180ms ease; }
        .items-search:focus { border-color:#c4607a; background:#fff; box-shadow:0 0 0 4px rgba(196,96,122,.12); }
        .items-toolbar-btns { display:flex; gap:8px; flex-shrink:0; }
        .items-add-btn,.items-submit-btn { border:none; border-radius:12px; padding:11px 16px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
        .items-add-btn:hover,.items-submit-btn:hover { transform:translateY(-1px); box-shadow:0 10px 22px rgba(196,96,122,.28); }
        .items-print-btn { border:1.5px solid #e2c6cf; border-radius:12px; padding:10px 14px; background:#fff; color:#64748b; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all 180ms ease; }
        .items-print-btn:hover { border-color:#c4607a; color:#b5536b; }
        .items-cancel-btn { border:1px solid #d8b8c2; border-radius:12px; padding:11px 16px; background:#fff; color:#64748b; font-size:14px; font-weight:800; cursor:pointer; }
        .items-filters { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:14px 16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .items-filter-select { padding:8px 12px; border-radius:10px; border:1px solid #d8b8c2; background:#fff7fa; color:#374151; font-size:13px; font-weight:600; outline:none; }
        .items-filter-btn { padding:8px 13px; border-radius:9999px; border:1px solid #d8b8c2; background:#fff; color:#64748b; cursor:pointer; font-size:13px; font-weight:800; transition:all 180ms ease; }
        .items-filter-btn:hover { border-color:#c4607a; transform:translateY(-1px); }
        .items-filter-active { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; border-color:#c4607a; box-shadow:0 8px 18px rgba(196,96,122,.18); }
        .items-message { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .items-msg-ok  { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .items-msg-err { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .items-form { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .items-form-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .items-form-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .items-form-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .items-form-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .items-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:16px; }
        .items-field { display:flex; flex-direction:column; gap:6px; }
        .items-label { font-size:13px; font-weight:800; color:#374151; }
        .items-label-opt { font-size:11px; font-weight:400; color:#94a3b8; margin-left:4px; }
        .items-input { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .items-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .items-auto-code { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; }
        .items-auto-code-text { font-size:15px; font-weight:900; color:#b5536b; letter-spacing:.8px; }
        .items-auto-code-badge { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:10px; font-weight:900; padding:4px 8px; border-radius:9999px; }
        .items-form-actions { display:flex; gap:10px; flex-wrap:wrap; }
        .items-count { margin:0 0 12px; color:#64748b; font-size:13px; font-weight:700; }
        .items-table-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); overflow:hidden; }
        .items-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; border:1px solid #ead1d9; border-radius:14px; }
        .items-table { width:100%; min-width:1100px; border-collapse:collapse; background:#fff; }
        .items-table thead { background:#fff7fa; }
        .items-table th { padding:13px 16px; text-align:left; font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #ead1d9; white-space:nowrap; }
        .items-table td { padding:14px 16px; font-size:14px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; vertical-align:middle; }
        .items-table tbody tr:hover { background:#fff7fa; }
        .items-table tbody tr:last-child td { border-bottom:none; }
        .items-code { color:#64748b; font-size:13px; font-weight:800; }
        .items-name { font-weight:850; color:#1f2937; }
        .items-cell-icon { display:inline-flex; align-items:center; gap:7px; }
        .items-cell-icon svg { color:#b5536b; flex:0 0 auto; }
        .items-badge { display:inline-flex; align-items:center; justify-content:center; padding:5px 10px; border-radius:9999px; font-size:11px; font-weight:800; border:1px solid; white-space:nowrap; }
        .items-action-row { display:flex; gap:7px; align-items:center; }
        .items-btn { border-radius:10px; padding:8px 10px; cursor:pointer; font-size:12px; font-weight:800; display:inline-flex; align-items:center; gap:6px; border:1px solid; transition:all 180ms ease; }
        .items-btn:hover { transform:translateY(-1px); }
        .items-btn-view    { background:#e8f4ff; color:#1a5f9a; border-color:#4a90d9; }
        .items-btn-edit    { background:#fff7e8; color:#9a5f0f; border-color:#d98a1f; }
        .items-btn-archive { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .items-empty { padding:40px!important; text-align:center; color:#94a3b8!important; font-size:14px!important; font-weight:700; }
        .items-restock { font-size:11px; color:#9a5f0f; font-weight:800; margin-top:2px; }
        /* MODAL */
        .items-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .items-modal { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:580px; box-shadow:0 20px 60px rgba(0,0,0,.2); max-height:90vh; overflow-y:auto; }
        .items-modal-title { margin:0 0 20px; font-size:20px; font-weight:800; color:#1f2937; padding-bottom:14px; border-bottom:1px solid #f3e8ec; }
        .items-modal-row { display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid #f3e8ec; font-size:13px; }
        .items-modal-row:last-of-type { border-bottom:none; }
        .items-modal-key { color:#64748b; font-weight:700; }
        .items-modal-val { color:#1f2937; font-weight:800; text-align:right; max-width:55%; }
        .items-modal-close { margin-top:20px; width:100%; padding:12px; border:none; border-radius:12px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; }
        @keyframes itemsFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width:1180px) { .items-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width:768px) {
          .items-hero { align-items:flex-start; padding:20px; }
          .items-title { font-size:24px; }
          .items-hero-icon { width:48px; height:48px; font-size:20px; }
          .items-toolbar { flex-direction:column; align-items:stretch; }
          .items-toolbar-btns { flex-direction:column; }
          .items-search-wrap,.items-add-btn,.items-print-btn { width:100%; }
          .items-filters { flex-direction:column; align-items:stretch; }
          .items-filter-select,.items-filter-btn { width:100%; }
          .items-grid { grid-template-columns:1fr; }
          .items-form-actions { flex-direction:column; }
          .items-submit-btn,.items-cancel-btn { width:100%; }
          .items-table-panel { padding:12px; }
          .items-table { min-width:1000px; }
        }
        @media (max-width:520px) { .items-hero { flex-direction:column-reverse; } }
      `}</style>

      <div className="items-page">
        {/* HERO */}
        <div className="items-hero">
          <div>
            <p className="items-eyebrow">Inventory Records</p>
            <h3 className="items-title">Inventory Items</h3>
            <p className="items-subtitle">
              Manage item records, stock levels, batch tracking, and product classifications.
            </p>
          </div>
          <div className="items-hero-icon"><FaBoxes /></div>
        </div>

        {/* TOOLBAR */}
        <div className="items-toolbar">
          <div className="items-search-wrap">
            <FaSearch className="items-search-icon" />
            <input type="text" placeholder="Search items..." value={search}
              onChange={e=>setSearch(e.target.value)} className="items-search" />
          </div>
          <div className="items-toolbar-btns">
            <button className="items-print-btn" onClick={handlePrint}><FaPrint /> Print Report</button>
            <button className="items-add-btn" onClick={handleOpenForm}>
              {showForm ? <FaTimes /> : <FaPlus />}
              {showForm ? 'Cancel' : 'Add Item'}
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="items-filters">
          <FaFilter style={{color:'#b5536b',fontSize:13,flexShrink:0}} />
          {['all','in-stock','low-stock','out-of-stock'].map(s=>(
            <button key={s} onClick={()=>setFilter(s)}
              className={`items-filter-btn${filter===s?' items-filter-active':''}`}>
              {s==='all'?'All':STATUS_LABELS[s]||s}
            </button>
          ))}
          <select value={archivedFilter} onChange={e=>setArchivedFilter(e.target.value)} className="items-filter-select" style={{marginLeft:'auto'}}>
            <option value="active">Active Items</option>
            <option value="archived">Archived Items</option>
            <option value="all">All Items</option>
          </select>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className={`items-message ${isError?'items-msg-err':'items-msg-ok'}`}>{message}</div>
        )}

        {/* ADD FORM */}
        {showForm && (
          <div className="items-form">
            <div className="items-form-header">
              <div className="items-form-icon"><FaPlus /></div>
              <div>
                <h4 className="items-form-title">Add New Item</h4>
                <p className="items-form-note">Item code is auto-generated based on product type.</p>
              </div>
            </div>
            <div className="items-grid">
              <FormSection label="Basic Info" />
              <div className="items-field">
                <label className="items-label">Product Type *</label>
                <select value={form.product_type} onChange={e=>handleProductTypeChange(e.target.value)} className="items-input">
                  <option value="">Select type</option>
                  {PRODUCT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="items-field">
                <label className="items-label">Item Code</label>
                <div className="items-auto-code">
                  <span className="items-auto-code-text">{loadingCode?'...':(form.item_code||'—')}</span>
                  <span className="items-auto-code-badge">AUTO</span>
                </div>
              </div>
              <div className="items-field">
                <label className="items-label">Category *</label>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="items-input">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="items-field" style={{gridColumn:'span 3'}}>
                <label className="items-label">Item Name *</label>
                <input type="text" placeholder="e.g. BTY Morning Glow Set" value={form.name}
                  onChange={e=>setForm({...form,name:e.target.value})} className="items-input" />
              </div>
              <div className="items-field">
                <label className="items-label">Quantity *</label>
                <input type="number" placeholder="0" min="0" value={form.quantity}
                  onChange={e=>setForm({...form,quantity:e.target.value})} className="items-input" />
              </div>
              <div className="items-field">
                <label className="items-label">Reorder Level</label>
                <input type="number" placeholder="10" min="0" value={form.reorder_level}
                  onChange={e=>setForm({...form,reorder_level:e.target.value})} className="items-input" />
              </div>
              <div className="items-field">
                <label className="items-label">Supplier <span className="items-label-opt">optional</span></label>
                <input type="text" placeholder="Supplier name" value={form.supplier}
                  onChange={e=>setForm({...form,supplier:e.target.value})} className="items-input" />
              </div>

              <FormSection label="Batch & Expiry" />
              <div className="items-field">
                <label className="items-label">Batch Number <span className="items-label-opt">optional</span></label>
                <input type="text" placeholder="e.g. ACS-001" value={form.batch_number}
                  onChange={e=>setForm({...form,batch_number:e.target.value})} className="items-input" />
              </div>
              <div className="items-field">
                <label className="items-label">Manufacturing Date <span className="items-label-opt">optional</span></label>
                <input type="date" value={form.manufacturing_date}
                  onChange={e=>setForm({...form,manufacturing_date:e.target.value})} className="items-input" />
              </div>
              <div className="items-field">
                <label className="items-label">Expiration Date <span className="items-label-opt">optional</span></label>
                <input type="date" value={form.expiration_date}
                  onChange={e=>setForm({...form,expiration_date:e.target.value})} className="items-input" />
              </div>
              <div className="items-field">
                <label className="items-label">Received Date <span className="items-label-opt">optional</span></label>
                <input type="date" value={form.received_date}
                  onChange={e=>setForm({...form,received_date:e.target.value})} className="items-input" />
              </div>
            </div>
            <button onClick={handleSubmit} className="items-submit-btn"><FaSave /> Save Item</button>
          </div>
        )}

        {/* EDIT FORM */}
        {editId && (
          <div className="items-form">
            <div className="items-form-header">
              <div className="items-form-icon"><FaEdit /></div>
              <div>
                <h4 className="items-form-title">Edit Item</h4>
                <p className="items-form-note">Update item details, classification, and batch info.</p>
              </div>
            </div>
            <div className="items-grid">
              <div className="items-field">
                <label className="items-label">Product Type *</label>
                <select value={editForm.product_type||''} onChange={e=>setEditForm({...editForm,product_type:e.target.value})} className="items-input">
                  <option value="">Select type</option>
                  {PRODUCT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="items-field">
                <label className="items-label">Category *</label>
                <select value={editForm.category||''} onChange={e=>setEditForm({...editForm,category:e.target.value})} className="items-input">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="items-field">
                <label className="items-label">Item Name *</label>
                <input type="text" value={editForm.name||''} onChange={e=>setEditForm({...editForm,name:e.target.value})} className="items-input" />
              </div>
              <div className="items-field">
                <label className="items-label">Reorder Level</label>
                <input type="number" min="0" value={editForm.reorder_level||''} onChange={e=>setEditForm({...editForm,reorder_level:e.target.value})} className="items-input" />
              </div>
              <div className="items-field">
                <label className="items-label">Supplier <span className="items-label-opt">optional</span></label>
                <input type="text" value={editForm.supplier||''} onChange={e=>setEditForm({...editForm,supplier:e.target.value})} className="items-input" />
              </div>
              <div className="items-field">
                <label className="items-label">Batch Number <span className="items-label-opt">optional</span></label>
                <input type="text" value={editForm.batch_number||''} onChange={e=>setEditForm({...editForm,batch_number:e.target.value})} className="items-input" />
              </div>
              <div className="items-field">
                <label className="items-label">Manufacturing Date <span className="items-label-opt">optional</span></label>
                <input type="date" value={editForm.manufacturing_date?.slice(0,10)||''} onChange={e=>setEditForm({...editForm,manufacturing_date:e.target.value})} className="items-input" />
              </div>
              <div className="items-field">
                <label className="items-label">Expiration Date <span className="items-label-opt">optional</span></label>
                <input type="date" value={editForm.expiration_date?.slice(0,10)||''} onChange={e=>setEditForm({...editForm,expiration_date:e.target.value})} className="items-input" />
              </div>
              <div className="items-field">
                <label className="items-label">Received Date <span className="items-label-opt">optional</span></label>
                <input type="date" value={editForm.received_date?.slice(0,10)||''} onChange={e=>setEditForm({...editForm,received_date:e.target.value})} className="items-input" />
              </div>
            </div>
            <div className="items-form-actions">
              <button onClick={handleUpdate} className="items-submit-btn"><FaSave /> Save Changes</button>
              <button onClick={()=>setEditId(null)} className="items-cancel-btn">Cancel</button>
            </div>
          </div>
        )}

        <p className="items-count">{filtered.length} item{filtered.length!==1?'s':''} found</p>

        {/* TABLE */}
        <div className="items-table-panel">
          <div className="items-table-wrap">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Code</th><th>Item Name</th><th>Type</th><th>Category</th>
                  <th>Qty</th><th>Reorder</th><th>Supplier</th><th>Expiry</th>
                  <th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan="10" className="items-empty">No items found.</td></tr>
                ) : filtered.map(item=>{
                  const sugg = Math.max(0,(Number(item.reorder_level)*2)-Number(item.quantity));
                  return (
                    <tr key={item.id}>
                      <td className="items-code"><span className="items-cell-icon"><FaTag />{item.item_code||'—'}</span></td>
                      <td>
                        <div className="items-name"><span className="items-cell-icon"><FaBoxes />{item.name}</span></div>
                        {item.is_archived && <div style={{fontSize:10,color:'#94a3b8',fontWeight:700,marginTop:2}}>ARCHIVED</div>}
                      </td>
                      <td><span style={{fontSize:11,padding:'3px 8px',borderRadius:9999,background:'#fff1f5',color:'#b5536b',border:'1px solid #e8b9c6',fontWeight:700}}>{item.product_type||'—'}</span></td>
                      <td><span className="items-cell-icon"><FaLayerGroup />{item.category||'—'}</span></td>
                      <td>
                        <div style={{fontWeight:900,fontSize:16,color:item.status==='out-of-stock'?'#c4607a':item.status==='low-stock'?'#d98a1f':'#2f9d6a'}}>{item.quantity}</div>
                        {sugg>0 && <div className="items-restock">+{sugg} suggested</div>}
                      </td>
                      <td><span className="items-cell-icon"><FaWarehouse />{item.reorder_level}</span></td>
                      <td><span className="items-cell-icon"><FaTruckLoading />{item.supplier||'—'}</span></td>
                      <td>
                        {item.expiry_status && item.expiry_status !== 'No Expiry' ? (
                          <span style={{padding:'4px 9px',borderRadius:9999,fontSize:11,fontWeight:800,...EXPIRY_STYLES[item.expiry_status]}}>
                            {item.expiry_status}
                          </span>
                        ) : <span style={{color:'#94a3b8',fontSize:12}}>—</span>}
                      </td>
                      <td>
                        <span className="items-badge" style={STATUS_STYLES[item.status]||STATUS_STYLES['in-stock']}>
                          {STATUS_LABELS[item.status]||item.status}
                        </span>
                      </td>
                      <td>
                        <div className="items-action-row">
                          <button className="items-btn items-btn-view" onClick={()=>handleViewDetails(item)}><FaEye /> View</button>
                          {!item.is_archived && (
                            <>
                              <button className="items-btn items-btn-edit" onClick={()=>{
                                setEditId(item.id);
                                setEditForm({ name:item.name, category:item.category, product_type:item.product_type,
                                  reorder_level:item.reorder_level, supplier:item.supplier||'',
                                  batch_number:item.batch_number||'', manufacturing_date:item.manufacturing_date||'',
                                  expiration_date:item.expiration_date||'', received_date:item.received_date||'' });
                                setShowForm(false);
                              }}><FaEdit /> Edit</button>
                              <button className="items-btn items-btn-archive" onClick={()=>handleArchive(item)}><FaArchive /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewItem && (
        <div className="items-modal-overlay" onClick={()=>setViewItem(null)}>
          <div className="items-modal" onClick={e=>e.stopPropagation()}>
            <h3 className="items-modal-title">Item Details — {viewItem.item_code}</h3>
            {[
              ['Item Code',        viewItem.item_code||'—'],
              ['Item Name',        viewItem.name],
              ['Category',         viewItem.category||'—'],
              ['Product Type',     viewItem.product_type||'—'],
              ['Current Quantity', viewItem.quantity],
              ['Reorder Level',    viewItem.reorder_level],
              ['Suggested Restock',Math.max(0,(Number(viewItem.reorder_level)*2)-Number(viewItem.quantity))>0?`+${Math.max(0,(Number(viewItem.reorder_level)*2)-Number(viewItem.quantity))}`:'—'],
              ['Supplier',         viewItem.supplier||'—'],
              ['Status',           STATUS_LABELS[viewItem.status]||viewItem.status],
              ['Batch Number',     viewItem.batch_number||'—'],
              ['Mfg. Date',        viewItem.manufacturing_date?new Date(viewItem.manufacturing_date).toLocaleDateString():'—'],
              ['Expiration Date',  viewItem.expiration_date?new Date(viewItem.expiration_date).toLocaleDateString():'—'],
              ['Expiry Status',    viewItem.expiry_status||'No Expiry'],
              ['Received Date',    viewItem.received_date?new Date(viewItem.received_date).toLocaleDateString():'—'],
              ['Archived',         viewItem.is_archived?'Yes':'No'],
              ['Last Updated',     viewItem.updated_at?new Date(viewItem.updated_at).toLocaleString():'—'],
            ].map(([k,v])=>(
              <div key={k} className="items-modal-row">
                <span className="items-modal-key">{k}</span>
                <span className="items-modal-val">{v}</span>
              </div>
            ))}
            {viewItem.recent_logs?.length > 0 && (
              <>
                <div style={{marginTop:16,fontWeight:800,color:'#b5536b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Recent Movements</div>
                {viewItem.recent_logs.slice(0,5).map(l=>(
                  <div key={l.id} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'7px 0',borderBottom:'1px solid #f3e8ec',color:'#374151'}}>
                    <span style={{fontWeight:700,color:l.type==='stock-in'?'#2f7d56':'#b5536b'}}>{l.type==='stock-in'?'+':'-'}{l.quantity} ({l.type})</span>
                    <span style={{color:'#64748b'}}>{new Date(l.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </>
            )}
            <button className="items-modal-close" onClick={()=>setViewItem(null)}>Close</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Items;
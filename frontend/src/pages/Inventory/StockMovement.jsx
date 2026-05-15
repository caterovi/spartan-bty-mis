import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaArrowDown, FaArrowUp, FaBoxes, FaSearch, FaSave,
  FaTag, FaClock, FaFileAlt, FaFilter,
} from "react-icons/fa";

const TYPE_LABELS = { 'stock-in':'Stock In', 'stock-out':'Stock Out', adjustment:'Adjustment' };

const TYPE_STYLES = {
  'stock-in':  { background:'#ecfdf3', color:'#2f7d56',  border:'1px solid #2f9d6a' },
  'stock-out': { background:'#fff1f5', color:'#b5536b',  border:'1px solid #c4607a' },
  adjustment:  { background:'#eff6ff', color:'#1d4ed8',  border:'1px solid #3b82f6' },
};

const REF_STYLES = {
  'Manual Stock In':              { background:'#ecfdf3', color:'#2f7d56' },
  'Manual Stock Out':             { background:'#fff1f5', color:'#b5536b' },
  'Sales Order Auto-Deduction':   { background:'#fff7e8', color:'#9a5f0f' },
  'Cancelled Order Stock Return': { background:'#e8f4ff', color:'#1a5f9a' },
};

function StockMovement() {
  const [logs, setLogs]     = useState([]);
  const [items, setItems]   = useState([]);
  const [mode, setMode]     = useState('stock-in');
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage]   = useState('');
  const [isError, setIsError]   = useState(false);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [range, setRange]       = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [form, setForm] = useState({ item_id:'', quantity:'', remarks:'' });

  useEffect(() => { fetchLogs(); fetchItems(); }, []);
  useEffect(() => { fetchLogs(); }, [range, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      let url = `/inventory/logs?type=${filter}`;
      if (range !== 'all') url += `&range=${range}`;
      if (range === 'custom' && startDate && endDate) url += `&start_date=${startDate}&end_date=${endDate}`;
      const r = await api.get(url);
      setLogs(r.data||[]);
    } catch(e){ console.error(e); }
  };

  const fetchItems = async () => {
    try {
      const r = await api.get('/inventory/items?archived=false');
      setItems(r.data||[]);
    } catch(e){ console.error(e); }
  };

  const notify = (msg, err=false) => {
    setMessage(msg); setIsError(err);
    setTimeout(()=>setMessage(''), 3500);
  };

  const openForm = (m) => {
    if (mode===m) { setShowForm(!showForm); } else { setMode(m); setShowForm(true); }
  };

  const handleSubmit = async () => {
    if (!form.item_id || !form.quantity) return notify('Please select an item and enter quantity.', true);
    if (Number(form.quantity) <= 0) return notify('Quantity must be greater than 0.', true);
    try {
      const endpoint = mode==='stock-in' ? '/inventory/stock-in' : '/inventory/stock-out';
      await api.post(endpoint, { ...form, performed_by:'Inventory Staff' });
      notify(mode==='stock-in' ? 'Stock added successfully!' : 'Stock removed successfully!');
      setShowForm(false); setForm({item_id:'',quantity:'',remarks:''});
      fetchLogs(); fetchItems();
    } catch(e) {
      notify(e.response?.data?.message || 'Error processing stock movement.', true);
    }
  };

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (l.item_name||'').toLowerCase().includes(q) ||
      (l.item_code||'').toLowerCase().includes(q) ||
      (l.type||'').toLowerCase().includes(q) ||
      (l.remarks||'').toLowerCase().includes(q) ||
      (l.reference_code||'').toLowerCase().includes(q) ||
      (l.reference_type||'').toLowerCase().includes(q);
    const matchFilter = filter==='all' || l.type===filter;
    return matchSearch && matchFilter;
  });

  return (
    <Layout>
      <style>{`
        .stock-page { width:100%; max-width:100%; min-width:0; animation:stockFadeUp 0.35s ease both; }
        .stock-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .stock-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .stock-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .stock-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .stock-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }
        .stock-toolbar { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; justify-content:space-between; align-items:center; gap:14px; }
        .stock-search-wrap { position:relative; width:280px; max-width:100%; }
        .stock-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b5536b; font-size:13px; pointer-events:none; }
        .stock-search { width:100%; padding:11px 13px 11px 36px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; color:#1f2937; font-size:14px; outline:none; box-sizing:border-box; transition:all 180ms ease; }
        .stock-search:focus { border-color:#c4607a; background:#fff; box-shadow:0 0 0 4px rgba(196,96,122,.12); }
        .stock-action-btn,.stock-submit-btn { border:none; border-radius:12px; padding:11px 16px; color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; transition:all 180ms ease; white-space:nowrap; }
        .stock-action-btn.in { background:linear-gradient(135deg,#22c55e,#16a34a); box-shadow:0 8px 18px rgba(34,197,94,.22); }
        .stock-action-btn.out { background:linear-gradient(135deg,#c4607a,#e58ca3); box-shadow:0 8px 18px rgba(196,96,122,.22); }
        .stock-action-btn:hover,.stock-submit-btn:hover { transform:translateY(-1px); }
        .stock-cancel-btn { border:1px solid #d8b8c2; border-radius:12px; padding:11px 16px; background:#fff; color:#64748b; font-size:14px; font-weight:800; cursor:pointer; }
        .stock-filters { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:14px 16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .stock-filter-btn { padding:8px 13px; border-radius:9999px; border:1px solid #d8b8c2; background:#fff; color:#64748b; cursor:pointer; font-size:13px; font-weight:800; transition:all 180ms ease; }
        .stock-filter-btn:hover { border-color:#c4607a; transform:translateY(-1px); }
        .stock-filter-active { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; border-color:#c4607a; }
        .stock-filter-select,.stock-filter-date { padding:9px 12px; border-radius:10px; border:1px solid #d8b8c2; background:#fff7fa; color:#374151; font-size:13px; font-weight:600; outline:none; }
        .stock-message { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .stock-msg-ok  { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .stock-msg-err { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .stock-form { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .stock-form-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .stock-form-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; border:1px solid; flex:0 0 auto; }
        .stock-form-icon.in { background:#dcfce7; border-color:#86efac; color:#16a34a; }
        .stock-form-icon.out { background:#fff1f5; border-color:#e8b9c6; color:#b5536b; }
        .stock-form-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .stock-form-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .stock-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; margin-bottom:16px; }
        .stock-field { display:flex; flex-direction:column; gap:7px; }
        .stock-label { font-size:13px; font-weight:800; color:#374151; }
        .stock-label-opt { font-size:11px; font-weight:400; color:#94a3b8; margin-left:4px; }
        .stock-input { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .stock-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .stock-form-actions { display:flex; gap:10px; flex-wrap:wrap; }
        .stock-count { margin:0 0 12px; color:#64748b; font-size:13px; font-weight:700; }
        .stock-table-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); overflow:hidden; }
        .stock-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; border:1px solid #ead1d9; border-radius:14px; }
        .stock-table { width:100%; min-width:1200px; border-collapse:collapse; background:#fff; }
        .stock-table thead { background:#fff7fa; }
        .stock-table th { padding:13px 16px; text-align:left; font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #ead1d9; white-space:nowrap; }
        .stock-table td { padding:14px 16px; font-size:14px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; vertical-align:middle; }
        .stock-table tbody tr:hover { background:#fff7fa; }
        .stock-table tbody tr:last-child td { border-bottom:none; }
        .stock-item-name { font-weight:850; color:#1f2937; }
        .stock-code { color:#64748b; font-size:13px; font-weight:800; }
        .stock-cell-icon { display:inline-flex; align-items:center; gap:7px; }
        .stock-cell-icon svg { color:#b5536b; flex:0 0 auto; }
        .stock-empty { padding:40px!important; text-align:center; color:#94a3b8!important; font-size:14px!important; font-weight:700; }
        @keyframes stockFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width:900px) { .stock-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width:768px) {
          .stock-hero { align-items:flex-start; padding:20px; }
          .stock-title { font-size:24px; }
          .stock-hero-icon { width:48px; height:48px; font-size:20px; }
          .stock-toolbar { flex-direction:column; align-items:stretch; }
          .stock-search-wrap { width:100%; }
          .stock-filters { flex-direction:column; align-items:stretch; }
          .stock-filter-btn,.stock-filter-select,.stock-filter-date,.stock-action-btn { width:100%; }
          .stock-grid { grid-template-columns:1fr; }
          .stock-form-actions { flex-direction:column; }
          .stock-submit-btn,.stock-cancel-btn { width:100%; }
          .stock-table-panel { padding:12px; }
        }
        @media (max-width:520px) { .stock-hero { flex-direction:column-reverse; } }
      `}</style>

      <div className="stock-page">
        {/* HERO */}
        <div className="stock-hero">
          <div>
            <p className="stock-eyebrow">Inventory Records</p>
            <h3 className="stock-title">Stock Movement</h3>
            <p className="stock-subtitle">Track stock-in and stock-out movements with before/after quantities and source references.</p>
          </div>
          <div className="stock-hero-icon"><FaBoxes /></div>
        </div>

        {/* TOOLBAR */}
        <div className="stock-toolbar">
          <div className="stock-search-wrap">
            <FaSearch className="stock-search-icon" />
            <input type="text" placeholder="Search movements..." value={search}
              onChange={e=>setSearch(e.target.value)} className="stock-search" />
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>openForm('stock-in')} className="stock-action-btn in"><FaArrowUp /> Stock In</button>
            <button onClick={()=>openForm('stock-out')} className="stock-action-btn out"><FaArrowDown /> Stock Out</button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="stock-filters">
          <FaFilter style={{color:'#b5536b',fontSize:13,flexShrink:0}} />
          {['all','stock-in','stock-out'].map(t=>(
            <button key={t} onClick={()=>{setFilter(t);fetchLogs();}}
              className={`stock-filter-btn${filter===t?' stock-filter-active':''}`}>
              {t==='all'?'All':TYPE_LABELS[t]||t}
            </button>
          ))}
          <select value={range} onChange={e=>{setRange(e.target.value);}} className="stock-filter-select">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          {range==='custom' && (
            <>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="stock-filter-date" />
              <span style={{fontSize:12,color:'#64748b'}}>to</span>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="stock-filter-date" />
            </>
          )}
        </div>

        {/* MESSAGE */}
        {message && (
          <div className={`stock-message ${isError?'stock-msg-err':'stock-msg-ok'}`}>{message}</div>
        )}

        {/* STOCK FORM */}
        {showForm && (
          <div className="stock-form">
            <div className="stock-form-header">
              <div className={`stock-form-icon ${mode==='stock-in'?'in':'out'}`}>
                {mode==='stock-in'?<FaArrowUp />:<FaArrowDown />}
              </div>
              <div>
                <h4 className="stock-form-title">{mode==='stock-in'?'Stock In':'Stock Out'}</h4>
                <p className="stock-form-note">{mode==='stock-in'?'Add stock to inventory.':'Remove stock from inventory. Cannot exceed current quantity.'}</p>
              </div>
            </div>
            <div className="stock-grid">
              <div className="stock-field">
                <label className="stock-label">Item *</label>
                <select value={form.item_id} onChange={e=>setForm({...form,item_id:e.target.value})} className="stock-input">
                  <option value="">Select item</option>
                  {items.map(i=><option key={i.id} value={i.id}>{i.name} — {i.item_code||'?'} (Current: {i.quantity})</option>)}
                </select>
              </div>
              <div className="stock-field">
                <label className="stock-label">Quantity *</label>
                <input type="number" placeholder="0" min="1" value={form.quantity}
                  onChange={e=>setForm({...form,quantity:e.target.value})} className="stock-input" />
              </div>
              <div className="stock-field">
                <label className="stock-label">Remarks <span className="stock-label-opt">optional</span></label>
                <input type="text" placeholder="Optional remarks" value={form.remarks}
                  onChange={e=>setForm({...form,remarks:e.target.value})} className="stock-input" />
              </div>
            </div>
            <div className="stock-form-actions">
              <button onClick={handleSubmit} className={`stock-submit-btn ${mode==='stock-in'?'in':'out'}`}
                style={{background:mode==='stock-in'?'linear-gradient(135deg,#22c55e,#16a34a)':'linear-gradient(135deg,#c4607a,#e58ca3)'}}>
                <FaSave /> Confirm {mode==='stock-in'?'Stock In':'Stock Out'}
              </button>
              <button onClick={()=>setShowForm(false)} className="stock-cancel-btn">Cancel</button>
            </div>
          </div>
        )}

        <p className="stock-count">{filtered.length} movement{filtered.length!==1?'s':''} found</p>

        {/* TABLE */}
        <div className="stock-table-panel">
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Item</th><th>Code</th><th>Type</th>
                  <th>Prev Qty</th><th>Movement</th><th>New Qty</th>
                  <th>Source / Reference</th><th>Remarks</th>
                  <th>Performed By</th><th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan="10" className="stock-empty">No stock movements found.</td></tr>
                ) : filtered.map(log=>(
                  <tr key={log.id}>
                    <td className="stock-item-name">
                      <div className="stock-cell-icon"><FaBoxes />{log.item_name||'—'}</div>
                      {log.product_type && <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{log.product_type}</div>}
                    </td>
                    <td className="stock-code"><span className="stock-cell-icon"><FaTag />{log.item_code||'—'}</span></td>
                    <td>
                      <span style={{padding:'5px 10px',borderRadius:9999,fontSize:12,fontWeight:800,...(TYPE_STYLES[log.type]||{})}}>
                        {TYPE_LABELS[log.type]||log.type}
                      </span>
                    </td>
                    <td style={{fontWeight:700,color:'#64748b'}}>{log.previous_quantity??'—'}</td>
                    <td style={{fontWeight:900,color:log.type==='stock-in'?'#2f9d6a':'#c4607a',fontSize:15}}>
                      {log.type==='stock-in'?'+':'-'}{log.quantity}
                    </td>
                    <td style={{fontWeight:900,color:'#1f2937'}}>{log.new_quantity??'—'}</td>
                    <td>
                      {log.reference_type ? (
                        <div>
                          <span style={{fontSize:11,padding:'3px 8px',borderRadius:9999,fontWeight:800,
                            background:(REF_STYLES[log.reference_type]?.background)||'#f8f3f5',
                            color:(REF_STYLES[log.reference_type]?.color)||'#6b5b63'}}>
                            {log.reference_type}
                          </span>
                          {log.reference_code && <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{log.reference_code}</div>}
                        </div>
                      ) : <span style={{color:'#94a3b8',fontSize:12}}>—</span>}
                    </td>
                    <td>
                      {log.remarks ? (
                        <span className="stock-cell-icon"><FaFileAlt style={{color:'#b5536b'}}/>{log.remarks}</span>
                      ) : <span style={{color:'#94a3b8'}}>—</span>}
                    </td>
                    <td>{log.performed_by||'—'}</td>
                    <td><span className="stock-cell-icon"><FaClock />{log.created_at?new Date(log.created_at).toLocaleString():'—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default StockMovement;
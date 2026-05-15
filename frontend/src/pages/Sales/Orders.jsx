import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaShoppingCart, FaPlus, FaTimes, FaSearch, FaSave, FaTrash,
  FaEye, FaEyeSlash, FaTruck, FaUser, FaPhone, FaCalendar,
  FaMapMarkerAlt, FaBoxOpen, FaClipboardList, FaBan, FaHistory,
  FaPrint, FaTag, FaExclamationTriangle,
} from "react-icons/fa";

const CANCEL_REASONS = [
  'Customer changed mind', 'Out of stock', 'Invalid customer details',
  'Duplicate order', 'Order mistake', 'Other',
];

const statusStyles = {
  pending:   { backgroundColor:'#fff7e8', color:'#9a5f0f',  borderColor:'#d98a1f' },
  confirmed: { backgroundColor:'#fff1f5', color:'#b5536b',  borderColor:'#c4607a' },
  forwarded: { backgroundColor:'#ecfdf3', color:'#2f7d56',  borderColor:'#2f9d6a' },
  cancelled: { backgroundColor:'#f8f3f5', color:'#6b5b63',  borderColor:'#c9b6bf' },
};

const agingLabel = (order) => {
  if (order.status !== 'pending') return null;
  const days = Math.floor((Date.now() - new Date(order.created_at)) / 86400000);
  if (days === 0) return { label:'New', color:'#2f7d56' };
  if (days === 1) return { label:'Pending 1 day', color:'#9a5f0f' };
  if (days >= 3) return { label:'Needs Follow-up', color:'#b5536b' };
  return { label:`Pending ${days} days`, color:'#9a5f0f' };
};

const money = (v) => `₱${Number(v||0).toLocaleString()}`;
const formatStatus = (v) => String(v||'pending').replaceAll('-',' ');

function Orders() {
  const [orders, setOrders]               = useState([]);
  const [showForm, setShowForm]           = useState(false);
  const [message, setMessage]             = useState('');
  const [filter, setFilter]               = useState('all');
  const [expanded, setExpanded]           = useState(null);
  const [search, setSearch]               = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [customers, setCustomers]         = useState([]);
  const [items, setItems]                 = useState([{ item_id:null, item_name:'', quantity:1, unit_price:'' }]);
  const [promoCode, setPromoCode]         = useState('');
  const [promoResult, setPromoResult]     = useState(null);
  const [promoLoading, setPromoLoading]   = useState(false);
  const [cancelModal, setCancelModal]     = useState(null); // order object
  const [cancelReason, setCancelReason]   = useState('');
  const [stockErrors, setStockErrors]     = useState([]);
  const [printOrder, setPrintOrder]       = useState(null);

  const [form, setForm] = useState({
    order_code:'', customer_name:'', customer_phone:'+63',
    customer_address:'', order_date:'', notes:'', salesperson:'',
  });

  useEffect(() => {
    fetchOrders(); fetchInventoryItems(); fetchNextCode(); fetchCustomers();
  }, []);

  const fetchOrders = async () => {
    try { const r = await api.get('/sales/orders'); setOrders(r.data||[]); }
    catch(e){ console.error(e); }
  };
  const fetchInventoryItems = async () => {
    try {
      const r = await api.get('/inventory/items');
      setInventoryItems((r.data||[]).filter(i=>i.status!=='out-of-stock'));
    } catch(e){ console.error(e); }
  };
  const fetchNextCode = async () => {
    try { const r = await api.get('/sales/next-code'); setForm(p=>({...p,order_code:r.data.order_code})); }
    catch(e){ console.error(e); }
  };
  const fetchCustomers = async () => {
    try { const r = await api.get('/crm/customers'); setCustomers(r.data||[]); }
    catch(e){ setCustomers([]); }
  };

  const notify = (msg) => { setMessage(msg); setTimeout(()=>setMessage(''), 4000); };

  const isError  = message.startsWith('error:');
  const msgText  = message.replace(/^(success:|error:)/,'');

  const addItemRow    = () => setItems([...items,{item_id:null,item_name:'',quantity:1,unit_price:''}]);
  const removeItemRow = (i) => setItems(items.filter((_,idx)=>idx!==i));
  const updateItem    = (i,field,val) => { const u=[...items]; u[i][field]=val; setItems(u); };
  const selectInventoryItem = (i, itemId) => {
    const sel = inventoryItems.find(x=>x.id===Number(itemId));
    const u = [...items];
    u[i] = {...u[i], item_id:sel?.id||null, item_name:sel?.name||'', unit_price:sel?.unit_price||u[i].unit_price};
    setItems(u);
  };

  const getTotal = () => items.reduce((s,it)=>s+(Number(it.quantity)*Number(it.unit_price)||0),0);
  const getDiscountedTotal = () => promoResult?.valid ? promoResult.final_total : getTotal();

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const r = await api.post('/sales/orders/validate-promo', { promo_code:promoCode.trim(), order_total:getTotal() });
      setPromoResult(r.data);
      if (!r.data.valid) notify('error:'+r.data.message);
    } catch { notify('error:Failed to validate promo.'); }
    finally { setPromoLoading(false); }
  };

  const removePromo = () => { setPromoCode(''); setPromoResult(null); };

  const handleOpenForm = async () => {
    if (!showForm) await fetchNextCode();
    setShowForm(!showForm);
  };

  const handleSubmit = async () => {
    try {
      await api.post('/sales/orders', {
        ...form, items,
        promo_id: promoResult?.valid ? promoResult.promo_id : null,
        promo_code: promoResult?.valid ? promoResult.promo_code : null,
        discount_amount: promoResult?.valid ? promoResult.discount_amount : 0,
        final_total: promoResult?.valid ? promoResult.final_total : getTotal(),
      });
      notify('success:Order created successfully!');
      setShowForm(false); setPromoCode(''); setPromoResult(null);
      setItems([{item_id:null,item_name:'',quantity:1,unit_price:''}]);
      fetchOrders(); fetchInventoryItems(); fetchNextCode();
    } catch(e) { notify('error:'+(e.response?.data?.message||'Error creating order.')); }
  };

  const handleConfirm = async (id) => {
    if (!window.confirm('Confirm this order? This will deduct inventory stock.')) return;
    setStockErrors([]);
    try {
      await api.put(`/sales/orders/${id}/confirm`);
      notify('success:Order confirmed and stock deducted!');
      fetchOrders(); fetchInventoryItems();
    } catch(e) {
      const data = e.response?.data;
      if (data?.stock_errors) {
        setStockErrors(data.stock_errors);
        notify('error:'+data.message);
      } else {
        notify('error:'+(data?.message||'Error confirming order.'));
      }
    }
  };

  const handleForward = async (order) => {
    if (!window.confirm(`Forward order ${order.order_code} to Logistics?`)) return;
    const shipment_code = 'SHIP-'+order.order_code+'-'+Date.now();
    try {
      await api.put(`/sales/orders/${order.id}/forward`, {
        shipment_code, courier:'', tracking_number:'',
        ship_date:null, estimated_delivery:null, notes:order.notes||'',
        performed_by: form.salesperson || 'Sales',
      });
      notify('success:Order forwarded to Logistics!');
      fetchOrders();
    } catch(e) { notify('error:'+(e.response?.data?.message||'Error forwarding order.')); }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason) return notify('error:Please select a cancellation reason.');
    try {
      await api.put(`/sales/orders/${cancelModal.id}/cancel`, {
        cancellation_reason: cancelReason, performed_by:'Sales',
      });
      notify('success:Order cancelled successfully.');
      setCancelModal(null); setCancelReason('');
      fetchOrders(); fetchInventoryItems();
    } catch(e) { notify('error:'+(e.response?.data?.message||'Error cancelling order.')); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order permanently?')) return;
    try { await api.delete(`/sales/orders/${id}`); fetchOrders(); }
    catch(e){ console.error(e); }
  };

  const handleSelectCustomer = (customerId) => {
    const cust = customers.find(c=>String(c.id)===customerId);
    if (!cust) return;
    setForm(f=>({
      ...f,
      customer_name: cust.name||cust.full_name||'',
      customer_phone: cust.phone||'+63',
      customer_address: cust.address||'',
    }));
  };

  const printInvoice = (order, orderItems) => {
  // Create a hidden iframe instead of a new tab
  const existing = document.getElementById('print-frame');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'print-frame';
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${order.order_code}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @page {
          size: A4 portrait;
          margin: 18mm 16mm;
        }

        body {
          font-family: Arial, sans-serif;
          color: #1f2937;
          font-size: 13px;
          line-height: 1.5;
        }

        /* Force everything onto as few pages as possible */
        .invoice-wrapper {
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
        }

        h1 {
          color: #c4607a;
          font-size: 28px;
          margin-bottom: 2px;
        }

        .sub {
          color: #64748b;
          font-size: 12px;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 2px solid #f3e8ec;
        }

        .section {
          margin-bottom: 16px;
          page-break-inside: avoid;
        }

        .section h3 {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: #b5536b;
          background: #fff7fa;
          border: 1px solid #ead1d9;
          padding: 5px 10px;
          border-radius: 6px;
          margin-bottom: 10px;
          display: inline-block;
        }

        .row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 5px 0;
          border-bottom: 1px solid #f9f0f2;
        }

        .row:last-child { border-bottom: none; }

        .label { color: #64748b; }

        /* Two-column layout for order + customer info */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 16px;
          page-break-inside: avoid;
        }

        .info-block h3 { display: block; width: 100%; }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          page-break-inside: avoid;
        }

        th {
          background: #fff7fa;
          padding: 8px 10px;
          text-align: left;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #64748b;
          border-bottom: 2px solid #ead1d9;
          border-top: 1px solid #ead1d9;
        }

        td {
          padding: 8px 10px;
          border-bottom: 1px solid #f3e8ec;
        }

        .text-right { text-align: right; }

        .total-row td {
          border-bottom: none;
          border-top: 2px solid #ead1d9;
          font-weight: 800;
          font-size: 14px;
          color: #c4607a;
          padding-top: 10px;
        }

        .discount-row td {
          color: #2f7d56;
          font-weight: 700;
          border-bottom: none;
        }

        .badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          background: #ecfdf3;
          color: #2f7d56;
          border: 1px solid #2f9d6a;
          text-transform: capitalize;
        }

        .footer-note {
          margin-top: 20px;
          padding-top: 12px;
          border-top: 1px solid #f3e8ec;
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
        }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-wrapper">

        <h1>Order Invoice</h1>
        <div class="sub">Spartan BTY Inc. — Management Information System</div>

        <!-- Order Info + Customer Info side by side -->
        <div class="info-grid">
          <div class="info-block">
            <h3>Order Information</h3>
            <div class="row"><span class="label">Order Code</span><strong>${order.order_code}</strong></div>
            <div class="row"><span class="label">Status</span><span class="badge">${order.status}</span></div>
            <div class="row"><span class="label">Order Date</span><span>${order.order_date ? new Date(order.order_date).toLocaleDateString('en-PH', {year:'numeric',month:'short',day:'numeric'}) : '—'}</span></div>
            <div class="row"><span class="label">Salesperson</span><span>${order.salesperson || '—'}</span></div>
          </div>

          <div class="info-block">
            <h3>Customer Information</h3>
            <div class="row"><span class="label">Name</span><span>${order.customer_name || '—'}</span></div>
            <div class="row"><span class="label">Phone</span><span>${order.customer_phone || '—'}</span></div>
            <div class="row"><span class="label">Address</span><span style="text-align:right;max-width:55%">${order.customer_address || '—'}</span></div>
          </div>
        </div>

        <!-- Order Items -->
        <div class="section">
          <h3>Order Items</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map(i => `
                <tr>
                  <td>${i.item_name}</td>
                  <td class="text-right">${i.quantity}</td>
                  <td class="text-right">₱${Number(i.unit_price).toLocaleString()}</td>
                  <td class="text-right" style="font-weight:700">₱${Number(i.subtotal).toLocaleString()}</td>
                </tr>
              `).join('')}

              ${order.discount_amount > 0 ? `
                <tr class="discount-row">
                  <td colspan="3" class="text-right">Promo Code (${order.promo_code || '—'}):</td>
                  <td class="text-right">-₱${Number(order.discount_amount).toLocaleString()}</td>
                </tr>
              ` : ''}

              <tr class="total-row">
                <td colspan="3" class="text-right">Final Total</td>
                <td class="text-right">₱${Number(order.total_amount).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${order.notes ? `
          <div class="section">
            <h3>Notes</h3>
            <p style="font-size:13px;color:#64748b;padding:6px 0">${order.notes}</p>
          </div>
        ` : ''}

        ${order.cancellation_reason ? `
          <div class="section">
            <h3>Cancellation Reason</h3>
            <p style="font-size:13px;color:#b5536b;padding:6px 0">${order.cancellation_reason}</p>
          </div>
        ` : ''}

        <div class="footer-note">
          Printed on ${new Date().toLocaleString('en-PH')} · Spartan BTY Inc. MIS
        </div>

      </div>
    </body>
    </html>
  `);
  doc.close();

  // Wait for content to load then print, then remove iframe
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  };
};

  const filtered = orders.filter(o => {
    const matchFilter = filter==='all' || o.status===filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (o.order_code||'').toLowerCase().includes(q) ||
      (o.customer_name||'').toLowerCase().includes(q) ||
      (o.customer_phone||'').includes(search) ||
      (o.salesperson||'').toLowerCase().includes(q) ||
      (o.status||'').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <Layout>
      <style>{ordersCss}</style>
      <div className="orders-page">

        {/* HERO */}
        <div className="orders-hero">
          <div>
            <p className="orders-eyebrow">Sales Management</p>
            <h3 className="orders-title">Orders</h3>
            <p className="orders-subtitle">
              Manage customer orders, confirm inventory, apply promos, and forward to logistics.
            </p>
          </div>
          <div className="orders-hero-icon"><FaShoppingCart /></div>
        </div>

        {/* TOOLBAR */}
        <div className="orders-toolbar">
          <div className="orders-search-wrap">
            <FaSearch className="orders-search-icon" />
            <input type="text" placeholder="Search orders..." value={search}
              onChange={e=>setSearch(e.target.value)} className="orders-search" />
          </div>
          <button onClick={handleOpenForm} className="orders-add-btn">
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'New Order'}
          </button>
        </div>

        {message && (
          <div className={`orders-message ${isError?'orders-message-error':'orders-message-success'}`}>{msgText}</div>
        )}

        {/* STOCK ERROR ALERT */}
        {stockErrors.length > 0 && (
          <div style={{background:'#fff1f5',border:'1px solid #c4607a',borderRadius:14,padding:'14px 16px',marginBottom:18}}>
            <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,color:'#b5536b',marginBottom:10}}>
              <FaExclamationTriangle /> Insufficient Stock — Cannot Confirm
            </div>
            {stockErrors.map((e,i)=>(
              <div key={i} style={{fontSize:13,color:'#374151',marginBottom:4}}>
                • <strong>{e.item_name}</strong>: Requested <strong>{e.requested}</strong>, Available <strong style={{color:e.available===0?'#b5536b':'#9a5f0f'}}>{e.available}</strong>
              </div>
            ))}
            <button onClick={()=>setStockErrors([])} style={{marginTop:10,fontSize:12,padding:'6px 12px',border:'1px solid #c4607a',borderRadius:8,background:'#fff',color:'#b5536b',cursor:'pointer',fontWeight:800}}>
              Dismiss
            </button>
          </div>
        )}

        {/* FILTER BUTTONS */}
        <div className="orders-filter-row">
          {['all','pending','confirmed','forwarded','cancelled'].map(s=>(
            <button key={s} onClick={()=>setFilter(s)}
              className={`orders-filter-btn${filter===s?' orders-filter-active':''}`}>
              {s==='all'?'All':formatStatus(s)}
            </button>
          ))}
        </div>

        {/* CREATE FORM */}
        {showForm && (
          <div className="orders-form">
            <div className="orders-form-header">
              <div className="orders-form-icon"><FaPlus /></div>
              <div>
                <h4 className="orders-form-title">Create New Order</h4>
                <p className="orders-form-note">Add customer details, order items, and optional promo code.</p>
              </div>
            </div>

            {/* Customer auto-fill from CRM */}
            {customers.length > 0 && (
              <div style={{marginBottom:16,padding:'12px 14px',background:'#fff7fa',border:'1px solid #ead1d9',borderRadius:12}}>
                <label style={{fontSize:13,fontWeight:800,color:'#374151',display:'block',marginBottom:6}}>
                  Select Existing Customer <span style={{fontSize:11,fontWeight:400,color:'#94a3b8'}}>optional — auto-fills form</span>
                </label>
                <select onChange={e=>handleSelectCustomer(e.target.value)} className="orders-input" defaultValue="">
                  <option value="">— Select from CRM —</option>
                  {customers.map(c=><option key={c.id} value={c.id}>{c.name||c.full_name} — {c.phone||'No phone'}</option>)}
                </select>
              </div>
            )}

            <div className="orders-grid">
              <div className="orders-field">
                <label className="orders-label">Order Code</label>
                <div className="orders-auto-code">
                  <span className="orders-auto-code-text">{form.order_code}</span>
                  <span className="orders-auto-code-badge">AUTO</span>
                </div>
              </div>
              <div className="orders-field">
                <label className="orders-label">Salesperson</label>
                <input type="text" placeholder="Your name" value={form.salesperson}
                  onChange={e=>setForm({...form,salesperson:e.target.value})} className="orders-input" />
              </div>
              <div className="orders-field">
                <label className="orders-label">Customer Name</label>
                <input type="text" placeholder="Full name" value={form.customer_name}
                  onChange={e=>setForm({...form,customer_name:e.target.value})} className="orders-input" />
              </div>
              <div className="orders-field">
                <label className="orders-label">Customer Phone</label>
                <div className="orders-phone-wrap">
                  <span className="orders-phone-prefix">+63</span>
                  <input type="text" placeholder="9123456789"
                    value={form.customer_phone.replace('+63','').replace(/^\s/,'')}
                    onChange={e=>{
                      let v=e.target.value.replace(/\D/g,'');
                      if(v.startsWith('0')) v=v.slice(1);
                      if(v.length>10) v=v.slice(0,10);
                      setForm({...form,customer_phone:'+63'+v});
                    }}
                    className="orders-phone-input" maxLength={10} />
                </div>
                <span className="orders-hint">10-digit number e.g. 9123456789</span>
              </div>
              <div className="orders-field">
                <label className="orders-label">Order Date</label>
                <input type="date" value={form.order_date}
                  onChange={e=>setForm({...form,order_date:e.target.value})} className="orders-input" />
              </div>
              <div className="orders-field orders-span-2">
                <label className="orders-label">Customer Address</label>
                <input type="text" placeholder="Delivery address" value={form.customer_address}
                  onChange={e=>setForm({...form,customer_address:e.target.value})} className="orders-input" />
              </div>
              <div className="orders-field orders-span-2">
                <label className="orders-label">Notes</label>
                <input type="text" placeholder="Optional notes" value={form.notes}
                  onChange={e=>setForm({...form,notes:e.target.value})} className="orders-input" />
              </div>
            </div>

            {/* PROMO CODE */}
            <div style={{background:'#fff7fa',border:'1px solid #ead1d9',borderRadius:16,padding:16,marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:32,height:32,borderRadius:10,background:'#fff1f5',border:'1px solid #e8b9c6',display:'grid',placeItems:'center',color:'#b5536b',fontSize:14}}>
                  <FaTag />
                </div>
                <div>
                  <div style={{fontWeight:800,fontSize:14,color:'#1f2937'}}>Promo Code</div>
                  <div style={{fontSize:12,color:'#64748b'}}>Apply a discount code to this order</div>
                </div>
              </div>
              {!promoResult?.valid ? (
                <div style={{display:'flex',gap:10}}>
                  <input type="text" placeholder="Enter promo code..." value={promoCode}
                    onChange={e=>setPromoCode(e.target.value.toUpperCase())}
                    className="orders-input" style={{flex:1,textTransform:'uppercase',fontWeight:700}}
                    onKeyDown={e=>e.key==='Enter'&&applyPromo()} />
                  <button onClick={applyPromo} disabled={promoLoading||!promoCode.trim()}
                    style={{padding:'11px 18px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#c4607a,#e58ca3)',color:'#fff',fontWeight:800,fontSize:13,cursor:'pointer',whiteSpace:'nowrap',opacity:promoLoading?0.7:1}}>
                    {promoLoading?'Checking...':'Apply Promo'}
                  </button>
                </div>
              ) : (
                <div style={{background:'#ecfdf3',border:'1px solid #2f9d6a',borderRadius:12,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:800,color:'#2f7d56',fontSize:14}}>✓ {promoResult.promo_code} applied!</div>
                    <div style={{fontSize:12,color:'#2f7d56',marginTop:2}}>
                      Discount: -{money(promoResult.discount_amount)} · Final: {money(promoResult.final_total)}
                    </div>
                  </div>
                  <button onClick={removePromo} style={{background:'none',border:'1px solid #2f9d6a',borderRadius:8,padding:'6px 12px',color:'#2f7d56',fontWeight:800,fontSize:12,cursor:'pointer'}}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* ORDER ITEMS */}
            <div className="orders-items-panel">
              <div className="orders-items-header">
                <div className="orders-items-title-wrap">
                  <div className="orders-small-icon"><FaBoxOpen /></div>
                  <div>
                    <h4 className="orders-items-title">Order Items</h4>
                    <p className="orders-items-note">Link items from inventory or enter manually.</p>
                  </div>
                </div>
                <button onClick={addItemRow} className="orders-row-btn"><FaPlus /> Add Row</button>
              </div>
              <div className="orders-table-wrap">
                <table className="orders-items-table">
                  <thead>
                    <tr>
                      <th>Select from Inventory</th><th>Item Name</th>
                      <th>Qty</th><th>Unit Price</th><th>Subtotal</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item,idx)=>(
                      <tr key={idx}>
                        <td>
                          <select value={item.item_id||''} onChange={e=>selectInventoryItem(idx,e.target.value)} className="orders-table-input">
                            <option value="">Select Item</option>
                            {inventoryItems.map(inv=><option key={inv.id} value={inv.id}>{inv.name} (Stock: {inv.quantity})</option>)}
                          </select>
                        </td>
                        <td><input type="text" placeholder="Or type manually" value={item.item_name} onChange={e=>updateItem(idx,'item_name',e.target.value)} className="orders-table-input" /></td>
                        <td><input type="number" min="1" value={item.quantity} onChange={e=>updateItem(idx,'quantity',e.target.value)} className="orders-table-input orders-qty-input" /></td>
                        <td><input type="number" placeholder="0.00" value={item.unit_price} onChange={e=>updateItem(idx,'unit_price',e.target.value)} className="orders-table-input orders-price-input" /></td>
                        <td className="orders-money">{money(Number(item.quantity)*Number(item.unit_price)||0)}</td>
                        <td>{items.length>1&&<button onClick={()=>removeItemRow(idx)} className="orders-remove-btn"><FaTrash /> Remove</button>}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan="4" className="orders-total-label">Subtotal:</td>
                      <td className="orders-total-value">{money(getTotal())}</td><td/>
                    </tr>
                    {promoResult?.valid && (
                      <tr>
                        <td colSpan="4" className="orders-total-label" style={{color:'#2f7d56'}}>Promo ({promoResult.promo_code}):</td>
                        <td style={{fontWeight:900,color:'#2f7d56'}}>-{money(promoResult.discount_amount)}</td><td/>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="4" className="orders-total-label">Total:</td>
                      <td className="orders-total-value">{money(getDiscountedTotal())}</td><td/>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <button onClick={handleSubmit} className="orders-submit-btn"><FaSave /> Create Order</button>
          </div>
        )}

        <p className="orders-count">{filtered.length} order{filtered.length!==1?'s':''} found</p>

        {/* MAIN TABLE */}
        <div className="orders-table-panel">
          <div className="orders-table-wrap">
            <table className="orders-main-table">
              <thead>
                <tr>
                  <th>Order Code</th><th>Customer</th><th>Phone</th>
                  <th>Salesperson</th><th>Date</th><th>Total</th>
                  <th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan="8" className="orders-empty">No orders found.</td></tr>
                ) : filtered.map(order=>(
                  <React.Fragment key={order.id}>
                    <tr>
                      <td>
                        <div className="orders-code">{order.order_code}</div>
                        {agingLabel(order) && (
                          <div style={{fontSize:10,fontWeight:800,marginTop:3,color:agingLabel(order).color}}>
                            ● {agingLabel(order).label}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="orders-customer">
                          <FaUser />
                          <div>
                            <div className="orders-customer-name">{order.customer_name||'N/A'}</div>
                            <div className="orders-customer-address"><FaMapMarkerAlt />{order.customer_address||'No address'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="orders-cell-icon"><FaPhone />{order.customer_phone||'N/A'}</span></td>
                      <td>{order.salesperson||'N/A'}</td>
                      <td><span className="orders-cell-icon"><FaCalendar />{order.order_date?new Date(order.order_date).toLocaleDateString():'N/A'}</span></td>
                      <td>
                        <div className="orders-money">{money(order.total_amount)}</div>
                        {order.discount_amount>0 && (
                          <div style={{fontSize:11,color:'#2f7d56',fontWeight:700}}>-{money(order.discount_amount)} off</div>
                        )}
                      </td>
                      <td>
                        <span className="orders-badge" style={statusStyles[order.status]||statusStyles.pending}>
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td>
                        <div className="orders-action-row">
                          <button onClick={()=>setExpanded(p=>p===order.id?null:order.id)}
                            className={expanded===order.id?'orders-view-active':'orders-view-btn'}>
                            {expanded===order.id?<FaEyeSlash />:<FaEye />}
                            {expanded===order.id?'Hide':'View'}
                          </button>

                          {order.status==='pending' && (
                            <button onClick={()=>handleConfirm(order.id)} className="orders-confirm-btn">
                              ✓ Confirm
                            </button>
                          )}

                          {order.status==='confirmed' && (
                            <button onClick={()=>handleForward(order)} className="orders-forward-btn">
                              <FaTruck /> Forward
                            </button>
                          )}

                          {order.status!=='cancelled' && order.status!=='forwarded' && (
                            <button onClick={()=>{ setCancelModal(order); setCancelReason(''); }} className="orders-cancel-btn">
                              <FaBan /> Cancel
                            </button>
                          )}

                          <button onClick={async()=>{
                            const r = await api.get(`/sales/orders/${order.id}`);
                            printInvoice(order, r.data.items||[]);
                          }} className="orders-print-btn">
                            <FaPrint />
                          </button>

                          <button onClick={()=>handleDelete(order.id)} className="orders-delete-btn">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded===order.id && (
                      <tr>
                        <td colSpan="8" className="orders-expanded-cell">
                          <OrderDetails order={order} money={money} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CANCEL MODAL */}
      {cancelModal && (
        <div className="orders-modal-overlay" onClick={()=>setCancelModal(null)}>
          <div className="orders-modal" onClick={e=>e.stopPropagation()}>
            <h3 className="orders-modal-title">Cancel Order — {cancelModal.order_code}</h3>
            <p style={{fontSize:13,color:'#64748b',marginBottom:18}}>
              Please select a cancellation reason. This action cannot be undone.
              {cancelModal.status==='confirmed' && (
                <strong style={{color:'#b5536b',display:'block',marginTop:6}}>
                  ⚠️ This order was confirmed — inventory stock will be returned.
                </strong>
              )}
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
              {CANCEL_REASONS.map(r=>(
                <label key={r} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:`1.5px solid ${cancelReason===r?'#c4607a':'#e2c6cf'}`,background:cancelReason===r?'#fff1f5':'#fff',cursor:'pointer',fontWeight:cancelReason===r?800:400,fontSize:14,color:'#374151',transition:'all 180ms'}}>
                  <input type="radio" name="cancel_reason" value={r} checked={cancelReason===r} onChange={()=>setCancelReason(r)} style={{accentColor:'#c4607a'}} />
                  {r}
                </label>
              ))}
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={handleCancelSubmit} style={{flex:1,padding:'12px',border:'none',borderRadius:12,background:'linear-gradient(135deg,#c4607a,#e58ca3)',color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer'}}>
                Confirm Cancellation
              </button>
              <button onClick={()=>setCancelModal(null)} style={{padding:'12px 18px',border:'1px solid #d8b8c2',borderRadius:12,background:'#fff',color:'#64748b',fontWeight:800,fontSize:14,cursor:'pointer'}}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── Order Details expanded row ────────────────────────────────────────────────
function OrderDetails({ order, money }) {
  const [items, setItems]     = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('items');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/sales/orders/${order.id}`).then(r=>setItems(r.data.items||[])),
      api.get(`/sales/orders/${order.id}/history`).then(r=>setHistory(r.data||[])),
    ]).finally(()=>setLoading(false));
  }, [order.id]);

  const historyColors = {
    'Order Created':              '#2f7d56',
    'Order Confirmed':            '#b5536b',
    'Forwarded to Logistics':     '#2f7d56',
    'Order Cancelled':            '#6b5b63',
    'Order Cancelled + Stock Returned': '#9a5f0f',
    'Status Changed':             '#64748b',
  };

  return (
    <div className="order-items-box">
      {/* Tabs */}
      <div style={{display:'flex',gap:6,marginBottom:16,borderBottom:'1px solid #f3e8ec',paddingBottom:12}}>
        {[
          ['items','Order Items'],
          ['info','Order Info'],
          ['history','Timeline'],
        ].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)}
            style={{padding:'7px 14px',borderRadius:9,border:'none',fontWeight:800,fontSize:12,cursor:'pointer',
              background:tab===key?'linear-gradient(135deg,#c4607a,#e58ca3)':'#fff7fa',
              color:tab===key?'#fff':'#64748b',
              boxShadow:tab===key?'0 4px 12px rgba(196,96,122,0.25)':'none'}}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <p style={{color:'#64748b',fontSize:13,fontWeight:700}}>Loading...</p> : (
        <>
          {/* ITEMS TAB */}
          {tab==='items' && (
            <div className="orders-table-wrap">
              <table className="order-items-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th><th>Inventory</th></tr></thead>
                <tbody>
                  {items.length===0
                    ? <tr><td colSpan="5" className="orders-empty">No items.</td></tr>
                    : items.map(item=>(
                      <tr key={item.id}>
                        <td>{item.item_name}</td><td>{item.quantity}</td>
                        <td>{money(item.unit_price)}</td>
                        <td className="orders-money">{money(item.subtotal)}</td>
                        <td>{item.item_id?<span className="orders-linked-badge">Linked</span>:<span className="orders-manual-badge">Manual</span>}</td>
                      </tr>
                    ))
                  }
                  {order.discount_amount>0 && (
                    <tr>
                      <td colSpan="3" style={{textAlign:'right',fontWeight:800,color:'#2f7d56'}}>Promo {order.promo_code}:</td>
                      <td style={{fontWeight:900,color:'#2f7d56'}}>-{money(order.discount_amount)}</td><td/>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="3" style={{textAlign:'right',fontWeight:900,color:'#1f2937'}}>Total:</td>
                    <td className="orders-money">{money(order.total_amount)}</td><td/>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* INFO TAB */}
          {tab==='info' && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:20,fontSize:13}}>
              <div>
                <div style={{fontWeight:800,color:'#b5536b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Customer Info</div>
                {[['Name',order.customer_name],['Phone',order.customer_phone],['Address',order.customer_address]].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #f3e8ec'}}>
                    <span style={{color:'#64748b',fontWeight:700}}>{k}</span>
                    <span style={{fontWeight:800}}>{v||'—'}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontWeight:800,color:'#b5536b',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Order Details</div>
                {[
                  ['Salesperson',order.salesperson],
                  ['Date',order.order_date?new Date(order.order_date).toLocaleDateString():'—'],
                  ['Promo Used',order.promo_code||'None'],
                  ['Discount',order.discount_amount>0?money(order.discount_amount):'None'],
                  ['Stock Deducted',order.stock_deducted?'Yes':'No'],
                  ['Stock Returned',order.stock_returned?'Yes':'No'],
                ].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #f3e8ec'}}>
                    <span style={{color:'#64748b',fontWeight:700}}>{k}</span>
                    <span style={{fontWeight:800}}>{v||'—'}</span>
                  </div>
                ))}
                {order.cancellation_reason && (
                  <div style={{marginTop:10,padding:'10px 12px',background:'#fff1f5',borderRadius:10,border:'1px solid #c4607a'}}>
                    <div style={{fontSize:11,fontWeight:800,color:'#b5536b',marginBottom:4}}>CANCELLATION REASON</div>
                    <div style={{fontSize:13,color:'#374151'}}>{order.cancellation_reason}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TIMELINE TAB */}
          {tab==='history' && (
            <div>
              {history.length===0 ? (
                <p style={{color:'#94a3b8',fontSize:13,fontWeight:700,textAlign:'center',padding:'20px 0'}}>No history recorded.</p>
              ) : (
                <div style={{position:'relative',paddingLeft:24}}>
                  <div style={{position:'absolute',left:8,top:0,bottom:0,width:2,background:'#f3e8ec',borderRadius:2}}/>
                  {history.map((h,i)=>(
                    <div key={h.id} style={{position:'relative',marginBottom:i<history.length-1?20:0}}>
                      <div style={{position:'absolute',left:-20,top:4,width:12,height:12,borderRadius:'50%',background:historyColors[h.action]||'#c4607a',border:'2px solid #fff',boxShadow:'0 0 0 2px '+(historyColors[h.action]||'#c4607a')}}/>
                      <div style={{background:'#fff',border:'1px solid #e2c6cf',borderRadius:12,padding:'12px 14px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                          <span style={{fontWeight:800,fontSize:13,color:'#1f2937'}}>{h.action}</span>
                          <span style={{fontSize:11,color:'#94a3b8'}}>{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        {h.description && <p style={{margin:0,fontSize:12,color:'#64748b'}}>{h.description}</p>}
                        {(h.old_status||h.new_status) && (
                          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                            {h.old_status && <span style={{fontSize:11,padding:'2px 8px',borderRadius:9999,background:'#f8f3f5',color:'#6b5b63',border:'1px solid #c9b6bf'}}>{h.old_status}</span>}
                            {h.old_status&&h.new_status&&<span style={{fontSize:11,color:'#94a3b8'}}>→</span>}
                            {h.new_status && <span style={{fontSize:11,padding:'2px 8px',borderRadius:9999,background:'#fff1f5',color:'#b5536b',border:'1px solid #c4607a'}}>{h.new_status}</span>}
                            {h.performed_by && <span style={{fontSize:11,color:'#94a3b8',marginLeft:'auto'}}>by {h.performed_by}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const ordersCss = `
.orders-page { width:100%; max-width:100%; min-width:0; animation:ordersFadeUp 0.35s ease both; }
.orders-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
.orders-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
.orders-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
.orders-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:760px; }
.orders-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }
.orders-toolbar,.orders-form,.orders-table-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
.orders-toolbar { padding:16px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; gap:14px; }
.orders-search-wrap { position:relative; width:300px; max-width:100%; }
.orders-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b5536b; font-size:13px; pointer-events:none; }
.orders-search,.orders-input,.orders-table-input,.orders-status-select { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
.orders-search { padding-left:36px; background:#fff7fa; }
.orders-search:focus,.orders-input:focus,.orders-table-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
.orders-add-btn,.orders-submit-btn,.orders-row-btn { border:none; border-radius:12px; padding:11px 16px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
.orders-add-btn:hover,.orders-submit-btn:hover,.orders-row-btn:hover { transform:translateY(-1px); }
.orders-message { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
.orders-message-success { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
.orders-message-error { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
.orders-filter-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }
.orders-filter-btn { padding:8px 13px; border-radius:9999px; border:1px solid #d8b8c2; background:#fff; color:#64748b; cursor:pointer; font-size:13px; font-weight:800; }
.orders-filter-active { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; border-color:#c4607a; box-shadow:0 8px 18px rgba(196,96,122,.18); }
.orders-form { padding:22px; margin-bottom:20px; }
.orders-form-header,.orders-items-header,.order-items-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
.orders-items-header { justify-content:space-between; }
.orders-items-title-wrap { display:flex; align-items:center; gap:12px; }
.orders-form-icon,.orders-small-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
.orders-form-title,.orders-items-title,.order-items-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
.orders-form-note,.orders-items-note,.order-items-note { margin:4px 0 0; color:#64748b; font-size:13px; }
.orders-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; margin-bottom:16px; }
.orders-field { display:flex; flex-direction:column; gap:7px; min-width:0; }
.orders-span-2 { grid-column:span 2; }
.orders-label { font-size:13px; font-weight:800; color:#374151; }
.orders-auto-code,.orders-phone-wrap { min-height:43px; display:flex; align-items:center; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; box-sizing:border-box; overflow:hidden; }
.orders-auto-code { justify-content:space-between; padding:10px 12px; }
.orders-auto-code-text { font-size:15px; font-weight:900; color:#b5536b; letter-spacing:.8px; }
.orders-auto-code-badge { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:10px; font-weight:900; padding:4px 8px; border-radius:9999px; }
.orders-phone-prefix { padding:11px 12px; background:#fff1f5; border-right:1px solid #d8b8c2; font-size:14px; font-weight:800; color:#1f2937; }
.orders-phone-input { flex:1; min-width:0; border:none; outline:none; padding:11px 12px; font-size:14px; background:#fff; }
.orders-hint { font-size:11px; color:#64748b; }
.orders-items-panel { background:#fff7fa; border:1px solid #ead1d9; border-radius:16px; padding:16px; margin-bottom:16px; }
.orders-table-panel { padding:16px; max-width:100%; overflow:hidden; }
.orders-table-wrap { width:100%; max-width:100%; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; border:1px solid #ead1d9; border-radius:14px; }
.orders-main-table,.orders-items-table,.order-items-table { width:100%; border-collapse:collapse; background:#fff; }
.orders-main-table { min-width:1100px; }
.orders-items-table { min-width:880px; }
.order-items-table { min-width:720px; }
.orders-main-table thead,.orders-items-table thead,.order-items-table thead { background:#fff7fa; }
.orders-main-table th,.orders-items-table th,.order-items-table th { padding:13px 16px; text-align:left; font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #ead1d9; white-space:nowrap; }
.orders-main-table td,.orders-items-table td,.order-items-table td { padding:14px 16px; font-size:14px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; vertical-align:middle; }
.orders-main-table tbody tr:hover,.orders-items-table tbody tr:hover,.order-items-table tbody tr:hover { background:#fff7fa; }
.orders-code { color:#64748b; font-size:13px; font-weight:850; }
.orders-customer,.orders-cell-icon { display:inline-flex; align-items:center; gap:7px; }
.orders-customer svg,.orders-cell-icon svg { color:#b5536b; flex:0 0 auto; }
.orders-customer-name { font-weight:850; color:#1f2937; }
.orders-customer-address { display:flex; align-items:center; gap:5px; margin-top:3px; color:#94a3b8; font-size:12px; }
.orders-money,.orders-total-value { font-weight:900; color:#b5536b; }
.orders-total-label { text-align:right; font-weight:900; color:#1f2937; }
.orders-badge,.orders-linked-badge,.orders-manual-badge { display:inline-flex; align-items:center; justify-content:center; padding:6px 10px; border-radius:9999px; font-size:12px; font-weight:800; border:1px solid; white-space:nowrap; text-transform:capitalize; }
.orders-linked-badge { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
.orders-manual-badge { background:#f8f3f5; color:#6b5b63; border-color:#c9b6bf; }
.orders-action-row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
.orders-view-btn,.orders-view-active,.orders-forward-btn,.orders-confirm-btn,.orders-cancel-btn,.orders-print-btn,.orders-delete-btn,.orders-remove-btn { border-radius:10px; padding:8px 10px; cursor:pointer; font-size:12px; font-weight:800; display:inline-flex; align-items:center; gap:5px; border:1px solid; transition:all 180ms ease; }
.orders-view-btn { background:#fff7e8; color:#9a5f0f; border-color:#d98a1f; }
.orders-view-active { background:#d98a1f; color:#fff; border-color:#d98a1f; }
.orders-confirm-btn { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
.orders-forward-btn { background:#e8f4ff; color:#1a5f9a; border-color:#4a90d9; }
.orders-cancel-btn { background:#fff7e8; color:#9a5f0f; border-color:#d98a1f; }
.orders-print-btn { background:#f8f3f5; color:#6b5b63; border-color:#c9b6bf; }
.orders-delete-btn,.orders-remove-btn { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
.orders-view-btn:hover,.orders-view-active:hover,.orders-confirm-btn:hover,.orders-forward-btn:hover,.orders-cancel-btn:hover,.orders-print-btn:hover,.orders-delete-btn:hover,.orders-remove-btn:hover { transform:translateY(-1px); }
.orders-status-select { width:auto; min-width:120px; padding:8px 10px; font-size:12px; font-weight:800; }
.orders-qty-input { width:90px; }
.orders-price-input { width:130px; }
.orders-empty { padding:40px!important; text-align:center; color:#94a3b8!important; font-size:14px!important; font-weight:700; }
.orders-expanded-cell { padding:0!important; background:#fff7fa; }
.order-items-box { padding:18px; }
.orders-count { margin:0 0 12px; color:#64748b; font-size:13px; font-weight:700; }
.orders-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
.orders-modal { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:480px; box-shadow:0 20px 60px rgba(0,0,0,.2); max-height:90vh; overflow-y:auto; }
.orders-modal-title { margin:0 0 8px; font-size:18px; font-weight:800; color:#1f2937; }
@keyframes ordersFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@media (max-width:1180px) { .orders-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .orders-span-2 { grid-column:span 2; } }
@media (max-width:768px) {
  .orders-hero { align-items:flex-start; padding:20px; }
  .orders-title { font-size:24px; }
  .orders-hero-icon { width:48px; height:48px; font-size:20px; }
  .orders-toolbar { flex-direction:column; align-items:stretch; }
  .orders-search-wrap,.orders-add-btn { width:100%; }
  .orders-filter-row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }
  .orders-filter-btn { width:100%; }
  .orders-grid { grid-template-columns:1fr; }
  .orders-span-2 { grid-column:span 1; }
  .orders-items-header { flex-direction:column; align-items:stretch; }
  .orders-row-btn,.orders-submit-btn { width:100%; }
  .orders-table-panel { padding:12px; }
  .orders-main-table { min-width:980px; }
}
@media (max-width:520px) { .orders-hero { flex-direction:column-reverse; } .orders-filter-row { grid-template-columns:1fr; } }
`;

export default Orders;
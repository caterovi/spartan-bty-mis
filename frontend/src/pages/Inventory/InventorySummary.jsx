import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axiosConfig';
import {
  FaBoxOpen, FaChartLine, FaWindowClose, FaExclamationTriangle,
  FaCheckCircle, FaBoxes, FaLayerGroup, FaCalendarTimes, FaArrowDown, FaArrowUp,
} from "react-icons/fa";

const STATUS_STYLES = {
  'in-stock':    { background:'#ecfdf3', color:'#2f7d56',  border:'1px solid #2f9d6a' },
  'low-stock':   { background:'#fff7e8', color:'#9a5f0f',  border:'1px solid #d98a1f' },
  'out-of-stock':{ background:'#fff1f5', color:'#b5536b',  border:'1px solid #c4607a' },
};
const STATUS_LABELS = { 'in-stock':'In Stock', 'low-stock':'Low Stock', 'out-of-stock':'Out of Stock' };

const sugg = (item) => Math.max(0, (Number(item.reorder_level)*2) - Number(item.quantity));

function Section({ title, note, icon, children }) {
  return (
    <div style={{background:'#fff',border:'1px solid #e2c6cf',borderRadius:18,padding:22,marginBottom:20,boxShadow:'0 2px 8px rgba(0,0,0,.05)'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
        <div style={{width:40,height:40,borderRadius:13,display:'grid',placeItems:'center',background:'#fff1f5',border:'1px solid #e8b9c6',color:'#b5536b',flexShrink:0}}>{icon}</div>
        <div>
          <h4 style={{margin:0,color:'#1f2937',fontSize:18,fontWeight:800,letterSpacing:'-.02em'}}>{title}</h4>
          {note && <p style={{margin:'4px 0 0',color:'#64748b',fontSize:13}}>{note}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function ItemTable({ items, cols }) {
  return (
    <div style={{overflowX:'auto',border:'1px solid #ead1d9',borderRadius:14}}>
      <table style={{width:'100%',minWidth:700,borderCollapse:'collapse',background:'#fff'}}>
        <thead style={{background:'#fff7fa'}}>
          <tr>{cols.map(c=><th key={c} style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:'.04em',borderBottom:'1px solid #ead1d9',whiteSpace:'nowrap'}}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {items.length===0 ? (
            <tr><td colSpan={cols.length} style={{padding:30,textAlign:'center',color:'#94a3b8',fontSize:13,fontWeight:700}}>No items.</td></tr>
          ) : items.map((item,i)=>(
            <tr key={item.id||i} style={{borderBottom:'1px solid #f3e8ec'}}>
              <td style={{padding:'11px 14px',fontWeight:850,color:'#1f2937',fontSize:13}}>{item.name}</td>
              <td style={{padding:'11px 14px',color:'#64748b',fontSize:12,fontWeight:700}}>{item.item_code||'—'}</td>
              {cols.includes('Product Type') && <td style={{padding:'11px 14px',fontSize:12}}>{item.product_type||'—'}</td>}
              {cols.includes('Qty') && <td style={{padding:'11px 14px',fontWeight:900,color:item.status==='out-of-stock'?'#c4607a':item.status==='low-stock'?'#d98a1f':'#2f9d6a'}}>{item.quantity}</td>}
              {cols.includes('Reorder') && <td style={{padding:'11px 14px'}}>{item.reorder_level}</td>}
              {cols.includes('Status') && <td style={{padding:'11px 14px'}}><span style={{padding:'4px 9px',borderRadius:9999,fontSize:11,fontWeight:800,...(STATUS_STYLES[item.status]||{})}}>{STATUS_LABELS[item.status]||item.status}</span></td>}
              {cols.includes('Suggested Restock') && <td style={{padding:'11px 14px',fontWeight:800,color:sugg(item)>0?'#9a5f0f':'#2f7d56'}}>{sugg(item)>0?`+${sugg(item)}`:'—'}</td>}
              {cols.includes('Batch') && <td style={{padding:'11px 14px',fontSize:12}}>{item.batch_number||'—'}</td>}
              {cols.includes('Expiry Date') && <td style={{padding:'11px 14px',fontSize:12}}>{item.expiration_date?new Date(item.expiration_date).toLocaleDateString():'—'}</td>}
              {cols.includes('Days Left') && <td style={{padding:'11px 14px',fontWeight:800,color:item.days_remaining<=7?'#b5536b':'#9a5f0f'}}>{item.days_remaining}d</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventorySummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSummary(); }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try { const r = await api.get('/inventory/summary'); setSummary(r.data); }
    catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <Layout><div style={{minHeight:240,display:'grid',placeItems:'center',color:'#b5536b',fontSize:14,fontWeight:700}}>⏳ Loading summary...</div></Layout>;
  if (!summary) return <Layout><div style={{padding:40,textAlign:'center',color:'#b5536b'}}>⚠️ Failed to load summary.</div></Layout>;

  const summaryCards = [
    { label:'Total Items',        value:summary.total_items,     helper:'All active inventory' },
    { label:'Single Products',    value:summary.single_products||0, helper:'Individual items' },
    { label:'Product Sets',       value:summary.product_sets||0, helper:'Sets & bundles' },
    { label:'Promo Bundles',      value:summary.promo_bundles||0,helper:'Promotional packages' },
    { label:'Limited Editions',   value:summary.limited_editions||0, helper:'Limited edition sets' },
    { label:'In Stock',           value:summary.in_stock,        helper:'Available items' },
    { label:'Low Stock',          value:summary.low_stock,       helper:'Below reorder level', warn:true },
    { label:'Out of Stock',       value:summary.out_of_stock,    helper:'Zero quantity', warn:summary.out_of_stock>0 },
    { label:'Total Stock Qty',    value:Number(summary.total_stock_qty||0).toLocaleString(), helper:'Sum of all quantities' },
    { label:'Needs Restock',      value:summary.needs_restock,   helper:'Low + out of stock', warn:true },
    { label:'Near Expiry',        value:summary.near_expiry,     helper:'Within 30 days', warn:summary.near_expiry>0 },
    { label:'Expired Items',      value:summary.expired,         helper:'Past expiration', warn:summary.expired>0 },
  ];

  return (
    <Layout>
      <style>{`
        .invsum-page { width:100%; animation:invsumFadeUp 0.35s ease both; }
        .invsum-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .invsum-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .invsum-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .invsum-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .invsum-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }
        .invsum-cards { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:11px; margin-bottom:20px; }
        .invsum-card { background:#fff; border:1px solid #e2c6cf; border-radius:14px; padding:14px 16px; box-shadow:0 2px 8px rgba(0,0,0,.05); position:relative; overflow:hidden; transition:all 180ms ease; }
        .invsum-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .invsum-card:hover { transform:translateY(-2px); border-color:#c4607a; }
        .invsum-card-label { margin:0 0 8px; color:#64748b; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .invsum-card-value { margin:0; color:#1f2937; font-size:20px; font-weight:850; letter-spacing:-.04em; }
        .invsum-card-helper { margin:4px 0 0; color:#94a3b8; font-size:10px; }
        @keyframes invsumFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width:1180px) { .invsum-cards { grid-template-columns:repeat(4,minmax(0,1fr)); } }
        @media (max-width:768px) {
          .invsum-hero { align-items:flex-start; padding:20px; }
          .invsum-title { font-size:24px; }
          .invsum-hero-icon { width:48px; height:48px; font-size:20px; }
          .invsum-cards { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
        @media (max-width:520px) { .invsum-hero { flex-direction:column-reverse; } .invsum-cards { grid-template-columns:1fr; } }
      `}</style>

      <div className="invsum-page">
        {/* HERO */}
        <div className="invsum-hero">
          <div>
            <p className="invsum-eyebrow">Inventory Overview</p>
            <h3 className="invsum-title">Inventory Summary</h3>
            <p className="invsum-subtitle">Monitor stock levels, product classifications, expiry alerts, and restock needs.</p>
          </div>
          <div className="invsum-hero-icon"><FaBoxes /></div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="invsum-cards">
          {summaryCards.map(c=>(
            <div key={c.label} className="invsum-card">
              <p className="invsum-card-label">{c.label}</p>
              <p className="invsum-card-value" style={c.warn && Number(c.value)>0 ? {color:'#b5536b'} : {}}>{c.value}</p>
              <p className="invsum-card-helper">{c.helper}</p>
            </div>
          ))}
        </div>

        {/* ITEMS NEEDING ATTENTION */}
        {summary.attention?.length > 0 ? (
          <Section title="Items Needing Attention" note="Low-stock and out-of-stock items requiring restock" icon={<FaExclamationTriangle />}>
            <ItemTable items={summary.attention} cols={['Item Name','Code','Product Type','Qty','Reorder','Status','Suggested Restock']} />
          </Section>
        ) : (
          <div style={{background:'radial-gradient(circle at top right,rgba(47,157,106,.14),transparent 34%),linear-gradient(135deg,#ecfdf3,#fff)',border:'1px solid #2f9d6a',borderRadius:18,padding:24,marginBottom:20,display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:44,height:44,borderRadius:14,display:'grid',placeItems:'center',background:'#ecfdf3',color:'#2f9d6a',border:'1px solid #2f9d6a',flexShrink:0,fontSize:20}}><FaCheckCircle /></div>
            <div>
              <h4 style={{margin:0,color:'#1f2937',fontSize:17,fontWeight:850}}>All items are sufficiently stocked</h4>
              <p style={{margin:'4px 0 0',color:'#64748b',fontSize:13}}>No low-stock or out-of-stock items need attention right now.</p>
            </div>
          </div>
        )}

        {/* PRODUCT SETS */}
        {summary.sets?.length > 0 && (
          <Section title="Product Sets / Bundles" note="BTY sets and bundle stock levels" icon={<FaLayerGroup />}>
            <ItemTable items={summary.sets} cols={['Item Name','Code','Product Type','Qty','Reorder','Status','Suggested Restock']} />
          </Section>
        )}

        {/* PROMO BUNDLES */}
        {summary.promos?.length > 0 && (
          <Section title="Promo Bundles" note="Promotional bundle stock levels" icon={<FaBoxOpen />}>
            <ItemTable items={summary.promos} cols={['Item Name','Code','Product Type','Qty','Reorder','Status','Suggested Restock']} />
          </Section>
        )}

        {/* LIMITED EDITIONS */}
        {summary.limited?.length > 0 && (
          <Section title="Limited Edition Sets" note="Limited edition product stock levels" icon={<FaBoxes />}>
            <ItemTable items={summary.limited} cols={['Item Name','Code','Product Type','Qty','Reorder','Status','Suggested Restock']} />
          </Section>
        )}

        {/* NEAR EXPIRY */}
        {summary.near_expiry_items?.length > 0 && (
          <Section title="Near Expiry Items" note="Expiring within the next 30 days" icon={<FaCalendarTimes />}>
            <ItemTable items={summary.near_expiry_items} cols={['Item Name','Code','Batch','Expiry Date','Days Left']} />
          </Section>
        )}

        {/* EXPIRED */}
        {summary.expired_items?.length > 0 && (
          <Section title="Expired Items" note="Past expiration date — requires action" icon={<FaWindowClose />}>
            <ItemTable items={summary.expired_items} cols={['Item Name','Code','Batch','Expiry Date']} />
          </Section>
        )}

        {/* TOP STOCK OUT */}
        {summary.top_stock_out?.length > 0 && (
          <Section title="Top Stock-Out Items" note="Items with highest outgoing movement" icon={<FaArrowDown />}>
            <div style={{overflowX:'auto',border:'1px solid #ead1d9',borderRadius:14}}>
              <table style={{width:'100%',minWidth:500,borderCollapse:'collapse',background:'#fff'}}>
                <thead style={{background:'#fff7fa'}}>
                  <tr>
                    <th style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:800,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #ead1d9'}}>#</th>
                    <th style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:800,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #ead1d9'}}>Item</th>
                    <th style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:800,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #ead1d9'}}>Code</th>
                    <th style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:800,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #ead1d9'}}>Total Out</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.top_stock_out.map((r,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #f3e8ec'}}>
                      <td style={{padding:'11px 14px',color:'#b5536b',fontWeight:850}}>{i+1}</td>
                      <td style={{padding:'11px 14px',fontWeight:700}}>{r.name}</td>
                      <td style={{padding:'11px 14px',color:'#64748b',fontSize:12}}>{r.item_code||'—'}</td>
                      <td style={{padding:'11px 14px',fontWeight:900,color:'#c4607a'}}>{Number(r.total_out).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* TOP STOCK IN */}
        {summary.top_stock_in?.length > 0 && (
          <Section title="Top Stock-In Items" note="Items with highest incoming movement" icon={<FaArrowUp />}>
            <div style={{overflowX:'auto',border:'1px solid #ead1d9',borderRadius:14}}>
              <table style={{width:'100%',minWidth:500,borderCollapse:'collapse',background:'#fff'}}>
                <thead style={{background:'#fff7fa'}}>
                  <tr>
                    <th style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:800,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #ead1d9'}}>#</th>
                    <th style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:800,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #ead1d9'}}>Item</th>
                    <th style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:800,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #ead1d9'}}>Code</th>
                    <th style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:800,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #ead1d9'}}>Total In</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.top_stock_in.map((r,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #f3e8ec'}}>
                      <td style={{padding:'11px 14px',color:'#b5536b',fontWeight:850}}>{i+1}</td>
                      <td style={{padding:'11px 14px',fontWeight:700}}>{r.name}</td>
                      <td style={{padding:'11px 14px',color:'#64748b',fontSize:12}}>{r.item_code||'—'}</td>
                      <td style={{padding:'11px 14px',fontWeight:900,color:'#2f9d6a'}}>{Number(r.total_in).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* RECENT MOVEMENTS */}
        {summary.recent_movements?.length > 0 && (
          <Section title="Recently Updated Stock" note="Last 10 stock movement records" icon={<FaChartLine />}>
            <div style={{overflowX:'auto',border:'1px solid #ead1d9',borderRadius:14}}>
              <table style={{width:'100%',minWidth:700,borderCollapse:'collapse',background:'#fff'}}>
                <thead style={{background:'#fff7fa'}}>
                  <tr>
                    {['Item','Type','Prev','Movement','New','Reference','Date'].map(h=>(
                      <th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:800,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #ead1d9',whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.recent_movements.map((m,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #f3e8ec'}}>
                      <td style={{padding:'11px 14px',fontWeight:700,fontSize:13}}>{m.item_name}</td>
                      <td style={{padding:'11px 14px'}}>
                        <span style={{padding:'3px 8px',borderRadius:9999,fontSize:11,fontWeight:800,
                          background:m.type==='stock-in'?'#ecfdf3':'#fff1f5',
                          color:m.type==='stock-in'?'#2f7d56':'#b5536b',
                          border:`1px solid ${m.type==='stock-in'?'#2f9d6a':'#c4607a'}`}}>
                          {m.type==='stock-in'?'Stock In':'Stock Out'}
                        </span>
                      </td>
                      <td style={{padding:'11px 14px',color:'#64748b',fontWeight:700}}>{m.previous_quantity??'—'}</td>
                      <td style={{padding:'11px 14px',fontWeight:900,color:m.type==='stock-in'?'#2f9d6a':'#c4607a'}}>
                        {m.type==='stock-in'?'+':'-'}{m.quantity}
                      </td>
                      <td style={{padding:'11px 14px',fontWeight:900}}>{m.new_quantity??'—'}</td>
                      <td style={{padding:'11px 14px',fontSize:11,color:'#64748b'}}>{m.reference_type||'—'}</td>
                      <td style={{padding:'11px 14px',fontSize:12,color:'#64748b'}}>{new Date(m.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}
      </div>
    </Layout>
  );
}

export default InventorySummary;
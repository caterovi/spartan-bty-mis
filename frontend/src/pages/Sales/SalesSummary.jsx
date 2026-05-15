import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axiosConfig';
import {
  FaCartPlus, FaMoneyBill, FaClock, FaTruck, FaWindowClose,
  FaChartBar, FaCheckCircle, FaUser, FaBox, FaTag, FaFilter,
} from "react-icons/fa";

const money = (v) => `₱${Number(v||0).toLocaleString()}`;

const RANGE_OPTIONS = [
  { value:'all',    label:'All Time' },
  { value:'today',  label:'Today' },
  { value:'week',   label:'This Week' },
  { value:'month',  label:'This Month' },
  { value:'custom', label:'Custom Range' },
];

function SalesSummary() {
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [range, setRange]         = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  useEffect(() => { fetchSummary(); }, [range, startDate, endDate]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      let url = `/sales/summary?range=${range}`;
      if (range==='custom' && startDate && endDate) url += `&start_date=${startDate}&end_date=${endDate}`;
      const r = await api.get(url);
      setSummary(r.data);
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  const agingLabel = (days) => {
    if (days===0) return {label:'New',color:'#2f7d56'};
    if (days===1) return {label:'1 day',color:'#9a5f0f'};
    if (days>=3)  return {label:'Follow-up!',color:'#b5536b'};
    return {label:`${days}d`,color:'#9a5f0f'};
  };

  return (
    <Layout>
      <style>{`
        .ss-page { width:100%; animation:ssFadeUp 0.35s ease both; }
        .ss-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .ss-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .ss-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .ss-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:680px; }
        .ss-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }

        /* FILTERS */
        .ss-filters { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:14px 16px; margin-bottom:20px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .ss-filter-select,.ss-filter-date { padding:9px 12px; border-radius:10px; border:1px solid #d8b8c2; background:#fff7fa; color:#374151; font-size:13px; font-weight:600; outline:none; }
        .ss-filter-select:focus,.ss-filter-date:focus { border-color:#c4607a; }

        /* CARDS */
        .ss-cards { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:20px; }
        .ss-card { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:18px; box-shadow:0 2px 8px rgba(0,0,0,.05); position:relative; overflow:hidden; transition:all 180ms ease; }
        .ss-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .ss-card:hover { transform:translateY(-2px); border-color:#c4607a; box-shadow:0 4px 16px rgba(0,0,0,.07); }
        .ss-card-top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
        .ss-card-label { margin:0; color:#64748b; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .ss-card-icon { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; color:#b5536b; background:#fff1f5; border:1px solid #e8b9c6; font-size:17px; flex:0 0 auto; }
        .ss-card-value { margin:0; color:#1f2937; font-size:24px; font-weight:850; letter-spacing:-.04em; }
        .ss-card-helper { margin:7px 0 0; color:#7b8794; font-size:12px; }

        /* SECTION */
        .ss-section { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .ss-section-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .ss-section-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .ss-section-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .ss-section-note { margin:4px 0 0; color:#64748b; font-size:13px; }

        /* STATUS BARS */
        .ss-bar-row { display:grid; grid-template-columns:120px 1fr 60px; align-items:center; gap:12px; margin-bottom:14px; }
        .ss-bar-label { display:flex; align-items:center; gap:8px; color:#374151; font-size:13px; font-weight:700; }
        .ss-dot { width:9px; height:9px; border-radius:9999px; flex:0 0 auto; }
        .ss-bar-track { height:14px; border-radius:9999px; background:#f3e8ec; overflow:hidden; border:1px solid #ead1d9; }
        .ss-bar-fill { height:100%; border-radius:9999px; transition:width 320ms ease; min-width:8px; }
        .ss-bar-count { justify-self:end; min-width:46px; padding:5px 9px; border-radius:9999px; font-size:12px; font-weight:800; text-align:center; background:#fff7fa; border:1px solid #e8b9c6; color:#1f2937; }

        /* TABLES */
        .ss-table-wrap { overflow-x:auto; border:1px solid #ead1d9; border-radius:14px; }
        .ss-table { width:100%; min-width:600px; border-collapse:collapse; }
        .ss-table thead { background:#fff7fa; }
        .ss-table th { padding:12px 14px; text-align:left; font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #ead1d9; white-space:nowrap; }
        .ss-table td { padding:12px 14px; font-size:13px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; }
        .ss-table tbody tr:hover { background:#fff7fa; }
        .ss-table tbody tr:last-child td { border-bottom:none; }
        .ss-money { font-weight:850; color:#b5536b; }
        .ss-empty { padding:30px!important; text-align:center; color:#94a3b8!important; font-size:13px!important; font-weight:700; }

        /* 2-col grid */
        .ss-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; }

        .ss-loading { min-height:240px; display:grid; place-items:center; color:#b5536b; font-size:14px; font-weight:700; }

        @keyframes ssFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width:1180px) { .ss-cards { grid-template-columns:repeat(3,minmax(0,1fr)); } .ss-grid-2 { grid-template-columns:1fr; } }
        @media (max-width:768px) {
          .ss-hero { align-items:flex-start; padding:20px; }
          .ss-title { font-size:24px; }
          .ss-hero-icon { width:48px; height:48px; font-size:20px; }
          .ss-cards { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .ss-filters { flex-direction:column; align-items:stretch; }
          .ss-filter-select,.ss-filter-date { width:100%; }
          .ss-bar-row { grid-template-columns:1fr; gap:6px; }
          .ss-bar-count { justify-self:start; }
        }
        @media (max-width:520px) { .ss-hero { flex-direction:column-reverse; } .ss-cards { grid-template-columns:1fr; } }
      `}</style>

      <div className="ss-page">
        {/* HERO */}
        <div className="ss-hero">
          <div>
            <p className="ss-eyebrow">Sales Overview</p>
            <h3 className="ss-title">Sales Summary</h3>
            <p className="ss-subtitle">Monitor order volume, revenue, and fulfillment analytics in one dashboard.</p>
          </div>
          <div className="ss-hero-icon"><FaChartBar /></div>
        </div>

        {/* DATE RANGE FILTERS */}
        <div className="ss-filters">
          <FaFilter style={{color:'#b5536b',fontSize:13,flexShrink:0}} />
          {RANGE_OPTIONS.map(r=>(
            <button key={r.value} onClick={()=>setRange(r.value)}
              style={{padding:'9px 16px',borderRadius:10,border:'1px solid',fontWeight:800,fontSize:13,cursor:'pointer',transition:'all 180ms',
                background:range===r.value?'linear-gradient(135deg,#c4607a,#e58ca3)':'#fff',
                color:range===r.value?'#fff':'#64748b',
                borderColor:range===r.value?'#c4607a':'#d8b8c2'}}>
              {r.label}
            </button>
          ))}
          {range==='custom' && (
            <>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="ss-filter-date" />
              <span style={{fontSize:12,color:'#64748b'}}>to</span>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="ss-filter-date" />
            </>
          )}
        </div>

        {loading ? (
          <div className="ss-loading">⏳ Loading summary...</div>
        ) : !summary ? (
          <div className="ss-loading">⚠️ Failed to load summary.</div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <div className="ss-cards">
              {[
                { label:'Total Orders',     value:summary.total_orders,                   icon:<FaCartPlus />,    helper:'All recorded orders' },
                { label:'Total Revenue',    value:money(summary.total_revenue),            icon:<FaMoneyBill />,   helper:'Excl. cancelled orders' },
                { label:'Avg Order Value',  value:money(summary.avg_order),               icon:<FaChartBar />,    helper:'Average per order' },
                { label:'Pending',          value:summary.pending,                         icon:<FaClock />,       helper:'Awaiting confirmation' },
                { label:'Confirmed',        value:summary.confirmed,                       icon:<FaCheckCircle />, helper:'Ready for forwarding' },
                { label:'Forwarded',        value:summary.forwarded,                       icon:<FaTruck />,       helper:'Sent to logistics' },
                { label:'Cancelled',        value:summary.cancelled,                       icon:<FaWindowClose />, helper:'Cancelled transactions' },
                { label:'Orders w/ Promo',  value:summary.promo_orders,                   icon:<FaTag />,         helper:'Applied promo codes' },
              ].map(c=>(
                <div key={c.label} className="ss-card">
                  <div className="ss-card-top">
                    <p className="ss-card-label">{c.label}</p>
                    <span className="ss-card-icon">{c.icon}</span>
                  </div>
                  <p className="ss-card-value">{c.value}</p>
                  <p className="ss-card-helper">{c.helper}</p>
                </div>
              ))}
            </div>

            {/* STATUS BARS + PROMO SUMMARY */}
            <div className="ss-grid-2" style={{marginBottom:20}}>
              {/* Orders by Status */}
              <div className="ss-section">
                <div className="ss-section-header">
                  <div className="ss-section-icon"><FaCheckCircle /></div>
                  <div>
                    <h4 className="ss-section-title">Orders by Status</h4>
                    <p className="ss-section-note">Distribution of order progress</p>
                  </div>
                </div>
                {[
                  { label:'Pending',   value:summary.pending,   color:'#d98a1f', tint:'#fff7e8' },
                  { label:'Confirmed', value:summary.confirmed, color:'#b5536b', tint:'#fff1f5' },
                  { label:'Forwarded', value:summary.forwarded, color:'#2f9d6a', tint:'#ecfdf3' },
                  { label:'Cancelled', value:summary.cancelled, color:'#c9b6bf', tint:'#f8f3f5' },
                ].map(s=>{
                  const max = Math.max(summary.pending,summary.confirmed,summary.forwarded,summary.cancelled,1);
                  return (
                    <div key={s.label} className="ss-bar-row">
                      <span className="ss-bar-label"><span className="ss-dot" style={{backgroundColor:s.color}}/>{s.label}</span>
                      <div className="ss-bar-track"><div className="ss-bar-fill" style={{width:`${(Number(s.value)||0)/max*100}%`,backgroundColor:s.color}}/></div>
                      <span className="ss-bar-count" style={{backgroundColor:s.tint,borderColor:s.color}}>{s.value}</span>
                    </div>
                  );
                })}
              </div>

              {/* Promo Usage */}
              <div className="ss-section">
                <div className="ss-section-header">
                  <div className="ss-section-icon"><FaTag /></div>
                  <div>
                    <h4 className="ss-section-title">Promo Usage</h4>
                    <p className="ss-section-note">Discount and promo analytics</p>
                  </div>
                </div>
                {[
                  ['Orders with Promo',    summary.promo_orders],
                  ['Total Discount Given', money(summary.total_discount)],
                  ['Most Used Promo',      summary.most_used_promo||'—'],
                  ['Most Used Count',      summary.most_used_promo_count||0],
                ].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #f3e8ec',fontSize:13}}>
                    <span style={{color:'#64748b',fontWeight:700}}>{k}</span>
                    <span style={{fontWeight:800,color:'#1f2937'}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TOP PRODUCTS + SALESPERSON */}
            <div className="ss-grid-2" style={{marginBottom:20}}>
              {/* Top Products */}
              <div className="ss-section">
                <div className="ss-section-header">
                  <div className="ss-section-icon"><FaBox /></div>
                  <div>
                    <h4 className="ss-section-title">Top Selling Products</h4>
                    <p className="ss-section-note">By quantity sold</p>
                  </div>
                </div>
                <div className="ss-table-wrap">
                  <table className="ss-table">
                    <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead>
                    <tbody>
                      {!summary.top_products?.length ? (
                        <tr><td colSpan="4" className="ss-empty">No data.</td></tr>
                      ) : summary.top_products.map((p,i)=>(
                        <tr key={i}>
                          <td style={{color:'#b5536b',fontWeight:850}}>{i+1}</td>
                          <td style={{fontWeight:700}}>{p.item_name}</td>
                          <td>{Number(p.total_qty).toLocaleString()}</td>
                          <td className="ss-money">{money(p.total_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Salesperson Performance */}
              <div className="ss-section">
                <div className="ss-section-header">
                  <div className="ss-section-icon"><FaUser /></div>
                  <div>
                    <h4 className="ss-section-title">Salesperson Performance</h4>
                    <p className="ss-section-note">By total revenue</p>
                  </div>
                </div>
                <div className="ss-table-wrap">
                  <table className="ss-table">
                    <thead><tr><th>Salesperson</th><th>Orders</th><th>Revenue</th></tr></thead>
                    <tbody>
                      {!summary.salesperson_perf?.length ? (
                        <tr><td colSpan="3" className="ss-empty">No data.</td></tr>
                      ) : summary.salesperson_perf.map((s,i)=>(
                        <tr key={i}>
                          <td style={{fontWeight:700}}>{s.salesperson}</td>
                          <td>{s.total_orders}</td>
                          <td className="ss-money">{money(s.total_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* PENDING ORDER AGING */}
            <div className="ss-section">
              <div className="ss-section-header">
                <div className="ss-section-icon"><FaClock /></div>
                <div>
                  <h4 className="ss-section-title">Pending Order Aging</h4>
                  <p className="ss-section-note">Orders that need attention</p>
                </div>
              </div>
              <div className="ss-table-wrap">
                <table className="ss-table">
                  <thead><tr><th>Order Code</th><th>Customer</th><th>Order Date</th><th>Days Pending</th><th>Status</th></tr></thead>
                  <tbody>
                    {!summary.pending_aging?.length ? (
                      <tr><td colSpan="5" className="ss-empty">No pending orders.</td></tr>
                    ) : summary.pending_aging.map(o=>{
                      const ag = agingLabel(o.days_pending);
                      return (
                        <tr key={o.id}>
                          <td style={{fontWeight:850,color:'#64748b'}}>{o.order_code}</td>
                          <td style={{fontWeight:700}}>{o.customer_name}</td>
                          <td>{o.order_date?new Date(o.order_date).toLocaleDateString():'—'}</td>
                          <td>{o.days_pending}d</td>
                          <td><span style={{padding:'3px 10px',borderRadius:9999,fontSize:11,fontWeight:800,color:ag.color,background:ag.color+'20',border:`1px solid ${ag.color}`}}>{ag.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default SalesSummary;
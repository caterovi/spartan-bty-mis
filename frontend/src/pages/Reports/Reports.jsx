import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function Reports() {
  const [salespersonFilter, setSalespersonFilter] = useState('all');
  const [salespersons, setSalespersons]           = useState([]);
  const navigate = useNavigate();
  const [activeReport, setActiveReport] = useState('sales');
  const [data, setData]                 = useState(null);
  const [loading, setLoading]           = useState(false);
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [filterMode, setFilterMode]     = useState('custom');

  useEffect(() => { loadReport(activeReport); }, [activeReport]);

  const loadReport = async (type) => {
    setLoading(true);
    setData(null);
    try {
      let res;
      if (type === 'sales') {
        res = await api.get('/sales/orders');
        try {
          const sumRes = await api.get('/sales/summary');
          setSalespersons(sumRes.data.salespersons || []);
        } catch (e) { console.error(e); }
      }
      if (type === 'inventory')    res = await api.get('/inventory/items');
      if (type === 'hr')           res = await api.get('/hr/employees');
      if (type === 'logistics')    res = await api.get('/logistics/shipments');
      if (type === 'crm')          res = await api.get('/crm/feedback');
      if (type === 'campaigns')    res = await api.get('/marketing/campaigns');
      if (type === 'promotions')   res = await api.get('/marketing/promotions');
      if (type === 'liveselling')  res = await api.get('/marketing/live-selling');
      if (type === 'content')      res = await api.get('/marketing/content');
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const applyQuickFilter = (mode) => {
    setFilterMode(mode);
    const today = new Date();
    if (mode === 'daily') {
      const d = today.toISOString().split('T')[0];
      setDateFrom(d); setDateTo(d);
    } else if (mode === 'monthly') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay  = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      setDateFrom(firstDay); setDateTo(lastDay);
    } else if (mode === 'yearly') {
      const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      const lastDay  = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
      setDateFrom(firstDay); setDateTo(lastDay);
    } else {
      setDateFrom(''); setDateTo('');
    }
  };

  const handlePrint = () => { window.print(); };

  const handleExportPDF = async () => {
    const reportLabel = reportTypes.find(r => r.key === activeReport)?.label || 'Report';
    const fileName = `SpartanBTY_${reportLabel.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-CA')}.pdf`;

    const printOnlyEls = document.querySelectorAll('.print-only');
    const noPrintEls   = document.querySelectorAll('.no-print');
    printOnlyEls.forEach(el => el.style.setProperty('display', 'block', 'important'));
    noPrintEls.forEach(el => el.style.setProperty('display', 'none', 'important'));

    const element = document.getElementById('print-area');
    const originalStyle = element.getAttribute('style') || '';

    element.style.cssText = `
      position: static !important;
      width: 794px !important;
      margin: 0 auto !important;
      padding: 40px !important;
      background: white !important;
      font-family: Segoe UI, sans-serif !important;
    `;

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const canvas = await html2canvas(element, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff',
        width: 794, windowWidth: 794,
      });
      const imgData  = canvas.toDataURL('image/png');
      const pdf      = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position   = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position -= pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      element.setAttribute('style', originalStyle);
      printOnlyEls.forEach(el => el.style.removeProperty('display'));
      noPrintEls.forEach(el => el.style.removeProperty('display'));
    }
  };

 const filtered = () => {
  if (!data) return [];
  let result = data;
  if (dateFrom || dateTo) {
    result = result.filter(item => {
      const date = new Date(item.created_at || item.order_date || item.start_date || item.scheduled_date || item.due_date);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to   = dateTo   ? new Date(dateTo + 'T23:59:59') : null;
      if (from && date < from) return false;
      if (to   && date > to)   return false;
      return true;
    });
  }
  if (activeReport === 'sales' && salespersonFilter !== 'all') {
    result = result.filter(o => o.salesperson === salespersonFilter);
  }
  return result;
};

  const reportTypes = [
    { key: 'sales',        label: 'Sales',            group: 'Sales' },
    { key: 'inventory',    label: 'Inventory',        group: 'Inventory' },
    { key: 'hr',           label: 'Employees',        group: 'HR' },
    { key: 'logistics',    label: 'Logistics',        group: 'Logistics' },
    { key: 'crm',          label: 'CRM Feedback',     group: 'CRM' },
    { key: 'campaigns',    label: 'Campaigns',        group: 'Marketing' },
    { key: 'promotions',   label: 'Promotions',       group: 'Marketing' },
    { key: 'liveselling',  label: 'Live Selling',     group: 'Marketing' },
    { key: 'content',      label: 'Content Creation', group: 'Marketing' },
  ];

  const rows = filtered();
  const currentReport = reportTypes.find(r => r.key === activeReport);

  return (
    <Layout>
      <div id="print-area">

        {/* Header */}
        <div style={styles.topbar} className="no-print mobile-top-row">
          <div>
            <h1 style={styles.pageTitle}>Reports</h1>
            <p style={styles.pageSubtitle}>Generate and export reports for all modules</p>
          </div>
          <div style={styles.btnGroup} className="mobile-button-group">
            <button onClick={handlePrint} style={styles.printBtn} className="mobile-action-btn">Print</button>
            <button onClick={handleExportPDF} style={styles.pdfBtn} className="mobile-action-btn">Export as PDF</button>
          </div>
        </div>

        {/* Report Type Tabs - Grouped */}
        <div className="no-print">
          <div style={styles.groupLabel}>General</div>
          <div style={styles.reportTabs} className="mobile-filter-row">
            {reportTypes.filter(r => r.group !== 'Marketing').map(r => (
              <button
                key={r.key}
                onClick={() => setActiveReport(r.key)}
                style={activeReport === r.key ? styles.tabActive : styles.tab}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
          <div style={styles.groupLabel}>Marketing</div>
          <div style={{ ...styles.reportTabs, marginBottom: '16px' }}>
            {reportTypes.filter(r => r.group === 'Marketing').map(r => (
              <button
                key={r.key}
                onClick={() => setActiveReport(r.key)}
                style={activeReport === r.key ? styles.tabActive : styles.tab}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter */}
        <div style={styles.filterBox} className="no-print">
          <div style={styles.quickFilters}>
            <p style={styles.filterLabel}>Quick Filter:</p>
            {[
              { key: 'daily',   label: 'Today' },
              { key: 'monthly', label: 'This Month' },
              { key: 'yearly',  label: 'This Year' },
              { key: 'custom',  label: 'Custom' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => applyQuickFilter(f.key)}
                style={filterMode === f.key ? styles.quickBtnActive : styles.quickBtn}
              >
                {f.label}
              </button>
            ))}
          </div>
          {filterMode === 'custom' && (
            <div style={styles.dateRange}>
              {activeReport === 'sales' && salespersons.length > 0 && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
    <label style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>
       Salesperson:
    </label>
    <select
      value={salespersonFilter}
      onChange={e => setSalespersonFilter(e.target.value)}
      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' }}
    >
      <option value="all">All Salespersons</option>
      {salespersons.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
    {salespersonFilter !== 'all' && (
      <button
        onClick={() => setSalespersonFilter('all')}
        style={{ padding: '8px 14px', backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
      >
        Clear
      </button>
    )}
  </div>
)}
              <div style={styles.filterGroup}>
                <label style={styles.label}>From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.label}>To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={styles.input} />
              </div>
              <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={styles.clearBtn}>Clear</button>
            </div>
          )}
          {(dateFrom || dateTo) && (
            <div style={styles.activeFilter}>
               {dateFrom || ''} to {dateTo || ''}
              <span style={styles.recordBadge}>{rows.length} record{rows.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Print Header */}
        <div style={styles.printHeader} className="print-only">
          <h2 style={styles.printTitle}>Spartan BTY Inc.</h2>
          <p style={styles.printSub}>Management Information System</p>
          <h3 style={styles.printReport}>{currentReport?.label} Report</h3>
          <p style={styles.printDate}>
            Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            {dateFrom && ` | From: ${dateFrom}`}{dateTo && ` To: ${dateTo}`}
          </p>
          <hr style={{ margin: '12px 0 16px', borderColor: '#ddd' }} />
        </div>

        {/* Report Content */}
        <div style={styles.reportBox}>
          {!loading && (
            <div style={styles.reportHeader} className="no-print">
              <p style={styles.reportTitle}>{currentReport?.icon} {currentReport?.label} Report</p>
              <p style={styles.recordCount}>{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
            </div>
          )}

          {loading ? <div style={styles.loading}>Loading report...</div> : (
            <>
              {/* SALES */}
              {activeReport === 'sales' && (
                <div className="mobile-table-container"><table style={styles.table}>
                  <thead><tr style={styles.thead}>
                    <th style={styles.th}>Order Code</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Salesperson</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {rows.length === 0 ? <tr><td colSpan="6" style={styles.empty}>No records found.</td></tr>
                    : rows.map(o => (
                      <tr key={o.id} style={styles.tr}>
                        <td style={styles.td}>{o.order_code}</td>
                        <td style={styles.td}>{o.customer_name}</td>
                        <td style={styles.td}>{o.salesperson || ''}</td>
                        <td style={styles.td}>{o.customer_phone || ''}</td>
                        <td style={styles.td}>{new Date(o.order_date).toLocaleDateString()}</td>
                        <td style={styles.td}>{Number(o.total_amount).toLocaleString()}</td>
                        <td style={styles.td}>{o.status}</td>
                      </tr>
                    ))}
                    {rows.length > 0 && (
                      <tr style={styles.totalRow}>
                        <td colSpan="5" style={{ ...styles.td, textAlign: 'right', fontWeight: '700' }}>Total Revenue:</td>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#c4607a' }}>{rows.reduce((s, o) => s + Number(o.total_amount), 0).toLocaleString()}</td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table></div>
              )}

              {/* INVENTORY */}
              {activeReport === 'inventory' && (
                <div className="mobile-table-container"><table style={styles.table}>
                  <thead><tr style={styles.thead}>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Quantity</th>
                    <th style={styles.th}>Unit Price</th>
                    <th style={styles.th}>Total Value</th>
                    <th style={styles.th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {rows.length === 0 ? <tr><td colSpan="7" style={styles.empty}>No records found.</td></tr>
                    : rows.map(i => (
                      <tr key={i.id} style={styles.tr}>
                        <td style={styles.td}>{i.item_code}</td>
                        <td style={styles.td}>{i.name}</td>
                        <td style={styles.td}>{i.category || ''}</td>
                        <td style={styles.td}>{i.quantity} {i.unit}</td>
                        <td style={styles.td}>{Number(i.unit_price).toLocaleString()}</td>
                        <td style={styles.td}>{(i.quantity * Number(i.unit_price)).toLocaleString()}</td>
                        <td style={styles.td}>{i.status}</td>
                      </tr>
                    ))}
                    {rows.length > 0 && (
                      <tr style={styles.totalRow}>
                        <td colSpan="5" style={{ ...styles.td, textAlign: 'right', fontWeight: '700' }}>Total Value:</td>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#c4607a' }}>{rows.reduce((s, i) => s + (i.quantity * Number(i.unit_price)), 0).toLocaleString()}</td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table></div>
              )}

              {/* HR */}
              {activeReport === 'hr' && (
                <div className="mobile-table-container"><table style={styles.table}>
                  <thead><tr style={styles.thead}>
                    <th style={styles.th}>Employee ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Department</th>
                    <th style={styles.th}>Position</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Salary</th>
                    <th style={styles.th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {rows.length === 0 ? <tr><td colSpan="7" style={styles.empty}>No records found.</td></tr>
                    : rows.map(e => (
                      <tr key={e.id} style={styles.tr}>
                        <td style={styles.td}>{e.employee_id}</td>
                        <td style={styles.td}>{e.full_name}</td>
                        <td style={styles.td}>{e.department}</td>
                        <td style={styles.td}>{e.position}</td>
                        <td style={styles.td}>{e.employment_type}</td>
                        <td style={styles.td}>{Number(e.salary).toLocaleString()}</td>
                        <td style={styles.td}>{e.status}</td>
                      </tr>
                    ))}
                    {rows.length > 0 && (
                      <tr style={styles.totalRow}>
                        <td colSpan="5" style={{ ...styles.td, textAlign: 'right', fontWeight: '700' }}>Total Payroll:</td>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#c4607a' }}>{rows.reduce((s, e) => s + Number(e.salary), 0).toLocaleString()}</td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table></div>
              )}

              {/* LOGISTICS */}
              {activeReport === 'logistics' && (
                <div className="mobile-table-container"><table style={styles.table}>
                  <thead><tr style={styles.thead}>
                    <th style={styles.th}>Shipment Code</th>
                    <th style={styles.th}>Order Code</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Courier</th>
                    <th style={styles.th}>Packing</th>
                    <th style={styles.th}>Shipping</th>
                    <th style={styles.th}>Est. Delivery</th>
                  </tr></thead>
                  <tbody>
                    {rows.length === 0 ? <tr><td colSpan="7" style={styles.empty}>No records found.</td></tr>
                    : rows.map(s => (
                      <tr key={s.id} style={styles.tr}>
                        <td style={styles.td}>{s.shipment_code}</td>
                        <td style={styles.td}>{s.order_code || ''}</td>
                        <td style={styles.td}>{s.customer_name}</td>
                        <td style={styles.td}>{s.courier || ''}</td>
                        <td style={styles.td}>{s.packing_status}</td>
                        <td style={styles.td}>{s.shipping_status}</td>
                        <td style={styles.td}>{s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString() : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}

              {/* CRM */}
              {activeReport === 'crm' && (
                <div className="mobile-table-container"><table style={styles.table}>
                  <thead><tr style={styles.thead}>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Rating</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Date</th>
                  </tr></thead>
                  <tbody>
                    {rows.length === 0 ? <tr><td colSpan="6" style={styles.empty}>No records found.</td></tr>
                    : rows.map(f => (
                      <tr key={f.id} style={styles.tr}>
                        <td style={styles.td}>{f.customer_name}</td>
                        <td style={styles.td}>{f.type}</td>
                        <td style={styles.td}>{f.subject}</td>
                        <td style={styles.td}>{f.rating}</td>
                        <td style={styles.td}>{f.status}</td>
                        <td style={styles.td}>{new Date(f.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}

              {/* CAMPAIGNS */}
              {activeReport === 'campaigns' && (
                <div className="mobile-table-container"><table style={styles.table}>
                  <thead><tr style={styles.thead}>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Platform</th>
                    <th style={styles.th}>Start Date</th>
                    <th style={styles.th}>End Date</th>
                    <th style={styles.th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {rows.length === 0 ? <tr><td colSpan="6" style={styles.empty}>No records found.</td></tr>
                    : rows.map(c => (
                      <tr key={c.id} style={styles.tr}>
                        <td style={styles.td}>{c.title}</td>
                        <td style={styles.td}>{c.platform}</td>
                        <td style={styles.td}>{new Date(c.start_date).toLocaleDateString()}</td>
                        <td style={styles.td}>{new Date(c.end_date).toLocaleDateString()}</td>
                        <td style={styles.td}>{c.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}

              {/* PROMOTIONS */}
              {activeReport === 'promotions' && (
                <div className="mobile-table-container"><table style={styles.table}>
                  <thead><tr style={styles.thead}>
                    <th style={styles.th}>Promo Code</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Discount Type</th>
                    <th style={styles.th}>Discount Value</th>
                    <th style={styles.th}>Min. Order</th>
                    <th style={styles.th}>Start Date</th>
                    <th style={styles.th}>End Date</th>
                    <th style={styles.th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {rows.length === 0 ? <tr><td colSpan="8" style={styles.empty}>No records found.</td></tr>
                    : rows.map(p => (
                      <tr key={p.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#c4607a' }}>{p.promo_code}</td>
                        <td style={styles.td}>{p.description || ''}</td>
                        <td style={styles.td}>{p.discount_type}</td>
                        <td style={styles.td}>{p.discount_type === 'percentage' ? `${p.discount_value}%` : `${Number(p.discount_value).toLocaleString()}`}</td>
                        <td style={styles.td}>{Number(p.min_order).toLocaleString()}</td>
                        <td style={styles.td}>{new Date(p.start_date).toLocaleDateString()}</td>
                        <td style={styles.td}>{new Date(p.end_date).toLocaleDateString()}</td>
                        <td style={styles.td}>{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}

              {/* LIVE SELLING */}
              {activeReport === 'liveselling' && (
                <div className="mobile-table-container"><table style={styles.table}>
                  <thead><tr style={styles.thead}>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Platform</th>
                    <th style={styles.th}>Scheduled</th>
                    <th style={styles.th}>Host</th>
                    <th style={styles.th}>Target Sales</th>
                    <th style={styles.th}>Actual Sales</th>
                    <th style={styles.th}>Viewers</th>
                    <th style={styles.th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {rows.length === 0 ? <tr><td colSpan="8" style={styles.empty}>No records found.</td></tr>
                    : rows.map(l => (
                      <tr key={l.id} style={styles.tr}>
                        <td style={styles.td}>{l.title}</td>
                        <td style={styles.td}>{l.platform}</td>
                        <td style={styles.td}>{new Date(l.scheduled_date).toLocaleString()}</td>
                        <td style={styles.td}>{l.host || ''}</td>
                        <td style={styles.td}>{Number(l.target_sales).toLocaleString()}</td>
                        <td style={styles.td}>{Number(l.actual_sales).toLocaleString()}</td>
                        <td style={styles.td}>{Number(l.viewers).toLocaleString()}</td>
                        <td style={styles.td}>{l.status}</td>
                      </tr>
                    ))}
                    {rows.length > 0 && (
                      <tr style={styles.totalRow}>
                        <td colSpan="4" style={{ ...styles.td, textAlign: 'right', fontWeight: '700' }}>Total Actual Sales:</td>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#c4607a' }}>{rows.reduce((s, l) => s + Number(l.actual_sales), 0).toLocaleString()}</td>
                        <td colSpan="3"></td>
                      </tr>
                    )}
                  </tbody>
                </table></div>
              )}

              {/* CONTENT CREATION */}
              {activeReport === 'content' && (
                <div className="mobile-table-container"><table style={styles.table}>
                  <thead><tr style={styles.thead}>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Platform</th>
                    <th style={styles.th}>Content Type</th>
                    <th style={styles.th}>Assigned To</th>
                    <th style={styles.th}>Due Date</th>
                    <th style={styles.th}>Views</th>
                    <th style={styles.th}>Likes</th>
                    <th style={styles.th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {rows.length === 0 ? <tr><td colSpan="8" style={styles.empty}>No records found.</td></tr>
                    : rows.map(c => (
                      <tr key={c.id} style={styles.tr}>
                        <td style={styles.td}>{c.title}</td>
                        <td style={styles.td}>{c.platform}</td>
                        <td style={styles.td}>{c.content_type}</td>
                        <td style={styles.td}>{c.assigned_to || ''}</td>
                        <td style={styles.td}>{c.due_date ? new Date(c.due_date).toLocaleDateString() : ''}</td>
                        <td style={styles.td}>{Number(c.views).toLocaleString()}</td>
                        <td style={styles.td}>{Number(c.likes).toLocaleString()}</td>
                        <td style={styles.td}>{c.status}</td>
                      </tr>
                    ))}
                    {rows.length > 0 && (
                      <tr style={styles.totalRow}>
                        <td colSpan="5" style={{ ...styles.td, textAlign: 'right', fontWeight: '700' }}>Total Views:</td>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#c4607a' }}>{rows.reduce((s, c) => s + Number(c.views), 0).toLocaleString()}</td>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#c4607a' }}>{rows.reduce((s, c) => s + Number(c.likes), 0).toLocaleString()}</td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table></div>
              )}
            </>
          )}

          {/* Print Footer */}
          <div className="print-only" style={{ marginTop: '24px' }}>
            <hr />
            <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginTop: '8px' }}>
              Spartan BTY Inc. | Management Information System | Confidential
            </p>
          </div>
        </div>
      </div>

      {/* Print & PDF Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { background: white !important; margin: 0 !important; padding: 0 !important; }
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 30px 40px !important;
              background: white !important;
            }
          }
          @media screen {
            .print-only { display: none !important; }
          }
        `
      }} />
    </Layout>
  );
}

const styles = {
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#fff', padding: '20px 24px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative', minHeight: '80px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#302e2e', margin: '0 0 4px' },
  pageSubtitle: { fontSize: '14px', color: '#888', margin: 0 },
  btnGroup: { display: 'flex', gap: '10px', alignItems: 'center', position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)' },
  printBtn: { backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  pdfBtn: { backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  groupLabel: { fontSize: '11px', fontWeight: '700', color: '#888', letterSpacing: '1px', marginBottom: '8px', marginTop: '4px' },
  reportTabs: { display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' },
  tab: { padding: '9px 14px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', color: '#555' },
  tabActive: { padding: '9px 14px', borderRadius: '8px', border: '1px solid #c4607a', backgroundColor: '#c4607a', cursor: 'pointer', fontSize: '13px', color: '#fff', fontWeight: '600' },
  filterBox: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  quickFilters: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' },
  filterLabel: { fontSize: '13px', fontWeight: '600', color: '#555', margin: 0 },
  quickBtn: { padding: '7px 14px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', color: '#555' },
  quickBtnActive: { padding: '7px 14px', borderRadius: '20px', border: '1px solid #c4607a', backgroundColor: '#c4607a', cursor: 'pointer', fontSize: '13px', color: '#fff', fontWeight: '600' },
  dateRange: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '8px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  clearBtn: { padding: '10px 16px', backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  activeFilter: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#555', backgroundColor: '#fdf0f3', padding: '8px 14px', borderRadius: '8px', marginTop: '8px' },
  recordBadge: { backgroundColor: '#c4607a', color: '#fff', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  printHeader: { marginBottom: '16px' },
  printTitle: { fontSize: '22px', fontWeight: '700', margin: '0 0 4px', color: '#302e2e' },
  printSub: { fontSize: '14px', color: '#666', margin: '0 0 8px' },
  printReport: { fontSize: '18px', fontWeight: '600', margin: '0 0 4px', color: '#302e2e' },
  printDate: { fontSize: '12px', color: '#888', margin: 0 },
  reportBox: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  reportHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  reportTitle: { fontSize: '18px', fontWeight: '600', color: '#302e2e', margin: 0 },
  recordCount: { fontSize: '13px', color: '#888', backgroundColor: '#f8f9fa', padding: '4px 12px', borderRadius: '20px', margin: 0 },
  loading: { padding: '40px', textAlign: 'center', color: '#aaa' },
  empty: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '2px solid #eee' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  totalRow: { backgroundColor: '#fdf0f3', borderTop: '2px solid #eee' },
};

export default Reports;

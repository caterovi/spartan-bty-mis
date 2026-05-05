import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingCart,
  Package,
  UsersRound,
  Truck,
  MessageSquareText,
  Megaphone,
  Tag,
  Radio,
  PenLine,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCcw,
  CalendarDays,
  ClipboardList,
  CircleDollarSign,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  BarChart3,
  Eye,
  Heart,
  Star,
  Building2,
} from 'lucide-react';

function Reports() {
  const { user } = useAuth();
  const [salespersonFilter, setSalespersonFilter] = useState('all');
  const [salespersons, setSalespersons] = useState([]);
  const [activeReport, setActiveReport] = useState('sales');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterMode, setFilterMode] = useState('custom');

  const reportId = `REP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

  const reportTypes = [
    { key: 'sales', label: 'Sales', icon: ShoppingCart },
    { key: 'inventory', label: 'Inventory', icon: Package },
    { key: 'hr', label: 'Employees', icon: UsersRound },
    { key: 'logistics', label: 'Logistics', icon: Truck },
    { key: 'crm', label: 'CRM Feedback', icon: MessageSquareText },
    { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { key: 'promotions', label: 'Promotions', icon: Tag },
    { key: 'liveselling', label: 'Live Selling', icon: Radio },
    { key: 'content', label: 'Content Creation', icon: PenLine },
  ];

  useEffect(() => {
    loadReport(activeReport);
  }, [activeReport]);

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
        } catch (e) {
          console.error(e);
        }
      }

      if (type === 'inventory') res = await api.get('/inventory/items');
      if (type === 'hr') res = await api.get('/hr/employees');
      if (type === 'logistics') res = await api.get('/logistics/shipments');
      if (type === 'crm') res = await api.get('/crm/feedback');
      if (type === 'campaigns') res = await api.get('/marketing/campaigns');
      if (type === 'promotions') res = await api.get('/marketing/promotions');
      if (type === 'liveselling') res = await api.get('/marketing/live-selling');
      if (type === 'content') res = await api.get('/marketing/content');

      setData(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const applyQuickFilter = (mode) => {
    setFilterMode(mode);
    const today = new Date();

    if (mode === 'daily') {
      const d = today.toISOString().split('T')[0];
      setDateFrom(d);
      setDateTo(d);
    } else if (mode === 'monthly') {
      setDateFrom(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
      setDateTo(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (mode === 'yearly') {
      setDateFrom(new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]);
      setDateTo(new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0]);
    } else {
      setDateFrom('');
      setDateTo('');
    }
  };

  const getDateValue = (item) => {
    return item.created_at || item.order_date || item.start_date || item.scheduled_date || item.due_date || item.estimated_delivery;
  };

  const normalizeStatus = (status = '') => String(status || '').trim().toLowerCase();

  const formatCurrency = (value) => `₱${Number(value || 0).toLocaleString()}`;
  const formatNumber = (value) => Number(value || 0).toLocaleString();

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const rows = useMemo(() => {
    if (!data) return [];

    let result = [...data];

    if (dateFrom || dateTo) {
      result = result.filter((item) => {
        const rawDate = getDateValue(item);
        if (!rawDate) return false;

        const date = new Date(rawDate);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;

        if (from && date < from) return false;
        if (to && date > to) return false;

        return true;
      });
    }

    if (activeReport === 'sales' && salespersonFilter !== 'all') {
      result = result.filter((o) => o.salesperson === salespersonFilter);
    }

    return result;
  }, [data, dateFrom, dateTo, activeReport, salespersonFilter]);

  const statusBadge = (status) => {
    const s = normalizeStatus(status);
    let type = 'neutral';

    if (['forwarded', 'active', 'available', 'completed', 'delivered', 'published', 'approved', 'in-stock', 'resolved'].includes(s)) {
      type = 'success';
    } else if (['cancelled', 'canceled', 'inactive', 'rejected', 'out-of-stock', 'failed'].includes(s)) {
      type = 'danger';
    } else if (['pending', 'processing', 'low-stock', 'draft', 'scheduled', 'packing'].includes(s)) {
      type = 'warning';
    }

    return (
      <span className={`reports-status reports-status-${type}`}>
        <span className="reports-status-dot" />
        {status || 'N/A'}
      </span>
    );
  };

  const currentReport = reportTypes.find((r) => r.key === activeReport);
  const CurrentIcon = currentReport?.icon || ClipboardList;

  const columns = useMemo(() => {
    const map = {
      sales: [
        ['Order Code', (o) => <strong>{o.order_code}</strong>, (o) => o.order_code],
        ['Customer', (o) => o.customer_name, (o) => o.customer_name],
        ['Salesperson', (o) => o.salesperson || '', (o) => o.salesperson || ''],
        ['Phone', (o) => o.customer_phone || '', (o) => o.customer_phone || ''],
        ['Date', (o) => formatDate(o.order_date), (o) => formatDate(o.order_date)],
        ['Total', (o) => <strong>{formatCurrency(o.total_amount)}</strong>, (o) => o.total_amount],
        ['Status', (o) => statusBadge(o.status), (o) => o.status],
      ],
      inventory: [
        ['Code', (i) => <strong>{i.item_code}</strong>, (i) => i.item_code],
        ['Name', (i) => i.name, (i) => i.name],
        ['Category', (i) => i.category || '', (i) => i.category || ''],
        ['Quantity', (i) => `${formatNumber(i.quantity)} ${i.unit || ''}`, (i) => i.quantity],
        ['Status', (i) => statusBadge(i.status), (i) => i.status],
      ],
      hr: [
        ['Employee ID', (e) => <strong>{e.employee_id}</strong>, (e) => e.employee_id],
        ['Name', (e) => e.full_name, (e) => e.full_name],
        ['Department', (e) => e.department, (e) => e.department],
        ['Position', (e) => e.position, (e) => e.position],
        ['Type', (e) => e.employment_type, (e) => e.employment_type],
        ['Salary', (e) => <strong>{formatCurrency(e.salary)}</strong>, (e) => e.salary],
        ['Status', (e) => statusBadge(e.status), (e) => e.status],
      ],
      logistics: [
        ['Shipment Code', (s) => <strong>{s.shipment_code}</strong>, (s) => s.shipment_code],
        ['Order Code', (s) => s.order_code || '', (s) => s.order_code || ''],
        ['Customer', (s) => s.customer_name, (s) => s.customer_name],
        ['Courier', (s) => s.courier || '', (s) => s.courier || ''],
        ['Packing', (s) => statusBadge(s.packing_status), (s) => s.packing_status],
        ['Shipping', (s) => statusBadge(s.shipping_status), (s) => s.shipping_status],
        ['Est. Delivery', (s) => formatDate(s.estimated_delivery), (s) => formatDate(s.estimated_delivery)],
      ],
      crm: [
        ['Customer', (f) => f.customer_name, (f) => f.customer_name],
        ['Type', (f) => f.type, (f) => f.type],
        ['Subject', (f) => f.subject, (f) => f.subject],
        ['Rating', (f) => <strong>{f.rating || 0}</strong>, (f) => f.rating || 0],
        ['Status', (f) => statusBadge(f.status), (f) => f.status],
        ['Date', (f) => formatDate(f.created_at), (f) => formatDate(f.created_at)],
      ],
      campaigns: [
        ['Title', (c) => <strong>{c.title}</strong>, (c) => c.title],
        ['Platform', (c) => c.platform, (c) => c.platform],
        ['Start Date', (c) => formatDate(c.start_date), (c) => formatDate(c.start_date)],
        ['End Date', (c) => formatDate(c.end_date), (c) => formatDate(c.end_date)],
        ['Status', (c) => statusBadge(c.status), (c) => c.status],
      ],
      promotions: [
        ['Promo Code', (p) => <strong>{p.promo_code}</strong>, (p) => p.promo_code],
        ['Description', (p) => p.description || '', (p) => p.description || ''],
        ['Discount Type', (p) => p.discount_type, (p) => p.discount_type],
        ['Discount Value', (p) => <strong>{p.discount_type === 'percentage' ? `${p.discount_value}%` : formatCurrency(p.discount_value)}</strong>, (p) => p.discount_value],
        ['Min. Order', (p) => formatCurrency(p.min_order), (p) => p.min_order],
        ['Start Date', (p) => formatDate(p.start_date), (p) => formatDate(p.start_date)],
        ['End Date', (p) => formatDate(p.end_date), (p) => formatDate(p.end_date)],
        ['Status', (p) => statusBadge(p.status), (p) => p.status],
      ],
      liveselling: [
        ['Title', (l) => <strong>{l.title}</strong>, (l) => l.title],
        ['Platform', (l) => l.platform, (l) => l.platform],
        ['Scheduled', (l) => l.scheduled_date ? new Date(l.scheduled_date).toLocaleString() : '', (l) => l.scheduled_date || ''],
        ['Host', (l) => l.host || '', (l) => l.host || ''],
        ['Target Sales', (l) => formatCurrency(l.target_sales), (l) => l.target_sales],
        ['Actual Sales', (l) => <strong>{formatCurrency(l.actual_sales)}</strong>, (l) => l.actual_sales],
        ['Viewers', (l) => formatNumber(l.viewers), (l) => l.viewers],
        ['Status', (l) => statusBadge(l.status), (l) => l.status],
      ],
      content: [
        ['Title', (c) => <strong>{c.title}</strong>, (c) => c.title],
        ['Platform', (c) => c.platform, (c) => c.platform],
        ['Content Type', (c) => c.content_type, (c) => c.content_type],
        ['Assigned To', (c) => c.assigned_to || '', (c) => c.assigned_to || ''],
        ['Due Date', (c) => formatDate(c.due_date), (c) => formatDate(c.due_date)],
        ['Views', (c) => <strong>{formatNumber(c.views)}</strong>, (c) => c.views],
        ['Likes', (c) => <strong>{formatNumber(c.likes)}</strong>, (c) => c.likes],
        ['Status', (c) => statusBadge(c.status), (c) => c.status],
      ],
    };

    return map[activeReport] || [];
  }, [activeReport, rows]);

  const summary = useMemo(() => {
    if (activeReport === 'sales') {
      const totalRevenue = rows.reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const forwarded = rows.filter((o) => normalizeStatus(o.status) === 'forwarded').length;
      const cancelled = rows.filter((o) => ['cancelled', 'canceled'].includes(normalizeStatus(o.status))).length;

      return [
        { label: 'Total Orders', value: rows.length, sub: 'All orders in range', icon: ClipboardList },
        { label: 'Total Revenue', value: formatCurrency(totalRevenue), sub: 'All orders in range', icon: CircleDollarSign },
        { label: 'Forwarded Orders', value: forwarded, sub: `${rows.length ? Math.round((forwarded / rows.length) * 100) : 0}% of total`, icon: CheckCircle2 },
        { label: 'Cancelled Orders', value: cancelled, sub: `${rows.length ? Math.round((cancelled / rows.length) * 100) : 0}% of total`, icon: AlertTriangle },
      ];
    }

    if (activeReport === 'inventory') {
      const totalQty = rows.reduce((s, i) => s + Number(i.quantity || 0), 0);
      const lowStock = rows.filter((i) => normalizeStatus(i.status) === 'low-stock').length;
      const totalValue = rows.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);

      return [
        { label: 'Total Items', value: rows.length, sub: 'Inventory records', icon: Package },
        { label: 'Total Quantity', value: formatNumber(totalQty), sub: 'Available quantity', icon: BarChart3 },
        { label: 'Low Stock', value: lowStock, sub: 'Needs monitoring', icon: AlertTriangle },
        { label: 'Total Value', value: formatCurrency(totalValue), sub: 'Estimated inventory value', icon: CircleDollarSign },
      ];
    }

    if (activeReport === 'hr') {
      const active = rows.filter((e) => normalizeStatus(e.status) === 'active').length;
      const payroll = rows.reduce((s, e) => s + Number(e.salary || 0), 0);

      return [
        { label: 'Employees', value: rows.length, sub: 'Total employees', icon: UsersRound },
        { label: 'Active Staff', value: active, sub: 'Currently active', icon: CheckCircle2 },
        { label: 'Departments', value: new Set(rows.map((e) => e.department).filter(Boolean)).size, sub: 'Department count', icon: Building2 },
        { label: 'Total Payroll', value: formatCurrency(payroll), sub: 'Salary total', icon: CircleDollarSign },
      ];
    }

    if (activeReport === 'crm') {
      const avgRating = rows.length ? (rows.reduce((s, f) => s + Number(f.rating || 0), 0) / rows.length).toFixed(1) : '0.0';

      return [
        { label: 'Feedback', value: rows.length, sub: 'Total responses', icon: MessageSquareText },
        { label: 'Average Rating', value: avgRating, sub: 'Customer score', icon: Star },
        { label: 'Resolved', value: rows.filter((f) => normalizeStatus(f.status) === 'resolved').length, sub: 'Closed feedback', icon: CheckCircle2 },
        { label: 'Pending', value: rows.filter((f) => normalizeStatus(f.status) === 'pending').length, sub: 'Needs action', icon: Clock3 },
      ];
    }

    if (activeReport === 'liveselling') {
      const actualSales = rows.reduce((s, l) => s + Number(l.actual_sales || 0), 0);
      const viewers = rows.reduce((s, l) => s + Number(l.viewers || 0), 0);

      return [
        { label: 'Sessions', value: rows.length, sub: 'Live selling records', icon: Radio },
        { label: 'Actual Sales', value: formatCurrency(actualSales), sub: 'Total actual sales', icon: CircleDollarSign },
        { label: 'Viewers', value: formatNumber(viewers), sub: 'Total viewers', icon: Eye },
        { label: 'Completed', value: rows.filter((l) => normalizeStatus(l.status) === 'completed').length, sub: 'Completed sessions', icon: CheckCircle2 },
      ];
    }

    if (activeReport === 'content') {
      const views = rows.reduce((s, c) => s + Number(c.views || 0), 0);
      const likes = rows.reduce((s, c) => s + Number(c.likes || 0), 0);

      return [
        { label: 'Content', value: rows.length, sub: 'Total content records', icon: PenLine },
        { label: 'Views', value: formatNumber(views), sub: 'Total views', icon: Eye },
        { label: 'Likes', value: formatNumber(likes), sub: 'Total likes', icon: Heart },
        { label: 'Platforms', value: new Set(rows.map((c) => c.platform).filter(Boolean)).size, sub: 'Active platforms', icon: BarChart3 },
      ];
    }

    return [
      { label: 'Records', value: rows.length, sub: 'Total records', icon: FileText },
      { label: 'Active', value: rows.filter((x) => normalizeStatus(x.status) === 'active').length, sub: 'Active records', icon: CheckCircle2 },
      { label: 'Pending', value: rows.filter((x) => normalizeStatus(x.status) === 'pending').length, sub: 'Pending records', icon: Clock3 },
      { label: 'Categories', value: new Set(rows.map((x) => x.platform || x.category || x.type).filter(Boolean)).size, sub: 'Unique groups', icon: BarChart3 },
    ];
  }, [rows, activeReport]);

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSalespersonFilter('all');
    setFilterMode('custom');
  };

  const getExportData = () => {
    const headers = columns.map(([header]) => header);
    const worksheetData = rows.map((row) => columns.map((col) => col[2](row)));
    return { headers, worksheetData };
  };

  const handleExportExcel = () => {
    const reportLabel = currentReport?.label || 'Report';
    const fileName = `SpartanBTY_${reportLabel.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-CA')}.xlsx`;
    const { headers, worksheetData } = getExportData();

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...worksheetData]);
    XLSX.utils.book_append_sheet(wb, ws, reportLabel);
    XLSX.writeFile(wb, fileName);
  };

  const handleExportCSV = () => {
    const reportLabel = currentReport?.label || 'Report';
    const fileName = `SpartanBTY_${reportLabel.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-CA')}.csv`;
    const { headers, worksheetData } = getExportData();

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...worksheetData]);
    XLSX.utils.book_append_sheet(wb, ws, reportLabel);
    XLSX.writeFile(wb, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const reportLabel = currentReport?.label || 'Report';
    const fileName = `SpartanBTY_${reportLabel.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-CA')}.pdf`;

    const printOnlyEls = document.querySelectorAll('.print-only');
    const noPrintEls = document.querySelectorAll('.no-print');
    const tableContainers = document.querySelectorAll('.reports-table-wrap');
    const tables = document.querySelectorAll('.reports-table-wrap table');
    const tableCells = document.querySelectorAll('.reports-table-wrap th, .reports-table-wrap td');

    const printOnlyDisplayValues = Array.from(printOnlyEls).map((el) => el.style.display);
    const noPrintDisplayValues = Array.from(noPrintEls).map((el) => el.style.display);

    printOnlyEls.forEach((el) => el.style.setProperty('display', 'block', 'important'));
    noPrintEls.forEach((el) => el.style.setProperty('display', 'none', 'important'));
    tableContainers.forEach((el) => el.style.setProperty('overflow-x', 'visible', 'important'));
    tables.forEach((el) => {
      el.style.setProperty('min-width', 'auto', 'important');
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('font-size', '10px', 'important');
    });
    tableCells.forEach((el) => {
      el.style.setProperty('padding', '6px 8px', 'important');
      el.style.setProperty('font-size', '10px', 'important');
    });

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
      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fileName);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      element.setAttribute('style', originalStyle);
      printOnlyEls.forEach((el, i) => {
        el.style.removeProperty('display');
        if (printOnlyDisplayValues[i]) el.style.display = printOnlyDisplayValues[i];
      });
      noPrintEls.forEach((el, i) => {
        el.style.removeProperty('display');
        if (noPrintDisplayValues[i]) el.style.display = noPrintDisplayValues[i];
      });
      tableContainers.forEach((el) => el.style.removeProperty('overflow-x'));
      tables.forEach((el) => {
        el.style.removeProperty('min-width');
        el.style.removeProperty('width');
        el.style.removeProperty('font-size');
      });
      tableCells.forEach((el) => {
        el.style.removeProperty('padding');
        el.style.removeProperty('font-size');
      });
    }
  };

  return (
    <Layout>
      <style>{`
        .reports-page {
          --reports-brand: #c4607a;
          --reports-brand-dark: #a94d65;
          --reports-brand-light: #fdf0f3;
          --reports-surface: #ffffff;
          --reports-overlay: #f8fafc;
          --reports-text: #1f2937;
          --reports-muted: #64748b;
          --reports-border: #d1d5db;
          --reports-border-soft: #e5e7eb;
          --reports-success: #15803d;
          --reports-success-bg: #ecfdf5;
          --reports-danger: #be123c;
          --reports-danger-bg: #fff1f2;
          --reports-warning: #c2410c;
          --reports-warning-bg: #fff7ed;
          --reports-neutral-bg: #f8fafc;
          --reports-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          --reports-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
          --reports-radius-sm: 6px;
          --reports-radius-md: 10px;
          --reports-radius-lg: 14px;
          --reports-radius-xl: 18px;
          --reports-radius-full: 9999px;
          --reports-transition: 180ms ease;

          width: 100%;
          color: var(--reports-text);
          animation: reportsFadeIn 220ms ease;
        }

        @keyframes reportsFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .reports-card {
          background: var(--reports-surface);
          border: 1px solid var(--reports-border);
          border-radius: var(--reports-radius-xl);
          box-shadow: var(--reports-shadow-sm);
        }

        .reports-card,
        .reports-btn,
        .reports-tab,
        .reports-input,
        .reports-select {
          transition:
            color var(--reports-transition),
            background-color var(--reports-transition),
            border-color var(--reports-transition),
            box-shadow var(--reports-transition),
            transform var(--reports-transition);
        }

        .reports-card:hover {
          box-shadow: var(--reports-shadow-md);
          transform: translateY(-2px);
        }

        .reports-header {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          margin-bottom: 18px;
        }

        .reports-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .reports-header-icon,
        .reports-summary-icon {
          background: var(--reports-brand-light);
          border: 1px solid #e6aabd;
          color: var(--reports-brand);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .reports-header-icon {
          width: 52px;
          height: 52px;
          border-radius: var(--reports-radius-lg);
        }

        .reports-title {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          line-height: 1.15;
        }

        .reports-subtitle {
          margin: 6px 0 0;
          font-size: 14px;
          color: var(--reports-muted);
        }

        .reports-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .reports-btn {
          border: 1px solid var(--reports-border);
          border-radius: var(--reports-radius-sm);
          background: var(--reports-surface);
          color: var(--reports-text);
          padding: 11px 14px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .reports-btn:hover {
          transform: scale(1.01);
          box-shadow: var(--reports-shadow-sm);
          border-color: var(--reports-brand);
          color: var(--reports-brand);
        }

        .reports-btn-primary {
          background: var(--reports-brand);
          border-color: var(--reports-brand);
          color: #ffffff;
        }

        .reports-btn-primary:hover {
          background: var(--reports-brand-dark);
          color: #ffffff;
        }

        .reports-tabs {
          padding: 12px;
          margin-bottom: 18px;
        }

        .reports-tabs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
        }

        .reports-tab {
          min-height: 82px;
          border: 1px solid var(--reports-border);
          border-radius: var(--reports-radius-lg);
          background: var(--reports-surface);
          color: var(--reports-text);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
        }

        .reports-tab:hover {
          transform: translateY(-2px);
          box-shadow: var(--reports-shadow-sm);
          border-color: var(--reports-brand);
        }

        .reports-tab-active {
          background: var(--reports-brand-light);
          border-color: #e6aabd;
          color: var(--reports-brand);
        }

        .reports-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .reports-summary {
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .reports-summary-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--reports-radius-md);
        }

        .reports-summary-label {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--reports-muted);
        }

        .reports-summary-value {
          margin: 2px 0;
          font-size: 24px;
          line-height: 1;
          font-weight: 900;
          color: var(--reports-text);
        }

        .reports-summary-sub {
          margin: 0;
          font-size: 12px;
          color: var(--reports-muted);
        }

        .reports-filters {
          padding: 18px;
          margin-bottom: 18px;
          display: flex;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }

        .reports-filter-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .reports-filter-title {
          margin: 0;
          font-size: 13px;
          font-weight: 800;
          color: var(--reports-text);
        }

        .reports-quick {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .reports-input,
        .reports-select {
          padding: 11px 12px;
          border-radius: var(--reports-radius-sm);
          border: 1px solid var(--reports-border);
          background: var(--reports-surface);
          color: var(--reports-text);
          outline: none;
          font-size: 14px;
        }

        .reports-input:focus,
        .reports-select:focus {
          border-color: var(--reports-brand);
          box-shadow: 0 0 0 3px rgba(196, 96, 122, 0.16);
        }

        .reports-date-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .reports-dash {
          color: var(--reports-muted);
          font-weight: 800;
        }

        .reports-table-card {
          padding: 22px;
        }

        .reports-report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 16px;
        }

        .reports-report-title {
          margin: 0;
          font-size: 19px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .reports-report-desc {
          margin: 5px 0 0;
          font-size: 13px;
          color: var(--reports-muted);
        }

        .reports-count {
          margin: 0;
          padding: 6px 12px;
          border-radius: var(--reports-radius-full);
          background: var(--reports-overlay);
          border: 1px solid var(--reports-border);
          color: var(--reports-muted);
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        .reports-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .reports-table-wrap::-webkit-scrollbar {
          height: 8px;
        }

        .reports-table-wrap::-webkit-scrollbar-thumb {
          background: #d8a4b4;
          border-radius: var(--reports-radius-full);
        }

        .reports-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .reports-table thead {
          background: var(--reports-overlay);
          border-bottom: 1px solid var(--reports-border);
        }

        .reports-table th,
        .reports-table td {
          padding: 13px 16px;
          font-size: 14px;
          text-align: left;
          border-bottom: 1px solid var(--reports-border-soft);
          white-space: nowrap;
          vertical-align: middle;
        }

        .reports-table th {
          color: var(--reports-muted);
          font-size: 13px;
          font-weight: 900;
        }

        .reports-empty,
        .reports-loading {
          padding: 44px !important;
          text-align: center !important;
          color: var(--reports-muted) !important;
          font-weight: 700;
        }

        .reports-total-row {
          background: var(--reports-brand-light);
        }

        .reports-total-label {
          text-align: right !important;
          font-weight: 900;
        }

        .reports-total-value {
          color: var(--reports-brand);
          font-weight: 900;
        }

        .reports-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 10px;
          border-radius: var(--reports-radius-full);
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
          white-space: nowrap;
          border: 1px solid var(--reports-border);
        }

        .reports-status-dot {
          width: 7px;
          height: 7px;
          border-radius: var(--reports-radius-full);
        }

        .reports-status-success {
          background: var(--reports-success-bg);
          border-color: #86efac;
          color: var(--reports-success);
        }

        .reports-status-success .reports-status-dot {
          background: var(--reports-success);
        }

        .reports-status-danger {
          background: var(--reports-danger-bg);
          border-color: #fda4af;
          color: var(--reports-danger);
        }

        .reports-status-danger .reports-status-dot {
          background: var(--reports-danger);
        }

        .reports-status-warning {
          background: var(--reports-warning-bg);
          border-color: #fdba74;
          color: var(--reports-warning);
        }

        .reports-status-warning .reports-status-dot {
          background: var(--reports-warning);
        }

        .reports-status-neutral {
          background: var(--reports-neutral-bg);
          border-color: var(--reports-border);
          color: var(--reports-muted);
        }

        .reports-status-neutral .reports-status-dot {
          background: var(--reports-muted);
        }

        .print-only {
          display: none !important;
        }

        .reports-print-header {
          margin-bottom: 16px;
        }

        .reports-print-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .reports-print-title {
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 4px;
          color: #1f2937;
        }

        .reports-print-sub,
        .reports-print-date,
        .reports-print-generated,
        .reports-print-meta-label,
        .reports-print-footer-text {
          color: #64748b;
        }

        .reports-print-sub {
          font-size: 14px;
          margin: 0;
          font-weight: 600;
        }

        .reports-print-meta {
          text-align: right;
          min-width: 200px;
        }

        .reports-print-meta-label {
          font-size: 11px;
          margin: 0 0 2px;
          font-weight: 700;
        }

        .reports-print-meta-value {
          font-size: 13px;
          color: #1f2937;
          margin: 0 0 8px;
          font-weight: 800;
        }

        .reports-print-report {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 4px;
          color: #1f2937;
        }

        .reports-print-date,
        .reports-print-generated {
          font-size: 12px;
          margin: 0 0 10px;
          font-weight: 600;
        }

        .reports-print-divider {
          border: none;
          border-top: 2px solid #c4607a;
          margin: 16px 0;
        }

        .reports-print-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
        }

        .reports-print-footer-text {
          font-size: 11px;
          margin: 0;
          font-weight: 600;
        }

        @media print {
          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            visibility: hidden;
          }

          #print-area,
          #print-area * {
            visibility: visible;
          }

          #print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 30px 40px !important;
            background: white !important;
          }

          .reports-table-wrap {
            overflow-x: visible !important;
          }

          .reports-table {
            min-width: auto !important;
            width: 100% !important;
            font-size: 10px !important;
          }

          .reports-table th,
          .reports-table td {
            padding: 6px 8px !important;
            font-size: 10px !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }

        @media (max-width: 1024px) {
          .reports-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .reports-actions {
            width: 100%;
          }

          .reports-btn {
            flex: 1;
          }
        }

        @media (max-width: 768px) {
          .reports-header,
          .reports-table-card,
          .reports-filters {
            padding: 18px;
          }

          .reports-title {
            font-size: 24px;
          }

          .reports-summary-grid {
            grid-template-columns: 1fr;
          }

          .reports-actions,
          .reports-date-row {
            flex-direction: column;
            align-items: stretch;
          }

          .reports-btn,
          .reports-input,
          .reports-select {
            width: 100%;
          }

          .reports-table {
            min-width: 820px;
          }

          .reports-report-header {
            flex-direction: column;
          }
        }
      `}</style>

      <div id="print-area" className="reports-page">
        <section className="reports-card reports-header no-print">
          <div className="reports-header-left">
            <div className="reports-header-icon">
              <CurrentIcon size={25} />
            </div>
            <div>
              <h1 className="reports-title">Reports</h1>
              <p className="reports-subtitle">Generate, filter, print, and export operational records.</p>
            </div>
          </div>

          <div className="reports-actions">
            <button className="reports-btn" onClick={handlePrint}><Printer size={16} />Print</button>
            <button className="reports-btn reports-btn-primary" onClick={handleExportPDF}><Download size={16} />PDF</button>
            <button className="reports-btn" onClick={handleExportExcel}><FileSpreadsheet size={16} />Excel</button>
            <button className="reports-btn" onClick={handleExportCSV}><FileText size={16} />CSV</button>
          </div>
        </section>

        <section className="reports-card reports-tabs no-print">
          <div className="reports-tabs-grid">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.key}
                  onClick={() => setActiveReport(report.key)}
                  className={`reports-tab ${activeReport === report.key ? 'reports-tab-active' : ''}`}
                >
                  <Icon size={22} />
                  {report.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="reports-summary-grid no-print">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="reports-card reports-summary">
                <div className="reports-summary-icon">
                  <Icon size={21} />
                </div>
                <div>
                  <p className="reports-summary-label">{item.label}</p>
                  <h2 className="reports-summary-value">{item.value}</h2>
                  <p className="reports-summary-sub">{item.sub}</p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="reports-card reports-filters no-print">
          <div className="reports-filter-block">
            <p className="reports-filter-title">Quick Filters</p>
            <div className="reports-quick">
              {[
                { key: 'daily', label: 'Today' },
                { key: 'monthly', label: 'This Month' },
                { key: 'yearly', label: 'This Year' },
                { key: 'custom', label: 'Custom' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => applyQuickFilter(filter.key)}
                  className={`reports-btn ${filterMode === filter.key ? 'reports-btn-primary' : ''}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {activeReport === 'sales' && salespersons.length > 0 && (
            <div className="reports-filter-block">
              <p className="reports-filter-title">Salesperson</p>
              <select
                value={salespersonFilter}
                onChange={(e) => setSalespersonFilter(e.target.value)}
                className="reports-select"
              >
                <option value="all">All Salespersons</option>
                {salespersons.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="reports-filter-block">
            <p className="reports-filter-title">Date Range</p>
            <div className="reports-date-row">
              <CalendarDays size={17} color="#64748b" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="reports-input" />
              <span className="reports-dash">-</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="reports-input" />
            </div>
          </div>

          <button onClick={clearFilters} className="reports-btn">
            <RefreshCcw size={16} />
            Clear Filters
          </button>
        </section>

        <section className="reports-print-header print-only">
          <div className="reports-print-top">
            <div>
              <h2 className="reports-print-title">Spartan BTY Inc.</h2>
              <p className="reports-print-sub">Management Information System</p>
            </div>
            <div className="reports-print-meta">
              <p className="reports-print-meta-label">Report ID:</p>
              <p className="reports-print-meta-value">{reportId}</p>
              <p className="reports-print-meta-label">Prepared by:</p>
              <p className="reports-print-meta-value">{user?.full_name || user?.username || 'Admin User'}</p>
            </div>
          </div>

          <h3 className="reports-print-report">{currentReport?.label} Report</h3>
          <p className="reports-print-date">
            {dateFrom && dateTo
              ? `Date Range: ${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`
              : 'All Records'}
            {activeReport === 'sales' && salespersonFilter !== 'all' ? ` | Salesperson: ${salespersonFilter}` : ''}
          </p>
          <p className="reports-print-generated">Generated: {new Date().toLocaleString()}</p>
          <hr className="reports-print-divider" />
        </section>

        <section className="reports-card reports-table-card">
          {!loading && (
            <div className="reports-report-header no-print">
              <div>
                <h2 className="reports-report-title">
                  <CurrentIcon size={20} />
                  {currentReport?.label} Report
                </h2>
                <p className="reports-report-desc">Showing filtered records from the selected module.</p>
              </div>
              <p className="reports-count">{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
            </div>
          )}

          {loading ? (
            <div className="reports-loading">Loading report...</div>
          ) : (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    {columns.map(([header]) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="reports-empty">No records found.</td>
                    </tr>
                  ) : (
                    rows.map((row, rowIndex) => (
                      <tr key={row.id || rowIndex}>
                        {columns.map(([header, render]) => (
                          <td key={header}>{render(row)}</td>
                        ))}
                      </tr>
                    ))
                  )}

                  {activeReport === 'sales' && rows.length > 0 && (
                    <tr className="reports-total-row">
                      <td colSpan={5} className="reports-total-label">Total Revenue</td>
                      <td className="reports-total-value">{formatCurrency(rows.reduce((s, o) => s + Number(o.total_amount || 0), 0))}</td>
                      <td />
                    </tr>
                  )}

                  {activeReport === 'hr' && rows.length > 0 && (
                    <tr className="reports-total-row">
                      <td colSpan={5} className="reports-total-label">Total Payroll</td>
                      <td className="reports-total-value">{formatCurrency(rows.reduce((s, e) => s + Number(e.salary || 0), 0))}</td>
                      <td />
                    </tr>
                  )}

                  {activeReport === 'liveselling' && rows.length > 0 && (
                    <tr className="reports-total-row">
                      <td colSpan={5} className="reports-total-label">Total Actual Sales</td>
                      <td className="reports-total-value">{formatCurrency(rows.reduce((s, l) => s + Number(l.actual_sales || 0), 0))}</td>
                      <td colSpan={2} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="print-only" style={{ marginTop: '24px' }}>
            <hr className="reports-print-divider" />
            <div className="reports-print-footer">
              <p className="reports-print-footer-text">Spartan BTY Inc. | Management Information System | Confidential</p>
              <p className="reports-print-footer-text">Page 1</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Reports;
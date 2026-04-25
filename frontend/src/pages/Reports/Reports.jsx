import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { FaShoppingCart, FaBox, FaUsers, FaTruck, FaComments, FaBullhorn, FaTag, FaBroadcastTower, FaEdit, FaShoppingBag, FaDollarSign, FaArrowRight, FaTimes, FaChartBar, FaExclamationTriangle, FaCheck, FaBuilding, FaStar, FaClock, FaEye, FaHeart, FaMobileAlt, FaFileAlt, FaSync, FaPrint, FaDownload, FaFileExcel, FaFileCsv } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

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
    { key: 'sales', label: 'Sales', group: 'General', icon: FaShoppingCart },
    { key: 'inventory', label: 'Inventory', group: 'General', icon: FaBox },
    { key: 'hr', label: 'Employees', group: 'General', icon: FaUsers },
    { key: 'logistics', label: 'Logistics', group: 'General', icon: FaTruck },
    { key: 'crm', label: 'CRM Feedback', group: 'General', icon: FaComments },
    { key: 'campaigns', label: 'Campaigns', group: 'Marketing', icon: FaBullhorn },
    { key: 'promotions', label: 'Promotions', group: 'Marketing', icon: FaTag },
    { key: 'liveselling', label: 'Live Selling', group: 'Marketing', icon: FaBroadcastTower },
    { key: 'content', label: 'Content Creation', group: 'Marketing', icon: FaEdit },
  ];

  useEffect(() => {
    loadReport(activeReport);

    // Scroll animation observer
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('mod-visible');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.mod-animate');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
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
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      setDateFrom(firstDay);
      setDateTo(lastDay);
    } else if (mode === 'yearly') {
      const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
      setDateFrom(firstDay);
      setDateTo(lastDay);
    } else {
      setDateFrom('');
      setDateTo('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const reportLabel = reportTypes.find((r) => r.key === activeReport)?.label || 'Report';
    const fileName = `SpartanBTY_${reportLabel.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-CA')}.xlsx`;

    let worksheetData = [];
    let headers = [];

    if (activeReport === 'sales') {
      headers = ['Order Code', 'Customer', 'Salesperson', 'Phone', 'Date', 'Total', 'Status'];
      worksheetData = rows.map((o) => [
        o.order_code,
        o.customer_name,
        o.salesperson || '',
        o.customer_phone || '',
        formatDate(o.order_date),
        o.total_amount,
        o.status,
      ]);
    } else if (activeReport === 'inventory') {
      headers = ['Code', 'Name', 'Category', 'Quantity', 'Unit', 'Status'];
      worksheetData = rows.map((i) => [
        i.item_code,
        i.name,
        i.category || '',
        i.quantity,
        i.unit || '',
        i.status,
      ]);
    } else if (activeReport === 'hr') {
      headers = ['Employee ID', 'Name', 'Department', 'Position', 'Type', 'Salary', 'Status'];
      worksheetData = rows.map((e) => [
        e.employee_id,
        e.full_name,
        e.department,
        e.position,
        e.employment_type,
        e.salary,
        e.status,
      ]);
    } else if (activeReport === 'logistics') {
      headers = ['Shipment Code', 'Order Code', 'Customer', 'Courier', 'Packing Status', 'Shipping Status', 'Est. Delivery'];
      worksheetData = rows.map((s) => [
        s.shipment_code,
        s.order_code || '',
        s.customer_name,
        s.courier || '',
        s.packing_status,
        s.shipping_status,
        formatDate(s.estimated_delivery),
      ]);
    } else if (activeReport === 'crm') {
      headers = ['Customer', 'Type', 'Subject', 'Rating', 'Status', 'Date'];
      worksheetData = rows.map((f) => [
        f.customer_name,
        f.type,
        f.subject,
        f.rating || 0,
        f.status,
        formatDate(f.created_at),
      ]);
    } else if (activeReport === 'campaigns') {
      headers = ['Title', 'Platform', 'Start Date', 'End Date', 'Status'];
      worksheetData = rows.map((c) => [
        c.title,
        c.platform,
        formatDate(c.start_date),
        formatDate(c.end_date),
        c.status,
      ]);
    } else if (activeReport === 'promotions') {
      headers = ['Promo Code', 'Description', 'Discount Type', 'Discount Value', 'Min. Order', 'Start Date', 'End Date', 'Status'];
      worksheetData = rows.map((p) => [
        p.promo_code,
        p.description || '',
        p.discount_type,
        p.discount_type === 'percentage' ? `${p.discount_value}%` : p.discount_value,
        p.min_order,
        formatDate(p.start_date),
        formatDate(p.end_date),
        p.status,
      ]);
    } else if (activeReport === 'liveselling') {
      headers = ['Title', 'Platform', 'Scheduled', 'Host', 'Target Sales', 'Actual Sales', 'Viewers', 'Status'];
      worksheetData = rows.map((l) => [
        l.title,
        l.platform,
        l.scheduled_date ? new Date(l.scheduled_date).toLocaleString() : '',
        l.host || '',
        l.target_sales,
        l.actual_sales,
        l.viewers,
        l.status,
      ]);
    } else if (activeReport === 'content') {
      headers = ['Title', 'Platform', 'Content Type', 'Assigned To', 'Due Date', 'Views', 'Likes', 'Status'];
      worksheetData = rows.map((c) => [
        c.title,
        c.platform,
        c.content_type,
        c.assigned_to || '',
        formatDate(c.due_date),
        c.views,
        c.likes,
        c.status,
      ]);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...worksheetData]);
    XLSX.utils.book_append_sheet(wb, ws, reportLabel);
    XLSX.writeFile(wb, fileName);
  };

  const handleExportCSV = () => {
    const reportLabel = reportTypes.find((r) => r.key === activeReport)?.label || 'Report';
    const fileName = `SpartanBTY_${reportLabel.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-CA')}.csv`;

    let worksheetData = [];
    let headers = [];

    if (activeReport === 'sales') {
      headers = ['Order Code', 'Customer', 'Salesperson', 'Phone', 'Date', 'Total', 'Status'];
      worksheetData = rows.map((o) => [
        o.order_code,
        o.customer_name,
        o.salesperson || '',
        o.customer_phone || '',
        formatDate(o.order_date),
        o.total_amount,
        o.status,
      ]);
    } else if (activeReport === 'inventory') {
      headers = ['Code', 'Name', 'Category', 'Quantity', 'Unit', 'Status'];
      worksheetData = rows.map((i) => [
        i.item_code,
        i.name,
        i.category || '',
        i.quantity,
        i.unit || '',
        i.status,
      ]);
    } else if (activeReport === 'hr') {
      headers = ['Employee ID', 'Name', 'Department', 'Position', 'Type', 'Salary', 'Status'];
      worksheetData = rows.map((e) => [
        e.employee_id,
        e.full_name,
        e.department,
        e.position,
        e.employment_type,
        e.salary,
        e.status,
      ]);
    } else if (activeReport === 'logistics') {
      headers = ['Shipment Code', 'Order Code', 'Customer', 'Courier', 'Packing Status', 'Shipping Status', 'Est. Delivery'];
      worksheetData = rows.map((s) => [
        s.shipment_code,
        s.order_code || '',
        s.customer_name,
        s.courier || '',
        s.packing_status,
        s.shipping_status,
        formatDate(s.estimated_delivery),
      ]);
    } else if (activeReport === 'crm') {
      headers = ['Customer', 'Type', 'Subject', 'Rating', 'Status', 'Date'];
      worksheetData = rows.map((f) => [
        f.customer_name,
        f.type,
        f.subject,
        f.rating || 0,
        f.status,
        formatDate(f.created_at),
      ]);
    } else if (activeReport === 'campaigns') {
      headers = ['Title', 'Platform', 'Start Date', 'End Date', 'Status'];
      worksheetData = rows.map((c) => [
        c.title,
        c.platform,
        formatDate(c.start_date),
        formatDate(c.end_date),
        c.status,
      ]);
    } else if (activeReport === 'promotions') {
      headers = ['Promo Code', 'Description', 'Discount Type', 'Discount Value', 'Min. Order', 'Start Date', 'End Date', 'Status'];
      worksheetData = rows.map((p) => [
        p.promo_code,
        p.description || '',
        p.discount_type,
        p.discount_type === 'percentage' ? `${p.discount_value}%` : p.discount_value,
        p.min_order,
        formatDate(p.start_date),
        formatDate(p.end_date),
        p.status,
      ]);
    } else if (activeReport === 'liveselling') {
      headers = ['Title', 'Platform', 'Scheduled', 'Host', 'Target Sales', 'Actual Sales', 'Viewers', 'Status'];
      worksheetData = rows.map((l) => [
        l.title,
        l.platform,
        l.scheduled_date ? new Date(l.scheduled_date).toLocaleString() : '',
        l.host || '',
        l.target_sales,
        l.actual_sales,
        l.viewers,
        l.status,
      ]);
    } else if (activeReport === 'content') {
      headers = ['Title', 'Platform', 'Content Type', 'Assigned To', 'Due Date', 'Views', 'Likes', 'Status'];
      worksheetData = rows.map((c) => [
        c.title,
        c.platform,
        c.content_type,
        c.assigned_to || '',
        formatDate(c.due_date),
        c.views,
        c.likes,
        c.status,
      ]);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...worksheetData]);
    XLSX.utils.book_append_sheet(wb, ws, reportLabel);
    XLSX.writeFile(wb, fileName);
  };

  const handleExportPDF = async () => {
    const reportLabel = reportTypes.find((r) => r.key === activeReport)?.label || 'Report';
    const fileName = `SpartanBTY_${reportLabel.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-CA')}.pdf`;

    const printOnlyEls = document.querySelectorAll('.print-only');
    const noPrintEls = document.querySelectorAll('.no-print');
    const tableContainers = document.querySelectorAll('.mobile-table-container');
    const tables = document.querySelectorAll('.mobile-table-container table');
    const tableCells = document.querySelectorAll('.mobile-table-container th, .mobile-table-container td');

    // Save original display values
    const printOnlyDisplayValues = Array.from(printOnlyEls).map(el => el.style.display);
    const noPrintDisplayValues = Array.from(noPrintEls).map(el => el.style.display);
    const tableContainerOverflow = Array.from(tableContainers).map(el => el.style.overflowX);
    const tableMinWidth = Array.from(tables).map(el => el.style.minWidth);
    const tableWidth = Array.from(tables).map(el => el.style.width);
    const tableFontSize = Array.from(tables).map(el => el.style.fontSize);
    const cellPadding = Array.from(tableCells).map(el => el.style.padding);
    const cellFontSize = Array.from(tableCells).map(el => el.style.fontSize);

    printOnlyEls.forEach((el) => el.style.setProperty('display', 'block', 'important'));
    noPrintEls.forEach((el) => el.style.setProperty('display', 'none', 'important'));

    // Fix table layout for PDF
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
      // Restore original display values
      printOnlyEls.forEach((el, i) => {
        el.style.removeProperty('display');
        if (printOnlyDisplayValues[i]) {
          el.style.display = printOnlyDisplayValues[i];
        }
      });
      noPrintEls.forEach((el, i) => {
        el.style.removeProperty('display');
        if (noPrintDisplayValues[i]) {
          el.style.display = noPrintDisplayValues[i];
        }
      });
      // Restore table styles
      tableContainers.forEach((el, i) => {
        el.style.removeProperty('overflow-x');
        if (tableContainerOverflow[i]) {
          el.style.overflowX = tableContainerOverflow[i];
        }
      });
      tables.forEach((el, i) => {
        el.style.removeProperty('min-width');
        el.style.removeProperty('width');
        el.style.removeProperty('font-size');
        if (tableMinWidth[i]) el.style.minWidth = tableMinWidth[i];
        if (tableWidth[i]) el.style.width = tableWidth[i];
        if (tableFontSize[i]) el.style.fontSize = tableFontSize[i];
      });
      tableCells.forEach((el, i) => {
        el.style.removeProperty('padding');
        el.style.removeProperty('font-size');
        if (cellPadding[i]) el.style.padding = cellPadding[i];
        if (cellFontSize[i]) el.style.fontSize = cellFontSize[i];
      });
    }
  };

  const getDateValue = (item) => {
    return item.created_at || item.order_date || item.start_date || item.scheduled_date || item.due_date || item.estimated_delivery;
  };

  const filtered = () => {
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
  };

  const rows = filtered();
  const currentReport = reportTypes.find((r) => r.key === activeReport);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `₱${amount.toLocaleString()}`;
  };

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString();
  };

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

  const normalizeStatus = (status = '') => {
    return String(status || '').trim().toLowerCase();
  };

  const statusBadge = (status) => {
    const s = normalizeStatus(status);

    let style = styles.badgeNeutral;
    let dot = styles.dotNeutral;

    if (['forwarded', 'active', 'available', 'completed', 'delivered', 'published', 'approved', 'in-stock'].includes(s)) {
      style = styles.badgeSuccess;
      dot = styles.dotSuccess;
    } else if (['cancelled', 'canceled', 'inactive', 'rejected', 'out-of-stock', 'failed'].includes(s)) {
      style = styles.badgeDanger;
      dot = styles.dotDanger;
    } else if (['pending', 'processing', 'low-stock', 'draft', 'scheduled', 'packing'].includes(s)) {
      style = styles.badgeWarning;
      dot = styles.dotWarning;
    }

    return (
      <span style={{ ...styles.statusBadge, ...style }}>
        <span style={{ ...styles.statusDot, ...dot }} />
        {status || 'N/A'}
      </span>
    );
  };

  const summary = useMemo(() => {
    if (activeReport === 'sales') {
      const totalRevenue = rows.reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const forwarded = rows.filter((o) => normalizeStatus(o.status) === 'forwarded').length;
      const cancelled = rows.filter((o) => ['cancelled', 'canceled'].includes(normalizeStatus(o.status))).length;

      return [
        { label: 'Total Orders', value: rows.length, sub: 'All orders in range', icon: FaShoppingBag, tone: 'rose' },
        { label: 'Total Revenue', value: formatCurrency(totalRevenue), sub: 'All orders in range', icon: FaDollarSign, tone: 'green' },
        { label: 'Forwarded Orders', value: forwarded, sub: `${rows.length ? Math.round((forwarded / rows.length) * 100) : 0}% of total`, icon: FaArrowRight, tone: 'blue' },
        { label: 'Cancelled Orders', value: cancelled, sub: `${rows.length ? Math.round((cancelled / rows.length) * 100) : 0}% of total`, icon: FaTimes, tone: 'orange' },
      ];
    }

    if (activeReport === 'inventory') {
      const totalQty = rows.reduce((s, i) => s + Number(i.quantity || 0), 0);
      const lowStock = rows.filter((i) => normalizeStatus(i.status) === 'low-stock').length;
      const outStock = rows.filter((i) => normalizeStatus(i.status) === 'out-of-stock').length;
      const totalValue = rows.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);

      return [
        { label: 'Total Items', value: rows.length, sub: 'Inventory records', icon: FaBox, tone: 'rose' },
        { label: 'Total Quantity', value: formatNumber(totalQty), sub: 'Available quantity', icon: FaChartBar, tone: 'green' },
        { label: 'Low Stock', value: lowStock, sub: 'Needs monitoring', icon: FaExclamationTriangle, tone: 'orange' },
        { label: 'Total Value', value: formatCurrency(totalValue), sub: 'Estimated inventory value', icon: FaDollarSign, tone: 'blue' },
      ];
    }

    if (activeReport === 'hr') {
      const active = rows.filter((e) => normalizeStatus(e.status) === 'active').length;
      const payroll = rows.reduce((s, e) => s + Number(e.salary || 0), 0);

      return [
        { label: 'Employees', value: rows.length, sub: 'Total employees', icon: FaUsers, tone: 'rose' },
        { label: 'Active Staff', value: active, sub: 'Currently active', icon: FaCheck, tone: 'green' },
        { label: 'Departments', value: new Set(rows.map((e) => e.department).filter(Boolean)).size, sub: 'Department count', icon: FaBuilding, tone: 'blue' },
        { label: 'Total Payroll', value: formatCurrency(payroll), sub: 'Salary total', icon: FaDollarSign, tone: 'orange' },
      ];
    }

    if (activeReport === 'logistics') {
      return [
        { label: 'Shipments', value: rows.length, sub: 'Total shipments', icon: FaTruck, tone: 'rose' },
        { label: 'Couriers', value: new Set(rows.map((s) => s.courier).filter(Boolean)).size, sub: 'Courier partners', icon: FaBox, tone: 'green' },
        { label: 'Packing Done', value: rows.filter((s) => normalizeStatus(s.packing_status).includes('complete')).length, sub: 'Completed packing', icon: FaCheck, tone: 'blue' },
        { label: 'In Transit', value: rows.filter((s) => normalizeStatus(s.shipping_status).includes('transit')).length, sub: 'Shipping progress', icon: FaArrowRight, tone: 'orange' },
      ];
    }

    if (activeReport === 'crm') {
      const avgRating = rows.length
        ? (rows.reduce((s, f) => s + Number(f.rating || 0), 0) / rows.length).toFixed(1)
        : '0.0';

      return [
        { label: 'Feedback', value: rows.length, sub: 'Total responses', icon: FaComments, tone: 'rose' },
        { label: 'Average Rating', value: avgRating, sub: 'Customer score', icon: FaStar, tone: 'green' },
        { label: 'Resolved', value: rows.filter((f) => normalizeStatus(f.status) === 'resolved').length, sub: 'Closed feedback', icon: FaCheck, tone: 'blue' },
        { label: 'Pending', value: rows.filter((f) => normalizeStatus(f.status) === 'pending').length, sub: 'Needs action', icon: FaClock, tone: 'orange' },
      ];
    }

    if (activeReport === 'liveselling') {
      const actualSales = rows.reduce((s, l) => s + Number(l.actual_sales || 0), 0);
      const viewers = rows.reduce((s, l) => s + Number(l.viewers || 0), 0);

      return [
        { label: 'Sessions', value: rows.length, sub: 'Live selling records', icon: FaBroadcastTower, tone: 'rose' },
        { label: 'Actual Sales', value: formatCurrency(actualSales), sub: 'Total actual sales', icon: FaDollarSign, tone: 'green' },
        { label: 'Viewers', value: formatNumber(viewers), sub: 'Total viewers', icon: FaEye, tone: 'blue' },
        { label: 'Completed', value: rows.filter((l) => normalizeStatus(l.status) === 'completed').length, sub: 'Completed sessions', icon: FaCheck, tone: 'orange' },
      ];
    }

    if (activeReport === 'content') {
      const views = rows.reduce((s, c) => s + Number(c.views || 0), 0);
      const likes = rows.reduce((s, c) => s + Number(c.likes || 0), 0);

      return [
        { label: 'Content', value: rows.length, sub: 'Total content records', icon: FaEdit, tone: 'rose' },
        { label: 'Views', value: formatNumber(views), sub: 'Total views', icon: FaEye, tone: 'green' },
        { label: 'Likes', value: formatNumber(likes), sub: 'Total likes', icon: FaHeart, tone: 'blue' },
        { label: 'Platforms', value: new Set(rows.map((c) => c.platform).filter(Boolean)).size, sub: 'Active platforms', icon: FaMobileAlt, tone: 'orange' },
      ];
    }

    return [
      { label: 'Records', value: rows.length, sub: 'Total records', icon: FaFileAlt, tone: 'rose' },
      { label: 'Active', value: rows.filter((x) => normalizeStatus(x.status) === 'active').length, sub: 'Active records', icon: FaCheck, tone: 'green' },
      { label: 'Pending', value: rows.filter((x) => normalizeStatus(x.status) === 'pending').length, sub: 'Pending records', icon: FaClock, tone: 'orange' },
      { label: 'Categories', value: new Set(rows.map((x) => x.platform || x.category || x.type).filter(Boolean)).size, sub: 'Unique groups', icon: FaChartBar, tone: 'blue' },
    ];
  }, [rows, activeReport]);

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSalespersonFilter('all');
    setFilterMode('custom');
  };

  return (
    <Layout>
      <style>{`
        @keyframes mod-fadeUp { from{ opacity:0; transform:translateY(30px); } to{ opacity:1; transform:translateY(0); } }
        .mod-animate { opacity: 0; transform: translateY(30px); transition: opacity 0.3s ease-out, transform 0.3s ease-out; }
        .mod-animate.mod-visible { opacity: 1; transform: translateY(0); }
        .mod-stagger-1 { transition-delay: 0.05s; }
        .mod-stagger-2 { transition-delay: 0.1s; }
        .mod-stagger-3 { transition-delay: 0.15s; }
        .mod-stagger-4 { transition-delay: 0.2s; }
      `}</style>
      <div id="print-area" style={styles.page}>
        <div style={styles.hero} className="no-print mod-animate">
          <div>
            <p style={styles.kicker}>Reports Center</p>
            <h1 style={styles.pageTitle}>Reports</h1>
            <p style={styles.pageSubtitle}>Generate, filter, print, and export operational reports.</p>
          </div>

          <div style={styles.btnGroup}>
            <button onClick={handlePrint} style={styles.printBtn}><FaPrint size={16} style={{ marginRight: '6px' }} />Print</button>
            <button onClick={handleExportPDF} style={styles.pdfBtn}><FaDownload size={16} style={{ marginRight: '6px' }} />PDF</button>
            <button onClick={handleExportExcel} style={styles.excelBtn}><FaFileExcel size={16} style={{ marginRight: '6px' }} />Excel</button>
            <button onClick={handleExportCSV} style={styles.csvBtn}><FaFileCsv size={16} style={{ marginRight: '6px' }} />CSV</button>
          </div>
        </div>

        <div className="no-print mod-animate mod-stagger-1" style={styles.tabsPanel}>
          <div style={styles.tabsGrid}>
            {reportTypes.map((r, index) => (
              <button
                key={r.key}
                onClick={() => setActiveReport(r.key)}
                style={activeReport === r.key ? styles.reportCardActive : styles.reportCard}
                className={`mod-animate mod-stagger-${index + 2}`}
              >
                <span style={styles.reportIcon}>{React.createElement(r.icon, { size: 24 })}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="no-print mod-animate mod-stagger-3" style={styles.summaryGrid}>
          {summary.map((item, index) => (
            <div key={item.label} style={styles.summaryCard} className={`mod-animate mod-stagger-${index + 4}`}>
              <div style={{ ...styles.summaryIcon, ...styles[`tone_${item.tone}`] }}>
                {React.createElement(item.icon, { size: 24 })}
              </div>
              <div>
                <p style={styles.summaryLabel}>{item.label}</p>
                <h3 style={styles.summaryValue}>{item.value}</h3>
                <p style={styles.summarySub}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.filterBox} className="no-print mod-animate mod-stagger-4">
          <div style={styles.filterBlock}>
            <p style={styles.filterTitle}>Quick Filters</p>
            <div style={styles.quickFilters}>
              {[
                { key: 'daily', label: 'Today' },
                { key: 'monthly', label: 'This Month' },
                { key: 'yearly', label: 'This Year' },
                { key: 'custom', label: 'Custom' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => applyQuickFilter(f.key)}
                  style={filterMode === f.key ? styles.quickBtnActive : styles.quickBtn}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {activeReport === 'sales' && salespersons.length > 0 && (
            <div style={styles.filterBlock}>
              <p style={styles.filterTitle}>Salesperson</p>
              <select
                value={salespersonFilter}
                onChange={(e) => setSalespersonFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Salespersons</option>
                {salespersons.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.filterBlock}>
            <p style={styles.filterTitle}>Date Range</p>
            <div style={styles.dateInputs}>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={styles.input} />
              <span style={styles.dash}>-</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={styles.input} />
            </div>
          </div>

          <button onClick={clearFilters} style={styles.clearBtn}><FaSync size={16} style={{ marginRight: '6px' }} />Clear Filters</button>
        </div>

        <div style={styles.printHeader} className="print-only">
          <div style={styles.printHeaderTop}>
            <div style={styles.printLogo}>
              <h2 style={styles.printTitle}>Spartan BTY Inc.</h2>
              <p style={styles.printSub}>Management Information System</p>
            </div>
            <div style={styles.printMeta}>
              <p style={styles.printMetaLabel}>Report ID:</p>
              <p style={styles.printMetaValue}>{reportId}</p>
              <p style={styles.printMetaLabel}>Prepared by:</p>
              <p style={styles.printMetaValue}>{user?.full_name || user?.username || 'Admin User'}</p>
            </div>
          </div>
          <div style={styles.printReportSection}>
            <h3 style={styles.printReport}>{currentReport?.label} Report</h3>
            <p style={styles.printDate}>
              {dateFrom && dateTo ? `Date Range: ${new Date(dateFrom).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${new Date(dateTo).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : dateFrom ? `From: ${new Date(dateFrom).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : dateTo ? `To: ${new Date(dateTo).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : 'All Records'}
              {activeReport === 'sales' && salespersonFilter !== 'all' && ` | Salesperson: ${salespersonFilter}`}
            </p>
          </div>
          <p style={styles.printGenerated}>Generated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          <hr style={styles.printDivider} />
        </div>

        <div style={styles.reportBox} className="mod-animate mod-stagger-5">
          {!loading && (
            <div style={styles.reportHeader} className="no-print">
              <div>
                <p style={styles.reportTitle}>
                  <span style={styles.smallIcon}>{currentReport?.icon}</span>
                  {currentReport?.label} Report
                </p>
                <p style={styles.reportDesc}>Showing filtered records from the selected module.</p>
              </div>

              <p style={styles.recordCount}>{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
            </div>
          )}

          {loading ? (
            <div style={styles.loading}>Loading report...</div>
          ) : (
            <>
              {activeReport === 'sales' && (
                <div className="mobile-table-container">
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Order Code</th>
                        <th style={styles.th}>Customer</th>
                        <th style={styles.th}>Salesperson</th>
                        <th style={styles.th}>Phone</th>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Total</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan="7" style={styles.empty}>No records found.</td></tr>
                      ) : rows.map((o) => (
                        <tr key={o.id} style={styles.tr}>
                          <td style={styles.tdStrong}>{o.order_code}</td>
                          <td style={styles.td}>{o.customer_name}</td>
                          <td style={styles.td}>{o.salesperson || ''}</td>
                          <td style={styles.td}>{o.customer_phone || ''}</td>
                          <td style={styles.td}>{formatDate(o.order_date)}</td>
                          <td style={styles.tdStrong}>{formatCurrency(o.total_amount)}</td>
                          <td style={styles.td}>{statusBadge(o.status)}</td>
                        </tr>
                      ))}

                      {rows.length > 0 && (
                        <tr style={styles.totalRow}>
                          <td colSpan="5" style={styles.totalLabel}>Total Revenue</td>
                          <td style={styles.totalValue}>{formatCurrency(rows.reduce((s, o) => s + Number(o.total_amount || 0), 0))}</td>
                          <td />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeReport === 'inventory' && (
                <div className="mobile-table-container">
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Code</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Category</th>
                        <th style={styles.th}>Quantity</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan="5" style={styles.empty}>No records found.</td></tr>
                      ) : rows.map((i) => (
                        <tr key={i.id} style={styles.tr}>
                          <td style={styles.tdStrong}>{i.item_code}</td>
                          <td style={styles.td}>{i.name}</td>
                          <td style={styles.td}>{i.category || ''}</td>
                          <td style={styles.td}>{formatNumber(i.quantity)} {i.unit}</td>
                          <td style={styles.td}>{statusBadge(i.status)}</td>
                        </tr>
                      ))}

                      {rows.length > 0 && (
                        <tr style={styles.totalRow}>
                          <td colSpan="4" style={styles.totalLabel}>Total Value</td>
                          <td style={styles.totalValue}>{formatCurrency(rows.reduce((s, i) => s + (Number(i.quantity || 0) * Number(i.unit_price || 0)), 0))}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeReport === 'hr' && (
                <div className="mobile-table-container">
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Employee ID</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Department</th>
                        <th style={styles.th}>Position</th>
                        <th style={styles.th}>Type</th>
                        <th style={styles.th}>Salary</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan="7" style={styles.empty}>No records found.</td></tr>
                      ) : rows.map((e) => (
                        <tr key={e.id} style={styles.tr}>
                          <td style={styles.tdStrong}>{e.employee_id}</td>
                          <td style={styles.td}>{e.full_name}</td>
                          <td style={styles.td}>{e.department}</td>
                          <td style={styles.td}>{e.position}</td>
                          <td style={styles.td}>{e.employment_type}</td>
                          <td style={styles.tdStrong}>{formatCurrency(e.salary)}</td>
                          <td style={styles.td}>{statusBadge(e.status)}</td>
                        </tr>
                      ))}

                      {rows.length > 0 && (
                        <tr style={styles.totalRow}>
                          <td colSpan="5" style={styles.totalLabel}>Total Payroll</td>
                          <td style={styles.totalValue}>{formatCurrency(rows.reduce((s, e) => s + Number(e.salary || 0), 0))}</td>
                          <td />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeReport === 'logistics' && (
                <div className="mobile-table-container">
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Shipment Code</th>
                        <th style={styles.th}>Order Code</th>
                        <th style={styles.th}>Customer</th>
                        <th style={styles.th}>Courier</th>
                        <th style={styles.th}>Packing</th>
                        <th style={styles.th}>Shipping</th>
                        <th style={styles.th}>Est. Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan="7" style={styles.empty}>No records found.</td></tr>
                      ) : rows.map((s) => (
                        <tr key={s.id} style={styles.tr}>
                          <td style={styles.tdStrong}>{s.shipment_code}</td>
                          <td style={styles.td}>{s.order_code || ''}</td>
                          <td style={styles.td}>{s.customer_name}</td>
                          <td style={styles.td}>{s.courier || ''}</td>
                          <td style={styles.td}>{statusBadge(s.packing_status)}</td>
                          <td style={styles.td}>{statusBadge(s.shipping_status)}</td>
                          <td style={styles.td}>{formatDate(s.estimated_delivery)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeReport === 'crm' && (
                <div className="mobile-table-container">
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Customer</th>
                        <th style={styles.th}>Type</th>
                        <th style={styles.th}>Subject</th>
                        <th style={styles.th}>Rating</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan="6" style={styles.empty}>No records found.</td></tr>
                      ) : rows.map((f) => (
                        <tr key={f.id} style={styles.tr}>
                          <td style={styles.td}>{f.customer_name}</td>
                          <td style={styles.td}>{f.type}</td>
                          <td style={styles.td}>{f.subject}</td>
                          <td style={styles.tdStrong}><FaStar size={14} style={{ marginRight: '4px', color: '#fbbf24' }} />{f.rating || 0}</td>
                          <td style={styles.td}>{statusBadge(f.status)}</td>
                          <td style={styles.td}>{formatDate(f.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeReport === 'campaigns' && (
                <div className="mobile-table-container">
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Title</th>
                        <th style={styles.th}>Platform</th>
                        <th style={styles.th}>Start Date</th>
                        <th style={styles.th}>End Date</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan="5" style={styles.empty}>No records found.</td></tr>
                      ) : rows.map((c) => (
                        <tr key={c.id} style={styles.tr}>
                          <td style={styles.tdStrong}>{c.title}</td>
                          <td style={styles.td}>{c.platform}</td>
                          <td style={styles.td}>{formatDate(c.start_date)}</td>
                          <td style={styles.td}>{formatDate(c.end_date)}</td>
                          <td style={styles.td}>{statusBadge(c.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeReport === 'promotions' && (
                <div className="mobile-table-container">
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Promo Code</th>
                        <th style={styles.th}>Description</th>
                        <th style={styles.th}>Discount Type</th>
                        <th style={styles.th}>Discount Value</th>
                        <th style={styles.th}>Min. Order</th>
                        <th style={styles.th}>Start Date</th>
                        <th style={styles.th}>End Date</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan="8" style={styles.empty}>No records found.</td></tr>
                      ) : rows.map((p) => (
                        <tr key={p.id} style={styles.tr}>
                          <td style={styles.tdStrong}>{p.promo_code}</td>
                          <td style={styles.td}>{p.description || ''}</td>
                          <td style={styles.td}>{p.discount_type}</td>
                          <td style={styles.tdStrong}>
                            {p.discount_type === 'percentage' ? `${p.discount_value}%` : formatCurrency(p.discount_value)}
                          </td>
                          <td style={styles.td}>{formatCurrency(p.min_order)}</td>
                          <td style={styles.td}>{formatDate(p.start_date)}</td>
                          <td style={styles.td}>{formatDate(p.end_date)}</td>
                          <td style={styles.td}>{statusBadge(p.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeReport === 'liveselling' && (
                <div className="mobile-table-container">
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Title</th>
                        <th style={styles.th}>Platform</th>
                        <th style={styles.th}>Scheduled</th>
                        <th style={styles.th}>Host</th>
                        <th style={styles.th}>Target Sales</th>
                        <th style={styles.th}>Actual Sales</th>
                        <th style={styles.th}>Viewers</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan="8" style={styles.empty}>No records found.</td></tr>
                      ) : rows.map((l) => (
                        <tr key={l.id} style={styles.tr}>
                          <td style={styles.tdStrong}>{l.title}</td>
                          <td style={styles.td}>{l.platform}</td>
                          <td style={styles.td}>{l.scheduled_date ? new Date(l.scheduled_date).toLocaleString() : ''}</td>
                          <td style={styles.td}>{l.host || ''}</td>
                          <td style={styles.td}>{formatCurrency(l.target_sales)}</td>
                          <td style={styles.tdStrong}>{formatCurrency(l.actual_sales)}</td>
                          <td style={styles.td}>{formatNumber(l.viewers)}</td>
                          <td style={styles.td}>{statusBadge(l.status)}</td>
                        </tr>
                      ))}

                      {rows.length > 0 && (
                        <tr style={styles.totalRow}>
                          <td colSpan="5" style={styles.totalLabel}>Total Actual Sales</td>
                          <td style={styles.totalValue}>{formatCurrency(rows.reduce((s, l) => s + Number(l.actual_sales || 0), 0))}</td>
                          <td colSpan="2" />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeReport === 'content' && (
                <div className="mobile-table-container">
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Title</th>
                        <th style={styles.th}>Platform</th>
                        <th style={styles.th}>Content Type</th>
                        <th style={styles.th}>Assigned To</th>
                        <th style={styles.th}>Due Date</th>
                        <th style={styles.th}>Views</th>
                        <th style={styles.th}>Likes</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan="8" style={styles.empty}>No records found.</td></tr>
                      ) : rows.map((c) => (
                        <tr key={c.id} style={styles.tr}>
                          <td style={styles.tdStrong}>{c.title}</td>
                          <td style={styles.td}>{c.platform}</td>
                          <td style={styles.td}>{c.content_type}</td>
                          <td style={styles.td}>{c.assigned_to || ''}</td>
                          <td style={styles.td}>{formatDate(c.due_date)}</td>
                          <td style={styles.tdStrong}>{formatNumber(c.views)}</td>
                          <td style={styles.tdStrong}>{formatNumber(c.likes)}</td>
                          <td style={styles.td}>{statusBadge(c.status)}</td>
                        </tr>
                      ))}

                      {rows.length > 0 && (
                        <tr style={styles.totalRow}>
                          <td colSpan="5" style={styles.totalLabel}>Total</td>
                          <td style={styles.totalValue}>{formatNumber(rows.reduce((s, c) => s + Number(c.views || 0), 0))}</td>
                          <td style={styles.totalValue}>{formatNumber(rows.reduce((s, c) => s + Number(c.likes || 0), 0))}</td>
                          <td />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <div className="print-only" style={{ marginTop: '24px' }}>
            <hr style={styles.printDivider} />
            <div style={styles.printFooter}>
              <p style={styles.printFooterText}>Spartan BTY Inc. | Management Information System | Confidential</p>
              <p style={styles.printFooterPage}>Page <span class="page-number">1</span></p>
            </div>
          </div>
        </div>
      </div>

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
            .mobile-table-container {
              overflow-x: visible !important;
            }
            .mobile-table-container table {
              min-width: auto !important;
              width: 100% !important;
              font-size: 10px !important;
            }
            .mobile-table-container th,
            .mobile-table-container td {
              padding: 6px 8px !important;
              font-size: 10px !important;
            }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }

          @media screen {
            .print-only { display: none !important; }
          }

          .mobile-table-container {
            width: 100%;
            overflow-x: auto;
          }

          .mobile-table-container table {
            min-width: 900px;
          }

          .mobile-table-container::-webkit-scrollbar {
            height: 8px;
          }

          .mobile-table-container::-webkit-scrollbar-track {
            background: #f7eef3;
            border-radius: 999px;
          }

          .mobile-table-container::-webkit-scrollbar-thumb {
            background: #c4607a;
            border-radius: 999px;
          }

          @media (max-width: 768px) {
            .mobile-table-container table {
              min-width: 820px;
            }
          }
        `
      }} />
    </Layout>
  );
}

const styles = {
  page: {
    width: '100%',
  },

  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    background: 'linear-gradient(135deg, #ffffff 0%, #fff7fa 100%)',
    padding: '26px 28px',
    borderRadius: '18px',
    boxShadow: '0 12px 35px rgba(39, 18, 28, 0.08)',
    border: '1px solid rgba(196, 96, 122, 0.10)',
    marginBottom: '18px',
  },

  kicker: {
    margin: '0 0 6px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#c4607a',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
  },

  pageTitle: {
    fontSize: '30px',
    fontWeight: '800',
    color: '#18181b',
    margin: '0 0 6px',
    letterSpacing: '-0.6px',
  },

  pageSubtitle: {
    fontSize: '14px',
    color: '#71717a',
    margin: 0,
  },

  btnGroup: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  printBtn: {
    padding: '12px 18px',
    backgroundColor: '#fff',
    color: '#27272a',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    boxShadow: '0 8px 18px rgba(0,0,0,0.04)',
  },

  pdfBtn: {
    padding: '12px 18px',
    background: 'linear-gradient(135deg, #c4607a, #b74768)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    boxShadow: '0 12px 22px rgba(196, 96, 122, 0.24)',
  },

  excelBtn: {
    padding: '12px 18px',
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '800',
    boxShadow: '0 8px 20px rgba(22, 163, 74, 0.3)',
  },

  csvBtn: {
    padding: '12px 18px',
    backgroundColor: '#0891b2',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '800',
    boxShadow: '0 8px 20px rgba(8, 145, 178, 0.3)',
  },

  tabsPanel: {
    backgroundColor: '#fff',
    borderRadius: '18px',
    padding: '12px',
    marginBottom: '18px',
    boxShadow: '0 12px 35px rgba(39, 18, 28, 0.06)',
    border: '1px solid rgba(196, 96, 122, 0.08)',
  },

  tabsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
  },

  reportCard: {
    minHeight: '86px',
    padding: '14px 12px',
    borderRadius: '14px',
    border: '1px solid #eef0f3',
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#27272a',
    fontSize: '13px',
    fontWeight: '700',
    boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
  },

  reportCardActive: {
    minHeight: '86px',
    padding: '14px 12px',
    borderRadius: '14px',
    border: '1px solid #c4607a',
    background: 'linear-gradient(135deg, #c4607a, #b74768)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '800',
    boxShadow: '0 14px 28px rgba(196, 96, 122, 0.28)',
  },

  reportIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '14px',
    marginBottom: '18px',
  },

  summaryCard: {
    background: '#fff',
    borderRadius: '18px',
    padding: '18px',
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
    boxShadow: '0 12px 35px rgba(39, 18, 28, 0.06)',
    border: '1px solid rgba(196, 96, 122, 0.08)',
  },

  summaryIcon: {
    width: '54px',
    height: '54px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '900',
    flexShrink: 0,
  },

  tone_rose: {
    background: '#fde8ef',
    color: '#c4607a',
  },

  tone_green: {
    background: '#dcfce7',
    color: '#16a34a',
  },

  tone_blue: {
    background: '#dbeafe',
    color: '#2563eb',
  },

  tone_orange: {
    background: '#ffedd5',
    color: '#ea580c',
  },

  summaryLabel: {
    margin: '0 0 4px',
    color: '#52525b',
    fontSize: '13px',
    fontWeight: '700',
  },

  summaryValue: {
    margin: '0 0 4px',
    color: '#18181b',
    fontSize: '24px',
    fontWeight: '900',
    letterSpacing: '-0.5px',
  },

  summarySub: {
    margin: 0,
    color: '#8a8f98',
    fontSize: '12px',
  },

  filterBox: {
    backgroundColor: '#fff',
    borderRadius: '18px',
    padding: '18px 20px',
    marginBottom: '18px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '18px',
    flexWrap: 'wrap',
    boxShadow: '0 12px 35px rgba(39, 18, 28, 0.06)',
    border: '1px solid rgba(196, 96, 122, 0.08)',
  },

  filterBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  filterTitle: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '800',
    color: '#3f3f46',
  },

  quickFilters: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },

  quickBtn: {
    padding: '9px 16px',
    borderRadius: '11px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#52525b',
    fontWeight: '700',
  },

  quickBtnActive: {
    padding: '9px 16px',
    borderRadius: '11px',
    border: '1px solid #c4607a',
    background: 'linear-gradient(135deg, #c4607a, #b74768)',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#fff',
    fontWeight: '800',
    boxShadow: '0 10px 18px rgba(196, 96, 122, 0.18)',
  },

  select: {
    minWidth: '190px',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
    color: '#27272a',
  },

  dateInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },

  input: {
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
    color: '#27272a',
  },

  dash: {
    color: '#71717a',
    fontWeight: '700',
  },

  clearBtn: {
    padding: '12px 16px',
    backgroundColor: '#fff',
    color: '#c4607a',
    border: '1px solid rgba(196, 96, 122, 0.35)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '800',
  },

  printHeader: {
    marginBottom: '16px',
  },

  printHeaderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },

  printLogo: {
    flex: 1,
  },

  printMeta: {
    textAlign: 'right',
    minWidth: '200px',
  },

  printMetaLabel: {
    fontSize: '11px',
    color: '#888',
    margin: '0 0 2px',
    fontWeight: '600',
  },

  printMetaValue: {
    fontSize: '13px',
    color: '#302e2e',
    margin: '0 0 8px',
    fontWeight: '700',
  },

  printReportSection: {
    marginBottom: '8px',
  },

  printTitle: {
    fontSize: '24px',
    fontWeight: '800',
    margin: '0 0 4px',
    color: '#302e2e',
  },

  printSub: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 8px',
    fontWeight: '500',
  },

  printReport: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 4px',
    color: '#302e2e',
  },

  printDate: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
    fontWeight: '500',
  },

  printGenerated: {
    fontSize: '12px',
    color: '#888',
    margin: '0 0 12px',
  },

  printDivider: {
    border: 'none',
    borderTop: '2px solid #c4607a',
    margin: '16px 0',
  },

  printFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  },

  printFooterText: {
    fontSize: '11px',
    color: '#888',
    margin: 0,
    fontWeight: '500',
  },

  printFooterPage: {
    fontSize: '11px',
    color: '#888',
    margin: 0,
    fontWeight: '600',
  },

  reportBox: {
    backgroundColor: '#fff',
    borderRadius: '18px',
    padding: '24px',
    boxShadow: '0 12px 35px rgba(39, 18, 28, 0.07)',
    border: '1px solid rgba(196, 96, 122, 0.08)',
  },

  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '14px',
    marginBottom: '16px',
  },

  reportTitle: {
    fontSize: '19px',
    fontWeight: '900',
    color: '#18181b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
  },

  smallIcon: {
    fontSize: '22px',
  },

  reportDesc: {
    margin: '5px 0 0',
    color: '#8a8f98',
    fontSize: '13px',
  },

  recordCount: {
    fontSize: '13px',
    color: '#71717a',
    backgroundColor: '#f8f9fa',
    padding: '7px 13px',
    borderRadius: '999px',
    margin: 0,
    fontWeight: '700',
  },

  loading: {
    padding: '44px',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '14px',
  },

  empty: {
    padding: '42px',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '14px',
  },

  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
  },

  thead: {
    backgroundColor: '#fafafa',
  },

  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '800',
    color: '#52525b',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },

  tr: {
    borderBottom: '1px solid #f1f1f1',
  },

  td: {
    padding: '13px 16px',
    fontSize: '14px',
    color: '#3f3f46',
    borderBottom: '1px solid #f1f1f1',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  },

  tdStrong: {
    padding: '13px 16px',
    fontSize: '14px',
    color: '#18181b',
    borderBottom: '1px solid #f1f1f1',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    fontWeight: '800',
  },

  totalRow: {
    background: 'linear-gradient(135deg, #fff1f5, #fff7fa)',
    borderTop: '1px solid #f3d2dd',
  },

  totalLabel: {
    padding: '16px',
    textAlign: 'right',
    fontWeight: '900',
    color: '#18181b',
    fontSize: '14px',
  },

  totalValue: {
    padding: '16px',
    fontWeight: '900',
    color: '#c4607a',
    fontSize: '17px',
  },

  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
  },

  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '999px',
  },

  badgeSuccess: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },

  dotSuccess: {
    backgroundColor: '#16a34a',
  },

  badgeDanger: {
    backgroundColor: '#ffe4e6',
    color: '#be123c',
  },

  dotDanger: {
    backgroundColor: '#e11d48',
  },

  badgeWarning: {
    backgroundColor: '#ffedd5',
    color: '#c2410c',
  },

  dotWarning: {
    backgroundColor: '#f97316',
  },

  badgeNeutral: {
    backgroundColor: '#f4f4f5',
    color: '#52525b',
  },

  dotNeutral: {
    backgroundColor: '#71717a',
  },
};

export default Reports;
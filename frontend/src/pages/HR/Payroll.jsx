import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaMoneyCheckAlt, FaPlus, FaTimes, FaSearch, FaSave,
  FaEdit, FaCheck, FaUser, FaBuilding, FaCalendar,
  FaMoneyBillWave, FaStickyNote, FaEye, FaPrint,
  FaFilter, FaBan, FaSpinner, FaExclamationTriangle,
  FaCog, FaFileInvoiceDollar,
} from "react-icons/fa";

// ─── constants ────────────────────────────────────────────
const DEPARTMENTS = ['hr','marketing','sales','logistics','crm','inventory','admin'];
const fmtDept = (d) => d ? d.charAt(0).toUpperCase() + d.slice(1) : '—';

const STATUS_STYLES = {
  pending:   { backgroundColor:'#fff7e8', color:'#9a5f0f',  borderColor:'#d98a1f' },
  processed: { backgroundColor:'#e8f4ff', color:'#1a5f9a',  borderColor:'#4a90d9' },
  paid:      { backgroundColor:'#ecfdf3', color:'#2f7d56',  borderColor:'#2f9d6a' },
  cancelled: { backgroundColor:'#f8f3f5', color:'#6b5b63',  borderColor:'#c9b6bf' },
};

const money = (v) => `₱${Number(v || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num   = (v) => Number(v || 0);
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' });
};
const fmtDateShort = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};
const fmtTs = (ts) => ts ? new Date(ts).toLocaleString('en-PH') : '—';

function countWeekdays(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  let count = 0;
  const start = new Date(startStr);
  const end   = new Date(endStr);
  if (end < start) return 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

const EMPTY_FORM = {
  employee_id: '', period_start: '', period_end: '',
  basic_salary: '', working_days: '',
  allowances: '0', overtime_hours: '0', overtime_pay: '0',
  other_deductions: '0', notes: '',
};

// ─── component ────────────────────────────────────────────
function Payroll() {
  const [payroll,   setPayroll]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [message,   setMessage]   = useState('');
  const [isError,   setIsError]   = useState(false);

  // form states
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [salaryWarn, setSalaryWarn] = useState(false);

  // attendance preview
  const [preview,       setPreview]      = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewTimerRef = useRef(null);

  // edit modal
  const [editRec,   setEditRec]   = useState(null);
  const [editForm,  setEditForm]  = useState({});

  // view / payslip modals
  const [viewRec,   setViewRec]   = useState(null);
  const [slipRec,   setSlipRec]   = useState(null);

  // filters
  const [search,        setSearch]        = useState('');
  const [filterDept,    setFilterDept]    = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterMonth,   setFilterMonth]   = useState('');
  const [filterYear,    setFilterYear]    = useState('');
  const [filterEmp,     setFilterEmp]     = useState('');

  // ── data fetch ─────────────────────────────────────────
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchPayroll(), fetchEmployees()]);
    setLoading(false);
  };

  const fetchPayroll = async () => {
    try {
      const r = await api.get('/hr/payroll');
      setPayroll(r.data || []);
    } catch { /* handled silently */ }
  };

  const fetchEmployees = async () => {
    try {
      const r = await api.get('/hr/employees');
      setEmployees(r.data || []);
    } catch { /* handled silently */ }
  };

  // ── notify ─────────────────────────────────────────────
  const notify = useCallback((msg, err = false) => {
    setMessage(msg); setIsError(err);
    setTimeout(() => setMessage(''), 4000);
  }, []);

  // ── employee select → auto-fill salary ────────────────
  const handleEmployeeChange = useCallback((empId) => {
    const emp = employees.find(e => String(e.id) === String(empId));
    const sal = emp ? Number(emp.salary || 0) : 0;
    setSalaryWarn(emp && (!emp.salary || Number(emp.salary) <= 0));
    setForm(f => ({
      ...f,
      employee_id: empId,
      basic_salary: sal > 0 ? String(sal) : '',
    }));
    setPreview(null);
  }, [employees]);

  // ── period change → auto-count working days ───────────
  const handlePeriodChange = useCallback((field, value) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      const start = field === 'period_start' ? value : f.period_start;
      const end   = field === 'period_end'   ? value : f.period_end;
      if (start && end && end >= start) {
        updated.working_days = String(countWeekdays(start, end));
      }
      return updated;
    });
    setPreview(null);
  }, []);

  // ── attendance preview (debounced 600ms) ──────────────
  useEffect(() => {
    const { employee_id, period_start, period_end, basic_salary, working_days } = form;
    if (!employee_id || !period_start || !period_end || !basic_salary || period_end < period_start) {
      setPreview(null);
      return;
    }
    clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const r = await api.get('/hr/payroll/attendance-preview', {
          params: { employee_id, period_start, period_end, basic_salary, working_days },
        });
        setPreview(r.data);
      } catch { setPreview(null); }
      finally  { setPreviewLoading(false); }
    }, 600);
    return () => clearTimeout(previewTimerRef.current);
  }, [form.employee_id, form.period_start, form.period_end, form.basic_salary, form.working_days]);

  // ── computed net for generate form ────────────────────
  const formComputed = useMemo(() => {
    if (!preview) return null;
    const allow  = num(form.allowances);
    const otPay  = num(form.overtime_pay);
    const other  = num(form.other_deductions);
    const gross  = num(form.basic_salary) + allow + otPay;
    const totalDed = round2(
      num(preview.late_deduction) +
      num(preview.absence_deduction) +
      num(preview.half_day_deduction) +
      other
    );
    const net = round2(Math.max(0, gross - totalDed));
    return { gross: round2(gross), totalDed, net };
  }, [preview, form.allowances, form.overtime_pay, form.other_deductions, form.basic_salary]);

  // ── submit generate payroll ───────────────────────────
  const handleSubmit = async () => {
    const { employee_id, period_start, period_end, basic_salary, working_days } = form;
    if (!employee_id)  return notify('Employee is required.', true);
    if (!period_start) return notify('Period start is required.', true);
    if (!period_end)   return notify('Period end is required.', true);
    if (period_end < period_start) return notify('Period end cannot be earlier than period start.', true);
    if (!basic_salary || Number(basic_salary) < 0) return notify('Basic salary must be 0 or greater.', true);
    if (Number(working_days) <= 0) return notify('Working days must be greater than 0.', true);
    if (num(form.allowances) < 0 || num(form.overtime_hours) < 0 ||
        num(form.overtime_pay) < 0 || num(form.other_deductions) < 0)
      return notify('Monetary fields cannot be negative.', true);

    try {
      const r = await api.post('/hr/payroll', form);
      notify(r.data.message || 'Payroll generated!');
      setShowForm(false);
      setForm(EMPTY_FORM);
      setPreview(null);
      fetchPayroll();
    } catch (err) {
      notify(err.response?.data?.message || 'Error generating payroll.', true);
    }
  };

  // ── edit adjustments ──────────────────────────────────
  const handleEditOpen = (p) => {
    if (p.status === 'cancelled') return notify('Cancelled payroll cannot be edited.', true);
    setEditRec(p);
    setEditForm({
      allowances:       p.allowances       || '0',
      overtime_hours:   p.overtime_hours   || '0',
      overtime_pay:     p.overtime_pay     || '0',
      other_deductions: p.other_deductions || '0',
      notes:            p.notes || '',
    });
  };

  const handleEditSave = async () => {
    if (!editRec) return;
    if (editRec.status === 'paid') {
      if (!window.confirm('This payroll is already PAID. Are you sure you want to edit adjustments?')) return;
    }
    try {
      await api.put(`/hr/payroll/${editRec.id}`, {
        ...editForm,
        confirm_paid: editRec.status === 'paid' ? true : undefined,
      });
      notify('Adjustments saved.');
      setEditRec(null);
      fetchPayroll();
    } catch (err) {
      notify(err.response?.data?.message || 'Error saving adjustments.', true);
    }
  };

  // ── status transitions ────────────────────────────────
  const handleProcess = async (id) => {
    try {
      await api.patch(`/hr/payroll/${id}/process`);
      notify('Marked as processed.');
      fetchPayroll();
    } catch (err) {
      notify(err.response?.data?.message || 'Error.', true);
    }
  };

  const handlePay = async (id) => {
    try {
      await api.patch(`/hr/payroll/${id}/pay`);
      notify('Marked as paid.');
      fetchPayroll();
    } catch (err) {
      notify(err.response?.data?.message || 'Error.', true);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this payroll record? It will remain in history.')) return;
    try {
      await api.patch(`/hr/payroll/${id}/cancel`);
      notify('Payroll cancelled.');
      fetchPayroll();
    } catch (err) {
      notify(err.response?.data?.message || 'Error.', true);
    }
  };

  // ── filters ───────────────────────────────────────────
  const clearFilters = () => {
    setSearch(''); setFilterDept(''); setFilterStatus('');
    setFilterMonth(''); setFilterYear(''); setFilterEmp('');
  };
  const hasFilters = search || filterDept || filterStatus || filterMonth || filterYear || filterEmp;

  const filtered = useMemo(() => payroll.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      String(p.full_name   || '').toLowerCase().includes(q) ||
      String(p.department  || '').toLowerCase().includes(q) ||
      String(p.status      || '').toLowerCase().includes(q) ||
      String(p.payroll_code|| '').toLowerCase().includes(q) ||
      String(p.notes       || '').toLowerCase().includes(q);
    const matchDept   = !filterDept   || p.department === filterDept;
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchMonth  = !filterMonth  || (p.period_start && p.period_start.slice(0,7) === filterMonth);
    const matchYear   = !filterYear   || (p.period_start && p.period_start.slice(0,4) === filterYear);
    const matchEmp    = !filterEmp    || String(p.employee_id) === filterEmp;
    return matchSearch && matchDept && matchStatus && matchMonth && matchYear && matchEmp;
  }), [payroll, search, filterDept, filterStatus, filterMonth, filterYear, filterEmp]);

  // ── summary cards ─────────────────────────────────────
  const summary = useMemo(() => ({
    total:     payroll.length,
    pending:   payroll.filter(p => p.status === 'pending').length,
    processed: payroll.filter(p => p.status === 'processed').length,
    paid:      payroll.filter(p => p.status === 'paid').length,
    cancelled: payroll.filter(p => p.status === 'cancelled').length,
    grossPay:  payroll.reduce((s,p) => s + num(p.gross_pay  || p.basic_salary), 0),
    totalDed:  payroll.reduce((s,p) => s + num(p.total_deductions || p.deductions), 0),
    netSalary: payroll.reduce((s,p) => s + num(p.net_salary), 0),
  }), [payroll]);

  // ── edit form recomputed net ──────────────────────────
  const editComputed = useMemo(() => {
    if (!editRec) return null;
    const allow  = num(editForm.allowances);
    const otPay  = num(editForm.overtime_pay);
    const other  = num(editForm.other_deductions);
    const gross  = round2(num(editRec.basic_salary) + allow + otPay);
    const totalDed = round2(
      num(editRec.late_deduction    || 0) +
      num(editRec.absence_deduction || 0) +
      num(editRec.half_day_deduction|| 0) +
      other
    );
    return { gross, totalDed, net: round2(Math.max(0, gross - totalDed)) };
  }, [editRec, editForm]);

  // ─────────────────────────────────────────────────────
const printPayslip = (rec) => {
  if (!rec) return;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  const payslipHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payslip - ${rec.payroll_code || rec.id}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 24px;
            font-family: "Segoe UI", Arial, sans-serif;
            background: #ffffff;
            color: #1f2937;
          }

          .pr-slip {
            width: 100%;
            max-width: 720px;
            margin: 0 auto;
            background: #fff;
            border-radius: 16px;
            padding: 24px;
          }

          .pr-slip-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 2px solid #f3e8ec;
          }

          .pr-slip-company {
            font-size: 22px;
            font-weight: 900;
            color: #b5536b;
            letter-spacing: -0.02em;
          }

          .pr-slip-tagline {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 4px;
            font-style: italic;
          }

          .pr-slip-subtitle {
            font-size: 13px;
            color: #64748b;
            margin-top: 8px;
            font-weight: 700;
          }

          .pr-slip-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 16px;
            background: #fff7fa;
            border-radius: 12px;
            padding: 14px;
            border: 1px solid #ead1d9;
          }

          .pr-slip-meta-item {
            font-size: 12px;
          }

          .pr-slip-meta-key {
            color: #94a3b8;
            font-weight: 700;
            margin-bottom: 2px;
          }

          .pr-slip-meta-val {
            color: #1f2937;
            font-weight: 800;
          }

          .pr-slip-section-title {
            margin: 14px 0 8px;
            font-size: 11px;
            font-weight: 800;
            color: #b5536b;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding-bottom: 6px;
            border-bottom: 1px solid #f3e8ec;
          }

          .pr-slip-line {
            display: flex;
            justify-content: space-between;
            padding: 7px 0;
            border-bottom: 1px dashed #f3e8ec;
            font-size: 13px;
          }

          .pr-slip-line-key {
            color: #374151;
            font-weight: 600;
          }

          .pr-slip-line-val {
            font-weight: 800;
            color: #374151;
          }

          .pr-slip-line-val-green {
            color: #2f7d56;
          }

          .pr-slip-line-val-red {
            color: #b5536b;
          }

          .pr-slip-total {
            display: flex;
            justify-content: space-between;
            padding: 12px 14px;
            background: #b5536b;
            border-radius: 12px;
            margin-top: 12px;
          }

          .pr-slip-total-label {
            color: rgba(255,255,255,.85);
            font-size: 14px;
            font-weight: 800;
          }

          .pr-slip-total-val {
            color: #fff;
            font-size: 18px;
            font-weight: 900;
          }

          .pr-slip-note {
            margin-top: 12px;
            padding: 10px 14px;
            background: #fff7fa;
            border-radius: 10px;
            border: 1px solid #ead1d9;
            font-size: 12px;
            color: #64748b;
          }

          .pr-slip-footer {
            margin-top: 16px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            padding-top: 12px;
            border-top: 1px solid #f3e8ec;
          }

          @page {
            size: A4 portrait;
            margin: 14mm;
          }

          @media print {
            body {
              padding: 0;
            }

            .pr-slip {
              max-width: 100%;
              padding: 0;
            }
          }
        </style>
      </head>

      <body>
        <div class="pr-slip">
          <div class="pr-slip-header">
            <div class="pr-slip-company">Spartan BTY Inc.</div>
            <div class="pr-slip-tagline">We put the CARE in skincare · Better Than Yesterday.</div>
            <div class="pr-slip-subtitle">PAYSLIP — ${rec.payroll_code || `#${rec.id}`}</div>
          </div>

          <div class="pr-slip-meta">
            <div class="pr-slip-meta-item">
              <div class="pr-slip-meta-key">Employee</div>
              <div class="pr-slip-meta-val">${rec.full_name || "—"}</div>
            </div>

            <div class="pr-slip-meta-item">
              <div class="pr-slip-meta-key">Department</div>
              <div class="pr-slip-meta-val">${fmtDept(rec.department)}</div>
            </div>

            <div class="pr-slip-meta-item">
              <div class="pr-slip-meta-key">Position</div>
              <div class="pr-slip-meta-val">${rec.position || "—"}</div>
            </div>

            <div class="pr-slip-meta-item">
              <div class="pr-slip-meta-key">Period</div>
              <div class="pr-slip-meta-val">${fmtDateShort(rec.period_start)} – ${fmtDateShort(rec.period_end)}</div>
            </div>

            <div class="pr-slip-meta-item">
              <div class="pr-slip-meta-key">Working Days</div>
              <div class="pr-slip-meta-val">${rec.working_days || "—"}</div>
            </div>

            <div class="pr-slip-meta-item">
              <div class="pr-slip-meta-key">Status</div>
              <div class="pr-slip-meta-val">${(rec.status || "pending").toUpperCase()}</div>
            </div>
          </div>

          <div class="pr-slip-section-title">Earnings</div>

          <div class="pr-slip-line">
            <span class="pr-slip-line-key">Basic Salary</span>
            <span class="pr-slip-line-val pr-slip-line-val-green">${money(rec.basic_salary)}</span>
          </div>

          <div class="pr-slip-line">
            <span class="pr-slip-line-key">Allowances</span>
            <span class="pr-slip-line-val">${money(rec.allowances)}</span>
          </div>

          <div class="pr-slip-line">
            <span class="pr-slip-line-key">Overtime Pay</span>
            <span class="pr-slip-line-val">${money(rec.overtime_pay)}</span>
          </div>

          <div class="pr-slip-line" style="font-weight:900;">
            <span class="pr-slip-line-key">Gross Pay</span>
            <span class="pr-slip-line-val pr-slip-line-val-green">${money(rec.gross_pay || rec.basic_salary)}</span>
          </div>

          <div class="pr-slip-section-title">Deductions</div>

          <div class="pr-slip-line">
            <span class="pr-slip-line-key">Late Deduction</span>
            <span class="pr-slip-line-val pr-slip-line-val-red">${money(rec.late_deduction)}</span>
          </div>

          <div class="pr-slip-line">
            <span class="pr-slip-line-key">Absence Deduction</span>
            <span class="pr-slip-line-val pr-slip-line-val-red">${money(rec.absence_deduction)}</span>
          </div>

          <div class="pr-slip-line">
            <span class="pr-slip-line-key">Half-day Deduction</span>
            <span class="pr-slip-line-val pr-slip-line-val-red">${money(rec.half_day_deduction)}</span>
          </div>

          <div class="pr-slip-line">
            <span class="pr-slip-line-key">Other Deductions</span>
            <span class="pr-slip-line-val pr-slip-line-val-red">${money(rec.other_deductions)}</span>
          </div>

          <div class="pr-slip-line" style="font-weight:900;">
            <span class="pr-slip-line-key">Total Deductions</span>
            <span class="pr-slip-line-val pr-slip-line-val-red">${money(rec.total_deductions || rec.deductions)}</span>
          </div>

          <div class="pr-slip-total">
            <span class="pr-slip-total-label">NET SALARY</span>
            <span class="pr-slip-total-val">${money(rec.net_salary)}</span>
          </div>

          ${
            rec.notes
              ? `<div class="pr-slip-note">📝 ${rec.notes}</div>`
              : ""
          }

          <div class="pr-slip-footer">
            Generated by Spartan BTY MIS · ${new Date().toLocaleDateString("en-PH")} · This is a computer-generated payslip.
          </div>
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(payslipHtml);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };
};


  return (
    <Layout>
      <style>{`
        /* ── PAGE ── */
        .pr-page { width:100%; max-width:100%; min-width:0; animation:prFadeUp .35s ease both; }

        /* ── HERO ── */
        .pr-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .pr-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .pr-title   { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .pr-subtitle{ margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .pr-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }

        /* ── SUMMARY CARDS ── */
        .pr-summary { display:grid; grid-template-columns:repeat(8,minmax(0,1fr)); gap:10px; margin-bottom:20px; }
        .pr-sum-card { background:#fff; border:1px solid #e2c6cf; border-radius:14px; padding:14px 12px; box-shadow:0 2px 8px rgba(0,0,0,.04); position:relative; overflow:hidden; transition:all 180ms ease; }
        .pr-sum-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .pr-sum-card:hover { transform:translateY(-2px); border-color:#c4607a; }
        .pr-sum-label { margin:0 0 6px; color:#64748b; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .pr-sum-value { margin:0; color:#1f2937; font-size:18px; font-weight:850; letter-spacing:-.04em; }

        /* ── TOOLBAR ── */
        .pr-toolbar { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; justify-content:space-between; align-items:center; gap:14px; }
        .pr-search-wrap { position:relative; width:280px; max-width:100%; }
        .pr-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b5536b; font-size:13px; pointer-events:none; }
        .pr-search { width:100%; padding:11px 13px 11px 36px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; color:#1f2937; font-size:14px; outline:none; box-sizing:border-box; transition:all 180ms ease; }
        .pr-search:focus { border-color:#c4607a; background:#fff; box-shadow:0 0 0 4px rgba(196,96,122,.12); }
        .pr-add-btn,.pr-submit-btn { border:none; border-radius:12px; padding:11px 16px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
        .pr-add-btn:hover,.pr-submit-btn:hover { transform:translateY(-1px); box-shadow:0 10px 22px rgba(196,96,122,.28); }
        .pr-cancel-btn { border:1px solid #d8b8c2; border-radius:12px; padding:11px 16px; background:#fff; color:#64748b; font-size:14px; font-weight:800; cursor:pointer; transition:all 180ms ease; }
        .pr-cancel-btn:hover { border-color:#c4607a; color:#b5536b; }

        /* ── FILTERS ── */
        .pr-filters { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:14px 16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .pr-fselect,.pr-finput { padding:9px 12px; border-radius:10px; border:1px solid #d8b8c2; background:#fff7fa; color:#374151; font-size:13px; font-weight:600; outline:none; cursor:pointer; transition:all 180ms ease; }
        .pr-fselect:focus,.pr-finput:focus { border-color:#c4607a; box-shadow:0 0 0 3px rgba(196,96,122,.1); }
        .pr-fclear { padding:9px 14px; border-radius:10px; border:1px solid #d8b8c2; background:#fff; color:#64748b; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 180ms ease; }
        .pr-fclear:hover { border-color:#c4607a; color:#b5536b; }

        /* ── MESSAGE ── */
        .pr-message { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .pr-msg-ok  { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .pr-msg-err { background:#fff1f5; color:#b5536b; border-color:#c4607a; }

        /* ── FORMS ── */
        .pr-form { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .pr-form-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .pr-form-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .pr-form-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .pr-form-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .pr-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; margin-bottom:16px; }
        .pr-grid-2 { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-bottom:16px; }
        .pr-field { display:flex; flex-direction:column; gap:7px; min-width:0; }
        .pr-span2 { grid-column:span 2; }
        .pr-span3 { grid-column:span 3; }
        .pr-label { font-size:13px; font-weight:800; color:#374151; }
        .pr-label-sub { font-size:11px; font-weight:400; color:#94a3b8; margin-left:4px; }
        .pr-input { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .pr-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .pr-input-ro { background:#fff7fa; font-weight:900; color:#b5536b; }
        .pr-input-auto { background:#fff7fa; color:#64748b; }
        .pr-salary-warn { margin-top:4px; font-size:11px; color:#9a5f0f; font-weight:700; display:flex; align-items:center; gap:5px; }
        .pr-form-actions { display:flex; gap:10px; flex-wrap:wrap; }

        /* ── PREVIEW BOX ── */
        .pr-preview { background:linear-gradient(135deg,#fff7fa,#fff); border:1px solid #e2c6cf; border-radius:14px; padding:18px; margin-bottom:16px; }
        .pr-preview-title { margin:0 0 14px; font-size:13px; font-weight:800; color:#b5536b; text-transform:uppercase; letter-spacing:.06em; display:flex; align-items:center; gap:8px; }
        .pr-preview-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
        .pr-preview-item { background:#fff; border:1px solid #ead1d9; border-radius:10px; padding:10px 12px; }
        .pr-preview-key { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.04em; margin-bottom:4px; }
        .pr-preview-val { font-size:14px; font-weight:800; color:#1f2937; }
        .pr-preview-val-pink { color:#b5536b; }
        .pr-preview-val-green { color:#2f7d56; }
        .pr-preview-val-amber { color:#9a5f0f; }
        .pr-preview-loading { padding:18px; text-align:center; color:#94a3b8; font-size:13px; font-weight:700; }

        /* ── TABLE ── */
        .pr-count { margin:0 0 12px; color:#64748b; font-size:13px; font-weight:700; }
        .pr-table-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); overflow:hidden; }
        .pr-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; border:1px solid #ead1d9; border-radius:14px; }
        .pr-table { width:100%; min-width:1200px; border-collapse:collapse; background:#fff; }
        .pr-table thead { background:#fff7fa; }
        .pr-table th { padding:12px 14px; text-align:left; font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #ead1d9; white-space:nowrap; }
        .pr-table td { padding:13px 14px; font-size:13px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; vertical-align:middle; }
        .pr-table tbody tr:hover { background:#fff7fa; }
        .pr-table tbody tr:last-child td { border-bottom:none; }
        .pr-name { font-weight:850; color:#1f2937; }
        .pr-code { font-size:11px; color:#94a3b8; margin-top:2px; }
        .pr-cell-icon { display:inline-flex; align-items:center; gap:6px; }
        .pr-cell-icon svg { color:#b5536b; flex:0 0 auto; }
        .pr-money { font-weight:800; }
        .pr-net { font-weight:900; color:#b5536b; }
        .pr-status { display:inline-flex; align-items:center; justify-content:center; padding:5px 10px; border-radius:9999px; font-size:11px; font-weight:800; border:1px solid; white-space:nowrap; text-transform:capitalize; }
        .pr-actions { display:flex; gap:5px; flex-wrap:nowrap; }
        .pr-btn { border-radius:9px; padding:7px 9px; cursor:pointer; font-size:11px; font-weight:800; display:inline-flex; align-items:center; gap:5px; border:1px solid; transition:all 180ms ease; white-space:nowrap; }
        .pr-btn:hover { transform:translateY(-1px); }
        .pr-btn-view   { background:#e8f4ff; color:#1a5f9a; border-color:#4a90d9; }
        .pr-btn-edit   { background:#fff7e8; color:#9a5f0f; border-color:#d98a1f; }
        .pr-btn-slip   { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .pr-btn-proc   { background:#e8f4ff; color:#1a5f9a; border-color:#4a90d9; }
        .pr-btn-pay    { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .pr-btn-cancel { background:#f8f3f5; color:#6b5b63; border-color:#c9b6bf; }
        .pr-empty { padding:40px!important; text-align:center; color:#94a3b8!important; font-size:14px!important; font-weight:700; }
        .pr-table-loading { padding:40px; text-align:center; color:#64748b; font-size:14px; font-weight:700; }

        /* ── MODALS ── */
        .pr-overlay { position:fixed; inset:0; background:rgba(0,0,0,.48); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .pr-modal { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:560px; box-shadow:0 20px 60px rgba(0,0,0,.2); max-height:90vh; overflow-y:auto; }
        .pr-modal-lg { max-width:680px; }
        .pr-modal-title { margin:0 0 20px; font-size:19px; font-weight:800; color:#1f2937; padding-bottom:14px; border-bottom:1px solid #f3e8ec; display:flex; align-items:center; gap:10px; }
        .pr-modal-section { margin:16px 0 8px; font-size:11px; font-weight:800; color:#b5536b; text-transform:uppercase; letter-spacing:.06em; }
        .pr-modal-row { display:flex; justify-content:space-between; align-items:flex-start; padding:9px 0; border-bottom:1px solid #f3e8ec; font-size:13px; }
        .pr-modal-row:last-of-type { border-bottom:none; }
        .pr-modal-key { color:#64748b; font-weight:700; }
        .pr-modal-val { color:#1f2937; font-weight:800; text-align:right; max-width:55%; }
        .pr-modal-val-pink  { color:#b5536b; }
        .pr-modal-val-green { color:#2f7d56; }
        .pr-modal-val-amber { color:#9a5f0f; }
        .pr-modal-close { margin-top:20px; width:100%; padding:12px; border:none; border-radius:12px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; }
        .pr-modal-actions { display:flex; gap:10px; margin-top:20px; }
        .pr-modal-actions .pr-submit-btn { flex:1; }
        .pr-modal-actions .pr-cancel-btn { flex:1; }

        /* ── PAYSLIP ── */
        .pr-slip { background:#fff; border-radius:16px; padding:24px; }
        .pr-slip-header { text-align:center; margin-bottom:20px; padding-bottom:16px; border-bottom:2px solid #f3e8ec; }
        .pr-slip-company { font-size:22px; font-weight:900; color:#b5536b; letter-spacing:-.02em; }
        .pr-slip-tagline { font-size:12px; color:#94a3b8; margin-top:4px; font-style:italic; }
        .pr-slip-subtitle { font-size:13px; color:#64748b; margin-top:8px; font-weight:700; }
        .pr-slip-meta { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; background:#fff7fa; border-radius:12px; padding:14px; border:1px solid #ead1d9; }
        .pr-slip-meta-item { font-size:12px; }
        .pr-slip-meta-key { color:#94a3b8; font-weight:700; margin-bottom:2px; }
        .pr-slip-meta-val { color:#1f2937; font-weight:800; }
        .pr-slip-section-title { margin:14px 0 8px; font-size:11px; font-weight:800; color:#b5536b; text-transform:uppercase; letter-spacing:.06em; padding-bottom:6px; border-bottom:1px solid #f3e8ec; }
        .pr-slip-line { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px dashed #f3e8ec; font-size:13px; }
        .pr-slip-line:last-child { border-bottom:none; }
        .pr-slip-line-key { color:#374151; font-weight:600; }
        .pr-slip-line-val { font-weight:800; color:#374151; }
        .pr-slip-line-val-green { color:#2f7d56; }
        .pr-slip-line-val-red   { color:#b5536b; }
        .pr-slip-total { display:flex; justify-content:space-between; padding:12px 14px; background:linear-gradient(135deg,#b5536b,#e58ca3); border-radius:12px; margin-top:12px; }
        .pr-slip-total-label { color:rgba(255,255,255,.85); font-size:14px; font-weight:800; }
        .pr-slip-total-val   { color:#fff; font-size:18px; font-weight:900; }
        .pr-slip-note { margin-top:12px; padding:10px 14px; background:#fff7fa; border-radius:10px; border:1px solid #ead1d9; font-size:12px; color:#64748b; }
        .pr-slip-footer { margin-top:16px; text-align:center; font-size:11px; color:#94a3b8; padding-top:12px; border-top:1px solid #f3e8ec; }
        .pr-slip-print-btn { width:100%; margin-top:16px; padding:12px; border:none; border-radius:12px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; }

        @keyframes prFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        

        /* ── RESPONSIVE ── */
        @media (max-width:1180px) {
          .pr-summary { grid-template-columns:repeat(4,minmax(0,1fr)); }
        }
        @media (max-width:900px) {
          .pr-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .pr-span2,.pr-span3 { grid-column:span 2; }
          .pr-preview-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .pr-summary { grid-template-columns:repeat(4,minmax(0,1fr)); }
        }
        @media (max-width:768px) {
          .pr-hero { align-items:flex-start; padding:20px; }
          .pr-title { font-size:24px; }
          .pr-hero-icon { width:48px; height:48px; font-size:20px; }
          .pr-toolbar { flex-direction:column; align-items:stretch; }
          .pr-search-wrap,.pr-add-btn { width:100%; }
          .pr-summary { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .pr-filters { flex-direction:column; align-items:stretch; }
          .pr-fselect,.pr-finput,.pr-fclear { width:100%; }
          .pr-grid { grid-template-columns:1fr; }
          .pr-grid-2 { grid-template-columns:1fr; }
          .pr-span2,.pr-span3 { grid-column:span 1; }
          .pr-preview-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .pr-form-actions { flex-direction:column; }
          .pr-submit-btn,.pr-cancel-btn { width:100%; }
          .pr-table-panel { padding:12px; }
          .pr-table { min-width:1100px; }
          .pr-table th,.pr-table td { padding:10px 11px; font-size:12px; }
          .pr-modal-actions { flex-direction:column; }
          .pr-slip-meta { grid-template-columns:1fr; }
        }
        @media (max-width:520px) {
          .pr-hero { flex-direction:column-reverse; }
          .pr-summary { grid-template-columns:1fr 1fr; }
        }
      `}</style>

      <div className="pr-page">

        {/* HERO */}
        <div className="pr-hero">
          <div>
            <p className="pr-eyebrow">Human Resources</p>
            <h3 className="pr-title">Payroll Management</h3>
            <p className="pr-subtitle">
              Generate attendance-based payroll, compute deductions, manage payslips, and track payment status.
            </p>
          </div>
          <div className="pr-hero-icon"><FaMoneyCheckAlt /></div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="pr-summary">
          {[
            { label:'Total Records',   value: summary.total },
            { label:'Pending',         value: summary.pending,   color:'#9a5f0f' },
            { label:'Processed',       value: summary.processed, color:'#1a5f9a' },
            { label:'Paid',            value: summary.paid,      color:'#2f7d56' },
            { label:'Cancelled',       value: summary.cancelled, color:'#6b5b63' },
            { label:'Total Gross Pay', value: money(summary.grossPay),  small:true },
            { label:'Total Deductions',value: money(summary.totalDed),  small:true },
            { label:'Total Net Salary',value: money(summary.netSalary), small:true, pink:true },
          ].map(c => (
            <div key={c.label} className="pr-sum-card">
              <p className="pr-sum-label">{c.label}</p>
              <p className="pr-sum-value" style={{
                ...(c.color ? { color: c.color } : {}),
                ...(c.pink  ? { color:'#b5536b' } : {}),
                ...(c.small ? { fontSize:12 } : {}),
              }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="pr-toolbar">
          <div className="pr-search-wrap">
            <FaSearch className="pr-search-icon" />
            <input type="text" placeholder="Search payroll..." value={search}
              onChange={e => setSearch(e.target.value)} className="pr-search" />
          </div>
          <button onClick={() => { setShowForm(!showForm); setPreview(null); setForm(EMPTY_FORM); }} className="pr-add-btn">
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'Generate Payroll'}
          </button>
        </div>

        {/* FILTERS */}
        <div className="pr-filters">
          <FaFilter style={{ color:'#b5536b', fontSize:13, flexShrink:0 }} />
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="pr-fselect">
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{fmtDept(d)}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="pr-fselect">
            <option value="">All Statuses</option>
            {['pending','processed','paid','cancelled'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
            ))}
          </select>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="pr-finput" title="Filter by period month" />
          <input type="number" value={filterYear} onChange={e => setFilterYear(e.target.value)}
            className="pr-finput" placeholder="Year" min="2020" max="2099"
            style={{ width:80 }} title="Filter by period year" />
          <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)} className="pr-fselect">
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={String(e.id)}>{e.full_name}</option>)}
          </select>
          {hasFilters && (
            <button className="pr-fclear" onClick={clearFilters}><FaTimes /> Clear</button>
          )}
        </div>

        {/* MESSAGE */}
        {message && (
          <div className={`pr-message ${isError ? 'pr-msg-err' : 'pr-msg-ok'}`}>{message}</div>
        )}

        {/* GENERATE FORM */}
        {showForm && (
          <div className="pr-form">
            <div className="pr-form-header">
              <div className="pr-form-icon"><FaPlus /></div>
              <div>
                <h4 className="pr-form-title">Generate Payroll</h4>
                <p className="pr-form-note">Select employee and period — salary auto-fills and attendance deductions are computed automatically.</p>
              </div>
            </div>

            {/* ROW 1 */}
            <div className="pr-grid">
              <div className="pr-field">
                <label className="pr-label">Employee *</label>
                <select value={form.employee_id} onChange={e => handleEmployeeChange(e.target.value)} className="pr-input">
                  <option value="">Select employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} — {e.department}</option>
                  ))}
                </select>
              </div>
              <div className="pr-field">
                <label className="pr-label">Period Start *</label>
                <input type="date" value={form.period_start}
                  onChange={e => handlePeriodChange('period_start', e.target.value)} className="pr-input" />
              </div>
              <div className="pr-field">
                <label className="pr-label">Period End *</label>
                <input type="date" value={form.period_end}
                  onChange={e => handlePeriodChange('period_end', e.target.value)} className="pr-input" />
              </div>
            </div>

            {/* ROW 2 */}
            <div className="pr-grid">
              <div className="pr-field">
                <label className="pr-label">
                  Basic Salary <span className="pr-label-sub">from employee record</span>
                </label>
                <input type="number" placeholder="0.00" value={form.basic_salary}
                  onChange={e => setForm(f => ({ ...f, basic_salary: e.target.value }))}
                  className="pr-input pr-input-auto" />
                {salaryWarn && (
                  <span className="pr-salary-warn">
                    <FaExclamationTriangle /> Salary is not set for this employee.
                  </span>
                )}
              </div>
              <div className="pr-field">
                <label className="pr-label">
                  Working Days <span className="pr-label-sub">auto-counted, editable</span>
                </label>
                <input type="number" placeholder="0" value={form.working_days}
                  onChange={e => setForm(f => ({ ...f, working_days: e.target.value }))}
                  className="pr-input" min="1" />
              </div>
              <div className="pr-field">
                <label className="pr-label">Allowances</label>
                <input type="number" placeholder="0.00" value={form.allowances}
                  onChange={e => setForm(f => ({ ...f, allowances: e.target.value }))}
                  className="pr-input" min="0" />
              </div>
            </div>

            {/* ROW 3 */}
            <div className="pr-grid">
              <div className="pr-field">
                <label className="pr-label">Overtime Hours</label>
                <input type="number" placeholder="0" value={form.overtime_hours}
                  onChange={e => setForm(f => ({ ...f, overtime_hours: e.target.value }))}
                  className="pr-input" min="0" />
              </div>
              <div className="pr-field">
                <label className="pr-label">Overtime Pay</label>
                <input type="number" placeholder="0.00" value={form.overtime_pay}
                  onChange={e => setForm(f => ({ ...f, overtime_pay: e.target.value }))}
                  className="pr-input" min="0" />
              </div>
              <div className="pr-field">
                <label className="pr-label">Other Deductions</label>
                <input type="number" placeholder="0.00" value={form.other_deductions}
                  onChange={e => setForm(f => ({ ...f, other_deductions: e.target.value }))}
                  className="pr-input" min="0" />
              </div>
            </div>

            {/* NOTES */}
            <div className="pr-grid" style={{ marginBottom:16 }}>
              <div className="pr-field pr-span3">
                <label className="pr-label">Notes <span className="pr-label-sub">optional</span></label>
                <input type="text" placeholder="e.g. Regular payroll, 13th month pay..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="pr-input" />
              </div>
            </div>

            {/* ATTENDANCE PREVIEW */}
            {previewLoading && (
              <div className="pr-preview">
                <div className="pr-preview-loading">
                  <FaSpinner style={{ marginRight:7, animation:'spin 1s linear infinite' }} />
                  Loading attendance data...
                </div>
              </div>
            )}

            {preview && !previewLoading && (
              <div className="pr-preview">
                <p className="pr-preview-title">
                  <FaCalendar /> Attendance Computation Preview
                </p>
                <div className="pr-preview-grid">
                  {[
                    { k:'Days Present',       v: preview.days_present,        cls:'' },
                    { k:'Days Late',          v: preview.days_late,           cls:'pr-preview-val-amber' },
                    { k:'Days Absent',        v: preview.days_absent,         cls:'pr-preview-val-pink' },
                    { k:'Days On Leave',      v: preview.days_on_leave,       cls:'' },
                    { k:'Half-day Count',     v: preview.half_day_count,      cls:'' },
                    { k:'Late (minutes)',     v: preview.total_late_minutes,  cls:'pr-preview-val-amber' },
                    { k:'Total Hours',        v: `${preview.total_hours}h`,   cls:'' },
                    { k:'Working Days',       v: preview.working_days,        cls:'' },
                    { k:'Daily Rate',         v: money(preview.daily_rate),   cls:'' },
                    { k:'Hourly Rate',        v: money(preview.hourly_rate),  cls:'' },
                    { k:'Late Deduction',     v: money(preview.late_deduction),    cls:'pr-preview-val-amber' },
                    { k:'Absence Deduction',  v: money(preview.absence_deduction), cls:'pr-preview-val-pink' },
                    { k:'Half-day Deduction', v: money(preview.half_day_deduction),cls:'pr-preview-val-pink' },
                    { k:'Other Deductions',   v: money(form.other_deductions), cls:'pr-preview-val-pink' },
                    formComputed && { k:'Total Deductions', v: money(formComputed.totalDed), cls:'pr-preview-val-pink' },
                    formComputed && { k:'Gross Pay',        v: money(formComputed.gross),    cls:'pr-preview-val-green' },
                    formComputed && { k:'Net Salary',       v: money(formComputed.net),      cls:'pr-preview-val-pink' },
                  ].filter(Boolean).map(item => (
                    <div key={item.k} className="pr-preview-item">
                      <div className="pr-preview-key">{item.k}</div>
                      <div className={`pr-preview-val ${item.cls}`}>{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pr-form-actions">
              <button onClick={handleSubmit} className="pr-submit-btn">
                <FaSave /> Generate Payroll
              </button>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setPreview(null); }} className="pr-cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* RECORD COUNT */}
        <p className="pr-count">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
        </p>

        {/* TABLE */}
        <div className="pr-table-panel">
          {loading ? (
            <div className="pr-table-loading">⏳ Loading payroll records...</div>
          ) : (
            <div className="pr-table-wrap">
              <table className="pr-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Dept</th>
                    <th>Period</th>
                    <th>Basic Salary</th>
                    <th>Att. Deductions</th>
                    <th>Other Ded.</th>
                    <th>Total Ded.</th>
                    <th>Gross Pay</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="pr-empty">
                        {hasFilters ? '🔍 No records match your filters.' : '💰 No payroll records yet.'}
                      </td>
                    </tr>
                  ) : filtered.map(p => {
                    const attDed = round2(
                      num(p.late_deduction) +
                      num(p.absence_deduction) +
                      num(p.half_day_deduction)
                    );
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="pr-cell-icon">
                            <FaUser />
                            <div>
                              <div className="pr-name">{p.full_name || '—'}</div>
                              <div className="pr-code">{p.payroll_code || `#${p.id}`}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="pr-cell-icon">
                            <FaBuilding />
                            {fmtDept(p.department)}
                          </span>
                        </td>
                        <td>
                          <span className="pr-cell-icon">
                            <FaCalendar />
                            {fmtDate(p.period_start)} – {fmtDate(p.period_end)}
                          </span>
                        </td>
                        <td className="pr-money">{money(p.basic_salary)}</td>
                        <td style={{ color:'#9a5f0f', fontWeight:800 }}>{money(attDed)}</td>
                        <td style={{ color:'#b5536b', fontWeight:700 }}>{money(p.other_deductions)}</td>
                        <td style={{ color:'#b5536b', fontWeight:800 }}>{money(p.total_deductions || p.deductions)}</td>
                        <td className="pr-money">{money(p.gross_pay || p.basic_salary)}</td>
                        <td className="pr-net">{money(p.net_salary)}</td>
                        <td>
                          <span className="pr-status" style={STATUS_STYLES[p.status] || STATUS_STYLES.pending}>
                            {p.status || 'pending'}
                          </span>
                        </td>
                        <td>
                          <div className="pr-actions">
                            <button className="pr-btn pr-btn-view" onClick={() => setViewRec(p)}>
                              <FaEye />
                            </button>
                            <button className="pr-btn pr-btn-edit" onClick={() => handleEditOpen(p)}>
                              <FaEdit />
                            </button>
                            <button className="pr-btn pr-btn-slip" onClick={() => setSlipRec(p)}>
                              <FaFileInvoiceDollar />
                            </button>
                            {p.status === 'pending' && (
                              <button className="pr-btn pr-btn-proc" onClick={() => handleProcess(p.id)}>
                                <FaCog />
                              </button>
                            )}
                            {(p.status === 'pending' || p.status === 'processed') && (
                              <button className="pr-btn pr-btn-pay" onClick={() => handlePay(p.id)}>
                                <FaCheck />
                              </button>
                            )}
                            {p.status !== 'paid' && p.status !== 'cancelled' && (
                              <button className="pr-btn pr-btn-cancel" onClick={() => handleCancel(p.id)}>
                                <FaBan />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT ADJUSTMENTS MODAL ── */}
      {editRec && (
        <div className="pr-overlay" onClick={() => setEditRec(null)}>
          <div className="pr-modal" onClick={e => e.stopPropagation()}>
            <h3 className="pr-modal-title">
              <FaEdit style={{ color:'#b5536b' }} />
              Edit Adjustments
            </h3>

            {editRec.status === 'paid' && (
              <div style={{ background:'#fff7e8', border:'1px solid #d98a1f', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#9a5f0f', fontWeight:700 }}>
                ⚠️ This payroll is already PAID. Editing requires confirmation.
              </div>
            )}

            <div className="pr-grid-2">
              {[
                ['Allowances',       'allowances'],
                ['Overtime Hours',   'overtime_hours'],
                ['Overtime Pay',     'overtime_pay'],
                ['Other Deductions', 'other_deductions'],
              ].map(([label, field]) => (
                <div key={field} className="pr-field">
                  <label className="pr-label">{label}</label>
                  <input type="number" min="0" value={editForm[field] || '0'}
                    onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                    className="pr-input" />
                </div>
              ))}
            </div>

            <div className="pr-field" style={{ marginBottom:16 }}>
              <label className="pr-label">Notes</label>
              <input type="text" value={editForm.notes || ''}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                className="pr-input" />
            </div>

            {editComputed && (
              <div style={{ background:'#fff7fa', border:'1px solid #ead1d9', borderRadius:12, padding:14, marginBottom:16 }}>
                {[
                  ['Gross Pay',        money(editComputed.gross),    'pr-modal-val-green'],
                  ['Total Deductions', money(editComputed.totalDed), 'pr-modal-val-pink'],
                  ['Net Salary',       money(editComputed.net),      'pr-modal-val-pink'],
                ].map(([k, v, cls]) => (
                  <div key={k} className="pr-modal-row">
                    <span className="pr-modal-key">{k}</span>
                    <span className={`pr-modal-val ${cls}`}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pr-modal-actions">
              <button onClick={handleEditSave} className="pr-submit-btn"><FaSave /> Save</button>
              <button onClick={() => setEditRec(null)} className="pr-cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW DETAILS MODAL ── */}
      {viewRec && (
        <div className="pr-overlay" onClick={() => setViewRec(null)}>
          <div className="pr-modal pr-modal-lg" onClick={e => e.stopPropagation()}>
            <h3 className="pr-modal-title">
              <FaEye style={{ color:'#b5536b' }} />
              Payroll Details
            </h3>

            {/* Employee info */}
            <p className="pr-modal-section">Employee</p>
            {[
              ['Payroll Code',  viewRec.payroll_code || `#${viewRec.id}`],
              ['Employee',      viewRec.full_name || '—'],
              ['Employee Code', viewRec.emp_code || '—'],
              ['Department',    fmtDept(viewRec.department)],
              ['Position',      viewRec.position || '—'],
            ].map(([k,v]) => (
              <div key={k} className="pr-modal-row">
                <span className="pr-modal-key">{k}</span>
                <span className="pr-modal-val">{v}</span>
              </div>
            ))}

            {/* Period & attendance */}
            <p className="pr-modal-section">Period & Attendance</p>
            {[
              ['Period',           `${fmtDate(viewRec.period_start)} – ${fmtDate(viewRec.period_end)}`],
              ['Working Days',     viewRec.working_days || '—'],
              ['Days Present',     viewRec.days_present || 0],
              ['Days Late',        viewRec.days_late    || 0],
              ['Days Absent',      viewRec.days_absent  || 0],
              ['Days On Leave',    viewRec.days_on_leave || 0],
              ['Half-day Count',   viewRec.half_day_count || 0],
              ['Total Late (min)', viewRec.total_late_minutes || 0],
              ['Total Hours',      viewRec.total_hours ? `${viewRec.total_hours}h` : '—'],
              ['Daily Rate',       money(viewRec.daily_rate)],
              ['Hourly Rate',      money(viewRec.hourly_rate)],
            ].map(([k,v]) => (
              <div key={k} className="pr-modal-row">
                <span className="pr-modal-key">{k}</span>
                <span className="pr-modal-val">{v}</span>
              </div>
            ))}

            {/* Earnings */}
            <p className="pr-modal-section">Earnings</p>
            {[
              ['Basic Salary',  money(viewRec.basic_salary),  'pr-modal-val'],
              ['Allowances',    money(viewRec.allowances),    'pr-modal-val'],
              ['Overtime Hrs',  viewRec.overtime_hours || 0,  'pr-modal-val'],
              ['Overtime Pay',  money(viewRec.overtime_pay),  'pr-modal-val'],
              ['Gross Pay',     money(viewRec.gross_pay || viewRec.basic_salary), 'pr-modal-val-green'],
            ].map(([k,v,cls]) => (
              <div key={k} className="pr-modal-row">
                <span className="pr-modal-key">{k}</span>
                <span className={`pr-modal-val ${cls}`}>{v}</span>
              </div>
            ))}

            {/* Deductions */}
            <p className="pr-modal-section">Deductions</p>
            {[
              ['Late Deduction',     money(viewRec.late_deduction),     'pr-modal-val-amber'],
              ['Absence Deduction',  money(viewRec.absence_deduction),  'pr-modal-val-pink'],
              ['Half-day Deduction', money(viewRec.half_day_deduction), 'pr-modal-val-pink'],
              ['Other Deductions',   money(viewRec.other_deductions),   'pr-modal-val-pink'],
              ['Total Deductions',   money(viewRec.total_deductions || viewRec.deductions), 'pr-modal-val-pink'],
              ['Net Salary',         money(viewRec.net_salary),         'pr-modal-val-pink'],
            ].map(([k,v,cls]) => (
              <div key={k} className="pr-modal-row">
                <span className="pr-modal-key">{k}</span>
                <span className={`pr-modal-val ${cls}`}>{v}</span>
              </div>
            ))}

            {/* Status & timestamps */}
            <p className="pr-modal-section">Status & Timestamps</p>
            {[
              ['Status',       viewRec.status || 'pending'],
              ['Notes',        viewRec.notes  || '—'],
              ['Created',      fmtTs(viewRec.created_at)],
              ['Updated',      fmtTs(viewRec.updated_at)],
              ['Processed At', fmtTs(viewRec.processed_at)],
              ['Paid At',      fmtTs(viewRec.paid_at)],
              ['Cancelled At', fmtTs(viewRec.cancelled_at)],
            ].map(([k,v]) => (
              <div key={k} className="pr-modal-row">
                <span className="pr-modal-key">{k}</span>
                <span className="pr-modal-val">{v}</span>
              </div>
            ))}

            <button className="pr-modal-close" onClick={() => setViewRec(null)}>Close</button>
          </div>
        </div>
      )}

      {/* ── PAYSLIP MODAL ── */}
      {slipRec && (
        <div className="pr-overlay" onClick={() => setSlipRec(null)}>
          <div className="pr-modal pr-modal-lg" onClick={e => e.stopPropagation()}>
            <h3 className="pr-modal-title">
              <FaFileInvoiceDollar style={{ color:'#b5536b' }} />
              Payslip Preview
            </h3>

            <div className="pr-slip" id="pr-slip-printable">
              <div className="pr-slip-header">
                <div className="pr-slip-company">Spartan BTY Inc.</div>
                <div className="pr-slip-tagline">We put the CARE in skincare · Better Than Yesterday.</div>
                <div className="pr-slip-subtitle">PAYSLIP — {slipRec.payroll_code || `#${slipRec.id}`}</div>
              </div>

              <div className="pr-slip-meta">
                {[
                  ['Employee',   slipRec.full_name || '—'],
                  ['Department', fmtDept(slipRec.department)],
                  ['Position',   slipRec.position || '—'],
                  ['Period',     `${fmtDateShort(slipRec.period_start)} – ${fmtDateShort(slipRec.period_end)}`],
                  ['Working Days', slipRec.working_days || '—'],
                  ['Status',     (slipRec.status || 'pending').toUpperCase()],
                ].map(([k,v]) => (
                  <div key={k} className="pr-slip-meta-item">
                    <div className="pr-slip-meta-key">{k}</div>
                    <div className="pr-slip-meta-val">{v}</div>
                  </div>
                ))}
              </div>

              <div className="pr-slip-section-title">Earnings</div>
              {[
                ['Basic Salary',  money(slipRec.basic_salary),  'pr-slip-line-val-green'],
                ['Allowances',    money(slipRec.allowances),    ''],
                ['Overtime Pay',  money(slipRec.overtime_pay),  ''],
              ].map(([k,v,cls]) => (
                <div key={k} className="pr-slip-line">
                  <span className="pr-slip-line-key">{k}</span>
                  <span className={`pr-slip-line-val ${cls}`}>{v}</span>
                </div>
              ))}
              <div className="pr-slip-line" style={{ fontWeight:900 }}>
                <span className="pr-slip-line-key">Gross Pay</span>
                <span className="pr-slip-line-val pr-slip-line-val-green">{money(slipRec.gross_pay || slipRec.basic_salary)}</span>
              </div>

              <div className="pr-slip-section-title">Deductions</div>
              {[
                ['Late Deduction',     money(slipRec.late_deduction),    'pr-slip-line-val-red'],
                ['Absence Deduction',  money(slipRec.absence_deduction), 'pr-slip-line-val-red'],
                ['Half-day Deduction', money(slipRec.half_day_deduction),'pr-slip-line-val-red'],
                ['Other Deductions',   money(slipRec.other_deductions),  'pr-slip-line-val-red'],
              ].map(([k,v,cls]) => (
                <div key={k} className="pr-slip-line">
                  <span className="pr-slip-line-key">{k}</span>
                  <span className={`pr-slip-line-val ${cls}`}>{v}</span>
                </div>
              ))}
              <div className="pr-slip-line" style={{ fontWeight:900 }}>
                <span className="pr-slip-line-key">Total Deductions</span>
                <span className="pr-slip-line-val pr-slip-line-val-red">{money(slipRec.total_deductions || slipRec.deductions)}</span>
              </div>

              <div className="pr-slip-total">
                <span className="pr-slip-total-label">NET SALARY</span>
                <span className="pr-slip-total-val">{money(slipRec.net_salary)}</span>
              </div>

              {slipRec.notes && (
                <div className="pr-slip-note">📝 {slipRec.notes}</div>
              )}

              <div className="pr-slip-footer">
                Generated by Spartan BTY MIS · {new Date().toLocaleDateString('en-PH')} · This is a computer-generated payslip.
              </div>
            </div>

            <button className="pr-slip-print-btn" onClick={() => printPayslip(slipRec)}>
  <FaPrint /> Print Payslip
</button>
            <button className="pr-modal-close" style={{ marginTop:8 }} onClick={() => setSlipRec(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Payroll;
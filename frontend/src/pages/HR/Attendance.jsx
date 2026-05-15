import { useState, useEffect, useMemo } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaCalendarCheck, FaPlus, FaTimes, FaSearch, FaSave,
  FaEdit, FaTrash, FaEye, FaUser, FaBuilding, FaCalendar,
  FaClock, FaStickyNote, FaFilter, FaChartBar,
} from "react-icons/fa";

const WORK_START = '09:00';

const STATUS_LIST   = ['present','absent','late','half-day','leave'];
const STATUS_STYLES = {
  present:   { backgroundColor:'#ecfdf3', color:'#2f7d56',  borderColor:'#2f9d6a' },
  absent:    { backgroundColor:'#fff1f5', color:'#b5536b',  borderColor:'#c4607a' },
  late:      { backgroundColor:'#fff7e8', color:'#9a5f0f',  borderColor:'#d98a1f' },
  'half-day':{ backgroundColor:'#f8f3f5', color:'#6b5b63',  borderColor:'#c9b6bf' },
  leave:     { backgroundColor:'#e8f4ff', color:'#1a5f9a',  borderColor:'#4a90d9' },
};

const NOTE_TEMPLATES = {
  present:   ['On time','Regular day','Overtime'],
  absent:    ['No call no show','Sick leave','Emergency leave','Approved absence'],
  late:      ['Traffic','Personal reason','Transportation issue'],
  'half-day':['AM half day','PM half day','Medical appointment'],
  leave:     ['Vacation leave','Sick leave','Emergency leave','Maternity/Paternity leave'],
};

const DEPARTMENTS = ['hr','marketing','sales','logistics','crm','inventory','admin'];

const fmt = (v='') => v.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' }) : '—';

const emptyForm = {
  employee_id:'', date:'', time_in:'', time_out:'',
  status:'present', remarks:'',
};

function Attendance() {
  const [attendance, setAttendance]   = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [todaySummary, setTodaySummary] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);

  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState(null);
  const [viewRec, setViewRec]         = useState(null);
  const [showMonthly, setShowMonthly] = useState(false);
  const [message, setMessage]         = useState('');
  const [isError, setIsError]         = useState(false);

  const [form, setForm]         = useState(emptyForm);
  const [editForm, setEditForm] = useState({});

  // filters
  const [search, setSearch]             = useState('');
  const [filterDate, setFilterDate]     = useState('');
  const [filterDept, setFilterDept]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmp, setFilterEmp]       = useState('');
  const [filterMonth, setFilterMonth]   = useState('');

  // monthly summary selectors
  const [sumYear, setSumYear]   = useState(String(new Date().getFullYear()));
  const [sumMonth, setSumMonth] = useState(String(new Date().getMonth() + 1).padStart(2,'0'));

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = () => {
    fetchAttendance(); fetchEmployees();
    fetchTodaySummary(); 
  };

  const fetchAttendance = async () => {
    setLoading(true); setFetchError(false);
    try { const r = await api.get('/hr/attendance'); setAttendance(r.data || []); }
    catch { setFetchError(true); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try { const r = await api.get('/hr/employees'); setEmployees((r.data||[]).filter(e=>e.status==='active')); }
    catch(e){ console.error(e); }
  };

  const fetchTodaySummary = async () => {
    try { const r = await api.get('/hr/attendance/summary/today'); setTodaySummary(r.data); }
    catch(e){ console.error(e); }
  };

  const fetchMonthlySummary = async () => {
    try {
      const r = await api.get(`/hr/attendance/monthly-summary?year=${sumYear}&month=${sumMonth}`);
      setMonthlySummary(r.data);
    } catch(e){ console.error(e); }
  };

  const notify = (msg, err=false) => {
    setMessage(msg); setIsError(err);
    setTimeout(() => setMessage(''), 3500);
  };

  const validateForm = (f) => {
    if (!f.employee_id) return 'Employee is required.';
    if (!f.date)        return 'Date is required.';
    if (!f.status)      return 'Status is required.';
    const needsTimeIn = ['present','late','half-day'].includes(f.status);
    if (needsTimeIn && !f.time_in) return `Time In is required for status "${fmt(f.status)}".`;
    if (f.time_in && f.time_out) {
      const [ih,im] = f.time_in.split(':').map(Number);
      const [oh,om] = f.time_out.split(':').map(Number);
      if ((oh*60+om) <= (ih*60+im)) return 'Time Out must be after Time In.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validateForm(form);
    if (err) return notify(err, true);
    try {
      const r = await api.post('/hr/attendance', form);
      notify(r.data.message || 'Attendance recorded!');
      setShowForm(false); setForm(emptyForm);
      fetchAttendance(); fetchTodaySummary();
    } catch(e) {
      notify(e.response?.data?.message || 'Error recording attendance.', true);
    }
  };

  const handleUpdate = async () => {
    if (editForm.time_in && editForm.time_out) {
      const [ih,im] = editForm.time_in.split(':').map(Number);
      const [oh,om] = editForm.time_out.split(':').map(Number);
      if ((oh*60+om) <= (ih*60+im)) return notify('Time Out must be after Time In.', true);
    }
    try {
      const r = await api.put(`/hr/attendance/${editId}`, editForm);
      notify(r.data.message || 'Attendance updated!');
      setEditId(null);
      fetchAttendance(); fetchTodaySummary();
    } catch(e) {
      notify(e.response?.data?.message || 'Error updating.', true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await api.delete(`/hr/attendance/${id}`);
      notify('Record deleted.');
      fetchAttendance(); fetchTodaySummary();
    } catch(e) {
      notify(e.response?.data?.message || 'Error deleting.', true);
    }
  };

  const clearFilters = () => {
    setSearch(''); setFilterDate(''); setFilterDept('');
    setFilterStatus(''); setFilterEmp(''); setFilterMonth('');
  };
  const hasFilters = search||filterDate||filterDept||filterStatus||filterEmp||filterMonth;

  const filtered = useMemo(() => attendance.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      String(a.full_name||'').toLowerCase().includes(q) ||
      String(a.department||'').toLowerCase().includes(q) ||
      String(a.status||'').toLowerCase().includes(q) ||
      String(a.remarks||'').toLowerCase().includes(q) ||
      String(a.emp_code||'').toLowerCase().includes(q);
    const matchDate   = !filterDate   || a.date === filterDate;
    const matchDept   = !filterDept   || a.department === filterDept;
    const matchStatus = !filterStatus || a.status === filterStatus;
    const matchEmp    = !filterEmp    || String(a.employee_id) === filterEmp;
    const matchMonth  = !filterMonth  || (a.date && a.date.slice(0,7) === filterMonth);
    return matchSearch && matchDate && matchDept && matchStatus && matchEmp && matchMonth;
  }), [attendance, search, filterDate, filterDept, filterStatus, filterEmp, filterMonth]);

  const previewLate = useMemo(() => {
    if (!form.time_in) return null;
    const [wh,wm] = WORK_START.split(':').map(Number);
    const [ih,im] = form.time_in.split(':').map(Number);
    const late = (ih*60+im) - (wh*60+wm);
    return late > 0 ? late : 0;
  }, [form.time_in]);

  return (
    <Layout>
      <style>{`
        .att-page { width:100%; max-width:100%; min-width:0; animation:attFadeUp 0.35s ease both; }

        /* HERO */
        .att-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .att-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .att-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .att-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .att-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }

        /* SUMMARY CARDS */
        .att-summary { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:12px; margin-bottom:20px; }
        .att-sum-card { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); position:relative; overflow:hidden; transition:all 180ms ease; }
        .att-sum-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .att-sum-card:hover { transform:translateY(-2px); border-color:#c4607a; }
        .att-sum-label { margin:0 0 8px; color:#64748b; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .att-sum-value { margin:0; color:#1f2937; font-size:22px; font-weight:850; letter-spacing:-.04em; }

        /* TOOLBAR */
        .att-toolbar { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; justify-content:space-between; align-items:center; gap:14px; }
        .att-search-wrap { position:relative; width:280px; max-width:100%; }
        .att-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b5536b; font-size:13px; pointer-events:none; }
        .att-search { width:100%; padding:11px 13px 11px 36px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; color:#1f2937; font-size:14px; outline:none; box-sizing:border-box; transition:all 180ms ease; }
        .att-search:focus { border-color:#c4607a; background:#fff; box-shadow:0 0 0 4px rgba(196,96,122,.12); }
        .att-toolbar-btns { display:flex; gap:10px; flex-shrink:0; }
        .att-add-btn,.att-submit-btn { border:none; border-radius:12px; padding:11px 16px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
        .att-add-btn:hover,.att-submit-btn:hover { transform:translateY(-1px); box-shadow:0 10px 22px rgba(196,96,122,.28); }
        .att-monthly-btn { border:1.5px solid #e2c6cf; border-radius:12px; padding:10px 14px; background:#fff; color:#64748b; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all 180ms ease; white-space:nowrap; }
        .att-monthly-btn:hover { border-color:#c4607a; color:#b5536b; }
        .att-cancel-btn { border:1px solid #d8b8c2; border-radius:12px; padding:11px 16px; background:#fff; color:#64748b; font-size:14px; font-weight:800; cursor:pointer; }

        /* FILTERS */
        .att-filters { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:14px 16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .att-filter-select,.att-filter-input { padding:9px 12px; border-radius:10px; border:1px solid #d8b8c2; background:#fff7fa; color:#374151; font-size:13px; font-weight:600; outline:none; cursor:pointer; transition:all 180ms ease; }
        .att-filter-select:focus,.att-filter-input:focus { border-color:#c4607a; box-shadow:0 0 0 3px rgba(196,96,122,.1); }
        .att-clear-btn { padding:9px 14px; border-radius:10px; border:1px solid #d8b8c2; background:#fff; color:#64748b; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 180ms ease; }
        .att-clear-btn:hover { border-color:#c4607a; color:#b5536b; }

        /* LATE WARNING */
        .att-late-warn { background:#fff7e8; border:1px solid #d98a1f; border-radius:10px; padding:8px 14px; font-size:12px; font-weight:700; color:#9a5f0f; margin-top:8px; }

        /* MESSAGE */
        .att-message { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .att-msg-ok  { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .att-msg-err { background:#fff1f5; color:#b5536b; border-color:#c4607a; }

        /* FORM */
        .att-form { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .att-form-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .att-form-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .att-form-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .att-form-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .att-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; margin-bottom:16px; }
        .att-field { display:flex; flex-direction:column; gap:7px; min-width:0; }
        .att-span-3 { grid-column:span 3; }
        .att-span-2 { grid-column:span 2; }
        .att-label { font-size:13px; font-weight:800; color:#374151; }
        .att-label-opt { font-size:11px; font-weight:400; color:#94a3b8; margin-left:4px; }
        .att-input { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .att-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .att-form-actions { display:flex; gap:10px; flex-wrap:wrap; }

        /* TABLE */
        .att-count { margin:0 0 12px; color:#64748b; font-size:13px; font-weight:700; }
        .att-table-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); overflow:hidden; }
        .att-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; border:1px solid #ead1d9; border-radius:14px; }
        .att-table { width:100%; min-width:1080px; border-collapse:collapse; background:#fff; }
        .att-table thead { background:#fff7fa; }
        .att-table th { padding:13px 16px; text-align:left; font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #ead1d9; white-space:nowrap; }
        .att-table td { padding:14px 16px; font-size:14px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; vertical-align:middle; }
        .att-table tbody tr:hover { background:#fff7fa; }
        .att-table tbody tr:last-child td { border-bottom:none; }
        .att-name { font-weight:850; color:#1f2937; }
        .att-sub { font-size:12px; color:#94a3b8; margin-top:2px; }
        .att-cell-icon { display:inline-flex; align-items:center; gap:7px; }
        .att-cell-icon svg { color:#b5536b; flex:0 0 auto; }
        .att-dept { text-transform:capitalize; font-weight:700; }
        .att-badge { display:inline-flex; align-items:center; justify-content:center; padding:5px 10px; border-radius:9999px; font-size:12px; font-weight:800; border:1px solid; white-space:nowrap; }
        .att-remark { display:inline-flex; max-width:200px; padding:5px 10px; border-radius:10px; background:#fff7fa; color:#64748b; border:1px solid #ead1d9; font-size:12px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .att-action-row { display:flex; gap:7px; }
        .att-btn { border-radius:10px; padding:8px 10px; cursor:pointer; font-size:12px; font-weight:800; display:inline-flex; align-items:center; gap:6px; border:1px solid; transition:all 180ms ease; }
        .att-btn:hover { transform:translateY(-1px); }
        .att-btn-view   { background:#e8f4ff; color:#1a5f9a; border-color:#4a90d9; }
        .att-btn-edit   { background:#fff7e8; color:#9a5f0f; border-color:#d98a1f; }
        .att-btn-delete { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .att-empty { padding:40px!important; text-align:center; color:#94a3b8!important; font-size:14px!important; font-weight:700; }
        .att-loading { padding:40px; text-align:center; color:#64748b; font-size:14px; font-weight:700; }
        .att-error  { padding:40px; text-align:center; color:#b5536b; font-size:14px; font-weight:700; background:#fff1f5; border-radius:14px; border:1px solid #c4607a; }

        /* MODAL */
        .att-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .att-modal { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:520px; box-shadow:0 20px 60px rgba(0,0,0,.2); max-height:90vh; overflow-y:auto; }
        .att-modal-lg { max-width:900px; }
        .att-modal-title { margin:0 0 20px; font-size:20px; font-weight:800; color:#1f2937; padding-bottom:14px; border-bottom:1px solid #f3e8ec; }
        .att-modal-row { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid #f3e8ec; font-size:13px; }
        .att-modal-row:last-of-type { border-bottom:none; }
        .att-modal-key { color:#64748b; font-weight:700; }
        .att-modal-val { color:#1f2937; font-weight:800; text-align:right; max-width:60%; }
        .att-modal-close { margin-top:20px; width:100%; padding:12px; border:none; border-radius:12px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; }

        /* MONTHLY SUMMARY TABLE */
        .att-monthly-controls { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:18px; }
        .att-monthly-table { width:100%; min-width:900px; border-collapse:collapse; }
        .att-monthly-table th { padding:11px 14px; text-align:left; font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #ead1d9; background:#fff7fa; white-space:nowrap; }
        .att-monthly-table td { padding:11px 14px; font-size:13px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; }
        .att-monthly-table tbody tr:hover { background:#fff7fa; }
        .att-monthly-table tbody tr:last-child td { border-bottom:none; }
        .att-rate-bar-wrap { width:80px; height:8px; background:#f3e8ec; border-radius:4px; display:inline-block; vertical-align:middle; margin-left:6px; }
        .att-rate-bar { height:8px; border-radius:4px; background:linear-gradient(90deg,#c4607a,#e58ca3); }

        @keyframes attFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width:1180px) { .att-summary { grid-template-columns:repeat(3,minmax(0,1fr)); } }
        @media (max-width:900px) {
          .att-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .att-span-3,.att-span-2 { grid-column:span 2; }
        }
        @media (max-width:768px) {
          .att-hero { align-items:flex-start; padding:20px; }
          .att-title { font-size:24px; }
          .att-hero-icon { width:48px; height:48px; font-size:20px; }
          .att-toolbar { flex-direction:column; align-items:stretch; }
          .att-toolbar-btns { flex-direction:column; }
          .att-search-wrap,.att-add-btn,.att-monthly-btn { width:100%; }
          .att-summary { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .att-filters { flex-direction:column; align-items:stretch; }
          .att-filter-select,.att-filter-input,.att-clear-btn { width:100%; }
          .att-grid { grid-template-columns:1fr; }
          .att-span-3,.att-span-2 { grid-column:span 1; }
          .att-form-actions { flex-direction:column; }
          .att-submit-btn,.att-cancel-btn { width:100%; }
          .att-table-panel { padding:12px; }
          .att-table { min-width:1000px; }
          .att-table th,.att-table td { padding:11px 12px; font-size:12px; }
        }
        @media (max-width:520px) {
          .att-hero { flex-direction:column-reverse; }
          .att-summary { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="att-page">

        {/* HERO */}
        <div className="att-hero">
          <div>
            <p className="att-eyebrow">Human Resources</p>
            <h3 className="att-title">Attendance Records</h3>
            <p className="att-subtitle">
              Record, track, and monitor daily employee attendance with time logs, status, and monthly summaries.
            </p>
          </div>
          <div className="att-hero-icon"><FaCalendarCheck /></div>
        </div>

        {/* TODAY SUMMARY CARDS */}
        {todaySummary && (
          <div className="att-summary">
            {[
              { label:'Total Active',    value: todaySummary.total_active },
              { label:'Present Today',   value: todaySummary.present,  color:'#2f7d56' },
              { label:'Late Today',      value: todaySummary.late,     color:'#9a5f0f' },
              { label:'Absent Today',    value: todaySummary.absent,   color:'#b5536b' },
              { label:'On Leave Today',  value: todaySummary.on_leave, color:'#1a5f9a' },
              { label:'Attendance Rate', value: `${todaySummary.rate}%`, color: todaySummary.rate >= 80 ? '#2f7d56' : '#b5536b' },
            ].map(c => (
              <div key={c.label} className="att-sum-card">
                <p className="att-sum-label">{c.label}</p>
                <p className="att-sum-value" style={c.color ? { color: c.color } : {}}>{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* TOOLBAR */}
        <div className="att-toolbar">
          <div className="att-search-wrap">
            <FaSearch className="att-search-icon" />
            <input type="text" placeholder="Search attendance..." value={search}
              onChange={e => setSearch(e.target.value)} className="att-search" />
          </div>
          <div className="att-toolbar-btns">
            <button className="att-monthly-btn" onClick={() => { setShowMonthly(true); fetchMonthlySummary(); }}>
              <FaChartBar /> Monthly Summary
            </button>
            <button className="att-add-btn" onClick={() => { setShowForm(!showForm); setEditId(null); }}>
              {showForm ? <FaTimes /> : <FaPlus />}
              {showForm ? 'Cancel' : 'Record Attendance'}
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="att-filters">
          <FaFilter style={{ color:'#b5536b', fontSize:13, flexShrink:0 }} />
          <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="att-filter-input" title="Filter by date" />
          <input type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="att-filter-input" title="Filter by month" />
          <select value={filterDept} onChange={e=>setFilterDept(e.target.value)} className="att-filter-select">
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d=><option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="att-filter-select">
            <option value="">All Statuses</option>
            {STATUS_LIST.map(s=><option key={s} value={s}>{fmt(s)}</option>)}
          </select>
          <select value={filterEmp} onChange={e=>setFilterEmp(e.target.value)} className="att-filter-select">
            <option value="">All Employees</option>
            {employees.map(e=><option key={e.id} value={String(e.id)}>{e.full_name}</option>)}
          </select>
          {hasFilters && (
            <button className="att-clear-btn" onClick={clearFilters}><FaTimes /> Clear</button>
          )}
        </div>

        {/* MESSAGE */}
        {message && (
          <div className={`att-message ${isError ? 'att-msg-err' : 'att-msg-ok'}`}>{message}</div>
        )}

        {/* CREATE FORM */}
        {showForm && (
          <div className="att-form">
            <div className="att-form-header">
              <div className="att-form-icon"><FaPlus /></div>
              <div>
                <h4 className="att-form-title">Record Attendance</h4>
                <p className="att-form-note">Select employee, date, status, and time logs. Work start time: 09:00 AM.</p>
              </div>
            </div>
            <div className="att-grid">
              <div className="att-field">
                <label className="att-label">Employee *</label>
                <select value={form.employee_id} onChange={e=>setForm({...form,employee_id:e.target.value})} className="att-input">
                  <option value="">Select active employee</option>
                  {employees.map(e=><option key={e.id} value={e.id}>{e.full_name} — {e.department}</option>)}
                </select>
              </div>
              <div className="att-field">
                <label className="att-label">Date *</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="att-input" />
              </div>
              <div className="att-field">
                <label className="att-label">Status *</label>
                <select value={form.status} onChange={e=>setForm({...form,status:e.target.value,remarks:''})} className="att-input">
                  {STATUS_LIST.map(s=><option key={s} value={s}>{fmt(s)}</option>)}
                </select>
              </div>

              {['present','late','half-day'].includes(form.status) && (
                <>
                  <div className="att-field">
                    <label className="att-label">Time In *</label>
                    <input type="time" value={form.time_in} onChange={e=>setForm({...form,time_in:e.target.value})} className="att-input" />
                    {previewLate > 0 && (
                      <div className="att-late-warn">⚠️ {previewLate} minute{previewLate!==1?'s':''} late — status will auto-adjust to Late</div>
                    )}
                  </div>
                  <div className="att-field">
                    <label className="att-label">Time Out <span className="att-label-opt">optional</span></label>
                    <input type="time" value={form.time_out} onChange={e=>setForm({...form,time_out:e.target.value})} className="att-input" />
                  </div>
                </>
              )}

              <div className="att-field">
                <label className="att-label">Quick Note <span className="att-label-opt">optional</span></label>
                <select value="" onChange={e=>setForm({...form,remarks:e.target.value})} className="att-input">
                  <option value="">Select a note</option>
                  {(NOTE_TEMPLATES[form.status]||[]).map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div className="att-field att-span-3">
                <label className="att-label">Custom Remarks <span className="att-label-opt">optional</span></label>
                <input type="text" placeholder="Or type a custom note..." value={form.remarks}
                  onChange={e=>setForm({...form,remarks:e.target.value})} className="att-input" />
              </div>
            </div>
            <button onClick={handleSubmit} className="att-submit-btn"><FaSave /> Save Attendance</button>
          </div>
        )}

        {/* EDIT FORM */}
        {editId && (
          <div className="att-form">
            <div className="att-form-header">
              <div className="att-form-icon"><FaEdit /></div>
              <div>
                <h4 className="att-form-title">Edit Attendance</h4>
                <p className="att-form-note">Update time logs, status, and remarks.</p>
              </div>
            </div>
            <div className="att-grid">
              <div className="att-field">
                <label className="att-label">Status *</label>
                <select value={editForm.status||'present'} onChange={e=>setEditForm({...editForm,status:e.target.value})} className="att-input">
                  {STATUS_LIST.map(s=><option key={s} value={s}>{fmt(s)}</option>)}
                </select>
              </div>
              <div className="att-field">
                <label className="att-label">Time In</label>
                <input type="time" value={editForm.time_in||''} onChange={e=>setEditForm({...editForm,time_in:e.target.value})} className="att-input" />
              </div>
              <div className="att-field">
                <label className="att-label">Time Out</label>
                <input type="time" value={editForm.time_out||''} onChange={e=>setEditForm({...editForm,time_out:e.target.value})} className="att-input" />
              </div>
              <div className="att-field">
                <label className="att-label">Quick Note</label>
                <select value="" onChange={e=>setEditForm({...editForm,remarks:e.target.value})} className="att-input">
                  <option value="">Select quick note</option>
                  {(NOTE_TEMPLATES[editForm.status]||[]).map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="att-field att-span-2">
                <label className="att-label">Remarks</label>
                <input type="text" placeholder="Custom remarks" value={editForm.remarks||''}
                  onChange={e=>setEditForm({...editForm,remarks:e.target.value})} className="att-input" />
              </div>
            </div>
            <div className="att-form-actions">
              <button onClick={handleUpdate} className="att-submit-btn"><FaSave /> Save Changes</button>
              <button onClick={()=>setEditId(null)} className="att-cancel-btn">Cancel</button>
            </div>
          </div>
        )}

        <p className="att-count">{filtered.length} record{filtered.length!==1?'s':''} found</p>

        {/* TABLE */}
        <div className="att-table-panel">
          {loading ? (
            <div className="att-loading">⏳ Loading attendance records...</div>
          ) : fetchError ? (
            <div className="att-error">⚠️ Failed to load records. Please refresh.</div>
          ) : (
            <div className="att-table-wrap">
              <table className="att-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Dept / Position</th>
                    <th>Date</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Hours</th>
                    <th>Late (min)</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="att-empty">
                        {hasFilters ? '🔍 No records match your filters.' : '📋 No attendance records yet.'}
                      </td>
                    </tr>
                  ) : filtered.map(rec => (
                    <tr key={rec.id}>
                      <td>
                        <div className="att-cell-icon">
                          <FaUser />
                          <div>
                            <div className="att-name">{rec.full_name||'N/A'}</div>
                            <div className="att-sub">{rec.emp_code}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="att-dept"><FaBuilding style={{color:'#b5536b',marginRight:6}}/>{rec.department||'N/A'}</div>
                        <div className="att-sub">{rec.position||''}</div>
                      </td>
                      <td><span className="att-cell-icon"><FaCalendar />{fmtDate(rec.date)}</span></td>
                      <td><span className="att-cell-icon"><FaClock />{fmtTime(rec.time_in)}</span></td>
                      <td><span className="att-cell-icon"><FaClock />{fmtTime(rec.time_out)}</span></td>
                      <td>{rec.total_hours ? `${rec.total_hours}h` : '—'}</td>
                      <td>
                        {rec.late_minutes > 0 ? (
                          <span style={{color:'#9a5f0f',fontWeight:800}}>{rec.late_minutes} min</span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className="att-badge" style={STATUS_STYLES[rec.status]||STATUS_STYLES.present}>
                          {fmt(rec.status)}
                        </span>
                      </td>
                      <td>
                        {rec.remarks
                          ? <span className="att-remark"><FaStickyNote style={{marginRight:5,color:'#b5536b'}}/>{rec.remarks}</span>
                          : '—'}
                      </td>
                      <td>
                        <div className="att-action-row">
                          <button className="att-btn att-btn-view" onClick={()=>setViewRec(rec)}><FaEye /> View</button>
                          <button className="att-btn att-btn-edit" onClick={()=>{
                            setEditId(rec.id);
                            setEditForm({ time_in:rec.time_in||'', time_out:rec.time_out||'', status:rec.status||'present', remarks:rec.remarks||'' });
                            setShowForm(false);
                          }}><FaEdit /> Edit</button>
                          <button className="att-btn att-btn-delete" onClick={()=>handleDelete(rec.id)}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewRec && (
        <div className="att-modal-overlay" onClick={()=>setViewRec(null)}>
          <div className="att-modal" onClick={e=>e.stopPropagation()}>
            <h3 className="att-modal-title">Attendance Details</h3>
            {[
              ['Employee ID',  viewRec.emp_code||'—'],
              ['Full Name',    viewRec.full_name||'—'],
              ['Department',   viewRec.department||'—'],
              ['Position',     viewRec.position||'—'],
              ['Date',         fmtDate(viewRec.date)],
              ['Time In',      fmtTime(viewRec.time_in)],
              ['Time Out',     fmtTime(viewRec.time_out)],
              ['Total Hours',  viewRec.total_hours ? `${viewRec.total_hours} hours` : '—'],
              ['Late Minutes', viewRec.late_minutes > 0 ? `${viewRec.late_minutes} minutes` : 'None'],
              ['Status',       fmt(viewRec.status)],
              ['Remarks',      viewRec.remarks||'—'],
              ['Recorded At',  viewRec.created_at ? new Date(viewRec.created_at).toLocaleString() : '—'],
              ['Updated At',   viewRec.updated_at ? new Date(viewRec.updated_at).toLocaleString() : '—'],
            ].map(([k,v])=>(
              <div key={k} className="att-modal-row">
                <span className="att-modal-key">{k}</span>
                <span className="att-modal-val">{v}</span>
              </div>
            ))}
            <button className="att-modal-close" onClick={()=>setViewRec(null)}>Close</button>
          </div>
        </div>
      )}

      {/* MONTHLY SUMMARY MODAL */}
      {showMonthly && (
        <div className="att-modal-overlay" onClick={()=>setShowMonthly(false)}>
          <div className="att-modal att-modal-lg" onClick={e=>e.stopPropagation()}>
            <h3 className="att-modal-title">Monthly Attendance Summary</h3>

            <div className="att-monthly-controls">
              <input type="number" value={sumYear} onChange={e=>setSumYear(e.target.value)}
                min="2020" max="2099" style={{width:90,padding:'9px 12px',borderRadius:10,border:'1px solid #d8b8c2',fontSize:14,outline:'none'}} />
              <select value={sumMonth} onChange={e=>setSumMonth(e.target.value)}
                style={{padding:'9px 12px',borderRadius:10,border:'1px solid #d8b8c2',fontSize:14,outline:'none',background:'#fff7fa'}}>
                {Array.from({length:12},(_,i)=>{
                  const m = String(i+1).padStart(2,'0');
                  return <option key={m} value={m}>{new Date(2000,i).toLocaleString('en',{month:'long'})}</option>;
                })}
              </select>
              <button onClick={fetchMonthlySummary} className="att-submit-btn" style={{padding:'9px 16px',fontSize:13}}>
                Load
              </button>
              {monthlySummary && (
                <span style={{fontSize:12,color:'#64748b',fontWeight:700}}>
                  Working Days: <strong>{monthlySummary.working_days}</strong>
                </span>
              )}
            </div>

            {monthlySummary ? (
              <div style={{overflowX:'auto',borderRadius:14,border:'1px solid #ead1d9'}}>
                <table className="att-monthly-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Dept</th>
                      <th>Present</th>
                      <th>Late</th>
                      <th>Absent</th>
                      <th>Leave</th>
                      <th>Half Day</th>
                      <th>Total Hours</th>
                      <th>Late Hrs</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummary.employees.length === 0 ? (
                      <tr><td colSpan="10" className="att-empty">No data for this period.</td></tr>
                    ) : monthlySummary.employees.map(e=>(
                      <tr key={e.id}>
                        <td>
                          <div style={{fontWeight:850,color:'#1f2937'}}>{e.full_name}</div>
                          <div style={{fontSize:12,color:'#94a3b8'}}>{e.emp_code}</div>
                        </td>
                        <td style={{textTransform:'capitalize'}}>{e.department||'—'}</td>
                        <td style={{color:'#2f7d56',fontWeight:800}}>{e.days_present||0}</td>
                        <td style={{color:'#9a5f0f',fontWeight:800}}>{e.days_late||0}</td>
                        <td style={{color:'#b5536b',fontWeight:800}}>{e.days_absent||0}</td>
                        <td style={{color:'#1a5f9a',fontWeight:800}}>{e.days_leave||0}</td>
                        <td>{e.days_half||0}</td>
                        <td>{e.total_hours||0}h</td>
                        <td>{e.total_late_hours||0}h</td>
                        <td>
                          <span style={{fontWeight:800,color: e.attendance_rate>=80?'#2f7d56':'#b5536b'}}>
                            {e.attendance_rate}%
                          </span>
                          <span className="att-rate-bar-wrap">
                            <span className="att-rate-bar" style={{width:`${Math.min(e.attendance_rate,100)}%`,background:e.attendance_rate>=80?'linear-gradient(90deg,#2f9d6a,#52c99b)':'linear-gradient(90deg,#c4607a,#e58ca3)'}} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="att-loading">Click Load to fetch summary.</div>
            )}

            <button className="att-modal-close" onClick={()=>setShowMonthly(false)}>Close</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Attendance;
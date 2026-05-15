import { useState, useEffect, useMemo } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaUsers, FaPlus, FaTimes, FaSearch, FaSave,
  FaEdit, FaArchive, FaEye, FaUser, FaEnvelope,
  FaPhone, FaBuilding, FaBriefcase, FaMoneyBillWave,
  FaIdBadge, FaCalendar, FaFilter, FaTimes as FaClear,
} from "react-icons/fa";

const DEPARTMENT_POSITIONS = {
  hr:        ["HR Assistant", "Recruiter", "HR Manager"],
  marketing: ["Content Creator", "Graphic Designer", "Marketing Manager", "Video Editor"],
  sales:     ["Sales Associate", "Sales Supervisor", "Sales Manager"],
  logistics: ["Logistics Coordinator", "Delivery Staff", "Warehouse Staff"],
  crm:       ["CRM Specialist", "Customer Support", "CRM Manager"],
  inventory: ["Inventory Staff", "Stock Controller", "Inventory Manager"],
  admin:     ["Admin Assistant", "Office Manager"],
};

const DEPARTMENTS = Object.keys(DEPARTMENT_POSITIONS);

const STATUS_STYLES = {
  active:     { backgroundColor: '#ecfdf3', color: '#2f7d56',  borderColor: '#2f9d6a' },
  inactive:   { backgroundColor: '#fff1f5', color: '#b5536b',  borderColor: '#c4607a' },
  resigned:   { backgroundColor: '#fff7e8', color: '#9a5f0f',  borderColor: '#d98a1f' },
  terminated: { backgroundColor: '#f8f3f5', color: '#6b5b63',  borderColor: '#c9b6bf' },
};

const formatDept = (d) => d ? d.charAt(0).toUpperCase() + d.slice(1) : 'N/A';
const formatText = (v) => v ? String(v).replaceAll('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'N/A';
const formatMoney = (v) => `₱${Number(v || 0).toLocaleString()}`;

const validateForm = (form) => {
  if (!form.full_name?.trim()) return 'Full name is required.';
  if (!form.email?.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email format.';
  if (form.phone && !/^09\d{9}$/.test(form.phone)) return 'Phone must follow 09XXXXXXXXX format (e.g. 09171234567).';
  if (!form.department) return 'Department is required.';
  if (!form.position) return 'Position is required.';
  if (!form.employment_type) return 'Employment type is required.';
  if (!form.date_hired) return 'Date hired is required.';
  if (!form.salary || Number(form.salary) <= 0) return 'Salary must be a positive number.';
  return null;
};

const emptyForm = {
  employee_id: '', full_name: '', email: '', phone: '',
  department: 'hr', position: '', employment_type: 'full-time',
  date_hired: '', salary: '',
};

function Employees() {
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [viewEmp, setViewEmp]     = useState(null);
  const [message, setMessage]     = useState('');
  const [isError, setIsError]     = useState(false);

  const [form, setForm]         = useState(emptyForm);
  const [editForm, setEditForm] = useState({});

  const [search, setSearch]                   = useState('');
  const [filterDept, setFilterDept]           = useState('');
  const [filterType, setFilterType]           = useState('');
  const [filterStatus, setFilterStatus]       = useState('');
  const [filterPosition, setFilterPosition]   = useState('');

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    setLoading(true); setFetchError(false);
    try {
      const res = await api.get('/hr/employees');
      setEmployees(res.data || []);
    } catch { setFetchError(true); }
    finally { setLoading(false); }
  };

  const nextEmployeeId = useMemo(() => {
    if (!employees.length) return 'EMP-001';
    const max = employees.reduce((m, e) => {
      const match = String(e.employee_id || '').match(/EMP-(\d+)/i);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > m ? n : m;
    }, 0);
    return `EMP-${String(max + 1).padStart(3, '0')}`;
  }, [employees]);

  const notify = (msg, err = false) => {
    setMessage(msg); setIsError(err);
    setTimeout(() => setMessage(''), 3500);
  };

  const clearFilters = () => {
    setSearch(''); setFilterDept('');
    setFilterType(''); setFilterStatus(''); setFilterPosition('');
  };

  const hasFilters = search || filterDept || filterType || filterStatus || filterPosition;

  const handleOpenForm = () => {
    if (!showForm) setForm({ ...emptyForm, employee_id: nextEmployeeId });
    setShowForm(!showForm);
    setEditId(null);
  };

  const handleSubmit = async () => {
    const err = validateForm(form);
    if (err) return notify(err, true);
    try {
      await api.post('/hr/employees', { ...form, employee_id: nextEmployeeId });
      notify('Employee added successfully!');
      setShowForm(false); setForm(emptyForm);
      fetchEmployees();
    } catch (e) {
      notify(e.response?.data?.message || 'Error adding employee.', true);
    }
  };

  const handleUpdate = async () => {
    const err = validateForm(editForm);
    if (err) return notify(err, true);
    try {
      await api.put(`/hr/employees/${editId}`, editForm);
      notify('Employee updated successfully!');
      setEditId(null);
      fetchEmployees();
    } catch (e) {
      notify(e.response?.data?.message || 'Error updating employee.', true);
    }
  };

  const handleArchive = async (emp) => {
    if (!window.confirm(`Archive "${emp.full_name}"? Their status will be set to Inactive.`)) return;
    try {
      await api.put(`/hr/employees/${emp.id}/archive`);
      notify(`${emp.full_name} has been archived.`);
      fetchEmployees();
    } catch (e) {
      notify(e.response?.data?.message || 'Error archiving employee.', true);
    }
  };

  // summary computed from employees array
  const summary = useMemo(() => ({
    total:      employees.length,
    active:     employees.filter(e => e.status === 'active').length,
    inactive:   employees.filter(e => e.status !== 'active').length,
    fullTime:   employees.filter(e => e.employment_type === 'full-time').length,
    partTime:   employees.filter(e => e.employment_type !== 'full-time').length,
    payroll:    employees.filter(e => e.status === 'active').reduce((s, e) => s + Number(e.salary || 0), 0),
  }), [employees]);

  const filtered = employees.filter(emp => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      String(emp.employee_id||'').toLowerCase().includes(q) ||
      String(emp.full_name||'').toLowerCase().includes(q) ||
      String(emp.email||'').toLowerCase().includes(q) ||
      String(emp.department||'').toLowerCase().includes(q) ||
      String(emp.position||'').toLowerCase().includes(q) ||
      String(emp.status||'').toLowerCase().includes(q);
    const matchDept     = !filterDept     || emp.department      === filterDept;
    const matchType     = !filterType     || emp.employment_type === filterType;
    const matchStatus   = !filterStatus   || emp.status          === filterStatus;
    const matchPosition = !filterPosition || emp.position        === filterPosition;
    return matchSearch && matchDept && matchType && matchStatus && matchPosition;
  });

  const allPositions = [...new Set(employees.map(e => e.position).filter(Boolean))];

  return (
    <Layout>
      <style>{`
        .emp-page { width:100%; max-width:100%; min-width:0; animation:empFadeUp 0.35s ease both; }

        /* HERO */
        .emp-hero { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .emp-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .emp-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .emp-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .emp-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }

        /* SUMMARY */
        .emp-summary { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:12px; margin-bottom:20px; }
        .emp-summary-card { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); position:relative; overflow:hidden; transition:all 180ms ease; }
        .emp-summary-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .emp-summary-card:hover { transform:translateY(-2px); border-color:#c4607a; }
        .emp-summary-label { margin:0 0 8px; color:#64748b; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .emp-summary-value { margin:0; color:#1f2937; font-size:20px; font-weight:850; letter-spacing:-.04em; }

        /* TOOLBAR */
        .emp-toolbar { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; justify-content:space-between; align-items:center; gap:14px; }
        .emp-search-wrap { position:relative; width:280px; max-width:100%; }
        .emp-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b5536b; font-size:13px; pointer-events:none; }
        .emp-search { width:100%; padding:11px 13px 11px 36px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; color:#1f2937; font-size:14px; outline:none; box-sizing:border-box; transition:all 180ms ease; }
        .emp-search:focus { border-color:#c4607a; background:#fff; box-shadow:0 0 0 4px rgba(196,96,122,.12); }
        .emp-add-btn,.emp-submit-btn { border:none; border-radius:12px; padding:11px 16px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
        .emp-add-btn:hover,.emp-submit-btn:hover { transform:translateY(-1px); box-shadow:0 10px 22px rgba(196,96,122,.28); }
        .emp-cancel-btn { border:1px solid #d8b8c2; border-radius:12px; padding:11px 16px; background:#fff; color:#64748b; font-size:14px; font-weight:800; cursor:pointer; }

        /* FILTERS */
        .emp-filters { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:14px 16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .emp-filter-select { padding:9px 12px; border-radius:10px; border:1px solid #d8b8c2; background:#fff7fa; color:#374151; font-size:13px; font-weight:600; outline:none; cursor:pointer; transition:all 180ms ease; }
        .emp-filter-select:focus { border-color:#c4607a; box-shadow:0 0 0 3px rgba(196,96,122,.1); }
        .emp-clear-btn { padding:9px 14px; border-radius:10px; border:1px solid #d8b8c2; background:#fff; color:#64748b; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 180ms ease; white-space:nowrap; }
        .emp-clear-btn:hover { border-color:#c4607a; color:#b5536b; }

        /* MESSAGE */
        .emp-message { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .emp-msg-ok  { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .emp-msg-err { background:#fff1f5; color:#b5536b; border-color:#c4607a; }

        /* FORM */
        .emp-form { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .emp-form-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .emp-form-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .emp-form-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .emp-form-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .emp-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; margin-bottom:16px; }
        .emp-field { display:flex; flex-direction:column; gap:7px; min-width:0; }
        .emp-label { font-size:13px; font-weight:800; color:#374151; }
        .emp-input { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .emp-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .emp-auto-code { min-height:43px; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff7fa; box-sizing:border-box; }
        .emp-auto-code-text { font-size:15px; font-weight:900; color:#b5536b; letter-spacing:.8px; }
        .emp-auto-code-badge { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:10px; font-weight:900; padding:4px 8px; border-radius:9999px; }
        .emp-form-actions { display:flex; gap:10px; flex-wrap:wrap; }

        /* TABLE */
        .emp-count { margin:0 0 12px; color:#64748b; font-size:13px; font-weight:700; }
        .emp-table-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); overflow:hidden; }
        .emp-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; border:1px solid #ead1d9; border-radius:14px; }
        .emp-table { width:100%; min-width:1060px; border-collapse:collapse; background:#fff; }
        .emp-table thead { background:#fff7fa; }
        .emp-table th { padding:13px 16px; text-align:left; font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #ead1d9; white-space:nowrap; }
        .emp-table td { padding:14px 16px; font-size:14px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; vertical-align:middle; }
        .emp-table tbody tr:hover { background:#fff7fa; }
        .emp-table tbody tr:last-child td { border-bottom:none; }
        .emp-id { color:#64748b; font-size:13px; font-weight:850; }
        .emp-name { font-weight:850; color:#1f2937; }
        .emp-email { font-size:12px; color:#94a3b8; margin-top:3px; }
        .emp-cell-icon { display:inline-flex; align-items:center; gap:7px; }
        .emp-cell-icon svg { color:#b5536b; flex:0 0 auto; }
        .emp-dept-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:9999px; font-size:12px; font-weight:800; border:1px solid; background:#fff1f5; color:#b5536b; border-color:#e8b9c6; }
        .emp-status-badge { display:inline-flex; align-items:center; justify-content:center; padding:6px 10px; border-radius:9999px; font-size:12px; font-weight:800; border:1px solid; white-space:nowrap; }
        .emp-action-row { display:flex; gap:7px; align-items:center; flex-wrap:wrap; }
        .emp-btn { border-radius:10px; padding:8px 10px; cursor:pointer; font-size:12px; font-weight:800; display:inline-flex; align-items:center; gap:6px; border:1px solid; transition:all 180ms ease; }
        .emp-btn:hover { transform:translateY(-1px); }
        .emp-btn-view    { background:#e8f4ff; color:#1a5f9a; border-color:#4a90d9; }
        .emp-btn-edit    { background:#fff7e8; color:#9a5f0f; border-color:#d98a1f; }
        .emp-btn-archive { background:#fff1f5; color:#b5536b; border-color:#c4607a; }
        .emp-empty { padding:40px!important; text-align:center; color:#94a3b8!important; font-size:14px!important; font-weight:700; }
        .emp-loading { padding:40px; text-align:center; color:#64748b; font-size:14px; font-weight:700; }
        .emp-error { padding:40px; text-align:center; color:#b5536b; font-size:14px; font-weight:700; background:#fff1f5; border-radius:14px; border:1px solid #c4607a; }

        /* MODAL */
        .emp-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .emp-modal { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:560px; box-shadow:0 20px 60px rgba(0,0,0,.2); max-height:90vh; overflow-y:auto; }
        .emp-modal-header { display:flex; align-items:center; gap:14px; margin-bottom:22px; padding-bottom:16px; border-bottom:1px solid #f3e8ec; }
        .emp-modal-avatar { width:52px; height:52px; border-radius:16px; background:linear-gradient(135deg,#c4607a,#e58ca3); display:grid; place-items:center; color:#fff; font-size:22px; flex-shrink:0; }
        .emp-modal-name { margin:0; font-size:18px; font-weight:800; color:#1f2937; }
        .emp-modal-id { margin:4px 0 0; font-size:12px; color:#b5536b; font-weight:700; }
        .emp-modal-row { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid #f3e8ec; font-size:13px; }
        .emp-modal-row:last-of-type { border-bottom:none; }
        .emp-modal-key { color:#64748b; font-weight:700; }
        .emp-modal-val { color:#1f2937; font-weight:800; text-align:right; max-width:55%; }
        .emp-modal-close { margin-top:20px; width:100%; padding:12px; border:none; border-radius:12px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; }

        @keyframes empFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width:1180px) {
          .emp-summary { grid-template-columns:repeat(3,minmax(0,1fr)); }
          .emp-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
        @media (max-width:768px) {
          .emp-hero { align-items:flex-start; padding:20px; }
          .emp-title { font-size:24px; }
          .emp-hero-icon { width:48px; height:48px; font-size:20px; }
          .emp-toolbar { flex-direction:column; align-items:stretch; }
          .emp-search-wrap,.emp-add-btn { width:100%; }
          .emp-summary { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .emp-filters { flex-direction:column; align-items:stretch; }
          .emp-filter-select,.emp-clear-btn { width:100%; }
          .emp-grid { grid-template-columns:1fr; }
          .emp-form-actions { flex-direction:column; }
          .emp-submit-btn,.emp-cancel-btn { width:100%; }
          .emp-table-panel { padding:12px; }
          .emp-table { min-width:980px; }
          .emp-table th,.emp-table td { padding:11px 12px; font-size:12px; }
        }
        @media (max-width:520px) {
          .emp-hero { flex-direction:column-reverse; }
          .emp-summary { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="emp-page">

        {/* HERO */}
        <div className="emp-hero">
          <div>
            <p className="emp-eyebrow">Human Resources</p>
            <h3 className="emp-title">Employee Management</h3>
            <p className="emp-subtitle">
              Manage employee records, departments, roles, employment type, salary, and active status.
            </p>
          </div>
          <div className="emp-hero-icon"><FaUsers /></div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="emp-summary">
          {[
            { label: 'Total Employees',      value: summary.total },
            { label: 'Active',               value: summary.active },
            { label: 'Inactive / Others',    value: summary.inactive },
            { label: 'Full-Time',            value: summary.fullTime },
            { label: 'Part-Time / Contract', value: summary.partTime },
            { label: 'Monthly Payroll',      value: `₱${summary.payroll.toLocaleString()}`, small: true },
          ].map(c => (
            <div key={c.label} className="emp-summary-card">
              <p className="emp-summary-label">{c.label}</p>
              <p className="emp-summary-value" style={c.small ? { fontSize: 14 } : {}}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="emp-toolbar">
          <div className="emp-search-wrap">
            <FaSearch className="emp-search-icon" />
            <input type="text" placeholder="Search employees..." value={search}
              onChange={e => setSearch(e.target.value)} className="emp-search" />
          </div>
          <button onClick={handleOpenForm} className="emp-add-btn">
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'Add Employee'}
          </button>
        </div>

        {/* FILTERS */}
        <div className="emp-filters">
          <FaFilter style={{ color: '#b5536b', fontSize: 13, flexShrink: 0 }} />
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="emp-filter-select">
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{formatDept(d)}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="emp-filter-select">
            <option value="">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contractual">Contractual</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="emp-filter-select">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
          </select>
          <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)} className="emp-filter-select">
            <option value="">All Positions</option>
            {allPositions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {hasFilters && (
            <button className="emp-clear-btn" onClick={clearFilters}>
              <FaClear /> Clear Filters
            </button>
          )}
        </div>

        {/* MESSAGE */}
        {message && (
          <div className={`emp-message ${isError ? 'emp-msg-err' : 'emp-msg-ok'}`}>{message}</div>
        )}

        {/* CREATE FORM */}
        {showForm && (
          <div className="emp-form">
            <div className="emp-form-header">
              <div className="emp-form-icon"><FaPlus /></div>
              <div>
                <h4 className="emp-form-title">Add New Employee</h4>
                <p className="emp-form-note">Fill in all required fields. Employee ID is auto-generated.</p>
              </div>
            </div>
            <div className="emp-grid">
              <div className="emp-field">
                <label className="emp-label">Employee ID</label>
                <div className="emp-auto-code">
                  <span className="emp-auto-code-text">{nextEmployeeId}</span>
                  <span className="emp-auto-code-badge">AUTO</span>
                </div>
              </div>
              <div className="emp-field">
                <label className="emp-label">Full Name *</label>
                <input type="text" placeholder="Full name" value={form.full_name}
                  onChange={e => setForm({...form, full_name: e.target.value})} className="emp-input" />
              </div>
              <div className="emp-field">
                <label className="emp-label">Email *</label>
                <input type="email" placeholder="Email address" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})} className="emp-input" />
              </div>
              <div className="emp-field">
                <label className="emp-label">Phone</label>
                <input type="text" placeholder="09XXXXXXXXX" value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})} className="emp-input" />
              </div>
              <div className="emp-field">
                <label className="emp-label">Department *</label>
                <select value={form.department} onChange={e => setForm({...form, department: e.target.value, position: ''})} className="emp-input">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{formatDept(d)}</option>)}
                </select>
              </div>
              <div className="emp-field">
                <label className="emp-label">Position *</label>
                <select value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="emp-input">
                  <option value="">Select Position</option>
                  {(DEPARTMENT_POSITIONS[form.department]||[]).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="emp-field">
                  <label className="emp-label">Employment Type *</label>
                 <select value={editForm.employment_type||'full-time'} onChange={e => setEditForm({...editForm, employment_type: e.target.value})} className="emp-input">
                 <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contractual">Contractual</option>
                  </select>
                    </div>

<div className="emp-field">
  <label className="emp-label">Date Hired *</label>
  <input type="date" value={editForm.date_hired||''}
    onChange={e => setEditForm({...editForm, date_hired: e.target.value})}
    className="emp-input" />
</div>
              <div className="emp-field">
                <label className="emp-label">Date Hired *</label>
                <input type="date" value={form.date_hired}
                  onChange={e => setForm({...form, date_hired: e.target.value})} className="emp-input" />
              </div>
              <div className="emp-field">
                <label className="emp-label">Monthly Salary *</label>
                <input type="number" placeholder="0" value={form.salary} min="1"
                  onChange={e => setForm({...form, salary: e.target.value})} className="emp-input" />
              </div>
            </div>
            <button onClick={handleSubmit} className="emp-submit-btn"><FaSave /> Save Employee</button>
          </div>
        )}

        {/* EDIT FORM */}
        {editId && (
          <div className="emp-form">
            <div className="emp-form-header">
              <div className="emp-form-icon"><FaEdit /></div>
              <div>
                <h4 className="emp-form-title">Edit Employee</h4>
                <p className="emp-form-note">Update employee information, department, position, salary, and status.</p>
              </div>
            </div>
            <div className="emp-grid">
              <div className="emp-field">
                <label className="emp-label">Full Name *</label>
                <input type="text" value={editForm.full_name||''}
                  onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="emp-input" />
              </div>
              <div className="emp-field">
                <label className="emp-label">Email *</label>
                <input type="email" value={editForm.email||''}
                  onChange={e => setEditForm({...editForm, email: e.target.value})} className="emp-input" />
              </div>
              <div className="emp-field">
                <label className="emp-label">Phone</label>
                <input type="text" placeholder="09XXXXXXXXX" value={editForm.phone||''}
                  onChange={e => setEditForm({...editForm, phone: e.target.value})} className="emp-input" />
              </div>
              <div className="emp-field">
                <label className="emp-label">Department *</label>
                <select value={editForm.department||'hr'} onChange={e => setEditForm({...editForm, department: e.target.value, position: ''})} className="emp-input">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{formatDept(d)}</option>)}
                </select>
              </div>
              <div className="emp-field">
                <label className="emp-label">Position *</label>
                <select value={editForm.position||''} onChange={e => setEditForm({...editForm, position: e.target.value})} className="emp-input">
                  <option value="">Select Position</option>
                  {(DEPARTMENT_POSITIONS[editForm.department]||[]).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="emp-field">
                <label className="emp-label">Employment Type *</label>
                <select value={editForm.employment_type||'full-time'} onChange={e => setEditForm({...editForm, employment_type: e.target.value})} className="emp-input">
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contractual">Contractual</option>
                </select>
              </div>
              <div className="emp-field">
                <label className="emp-label">Monthly Salary *</label>
                <input type="number" value={editForm.salary||''} min="1"
                  onChange={e => setEditForm({...editForm, salary: e.target.value})} className="emp-input" />
              </div>
              <div className="emp-field">
                <label className="emp-label">Status</label>
                <select value={editForm.status||'active'} onChange={e => setEditForm({...editForm, status: e.target.value})} className="emp-input">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="resigned">Resigned</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
            <div className="emp-form-actions">
              <button onClick={handleUpdate} className="emp-submit-btn"><FaSave /> Save Changes</button>
              <button onClick={() => setEditId(null)} className="emp-cancel-btn">Cancel</button>
            </div>
          </div>
        )}

        <p className="emp-count">{filtered.length} employee{filtered.length !== 1 ? 's' : ''} found</p>

        {/* TABLE */}
        <div className="emp-table-panel">
          {loading ? (
            <div className="emp-loading">⏳ Loading employees...</div>
          ) : fetchError ? (
            <div className="emp-error">⚠️ Failed to load employees. Please refresh the page.</div>
          ) : (
            <div className="emp-table-wrap">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Type</th>
                    <th>Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="emp-empty">
                        {hasFilters ? '🔍 No employees match your filters. Try clearing them.' : '👤 No employees found. Add your first employee above.'}
                      </td>
                    </tr>
                  ) : filtered.map(emp => (
                    <tr key={emp.id}>
                      <td className="emp-id">
                        <span className="emp-cell-icon"><FaIdBadge />{emp.employee_id || 'N/A'}</span>
                      </td>
                      <td>
                        <div className="emp-cell-icon">
                          <FaUser />
                          <div>
                            <div className="emp-name">{emp.full_name || 'N/A'}</div>
                            <div className="emp-email"><FaEnvelope style={{marginRight:4}}/>{emp.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="emp-dept-badge"><FaBuilding />{formatDept(emp.department)}</span>
                      </td>
                      <td><span className="emp-cell-icon"><FaBriefcase />{emp.position || 'N/A'}</span></td>
                      <td>{formatText(emp.employment_type)}</td>
                      <td><span className="emp-cell-icon"><FaMoneyBillWave />{formatMoney(emp.salary)}</span></td>
                      <td>
                        <span className="emp-status-badge" style={STATUS_STYLES[emp.status] || STATUS_STYLES.inactive}>
                          {formatText(emp.status || 'inactive')}
                        </span>
                      </td>
                      <td>
                        <div className="emp-action-row">
                          <button className="emp-btn emp-btn-view" onClick={() => setViewEmp(emp)}>
                            <FaEye /> View
                          </button>
                          <button className="emp-btn emp-btn-edit" onClick={() => {
                            setEditId(emp.id);
                            setEditForm({
                              full_name: emp.full_name||'', email: emp.email||'',
                              phone: emp.phone||'', department: emp.department||'hr',
                              position: emp.position||'', employment_type: emp.employment_type||'full-time',
                              salary: emp.salary||'', status: emp.status||'active',
                              date_hired: emp.date_hired ? emp.date_hired.slice(0,10) : '',
                            });
                            setShowForm(false);
                          }}>
                            <FaEdit /> Edit
                          </button>
                          <button className="emp-btn emp-btn-archive" onClick={() => handleArchive(emp)}>
                            <FaArchive /> Archive
                          </button>
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
      {viewEmp && (
        <div className="emp-modal-overlay" onClick={() => setViewEmp(null)}>
          <div className="emp-modal" onClick={e => e.stopPropagation()}>
            <div className="emp-modal-header">
              <div className="emp-modal-avatar"><FaUser /></div>
              <div>
                <p className="emp-modal-name">{viewEmp.full_name}</p>
                <p className="emp-modal-id">🪪 {viewEmp.employee_id}</p>
              </div>
              <span className="emp-status-badge" style={{...STATUS_STYLES[viewEmp.status]||STATUS_STYLES.inactive, marginLeft:'auto', flexShrink:0}}>
                {formatText(viewEmp.status)}
              </span>
            </div>

            {[
              ['Email',           viewEmp.email || '—'],
              ['Phone',           viewEmp.phone || '—'],
              ['Department',      formatDept(viewEmp.department)],
              ['Position',        viewEmp.position || '—'],
              ['Employment Type', formatText(viewEmp.employment_type)],
              ['Date Hired',      viewEmp.date_hired ? new Date(viewEmp.date_hired).toLocaleDateString('en-PH', {year:'numeric',month:'long',day:'numeric'}) : '—'],
              ['Monthly Salary',  formatMoney(viewEmp.salary)],
              ['Date Added',      viewEmp.created_at ? new Date(viewEmp.created_at).toLocaleDateString() : '—'],
              ['Last Updated',    viewEmp.updated_at ? new Date(viewEmp.updated_at).toLocaleDateString() : '—'],
              ['Archived At',     viewEmp.archived_at ? new Date(viewEmp.archived_at).toLocaleString() : '—'],
            ].map(([k, v]) => (
              <div key={k} className="emp-modal-row">
                <span className="emp-modal-key">{k}</span>
                <span className="emp-modal-val">{v}</span>
              </div>
            ))}

            <button className="emp-modal-close" onClick={() => setViewEmp(null)}>Close</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Employees;
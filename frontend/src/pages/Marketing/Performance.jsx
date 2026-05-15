import { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import {
  FaEye, FaMousePointer, FaCheck, FaMoneyCheckAlt,
  FaChartLine, FaPlus, FaTimes, FaSearch, FaSave,
  FaFileImport, FaLink, FaSync, FaTrash, FaEdit,
  FaTiktok, FaFacebook, FaShopify, FaBroadcastTower,
  FaHistory, FaCheckCircle, FaTimesCircle, FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";

const TABS = ['Overview', 'Ad Performance', 'Connected Accounts', 'Import CSV', 'Sync History'];

const PLATFORMS = ['TikTok Ads', 'TikTok Shop', 'Shopee Ads', 'Meta Ads'];

const platformIcon = (p = '') => {
  const pl = p.toLowerCase();
  if (pl.includes('tiktok'))   return <FaTiktok />;
  if (pl.includes('shopee'))   return <FaShopify />;
  if (pl.includes('meta') || pl.includes('facebook')) return <FaFacebook />;
  return <FaBroadcastTower />;
};

const safe = (n) => Number(n) || 0;
const pct  = (n) => `${safe(n).toFixed(2)}%`;
const money= (n) => `₱${safe(n).toLocaleString()}`;
const num  = (n) => safe(n).toLocaleString();

function Performance() {
  const [activeTab, setActiveTab] = useState('Overview');

  // ── data ──
  const [performance, setPerformance]   = useState([]);
  const [campaigns, setCampaigns]       = useState([]);
  const [summary, setSummary]           = useState(null);
  const [accounts, setAccounts]         = useState([]);
  const [syncLogs, setSyncLogs]         = useState([]);

  // ── UI state ──
  const [showForm, setShowForm]         = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [message, setMessage]           = useState('');
  const [isError, setIsError]           = useState(false);
  const [csvFile, setCsvFile]           = useState(null);
  const [csvPlatform, setCsvPlatform]   = useState('');
  const [csvCampaign, setCsvCampaign]   = useState('');
  const [syncingId, setSyncingId]       = useState(null);
  const fileRef = useRef();

  // ── filters ──
  const [search, setSearch]             = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]     = useState('');

  // ── forms ──
  const emptyForm = {
    campaign_id: '', platform: '', date: '',
    impressions: '', reach: '', views: '', clicks: '',
    conversions: '', orders: '', revenue: '', spend: '',
    source_type: 'manual', content_type: '', notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const emptyConnect = { platform: 'TikTok Ads', account_name: '', external_account_id: '', connected_by: '' };
  const [connectForm, setConnectForm] = useState(emptyConnect);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = () => {
    fetchPerformance();
    fetchCampaigns();
    fetchSummary();
    fetchAccounts();
    fetchSyncLogs();
  };

  const fetchPerformance = async () => {
    try { const r = await api.get('/marketing/performance'); setPerformance(r.data); }
    catch (e) { console.error(e); }
  };
  const fetchCampaigns = async () => {
    try { const r = await api.get('/marketing/campaigns'); setCampaigns(r.data); }
    catch (e) { console.error(e); }
  };
  const fetchSummary = async () => {
    try { const r = await api.get('/marketing/performance/summary'); setSummary(r.data); }
    catch (e) { console.error(e); }
  };
  const fetchAccounts = async () => {
    try { const r = await api.get('/marketing/platform-accounts'); setAccounts(r.data); }
    catch (e) { console.error(e); }
  };
  const fetchSyncLogs = async () => {
    try { const r = await api.get('/marketing/performance/sync-logs'); setSyncLogs(r.data); }
    catch (e) { console.error(e); }
  };

  const notify = (msg, err = false) => {
    setMessage(msg); setIsError(err);
    setTimeout(() => setMessage(''), 3500);
  };

  const handleSubmit = async () => {
    try {
      await api.post('/marketing/performance', form);
      notify('Performance data saved!');
      setShowForm(false);
      setForm(emptyForm);
      fetchPerformance(); fetchSummary();
    } catch { notify('Error saving data.', true); }
  };

  const handleConnect = async () => {
    try {
      await api.post('/marketing/platform-accounts', connectForm);
      notify('Account connected!');
      setShowConnectModal(false);
      setConnectForm(emptyConnect);
      fetchAccounts();
    } catch { notify('Error connecting account.', true); }
  };

  const handleDisconnect = async (id) => {
    if (!window.confirm('Disconnect this account?')) return;
    try {
      await api.delete(`/marketing/platform-accounts/${id}`);
      notify('Account disconnected.');
      fetchAccounts();
    } catch { notify('Error.', true); }
  };

  const handleSync = async (account) => {
    setSyncingId(account.id);
    try {
      const r = await api.post(`/marketing/performance/sync/${encodeURIComponent(account.platform)}`, {
        account_id: account.id,
        synced_by: account.connected_by,
      });
      notify(r.data.message);
      fetchSyncLogs();
    } catch { notify('Sync request failed.', true); }
    finally { setSyncingId(null); }
  };

  const handleCSVImport = async () => {
    if (!csvFile) { notify('Please select a CSV file.', true); return; }
    try {
      const r = await api.post('/marketing/performance/import-csv', {});
      notify(r.data.message);
    } catch { notify('Import failed.', true); }
  };

  // ── filtered performance ──
  const filtered = performance.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.campaign_title?.toLowerCase().includes(q) ||
      p.platform?.toLowerCase().includes(q);
    const matchPlatform  = !filterPlatform  || p.platform === filterPlatform;
    const matchSource    = !filterSource    || p.source_type === filterSource;
    const matchCampaign  = !filterCampaign  || String(p.campaign_id) === filterCampaign;
    const matchFrom      = !filterDateFrom  || p.date >= filterDateFrom;
    const matchTo        = !filterDateTo    || p.date <= filterDateTo;
    return matchSearch && matchPlatform && matchSource && matchCampaign && matchFrom && matchTo;
  });

  const statusIcon = (s) => {
    if (s === 'connected') return <FaCheckCircle style={{ color: '#2f9d6a' }} />;
    if (s === 'error')     return <FaTimesCircle style={{ color: '#c4607a' }} />;
    if (s === 'pending')   return <FaClock style={{ color: '#d98a1f' }} />;
    return <FaTimesCircle style={{ color: '#94a3b8' }} />;
  };

  const syncStatusColor = { success: '#2f9d6a', failed: '#c4607a', partial: '#d98a1f', pending: '#64748b' };

  return (
    <Layout>
      <style>{`
        .perf-page { width:100%; max-width:100%; min-width:0; animation:perfFadeUp 0.35s ease both; }

        /* HERO */
        .perf-hero { background: radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%), linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .perf-eyebrow { margin:0 0 8px; color:#b5536b; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .perf-title { margin:0; color:#1f2937; font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .perf-subtitle { margin:8px 0 0; color:#64748b; font-size:14px; line-height:1.6; max-width:720px; }
        .perf-hero-icon { width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(196,96,122,.25); flex:0 0 auto; }

        /* TABS */
        .perf-tabs { display:flex; gap:4px; background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:6px; margin-bottom:20px; overflow-x:auto; -webkit-overflow-scrolling:touch; flex-wrap:nowrap; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .perf-tab { flex-shrink:0; padding:9px 18px; border-radius:12px; border:none; background:transparent; color:#64748b; font-size:13px; font-weight:700; cursor:pointer; transition:all 180ms ease; white-space:nowrap; }
        .perf-tab:hover { background:#fff7fa; color:#b5536b; }
        .perf-tab.active { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; box-shadow:0 4px 12px rgba(196,96,122,.25); }

        /* ACTION BAR */
        .perf-actions { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:18px; }
        .perf-btn { border:none; border-radius:12px; padding:10px 16px; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all 180ms ease; white-space:nowrap; }
        .perf-btn-primary { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; box-shadow:0 6px 16px rgba(196,96,122,.22); }
        .perf-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 20px rgba(196,96,122,.28); }
        .perf-btn-outline { background:#fff; color:#b5536b; border:1.5px solid #e2c6cf; }
        .perf-btn-outline:hover { border-color:#c4607a; background:#fff7fa; }
        .perf-btn-dark { background:#1f2937; color:#fff; }
        .perf-btn-dark:hover { background:#374151; transform:translateY(-1px); }
        .perf-btn-sm { padding:7px 12px; font-size:12px; }

        /* MESSAGE */
        .perf-message { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .perf-msg-ok  { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .perf-msg-err { background:#fff1f5; color:#b5536b; border-color:#c4607a; }

        /* SUMMARY CARDS */
        .perf-summary { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; margin-bottom:20px; }
        .perf-summary-card { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); position:relative; overflow:hidden; transition:all 180ms ease; }
        .perf-summary-card::before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#c4607a,#e58ca3); }
        .perf-summary-card:hover { transform:translateY(-2px); border-color:#c4607a; }
        .perf-summary-top { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
        .perf-summary-label { margin:0; color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .perf-summary-icon { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; color:#b5536b; background:#fff1f5; border:1px solid #e8b9c6; font-size:15px; flex:0 0 auto; }
        .perf-summary-value { margin:0; color:#1f2937; font-size:20px; font-weight:850; letter-spacing:-.04em; }
        .perf-summary-helper { margin:5px 0 0; color:#7b8794; font-size:11px; }

        /* FORM */
        .perf-form { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .perf-form-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .perf-form-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .perf-form-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .perf-form-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .perf-form-section { font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#b5536b; grid-column:span 3; margin:8px 0 -4px; padding-bottom:8px; border-bottom:1px solid #f3e8ec; }
        .perf-form-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:16px; }
        .perf-field { display:flex; flex-direction:column; gap:6px; }
        .perf-label { font-size:13px; font-weight:800; color:#374151; }
        .perf-label-opt { font-size:11px; font-weight:400; color:#94a3b8; margin-left:4px; }
        .perf-input { width:100%; box-sizing:border-box; padding:10px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .perf-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .perf-span-2 { grid-column:span 2; }
        .perf-span-3 { grid-column:span 3; }

        /* FILTERS */
        .perf-filters { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
        .perf-filters-full { grid-template-columns:repeat(3,minmax(0,1fr)); }

        /* TABLE */
        .perf-result-count { margin:0 0 10px; color:#64748b; font-size:13px; font-weight:700; }
        .perf-table-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); overflow:hidden; }
        .perf-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; border:1px solid #ead1d9; border-radius:14px; }
        .perf-table { width:100%; min-width:1400px; border-collapse:collapse; background:#fff; }
        .perf-table thead { background:#fff7fa; }
        .perf-table th { padding:12px 14px; text-align:left; font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #ead1d9; white-space:nowrap; }
        .perf-table td { padding:12px 14px; font-size:13px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; vertical-align:middle; }
        .perf-table tbody tr:hover { background:#fff7fa; }
        .perf-table tbody tr:last-child td { border-bottom:none; }
        .perf-campaign-name { font-weight:800; color:#1f2937; }
        .perf-platform-pill { display:inline-flex; align-items:center; gap:6px; padding:5px 9px; border-radius:9999px; background:#fff1f5; color:#b5536b; border:1px solid #e8b9c6; font-size:11px; font-weight:800; }
        .perf-source-pill { display:inline-flex; align-items:center; padding:4px 8px; border-radius:9999px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
        .perf-source-manual   { background:#fff7e8; color:#9a5f0f; border:1px solid #d98a1f; }
        .perf-source-csv      { background:#e8f4ff; color:#1a5f9a; border:1px solid #4a90d9; }
        .perf-source-api      { background:#ecfdf3; color:#2f7d56; border:1px solid #2f9d6a; }
        .perf-money { font-weight:850; color:#b5536b; }
        .perf-empty { padding:40px!important; text-align:center; color:#94a3b8!important; font-size:14px!important; font-weight:700; }

        /* ACCOUNTS */
        .perf-accounts-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
        .perf-account-card { background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); transition:all 180ms ease; }
        .perf-account-card:hover { border-color:#c4607a; transform:translateY(-2px); box-shadow:0 6px 18px rgba(196,96,122,.1); }
        .perf-account-header { display:flex; align-items:center; gap:14px; margin-bottom:16px; }
        .perf-account-icon { width:48px; height:48px; border-radius:14px; display:grid; place-items:center; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:22px; flex:0 0 auto; }
        .perf-account-name { margin:0; font-size:16px; font-weight:800; color:#1f2937; }
        .perf-account-sub { margin:3px 0 0; font-size:12px; color:#64748b; }
        .perf-status-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:800; }
        .perf-status-connected   { background:#ecfdf3; color:#2f7d56; border:1px solid #2f9d6a; }
        .perf-status-pending     { background:#fff7e8; color:#9a5f0f; border:1px solid #d98a1f; }
        .perf-status-disconnected{ background:#f8f3f5; color:#6b5b63; border:1px solid #c9b6bf; }
        .perf-status-error       { background:#fff1f5; color:#b5536b; border:1px solid #c4607a; }
        .perf-account-meta { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; font-size:12px; color:#64748b; }
        .perf-account-meta strong { color:#374151; }
        .perf-account-actions { display:flex; gap:8px; flex-wrap:wrap; }

        /* MODAL */
        .perf-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .perf-modal { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:480px; box-shadow:0 20px 60px rgba(0,0,0,.2); }
        .perf-modal-title { margin:0 0 6px; font-size:20px; font-weight:800; color:#1f2937; }
        .perf-modal-sub { margin:0 0 22px; font-size:13px; color:#64748b; }
        .perf-modal-actions { display:flex; gap:10px; margin-top:22px; }

        /* CSV */
        .perf-csv-box { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .perf-csv-dropzone { border:2px dashed #d8b8c2; border-radius:14px; padding:40px 20px; text-align:center; color:#94a3b8; cursor:pointer; transition:all 180ms ease; margin:16px 0; }
        .perf-csv-dropzone:hover { border-color:#c4607a; background:#fff7fa; color:#b5536b; }
        .perf-csv-dropzone svg { font-size:32px; margin-bottom:12px; display:block; margin-inline:auto; }
        .perf-csv-notice { background:#fff7e8; border:1px solid #d98a1f; border-radius:12px; padding:14px 16px; font-size:13px; color:#9a5f0f; margin-top:16px; line-height:1.7; }

        /* SYNC LOGS */
        .perf-sync-table { width:100%; min-width:900px; border-collapse:collapse; background:#fff; }
        .perf-sync-table th { padding:12px 14px; font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #ead1d9; background:#fff7fa; white-space:nowrap; }
        .perf-sync-table td { padding:12px 14px; font-size:13px; color:#374151; border-bottom:1px solid #f3e8ec; white-space:nowrap; }
        .perf-sync-table tbody tr:hover { background:#fff7fa; }
        .perf-sync-table tbody tr:last-child td { border-bottom:none; }

        @keyframes perfFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width:1180px) {
          .perf-summary { grid-template-columns:repeat(3,minmax(0,1fr)); }
          .perf-form-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .perf-span-3,.perf-form-section { grid-column:span 2; }
          .perf-filters { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
        @media (max-width:768px) {
          .perf-hero { align-items:flex-start; padding:20px; }
          .perf-title { font-size:22px; }
          .perf-summary { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .perf-form-grid { grid-template-columns:1fr; }
          .perf-span-2,.perf-span-3,.perf-form-section { grid-column:span 1; }
          .perf-filters { grid-template-columns:1fr; }
          .perf-accounts-grid { grid-template-columns:1fr; }
          .perf-actions { flex-direction:column; }
          .perf-btn { width:100%; justify-content:center; }
        }
        @media (max-width:520px) {
          .perf-hero { flex-direction:column-reverse; }
          .perf-summary { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="perf-page">

        {/* HERO */}
        <div className="perf-hero">
          <div>
            <p className="perf-eyebrow">Marketing Analytics</p>
            <h3 className="perf-title">Performance Analytics Hub</h3>
            <p className="perf-subtitle">
              Track, import, and sync campaign performance from manual entry, CSV reports, and connected marketing accounts.
            </p>
          </div>
          <div className="perf-hero-icon"><FaChartLine /></div>
        </div>

        {/* TABS */}
        <div className="perf-tabs">
          {TABS.map(t => (
            <button key={t} className={`perf-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {/* MESSAGE */}
        {message && (
          <div className={`perf-message ${isError ? 'perf-msg-err' : 'perf-msg-ok'}`}>{message}</div>
        )}

        {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
        {activeTab === 'Overview' && (
          <>
            <div className="perf-summary">
              {[
                { label: 'Impressions',   value: num(summary?.total_impressions),  icon: <FaEye />,           helper: 'Total campaign views' },
                { label: 'Total Reach',   value: num(summary?.total_reach),         icon: <FaBroadcastTower />,helper: 'Unique audience reached' },
                { label: 'Total Views',   value: num(summary?.total_views),         icon: <FaEye />,           helper: 'Video/content views' },
                { label: 'Total Clicks',  value: num(summary?.total_clicks),        icon: <FaMousePointer />,  helper: 'Engagement actions' },
                { label: 'Overall CTR',   value: pct(summary?.overall_ctr),         icon: <FaChartLine />,     helper: 'Click-through rate' },
                { label: 'Total Spend',   value: money(summary?.total_spend),       icon: <FaMoneyCheckAlt />, helper: 'Marketing spend total' },
                { label: 'Conversions',   value: num(summary?.total_conversions),   icon: <FaCheck />,         helper: 'Successful outcomes' },
                { label: 'Overall ROAS',  value: `${safe(summary?.overall_roas).toFixed(2)}x`, icon: <FaChartLine />, helper: 'Return on ad spend' },
                { label: 'Top Platform',  value: summary?.top_platform || '—',      icon: <FaBroadcastTower />,helper: 'By impressions' },
                { label: 'Best Campaign', value: summary?.best_campaign || '—',     icon: <FaCheck />,         helper: 'By revenue' },
              ].map(c => (
                <div key={c.label} className="perf-summary-card">
                  <div className="perf-summary-top">
                    <p className="perf-summary-label">{c.label}</p>
                    <span className="perf-summary-icon">{c.icon}</span>
                  </div>
                  <p className="perf-summary-value" style={{ fontSize: c.value.length > 10 ? '14px' : undefined }}>{c.value}</p>
                  <p className="perf-summary-helper">{c.helper}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="perf-actions">
              <button className="perf-btn perf-btn-primary" onClick={() => { setActiveTab('Ad Performance'); setShowForm(true); }}>
                <FaPlus /> Log Manual Data
              </button>
              <button className="perf-btn perf-btn-outline" onClick={() => setActiveTab('Import CSV')}>
                <FaFileImport /> Import CSV Report
              </button>
              <button className="perf-btn perf-btn-dark" onClick={() => setActiveTab('Connected Accounts')}>
                <FaLink /> Connect Marketing Account
              </button>
            </div>
          </>
        )}

        {/* ── AD PERFORMANCE TAB ───────────────────────────────────── */}
        {activeTab === 'Ad Performance' && (
          <>
            <div className="perf-actions">
              <button className="perf-btn perf-btn-primary" onClick={() => setShowForm(!showForm)}>
                {showForm ? <FaTimes /> : <FaPlus />}
                {showForm ? 'Cancel' : 'Log Manual Data'}
              </button>
            </div>

            {/* MANUAL FORM */}
            {showForm && (
              <div className="perf-form">
                <div className="perf-form-header">
                  <div className="perf-form-icon"><FaChartLine /></div>
                  <div>
                    <h4 className="perf-form-title">Log Performance Data</h4>
                    <p className="perf-form-note">Manually enter campaign metrics for reporting.</p>
                  </div>
                </div>

                <div className="perf-form-grid">
                  <div className="perf-form-section">Campaign Info</div>

                  <div className="perf-field">
                    <label className="perf-label">Campaign</label>
                    <select value={form.campaign_id} onChange={e => setForm({...form, campaign_id: e.target.value})} className="perf-input">
                      <option value="">Select campaign</option>
                      {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>

                  <div className="perf-field">
                    <label className="perf-label">Platform</label>
                    <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} className="perf-input">
                      <option value="">Select platform</option>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="perf-field">
                    <label className="perf-label">Date</label>
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="perf-input" />
                  </div>

                  <div className="perf-form-section">Reach & Engagement</div>

                  <div className="perf-field">
                    <label className="perf-label">Impressions</label>
                    <input type="number" placeholder="0" value={form.impressions} onChange={e => setForm({...form, impressions: e.target.value})} className="perf-input" />
                  </div>
                  <div className="perf-field">
                    <label className="perf-label">Reach <span className="perf-label-opt">optional</span></label>
                    <input type="number" placeholder="0" value={form.reach} onChange={e => setForm({...form, reach: e.target.value})} className="perf-input" />
                  </div>
                  <div className="perf-field">
                    <label className="perf-label">Views <span className="perf-label-opt">optional</span></label>
                    <input type="number" placeholder="0" value={form.views} onChange={e => setForm({...form, views: e.target.value})} className="perf-input" />
                  </div>
                  <div className="perf-field">
                    <label className="perf-label">Clicks</label>
                    <input type="number" placeholder="0" value={form.clicks} onChange={e => setForm({...form, clicks: e.target.value})} className="perf-input" />
                  </div>
                  <div className="perf-field">
                    <label className="perf-label">Conversions</label>
                    <input type="number" placeholder="0" value={form.conversions} onChange={e => setForm({...form, conversions: e.target.value})} className="perf-input" />
                  </div>
                  <div className="perf-field">
                    <label className="perf-label">Orders <span className="perf-label-opt">optional</span></label>
                    <input type="number" placeholder="0" value={form.orders} onChange={e => setForm({...form, orders: e.target.value})} className="perf-input" />
                  </div>

                  <div className="perf-form-section">Financials</div>

                  <div className="perf-field">
                    <label className="perf-label">Spend (₱)</label>
                    <input type="number" placeholder="0.00" value={form.spend} onChange={e => setForm({...form, spend: e.target.value})} className="perf-input" />
                  </div>
                  <div className="perf-field">
                    <label className="perf-label">Revenue (₱) <span className="perf-label-opt">optional</span></label>
                    <input type="number" placeholder="0.00" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} className="perf-input" />
                  </div>
                  <div className="perf-field">
                    <label className="perf-label">Content Type <span className="perf-label-opt">optional</span></label>
                    <input type="text" placeholder="e.g. Reel, Story, Post" value={form.content_type} onChange={e => setForm({...form, content_type: e.target.value})} className="perf-input" />
                  </div>

                  <div className="perf-field perf-span-3">
                    <label className="perf-label">Notes <span className="perf-label-opt">optional</span></label>
                    <input type="text" placeholder="Optional notes..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="perf-input" />
                  </div>
                </div>

                <button onClick={handleSubmit} className="perf-btn perf-btn-primary"><FaSave /> Save Performance</button>
              </div>
            )}

            {/* FILTERS */}
            <div className="perf-filters">
              <div style={{ position: 'relative' }}>
                <FaSearch style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#b5536b', fontSize:13, pointerEvents:'none' }} />
                <input type="text" placeholder="Search campaign or platform..." value={search} onChange={e => setSearch(e.target.value)} className="perf-input" style={{ paddingLeft: 36 }} />
              </div>
              <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="perf-input">
                <option value="">All Platforms</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="perf-input">
                <option value="">All Sources</option>
                <option value="manual">Manual</option>
                <option value="csv_import">CSV Import</option>
                <option value="api_sync">API Sync</option>
              </select>
              <select value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)} className="perf-input">
                <option value="">All Campaigns</option>
                {campaigns.map(c => <option key={c.id} value={String(c.id)}>{c.title}</option>)}
              </select>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="perf-input" title="Date from" />
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="perf-input" title="Date to" />
            </div>

            <p className="perf-result-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</p>

            <div className="perf-table-panel">
              <div className="perf-table-wrap">
                <table className="perf-table">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Platform</th>
                      <th>Source</th>
                      <th>Date</th>
                      <th>Reach</th>
                      <th>Views</th>
                      <th>Impressions</th>
                      <th>Clicks</th>
                      <th>CTR</th>
                      <th>CPC</th>
                      <th>CPM</th>
                      <th>Conversions</th>
                      <th>Conv. Rate</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                      <th>Spend</th>
                      <th>ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan="17" className="perf-empty">No performance data found.</td></tr>
                    ) : filtered.map(p => (
                      <tr key={p.id}>
                        <td className="perf-campaign-name">{p.campaign_title}</td>
                        <td><span className="perf-platform-pill">{platformIcon(p.platform)} {p.platform}</span></td>
                        <td>
                          <span className={`perf-source-pill perf-source-${p.source_type === 'csv_import' ? 'csv' : p.source_type === 'api_sync' ? 'api' : 'manual'}`}>
                            {p.source_type === 'csv_import' ? 'CSV' : p.source_type === 'api_sync' ? 'API' : 'Manual'}
                          </span>
                        </td>
                        <td>{new Date(p.date).toLocaleDateString()}</td>
                        <td>{num(p.reach)}</td>
                        <td>{num(p.views)}</td>
                        <td>{num(p.impressions)}</td>
                        <td>{num(p.clicks)}</td>
                        <td>{pct(p.ctr)}</td>
                        <td className="perf-money">{p.cpc > 0 ? money(p.cpc) : '—'}</td>
                        <td className="perf-money">{p.cpm > 0 ? money(p.cpm) : '—'}</td>
                        <td>{num(p.conversions)}</td>
                        <td>{pct(p.conversion_rate)}</td>
                        <td>{num(p.orders)}</td>
                        <td className="perf-money">{p.revenue > 0 ? money(p.revenue) : '—'}</td>
                        <td className="perf-money">{money(p.spend)}</td>
                        <td>{p.roas > 0 ? `${safe(p.roas).toFixed(2)}x` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── CONNECTED ACCOUNTS TAB ───────────────────────────────── */}
        {activeTab === 'Connected Accounts' && (
          <>
            <div className="perf-actions">
              <button className="perf-btn perf-btn-primary" onClick={() => setShowConnectModal(true)}>
                <FaLink /> Connect Account
              </button>
            </div>

            {accounts.length === 0 ? (
              <div style={{ background:'#fff', border:'1px solid #e2c6cf', borderRadius:18, padding:'48px 24px', textAlign:'center', color:'#94a3b8', boxShadow:'0 2px 8px rgba(0,0,0,.05)' }}>
                <FaLink style={{ fontSize:36, marginBottom:12, color:'#e2c6cf' }} />
                <p style={{ margin:0, fontSize:14, fontWeight:700 }}>No accounts connected yet.</p>
                <p style={{ margin:'6px 0 0', fontSize:13 }}>Connect your TikTok, Shopee, or Meta accounts to sync performance data.</p>
              </div>
            ) : (
              <div className="perf-accounts-grid">
                {accounts.map(acc => (
                  <div key={acc.id} className="perf-account-card">
                    <div className="perf-account-header">
                      <div className="perf-account-icon">{platformIcon(acc.platform)}</div>
                      <div style={{ flex: 1 }}>
                        <p className="perf-account-name">{acc.platform}</p>
                        <p className="perf-account-sub">{acc.account_name}</p>
                      </div>
                      <span className={`perf-status-badge perf-status-${acc.status}`}>
                        {statusIcon(acc.status)} {acc.status}
                      </span>
                    </div>

                    <div className="perf-account-meta">
                      <div><strong>Connected by:</strong><br />{acc.connected_by || '—'}</div>
                      <div><strong>Last synced:</strong><br />{acc.last_synced_at ? new Date(acc.last_synced_at).toLocaleString() : 'Never'}</div>
                      <div><strong>Account ID:</strong><br />{acc.external_account_id || '—'}</div>
                      <div><strong>Added:</strong><br />{new Date(acc.created_at).toLocaleDateString()}</div>
                    </div>

                    <div className="perf-account-actions">
                      <button
                        className="perf-btn perf-btn-primary perf-btn-sm"
                        onClick={() => handleSync(acc)}
                        disabled={syncingId === acc.id}
                      >
                        <FaSync style={{ animation: syncingId === acc.id ? 'spin 1s linear infinite' : 'none' }} />
                        {syncingId === acc.id ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button className="perf-btn perf-btn-outline perf-btn-sm" onClick={() => { setActiveTab('Ad Performance'); }}>
                        <FaChartLine /> View Metrics
                      </button>
                      <button className="perf-btn perf-btn-sm" style={{ background:'#fff1f5', color:'#b5536b', border:'1px solid #e2c6cf' }} onClick={() => handleDisconnect(acc.id)}>
                        <FaTrash /> Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── IMPORT CSV TAB ───────────────────────────────────────── */}
        {activeTab === 'Import CSV' && (
          <div className="perf-csv-box">
            <div className="perf-form-header">
              <div className="perf-form-icon"><FaFileImport /></div>
              <div>
                <h4 className="perf-form-title">Import CSV Report</h4>
                <p className="perf-form-note">Upload a CSV export from TikTok Ads, Shopee, or Meta to bulk-import performance data.</p>
              </div>
            </div>

            <div className="perf-form-grid" style={{ marginBottom: 0 }}>
              <div className="perf-field">
                <label className="perf-label">Platform</label>
                <select value={csvPlatform} onChange={e => setCsvPlatform(e.target.value)} className="perf-input">
                  <option value="">Select platform</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="perf-field">
                <label className="perf-label">Campaign <span className="perf-label-opt">optional</span></label>
                <select value={csvCampaign} onChange={e => setCsvCampaign(e.target.value)} className="perf-input">
                  <option value="">Select campaign</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>

            <div className="perf-csv-dropzone" onClick={() => fileRef.current?.click()}>
              <FaFileImport />
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 15 }}>
                {csvFile ? csvFile.name : 'Click to upload CSV file'}
              </p>
              <p style={{ margin: 0, fontSize: 12 }}>Supports .csv files exported from TikTok Ads Manager, Shopee Ads, or Meta Ads Manager</p>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => setCsvFile(e.target.files[0])} />
            </div>

            <button className="perf-btn perf-btn-primary" onClick={handleCSVImport}>
              <FaFileImport /> Import Data
            </button>

            <div className="perf-csv-notice">
              <strong>📋 Expected CSV columns:</strong><br />
              campaign_id, platform, date, impressions, reach, views, clicks, conversions, orders, revenue, spend, notes<br /><br />
              <strong>ℹ️ Note:</strong> Full CSV parsing is coming in the next phase. The import endpoint and UI structure are ready. Calculated fields (CTR, CPC, CPM, ROAS) will be computed automatically on import.
            </div>
          </div>
        )}

        {/* ── SYNC HISTORY TAB ─────────────────────────────────────── */}
        {activeTab === 'Sync History' && (
          <>
            <p className="perf-result-count">{syncLogs.length} sync record{syncLogs.length !== 1 ? 's' : ''}</p>
            <div className="perf-table-panel">
              <div className="perf-table-wrap">
                <table className="perf-sync-table">
                  <thead>
                    <tr>
                      <th>Platform</th>
                      <th>Sync Type</th>
                      <th>Status</th>
                      <th>Records</th>
                      <th>Synced By</th>
                      <th>Error</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncLogs.length === 0 ? (
                      <tr><td colSpan="7" className="perf-empty">No sync history yet.</td></tr>
                    ) : syncLogs.map(log => (
                      <tr key={log.id}>
                        <td><span className="perf-platform-pill">{platformIcon(log.platform)} {log.platform}</span></td>
                        <td>
                          <span className={`perf-source-pill perf-source-${log.sync_type === 'csv_import' ? 'csv' : log.sync_type === 'api_sync' ? 'api' : 'manual'}`}>
                            {log.sync_type === 'csv_import' ? 'CSV' : log.sync_type === 'api_sync' ? 'API' : 'Manual'}
                          </span>
                        </td>
                        <td>
                          <span className="perf-status-badge" style={{ background: syncStatusColor[log.status] ? `${syncStatusColor[log.status]}20` : '#f8f3f5', color: syncStatusColor[log.status] || '#64748b', border: `1px solid ${syncStatusColor[log.status] || '#c9b6bf'}` }}>
                            {log.status}
                          </span>
                        </td>
                        <td>{num(log.records_imported)}</td>
                        <td>{log.synced_by || '—'}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', color: '#b5536b' }}>{log.error_message || '—'}</td>
                        <td>{new Date(log.synced_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>

      {/* ── CONNECT ACCOUNT MODAL ──────────────────────────────────── */}
      {showConnectModal && (
        <div className="perf-modal-overlay" onClick={() => setShowConnectModal(false)}>
          <div className="perf-modal" onClick={e => e.stopPropagation()}>
            <h3 className="perf-modal-title">Connect Marketing Account</h3>
            <p className="perf-modal-sub">Register your platform account. Live API sync requires official API credentials.</p>

            <div className="perf-field" style={{ marginBottom: 14 }}>
              <label className="perf-label">Platform</label>
              <select value={connectForm.platform} onChange={e => setConnectForm({...connectForm, platform: e.target.value})} className="perf-input">
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="perf-field" style={{ marginBottom: 14 }}>
              <label className="perf-label">Account Name</label>
              <input type="text" placeholder="e.g. BTY Advance Official" value={connectForm.account_name} onChange={e => setConnectForm({...connectForm, account_name: e.target.value})} className="perf-input" />
            </div>
            <div className="perf-field" style={{ marginBottom: 14 }}>
              <label className="perf-label">External Account ID <span className="perf-label-opt">optional</span></label>
              <input type="text" placeholder="Platform-assigned account ID" value={connectForm.external_account_id} onChange={e => setConnectForm({...connectForm, external_account_id: e.target.value})} className="perf-input" />
            </div>
            <div className="perf-field" style={{ marginBottom: 14 }}>
              <label className="perf-label">Connected By</label>
              <input type="text" placeholder="Your name or username" value={connectForm.connected_by} onChange={e => setConnectForm({...connectForm, connected_by: e.target.value})} className="perf-input" />
            </div>

            <div style={{ background:'#fff7e8', border:'1px solid #d98a1f', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#9a5f0f', marginBottom:4 }}>
              🔐 Live API sync requires official OAuth credentials. Passwords are never stored. This registers the account record only.
            </div>

            <div className="perf-modal-actions">
              <button className="perf-btn perf-btn-primary" onClick={handleConnect}><FaLink /> Connect Account</button>
              <button className="perf-btn perf-btn-outline" onClick={() => setShowConnectModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}

export default Performance;
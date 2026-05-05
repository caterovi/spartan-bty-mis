import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axiosConfig';
import {
  FaComments,
  FaPlus,
  FaTimes,
  FaSearch,
  FaFilter,
  FaTrash,
  FaSave,
  FaUser,
  FaCalendar,
  FaStar,
  FaRegStar,
  FaCheck,
} from "react-icons/fa";

const CRM_USERS = ['CRM User 1', 'CRM User 2', 'CRM User 3', 'CRM User 4'];

function Feedback() {
  const [feedback, setFeedback] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCrmUser, setFilterCrmUser] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    customer_name: '',
    type: 'complaint',
    subject: '',
    message: '',
    rating: '5',
    crm_user: '',
  });

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await api.get('/crm/feedback');
      setFeedback(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/crm/feedback', form);
      setMessage('success:Feedback submitted successfully!');
      setShowForm(false);
      setForm({
        customer_name: '',
        type: 'complaint',
        subject: '',
        message: '',
        rating: '5',
        crm_user: '',
      });
      fetchFeedback();
    } catch (err) {
      setMessage('error:Error submitting feedback.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/crm/feedback/${id}/status`, { status });
      fetchFeedback();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await api.delete(`/crm/feedback/${id}`);
      fetchFeedback();
    } catch (err) {
      console.error(err);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('all');
    setFilterCrmUser('all');
    setFilterType('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters =
    search ||
    filterStatus !== 'all' ||
    filterCrmUser !== 'all' ||
    filterType !== 'all' ||
    dateFrom ||
    dateTo;

  const filtered = feedback.filter(f => {
    const matchSearch = !search ||
      f.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      f.subject.toLowerCase().includes(search.toLowerCase()) ||
      f.message.toLowerCase().includes(search.toLowerCase()) ||
      (f.crm_user || '').toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    const matchCrmUser = filterCrmUser === 'all' || f.crm_user === filterCrmUser;
    const matchType = filterType === 'all' || f.type === filterType;

    const feedbackDate = new Date(f.created_at);
    const matchDateFrom = !dateFrom || feedbackDate >= new Date(dateFrom);
    const matchDateTo = !dateTo || feedbackDate <= new Date(dateTo + 'T23:59:59');

    return matchSearch && matchStatus && matchCrmUser && matchType && matchDateFrom && matchDateTo;
  });

  const typeColors = {
    complaint: { backgroundColor: '#fff1f5', color: '#b5536b', borderColor: '#c4607a' },
    suggestion: { backgroundColor: '#fff7e8', color: '#9a5f0f', borderColor: '#d98a1f' },
    compliment: { backgroundColor: '#ecfdf3', color: '#2f7d56', borderColor: '#2f9d6a' },
    inquiry: { backgroundColor: '#f8f3f5', color: '#6b5b63', borderColor: '#c9b6bf' },
  };

  const statusColors = {
    new: { backgroundColor: '#fff1f5', color: '#b5536b', borderColor: '#c4607a' },
    'in-review': { backgroundColor: '#fff7e8', color: '#9a5f0f', borderColor: '#d98a1f' },
    resolved: { backgroundColor: '#ecfdf3', color: '#2f7d56', borderColor: '#2f9d6a' },
  };

  const statusFlow = ['new', 'in-review', 'resolved'];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      i < Number(rating)
        ? <FaStar key={i} className="feedback-star-filled" />
        : <FaRegStar key={i} className="feedback-star-empty" />
    ));
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'just now';
  };

  const isError = message.startsWith('error:');
  const msgText = message.replace(/^(success:|error:)/, '');

  const formatText = (value) =>
    String(value || '').replaceAll('-', ' ');

  return (
    <Layout>
      <style>{`
        .feedback-page {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          animation: feedbackFadeUp 0.35s ease both;
        }

        .feedback-hero {
          background:
            radial-gradient(circle at top right, rgba(196, 96, 122, 0.18), transparent 34%),
            linear-gradient(135deg, #fff7fa 0%, #ffffff 100%);
          border: 1px solid #ead1d9;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .feedback-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .feedback-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .feedback-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 760px;
        }

        .feedback-hero-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          font-size: 24px;
          box-shadow: 0 8px 24px rgba(196, 96, 122, 0.25);
          flex: 0 0 auto;
        }

        .feedback-toolbar {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .feedback-toolbar-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .feedback-search-wrap {
          position: relative;
          width: 300px;
          max-width: 100%;
        }

        .feedback-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b5536b;
          font-size: 13px;
          pointer-events: none;
        }

        .feedback-search {
          width: 100%;
          padding: 11px 13px 11px 36px;
          border-radius: 12px;
          border: 1px solid #d8b8c2;
          background: #fff7fa;
          color: #1f2937;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
        }

        .feedback-search:focus {
          border-color: #c4607a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
        }

        .feedback-add-btn,
        .feedback-submit-btn {
          border: none;
          border-radius: 12px;
          padding: 11px 16px;
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 18px rgba(196, 96, 122, 0.22);
          transition: transform 180ms ease, box-shadow 180ms ease;
          white-space: nowrap;
        }

        .feedback-filter-btn {
          border: 1px solid #d8b8c2;
          border-radius: 12px;
          padding: 11px 14px;
          background: #ffffff;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          white-space: nowrap;
        }

        .feedback-filter-btn-active {
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          border-color: #c4607a;
          box-shadow: 0 8px 18px rgba(196, 96, 122, 0.18);
        }

        .feedback-add-btn:hover,
        .feedback-submit-btn:hover,
        .feedback-filter-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.18);
        }

        .feedback-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .feedback-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .feedback-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .feedback-panel {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .feedback-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }

        .feedback-panel-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .feedback-panel-icon {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: #fff1f5;
          border: 1px solid #e8b9c6;
          color: #b5536b;
          flex: 0 0 auto;
        }

        .feedback-panel-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .feedback-panel-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .feedback-clear-btn {
          border: 1px solid #c4607a;
          border-radius: 10px;
          padding: 9px 12px;
          background: #fff1f5;
          color: #b5536b;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .feedback-filter-grid,
        .feedback-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .feedback-filter-grid {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }

        .feedback-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .feedback-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .feedback-input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border-radius: 12px;
          border: 1px solid #d8b8c2;
          background: #ffffff;
          color: #1f2937;
          font-size: 14px;
          outline: none;
          font-family: Segoe UI, sans-serif;
          transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
        }

        .feedback-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .feedback-subject-span-2 {
          grid-column: span 2;
        }

        .feedback-message-span-3 {
          grid-column: span 3;
        }

        .feedback-active-summary {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid #f3e8ec;
        }

        .feedback-active-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 800;
        }

        .feedback-active-tag {
          background: #fff1f5;
          color: #b5536b;
          padding: 5px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid #e8b9c6;
        }

        .feedback-pill-row {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .feedback-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 13px;
          border-radius: 9999px;
          border: 1px solid #d8b8c2;
          background: #ffffff;
          color: #64748b;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .feedback-pill:hover {
          transform: translateY(-1px);
          border-color: #c4607a;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .feedback-pill-active {
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          border-color: #c4607a;
          box-shadow: 0 8px 18px rgba(196, 96, 122, 0.18);
        }

        .feedback-pill-count {
          min-width: 22px;
          height: 22px;
          padding: 0 7px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.24);
          border: 1px solid rgba(255,255,255,0.34);
          font-size: 11px;
          font-weight: 850;
        }

        .feedback-result-count {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .feedback-filtered-note {
          color: #b5536b;
          font-weight: 850;
        }

        .feedback-empty {
          background:
            radial-gradient(circle at top right, rgba(196, 96, 122, 0.12), transparent 34%),
            linear-gradient(135deg, #fff7fa 0%, #ffffff 100%);
          border: 1px dashed #e2c6cf;
          border-radius: 18px;
          padding: 42px 22px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .feedback-empty-title {
          margin: 0 0 8px;
          color: #1f2937;
          font-size: 18px;
          font-weight: 850;
        }

        .feedback-empty-text {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .feedback-card-grid {
          display: grid;
          gap: 16px;
        }

        .feedback-card {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .feedback-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: linear-gradient(180deg, #c4607a, #e58ca3);
        }

        .feedback-card:hover {
          transform: translateY(-2px);
          border-color: #c4607a;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .feedback-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 14px;
        }

        .feedback-card-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          min-width: 0;
        }

        .feedback-type-badge,
        .feedback-crm-badge,
        .feedback-status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
          border: 1px solid;
          white-space: nowrap;
        }

        .feedback-crm-badge {
          background: #fff7fa;
          color: #64748b;
          border-color: #ead1d9;
          gap: 6px;
        }

        .feedback-customer {
          color: #1f2937;
          font-size: 14px;
          font-weight: 850;
        }

        .feedback-card-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .feedback-star-row {
          display: flex;
          gap: 2px;
        }

        .feedback-star-filled {
          color: #d98a1f;
          font-size: 14px;
        }

        .feedback-star-empty {
          color: #d8b8c2;
          font-size: 14px;
        }

        .feedback-time {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
        }

        .feedback-full-date {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
        }

        .feedback-card-body {
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f3e8ec;
        }

        .feedback-subject {
          margin: 0 0 7px;
          color: #1f2937;
          font-size: 16px;
          font-weight: 850;
          line-height: 1.4;
        }

        .feedback-message-text {
          margin: 0;
          color: #374151;
          font-size: 14px;
          line-height: 1.7;
          font-weight: 500;
        }

        .feedback-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .feedback-status-flow {
          display: flex;
          align-items: center;
          gap: 0;
          min-width: 0;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .feedback-status-step {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 0 0 auto;
        }

        .feedback-status-dot {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          display: grid;
          place-items: center;
          color: #ffffff;
          font-size: 8px;
          flex: 0 0 auto;
        }

        .feedback-status-step-label {
          font-size: 12px;
          white-space: nowrap;
        }

        .feedback-status-line {
          width: 34px;
          height: 2px;
          margin: 0 6px;
          border-radius: 9999px;
          flex: 0 0 auto;
        }

        .feedback-card-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex: 0 0 auto;
        }

        .feedback-status-select {
          padding: 8px 11px;
          border-radius: 10px;
          border: 1px solid;
          font-size: 13px;
          cursor: pointer;
          font-weight: 800;
          outline: none;
          text-transform: capitalize;
        }

        .feedback-delete-btn {
          border: 1px solid #c4607a;
          border-radius: 10px;
          padding: 8px 12px;
          background: #fff1f5;
          color: #b5536b;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .feedback-delete-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        @keyframes feedbackFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1180px) {
          .feedback-filter-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .feedback-form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .feedback-message-span-3 {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .feedback-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .feedback-title {
            font-size: 24px;
          }

          .feedback-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .feedback-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .feedback-toolbar-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .feedback-search-wrap,
          .feedback-filter-btn,
          .feedback-add-btn {
            width: 100%;
          }

          .feedback-filter-grid,
          .feedback-form-grid {
            grid-template-columns: 1fr;
          }

          .feedback-subject-span-2,
          .feedback-message-span-3 {
            grid-column: span 1;
          }

          .feedback-panel-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .feedback-clear-btn {
            width: 100%;
            justify-content: center;
          }

          .feedback-card-header,
          .feedback-card-footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .feedback-card-right {
            align-items: flex-start;
          }

          .feedback-card-actions {
            width: 100%;
            flex-direction: column;
          }

          .feedback-status-select,
          .feedback-delete-btn {
            width: 100%;
          }
        }

        @media (max-width: 520px) {
          .feedback-hero {
            flex-direction: column-reverse;
          }

          .feedback-pill {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>

      <div className="feedback-page">
        <div className="feedback-hero">
          <div>
            <p className="feedback-eyebrow">CRM Feedback Center</p>
            <h3 className="feedback-title">Customer Feedback</h3>
            <p className="feedback-subtitle">
              Record, filter, review, and track customer feedback from new submission to resolution.
            </p>
          </div>

          <div className="feedback-hero-icon">
            <FaComments />
          </div>
        </div>

        <div className="feedback-toolbar">
          <div className="feedback-search-wrap">
            <FaSearch className="feedback-search-icon" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="feedback-search"
            />
          </div>

          <div className="feedback-toolbar-actions">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`feedback-filter-btn ${hasActiveFilters ? 'feedback-filter-btn-active' : ''}`}
            >
              <FaFilter />
              Filters {hasActiveFilters ? 'Active' : ''}
            </button>

            <button
              onClick={() => setShowForm(!showForm)}
              className="feedback-add-btn"
            >
              {showForm ? <FaTimes /> : <FaPlus />}
              {showForm ? 'Cancel' : 'Add Feedback'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`feedback-message ${isError ? 'feedback-message-error' : 'feedback-message-success'}`}>
            {msgText}
          </div>
        )}

        {showFilters && (
          <div className="feedback-panel">
            <div className="feedback-panel-header">
              <div className="feedback-panel-title-wrap">
                <div className="feedback-panel-icon">
                  <FaFilter />
                </div>

                <div>
                  <h4 className="feedback-panel-title">Filter Options</h4>
                  <p className="feedback-panel-note">
                    Narrow feedback results by type, status, assigned CRM user, or date range.
                  </p>
                </div>
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="feedback-clear-btn">
                  <FaTimes />
                  Clear Filters
                </button>
              )}
            </div>

            <div className="feedback-filter-grid">
              <div className="feedback-field">
                <label className="feedback-label">Feedback Type</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="feedback-input">
                  <option value="all">All Types</option>
                  <option value="complaint">Complaint</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="compliment">Compliment</option>
                  <option value="inquiry">Inquiry</option>
                </select>
              </div>

              <div className="feedback-field">
                <label className="feedback-label">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="feedback-input">
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="in-review">In Review</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="feedback-field">
                <label className="feedback-label">CRM User</label>
                <select value={filterCrmUser} onChange={e => setFilterCrmUser(e.target.value)} className="feedback-input">
                  <option value="all">All CRM Users</option>
                  {CRM_USERS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="feedback-field">
                <label className="feedback-label">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="feedback-input"
                />
              </div>

              <div className="feedback-field">
                <label className="feedback-label">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="feedback-input"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="feedback-active-summary">
                <span className="feedback-active-label">Active filters:</span>
                {filterType !== 'all' && <span className="feedback-active-tag">Type: {formatText(filterType)}</span>}
                {filterStatus !== 'all' && <span className="feedback-active-tag">Status: {formatText(filterStatus)}</span>}
                {filterCrmUser !== 'all' && <span className="feedback-active-tag">User: {filterCrmUser}</span>}
                {dateFrom && <span className="feedback-active-tag">From: {dateFrom}</span>}
                {dateTo && <span className="feedback-active-tag">To: {dateTo}</span>}
                {search && <span className="feedback-active-tag">Search: {search}</span>}
              </div>
            )}
          </div>
        )}

        <div className="feedback-pill-row">
          {['all', 'new', 'in-review', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`feedback-pill ${filterStatus === status ? 'feedback-pill-active' : ''}`}
            >
              {status === 'all' ? 'All' : formatText(status)}
              {status !== 'all' && (
                <span className="feedback-pill-count">
                  {feedback.filter(f => f.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="feedback-panel">
            <div className="feedback-panel-header">
              <div className="feedback-panel-title-wrap">
                <div className="feedback-panel-icon">
                  <FaPlus />
                </div>

                <div>
                  <h4 className="feedback-panel-title">Add Feedback</h4>
                  <p className="feedback-panel-note">
                    Encode customer feedback details and assign it to a CRM user.
                  </p>
                </div>
              </div>
            </div>

            <div className="feedback-form-grid">
              <div className="feedback-field">
                <label className="feedback-label">Customer Name</label>
                <input
                  type="text"
                  placeholder="Customer name"
                  value={form.customer_name}
                  onChange={e => setForm({ ...form, customer_name: e.target.value })}
                  className="feedback-input"
                />
              </div>

              <div className="feedback-field">
                <label className="feedback-label">Feedback Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="feedback-input"
                >
                  <option value="complaint">Complaint</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="compliment">Compliment</option>
                  <option value="inquiry">Inquiry</option>
                </select>
              </div>

              <div className="feedback-field">
                <label className="feedback-label">CRM User</label>
                <select
                  value={form.crm_user}
                  onChange={e => setForm({ ...form, crm_user: e.target.value })}
                  className="feedback-input"
                >
                  <option value="">Select CRM User</option>
                  {CRM_USERS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="feedback-field feedback-subject-span-2">
                <label className="feedback-label">Subject</label>
                <input
                  type="text"
                  placeholder="Brief subject"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="feedback-input"
                />
              </div>

              <div className="feedback-field">
                <label className="feedback-label">Rating</label>
                <select
                  value={form.rating}
                  onChange={e => setForm({ ...form, rating: e.target.value })}
                  className="feedback-input"
                >
                  {[5, 4, 3, 2, 1].map(r => (
                    <option key={r} value={r}>{r}/5</option>
                  ))}
                </select>
              </div>

              <div className="feedback-field feedback-message-span-3">
                <label className="feedback-label">Message</label>
                <textarea
                  placeholder="Detailed feedback message..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="feedback-input"
                  style={{ minHeight: '90px', resize: 'vertical' }}
                />
              </div>
            </div>

            <button onClick={handleSubmit} className="feedback-submit-btn" style={{ marginTop: 16 }}>
              <FaSave />
              Submit Feedback
            </button>
          </div>
        )}

        <p className="feedback-result-count">
          {filtered.length} feedback{filtered.length !== 1 ? 's' : ''} found
          {hasActiveFilters && <span className="feedback-filtered-note"> (filtered)</span>}
        </p>

        {filtered.length === 0 ? (
          <div className="feedback-empty">
            <p className="feedback-empty-title">No feedback found</p>
            <p className="feedback-empty-text">
              {hasActiveFilters ? 'Try adjusting your filters.' : 'No feedback submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="feedback-card-grid">
            {filtered.map(f => {
              const currentIndex = statusFlow.indexOf(f.status);

              return (
                <div key={f.id} className="feedback-card">
                  <div className="feedback-card-header">
                    <div className="feedback-card-left">
                      <span
                        className="feedback-type-badge"
                        style={typeColors[f.type] || typeColors.inquiry}
                      >
                        {formatText(f.type)}
                      </span>

                      <span className="feedback-customer">{f.customer_name}</span>

                      {f.crm_user && (
                        <span className="feedback-crm-badge">
                          <FaUser />
                          {f.crm_user}
                        </span>
                      )}
                    </div>

                    <div className="feedback-card-right">
                      <div className="feedback-star-row">{renderStars(f.rating)}</div>

                      <span className="feedback-time">
                        <FaCalendar />
                        {timeAgo(f.created_at)}
                      </span>

                      <span className="feedback-full-date">
                        {new Date(f.created_at).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="feedback-card-body">
                    <h4 className="feedback-subject">{f.subject}</h4>
                    <p className="feedback-message-text">{f.message}</p>
                  </div>

                  <div className="feedback-card-footer">
                    <div className="feedback-status-flow">
                      {statusFlow.map((status, index) => {
                        const isCurrent = f.status === status;
                        const isDone = currentIndex > index;
                        const dotColor = isCurrent ? '#c4607a' : isDone ? '#2f9d6a' : '#d8b8c2';
                        const labelColor = isCurrent ? '#c4607a' : isDone ? '#2f9d6a' : '#94a3b8';

                        return (
                          <div key={status} className="feedback-status-step">
                            <div
                              className="feedback-status-dot"
                              style={{ backgroundColor: dotColor }}
                            >
                              {isDone && <FaCheck />}
                            </div>

                            <span
                              className="feedback-status-step-label"
                              style={{
                                color: labelColor,
                                fontWeight: isCurrent ? 850 : 700,
                              }}
                            >
                              {formatText(status)}
                            </span>

                            {index < statusFlow.length - 1 && (
                              <div
                                className="feedback-status-line"
                                style={{ backgroundColor: isDone ? '#2f9d6a' : '#ead1d9' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="feedback-card-actions">
                      <select
                        value={f.status}
                        onChange={e => handleStatusChange(f.id, e.target.value)}
                        className="feedback-status-select"
                        style={statusColors[f.status] || statusColors.new}
                      >
                        <option value="new">New</option>
                        <option value="in-review">In Review</option>
                        <option value="resolved">Resolved</option>
                      </select>

                      <button
                        onClick={() => handleDelete(f.id)}
                        className="feedback-delete-btn"
                      >
                        <FaTrash />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Feedback;
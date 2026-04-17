import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

const CRM_USERS = ['CRM User 1', 'CRM User 2', 'CRM User 3', 'CRM User 4'];

function Feedback() {
  const [feedback, setFeedback]   = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [message, setMessage]     = useState('');

  // Filters
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCrmUser, setFilterCrmUser] = useState('all');
  const [filterType, setFilterType]   = useState('all');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    customer_name: '', type: 'complaint', subject: '',
    message: '', rating: '5', crm_user: '',
  });

  useEffect(() => { fetchFeedback(); }, []);

  const fetchFeedback = async () => {
    try {
      const res = await api.get('/crm/feedback');
      setFeedback(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/crm/feedback', form);
      setMessage('success:Feedback submitted successfully!');
      setShowForm(false);
      setForm({ customer_name: '', type: 'complaint', subject: '', message: '', rating: '5', crm_user: '' });
      fetchFeedback();
    } catch (err) {
      setMessage('error:Error submitting feedback.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/crm/feedback/${id}/status`, { status });
      fetchFeedback();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await api.delete(`/crm/feedback/${id}`);
      fetchFeedback();
    } catch (err) { console.error(err); }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('all');
    setFilterCrmUser('all');
    setFilterType('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = search || filterStatus !== 'all' || filterCrmUser !== 'all' || filterType !== 'all' || dateFrom || dateTo;

  // Apply all filters
  const filtered = feedback.filter(f => {
    const matchSearch = !search ||
      f.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      f.subject.toLowerCase().includes(search.toLowerCase()) ||
      f.message.toLowerCase().includes(search.toLowerCase()) ||
      (f.crm_user || '').toLowerCase().includes(search.toLowerCase());

    const matchStatus   = filterStatus   === 'all' || f.status === filterStatus;
    const matchCrmUser  = filterCrmUser  === 'all' || f.crm_user === filterCrmUser;
    const matchType     = filterType     === 'all' || f.type === filterType;

    const feedbackDate  = new Date(f.created_at);
    const matchDateFrom = !dateFrom || feedbackDate >= new Date(dateFrom);
    const matchDateTo   = !dateTo   || feedbackDate <= new Date(dateTo + 'T23:59:59');

    return matchSearch && matchStatus && matchCrmUser && matchType && matchDateFrom && matchDateTo;
  });

  const typeColors = {
    complaint:  { backgroundColor: '#f8d7da', color: '#721c24' },
    suggestion: { backgroundColor: '#eaf4fb', color: '#2980b9' },
    compliment: { backgroundColor: '#d4edda', color: '#155724' },
    inquiry:    { backgroundColor: '#fff3cd', color: '#856404' },
  };

  const statusColors = {
    new:         { backgroundColor: '#eaf4fb', color: '#2980b9' },
    'in-review': { backgroundColor: '#fff3cd', color: '#856404' },
    resolved:    { backgroundColor: '#d4edda', color: '#155724' },
  };

  const statusFlow = ['new', 'in-review', 'resolved'];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#f39c12' : '#ddd', fontSize: '14px' }}>★</span>
    ));
  };

  const timeAgo = (dateStr) => {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (days > 0)  return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0)  return `${mins}m ago`;
    return 'just now';
  };

  const isSuccess = message.startsWith('success:');
  const isError   = message.startsWith('error:');
  const msgText   = message.replace(/^(success:|error:)/, '');

  return (
    <div>
      {/* Top Row */}
      <div style={styles.topRow} className="mobile-top-row">
        <h3 style={styles.sectionTitle}>Customer Feedback</h3>
        <div className="mobile-button-group">
          <input
            type="text"
            placeholder=" Search feedback..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
            className="mobile-search"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ ...styles.filterToggleBtn, backgroundColor: hasActiveFilters ? '#c4607a' : '#f8f9fa', color: hasActiveFilters ? '#fff' : '#555' }}
            className="mobile-action-btn"
          >
             Filters {hasActiveFilters && `(active)`}
          </button>
          <button onClick={() => setShowForm(!showForm)} style={styles.addBtn} className="mobile-action-btn">
            {showForm ? '× Cancel' : '+ Add Feedback'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          fontSize: '14px', fontWeight: '500',
          backgroundColor: isError ? '#f8d7da' : '#d4edda',
          color:           isError ? '#721c24' : '#155724',
          border:          `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`,
        }}>
          {isSuccess ? '' : ''}{msgText}
        </div>
      )}

      {/* Expanded Filter Panel */}
      {showFilters && (
        <div style={styles.filterPanel}>
          <div style={styles.filterPanelHeader}>
            <h4 style={styles.filterPanelTitle}> Filter Options</h4>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={styles.clearBtn}>
                ✕ Clear All Filters
              </button>
            )}
          </div>

          <div style={styles.filterGrid} className="mobile-form-grid">
            {/* Filter by Type */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Feedback Type</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={styles.filterSelect}>
                <option value="all">All Types</option>
                <option value="complaint">Complaint</option>
                <option value="suggestion">Suggestion</option>
                <option value="compliment">Compliment</option>
                <option value="inquiry">Inquiry</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.filterSelect}>
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="in-review">In Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Filter by CRM User */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>CRM User</label>
              <select value={filterCrmUser} onChange={e => setFilterCrmUser(e.target.value)} style={styles.filterSelect}>
                <option value="all">All CRM Users</option>
                {CRM_USERS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                style={styles.filterSelect}
              />
            </div>

            {/* Date To */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                style={styles.filterSelect}
              />
            </div>
          </div>

          {/* Active Filter Summary */}
          {hasActiveFilters && (
            <div style={styles.activeSummary}>
              <span style={styles.activeSummaryLabel}>Active filters:</span>
              {filterType    !== 'all' && <span style={styles.activeTag}>Type: {filterType}</span>}
              {filterStatus  !== 'all' && <span style={styles.activeTag}>Status: {filterStatus}</span>}
              {filterCrmUser !== 'all' && <span style={styles.activeTag}>User: {filterCrmUser}</span>}
              {dateFrom               && <span style={styles.activeTag}>From: {dateFrom}</span>}
              {dateTo                 && <span style={styles.activeTag}>To: {dateTo}</span>}
              {search                 && <span style={styles.activeTag}>Search: "{search}"</span>}
            </div>
          )}
        </div>
      )}

      {/* Quick Status Filter Pills */}
      <div style={styles.pillRow} className="mobile-pill-row">
        {['all','new','in-review','resolved'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={filterStatus === s ? styles.pillActive : styles.pill}
          >
            {s === 'all' ? 'All' : s === 'in-review' ? 'In Review' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && (
              <span style={styles.pillCount}>
                {feedback.filter(f => f.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Add Feedback Form */}
      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>Add Feedback</h4>
          <div style={styles.grid} className="mobile-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Customer Name</label>
              <input type="text" placeholder="Customer name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Feedback Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={styles.input}>
                <option value="complaint">Complaint</option>
                <option value="suggestion">Suggestion</option>
                <option value="compliment">Compliment</option>
                <option value="inquiry">Inquiry</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>CRM User</label>
              <select value={form.crm_user} onChange={e => setForm({ ...form, crm_user: e.target.value })} style={styles.input}>
                <option value="">-- Select CRM User --</option>
                {CRM_USERS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Subject</label>
              <input type="text" placeholder="Brief subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Rating</label>
              <select value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} style={styles.input}>
                {[5,4,3,2,1].map(r => (
                  <option key={r} value={r}>{'⭐'.repeat(r)} ({r}/5)</option>
                ))}
              </select>
            </div>
            <div style={{ ...styles.inputGroup, gridColumn: 'span 3' }}>
              <label style={styles.label}>Message</label>
              <textarea
                placeholder="Detailed feedback message..."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                style={{ ...styles.input, height: '80px', resize: 'vertical' }}
              />
            </div>
          </div>
          <button onClick={handleSubmit} style={styles.submitBtn}>Submit Feedback</button>
        </div>
      )}

      {/* Result Count */}
      <p style={styles.resultCount}>
        {filtered.length} feedback{filtered.length !== 1 ? 's' : ''} found
        {hasActiveFilters && <span style={styles.filteredNote}> (filtered)</span>}
      </p>

      {/* Feedback Cards */}
      {filtered.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#555', margin: '0 0 8px' }}>
            No feedback found
          </p>
          <p style={{ fontSize: '14px', color: '#aaa', margin: 0 }}>
            {hasActiveFilters ? 'Try adjusting your filters.' : 'No feedback submitted yet.'}
          </p>
        </div>
      ) : (
        <div style={styles.cardList}>
          {filtered.map(f => (
            <div key={f.id} style={styles.card}>
              {/* Card Header */}
              <div style={styles.cardHeader}>
                <div style={styles.cardHeaderLeft}>
                  <span style={{ ...styles.typeBadge, ...typeColors[f.type] }}>
                    {f.type}
                  </span>
                  <span style={styles.customerName}>{f.customer_name}</span>
                  {f.crm_user && (
                    <span style={styles.crmUserBadge}>
                       {f.crm_user}
                    </span>
                  )}
                </div>
                <div style={styles.cardHeaderRight}>
                  <div style={styles.starRow}>{renderStars(f.rating)}</div>
                  <div style={styles.timestampBox}>
                    <span style={styles.timestamp}>
                      🕐 {timeAgo(f.created_at)}
                    </span>
                    <span style={styles.fullDate}>
                      {new Date(f.created_at).toLocaleDateString('en-PH', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div style={styles.cardBody}>
                <h4 style={styles.subject}>{f.subject}</h4>
                <p style={styles.messageText}>{f.message}</p>
              </div>

              {/* Card Footer — Status Flow */}
              <div style={styles.cardFooter}>
                {/* Status Progress */}
                <div style={styles.statusFlow}>
                  {statusFlow.map((s, i) => (
                    <div key={s} style={styles.statusStep}>
                      <div style={{
                        ...styles.statusDot,
                        backgroundColor: f.status === s ? '#c4607a' :
                          statusFlow.indexOf(f.status) > i ? '#27ae60' : '#ddd',
                      }} />
                      <span style={{
                        ...styles.statusStepLabel,
                        color: f.status === s ? '#c4607a' :
                          statusFlow.indexOf(f.status) > i ? '#27ae60' : '#aaa',
                        fontWeight: f.status === s ? '600' : '400',
                      }}>
                        {s === 'in-review' ? 'In Review' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </span>
                      {i < statusFlow.length - 1 && (
                        <div style={{
                          ...styles.statusLine,
                          backgroundColor: statusFlow.indexOf(f.status) > i ? '#27ae60' : '#eee',
                        }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={styles.cardActions}>
                  <select
                    value={f.status}
                    onChange={e => handleStatusChange(f.id, e.target.value)}
                    style={{ ...styles.statusSelect, ...statusColors[f.status] }}
                  >
                    <option value="new">New</option>
                    <option value="in-review">In Review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button onClick={() => handleDelete(f.id)} style={styles.deleteBtn}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#302e2e', margin: 0 },
  topRight: { display: 'flex', gap: '10px', alignItems: 'center' },
  searchInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', width: '200px' },
  filterToggleBtn: { padding: '10px 16px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  addBtn: { padding: '10px 18px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },

  // Filter Panel
  filterPanel: { backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  filterPanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  filterPanelTitle: { fontSize: '15px', fontWeight: '600', color: '#302e2e', margin: 0 },
  clearBtn: { padding: '7px 14px', backgroundColor: '#f8d7da', color: '#721c24', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '12px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  filterLabel: { fontSize: '12px', fontWeight: '600', color: '#555' },
  filterSelect: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', backgroundColor: '#fff' },
  activeSummary: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #f0f0f0' },
  activeSummaryLabel: { fontSize: '12px', color: '#888', fontWeight: '600' },
  activeTag: { backgroundColor: '#fdf0f3', color: '#c4607a', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #f0b8c4' },

  // Quick Pills
  pillRow: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  pill: { display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', color: '#555' },
  pillActive: { display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '20px', border: '1px solid #c4607a', backgroundColor: '#c4607a', cursor: 'pointer', fontSize: '13px', color: '#fff', fontWeight: '600' },
  pillCount: { backgroundColor: 'rgba(255,255,255,0.2)', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' },

  // Form
  form: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '20px', marginBottom: '24px' },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', backgroundColor: '#fff', fontFamily: 'Segoe UI, sans-serif' },
  submitBtn: { padding: '11px 24px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  resultCount: { fontSize: '13px', color: '#888', margin: '0 0 16px' },
  filteredNote: { color: '#c4607a', fontWeight: '600' },

  // Cards
  emptyBox: { backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '40px', textAlign: 'center' },
  cardList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  cardHeaderRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  typeBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
  customerName: { fontSize: '14px', fontWeight: '600', color: '#302e2e' },
  crmUserBadge: { backgroundColor: '#f8f9fa', color: '#555', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', border: '1px solid #eee' },
  starRow: { display: 'flex', gap: '1px' },
  timestampBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  timestamp: { fontSize: '12px', color: '#c4607a', fontWeight: '500' },
  fullDate: { fontSize: '11px', color: '#aaa' },
  cardBody: { marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f5f5f5' },
  subject: { fontSize: '15px', fontWeight: '600', color: '#302e2e', margin: '0 0 6px' },
  messageText: { fontSize: '14px', color: '#555', lineHeight: '1.6', margin: 0 },

  // Status Flow
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusFlow: { display: 'flex', alignItems: 'center', gap: '0' },
  statusStep: { display: 'flex', alignItems: 'center', gap: '6px' },
  statusDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  statusStepLabel: { fontSize: '12px', whiteSpace: 'nowrap' },
  statusLine: { width: '30px', height: '2px', margin: '0 4px' },

  cardActions: { display: 'flex', gap: '8px', alignItems: 'center' },
  statusSelect: { padding: '7px 12px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  deleteBtn: { padding: '7px 14px', backgroundColor: '#f8d7da', color: '#721c24', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
};

export default Feedback;
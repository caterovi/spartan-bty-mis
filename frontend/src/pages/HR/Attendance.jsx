import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

const ATTENDANCE_STATUS = ['present', 'absent', 'late', 'half-day', 'leave'];

const NOTE_TEMPLATES = {
  present:    ['On time', 'Regular day', 'Overtime'],
  absent:     ['No call no show', 'Sick leave', 'Emergency leave', 'Approved absence'],
  late:       ['Traffic', 'Personal reason', 'Transportation issue'],
  'half-day': ['AM half day', 'PM half day', 'Medical appointment'],
  leave:      ['Vacation leave', 'Sick leave', 'Emergency leave', 'Maternity/Paternity leave'],
};

function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [message, setMessage]       = useState('');
  const [search, setSearch]         = useState('');
  const [editForm, setEditForm]     = useState({});
  const [form, setForm] = useState({
    employee_id: '', date: '', time_in: '',
    time_out: '', status: 'present', remarks: '',
  });

  useEffect(() => { fetchAttendance(); fetchEmployees(); }, []);

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/hr/attendance');
      setAttendance(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/hr/employees');
      setEmployees(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/hr/attendance', form);
      setMessage('success:Attendance recorded!');
      setShowForm(false);
      setForm({ employee_id: '', date: '', time_in: '', time_out: '', status: 'present', remarks: '' });
      fetchAttendance();
    } catch (err) {
      setMessage('error:Error recording attendance.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const handleEdit = (rec) => {
    setEditId(rec.id);
    setEditForm({
      time_in:  rec.time_in  || '',
      time_out: rec.time_out || '',
      status:   rec.status,
      remarks:  rec.remarks  || '',
    });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/hr/attendance/${editId}`, editForm);
      setMessage('success:Attendance updated!');
      setEditId(null);
      fetchAttendance();
    } catch (err) {
      setMessage('error:Error updating attendance.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const filteredAttendance = attendance.filter(a =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.department.toLowerCase().includes(search.toLowerCase()) ||
    a.status.toLowerCase().includes(search.toLowerCase()) ||
    (a.remarks || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = {
    present:    { backgroundColor: '#d4edda', color: '#155724' },
    absent:     { backgroundColor: '#f8d7da', color: '#721c24' },
    late:       { backgroundColor: '#fff3cd', color: '#856404' },
    'half-day': { backgroundColor: '#eaf4fb', color: '#2980b9' },
    leave:      { backgroundColor: '#f4ecf7', color: '#8e44ad' },
  };

  const isSuccess = message.startsWith('success:');
  const isError   = message.startsWith('error:');
  const msgText   = message.replace(/^(success:|error:)/, '');

  return (
    <div>
      <div style={styles.topRow} className="mobile-top-row">
        <h3 style={styles.sectionTitle}>Attendance Records</h3>
        <div className="mobile-button-group">
          <input
            type="text"
            placeholder="Search attendance..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
            className="mobile-search"
          />
          <button onClick={() => setShowForm(!showForm)} style={styles.addBtn} className="mobile-action-btn">
            {showForm ? '× Cancel' : '+ Record Attendance'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          fontSize: '14px', fontWeight: '500',
          backgroundColor: isError ? '#f8d7da' : '#d4edda',
          color:           isError ? '#721c24' : '#155724',
          border:          `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`,
        }}>
          {isSuccess ? ' ' : ' '}{msgText}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>Record Attendance</h4>
          <div style={styles.grid} className="mobile-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Employee</label>
              <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} style={styles.input}>
                <option value="">Select employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value, remarks: '' })}
                style={styles.input}
              >
                {ATTENDANCE_STATUS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Time In</label>
              <input type="time" value={form.time_in} onChange={e => setForm({ ...form, time_in: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Time Out</label>
              <input type="time" value={form.time_out} onChange={e => setForm({ ...form, time_out: e.target.value })} style={styles.input} />
            </div>

            {/* Dialogue Notes with templates */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Remarks / Notes</label>
              <select
                value={form.remarks}
                onChange={e => setForm({ ...form, remarks: e.target.value })}
                style={styles.input}
              >
                <option value="">-- Select a note or type below --</option>
                {(NOTE_TEMPLATES[form.status] || []).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Custom remarks */}
            <div style={{ ...styles.inputGroup, gridColumn: 'span 3' }}>
              <label style={styles.label}>Custom Remarks (optional)</label>
              <input
                type="text"
                placeholder="Or type a custom note..."
                value={form.remarks}
                onChange={e => setForm({ ...form, remarks: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>
          <button onClick={handleSubmit} style={styles.submitBtn}>Save Attendance</button>
        </div>
      )}

      {/* Edit Form */}
      {editId && (
        <div style={{ ...styles.form, borderLeft: '4px solid #c4607a' }}>
          <h4 style={styles.formTitle}>✏️ Edit Attendance</h4>
          <div style={styles.grid} className="mobile-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Time In</label>
              <input type="time" value={editForm.time_in} onChange={e => setEditForm({ ...editForm, time_in: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Time Out</label>
              <input type="time" value={editForm.time_out} onChange={e => setEditForm({ ...editForm, time_out: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Status</label>
              <select
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                style={styles.input}
              >
                {ATTENDANCE_STATUS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Note templates for edit */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Quick Note</label>
              <select
                value=""
                onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                style={styles.input}
              >
                <option value="">-- Select quick note --</option>
                {(NOTE_TEMPLATES[editForm.status] || []).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Remarks</label>
              <input
                type="text"
                placeholder="Custom remarks"
                value={editForm.remarks}
                onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleUpdate} style={styles.submitBtn}>Save Changes</button>
            <button onClick={() => setEditId(null)} style={styles.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      <p style={styles.resultCount}>
        {filteredAttendance.length} record{filteredAttendance.length !== 1 ? 's' : ''} found
      </p>

      <div className="resp-table-wrap mobile-table-container">
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Employee</th>
            <th style={styles.th}>Department</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Time In</th>
            <th style={styles.th}>Time Out</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Remarks</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAttendance.length === 0 ? (
            <tr><td colSpan="8" style={styles.empty}>No records found.</td></tr>
          ) : filteredAttendance.map(rec => (
            <tr key={rec.id} style={styles.tr}>
              <td style={styles.td}>
                <div style={{ fontWeight: '600' }}>{rec.full_name}</div>
              </td>
              <td style={styles.td}>{rec.department}</td>
              <td style={styles.td}>{new Date(rec.date).toLocaleDateString()}</td>
              <td style={styles.td}>{rec.time_in || '—'}</td>
              <td style={styles.td}>{rec.time_out || '—'}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, ...statusColor[rec.status] }}>{rec.status}</span>
              </td>
              <td style={styles.td}>
                {rec.remarks ? (
                  <span style={styles.remarkTag}>{rec.remarks}</span>
                ) : '—'}
              </td>
              <td style={styles.td}>
                <button onClick={() => handleEdit(rec)} style={styles.editBtn}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

const styles = {
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#302e2e', margin: 0 },
  topRight: { display: 'flex', gap: '10px', alignItems: 'center' },
  searchInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', width: '220px' },
  addBtn: { padding: '10px 18px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  form: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '20px', marginBottom: '24px' },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', backgroundColor: '#fff' },
  submitBtn: { padding: '11px 24px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  cancelBtn: { padding: '11px 24px', backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  resultCount: { fontSize: '13px', color: '#888', margin: '0 0 12px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  empty: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  remarkTag: { backgroundColor: '#f8f9fa', color: '#555', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #eee' },
  editBtn: { padding: '6px 12px', backgroundColor: '#eaf4fb', color: '#2980b9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
};

export default Attendance;
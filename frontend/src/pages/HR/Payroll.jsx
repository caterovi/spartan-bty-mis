import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

const PAYROLL_NOTES = [
  'Regular payroll',
  '13th month pay',
  'Bonus included',
  'Deduction for absences',
  'Deduction for tardiness',
  'Overtime pay included',
  'Final pay',
  'Partial payment',
];

function Payroll() {
  const [payroll, setPayroll]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [message, setMessage]     = useState('');
  const [search, setSearch]       = useState('');
  const [editForm, setEditForm]   = useState({});
  const [form, setForm] = useState({
    employee_id: '', period_start: '', period_end: '',
    basic_salary: '', deductions: '0', notes: '',
  });

  useEffect(() => { fetchPayroll(); fetchEmployees(); }, []);

  const fetchPayroll = async () => {
    try {
      const res = await api.get('/hr/payroll');
      setPayroll(res.data);
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
      await api.post('/hr/payroll', form);
      setMessage('success:Payroll generated!');
      setShowForm(false);
      setForm({ employee_id: '', period_start: '', period_end: '', basic_salary: '', deductions: '0', notes: '' });
      fetchPayroll();
    } catch (err) {
      setMessage('error:Error generating payroll.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setEditForm({
      basic_salary: p.basic_salary,
      deductions:   p.deductions,
      status:       p.status,
      notes:        p.notes || '',
    });
  };

  const handleUpdate = async () => {
    const net_salary = Number(editForm.basic_salary) - Number(editForm.deductions);
    try {
      await api.put(`/hr/payroll/${editId}`, { ...editForm, net_salary });
      setMessage('success:Payroll updated!');
      setEditId(null);
      fetchPayroll();
    } catch (err) {
      setMessage('error:Error updating payroll.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.put(`/hr/payroll/${id}/pay`);
      fetchPayroll();
    } catch (err) { console.error(err); }
  };

  const filteredPayroll = payroll.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.department.toLowerCase().includes(search.toLowerCase()) ||
    p.status.toLowerCase().includes(search.toLowerCase()) ||
    (p.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  const net     = (Number(form.basic_salary) - Number(form.deductions)).toLocaleString();
  const editNet = (Number(editForm.basic_salary) - Number(editForm.deductions)).toLocaleString();

  const isSuccess = message.startsWith('success:');
  const isError   = message.startsWith('error:');
  const msgText   = message.replace(/^(success:|error:)/, '');

  return (
    <div>
      <div style={styles.topRow} className="mobile-top-row">
        <h3 style={styles.sectionTitle}>Payroll Records</h3>
        <div className="mobile-button-group">
          <input
            type="text"
            placeholder="Search payroll..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
            className="mobile-search"
          />
          <button onClick={() => setShowForm(!showForm)} style={styles.addBtn} className="mobile-action-btn">
            {showForm ? '× Cancel' : '+ Generate Payroll'}
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

      {/* Generate Form */}
      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>Generate Payroll</h4>
          <div style={styles.grid} className="mobile-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Employee</label>
              <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} style={styles.input}>
                <option value="">Select employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} — {emp.department}</option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Period Start</label>
              <input type="date" value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Period End</label>
              <input type="date" value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Basic Salary (₱)</label>
              <input type="number" placeholder="0.00" value={form.basic_salary} onChange={e => setForm({ ...form, basic_salary: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Deductions (₱)</label>
              <input type="number" placeholder="0.00" value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Net Salary (₱)</label>
              <input readOnly value={`₱${net}`} style={{ ...styles.input, backgroundColor: '#f0f0f0', fontWeight: '600' }} />
            </div>

            {/* Notes with templates */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Quick Note</label>
              <select
                value=""
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={styles.input}
              >
                <option value="">-- Select a note --</option>
                {PAYROLL_NOTES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Custom Notes</label>
              <input
                type="text"
                placeholder="Or type a custom note..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>
          <button onClick={handleSubmit} style={styles.submitBtn}>Generate Payroll</button>
        </div>
      )}

      {/* Edit Form */}
      {editId && (
        <div style={{ ...styles.form, borderLeft: '4px solid #c4607a' }}>
          <h4 style={styles.formTitle}>✏️ Edit Payroll</h4>
          <div style={styles.grid} className="mobile-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Basic Salary (₱)</label>
              <input type="number" value={editForm.basic_salary} onChange={e => setEditForm({ ...editForm, basic_salary: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Deductions (₱)</label>
              <input type="number" value={editForm.deductions} onChange={e => setEditForm({ ...editForm, deductions: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Net Salary (₱)</label>
              <input readOnly value={`₱${editNet}`} style={{ ...styles.input, backgroundColor: '#f0f0f0', fontWeight: '600' }} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Status</label>
              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={styles.input}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Quick Note</label>
              <select
                value=""
                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                style={styles.input}
              >
                <option value="">-- Select a note --</option>
                {PAYROLL_NOTES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Custom Notes</label>
              <input
                type="text"
                placeholder="Custom note"
                value={editForm.notes}
                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
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
        {filteredPayroll.length} record{filteredPayroll.length !== 1 ? 's' : ''} found
      </p>

      <div className="resp-table-wrap mobile-table-container">
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Employee</th>
            <th style={styles.th}>Department</th>
            <th style={styles.th}>Period</th>
            <th style={styles.th}>Basic Salary</th>
            <th style={styles.th}>Deductions</th>
            <th style={styles.th}>Net Salary</th>
            <th style={styles.th}>Notes</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPayroll.length === 0 ? (
            <tr><td colSpan="9" style={styles.empty}>No payroll records yet.</td></tr>
          ) : filteredPayroll.map(p => (
            <tr key={p.id} style={styles.tr}>
              <td style={styles.td}>
                <div style={{ fontWeight: '600' }}>{p.full_name}</div>
              </td>
              <td style={styles.td}>{p.department}</td>
              <td style={styles.td} >
                {new Date(p.period_start).toLocaleDateString()} –{' '}
                {new Date(p.period_end).toLocaleDateString()}
              </td>
              <td style={styles.td}>₱{Number(p.basic_salary).toLocaleString()}</td>
              <td style={styles.td}>₱{Number(p.deductions).toLocaleString()}</td>
              <td style={{ ...styles.td, fontWeight: '700' }}>
                ₱{Number(p.net_salary).toLocaleString()}
              </td>
              <td style={styles.td}>
                {p.notes ? (
                  <span style={styles.noteTag}>{p.notes}</span>
                ) : '—'}
              </td>
              <td style={styles.td}>
                <span style={p.status === 'paid' ? styles.badgePaid : styles.badgePending}>
                  {p.status}
                </span>
              </td>
              <td style={styles.td}>
                <div style={styles.actionRow}>
                  <button onClick={() => handleEdit(p)} style={styles.editBtn}>Edit</button>
                  {p.status === 'pending' && (
                    <button onClick={() => handleMarkPaid(p.id)} style={styles.payBtn}>Mark Paid</button>
                  )}
                </div>
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
  noteTag: { backgroundColor: '#f8f9fa', color: '#555', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #eee' },
  badgePaid: { backgroundColor: '#d4edda', color: '#155724', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  badgePending: { backgroundColor: '#fff3cd', color: '#856404', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  actionRow: { display: 'flex', gap: '6px' },
  editBtn: { padding: '6px 12px', backgroundColor: '#eaf4fb', color: '#2980b9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  payBtn: { padding: '6px 12px', backgroundColor: '#d4edda', color: '#155724', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
};

export default Payroll;
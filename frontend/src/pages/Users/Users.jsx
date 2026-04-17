import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';

function Users() {
  const navigate = useNavigate();
  const [users, setUsers]       = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage]   = useState({ text: '', type: '' });
  const [pwdId, setPwdId]       = useState(null);
  const [newPwd, setNewPwd]     = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'sales' });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!['admin','hr'].includes(currentUser.role)) { navigate('/dashboard'); return; }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleSubmit = async () => {
    try {
      await api.post('/auth/register', form);
      showMsg('User created successfully!');
      setShowForm(false);
      setForm({ full_name: '', email: '', password: '', role: 'sales' });
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error creating user.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) { showMsg('You cannot delete your own account.', 'error'); return; }
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      showMsg('User deleted.');
      fetchUsers();
    } catch (err) { showMsg('Error deleting user.', 'error'); }
  };

  const handleChangePassword = async (id) => {
    if (!newPwd) { showMsg('Please enter a new password.', 'error'); return; }
    try {
      await api.put(`/auth/users/${id}/password`, { password: newPwd });
      showMsg('Password updated successfully!');
      setPwdId(null);
      setNewPwd('');
    } catch (err) { showMsg('Error updating password.', 'error'); }
  };

  const roleColors = {
    admin:     { backgroundColor: '#fdf0f3', color: '#c4607a' },
    marketing: { backgroundColor: '#fef9e7', color: '#f39c12' },
    sales:     { backgroundColor: '#eaf4fb', color: '#2980b9' },
    logistics: { backgroundColor: '#eafaf1', color: '#27ae60' },
    crm:       { backgroundColor: '#f4ecf7', color: '#8e44ad' },
    inventory: { backgroundColor: '#eafaf1', color: '#1a8a6e' },
    hr:        { backgroundColor: '#fdf0f3', color: '#c4607a' },
  };

  return (
    <Layout>
      <div>
        {/* Top Bar */}
        <div style={styles.topbar} className="mobile-top-row">
          <div>
            <h1 style={styles.pageTitle}>User Management</h1>
            <p style={styles.pageSubtitle}>Manage system users and their access roles</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={styles.addBtn} className="mobile-action-btn">
            {showForm ? '✕ Cancel' : '+ Add User'}
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{
            ...styles.message,
            backgroundColor: message.type === 'error' ? '#fdf0f3' : '#eafaf1',
            color: message.type === 'error' ? '#c4607a' : '#27ae60'
          }}>
            {message.text}
          </div>
        )}

        {/* Add User Form */}
        {showForm && (
          <div style={styles.form}>
            <h4 style={styles.formTitle}>Create New User</h4>
            <div style={styles.grid} className="mobile-form-grid">
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  style={styles.input}
                >
                  {['admin','marketing','sales','logistics','crm','inventory','hr'].map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={handleSubmit} style={styles.submitBtn}>Create User</button>
          </div>
        )}

        {/* Users Table */}
        <div style={styles.card} className="mobile-table-container">
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Full Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Date Added</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="5" style={styles.empty}>No users found.</td></tr>
              ) : (
                users.map((u) => (
                  <>
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.nameRow}>
                          <div style={styles.avatar}>
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          {u.full_name}
                        </div>
                      </td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...roleColors[u.role] }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={styles.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <div style={styles.actionRow}>
                          <button
                            onClick={() => setPwdId(pwdId === u.id ? null : u.id)}
                            style={styles.pwdBtn}
                          >
                             Change Password
                          </button>
                          {u.id !== currentUser.id && (
                            <button
                              onClick={() => handleDelete(u.id)}
                              style={styles.deleteBtn}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {pwdId === u.id && (
                      <tr key={`pwd-${u.id}`}>
                        <td colSpan="5" style={styles.pwdRow}>
                          <div style={styles.pwdForm}>
                            <span style={{ fontSize: '13px', color: '#555', fontWeight: '600' }}>
                              New password for {u.full_name}:
                            </span>
                            <input
                              type="password"
                              placeholder="Enter new password"
                              value={newPwd}
                              onChange={(e) => setNewPwd(e.target.value)}
                              style={{ ...styles.input, width: '220px' }}
                            />
                            <button
                              onClick={() => handleChangePassword(u.id)}
                              style={styles.submitBtn}
                            >
                              Update
                            </button>
                            <button
                              onClick={() => { setPwdId(null); setNewPwd(''); }}
                              style={styles.cancelBtn}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#fff', padding: '20px 24px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#302e2e', margin: '0 0 4px' },
  pageSubtitle: { fontSize: '14px', color: '#888', margin: 0 },
  addBtn: { padding: '10px 20px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  message: { padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '500' },
  form: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  submitBtn: { padding: '10px 20px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  empty: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  nameRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#c4607a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 },
  badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  actionRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  pwdBtn: { padding: '6px 12px', backgroundColor: '#eaf4fb', color: '#2980b9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#fdf0f3', color: '#c4607a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  pwdRow: { backgroundColor: '#f8f9fa', padding: '12px 16px' },
  pwdForm: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
};

export default Users;
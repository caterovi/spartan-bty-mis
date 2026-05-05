import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserRound,
  UsersRound,
  ShieldCheck,
  BriefcaseBusiness,
  Package,
  Search,
  SlidersHorizontal,
  MoreVertical,
  KeyRound,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';

function Users() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [pwdId, setPwdId] = useState(null);
  const [newPwd, setNewPwd] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [openMenu, setOpenMenu] = useState(null);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'sales',
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!['admin', 'hr'].includes(currentUser.role)) {
      navigate('/dashboard');
      return;
    }

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      showMsg('Error loading users.', 'error');
    }
  };

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.password || !form.role) {
      showMsg('Please complete all fields.', 'error');
      return;
    }

    try {
      await api.post('/auth/register', form);
      showMsg('User created successfully.');
      setShowForm(false);
      setForm({ full_name: '', email: '', password: '', role: 'sales' });
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error creating user.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) {
      showMsg('You cannot delete your own account.', 'error');
      return;
    }

    if (!window.confirm('Delete this user?')) return;

    try {
      await api.delete(`/auth/users/${id}`);
      showMsg('User deleted.');
      setOpenMenu(null);
      fetchUsers();
    } catch (err) {
      showMsg('Error deleting user.', 'error');
    }
  };

  const handleChangePassword = async (id) => {
    if (!newPwd) {
      showMsg('Please enter a new password.', 'error');
      return;
    }

    try {
      await api.put(`/auth/users/${id}/password`, { password: newPwd });
      showMsg('Password updated successfully.');
      setPwdId(null);
      setNewPwd('');
      setOpenMenu(null);
    } catch (err) {
      showMsg('Error updating password.', 'error');
    }
  };

  const roles = ['admin', 'marketing', 'sales', 'logistics', 'crm', 'inventory', 'hr'];

  const roleLabels = {
    admin: 'Admin',
    marketing: 'Marketing',
    sales: 'Sales',
    logistics: 'Logistics',
    crm: 'CRM',
    inventory: 'Inventory',
    hr: 'HR',
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users.filter((u) => {
      const matchesSearch =
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'admin').length,
      hr: users.filter((u) => u.role === 'hr').length,
      inventory: users.filter((u) => u.role === 'inventory').length,
    };
  }, [users]);

  const getInitial = (name = '') => name.charAt(0).toUpperCase() || '?';

  const formatDate = (date) => {
    if (!date) return 'N/A';

    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <style>{`
        .users-page {
          --users-brand: #c4607a;
          --users-brand-dark: #a94d65;
          --users-brand-light: #fdf0f3;
          --users-canvas: #fff8fb;
          --users-surface: #ffffff;
          --users-overlay: #f8fafc;
          --users-text: #1f2937;
          --users-muted: #64748b;
          --users-border: #d1d5db;
          --users-border-soft: #e5e7eb;
          --users-success: #15803d;
          --users-success-bg: #ecfdf5;
          --users-danger: #be123c;
          --users-danger-bg: #fff1f2;
          --users-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          --users-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
          --users-radius-sm: 6px;
          --users-radius-md: 10px;
          --users-radius-lg: 14px;
          --users-radius-xl: 18px;
          --users-radius-full: 9999px;
          --users-transition: 180ms ease;

          display: flex;
          flex-direction: column;
          gap: 18px;
          color: var(--users-text);
          animation: usersFadeIn 220ms ease;
        }

        @keyframes usersFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .users-card {
          background: var(--users-surface);
          border: 1px solid var(--users-border);
          border-radius: var(--users-radius-xl);
          box-shadow: var(--users-shadow-sm);
        }

        .users-card:hover {
          box-shadow: var(--users-shadow-md);
          transform: translateY(-2px);
        }

        .users-card,
        .users-btn,
        .users-input,
        .users-select,
        .users-menu-btn,
        .users-dropdown-item {
          transition:
            color var(--users-transition),
            background-color var(--users-transition),
            border-color var(--users-transition),
            box-shadow var(--users-transition),
            transform var(--users-transition),
            opacity var(--users-transition);
        }

        .users-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 24px;
        }

        .users-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .users-header-icon {
          width: 52px;
          height: 52px;
          border-radius: var(--users-radius-lg);
          background: var(--users-brand-light);
          border: 1px solid #e6aabd;
          color: var(--users-brand);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .users-title {
          margin: 0;
          font-size: 26px;
          line-height: 1.15;
          font-weight: 800;
          color: var(--users-text);
        }

        .users-subtitle {
          margin: 6px 0 0;
          font-size: 14px;
          color: var(--users-muted);
        }

        .users-btn {
          border: 1px solid transparent;
          border-radius: var(--users-radius-sm);
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          white-space: nowrap;
        }

        .users-btn:hover {
          transform: scale(1.01);
          box-shadow: var(--users-shadow-sm);
        }

        .users-btn-primary {
          background: var(--users-brand);
          color: #ffffff;
          padding: 11px 18px;
        }

        .users-btn-primary:hover {
          background: var(--users-brand-dark);
        }

        .users-btn-secondary {
          background: var(--users-surface);
          color: var(--users-text);
          border-color: var(--users-border);
          padding: 11px 18px;
        }

        .users-btn-secondary:hover {
          border-color: var(--users-brand);
          color: var(--users-brand);
        }

        .users-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .users-stat {
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .users-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: var(--users-radius-md);
          background: var(--users-brand-light);
          border: 1px solid #e6aabd;
          color: var(--users-brand);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .users-stat-label {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--users-muted);
        }

        .users-stat-value {
          margin: 2px 0;
          font-size: 24px;
          line-height: 1;
          font-weight: 800;
          color: var(--users-text);
        }

        .users-stat-note {
          margin: 0;
          font-size: 12px;
          color: var(--users-muted);
        }

        .users-message {
          padding: 12px 14px;
          border-radius: var(--users-radius-md);
          border: 1px solid var(--users-border);
          font-size: 14px;
          font-weight: 700;
        }

        .users-message-success {
          background: var(--users-success-bg);
          border-color: #86efac;
          color: var(--users-success);
        }

        .users-message-error {
          background: var(--users-danger-bg);
          border-color: #fda4af;
          color: var(--users-danger);
        }

        .users-form {
          padding: 22px;
        }

        .users-form-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: var(--users-text);
        }

        .users-form-subtitle {
          margin: 4px 0 18px;
          font-size: 13px;
          color: var(--users-muted);
        }

        .users-form-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .users-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .users-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--users-text);
        }

        .users-input,
        .users-select {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border-radius: var(--users-radius-sm);
          border: 1px solid var(--users-border);
          background: var(--users-surface);
          color: var(--users-text);
          outline: none;
          font-size: 14px;
        }

        .users-input:focus,
        .users-select:focus {
          border-color: var(--users-brand);
          box-shadow: 0 0 0 3px rgba(196, 96, 122, 0.16);
        }

        .users-form-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .users-table-card {
          padding: 22px;
        }

        .users-toolbar {
          display: grid;
          grid-template-columns: minmax(240px, 1fr) 220px 150px;
          gap: 12px;
          margin-bottom: 18px;
        }

        .users-search {
          position: relative;
        }

        .users-search svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--users-muted);
        }

        .users-search .users-input {
          padding-left: 40px;
        }

        .users-filter-btn {
          background: var(--users-surface);
          border-color: var(--users-border);
          color: var(--users-brand);
        }

        .users-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .users-table-wrap::-webkit-scrollbar {
          height: 8px;
        }

        .users-table-wrap::-webkit-scrollbar-thumb {
          background: #d8a4b4;
          border-radius: var(--users-radius-full);
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
        }

        .users-table thead {
          background: var(--users-overlay);
          border-bottom: 1px solid var(--users-border);
        }

        .users-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 13px;
          font-weight: 800;
          color: var(--users-muted);
          white-space: nowrap;
        }

        .users-table td {
          padding: 14px 16px;
          font-size: 14px;
          border-bottom: 1px solid var(--users-border-soft);
          color: var(--users-text);
          vertical-align: middle;
        }

        .users-user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .users-avatar {
          width: 38px;
          height: 38px;
          border-radius: var(--users-radius-full);
          background: var(--users-brand);
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .users-name {
          font-size: 14px;
          font-weight: 800;
          color: var(--users-text);
          white-space: nowrap;
        }

        .users-current {
          margin-top: 2px;
          font-size: 11px;
          font-weight: 700;
          color: var(--users-brand);
        }

        .users-email {
          max-width: 280px;
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: middle;
        }

        .users-role {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: var(--users-radius-full);
          background: var(--users-brand-light);
          border: 1px solid #e6aabd;
          color: var(--users-brand);
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .users-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 10px;
          border-radius: var(--users-radius-full);
          background: var(--users-success-bg);
          border: 1px solid #86efac;
          color: var(--users-success);
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .users-status-dot {
          width: 7px;
          height: 7px;
          border-radius: var(--users-radius-full);
          background: var(--users-success);
        }

        .users-actions {
          position: relative;
          text-align: right;
        }

        .users-menu-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--users-radius-sm);
          border: 1px solid var(--users-border);
          background: var(--users-surface);
          color: var(--users-text);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .users-menu-btn:hover {
          border-color: var(--users-brand);
          color: var(--users-brand);
          box-shadow: var(--users-shadow-sm);
        }

        .users-dropdown {
          position: absolute;
          right: 16px;
          top: 52px;
          width: 190px;
          padding: 6px;
          border-radius: var(--users-radius-md);
          border: 1px solid var(--users-border);
          background: var(--users-surface);
          box-shadow: var(--users-shadow-md);
          z-index: 30;
          text-align: left;
        }

        .users-dropdown-item {
          width: 100%;
          padding: 10px;
          border: 0;
          border-radius: var(--users-radius-sm);
          background: transparent;
          color: var(--users-text);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
          font-weight: 700;
          text-align: left;
        }

        .users-dropdown-item:hover {
          background: var(--users-overlay);
        }

        .users-dropdown-danger {
          color: var(--users-danger);
        }

        .users-password-row {
          background: var(--users-overlay);
        }

        .users-password-form {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .users-password-label {
          font-size: 13px;
          font-weight: 800;
          color: var(--users-text);
        }

        .users-empty {
          padding: 42px 16px !important;
          text-align: center;
          color: var(--users-muted) !important;
          font-weight: 700;
        }

        .users-footer {
          padding-top: 16px;
          font-size: 13px;
          font-weight: 700;
          color: var(--users-muted);
        }

        @media (max-width: 1024px) {
          .users-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .users-form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .users-toolbar {
            grid-template-columns: 1fr 180px 140px;
          }
        }

        @media (max-width: 768px) {
          .users-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .users-header-left {
            align-items: flex-start;
          }

          .users-title {
            font-size: 23px;
          }

          .users-btn-primary {
            width: 100%;
          }

          .users-stats,
          .users-form-grid,
          .users-toolbar {
            grid-template-columns: 1fr;
          }

          .users-table {
            min-width: 920px;
          }

          .users-table-card,
          .users-form,
          .users-header {
            padding: 18px;
          }
        }
      `}</style>

      <div className="users-page">
        <section className="users-card users-header">
          <div className="users-header-left">
            <div className="users-header-icon">
              <UsersRound size={25} />
            </div>
            <div>
              <h1 className="users-title">User Management</h1>
              <p className="users-subtitle">Manage accounts, access roles, and password security.</p>
            </div>
          </div>

          <button className="users-btn users-btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? 'Cancel' : 'Add User'}
          </button>
        </section>

        <section className="users-stats">
          <StatCard icon={<UsersRound size={20} />} label="Total Users" value={stats.total} note="All registered accounts" />
          <StatCard icon={<ShieldCheck size={20} />} label="Administrators" value={stats.admins} note="System admin accounts" />
          <StatCard icon={<BriefcaseBusiness size={20} />} label="HR Users" value={stats.hr} note="Human resources access" />
          <StatCard icon={<Package size={20} />} label="Inventory Users" value={stats.inventory} note="Inventory module access" />
        </section>

        {message.text && (
          <div className={`users-message ${message.type === 'error' ? 'users-message-error' : 'users-message-success'}`}>
            {message.text}
          </div>
        )}

        {showForm && (
          <section className="users-card users-form">
            <h2 className="users-form-title">Create New User</h2>
            <p className="users-form-subtitle">Add a new system user and assign the correct module access.</p>

            <div className="users-form-grid">
              <Field label="Full Name">
                <input
                  className="users-input"
                  type="text"
                  placeholder="Enter full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </Field>

              <Field label="Email">
                <input
                  className="users-input"
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>

              <Field label="Password">
                <input
                  className="users-input"
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </Field>

              <Field label="Role">
                <select
                  className="users-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="users-form-actions">
              <button className="users-btn users-btn-primary" onClick={handleSubmit}>
                Create User
              </button>
              <button className="users-btn users-btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </section>
        )}

        <section className="users-card users-table-card">
          <div className="users-toolbar">
            <div className="users-search">
              <Search size={17} />
              <input
                className="users-input"
                type="text"
                placeholder="Search users"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="users-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>

            <button
              className="users-btn users-filter-btn"
              onClick={() => {
                setSearch('');
                setRoleFilter('all');
              }}
            >
              <SlidersHorizontal size={16} />
              Reset
            </button>
          </div>

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Date Added</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td className="users-empty" colSpan="6">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <Fragment key={user.id}>
                      <tr>
                        <td>
                          <div className="users-user-cell">
                            <div className="users-avatar">{getInitial(user.full_name)}</div>
                            <div>
                              <div className="users-name">{user.full_name}</div>
                              {user.id === currentUser.id && (
                                <div className="users-current">Current account</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="users-email">{user.email}</span>
                        </td>

                        <td>
                          <span className="users-role">
                            <UserRound size={13} />
                            {roleLabels[user.role] || user.role}
                          </span>
                        </td>

                        <td>{formatDate(user.created_at)}</td>

                        <td>
                          <span className="users-status">
                            <span className="users-status-dot"></span>
                            Active
                          </span>
                        </td>

                        <td className="users-actions">
                          <button
                            className="users-menu-btn"
                            onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openMenu === user.id && (
                            <div className="users-dropdown">
                              <button
                                className="users-dropdown-item"
                                onClick={() => {
                                  setPwdId(pwdId === user.id ? null : user.id);
                                  setOpenMenu(null);
                                }}
                              >
                                <KeyRound size={15} />
                                Change Password
                              </button>

                              {user.id !== currentUser.id && (
                                <button
                                  className="users-dropdown-item users-dropdown-danger"
                                  onClick={() => handleDelete(user.id)}
                                >
                                  <Trash2 size={15} />
                                  Delete User
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>

                      {pwdId === user.id && (
                        <tr className="users-password-row">
                          <td colSpan="6">
                            <div className="users-password-form">
                              <span className="users-password-label">
                                New password for {user.full_name}
                              </span>
                              <input
                                className="users-input"
                                style={{ maxWidth: '260px' }}
                                type="password"
                                placeholder="Enter new password"
                                value={newPwd}
                                onChange={(e) => setNewPwd(e.target.value)}
                              />
                              <button
                                className="users-btn users-btn-primary"
                                onClick={() => handleChangePassword(user.id)}
                              >
                                Update
                              </button>
                              <button
                                className="users-btn users-btn-secondary"
                                onClick={() => {
                                  setPwdId(null);
                                  setNewPwd('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="users-footer">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </section>
      </div>
    </Layout>
  );
}

function StatCard({ icon, label, value, note }) {
  return (
    <div className="users-card users-stat">
      <div className="users-stat-icon">{icon}</div>
      <div>
        <p className="users-stat-label">{label}</p>
        <h2 className="users-stat-value">{value}</h2>
        <p className="users-stat-note">{note}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="users-field">
      <label className="users-label">{label}</label>
      {children}
    </div>
  );
}

export default Users;
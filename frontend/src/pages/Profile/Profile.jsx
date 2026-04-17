import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import { FaUser, FaIdCard, FaAt, FaAddressBook, FaKey } from "react-icons/fa";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage]     = useState({ text: '', type: '' });
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '' });
  const [pwdForm, setPwdForm]     = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    setProfileForm({ full_name: u.full_name, email: u.email });
  }, []);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await api.put(`/auth/users/${user.id}/profile`, profileForm);
      const updated = { ...user, ...profileForm };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      showMsg('Profile updated successfully!');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error updating profile.', 'error');
    } finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      showMsg('New passwords do not match.', 'error');
      return;
    }
    if (pwdForm.new_password.length < 6) {
      showMsg('Password must be at least 6 characters.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/auth/users/${user.id}/change-password`, {
        current_password: pwdForm.current_password,
        new_password:     pwdForm.new_password,
      });
      showMsg('Password changed successfully!');
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error changing password.', 'error');
    } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <Layout>
      <div style={styles.wrapper}>
        {/* Fixed Header */}
        <div style={styles.fixedHeader}>
          <div style={styles.titleRow}>
            <div style={styles.avatarLarge}>
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={styles.pageTitle}>{user.full_name}</h1>
              <span style={styles.roleBadge}>{user.role.toUpperCase()}</span>
            </div>
          </div>
          <div style={styles.tabs}>
            {[
              { key: 'profile',  icon: <FaUser />, label: 'View Profile' },
              { key: 'password', icon: <FaKey />, label: 'Change Password' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={activeTab === tab.key ? styles.tabActive : styles.tab}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={styles.scrollContent}>
          <div style={styles.contentBox}>

            {message.text && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: message.type === 'error' ? '#f8d7da' : '#d4edda',
                color:           message.type === 'error' ? '#721c24' : '#155724',
                border:          `1px solid ${message.type === 'error' ? '#f5c6cb' : '#c3e6cb'}`,
              }}>
                {message.type === 'success' ? ' ' : ' '}{message.text}
              </div>
            )}

            {/* View Profile Tab */}
            {activeTab === 'profile' && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Profile Information</h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoCard}>
                    <div style={styles.infoIcon}><FaUser /></div>
                    <div>
                      <p style={styles.infoLabel}>Full Name</p>
                      <p style={styles.infoValue}>{user.full_name}</p>
                    </div>
                  </div>
                  <div style={styles.infoCard}>
                    <div style={styles.infoIcon}><FaAt /></div>
                    <div>
                      <p style={styles.infoLabel}>Email Address</p>
                      <p style={styles.infoValue}>{user.email}</p>
                    </div>
                  </div>
                  <div style={styles.infoCard}>
                    <div style={styles.infoIcon}><FaAddressBook /></div>
                    <div>
                      <p style={styles.infoLabel}>Role</p>
                      <p style={styles.infoValue}>{user.role.toUpperCase()}</p>
                    </div>
                  </div>
                  <div style={styles.infoCard}>
                    <div style={styles.infoIcon}><FaIdCard /></div>
                    <div>
                      <p style={styles.infoLabel}>User ID</p>
                      <p style={styles.infoValue}>#{user.id}</p>
                    </div>
                  </div>
                </div>

                <h3 style={{ ...styles.sectionTitle, marginTop: '28px' }}>Edit Profile</h3>
                <div style={styles.formGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  style={loading ? styles.btnDisabled : styles.btn}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Change Password</h3>
                <p style={styles.pwdNote}>
                  Your password must be at least 6 characters long.
                </p>
                <div style={styles.pwdForm}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={pwdForm.current_password}
                      onChange={e => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={pwdForm.new_password}
                      onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={pwdForm.confirm_password}
                      onChange={e => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  style={loading ? styles.btnDisabled : styles.btn}
                >
                  {loading ? 'Updating...' : ' Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' },
  fixedHeader: { backgroundColor: '#fff', borderRadius: '14px', padding: '20px 24px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0 },
  titleRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  avatarLarge: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#c4607a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', flexShrink: 0 },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#302e2e', margin: '0 0 6px' },
  roleBadge: { backgroundColor: '#fdf0f3', color: '#c4607a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  tabs: { display: 'flex', gap: '8px' },
  tab: { padding: '10px 16px', borderRadius: '8px 8px 0 0', border: '1px solid #ddd', borderBottom: 'none', backgroundColor: '#f8f9fa', cursor: 'pointer', fontSize: '13px', color: '#555' },
  tabActive: { padding: '10px 16px', borderRadius: '8px 8px 0 0', border: '1px solid #c4607a', borderBottom: '2px solid #fff', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', color: '#c4607a', fontWeight: '600' },
  scrollContent: { flex: 1, overflowY: 'auto' },
  contentBox: { backgroundColor: '#fff', borderRadius: '0 0 14px 14px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: '100%' },
  section: {},
  sectionTitle: { fontSize: '17px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '12px' },
  infoCard: { display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px' },
  infoIcon: { fontSize: '24px', flexShrink: 0 },
  infoLabel: { fontSize: '12px', color: '#888', margin: '0 0 4px' },
  infoValue: { fontSize: '15px', fontWeight: '600', color: '#302e2e', margin: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px', maxWidth: '600px' },
  pwdForm: { display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', marginBottom: '20px' },
  pwdNote: { fontSize: '13px', color: '#888', backgroundColor: '#f8f9fa', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: { padding: '11px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  btn: { padding: '11px 24px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  btnDisabled: { padding: '11px 24px', backgroundColor: '#e8a0b0', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontSize: '14px', fontWeight: '600' },
};

export default Profile;
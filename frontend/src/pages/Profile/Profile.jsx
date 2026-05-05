import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import {
  FaUser, FaIdCard, FaAt, FaAddressBook, FaKey,
  FaShieldAlt, FaCamera, FaTrash, FaCheckCircle,
  FaTimesCircle, FaClock, FaEdit, FaLock, FaImage,
  FaEye, FaEyeSlash, FaInfoCircle, FaExclamationTriangle,
  FaHistory, FaSignInAlt
} from 'react-icons/fa';

/* ─── Design Tokens ──────────────────────────────────────────── */
const T = {
  brand:        '#ff5f93',
  brandLight:   '#fff0f4',
  brandMid:     '#ffd6e4',
  brandDark:    '#d94a76',
  canvas:       '#faf9fb',
  surface:      '#ffffff',
  overlay:      '#f5f4f7',
  textPrimary:  '#1e1a22',
  textSecondary:'#6b6475',
  textMuted:    '#a097aa',
  border:       '#e8e2ee',
  borderStrong: '#cfc8d8',
  success:      '#16a34a',
  successBg:    '#f0fdf4',
  successBorder:'#86efac',
  warning:      '#d97706',
  warningBg:    '#fffbeb',
  warningBorder:'#fde68a',
  error:        '#dc2626',
  errorBg:      '#fef2f2',
  errorBorder:  '#fca5a5',
  shadowSm:     '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
  shadowMd:     '0 4px 16px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)',
  shadowLg:     '0 8px 32px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.05)',
  shadowPink:   '0 4px 20px rgba(255,95,147,0.25)',
};

/* ─── Activity log helpers ───────────────────────────────────── */
const ACTIVITY_KEY = 'profile_activity_log';

function getActivityLog() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
  } catch { return []; }
}

function pushActivity(type, label) {
  const log = getActivityLog();
  const entry = { type, label, time: new Date().toISOString() };
  const updated = [entry, ...log].slice(0, 10); // keep last 10
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
  return updated;
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

const ACTIVITY_ICONS = {
  view:     FaUser,
  login:    FaSignInAlt,
  edit:     FaEdit,
  password: FaKey,
  avatar:   FaCamera,
  remove_avatar: FaTrash,
};

const ACTIVITY_COLORS = {
  view:     '#ff5f93',
  login:    '#16a34a',
  edit:     '#f59e0b',
  password: '#6366f1',
  avatar:   '#ff5f93',
  remove_avatar: '#dc2626',
};

/* ─── Sub-components ─────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
      fontSize: '13px', fontWeight: '500',
      backgroundColor: isSuccess ? T.successBg : T.errorBg,
      color: isSuccess ? T.success : T.error,
      border: `1px solid ${isSuccess ? T.successBorder : T.errorBorder}`,
      animation: 'fadeIn 0.18s ease',
    }}>
      {isSuccess ? <FaCheckCircle style={{ flexShrink: 0 }} /> : <FaTimesCircle style={{ flexShrink: 0 }} />}
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1, fontSize: '16px' }}>×</button>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, hint, toggleable, fullWidth }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputType = toggleable ? (show ? 'text' : 'password') : type;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: fullWidth ? '100%' : 'auto' }}>
      <label style={s.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...s.input,
            paddingRight: toggleable ? '44px' : '14px',
            borderColor: focused ? T.brand : T.border,
            boxShadow: focused ? '0 0 0 3px rgba(255,95,147,0.12)' : 'none',
            outline: 'none',
          }}
        />
        {toggleable && (
          <button type="button" onClick={() => setShow(v => !v)} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, lineHeight: 1,
          }}>
            {show ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: '11px', color: T.textMuted, margin: 0 }}>{hint}</p>}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '16px 18px', backgroundColor: T.surface,
      borderRadius: '14px', border: `1px solid ${T.border}`,
      boxShadow: T.shadowSm, transition: 'box-shadow 180ms ease, transform 180ms ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowMd; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadowSm; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        backgroundColor: accent ? T.brandLight : T.overlay,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent ? T.brand : T.textSecondary, flexShrink: 0,
      }}>
        <Icon size={16} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '11px', color: T.textMuted, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>{label}</p>
        <p style={{ fontSize: '14px', fontWeight: '600', color: T.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '700', color: T.textPrimary, margin: '0 0 4px' }}>{title}</h3>
      {subtitle && <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

function StatusBlock({ icon: Icon, label, value, color, bg, borderColor }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '16px 18px', backgroundColor: bg,
      borderRadius: '14px', border: `1px solid ${borderColor || color + '30'}`,
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '10px',
        backgroundColor: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0,
      }}>
        <Icon size={15} />
      </div>
      <div>
        <p style={{ fontSize: '11px', color: T.textMuted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>{label}</p>
        <p style={{ fontSize: '14px', fontWeight: '700', color, margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Tabs ───────────────────────────────────────────────────── */
const TABS = [
  { key: 'overview',  icon: FaUser,   label: 'Overview'     },
  { key: 'edit',      icon: FaEdit,   label: 'Edit Profile' },
  { key: 'security',  icon: FaLock,   label: 'Security'     },
  { key: 'avatar',    icon: FaImage,  label: 'Appearance'   },
];

/* ─── Main ───────────────────────────────────────────────────── */
export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user,        setUser]        = useState(null);
  const [activeTab,   setActiveTab]   = useState('overview');
  const [message,     setMessage]     = useState({ text: '', type: '' });
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '' });
  const [pwdForm,     setPwdForm]     = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading,     setLoading]     = useState(false);
  const [avatar,      setAvatar]      = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    setProfileForm({ full_name: u.full_name, email: u.email });
    if (u.avatar) setAvatar(u.avatar);

    // Log "profile viewed" on mount
    const log = pushActivity('view', 'Profile viewed');
    setActivityLog(log);
  }, []);

  // Also seed login event once per session
  useEffect(() => {
    const seeded = sessionStorage.getItem('login_seeded');
    if (!seeded) {
      pushActivity('login', 'Login from new session');
      sessionStorage.setItem('login_seeded', '1');
      setActivityLog(getActivityLog());
    } else {
      setActivityLog(getActivityLog());
    }
  }, []);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  /* ── Derived status values ── */
  const isProfileComplete = user && user.full_name && user.email && user.full_name.trim() && user.email.trim();
  const memberYear = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : '2024';
  const hasAvatar = !!avatar;

  /* ── Update profile ── */
  const handleUpdateProfile = async () => {
    if (!profileForm.full_name.trim() || !profileForm.email.trim()) {
      showMsg('Name and email cannot be empty.', 'error'); return;
    }
    setLoading(true);
    try {
      await api.put(`/auth/users/${user.id}/profile`, profileForm);
      const updated = { ...user, ...profileForm };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      const log = pushActivity('edit', 'Account details updated');
      setActivityLog(log);
      showMsg('Profile updated successfully!');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error updating profile.', 'error');
    } finally { setLoading(false); }
  };

  /* ── Change password ── */
  const handleChangePassword = async () => {
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      showMsg('New passwords do not match.', 'error'); return;
    }
    if (pwdForm.new_password.length < 6) {
      showMsg('Password must be at least 6 characters.', 'error'); return;
    }
    setLoading(true);
    try {
      await api.put(`/auth/users/${user.id}/change-password`, {
        current_password: pwdForm.current_password,
        new_password:     pwdForm.new_password,
      });
      const log = pushActivity('password', 'Password last changed');
      setActivityLog(log);
      showMsg('Password changed successfully!');
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error changing password.', 'error');
    } finally { setLoading(false); }
  };

  /* ── Avatar: file select ── */
  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showMsg('Only JPG, PNG, and WEBP images are allowed.', 'error'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showMsg('Image size must not exceed 2MB.', 'error'); return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* ── Avatar: save ── */
  const handleSaveAvatar = () => {
    if (!avatarPreview) { showMsg('No image selected.', 'error'); return; }
    setAvatarLoading(true);
    setTimeout(() => {
      const updated = { ...user, avatar: avatarPreview };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setAvatar(avatarPreview);
      setAvatarPreview(null);
      setAvatarLoading(false);
      const log = pushActivity('avatar', 'Profile photo changed');
      setActivityLog(log);
      // Notify Layout and Dashboard
      window.dispatchEvent(new Event('profileAvatarUpdated'));
      showMsg('Avatar updated successfully!');
    }, 500);
  };

  /* ── Avatar: remove ── */
  const handleRemoveAvatar = () => {
    const updated = { ...user };
    delete updated.avatar;
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    setAvatar(null);
    setAvatarPreview(null);
    const log = pushActivity('remove_avatar', 'Profile photo removed');
    setActivityLog(log);
    window.dispatchEvent(new Event('profileAvatarUpdated'));
    showMsg('Avatar removed. Showing initials fallback.');
  };

  if (!user) return null;

  const initials = user.full_name ? user.full_name.charAt(0).toUpperCase() : '?';

  return (
    <Layout>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ptab:hover { background-color: ${T.brandLight} !important; color: ${T.brand} !important; }
        .ptab.active { background-color: ${T.brandLight} !important; color: ${T.brand} !important; border-color: ${T.brandMid} !important; font-weight: 600 !important; }
        .psave:hover:not(:disabled) { background-color: ${T.brandDark} !important; box-shadow: ${T.shadowPink} !important; transform: translateY(-1px); }
        .psave:disabled { opacity: 0.6 !important; cursor: not-allowed !important; }
        .pghost:hover { background-color: ${T.brandLight} !important; color: ${T.brand} !important; border-color: ${T.brandMid} !important; }
        .pdanger:hover { background-color: #fef2f2 !important; color: #dc2626 !important; border-color: #fca5a5 !important; }
        .icard:hover { box-shadow: ${T.shadowMd} !important; transform: translateY(-1px) !important; }
        .drop-zone:hover { background-color: ${T.brandMid} !important; border-color: ${T.brand} !important; }
        .aoverlay { opacity: 0 !important; transition: opacity 180ms ease !important; }
        .aring:hover .aoverlay { opacity: 1 !important; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .profile-header-inner { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .profile-header-meta  { align-items: center !important; justify-content: center !important; }
          .profile-tab-row      { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; flex-wrap: nowrap !important; padding-bottom: 2px !important; }
          .profile-tab-row::-webkit-scrollbar { height: 3px; }
          .profile-tab-row::-webkit-scrollbar-thumb { background: ${T.brandMid}; border-radius: 4px; }
          .info-grid            { grid-template-columns: 1fr 1fr !important; }
          .status-grid          { grid-template-columns: 1fr !important; }
          .form-grid-2          { grid-template-columns: 1fr !important; }
          .btn-group            { flex-direction: column !important; }
          .btn-group button     { width: 100% !important; justify-content: center !important; }
          .avatar-upload-row    { flex-direction: column !important; align-items: center !important; }
          .content-area         { padding: 18px !important; }
          .header-card          { padding: 16px 16px 0 !important; }
        }
        @media (max-width: 480px) {
          .info-grid            { grid-template-columns: 1fr !important; }
          .profile-tab-btn-label { display: none !important; }
        }
      `}</style>

      <div style={s.wrapper}>
        {/* ── Header card ── */}
        <div style={s.headerCard} className="header-card">
          <div style={s.headerInner} className="profile-header-inner">
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }} className="aring">
              <div style={{
                width: '72px', height: '72px', borderRadius: '9999px',
                backgroundColor: avatar ? 'transparent' : T.brand,
                border: `3px solid ${T.surface}`, boxShadow: T.shadowPink,
                overflow: 'hidden', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              }} onClick={() => setActiveTab('avatar')}>
                {avatar
                  ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '28px', fontWeight: '700', color: '#fff', lineHeight: 1 }}>{initials}</span>
                }
              </div>
              <div className="aoverlay" onClick={() => setActiveTab('avatar')} style={{
                position: 'absolute', inset: 0, borderRadius: '9999px',
                backgroundColor: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <FaCamera size={16} color="#fff" />
              </div>
            </div>

            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }} className="profile-header-meta">
                <h1 style={{ fontSize: '22px', fontWeight: '700', color: T.textPrimary, margin: 0, lineHeight: 1.2 }}>
                  {user.full_name}
                </h1>
                <span style={{
                  backgroundColor: T.brandLight, color: T.brand,
                  padding: '3px 10px', borderRadius: '9999px',
                  fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em',
                  border: `1px solid ${T.brandMid}`,
                }}>
                  {user.role.toUpperCase()}
                </span>
                <span style={{
                  backgroundColor: '#f0fdf4', color: '#16a34a',
                  padding: '3px 10px', borderRadius: '9999px',
                  fontSize: '11px', fontWeight: '600', letterSpacing: '0.04em',
                  border: '1px solid #86efac',
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} />
                  Active
                </span>
              </div>
              <p style={{ fontSize: '13px', color: T.textSecondary, margin: 0 }}>{user.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={s.tabRow} className="profile-tab-row">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`ptab${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  ...s.tabBtn,
                  ...(activeTab === tab.key ? s.tabBtnActive : {}),
                }}
              >
                <tab.icon size={13} />
                <span className="profile-tab-btn-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div style={s.scrollArea}>
          <div style={s.contentArea} className="content-area">
            <Toast message={message.text} type={message.type} onClose={() => setMessage({ text: '', type: '' })} />

            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <div>
                <SectionHeader title="Profile Information" subtitle="Your account details at a glance" />
                <div style={s.infoGrid} className="info-grid">
                  <InfoCard icon={FaUser}       label="Full Name"     value={user.full_name}         accent />
                  <InfoCard icon={FaAt}          label="Email Address" value={user.email}              />
                  <InfoCard icon={FaAddressBook} label="Role"          value={user.role.toUpperCase()} accent />
                  <InfoCard icon={FaIdCard}      label="User ID"       value={`#${user.id}`}          />
                </div>

                <div style={{ marginTop: '28px' }}>
                  <SectionHeader title="Account Status" subtitle="Live values based on your account data" />
                  <div style={s.statusGrid} className="status-grid">
                    <StatusBlock
                      icon={FaShieldAlt}
                      label="Account Security"
                      value={isProfileComplete ? 'Protected' : 'Needs Attention'}
                      color={isProfileComplete ? T.success : T.warning}
                      bg={isProfileComplete ? T.successBg : T.warningBg}
                      borderColor={isProfileComplete ? T.successBorder : T.warningBorder}
                    />
                    <StatusBlock
                      icon={isProfileComplete ? FaCheckCircle : FaExclamationTriangle}
                      label="Profile Status"
                      value={isProfileComplete ? 'Complete' : 'Incomplete'}
                      color={isProfileComplete ? T.brand : T.warning}
                      bg={isProfileComplete ? T.brandLight : T.warningBg}
                      borderColor={isProfileComplete ? T.brandMid : T.warningBorder}
                    />
                    <StatusBlock
                      icon={FaClock}
                      label="Member Since"
                      value={String(memberYear)}
                      color={T.textSecondary}
                      bg={T.overlay}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '28px' }}>
                  <SectionHeader title="Recent Activity" subtitle="Latest account events" />
                  <ActivityTimeline log={activityLog} />
                </div>
              </div>
            )}

            {/* ── EDIT PROFILE ── */}
            {activeTab === 'edit' && (
              <div>
                <SectionHeader title="Edit Profile" subtitle="Update your personal information" />
                <div style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                  <InputField
                    label="Full Name"
                    value={profileForm.full_name}
                    onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder="Enter your full name"
                    fullWidth
                  />
                  <InputField
                    label="Email Address"
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="Enter your email"
                    fullWidth
                  />
                  <div className="btn-group" style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button className="psave" onClick={handleUpdateProfile} disabled={loading} style={s.primaryBtn}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === 'security' && (
              <div>
                <SectionHeader title="Change Password" subtitle="Keep your account secure with a strong password" />
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px 14px', borderRadius: '10px',
                  backgroundColor: T.warningBg, border: `1px solid ${T.warningBorder}`,
                  marginBottom: '24px', maxWidth: '520px',
                }}>
                  <FaInfoCircle size={14} color={T.warning} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '12px', color: '#92400e', margin: 0, lineHeight: '1.5' }}>
                    Password must be at least 6 characters. Avoid using easily guessable information.
                  </p>
                </div>
                <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                  <InputField label="Current Password" toggleable value={pwdForm.current_password}
                    onChange={e => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                    placeholder="Enter current password" fullWidth />
                  <InputField label="New Password" toggleable value={pwdForm.new_password}
                    onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                    placeholder="Enter new password" hint="Minimum 6 characters" fullWidth />
                  <InputField label="Confirm New Password" toggleable value={pwdForm.confirm_password}
                    onChange={e => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                    placeholder="Confirm new password" fullWidth />
                  <div className="btn-group" style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button className="psave" onClick={handleChangePassword} disabled={loading} style={s.primaryBtn}>
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '32px' }}>
                  <SectionHeader title="Security Overview" subtitle="Current security posture for your account" />
                  <div style={s.statusGrid} className="status-grid">
                    <StatusBlock
                      icon={FaShieldAlt}
                      label="2FA Status"
                      value="Not Enabled"
                      color={T.warning}
                      bg={T.warningBg}
                      borderColor={T.warningBorder}
                    />
                    <StatusBlock
                      icon={FaKey}
                      label="Password"
                      value={activityLog.some(a => a.type === 'password') ? 'Recently Changed' : 'Set'}
                      color={T.success}
                      bg={T.successBg}
                      borderColor={T.successBorder}
                    />
                    <StatusBlock
                      icon={FaCamera}
                      label="Profile Photo"
                      value={hasAvatar ? 'Uploaded' : 'Not Set'}
                      color={hasAvatar ? T.brand : T.textMuted}
                      bg={hasAvatar ? T.brandLight : T.overlay}
                      borderColor={hasAvatar ? T.brandMid : T.border}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── APPEARANCE / AVATAR ── */}
            {activeTab === 'avatar' && (
              <div>
                <SectionHeader title="Profile Picture" subtitle="Personalize your account with a photo" />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '28px', flexWrap: 'wrap', marginBottom: '28px' }} className="avatar-upload-row">
                  {/* Preview */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div style={{
                      width: '100px', height: '100px', borderRadius: '9999px',
                      backgroundColor: (avatarPreview || avatar) ? 'transparent' : T.brand,
                      border: `3px solid ${T.brandMid}`, boxShadow: T.shadowPink,
                      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {avatarPreview
                        ? <img src={avatarPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : avatar
                          ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '38px', fontWeight: '700', color: '#fff', lineHeight: 1 }}>{initials}</span>
                      }
                    </div>
                    <span style={{ fontSize: '11px', color: T.textMuted, textAlign: 'center' }}>
                      {avatarPreview ? 'Preview (unsaved)' : avatar ? 'Current avatar' : 'Initials fallback'}
                    </span>
                  </div>

                  {/* Controls */}
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <p style={{ fontSize: '13px', color: T.textSecondary, margin: '0 0 12px', lineHeight: '1.6' }}>
                      Upload a photo to personalize your profile. Your avatar is saved locally and stays after page refresh.
                    </p>
                    <ul style={{ fontSize: '12px', color: T.textMuted, paddingLeft: '16px', margin: '0 0 20px', lineHeight: '1.8' }}>
                      <li>Accepted formats: JPG, PNG, WEBP</li>
                      <li>Maximum file size: 2MB</li>
                      <li>Recommended: square image, at least 200×200px</li>
                    </ul>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleAvatarFileChange}
                      style={{ display: 'none' }}
                    />
                    <div className="btn-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button className="psave" onClick={() => fileInputRef.current.click()} style={s.primaryBtn}>
                        <FaCamera size={12} /> Choose Photo
                      </button>
                      {avatarPreview && (
                        <button className="psave" onClick={handleSaveAvatar} disabled={avatarLoading}
                          style={{ ...s.primaryBtn, backgroundColor: T.success }}>
                          {avatarLoading ? 'Saving...' : 'Save Avatar'}
                        </button>
                      )}
                      {(avatar || avatarPreview) && (
                        <button className="pdanger" onClick={() => avatarPreview ? setAvatarPreview(null) : handleRemoveAvatar()}
                          style={s.outlineBtn}>
                          <FaTrash size={12} />
                          {avatarPreview ? 'Cancel' : 'Remove Avatar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  className="drop-zone"
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    border: `2px dashed ${T.brandMid}`, borderRadius: '14px',
                    padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
                    backgroundColor: T.brandLight,
                    transition: 'background-color 180ms ease, border-color 180ms ease',
                    maxWidth: '420px',
                  }}
                >
                  <FaCamera size={24} color={T.brand} style={{ marginBottom: '10px' }} />
                  <p style={{ fontSize: '13px', fontWeight: '600', color: T.brand, margin: '0 0 4px' }}>
                    Click to upload a photo
                  </p>
                  <p style={{ fontSize: '11px', color: T.textMuted, margin: 0 }}>JPG, PNG, WEBP — up to 2MB</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ─── ActivityTimeline (dynamic) ─────────────────────────────── */
function ActivityTimeline({ log }) {
  if (!log || log.length === 0) {
    return <p style={{ fontSize: '13px', color: T.textMuted }}>No recent activity yet.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {log.slice(0, 6).map((item, i) => {
        const Icon  = ACTIVITY_ICONS[item.type] || FaHistory;
        const color = ACTIVITY_COLORS[item.type] || T.textMuted;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', paddingBottom: i < log.length - 1 ? '16px' : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9999px', flexShrink: 0,
                backgroundColor: `${color}15`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color,
              }}>
                <Icon size={12} />
              </div>
              {i < log.slice(0, 6).length - 1 && (
                <div style={{ width: '1px', flex: 1, backgroundColor: T.border, minHeight: '20px' }} />
              )}
            </div>
            <div style={{ paddingTop: '6px' }}>
              <p style={{ fontSize: '13px', fontWeight: '500', color: T.textPrimary, margin: '0 0 2px' }}>{item.label}</p>
              <p style={{ fontSize: '11px', color: T.textMuted, margin: 0 }}>{timeAgo(item.time)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const s = {
  wrapper: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' },
  headerCard: {
    backgroundColor: T.surface,
    borderRadius: '18px 18px 0 0',
    padding: '20px 24px 0',
    boxShadow: T.shadowSm,
    border: `1px solid ${T.border}`,
    borderBottom: 'none',
    flexShrink: 0,
  },
  headerInner: {
    display: 'flex', alignItems: 'center', gap: '18px',
    marginBottom: '20px', flexWrap: 'wrap',
  },
  tabRow: { display: 'flex', gap: '4px', marginTop: '4px' },
  tabBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 14px',
    borderRadius: '10px 10px 0 0',
    border: '1px solid transparent', borderBottom: 'none',
    backgroundColor: 'transparent', cursor: 'pointer',
    fontSize: '12px', fontWeight: '500', color: T.textSecondary,
    transition: 'all 140ms ease', whiteSpace: 'nowrap',
  },
  tabBtnActive: {
    backgroundColor: T.brandLight, color: T.brand,
    border: `1px solid ${T.brandMid}`, borderBottom: 'none',
  },
  scrollArea: { flex: 1, overflowY: 'auto' },
  contentArea: {
    backgroundColor: T.surface,
    borderRadius: '0 0 18px 18px',
    padding: '28px',
    border: `1px solid ${T.border}`,
    borderTop: `1px solid ${T.brandMid}`,
    minHeight: '100%', boxSizing: 'border-box',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px',
  },
  label: { fontSize: '12px', fontWeight: '600', color: T.textSecondary, letterSpacing: '0.02em' },
  input: {
    width: '100%', padding: '10px 14px',
    borderRadius: '6px', border: `1px solid ${T.border}`,
    fontSize: '13px', color: T.textPrimary,
    backgroundColor: T.surface,
    transition: 'border-color 140ms ease, box-shadow 140ms ease',
    boxSizing: 'border-box',
  },
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '10px 22px', backgroundColor: T.brand, color: '#fff',
    border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '600',
    transition: 'background-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
  },
  outlineBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '10px 18px', backgroundColor: 'transparent',
    color: T.error, border: `1px solid ${T.errorBorder}`,
    borderRadius: '6px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '500',
    transition: 'all 140ms ease',
  },
};
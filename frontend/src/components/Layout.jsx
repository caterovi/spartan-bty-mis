import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/spartanbtylogo.webp';
import NotificationBell from './NotificationBell';
import { MdDashboard } from "react-icons/md";
import { FaBullhorn, FaShoppingCart, FaTruck, FaComment, FaBoxes, FaUsers, FaFileAlt, FaUserCog, FaKey, FaUser, FaSignOutAlt, FaBell
 } from "react-icons/fa";

const roleAccess = {
  admin:     ['dashboard','marketing','sales','logistics','crm','inventory','hr','users','reports','profile'],
  hr:        ['dashboard','hr','users','reports','profile'],
  marketing: ['dashboard','marketing','reports','profile'],
  sales:     ['dashboard','sales','reports','profile'],
  logistics: ['dashboard','logistics','reports','profile'],
  crm:       ['dashboard','crm','reports','profile'],
  inventory: ['dashboard','inventory','reports','profile'],
};

const allNavItems = [
  { key: 'dashboard',  icon: <MdDashboard />, label: 'Dashboard',       path: '/dashboard' },
  { key: 'marketing',  icon: <FaBullhorn />, label: 'Marketing',       path: '/marketing' },
  { key: 'sales',      icon: <FaShoppingCart />, label: 'Sales',           path: '/sales' },
  { key: 'logistics',  icon: <FaTruck />, label: 'Logistics',       path: '/logistics' },
  { key: 'crm',        icon: <FaComment />, label: 'CRM',             path: '/crm' },
  { key: 'inventory',  icon: <FaBoxes />, label: 'Inventory',       path: '/inventory' },
  { key: 'hr',         icon: <FaUsers />, label: 'Human Resources', path: '/hr' },
  { key: 'reports',    icon: <FaFileAlt />, label: 'Reports',         path: '/reports' },
  { key: 'users',      icon: <FaUserCog />, label: 'User Management', path: '/users' },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return isMobile;
}

function Layout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isMobile  = useIsMobile();
  const [hovered, setHovered] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole    = currentUser.role || '';
  const allowed     = roleAccess[userRole] || [];
  const navItems    = allNavItems.filter(item => allowed.includes(item.key));
  const currentPage = allNavItems.find(n => n.path === location.pathname);

  // Auto-close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Auto-close sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNav = (path) => {
    if (location.pathname !== path) navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div style={s.root}>

      {/* ── Dark Overlay (mobile only) ───────────────── */}
      {isMobile && sidebarOpen && (
        <div
          style={s.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────── */}
      <div style={{
        ...s.sidebar,
        transform: isMobile
          ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)')
          : 'translateX(0)',
        transition: 'transform 0.3s ease',
        zIndex: isMobile ? 999 : 100,
        position: 'fixed',
      }}>

        {/* Logo Row */}
        <div style={s.logoRow}>
          <img src={logo} alt="Logo" style={s.logoImg} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={s.logoTitle}>Spartan BTY Inc.</p>
            <p style={s.logoSub}>Management Information System</p>
          </div>
          {/* Close button — mobile only */}
          {isMobile && (
            <button style={s.closeBtn} onClick={() => setSidebarOpen(false)}>
              ✕
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={s.nav}>
          <p style={s.navLabel}>MAIN MENU</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isHovered = hovered === item.label;
            return (
              <div
                key={item.label}
                onClick={() => handleNav(item.path)}
                onMouseEnter={() => setHovered(item.label)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...s.navItem,
                  backgroundColor: isActive ? '#ffffff' : isHovered ? 'rgba(255,255,255,0.15)' : 'transparent',
                  borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
                  transform: isHovered && !isActive ? 'translateX(4px)' : 'translateX(0)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={s.navIcon}>{item.icon}</span>
                <span style={{ fontWeight: isActive ? '700' : '400' }}>{item.label}</span>
                {isActive && <span style={s.activeDot}>●</span>}
              </div>
            );
          })}
          </nav>

        {/* Profile */}
        <div style={s.profileWrap} ref={profileRef}>
          <div style={s.profileRow} onClick={() => setProfileOpen(!profileOpen)}>
            <div style={s.profileAvatar}>
              {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={s.profileText}>
              <p style={s.profileName}>{currentUser.full_name || 'User'}</p>
              <p style={s.profileRole}>{userRole.toUpperCase()}</p>
            </div>
            <span style={{
              fontSize: '10px',
              color: 'rgba(48,46,46,0.6)',
              flexShrink: 0,
              transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}>▲</span>
          </div>

          {profileOpen && (
            <div style={s.dropdown}>
              <div style={s.dropHead}>
                <div style={s.dropAvatar}>
                  {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p style={s.dropName}>{currentUser.full_name}</p>
                  <p style={s.dropEmail}>{currentUser.email}</p>
                </div>
              </div>
              <div style={s.dropDivider} />
              {[
                { icon: <FaUser />, label: 'View Profile',    path: '/profile' },
                { icon: <FaKey />, label: 'Change Password', path: '/profile' },
              ].map(item => (
                <div
                  key={item.label}
                  style={s.dropItem}
                  onClick={() => { setProfileOpen(false); handleNav(item.path); }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
              <div style={s.dropDivider} />
              <div
                style={{ ...s.dropItem, color: '#ffcccc' }}
                onClick={handleLogout}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,80,80,0.15)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span>{<FaSignOutAlt />}</span>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────── */}
      <div style={{
        ...s.main,
        marginLeft: isMobile ? '0px' : '260px',
        transition: 'margin-left 0.3s ease',
      }}>

        {/* ── Topbar ─────────────────────────────────── */}
        <div style={s.topbar}>
          {/* LEFT: Hamburger (mobile only) + Page label */}
          <div style={s.topLeft}>
            {isMobile && (
              <button
                style={s.hamburger}
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <span style={s.hLine} />
                <span style={s.hLine} />
                <span style={s.hLine} />
              </button>
            )}
            <p style={s.breadcrumb}>
              {currentPage?.icon} {currentPage?.label || 'Page'}
            </p>
          </div>

          {/* RIGHT: Bell + Divider + User */}
          <div style={s.topRight}>
            <NotificationBell />
            <div style={s.topDivider} />
            <div style={s.topUser}>
              <div style={s.topAvatar}>
                {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!isMobile && (
                <div style={s.topUserText}>
                  <p style={s.topUserName}>{currentUser.full_name}</p>
                  <span style={s.topUserRole}>{userRole.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div style={s.content} className="layout-content">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────── */
const s = {
  root: {display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f5f0fa' },
  overlay: {position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 998 },

  /* Sidebar */
  sidebar: { width: '260px', background: 'linear-gradient(180deg, #F7EEF2, #F4E8ED, #EAD5DC)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', overflowY: 'auto', boxShadow: '4px 0 15px rgba(0,0,0,0.1)', zIndex: 100 },
  logoRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.2)' },
  logoImg: { width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' },
  logoTitle: { color: '#302e2e', margin: 0, fontSize: '20px', fontWeight: '700' },
  logoSub: { color: 'rgba(48,46,46,0.7)', margin: '2px 0 0', fontSize: '10px', letterSpacing: '0.5px' },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.25)', border: 'none', color: '#302e2e', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nav: { flex: 1, padding: '16px 0' },
  navLabel: { color: 'rgba(48,46,46,0.5)', fontSize: '10px', letterSpacing: '1.5px', padding: '0 20px', marginBottom: '8px', fontWeight: '600' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', color: '#302e2e', cursor: 'pointer', fontSize: '14px', borderRadius: '0 8px 8px 0', marginRight: '12px', position: 'relative' },
  navIcon: { fontSize: '18px', minWidth: '24px', textAlign: 'center' },
  activeDot: { position: 'absolute', right: '12px', fontSize: '8px', color: '#302e2e' },
  profileWrap: {
    position: 'relative',
    borderTop: '1px solid rgba(255,255,255,0.2)',
    flexShrink: 0,
  },
  profileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 16px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  profileAvatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    color: '#302e2e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', fontWeight: '700', flexShrink: 0,
  },
  profileText: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: '13px', fontWeight: '600', color: '#302e2e',
    margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  profileRole: { fontSize: '10px', color: 'rgba(48,46,46,0.6)', margin: '2px 0 0' },
  dropdown: {
    position: 'absolute',
    bottom: '100%',
    left: '10px',
    right: '10px',
    backgroundColor: '#b5536b',
    borderRadius: '12px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    marginBottom: '4px',
    zIndex: 10,
  },
  dropHead: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px' },
  dropAvatar: {
    width: '38px', height: '38px', borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    color: '#302e2e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', fontWeight: '700', flexShrink: 0,
  },
  dropName: { fontSize: '13px', fontWeight: '600', color: '#fff', margin: '0 0 2px' },
  dropEmail: { fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: 0 },
  dropDivider: { height: '1px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 10px' },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 16px', color: '#fff', cursor: 'pointer', fontSize: '13px',
  },

  /* Main */
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },

  /* Topbar */
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: '12px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 50,
    minHeight: '60px',
    gap: '12px',
  },
  topLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
    flex: 1,
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  hamburger: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#fdf0f3',
    border: '1px solid #f0d0d8',
    borderRadius: '8px',
    padding: '8px 10px',
    cursor: 'pointer',
    flexShrink: 0,
    minWidth: '40px',
    minHeight: '40px',
  },
  hLine: {
    display: 'block',
    width: '18px',
    height: '2px',
    backgroundColor: '#c4607a',
    borderRadius: '2px',
  },
  breadcrumb: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#302e2e',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  topDivider: {
    width: '1px',
    height: '30px',
    backgroundColor: '#eee',
    flexShrink: 0,
  },
  topUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  topAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#c4607a',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    flexShrink: 0,
  },
  topUserText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  topUserName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#302e2e',
    margin: 0,
    whiteSpace: 'nowrap',
  },
  topUserRole: {
    fontSize: '10px',
    backgroundColor: '#fdf0f3',
    color: '#c4607a',
    padding: '2px 8px',
    borderRadius: '20px',
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    padding: '24px',
    boxSizing: 'border-box',
  },
};

export default Layout;
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/spartanbtylogo.webp';
import NotificationBell from '../components/NotificationBell';
import RoleDashboard from './Dashboards/RoleDashboard';
import { MdDashboard } from "react-icons/md";
import { FaBullhorn, FaShoppingCart, FaTruck, FaComment, FaBoxes, FaUsers, FaFileAlt, FaUserCog } from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getAccessibleModules } = useAuth();

  const [hovered, setHovered] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setSidebarOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.user-dropdown-container')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  const allNavItems = [
    { key: 'dashboard', icon: <MdDashboard />, label: 'Dashboard', path: '/dashboard' },
    { key: 'marketing', icon: <FaBullhorn />, label: 'Marketing', path: '/marketing' },
    { key: 'sales', icon: <FaShoppingCart />, label: 'Sales', path: '/sales' },
    { key: 'logistics', icon: <FaTruck />, label: 'Logistics', path: '/logistics' },
    { key: 'crm', icon: <FaComment />, label: 'CRM', path: '/crm' },
    { key: 'inventory', icon: <FaBoxes />, label: 'Inventory', path: '/inventory' },
    { key: 'hr', icon: <FaUsers />, label: 'Human Resources', path: '/hr' },
    { key: 'reports', icon: <FaFileAlt />, label: 'Reports', path: '/reports' },
    { key: 'users', icon: <FaUserCog />, label: 'User Management', path: '/users' },
  ];

  const accessibleModules = getAccessibleModules();

  const navItems = allNavItems.filter(item =>
    accessibleModules.includes(item.key)
  );

  const handleNav = (path) => {
    if (location.pathname !== path) navigate(path);
  };

  return (
    <div style={styles.container}>
      {isMobile && sidebarOpen && (
        <div
          style={styles.mobileOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        style={{
          ...styles.sidebar,
          transform: isMobile
            ? sidebarOpen
              ? 'translateX(0)'
              : 'translateX(-100%)'
            : 'translateX(0)',
          transition: 'transform 0.3s ease',
          zIndex: isMobile ? 999 : 100,
        }}
      >
        <div style={styles.logoSection}>
          <img src={logo} alt="Logo" style={styles.logoImg} />

          <div>
            <h2 style={styles.logoText}>Spartan BTY Inc.</h2>
            <p style={styles.logoSub}>Management Information System</p>
          </div>

          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={styles.closeSidebarBtn}
            >
              ✕
            </button>
          )}
        </div>

        <nav style={styles.nav}>
          <p style={styles.navSection}>MAIN MENU</p>

          {navItems.map((item) => (
            <div
              key={item.label}
              onClick={() => handleNav(item.path)}
              onMouseEnter={() => setHovered(item.label)}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...styles.navItem,
                backgroundColor:
                  location.pathname === item.path
                    ? '#ffffff'
                    : hovered === item.label
                      ? 'rgba(255,255,255,0.15)'
                      : 'transparent',
                borderLeft:
                  location.pathname === item.path
                    ? '4px solid #fff'
                    : '4px solid transparent',
                transform:
                  hovered === item.label && location.pathname !== item.path
                    ? 'translateX(4px)'
                    : 'translateX(0)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={{ fontWeight: location.pathname === item.path ? '700' : '400' }}>
                {item.label}
              </span>
              {location.pathname === item.path && <span style={styles.activeDot}>●</span>}
            </div>
          ))}
        </nav>
      </div>

      <div
        style={{
          ...styles.main,
          marginLeft: isMobile ? '0' : '260px',
          width: isMobile ? '100%' : 'calc(100% - 260px)',
        }}
      >
        <div style={styles.topbar}>
          <div style={styles.topbarLeft}>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={styles.hamburgerBtn}
              >
                <span style={styles.hamburgerLine} />
                <span style={styles.hamburgerLine} />
                <span style={styles.hamburgerLine} />
              </button>
            )}

            <div>
              <h1 style={styles.pageTitle}>Dashboard</h1>
              <p style={styles.pageSubtitle}>
                Welcome back, {user?.full_name}!
              </p>
            </div>
          </div>

          <div style={styles.topbarRight}>
            <NotificationBell />
            <div style={styles.topbarDivider} />

            <div className="user-dropdown-container" style={styles.dropdownWrapper}>
              <div
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={styles.userPill}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fdf0f3'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
              >
                <div style={styles.avatar}>
                  {user?.full_name?.charAt(0).toUpperCase()}
                </div>

                {!isMobile && (
                  <>
                    <div style={styles.userInfo}>
                      <p style={styles.userName}>{user?.full_name}</p>
                      <span style={styles.userRole}>
                        {user?.role?.toUpperCase()}
                      </span>
                    </div>

                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#888"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transition: 'transform 0.2s',
                        transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </>
                )}
              </div>

              {userDropdownOpen && (
                <div style={styles.dropdownMenu}>
                  <div
                    onClick={() => {
                      setUserDropdownOpen(false);
                      navigate('/profile');
                    }}
                    style={styles.dropdownItem}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fdf0f3'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Profile
                  </div>

                  <div style={styles.dropdownDivider} />

                  <div
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      navigate('/');
                    }}
                    style={styles.dropdownItem}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fdf0f3'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.contentWrap}>
          <RoleDashboard />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
    fontFamily: 'Segoe UI, sans-serif',
    backgroundColor: '#f5f0fa',
    boxSizing: 'border-box',
  },

  mobileOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 998,
  },

  sidebar: {
    width: '260px',
    background: 'linear-gradient(180deg, #F7EEF2, #F4E8ED, #EAD5DC)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxShadow: '4px 0 15px rgba(0,0,0,0.1)',
    zIndex: 100,
    boxSizing: 'border-box',
  },

  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  },

  logoImg: {
    width: '48px',
    height: '48px',
    objectFit: 'contain',
    borderRadius: '8px',
    flexShrink: 0,
  },

  logoText: {
    color: '#302e2e',
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
  },

  logoSub: {
    color: 'rgba(48,46,46,0.7)',
    margin: '2px 0 0',
    fontSize: '10px',
    letterSpacing: '0.5px',
  },

  closeSidebarBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    border: 'none',
    color: '#302e2e',
    borderRadius: '6px',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 'auto',
  },

  nav: {
    flex: 1,
    padding: '16px 0',
  },

  navSection: {
    color: 'rgba(48,46,46,0.5)',
    fontSize: '10px',
    letterSpacing: '1.5px',
    padding: '0 20px',
    marginBottom: '8px',
    fontWeight: '600',
  },

  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    color: '#302e2e',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '0 8px 8px 0',
    marginRight: '12px',
    position: 'relative',
    boxSizing: 'border-box',
  },

  navIcon: {
    fontSize: '18px',
    minWidth: '24px',
    textAlign: 'center',
  },

  activeDot: {
    position: 'absolute',
    right: '12px',
    fontSize: '8px',
    color: '#302e2e',
  },

  main: {
    flex: 1,
    minHeight: '100vh',
    padding: '28px',
    maxWidth: '100%',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },

  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    backgroundColor: '#fff',
    padding: '16px 24px',
    borderRadius: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    minHeight: '72px',
    flexShrink: 0,
    gap: '12px',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },

  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
  },

  hamburgerBtn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf0f3',
    border: '1px solid #f0d0d8',
    borderRadius: '8px',
    padding: '8px 10px',
    cursor: 'pointer',
    minWidth: '40px',
    minHeight: '40px',
    flexShrink: 0,
  },

  hamburgerLine: {
    display: 'block',
    width: '18px',
    height: '2px',
    backgroundColor: '#c4607a',
    borderRadius: '2px',
  },

  pageTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#302e2e',
    margin: '0 0 4px',
  },

  pageSubtitle: {
    fontSize: '14px',
    color: '#888',
    margin: 0,
  },

  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },

  topbarDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#eee',
    flexShrink: 0,
  },

  dropdownWrapper: {
    position: 'relative',
  },

  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 12px',
    borderRadius: '50px',
    backgroundColor: '#fff',
    border: '1px solid #eee',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#c4607a',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontWeight: '700',
    flexShrink: 0,
  },

  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#302e2e',
    margin: 0,
    whiteSpace: 'nowrap',
  },

  userRole: {
    backgroundColor: '#fdf0f3',
    color: '#c4607a',
    padding: '1px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600',
    alignSelf: 'flex-start',
  },

  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: '0',
    backgroundColor: '#fff',
    border: '1px solid #eee',
    borderRadius: '12px',
    padding: '6px 0',
    minWidth: '160px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    zIndex: 1000,
  },

  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '400',
    color: '#302e2e',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },

  dropdownDivider: {
    height: '1px',
    backgroundColor: '#eee',
    margin: '4px 0',
  },

  contentWrap: {
    width: '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#302e2e',
    margin: '0 0 16px',
  },
};

export default Dashboard;
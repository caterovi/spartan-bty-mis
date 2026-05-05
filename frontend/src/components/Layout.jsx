import { useState, useRef, useEffect } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import logo from '../assets/spartanbtylogo.webp';

import NotificationBell from './NotificationBell';

import { MdDashboard } from "react-icons/md";

import { FaBullhorn, FaShoppingCart, FaTruck, FaComment, FaBoxes, FaUsers, FaFileAlt, FaUserCog, FaKey, FaUser, FaSignOutAlt, FaBell, FaFlag, FaChartLine, FaTags, FaBroadcastTower, FaPenFancy, FaLightbulb, FaChevronDown, FaChevronRight, FaRegChartBar, FaShoppingBag, FaBox, FaChartBar, FaArrowsAltH, FaCalendarAlt, FaMoneyCheck

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

  { key: 'marketing',  icon: <FaBullhorn />, label: 'Marketing',       path: '/marketing', hasSubmenu: true },

  { key: 'sales',      icon: <FaShoppingCart />, label: 'Sales',           path: '/sales', hasSubmenu: true },

  { key: 'logistics',  icon: <FaTruck />, label: 'Logistics',       path: '/logistics', hasSubmenu: true },

  { key: 'crm',        icon: <FaComment />, label: 'CRM',             path: '/crm', hasSubmenu: true },

  { key: 'inventory',  icon: <FaBoxes />, label: 'Inventory',       path: '/inventory', hasSubmenu: true },

  { key: 'hr',         icon: <FaUsers />, label: 'Human Resources', path: '/hr', hasSubmenu: true },

  { key: 'reports',    icon: <FaFileAlt />, label: 'Reports',         path: '/reports' },

  { key: 'users',      icon: <FaUserCog />, label: 'User Management', path: '/users' },

];



const marketingSubmenu = [

  { key: 'campaigns',  icon: <FaFlag />,          label: 'Campaigns',       path: '/marketing/campaigns' },

  { key: 'performance',icon: <FaChartLine />,     label: 'Performance',     path: '/marketing/performance' },

  { key: 'promotions', icon: <FaTags />,          label: 'Promotions',      path: '/marketing/promotions' },

  { key: 'live',       icon: <FaBroadcastTower />,label: 'Live Selling',    path: '/marketing/live-selling' },

  { key: 'content',    icon: <FaPenFancy />,      label: 'Content Creation',path: '/marketing/content-creation' },

  { key: 'suggestions',icon: <FaLightbulb />,     label: 'CRM Suggestions', path: '/marketing/suggestions' },

];



const salesSubmenu = [

  { key: 'orders',     icon: <FaShoppingBag />,   label: 'Orders',          path: '/sales/orders' },

  { key: 'summary',    icon: <FaRegChartBar />,   label: 'Summary',         path: '/sales/summary' },

];



const logisticsSubmenu = [

  { key: 'shipments',  icon: <FaBox />,           label: 'Shipments',       path: '/logistics/shipments' },

  { key: 'summary',    icon: <FaChartBar />,      label: 'Summary',         path: '/logistics/summary' },

];



const crmSubmenu = [

  { key: 'feedback',   icon: <FaComment />,       label: 'Feedback',        path: '/crm/feedback' },

  { key: 'customers',  icon: <FaUser />,        label: 'Customers',       path: '/crm/customers' },

  { key: 'analysis',   icon: <FaChartBar />,    label: 'Analysis',        path: '/crm/analysis' },

];



const inventorySubmenu = [

  { key: 'items',          icon: <FaBox />,         label: 'Items',           path: '/inventory/items' },

  { key: 'stock',          icon: <FaArrowsAltH />,  label: 'Stock Movement',  path: '/inventory/stock' },

  { key: 'summary',        icon: <FaChartLine />,   label: 'Summary',         path: '/inventory/summary' },

];



const hrSubmenu = [

  { key: 'employees',  icon: <FaUsers />,       label: 'Employees',  path: '/hr/employees' },

  { key: 'attendance', icon: <FaCalendarAlt />, label: 'Attendance', path: '/hr/attendance' },

  { key: 'payroll',    icon: <FaMoneyCheck />,  label: 'Payroll',    path: '/hr/payroll' },

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

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [expandedMenu, setExpandedMenu] = useState(null);

  const [clickedParent, setClickedParent] = useState(null);

  const [headerHovered, setHeaderHovered] = useState(false);

  const userDropdownRef = useRef(null);



  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const userRole    = currentUser.role || '';

  const allowed     = roleAccess[userRole] || [];

  const navItems    = allNavItems.filter(item => allowed.includes(item.key));

  const currentPage = allNavItems.find(n => n.path === location.pathname);

  const currentSubItem = marketingSubmenu.find(n => n.path === location.pathname) || salesSubmenu.find(n => n.path === location.pathname) || logisticsSubmenu.find(n => n.path === location.pathname) || crmSubmenu.find(n => n.path === location.pathname) || inventorySubmenu.find(n => n.path === location.pathname) || hrSubmenu.find(n => n.path === location.pathname);



  // Define all submenus with their parent keys for exact matching

  const allSubmenus = [

    { parent: 'marketing', items: marketingSubmenu },

    { parent: 'sales', items: salesSubmenu },

    { parent: 'logistics', items: logisticsSubmenu },

    { parent: 'crm', items: crmSubmenu },

    { parent: 'inventory', items: inventorySubmenu },

    { parent: 'hr', items: hrSubmenu },

  ];



  // Sync expandedMenu with current route using exact matching

  useEffect(() => {

    // Find which submenu (if any) has the active item using exact match

    const activeSubmenu = allSubmenus.find(submenu =>

      submenu.items.some(item => location.pathname === item.path)

    );



    // Only update expandedMenu if the current route is in a submenu

    // This prevents unnecessary re-renders when navigating within the same module

    if (activeSubmenu && expandedMenu !== activeSubmenu.parent) {

      setExpandedMenu(activeSubmenu.parent);

    }

    // If we're on a parent path (e.g., /marketing) and no submenu is active,

    // keep the current expandedMenu state (don't collapse it)

  }, [location.pathname]);



  // Auto-close sidebar on navigation

  useEffect(() => {

    setSidebarOpen(false);

  }, [location.pathname]);



  // Auto-close sidebar when switching to desktop

  useEffect(() => {

    if (!isMobile) setSidebarOpen(false);

  }, [isMobile]);



  // Close user dropdown on outside click

  useEffect(() => {

    const handler = (e) => {

      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {

        setUserDropdownOpen(false);

      }

    };

    document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);

  }, []);





  const handleNav = (path) => {

    if (location.pathname !== path) navigate(path);

    // Only close sidebar on mobile, not on desktop

    if (isMobile) setSidebarOpen(false);

  };



  const toggleMenu = (key) => {

    setExpandedMenu(expandedMenu === key ? null : key);

    setClickedParent(key); // Highlight this parent as clicked

  };



  // Find which submenu (if any) has the active item

  const activeSubmenu = allSubmenus.find(submenu =>

    submenu.items.some(item => location.pathname === item.path)

  );



  // The active submenu item (exact match only)

  const activeSubItem = activeSubmenu?.items.find(item => location.pathname === item.path);



  // Helper function to check if a specific parent menu should be active

  const isParentActive = (parentKey) => {

    // Exact match on parent path (e.g., /marketing)

    const parentPath = `/${parentKey}`;

    if (location.pathname === parentPath) return true;

    // Or a child of this parent is active

    if (activeSubmenu?.parent === parentKey) return true;

    // Or this parent was clicked (highlight when expanded)

    return clickedParent === parentKey && expandedMenu === parentKey;

  };



  const handleLogout = () => {

    localStorage.removeItem('token');

    localStorage.removeItem('user');

    navigate('/');

  };



  return (

    <>

      {/* CSS Keyframes for animations */}

      <style>{`

        @keyframes pulse {

          0%, 100% { box-shadow: 0 2px 8px rgba(255, 95, 147, 0.25); }

          50% { box-shadow: 0 2px 12px rgba(255, 95, 147, 0.4); }

        }

      `}</style>

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



        {/* Logo Row with Mini Profile */}

        <div 

          style={{

            ...s.logoRow,

            ...s.logoRowGlass,

            transform: headerHovered ? 'translateY(-2px)' : 'translateY(0)',

            boxShadow: headerHovered ? s.logoRowHover.boxShadow : s.logoRowGlass.boxShadow,

            transition: 'all 0.3s ease',

          }}

          onClick={() => handleNav('/profile')}

          onMouseEnter={() => setHeaderHovered(true)}

          onMouseLeave={() => setHeaderHovered(false)}

          title="View Profile"

        >

          {/* Logo Container */}

          <div style={s.logoContainer}>

            <img src={logo} alt="Logo" style={s.logoImg} />

          </div>

          

          {/* User Info Section */}

          <div style={{ flex: 1, minWidth: 0 }}>

            <p style={s.logoTitle}>Spartan BTY</p>

            <div style={s.userInfo}>

              <span style={s.roleBadge}>{userRole.toUpperCase()}</span>

            </div>

          </div>

          

          {/* Close button — mobile only */}

          {isMobile && (

            <button 

              style={s.closeBtn} 

              onClick={(e) => {

                e.stopPropagation();

                setSidebarOpen(false);

              }}

            >

              ✕

            </button>

          )}

        </div>



        {/* Navigation */}

        <nav style={s.nav}>

          <p style={s.navLabel}>MAIN MENU</p>

          {navItems.map((item) => {

            // Exact match for parent menu: either exact path match or child is active

            const isActive = location.pathname === item.path || (item.hasSubmenu && isParentActive(item.key));

            const isHovered = hovered === item.label;

            const isExpanded = expandedMenu === item.key;

            const hasSubmenu = item.hasSubmenu;



            return (

              <div key={item.label}>

                <div

                  onClick={() => hasSubmenu ? toggleMenu(item.key) : handleNav(item.path)}

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

                  <span style={{ fontWeight: isActive ? '700' : '400', flex: 1 }}>{item.label}</span>

                  {hasSubmenu && (

                    <span style={{ fontSize: '10px', transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>

                      <FaChevronDown />

                    </span>

                  )}

                  {isActive && !hasSubmenu && <span style={s.activeDot}>●</span>}

                </div>

                {hasSubmenu && isExpanded && (

                  <div style={s.submenu}>

                    {(item.key === 'marketing' ? marketingSubmenu : item.key === 'sales' ? salesSubmenu : item.key === 'logistics' ? logisticsSubmenu : item.key === 'crm' ? crmSubmenu : item.key === 'inventory' ? inventorySubmenu : hrSubmenu).map((subItem) => {

                      const isSubActive = location.pathname === subItem.path;

                      return (

                        <div

                          key={subItem.key}

                          onClick={(e) => {

                            e.stopPropagation(); // Prevent event bubbling to parent

                            handleNav(subItem.path);

                          }}

                          onMouseEnter={() => setHovered(subItem.label)}

                          onMouseLeave={() => setHovered(null)}

                          style={{

                            ...s.submenuItem,

                            backgroundColor: isSubActive ? '#ffffff' : isHovered === subItem.label ? 'rgba(255,255,255,0.15)' : 'transparent',

                            borderLeft: isSubActive ? '4px solid #fff' : '4px solid transparent',

                          }}

                        >

                          <span style={{ fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{subItem.icon}</span>

                          <span style={{ fontWeight: isSubActive ? '700' : '400', fontSize: '13px' }}>{subItem.label}</span>

                          {isSubActive && <span style={s.activeDot}>●</span>}

                        </div>

                      );

                    })}

                  </div>

                )}

              </div>

            );

          })}

          </nav>

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

              {currentSubItem?.icon || currentPage?.icon} {currentSubItem?.label || currentPage?.label || 'Page'}

            </p>

          </div>



          {/* RIGHT: Bell + Divider + User Dropdown */}

          <div style={s.topRight}>

            <NotificationBell />

            <div style={s.topDivider} />

            <div ref={userDropdownRef} style={{ position: 'relative' }}>

              <div

                onClick={() => setUserDropdownOpen(!userDropdownOpen)}

                style={{

                  display: 'flex', alignItems: 'center', gap: '10px',

                  padding: '6px 12px', borderRadius: '50px',

                  backgroundColor: '#fff', border: '1px solid #eee',

                  cursor: 'pointer', transition: 'all 0.2s',

                }}

                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fdf0f3'}

                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}

              >

                <div style={s.topAvatar}>

                  {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}

                </div>

                {!isMobile && (

                  <>

                    <div style={s.topUserText}>

                      <p style={s.topUserName}>{currentUser.full_name}</p>

                      <span style={s.topUserRole}>{userRole.toUpperCase()}</span>

                    </div>

                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>

                      <path d="M6 9l6 6 6-6"/>

                    </svg>

                  </>

                )}

              </div>

              {userDropdownOpen && (

                <div style={{

                  position: 'absolute', top: 'calc(100% + 8px)', right: '0',

                  backgroundColor: '#fff', border: '1px solid #eee',

                  borderRadius: '12px', padding: '6px 0', minWidth: '160px',

                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 1000,

                }}>

                  <div

                    onClick={() => { setUserDropdownOpen(false); handleNav('/profile'); }}

                    style={{

                      display: 'flex', alignItems: 'center', gap: '10px',

                      padding: '10px 16px', fontSize: '13px', fontWeight: '400',

                      color: '#302e2e', cursor: 'pointer', transition: 'background 0.15s',

                    }}

                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fdf0f3'}

                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}

                  >

                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>

                    </svg>

                    Profile

                  </div>

                  <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />

                  <div

                    onClick={() => { setUserDropdownOpen(false); handleLogout(); }}

                    style={{

                      display: 'flex', alignItems: 'center', gap: '10px',

                      padding: '10px 16px', fontSize: '13px', fontWeight: '400',

                      color: '#302e2e', cursor: 'pointer', transition: 'background 0.15s',

                    }}

                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fdf0f3'}

                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}

                  >

                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>

                    </svg>

                    Sign Out

                  </div>

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

    </>

  );

}



/* ── Styles ─────────────────────────────────────────────── */

const s = {

  root: {display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f5f0fa' },

  overlay: {position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 998 },



  /* Sidebar */

  sidebar: { width: '260px', background: 'linear-gradient(180deg, #F7EEF2, #F4E8ED, #EAD5DC)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', overflowY: 'auto', boxShadow: '4px 0 15px rgba(0,0,0,0.1)', zIndex: 100 },

  logoRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.2)' },

  logoRowGlass: {

    background: 'rgba(255, 255, 255, 0.75)',

    backdropFilter: 'blur(12px)',

    borderRadius: '16px',

    margin: '16px',

    padding: '16px',

    border: '1px solid rgba(255, 255, 255, 0.5)',

    boxShadow: '0 4px 16px rgba(196, 96, 122, 0.12)',

    cursor: 'pointer',

  },

  logoRowHover: {

    boxShadow: '0 6px 24px rgba(196, 96, 122, 0.2)',

  },

  logoContainer: {

    width: '48px',

    height: '48px',

    borderRadius: '12px',

    background: 'linear-gradient(135deg, rgba(255, 95, 147, 0.1), rgba(255, 141, 181, 0.1))',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    flexShrink: 0,

    border: '1px solid rgba(255, 95, 147, 0.2)',

  },

  logoImg: { width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' },

  logoTitle: { color: '#302e2e', margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px' },

  userInfo: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' },

  userName: { color: '#302e2e', margin: 0, fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  roleBadge: { 

    fontSize: '10px', 

    fontWeight: '600', 

    color: '#fff', 

    background: 'linear-gradient(135deg, #ff5f93, #ff8db5)', 

    padding: '3px 10px', 

    borderRadius: '12px', 

    letterSpacing: '0.5px', 

    flexShrink: 0, 

    minWidth: '50px',

    textAlign: 'center',

    boxShadow: '0 2px 8px rgba(255, 95, 147, 0.25)',

    border: '1px solid rgba(255, 255, 255, 0.3)',

  },

  closeBtn: { backgroundColor: 'rgba(255,255,255,0.25)', border: 'none', color: '#302e2e', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  nav: { flex: 1, padding: '16px 0' },

  navLabel: { color: 'rgba(48,46,46,0.5)', fontSize: '10px', letterSpacing: '1.5px', padding: '0 20px', marginBottom: '8px', fontWeight: '600' },

  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', color: '#302e2e', cursor: 'pointer', fontSize: '14px', borderRadius: '0 8px 8px 0', marginRight: '12px', position: 'relative' },

  navIcon: { fontSize: '18px', minWidth: '24px', textAlign: 'center' },

  activeDot: { position: 'absolute', right: '12px', fontSize: '8px', color: '#302e2e' },

  submenu: { paddingLeft: '32px', marginTop: '4px', marginBottom: '4px' },

  submenuItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', color: '#302e2e', cursor: 'pointer', fontSize: '13px', borderRadius: '0 8px 8px 0', marginRight: '12px', position: 'relative', transition: 'all 0.2s ease' },

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
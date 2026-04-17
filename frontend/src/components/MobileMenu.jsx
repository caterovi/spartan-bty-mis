import { useState } from 'react';
import { FaTimes, FaBars, FaHome, FaUsers, FaBullhorn, FaShoppingCart, FaTruck, FaComment, FaBoxes, FaFileAlt, FaUserCog, FaChartBar } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMobile } from '../hooks/useMobile';

const MobileMenu = ({ user, isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSmallMobile } = useMobile();

  const menuItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard', roles: ['admin', 'hr', 'marketing', 'sales', 'logistics', 'crm', 'inventory'] },
    { path: '/marketing', icon: FaBullhorn, label: 'Marketing', roles: ['admin', 'marketing'] },
    { path: '/sales', icon: FaShoppingCart, label: 'Sales', roles: ['admin', 'sales'] },
    { path: '/logistics', icon: FaTruck, label: 'Logistics', roles: ['admin', 'logistics'] },
    { path: '/crm', icon: FaComment, label: 'CRM', roles: ['admin', 'crm'] },
    { path: '/inventory', icon: FaBoxes, label: 'Inventory', roles: ['admin', 'inventory', 'logistics'] },
    { path: '/hr', icon: FaUsers, label: 'HR', roles: ['admin', 'hr'] },
    { path: '/users', icon: FaUserCog, label: 'Users', roles: ['admin'] },
    { path: '/reports', icon: FaChartBar, label: 'Reports', roles: ['admin', 'hr', 'marketing', 'sales', 'logistics', 'crm', 'inventory'] },
  ];

  const filteredItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 998,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : '-280px',
          width: '280px',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
          zIndex: 999,
          transition: 'left 0.3s ease',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #eee',
            backgroundColor: '#fdf0f3',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#c4607a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                {user?.full_name}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {user?.role?.charAt(0)?.toUpperCase() + user?.role?.slice(1)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              touchAction: 'manipulation',
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Menu Items */}
        <div style={{ padding: '8px 0' }}>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: isSmallMobile ? '12px 20px' : '14px 20px',
                  border: 'none',
                  backgroundColor: isActive ? '#fdf0f3' : 'transparent',
                  color: isActive ? '#c4607a' : '#333',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: isSmallMobile ? '14px' : '15px',
                  fontWeight: isActive ? '600' : '400',
                  textAlign: 'left',
                  touchAction: 'manipulation',
                  minHeight: '48px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = '#f8f8f8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #eee' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              minHeight: '48px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#c82333';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#dc3545';
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;

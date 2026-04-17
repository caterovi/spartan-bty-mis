import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { FaBell, FaBox, FaShoppingCart, FaComment, FaTruck } from 'react-icons/fa';

function NotificationBell() {
  const navigate  = useNavigate();
  const [open, setOpen]               = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [count, setCount]             = useState(0);
  const [loading, setLoading]         = useState(false);
  const [dismissed, setDismissed]     = useState(() => {
    const saved = localStorage.getItem('dismissed_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      const all = res.data.notifications;
      const saved = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
      const active = all.filter(n => !saved.includes(n.id));
      setNotifications(active);
      setCount(active.length);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDismiss = (id, e) => {
    e.stopPropagation();
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
    setNotifications(prev => prev.filter(n => n.id !== id));
    setCount(prev => prev - 1);
  };

  const handleDismissAll = () => {
    const ids = notifications.map(n => n.id);
    const updated = [...dismissed, ...ids];
    setDismissed(updated);
    localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
    setNotifications([]);
    setCount(0);
  };

  const handleClick = (notif) => {
    setOpen(false);
    navigate(notif.link);
  };

  const typeConfig = {
    'low-stock':        { icon: <FaBox/>, bg: '#fdf0f3', border: '#f0b8c4' },
    'new-order':        { icon: <FaShoppingCart/>, bg: '#eaf4fb', border: '#aed6f1' },
    'new-feedback':     { icon: <FaComment/>, bg: '#fef9e7', border: '#fad88a' },
    'pending-delivery': { icon: <FaTruck/>, bg: '#eafaf1', border: '#a9dfbf' },
  };

  const priorityColors = {
    high:   '#c4607a',
    medium: '#f39c12',
    low:    '#27ae60',
  };

  const timeAgo = (time) => {
    if (!time) return '';
    const diff = Date.now() - new Date(time).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'just now';
  };

  return (
    <div style={styles.wrapper} className="module-wrapper" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        style={styles.bell}
        title="Notifications"
      >
        <FaBell />
        {count > 0 && (
          <span style={styles.badge}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown}>
          {/* Header */}
          <div style={styles.dropHeader}>
            <div>
              <h4 style={styles.dropTitle}>Notifications</h4>
              {count > 0 && <p style={styles.dropSub}>{count} unread</p>}
            </div>
            {count > 0 && (
              <button onClick={handleDismissAll} style={styles.clearBtn}>
                Clear all
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={styles.list}>
            {loading ? (
              <div style={styles.empty}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={styles.emptyBox}>
                <span style={styles.emptyIcon}></span>
                <p style={styles.emptyText}>All caught up!</p>
                <p style={styles.emptySub}>No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = typeConfig[notif.type] || { icon: <FaBell/> };
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    style={{
                      ...styles.notifItem,
                      backgroundColor: config.bg,
                      borderLeft: `4px solid ${config.border}`,
                    }}
                  >
                    <div style={styles.notifLeft}>
                      <span style={styles.notifIcon}>{config.icon}</span>
                      <div style={styles.notifContent}>
                        <div style={styles.notifTitleRow}>
                          <span style={styles.notifTitle}>{notif.title}</span>
                          <span style={{
                            ...styles.priorityDot,
                            backgroundColor: priorityColors[notif.priority],
                          }} />
                        </div>
                        <p style={styles.notifMsg}>{notif.message}</p>
                        {notif.time && (
                          <p style={styles.notifTime}>{timeAgo(notif.time)}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDismiss(notif.id, e)}
                      style={styles.dismissBtn}
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={styles.dropFooter}>
              <button onClick={fetchNotifications} style={styles.refreshBtn}>
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', display: 'flex', alignItems:'center' },
  bell: {position: 'relative',backgroundColor: 'rgba(255,255,255,0.2)',border: '1px solid rgba(255,255,255,0.3)',borderRadius: '8px',width: '36px',height: '36px',fontSize: '16px',cursor: 'pointer',display: 'flex',alignItems: 'center',justifyContent: 'center',flexShrink: 0,color: '#000000',},
  badge: {position: 'absolute',top: '-5px',right: '-5px',backgroundColor: '#fff',color: '#c4607a',borderRadius: '50%',minWidth: '16px',height: '16px',fontSize: '9px',fontWeight: '700',display: 'flex',alignItems: 'center',justifyContent: 'center',padding: '0 3px',border: '2px solid #c4607a',},
  dropdown: { position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: '360px', backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #eee', zIndex: 1000, overflow: 'hidden' },
  dropHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f0f0f0' },
  dropTitle: { fontSize: '16px', fontWeight: '700', color: '#302e2e', margin: 0 },
  dropSub: { fontSize: '12px', color: '#c4607a', margin: '2px 0 0', fontWeight: '500' },
  clearBtn: { fontSize: '12px', color: '#c4607a', backgroundColor: '#fdf0f3', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  list: { maxHeight: '380px', overflowY: 'auto' },
  emptyBox: { padding: '40px 20px', textAlign: 'center' },
  emptyIcon: { fontSize: '36px', display: 'block', marginBottom: '8px' },
  emptyText: { fontSize: '15px', fontWeight: '600', color: '#302e2e', margin: '0 0 4px' },
  emptySub: { fontSize: '13px', color: '#aaa', margin: 0 },
  empty: { padding: '20px', textAlign: 'center', color: '#aaa' },
  notifItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'opacity 0.2s' },
  notifLeft: { display: 'flex', gap: '10px', flex: 1, minWidth: 0 },
  notifIcon: { fontSize: '20px', flexShrink: 0, marginTop: '2px' },
  notifContent: { flex: 1, minWidth: 0 },
  notifTitleRow: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' },
  notifTitle: { fontSize: '13px', fontWeight: '600', color: '#302e2e' },
  priorityDot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
  notifMsg: { fontSize: '12px', color: '#555', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  notifTime: { fontSize: '11px', color: '#aaa', margin: 0 },
  dismissBtn: { backgroundColor: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '12px', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, marginLeft: '8px' },
  dropFooter: { padding: '10px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'center' },
  refreshBtn: { backgroundColor: 'transparent', border: 'none', color: '#c4607a', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
};

export default NotificationBell;
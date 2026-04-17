import { Navigate } from 'react-router-dom';

const roleAccess = {
  admin:     ['dashboard','marketing','sales','logistics','crm','inventory','hr','users','reports','profile'],
  hr:        ['dashboard','hr','users','reports','profile'],
  marketing: ['dashboard','marketing','reports','profile'],
  sales:     ['dashboard','sales','reports','profile'],
  logistics: ['dashboard','logistics','inventory','reports','profile'],
  crm:       ['dashboard','crm','reports','profile'],
  inventory: ['dashboard','inventory','logistics','reports','profile'],
};

function ProtectedRoute({ children, page }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || !user.role) return <Navigate to="/" />;
  const allowed = roleAccess[user.role] || [];
  if (!allowed.includes(page)) return <Navigate to="/dashboard" />;
  return children;
}

export default ProtectedRoute;
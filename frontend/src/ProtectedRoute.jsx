import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

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
  const { isAuthenticated, user, hasPermission } = useAuth();
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user has permission for this specific page
  if (!hasPermission(page)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

export default ProtectedRoute;
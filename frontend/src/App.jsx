import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HR from './pages/HR/HR';
import Marketing from './pages/Marketing/Marketing';
import CRM from './pages/CRM/CRM';
import Inventory from './pages/Inventory/Inventory';
import Sales from './pages/Sales/Sales';
import Logistics from './pages/Logistics/Logistics';
import Users from './pages/Users/Users';
import ProtectedRoute from './ProtectedRoute';
import Reports from './pages/Reports/Reports';
import Profile from './pages/Profile/Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard"  element={<ProtectedRoute page="dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="/hr"         element={<ProtectedRoute page="hr"><HR /></ProtectedRoute>} />
        <Route path="/marketing"  element={<ProtectedRoute page="marketing"><Marketing /></ProtectedRoute>} />
        <Route path="/crm"        element={<ProtectedRoute page="crm"><CRM /></ProtectedRoute>} />
        <Route path="/inventory"  element={<ProtectedRoute page="inventory"><Inventory /></ProtectedRoute>} />
        <Route path="/sales"      element={<ProtectedRoute page="sales"><Sales /></ProtectedRoute>} />
        <Route path="/logistics"  element={<ProtectedRoute page="logistics"><Logistics /></ProtectedRoute>} />
        <Route path="/users"      element={<ProtectedRoute page="users"><Users /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute page="reports"><Reports /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute page="profile"><Profile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HR from './pages/HR/HR';
import Employees from './pages/HR/Employees';
import Attendance from './pages/HR/Attendance';
import Payroll from './pages/HR/Payroll';
import Marketing from './pages/Marketing/Marketing';
import Campaigns from './pages/Marketing/Campaigns';
import Performance from './pages/Marketing/Performance';
import Promotions from './pages/Marketing/Promotions';
import LiveSelling from './pages/Marketing/LiveSelling';
import ContentCreation from './pages/Marketing/ContentCreation';
import Suggestions from './pages/Marketing/Suggestions';
import CRM from './pages/CRM/CRM';
import Feedback from './pages/CRM/Feedback';
import Customers from './pages/CRM/Customers';
import Analysis from './pages/CRM/Analysis';
import Inventory from './pages/Inventory/Inventory';
import Items from './pages/Inventory/Items';
import StockMovement from './pages/Inventory/StockMovement';
import InventorySummary from './pages/Inventory/InventorySummary';
import Sales from './pages/Sales/Sales';
import Orders from './pages/Sales/Orders';
import SalesSummary from './pages/Sales/SalesSummary';
import Logistics from './pages/Logistics/Logistics';
import Shipments from './pages/Logistics/Shipments';
import LogisticsSummary from './pages/Logistics/LogisticsSummary';
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
        <Route path="/hr/employees"  element={<ProtectedRoute page="hr"><Employees /></ProtectedRoute>} />
        <Route path="/hr/attendance" element={<ProtectedRoute page="hr"><Attendance /></ProtectedRoute>} />
        <Route path="/hr/payroll"    element={<ProtectedRoute page="hr"><Payroll /></ProtectedRoute>} />
        <Route path="/marketing"  element={<ProtectedRoute page="marketing"><Marketing /></ProtectedRoute>} />
        <Route path="/marketing/campaigns"  element={<ProtectedRoute page="marketing"><Campaigns /></ProtectedRoute>} />
        <Route path="/marketing/performance"  element={<ProtectedRoute page="marketing"><Performance /></ProtectedRoute>} />
        <Route path="/marketing/promotions"  element={<ProtectedRoute page="marketing"><Promotions /></ProtectedRoute>} />
        <Route path="/marketing/live-selling"  element={<ProtectedRoute page="marketing"><LiveSelling /></ProtectedRoute>} />
        <Route path="/marketing/content-creation"  element={<ProtectedRoute page="marketing"><ContentCreation /></ProtectedRoute>} />
        <Route path="/marketing/suggestions"  element={<ProtectedRoute page="marketing"><Suggestions /></ProtectedRoute>} />
        <Route path="/crm"        element={<ProtectedRoute page="crm"><CRM /></ProtectedRoute>} />
        <Route path="/crm/feedback"   element={<ProtectedRoute page="crm"><Feedback /></ProtectedRoute>} />
        <Route path="/crm/customers"  element={<ProtectedRoute page="crm"><Customers /></ProtectedRoute>} />
        <Route path="/crm/analysis"   element={<ProtectedRoute page="crm"><Analysis /></ProtectedRoute>} />
        <Route path="/inventory"  element={<ProtectedRoute page="inventory"><Inventory /></ProtectedRoute>} />
        <Route path="/inventory/items"   element={<ProtectedRoute page="inventory"><Items /></ProtectedRoute>} />
        <Route path="/inventory/stock"   element={<ProtectedRoute page="inventory"><StockMovement /></ProtectedRoute>} />
        <Route path="/inventory/summary" element={<ProtectedRoute page="inventory"><InventorySummary /></ProtectedRoute>} />
        <Route path="/sales"      element={<ProtectedRoute page="sales"><Sales /></ProtectedRoute>} />
        <Route path="/sales/orders"      element={<ProtectedRoute page="sales"><Orders /></ProtectedRoute>} />
        <Route path="/sales/summary"    element={<ProtectedRoute page="sales"><SalesSummary /></ProtectedRoute>} />
        <Route path="/logistics"  element={<ProtectedRoute page="logistics"><Logistics /></ProtectedRoute>} />
        <Route path="/logistics/shipments" element={<ProtectedRoute page="logistics"><Shipments /></ProtectedRoute>} />
        <Route path="/logistics/summary"   element={<ProtectedRoute page="logistics"><LogisticsSummary /></ProtectedRoute>} />
        <Route path="/users"      element={<ProtectedRoute page="users"><Users /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute page="reports"><Reports /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute page="profile"><Profile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
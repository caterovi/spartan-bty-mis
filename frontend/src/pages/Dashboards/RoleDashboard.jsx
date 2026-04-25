import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import SalesDashboard from './SalesDashboard';
import InventoryDashboard from './InventoryDashboard';
import LogisticsDashboard from './LogisticsDashboard';
import MarketingDashboard from './MarketingDashboard';
import CRMDashboard from './CRMDashboard';
import HRDashboard from './HRDashboard';

function RoleDashboard() {
  const { user } = useAuth();

  const role = user?.role?.toLowerCase();

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'sales':
      return <SalesDashboard />;
    case 'inventory':
      return <InventoryDashboard />;
    case 'logistics':
      return <LogisticsDashboard />;
    case 'marketing':
      return <MarketingDashboard />;
    case 'crm':
      return <CRMDashboard />;
    case 'hr':
      return <HRDashboard />;
    default:
      return <AdminDashboard />;
  }
}

export default RoleDashboard;

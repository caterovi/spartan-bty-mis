import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Inventory() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Items by default
    navigate('/inventory/items', { replace: true });
  }, [navigate]);

  return null;
}

export default Inventory;
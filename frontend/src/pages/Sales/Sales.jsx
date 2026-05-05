import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Sales() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Orders by default
    navigate('/sales/orders', { replace: true });
  }, [navigate]);

  return null;
}

export default Sales;
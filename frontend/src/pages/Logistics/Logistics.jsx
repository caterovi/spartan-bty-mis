import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Logistics() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Shipments by default
    navigate('/logistics/shipments', { replace: true });
  }, [navigate]);

  return null;
}

export default Logistics;
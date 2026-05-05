import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function HR() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Employees by default
    navigate('/hr/employees', { replace: true });
  }, [navigate]);

  return null;
}

export default HR;
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CRM() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Feedback by default
    navigate('/crm/feedback', { replace: true });
  }, [navigate]);

  return null;
}

export default CRM;
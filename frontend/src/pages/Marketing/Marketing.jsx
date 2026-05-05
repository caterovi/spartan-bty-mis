import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';

function Marketing() {
  const navigate = useNavigate();

  // Redirect to campaigns by default
  useEffect(() => {
    navigate('/marketing/campaigns', { replace: true });
  }, [navigate]);

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        <p>Loading...</p>
      </div>
    </Layout>
  );
}

export default Marketing;
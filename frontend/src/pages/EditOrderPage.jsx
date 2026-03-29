import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditOrderModal from '../components/EditOrderModal';

export default function EditOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // scroll to top on page open
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Muokkaa tilausta #{id}</h2>
      <EditOrderModal
        orderId={parseInt(id, 10)}
        onClose={() => navigate('/orders')}
        onSaved={() => navigate('/orders')}
      />
    </div>
  );
}

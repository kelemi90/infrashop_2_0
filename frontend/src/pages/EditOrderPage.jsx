import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditOrderModal from '../components/EditOrderModal';
import '../styles/edit-order-modal.css';

export default function EditOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // scroll to top on page open
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="edit-order-page">
      <h2>Muokkaa tilausta #{id}</h2>
      <EditOrderModal
        orderId={parseInt(id, 10)}
        onClose={() => navigate('/orders')}
        onSaved={() => navigate('/orders')}
      />
    </div>
  );
}

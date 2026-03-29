import { useEffect, useState } from 'react';
import api from '../api';
import EditOrderModal from '../components/EditOrderModal';

export default function OrdersPage(){
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState('');
    const [editingOrder, setEditingOrder] = useState(null);

    useEffect(() => {
        api.get('/orders')
            .then(res => setOrders(res.data))
            .catch(() => setError('Tilauksien haku epäonnistui'));
    }, []);

    return (
        <div className="orders-page">
            <h2>Tilaukset</h2>

            {error && <p className="error">{error}</p>}

            <table>
                <thread>
                    <tr>
                        <th>ID</th>
                        <th>Tilaaja</th>
                        <th>Organisaatio</th>
                        <th>Toimituspiste</th>
                        <th>Palautus</th>
                        <th>Status</th>
                        <th>PDF</th>
                    </tr>
                </thread>

                <body>
                    {orders.map(o => (
                        <tr key={o.id}>
                            <td>{o.id}</td>
                            <td>{o.customer_name}</td>
                            <td>{o.organization}</td>
                            <td>{o.delivery_point}</td>
                            <td>{o.return_at?.slice(0,10)}</td>
                            <td>{o.status}</td>
                            <td>
                                                                                                <a href={`/api/orders/${o.id}/pdf`} target="_blank" rel="noopener noreferrer">
                                                                                                    Lataa PDF
                                                                                                </a>
                                                                                                <button style={{ marginLeft: 8 }} onClick={() => setEditingOrder(o.id)}>Muokkaa tilausta</button>
                            </td>
                        </tr>
                    ))}
                </body>
            </table>
            {editingOrder && (
              <EditOrderModal orderId={editingOrder} onClose={() => setEditingOrder(null)} onSaved={({order, items}) => { setEditingOrder(null); api.get('/orders').then(r=>setOrders(r.data)); }} />
            )}
        </div>
    );
}
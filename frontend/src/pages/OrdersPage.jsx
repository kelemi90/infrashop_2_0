import { useEffect, useState } from 'react';
import api from '../api';
import EditOrderModal from '../components/EditOrderModal';
import '../styles/orders.css';

export default function OrdersPage(){
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState('');
    const [editingOrder, setEditingOrder] = useState(null);
    const [viewingOrder, setViewingOrder] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const userJson = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
    let user = null;
    try { user = userJson ? JSON.parse(userJson) : null; } catch (e) { user = null; }
    const isAdmin = Boolean(user && user.role === 'admin');

    const loadOrders = () => {
        api.get('/orders')
            .then(res => setOrders(res.data))
            .catch(() => setError('Tilauksien haku epäonnistui'));
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const parseRequirements = (value) => {
        if (!value) return null;
        if (typeof value === 'object') return value;
        try {
            return JSON.parse(value);
        } catch (e) {
            return null;
        }
    };

    const openOrder = async (orderRow) => {
        setError('');
        setViewLoading(true);
        try {
            const res = await api.get(`/orders/${orderRow.id}`, {
                params: orderRow.customer_name ? { customer_name: orderRow.customer_name } : undefined,
            });
            setViewingOrder({
                order: res.data.order,
                items: res.data.items || []
            });
        } catch (e) {
            setError(e?.response?.data?.error || 'Tilauksen avaus epäonnistui');
        } finally {
            setViewLoading(false);
        }
    };

    const startEditFromView = () => {
        if (!viewingOrder?.order?.id) return;
        setEditingOrder({
            id: viewingOrder.order.id,
            customerName: viewingOrder.order.customer_name
        });
        setViewingOrder(null);
    };

    const deleteOrder = async (orderId) => {
        const ok = window.confirm(`Poistetaanko tilaus #${orderId}? Varasto palautetaan.`);
        if (!ok) return;

        try {
            await api.delete(`/orders/${orderId}`);
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (e) {
            setError(e?.response?.data?.error || 'Tilauksen poisto epäonnistui');
        }
    };

    const viewRequirements = parseRequirements(viewingOrder?.order?.special_requirements);

    return (
        <div className="orders-page">
            <h2>Tilaukset</h2>

            {error && <p className="error">{error}</p>}

            <table className="orders-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tilaaja</th>
                        <th>Organisaatio</th>
                        <th>Toimituspiste</th>
                        <th>Palautus</th>
                        <th>Status</th>
                        <th>Toiminnot</th>
                    </tr>
                </thead>

                <tbody>
                    {orders.map(o => (
                        <tr key={o.id}>
                            <td>{o.id}</td>
                            <td>{o.customer_name}</td>
                            <td>{o.organization}</td>
                            <td>{o.delivery_point}</td>
                            <td>{o.return_at?.slice(0,10)}</td>
                            <td>{o.status}</td>
                            <td className="orders-actions">
                                <button onClick={() => openOrder(o)} disabled={viewLoading}>
                                    Avaa
                                </button>
                                {isAdmin && (
                                    <button className="danger-btn" onClick={() => deleteOrder(o.id)}>
                                        Poista
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {viewingOrder && (
                <div className="order-view-backdrop" onClick={() => setViewingOrder(null)}>
                    <div className="order-view-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="order-view-topbar">
                            <h3>Tilaus #{viewingOrder.order.id}</h3>
                            <div className="order-view-actions">
                                <a href={`/api/orders/${viewingOrder.order.id}/pdf`} target="_blank" rel="noopener noreferrer">
                                    Lataa PDF
                                </a>
                                <button onClick={startEditFromView}>Muokkaa</button>
                                <button className="secondary-btn" onClick={() => setViewingOrder(null)}>Sulje</button>
                            </div>
                        </div>

                        <div className="order-view-meta">
                            <div><strong>Tilaaja:</strong> {viewingOrder.order.customer_name || '-'}</div>
                            <div><strong>Organisaatio:</strong> {viewingOrder.order.organization || '-'}</div>
                            <div><strong>Toimituspiste:</strong> {viewingOrder.order.delivery_point || '-'}</div>
                            <div><strong>Palautus:</strong> {viewingOrder.order.return_at?.slice(0, 10) || '-'}</div>
                            <div><strong>Status:</strong> {viewingOrder.order.status || '-'}</div>
                        </div>

                        {viewingOrder.order.open_comment && (
                            <div className="order-view-section">
                                <h4>Avoin kommentti</h4>
                                <p>{viewingOrder.order.open_comment}</p>
                            </div>
                        )}

                        {viewRequirements && (
                            <div className="order-view-section">
                                <h4>Lisätiedot</h4>
                                {viewRequirements.power && (
                                    <p><strong>Sähkö:</strong> {viewRequirements.power}</p>
                                )}
                                {viewRequirements.network && (
                                    <p><strong>Verkko:</strong> {viewRequirements.network}</p>
                                )}
                                {viewRequirements.lighting && (
                                    <p><strong>Valaistus:</strong> {viewRequirements.lighting}</p>
                                )}
                                {viewRequirements.tv && (
                                    <p><strong>TV:</strong> {viewRequirements.tv}</p>
                                )}
                            </div>
                        )}

                        <div className="order-view-section">
                            <h4>Tuotteet</h4>
                            <table className="orders-table order-view-items-table">
                                <thead>
                                    <tr>
                                        <th>Tuote</th>
                                        <th>SKU</th>
                                        <th>Määrä</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingOrder.items.map((it, idx) => (
                                        <tr key={`${it.id || it.item_id || idx}-${idx}`}>
                                            <td>{it.item_name || it.name || '-'}</td>
                                            <td>{it.sku || '-'}</td>
                                            <td>{it.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {editingOrder && (
                            <EditOrderModal
                                orderId={editingOrder.id}
                                customerName={editingOrder.customerName}
                                onClose={() => setEditingOrder(null)}
                                onSaved={() => { setEditingOrder(null); loadOrders(); }}
                            />
            )}
        </div>
    );
}
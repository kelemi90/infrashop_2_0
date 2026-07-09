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
    const [sortBy, setSortBy] = useState('placed-desc');
    const orderStatusOptions = ['placed', 'ready', 'in_progress', 'packed', 'closed', 'returned'];
    const [filters, setFilters] = useState({
        search: '',
        orderer: '',
        deliveryPoint: '',
        status: '',
        itemId: ''
    });

    const userJson = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
    let user = null;
    try { user = userJson ? JSON.parse(userJson) : null; } catch (e) { user = null; }
    const isLoggedIn = Boolean(user);
    const isAdmin = Boolean(user && user.role === 'admin');

    const loadOrders = () => {
        const params = {};
        if (filters.itemId) params.item = filters.itemId;
        api.get('/orders', { params })
            .then(res => {
                // Backend returns { data, total, limit, offset }
                setOrders(res.data.data || []);
            })
            .catch(() => setError('Tilauksien haku epäonnistui'));
    };

    useEffect(() => {
        loadOrders();
    }, []);


    const parseTimestamp = (value) => {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    const getOrderTimestampMeta = (order) => {
        const createdAt = parseTimestamp(order?.created_at);
        const updatedAt = parseTimestamp(order?.updated_at);
        if (!createdAt && !updatedAt) {
            return { label: 'Aika', value: '-' };
        }
        if (createdAt && updatedAt && updatedAt.getTime() > createdAt.getTime()) {
            return {
                label: 'Muokattu',
                value: updatedAt.toLocaleString('fi-FI')
            };
        }
        return {
            label: 'Luotu',
            value: (createdAt || updatedAt).toLocaleString('fi-FI')
        };
    };

    const parseRequirements = (value) => {
        if (!value) return null;
        if (typeof value === 'object') return value;
        try {
            return JSON.parse(value);
        } catch (e) {
            return null;
        }
    };

    const updateFilter = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const compareText = (left, right) => String(left || '').localeCompare(
        String(right || ''),
        'fi',
        { sensitivity: 'base' }
    );

    const filteredOrders = orders.filter((order) => {
        const matchesSearch = !filters.search || [
            order.id,
            order.customer_name,
            order.organization,
            order.delivery_point,
            order.status,
            order.event_name
        ].some((value) => String(value || '').toLowerCase().includes(filters.search.toLowerCase()));

        const matchesOrderer = !filters.orderer || String(order.customer_name || '')
            .toLowerCase()
            .includes(filters.orderer.toLowerCase());

        const matchesDeliveryPoint = !filters.deliveryPoint || String(order.delivery_point || '')
            .toLowerCase()
            .includes(filters.deliveryPoint.toLowerCase());

        const matchesStatus = !filters.status || String(order.status || '') === filters.status;

        return matchesSearch && matchesOrderer && matchesDeliveryPoint && matchesStatus;
    });

    // Grouping logic
    const ordersByEvent = filteredOrders.reduce((acc, order) => {
        const eventName = order.event_name || 'Tuntematon tapahtuma';
        if (!acc[eventName]) acc[eventName] = [];
        acc[eventName].push(order);
        return acc;
    }, {});

    // Sort events by the date of the first order in them (most recent first)
    const sortedEventNames = Object.keys(ordersByEvent).sort((a, b) => {
        const aLatest = Math.max(...ordersByEvent[a].map(o => new Date(o.created_at).getTime()));
        const bLatest = Math.max(...ordersByEvent[b].map(o => new Date(o.created_at).getTime()));
        return bLatest - aLatest;
    });

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
            <div className="orders-header">
                <h2>Tilaukset</h2>
                {isLoggedIn && (
                    <a className="orders-download-all" href="/api/orders/all/pdf" target="_blank" rel="noopener noreferrer">
                        Lataa kaikki tilaukset (PDF)
                    </a>
                )}
            </div>

            {error && <p className="error">{error}</p>}

            <div className="orders-controls">
                <label>
                    Haku
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        placeholder="ID, tilaaja, tapahtuma..."
                    />
                </label>
                <label>
                    Tilaaja
                    <input
                        type="text"
                        value={filters.orderer}
                        onChange={(e) => updateFilter('orderer', e.target.value)}
                        placeholder="Suodata tilaajan nimellä"
                    />
                </label>
                <label>
                    Toimituspiste
                    <input
                        type="text"
                        value={filters.deliveryPoint}
                        onChange={(e) => updateFilter('deliveryPoint', e.target.value)}
                        placeholder="Suodata toimituspisteellä"
                    />
                </label>
                <label>
                    Status
                    <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
                        <option value="">Kaikki statukset</option>
                        {orderStatusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </label>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                    <button onClick={() => { setError(''); loadOrders(); }}>Päivitä</button>
                </div>
            </div>

            {sortedEventNames.map(eventName => (
                <div key={eventName} className="event-group">
                    <h3 className="event-title">{eventName}</h3>
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tilaaja</th>
                                <th>Organisaatio</th>
                                <th>Toimituspiste</th>
                                <th>Status</th>
                                <th>Aikaleima</th>
                                <th>Toiminnot</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordersByEvent[eventName].map(o => {
                                const timeMeta = getOrderTimestampMeta(o);
                                return (
                                    <tr key={o.id}>
                                        <td>{o.id}</td>
                                        <td>{o.customer_name}</td>
                                        <td>{o.organization}</td>
                                        <td>{o.delivery_point}</td>
                                        <td><span className={`status-badge ${o.status}`}>{o.status}</span></td>
                                        <td>{timeMeta.value}</td>
                                        <td className="orders-actions">
                                            <button onClick={() => openOrder(o)} disabled={viewLoading}>Avaa</button>
                                            {isAdmin && (
                                                <button className="danger-btn" onClick={() => deleteOrder(o.id)}>Poista</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ))}

            {filteredOrders.length === 0 && (
                <p className="no-results">Ei löytyviä tilauksia.</p>
            )}

            {viewingOrder && (
                <div className="order-view-backdrop" onClick={() => setViewingOrder(null)}>
                    <div className="order-view-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="order-view-topbar">
                            <h3>Tilaus #{viewingOrder.order.id}</h3>
                            <div className="order-view-actions">
                                <a href={`/api/orders/${viewingOrder.order.id}/pdf`} target="_blank" rel="noopener noreferrer">Lataa PDF</a>
                                <button className="secondary-btn" onClick={() => setViewingOrder(null)}>Sulje</button>
                            </div>
                        </div>
                        <div className="order-view-meta">
                            <div><strong>Tapahtuma:</strong> {viewingOrder.order.event_name || '-'}</div>
                            <div><strong>Tilaaja:</strong> {viewingOrder.order.customer_name || '-'}</div>
                            <div><strong>Organisaatio:</strong> {viewingOrder.order.organization || '-'}</div>
                            <div><strong>Toimituspiste:</strong> {viewingOrder.order.delivery_point || '-'}</div>
                            <div><strong>Status:</strong> {viewingOrder.order.status || '-'}</div>
                        </div>
                        <div className="order-view-section">
                            <h4>Tuotteet</h4>
                            <ul>
                                {viewingOrder.items.map((item, idx) => (
                                    <li key={idx}>{item.name} ({item.sku}) - {item.quantity} kpl</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

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
    const [filters, setFilters] = useState({
        search: '',
        orderer: '',
        deliveryPoint: '',
        status: ''
    });

    const userJson = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
    let user = null;
    try { user = userJson ? JSON.parse(userJson) : null; } catch (e) { user = null; }
    const isLoggedIn = Boolean(user);
    const isAdmin = Boolean(user && user.role === 'admin');

    const loadOrders = () => {
        api.get('/orders')
            .then(res => setOrders(res.data))
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
            order.status
        ].some((value) => String(value || '').toLowerCase().includes(filters.search.toLowerCase()));

        const matchesOrderer = !filters.orderer || String(order.customer_name || '')
            .toLowerCase()
            .includes(filters.orderer.toLowerCase());

        const matchesDeliveryPoint = !filters.deliveryPoint || String(order.delivery_point || '')
            .toLowerCase()
            .includes(filters.deliveryPoint.toLowerCase());

        const matchesStatus = !filters.status || String(order.status || '') === filters.status;

        return matchesSearch && matchesOrderer && matchesDeliveryPoint && matchesStatus;
    }).sort((left, right) => {
        switch (sortBy) {
            case 'alpha-asc':
                return compareText(left.customer_name, right.customer_name);
            case 'alpha-desc':
                return compareText(right.customer_name, left.customer_name);
            case 'delivery-point-asc':
                return compareText(left.delivery_point, right.delivery_point) || compareText(left.customer_name, right.customer_name);
            case 'edited-desc': {
                const leftEdited = parseTimestamp(left.updated_at)?.getTime() || 0;
                const rightEdited = parseTimestamp(right.updated_at)?.getTime() || 0;
                return rightEdited - leftEdited || compareText(left.customer_name, right.customer_name);
            }
            case 'edited-asc': {
                const leftEdited = parseTimestamp(left.updated_at)?.getTime() || 0;
                const rightEdited = parseTimestamp(right.updated_at)?.getTime() || 0;
                return leftEdited - rightEdited || compareText(left.customer_name, right.customer_name);
            }
            case 'placed-asc': {
                const leftPlaced = parseTimestamp(left.created_at)?.getTime() || 0;
                const rightPlaced = parseTimestamp(right.created_at)?.getTime() || 0;
                return leftPlaced - rightPlaced || compareText(left.customer_name, right.customer_name);
            }
            case 'placed-desc':
            default: {
                const leftPlaced = parseTimestamp(left.created_at)?.getTime() || 0;
                const rightPlaced = parseTimestamp(right.created_at)?.getTime() || 0;
                return rightPlaced - leftPlaced || compareText(left.customer_name, right.customer_name);
            }
        }
    });

    const availableStatuses = Array.from(new Set(orders.map((order) => order.status).filter(Boolean))).sort(compareText);

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
                        placeholder="ID, tilaaja, organisaatio..."
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
                        <option value="">Kaikki</option>
                        {availableStatuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Järjestys
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="placed-desc">Uusimmat tehdyt</option>
                        <option value="placed-asc">Vanhimmat tehdyt</option>
                        <option value="edited-desc">Viimeksi muokatut</option>
                        <option value="edited-asc">Pisimpään muokkaamatta</option>
                        <option value="alpha-asc">Tilaaja A-O</option>
                        <option value="alpha-desc">Tilaaja O-A</option>
                        <option value="delivery-point-asc">Toimituspiste A-O</option>
                    </select>
                </label>
            </div>

            <p className="orders-results-count">Näytetään {filteredOrders.length} / {orders.length} tilausta</p>

            <table className="orders-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tilaaja</th>
                        <th>Organisaatio</th>
                        <th>Toimituspiste</th>
                        <th>Palautus</th>
                        <th>Status</th>
                        <th>Aikaleima</th>
                        <th>Toiminnot</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredOrders.map(o => {
                        const timeMeta = getOrderTimestampMeta(o);
                        return (
                        <tr key={o.id}>
                            <td>{o.id}</td>
                            <td>{o.customer_name}</td>
                            <td>{o.organization}</td>
                            <td>{o.delivery_point}</td>
                            <td>{o.return_at?.slice(0,10)}</td>
                            <td>{o.status}</td>
                            <td>{timeMeta.label}: {timeMeta.value}</td>
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
                    )})}
                    {filteredOrders.length === 0 && (
                        <tr>
                            <td colSpan="8">Ei hakuehdoilla löytyviä tilauksia.</td>
                        </tr>
                    )}
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
                            {(() => {
                                const timeMeta = getOrderTimestampMeta(viewingOrder.order);
                                return <div><strong>{timeMeta.label}:</strong> {timeMeta.value}</div>;
                            })()}
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
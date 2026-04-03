import { useEffect, useState } from 'react';
import api from '../api';
import buildImageUrl from '../utils/imageUrl';
import '../styles/edit-order-modal.css';

export default function EditOrderModal({ orderId, customerName, onClose, onSaved }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedAdd, setSelectedAdd] = useState('');

  const parseRequirements = (value) => {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (!orderId) return;
    // fetch order details; unauthenticated flow can read by matching customer_name
    api.get(`/orders/${orderId}`, {
      params: customerName ? { customer_name: customerName } : undefined,
    })
      .then(res => {
        setOrder(res.data.order);
        // map items to editable shape
        setItems(res.data.items.map(i => ({
          item_id: i.item_id,
          quantity: i.quantity,
          name: i.item_name || i.name,
          thumbnail_url: i.thumbnail_url || i.image_url,
          short_description: i.short_description,
          sku: i.sku,
        })));
      })
      .catch(err => setError(err.response?.data?.error || 'Virhe haettaessa tilausta'));

    // also fetch available items for adding lines
    api.get('/items').then(r => setAvailableItems(r.data)).catch(() => {});
  }, [orderId, customerName]);

  if (!orderId) return null;

  const requirements = parseRequirements(order?.special_requirements);

  const updateQty = (index, q) => {
    const copy = [...items];
    const parsed = Math.max(0, Number(q) || 0);
    const line = copy[index];
    // determine available stock for this item
    const ai = availableItems.find(a => a.id === line.item_id);
    const available = ai ? ai.available_stock : 0;
    const oldQty = line.quantity || 0; // current shown quantity is the old reservation
    // When editing an existing line, the maximum allowed is oldQty + available
    // For newly added lines oldQty is 0.
    const maxAllowed = oldQty + (available || 0);
    if (parsed > maxAllowed) {
      setError(`Varastossa vain ${available} vapaata kpl (max ${maxAllowed})`);
      copy[index].quantity = maxAllowed;
    } else {
      copy[index].quantity = parsed;
      setError('');
    }
    setItems(copy);
  };

  const removeLine = (index) => {
    const copy = [...items];
    copy.splice(index, 1);
    setItems(copy);
  };

  const addLine = () => {
    if (!selectedAdd) return;
    const iid = parseInt(selectedAdd, 10);
    // prevent duplicates
    if (items.find(it => it.item_id === iid)) {
      setError('Tuote on jo riveillä');
      return;
    }
    const sel = availableItems.find(a => a.id === iid);
    setItems(prev => [...prev, { item_id: iid, quantity: 1, name: sel ? sel.name : `#${iid}` }]);
    setSelectedAdd('');
    setError('');
  };

  const submit = async () => {
    setError('');
    try {
      const payload = { items: items.map(i => ({ item_id: i.item_id, quantity: i.quantity })) };
      if (order.customer_name) payload.customer_name = order.customer_name;
      const res = await api.patch(`/orders/${orderId}`, payload);
      onSaved && onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Tilauksen päivitys epäonnistui');
    }
  };

  return (
    <div className="eom-backdrop">
      <div className="eom-dialog">
        <h3 className="eom-title">Muokkaa tilausta #{orderId}</h3>
        {error && <p className="eom-error">{error}</p>}

        <div className="eom-field">
          <label className="eom-label">
            Asiakas
            <input
              className="eom-input"
              value={order?.customer_name || ''}
              onChange={e => setOrder({ ...order, customer_name: e.target.value })}
            />
          </label>
        </div>

        {requirements && (
          <div className="eom-requirements">
            <div className="eom-requirements-title">Lisätiedot tilaukseen</div>
            {requirements.power && <div><strong>Sähköt:</strong> {requirements.power}</div>}
            {requirements.network && <div><strong>Verkko:</strong> {requirements.network}</div>}
            {requirements.lighting && <div><strong>Valaistus:</strong> {requirements.lighting}</div>}
            {requirements.tv && <div><strong>TV:</strong> {requirements.tv}</div>}
          </div>
        )}

        <h4 className="eom-section-title">Tilatut tuotteet</h4>

        <div className="eom-add-row">
          <select className="eom-select" value={selectedAdd} onChange={e => setSelectedAdd(e.target.value)}>
            <option value="">-- Lisää tuote --</option>
            {availableItems.map(ai => (
              <option key={ai.id} value={ai.id}>{ai.name} (var: {ai.available_stock})</option>
            ))}
          </select>
          <button className="eom-btn" onClick={addLine}>Lisää</button>
        </div>

        <div className="eom-items-list">
          {items.map((it, idx) => {
            const ai = availableItems.find(a => a.id === it.item_id);
            const available = ai ? ai.available_stock : null;
            const thumb = it.thumbnail_url || (ai && (ai.thumbnail_url || ai.image_url));
            return (
              <div key={idx} className="eom-item-row">
                <img
                  className="eom-item-thumb"
                  src={buildImageUrl(thumb)}
                  alt={it.name || ''}
                  onError={e => { e.currentTarget.src = buildImageUrl(null); }}
                />
                <div className="eom-item-info">
                  <div className="eom-item-name">{it.name || `#${it.item_id}`}</div>
                  {it.sku && <div className="eom-item-meta">SKU: {it.sku}</div>}
                  {it.short_description && <div className="eom-item-meta">{it.short_description}</div>}
                  {available !== null && (
                    <div className="eom-item-meta">Vapaana varastossa: {available} kpl</div>
                  )}
                </div>
                <div className="eom-item-qty">
                  <label className="eom-qty-label">Määrä</label>
                  <input
                    className="eom-qty-input"
                    type="number"
                    min="0"
                    value={it.quantity}
                    onChange={e => updateQty(idx, e.target.value)}
                  />
                </div>
                <button className="eom-btn eom-btn-danger" onClick={() => removeLine(idx)}>Poista</button>
              </div>
            );
          })}
        </div>

        <div className="eom-actions">
          <button
            className="eom-btn eom-btn-primary"
            onClick={submit}
          >
            Tallenna
          </button>
          <button className="eom-btn" onClick={onClose}>Peruuta</button>
        </div>
      </div>
    </div>
  );
}

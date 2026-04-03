import { useEffect, useState } from 'react';
import api from '../api';

export default function EditOrderModal({ orderId, onClose, onSaved }) {
  const [order, setOrder] = useState(null);
  const [originalName, setOriginalName] = useState('');
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
    // fetch order details (requires auth)
    api.get(`/orders/${orderId}`)
      .then(res => {
        setOrder(res.data.order);
        // remember original name to require confirmation when editing
        setOriginalName((res.data.order && res.data.order.customer_name) || '');
        // map items to editable shape
        setItems(res.data.items.map(i => ({ item_id: i.item_id, quantity: i.quantity, name: i.item_name || i.name })));
      })
      .catch(err => setError(err.response?.data?.error || 'Virhe haettaessa tilausta'));

    // also fetch available items for adding lines
    api.get('/items').then(r => setAvailableItems(r.data)).catch(() => {});
  }, [orderId]);

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
    // require editor to type the exact original customer name (trimmed)
    const typed = (order?.customer_name || '').trim();
    const orig = (originalName || '').trim();
    if (orig && typed !== orig) {
      setError(`Vahvista tilausta kirjoittamalla tilaajan nimi täsmälleen kuten tilauksessa: "${orig}"`);
      return;
    }
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
    <div className="edit-order-modal-overlay">
      <div className="edit-order-modal">
        <h3>Muokkaa tilausta #{orderId}</h3>
        {error && <p className="edit-order-modal-error">{error}</p>}

        <div>
          <label> Asiakas: <input value={order?.customer_name||''} onChange={e => setOrder({...order, customer_name: e.target.value})} /> </label>
          {originalName && (
            <div className="edit-order-modal-hint">
              Syötä tilaajan nimi täsmälleen kuten tilauksessa ennen tallennusta: <strong>"{originalName}"</strong>
            </div>
          )}
        </div>

        {requirements && (
          <div className="edit-order-modal-requirements">
            <div className="edit-order-modal-requirements-title">Lisatiedot tilaukseen</div>
            {requirements.power && <div><strong>Sähköt:</strong> {requirements.power}</div>}
            {requirements.network && <div><strong>Verkko:</strong> {requirements.network}</div>}
            {requirements.lighting && <div><strong>Valaistus:</strong> {requirements.lighting}</div>}
            {requirements.tv && <div><strong>TV:</strong> {requirements.tv}</div>}
          </div>
        )}

        <h4>Rivit</h4>
        <div className="edit-order-modal-toolbar">
          <select value={selectedAdd} onChange={e => setSelectedAdd(e.target.value)}>
            <option value="">-- Lisää tuote --</option>
            {availableItems.map(ai => (
              <option key={ai.id} value={ai.id}>{ai.name} (var: {ai.available_stock})</option>
            ))}
          </select>
          <button onClick={addLine} className="edit-order-modal-add-btn">Lisää</button>
        </div>

        {items.map((it, idx) => {
          const ai = availableItems.find(a => a.id === it.item_id);
          const available = ai ? ai.available_stock : null;
          return (
            <div key={idx} className="edit-order-modal-row">
              <div className="edit-order-modal-row-name">
                {it.name || it.item_id}
                {available !== null && <div className="edit-order-modal-stock">Varastossa vapaita: {available}</div>}
              </div>
              <input type="number" min="0" value={it.quantity} onChange={e => updateQty(idx, e.target.value)} className="edit-order-modal-qty" />
              <button onClick={() => removeLine(idx)}>Poista</button>
            </div>
          );
        })}

        <div className="edit-order-modal-actions">
          <button onClick={submit} disabled={Boolean(originalName && ((order?.customer_name||'').trim() !== originalName.trim()))}>Tallenna</button>
          <button onClick={onClose} className="edit-order-modal-cancel-btn">Peruuta</button>
        </div>
      </div>
    </div>
  );
}

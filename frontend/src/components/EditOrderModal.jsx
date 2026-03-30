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
    <div style={{ position: 'fixed', left:0,top:0,right:0,bottom:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', padding:20, width:800, maxHeight:'80%', overflow:'auto' }}>
        <h3>Muokkaa tilausta #{orderId}</h3>
        {error && <p style={{ color:'red' }}>{error}</p>}

        <div>
          <label> Asiakas: <input value={order?.customer_name||''} onChange={e => setOrder({...order, customer_name: e.target.value})} /> </label>
          {originalName && (
            <div style={{ fontSize:12, color:'#666', marginTop:6 }}>
              Syötä tilaajan nimi täsmälleen kuten tilauksessa ennen tallennusta: <strong>"{originalName}"</strong>
            </div>
          )}
        </div>

        {requirements && (
          <div style={{ marginTop: 10, padding: 10, border: '1px solid #eee', borderRadius: 6, background: '#fafafa' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Lisatiedot tilaukseen</div>
            {requirements.power && <div><strong>Sähköt:</strong> {requirements.power}</div>}
            {requirements.network && <div><strong>Verkko:</strong> {requirements.network}</div>}
            {requirements.lighting && <div><strong>Valaistus:</strong> {requirements.lighting}</div>}
          </div>
        )}

        <h4>Rivit</h4>
        <div style={{ marginBottom: 8 }}>
          <select value={selectedAdd} onChange={e => setSelectedAdd(e.target.value)}>
            <option value="">-- Lisää tuote --</option>
            {availableItems.map(ai => (
              <option key={ai.id} value={ai.id}>{ai.name} (var: {ai.available_stock})</option>
            ))}
          </select>
          <button onClick={addLine} style={{ marginLeft: 8 }}>Lisää</button>
        </div>

        {items.map((it, idx) => {
          const ai = availableItems.find(a => a.id === it.item_id);
          const available = ai ? ai.available_stock : null;
          return (
            <div key={idx} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
              <div style={{ flex:1 }}>
                {it.name || it.item_id}
                {available !== null && <div style={{ fontSize:12, color:'#666' }}>Varastossa vapaita: {available}</div>}
              </div>
              <input type="number" min="0" value={it.quantity} onChange={e => updateQty(idx, e.target.value)} style={{ width:80 }} />
              <button onClick={() => removeLine(idx)}>Poista</button>
            </div>
          );
        })}

        <div style={{ marginTop: 12 }}>
          <button onClick={submit} disabled={Boolean(originalName && ((order?.customer_name||'').trim() !== originalName.trim()))}>Tallenna</button>
          <button onClick={onClose} style={{ marginLeft:8 }}>Peruuta</button>
        </div>
      </div>
    </div>
  );
}

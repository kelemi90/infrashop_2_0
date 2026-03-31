import React, { useState } from 'react';

export default function GroupEditor({ value = [], onChange, allItems = [], onSave, onClose, saving=false }) {
  const [selectedAddItem, setSelectedAddItem] = useState('');
  const [selectedAddQty, setSelectedAddQty] = useState(1);
  const [itemSearch, setItemSearch] = useState('');

  const searchTerm = itemSearch.trim().toLowerCase();
  const filteredItems = allItems.filter((ai) => {
    if (!searchTerm) return true;
    return (ai.name || '').toLowerCase().includes(searchTerm);
  });
  const selectedItem = allItems.find((ai) => String(ai.id) === String(selectedAddItem));

  const addSelected = () => {
    if (!selectedAddItem) return;
    const iid = Number(selectedAddItem);
    const existing = value.find(x => x.item_id === iid);
    if (existing) {
      existing.quantity = Number(existing.quantity) + Number(selectedAddQty);
      onChange([...value]);
    } else {
      const ai = allItems.find(a => a.id === iid);
      onChange([...value, { item_id: iid, quantity: Number(selectedAddQty), name: ai ? ai.name : `#${iid}` }]);
    }
    setSelectedAddItem(''); setSelectedAddQty(1);
  };

  const updateQty = (idx, newQty) => {
    const copy = [...value];
    copy[idx].quantity = Number(newQty);
    onChange(copy);
  };

  const removeItem = (idx) => {
    onChange(value.filter((_,i)=>i!==idx));
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Hae tuotetta nimellä"
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />

        <div style={{ marginBottom: 8, display: 'inline-block', width: 'fit-content', maxWidth: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, background: '#f8fafc', color: '#111827' }}>
          {selectedItem ? `Valittu tuote: ${selectedItem.name}` : 'Valittu tuote: ei valittu'}
        </div>
        <input type="number" min="1" value={selectedAddQty} onChange={e => setSelectedAddQty(Number(e.target.value))} style={{ width:80, marginLeft:8 }} />
        <button style={{ marginLeft:8 }} onClick={addSelected}>Add</button>
        {onClose && <button style={{ marginLeft:8 }} onClick={onClose}>Close</button>}
      </div>

      <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, marginBottom: 10 }}>
        {filteredItems.map((ai) => (
          <div key={ai.id} style={{ marginBottom: 6 }}>
            <button
              type="button"
              onClick={() => setSelectedAddItem(String(ai.id))}
              style={{ width: '100%', textAlign: 'left' }}
            >
              {ai.name} (var: {ai.available_stock})
            </button>
          </div>
        ))}
        {filteredItems.length === 0 && <div>Ei hakutuloksia</div>}
      </div>

      <div>
        {value.map((it, idx) => (
          <div key={idx} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
            <div style={{ flex:1 }}>{it.name}</div>
            <input type="number" min="1" value={it.quantity} onChange={e => updateQty(idx, e.target.value)} style={{ width:80 }} />
            <button onClick={() => removeItem(idx)}>Remove</button>
          </div>
        ))}
      </div>

      <div style={{ marginTop:10 }}>
        {onSave && <button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save group items'}</button>}
      </div>
    </div>
  );
}

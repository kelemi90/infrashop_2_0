import React, { useState } from 'react';

export default function GroupEditor({ value = [], onChange, allItems = [], onSave, onClose, saving=false }) {
  const [selectedAddItem, setSelectedAddItem] = useState('');
  const [selectedAddQty, setSelectedAddQty] = useState(1);

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
        <select value={selectedAddItem} onChange={e => setSelectedAddItem(e.target.value)}>
          <option value="">-- Valitse tuote --</option>
          {allItems.map(ai => (
            <option key={ai.id} value={ai.id}>{ai.name} (var: {ai.available_stock})</option>
          ))}
        </select>
        <input type="number" min="1" value={selectedAddQty} onChange={e => setSelectedAddQty(Number(e.target.value))} style={{ width:80, marginLeft:8 }} />
        <button style={{ marginLeft:8 }} onClick={addSelected}>Add</button>
        {onClose && <button style={{ marginLeft:8 }} onClick={onClose}>Close</button>}
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

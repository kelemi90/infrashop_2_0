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
      <div className="group-editor-toolbar">
        <input
          type="text"
          placeholder="Hae tuotetta nimellä"
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
          className="group-editor-search"
        />

        <div className="group-editor-selected">
          {selectedItem ? `Valittu tuote: ${selectedItem.name}` : 'Valittu tuote: ei valittu'}
        </div>
        <input type="number" min="1" value={selectedAddQty} onChange={e => setSelectedAddQty(Number(e.target.value))} className="group-editor-qty" />
        <button className="group-editor-btn-spaced" onClick={addSelected}>Add</button>
        {onClose && <button className="group-editor-btn-spaced" onClick={onClose}>Close</button>}
      </div>

      <div className="group-editor-items-list">
        {filteredItems.map((ai) => (
          <div key={ai.id} className="group-editor-item-row">
            <button
              type="button"
              onClick={() => setSelectedAddItem(String(ai.id))}
              className="group-editor-item-btn"
            >
              {ai.name} (var: {ai.available_stock})
            </button>
          </div>
        ))}
        {filteredItems.length === 0 && <div>Ei hakutuloksia</div>}
      </div>

      <div>
        {value.map((it, idx) => (
          <div key={idx} className="group-editor-edit-row">
            <div className="group-editor-edit-name">{it.name}</div>
            <input type="number" min="1" value={it.quantity} onChange={e => updateQty(idx, e.target.value)} className="group-editor-qty-only" />
            <button onClick={() => removeItem(idx)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="group-editor-save-wrap">
        {onSave && <button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save group items'}</button>}
      </div>
    </div>
  );
}

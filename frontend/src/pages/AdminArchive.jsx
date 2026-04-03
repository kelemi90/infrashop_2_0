import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function normalizeName(value) {
  if (!value) return '';
  try {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  } catch (e) {
    return String(value).toLowerCase().trim();
  }
}

function isTableItem(name) {
  const n = normalizeName(name);
  if (n.includes('vaneripoyd')) return true;
  if (n.includes('valkoinen muovipoyta')) return true;
  if (n.includes('valkoiset muovipöydät')) return true;
  return false;
}

export default function AdminArchive() {
  const navigate = useNavigate();
  const userJson = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
  let user = null;
  try { user = userJson ? JSON.parse(userJson) : null; } catch (e) { user = null; }
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [groupedItems, setGroupedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [itemGroups, setItemGroups] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupItems, setEditingGroupItems] = useState([]);
  const [selectedAddItem, setSelectedAddItem] = useState('');
  const [selectedAddQty, setSelectedAddQty] = useState(1);

  const tableItems = groupedItems.filter((item) => isTableItem(item.name));
  const totalTables = tableItems.reduce((sum, item) => sum + Number(item.total_ordered || 0), 0);

  // hae kaikki tapahtumat
  useEffect(() => {
    api.get('/events')
      .then(res => setEvents((res.data || []).filter((ev) => (ev.name || '').trim().toLowerCase() !== 'vectorama lan 2025')))
      .catch(err => console.error(err));
    // fetch item groups and all items for admin operations
    api.get('/item-groups').then(r => setItemGroups(r.data)).catch(() => {});
    api.get('/items').then(r => setAllItems(r.data)).catch(() => {});
  }, []);

  // hae valitun tapahtuman ryhmitellyt tilaukset
  useEffect(() => {
    if (!selectedEvent) return;

    setLoading(true);
    api.get(`/events/${selectedEvent.id}/grouped-orders`)
      .then(res => {
        setGroupedItems(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedEvent]);

  const returnItemsToStock = async () => {
    if (!selectedEvent) return;

    if (!window.confirm(`Palautetaanko kaikki tavarat varastoon tapahtumasta "${selectedEvent.name}"?`)) {
      return;
    }

    try {
      await api.post(`/events/${selectedEvent.id}/return-to-stock`, {
        actor: 'admin'
      });
      setMessage('Tavarat palautettu varastoon ja tilaukset arkistoitu.');
      setGroupedItems([]);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Virhe palautuksessa');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <h2>Admin – Arkisto</h2>
        {user && user.role === 'admin' && (
          <div>
            <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); }} className="admin-logout-btn">
              Logout
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className="admin-success-msg">
          {message}
        </div>
      )}

      <div className="admin-layout">
        {/* Tapahtumavalinta */}
        <div className="admin-events-column">
          <h3>Tapahtumat</h3>
          <ul className="admin-list-reset">
            {events.map(ev => (
              <li key={ev.id}>
                <button
                  className={`admin-event-btn ${selectedEvent?.id === ev.id ? 'admin-event-btn-active' : ''}`}
                  onClick={() => setSelectedEvent(ev)}
                >
                  <strong>{ev.name}</strong><br />
                  <span className="admin-event-dates">
                    {ev.start_date?.slice(0, 10)} – {ev.end_date?.slice(0, 10)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Tapahtuman sisältö */}
        <div className="admin-content-column">
          {!selectedEvent && (
            <div>Valitse tapahtuma nähdäksesi arkistoidut tilaukset</div>
          )}

          {loading && <div>Ladataan…</div>}

          {selectedEvent && !loading && (
            <>
              <h3>{selectedEvent.name}</h3>

              <button
                onClick={returnItemsToStock}
                className="admin-return-btn"
              >
                Palauta kaikki tavarat varastoon
              </button>

              {groupedItems.length === 0 ? (
                <div>Ei aktiivisia tilauksia</div>
              ) : (
                <table width="100%" border="1" cellPadding="6" className="admin-table">
                  <thead>
                    <tr>
                      <th align="left">Tuote</th>
                      <th align="left">SKU</th>
                      <th align="right">Yhteensä tilattu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedItems.map(item => (
                      <tr key={item.item_id}>
                        <td>{item.name}</td>
                        <td>{item.sku}</td>
                        <td align="right">{item.total_ordered}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        
          <hr />

          <h3>Item groups (Admin)</h3>
          <div className="admin-create-row">
            <input placeholder="Group name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
            <input placeholder="Description" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} className="admin-ml8" />
            <button className="admin-ml8" onClick={async () => {
              try {
                const res = await api.post('/item-groups', { name: newGroupName, description: newGroupDesc });
                setItemGroups(prev => [...prev, res.data]);
                setNewGroupName(''); setNewGroupDesc('');
              } catch (err) { console.error(err); alert(err.response?.data?.error || 'Failed'); }
            }}>Create group</button>
          </div>

          <div className="admin-groups-layout">
            <div className="admin-groups-sidebar">
              <h4>Groups</h4>
              <ul className="admin-list-reset">
                {itemGroups.map(g => (
                  <li key={g.id} className="admin-list-item-gap">
                    <div className="admin-list-row">
                      <button className="admin-list-main-btn" onClick={() => navigate(`/admin/groups/${g.id}/edit`)}>{g.name}</button>
                      <button onClick={async () => {
                        // quick inline edit shortcut (keeps previous behavior)
                        setEditingGroupId(g.id);
                        try {
                          const r = await api.get(`/item-groups/${g.id}/items`);
                          setEditingGroupItems(r.data.map(it => ({ item_id: it.item_id, quantity: it.quantity, name: it.name })));
                        } catch (err) { console.error(err); }
                      }}>Inline edit</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="admin-groups-content">
              {editingGroupId ? (
                <div>
                  <h4>Edit group items</h4>
                  <div className="admin-create-row">
                    <select value={selectedAddItem} onChange={e => setSelectedAddItem(e.target.value)}>
                      <option value="">-- Valitse tuote --</option>
                      {allItems.map(ai => (
                        <option key={ai.id} value={ai.id}>{ai.name} (var: {ai.available_stock})</option>
                      ))}
                    </select>
                    <input type="number" min="1" value={selectedAddQty} onChange={e => setSelectedAddQty(Number(e.target.value))} className="admin-qty-input admin-ml8" />
                    <button className="admin-ml8" onClick={() => {
                      if (!selectedAddItem) return;
                      const iid = Number(selectedAddItem);
                      const existing = editingGroupItems.find(x => x.item_id === iid);
                      if (existing) { existing.quantity += selectedAddQty; setEditingGroupItems([...editingGroupItems]); }
                      else {
                        const ai = allItems.find(a => a.id === iid);
                        setEditingGroupItems(prev => [...prev, { item_id: iid, quantity: selectedAddQty, name: ai ? ai.name : `#${iid}` }]);
                      }
                      setSelectedAddItem(''); setSelectedAddQty(1);
                    }}>Add</button>
                  </div>

                  <div>
                    {editingGroupItems.map((it, idx) => (
                      <div key={idx} className="admin-list-row admin-list-item-gap">
                        <div className="admin-list-main-btn-like">{it.name}</div>
                        <input type="number" min="1" value={it.quantity} onChange={e => { const copy = [...editingGroupItems]; copy[idx].quantity = Number(e.target.value); setEditingGroupItems(copy); }} className="admin-qty-input" />
                        <button onClick={() => { setEditingGroupItems(prev => prev.filter((_,i)=>i!==idx)); }}>Remove</button>
                      </div>
                    ))}
                  </div>

                  <div className="admin-mt10">
                    <button onClick={async () => {
                      try {
                        await api.post(`/item-groups/${editingGroupId}/items`, { items: editingGroupItems.map(i=>({ item_id: i.item_id, quantity: i.quantity })) });
                        alert('Saved');
                      } catch (err) { console.error(err); alert(err.response?.data?.error || 'Save failed'); }
                    }}>Save group items</button>
                    <button className="admin-ml8" onClick={() => { setEditingGroupId(null); setEditingGroupItems([]); }}>Close</button>
                  </div>
                </div>
              ) : (
                <div>Select a group to edit</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

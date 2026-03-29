import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function AdminArchive() {
  const navigate = useNavigate();
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
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

  // hae kaikki tapahtumat
  useEffect(() => {
    api.get('/events')
      .then(res => setEvents(res.data))
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
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Admin – Arkisto</h2>
        {user && user.role === 'admin' && (
          <div>
            <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); }} style={{ background: '#c62828', color: '#fff', border: 'none', padding: '6px 10px', borderRadius:4, cursor:'pointer' }}>
              Logout
            </button>
          </div>
        )}
      </div>

      {message && (
        <div style={{ marginBottom: 10, color: 'green' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 30 }}>
        {/* Tapahtumavalinta */}
        <div style={{ minWidth: 250 }}>
          <h3>Tapahtumat</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {events.map(ev => (
              <li key={ev.id}>
                <button
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: 8,
                    marginBottom: 4,
                    background: selectedEvent?.id === ev.id ? '#e0e0e0' : '#fff',
                    border: '1px solid #ccc',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedEvent(ev)}
                >
                  <strong>{ev.name}</strong><br />
                  <span style={{ fontSize: 12, color: '#666' }}>
                    {ev.start_date?.slice(0, 10)} – {ev.end_date?.slice(0, 10)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Tapahtuman sisältö */}
        <div style={{ flex: 1 }}>
          {!selectedEvent && (
            <div>Valitse tapahtuma nähdäksesi arkistoidut tilaukset</div>
          )}

          {loading && <div>Ladataan…</div>}

          {selectedEvent && !loading && (
            <>
              <h3>{selectedEvent.name}</h3>

              <button
                onClick={returnItemsToStock}
                style={{
                  marginBottom: 12,
                  background: '#c62828',
                  color: '#fff',
                  padding: '8px 12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Palauta kaikki tavarat varastoon
              </button>

              {groupedItems.length === 0 ? (
                <div>Ei aktiivisia tilauksia</div>
              ) : (
                <table width="100%" border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
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
          <div style={{ marginBottom: 8 }}>
            <input placeholder="Group name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
            <input placeholder="Description" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} style={{ marginLeft: 8 }} />
            <button style={{ marginLeft: 8 }} onClick={async () => {
              try {
                const res = await api.post('/item-groups', { name: newGroupName, description: newGroupDesc });
                setItemGroups(prev => [...prev, res.data]);
                setNewGroupName(''); setNewGroupDesc('');
              } catch (err) { console.error(err); alert(err.response?.data?.error || 'Failed'); }
            }}>Create group</button>
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ minWidth: 260 }}>
              <h4>Groups</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {itemGroups.map(g => (
                  <li key={g.id} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button style={{ flex: 1, textAlign: 'left' }} onClick={() => navigate(`/admin/groups/${g.id}/edit`)}>{g.name}</button>
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

            <div style={{ flex: 1 }}>
              {editingGroupId ? (
                <div>
                  <h4>Edit group items</h4>
                  <div style={{ marginBottom: 8 }}>
                    <select value={selectedAddItem} onChange={e => setSelectedAddItem(e.target.value)}>
                      <option value="">-- Valitse tuote --</option>
                      {allItems.map(ai => (
                        <option key={ai.id} value={ai.id}>{ai.name} (var: {ai.available_stock})</option>
                      ))}
                    </select>
                    <input type="number" min="1" value={selectedAddQty} onChange={e => setSelectedAddQty(Number(e.target.value))} style={{ width:80, marginLeft:8 }} />
                    <button style={{ marginLeft:8 }} onClick={() => {
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
                      <div key={idx} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                        <div style={{ flex:1 }}>{it.name}</div>
                        <input type="number" min="1" value={it.quantity} onChange={e => { const copy = [...editingGroupItems]; copy[idx].quantity = Number(e.target.value); setEditingGroupItems(copy); }} style={{ width:80 }} />
                        <button onClick={() => { setEditingGroupItems(prev => prev.filter((_,i)=>i!==idx)); }}>Remove</button>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop:10 }}>
                    <button onClick={async () => {
                      try {
                        await api.post(`/item-groups/${editingGroupId}/items`, { items: editingGroupItems.map(i=>({ item_id: i.item_id, quantity: i.quantity })) });
                        alert('Saved');
                      } catch (err) { console.error(err); alert(err.response?.data?.error || 'Save failed'); }
                    }}>Save group items</button>
                    <button style={{ marginLeft:8 }} onClick={() => { setEditingGroupId(null); setEditingGroupItems([]); }}>Close</button>
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

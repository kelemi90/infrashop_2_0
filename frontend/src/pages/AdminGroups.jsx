import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import GroupEditor from '../components/GroupEditor';

export default function AdminGroups() {
  const navigate = useNavigate();
  const userJson = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
  let user = null;
  try { user = userJson ? JSON.parse(userJson) : null; } catch (e) { user = null; }

  const [itemGroups, setItemGroups] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupItems, setEditingGroupItems] = useState([]);

  useEffect(() => {
    api.get('/item-groups').then(r => setItemGroups(r.data)).catch(() => {});
    api.get('/items').then(r => setAllItems(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Muokkaa tuoteryhmiä</h2>
        {user && (
          <div>
            <button onClick={() => { sessionStorage.removeItem('token'); sessionStorage.removeItem('user'); navigate('/'); }} style={{ background: '#c62828', color: '#fff', border: 'none', padding: '6px 10px', borderRadius:4, cursor:'pointer' }}>
              Logout
            </button>
          </div>
        )}
      </div>

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
                    setEditingGroupId(g.id);
                    try {
                      const r = await api.get(`/item-groups/${g.id}/items`);
                      setEditingGroupItems(r.data.map(it => ({ item_id: it.item_id, quantity: it.quantity, name: it.name })));
                    } catch (err) { console.error(err); }
                  }}>Inline edit</button>
                  <button
                    style={{ background: '#b91c1c', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}
                    onClick={async () => {
                      const ok = window.confirm(`Poistetaanko tuoteryhma \"${g.name}\"?`);
                      if (!ok) return;
                      try {
                        await api.delete(`/item-groups/${g.id}`);
                        setItemGroups(prev => prev.filter(x => x.id !== g.id));
                        if (editingGroupId === g.id) {
                          setEditingGroupId(null);
                          setEditingGroupItems([]);
                        }
                      } catch (err) {
                        console.error(err);
                        alert(err.response?.data?.error || 'Delete failed');
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ flex: 1 }}>
          {editingGroupId ? (
            <div>
              <h4>Edit group items</h4>
              <GroupEditor
                value={editingGroupItems}
                onChange={setEditingGroupItems}
                allItems={allItems}
                onSave={async () => {
                  try {
                    await api.post(`/item-groups/${editingGroupId}/items`, { items: editingGroupItems.map(i=>({ item_id: i.item_id, quantity: i.quantity })) });
                    alert('Saved');
                  } catch (err) { console.error(err); alert(err.response?.data?.error || 'Save failed'); }
                }}
                onClose={() => { setEditingGroupId(null); setEditingGroupItems([]); }}
              />
            </div>
          ) : (
            <div>Select a group to edit</div>
          )}
        </div>
      </div>
    </div>
  );
}

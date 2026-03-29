import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import GroupEditor from '../components/GroupEditor';

export default function GroupEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [groupItems, setGroupItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/item-groups').then(r => {
      const found = r.data.find(g => String(g.id) === String(id));
      setGroup(found || { id, name: `Group ${id}` });
    }).catch(() => {});

    api.get('/items').then(r => setAllItems(r.data)).catch(() => {});

    api.get(`/item-groups/${id}/items`).then(r => {
      setGroupItems(r.data.map(it => ({ item_id: it.item_id, quantity: it.quantity, name: it.name })));
    }).catch(() => {});
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await api.post(`/item-groups/${id}/items`, { items: groupItems.map(i => ({ item_id: i.item_id, quantity: i.quantity })) });
      alert('Saved');
      navigate('/admin');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <h2>Edit group items {group ? `— ${group.name}` : ''}</h2>
      <GroupEditor value={groupItems} onChange={setGroupItems} allItems={allItems} onSave={save} onClose={() => navigate('/admin')} saving={saving} />
    </div>
  );
}

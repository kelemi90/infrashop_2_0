// This page shows ready made item groups 

import React, { useEffect, useState } from 'react';
import buildImageUrl from '../utils/imageUrl';
import api from '../api';

function decodeToken(token) {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        let payload = parts[1];
        // base64url -> base64
        payload = payload.replace(/-/g, '+').replace(/_/g, '/');
        // pad
        while (payload.length % 4) payload += '=';
        const json = atob(payload);
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

export default function ItemGroupCard({ groupName }) {
        const [isEditing, setIsEditing] = useState(false);
        const [editingItems, setEditingItems] = useState([]);
        const [allItems, setAllItems] = useState([]);
        const [selectedAdd, setSelectedAdd] = useState('');
        const [selectedQty, setSelectedQty] = useState(1);
        const [message, setMessage] = useState('');

        const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
        const user = decodeToken(token);
        const isAdmin = user && user.role === 'admin';

        useEffect(() => {
            if (!isEditing) return;
            // fetch group items and all items when entering edit mode
            api.get(`/item-groups/${groupName.id}/items`).then(r => {
                setEditingItems(r.data.map(it => ({ item_id: it.item_id, quantity: it.quantity, name: it.name })));
            }).catch(() => setEditingItems([]));
            api.get('/items').then(r => setAllItems(r.data)).catch(() => setAllItems([]));
        }, [isEditing, groupName.id]);

        const addItem = () => {
            if (!selectedAdd) return;
            const iid = Number(selectedAdd);
            const existing = editingItems.find(x => x.item_id === iid);
            if (existing) {
                existing.quantity += Number(selectedQty) || 1;
                setEditingItems([...editingItems]);
            } else {
                const ai = allItems.find(a => a.id === iid);
                setEditingItems(prev => [...prev, { item_id: iid, quantity: Number(selectedQty) || 1, name: ai ? ai.name : `#${iid}` }]);
            }
            setSelectedAdd(''); setSelectedQty(1);
        };

        const save = async () => {
            try {
                await api.post(`/item-groups/${groupName.id}/items`, { items: editingItems.map(i => ({ item_id: i.item_id, quantity: i.quantity })) });
                setMessage('Saved');
                setIsEditing(false);
            } catch (err) {
                console.error(err);
                setMessage(err.response?.data?.error || 'Save failed');
            }
        };

        return (
                <div className="item-group-card">
                        {groupName.image_url ? (
                                <img src={buildImageUrl(groupName.image_url)} alt={groupName.name} className="item-group-card-image" />
                        ) : (
                                <div className="item-group-card-image-placeholder" />
                        )}
                        <h4>{groupName.name}</h4>
                        <div className="item-group-card-description">{groupName.description}</div>

                        {isAdmin && !isEditing && (
                            <div className="item-group-card-actions-top">
                                <button onClick={() => { setIsEditing(true); setMessage(''); }}>Edit group items</button>
                            </div>
                        )}

                        {isEditing && (
                            <div className="item-group-card-editor">
                                <div className="item-group-card-editor-toolbar">
                                    <select value={selectedAdd} onChange={e => setSelectedAdd(e.target.value)}>
                                        <option value="">-- Valitse tuote --</option>
                                        {allItems.map(ai => (
                                            <option key={ai.id} value={ai.id}>{ai.name} (var: {ai.available_stock})</option>
                                        ))}
                                    </select>
                                    <input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(Number(e.target.value))} className="item-group-card-qty" />
                                    <button className="item-group-card-btn-spaced" onClick={addItem}>Add</button>
                                </div>

                                <div>
                                    {editingItems.map((it, idx) => (
                                        <div key={idx} className="item-group-card-edit-row">
                                            <div className="item-group-card-edit-name">{it.name}</div>
                                            <input type="number" min="1" value={it.quantity} onChange={e => { const copy = [...editingItems]; copy[idx].quantity = Number(e.target.value); setEditingItems(copy); }} className="item-group-card-qty-only" />
                                            <button onClick={() => setEditingItems(prev => prev.filter((_,i)=>i!==idx))}>Remove</button>
                                        </div>
                                    ))}
                                </div>

                                <div className="item-group-card-editor-actions">
                                    <button onClick={save}>Save</button>
                                    <button className="item-group-card-btn-spaced" onClick={() => { setIsEditing(false); setEditingItems([]); }}>Cancel</button>
                                </div>
                                {message && <div className="item-group-card-message">{message}</div>}
                            </div>
                        )}
                </div>
        );
}
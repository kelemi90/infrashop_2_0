import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function NewItem(){
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [totalStock, setTotalStock] = useState(0);
  const [availableStock, setAvailableStock] = useState(0);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    api.get('/items').then(r => {
      if (!mounted) return;
      const cats = [...new Set(r.data.map(i => i.category || 'Muut'))];
      setCategories(cats);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setMessage('Name is required');
    try {
      setCreating(true);
      const payload = {
        name: name.trim(),
        short_description: shortDescription || null,
        long_description: longDescription || null,
        total_stock: Number(totalStock) || 0,
        available_stock: Number(availableStock) || 0,
        category: category || null
      };
      const res = await api.post('/items', payload);
      setMessage('Item created');
      const item = res.data;
      // navigate to image edit page for the new item
      navigate('/admin/items/images');
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Failed to create item');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h2>Lisää uusi tuote</h2>
      <form onSubmit={create} className="new-item-form">
        {/* SKU is generated automatically by the system */}
        <div className="new-item-field">
          <label>Nimi *<br/>
            <input required value={name} onChange={e=>setName(e.target.value)} />
          </label>
        </div>
        <div className="new-item-field">
          <label>Lyhyt kuvaus<br/>
            <textarea value={shortDescription} onChange={e=>setShortDescription(e.target.value)} />
          </label>
        </div>
        <div className="new-item-field">
          <label>Pitkä kuvaus<br/>
            <textarea value={longDescription} onChange={e=>setLongDescription(e.target.value)} rows={5} />
          </label>
        </div>
        <div style={{ display:'flex', gap:12, marginBottom:8 }}>
          <label>
            Varastossa yhteensä<br/>
            <small style={{ color:'#999', fontWeight:'normal' }}>Fyysinen kokonaismäärä</small><br/>
            <input type="number" value={totalStock} onChange={e=>setTotalStock(e.target.value)} />
          </label>
          <label>
            Varattavissa<br/>
            <small style={{ color:'#999', fontWeight:'normal' }}>Ei varattuna tilauksiin</small><br/>
            <input type="number" value={availableStock} onChange={e=>setAvailableStock(e.target.value)} />
          </label>
        </div>
        <div className="new-item-field">
          <label>Kategoria<br/>
            <select value={category} onChange={e=>setCategory(e.target.value)}>
              <option value="">Valitse kategoria</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create item'}</button>
          <span className="new-item-message">{message}</span>
        </div>
      </form>
    </div>
  );
}

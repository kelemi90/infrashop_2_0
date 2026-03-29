import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function QuickCreateItemModal({ onClose, onCreated }){
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [totalStock, setTotalStock] = useState(0);
  const [availableStock, setAvailableStock] = useState(0);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
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

  const submit = async (e) => {
    e && e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    setLoading(true); setError('');
    try {
      const payload = {
        name: name.trim(),
        short_description: shortDescription || null,
        total_stock: Number(totalStock) || 0,
        available_stock: Number(availableStock) || 0,
        category: category || null
      };
      const res = await api.post('/items', payload);
      setCreated(res.data);
      onCreated && onCreated(res.data);
      // Keep modal open and show success UI instead of auto-closing
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create item');
    } finally { setLoading(false); }
  };

  const createAnother = () => {
    setName(''); setShortDescription(''); setTotalStock(0); setAvailableStock(0); setCategory(''); setCreated(null); setError('');
  };

  const goToUpload = () => {
    if (!created) return;
    // navigate to image upload page and include created id as query param for pre-selection
    navigate(`/admin/items/images?select=${created.id}`);
    onClose && onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', padding:20, borderRadius:6, width:520, maxWidth:'95%' }}>
        {!created ? (
          <>
            <h3 style={{ marginTop:0 }}>Quick create item</h3>
            <form onSubmit={submit}>
              <div style={{ display:'grid', gap:8 }}>
                {/* SKU will be generated automatically */}
                <input placeholder="Name *" value={name} onChange={e=>setName(e.target.value)} required />
                <select value={category} onChange={e=>setCategory(e.target.value)}>
                  <option value="">Valitse kategoria</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Short description" value={shortDescription} onChange={e=>setShortDescription(e.target.value)} />
                <div style={{ display:'flex', gap:8 }}>
                  <input type="number" placeholder="Total" value={totalStock} onChange={e=>setTotalStock(e.target.value)} />
                  <input type="number" placeholder="Available" value={availableStock} onChange={e=>setAvailableStock(e.target.value)} />
                </div>
              </div>

              {error && <div style={{ color:'crimson', marginTop:8 }}>{error}</div>}

              <div style={{ marginTop:12, display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" onClick={onClose} disabled={loading} style={{ background:'#eee', border:'1px solid #ccc', padding:'6px 10px', borderRadius:4 }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ background:'#007bff', color:'#fff', border:'none', padding:'6px 12px', borderRadius:4 }}>{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 style={{ marginTop:0 }}>Item created</h3>
            <div>Item <strong>{created.name}</strong> (id {created.id}) was created.</div>
            <div style={{ marginTop:12, display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={createAnother} style={{ background:'#eee', border:'1px solid #ccc', padding:'6px 10px', borderRadius:4 }}>Create another</button>
              <button onClick={goToUpload} style={{ background:'#28a745', color:'#fff', border:'none', padding:'6px 12px', borderRadius:4 }}>Upload image</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

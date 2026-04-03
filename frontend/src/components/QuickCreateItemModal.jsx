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
    <div className="quick-create-modal-overlay">
      <div className="quick-create-modal-card">
        {!created ? (
          <>
            <h3 className="quick-create-modal-title">Quick create item</h3>
            <form onSubmit={submit}>
              <div className="quick-create-modal-grid">
                {/* SKU will be generated automatically */}
                <input placeholder="Name *" value={name} onChange={e=>setName(e.target.value)} required />
                <select value={category} onChange={e=>setCategory(e.target.value)}>
                  <option value="">Valitse kategoria</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Short description" value={shortDescription} onChange={e=>setShortDescription(e.target.value)} />
                <div className="quick-create-modal-stock-row">
                  <input type="number" placeholder="Total" value={totalStock} onChange={e=>setTotalStock(e.target.value)} />
                  <input type="number" placeholder="Available" value={availableStock} onChange={e=>setAvailableStock(e.target.value)} />
                </div>
              </div>

              {error && <div className="quick-create-modal-error">{error}</div>}

              <div className="quick-create-modal-actions">
                <button type="button" onClick={onClose} disabled={loading} className="quick-create-modal-btn quick-create-modal-btn-cancel">Cancel</button>
                <button type="submit" disabled={loading} className="quick-create-modal-btn quick-create-modal-btn-create">{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 className="quick-create-modal-title">Item created</h3>
            <div>Item <strong>{created.name}</strong> (id {created.id}) was created.</div>
            <div className="quick-create-modal-actions">
              <button onClick={createAnother} className="quick-create-modal-btn quick-create-modal-btn-cancel">Create another</button>
              <button onClick={goToUpload} className="quick-create-modal-btn quick-create-modal-btn-upload">Upload image</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

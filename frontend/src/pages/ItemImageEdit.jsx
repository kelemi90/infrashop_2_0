import React, { useEffect, useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import api from '../api';
import buildImageUrl from '../utils/imageUrl';

export default function ItemImageEdit(){
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const location = useLocation();

  useEffect(()=>{
    api.get('/items').then(r=>{
      setItems(r.data);
      try {
        const params = new URLSearchParams(location.search);
        const sel = params.get('select');
        if (sel) {
          const found = r.data.find(it => String(it.id) === String(sel));
          if (found) setSelected(found);
        }
      } catch (e) {
        // ignore
      }
    }).catch(()=>{});
  },[location.search]);

  // search/filter state for left list
  const [filter, setFilter] = useState('');
  const filteredItems = items.filter(i => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (i.name || '').toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q);
  });

  const onChoose = (it) => { setSelected(it); setFile(null); setMessage(''); };

  // editing state for admin edits
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState({});

  useEffect(()=>{
    if (selected) {
      setEditValues({
        sku: selected.sku || '',
        name: selected.name || '',
        short_description: selected.short_description || '',
        total_stock: selected.total_stock || 0,
        available_stock: selected.available_stock || 0,
        category: selected.category || ''
      });
    }
  }, [selected]);

  const saveEdit = async () => {
    if (!selected) return;
    try {
      const payload = { ...editValues };
      const res = await api.put(`/items/${selected.id}`, payload);
      // refresh list and selected
      const r = await api.get('/items'); setItems(r.data);
      setSelected(res.data);
      setMessage('Item updated');
      setEditMode(false);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Update failed');
    }
  };

  const upload = async () => {
    if (!selected || !file) return setMessage('Valitse tiedosto');
    const fd = new FormData();
    fd.append('image', file);
    try {
      setUploading(true);
      setProgress(0);
      const res = await api.post(`/items/${selected.id}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      setMessage('Uploaded');
      // refresh list
      const r = await api.get('/items'); setItems(r.data);
      setSelected((s)=> ({...s, image_url: res.data.item.image_url}));
    } catch (err){
      console.error(err);
      setMessage(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  useEffect(()=>{
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <h2>Tuote muokkaus (Kuvat)</h2>
      <div className="admin-split">
        <div className="admin-left">
          <div className="search-box">
            <input placeholder="Hae tuotetta (nimi / sku / kategoria)" value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
          <h4>Tuotteet</h4>
          <ul className="item-list">
            {filteredItems.map(it=> (
              <li key={it.id}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button style={{ flex:1, textAlign:'left' }} onClick={()=>onChoose(it)}>{it.name} {it.available_stock !== undefined ? `(var: ${it.available_stock})` : ''}</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

  <div className="admin-right">
          {!selected && <div>Valitse tuote vasemmalta muokataksesi kuvaa</div>}
              {selected && (
            <div>
              <h3>{selected.name}</h3>
              <div style={{ marginTop:8 }}>
                <button onClick={()=>{ setEditMode(em => !em); setMessage(''); }} style={{ marginRight:8 }}>{editMode ? 'Cancel edit' : 'Edit item'}</button>
              </div>
              {editMode && (
                <div className="edit-box">
                  <div className="edit-row">
                    <div className="edit-label">SKU:</div>
                    <div className="edit-field"><span>{editValues.sku}</span></div>
                  </div>

                  <div className="edit-row">
                    <div className="edit-label">Nimi:</div>
                    <div className="edit-field">
                      <input value={editValues.name} onChange={e=>setEditValues(v=>({...v, name: e.target.value}))} />
                    </div>
                  </div>

                  <div className="edit-row">
                    <div className="edit-label">Kategoria:</div>
                    <div className="edit-field">
                      <input value={editValues.category} onChange={e=>setEditValues(v=>({...v, category: e.target.value}))} />
                    </div>
                  </div>

                  <div className="edit-row">
                    <div className="edit-label">Lyhyt kuvaus:</div>
                    <div className="edit-field">
                      <textarea value={editValues.short_description} onChange={e=>setEditValues(v=>({...v, short_description: e.target.value}))} />
                    </div>
                  </div>

                  <div className="edit-row">
                    <div className="edit-label">Yhteensä:</div>
                    <div className="edit-field small">
                      <input type="number" value={editValues.total_stock} onChange={e=>setEditValues(v=>({...v, total_stock: Number(e.target.value) }))} />
                    </div>
                    <div className="edit-label">Saatavilla:</div>
                    <div className="edit-field small">
                      <input type="number" value={editValues.available_stock} onChange={e=>setEditValues(v=>({...v, available_stock: Number(e.target.value) }))} />
                    </div>
                  </div>

                  <div style={{ marginTop:8 }}>
                    <button onClick={saveEdit} style={{ marginRight:8 }}>Save</button>
                    <button onClick={()=>setEditMode(false)}>Cancel</button>
                  </div>
                </div>
              )}
              <div>
                {selected.image_url ? (
                  <div>
                    <div>Full:</div>
                    <img src={buildImageUrl(selected.image_url)} alt={selected.name} style={{ maxWidth:300 }} />
                  </div>
                ) : <div>No image</div>}
                {selected.thumbnail_url && (
                  <div style={{ marginTop:8 }}>
                    <div>Thumbnail:</div>
                    <img src={buildImageUrl(selected.thumbnail_url)} alt={`${selected.name} thumb`} style={{ maxWidth:150 }} />
                  </div>
                )}
              </div>
              <div style={{ marginTop:10 }}>
                <input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])} />
                <button onClick={upload} style={{ marginLeft:8 }} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
              </div>
              {preview && (
                <div style={{ marginTop:8 }}>
                  <div>Preview:</div>
                  <img src={preview} alt="preview" style={{ maxWidth:200, marginTop:6 }} />
                </div>
              )}
              {uploading && (
                <div style={{ marginTop:8 }}>
                  <div>Progress: {progress}%</div>
                  <div style={{ background:'#eee', width:200, height:8 }}>
                    <div style={{ background:'#4caf50', width:`${progress}%`, height:8 }} />
                  </div>
                </div>
              )}
              {message && <div style={{ marginTop:8 }}>{message}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

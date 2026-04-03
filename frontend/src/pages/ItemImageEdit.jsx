import React, { useEffect, useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import api from '../api';
import buildImageUrl from '../utils/imageUrl';

export default function ItemImageEdit(){
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
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

  const onChoose = (it) => { setSelected(it); setFiles([]); setMessage(''); };

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
    if (!selected || !files.length) return setMessage('Valitse tiedosto');
    const fd = new FormData();
    for (const f of files) fd.append('images', f);
    try {
      setUploading(true);
      setProgress(0);
      const res = await api.post(`/items/${selected.id}/image`, fd, {
        onUploadProgress: (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      setMessage(`Uploaded ${files.length} image(s)`);
      // refresh list
      const r = await api.get('/items'); setItems(r.data);
      setSelected(res.data.item);
      setFiles([]);
    } catch (err){
      console.error(err);
      setMessage(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  useEffect(()=>{
    if (!files.length) { setPreviews([]); return; }
    const next = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setPreviews(next);
    return () => next.forEach((p) => URL.revokeObjectURL(p.url));
  }, [files]);

  const imageUrls = selected?.image_urls || (selected?.image_url ? [selected.image_url] : []);
  const thumbnailUrls = selected?.thumbnail_urls || (selected?.thumbnail_url ? [selected.thumbnail_url] : []);

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
                <div className="item-image-edit-list-row">
                  <button className="item-image-edit-list-btn" onClick={()=>onChoose(it)}>{it.name} {it.available_stock !== undefined ? `(var: ${it.available_stock})` : ''}</button>
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
              <div className="item-image-edit-mt8">
                <button onClick={()=>{ setEditMode(em => !em); setMessage(''); }} className="item-image-edit-mr8">{editMode ? 'Cancel edit' : 'Edit item'}</button>
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
                    <div className="edit-label">
                      Varastossa yhteensä:
                      <div style={{ fontSize:'0.75rem', color:'#aaa', fontWeight:'normal' }}>Fyysinen kokonaismäärä</div>
                    </div>
                    <div className="edit-field small">
                      <input type="number" value={editValues.total_stock} onChange={e=>setEditValues(v=>({...v, total_stock: Number(e.target.value) }))} />
                    </div>
                    <div className="edit-label">
                      Varattavissa:
                      <div style={{ fontSize:'0.75rem', color:'#aaa', fontWeight:'normal' }}>Ei varattuna tilauksiin</div>
                    </div>
                    <div className="edit-field small">
                      <input type="number" value={editValues.available_stock} onChange={e=>setEditValues(v=>({...v, available_stock: Number(e.target.value) }))} />
                    </div>
                  </div>

                  <div className="item-image-edit-mt8">
                    <button onClick={saveEdit} className="item-image-edit-mr8">Save</button>
                    <button onClick={()=>setEditMode(false)}>Cancel</button>
                  </div>
                </div>
              )}
              <div>
                {imageUrls.length ? (
                  <div>
                    <div>Full images ({imageUrls.length}):</div>
                    <div className="item-image-edit-image-grid">
                      {imageUrls.map((img, idx) => (
                        <img key={`${img}-${idx}`} src={buildImageUrl(img)} alt={`${selected.name} ${idx + 1}`} className="item-image-edit-full-image" />
                      ))}
                    </div>
                  </div>
                ) : <div>No image</div>}
                {thumbnailUrls.length > 0 && (
                  <div className="item-image-edit-mt8">
                    <div>Thumbnails ({thumbnailUrls.length}):</div>
                    <div className="item-image-edit-image-grid">
                      {thumbnailUrls.map((thumb, idx) => (
                        <img key={`${thumb}-${idx}`} src={buildImageUrl(thumb)} alt={`${selected.name} thumb ${idx + 1}`} className="item-image-edit-thumb-image" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="item-image-edit-mt10">
                <input type="file" accept="image/*" multiple onChange={e=>setFiles(Array.from(e.target.files || []))} />
                <button onClick={upload} className="item-image-edit-ml8" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload selected'}</button>
              </div>
              {previews.length > 0 && (
                <div className="item-image-edit-mt8">
                  <div>Preview ({previews.length}):</div>
                  <div className="item-image-edit-image-grid">
                    {previews.map((p) => (
                      <img key={p.url} src={p.url} alt={p.name} className="item-image-edit-preview-image" />
                    ))}
                  </div>
                </div>
              )}
              {uploading && (
                <div className="item-image-edit-mt8">
                  <div>Progress: {progress}%</div>
                  <progress className="item-image-edit-progress" value={progress} max="100" />
                </div>
              )}
              {message && <div className="item-image-edit-mt8">{message}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

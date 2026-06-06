import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import buildImageUrl from '../utils/imageUrl';

export default function ItemOrderLocations() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ current: [], archived: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/items/${id}/locations`).then(r => {
      setData(r.data || { current: [], archived: [] });
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setError(err.response && err.response.data ? err.response.data.error : err.message);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div>Loading locations...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const renderRow = (row) => (
    <div key={`${row.order_id}-${Math.random().toString(36).slice(2,6)}`} className="item-location-row">
      <div><strong>Order:</strong> {row.order_id}</div>
      <div><strong>Quantity:</strong> {row.quantity}</div>
      <div><strong>Customer:</strong> {row.customer_name}{row.organization ? ` (${row.organization})` : ''}</div>
      <div><strong>Delivery point:</strong> {row.delivery_point}</div>
      <div><strong>Delivery start:</strong> {row.delivery_start || row.order_created_at || row.archived_at}</div>
      {row.event_name && <div><strong>Event:</strong> {row.event_name} ({row.event_id})</div>}
    </div>
  );

  return (
    <div>
      <h2>Where this item has been ordered</h2>
      <div style={{ marginBottom: 16 }}>
        <Link to={`/items/${id}`}>Back to item</Link>
      </div>

      <h3>Current orders</h3>
      {data.current.length === 0 ? <div>No current orders found.</div> : data.current.map(renderRow)}

      <h3>Archived orders</h3>
      {data.archived.length === 0 ? <div>No archived orders found.</div> : data.archived.map(renderRow)}
    </div>
  );
}

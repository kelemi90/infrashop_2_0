import React, { useEffect, useState } from 'react';
import api from '../api';

export default function AdminArchive() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [groupedItems, setGroupedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // hae kaikki tapahtumat
  useEffect(() => {
    api.get('/events')
      .then(res => setEvents(res.data))
      .catch(err => console.error(err));
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
      <h2>Admin – Arkisto</h2>

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
        </div>
      </div>
    </div>
  );
}

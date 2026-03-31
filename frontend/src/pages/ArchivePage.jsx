import React, { useEffect, useState } from 'react';
import api from '../api';

function normalizeName(value) {
  if (!value) return '';
  try {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  } catch (e) {
    return String(value).toLowerCase().trim();
  }
}

function isTableItem(name) {
  const n = normalizeName(name);
  if (n.includes('vaneripoyd')) return true;
  if (n.includes('valkoinen muovipoyta')) return true;
  if (n.includes('valkoiset muovipoydat')) return true;
  return false;
}

export default function ArchivePage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [groupedItems, setGroupedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // fetch events
  useEffect(() => {
    api.get('/events')
      .then(res => setEvents((res.data || []).filter((ev) => (ev.name || '').trim().toLowerCase() !== 'vectorama lan 2025')))
      .catch(err => console.error(err));
  }, []);

  // fetch grouped orders for selected event
  useEffect(() => {
    if (!selectedEvent) return;
    setLoading(true);
    api.get(`/events/${selectedEvent.id}/grouped-orders`)
      .then(res => { setGroupedItems(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [selectedEvent]);

  return (
    <div>
      <h2>Arkisto</h2>

      <div style={{ display: 'flex', gap: 30 }}>
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
                  <span style={{ fontSize: 12, color: '#666' }}>{ev.start_date?.slice(0,10)} – {ev.end_date?.slice(0,10)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ flex: 1 }}>
          {!selectedEvent && (
            <div>Valitse tapahtuma nähdäksesi arkistoidut tilaukset</div>
          )}

          {loading && <div>Ladataan…</div>}

          {selectedEvent && !loading && (
            <>
              <h3>{selectedEvent.name}</h3>

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

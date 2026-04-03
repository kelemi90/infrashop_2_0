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
  if (n.includes('valkoiset muovipöydät')) return true;
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
    <div className="archive-page">
      <h2>Arkisto</h2>

      <div className="archive-layout">
        <div className="archive-events-column">
          <h3>Tapahtumat</h3>
          <ul className="archive-events-list">
            {events.map(ev => (
              <li key={ev.id}>
                <button
                  className={`archive-event-btn ${selectedEvent?.id === ev.id ? 'archive-event-btn-active' : ''}`}
                  onClick={() => setSelectedEvent(ev)}
                >
                  <strong>{ev.name}</strong><br />
                  <span className="archive-event-dates">{ev.start_date?.slice(0,10)} – {ev.end_date?.slice(0,10)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="archive-content-column">
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
                <table width="100%" border="1" cellPadding="6" className="archive-table">
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

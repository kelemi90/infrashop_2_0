import { useEffect, useState } from 'react';
import api from '../api';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      setEvents(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Tapahtumien haku epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('Tapahtuman nimi on pakollinen');
      return;
    }
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      setError('Päättymispäivä ei voi olla ennen aloituspäiväa');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        start_date: form.start_date || null,
        end_date: form.end_date || null
      };
      const res = await api.post('/events', payload);
      setEvents((prev) => [res.data, ...prev]);
      setForm({ name: '', start_date: '', end_date: '' });
      setSuccess('Tapahtuma luotu onnistuneesti');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Tapahtuman luonti epannistui');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-events-page">
      <h2>Admin - Luo tapahtuma</h2>

      {error && <div className="admin-events-error">{error}</div>}
      {success && <div className="admin-events-success">{success}</div>}

      <form onSubmit={submit} className="admin-events-form">
        <label>
          Tapahtuman nimi
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Esim. Vectorama LAN 2026"
          />
        </label>

        <label>
          Aloituspäivä
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
          />
        </label>

        <label>
          Päättymispäivä
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Tallennetaan...' : 'Luo tapahtuma'}
        </button>
      </form>

      <h3>Nykyiset tapahtumat</h3>
      {loading ? (
        <div>Ladataan...</div>
      ) : events.length === 0 ? (
        <div>Ei tapahtumia.</div>
      ) : (
        <table width="100%" border="1" cellPadding="6" className="admin-events-table">
          <thead>
            <tr>
              <th align="left">Nimi</th>
              <th align="left">Aloitus</th>
              <th align="left">Päättyminen</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.name}</td>
                <td>{ev.start_date ? String(ev.start_date).slice(0, 10) : '-'}</td>
                <td>{ev.end_date ? String(ev.end_date).slice(0, 10) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/items.css';

export default function GroupsPage(){
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/item-groups')
      .then(res => setGroups(res.data || []))
      .catch(() => setError('Ryhmien haku epäonnistui'))
      .finally(() => setLoading(false));
  }, []);

  const gotoOrderWithGroup = (groupId, multiplier=1) => {
    navigate(`/order?group_id=${groupId}&multiplier=${multiplier}`);
  };

  return (
    <div className="groups-page">
      <h2>Tuotegrupit</h2>
      {error && <p className="error">{error}</p>}
      {loading && <p>Ladataan...</p>}
      {!loading && groups.length === 0 && <p>Ei ryhmiä</p>}
      <div className="groups-list">
        {groups.map(g => (
          <div key={g.id} className="group-card">
            <h4>{g.name}</h4>
            <p className="muted">{g.description}</p>
            <div className="group-actions">
              <button onClick={() => gotoOrderWithGroup(g.id, 1)}>Lisää ostoskoriin</button>
              <button onClick={() => navigate(`/admin/groups/${g.id}/edit`)}>Muokkaa (admin)</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

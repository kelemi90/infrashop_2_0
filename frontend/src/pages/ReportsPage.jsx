import { useState } from 'react';
import api from '../api';
import '../styles/reports.css';

const PRESETS = {
  Build: ["pöydät", "tuolit", "muut", "kodinkoneet"],
  Deco: ["standipaketit", "valot", "trussit", "standipaketti"],
  Infra: ["TV", "tv", "sähköt", "verkko", "valot", "muut", "trussit"],
  Game: ["koneet", "oheislaitteet", "pöydät", "tuolit", "valot", "muut"],
  Sähkö: ["sähköt", "verkko", "Cables"],
  Verkko: ["sähköt", "verkko", "Cables"]
};

function sortByDeliveryPointThenName(a, b) {
  const byDeliveryPoint = String(a.delivery_point || '').localeCompare(
    String(b.delivery_point || ''),
    'fi',
    { sensitivity: 'base' }
  );
  if (byDeliveryPoint !== 0) return byDeliveryPoint;

  return String(a.name || '').localeCompare(String(b.name || ''), 'fi', {
    sensitivity: 'base'
  });
}

function aggregateByItemName(items) {
  const byName = items.reduce((acc, row) => {
    const key = String(row.name || '').trim();
    if (!acc[key]) {
      acc[key] = {
        name: row.name,
        total_quantity: 0
      };
    }

    acc[key].total_quantity += Number(row.total_quantity || 0);
    return acc;
  }, {});

  return Object.values(byName).sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'fi', {
      sensitivity: 'base'
    })
  );
}

export default function ReportsPage() {
  const [data, setData] = useState([]);
  const [groupData, setGroupData] = useState([]);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState(null);


  const loadReport = async (presetName) => {
    try {
      setActivePreset(presetName);
      setError('');

      const res = await api.post('/reports/summary', {
        categories: PRESETS[presetName]
      });

      setData(res.data);
    } catch {
      setError('Raportin haku epäonnistui');
    }
  };

  const loadGroupReport = async () => {
    try {
      setError('');
      const res = await api.post('/reports/groups', {});
      setGroupData(res.data || []);
    } catch (e) {
      setError('Group report fetch failed');
    }
  };

  const grouped = data.reduce((acc, row) => {
    if (!acc[row.category]) acc[row.category] = [];
    acc[row.category].push(row);
    return acc;
  }, {});
  const sortedAllItemsByDeliveryPoint = [...data].sort(sortByDeliveryPointThenName);

  return (
    <div className="reports-page">
      <h2>Tilausraportit</h2>

      <div className="preset-buttons">
        {Object.keys(PRESETS).map(preset => (
          <button
            key={preset}
            className={activePreset === preset ? 'active' : ''}
            onClick={() => loadReport(preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="report-category">
          <h3>{category}</h3>

          <h4>Tilatut {category}:</h4>
          <table>
            <thead>
              <tr>
                <th>Tuote</th>
                <th>Yhteensä tilattu</th>
              </tr>
            </thead>
            <tbody>
              {aggregateByItemName(items).map((i, idx) => (
                <tr key={`${category}-${i.name}-${idx}`}>
                  <td>{i.name}</td>
                  <td>{i.total_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {data.length > 0 && (
        <div className="report-category">
          <h4>Tilatut tuotteet toimituspisteittäin:</h4>
          <table>
            <thead>
              <tr>
                <th>Tuote</th>
                <th>Toimituspiste</th>
                <th>Yhteensä tilattu</th>
              </tr>
            </thead>
            <tbody>
              {sortedAllItemsByDeliveryPoint.map((i, idx) => (
                <tr key={`all-items-${i.name}-${i.delivery_point}-${idx}`}>
                  <td>{i.name}</td>
                  <td>{i.delivery_point}</td>
                  <td>{i.total_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="reports-group-section">
        <h3>Group reports</h3>
        <button onClick={loadGroupReport}>Load group report</button>
        {groupData.length > 0 && (
          <table className="reports-group-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Times ordered</th>
                <th>Total items from groups</th>
              </tr>
            </thead>
            <tbody>
              {groupData.map(g => (
                <tr key={`group-r-${g.group_id}`}>
                  <td>{g.group_name} ({g.group_id})</td>
                  <td>{g.times_ordered}</td>
                  <td>{g.total_items_from_groups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.length === 0 && activePreset && (
        <p>Ei tilauksia valituille kategorioille</p>
      )}
    </div>
  );
}

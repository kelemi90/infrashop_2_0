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

export default function ReportsPage() {
  const [data, setData] = useState([]);
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

  const grouped = data.reduce((acc, row) => {
    if (!acc[row.category]) acc[row.category] = [];
    acc[row.category].push(row);
    return acc;
  }, {});

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

          <table>
            <thead>
              <tr>
                <th>Tuote</th>
                <th>Yhteensä tilattu</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.name}>
                  <td>{i.name}</td>
                  <td>{i.total_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {data.length === 0 && activePreset && (
        <p>Ei tilauksia valituille kategorioille</p>
      )}
    </div>
  );
}

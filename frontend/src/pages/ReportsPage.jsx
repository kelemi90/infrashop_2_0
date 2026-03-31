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

  const tableItems = data.filter((row) => isTableItem(row.name));
  const totalTables = tableItems.reduce((sum, row) => sum + Number(row.total_quantity || 0), 0);
  const showBuildTableSummary = activePreset === 'Build';

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

      {showBuildTableSummary && (
        <div className="report-category">
          <h3>Build - Poydat (yhteenveto)</h3>
          {tableItems.length === 0 ? (
            <p>Ei tilattuja poytia Build-raportissa.</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Tuote</th>
                    <th>Yhteensä tilattu</th>
                  </tr>
                </thead>
                <tbody>
                  {tableItems.map(i => (
                    <tr key={`build-table-${i.name}`}>
                      <td>{i.name}</td>
                      <td>{i.total_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: 8, fontWeight: 600 }}>Poytia yhteensa: {totalTables}</p>
            </>
          )}
        </div>
      )}

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

      <div style={{ marginTop: 24 }}>
        <h3>Group reports</h3>
        <button onClick={loadGroupReport}>Load group report</button>
        {groupData.length > 0 && (
          <table style={{ marginTop: 8 }}>
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

import { useEffect, useState } from 'react';
import api from '../api';
import ItemCard from '../components/ItemCard';
import ItemModal from '../components/ItemModal';
import '../styles/items.css';

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupItemsById, setGroupItemsById] = useState({});
  const [groupLoading, setGroupLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCategories, setOpenCategories] = useState({});

  useEffect(() => {
    api.get('/items')
      .then(res => {
        setItems(res.data);
        setLoading(false);

        const categories = [...new Set(res.data.map(i => i.category || 'Muut'))];
        const state = {};
        categories.forEach(c => state[c] = false);
        setOpenCategories(state);
      })
      .catch(() => {
        setError('Tuotteiden lataaminen epäonnistui');
        setLoading(false);
      });

    api.get('/item-groups')
      .then(res => setGroups(res.data || []))
      .catch(() => {});
  }, []);

  const groupedItems = items.reduce((g, item) => {
    const cat = item.category || 'Muut';
    if (!g[cat]) g[cat] = [];
    g[cat].push(item);
    return g;
  }, {});

  const toggleCategory = category => {
    setOpenCategories(p => ({ ...p, [category]: !p[category] }));
  };

  const openGroup = async (group) => {
    setSelectedGroup(group);
    if (groupItemsById[group.id]) return;

    setGroupLoading(true);
    try {
      const res = await api.get(`/item-groups/${group.id}/items`);
      setGroupItemsById(prev => ({ ...prev, [group.id]: res.data || [] }));
    } catch (e) {
      setGroupItemsById(prev => ({ ...prev, [group.id]: [] }));
    } finally {
      setGroupLoading(false);
    }
  };

  return (
    <div className="items-page">
      {groups.length > 0 && (
        <div className="items-category">
          <h2
            className="category-title"
            onClick={() => toggleCategory('__GROUPS__')}
          >
            Tuoteryhmät {openCategories.__GROUPS__ ? '▼' : '►'}
          </h2>

          {openCategories.__GROUPS__ && (
            <div className="items-grid">
              {groups.map(group => (
                <div key={group.id} className="item-card">
                  <div className="item-content">
                    <h3 className="item-name">{group.name}</h3>
                    <p className="item-description">{group.description || 'Ei kuvausta'}</p>
                    <div className="item-footer">
                      <span className="item-stock">Tuoteryhmä</span>
                      <button
                        className="item-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          openGroup(group);
                        }}
                      >
                        Näytä
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {Object.keys(groupedItems).map(category => (
        <div key={category} className="items-category">
          <h2
            className="category-title"
            onClick={() => toggleCategory(category)}
          >
            {category} {openCategories[category] ? '▼' : '►'}
          </h2>

          {openCategories[category] && (
            <div className="items-grid">
              {groupedItems[category].map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}   // 👈 TÄRKEÄ
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {selectedGroup && (
        <div className="modal-overlay" onClick={() => setSelectedGroup(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedGroup(null)}>x</button>
            <h2>{selectedGroup.name}</h2>
            <p className="item-short">{selectedGroup.description || 'Ei kuvausta'}</p>

            <div className="item-long">
              <h4>Sisältää</h4>
              {groupLoading && !groupItemsById[selectedGroup.id] ? (
                <p>Ladataan...</p>
              ) : (groupItemsById[selectedGroup.id] || []).length === 0 ? (
                <p>Ei tuotteita tässä ryhmässä.</p>
              ) : (
                <ul>
                  {groupItemsById[selectedGroup.id].map((it) => (
                    <li key={`${selectedGroup.id}-${it.item_id}`}>
                      {it.name} x{it.quantity}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../api';
import ItemCard from '../components/ItemCard';
import ItemModal from '../components/ItemModal';
import '../styles/items.css';

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
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

  return (
    <div className="items-page">
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
    </div>
  );
}

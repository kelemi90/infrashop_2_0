import { useEffect, useState } from 'react';
import api from '../api';
import ItemCard from '../components/ItemCard';
import '../styles/items.css';

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tämä state pitää kirjaa auki olevista kategorioista
  const [openCategories, setOpenCategories] = useState({});

  useEffect(() => {
    api.get('/items')
      .then(res => {
        setItems(res.data);
        setLoading(false);

        // oletuksena kaikki kategoriat kiinni
        const categories = [...new Set(res.data.map(item => item.category || 'Muut'))];
        const initialState = {};
        categories.forEach(cat => initialState[cat] = false);
        setOpenCategories(initialState);
      })
      .catch(err => {
        console.error(err);
        setError('Tuotteiden lataaminen epäonnistui');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="items-status">Ladataan tuotteita…</div>;
  if (error) return <div className="items-status error">{error}</div>;

  // Ryhmitellään tuotteet kategorioittain
  const groupedItems = items.reduce((groups, item) => {
    const category = item.category || 'Muut';
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {});

  // Funktio avaa/sulkee kategoriat
  const toggleCategory = (category) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
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
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

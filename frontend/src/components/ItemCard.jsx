import { Link } from 'react-router-dom';
import '../styles/item-card.css';

export default function ItemCard({ item }) {
  return (
    <div className="item-card">
      <div className="item-image">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} />
        ) : (
          <div className="image-placeholder">Ei kuvaa</div>
        )}
      </div>

      <div className="item-content">
        <h3 className="item-name">{item.name}</h3>

        <p className="item-description">
          {item.short_description || 'Ei kuvausta'}
        </p>

        <div className="item-footer">
          <span className="item-stock">
            Varastossa: {item.stock}
          </span>

          <Link to={`/items/${item.id}`} className="item-link">
            Näytä
          </Link>
        </div>
      </div>
    </div>
  );
}

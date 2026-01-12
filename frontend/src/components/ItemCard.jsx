import '../styles/item-card.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function ItemCard({ item, onClick }) {
  const imageSrc = item.image_url
    ? '${API_URL}${item-image_url}'
    : '/images/no-image.png'
  
  return (
    <div className="item-card" onClick={onClick}>
      <div className="item-image">
        <img 
          src={imageSrc} 
          alt={item.name} 
          loading="lazy" 
          onError={(e) => {
            e.target.sec = '/images/no-image.png';
          }}
        />
      </div>

      <div className="item-content">
        <h3 className="item-name">{item.name}</h3>

        <p className="item-description">
          {item.short_description || 'Ei kuvausta'}
        </p>

        <div className="item-footer">
          <span className="item-stock">
            Varastossa: {item.available_stock}
          </span>

          <button
            className="item-link"
            onClick={e => {
              e.stopPropagation(); // estää tuplaklikin
              onClick();
            }}
          >
            Näytä
          </button>
        </div>
      </div>
    </div>
  );
}

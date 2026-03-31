import '../styles/item-card.css';
import buildImageUrl from '../utils/imageUrl';

export default function ItemCard({ item, onClick }) {
  const imageSrc = buildImageUrl(item && item.image_url);

  return (
    <div className="item-card">
      <div className="item-image">
        <img
          src={imageSrc}
          alt={item?.name || 'item'}
          loading="lazy"
          onError={(e) => {
            e.target.src = buildImageUrl(null);
          }}
        />
      </div>

      <div className="item-content">
        <h3 className="item-name">{item.name}</h3>

        <p className="item-description">
          {item.short_description || 'Ei kuvausta'}
        </p>

        <div className="item-footer">
          <span className="item-stock">Varastossa: {item.available_stock}</span>

          <button
            className="item-link"
            onClick={(e) => {
              e.stopPropagation();
              onClick && onClick();
            }}
          >
            Näytä
          </button>
        </div>
      </div>
    </div>
  );
}

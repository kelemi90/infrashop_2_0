import '../styles/item-modal.css';
import buildImageUrl from '../utils/imageUrl';

export default function ItemModal({ item, onClose }) {
    const imageSrc = buildImageUrl(item && item.image_url);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>x</button>

                <h2>{item.name}</h2>

                <img
                    src={imageSrc}
                    alt={item.name}
                    onError={(e) => {
                        e.target.src = buildImageUrl(null);
                    }}
                />

                <p>{item.long_description || item.short_description}</p>

                <div className="stock">Varastossa: {item.available_stock}</div>
            </div>
        </div>
    );
}
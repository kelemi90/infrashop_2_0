import '../styles/item-modal.css';

export default function ItemModal({ item, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-card"
                onClick={e => e.stopPropagation()} // estää sulkeutumisen kortista
            >
                <button className="modal-close" onClick={onClose}>x</button>

                <h2>{item.name}</h2>

                {item.image_url && (
                    <img src={item.image_url} alt={item.name} />
                )}

                <p>{item.short_description}</p>

                <div className="stock">
                    Varastossa: {item.available_stock}
                </div>
            </div>
        </div>
    );
}
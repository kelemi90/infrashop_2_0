export default function ItemCard({ item, onClick }) {
    return (
        <div className="item-card" onClick={onClick}>
            <h3>{item.name}</h3>
            <p className="muted">{item.short_description}</p>
        </div>
    );
}
function ProductsSection({ groupedItems, cart, addToCart }) {
  const [openProductId, setOpenProductId] = useState(null);

  const toggleProduct = (id) => {
    setOpenProductId(prev => (prev === id ? null : id));
  };

  return (
    <div className="products">
      <h2>Valitse tuotteet</h2>

      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="category-section">
          <h3>{category}</h3>

          {items.map(item => (
            <div key={item.id} className="product-card">
              
              {/* HEADER – klikattava */}
              <div
                className="product-header"
                onClick={() => toggleProduct(item.id)}
              >
                <strong>{item.name}</strong>
                <span>
                  {openProductId === item.id ? '▲' : '▼'}
                </span>
              </div>

              {/* SISÄLTÖ – avautuu */}
              {openProductId === item.id && (
                <div className="product-details">
                  <p>{item.long_description || item.short_description}</p>

                  <div className="stock">
                    Varastossa: {item.available_stock}
                  </div>

                  <input
                    type="number"
                    min="0"
                    max={item.available_stock}
                    value={cart[item.id]?.quantity || 0}
                    onChange={e =>
                      addToCart(item, Number(e.target.value))
                    }
                  />
                </div>
              )}

            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

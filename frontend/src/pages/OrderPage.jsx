import { useEffect, useState } from 'react';
import api from '../api';
import '../styles/order.css';

export default function OrderPage() {
  const [stepCompleted, setStepCompleted] = useState(false);

  const [orderInfo, setOrderInfo] = useState({
    name: '',
    organization: '',
    deliveryPoint: '',
    returnDate: ''
  });

  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openCategory, setOpenCategory] = useState(null);

  useEffect(() => {
    if (stepCompleted) {
      api.get('/items')
        .then(res => setItems(res.data))
        .catch(() => setError('Tuotteiden haku epäonnistui'));
    }
  }, [stepCompleted]);

  const isFormValid =
    orderInfo.name &&
    orderInfo.organization &&
    orderInfo.deliveryPoint &&
    orderInfo.returnDate;

  const addToCart = (item, qty) => {
    const safeQty = Math.min(Math.max(qty, 0), item.available_stock);
    setCart(prev => ({
      ...prev,
      [item.id]: {
        ...item,
        quantity: safeQty
      }
    }));
  };

  const removeFromCart = (itemId) => {
    const copy = { ...cart };
    delete copy[itemId];
    setCart(copy);
  };

  const submitOrder = async () => {
    if (Object.keys(cart).length === 0) {
      setError('Ostoskori on tyhjä');
      return;
    }

    const payload = {
      name: orderInfo.name,
      organization: orderInfo.organization,
      deliveryPoint: orderInfo.deliveryPoint,
      returnAt: orderInfo.returnDate,
      items: Object.values(cart).map(i => ({
        item_id: i.id,
        quantity: i.quantity
      }))
    };

    try {
      const res = await api.post('/orders', payload); // ei auth headeria
      setSuccess(`Tilaus lähetetty! Tilaus ID: ${res.data.orderId}`);
      setError('');
      setCart({});
      setStepCompleted(false);
      setOrderInfo({
        name: '',
        organization: '',
        deliveryPoint: '',
        returnDate: ''
      });

      api.get('/items').then(res => setItems(res.data));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Tilauksen lähetys epäonnistui');
      setSuccess('');
      api.get('/items').then(res => setItems(res.data));
    }
  };

  const toggleAccordion = (category) => {
    setOpenCategory(prev => (prev === category ? null : category));
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="order-page">
      {!stepCompleted && (
        <OrderForm
          orderInfo={orderInfo}
          setOrderInfo={setOrderInfo}
          onContinue={() => setStepCompleted(true)}
          isValid={isFormValid}
          error={error}
        />
      )}

      {stepCompleted && (
        <>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <div className="order-layout">
            <ProductsSection
              groupedItems={groupedItems}
              cart={cart}
              addToCart={addToCart}
              openCategory={openCategory}
              toggleAccordion={toggleAccordion}
            />

            <CartSidebar
              cart={cart}
              removeFromCart={removeFromCart}
              onSubmit={submitOrder}
            />
          </div>
        </>
      )}
    </div>
  );
}

// =========================
// Order Form (email poistettu)
// =========================
function OrderForm({ orderInfo, setOrderInfo, onContinue, isValid, error }) {
  const update = (field, value) =>
    setOrderInfo({ ...orderInfo, [field]: value });

  return (
    <div className="order-form">
      <h2>Tilaajan tiedot</h2>
      {error && <p className="error">{error}</p>}

      <label>
        Tilaajan nimi
        <input value={orderInfo.name} onChange={e => update('name', e.target.value)} />
      </label>

      <label>
        Edustaa
        <input value={orderInfo.organization} onChange={e => update('organization', e.target.value)} />
      </label>

      <label>
        Toimituspiste
        <input value={orderInfo.deliveryPoint} onChange={e => update('deliveryPoint', e.target.value)} />
      </label>

      <label>
        Palautuspäivä
        <input
          type="date"
          value={orderInfo.returnDate}
          onChange={e => update('returnDate', e.target.value)}
        />
        <small>Tuotteet palautuvat automaattisesti sunnuntaina klo 23:00</small>
      </label>

      <button disabled={!isValid} onClick={onContinue}>
        Jatka tuotteisiin
      </button>
    </div>
  );
}

// =========================
// Products Section ja CartSidebar pysyvät ennallaan
// =========================
function ProductsSection({ groupedItems, cart, addToCart, openCategory, toggleAccordion }) {
  return (
    <div className="products">
      <h2>Valitse tuotteet</h2>
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="category-section">
          <button className="accordion-toggle" onClick={() => toggleAccordion(category)}>
            {category} {openCategory === category ? '▼' : '▶'}
          </button>

          {openCategory === category && (
            <div className="category-items">
              {items.map(item => {
                const isOutOfStock = item.available_stock === 0;
                return (
                  <div key={item.id} className={`product-row ${isOutOfStock ? 'out-of-stock' : ''}`}>
                    <div>
                      <strong>{item.name}</strong>
                      <div className="muted">{item.short_description}</div>
                      <div className="stock">
                        {isOutOfStock ? 'Loppu varastosta' : `Varastossa: ${item.available_stock}`}
                      </div>
                    </div>

                    <input
                      type="number"
                      min="0"
                      max={item.available_stock}
                      value={cart[item.id]?.quantity || 0}
                      onChange={e => addToCart(item, Number(e.target.value))}
                      disabled={isOutOfStock}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CartSidebar({ cart, removeFromCart, onSubmit }) {
  const items = Object.values(cart).filter(i => i.quantity > 0);

  return (
    <aside className="cart">
      <h3>Ostoskori</h3>
      {items.length === 0 && <p>Ei tuotteita</p>}

      {items.map(item => (
        <div key={item.id} className="cart-item">
          <span>{item.name}</span>
          <span>x {item.quantity}</span>
          <button onClick={() => removeFromCart(item.id)}>✕</button>
        </div>
      ))}

      {items.length > 0 && (
        <button className="submit-btn" onClick={onSubmit}>
          Lähetä tilaus
        </button>
      )}
    </aside>
  );
}

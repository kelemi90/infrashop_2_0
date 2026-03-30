import { useEffect, useState } from 'react';
import api from '../api';
import '../styles/order.css';

const POWER_ITEMS = new Set([
  'sahkot 1x16a 230v 3000w',
  'sahkot 230v',
  'sahkot 3x16a 400v 9000w',
  'sahkot 3x32a 400v 15000w',
  'sahkot muu'
]);

const NETWORK_ITEMS = new Set([
  'verkko-10g lr',
  'verkko-10g sr',
  'verkko-1g base-t'
]);

const LIGHTING_ITEMS = new Set([
  'valaistus',
  'rgb wash pixel ohjattu'
]);

const REQUIREMENT_LABELS = {
  power: 'Mita laitteita tulet laittamaan tahan?',
  network: 'Kuinka monta konetta ja tarvitsetko wifia?',
  lighting: 'Kuinka paljon valoa tarvitset ja minka varista?'
};

function normalizeItemName(value) {
  if (!value) return '';
  try {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  } catch (e) {
    return String(value).toLowerCase().trim();
  }
}

function requiredRequirementKeys(cartItems) {
  const keys = new Set();
  for (const item of cartItems) {
    const nn = normalizeItemName(item.name);
    if (POWER_ITEMS.has(nn)) keys.add('power');
    if (NETWORK_ITEMS.has(nn)) keys.add('network');
    if (LIGHTING_ITEMS.has(nn)) keys.add('lighting');
  }
  return Array.from(keys);
}

export default function OrderPage() {
  const [stepCompleted, setStepCompleted] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [orderInfo, setOrderInfo] = useState({
    eventId: '',
    name: '',
    organization: '',
    deliveryPoint: '',
    returnDate: ''
  });

  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({});
  const [specialRequirements, setSpecialRequirements] = useState({
    power: '',
    network: '',
    lighting: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openCategory, setOpenCategory] = useState(null);

  useEffect(() => {
    api.get('/events')
      .then((res) => setEvents(res.data || []))
      .catch(() => setError('Tapahtumien haku epannistui'))
      .finally(() => setEventsLoading(false));
  }, []);

  useEffect(() => {
    if (stepCompleted) {
      api.get('/items')
        .then(res => setItems(res.data))
        .catch(() => setError('Tuotteiden haku epäonnistui'));
    }
  }, [stepCompleted]);

  const isFormValid =
    orderInfo.eventId &&
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
    const selectedCartItems = Object.values(cart).filter(i => i.quantity > 0);

    if (selectedCartItems.length === 0) {
      setError('Ostoskori on tyhjä');
      return;
    }

    const requiredKeys = requiredRequirementKeys(selectedCartItems);
    for (const key of requiredKeys) {
      if (!specialRequirements[key] || !specialRequirements[key].trim()) {
        setError(`Lisatieto puuttuu: ${REQUIREMENT_LABELS[key]}`);
        return;
      }
    }

    const payload = {
      eventId: Number(orderInfo.eventId),
      name: orderInfo.name,
      organization: orderInfo.organization,
      deliveryPoint: orderInfo.deliveryPoint,
      returnAt: orderInfo.returnDate,
      items: selectedCartItems.map(i => ({
        item_id: i.id,
        quantity: i.quantity
      })),
      specialRequirements: {
        power: specialRequirements.power,
        network: specialRequirements.network,
        lighting: specialRequirements.lighting
      }
    };

    try {
      const res = await api.post('/orders', payload); // ei auth headeria
      setSuccess(`Tilaus lähetetty! Tilaus ID: ${res.data.orderId}`);
      setError('');
      setCart({});
      setStepCompleted(false);
      setSpecialRequirements({ power: '', network: '', lighting: '' });
      setOrderInfo({
        eventId: '',
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

  const selectedCartItems = Object.values(cart).filter(i => i.quantity > 0);
  const requiredKeys = requiredRequirementKeys(selectedCartItems);

  return (
    <div className="order-page">
      {!stepCompleted && (
        <OrderForm
          events={events}
          eventsLoading={eventsLoading}
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
              requiredKeys={requiredKeys}
              specialRequirements={specialRequirements}
              setSpecialRequirements={setSpecialRequirements}
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
function OrderForm({ events, eventsLoading, orderInfo, setOrderInfo, onContinue, isValid, error }) {
  const update = (field, value) =>
    setOrderInfo({ ...orderInfo, [field]: value });

  const updateEvent = (value) => {
    const selected = events.find((ev) => String(ev.id) === String(value));
    const autoReturnDate = selected?.end_date ? String(selected.end_date).slice(0, 10) : '';

    setOrderInfo({
      ...orderInfo,
      eventId: value,
      returnDate: orderInfo.returnDate || autoReturnDate
    });
  };

  return (
    <div className="order-form">
      <h2>Tilaajan tiedot</h2>
      {error && <p className="error">{error}</p>}

      <label>
        Tapahtuma
        <select
          value={orderInfo.eventId}
          onChange={(e) => updateEvent(e.target.value)}
          disabled={eventsLoading}
        >
          <option value="">-- Valitse tapahtuma --</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      </label>

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

function CartSidebar({ cart, removeFromCart, requiredKeys, specialRequirements, setSpecialRequirements, onSubmit }) {
  const items = Object.values(cart).filter(i => i.quantity > 0);

  const updateRequirement = (key, value) => {
    setSpecialRequirements((prev) => ({
      ...prev,
      [key]: value
    }));
  };

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

      {requiredKeys.length > 0 && (
        <div className="order-extra-info">
          <h4>Lisatiedot</h4>
          {requiredKeys.map((key) => (
            <label key={key} className="order-extra-label">
              {REQUIREMENT_LABELS[key]}
              <textarea
                value={specialRequirements[key] || ''}
                onChange={(e) => updateRequirement(key, e.target.value)}
                rows={3}
                placeholder="Kirjoita lisatieto tahan"
              />
            </label>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <button className="submit-btn" onClick={onSubmit}>
          Lähetä tilaus
        </button>
      )}
    </aside>
  );
}

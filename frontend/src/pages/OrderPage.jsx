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

function isTvRequirementItem(value) {
  return normalizeItemName(value).includes('tv');
}

const REQUIREMENT_TITLES = {
  power: 'Sähkö',
  network: 'Verkko',
  lighting: 'Valaistus',
  tv: 'TV'
};

const REQUIREMENT_LABELS = {
  power: 'Mitä sähkölaitteita tulet laittamaan tähän? Esim. 3D-printtereitä, juomille kylmäallas. Kolme tv:tä.',
  network: 'Kuinka monta konetta ja tarvitsetko wifiä?',
  lighting: 'Kuinka paljon valoa tarvitset ja minkä väristä?',
  tv: 'Mihin TV tulee? (Esim. Livelava, Artemis) Muista tilata jalat tai kiinnityksen ja tarvittavat kaapelit.'
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
    if (isTvRequirementItem(item.name)) keys.add('tv');
  }
  return Array.from(keys);
}

function selectedGroupRequirementItems(cartGroups, groupItemsById) {
  const selectedGroups = Object.entries(cartGroups || {}).filter(([, mult]) => mult > 0);
  return selectedGroups.flatMap(([gid]) =>
    ((groupItemsById && groupItemsById[gid]) || []).map((it) => ({ name: it.name }))
  );
}

export default function OrderPage() {
  const [stepCompleted, setStepCompleted] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  const [orderInfo, setOrderInfo] = useState({
    eventId: '',
    name: '',
    organization: '',
    deliveryPoint: '',
    returnDate: ''
  });

  const [items, setItems] = useState([]);
  const [itemGroups, setItemGroups] = useState([]);
  const [groupItemsById, setGroupItemsById] = useState({});
  const [cart, setCart] = useState({});
  const [cartGroups, setCartGroups] = useState({});
  const [specialRequirements, setSpecialRequirements] = useState({
    power: '',
    network: '',
    lighting: '',
    tv: ''
  });
  const [openComment, setOpenComment] = useState('');
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

      api.get('/item-groups')
        .then(res => setItemGroups(res.data || []))
        .catch(() => setError('Tuoteryhmien haku epäonnistui'));
    }
  }, [stepCompleted]);

  // Load group contents for groups that are currently in cart.
  useEffect(() => {
    const groupIds = Object.keys(cartGroups || {}).filter((gid) => (cartGroups[gid] || 0) > 0);
    const missing = groupIds.filter((gid) => !groupItemsById[gid]);
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.all(
      missing.map((gid) =>
        api.get(`/item-groups/${gid}/items`)
          .then((res) => [gid, res.data || []])
          .catch(() => [gid, []])
      )
    ).then((entries) => {
      if (cancelled) return;
      setGroupItemsById((prev) => {
        const next = { ...prev };
        entries.forEach(([gid, rows]) => {
          next[gid] = rows;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [cartGroups, groupItemsById]);

  // If page opened with ?group_id=...&multiplier=... add the group to the cartGroups
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const gid = params.get('group_id');
      const mult = parseInt(params.get('multiplier'), 10) || 1;
      if (gid) {
        addGroupToCart(gid, mult);
        // remove query params from URL to avoid duplicate adds
        const url = new URL(window.location.href);
        url.searchParams.delete('group_id');
        url.searchParams.delete('multiplier');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      // ignore
    }
  }, []);

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

  // add a group bundle to the cart (group_id -> multiplier)
  const addGroupToCart = (groupId, multiplier = 1) => {
    setCartGroups(prev => ({ ...prev, [groupId]: (prev[groupId] || 0) + multiplier }));
  };

  const removeFromCart = (itemId) => {
    const copy = { ...cart };
    delete copy[itemId];
    setCart(copy);
  };

  const submitOrder = async () => {
    const selectedCartItems = Object.values(cart).filter(i => i.quantity > 0);
    const selectedCartGroups = Object.entries(cartGroups).filter(([,mult]) => mult > 0);

    if (selectedCartItems.length === 0 && selectedCartGroups.length === 0) {
      setError('Ostoskori on tyhjä');
      return;
    }

    let effectiveGroupItems = selectedGroupRequirementItems(cartGroups, groupItemsById);

    // Ensure requirement checks are accurate even if group contents are not yet loaded.
    const missingGroupIds = selectedCartGroups
      .map(([gid]) => String(gid))
      .filter((gid) => !groupItemsById[gid]);

    if (missingGroupIds.length > 0) {
      const fetchedEntries = await Promise.all(
        missingGroupIds.map((gid) =>
          api.get(`/item-groups/${gid}/items`)
            .then((res) => [gid, res.data || []])
            .catch(() => [gid, []])
        )
      );

      const fetchedMap = {};
      fetchedEntries.forEach(([gid, rows]) => {
        fetchedMap[gid] = rows;
      });

      setGroupItemsById((prev) => ({ ...prev, ...fetchedMap }));
      effectiveGroupItems = [...effectiveGroupItems, ...fetchedEntries.flatMap(([, rows]) => rows.map((it) => ({ name: it.name })))];
    }

    const requiredKeys = requiredRequirementKeys([...selectedCartItems, ...effectiveGroupItems]);
    for (const key of requiredKeys) {
      if (!specialRequirements[key] || !specialRequirements[key].trim()) {
        setError(`Lisätieto puuttuu: ${REQUIREMENT_LABELS[key]}`);
        return;
      }
    }

    const payload = {
      eventId: Number(orderInfo.eventId),
      name: orderInfo.name,
      organization: orderInfo.organization,
      deliveryPoint: orderInfo.deliveryPoint,
      returnAt: orderInfo.returnDate,
      items: [
        ...selectedCartGroups.map(([group_id, multiplier]) => ({ group_id: Number(group_id), multiplier })),
        ...selectedCartItems.map(i => ({ item_id: i.id, quantity: i.quantity }))
      ],
      specialRequirements: {
        power: specialRequirements.power,
        network: specialRequirements.network,
        lighting: specialRequirements.lighting,
        tv: specialRequirements.tv
      },
      openComment
    };

    try {
      const res = await api.post('/orders', payload); // ei auth headeria
      setSubmittedOrder({
        orderId: res.data.orderId,
        deliveryPoint: orderInfo.deliveryPoint,
        customerName: orderInfo.name
      });
      setSuccess(`Tilaus lähetetty! Tilaus ID: ${res.data.orderId}`);
      setError('');
      setCart({});
      setCartGroups({});
      setStepCompleted(false);
      setSpecialRequirements({ power: '', network: '', lighting: '', tv: '' });
      setOpenComment('');
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
  const selectedGroupItems = selectedGroupRequirementItems(cartGroups, groupItemsById);
  const requiredKeys = requiredRequirementKeys([...selectedCartItems, ...selectedGroupItems]);

  return (
    <div className="order-page">
      {submittedOrder && (
        <OrderSuccessCard submittedOrder={submittedOrder} onDismiss={() => setSubmittedOrder(null)} />
      )}

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

          <OrderContextBar orderInfo={orderInfo} events={events} />

          <div className="order-layout">
            <ProductsSection
              groupedItems={groupedItems}
              itemGroups={itemGroups}
              addGroupToCart={addGroupToCart}
              cart={cart}
              addToCart={addToCart}
              openCategory={openCategory}
              toggleAccordion={toggleAccordion}
            />

            <CartSidebar
              orderInfo={orderInfo}
              cart={cart}
              cartGroups={cartGroups}
              itemGroups={itemGroups}
              groupItemsById={groupItemsById}
              setCartGroups={setCartGroups}
              removeFromCart={removeFromCart}
              requiredKeys={requiredKeys}
              specialRequirements={specialRequirements}
              setSpecialRequirements={setSpecialRequirements}
              openComment={openComment}
              setOpenComment={setOpenComment}
              onSubmit={submitOrder}
            />
          </div>
        </>
      )}
    </div>
  );
}

function OrderSuccessCard({ submittedOrder, onDismiss }) {
  return (
    <div className="order-success-card">
      <div>
        <h3>Tilaus vastaanotettu</h3>
        <p>
          Tilaus {submittedOrder.orderId} toimituspisteeseen {submittedOrder.deliveryPoint} on tallennettu.
        </p>
      </div>

      <div className="order-success-actions">
        <a
          className="submit-btn order-success-link"
          href={`/api/orders/${submittedOrder.orderId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Lataa PDF
        </a>
        <button className="order-success-dismiss" onClick={onDismiss}>
          Sulje
        </button>
      </div>
    </div>
  );
}

function OrderContextBar({ orderInfo, events }) {
  const selectedEvent = events.find((ev) => String(ev.id) === String(orderInfo.eventId));

  return (
    <div className="order-context-bar">
      <div className="order-context-item order-context-primary">
        <span className="order-context-label">Toimituspiste</span>
        <strong>{orderInfo.deliveryPoint}</strong>
      </div>
      <div className="order-context-item">
        <span className="order-context-label">Tilaaja</span>
        <span>{orderInfo.name || '-'}</span>
      </div>
      <div className="order-context-item">
        <span className="order-context-label">Edustaa</span>
        <span>{orderInfo.organization || '-'}</span>
      </div>
      <div className="order-context-item">
        <span className="order-context-label">Tapahtuma</span>
        <span>{selectedEvent ? selectedEvent.name : '-'}</span>
      </div>
      <div className="order-context-item">
        <span className="order-context-label">Palautuspäivä</span>
        <span>{orderInfo.returnDate || '-'}</span>
      </div>
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
function ProductsSection({ groupedItems, itemGroups, addGroupToCart, cart, addToCart, openCategory, toggleAccordion }) {
  return (
    <div className="products">
      <h2>Valitse tuotteet</h2>

      {itemGroups.length > 0 && (
        <div className="category-section">
          <button className="accordion-toggle" onClick={() => toggleAccordion('__GROUPS__')}>
            Tuoteryhmat {openCategory === '__GROUPS__' ? '▼' : '▶'}
          </button>

          {openCategory === '__GROUPS__' && (
            <div className="category-items">
              {itemGroups.map((group) => (
                <div key={group.id} className="product-row">
                  <div>
                    <strong>{group.name}</strong>
                    <div className="muted">{group.description || 'Ei kuvausta'}</div>
                  </div>
                  <button onClick={() => addGroupToCart(group.id, 1)}>Lisää</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

function CartSidebar({ orderInfo, cart, cartGroups, itemGroups, groupItemsById, setCartGroups, removeFromCart, requiredKeys, specialRequirements, setSpecialRequirements, openComment, setOpenComment, onSubmit }) {
  const items = Object.values(cart).filter(i => i.quantity > 0);
  const groups = Object.entries(cartGroups || {}).map(([gid, mult]) => {
    const found = (itemGroups || []).find((g) => String(g.id) === String(gid));
    const includedItems = (groupItemsById && groupItemsById[gid]) || [];
    return { group_id: gid, multiplier: mult, name: found ? found.name : `Group ${gid}`, includedItems };
  });

  const updateRequirement = (key, value) => {
    setSpecialRequirements((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <aside className="cart">
      <h3>Ostoskori</h3>
      {items.length === 0 && groups.length === 0 && <p>Ei tuotteita</p>}

      {groups.map(g => (
        <div key={`group-${g.group_id}`} className="cart-item group-item cart-group-item">
          <div className="cart-group-item-head">
            <span>{g.name}</span>
            <span>x {g.multiplier}</span>
            <button onClick={() => {
              const copy = { ...cartGroups };
              delete copy[g.group_id];
              setCartGroups(copy);
            }}>✕</button>
          </div>
          {g.includedItems.length > 0 && (
            <div className="muted cart-group-item-details">
              Sisaltaa: {g.includedItems.map((it) => `${it.name} x${it.quantity}`).join(', ')}
            </div>
          )}
        </div>
      ))}

      {items.map(item => (
        <div key={item.id} className="cart-item">
          <span>{item.name}</span>
          <span>x {item.quantity}</span>
          <button onClick={() => removeFromCart(item.id)}>✕</button>
        </div>
      ))}

      {requiredKeys.length > 0 && (
        <div className="order-extra-info">
          <h4>Lisätiedot</h4>
          {requiredKeys.map((key) => (
            <div key={key} className="order-extra-section">
              <div className="order-extra-heading">{REQUIREMENT_TITLES[key] || 'Lisätieto'}</div>
              <label className="order-extra-label">
                <span className="order-extra-question">{REQUIREMENT_LABELS[key]}</span>
                <textarea
                  value={specialRequirements[key] || ''}
                  onChange={(e) => updateRequirement(key, e.target.value)}
                  rows={3}
                  placeholder="Kirjoita lisätieto tähän"
                />
              </label>
            </div>
          ))}
        </div>
      )}

      <div className="order-open-comment">
        <label className="order-extra-label">
          <span className="order-extra-question">Avoin kommentti tilaukseen (valinnainen)</span>
          <textarea
            value={openComment}
            onChange={(e) => setOpenComment(e.target.value)}
            rows={3}
            placeholder="Kirjoita mahdolliset lisähuomiot tähän"
          />
        </label>
      </div>

      {(items.length > 0 || groups.length > 0) && (
        <button className="submit-btn" onClick={onSubmit}>
          Lähetä tilaus
        </button>
      )}
    </aside>
  );
}

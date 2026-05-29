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
  const nn = normalizeItemName(value);
  if (!nn) return false;
  const tokens = nn.split(/[^a-z0-9]+/).filter(Boolean);
  const normalizedCompact = nn.replace(/[^a-z0-9]+/g, '');
  return (
    tokens.includes('tv') ||
    tokens.includes('televisio') ||
    tokens.includes('iffalcon') ||
    normalizedCompact === 'infotv' ||
    normalizedCompact === 'kutullajatv'
  );
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
    if (NETWORK_ITEMS.has(nn) || normalizeItemName(item.category) === 'verkko') keys.add('network');
    if (LIGHTING_ITEMS.has(nn)) keys.add('lighting');
    if (isTvRequirementItem(item.name)) keys.add('tv');
  }
  return Array.from(keys);
}

function selectedGroupRequirementItems(cartGroups, groupItemsById) {
  const selectedGroups = Object.entries(cartGroups || {}).filter(([, mult]) => mult > 0);
  return selectedGroups.flatMap(([gid]) =>
    ((groupItemsById && groupItemsById[gid]) || []).map((it) => ({ name: it.name, category: it.category }))
  );
}

function compareByName(left, right) {
  return String(left || '').localeCompare(String(right || ''), 'fi', {
    sensitivity: 'base'
  });
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
    deliveryDate: '',
    returnDate: ''
  });

  const [items, setItems] = useState([]);
  const [itemGroups, setItemGroups] = useState([]);
  const [groupItemsById, setGroupItemsById] = useState({});
  const [cart, setCart] = useState({});
  const [cartGroups, setCartGroups] = useState({});
  const [autoAddOptOut, setAutoAddOptOut] = useState({});
  const [specialRequirements, setSpecialRequirements] = useState({
    power: '',
    network: '',
    lighting: '',
    tv: ''
  });
  const [cartSortMode, setCartSortMode] = useState('category');
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
    orderInfo.deliveryDate;

  const addToCart = (item, qty) => {
    const safeQty = Math.min(Math.max(qty, 0), item.available_stock);
    if (safeQty > 0) {
      setAutoAddOptOut((prev) => {
        if (!prev[item.id]) return prev;
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
    setCart(prev => ({
      ...prev,
      [item.id]: {
        ...item,
        quantity: safeQty,
        autoAddedBySystem: false
      }
    }));
  };

  useEffect(() => {
    if (!items.length) return;

    const byId = new Map(items.map((it) => [String(it.id), it]));
    const autoRequired = new Map();

    Object.values(cart).forEach((entry) => {
      if (!entry || entry.autoAddedBySystem || !entry.quantity || entry.quantity <= 0) return;
      const source = byId.get(String(entry.id));
      if (!source || !source.auto_add_item_id) return;

      const target = byId.get(String(source.auto_add_item_id));
      if (!target) return;
      if (autoAddOptOut[target.id]) return;

      const mult = Math.max(1, Number(source.auto_add_item_quantity) || 1);
      const reqQty = Math.min(target.available_stock, entry.quantity * mult);
      if (reqQty <= 0) return;

      autoRequired.set(target.id, (autoRequired.get(target.id) || 0) + reqQty);
    });

    setCart((prev) => {
      let changed = false;
      const next = { ...prev };

      autoRequired.forEach((requiredQty, targetId) => {
        const existing = next[targetId];
        if (!existing) {
          const target = byId.get(String(targetId));
          if (!target) return;
          next[targetId] = { ...target, quantity: requiredQty, autoAddedBySystem: true };
          changed = true;
          return;
        }

        const currentQty = existing.quantity || 0;
        let nextQty = currentQty;
        let nextAutoAddedBySystem = existing.autoAddedBySystem === true;

        if (existing.autoAddedBySystem) {
          if (currentQty > requiredQty) {
            // User has manually increased this row above auto-required minimum.
            nextAutoAddedBySystem = false;
          } else {
            nextQty = requiredQty;
            nextAutoAddedBySystem = true;
          }
        } else {
          nextQty = Math.max(currentQty, requiredQty);
          nextAutoAddedBySystem = false;
        }

        if (nextQty !== existing.quantity || nextAutoAddedBySystem !== existing.autoAddedBySystem) {
          next[targetId] = { ...existing, quantity: nextQty, autoAddedBySystem: nextAutoAddedBySystem };
          changed = true;
        }
      });

      Object.keys(next).forEach((key) => {
        const row = next[key];
        if (!row || !row.autoAddedBySystem) return;
        const needed = autoRequired.get(Number(key)) || 0;
        if (!needed) {
          delete next[key];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [cart, items, autoAddOptOut]);

  // add a group bundle to the cart (group_id -> multiplier)
  const addGroupToCart = (groupId, multiplier = 1) => {
    setCartGroups(prev => ({ ...prev, [groupId]: (prev[groupId] || 0) + multiplier }));
  };

  const removeFromCart = (itemId) => {
    const row = cart[itemId];
    if (row && row.autoAddedBySystem) {
      setAutoAddOptOut((prev) => ({ ...prev, [itemId]: true }));
    }
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
      deliveryAt: orderInfo.deliveryDate,
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
      autoAddOptOutItemIds: Object.keys(autoAddOptOut)
        .filter((id) => autoAddOptOut[id])
        .map((id) => Number(id)),
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
      setAutoAddOptOut({});
      setStepCompleted(false);
      setSpecialRequirements({ power: '', network: '', lighting: '', tv: '' });
      setOpenComment('');
      setOrderInfo({
        eventId: '',
        name: '',
        organization: '',
        deliveryPoint: '',
        deliveryDate: '',
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
              cartSortMode={cartSortMode}
              setCartSortMode={setCartSortMode}
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
        <span className="order-context-label">Toimituspaiva</span>
        <span>{orderInfo.deliveryDate || '-'}</span>
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
  const selectedEvent = events.find((ev) => String(ev.id) === String(orderInfo.eventId));

  const formatDateInput = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  };

  const update = (field, value) =>
    setOrderInfo({ ...orderInfo, [field]: value });

  const updateEvent = (value) => {
    const selected = events.find((ev) => String(ev.id) === String(value));
    const autoReturnDate = selected?.end_date ? String(selected.end_date).slice(0, 10) : '';
    const autoDeliveryDate = selected?.start_date ? String(selected.start_date).slice(0, 10) : '';

    setOrderInfo({
      ...orderInfo,
      eventId: value,
      deliveryDate: orderInfo.deliveryDate || autoDeliveryDate,
      returnDate: autoReturnDate
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
        Toimituspäivä
        <input
          type="date"
          value={orderInfo.deliveryDate}
          onChange={e => update('deliveryDate', e.target.value)}
        />
      </label>

      <label>
        Palautuspäivä
        <input
          type="date"
          value={formatDateInput(selectedEvent?.end_date || orderInfo.returnDate)}
          readOnly
        />
        <small>Palautuspäivä määräytyy automaattisesti valitun tapahtuman viimeisestä päivästä.</small>
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

function CartSidebar({ orderInfo, cart, cartGroups, itemGroups, groupItemsById, setCartGroups, removeFromCart, requiredKeys, specialRequirements, setSpecialRequirements, cartSortMode, setCartSortMode, openComment, setOpenComment, onSubmit }) {
  const items = Object.values(cart).filter(i => i.quantity > 0);
  const groups = Object.entries(cartGroups || {}).map(([gid, mult]) => {
    const found = (itemGroups || []).find((g) => String(g.id) === String(gid));
    const includedItems = (groupItemsById && groupItemsById[gid]) || [];
    return { group_id: gid, multiplier: mult, name: found ? found.name : `Group ${gid}`, includedItems };
  });
  const cartEntries = [...groups.map((group) => ({
    type: 'group',
    key: `group-${group.group_id}`,
    sortName: group.name,
    sortCategory: 'Tuoteryhmät',
    ...group
  })), ...items.map((item) => ({
    type: 'item',
    key: `item-${item.id}`,
    sortName: item.name,
    sortCategory: item.category || 'Muut tuotteet',
    ...item
  }))].sort((left, right) => {
    if (cartSortMode === 'alphabetical') {
      return compareByName(left.sortName, right.sortName);
    }

    return compareByName(left.sortCategory, right.sortCategory) || compareByName(left.sortName, right.sortName);
  });

  const updateRequirement = (key, value) => {
    setSpecialRequirements((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <aside className="cart">
      <div className="cart-header">
        <h3>Ostoskori</h3>
        <label className="cart-sort-label">
          Järjestys
          <select value={cartSortMode} onChange={(e) => setCartSortMode(e.target.value)}>
            <option value="category">Tuotekategoria</option>
            <option value="alphabetical">Aakkosjärjestys</option>
          </select>
        </label>
      </div>
      {items.length === 0 && groups.length === 0 && <p>Ei tuotteita</p>}

      {cartSortMode === 'category' ? (() => {
        // Build ordered category list preserving sort order
        const orderedCategories = [];
        const byCategory = {};
        for (const entry of cartEntries) {
          if (!byCategory[entry.sortCategory]) {
            byCategory[entry.sortCategory] = [];
            orderedCategories.push(entry.sortCategory);
          }
          byCategory[entry.sortCategory].push(entry);
        }
        return orderedCategories.map((cat) => (
          <div key={cat} className="cart-category-group">
            <div className="cart-category-header">{cat}</div>
            {byCategory[cat].map((entry) => {
              if (entry.type === 'group') {
                return (
                  <div key={entry.key} className="cart-item group-item cart-group-item">
                    <div className="cart-item-meta">
                      <div className="cart-group-item-head">
                        <span>{entry.name}</span>
                        <span>x {entry.multiplier}</span>
                        <button onClick={() => {
                          const copy = { ...cartGroups };
                          delete copy[entry.group_id];
                          setCartGroups(copy);
                        }}>✕</button>
                      </div>
                    </div>
                    {entry.includedItems.length > 0 && (
                      <div className="muted cart-group-item-details">
                        Sisaltaa: {entry.includedItems.map((it) => `${it.name} x${it.quantity}`).join(', ')}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div key={entry.key} className="cart-item">
                  <div className="cart-item-meta">
                    <span>{entry.name}{entry.autoAddedBySystem ? ' (auto)' : ''}</span>
                  </div>
                  <span>x {entry.quantity}</span>
                  <button onClick={() => removeFromCart(entry.id)}>✕</button>
                </div>
              );
            })}
          </div>
        ));
      })() : cartEntries.map((entry) => {
        if (entry.type === 'group') {
          return (
            <div key={entry.key} className="cart-item group-item cart-group-item">
              <div className="cart-item-meta">
                <span className="cart-item-category">{entry.sortCategory}</span>
                <div className="cart-group-item-head">
                  <span>{entry.name}</span>
                  <span>x {entry.multiplier}</span>
                  <button onClick={() => {
                    const copy = { ...cartGroups };
                    delete copy[entry.group_id];
                    setCartGroups(copy);
                  }}>✕</button>
                </div>
              </div>
              {entry.includedItems.length > 0 && (
                <div className="muted cart-group-item-details">
                  Sisaltaa: {entry.includedItems.map((it) => `${it.name} x${it.quantity}`).join(', ')}
                </div>
              )}
            </div>
          );
        }
        return (
          <div key={entry.key} className="cart-item">
            <div className="cart-item-meta">
              <span className="cart-item-category">{entry.sortCategory}</span>
              <span>{entry.name}{entry.autoAddedBySystem ? ' (auto)' : ''}</span>
            </div>
            <span>x {entry.quantity}</span>
            <button onClick={() => removeFromCart(entry.id)}>✕</button>
          </div>
        );
      })}

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

(async () => {
  const fetch = global.fetch || (await import('node-fetch')).default;
  const jwt = require('jsonwebtoken');
  const API = process.env.API_URL || 'http://localhost:3000';
  const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

  function log(...args) { console.log(...args); }

  try {
    // find an item with available_stock >= 2
    const itemsRes = await fetch(`${API}/api/items`);
    const items = await itemsRes.json();
    const item = items.find(i => i.available_stock >= 2);
    if (!item) {
      console.error('No item with available_stock >= 2 found; aborting test');
      process.exit(1);
    }

    log('Selected item', item.id, item.name, 'stock', item.available_stock);

    // create an order with quantity 1 of this item
    const orderBody = {
      name: 'Test User',
      organization: 'TestOrg',
      deliveryPoint: 'Test point',
      returnAt: new Date(Date.now() + 24*3600*1000).toISOString(),
      items: [{ item_id: item.id, quantity: 1 }]
    };

    const createRes = await fetch(`${API}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderBody)
    });

    if (!createRes.ok) {
      console.error('Failed to create order', await createRes.text());
      process.exit(1);
    }
    const createJson = await createRes.json();
    const orderId = createJson.orderId;
    log('Created order', orderId);

    // get item stock after create
    const itemAfterCreate = await (await fetch(`${API}/api/items/${item.id}`)).json();
    log('Stock after create:', itemAfterCreate.available_stock);

    // prepare admin token
    const token = jwt.sign({ id: 1, role: 'admin' }, JWT_SECRET);

    // PATCH to increase quantity to 2
    const patchBody = { items: [{ item_id: item.id, quantity: 2 }] };
    const patchRes = await fetch(`${API}/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(patchBody)
    });

    const patchText = await patchRes.text();
    if (!patchRes.ok) {
      console.error('PATCH failed:', patchRes.status, patchText);
      process.exit(1);
    }

    log('PATCH response:', patchText.substring(0, 200));

    // get item stock after patch
    const itemAfterPatch = await (await fetch(`${API}/api/items/${item.id}`)).json();
    log('Stock after patch:', itemAfterPatch.available_stock);

    // expected stock decreased by 1 compared to after create
    const expected = itemAfterCreate.available_stock - 1;
    if (itemAfterPatch.available_stock !== expected) {
      console.error(`Stock did not change as expected: expected ${expected}, got ${itemAfterPatch.available_stock}`);
      process.exit(1);
    }

    log('Happy path passed. Now testing out-of-stock rejection (increase beyond available)');

    // try to increase beyond available stock
    const itemCurrent = itemAfterPatch;
    const tooMany = itemCurrent.available_stock + 10; // intentionally too high
    const patchRes2 = await fetch(`${API}/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ items: [{ item_id: item.id, quantity: tooMany }] })
    });

    if (patchRes2.ok) {
      console.error('Expected out-of-stock patch to fail but it succeeded');
      process.exit(1);
    }

    const patch2Text = await patchRes2.text();
    console.log('Out-of-stock correctly rejected:', patchRes2.status, patch2Text.substring(0,200));

    console.log('Backend order-edit test completed successfully');
    process.exit(0);

  } catch (err) {
    console.error('Test error', err);
    process.exit(1);
  }
})();

const assert = require('assert');
const { getStatusTransitionStockDelta } = require('../utils/orderStatus');

const quantitiesByItemId = { '1': 2, '2': 1 };

const closedDelta = getStatusTransitionStockDelta('placed', 'closed', quantitiesByItemId);
assert.deepStrictEqual(Object.fromEntries(closedDelta), { '1': 2, '2': 1 }, 'closing an order should release stock');

const reopenedDelta = getStatusTransitionStockDelta('closed', 'placed', quantitiesByItemId);
assert.deepStrictEqual(Object.fromEntries(reopenedDelta), { '1': -2, '2': -1 }, 'reopening an order should reserve stock again');

const unchangedDelta = getStatusTransitionStockDelta('ready', 'ready', quantitiesByItemId);
assert.deepStrictEqual(Object.fromEntries(unchangedDelta), {}, 'unchanged statuses should not change stock');

console.log('order status logic tests passed');

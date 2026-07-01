const STATUS_RELEASE_STOCK = new Set(['closed', 'returned']);
const STATUS_RESERVE_STOCK = new Set(['placed', 'ready', 'in_progress', 'packed']);

function normalizeStatus(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function getStatusTransitionStockDelta(previousStatus, nextStatus, quantitiesByItemId) {
  const normalizedPrevious = normalizeStatus(previousStatus);
  const normalizedNext = normalizeStatus(nextStatus);

  if (!quantitiesByItemId || typeof quantitiesByItemId !== 'object') return new Map();
  if (!normalizedPrevious || !normalizedNext || normalizedPrevious === normalizedNext) return new Map();

  const previousReleasesStock = STATUS_RELEASE_STOCK.has(normalizedPrevious);
  const nextReleasesStock = STATUS_RELEASE_STOCK.has(normalizedNext);

  if (previousReleasesStock === nextReleasesStock) return new Map();

  const delta = new Map();
  for (const [itemId, quantity] of Object.entries(quantitiesByItemId)) {
    const qty = Number(quantity) || 0;
    if (qty <= 0) continue;
    if (previousReleasesStock && !nextReleasesStock) {
      delta.set(itemId, -qty);
    } else if (!previousReleasesStock && nextReleasesStock) {
      delta.set(itemId, qty);
    }
  }
  return delta;
}

module.exports = {
  normalizeStatus,
  getStatusTransitionStockDelta,
  STATUS_RELEASE_STOCK,
  STATUS_RESERVE_STOCK,
};

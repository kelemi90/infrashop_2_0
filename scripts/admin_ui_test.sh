#!/usr/bin/env bash
# admin_ui_test.sh — simple smoke tests for admin UI endpoints
# Usage: ./scripts/admin_ui_test.sh <admin-email> <admin-password>
# Requires: curl, jq

set -euo pipefail

ADMIN_EMAIL=${1:-}
ADMIN_PASS=${2:-}
BASE_URL=${BASE_URL:-http://localhost}

if [[ -z "$ADMIN_EMAIL" || -z "$ADMIN_PASS" ]]; then
  echo "Usage: $0 <admin-email> <admin-password>"
  exit 2
fi

echo "Logging in as $ADMIN_EMAIL..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" -H 'Content-Type: application/json' -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASS\"}" | jq -r .token)
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "Login failed or token missing" >&2
  exit 3
fi

echo "Token received: ${TOKEN:0:12}..."

# Fetch items as admin
echo "Fetching items as admin..."
ITEMS_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/items")
if [[ -z "$ITEMS_JSON" ]]; then
  echo "Failed to fetch items" >&2
  exit 4
fi

# Verify that at least one item includes varasto or rama_id fields
FIRST_ITEM=$(echo "$ITEMS_JSON" | jq '.[0]')
if [[ "$FIRST_ITEM" == "null" ]]; then
  echo "No items returned" >&2
  exit 5
fi

echo "First item metadata:" $(echo "$FIRST_ITEM" | jq '{id,name,varasto,rama_id,available_stock}')

# Smoke test an order (list orders — admin-only). If there are no orders, that's ok.
echo "Fetching admin orders list (if any)..."
ORDERS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/orders") || true
if [[ -n "$ORDERS" && "$(echo "$ORDERS" | jq 'length')" -gt 0 ]]; then
  echo "Found $(echo "$ORDERS" | jq 'length') orders. Checking first order's items..."
  FIRST_ORDER_ID=$(echo "$ORDERS" | jq -r '.[0].id')
  echo "Order id: $FIRST_ORDER_ID"
  ORDER_ITEMS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/orders/$FIRST_ORDER_ID") || true
  echo "Order $FIRST_ORDER_ID details: "
  echo "$ORDER_ITEMS" | jq '.items[:3]'
else
  echo "No orders found or unable to retrieve orders (not fatal)."
fi

echo "Admin UI smoke test completed successfully."
exit 0

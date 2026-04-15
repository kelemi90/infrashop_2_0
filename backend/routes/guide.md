# Backend Routes Guide

This directory contains REST API endpoint definitions organized by resource/feature.

## Structure

```
routes/
├── auth.js              # Authentication endpoints
├── items.js             # Product catalog endpoints
├── orders.js            # Order management endpoints
├── events.js            # Event management endpoints
├── itemGroups.js        # Product groups endpoints
├── reports.js           # Reporting endpoints
└── guide.md             # This file
```

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints (except login/register) require JWT token in header:

```
Authorization: Bearer <token>
```

Failed auth returns:
```json
{ "error": "Ei oikeuksia" }  // Status 403 Forbidden
```

## API Endpoints

### Auth Routes (`/api/auth`)

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

HTTP/1.1 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "customer"
  }
}
```

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "display_name": "John Doe"
}

HTTP/1.1 201 Created
{
  "id": 2,
  "email": "newuser@example.com"
}
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "old_password": "oldpass123",
  "new_password": "newpass456"
}

HTTP/1.1 200 OK
{ "message": "Salasana vaihdettu" }
```

---

### Items Routes (`/api/items`)

#### List All Items

```http
GET /api/items

HTTP/1.1 200 OK
[
  {
    "id": 1,
    "sku": "POWER-1",
    "name": "Sähköt 1x16A 230V",
    "short_description": "Single phase 16A power",
    "category": "power",
    "available_stock": 5,
    "total_stock": 10,
    "image_url": "http://localhost:3000/images/power1.jpg",
    "thumbnail_url": "http://localhost:3000/images/power1_thumb.jpg"
  },
  ...
]
```

#### Get Single Item

```http
GET /api/items/1

HTTP/1.1 200 OK
{
  "id": 1,
  "sku": "POWER-1",
  "name": "Sähköt 1x16A 230V",
  ...
}
```

#### Create Item (Admin only)

```http
POST /api/items
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "sku": "NEW-1",
  "name": "New Product",
  "short_description": "A new product",
  "category": "accessories",
  "total_stock": 20
}

HTTP/1.1 201 Created
{ "id": 15 }
```

#### Update Item (Admin only)

```http
PUT /api/items/15
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Updated Product",
  "available_stock": 18
}

HTTP/1.1 200 OK
{ "message": "Päivitetty" }
```

#### Upload Item Image

```http
POST /api/items/15/upload-image
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

file: <image_file>

HTTP/1.1 200 OK
{
  "image_url": "http://localhost:3000/images/item_15.jpg",
  "thumbnail_url": "http://localhost:3000/images/item_15_thumb.jpg"
}
```

---

### Orders Routes (`/api/orders`)

#### List Orders

```http
GET /api/orders

HTTP/1.1 200 OK
[
  {
    "id": 1,
    "customer_name": "John Doe",
    "event_id": 5,
    "status": "placed",
    "delivery_start": "2024-04-15T10:00:00Z",
    "return_at": "2024-04-20T18:00:00Z",
    "created_at": "2024-04-10T14:30:00Z"
  },
  ...
]
```

#### Get Order Details

```http
GET /api/orders/1
Authorization: Bearer <token>

HTTP/1.1 200 OK
{
  "order": {
    "id": 1,
    "customer_name": "John Doe",
    "status": "placed",
    ...
  },
  "items": [
    {
      "id": 1,
      "order_id": 1,
      "item_id": 5,
      "item_name": "Sähköt",
      "quantity": 2,
      "sku": "POWER-1"
    }
  ]
}
```

**Note**: Unauthenticated users can read orders by providing matching customer name:
```
GET /api/orders/1?customer_name=John%20Doe
```

#### Create Order

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "event_id": 5,
  "customer_name": "John Doe",
  "organization": "Acme Corp",
  "delivery_point": "Booth A",
  "delivery_start": "2024-04-15T10:00:00Z",
  "return_at": "2024-04-20T18:00:00Z",
  "items": [
    { "item_id": 1, "quantity": 2 },
    { "item_id": 3, "quantity": 1 }
  ],
  "special_requirements": {
    "power": "3x16A",
    "network": "10Gb",
    "lighting": "LED",
    "tv": "No"
  }
}

HTTP/1.1 201 Created
{ "orderId": 123 }
```

#### Update Order

```http
PATCH /api/orders/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "returned",
  "items": [
    { "item_id": 1, "quantity": 3 }
  ],
  "open_comment": "Updated via API"
}

HTTP/1.1 200 OK
{
  "order": { ... },
  "items": [ ... ]
}
```

#### Add Item Group to Order

```http
POST /api/orders/1/add-group/5
Authorization: Bearer <token>
Content-Type: application/json

{
  "multiplier": 2
}

HTTP/1.1 200 OK
{ "message": "Ryhmä lisätty" }
```

#### Get Order PDF

```http
GET /api/orders/1/pdf
Authorization: Bearer <token>

HTTP/1.1 200 OK
Content-Type: application/pdf
<PDF binary data>
```

---

### Events Routes (`/api/events`)

#### List Events

```http
GET /api/events

HTTP/1.1 200 OK
[
  {
    "id": 1,
    "name": "Trade Show 2024",
    "start_date": "2024-04-15T09:00:00Z",
    "end_date": "2024-04-17T18:00:00Z"
  }
]
```

#### Get Event

```http
GET /api/events/1

HTTP/1.1 200 OK
{
  "id": 1,
  "name": "Trade Show 2024",
  "start_date": "2024-04-15T09:00:00Z",
  "end_date": "2024-04-17T18:00:00Z"
}
```

#### Create Event (Admin only)

```http
POST /api/events
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "New Event",
  "start_date": "2024-05-01T09:00:00Z",
  "end_date": "2024-05-03T18:00:00Z"
}

HTTP/1.1 201 Created
{ "id": 2 }
```

---

### Item Groups Routes (`/api/item-groups`)

#### List Item Groups

```http
GET /api/item-groups

HTTP/1.1 200 OK
[
  {
    "id": 1,
    "name": "Basic Power",
    "description": "Basic power setup",
    "image_url": "..."
  }
]
```

#### Get Item Group

```http
GET /api/item-groups/1

HTTP/1.1 200 OK
{
  "id": 1,
  "name": "Basic Power",
  "description": "Basic power setup",
  "group_items": [
    {
      "item_id": 1,
      "quantity": 1,
      "item_name": "Sähköt 1x16A"
    }
  ]
}
```

#### Create Item Group (Admin only)

```http
POST /api/item-groups
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Premium Setup",
  "description": "Complete power and network",
  "items": [
    { "item_id": 1, "quantity": 1 },
    { "item_id": 5, "quantity": 2 }
  ]
}

HTTP/1.1 201 Created
{ "id": 2 }
```

---

### Reports Routes (`/api/reports`)

#### Order Summary

```http
GET /api/reports/orders?event_id=1

Authorization: Bearer <token>

HTTP/1.1 200 OK
{
  "total_orders": 25,
  "placed": 10,
  "delivered": 12,
  "returned": 3,
  "archived": 0
}
```

#### Stock Report

```http
GET /api/reports/stock

HTTP/1.1 200 OK
[
  {
    "item_id": 1,
    "name": "Sähköt 1x16A",
    "total_stock": 10,
    "available_stock": 5,
    "reserved": 5
  }
]
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Pakollisia kenttiä puuttuu"
}
```

### 403 Forbidden

```json
{
  "error": "Admin only"
}
```

### 404 Not Found

```json
{
  "error": "Tilausta ei löydy"
}
```

### 500 Internal Server Error

```json
{
  "error": "Tilauksen luonti epäonnistui"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 403 | Forbidden - Not authorized |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

## Testing with curl

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test123"}' \
  | jq -r '.token')

# Use token in subsequent requests
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN"

# Create item (admin)
curl -X POST http://localhost:3000/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku":"TEST-1","name":"Test","total_stock":10}'
```

## Client Libraries

- **JavaScript**: Use `axios` or `fetch` API
- **Python**: Use `requests` library
- **See frontend for JavaScript/React examples**: `../frontend/src/api.js`

## See Also

- `../guide.md` - Backend overview
- `auth.js` - Authentication implementation
- `items.js` - Item endpoints implementation
- `orders.js` - Order endpoints implementation

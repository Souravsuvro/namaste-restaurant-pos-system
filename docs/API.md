# API Documentation

Base URL: `http://localhost:3001/api`

All endpoints (except auth) require a valid JWT token in the `Authorization: Bearer <token>` header.

## Authentication

### POST /auth/login

Login with a 4-digit PIN.

**Request:**
```json
{
  "pin": "1234"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Admin",
    "role": "admin"
  },
  "token": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Error (401):**
```json
{
  "error": "Invalid PIN"
}
```

### POST /auth/refresh

Refresh an expired access token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200):**
```json
{
  "token": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### GET /auth/me

Get the current authenticated user.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Admin",
  "role": "admin",
  "active": true
}
```

---

## Menu

### GET /menu

List menu items with optional filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `category_id` | string | Filter by category |
| `available` | boolean | Filter by availability |
| `search` | string | Search by name/description |
| `vegetarian` | boolean | Filter vegetarian items |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Butter Chicken du Chef",
    "description": "...",
    "price": 18.00,
    "category_id": "uuid",
    "category_name": "Plats Principaux",
    "spice_level": 2,
    "is_vegetarian": false,
    "is_vegan": false,
    "available": true
  }
]
```

### GET /menu/categories

List all categories.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Entrées",
    "display_order": 1,
    "active": true,
    "item_count": 3
  }
]
```

### POST /menu

Create a new menu item. **Requires: admin or manager role.**

**Request:**
```json
{
  "name": "New Dish",
  "description": "Description here",
  "price": 15.00,
  "category_id": "uuid",
  "spice_level": 2,
  "is_vegetarian": false,
  "is_vegan": false
}
```

### PUT /menu/:id

Update a menu item. **Requires: admin or manager role.**

### PATCH /menu/:id/availability

Toggle item availability. **Requires: admin or manager role.**

---

## Orders

### GET /orders

List orders with filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status |
| `order_type` | string | dine_in, takeaway, delivery |
| `table_id` | string | Filter by table |
| `date_from` | string | ISO date start |
| `date_to` | string | ISO date end |
| `limit` | number | Results per page (default 50) |
| `offset` | number | Pagination offset |

**Response (200):**
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": 1,
      "table_id": "uuid",
      "table_number": 5,
      "order_type": "dine_in",
      "status": "preparing",
      "subtotal": 40.00,
      "tax_amount": 4.00,
      "discount_amount": 0,
      "total": 44.00,
      "staff_name": "Cashier",
      "items": [
        {
          "id": "uuid",
          "menu_item_id": "uuid",
          "name": "Butter Chicken du Chef",
          "quantity": 2,
          "unit_price": 18.00,
          "modifications": ["Extra spicy", "No cream"],
          "status": "preparing"
        }
      ],
      "created_at": "2026-04-06T12:00:00Z"
    }
  ],
  "total": 150
}
```

### POST /orders

Create a new order.

**Request:**
```json
{
  "table_id": "uuid",
  "order_type": "dine_in",
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2,
      "modifications": ["Extra spicy"],
      "notes": "No peanuts"
    }
  ],
  "notes": "Birthday celebration",
  "customer_name": "Jean Dupont"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "order_number": 42,
  "status": "pending",
  "total": 44.00,
  "...": "..."
}
```

### PATCH /orders/:id/status

Update order status.

**Request:**
```json
{
  "status": "preparing"
}
```

Valid transitions:
- `pending` → `preparing`
- `preparing` → `ready`
- `ready` → `served`
- `served` → `completed`
- Any → `cancelled`

### POST /orders/:id/items

Add items to an existing order.

**Request:**
```json
{
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 1
    }
  ]
}
```

### DELETE /orders/:id/items/:itemId

Remove an item from an order.

### PATCH /orders/:id/items/:itemId/status

Update individual item status (used by kitchen).

**Request:**
```json
{
  "status": "preparing"
}
```

---

## Tables

### GET /tables

List all tables with current order info.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "number": 5,
    "capacity": 4,
    "status": "occupied",
    "current_order_id": "uuid",
    "current_order_total": 44.00,
    "position_x": 200,
    "position_y": 100
  }
]
```

### PATCH /tables/:id/status

Update table status.

**Request:**
```json
{
  "status": "available"
}
```

---

## Payments

### POST /payments

Process a payment.

**Request:**
```json
{
  "order_id": "uuid",
  "amount": 44.00,
  "method": "cash",
  "tip_amount": 5.00,
  "amount_tendered": 55.00
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "order_id": "uuid",
  "amount": 44.00,
  "method": "cash",
  "status": "completed",
  "change_amount": 6.00,
  "tip_amount": 5.00,
  "receipt": {
    "restaurant_name": "Namaste GIEN",
    "order_number": 42,
    "items": [...],
    "total": 44.00,
    "...": "..."
  }
}
```

### POST /payments/:id/refund

Refund a payment. **Requires: admin or manager role.**

---

## Reports

### GET /reports/daily

**Query:** `?date=2026-04-06`

**Response:**
```json
{
  "date": "2026-04-06",
  "total_revenue": 1250.00,
  "order_count": 45,
  "avg_order_value": 27.78,
  "by_payment_method": {
    "cash": 450.00,
    "card": 650.00,
    "mobile": 150.00
  },
  "by_order_type": {
    "dine_in": 900.00,
    "takeaway": 250.00,
    "delivery": 100.00
  }
}
```

### GET /reports/popular-items

**Query:** `?from=2026-04-01&to=2026-04-06&limit=10`

**Response:**
```json
[
  {
    "menu_item_id": "uuid",
    "name": "Butter Chicken du Chef",
    "quantity_sold": 87,
    "revenue": 1566.00
  }
]
```

### GET /reports/peak-hours

**Response:**
```json
[
  { "hour": 12, "order_count": 15 },
  { "hour": 13, "order_count": 12 },
  { "hour": 19, "order_count": 20 },
  { "hour": 20, "order_count": 25 }
]
```

### GET /reports/category-revenue

**Response:**
```json
[
  {
    "category_id": "uuid",
    "category_name": "Plats Principaux",
    "revenue": 3200.00,
    "percentage": 42.5
  }
]
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Additional context (dev mode only)"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad Request — Invalid input |
| 401 | Unauthorized — Missing/invalid token |
| 403 | Forbidden — Insufficient role |
| 404 | Not Found — Resource doesn't exist |
| 500 | Internal Server Error |

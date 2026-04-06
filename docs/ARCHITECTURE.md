# Architecture

## Overview

Namaste POS is a full-stack monorepo application using npm workspaces. The system follows a client-server architecture with real-time communication via WebSockets.

## System Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     POS Terminals / Devices                   │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │   POS    │  │ Kitchen  │  │  Tables  │  │   Reports    │ │
│  │ Terminal │  │ Display  │  │   View   │  │  Dashboard   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘ │
│       └──────────────┼─────────────┼───────────────┘         │
│                      │                                        │
│              ┌───────┴──────────┐                             │
│              │   React Router   │                             │
│              └───────┬──────────┘                             │
│                      │                                        │
│       ┌──────────────┼──────────────┐                        │
│       │              │              │                         │
│  ┌────┴─────┐  ┌─────┴────┐  ┌─────┴─────┐                  │
│  │  Zustand │  │  React   │  │ Socket.io │                  │
│  │  Stores  │  │  Query   │  │  Client   │                  │
│  └──────────┘  └──────────┘  └───────────┘                  │
│              React SPA (Vite)                                │
└──────────────────────┬───────────────────────────────────────┘
                       │
            HTTP REST + WebSocket
                       │
┌──────────────────────┼───────────────────────────────────────┐
│                      │     Express Server                     │
│              ┌───────┴──────────┐                             │
│              │   Middleware     │                             │
│              │  (Auth, CORS,   │                             │
│              │   Validation)   │                             │
│              └───────┬──────────┘                             │
│                      │                                        │
│  ┌───────────────────┼────────────────────────┐              │
│  │          API Routes (/api/*)               │              │
│  │  auth | menu | orders | tables | payments  │              │
│  │                 reports                     │              │
│  └───────────────────┬────────────────────────┘              │
│                      │                                        │
│  ┌───────────────────┼────────────────────────┐              │
│  │           Service Layer                     │              │
│  │  OrderService | KitchenService             │              │
│  │  PaymentService | ReportService            │              │
│  └───────────────────┬────────────────────────┘              │
│                      │                                        │
│  ┌───────────────────┼────────────────────────┐              │
│  │         SQLite (better-sqlite3)            │              │
│  │      WAL mode | Foreign keys enabled       │              │
│  └────────────────────────────────────────────┘              │
│                                                               │
│  ┌────────────────────────────────────────────┐              │
│  │           Socket.io Server                  │              │
│  │  order:new | order:update | order:ready     │              │
│  │  table:update                               │              │
│  └────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### Order Lifecycle

```
1. Cashier creates order (POS terminal)
   └─→ POST /api/orders
       └─→ OrderService.createOrder()
           ├─→ Insert into orders + order_items tables
           ├─→ Update table status to 'occupied'
           └─→ Socket.io emit 'order:new'
               └─→ Kitchen display shows new order ticket

2. Kitchen starts preparing
   └─→ PATCH /api/orders/:id/status { status: 'preparing' }
       └─→ Socket.io emit 'order:update'

3. Kitchen marks ready
   └─→ PATCH /api/orders/:id/status { status: 'ready' }
       └─→ Socket.io emit 'order:ready'
           └─→ POS terminal shows notification + sound

4. Payment processed
   └─→ POST /api/payments
       ├─→ PaymentService.processPayment()
       ├─→ Order status → 'completed'
       ├─→ Table status → 'needs_cleaning'
       └─→ Socket.io emit 'table:update'
```

## Database Schema

### Entity Relationship

```
users
  id (PK)
  name, pin, role, active

categories
  id (PK)
  name, display_order, active

menu_items
  id (PK)
  category_id (FK → categories)
  name, description, price
  spice_level, is_vegetarian, is_vegan
  available

tables
  id (PK)
  number, capacity, status
  current_order_id (FK → orders)
  position_x, position_y

orders
  id (PK)
  order_number, table_id (FK → tables)
  order_type, status
  subtotal, tax_amount, discount_amount, total
  staff_id (FK → users)

order_items
  id (PK)
  order_id (FK → orders)
  menu_item_id (FK → menu_items)
  quantity, unit_price, modifications, notes
  status

payments
  id (PK)
  order_id (FK → orders)
  amount, method, status
  reference, change_amount, tip_amount
```

## State Management

### Client-Side

- **Zustand** for local UI state (cart, auth, real-time data)
- **React Query** for server state (menu items, orders list, reports)
- **Socket.io** for real-time updates pushed into Zustand stores

### Auth Flow

```
PIN Entry → POST /api/auth/login → JWT Access Token + Refresh Token
                                     ├─→ Stored in localStorage
                                     └─→ Attached to all API requests
                                          via Axios interceptor
Token Expired → Axios 401 interceptor → POST /api/auth/refresh
                                          └─→ New tokens → Retry request
```

## Security

- **PIN Authentication**: 4-digit PINs hashed with bcrypt (10 rounds)
- **JWT Tokens**: Short-lived access tokens (8h) + long-lived refresh tokens (7d)
- **Role-Based Access**: Admin > Manager > Cashier > Kitchen
- **CORS**: Restricted to CLIENT_URL origin
- **Input Validation**: Zod schemas on all API inputs

## Real-Time Communication

Socket.io is used for pushing updates to all connected clients:

- Kitchen displays receive new orders instantly
- POS terminals receive "order ready" notifications with sound
- Table status updates propagate to all viewing clients
- No polling required — all updates are push-based

## Performance

- **SQLite WAL mode**: Allows concurrent reads during writes
- **better-sqlite3**: Synchronous, faster than async alternatives for SQLite
- **React Query caching**: Reduces redundant API calls
- **Zustand**: Minimal re-renders with selective subscriptions
- **Vite**: Fast HMR in development, optimized builds in production

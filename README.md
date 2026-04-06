# Namaste POS — Restaurant Point of Sale System

A production-ready, touch-friendly Point of Sale system built for **Namaste GIEN**, a premium Indian restaurant in the Loire Valley, France. Real-time order management, kitchen display, table tracking, and payment processing — all in one system.

![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![React](https://img.shields.io/badge/React-18.3-61DAFB)
![Express](https://img.shields.io/badge/Express-4.18-green)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-black)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **POS Terminal** — Touch-friendly split-screen interface with menu grid and live cart
- **Kitchen Display System (KDS)** — Real-time Kanban board with timer-based order tracking
- **Table Management** — Visual floor plan with status tracking and order linkage
- **Payment Processing** — Cash, card, and mobile payments with bill splitting and discounts
- **Reports & Analytics** — Daily/weekly/monthly sales, popular items, peak hours, category revenue
- **PIN-based Auth** — Fast staff login with role-based access (Admin, Manager, Cashier, Kitchen)
- **Real-time Updates** — Socket.io-powered live sync across all terminals
- **Receipt Generation** — Thermal printer-ready receipt formatting
- **Dark Theme** — Eye-friendly dark UI optimized for restaurant lighting

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand (local), React Query (server) |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) — migration-ready for PostgreSQL |
| Real-time | Socket.io |
| Auth | JWT + bcrypt (PIN-based) |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React SPA)                    │
│  ┌──────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌───────┐  │
│  │ POS  │ │ Kitchen │ │ Tables │ │Reports │ │ Admin │  │
│  └──┬───┘ └────┬────┘ └───┬────┘ └───┬────┘ └───┬───┘  │
│     │          │           │          │          │       │
│  ┌──┴──────────┴───────────┴──────────┴──────────┴───┐  │
│  │         Zustand Stores + React Query Cache         │  │
│  └──────────────────┬────────────────────────────────┘  │
│                     │ HTTP + WebSocket                   │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────┐
│                     │    Server (Express + Socket.io)    │
│  ┌──────────────────┴────────────────────────────────┐  │
│  │                   API Routes                       │  │
│  │  /auth  /menu  /orders  /tables  /payments /reports│  │
│  └──┬───────────────────────────────────────────────┘   │
│     │                                                   │
│  ┌──┴────────────────────────────────────────────────┐  │
│  │              Service Layer                         │  │
│  │  OrderService  KitchenService  PaymentService      │  │
│  └──┬────────────────────────────────────────────────┘  │
│     │                                                   │
│  ┌──┴────────────────────────────────────────────────┐  │
│  │           SQLite Database (WAL mode)               │  │
│  │  users | menu_items | orders | tables | payments   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### Option 1: Manual Setup

```bash
# Clone the repository
git clone <repo-url>
cd namaste-pos

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run database migrations and seed data
npm run migrate
npm run seed

# Start development servers (backend + frontend)
npm run dev
```

The POS will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

### Option 2: Docker

```bash
# Copy environment variables
cp .env.example .env

# Build and start
docker-compose up --build
```

### Default Login PINs

| Role | PIN | Access |
|------|-----|--------|
| Admin | 1234 | Full access |
| Manager | 5678 | Menu, orders, reports |
| Cashier | 1111 | POS, orders, payments |
| Kitchen | 2222 | Kitchen display only |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment |
| `DATABASE_URL` | `./data/pos.db` | SQLite database path |
| `JWT_SECRET` | — | JWT signing secret (required) |
| `JWT_REFRESH_SECRET` | — | Refresh token secret (required) |
| `JWT_EXPIRES_IN` | `8h` | Access token expiry |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin |
| `TAX_RATE` | `0.10` | Tax rate (10% TVA France) |

## API Endpoints

### Authentication
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Login with PIN | No |
| POST | `/api/auth/refresh` | Refresh tokens | No |
| GET | `/api/auth/me` | Current user | Yes |

### Menu
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/menu` | List menu items | Yes |
| GET | `/api/menu/categories` | List categories | Yes |
| GET | `/api/menu/:id` | Get menu item | Yes |
| POST | `/api/menu` | Create menu item | Admin/Manager |
| PUT | `/api/menu/:id` | Update menu item | Admin/Manager |
| PATCH | `/api/menu/:id/availability` | Toggle availability | Admin/Manager |

### Orders
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/orders` | List orders (filterable) | Yes |
| GET | `/api/orders/:id` | Get order details | Yes |
| POST | `/api/orders` | Create new order | Yes |
| PUT | `/api/orders/:id` | Update order | Yes |
| PATCH | `/api/orders/:id/status` | Update status | Yes |
| POST | `/api/orders/:id/items` | Add items | Yes |
| DELETE | `/api/orders/:id/items/:itemId` | Remove item | Yes |

### Tables
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/tables` | List all tables | Yes |
| GET | `/api/tables/:id` | Get table details | Yes |
| PATCH | `/api/tables/:id/status` | Update status | Yes |
| PUT | `/api/tables/:id` | Update table config | Admin |

### Payments
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/payments` | Process payment | Yes |
| GET | `/api/payments/order/:orderId` | Get order payments | Yes |
| POST | `/api/payments/:id/refund` | Refund payment | Admin/Manager |

### Reports
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/reports/daily` | Daily summary | Admin/Manager |
| GET | `/api/reports/weekly` | Weekly summary | Admin/Manager |
| GET | `/api/reports/monthly` | Monthly summary | Admin/Manager |
| GET | `/api/reports/popular-items` | Top selling items | Admin/Manager |
| GET | `/api/reports/peak-hours` | Orders by hour | Admin/Manager |
| GET | `/api/reports/category-revenue` | Revenue by category | Admin/Manager |

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `order:new` | Server → Client | New order placed |
| `order:update` | Server → Client | Order status changed |
| `order:ready` | Server → Client | Order ready for serving |
| `table:update` | Server → Client | Table status changed |

## Project Structure

```
├── packages/
│   ├── server/          # Express API + Socket.io
│   │   ├── src/
│   │   │   ├── config/     # Database & environment config
│   │   │   ├── db/         # Migrations & seed data
│   │   │   ├── middleware/  # Auth, validation, error handling
│   │   │   ├── models/     # TypeScript interfaces
│   │   │   ├── routes/     # API route handlers
│   │   │   ├── services/   # Business logic
│   │   │   ├── socket/     # Real-time event handlers
│   │   │   └── utils/      # Helpers & receipt generation
│   │   └── tests/
│   └── client/          # React SPA
│       └── src/
│           ├── api/        # Axios API clients
│           ├── components/ # UI components
│           ├── hooks/      # Custom React hooks
│           ├── pages/      # Route pages
│           ├── store/      # Zustand state stores
│           ├── styles/     # Global styles
│           └── types/      # TypeScript definitions
└── docs/                # Documentation
```

## Development

```bash
# Start both servers in development mode
npm run dev

# Run only the backend
npm run dev:server

# Run only the frontend
npm run dev:client

# Run tests
npm test

# Build for production
npm run build
```

## Deployment

### Production Build

```bash
npm run build
NODE_ENV=production npm start
```

The server will serve the built client from `packages/client/dist/`.

### Docker Deployment

```bash
docker-compose -f docker-compose.yml up -d
```

## Menu Data

The system comes pre-seeded with the full Namaste GIEN menu:

- **Entrées**: Samosa de Canard Confit, Pakora de Légumes, Soupe Mulligatawny
- **Plats Principaux**: Butter Chicken, Agneau Rogan Josh, Palak Paneer, Crevettes Malabar
- **Tandoori & Grillades**: Mixed Grill, Paneer Tikka
- **Biryani & Riz**: Biryani Royal, Biryani Végétarien
- **Desserts**: Gulab Jamun au Cognac, Kulfi à la Lavande, Crème Brûlée au Cardamome
- **Bar & Cocktails**: Mango Lassi Royale, Loire Sunset, Masala Old Fashioned, Chai Espresso Martini

## License

MIT — see [LICENSE](./LICENSE)

---

Built with care for **Namaste GIEN — Restaurant Indien** | Gien, Loire Valley, France

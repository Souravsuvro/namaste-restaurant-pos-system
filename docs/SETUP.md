# Setup Guide

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone <repo-url>
cd namaste-pos
```

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for both the server and client packages using npm workspaces.

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your secrets:

```env
JWT_SECRET=your-secure-random-string-here
JWT_REFRESH_SECRET=another-secure-random-string-here
```

All other defaults are suitable for development.

### 4. Initialize Database

```bash
# Run migrations to create tables
npm run migrate

# Seed with Namaste GIEN menu data and default users
npm run seed
```

### 5. Start Development Servers

```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:3001 (Express + Socket.io)
- **Frontend**: http://localhost:5173 (Vite dev server)

## Default Login Credentials

| Role | Name | PIN |
|------|------|-----|
| Admin | Admin | 1234 |
| Manager | Manager | 5678 |
| Cashier | Cashier | 1111 |
| Kitchen | Kitchen | 2222 |

## Docker Setup

### Build and Run

```bash
cp .env.example .env
# Edit .env with your secrets
docker-compose up --build
```

### Services

- **server**: API + Socket.io on port 3001
- **client**: React app served by nginx on port 5173

## Database

The system uses SQLite by default, stored at the path specified by `DATABASE_URL` (default: `./data/pos.db`).

### WAL Mode

SQLite is configured with WAL (Write-Ahead Logging) mode for better concurrent read/write performance.

### Backup

```bash
# Simple backup
cp data/pos.db data/pos.db.backup

# Or use SQLite's built-in backup
sqlite3 data/pos.db ".backup 'data/pos.db.backup'"
```

### Reset Database

```bash
rm data/pos.db
npm run migrate
npm run seed
```

## Troubleshooting

### Port already in use

```bash
# Find and kill the process
lsof -i :3001
kill -9 <PID>
```

### Database locked

This can happen if multiple processes access the database. Ensure only one server instance is running. WAL mode reduces this significantly.

### CORS errors

Ensure `CLIENT_URL` in `.env` matches your frontend URL exactly (including port).

### Socket.io connection issues

The Vite dev server proxies `/socket.io` to the backend. If using a different setup, configure the Socket.io client URL explicitly.

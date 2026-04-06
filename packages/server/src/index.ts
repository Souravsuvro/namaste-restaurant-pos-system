import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config/env';
import { runMigration } from './db/migrations/001_initial';
import { setupSocketIO } from './socket/handlers';
import { errorHandler, notFoundHandler } from './middleware/error';

// Routes
import authRoutes from './routes/auth';
import menuRoutes from './routes/menu';
import orderRoutes from './routes/orders';
import tableRoutes from './routes/tables';
import paymentRoutes from './routes/payments';
import reportRoutes from './routes/reports';

// Run migration on startup
try {
  runMigration();
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

// Setup Socket.io
const io = setupSocketIO(httpServer);

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    restaurant: config.restaurant.name,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
httpServer.listen(config.port, () => {
  console.log(`
  =======================================
    Namaste GIEN - POS Server
  =======================================
    Environment: ${config.nodeEnv}
    Port:        ${config.port}
    Database:    ${config.databaseUrl}
    Client URL:  ${config.clientUrl}
  =======================================
  `);
});

export { app, httpServer, io };

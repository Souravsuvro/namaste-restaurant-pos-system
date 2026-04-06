import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config/env';

let io: SocketIOServer | null = null;

export function setupSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join kitchen room
    socket.on('join:kitchen', () => {
      socket.join('kitchen');
      console.log(`${socket.id} joined kitchen room`);
    });

    // Join staff room
    socket.on('join:staff', () => {
      socket.join('staff');
      console.log(`${socket.id} joined staff room`);
    });

    // Leave kitchen room
    socket.on('leave:kitchen', () => {
      socket.leave('kitchen');
      console.log(`${socket.id} left kitchen room`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io not initialized. Call setupSocketIO first.');
  }
  return io;
}

// Emit functions used by routes
export function emitOrderNew(order: unknown): void {
  if (io) {
    io.emit('order:new', order);
    io.to('kitchen').emit('kitchen:new-order', order);
  }
}

export function emitOrderUpdate(order: unknown): void {
  if (io) {
    io.emit('order:update', order);
    io.to('kitchen').emit('kitchen:order-update', order);
  }
}

export function emitOrderReady(order: unknown): void {
  if (io) {
    io.emit('order:ready', order);
    io.to('staff').emit('staff:order-ready', order);
  }
}

export function emitOrderItemUpdate(orderItem: unknown): void {
  if (io) {
    io.emit('order:item-update', orderItem);
    io.to('kitchen').emit('kitchen:item-update', orderItem);
  }
}

export function emitTableUpdate(table: unknown): void {
  if (io) {
    io.emit('table:update', table);
  }
}

export function emitPaymentProcessed(payment: unknown): void {
  if (io) {
    io.emit('payment:processed', payment);
  }
}

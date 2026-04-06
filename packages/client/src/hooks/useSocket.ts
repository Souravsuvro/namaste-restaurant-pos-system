import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useOrderStore } from '@/store/order-store';
import { useTableStore } from '@/store/table-store';
import type { Order } from '@/types/order';
import type { Table } from '@/types/table';

const SOCKET_URL = window.location.origin;

let notificationSound: HTMLAudioElement | null = null;

function playNotificationSound() {
  try {
    if (!notificationSound) {
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => {
        oscillator.frequency.value = 1000;
      }, 150);
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 300);
    }
  } catch {
    // Audio not available
  }
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { addOrder, updateOrder } = useOrderStore();
  const { updateTable } = useTableStore();

  useEffect(() => {
    const token = localStorage.getItem('pos-token');

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('order:new', (order: Order) => {
      addOrder(order);
      playNotificationSound();
    });

    socket.on('order:update', (order: Order) => {
      updateOrder(order);
    });

    socket.on('order:ready', (order: Order) => {
      updateOrder(order);
      playNotificationSound();
    });

    socket.on('table:update', (table: Table) => {
      updateTable(table);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [addOrder, updateOrder, updateTable]);

  return socketRef;
}

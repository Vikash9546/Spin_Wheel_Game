import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

let socket = null;

/**
 * Initialize Socket.IO connection with JWT token.
 * Calling again when already connected is a no-op.
 */
export function connectSocket(token) {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    query: { token },
    transports: ['websocket'],
    reconnectionAttempts: 8,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () =>
    console.log('[Socket] Connected:', socket.id)
  );
  socket.on('disconnect', (r) =>
    console.warn('[Socket] Disconnected:', r)
  );
  socket.on('connect_error', (e) =>
    console.error('[Socket] Error:', e.message)
  );

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}

export function joinWheelRoom(wheelId) {
  socket?.emit('joinWheelRoom', wheelId);
}

export function leaveWheelRoom(wheelId) {
  socket?.emit('leaveWheelRoom', wheelId);
}

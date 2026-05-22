import { useEffect } from 'react';
import { getSocket } from '../sockets/socket';
import { useSocketStore } from '../store/socket.store';

/**
 * Subscribe to a socket.io event inside a component.
 * Automatically unsubscribes on unmount.
 */
export function useSocketEvent(event, handler) {
  const { connected, socketId } = useSocketStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event, handler, connected, socketId]);
}

/**
 * Expose socket connection status.
 */
export function useSocketStatus() {
  const { connected, socketId } = useSocketStore();
  return { connected, socketId };
}

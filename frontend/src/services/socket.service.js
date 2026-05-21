import { getSocket, joinWheelRoom, leaveWheelRoom } from '../sockets/socket';
import { SOCKET_EVENTS } from '../utils/constants';

/**
 * Subscribe to a socket event. Returns an unsubscribe function.
 */
export function subscribeToEvent(event, handler) {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on(event, handler);
  return () => socket.off(event, handler);
}

export const SocketService = {
  joinRoom:  joinWheelRoom,
  leaveRoom: leaveWheelRoom,

  onWheelCreated:     (cb) => subscribeToEvent(SOCKET_EVENTS.WHEEL_CREATED, cb),
  onUserJoined:       (cb) => subscribeToEvent(SOCKET_EVENTS.USER_JOINED, cb),
  onGameStarted:      (cb) => subscribeToEvent(SOCKET_EVENTS.GAME_STARTED, cb),
  onPlayerEliminated: (cb) => subscribeToEvent(SOCKET_EVENTS.PLAYER_ELIMINATED, cb),
  onGameCompleted:    (cb) => subscribeToEvent(SOCKET_EVENTS.GAME_COMPLETED, cb),
  onWalletUpdated:    (cb) => subscribeToEvent(SOCKET_EVENTS.WALLET_UPDATED, cb),
  onGameAborted:      (cb) => subscribeToEvent(SOCKET_EVENTS.GAME_ABORTED, cb),
};

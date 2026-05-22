export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const WHEEL_STATUS = {
  WAITING:   'WAITING',
  STARTING:  'STARTING',
  RUNNING:   'RUNNING',
  COMPLETED: 'COMPLETED',
  ABORTED:   'ABORTED',
};

export const TXN_TYPE = {
  JOIN_DEBIT:     'JOIN_DEBIT',
  WIN_REWARD:     'WIN_REWARD',
  ADMIN_REWARD:   'ADMIN_REWARD',
  APP_COMMISSION: 'APP_COMMISSION',
  REFUND:         'REFUND',
};

export const SOCKET_EVENTS = {
  WHEEL_CREATED:      'wheelCreated',
  USER_JOINED:        'userJoined',
  GAME_STARTED:       'gameStarted',
  PLAYER_ELIMINATED:  'playerEliminated',
  GAME_COMPLETED:     'gameCompleted',
  WALLET_UPDATED:     'walletUpdated',
  GAME_ABORTED:       'gameAborted',
  JOIN_WHEEL_ROOM:    'joinWheelRoom',
  LEAVE_WHEEL_ROOM:   'leaveWheelRoom',
  WHEEL_STATE:        'wheelState',
};

export const ROUTES = {
  LOGIN:        '/login',
  DASHBOARD:    '/',
  SPIN_WHEEL:   '/wheel',
  WALLET:       '/wallet',
  TRANSACTIONS: '/transactions',
  HISTORY:      '/history',
  PROFILE:      '/profile',
};

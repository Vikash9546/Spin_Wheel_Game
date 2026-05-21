import { WHEEL_STATUS } from './constants';

/**
 * Derive badge color class based on wheel status.
 */
export function wheelStatusColor(status) {
  switch (status) {
    case WHEEL_STATUS.WAITING:   return 'text-primary border-primary/30 bg-primary/10';
    case WHEEL_STATUS.RUNNING:   return 'text-error border-error/30 bg-error/10';
    case WHEEL_STATUS.COMPLETED: return 'text-tertiary border-tertiary/30 bg-tertiary/10';
    case WHEEL_STATUS.ABORTED:   return 'text-on-muted border-outline bg-white/5';
    default:                     return 'text-on-muted border-outline';
  }
}

/**
 * Get remaining seconds until a target ISO timestamp.
 */
export function secondsUntil(isoTimestamp) {
  if (!isoTimestamp) return 0;
  return Math.max(0, Math.floor((new Date(isoTimestamp) - Date.now()) / 1000));
}

/**
 * Derive transaction icon and color.
 */
export function txnMeta(type) {
  const map = {
    WIN_REWARD:     { color: '#4cd6ff', sign: '+', label: 'Win Reward'      },
    JOIN_DEBIT:     { color: '#ecb2ff', sign: '-', label: 'Entry Fee'       },
    ADMIN_REWARD:   { color: '#ffda35', sign: '+', label: 'Admin Reward'    },
    APP_COMMISSION: { color: '#bbc9cf', sign: '+', label: 'Commission'      },
    REFUND:         { color: '#ffda35', sign: '+', label: 'Refund'          },
  };
  return map[type] || { color: '#bbc9cf', sign: '±', label: type };
}

/**
 * Parse error message from Axios error or plain Error.
 */
export function parseError(err) {
  return err?.response?.data?.error || err?.message || 'Something went wrong';
}

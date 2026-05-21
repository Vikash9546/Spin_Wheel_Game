/**
 * Format large coin numbers with locale separators.
 */
export function formatCoins(val) {
  if (val === null || val === undefined) return '0';
  return Number(val).toLocaleString('en-IN');
}

/**
 * Format ISO date strings to readable local format.
 */
export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a countdown in seconds to MM:SS.
 */
export function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Get initials from a display name.
 */
export function getInitials(name = '') {
  return name.slice(0, 2).toUpperCase() || 'PL';
}

/**
 * Return a signed string like +500 or -100.
 */
export function signedCoins(amount) {
  const n = Number(amount);
  return n >= 0 ? `+${formatCoins(n)}` : `-${formatCoins(Math.abs(n))}`;
}

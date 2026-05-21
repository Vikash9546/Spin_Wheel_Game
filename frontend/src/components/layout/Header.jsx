import { Link } from 'react-router-dom';
import { RiWalletLine, RiBellLine } from 'react-icons/ri';
import { useAuthStore } from '../../store/auth.store';
import { useWalletStore } from '../../store/wallet.store';
import { useSocketStore } from '../../store/socket.store';
import { formatCoins, getInitials } from '../../utils/formatters';
import Avatar from '../common/Avatar';

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const coins = useWalletStore((s) => s.coins);
  const connected = useSocketStore((s) => s.connected);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-6"
      style={{
        background: 'rgba(29,31,41,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 0 24px rgba(76,214,255,0.1)',
      }}
    >
      {/* Logo */}
      <Link to="/" className="font-sora font-black text-xl tracking-tighter grad-text no-underline">
        ELIMINATOR
      </Link>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Socket status dot */}
        <span
          title={connected ? 'Live' : 'Disconnected'}
          className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-blink' : 'bg-error/60'}`}
        />

        {/* Coin balance */}
        <div className="flex items-center gap-2 bg-surface-high px-4 py-1.5 rounded-full border border-outline">
          <RiWalletLine size={15} className="text-primary" />
          <span className="font-mono text-sm text-primary">{formatCoins(coins)}</span>
        </div>

        {/* Notifications placeholder */}
        <button className="text-on-muted hover:text-primary transition-colors">
          <RiBellLine size={18} />
        </button>

        {/* Avatar */}
        <Link to="/profile">
          <Avatar name={user?.name || 'Player'} size="sm" className="border-2 border-primary/40 cursor-pointer" />
        </Link>
      </div>
    </header>
  );
}

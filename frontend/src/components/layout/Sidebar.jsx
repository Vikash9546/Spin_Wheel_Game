import { Link, useNavigate } from 'react-router-dom';
import {
  RiDashboardLine, RiLiveLine, RiWalletLine,
  RiHistoryLine, RiUserLine, RiShieldLine, RiLogoutBoxLine,
} from 'react-icons/ri';
import { useAuthStore } from '../../store/auth.store';
import { useWalletStore } from '../../store/wallet.store';
import { disconnectSocket } from '../../sockets/socket';
import { formatCoins, getInitials } from '../../utils/formatters';
import Avatar from '../common/Avatar';
import NavLink from './NavLink';

const navItems = [
  { to: '/',             icon: RiDashboardLine, label: 'Dashboard'   },
  { to: '/wheel',        icon: RiLiveLine,      label: 'Live Wheel'  },
  { to: '/wallet',       icon: RiWalletLine,    label: 'Wallet'      },
];

const adminItems = [
  { to: '/admin', icon: RiShieldLine, label: 'Admin Panel' },
];

export default function Sidebar() {
  const { user, role, logout } = useAuthStore();
  const coins  = useWalletStore((s) => s.coins);
  const navigate = useNavigate();

  function handleLogout() {
    disconnectSocket();
    logout();
    navigate('/login');
  }

  return (
    <aside
      className="fixed top-[60px] left-0 w-64 h-[calc(100vh-60px)] flex flex-col z-40 hidden md:flex"
      style={{
        background: 'rgba(25,27,36,0.97)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* User profile block */}
      <div className="flex flex-col items-center gap-2 px-5 py-5 border-b border-outline">
        <Avatar name={user?.name || 'Player'} size="lg" />
        <p className="font-sora font-bold text-sm text-on-bg">{user?.name || 'Player'}</p>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
          <span className="text-[10px] font-mono font-bold uppercase text-on-muted">Balance</span>
          <span className="text-xs font-mono text-primary">{formatCoins(coins)}</span>
        </div>
        {role === 'admin' && (
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest bg-tertiary/15 text-tertiary px-2 py-0.5 rounded-full border border-tertiary/30">
            Admin
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => <NavLink key={item.to} {...item} />)}
        {role === 'admin' && adminItems.map((item) => <NavLink key={item.to} {...item} />)}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-outline flex flex-col gap-2">
        <Link
          to="/wheel"
          className="flex items-center justify-center gap-2 py-2.5 rounded-md font-mono text-[11px] font-bold uppercase tracking-widest
                     bg-grad-secondary text-white shadow-neon-secondary hover:brightness-110 transition-all"
        >
          QUICK SPIN
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 py-2 text-on-muted text-[11px] font-mono font-bold uppercase tracking-widest
                     hover:text-error transition-colors"
        >
          <RiLogoutBoxLine size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
}

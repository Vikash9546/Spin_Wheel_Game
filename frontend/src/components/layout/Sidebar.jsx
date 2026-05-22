import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  RiDashboardLine, RiLiveLine, RiWalletLine,
  RiHistoryLine, RiLogoutBoxLine, RiGamepadLine,
  RiArrowLeftRightLine
} from 'react-icons/ri';
import { useAuthStore } from '../../store/auth.store';
import { disconnectSocket } from '../../sockets/socket';

const navItems = [
  { to: '/',             icon: RiDashboardLine, label: 'Dashboard'   },
  { to: '/wheel',        icon: RiLiveLine,      label: 'Live Wheel'  },
  { to: '/wallet',       icon: RiWalletLine,    label: 'Wallet'      },
  { to: '/transactions', icon: RiArrowLeftRightLine, label: 'Transactions' },
  { to: '/history',      icon: RiHistoryLine,   label: 'History'     },
];

export default function Sidebar() {
  const { logout, role } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    disconnectSocket();
    logout();
    navigate('/login');
  }

  return (
    <aside
      className="fixed top-[64px] left-0 w-64 h-[calc(100vh-64px)] flex flex-col z-40 hidden md:flex bg-[#0b0d16] border-r border-white/[0.06]"
    >
      {/* Pro Gamer Badge at top */}
      <div className="px-5 py-6 border-b border-white/[0.04]">
        <div className="bg-[#121422] rounded-xl border border-white/[0.06] p-3 flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <div className="w-10 h-10 rounded-lg bg-[#1a1d30] border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(164,230,255,0.2)]">
            <RiGamepadLine size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-sora font-extrabold text-sm text-[#e1e1ef] m-0 truncate">Pro Gamer</h4>
            <span className="font-mono text-[9px] text-[#ff6b6b] font-black tracking-widest uppercase block mt-0.5">
              RANK: ELITE
            </span>
          </div>
        </div>
      </div>

      {/* Redesigned Esports Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to === '/' && location.pathname === '');
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-sora text-[13px] font-bold tracking-wide transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-primary/[0.08] to-transparent border border-primary/30 text-primary shadow-[0_0_15px_rgba(164,230,255,0.1)]'
                  : 'text-[#859399] border border-transparent hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-primary' : 'text-[#859399]'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions section */}
      <div className="p-5 border-t border-white/[0.04] flex flex-col gap-4">
        {/* Quick Spin Gradient Button */}
        <Link
          to="/wheel"
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-sora font-extrabold text-xs tracking-widest uppercase
                     bg-gradient-to-r from-[#cf5cff] via-[#845ef7] to-[#4cd6ff] text-white hover:brightness-110 active:scale-98 transition-all
                     shadow-[0_0_24px_rgba(132,94,247,0.35)]"
        >
          QUICK SPIN
        </Link>

        {/* Subtle Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 py-2 text-[#5a6a70] text-xs font-mono font-bold uppercase tracking-wider
                     hover:text-[#ff6b6b] transition-colors bg-transparent border-0 outline-none cursor-pointer"
        >
          <RiLogoutBoxLine size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
}

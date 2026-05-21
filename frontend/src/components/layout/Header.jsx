import { Link } from 'react-router-dom';
import { RiWalletLine, RiBellLine } from 'react-icons/ri';
import { useWalletStore } from '../../store/wallet.store';
import { useSocketStore } from '../../store/socket.store';
import { formatCoins } from '../../utils/formatters';

export default function Header() {
  const coins = useWalletStore((s) => s.coins);
  const connected = useSocketStore((s) => s.connected);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[64px] flex items-center justify-between px-8 bg-[#0b0d16]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
    >
      {/* Left side: Logo with pink glow */}
      <Link 
        to="/" 
        className="font-sora font-black text-2xl tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-[#ff7bf0] to-[#cf5cff] no-underline hover:opacity-90 transition-opacity"
        style={{
          filter: 'drop-shadow(0 0 10px rgba(236,178,255,0.4))'
        }}
      >
        ELIMINATOR
      </Link>

      {/* Right side: Wallet, notifications, profile */}
      <div className="flex items-center gap-6">
        {/* Socket status dot */}
        <span
          title={connected ? 'Live connection' : 'Offline'}
          className={`w-2.5 h-2.5 rounded-full ${
            connected ? 'bg-green-400 animate-blink shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
          }`}
        />

        {/* Coin balance / Wallet pill */}
        <div className="flex items-center gap-2 bg-[#0e111d] px-4 py-1.5 rounded-lg border border-[#1b2035] hover:border-primary/30 transition-colors">
          <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <RiWalletLine size={14} />
          </div>
          <span className="font-mono text-sm text-[#a4e6ff] font-bold tracking-wide">
            {formatCoins(coins)}
          </span>
        </div>

        {/* Notification Bell */}
        <button className="relative text-on-muted hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.03]">
          <RiBellLine size={20} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ff6b6b]" />
        </button>

        {/* Profile Avatar Card */}
        <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="relative">
            {/* Styled square/shield border avatar container */}
            <div className="w-9 h-9 rounded-lg border border-primary/40 overflow-hidden bg-primary/10 flex items-center justify-center p-[2px]">
              {/* Fallback cyberpunk styled portrait placeholder */}
              <svg viewBox="0 0 100 100" className="w-full h-full text-primary opacity-85">
                <path fill="currentColor" d="M50 20c-13.8 0-25 11.2-25 25 0 9.2 5 17.2 12.5 21.6-.3.9-.5 1.9-.5 3v13.4c0 3.9 3.1 7 7 7h12c3.9 0 7-3.1 7-7V69.6c0-1.1-.2-2.1-.5-3 7.5-4.4 12.5-12.4 12.5-21.6 0-13.8-11.2-25-25-25zm0 10c8.3 0 15 6.7 15 15S58.3 60 50 60s-15-6.7-15-15 6.7-15 15-15z"/>
                <circle cx="50" cy="45" r="8" fill="#080a12" />
                <path d="M40 73h20v4H40z" fill="#080a12" />
              </svg>
            </div>
            {/* Mini online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0b0d16]" />
          </div>
        </Link>
      </div>
    </header>
  );
}

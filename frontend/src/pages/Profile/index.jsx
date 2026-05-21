import { useAuthStore } from '../../store/auth.store';
import { useWalletStore } from '../../store/wallet.store';
import { formatCoins } from '../../utils/formatters';
import { RiUser3Line, RiShieldUserLine, RiCopperCoinLine, RiTrophyLine } from 'react-icons/ri';

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const coins = useWalletStore((s) => s.coins);

  return (
    <div className="w-full flex flex-col font-inter p-6 md:p-8 space-y-6 max-h-[calc(100vh-64px)] overflow-y-auto bg-[#080a12] text-[#e1e1ef]">
      {/* Page Header */}
      <div>
        <h1 className="font-sora font-extrabold text-3xl text-white tracking-wide m-0">
          User Command Center
        </h1>
        <p className="font-inter text-xs text-[#859399] m-0 mt-1 uppercase tracking-wider">
          Manage your gamer credentials and statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-[#0b0d16] rounded-2xl p-6 border border-white/[0.05] md:col-span-2 space-y-6">
          <div className="flex items-center gap-4.5 pb-6 border-b border-white/[0.04]">
            {/* Avatar squircle wrapper */}
            <div className="w-16 h-16 rounded-xl border-2 border-primary/30 overflow-hidden bg-primary/5 flex items-center justify-center p-1 shadow-[0_0_15px_rgba(164,230,255,0.15)]">
              <svg viewBox="0 0 100 100" className="w-full h-full text-primary opacity-85">
                <path fill="currentColor" d="M50 20c-13.8 0-25 11.2-25 25 0 9.2 5 17.2 12.5 21.6-.3.9-.5 1.9-.5 3v13.4c0 3.9 3.1 7 7 7h12c3.9 0 7-3.1 7-7V69.6c0-1.1-.2-2.1-.5-3 7.5-4.4 12.5-12.4 12.5-21.6 0-13.8-11.2-25-25-25zm0 10c8.3 0 15 6.7 15 15S58.3 60 50 60s-15-6.7-15-15 6.7-15 15-15z"/>
                <circle cx="50" cy="45" r="8" fill="#080a12" />
                <path d="M40 73h20v4H40z" fill="#080a12" />
              </svg>
            </div>
            <div>
              <h2 className="font-sora font-extrabold text-xl text-white m-0">{user?.name || 'Pro Gamer'}</h2>
              <span className="font-mono text-[9px] text-[#ff6b6b] font-black tracking-widest uppercase block mt-1">
                RANK: ELITE MATCHMAKER
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#121422]/40 rounded-xl p-3 border border-white/[0.03]">
              <span className="font-mono text-[9px] text-[#5a6a70] uppercase tracking-wider block mb-1">ACCOUNT ID</span>
              <span className="font-mono text-xs text-white font-bold block truncate">{user?.id || 'N/A'}</span>
            </div>
            <div className="bg-[#121422]/40 rounded-xl p-3 border border-white/[0.03]">
              <span className="font-mono text-[9px] text-[#5a6a70] uppercase tracking-wider block mb-1">JOINED DATE</span>
              <span className="font-mono text-xs text-white font-bold block">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'OCTOBER 2024'}
              </span>
            </div>
          </div>
        </div>

        {/* Security / Level block */}
        <div className="bg-[#0b0d16] rounded-2xl p-6 border border-white/[0.05] flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-sora font-extrabold text-sm text-white m-0 flex items-center gap-2">
              <RiShieldUserLine className="text-[#00d1ff] text-lg" />
              Gamer Security
            </h3>
            <p className="font-inter text-xs text-[#859399] leading-relaxed m-0">
              Your profile is verified under elite credentials. Double-layer encryption enforces 2FA tokens on high-volume transfers.
            </p>
          </div>
          <div className="bg-[#121422]/50 border border-white/[0.06] rounded-xl p-3 mt-4 text-center">
            <span className="font-mono text-[8px] text-green-400 font-extrabold uppercase tracking-widest block">
              STATUS VERIFIED
            </span>
          </div>
        </div>
      </div>

      {/* Stats list cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#0b0d16] rounded-2xl p-5 border border-white/[0.05] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <RiCopperCoinLine size={18} />
          </div>
          <div>
            <span className="font-mono text-[9px] text-[#859399] tracking-wider uppercase">BALANCE</span>
            <h4 className="font-sora font-extrabold text-lg text-white m-0 mt-0.5">{formatCoins(coins)}</h4>
          </div>
        </div>
        <div className="bg-[#0b0d16] rounded-2xl p-5 border border-white/[0.05] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#cf5cff]/10 flex items-center justify-center text-[#cf5cff] border border-[#cf5cff]/20">
            <RiUser3Line size={18} />
          </div>
          <div>
            <span className="font-mono text-[9px] text-[#859399] tracking-wider uppercase">TOTAL PLAYED</span>
            <h4 className="font-sora font-extrabold text-lg text-white m-0 mt-0.5">24 Games</h4>
          </div>
        </div>
        <div className="bg-[#0b0d16] rounded-2xl p-5 border border-white/[0.05] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#ffda35]/10 flex items-center justify-center text-[#ffda35] border border-[#ffda35]/20">
            <RiTrophyLine size={18} />
          </div>
          <div>
            <span className="font-mono text-[9px] text-[#859399] tracking-wider uppercase">TOTAL WINS</span>
            <h4 className="font-sora font-extrabold text-lg text-white m-0 mt-0.5">16 Wins</h4>
          </div>
        </div>
      </div>
    </div>
  );
}

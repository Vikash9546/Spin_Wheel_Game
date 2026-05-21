import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { RiLiveLine, RiTrophyLine, RiArrowRightLine } from 'react-icons/ri';
import { useWheel } from '../../hooks/useWheel';
import { useAuthStore } from '../../store/auth.store';
import { useWalletStore } from '../../store/wallet.store';
import { formatCoins, formatDate } from '../../utils/formatters';
import { wheelStatusColor } from '../../utils/helpers';
import { WHEEL_STATUS } from '../../utils/constants';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import WheelCanvas from '../../components/wheel/WheelCanvas';
import LiveEventFeed from '../../components/realtime/LiveEventFeed';

const MOCK_TXNS = [
  { label: 'Win #842',        amount: +500, date: '2024-10-24', type: 'WIN_REWARD'  },
  { label: 'Entry Fee',       amount: -100, date: '2024-10-24', type: 'JOIN_DEBIT'  },
  { label: 'Weekly Bonus',    amount: +250, date: '2024-10-23', type: 'WIN_REWARD'  },
  { label: 'Entry Fee',       amount: -100, date: '2024-10-22', type: 'JOIN_DEBIT'  },
  { label: 'Win #836',        amount: +320, date: '2024-10-21', type: 'WIN_REWARD'  },
];

const perfData = [
  { name: 'Win', value: 68, fill: '#4cd6ff' },
  { name: 'Loss', value: 32, fill: '#ffb4ab' },
];

export default function Dashboard() {
  const user  = useAuthStore((s) => s.user);
  const coins = useWalletStore((s) => s.coins);
  const { activeWheel, participants, fetchActiveWheel } = useWheel();

  useEffect(() => { fetchActiveWheel(); }, []);

  const isRunning = activeWheel?.status === WHEEL_STATUS.RUNNING;
  const isWaiting = activeWheel?.status === WHEEL_STATUS.WAITING;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-sora font-black text-4xl">
          Welcome, <span className="grad-text">{user?.name || 'Player'}</span>
        </h1>
        <p className="text-on-muted mt-1 text-sm">Your real-time multiplayer spin wheel dashboard.</p>
      </motion.div>

      {/* Top stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Current Balance" value={formatCoins(coins)} sub="coins" icon="💰" color="grad-text" />
        <StatCard label="Games Played"    value="24"  sub="all time"       icon="🎮" color="text-secondary" />
        <StatCard label="Total Wins"      value="16"  sub="67% win rate"   icon="🏆" color="text-tertiary" />
        <StatCard label="Net Profit"      value="+8.4K" sub="this month"   icon="📈" color="text-primary"  />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Active Wheel card */}
        <div className="glass-card rounded-lg p-5 lg:col-span-1 flex flex-col items-center gap-4 border-primary/20 animate-neon-pulse">
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-on-muted mb-1">Live Elimination</p>
              {activeWheel ? (
                <Badge variant={isRunning ? 'error' : 'primary'}>
                  {isRunning && <span className="w-1.5 h-1.5 bg-error rounded-full animate-blink" />}
                  {activeWheel.status}
                </Badge>
              ) : (
                <Badge variant="muted">NO ACTIVE WHEEL</Badge>
              )}
            </div>
            <RiLiveLine size={20} className="text-primary opacity-60" />
          </div>

          <WheelCanvas spinning={isRunning} size={180} />

          {activeWheel && (
            <div className="w-full grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/5 rounded-md p-2">
                <p className="text-[9px] font-mono uppercase text-on-muted">Prize Pool</p>
                <p className="font-mono text-primary text-sm">{formatCoins(activeWheel.winnerPool)}</p>
              </div>
              <div className="bg-white/5 rounded-md p-2">
                <p className="text-[9px] font-mono uppercase text-on-muted">Players</p>
                <p className="font-mono text-secondary text-sm">{participants.length}</p>
              </div>
            </div>
          )}

          <Link
            to="/wheel"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-mono text-[11px] font-bold uppercase tracking-widest bg-grad-secondary text-white shadow-neon-secondary hover:brightness-110 transition-all"
          >
            {activeWheel ? 'JOIN ROOM' : 'VIEW WHEEL'} <RiArrowRightLine />
          </Link>
        </div>

        {/* Performance chart */}
        <div className="glass-card rounded-lg p-5 lg:col-span-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-on-muted mb-4">Win / Loss Ratio</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={perfData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fill: '#bbc9cf', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#bbc9cf', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{ background: '#1d1f29', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${v}%`]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {perfData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-[11px] text-on-muted mt-2">You're in the top 5% of earners this week 🔥</p>
        </div>

        {/* Live Event Feed */}
        <div className="lg:col-span-1">
          <LiveEventFeed />
        </div>
      </div>

      {/* Recent transactions */}
      <div className="glass-card rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline bg-white/[0.02]">
          <h3 className="font-sora font-bold text-sm">Recent Transactions</h3>
          <Link to="/wallet" className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary hover:underline">
            VIEW ALL →
          </Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline">
              {['Transaction','Date','Amount'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-mono font-bold uppercase tracking-widest text-on-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_TXNS.map((t, i) => {
              const pos = t.amount >= 0;
              return (
                <tr key={i} className="border-b border-outline/50 hover:bg-white/[0.02] transition-colors last:border-0">
                  <td className="px-5 py-3.5 text-sm">{t.label}</td>
                  <td className="px-5 py-3.5 text-xs text-on-muted">{t.date}</td>
                  <td className={`px-5 py-3.5 font-mono font-bold text-sm ${pos ? 'text-primary' : 'text-secondary'}`}>
                    {pos ? '+' : ''}{formatCoins(t.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

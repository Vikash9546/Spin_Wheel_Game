import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { RiLiveLine, RiArrowRightLine } from 'react-icons/ri';
import { useWheel } from '../../hooks/useWheel';
import { useAuthStore } from '../../store/auth.store';
import { useWalletStore } from '../../store/wallet.store';
import { useStatsStore } from '../../store/stats.store';
import { formatCoins } from '../../utils/formatters';
import { WHEEL_STATUS } from '../../utils/constants';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { WalletService } from '../../services/wallet.service';
import WheelCanvas from '../../components/wheel/WheelCanvas';
import LiveEventFeed from '../../components/realtime/LiveEventFeed';

export default function Dashboard() {
  // ── Zustand Stores ──
  const user  = useAuthStore((s) => s.user);
  const coins = useWalletStore((s) => s.coins);
  const setCoins = useWalletStore((s) => s.setCoins);

  // Stats from Zustand store
  const gamesPlayed = useStatsStore((s) => s.gamesPlayed);
  const totalWins   = useStatsStore((s) => s.totalWins);
  const winRate     = useStatsStore((s) => s.winRate);
  const statsLoading = useStatsStore((s) => s.loading);
  const fetchStats   = useStatsStore((s) => s.fetchStats);
  const getPerfData     = useStatsStore((s) => s.getPerfData);
  const getSummaryText  = useStatsStore((s) => s.getSummaryText);
  const getFormattedProfit = useStatsStore((s) => s.getFormattedProfit);

  // Wheel store (via hook)
  const { activeWheel, participants, fetchActiveWheel } = useWheel();

  // ── Local state (page-specific, not shared) ──
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch fresh balance from server
  const fetchBalance = useCallback(async () => {
    try {
      const data = await WalletService.getSummary();
      if (data?.availableCoins !== undefined) {
        setCoins(data.availableCoins);
      }
    } catch (e) {
      console.error('Failed to fetch balance:', e);
    }
  }, [setCoins]);

  // Fetch recent transactions (page-local data)
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await WalletService.getTransactions();
      const data = raw.map((tx) => ({
        label: tx.type,
        amount: Number(tx.amount),
        date: new Date(tx.createdAt).toLocaleDateString(),
        type: tx.type,
      }));
      setTransactions(data);
    } catch (e) {
      setError(e.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch everything on mount ──
  useEffect(() => {
    fetchActiveWheel();
    fetchBalance();
    fetchStats();
    const timeout = setTimeout(fetchTransactions, 0);
    return () => clearTimeout(timeout);
  }, [fetchActiveWheel, fetchBalance, fetchStats, fetchTransactions]);

  // ── Re-fetch stats & transactions when coins change (real-time update) ──
  const prevCoinsRef = useRef(coins);
  useEffect(() => {
    if (prevCoinsRef.current !== coins && prevCoinsRef.current !== 0) {
      fetchStats();
      fetchTransactions();
    }
    prevCoinsRef.current = coins;
  }, [coins, fetchStats, fetchTransactions]);

  // ── Derived ──
  const isRunning = activeWheel?.status === WHEEL_STATUS.RUNNING;
  const perfData = getPerfData();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-sora font-black text-4xl">
          Welcome, <span className="grad-text">{user?.name || 'Player'}</span>
        </h1>
        <p className="text-on-muted mt-1 text-sm">Your real-time multiplayer spin wheel dashboard.</p>
      </motion.div>

      {/* Top stat row — ALL FROM ZUSTAND STORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Current Balance" value={formatCoins(coins)} sub="coins" icon="💰" color="grad-text" />
        <StatCard
          label="Games Played"
          value={statsLoading ? '...' : String(gamesPlayed)}
          sub="all time"
          icon="🎮"
          color="text-secondary"
        />
        <StatCard
          label="Total Wins"
          value={statsLoading ? '...' : String(totalWins)}
          sub={statsLoading ? '...' : `${winRate}% win rate`}
          icon="🏆"
          color="text-tertiary"
        />
        <StatCard
          label="Net Profit"
          value={statsLoading ? '...' : getFormattedProfit()}
          sub="from games"
          icon="📈"
          color="text-primary"
        />
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

        {/* Performance chart — FROM ZUSTAND STORE */}
        <div className="glass-card rounded-lg p-5 lg:col-span-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-on-muted mb-4">Win / Loss Ratio</p>
          {statsLoading ? (
            <div className="flex items-center justify-center h-[160px]">
              <p className="text-on-muted text-xs font-mono animate-pulse">Loading stats...</p>
            </div>
          ) : gamesPlayed === 0 ? (
            <div className="flex flex-col items-center justify-center h-[160px] gap-2">
              <p className="text-on-muted text-3xl">🎮</p>
              <p className="text-on-muted text-xs font-mono">No games played yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={perfData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fill: '#bbc9cf', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#bbc9cf', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#1d1f29', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v}%`]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {perfData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-center text-[11px] text-on-muted mt-2">{getSummaryText()}</p>
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
            {loading ? (
              <tr className="border-b border-outline/50">
                <td colSpan="3" className="px-5 py-3.5 text-center text-sm text-on-muted">
                  Loading transactions...
                </td>
              </tr>
            ) : error ? (
              <tr className="border-b border-outline/50">
                <td colSpan="3" className="px-5 py-3.5 text-center text-sm text-error">
                  {error}
                </td>
              </tr>
            ) : (
              transactions.slice(0, 8).map((t, i) => {
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

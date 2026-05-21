import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useWheel } from '../../hooks/useWheel';
import { useAuthStore } from '../../store/auth.store';
import { WheelService } from '../../services/wheel.service';
import { formatCoins } from '../../utils/formatters';
import { parseError } from '../../utils/helpers';
import { WHEEL_STATUS } from '../../utils/constants';
import WheelCanvas from '../../components/wheel/WheelCanvas';
import WinnerModal from '../../components/wheel/WinnerModal';

const AVATAR_COLORS = [
  '#4cd6ff', '#cf5cff', '#ffda35', '#ff6b6b', '#51cf66',
  '#748ffc', '#ffa94d', '#f06595', '#20c997', '#845ef7',
  '#fd7e14', '#15aabf',
];

export default function SpinWheel() {
  const { activeWheel, participants, fetchActiveWheel } = useWheel();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  const [joining,    setJoining]    = useState(false);
  const [starting,   setStarting]   = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [entryFee,   setEntryFee]   = useState(100);
  const [winnerOpen, setWinnerOpen] = useState(false);

  useEffect(() => { fetchActiveWheel(); }, []);

  const status         = activeWheel?.status || 'NO ACTIVE GAME';
  const isWaiting      = status === WHEEL_STATUS.WAITING;
  const isRunning      = status === WHEEL_STATUS.RUNNING;
  const isCompleted    = status === WHEEL_STATUS.COMPLETED;
  const hasJoined      = participants.some((p) => p.userId === user?.id);
  const winner         = participants.find((p) => p.isWinner);
  const isCreator      = activeWheel?.createdBy === user?.id;

  const totalPlayers    = activeWheel?.maxParticipants || 12;
  const currentRound    = activeWheel?.currentRound || 0;
  const eliminatedList  = participants.filter(p => p.eliminatedAt).sort((a, b) => new Date(b.eliminatedAt) - new Date(a.eliminatedAt));
  const activeList      = participants.filter(p => !p.eliminatedAt);
  const eliminatedCount = eliminatedList.length;
  const remainingCount  = activeList.length;

  useEffect(() => {
    if (isCompleted && winner) setWinnerOpen(true);
  }, [isCompleted, winner]);

  async function join() {
    if (!activeWheel) return;
    setJoining(true);
    try {
      await WheelService.joinWheel(activeWheel.id);
      toast.success('Joined the wheel! 🎰');
      await fetchActiveWheel();
    } catch (err) { toast.error(parseError(err)); }
    finally { setJoining(false); }
  }

  async function start() {
    if (!activeWheel) return;
    setStarting(true);
    try {
      await WheelService.startWheel(activeWheel.id);
      toast.success('Wheel started! Elimination begins soon...');
      await fetchActiveWheel();
    } catch (err) { toast.error(parseError(err)); }
    finally { setStarting(false); }
  }

  async function create() {
    setCreating(true);
    try {
      await WheelService.createWheel(entryFee);
      toast.success('New wheel created!');
      await fetchActiveWheel();
    } catch (err) { toast.error(parseError(err)); }
    finally { setCreating(false); }
  }

  return (
    <div className="absolute inset-0 z-20 flex bg-[#080a12] overflow-hidden font-inter">
      {/* Scanline overlay for tech aesthetic */}
      <div className="scanline-overlay" />

      {/* ═══════════════════════════════════════════════ */}
      {/* LEFT SIDEBAR — Elimination Feed                */}
      {/* ═══════════════════════════════════════════════ */}
      <aside className="hidden lg:flex w-[300px] h-full flex-col border-r border-white/[0.06] bg-[#0b0d16]/95 backdrop-blur-xl z-10 overflow-hidden">
        {/* Round Progression Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex justify-between items-end mb-3">
            <h2 className="font-mono text-[10px] text-[#7a8a90] tracking-[0.15em] uppercase m-0 font-bold">
              Round Progression
            </h2>
            <span className="font-mono text-xs text-primary font-bold">
              {String(currentRound).padStart(2, '0')}/{totalPlayers}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-[#1a1d28] rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
              animate={{ width: `${totalPlayers > 0 ? (currentRound / totalPlayers) * 100 : 0}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ boxShadow: '0 0 12px rgba(164,230,255,0.3)' }}
            />
          </div>

          {/* Stats row */}
          <div className="flex gap-4">
            <div className="flex-1 bg-[#0f1119] rounded-xl p-3 border border-white/[0.04]">
              <p className="font-mono text-[9px] text-[#5a6a70] tracking-[0.15em] uppercase m-0 mb-1">REMAINING</p>
              <p className="font-sora text-2xl font-black text-on-surface m-0 leading-none">
                {String(remainingCount).padStart(2, '0')}
              </p>
            </div>
            <div className="flex-1 bg-[#0f1119] rounded-xl p-3 border border-white/[0.04]">
              <p className="font-mono text-[9px] text-[#5a6a70] tracking-[0.15em] uppercase m-0 mb-1">ELIMINATED</p>
              <p className="font-sora text-2xl font-black text-[#ff6b6b] m-0 leading-none">
                {String(eliminatedCount).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>

        {/* Elimination Feed */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h3 className="font-mono text-[10px] text-[#7a8a90] tracking-[0.15em] uppercase mb-3 m-0 font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ff6b6b] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              skull
            </span>
            Elimination Feed
          </h3>

          <div className="space-y-2">
            <AnimatePresence>
              {eliminatedList.slice(0, 8).map((p, i) => {
                const isLatest = i === 0 && isRunning;
                const playerIndex = participants.indexOf(p);
                const color = AVATAR_COLORS[playerIndex % AVATAR_COLORS.length] || '#ff6b6b';

                return (
                  <motion.div
                    key={p.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-xl border flex items-center gap-3 p-3 transition-all ${
                      isLatest
                        ? 'bg-[#2a1118] border-[#ff6b6b]/30 animate-elimination-pulse'
                        : 'bg-[#0f1119]/60 border-white/[0.04] opacity-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-sora font-bold text-xs border ${
                        isLatest ? 'border-[#ff6b6b]/40' : 'border-white/[0.06]'
                      }`}
                      style={{
                        background: isLatest ? 'rgba(255,107,107,0.15)' : 'rgba(50,52,62,0.3)',
                        color: isLatest ? '#ff6b6b' : '#555',
                      }}
                    >
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        skull
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-sora font-bold text-sm m-0 truncate ${
                        isLatest ? 'text-on-surface' : 'text-on-surface/50'
                      }`}>
                        {p.user?.name || 'Player'}
                      </p>
                      <p className={`font-mono text-[10px] m-0 uppercase tracking-wider ${
                        isLatest ? 'text-[#ff6b6b]' : 'text-[#ff6b6b]/40'
                      }`}>
                        OUT IN ROUND {p.eliminatedRound || '?'}
                      </p>
                    </div>

                    {isLatest && (
                      <div className="w-2 h-2 rounded-full bg-[#ff6b6b] animate-blink" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {eliminatedCount === 0 && (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-3xl text-white/10 mb-2 block">shield</span>
                <p className="text-xs text-[#5a6a70] font-mono">No eliminations yet</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════ */}
      {/* CENTER — Interactive Spin Wheel                */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">
        {/* Background ambient radials */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.02] blur-[100px]" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-secondary/[0.02] blur-[80px]" />
        </div>

        {/* Wheel */}
        <div className="w-full max-w-[480px] relative z-10">
          <WheelCanvas participants={participants} spinning={isRunning} status={status} />
        </div>

        {/* ── Bottom CTA Bar ── */}
        <div className="mt-6 w-full max-w-2xl glass-panel-heavy rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between border border-white/[0.06] gap-4 relative z-10">
          {/* Left — Info section */}
          <div className="flex items-center gap-5">
            <div className="flex flex-col">
              <p className="font-mono text-[9px] text-[#5a6a70] m-0 tracking-[0.15em] uppercase">ENTRY FEE</p>
              <p className="font-mono text-lg text-primary m-0 font-bold">{formatCoins(activeWheel?.entryFee || entryFee)}</p>
            </div>
            <div className="h-8 w-px bg-white/[0.06]" />
            <div className="flex flex-col">
              <p className="font-mono text-[9px] text-[#5a6a70] m-0 tracking-[0.15em] uppercase">PRIZE POOL</p>
              <p className="font-mono text-lg text-tertiary m-0 font-bold">{formatCoins(activeWheel?.winnerPool || 0)}</p>
            </div>
            <div className="h-8 w-px bg-white/[0.06]" />
            <div className="flex flex-col">
              <p className="font-mono text-[9px] text-[#5a6a70] m-0 tracking-[0.15em] uppercase">PLAYERS</p>
              <p className="font-mono text-lg text-on-surface m-0 font-bold">
                {participants.length}<span className="text-[#5a6a70]">/{totalPlayers}</span>
              </p>
            </div>
          </div>

          {/* Right — Action buttons */}
          <div className="flex items-center gap-3">
            {!activeWheel && role === 'admin' && (
              <>
                <input
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number(e.target.value))}
                  className="w-20 bg-[#0f1119] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-center font-mono text-on-surface outline-none focus:border-primary/40 transition-colors"
                  placeholder="Fee"
                  min="1"
                />
                <button
                  onClick={create}
                  disabled={creating}
                  className="px-5 py-2.5 bg-[#1a1d28] text-on-surface font-mono text-xs font-bold rounded-lg border border-white/[0.08] hover:border-primary/30 hover:bg-[#1e2130] transition-all tracking-wider uppercase disabled:opacity-50"
                >
                  {creating ? 'CREATING...' : 'CREATE GAME'}
                </button>
              </>
            )}

            {activeWheel && isWaiting && !hasJoined && (
              <button
                onClick={join}
                disabled={joining}
                className="px-8 py-2.5 bg-[#1a1d28] text-on-surface font-mono text-xs font-bold rounded-lg border border-white/[0.08] hover:border-primary/30 hover:bg-[#1e2130] transition-all tracking-wider uppercase disabled:opacity-50"
              >
                {joining ? 'JOINING...' : 'CONFIRM JOIN'}
              </button>
            )}

            {activeWheel && isWaiting && (isCreator || role === 'admin') && (
              <button
                onClick={start}
                disabled={starting}
                className="px-6 py-2.5 bg-tertiary/10 text-tertiary font-mono text-xs font-bold rounded-lg border border-tertiary/20 hover:bg-tertiary/20 transition-all tracking-wider uppercase disabled:opacity-50"
              >
                {starting ? 'STARTING...' : 'START WHEEL'}
              </button>
            )}

            {hasJoined && !isCompleted && isWaiting && (
              <div className="px-5 py-2.5 bg-[#0f1119] text-primary/60 font-mono text-xs font-bold rounded-lg border border-primary/10 tracking-wider flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-blink" />
                WAITING FOR OTHERS
              </div>
            )}

            {isRunning && (
              <div className="px-5 py-2.5 bg-[#0f1119] text-primary font-mono text-xs font-bold rounded-lg border border-primary/20 tracking-wider flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-blink" />
                GAME IN PROGRESS
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* RIGHT SIDEBAR — Player List                    */}
      {/* ═══════════════════════════════════════════════ */}
      <aside className="hidden lg:flex w-[300px] h-full flex-col border-l border-white/[0.06] bg-[#0b0d16]/95 backdrop-blur-xl z-10 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[10px] text-[#7a8a90] tracking-[0.15em] uppercase m-0 font-bold">
              Player List
            </h3>
            <span className="font-mono text-xs text-primary font-bold">
              {participants.length}/{totalPlayers}
            </span>
          </div>
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
          {/* Active Players */}
          {activeList.map((p, i) => {
            const isMe = p.userId === user?.id;
            const playerIndex = participants.indexOf(p);
            const color = AVATAR_COLORS[playerIndex % AVATAR_COLORS.length];
            const initials = p.user?.name ? p.user.name.substring(0, 2).toUpperCase() : 'P';

            return (
              <motion.div
                key={p.userId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`p-2.5 rounded-xl flex items-center gap-3 transition-all ${
                  isMe
                    ? 'bg-primary/[0.06] border border-primary/20'
                    : 'bg-[#0f1119]/40 border border-transparent hover:border-white/[0.04] hover:bg-[#0f1119]/60'
                }`}
              >
                {/* Avatar squircle */}
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-sora font-bold text-xs border-2 ${
                      isMe ? 'border-primary/60' : 'border-white/[0.08]'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${color}22, ${color}0a)`,
                      color: color,
                      boxShadow: isMe ? `0 0 16px ${color}33` : 'none',
                    }}
                  >
                    {initials}
                  </div>
                  {isMe && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-md border-2 border-[#0b0d16]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-sora font-bold text-sm text-on-surface m-0 truncate">
                      {p.user?.name || 'Player'}
                    </p>
                    {isMe && (
                      <span className="font-mono text-[9px] text-primary font-bold tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  {/* Win probability / health bar */}
                  <div className="w-full h-1 bg-[#1a1d28] rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(10, 100 - (currentRound * 5))}%`,
                        background: `linear-gradient(90deg, ${color}99, ${color}44)`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Eliminated separator */}
          {eliminatedCount > 0 && (
            <div className="pt-3 pb-1.5 flex items-center gap-2">
              <div className="flex-1 h-px bg-[#ff6b6b]/10" />
              <p className="font-mono text-[9px] text-[#ff6b6b]/40 m-0 uppercase tracking-[0.15em] font-bold">
                ELIMINATED
              </p>
              <div className="flex-1 h-px bg-[#ff6b6b]/10" />
            </div>
          )}

          {/* Eliminated Players */}
          {eliminatedList.map((p) => {
            const initials = p.user?.name ? p.user.name.substring(0, 2).toUpperCase() : 'P';
            return (
              <div
                key={p.userId}
                className="p-2.5 rounded-xl opacity-35 flex items-center gap-3 bg-[#ff6b6b]/[0.03] border border-[#ff6b6b]/[0.06]"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-sora font-bold text-xs border border-[#ff6b6b]/10 bg-[#ff6b6b]/5 text-[#ff6b6b]/40">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sora font-bold text-sm text-on-surface m-0 truncate line-through">
                    {p.user?.name || 'Player'}
                  </p>
                  <p className="font-mono text-[9px] text-[#ff6b6b]/50 m-0 uppercase tracking-wider">ELIMINATED</p>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {participants.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-white/[0.06] block mb-2">group</span>
              <p className="text-xs text-[#5a6a70] font-mono">No players yet</p>
            </div>
          )}
        </div>
      </aside>

      {/* Winner modal */}
      <WinnerModal
        open={winnerOpen}
        winner={winner?.user || { userId: winner?.userId }}
        prizePool={activeWheel?.winnerPool}
        onClose={() => setWinnerOpen(false)}
      />
    </div>
  );
}

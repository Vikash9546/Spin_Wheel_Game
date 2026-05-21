import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useWheel } from '../../hooks/useWheel';
import { useAuthStore } from '../../store/auth.store';
import { useSocketStore } from '../../store/socket.store';
import { WheelService } from '../../services/wheel.service';
import { formatCoins } from '../../utils/formatters';
import { parseError } from '../../utils/helpers';
import { WHEEL_STATUS } from '../../utils/constants';
import WheelCanvas from '../../components/wheel/WheelCanvas';
import WinnerModal from '../../components/wheel/WinnerModal';
import { RiUserLine, RiSkullLine, RiShieldLine } from 'react-icons/ri';

const AVATAR_COLORS = [
  '#4cd6ff', '#cf5cff', '#ffda35', '#ff6b6b', '#51cf66',
  '#748ffc', '#ffa94d', '#f06595', '#20c997', '#845ef7',
  '#fd7e14', '#15aabf',
];

// Mini custom vector render matching the core canvas avatars for unified design
function MiniCyberpunkAvatar({ index, isActive }) {
  const primaryColor = isActive ? '#4cd6ff' : '#5a6a70';
  const secondaryColor = isActive ? '#cf5cff' : '#3c494e';
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];

  const renderDesign = () => {
    switch (index % 12) {
      case 0:
        return <rect x="25" y="42" width="50" height="16" rx="3" fill={primaryColor} />;
      case 1:
        return <path d="M30 65 L50 35 L70 65 Z" fill={primaryColor} />;
      case 2:
        return <rect x="30" y="38" width="40" height="24" rx="2" fill={secondaryColor} stroke={primaryColor} strokeWidth="2" />;
      case 3:
        return <circle cx="50" cy="50" r="16" fill={secondaryColor} stroke={primaryColor} strokeWidth="3" />;
      case 4:
        return <polygon points="30,65 70,65 50,30" fill={primaryColor} />;
      case 5:
        return <circle cx="50" cy="50" r="18" fill={primaryColor} stroke="#000" strokeWidth="2" />;
      case 6:
        return <rect x="25" y="45" width="50" height="10" rx="2" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />;
      case 7:
        return <polygon points="35,35 65,35 50,65" fill={primaryColor} />;
      case 8:
        return <line x1="50" y1="20" x2="50" y2="80" stroke={primaryColor} strokeWidth="8" strokeLinecap="round" />;
      case 9:
        return <ellipse cx="50" cy="50" rx="20" ry="10" fill={secondaryColor} stroke={primaryColor} strokeWidth="2" />;
      case 10:
        return <path d="M30 40 H70 V60 H30 Z" fill={primaryColor} opacity="0.8" />;
      default:
        return <circle cx="50" cy="50" r="14" fill="#000" stroke={primaryColor} strokeWidth="3" />;
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full object-cover"
      style={{
        background: `linear-gradient(135deg, ${isActive ? '#13192f' : '#11131c'} 0%, #06070a 100%)`,
      }}
    >
      {renderDesign()}
      <rect x="3" y="3" width="94" height="94" rx="10" fill="none" stroke={isActive ? color : 'rgba(255,255,255,0.06)'} strokeWidth="2" />
    </svg>
  );
}

export default function SpinWheel() {
  const { activeWheel, participants, fetchActiveWheel } = useWheel();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const connected = useSocketStore((s) => s.connected);

  const [joining,    setJoining]    = useState(false);
  const [starting,   setStarting]   = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [entryFee,   setEntryFee]   = useState(50);
  const [dismissedWinnerId, setDismissedWinnerId] = useState(null);

  useEffect(() => { fetchActiveWheel(); }, [fetchActiveWheel]);

  const status         = activeWheel?.status || 'NO ACTIVE GAME';
  const isWaiting      = status === WHEEL_STATUS.WAITING;
  const isRunning      = status === WHEEL_STATUS.RUNNING;
  const isCompleted    = status === WHEEL_STATUS.COMPLETED;
  const hasJoined      = participants.some((p) => p.userId === user?.id);
  const winner         = participants.find((p) => p.isWinner);
  const winnerId       = winner?.userId ?? winner?.user?.id ?? activeWheel?.winnerId ?? null;
  const showWinnerModal = isCompleted && !!winner && dismissedWinnerId !== winnerId;
  const isCreator      = activeWheel?.createdBy === user?.id;

  const totalPlayers    = activeWheel?.maxParticipants || 12;
  const currentRound    = activeWheel?.currentRound || 0;
  const eliminatedList  = participants.filter(p => p.eliminatedAt).sort((a, b) => new Date(b.eliminatedAt) - new Date(a.eliminatedAt));
  const activeList      = participants.filter(p => !p.eliminatedAt);
  const eliminatedCount = eliminatedList.length;
  const remainingCount  = activeList.length;

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
    <div className="absolute inset-0 flex bg-[#080a12] overflow-hidden font-inter">
      {/* Scanline overlay for esports tech theme */}
      <div className="scanline-overlay" />

      {/* ═══════════════════════════════════════════════ */}
      {/* LEFT INNER PANE — Round & Elimination Feed     */}
      {/* ═══════════════════════════════════════════════ */}
      <aside className="hidden lg:flex w-[290px] h-full flex-col border-r border-white/[0.06] bg-[#0b0d16] z-10 overflow-hidden">
        {/* Round Progression Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.04]">
          <div className="flex justify-between items-end mb-3">
            <h2 className="font-mono text-[9px] text-[#859399] tracking-[0.2em] uppercase m-0 font-extrabold">
              Round Progression
            </h2>
            <span className="font-mono text-xs text-primary font-bold">
              {String(currentRound).padStart(2, '0')}/{String(totalPlayers).padStart(2, '0')}
            </span>
          </div>

          {/* Sleek thin cyan progress bar */}
          <div className="h-1 bg-[#151824] rounded-full overflow-hidden mb-5">
            <motion.div
              className="h-full bg-[#00d1ff] rounded-full"
              animate={{ width: `${totalPlayers > 0 ? (currentRound / totalPlayers) * 100 : 0}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ boxShadow: '0 0 12px rgba(0,209,255,0.7)' }}
            />
          </div>

          {/* Stats Box row */}
          <div className="flex gap-4">
            <div className="flex-1 bg-[#0e111d] rounded-xl p-3.5 border border-white/[0.04] text-center">
              <p className="font-mono text-[8px] text-[#5a6a70] tracking-[0.2em] uppercase m-0 mb-1 font-bold">REMAINING</p>
              <p className="font-sora text-2xl font-black text-white m-0 leading-none">
                {String(remainingCount).padStart(2, '0')}
              </p>
            </div>
            <div className="flex-1 bg-[#0e111d] rounded-xl p-3.5 border border-white/[0.04] text-center">
              <p className="font-mono text-[8px] text-[#5a6a70] tracking-[0.2em] uppercase m-0 mb-1 font-bold">ELIMINATED</p>
              <p className="font-sora text-2xl font-black text-[#ff6b6b] m-0 leading-none">
                {String(eliminatedCount).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>

        {/* Elimination Feed List */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <h3 className="font-mono text-[9px] text-[#859399] tracking-[0.2em] uppercase mb-4 m-0 font-extrabold flex items-center gap-2">
            <RiSkullLine className="text-[#ff6b6b] text-base" />
            Elimination Feed
          </h3>

          <div className="space-y-3">
            <AnimatePresence>
              {eliminatedList.map((p, i) => {
                const isLatest = i === 0 && isRunning;
                const playerIndex = participants.indexOf(p);
                return (
                  <motion.div
                    key={p.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`rounded-xl border flex items-center gap-3 p-3 transition-all ${
                      isLatest
                        ? 'bg-[#2a1118] border-[#ff6b6b]/40 shadow-[0_0_15px_rgba(255,107,107,0.15)]'
                        : 'bg-[#0e111d]/60 border-white/[0.03] opacity-40'
                    }`}
                  >
                    {/* Avatar Badge */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                      <MiniCyberpunkAvatar index={playerIndex} isActive={false} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-sora font-extrabold text-xs m-0 truncate ${
                        isLatest ? 'text-white' : 'text-[#859399]'
                      }`}>
                        {p.user?.name || 'Player'}
                      </p>
                      <p className={`font-mono text-[9px] m-0 uppercase tracking-widest mt-0.5 ${
                        isLatest ? 'text-[#ff6b6b]' : 'text-[#ff6b6b]/50'
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
              <div className="text-center py-16">
                <RiShieldLine className="text-3xl text-white/5 mb-3 block mx-auto" />
                <p className="text-[10px] text-[#5a6a70] font-mono tracking-widest uppercase">No eliminations yet</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════ */}
      {/* CENTER PANE — Core Orbit Canvas & CTA Controls  */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="flex-1 relative flex flex-col items-center justify-between p-6 md:p-8 overflow-hidden bg-[#080a12]/50">
        {/* Background ambient neon radial glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-[#00d1ff]/[0.015] blur-[120px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full bg-[#cf5cff]/[0.01] blur-[100px] pointer-events-none" />
        </div>

        <div className="w-full flex-1 flex items-center justify-center">
          <div className="w-full max-w-[440px] relative z-10">
            <WheelCanvas participants={participants} spinning={isRunning} status={status} />
          </div>
        </div>

        {/* ── Sleek Bottom Esports CTA controller ── */}
        <div className="w-full max-w-[640px] bg-[#0c0e17]/90 backdrop-blur-xl rounded-2xl p-4.5 flex flex-col md:flex-row items-center justify-between border border-white/[0.05] gap-4 relative z-10 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {/* Left panel stats info section */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <p className="font-mono text-[8px] text-[#5a6a70] m-0 tracking-[0.2em] uppercase font-bold">ENTRY FEE</p>
              <p className="font-sora text-base text-[#00d1ff] m-0 font-extrabold mt-0.5">
                {formatCoins(activeWheel?.entryFee || entryFee)}
              </p>
            </div>
            <div className="h-8 w-px bg-white/[0.06]" />
            <div className="flex flex-col">
              <p className="font-mono text-[8px] text-[#5a6a70] m-0 tracking-[0.2em] uppercase font-bold">PRIZE POOL</p>
              <p className="font-sora text-base text-[#ffda35] m-0 font-extrabold mt-0.5">
                {formatCoins(activeWheel?.winnerPool || 0)}
              </p>
            </div>
            <div className="h-8 w-px bg-white/[0.06]" />
            <div className="flex flex-col">
              <p className="font-mono text-[8px] text-[#5a6a70] m-0 tracking-[0.2em] uppercase font-bold">PLAYERS</p>
              <p className="font-sora text-base text-white m-0 font-extrabold mt-0.5">
                {participants.length}<span className="text-[#5a6a70]">/{totalPlayers}</span>
              </p>
            </div>
          </div>

          {/* Middle Connection Indicator Dot */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-[#e9c400] animate-pulse shadow-[0_0_8px_rgba(233,196,0,0.6)]'}`} />
            <span className="font-mono text-[9px] text-[#859399] tracking-wider uppercase font-bold">
              {connected ? 'CONNECTED' : 'RECONNECTING...'}
            </span>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {!activeWheel && role === 'admin' && (
              <>
                <input
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number(e.target.value))}
                  className="w-16 bg-[#080a12] border border-white/[0.08] rounded-xl px-2 py-2 text-xs text-center font-mono text-white outline-none focus:border-[#00d1ff]/40 transition-colors"
                  placeholder="Fee"
                  min="1"
                />
                <button
                  onClick={create}
                  disabled={creating}
                  className="px-4 py-2 bg-[#222533] text-white font-sora text-[11px] font-extrabold rounded-xl border border-white/[0.06] hover:border-[#00d1ff]/30 hover:bg-[#272b3d] transition-all tracking-wider uppercase disabled:opacity-50"
                >
                  {creating ? 'CREATING...' : 'CREATE GAME'}
                </button>
              </>
            )}

            {activeWheel && isWaiting && !hasJoined && (
              <button
                onClick={join}
                disabled={joining}
                className="px-6 py-2.5 bg-[#222533] text-white font-sora text-[11px] font-extrabold rounded-xl border border-white/[0.08] hover:border-[#00d1ff]/40 hover:bg-[#272b3d] transition-all tracking-widest uppercase disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.02)]"
              >
                {joining ? 'JOINING...' : 'CONFIRM JOIN'}
              </button>
            )}

            {activeWheel && isWaiting && (isCreator || role === 'admin') && (
              <button
                onClick={start}
                disabled={starting}
                className="px-5 py-2.5 bg-[#ffda35]/15 text-[#ffda35] font-sora text-[11px] font-extrabold rounded-xl border border-[#ffda35]/30 hover:bg-[#ffda35]/25 transition-all tracking-wider uppercase disabled:opacity-50"
              >
                {starting ? 'STARTING...' : 'START WHEEL'}
              </button>
            )}

            {hasJoined && !isCompleted && isWaiting && (
              <div className="px-4 py-2 bg-[#0e111d] text-primary/60 font-mono text-[10px] font-bold rounded-xl border border-primary/10 tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-blink" />
                WAITING FOR OTHERS
              </div>
            )}

            {isRunning && (
              <div className="px-4 py-2 bg-[#0e111d] text-primary font-mono text-[10px] font-bold rounded-xl border border-primary/20 tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-blink" />
                GAME IN PROGRESS
              </div>
            )}
          </div>
        </div>

        {/* Footer info section */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between mt-6 text-[#5a6a70] font-mono text-[9px] uppercase tracking-wider pt-4 border-t border-white/[0.03]">
          <span className="text-[#ff7bf0] font-black tracking-widest">ELIMINATOR ESPORTS</span>
          <div className="flex gap-4.5 mt-2 md:mt-0">
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-white transition-colors cursor-pointer">Fair Play Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Responsible Gaming</span>
          </div>
          <span className="mt-2 md:mt-0">© 2024 ELIMINATOR ESPORTS. ALL RIGHTS RESERVED.</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* RIGHT INNER PANE — Player List Feed            */}
      {/* ═══════════════════════════════════════════════ */}
      <aside className="hidden lg:flex w-[290px] h-full flex-col border-l border-white/[0.06] bg-[#0b0d16] z-10 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[9px] text-[#859399] tracking-[0.2em] uppercase m-0 font-extrabold">
              Player List
            </h3>
            <span className="font-mono text-xs text-primary font-bold">
              {participants.length}/{String(totalPlayers).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Player List wrapper */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {/* Active Players */}
          {activeList.map((p) => {
            const isMe = p.userId === user?.id;
            const playerIndex = participants.indexOf(p);
            const color = AVATAR_COLORS[playerIndex % AVATAR_COLORS.length];
            return (
              <motion.div
                key={p.userId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl flex items-center gap-3 transition-all ${
                  isMe
                    ? 'bg-primary/[0.06] border border-primary/20 shadow-[0_0_12px_rgba(164,230,255,0.08)]'
                    : 'bg-[#0e111d]/50 border border-transparent hover:border-white/[0.04] hover:bg-[#0e111d]/85'
                }`}
              >
                {/* Avatar frame */}
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                  <MiniCyberpunkAvatar index={playerIndex} isActive={true} />
                  {isMe && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border border-[#0b0d16]" />
                  )}
                </div>

                {/* Info and Progress probability bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-sora font-extrabold text-xs text-white m-0 truncate">
                      {p.user?.name || 'Player'}
                    </p>
                    {isMe && (
                      <span className="font-mono text-[8px] text-primary font-black tracking-widest bg-primary/10 px-1.5 py-0.5 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  {/* Dynamic neon health / win bar */}
                  <div className="w-full h-1 bg-[#151824] rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(12, 100 - (currentRound * 6))}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}55)`,
                        boxShadow: `0 0 8px ${color}`
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Eliminated divider */}
          {eliminatedCount > 0 && (
            <div className="pt-4 pb-2 flex items-center gap-2">
              <div className="flex-1 h-px bg-[#ff6b6b]/10" />
              <p className="font-mono text-[8px] text-[#ff6b6b]/40 m-0 uppercase tracking-[0.2em] font-extrabold">
                ELIMINATED
              </p>
              <div className="flex-1 h-px bg-[#ff6b6b]/10" />
            </div>
          )}

          {/* Eliminated Players */}
          {eliminatedList.map((p) => {
            const playerIndex = participants.indexOf(p);
            return (
              <div
                key={p.userId}
                className="p-3 rounded-xl opacity-30 flex items-center gap-3 bg-[#ff6b6b]/[0.02] border border-[#ff6b6b]/[0.05]"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/5 flex-shrink-0 grayscale">
                  <MiniCyberpunkAvatar index={playerIndex} isActive={false} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sora font-extrabold text-xs text-[#859399] m-0 truncate line-through">
                    {p.user?.name || 'Player'}
                  </p>
                  <p className="font-mono text-[8px] text-[#ff6b6b]/40 m-0 uppercase tracking-widest mt-0.5 font-bold">ELIMINATED</p>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {participants.length === 0 && (
            <div className="text-center py-16">
              <RiUserLine className="text-3xl text-white/5 mb-3 block mx-auto" />
              <p className="text-[10px] text-[#5a6a70] font-mono tracking-widest uppercase">No players yet</p>
            </div>
          )}
        </div>
      </aside>

      {/* Winner modal popup */}
      <WinnerModal
        open={showWinnerModal}
        winner={winner?.user || { userId: winner?.userId }}
        prizePool={activeWheel?.winnerPool}
        onClose={() => setDismissedWinnerId(winnerId)}
      />
    </div>
  );
}

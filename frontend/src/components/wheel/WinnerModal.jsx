import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RiDashboardLine,
  RiShareLine,
  RiSkull2Line,
  RiTimerFlashLine,
  RiTrophyFill,
  RiVipCrownFill,
  RiShieldStarFill,
  RiUserLine,
} from 'react-icons/ri';
import { formatCoins } from '../../utils/formatters';

/* ── Floating confetti dots ── */
const CONFETTI = [
  { left: '8%',  top: '12%', size: '6px',  color: '#dca8ef', delay: 0.1 },
  { left: '18%', top: '22%', size: '5px',  color: '#ffda35', delay: 0.2 },
  { left: '66%', top: '8%',  size: '7px',  color: '#99ddff', delay: 0.15 },
  { left: '78%', top: '15%', size: '6px',  color: '#ffda35', delay: 0.25 },
  { left: '88%', top: '58%', size: '10px', color: '#e9c400', delay: 0.3 },
  { left: '69%', top: '46%', size: '7px',  color: '#dca8ef', delay: 0.35 },
  { left: '29%', top: '48%', size: '8px',  color: '#ffda35', delay: 0.12 },
  { left: '14%', top: '68%', size: '8px',  color: '#78a9bc', delay: 0.4 },
  { left: '71%', top: '66%', size: '7px',  color: '#9d8a39', delay: 0.18 },
  { left: '31%', top: '88%', size: '7px',  color: '#8cc9de', delay: 0.28 },
  { left: '50%', top: '25%', size: '9px',  color: '#b67ac5', delay: 0.22 },
  { left: '92%', top: '30%', size: '5px',  color: '#725188', delay: 0.32 },
  { left: '5%',  top: '82%', size: '6px',  color: '#ffda35', delay: 0.38 },
  { left: '82%', top: '82%', size: '8px',  color: '#cf5cff', delay: 0.42 },
];

/* ── Survival time formatter ── */
function formatRoundTime(startedAt, endedAt) {
  if (!startedAt || !endedAt) return '--:--';
  const elapsed = Math.max(0, new Date(endedAt) - new Date(startedAt));
  if (!elapsed) return '--:--';
  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/* ── Winner Portrait with initials ── */
function WinnerPortrait({ name }) {
  const initials = (name || 'W')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', damping: 14 }}
      className="relative mx-auto h-[110px] w-[110px] rounded-2xl p-[3px] shadow-[0_0_40px_rgba(76,214,255,0.35)]"
      style={{ background: 'linear-gradient(135deg, #ffda35, #4cd6ff, #cf5cff)' }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[13px] bg-[#08111a] flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="wGlow" cx="50%" cy="20%" r="80%">
              <stop offset="0%" stopColor="#2ff2ff" stopOpacity="0.5" />
              <stop offset="48%" stopColor="#0c2633" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#05070c" stopOpacity="1" />
            </radialGradient>
            <linearGradient id="wJacket" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#282f3d" />
              <stop offset="48%" stopColor="#151922" />
              <stop offset="100%" stopColor="#05070c" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#wGlow)" />
          <path d="M15 94c5-24 20-36 35-36s30 12 35 36H15Z" fill="url(#wJacket)" />
          <path d="M36 66l14 24 14-24c-8 4-20 4-28 0Z" fill="#d49a4a" opacity="0.55" />
          <path d="M37 35c1-13 25-13 26 0l-2 16c-2 8-7 13-11 13s-9-5-11-13l-2-16Z" fill="#dca36e" />
          <path d="M35 38c7-16 26-17 32-4-7-2-14-5-18-9-3 6-8 10-14 13Z" fill="#16202b" />
          <path d="M33 41c3-16 15-25 30-17 8 4 10 13 8 23-3-8-8-13-15-16-8-4-15 0-23 10Z" fill="#233041" />
          <circle cx="38" cy="47" r="1.7" fill="#101820" />
          <circle cx="59" cy="47" r="1.7" fill="#101820" />
          <path d="M43 57c4 3 10 3 15 0" stroke="#5b2b22" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M24 92h52" stroke="#4cd6ff" strokeWidth="1.5" strokeOpacity="0.8" />
        </svg>
        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/50 px-2 py-0.5 font-mono text-[10px] font-black text-[#a4e6ff] tracking-wide">
          {initials}
        </span>
      </div>
    </motion.div>
  );
}

/* ── Participant Row ── */
function ParticipantRow({ participant, isWinner, index }) {
  const name = participant?.user?.name || participant?.name || 'Player';
  const isEliminated = !!participant?.eliminatedAt;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.06 }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
        isWinner
          ? 'bg-[#ffda35]/10 border border-[#ffda35]/30 shadow-[0_0_12px_rgba(255,218,53,0.1)]'
          : isEliminated
          ? 'bg-white/[0.02] border border-white/[0.04] opacity-50'
          : 'bg-white/[0.03] border border-white/[0.06]'
      }`}
    >
      {/* Rank / Status icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isWinner
          ? 'bg-[#ffda35]/20'
          : isEliminated
          ? 'bg-[#ff6b6b]/10'
          : 'bg-white/[0.06]'
      }`}>
        {isWinner ? (
          <RiVipCrownFill className="text-[#ffda35] text-sm" />
        ) : isEliminated ? (
          <RiSkull2Line className="text-[#ff6b6b]/60 text-sm" />
        ) : (
          <RiShieldStarFill className="text-[#4cd6ff]/50 text-sm" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={`font-sora text-xs font-bold truncate m-0 ${
          isWinner ? 'text-[#ffda35]' : isEliminated ? 'text-[#859399] line-through' : 'text-white/80'
        }`}>
          {name}
        </p>
      </div>

      {/* Badge */}
      {isWinner && (
        <span className="font-mono text-[8px] font-black tracking-widest text-[#ffda35] bg-[#ffda35]/15 px-2 py-0.5 rounded uppercase">
          Winner
        </span>
      )}
      {isEliminated && !isWinner && (
        <span className="font-mono text-[8px] font-bold tracking-wider text-[#ff6b6b]/50 uppercase">
          Out
        </span>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════ */
/* ██  WINNER MODAL MAIN COMPONENT               */
/* ═══════════════════════════════════════════════ */
export default function WinnerModal({
  open,
  winner,
  prizePool,
  eliminatedCount = 0,
  startedAt,
  endedAt,
  participants = [],
  onClose,
}) {
  const winnerName = winner?.name || winner?.userId || 'Champion';
  const prize = prizePool != null ? formatCoins(prizePool) : '0';
  const survivalTime = formatRoundTime(startedAt, endedAt);

  // Sort: winner first, then active players, then eliminated (most recent first)
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isWinner) return -1;
    if (b.isWinner) return 1;
    if (a.eliminatedAt && !b.eliminatedAt) return 1;
    if (!a.eliminatedAt && b.eliminatedAt) return -1;
    if (a.eliminatedAt && b.eliminatedAt) {
      return new Date(b.eliminatedAt) - new Date(a.eliminatedAt);
    }
    return 0;
  });

  async function handleShare() {
    const message = `🏆 ${winnerName} won ${prize} coins in Eliminator! The Last Eliminator Standing.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Eliminator Victory', text: message, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${message} ${window.location.href}`);
        toast.success('Victory result copied!');
      }
    } catch {
      toast.error('Could not share this result');
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-black/85 p-4 backdrop-blur-xl"
        >
          {/* Background grid + radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,218,53,0.13),transparent_38%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:100%_100%,18px_18px,18px_18px]" />
          <div className="absolute inset-0 bg-black/45" />

          {/* Floating confetti */}
          {CONFETTI.map((dot, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: -10, scale: 0.5 }}
              animate={{
                opacity: [0, 0.9, 0.5, 0.9],
                y: [0, -8, 4, 0],
                scale: [0.5, 1, 0.8, 1],
              }}
              transition={{
                delay: dot.delay,
                duration: 3,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: dot.left,
                top: dot.top,
                width: dot.size,
                height: dot.size,
                backgroundColor: dot.color,
                boxShadow: `0 0 18px ${dot.color}`,
              }}
            />
          ))}

          {/* ── Main Card ── */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', damping: 18, stiffness: 160 } }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl border border-[#ffda35]/25 bg-[#13161f]/95 shadow-[0_0_100px_rgba(255,218,53,0.18)] backdrop-blur-2xl"
          >
            {/* Decorative corner accents */}
            <div className="absolute left-8 top-10 h-4 w-1.5 rotate-45 rounded bg-[#ffda35]/50" />
            <div className="absolute right-16 top-20 h-3 w-3 rounded-full bg-[#6d8fa4]/60" />
            <div className="absolute bottom-24 left-20 h-4 w-2 rounded bg-[#b67ac5]/50" />

            {/* ── Trophy + Champion Badge ── */}
            <div className="pt-8 pb-2 text-center">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', damping: 12 }}
                className="relative mx-auto mb-4 flex h-[100px] w-[130px] items-center justify-center"
              >
                <div className="absolute inset-0 rounded-full bg-[#ffda35]/20 blur-3xl" />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <RiTrophyFill className="relative text-[80px] text-[#ffda35] drop-shadow-[0_0_24px_rgba(255,218,53,0.8)]" />
                </motion.div>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', damping: 10 }}
                  className="absolute -right-1 top-0 rounded-full bg-[#a4e6ff] px-3 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-[#06202a] shadow-[0_0_20px_rgba(164,230,255,0.4)]"
                >
                  Champion
                </motion.span>
              </motion.div>

              {/* VICTORY text */}
              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.05em' }}
                animate={{ opacity: 1, letterSpacing: '0.2em' }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="mb-5 font-mono text-[16px] font-black uppercase text-[#ffda35] tracking-[0.2em]"
              >
                Victory
              </motion.p>

              {/* Winner Portrait */}
              <WinnerPortrait name={winnerName} />

              {/* Prize + Winner Name */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-5 px-6"
              >
                <p className="font-sora text-xl font-black uppercase tracking-wide text-white m-0">
                  {winnerName} won {prize}
                </p>
                <p className="mt-2 font-serif text-sm font-bold uppercase tracking-[0.16em] text-[#d6d8e5]/70 m-0">
                  The Last Eliminator Standing
                </p>
              </motion.div>
            </div>

            {/* ── Stats Row ── */}
            <div className="mx-6 mt-6 grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center"
              >
                <RiTimerFlashLine className="mx-auto mb-1.5 text-2xl text-[#99ddff]" />
                <p className="font-mono text-[9px] text-[#859399] uppercase tracking-widest m-0">Survival Time</p>
                <p className="mt-1 font-sora text-lg font-bold text-white m-0">{survivalTime}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center"
              >
                <RiSkull2Line className="mx-auto mb-1.5 text-2xl text-[#ffb4ab]" />
                <p className="font-mono text-[9px] text-[#859399] uppercase tracking-widest m-0">Eliminated</p>
                <p className="mt-1 font-sora text-lg font-bold text-white m-0">{eliminatedCount} Players</p>
              </motion.div>
            </div>

            {/* ── All Participants List ── */}
            {sortedParticipants.length > 0 && (
              <div className="mx-6 mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <RiUserLine className="text-sm text-[#859399]" />
                  <p className="font-mono text-[9px] text-[#859399] uppercase tracking-[0.2em] font-bold m-0">
                    All Participants ({sortedParticipants.length})
                  </p>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                  {sortedParticipants.map((p, i) => (
                    <ParticipantRow
                      key={p.userId || p.id || i}
                      participant={p}
                      isWinner={!!p.isWinner}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="mx-6 mt-7 mb-8 grid gap-3">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                type="button"
                onClick={onClose}
                className="min-h-[52px] rounded-xl font-sora text-base font-black text-[#0a3040] shadow-[0_0_28px_rgba(207,92,255,0.2)] transition-all hover:brightness-110 hover:shadow-[0_0_36px_rgba(207,92,255,0.3)] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(90deg, #9be7ff, #cdbbff, #f0a1ff)',
                }}
              >
                Play Again
              </motion.button>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  type="button"
                  onClick={handleShare}
                  className="flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-5 font-sora text-sm font-bold text-[#f0eef8] transition-all hover:border-[#a4e6ff]/35 hover:bg-white/[0.07]"
                >
                  <RiShareLine className="text-base" />
                  Share
                </motion.button>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                >
                  <Link
                    to="/"
                    onClick={onClose}
                    className="flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-5 font-sora text-sm font-bold text-[#f0eef8] transition-all hover:border-[#a4e6ff]/35 hover:bg-white/[0.07] no-underline"
                  >
                    <RiDashboardLine className="text-base" />
                    Dashboard
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RiDashboardLine,
  RiShareLine,
  RiSkull2Line,
  RiTimerFlashLine,
  RiTrophyFill,
} from 'react-icons/ri';
import { formatCoins } from '../../utils/formatters';

const CONFETTI = [
  { left: '18%', top: '19%', size: '6px', color: '#dca8ef' },
  { left: '66%', top: '10%', size: '5px', color: '#99ddff' },
  { left: '78%', top: '17%', size: '6px', color: '#ffda35' },
  { left: '88%', top: '62%', size: '10px', color: '#e9c400' },
  { left: '69%', top: '50%', size: '7px', color: '#dca8ef' },
  { left: '29%', top: '52%', size: '8px', color: '#ffda35' },
  { left: '14%', top: '72%', size: '8px', color: '#78a9bc' },
  { left: '71%', top: '70%', size: '7px', color: '#9d8a39' },
  { left: '31%', top: '24%', size: '7px', color: '#8cc9de' },
  { left: '50%', top: '29%', size: '9px', color: '#b67ac5' },
  { left: '63%', top: '39%', size: '12px', color: '#6d8fa4' },
  { left: '22%', top: '88%', size: '5px', color: '#725188' },
];

function formatRoundTime(startedAt, endedAt) {
  if (!startedAt || !endedAt) return '14:02';

  const elapsed = Math.max(0, new Date(endedAt) - new Date(startedAt));
  if (!elapsed) return '14:02';

  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function WinnerPortrait({ name }) {
  const initials = (name || 'Winner')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative mx-auto h-[104px] w-[104px] rounded-2xl bg-gradient-to-br from-[#ffda35] via-[#4cd6ff] to-[#cf5cff] p-1 shadow-[0_0_28px_rgba(76,214,255,0.28)]">
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#08111a]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="winnerGlow" cx="50%" cy="20%" r="80%">
              <stop offset="0%" stopColor="#2ff2ff" stopOpacity="0.5" />
              <stop offset="48%" stopColor="#0c2633" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#05070c" stopOpacity="1" />
            </radialGradient>
            <linearGradient id="winnerJacket" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#282f3d" />
              <stop offset="48%" stopColor="#151922" />
              <stop offset="100%" stopColor="#05070c" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#winnerGlow)" />
          <path d="M15 94c5-24 20-36 35-36s30 12 35 36H15Z" fill="url(#winnerJacket)" />
          <path d="M36 66l14 24 14-24c-8 4-20 4-28 0Z" fill="#d49a4a" opacity="0.55" />
          <path d="M37 35c1-13 25-13 26 0l-2 16c-2 8-7 13-11 13s-9-5-11-13l-2-16Z" fill="#dca36e" />
          <path d="M35 38c7-16 26-17 32-4-7-2-14-5-18-9-3 6-8 10-14 13Z" fill="#16202b" />
          <path d="M33 41c3-16 15-25 30-17 8 4 10 13 8 23-3-8-8-13-15-16-8-4-15 0-23 10Z" fill="#233041" />
          <path d="M32 75l12 20H18c3-8 8-15 14-20Z" fill="#111722" />
          <path d="M68 75L56 95h26c-3-8-8-15-14-20Z" fill="#111722" />
          <path d="M24 92h52" stroke="#4cd6ff" strokeWidth="1.5" strokeOpacity="0.8" />
          <path d="M32 18c12-7 28-6 37 4" stroke="#4cd6ff" strokeWidth="1.2" strokeOpacity="0.55" />
          <circle cx="38" cy="47" r="1.7" fill="#101820" />
          <circle cx="59" cy="47" r="1.7" fill="#101820" />
          <path d="M43 57c4 3 10 3 15 0" stroke="#5b2b22" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <div className="absolute bottom-1.5 left-1.5 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] font-black text-[#a4e6ff]">
          {initials}
        </div>
      </div>
    </div>
  );
}

export default function WinnerModal({
  open,
  winner,
  prizePool,
  eliminatedCount = 0,
  startedAt,
  endedAt,
  onClose,
}) {
  const winnerName = winner?.name || winner?.userId || 'Champion';
  const prize = prizePool != null ? formatCoins(prizePool) : '0';
  const survivalTime = formatRoundTime(startedAt, endedAt);

  async function handleShare() {
    const message = `${winnerName} won ${prize} coins in Eliminator.`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Eliminator Victory', text: message, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${message} ${window.location.href}`);
        toast.success('Victory result copied');
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,218,53,0.13),transparent_38%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:100%_100%,18px_18px,18px_18px]" />
          <div className="absolute inset-0 bg-black/45" />
          {CONFETTI.map((dot, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: -6, scale: 0.6 }}
              animate={{ opacity: 0.85, y: 0, scale: 1 }}
              transition={{ delay: 0.12 + index * 0.04, duration: 0.45 }}
              className="absolute rounded-full"
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

          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 22 }}
            animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', damping: 18, stiffness: 180 } }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            className="relative w-full max-w-[545px] overflow-hidden rounded-lg border border-[#ffda35]/25 bg-[#1a1d27]/95 px-6 py-8 text-center shadow-[0_0_90px_rgba(255,218,53,0.18)] sm:px-10 sm:py-9"
          >
            <div className="absolute left-10 top-12 h-4 w-1.5 rotate-45 rounded bg-[#ffda35]/50" />
            <div className="absolute right-20 top-24 h-3 w-3 rounded-full bg-[#6d8fa4]" />
            <div className="absolute bottom-9 left-28 h-4 w-2 rounded bg-[#b67ac5]/70" />

            <div className="relative mx-auto mb-6 flex h-[92px] w-[120px] items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#ffda35]/25 blur-2xl" />
              <RiTrophyFill className="relative text-[78px] text-[#ffda35] drop-shadow-[0_0_18px_rgba(255,218,53,0.8)]" />
              <span className="absolute right-1 top-2 rounded-full bg-[#a4e6ff] px-3 py-1 font-serif text-[10px] font-bold uppercase tracking-wide text-[#06202a] shadow-[0_0_18px_rgba(164,230,255,0.35)]">
                Champion
              </span>
            </div>

            <p className="mb-5 font-mono text-[15px] font-black uppercase tracking-[0.18em] text-[#ffda35]">
              Victory
            </p>

            <WinnerPortrait name={winnerName} />

            <div className="mt-5">
              <p className="font-sora text-lg font-black uppercase tracking-wide text-[#f0eef8]">
                You won {prize}
              </p>
              <p className="mt-2 font-serif text-lg font-bold uppercase tracking-[0.14em] text-[#d6d8e5]">
                The last eliminator standing
              </p>
              <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#859399]">
                {winnerName}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded border border-white/10 bg-white/[0.04] px-5 py-5">
                <RiTimerFlashLine className="mx-auto mb-2 text-2xl text-[#99ddff]" />
                <p className="font-serif text-xs text-[#d6d8e5]">Survival Time</p>
                <p className="mt-1 font-serif text-base font-bold text-white">{survivalTime}</p>
              </div>
              <div className="rounded border border-white/10 bg-white/[0.04] px-5 py-5">
                <RiSkull2Line className="mx-auto mb-2 text-2xl text-[#ffb4ab]" />
                <p className="font-serif text-xs text-[#d6d8e5]">Eliminated</p>
                <p className="mt-1 font-serif text-base font-bold text-white">{eliminatedCount} Players</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[58px] rounded bg-gradient-to-r from-[#9be7ff] via-[#cdbbff] to-[#f0a1ff] px-5 font-serif text-lg font-black text-[#0a3040] shadow-[0_0_24px_rgba(207,92,255,0.24)] transition hover:brightness-105 active:scale-[0.99]"
              >
                Play Again
              </button>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex min-h-[58px] items-center justify-center gap-3 rounded border border-white/10 bg-white/[0.04] px-5 font-serif text-base font-bold text-[#f0eef8] transition hover:border-[#a4e6ff]/35 hover:bg-white/[0.07]"
                >
                  <RiShareLine className="text-lg" />
                  Share
                </button>
                <Link
                  to="/"
                  onClick={onClose}
                  className="flex min-h-[58px] items-center justify-center gap-3 rounded border border-white/10 bg-white/[0.04] px-5 font-serif text-base font-bold text-[#f0eef8] transition hover:border-[#a4e6ff]/35 hover:bg-white/[0.07]"
                >
                  <RiDashboardLine className="text-lg" />
                  Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

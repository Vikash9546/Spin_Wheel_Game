import { motion } from 'framer-motion';

const AVATAR_COLORS = [
  '#4cd6ff', '#cf5cff', '#ffda35', '#ff6b6b', '#51cf66',
  '#748ffc', '#ffa94d', '#f06595', '#20c997', '#845ef7',
  '#fd7e14', '#15aabf',
];

export default function WheelCanvas({ participants = [], spinning = false, status = 'WAITING' }) {
  const count = participants.length;
  const radius = 42; // % from center — controls orbit radius

  return (
    <div className="relative w-full aspect-square max-w-[520px] mx-auto flex items-center justify-center">
      {/* Outer Container — dark rounded square */}
      <div className="absolute inset-0 rounded-[32px] bg-[#0a0c14] border border-white/[0.06] shadow-[0_0_60px_rgba(0,0,0,0.6)]" />

      {/* Ambient glow when spinning */}
      {spinning && (
        <div className="absolute inset-8 rounded-[24px] bg-primary/5 blur-[40px] animate-pulse-glow pointer-events-none" />
      )}

      {/* Grid lines — subtle tech aesthetic */}
      <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(164,230,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(164,230,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Orbit ring — dashed circle guide */}
      <div
        className="absolute rounded-full border border-dashed border-white/[0.06]"
        style={{
          width: `${radius * 2}%`,
          height: `${radius * 2}%`,
          top: `${50 - radius}%`,
          left: `${50 - radius}%`,
        }}
      />

      {/* Selector Pin — subtle cyan triangle at top */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '14px solid #4cd6ff',
            filter: 'drop-shadow(0 0 8px rgba(76,214,255,0.6))',
          }}
        />
        <div className="w-px h-3 bg-primary/30" />
      </div>

      {/* Rotating Player Orbit */}
      <motion.div
        className="absolute inset-0"
        animate={spinning ? { rotate: 360 } : { rotate: 0 }}
        transition={spinning
          ? { duration: 8, ease: 'linear', repeat: Infinity }
          : { duration: 2, ease: 'circOut' }
        }
      >
        {count === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs text-on-surface-variant/50 tracking-widest uppercase">
              AWAITING PLAYERS...
            </span>
          </div>
        )}

        {participants.map((p, i) => {
          const angle = (360 / count) * i;
          const rad = (angle - 90) * (Math.PI / 180);
          const x = 50 + radius * Math.cos(rad);
          const y = 50 + radius * Math.sin(rad);
          const isActive = !p.eliminatedAt;
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const initials = p.user?.name ? p.user.name.substring(0, 2).toUpperCase() : 'P';

          return (
            <div
              key={p.userId}
              className="absolute flex items-center justify-center"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                // Counter-rotate so text stays upright when spinning
              }}
            >
              <motion.div
                animate={spinning ? { rotate: -360 } : { rotate: 0 }}
                transition={spinning
                  ? { duration: 8, ease: 'linear', repeat: Infinity }
                  : { duration: 2, ease: 'circOut' }
                }
                className="relative"
              >
                {/* Glow ring for active players */}
                {isActive && (
                  <div
                    className="absolute -inset-1 rounded-xl opacity-40 blur-sm"
                    style={{ backgroundColor: color }}
                  />
                )}

                {/* Avatar squircle */}
                <div
                  className={`relative w-11 h-11 md:w-14 md:h-14 rounded-xl flex items-center justify-center font-sora font-bold text-xs md:text-sm border-2 transition-all duration-300 ${
                    isActive
                      ? 'border-white/20 shadow-lg'
                      : 'border-white/5 opacity-30 grayscale'
                  }`}
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${color}33, ${color}11)`
                      : 'rgba(50,52,62,0.5)',
                    color: isActive ? color : '#666',
                    boxShadow: isActive ? `0 0 20px ${color}33` : 'none',
                  }}
                >
                  {initials}
                </div>
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      {/* Center Hub — dark rounded square */}
      <div className="absolute z-20 w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-[#0d0f18] border border-white/[0.08] flex flex-col items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <p className="font-mono text-[9px] text-primary/60 tracking-[0.2em] uppercase m-0">STATUS</p>
        <p className="font-sora font-bold text-sm md:text-base text-on-surface m-0 mt-1 text-center px-2 leading-tight">
          {status}
        </p>
        {spinning && (
          <div className="mt-2 flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        )}
      </div>

      {/* Corner accent dots */}
      <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-primary/20" />
      <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-primary/20" />
      <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-primary/20" />
      <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-primary/20" />
    </div>
  );
}

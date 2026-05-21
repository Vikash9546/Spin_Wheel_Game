import { motion } from 'framer-motion';

// 12 Premium Cyberpunk / Esports vector avatars in high-contrast styling
function CyberpunkAvatar({ index, isActive }) {
  const primaryColor = isActive ? '#4cd6ff' : '#859399';
  const secondaryColor = isActive ? '#cf5cff' : '#4d575c';
  const gradientId = `avatar-grad-${index}`;
  const strokeColor = isActive ? '#4cd6ff' : 'rgba(255,255,255,0.08)';

  // Renders 12 custom vector designs
  const renderDesign = () => {
    switch (index % 12) {
      case 0: // Visor Hacker
        return (
          <g>
            <path d="M25 75 C25 50, 35 30, 50 30 C65 30, 75 50, 75 75 Z" fill="#1b1e2c" />
            <rect x="20" y="42" width="60" height="14" rx="4" fill={primaryColor} opacity="0.9" />
            <line x1="20" y1="49" x2="80" y2="49" stroke="#000" strokeWidth="2" />
            <circle cx="50" cy="49" r="3" fill="#fff" />
            <path d="M35 30 L30 18" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />
          </g>
        );
      case 1: // Tech Ninja Mask
        return (
          <g>
            <path d="M28 75 C28 45, 32 32, 50 32 C68 32, 72 45, 72 75 Z" fill="#131520" />
            <circle cx="38" cy="48" r="4" fill={primaryColor} />
            <circle cx="62" cy="48" r="4" fill={primaryColor} />
            <path d="M32 58 L50 72 L68 58 Z" fill="#252b44" stroke={secondaryColor} strokeWidth="1.5" />
            <circle cx="50" cy="65" r="3" fill={primaryColor} />
          </g>
        );
      case 2: // VR Visor Pilot
        return (
          <g>
            <path d="M24 75 C24 45, 34 25, 50 25 C66 25, 76 45, 76 75 Z" fill="#1e2235" />
            <path d="M22 45 L78 45 L70 60 L30 60 Z" fill="#0d0f18" stroke={primaryColor} strokeWidth="2" />
            <rect x="34" y="49" width="32" height="6" rx="2" fill={secondaryColor} />
            <circle cx="50" cy="52" r="2" fill="#fff" />
          </g>
        );
      case 3: // Android Core
        return (
          <g>
            <circle cx="50" cy="50" r="25" fill="#161824" stroke={secondaryColor} strokeWidth="2" />
            <circle cx="50" cy="50" r="12" fill="#0c0e17" stroke={primaryColor} strokeWidth="3" />
            <circle cx="50" cy="50" r="4" fill="#fff" className="animate-pulse" />
            <line x1="50" y1="25" x2="50" y2="15" stroke={primaryColor} strokeWidth="2" />
          </g>
        );
      case 4: // Mecha Combatant
        return (
          <g>
            <path d="M30 75 L30 38 L50 22 L70 38 L70 75 Z" fill="#181a26" />
            <polygon points="34,44 66,44 58,54 42,54" fill={secondaryColor} />
            <rect x="40" y="30" width="20" height="4" fill={primaryColor} />
            <line x1="50" y1="54" x2="50" y2="70" stroke={primaryColor} strokeWidth="2" />
          </g>
        );
      case 5: // Cyber Skull
        return (
          <g>
            <path d="M30 70 C30 40, 34 30, 50 30 C66 30, 70 40, 70 70 C70 74, 65 78, 50 78 C35 78, 30 74, 30 70 Z" fill="#10121d" />
            <circle cx="42" cy="46" r="6" fill="#000" stroke={primaryColor} strokeWidth="1.5" />
            <circle cx="58" cy="46" r="6" fill="#000" stroke={primaryColor} strokeWidth="1.5" />
            <path d="M46 64 H54 V68 H46 Z" fill={secondaryColor} />
            <line x1="42" y1="46" x2="58" y2="46" stroke={secondaryColor} strokeWidth="2" />
          </g>
        );
      case 6: // VR Visor Antennas
        return (
          <g>
            <path d="M26 75 C26 48, 35 28, 50 28 C65 28, 74 48, 74 75 Z" fill="#1b1e2e" />
            <rect x="22" y="44" width="56" height="12" rx="3" fill="#090a0f" stroke={primaryColor} strokeWidth="1.5" />
            <circle cx="34" cy="50" r="3" fill={secondaryColor} />
            <circle cx="66" cy="50" r="3" fill={secondaryColor} />
            <path d="M26 38 L16 30" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
            <path d="M74 38 L84 30" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      case 7: // Neon Mask Assassin
        return (
          <g>
            <path d="M28 75 C28 42, 34 32, 50 32 C66 32, 72 42, 72 75 Z" fill="#121422" />
            <polygon points="32,48 50,38 68,48 50,56" fill="#1b1e32" />
            <path d="M36 58 C42 66, 58 66, 64 58 L50 72 Z" fill={primaryColor} opacity="0.85" />
            <circle cx="50" cy="47" r="3" fill="#fff" />
          </g>
        );
      case 8: // Tech Mohawk
        return (
          <g>
            <path d="M25 75 C25 50, 32 35, 50 35 C68 35, 75 50, 75 75 Z" fill="#1c1f30" />
            <path d="M50 15 L50 35" stroke={primaryColor} strokeWidth="8" strokeLinecap="round" />
            <rect x="30" y="46" width="40" height="8" rx="2" fill={secondaryColor} />
            <circle cx="40" cy="50" r="2" fill="#fff" />
            <circle cx="60" cy="50" r="2" fill="#fff" />
          </g>
        );
      case 9: // Synthwave Goggles
        return (
          <g>
            <path d="M24 75 C24 45, 34 26, 50 26 C66 26, 76 45, 76 75 Z" fill="#151724" />
            <ellipse cx="38" cy="46" rx="12" ry="7" fill="#000" stroke={secondaryColor} strokeWidth="2" />
            <ellipse cx="62" cy="46" rx="12" ry="7" fill="#000" stroke={secondaryColor} strokeWidth="2" />
            <path d="M26 46 H74" stroke={primaryColor} strokeWidth="2" />
          </g>
        );
      case 10: // AI Goggles Visor
        return (
          <g>
            <path d="M28 75 C28 46, 35 30, 50 30 C65 30, 72 46, 72 75 Z" fill="#191c2b" />
            <path d="M24 44 H76 V56 H24 Z" fill={primaryColor} opacity="0.15" />
            <circle cx="36" cy="50" r="4" fill={primaryColor} />
            <circle cx="50" cy="50" r="4" fill={primaryColor} />
            <circle cx="64" cy="50" r="4" fill={primaryColor} />
            <line x1="24" y1="44" x2="76" y2="44" stroke={primaryColor} strokeWidth="1.5" />
            <line x1="24" y1="56" x2="76" y2="56" stroke={primaryColor} strokeWidth="1.5" />
          </g>
        );
      default: // Cybernetic Eye
        return (
          <g>
            <path d="M27 75 C27 46, 34 32, 50 32 C66 32, 73 46, 73 75 Z" fill="#11131e" />
            <circle cx="40" cy="48" r="5" fill={secondaryColor} />
            <circle cx="60" cy="48" r="8" fill="#000" stroke={primaryColor} strokeWidth="2" />
            <circle cx="60" cy="48" r="3" fill="#fff" />
            <path d="M35 60 C42 66, 58 66, 65 60" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
          </g>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full object-cover transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, ${isActive ? '#13192f' : '#0e1017'} 0%, #06070a 100%)`,
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Decorative Grid Lines */}
      <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

      {/* Portrait render */}
      {renderDesign()}

      {/* Outer border highlighting shape */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="12"
        fill="none"
        stroke={strokeColor}
        strokeWidth={isActive ? '3' : '1'}
        opacity={isActive ? '1' : '0.6'}
      />
    </svg>
  );
}

export default function WheelCanvas({ participants = [], spinning = false, status = 'WAITING' }) {
  const count = participants.length;
  const radius = 42; // % from center — controls orbit radius

  return (
    <div className="relative w-full aspect-square max-w-[480px] mx-auto flex items-center justify-center p-3">
      {/* Outer Container — dark rounded square */}
      <div className="absolute inset-0 rounded-[32px] bg-[#0c0e17] border border-white/[0.06] shadow-[0_0_60px_rgba(0,0,0,0.8)]" />

      {/* Ambient glow when spinning */}
      {spinning && (
        <div className="absolute inset-8 rounded-[24px] bg-[#4cd6ff]/5 blur-[40px] animate-pulse-glow pointer-events-none" />
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
        className="absolute rounded-full border border-dashed border-white/[0.04]"
        style={{
          width: `${radius * 2}%`,
          height: `${radius * 2}%`,
          top: `${50 - radius}%`,
          left: `${50 - radius}%`,
        }}
      />

      {/* Selector Pin — Top glowing indicator matching mockup ▼ */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '16px solid #00f0ff',
            filter: 'drop-shadow(0 0 10px rgba(0,240,255,0.8))',
          }}
        />
        <div className="w-[2px] h-3 bg-[#00f0ff]/40 animate-pulse mt-0.5" />
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
            <span className="font-mono text-[10px] text-primary/40 tracking-[0.2em] uppercase font-extrabold">
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

          return (
            <div
              key={p.userId}
              className="absolute flex items-center justify-center"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Counter-rotate so text/portraits stay upright when spinning */}
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
                    className="absolute -inset-1.5 rounded-2xl opacity-45 blur-md transition-all duration-300"
                    style={{ 
                      backgroundColor: '#00f0ff',
                      boxShadow: '0 0 25px rgba(0,240,255,0.6)'
                    }}
                  />
                )}

                {/* Cyberpunk portrait container */}
                <div
                  className={`relative w-12 h-12 md:w-16 md:h-16 rounded-[14px] overflow-hidden border-2 transition-all duration-300 ${
                    isActive
                      ? 'border-[#00f0ff]/65 shadow-2xl scale-100 hover:scale-105'
                      : 'border-white/5 opacity-25 grayscale scale-95'
                  }`}
                  style={{
                    boxShadow: isActive ? '0 0 24px rgba(0,240,255,0.35)' : 'none',
                  }}
                >
                  <CyberpunkAvatar index={i} isActive={isActive} />
                </div>
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      {/* Center Hub — dark rounded square */}
      <div className="absolute z-20 w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-[#0c0e17] border border-white/[0.08] flex flex-col items-center justify-center shadow-[0_0_35px_rgba(0,0,0,0.7)]">
        <p className="font-mono text-[9px] text-[#859399] tracking-[0.2em] uppercase m-0 font-bold">STATUS</p>
        <p className="font-sora font-extrabold text-[13px] md:text-sm text-white m-0 mt-1 tracking-wider uppercase text-center px-2 leading-tight">
          {status === 'RUNNING' || status === 'SPINNING' ? 'SPINNING' : status}
        </p>
        {(spinning || status === 'RUNNING' || status === 'SPINNING') && (
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

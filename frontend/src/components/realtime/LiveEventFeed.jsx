import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWheelStore } from '../../store/wheel.store';

const EVENT_STYLES = {
  info:  { color: 'text-[#4cd6ff]',  dot: 'bg-[#4cd6ff]',  bg: 'bg-[#4cd6ff]/5'  },
  join:  { color: 'text-[#a8e6cf]',  dot: 'bg-[#a8e6cf]',  bg: 'bg-[#a8e6cf]/5'  },
  start: { color: 'text-[#ffda35]',  dot: 'bg-[#ffda35]',  bg: 'bg-[#ffda35]/5'  },
  elim:  { color: 'text-[#ff6b6b]',  dot: 'bg-[#ff6b6b]',  bg: 'bg-[#ff6b6b]/5'  },
  win:   { color: 'text-[#ffd700]',  dot: 'bg-[#ffd700]',  bg: 'bg-[#ffd700]/5'  },
  abort: { color: 'text-[#ff6b6b]',  dot: 'bg-[#ff6b6b]',  bg: 'bg-[#ff6b6b]/5'  },
};

export default function LiveEventFeed() {
  const gameLog = useWheelStore((s) => s.gameLog);
  const scrollRef = useRef(null);

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [gameLog.length]);

  return (
    <div className="glass-card rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-outline bg-white/[0.03] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6b6b] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff6b6b]" />
          </span>
          <h3 className="font-sora font-bold text-sm">Live Event Feed</h3>
        </div>
        {gameLog.length > 0 && (
          <span className="text-[10px] font-mono text-[#859399] bg-white/5 px-2 py-0.5 rounded-full">
            {gameLog.length} events
          </span>
        )}
      </div>

      {/* Events list */}
      <div ref={scrollRef} className="p-3 space-y-1.5 max-h-[280px] overflow-y-auto flex-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {gameLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-2xl">📡</p>
              <p className="text-[#859399] text-xs font-mono">Waiting for events…</p>
              <p className="text-[#859399]/50 text-[10px] font-mono">Events appear here in real-time</p>
            </div>
          ) : gameLog.map((entry, i) => {
            const s = EVENT_STYLES[entry.type] || EVENT_STYLES.info;
            return (
              <motion.div
                key={`${entry.type}-${i}-${entry.time}`}
                initial={{ opacity: 0, x: -12, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`flex items-start gap-3 rounded-lg px-3 py-2 ${s.bg} border border-white/[0.03]`}
              >
                {/* Dot indicator */}
                <span className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${s.dot} shadow-[0_0_6px_currentColor]`} />

                {/* Message */}
                <p className={`text-xs flex-1 leading-relaxed ${s.color}`}>
                  {entry.msg}
                </p>

                {/* Timestamp */}
                <p className="text-[10px] text-[#859399]/60 font-mono flex-shrink-0 mt-0.5">
                  {new Date(entry.time).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

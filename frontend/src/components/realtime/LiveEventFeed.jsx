import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '../../utils/formatters';
import { useWheelStore } from '../../store/wheel.store';

const EVENT_STYLES = {
  info:  { color: 'text-primary',   dot: 'bg-primary'   },
  join:  { color: 'text-secondary', dot: 'bg-secondary'  },
  start: { color: 'text-tertiary',  dot: 'bg-tertiary'   },
  elim:  { color: 'text-error',     dot: 'bg-error'      },
  win:   { color: 'text-tertiary',  dot: 'bg-tertiary'   },
  abort: { color: 'text-on-muted',  dot: 'bg-on-muted'   },
};

export default function LiveEventFeed() {
  const gameLog = useWheelStore((s) => s.gameLog);

  return (
    <div className="glass-card rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-outline bg-white/[0.03] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-error animate-blink" />
        <h3 className="font-sora font-bold text-sm">Live Event Feed</h3>
      </div>
      <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence initial={false}>
          {gameLog.length === 0 ? (
            <p className="text-on-muted text-sm text-center py-6">No events yet…</p>
          ) : gameLog.map((entry, i) => {
            const s = EVENT_STYLES[entry.type] || EVENT_STYLES.info;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3"
              >
                <span className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                <p className={`text-xs flex-1 ${s.color}`}>{entry.msg}</p>
                <p className="text-[10px] text-on-muted font-mono flex-shrink-0">
                  {new Date(entry.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

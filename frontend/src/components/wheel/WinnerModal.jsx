import { motion, AnimatePresence } from 'framer-motion';
import { formatCoins } from '../../utils/formatters';
import Button from '../common/Button';

export default function WinnerModal({ open, winner, prizePool, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', damping: 14, stiffness: 200 } }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="glass-card rounded-xl p-10 text-center max-w-sm w-full animate-winner-glow"
            style={{ borderColor: 'rgba(255,218,53,0.5)' }}
          >
            <div className="text-7xl mb-4">🏆</div>
            <h2 className="font-sora font-black text-4xl grad-text mb-2">WINNER!</h2>
            <p className="font-mono text-2xl text-tertiary mb-1">{winner?.name || winner?.userId || 'Unknown'}</p>
            <p className="text-on-muted text-sm mb-1">has claimed the prize pool</p>
            {prizePool != null && (
              <p className="font-mono text-3xl text-primary mt-3 mb-6">{formatCoins(prizePool)} coins</p>
            )}
            <Button variant="primary" size="lg" full onClick={onClose}>
              CLOSE
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

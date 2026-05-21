import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function StatCard({ label, value, sub, icon, color = 'text-primary', className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('glass-card rounded-lg p-5 relative overflow-hidden hover:border-primary/20 transition-colors duration-200', className)}
    >
      <div className="relative z-10">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-on-muted mb-2">{label}</p>
        <p className={clsx('font-sora font-bold text-3xl leading-none', color)}>{value}</p>
        {sub && <p className="text-xs text-on-muted mt-1.5">{sub}</p>}
      </div>
      {icon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-10">
          {icon}
        </div>
      )}
    </motion.div>
  );
}

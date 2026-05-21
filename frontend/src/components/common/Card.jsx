import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Card({ children, className = '', hover = false, glow = false, pulse = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={clsx(
        'glass-card',
        hover && 'hover:border-primary/20 transition-colors duration-200',
        glow  && 'shadow-neon-primary',
        pulse && 'animate-neon-pulse',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

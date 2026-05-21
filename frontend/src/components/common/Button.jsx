import { motion } from 'framer-motion';
import clsx from 'clsx';

const variants = {
  primary:   'bg-grad-primary text-[#001f28] shadow-neon-primary hover:brightness-110 hover:shadow-[0_0_32px_rgba(76,214,255,0.5)]',
  secondary: 'bg-grad-secondary text-white shadow-neon-secondary hover:brightness-110',
  ghost:     'bg-white/5 border border-outline text-on-muted hover:bg-white/10 hover:text-on-bg',
  danger:    'bg-error/15 border border-error/30 text-error hover:bg-error/25',
  tertiary:  'bg-tertiary/15 border border-tertiary/30 text-tertiary hover:bg-tertiary/25',
};

const sizes = {
  sm: 'px-3 py-1.5 text-[10px]',
  md: 'px-5 py-2.5 text-[11px]',
  lg: 'px-7 py-3 text-[12px]',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  full = false,
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-widest',
        'rounded-md transition-all duration-200 cursor-pointer select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100',
        variants[variant],
        sizes[size],
        full && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
        </svg>
      ) : children}
    </motion.button>
  );
}

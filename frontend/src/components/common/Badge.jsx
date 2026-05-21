import clsx from 'clsx';

const styles = {
  primary:   'bg-primary/10 text-primary border-primary/25',
  secondary: 'bg-secondary/10 text-secondary border-secondary/25',
  tertiary:  'bg-tertiary/10 text-tertiary border-tertiary/25',
  error:     'bg-error/10 text-error border-error/25',
  success:   'bg-green-500/10 text-green-300 border-green-500/25',
  muted:     'bg-white/5 text-on-muted border-outline',
};

export default function Badge({ children, variant = 'primary', className = '' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full',
        'text-[10px] font-mono font-bold uppercase tracking-widest border',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

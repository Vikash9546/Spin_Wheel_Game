import clsx from 'clsx';

export default function Input({
  label,
  error,
  className = '',
  containerClass = '',
  ...props
}) {
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClass)}>
      {label && (
        <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-on-muted">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-full bg-white/5 border border-outline rounded-md px-4 py-2.5',
          'text-sm text-on-bg placeholder:text-on-muted/50 font-inter',
          'outline-none transition-all duration-200',
          'focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(76,214,255,0.1)]',
          error && 'border-error/50 focus:border-error',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

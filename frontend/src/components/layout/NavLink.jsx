import { NavLink as RouterNavLink } from 'react-router-dom';
import clsx from 'clsx';

export default function NavLink({ to, icon: Icon, label }) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-6 py-3 text-[11px] font-mono font-bold uppercase tracking-widest',
          'border-r-2 transition-all duration-200',
          isActive
            ? 'text-primary bg-primary/10 border-r-primary'
            : 'text-on-muted border-transparent hover:bg-white/5 hover:text-on-bg'
        )
      }
    >
      {Icon && <Icon size={18} />}
      {label}
    </RouterNavLink>
  );
}

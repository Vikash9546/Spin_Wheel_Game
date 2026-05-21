import clsx from 'clsx';
import { getInitials } from '../../utils/formatters';

export default function Avatar({ name = '', size = 'md', className = '' }) {
  const sizes = { sm: 'w-7 h-7 text-[11px]', md: 'w-9 h-9 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-sora font-bold flex-shrink-0',
        'bg-gradient-to-br from-primary to-secondary text-[#001f28]',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

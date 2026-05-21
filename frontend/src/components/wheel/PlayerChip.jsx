import { motion } from 'framer-motion';
import clsx from 'clsx';
import Avatar from '../common/Avatar';

export default function PlayerChip({ player, index }) {
  const { user, eliminatedAt, isWinner } = player;
  const name = user?.name || player.userId || `Player ${index + 1}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={clsx(
        'player-chip',
        eliminatedAt && 'eliminated',
        isWinner     && 'winner'
      )}
    >
      <Avatar name={name} size="sm" />
      <span className="flex-1 text-sm font-inter truncate">{name}</span>
      <span className="text-base">
        {isWinner     ? '🏆' : eliminatedAt ? '💀' : `#${index + 1}`}
      </span>
    </motion.div>
  );
}

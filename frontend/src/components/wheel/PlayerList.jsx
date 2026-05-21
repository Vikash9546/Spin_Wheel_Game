import { AnimatePresence } from 'framer-motion';
import PlayerChip from './PlayerChip';
import Badge from '../common/Badge';

export default function PlayerList({ participants = [] }) {
  const activeCount = participants.filter((p) => !p.eliminatedAt).length;

  return (
    <div className="glass-card rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline bg-white/[0.03]">
        <h3 className="font-sora font-bold text-sm">Players</h3>
        <Badge variant="primary">{participants.length} joined</Badge>
      </div>

      <div className="p-4 flex flex-col gap-2 max-h-[480px] overflow-y-auto">
        {participants.length === 0 ? (
          <p className="text-center text-on-muted text-sm py-10">Waiting for players…</p>
        ) : (
          <AnimatePresence>
            {participants.map((p, i) => (
              <PlayerChip key={p.id || p.userId} player={p} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {participants.length > 0 && (
        <div className="px-5 py-2.5 border-t border-outline text-[11px] font-mono text-on-muted flex justify-between">
          <span>Active: {activeCount}</span>
          <span>Eliminated: {participants.length - activeCount}</span>
        </div>
      )}
    </div>
  );
}

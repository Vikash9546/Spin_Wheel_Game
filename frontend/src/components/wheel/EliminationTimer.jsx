import { useState, useEffect, useRef } from 'react';
import { formatCountdown } from '../../utils/formatters';

export default function EliminationTimer({ nextEliminationAt, onExpire }) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!nextEliminationAt) { setSeconds(0); return; }

    function tick() {
      const diff = Math.max(0, Math.floor((new Date(nextEliminationAt) - Date.now()) / 1000));
      setSeconds(diff);
      if (diff === 0) {
        clearInterval(intervalRef.current);
        onExpire?.();
      }
    }

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [nextEliminationAt]);

  const urgent = seconds <= 3 && seconds > 0;

  return (
    <div className="flex flex-col items-center">
      <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-on-muted mb-1">Next Elimination</p>
      <p
        className={`font-mono font-bold text-4xl transition-colors duration-300 ${urgent ? 'text-error animate-blink' : 'text-primary'}`}
      >
        {formatCountdown(seconds)}
      </p>
    </div>
  );
}

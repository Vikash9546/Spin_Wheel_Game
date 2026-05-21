import { useSocketStore } from '../../store/socket.store';

export default function ConnectionStatus() {
  const connected = useSocketStore((s) => s.connected);
  return (
    <div className={`flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest ${
      connected ? 'text-green-400' : 'text-error'
    }`}>
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-blink' : 'bg-error'}`} />
      {connected ? 'LIVE' : 'OFFLINE'}
    </div>
  );
}

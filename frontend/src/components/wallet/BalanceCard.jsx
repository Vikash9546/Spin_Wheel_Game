import { motion } from 'framer-motion';
import { RiWalletLine } from 'react-icons/ri';
import { formatCoins } from '../../utils/formatters';
import { useWalletStore } from '../../store/wallet.store';
import Button from '../common/Button';

export default function BalanceCard({ onDeposit, onWithdraw }) {
  const coins = useWalletStore((s) => s.coins);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-lg p-6 relative overflow-hidden shadow-neon-primary col-span-2"
      style={{ background: 'linear-gradient(135deg, rgba(76,214,255,0.07), rgba(26,29,41,0.9))' }}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-on-muted">Available Balance</p>
        <RiWalletLine size={22} className="text-primary/30" />
      </div>
      <p className="font-sora font-black text-5xl grad-text leading-none mb-1">{formatCoins(coins)}</p>
      <p className="text-[10px] font-mono uppercase tracking-widest text-on-muted">COINS</p>
      <div className="flex gap-3 mt-5">
        <Button variant="ghost" onClick={onDeposit}>+ DEPOSIT</Button>
        <Button variant="ghost" onClick={onWithdraw}>- WITHDRAW</Button>
      </div>
      <RiWalletLine size={110} className="absolute -right-4 -bottom-4 opacity-[0.04]" />
    </motion.div>
  );
}

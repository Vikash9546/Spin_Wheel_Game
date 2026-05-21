import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useWalletStore } from '../../store/wallet.store';
import { WalletService } from '../../services/wallet.service';
import { formatCoins } from '../../utils/formatters';
import { parseError } from '../../utils/helpers';
import {
  RiCopperCoinLine, RiArrowLeftRightLine,
  RiAddCircleLine, RiArrowRightUpLine, RiShieldKeyholeLine,
  RiBtcLine, RiBankCardLine, RiBankLine, RiFileTextLine,
  RiFilter3Line, RiCheckDoubleLine
} from 'react-icons/ri';

export default function Wallet() {
  const coins = useWalletStore((s) => s.coins);
  const setCoins = useWalletStore((s) => s.setCoins);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalLiquidity: 1280450, availableCoins: 0 });
  const [transactions, setTransactions] = useState([]);
  
  // Deposit state
  const [depMethod, setDepMethod] = useState('BTC'); // BTC, CARD, BANK
  const [depAmount, setDepAmount] = useState('');
  
  // Withdrawal state
  const [wdAmount, setWdAmount] = useState('');

  const fetchWalletData = useCallback(async () => {
    try {
      const [sumData, txData] = await Promise.all([
        WalletService.getSummary(),
        WalletService.getTransactions()
      ]);
      setSummary(sumData);
      setTransactions(txData);
      // Sync store coins balance
      setCoins(sumData.availableCoins);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    }
  }, [setCoins]);

  // Initial fetch
  useEffect(() => {
    const timeout = setTimeout(fetchWalletData, 0);
    return () => clearTimeout(timeout);
  }, [fetchWalletData]);

  // Handle deposit submit
  async function handleDeposit(e) {
    e.preventDefault();
    const val = parseFloat(depAmount);
    if (!val || val <= 0) {
      toast.error('Please enter a valid positive deposit amount.');
      return;
    }

    setLoading(true);
    try {
      await WalletService.deposit(val);
      toast.success(`Successfully deposited $${val.toFixed(2)} using ${depMethod}! 💳`);
      setDepAmount('');
      await fetchWalletData();
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  // Handle withdrawal submit
  async function handleWithdraw(e) {
    e.preventDefault();
    const val = parseFloat(wdAmount);
    if (!val || val <= 0) {
      toast.error('Please enter a valid positive withdrawal amount.');
      return;
    }

    if (coins < val) {
      toast.error('Insufficient balance to perform this withdrawal.');
      return;
    }

    setLoading(true);
    try {
      await WalletService.withdraw(val);
      toast.success(`Successfully initiated transfer for $${val.toFixed(2)}! 💸`);
      setWdAmount('');
      await fetchWalletData();
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  // Dynamic calculations for withdrawal
  const wdVal = parseFloat(wdAmount) || 0;
  const wdFee = wdVal * 0.015;
  const wdReceive = Math.max(0, wdVal - wdFee);

  // Helper to format date matching Oct 24, 2024
  function formatDateString(dateStr) {
    const d = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  // Action callback for detail check
  function showReceipt(tx) {
    toast(() => (
      <div className="font-mono text-xs text-[#e1e1ef] space-y-1">
        <p className="font-bold text-primary border-b border-white/10 pb-1.5 uppercase mb-1">Receipt Detail</p>
        <p><span className="text-[#859399]">Tx ID:</span> {tx.id.substring(0, 18)}...</p>
        <p><span className="text-[#859399]">Type:</span> {tx.type}</p>
        <p><span className="text-[#859399]">Amount:</span> {formatCoins(tx.amount)}</p>
        <p><span className="text-[#859399]">Before:</span> {formatCoins(tx.balanceBefore)}</p>
        <p><span className="text-[#859399]">After:</span> {formatCoins(tx.balanceAfter)}</p>
        <p className="text-[10px] text-[#859399] pt-1">{new Date(tx.createdAt).toLocaleString()}</p>
      </div>
    ), { duration: 5000 });
  }

  return (
    <div className="w-full flex flex-col font-inter p-6 md:p-8 space-y-6 max-h-[calc(100vh-64px)] overflow-y-auto bg-[#080a12]">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-sora font-extrabold text-3xl text-white tracking-wide m-0">
            Financial Command
          </h1>
          <p className="font-inter text-xs text-[#859399] m-0 mt-1 uppercase tracking-wider">
            Secure liquidation and asset management.
          </p>
        </div>
        <div className="bg-[#121422] border border-[#1b2035] rounded-xl px-4 py-2 self-start md:self-center flex items-center gap-2">
          <RiShieldKeyholeLine className="text-primary text-base" />
          <span className="font-mono text-[10px] text-[#859399] uppercase tracking-widest font-bold">
            Secured Connection
          </span>
        </div>
      </div>

      {/* ── Top Metric Cards Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Liquidity card */}
        <div className="bg-gradient-to-br from-[#0c0e17]/85 to-[#0b0c16]/50 rounded-2xl p-6 border border-white/[0.04] relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono text-[9px] text-[#859399] tracking-[0.2em] uppercase font-bold">
              TOTAL LIQUIDITY
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#00d1ff]/10 flex items-center justify-center text-[#00d1ff] border border-[#00d1ff]/20">
              <RiArrowLeftRightLine size={16} />
            </div>
          </div>
          <div className="font-sora text-3xl font-black text-[#00d1ff] tracking-wide leading-none">
            ${summary.totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="font-mono text-[10px] text-green-400 font-bold uppercase tracking-wider mt-3.5 flex items-center gap-1.5">
            <span>↗</span> +12.4% vs last week
          </div>
        </div>

        {/* Available for Play card */}
        <div className="bg-gradient-to-br from-[#0c0e17]/85 to-[#0b0c16]/50 rounded-2xl p-6 border border-white/[0.04] relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono text-[9px] text-[#859399] tracking-[0.2em] uppercase font-bold">
              AVAILABLE FOR PLAY
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#cf5cff]/10 flex items-center justify-center text-[#cf5cff] border border-[#cf5cff]/20">
              <RiCopperCoinLine size={16} />
            </div>
          </div>
          <div className="font-sora text-3xl font-black text-[#ff7bf0] tracking-wide leading-none">
            ${coins.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="font-mono text-[10px] text-[#859399] font-bold uppercase tracking-wider mt-3.5">
            Instantly withdrawable
          </div>
        </div>
      </div>

      {/* ── Center Deposit, Withdraw, and Security Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. DEPOSIT CARD */}
        <div className="bg-[#0b0d16] rounded-2xl p-5 border border-white/[0.05] flex flex-col justify-between shadow-md">
          <div>
            <h3 className="font-sora font-extrabold text-sm text-white m-0 flex items-center gap-2">
              <RiAddCircleLine className="text-primary text-lg" />
              Deposit
            </h3>
            <p className="font-inter text-xs text-[#859399] m-0 mt-1.5 mb-6">
              Top up your balance instantly using crypto or fiat.
            </p>

            {/* Payment tab selections */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { id: 'BTC', label: 'BTC', icon: RiBtcLine },
                { id: 'CARD', label: 'CARD', icon: RiBankCardLine },
                { id: 'BANK', label: 'BANK', icon: RiBankLine }
              ].map((method) => {
                const isActive = depMethod === method.id;
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setDepMethod(method.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border transition-all duration-300 ${
                      isActive
                        ? 'bg-primary/[0.06] border-primary text-primary shadow-[0_0_12px_rgba(164,230,255,0.12)]'
                        : 'bg-[#121422]/50 border-white/[0.04] text-[#859399] hover:text-white hover:bg-[#121422]'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest">{method.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Amount input */}
            <form onSubmit={handleDeposit} className="space-y-6">
              <div className="flex flex-col">
                <label className="font-mono text-[9px] text-[#5a6a70] tracking-widest uppercase mb-2 font-bold">
                  AMOUNT (USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={depAmount}
                    onChange={(e) => setDepAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    className="w-full bg-[#121422]/70 border border-white/[0.08] rounded-xl py-3 px-4 text-sm font-mono text-white outline-none focus:border-primary/40 focus:bg-[#121422] transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-[#5a6a70] font-bold">
                    USD
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#00d1ff] text-white font-sora font-extrabold text-xs tracking-widest uppercase rounded-xl hover:brightness-105 active:scale-98 transition-all disabled:opacity-50 shadow-[0_4px_16px_rgba(0,209,255,0.25)]"
              >
                {loading ? 'PROCESSING...' : 'CONFIRM DEPOSIT'}
              </button>
            </form>
          </div>
        </div>

        {/* 2. WITHDRAW CARD */}
        <div className="bg-[#0b0d16] rounded-2xl p-5 border border-white/[0.05] flex flex-col justify-between shadow-md">
          <div>
            <h3 className="font-sora font-extrabold text-sm text-white m-0 flex items-center gap-2">
              <RiArrowRightUpLine className="text-[#cf5cff] text-lg" />
              Withdraw
            </h3>
            <p className="font-inter text-xs text-[#859399] m-0 mt-1.5 mb-6">
              Securely transfer funds back to your destination.
            </p>

            <form onSubmit={handleWithdraw} className="space-y-6">
              {/* Amount input */}
              <div className="flex flex-col">
                <label className="font-mono text-[9px] text-[#5a6a70] tracking-widest uppercase mb-2 font-bold">
                  WITHDRAW AMOUNT
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={wdAmount}
                    onChange={(e) => setWdAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    className="w-full bg-[#121422]/70 border border-white/[0.08] rounded-xl py-3 px-4 text-sm font-mono text-white outline-none focus:border-[#cf5cff]/40 focus:bg-[#121422] transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-[#5a6a70] font-bold">
                    USD
                  </span>
                </div>
              </div>

              {/* Dynamic conversions details */}
              <div className="space-y-2 bg-[#121422]/40 rounded-xl p-3 border border-white/[0.03]">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-[#5a6a70] uppercase tracking-wider">Network Fee (1.5%)</span>
                  <span className="font-mono text-xs text-[#ff6b6b] font-bold">-${wdFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-[#5a6a70] uppercase tracking-wider">Est. Arrival</span>
                  <span className="font-mono text-xs text-[#859399] font-bold">~5-10 Minutes</span>
                </div>
                <div className="h-px bg-white/[0.04] my-1" />
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-[#e1e1ef] uppercase tracking-wider font-extrabold">You Receive</span>
                  <span className="font-mono text-xs text-white font-extrabold">${wdReceive.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-transparent text-white font-sora font-extrabold text-xs tracking-widest uppercase rounded-xl border border-white/[0.08] hover:bg-white/[0.02] hover:border-white/[0.15] active:scale-98 transition-all disabled:opacity-50"
              >
                {loading ? 'PROCESSING...' : 'INITIATE TRANSFER'}
              </button>
            </form>
          </div>
        </div>

        {/* 3. SECURITY STATUS CARD */}
        <div className="bg-[#0b0d16] rounded-2xl p-5 border border-white/[0.05] shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-sora font-extrabold text-sm text-white m-0 flex items-center gap-2">
              <RiShieldKeyholeLine className="text-[#ffda35] text-lg" />
              Security Status
            </h3>

            {/* List entries */}
            <div className="space-y-3 pt-2">
              {/* 2FA block */}
              <div className="flex gap-3.5 items-start p-3 bg-[#121422]/30 rounded-xl border border-white/[0.03]">
                <div className="w-1.5 h-8 rounded bg-primary" />
                <div>
                  <h4 className="font-sora font-bold text-xs text-white m-0 uppercase tracking-wide">2FA ACTIVE</h4>
                  <p className="font-inter text-[10px] text-[#859399] m-0 mt-0.5">Your account is fully protected.</p>
                </div>
              </div>

              {/* Whitelist block */}
              <div className="flex gap-3.5 items-start p-3 bg-[#121422]/30 rounded-xl border border-white/[0.03]">
                <div className="w-1.5 h-8 rounded bg-[#cf5cff]" />
                <div>
                  <h4 className="font-sora font-bold text-xs text-white m-0 uppercase tracking-wide">WHITELISTED WALLETS</h4>
                  <p className="font-inter text-[10px] text-[#859399] m-0 mt-0.5">Withdrawals only to verified addresses.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pro tip callout */}
          <div className="p-3.5 rounded-xl border border-[#ffda35]/25 bg-[#ffda35]/[0.02] mt-4">
            <span className="font-mono text-[9px] text-[#ffda35] uppercase tracking-widest font-black block mb-1">
              PRO TIP
            </span>
            <p className="font-inter text-[10px] text-[#859399] leading-relaxed m-0">
              Large withdrawals (over $50,000) may require manual audit for elite player protection.
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom Section Transaction Ledger ── */}
      <div className="bg-[#0b0d16] rounded-2xl overflow-hidden border border-white/[0.05] shadow-md flex-1">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.04] bg-[#0c0e17]/50">
          <h3 className="font-sora font-extrabold text-sm text-white m-0">Transaction Ledger</h3>
          <button className="flex items-center gap-1.5 font-mono text-[9px] text-[#859399] uppercase tracking-widest font-bold hover:text-white transition-colors bg-transparent border-0 outline-none cursor-pointer">
            <RiFilter3Line size={13} />
            Filter
          </button>
        </div>

        {/* Ledger Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/[0.03] text-left">
                {['TRANSACTION ID', 'TYPE', 'DATE', 'AMOUNT', 'STATUS', 'ACTION'].map((head) => (
                  <th
                    key={head}
                    className="px-6 py-3.5 font-mono text-[9px] text-[#5a6a70] uppercase tracking-[0.15em] font-bold"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {transactions.map((tx) => {
                const isDeposit = tx.type === 'DEPOSIT' || tx.type === 'WIN_REWARD' || tx.type === 'REFUND';
                const sign = isDeposit ? '+' : '';
                
                // Color badges matching mockup Types
                let badgeStyle = 'bg-white/5 text-[#859399]';
                if (tx.type === 'JOIN_DEBIT') badgeStyle = 'bg-red-500/10 text-red-400 border border-red-500/15';
                if (tx.type === 'WIN_REWARD') badgeStyle = 'bg-green-500/10 text-green-400 border border-green-500/15';
                if (tx.type === 'DEPOSIT') badgeStyle = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15';
                if (tx.type === 'WITHDRAWAL') badgeStyle = 'bg-purple-500/10 text-purple-400 border border-purple-500/15';
                if (tx.type === 'REFUND') badgeStyle = 'bg-blue-500/10 text-blue-400 border border-blue-500/15';

                const displayAmount = Math.abs(tx.amount);

                return (
                  <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                    {/* Tx ID */}
                    <td className="px-6 py-4 font-mono text-xs text-white">
                      #EL-{tx.id.substring(0, 6).toUpperCase()}
                    </td>

                    {/* Type Badge */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-wider ${badgeStyle}`}>
                        {tx.type}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 font-mono text-[10px] text-[#859399] uppercase">
                      {formatDateString(tx.createdAt)}
                    </td>

                    {/* Amount */}
                    <td className={`px-6 py-4 font-mono font-bold text-xs ${isDeposit ? 'text-cyan-400' : 'text-red-400'}`}>
                      {sign}${displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[#00d1ff] font-mono text-[9px] uppercase tracking-wider font-extrabold">
                        <RiCheckDoubleLine size={13} className="text-[#00d1ff]" />
                        CONFIRMED
                      </div>
                    </td>

                    {/* Action Icon */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => showReceipt(tx)}
                        className="p-1 rounded bg-[#121422]/50 hover:bg-[#1a1d30] border border-white/[0.05] text-[#859399] hover:text-white transition-colors"
                      >
                        <RiFileTextLine size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-[#5a6a70] font-mono tracking-wider uppercase">
                    No transactions recorded on this account
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

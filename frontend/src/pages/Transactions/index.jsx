import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  RiSearchLine, RiCalendarEventLine, RiArrowDownSLine,
  RiStarFill, RiGamepadLine, RiBankLine, RiCloseCircleLine,
  RiPriceTag3Line, RiCopperCoinLine, RiArrowRightUpLine,
  RiDownloadLine, RiArrowLeftSLine, RiArrowRightSLine,
  RiArrowLeftDoubleLine, RiArrowRightDoubleLine
} from 'react-icons/ri';
import { WalletService } from '../../services/wallet.service';
import { useAuthStore } from '../../store/auth.store';
import { formatCoins } from '../../utils/formatters';

export default function Transactions() {
  // Queries & state
  const role = useAuthStore((s) => s.role);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, REWARD, ENTRY, ADMIN
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Date picker dropdown state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  // Transactions data
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const datePickerRef = useRef(null);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsDatePickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch transactions from backend
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await WalletService.getTransactions({
        page: currentPage,
        limit: pageSize,
        search,
        type: activeTab,
        startDate: appliedStartDate,
        endDate: appliedEndDate,
        paginated: true,
      });

      if (data && typeof data === 'object') {
        setTransactions(data.transactions || []);
        setTotalCount(data.total || 0);
      } else {
        // Fallback for non-paginated flat array
        setTransactions(data || []);
        setTotalCount((data || []).length);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to retrieve transactions.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, search, activeTab, appliedStartDate, appliedEndDate]);

  // Trigger fetch when parameters modify
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTransactions();
    }, search ? 300 : 0);

    return () => clearTimeout(handler);
  }, [fetchTransactions, search]);

  // Reset page to 1 when changing tabs/size/search
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, pageSize, search, appliedStartDate, appliedEndDate]);

  // Copy transaction ID to clipboard
  function handleCopyTxId(fullId) {
    const formattedId = `TX-${fullId.substring(0, 8).toUpperCase()}`;
    navigator.clipboard.writeText(fullId);
    toast.success(`Copied Transaction ID: ${formattedId} 📋`);
  }

  // Handle Export to CSV
  async function handleExportCSV() {
    try {
      toast.loading('Preparing CSV export...', { id: 'csv-toast' });
      // Retrieve ALL transactions matching current filters (without page limit)
      const allData = await WalletService.getTransactions({
        search,
        type: activeTab,
        startDate: appliedStartDate,
        endDate: appliedEndDate,
        paginated: false,
      });

      if (!allData || allData.length === 0) {
        toast.error('No transactions available to export.', { id: 'csv-toast' });
        return;
      }

      // Format data as CSV
      const headers = ['Date & Time', 'Transaction ID', 'Activity', 'Type', 'Status', 'Amount (USD)'];
      const rows = allData.map(tx => {
        const dateFormatted = `${new Date(tx.createdAt).toLocaleDateString()} ${new Date(tx.createdAt).toLocaleTimeString()} UTC`;
        const txId = `TX-${tx.id.substring(0, 8).toUpperCase()}`;
        const activity = tx.referenceId || getFallbackActivity(tx.type);
        const type = getMappedType(tx.type);
        const status = tx.referenceType === 'Failed' ? 'REJECTED' : 'COMPLETED';
        const amount = (Number(tx.amount) / 100).toFixed(2);
        
        return [
          `"${dateFormatted}"`,
          `"${txId}"`,
          `"${activity}"`,
          `"${type}"`,
          `"${status}"`,
          amount
        ];
      });

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      // Build download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `eliminator_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Transaction history exported to CSV! 📥', { id: 'csv-toast' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV.', { id: 'csv-toast' });
    }
  }

  // Mappers and Helpers
  function getMappedType(type) {
    if (type === 'WIN_REWARD' || type === 'ADMIN_REWARD') return 'REWARD';
    if (type === 'JOIN_DEBIT' || type === 'REFUND') return 'ENTRY';
    return 'ADMIN';
  }

  function getFallbackActivity(type) {
    if (type === 'WIN_REWARD') return 'Mega Spin Win';
    if (type === 'JOIN_DEBIT') return 'ELIMINATOR Tournament Entry';
    if (type === 'DEPOSIT') return 'Wallet Top-up';
    if (type === 'WITHDRAWAL') return 'Wallet Cash-out';
    if (type === 'ADMIN_REWARD') return 'Loyalty Bonus';
    if (type === 'REFUND') return 'Tournament Entry Refund';
    return 'Platform Transaction';
  }

  function getActivityConfig(tx) {
    const isFailed = tx.referenceType === 'Failed';
    if (tx.type === 'WIN_REWARD') {
      return {
        icon: RiStarFill,
        bg: 'bg-yellow-500 text-[#080a12]',
        text: 'text-[#ffda35]',
      };
    }
    if (tx.type === 'JOIN_DEBIT') {
      return isFailed ? {
        icon: RiCloseCircleLine,
        bg: 'bg-red-500/20 border border-red-500/30 text-red-500',
        text: 'text-red-400',
      } : {
        icon: RiGamepadLine,
        bg: 'bg-[#1a1d30] border border-[#23273a] text-white',
        text: 'text-white',
      };
    }
    if (tx.type === 'DEPOSIT') {
      return {
        icon: RiBankLine,
        bg: 'bg-[#1a1d30] border border-[#23273a] text-white',
        text: 'text-white',
      };
    }
    if (tx.type === 'WITHDRAWAL') {
      return {
        icon: RiArrowRightUpLine,
        bg: 'bg-[#1a1d30] border border-[#23273a] text-white',
        text: 'text-white',
      };
    }
    if (tx.type === 'ADMIN_REWARD') {
      return {
        icon: RiPriceTag3Line,
        bg: 'bg-purple-500 text-white',
        text: 'text-[#cf5cff]',
      };
    }
    if (tx.type === 'REFUND') {
      return {
        icon: RiCopperCoinLine,
        bg: 'bg-blue-500 text-white',
        text: 'text-blue-400',
      };
    }
    return {
      icon: RiCopperCoinLine,
      bg: 'bg-[#bbc9cf] text-[#080a12]',
      text: 'text-[#bbc9cf]',
    };
  }

  // Clear date filters
  function handleClearDateFilter() {
    setStartDateInput('');
    setEndDateInput('');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setIsDatePickerOpen(false);
  }

  // Apply date filters
  function handleApplyDateFilter() {
    setAppliedStartDate(startDateInput);
    setAppliedEndDate(endDateInput);
    setIsDatePickerOpen(false);
  }

  // Quick select date helpers
  function handleQuickDateSelect(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const startISO = start.toISOString().split('T')[0];
    const endISO = end.toISOString().split('T')[0];

    setStartDateInput(startISO);
    setEndDateInput(endISO);
    setAppliedStartDate(startISO);
    setAppliedEndDate(endISO);
    setIsDatePickerOpen(false);
  }

  // Format date range string for display
  function getActiveDateRangeLabel() {
    if (!appliedStartDate && !appliedEndDate) {
      return 'Oct 24, 2023 - Oct 31, 2023'; // Default string matching mockup perfectly
    }
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const startStr = appliedStartDate ? new Date(appliedStartDate).toLocaleDateString('en-US', options) : 'Beginning';
    const endStr = appliedEndDate ? new Date(appliedEndDate).toLocaleDateString('en-US', options) : 'Today';
    return `${startStr} - ${endStr}`;
  }

  // Pagination bounds calculation
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, totalCount);

  // Generate pagination list with ellipses
  function getPaginationRange() {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    range.push(1);
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i < totalPages && i > 1) {
        range.push(i);
      }
    }
    if (totalPages > 1) {
      range.push(totalPages);
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  }

  return (
    <div className="space-y-6 font-inter text-[#cbd5e1] max-w-[1200px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sora font-extrabold text-xl text-white tracking-normal m-0">
            Transaction History
          </h1>
          <p className="text-[#859399] text-xs mt-1">
            View and export all financial movements within the ELIMINATOR ecosystem.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0e101b] hover:bg-white/[0.04] border border-[#23273a] hover:border-[#383e58] text-white font-sora font-bold text-xs uppercase tracking-wider transition-all duration-300 rounded-lg active:scale-98"
        >
          <RiDownloadLine size={15} />
          EXPORT TO CSV
        </button>
      </div>

      {/* ── Two-Row Control Bar/Filters Section ── */}
      <div className="flex flex-col gap-4 mb-6">
        
        {/* Row 1: Search and Date picker next to each other (compact, non-stretching) */}
        <div className="flex flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-64 md:w-72 group">
            <input
              type="text"
              placeholder="Search TxID or Activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-10 py-2 bg-[#0b0c13] border border-[#23273a] focus:border-[#4cd6ff]/40 rounded-[4px] text-xs font-inter text-[#e1e1ef] placeholder-[#5a6a70] outline-none transition-all duration-200"
              style={{ backgroundColor: '#0b0c13', color: '#e1e1ef', borderColor: '#23273a' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ef4444'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#23273a'}
              onFocus={(e) => e.currentTarget.style.borderColor = '#4cd6ff66'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#23273a'}
            />
            {/* <RiSearchLine className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#859399] text-base pointer-events-none" /> */}
          </div>

          {/* Date Picker Range Button */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center justify-between gap-2.5 px-3.5 py-2 bg-[#0b0c13] border border-[#23273a] hover:border-[#383e58] rounded-[4px] text-xs text-[#e1e1ef] font-inter cursor-pointer transition-all"
              style={{ backgroundColor: '#0b0c13', color: '#e1e1ef', borderColor: '#23273a' }}
            >
              <div className="flex items-center gap-2">
                <RiCalendarEventLine className="text-[#859399] text-sm" />
                <span className="font-semibold">{getActiveDateRangeLabel()}</span>
              </div>
              <RiArrowDownSLine className="text-[#859399] text-xs" />
            </button>

            <AnimatePresence>
              {isDatePickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 left-0 top-full mt-2 w-72 bg-[#0c0e17] border border-[#23273a] rounded-[6px] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                >
                  <div className="space-y-4">
                    {/* Quick selects */}
                    <div>
                      <span className="font-mono text-[9px] text-[#859399] uppercase tracking-widest font-black block mb-2">Quick Select</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => handleQuickDateSelect(7)}
                          className="py-1 px-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-[10px] rounded text-[#859399] hover:text-white"
                        >
                          7 Days
                        </button>
                        <button
                          onClick={() => handleQuickDateSelect(30)}
                          className="py-1 px-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-[10px] rounded text-[#859399] hover:text-white"
                        >
                          30 Days
                        </button>
                        <button
                          onClick={handleClearDateFilter}
                          className="py-1 px-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-[10px] rounded text-[#859399] hover:text-white"
                        >
                          All Time
                        </button>
                      </div>
                    </div>

                    {/* Custom inputs */}
                    <div className="space-y-2">
                      <span className="font-mono text-[9px] text-[#859399] uppercase tracking-widest font-black block">Custom Range</span>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col">
                          <label className="text-[9px] text-[#859399] font-bold uppercase tracking-wider mb-1 font-mono">Start Date</label>
                          <input
                            type="date"
                            value={startDateInput}
                            onChange={(e) => setStartDateInput(e.target.value)}
                            className="bg-[#121422] border border-[#23273a] focus:border-[#4cd6ff]/40 text-[10px] text-white rounded p-1.5 font-mono outline-none"
                            style={{ backgroundColor: '#121422', color: '#ffffff', borderColor: '#23273a' }}
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[9px] text-[#859399] font-bold uppercase tracking-wider mb-1 font-mono">End Date</label>
                          <input
                            type="date"
                            value={endDateInput}
                            onChange={(e) => setEndDateInput(e.target.value)}
                            className="bg-[#121422] border border-[#23273a] focus:border-[#4cd6ff]/40 text-[10px] text-white rounded p-1.5 font-mono outline-none"
                            style={{ backgroundColor: '#121422', color: '#ffffff', borderColor: '#23273a' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 justify-end border-t border-white/[0.04] pt-3">
                      <button
                        onClick={handleClearDateFilter}
                        className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-[#859399] hover:text-white bg-transparent border-0 outline-none cursor-pointer"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleApplyDateFilter}
                        className="px-3.5 py-1.5 text-[10px] uppercase font-bold bg-[#a4e6ff] hover:brightness-105 text-[#080a12] rounded shadow-neon shadow-[#a4e6ff]/20"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Row 2: Tabs on left, Page size dropdown on far right */}
        <div className="flex flex-row items-center justify-between gap-4 mt-2">
          {/* Tabs */}
          <div className="flex bg-[#0b0c13] border border-[#23273a] rounded-[4px] p-[2px]" style={{ backgroundColor: '#0b0c13', borderColor: '#23273a' }}>
            {(['ALL', 'REWARD', 'ENTRY'].concat(role === 'admin' ? ['ADMIN'] : [])).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1 rounded-[3px] font-sora font-extrabold text-[11px] md:text-xs tracking-wider transition-all duration-200 uppercase"
                style={
                  activeTab === tab
                    ? { backgroundColor: '#a4e6ff', color: '#080a12' }
                    : { backgroundColor: 'transparent', color: '#859399' }
                }
                onMouseEnter={(e) => {
                  if (activeTab !== tab) e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab) e.currentTarget.style.color = '#859399';
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Row Count Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[#859399] font-inter text-xs tracking-normal font-bold">Show:</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="appearance-none bg-[#0b0c13] border border-[#23273a] focus:border-[#4cd6ff]/40 rounded-[4px] pl-3 pr-8 py-1 text-xs font-inter font-bold text-white outline-none cursor-pointer hover:bg-white/[0.02] transition-all"
                style={{ backgroundColor: '#0b0c13', color: '#ffffff', borderColor: '#23273a' }}
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>
              <RiArrowDownSLine className="absolute right-2 top-1/2 -translate-y-1/2 text-[#859399] pointer-events-none" size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Container Card ── */}
      <div className="bg-[#0b0c13] border border-[#1b1e2e] rounded-xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.4)] relative">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#1b1e2e] text-left bg-[#08090f]/30">
                {['DATE & TIME', 'TRANSACTION ID', 'ACTIVITY', 'TYPE', 'STATUS', 'AMOUNT'].map((head) => (
                  <th
                    key={head}
                    className="px-6 py-4 font-sora text-[10px] text-[#859399] uppercase tracking-normal font-extrabold"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1e2e]/55">
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4.5"><div className="h-4 bg-white/5 rounded w-24 mb-1.5" /><div className="h-3 bg-white/5 rounded w-16" /></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-white/5 rounded w-20" /></td>
                    <td className="px-6 py-4.5"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-white/5" /><div className="h-4 bg-white/5 rounded w-36" /></div></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-white/5 rounded w-12" /></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-white/5 rounded w-20" /></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-white/5 rounded w-16" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-error font-mono tracking-wider uppercase">
                    {error}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-xs text-[#5a6a70] font-mono tracking-wider uppercase">
                    No matching transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const activityCfg = getActivityConfig(tx);
                  const Icon = activityCfg.icon;
                  const typeLabel = getMappedType(tx.type);
                  const isDeposit = tx.type === 'DEPOSIT' || tx.type === 'WIN_REWARD' || tx.type === 'REFUND';
                  const isFailed = tx.referenceType === 'Failed';
                  const sign = isDeposit ? '+' : '-';
                  
                  // Row amount text styling
                  let textStyle = isDeposit ? 'text-[#2dd4bf]' : 'text-white';
                  if (tx.amount === 0 || isFailed) textStyle = 'text-[#5a6a70]';

                  // Type badge styling
                  let typeStyle = 'bg-slate-800/60 text-slate-300 border border-slate-700/30';
                  if (typeLabel === 'REWARD') typeStyle = 'bg-[#cf5cff]/20 text-[#ecb2ff] border border-[#cf5cff]/20';
                  if (typeLabel === 'ADMIN') typeStyle = 'bg-teal-900/40 text-teal-300 border border-teal-800/20';

                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors group">
                      {/* Date & Time */}
                      <td className="px-6 py-4.5">
                        <div className="font-sora font-bold text-[13px] text-[#e2e8f0] group-hover:text-white transition-colors">
                          {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </div>
                        <div className="font-mono text-[9px] text-[#64748b] mt-0.5 uppercase tracking-wide">
                          {new Date(tx.createdAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
                        </div>
                      </td>

                      {/* Transaction ID */}
                      <td className="px-6 py-4.5">
                        <button
                          onClick={() => handleCopyTxId(tx.id)}
                          className="font-mono font-bold text-xs text-[#4cd6ff] hover:underline bg-transparent border-0 cursor-pointer outline-none transition-all tracking-wide"
                        >
                          TX-{tx.id.substring(0, 8).toUpperCase()}
                        </button>
                      </td>

                      {/* Activity */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activityCfg.bg} transition-transform group-hover:scale-105 duration-300`}>
                            <Icon size={14} />
                          </div>
                          <span className="font-sora font-bold text-[13px] text-[#e2e8f0] group-hover:text-white transition-colors">
                            {tx.referenceId || getFallbackActivity(tx.type)}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4.5">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider ${typeStyle}`}>
                          {typeLabel}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-1.5">
                          {isFailed ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                              <span className="font-mono text-[9px] uppercase tracking-widest font-black text-red-400">REJECTED</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)] animate-blink" />
                              <span className="font-mono text-[9px] uppercase tracking-widest font-black text-[#2dd4bf]">COMPLETED</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className={`px-6 py-4.5 font-mono font-black text-sm tracking-wide ${textStyle}`}>
                        {isFailed ? '' : sign}${formatCoins(Math.abs(tx.amount))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer / Pagination ── */}
        {!loading && !error && transactions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4.5 border-t border-[#1b1e2e]/55 bg-[#08090f]/15">
            {/* Counts */}
            <div className="text-xs font-inter text-[#859399]">
              Showing <span className="text-[#e1e1ef] font-mono font-bold">{startRow}-{endRow}</span> of <span className="text-[#e1e1ef] font-mono font-bold">{totalCount.toLocaleString()}</span> transactions
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="w-7 h-7 rounded bg-transparent border border-[#23273a] hover:bg-white/[0.03] disabled:opacity-30 disabled:pointer-events-none text-[#859399] hover:text-white flex items-center justify-center transition-all"
              >
                <RiArrowLeftDoubleLine size={13} />
              </button>

              {/* Prev Page */}
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="w-7 h-7 rounded bg-transparent border border-[#23273a] hover:bg-white/[0.03] disabled:opacity-30 disabled:pointer-events-none text-[#859399] hover:text-white flex items-center justify-center transition-all"
              >
                <RiArrowLeftSLine size={13} />
              </button>

              {/* Page Numbers */}
              {getPaginationRange().map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={idx} className="w-7 h-7 text-xs text-[#859399]/50 flex items-center justify-center font-mono">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded text-xs font-mono font-bold transition-all ${
                      currentPage === p
                        ? 'bg-[#a4e6ff] text-[#080a12] font-black'
                        : 'border border-[#23273a] bg-transparent hover:bg-white/[0.03] text-[#859399] hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="w-7 h-7 rounded bg-transparent border border-[#23273a] hover:bg-white/[0.03] disabled:opacity-30 disabled:pointer-events-none text-[#859399] hover:text-white flex items-center justify-center transition-all"
              >
                <RiArrowRightSLine size={13} />
              </button>

              {/* Last Page */}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="w-7 h-7 rounded bg-transparent border border-[#23273a] hover:bg-white/[0.03] disabled:opacity-30 disabled:pointer-events-none text-[#859399] hover:text-white flex items-center justify-center transition-all"
              >
                <RiArrowRightDoubleLine size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Esports Layout Custom Footer ── */}
      <footer className="mt-12 border-t border-[#1b1e2e] pt-6 pb-8 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#08090f] px-8 -mx-7 -mb-20">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
          <span className="font-sora font-black text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#ff7bf0] to-[#cf5cff]">
            ELIMINATOR ESPORTS
          </span>
          <span className="text-[#5a6a70] text-[10px] font-mono uppercase tracking-widest text-center sm:text-left mt-1 sm:mt-0">
            © 2024 ELIMINATOR ESPORTS. ALL RIGHTS RESERVED.
          </span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-y-2 text-[11px] font-semibold text-[#5a6a70]">
          <a href="#" className="px-4 hover:text-white transition-colors duration-200 whitespace-nowrap">Terms of Service</a>
          <span className="text-[#23273a] select-none">|</span>
          <a href="#" className="px-4 hover:text-white transition-colors duration-200 whitespace-nowrap">Fair Play Policy</a>
          <span className="text-[#23273a] select-none">|</span>
          <a href="#" className="px-4 hover:text-white transition-colors duration-200 whitespace-nowrap">Support</a>
          <span className="text-[#23273a] select-none">|</span>
          <a href="#" className="px-4 hover:text-white transition-colors duration-200 whitespace-nowrap">Responsible Gaming</a>
        </nav>
      </footer>
    </div>
  );
}

import { create } from 'zustand';
import { WalletService } from '../services/wallet.service';

export const useStatsStore = create((set, get) => ({
  // User game stats
  gamesPlayed: 0,
  totalWins: 0,
  totalLosses: 0,
  winRate: 0,
  lossRate: 0,
  netProfit: 0,

  // Loading state
  loading: true,
  error: null,

  // Fetch stats from API
  async fetchStats() {
    set({ loading: true, error: null });
    try {
      const data = await WalletService.getStats();
      set({
        gamesPlayed: data.gamesPlayed ?? 0,
        totalWins: data.totalWins ?? 0,
        totalLosses: data.totalLosses ?? 0,
        winRate: data.winRate ?? 0,
        lossRate: data.lossRate ?? 0,
        netProfit: data.netProfit ?? 0,
        loading: false,
      });
    } catch (e) {
      console.error('[StatsStore] Failed to fetch stats:', e);
      set({ loading: false, error: e.message });
    }
  },

  // Computed: chart data for Win/Loss bar chart
  getPerfData() {
    const { winRate, lossRate } = get();
    return [
      { name: 'Win', value: winRate, fill: '#4cd6ff' },
      { name: 'Loss', value: lossRate, fill: '#ffb4ab' },
    ];
  },

  // Computed: summary text based on performance
  getSummaryText() {
    const { gamesPlayed, winRate } = get();
    if (gamesPlayed === 0) return 'Play your first game to see stats! 🎮';
    if (winRate >= 60) return `${winRate}% win rate — You're on fire! 🔥`;
    if (winRate >= 40) return `${winRate}% win rate — Keep pushing! 💪`;
    if (winRate > 0) return `${winRate}% win rate — Better luck next time! 🎯`;
    return 'No wins yet — your time will come! ⭐';
  },

  // Format net profit for display
  getFormattedProfit() {
    const val = get().netProfit;
    const absVal = Math.abs(val);
    if (absVal >= 1000000) return `${val >= 0 ? '+' : '-'}${(absVal / 1000000).toFixed(1)}M`;
    if (absVal >= 1000) return `${val >= 0 ? '+' : '-'}${(absVal / 1000).toFixed(1)}K`;
    return `${val >= 0 ? '+' : ''}${val}`;
  },
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWalletStore = create(
  persist(
    (set, get) => ({
      coins: 0,

      setCoins(coins) {
        set({ coins: Number(coins) });
      },

      addCoins(amount) {
        set({ coins: get().coins + Number(amount) });
      },

      subtractCoins(amount) {
        set({ coins: Math.max(0, get().coins - Number(amount)) });
      },
    }),
    { name: 'eliminator-wallet' }
  )
);

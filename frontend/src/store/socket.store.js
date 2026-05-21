import { create } from 'zustand';

export const useSocketStore = create((set) => ({
  connected: false,
  socketId:  null,

  setConnected(connected, socketId = null) {
    set({ connected, socketId });
  },
}));

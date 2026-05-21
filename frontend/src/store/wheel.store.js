import { create } from 'zustand';

export const useWheelStore = create((set, get) => ({
  activeWheel:   null,
  participants:  [],
  gameLog:       [], // live event log

  setWheel(wheel) {
    set({
      activeWheel:  wheel,
      participants: wheel?.participants || [],
    });
  },

  clearWheel() {
    set({ activeWheel: null, participants: [] });
  },

  updateParticipants(participants) {
    set({ participants });
  },

  addLogEntry(entry) {
    set((s) => ({ gameLog: [entry, ...s.gameLog].slice(0, 50) }));
  },

  clearLog() {
    set({ gameLog: [] });
  },

  // Convenience getters
  activePlayers() {
    return get().participants.filter((p) => !p.eliminatedAt);
  },
}));

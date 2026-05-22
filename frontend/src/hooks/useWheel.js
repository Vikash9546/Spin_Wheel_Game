import { useCallback, useEffect } from 'react';
import { useWheelStore } from '../store/wheel.store';
import { useWalletStore } from '../store/wallet.store';
import { useStatsStore } from '../store/stats.store';
import { useSocketStore } from '../store/socket.store';
import { WheelService } from '../services/wheel.service';
import { useSocketEvent } from './useSocket';
import { SOCKET_EVENTS } from '../utils/constants';
import { joinWheelRoom, leaveWheelRoom, getSocket } from '../sockets/socket';
import toast from 'react-hot-toast';

export function useWheel() {
  const { activeWheel, participants, gameLog, setWheel, clearWheel, addLogEntry } = useWheelStore();
  const { setCoins } = useWalletStore();
  const fetchStats = useStatsStore((s) => s.fetchStats);
  const connected = useSocketStore((s) => s.connected);

  const fetchActiveWheel = useCallback(async () => {
    try {
      const wheel = await WheelService.getActiveWheel();
      setWheel(wheel);
      if (wheel?.id) joinWheelRoom(wheel.id);
    } catch {
      clearWheel();
    }
  }, [setWheel, clearWheel]);

  // Synchronize socket room subscription with the active wheel and connection status
  useEffect(() => {
    const socket = getSocket();
    if (socket && connected && activeWheel?.id) {
      console.log(`[Socket] Joining room for wheel: ${activeWheel.id}`);
      joinWheelRoom(activeWheel.id);
      return () => {
        console.log(`[Socket] Leaving room for wheel: ${activeWheel.id}`);
        leaveWheelRoom(activeWheel.id);
      };
    }
  }, [connected, activeWheel?.id]);

  // ── Socket event handlers with real-time state sync ──
  
  useSocketEvent('connect', useCallback(() => {
    if (activeWheel?.id) {
      console.log(`[Socket] Reconnected, re-joining wheel room: ${activeWheel.id}`);
      joinWheelRoom(activeWheel.id);
    }
  }, [activeWheel?.id]));

  useSocketEvent(SOCKET_EVENTS.WHEEL_STATE, useCallback((data) => {
    if (data?.wheel) {
      setWheel(data.wheel);
    }
  }, [setWheel]));

  useSocketEvent(SOCKET_EVENTS.WHEEL_CREATED, useCallback(async (data) => {
    const fee = data?.entryFee ? ` (Entry: ${data.entryFee} coins)` : '';
    addLogEntry({ type: 'info', msg: `🎡 New wheel created!${fee}`, time: new Date() });
    await fetchActiveWheel();
  }, [fetchActiveWheel, addLogEntry]));

  useSocketEvent(SOCKET_EVENTS.USER_JOINED, useCallback(async (data) => {
    const name = data?.userName || 'A player';
    const count = data?.participantCount;
    const countText = count ? ` (${count} players now)` : '';
    addLogEntry({ type: 'join', msg: `👤 ${name} joined the game${countText}`, time: new Date() });
    if (data?.wheel) {
      setWheel(data.wheel);
    } else {
      await fetchActiveWheel();
    }
  }, [fetchActiveWheel, setWheel, addLogEntry]));

  useSocketEvent(SOCKET_EVENTS.GAME_STARTED, useCallback(async (data) => {
    addLogEntry({ type: 'start', msg: `🚀 Game started! Elimination begins in 7s...`, time: new Date() });
    toast.success('Game has started! First elimination in 7 seconds...');
    if (data?.wheel) {
      setWheel(data.wheel);
    } else {
      await fetchActiveWheel();
    }
  }, [fetchActiveWheel, setWheel, addLogEntry]));

  useSocketEvent(SOCKET_EVENTS.PLAYER_ELIMINATED, useCallback(async (data) => {
    const name = data?.eliminatedUserName || 'A player';
    const round = data?.round ?? '?';
    addLogEntry({ type: 'elim', msg: `💀 ${name} eliminated in round ${round}`, time: new Date() });
    toast(`💀 ${name} eliminated! Round ${round}`, {
      style: { background: '#1a0a0a', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' },
      duration: 4000,
    });
    if (data?.wheel) {
      setWheel(data.wheel);
    } else {
      await fetchActiveWheel();
    }
  }, [fetchActiveWheel, setWheel, addLogEntry]));

  useSocketEvent(SOCKET_EVENTS.GAME_COMPLETED, useCallback(async (data) => {
    const winnerName = data?.winnerName || 'Unknown';
    addLogEntry({ type: 'win', msg: `🏆 ${winnerName} wins the game!`, time: new Date() });
    toast.success(`🏆 ${winnerName} is the champion!`, { duration: 6000 });
    
    if (data?.wheel) {
      setWheel(data.wheel);
    } else if (data?.wheelId) {
      try {
        const wheel = await WheelService.getWheel(data.wheelId);
        setWheel(wheel);
      } catch {
        await fetchActiveWheel();
      }
    } else {
      await fetchActiveWheel();
    }
    // Refresh stats after game completes
    fetchStats();
  }, [fetchActiveWheel, setWheel, addLogEntry, fetchStats]));

  useSocketEvent(SOCKET_EVENTS.WALLET_UPDATED, useCallback((data) => {
    setCoins(data.coins);
  }, [setCoins]));

  useSocketEvent(SOCKET_EVENTS.GAME_ABORTED, useCallback(async (data) => {
    const msg = data?.message || 'Game aborted. Refunds are being processed.';
    addLogEntry({ type: 'abort', msg: `🛑 ${msg}`, time: new Date() });
    toast(msg, {
      icon: '🛑',
      style: { background: '#1a0a0a', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' },
      duration: 6000,
    });
    clearWheel();
    // Small delay then re-fetch to check if a new wheel was created
    setTimeout(() => fetchActiveWheel(), 1500);
    // Refresh stats after abort (refunds processed)
    setTimeout(() => fetchStats(), 3000);
  }, [fetchActiveWheel, clearWheel, addLogEntry, fetchStats]));

  return {
    activeWheel,
    participants,
    gameLog,
    fetchActiveWheel,
    clearWheel,
  };
}

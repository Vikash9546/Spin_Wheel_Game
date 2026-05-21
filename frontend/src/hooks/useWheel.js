import { useCallback } from 'react';
import { useWheelStore } from '../store/wheel.store';
import { useWalletStore } from '../store/wallet.store';
import { WheelService } from '../services/wheel.service';
import { useSocketEvent } from './useSocket';
import { SOCKET_EVENTS } from '../utils/constants';
import { joinWheelRoom } from '../sockets/socket';
import toast from 'react-hot-toast';

export function useWheel() {
  const { activeWheel, participants, gameLog, setWheel, clearWheel, addLogEntry } = useWheelStore();
  const { setCoins } = useWalletStore();

  const fetchActiveWheel = useCallback(async () => {
    try {
      const wheel = await WheelService.getActiveWheel();
      setWheel(wheel);
      if (wheel?.id) joinWheelRoom(wheel.id);
    } catch {
      clearWheel();
    }
  }, [setWheel, clearWheel]);

  // Socket event handlers
  useSocketEvent(SOCKET_EVENTS.WHEEL_CREATED, useCallback(async () => {
    addLogEntry({ type: 'info', msg: `New wheel created!`, time: new Date() });
    await fetchActiveWheel();
  }, [fetchActiveWheel, addLogEntry]));

  useSocketEvent(SOCKET_EVENTS.USER_JOINED, useCallback(async () => {
    addLogEntry({ type: 'join', msg: `Player joined`, time: new Date() });
    await fetchActiveWheel();
  }, [fetchActiveWheel, addLogEntry]));

  useSocketEvent(SOCKET_EVENTS.GAME_STARTED, useCallback(async () => {
    addLogEntry({ type: 'start', msg: `Game started!`, time: new Date() });
    toast.success('Game has started! First elimination in 7 seconds...');
    await fetchActiveWheel();
  }, [fetchActiveWheel, addLogEntry]));

  useSocketEvent(SOCKET_EVENTS.PLAYER_ELIMINATED, useCallback(async (data) => {
    const name = data?.eliminatedUserName || 'A player';
    const round = data?.round ?? '?';
    addLogEntry({ type: 'elim', msg: `${name} eliminated in round ${round}`, time: new Date() });
    toast(`💀 ${name} eliminated! Round ${round}`, {
      style: { background: '#1a0a0a', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' },
      duration: 4000,
    });
    await fetchActiveWheel();
  }, [fetchActiveWheel, addLogEntry]));

  useSocketEvent(SOCKET_EVENTS.GAME_COMPLETED, useCallback(async (data) => {
    addLogEntry({ type: 'win', msg: `Game complete! Winner ID: ${data?.winnerId}`, time: new Date() });
    toast.success('🏆 Game Over! Winner has been declared!', { duration: 6000 });
    // Fetch the completed wheel by its specific ID (fetchActiveWheel won't find COMPLETED wheels)
    if (data?.wheelId) {
      try {
        const wheel = await WheelService.getWheel(data.wheelId);
        setWheel(wheel);
      } catch {
        await fetchActiveWheel();
      }
    } else {
      await fetchActiveWheel();
    }
  }, [fetchActiveWheel, setWheel, addLogEntry]));

  useSocketEvent(SOCKET_EVENTS.WALLET_UPDATED, useCallback((data) => {
    setCoins(data.coins);
  }, [setCoins]));

  useSocketEvent(SOCKET_EVENTS.GAME_ABORTED, useCallback(async (data) => {
    const msg = data?.message || 'Game aborted. Refunds are being processed.';
    addLogEntry({ type: 'abort', msg, time: new Date() });
    toast(msg, {
      icon: '🛑',
      style: { background: '#1a0a0a', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' },
      duration: 6000,
    });
    clearWheel();
    // Small delay then re-fetch to check if a new wheel was created
    setTimeout(() => fetchActiveWheel(), 1500);
  }, [fetchActiveWheel, clearWheel, addLogEntry]));

  return {
    activeWheel,
    participants,
    gameLog,
    fetchActiveWheel,
  };
}

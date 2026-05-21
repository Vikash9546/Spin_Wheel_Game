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

  useSocketEvent(SOCKET_EVENTS.PLAYER_ELIMINATED, useCallback(async () => {
    addLogEntry({ type: 'elim', msg: `Player eliminated`, time: new Date() });
    await fetchActiveWheel();
  }, [fetchActiveWheel, addLogEntry]));

  useSocketEvent(SOCKET_EVENTS.GAME_COMPLETED, useCallback(async (data) => {
    addLogEntry({ type: 'win', msg: `Game complete! Winner: ${data.winnerId}`, time: new Date() });
    await fetchActiveWheel();
  }, [fetchActiveWheel, addLogEntry]));

  useSocketEvent(SOCKET_EVENTS.WALLET_UPDATED, useCallback((data) => {
    setCoins(data.coins);
  }, [setCoins]));

  useSocketEvent(SOCKET_EVENTS.GAME_ABORTED, useCallback(async () => {
    addLogEntry({ type: 'abort', msg: 'Game aborted. Refunds issued.', time: new Date() });
    await fetchActiveWheel();
  }, [fetchActiveWheel, addLogEntry]));

  return {
    activeWheel,
    participants,
    gameLog,
    fetchActiveWheel,
  };
}

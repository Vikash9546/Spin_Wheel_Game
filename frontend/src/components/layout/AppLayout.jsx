import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/auth.store';
import { useWalletStore } from '../../store/wallet.store';
import { useSocketStore } from '../../store/socket.store';
import { connectSocket, getSocket } from '../../sockets/socket';
import Header from './Header';
import Sidebar from './Sidebar';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export default function AppLayout() {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);
  const setCoins = useWalletStore((s) => s.setCoins);
  const { setConnected } = useSocketStore();

  // Connect socket and sync initial wallet balance
  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    socket.on('connect', () => setConnected(true, socket.id));
    socket.on('disconnect', () => setConnected(false, null));

    // Sync initial balance from stored user
    if (user?.coins !== undefined) setCoins(user.coins);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <div className="flex pt-[60px]">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-7 pb-20 min-h-[calc(100vh-60px)] relative z-10">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

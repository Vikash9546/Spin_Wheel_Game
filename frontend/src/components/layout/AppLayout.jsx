import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/auth.store';
import { useWalletStore } from '../../store/wallet.store';
import { useSocketStore } from '../../store/socket.store';
import { connectSocket } from '../../sockets/socket';
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
  const location = useLocation();

  // Connect socket.
  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    socket.on('connect', () => setConnected(true, socket.id));
    socket.on('disconnect', () => setConnected(false, null));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [token, setConnected]);

  // Sync initial balance from stored user.
  useEffect(() => {
    if (user?.coins !== undefined) setCoins(user.coins);
  }, [setCoins, user?.coins]);

  const isWheelPage = location.pathname === '/wheel';

  return (
    <div className="min-h-screen bg-[#080a12] text-[#e1e1ef]">
      <Header />
      <div className="flex pt-[64px]">
        <Sidebar />
        <main 
          className={`flex-1 md:ml-64 min-h-[calc(100vh-64px)] relative z-10 overflow-hidden transition-all duration-300 ${
            isWheelPage ? 'p-0' : 'p-7 pb-20'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname} 
              variants={pageVariants} 
              initial="initial" 
              animate="animate" 
              exit="exit"
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

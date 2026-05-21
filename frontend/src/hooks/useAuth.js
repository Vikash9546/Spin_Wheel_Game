import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useWalletStore } from '../store/wallet.store';
import { AuthService } from '../services/auth.service';
import { connectSocket, disconnectSocket } from '../sockets/socket';

export function useAuth() {
  const { user, token, role, login, logout, updateUser } = useAuthStore();
  const { setCoins } = useWalletStore();
  const navigate = useNavigate();

  async function handleLogin(userId) {
    const data = await AuthService.login(userId);
    login(data.user, data.token);
    setCoins(data.user.coins ?? 0);
    connectSocket(data.token);
    navigate('/');
  }

  async function handleRegister(name, coins) {
    const data = await AuthService.register(name, coins);
    login(data.user, data.token);
    setCoins(data.user.coins ?? 0);
    connectSocket(data.token);
    navigate('/');
  }

  async function handleSeed() {
    const data = await AuthService.seed();
    const { user: u, token: t } = data.admin;
    login(u, t);
    setCoins(u.coins ?? 0);
    connectSocket(t);
    navigate('/');
  }

  function handleLogout() {
    disconnectSocket();
    logout();
    navigate('/login');
  }

  return {
    user,
    token,
    role,
    isAdmin: role === 'admin',
    isAuthenticated: !!token,
    handleLogin,
    handleRegister,
    handleSeed,
    handleLogout,
    updateUser,
  };
}

/**
 * Redirect to /login if not authenticated.
 */
export function useRequireAuth() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) navigate('/login', { replace: true });
  }, [token, navigate]);
  return !!token;
}

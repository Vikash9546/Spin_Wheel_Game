import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';
import { parseError } from '../../utils/helpers';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function Login() {
  const token = useAuthStore((s) => s.token);
  const { handleLogin, handleRegister, handleSeed } = useAuth();

  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);

  // login form
  const [userId, setUserId] = useState('');
  // register form
  const [name, setName] = useState('');
  const [coins, setCoins] = useState(1000);

  if (token) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await handleLogin(userId.trim());
        toast.success('Welcome back!');
      } else {
        await handleRegister(name.trim(), Number(coins));
        toast.success('Account created! Welcome to ELIMINATOR 🎉');
      }
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  async function seed() {
    setLoading(true);
    try {
      await handleSeed();
      toast.success('Seeded & logged in as Admin!');
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse at top left, rgba(76,214,255,0.07) 0%, transparent 55%),' +
          'radial-gradient(ellipse at bottom right, rgba(207,92,255,0.07) 0%, transparent 55%),' +
          '#11131c',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-card rounded-xl p-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-sora font-black text-4xl grad-text">ELIMINATOR</h1>
          <p className="text-on-muted text-sm mt-1">Pro Gamer Dashboard</p>
        </div>

        {/* Tab switcher */}
        <div className="flex border border-outline rounded-md overflow-hidden mb-7">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[11px] font-mono font-bold uppercase tracking-widest transition-all duration-200 ${
                tab === t
                  ? 'bg-primary/15 text-primary'
                  : 'text-on-muted hover:bg-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {tab === 'login' ? (
            <Input
              label="User ID"
              type="text"
              placeholder="Enter your user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          ) : (
            <>
              <Input
                label="Display Name"
                type="text"
                placeholder="Pro Gamer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Starting Coins"
                type="number"
                placeholder="1000"
                value={coins}
                onChange={(e) => setCoins(e.target.value)}
                min="0"
              />
            </>
          )}

          <Button type="submit" full loading={loading} variant={tab === 'login' ? 'primary' : 'secondary'}>
            {tab === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <hr className="flex-1 border-outline" />
          <span className="text-[10px] font-mono text-on-muted uppercase">or</span>
          <hr className="flex-1 border-outline" />
        </div>

        {/* Seed shortcut */}
        <Button variant="ghost" full loading={loading} onClick={seed} size="sm">
          🧪 Seed Test Accounts &amp; Login as Admin
        </Button>

        <p className="text-center text-[11px] text-on-muted mt-4">
          This is a demo. User IDs are public.
        </p>
      </motion.div>
    </div>
  );
}

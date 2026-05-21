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

  // login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // register-only fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('');   // mandatory — 'user' | 'admin'

  if (token) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    if (tab === 'register' && !role) {
      toast.error('Please select a role (User or Admin).');
      return;
    }
    setLoading(true);
    try {
      if (tab === 'login') {
        await handleLogin(email.trim(), password);
        toast.success('Welcome back!');
      } else {
        await handleRegister(name.trim(), email.trim(), password, role);
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
              id={`tab-${t}`}
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
            <>
              <Input
                label="Email"
                type="email"
                placeholder="player@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                minLength={6}
                required
              />
            </>
          ) : (
            <>
              {/* Name */}
              <Input
                label="Display Name"
                type="text"
                placeholder="Pro Gamer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />

              {/* Email */}
              <Input
                label="Email"
                type="email"
                placeholder="player@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              {/* Password */}
              <Input
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />

              {/* Role — mandatory */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono font-semibold uppercase tracking-widest text-on-muted">
                  Role <span className="text-red-400">*</span>
                </label>
                <p className="text-[10px] text-on-muted/60">
                  Admins can create &amp; manage spin wheels.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { value: 'user',  emoji: '🎮', label: 'User'  },
                    { value: 'admin', emoji: '⚡', label: 'Admin' },
                  ].map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      type="button"
                      id={`role-${value}`}
                      onClick={() => setRole(value)}
                      className={`py-3 rounded-lg border text-sm font-bold tracking-wide transition-all duration-200 ${
                        role === value
                          ? value === 'admin'
                            ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                            : 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                          : 'border-outline text-on-muted hover:bg-white/5'
                      }`}
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>
                {!role && (
                  <p className="text-[10px] text-red-400 mt-0.5">⚠ Role is required.</p>
                )}
              </div>

              {/* Starting Coins — read-only badge */}
              <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-yellow-500/25 bg-yellow-500/5">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-on-muted">
                    Starting Coins
                  </p>
                  <p className="text-[10px] text-on-muted/50 mt-0.5">Auto-assigned · not editable</p>
                </div>
                <span className="text-xl font-black text-yellow-400">🪙 1,000</span>
              </div>
            </>
          )}

          <Button
            type="submit"
            full
            loading={loading}
            variant={tab === 'login' ? 'primary' : 'secondary'}
          >
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
          Seed creates demo credentials and logs you in as admin.
        </p>
      </motion.div>
    </div>
  );
}

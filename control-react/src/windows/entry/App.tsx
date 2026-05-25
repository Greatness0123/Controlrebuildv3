import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { Icon } from '../../components/shared/Icon';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Badge } from '../../components/shared/Badge';
import { TipsCarousel } from './TipsCarousel';

type AuthView = 'login' | 'register' | 'pin';

export default function EntryApp() {
  const { login, checkAuth, user, isAuthenticated } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      setView('pin');
    }
  }, [isAuthenticated, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await login({ email, password });
      if (!result.success) {
        setError(result.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleUnlock = async () => {
    const pinString = pin.join('');
    if (pinString.length !== 4) return;
    setIsLoading(true);
    try {
      const res = await window.entryAPI.verifyEntryId(pinString); // Assuming PIN uses similar verification or verify-pin
      if (res.success) {
        window.entryAPI.minimizeWindow();
      } else {
        setError('Invalid PIN');
      }
    } catch (e) {
      setError('Unlock failed');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: 'Zap', text: 'Automate anything on your desktop' },
    { icon: 'Mic', text: 'Voice-activated with Hey Control' },
    { icon: 'Lock', text: 'Runs entirely on your machine' },
  ] as const;

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden border border-border-strong rounded-xl shadow-2xl">
      {/* Left Column - Brand Panel */}
      <div className="w-[45%] bg-bg-surface p-10 flex flex-col justify-between border-r border-border-subtle relative select-none" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="space-y-12" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div>
            <div className="w-12 h-12 mb-6 bg-white rounded-lg flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="black"/>
                <path d="M2 17L12 22L22 17" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Control</h1>
            <p className="text-text-secondary text-sm leading-relaxed">The intelligent interface for your computer.</p>
          </div>

          <div className="space-y-6">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-primary">
                  <Icon name={f.icon as any} size="md" />
                </div>
                <span className="text-xs font-medium text-text-secondary">{f.text}</span>
              </div>
            ))}
          </div>

          <TipsCarousel />
        </div>

        <div className="text-[10px] text-text-disabled font-mono flex justify-between" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <span>v1.0.0 — PRODUCTION</span>
          <span>© 2026</span>
        </div>
      </div>

      {/* Right Column - Auth Forms */}
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          <button onClick={() => window.entryAPI.minimizeWindow()} className="p-1.5 rounded-md hover:bg-white/10 text-text-muted transition-colors">
            <Icon name="Minus" size="sm" />
          </button>
          <button onClick={() => window.entryAPI.closeWindow('entry')} className="p-1.5 rounded-md hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors">
            <Icon name="X" size="sm" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-12">
          <AnimatePresence mode="wait">
            {view === 'login' && !isAuthenticated && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLogin}
                className="w-full max-w-sm space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Sign In</h2>
                  <p className="text-xs text-text-muted">Enter your credentials to continue</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted ml-1">Email Address</label>
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted ml-1">Password</label>
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                      >
                        <Icon name={showPassword ? 'EyeOff' : 'Eye'} size="sm" />
                      </button>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" loading={isLoading}>
                  Continue
                </Button>

                <div className="text-center">
                   <button
                    type="button"
                    onClick={() => setView('register')}
                    className="text-xs text-text-muted hover:text-white transition-colors"
                   >
                     Don't have an account? <span className="text-white font-medium underline">Register</span>
                   </button>
                </div>
              </motion.form>
            )}

            {(view === 'pin' || isAuthenticated) && (
              <motion.div
                key="pin"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm space-y-8 text-center"
              >
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <span className="text-3xl font-black text-black">{(user?.name || 'C')[0]}</span>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">Welcome back, {user?.firstName || user?.name || 'User'}</h2>
                    <Badge variant="success">{user?.plan || 'Free Plan'}</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-center gap-3">
                    {pin.map((digit, i) => (
                      <input
                        key={i}
                        id={`pin-${i}`}
                        type="password"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(i, e.target.value)}
                        className="w-12 h-16 bg-bg-surface border border-border-default focus:border-white rounded-xl text-center text-2xl font-bold outline-none transition-all"
                      />
                    ))}
                  </div>
                  <Button className="w-full" onClick={handleUnlock} loading={isLoading}>
                    Unlock & Start
                  </Button>
                </div>

                <button
                  onClick={() => window.settingsAPI.logout()}
                  className="text-xs text-text-muted hover:text-white transition-colors"
                >
                  Use different account
                </button>
              </motion.div>
            )}

            {view === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-sm space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Create Account</h2>
                  <p className="text-xs text-text-muted">Registration is handled securely on our web dashboard.</p>
                </div>

                <div className="p-10 border border-dashed border-border-subtle rounded-2xl text-center space-y-6">
                   <div className="w-12 h-12 bg-bg-elevated rounded-full flex items-center justify-center mx-auto">
                     <Icon name="Globe" size="lg" />
                   </div>
                   <Button variant="primary" className="w-full" onClick={() => window.settingsAPI.openWebsite()}>
                     Open Dashboard
                   </Button>
                </div>

                <div className="text-center">
                   <button
                    onClick={() => setView('login')}
                    className="text-xs text-text-muted hover:text-white transition-colors"
                   >
                     Back to Sign In
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, MouseEvent } from 'react';
import { Database, Paperclip, Send, User, Server, ShieldAlert, Cpu, Cloud, Loader2, Sparkles, KeyRound, Lock, Mail, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'framer-motion';

interface AuthProps {
  onAuthSuccess: (token: string) => void;
}

type AuthView = 'login' | 'register' | 'forgot' | 'reset';

export default function Auth({ onAuthSuccess }: AuthProps) {
  // --- AUTH STATE ---
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- HEALTH STATE ---
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  // --- INTERACTIVE BACKGROUND LOGIC ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const background = useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(79, 70, 229, 0.12), transparent 80%)`;

  // --- THE HEARTBEAT MONITOR (RELAXED FOR 404s) ---
  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); 

        // We don't check response.ok. If this fetch completes without a fatal 
        // network error (like connection refused), the server is physically online.
        await fetch('http://localhost:3000/', { 
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      }
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- AUTH LOGIC ---
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    let endpoint = '';
    let payload = {};

    if (view === 'login') {
      endpoint = 'http://localhost:3000/auth/login';
      payload = { email, password };
    } else if (view === 'register') {
      if (!isPasswordValid) {
        setError("Please meet all password requirements.");
        setLoading(false);
        return;
      }
      endpoint = 'http://localhost:3000/auth/register';
      payload = { email, password };
    } else if (view === 'forgot') {
      endpoint = 'http://localhost:3000/auth/forgot-password';
      payload = { email };
    } else if (view === 'reset') {
      if (!isPasswordValid) {
        setError("Please meet all password requirements.");
        setLoading(false);
        return;
      }
      endpoint = 'http://localhost:3000/auth/reset-password';
      payload = { token: resetToken, newPassword: password };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (view === 'login' || view === 'register') {
          onAuthSuccess(data.access_token);
        } else if (view === 'forgot') {
          setSuccessMsg(data.message);
          setTimeout(() => setView('reset'), 3000);
        } else if (view === 'reset') {
          setSuccessMsg(data.message);
          setTimeout(() => { setView('login'); setPassword(''); setResetToken(''); setSuccessMsg(''); }, 3000);
        }
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Failed to connect to gateway.');
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordRules = () => (
    <div className="bg-black/20 border border-white/5 rounded-xl p-4 text-xs font-medium flex flex-col gap-2 mt-2 backdrop-blur-md">
      <div className="text-slate-400 mb-1 font-mono uppercase tracking-wider text-[10px]">Security Requirements</div>
      <div className={`flex items-center gap-2 ${hasLength ? 'text-indigo-400' : 'text-slate-500'}`}>
        {hasLength ? <CheckCircle2 size={14} /> : <XCircle size={14} />} 8+ Characters
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className={`flex items-center gap-2 ${hasUpper ? 'text-indigo-400' : 'text-slate-500'}`}>
          {hasUpper ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Uppercase
        </div>
        <div className={`flex items-center gap-2 ${hasLower ? 'text-indigo-400' : 'text-slate-500'}`}>
          {hasLower ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Lowercase
        </div>
        <div className={`flex items-center gap-2 ${hasNumber ? 'text-indigo-400' : 'text-slate-500'}`}>
          {hasNumber ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Number
        </div>
        <div className={`flex items-center gap-2 ${hasSpecial ? 'text-indigo-400' : 'text-slate-500'}`}>
          {hasSpecial ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Symbol
        </div>
      </div>
    </div>
  );

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center p-4 text-slate-200 overflow-y-auto font-sans relative selection:bg-indigo-500/30"
    >
      {/* Dynamic Mouse Tracking Background */}
      <motion.div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{ background }}
        animate={{ opacity: isOnline ? 1 : 0.3 }}
      />
      
      {/* Static Background Texture */}
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={isOnline === null ? 'loading' : 'content'}
          initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="m-auto w-full max-w-md bg-white/[0.02] backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
        >
          {/* Inner top highlight for 3D effect */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-3xl"></div>
          
          <div className="relative z-10 flex flex-col items-center mb-8">
            <div className={`p-3 rounded-2xl mb-4 shadow-2xl transition-colors duration-500 ${isOnline ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-indigo-500/20' : 'bg-rose-500/10 border border-rose-500/20 shadow-rose-500/20'}`}>
              {isOnline ? <Database className="text-indigo-400" size={32} /> : <ShieldAlert className="text-rose-400" size={32} />}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">RAG Neural Engine</h1>
            
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-2">
              <span className="relative flex h-2 w-2">
                {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline === null ? 'bg-amber-400' : isOnline ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'}`}></span>
              </span>
              {isOnline === null ? 'CONNECTING...' : isOnline ? 'SYSTEM ONLINE' : 'BACKEND OFFLINE'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4">
            
            {(view === 'login' || view === 'register') && (
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 mb-2">
                <button type="button" disabled={!isOnline} onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 ${view === 'login' ? 'bg-indigo-500/10 text-indigo-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Sign In</button>
                <button type="button" disabled={!isOnline} onClick={() => { setView('register'); setError(''); setSuccessMsg(''); }} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 ${view === 'register' ? 'bg-indigo-500/10 text-indigo-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Create Account</button>
              </div>
            )}

            {view === 'reset' && (
              <div className="relative group">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input type="text" placeholder="Paste Recovery Token" required className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all disabled:opacity-50" value={resetToken} onChange={(e) => setResetToken(e.target.value)} disabled={loading || !isOnline} />
              </div>
            )}

            {(view !== 'reset') && (
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input type="email" placeholder="Email Address" required className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all disabled:opacity-50" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading || !isOnline} />
              </div>
            )}

            {(view !== 'forgot') && (
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input type="password" placeholder={view === 'reset' ? "New Password" : "Password"} required className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all disabled:opacity-50" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading || !isOnline} />
              </div>
            )}

            {(view === 'register' || view === 'reset') && renderPasswordRules()}

            <AnimatePresence>
              {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-center">{error}</motion.div>}
              {successMsg && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center">{successMsg}</motion.div>}
              {!isOnline && isOnline !== null && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-rose-400 text-sm bg-rose-950/50 border border-rose-900/50 p-3 rounded-xl text-center">System Offline: Authentication Disabled</motion.div>}
            </AnimatePresence>

            <button type="submit" disabled={loading || !isOnline} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex justify-center items-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-400/20">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <>{view === 'login' ? 'Access System' : view === 'register' ? 'Initialize Account' : view === 'forgot' ? 'Transmit Reset Link' : 'Confirm Protocol'} <ArrowRight size={18} /></>}
            </button>
          </form>

          {view === 'login' && (
            <div className="relative z-10 text-center mt-6">
              <button disabled={!isOnline} onClick={() => { setView('forgot'); setError(''); setSuccessMsg(''); }} className="text-sm text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-50">Forgot your password?</button>
            </div>
          )}
          {(view === 'forgot' || view === 'reset') && (
            <div className="relative z-10 text-center mt-6">
              <button disabled={!isOnline} onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }} className="text-sm text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-50">Return to standard access</button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
import { Database, Lock, Mail, ArrowRight, Loader2, KeyRound, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthProps {
  onAuthSuccess: (token: string) => void;
}

type AuthView = 'login' | 'register' | 'forgot' | 'reset';

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password Policy Checks
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-xs font-medium flex flex-col gap-2 mt-2">
      <div className="text-slate-400 mb-1 font-mono uppercase tracking-wider">Security Requirements</div>
      <div className={`flex items-center gap-2 ${hasLength ? 'text-emerald-400' : 'text-slate-500'}`}>
        {hasLength ? <CheckCircle2 size={14} /> : <XCircle size={14} />} 8+ Characters
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
          {hasUpper ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Uppercase
        </div>
        <div className={`flex items-center gap-2 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
          {hasLower ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Lowercase
        </div>
        <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
          {hasNumber ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Number
        </div>
        <div className={`flex items-center gap-2 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
          {hasSpecial ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Symbol
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex p-4 text-slate-200 overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="m-auto w-full max-w-md bg-surface border border-border p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-cloud to-transparent opacity-50"></div>
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cloud/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="p-3 bg-slate-900 border border-slate-700 rounded-2xl mb-4 shadow-lg shadow-cloud/20">
            <Database className="text-cloud" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">RAG Neural Engine</h1>
          <p className="text-slate-400 text-sm mt-1">
            {view === 'forgot' ? 'Account Recovery' : view === 'reset' ? 'Establish New Protocol' : 'Secure Knowledge Access'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4">
          
          {(view === 'login' || view === 'register') && (
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-border mb-2">
              <button type="button" onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'login' ? 'bg-surface text-cloud shadow-md border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>Sign In</button>
              <button type="button" onClick={() => { setView('register'); setError(''); setSuccessMsg(''); }} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'register' ? 'bg-surface text-cloud shadow-md border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>Create Account</button>
            </div>
          )}

          {view === 'reset' && (
            <div className="relative group">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cloud transition-colors" size={18} />
              <input type="text" placeholder="Paste Recovery Token" required className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-cloud focus:ring-1 focus:ring-cloud transition-all" value={resetToken} onChange={(e) => setResetToken(e.target.value)} disabled={loading} />
            </div>
          )}

          {(view !== 'reset') && (
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cloud transition-colors" size={18} />
              <input type="email" placeholder="Email Address" required className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-cloud focus:ring-1 focus:ring-cloud transition-all" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
            </div>
          )}

          {(view !== 'forgot') && (
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cloud transition-colors" size={18} />
              <input type="password" placeholder={view === 'reset' ? "New Password" : "Password"} required className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-cloud focus:ring-1 focus:ring-cloud transition-all" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
            </div>
          )}

          {(view === 'register' || view === 'reset') && renderPasswordRules()}

          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-center">{error}</motion.div>}
            {successMsg && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-center">{successMsg}</motion.div>}
          </AnimatePresence>

          <button type="submit" disabled={loading} className="w-full bg-cloud hover:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-cloud/20 transition-all flex justify-center items-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <>{view === 'login' ? 'Access System' : view === 'register' ? 'Initialize Account' : view === 'forgot' ? 'Transmit Reset Link' : 'Confirm Protocol'} <ArrowRight size={18} /></>}
          </button>
        </form>

        {view === 'login' && (
          <div className="relative z-10 text-center mt-6">
            <button onClick={() => { setView('forgot'); setError(''); setSuccessMsg(''); }} className="text-sm text-slate-400 hover:text-cloud transition-colors">Forgot your password?</button>
          </div>
        )}
        {(view === 'forgot' || view === 'reset') && (
          <div className="relative z-10 text-center mt-6">
            <button onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }} className="text-sm text-slate-400 hover:text-cloud transition-colors">Return to standard access</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

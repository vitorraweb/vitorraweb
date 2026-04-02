import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Building2, FileText, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

type AuthMode = 'signin' | 'register' | 'reset';

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, resetPassword, error, clearError, firebaseUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'individual' | 'business'>('individual');
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');

  // Redirect if already logged in
  if (firebaseUser && !authLoading) {
    navigate('/portal', { replace: true });
    return null;
  }

  const switchMode = (m: AuthMode) => {
    setMode(m);
    clearError();
    setResetSent(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/portal');
    } catch { /* error handled in context */ }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    if (password.length < 6) {
      return;
    }
    setLoading(true);
    try {
      const companyData = accountType === 'business' ? { name: companyName, taxId, registrationNo } : undefined;
      await signUp(email, password, name, accountType, companyData);
      navigate('/portal');
    } catch { /* error handled in context */ }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/portal');
    } catch { /* error handled in context */ }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch { /* error handled in context */ }
    setLoading(false);
  };

  const inputClass = "w-full bg-vitorra-bg/50 border border-vitorra-border rounded-xl px-4 py-3.5 pl-12 text-vitorra-text placeholder-vitorra-muted/50 outline-none focus:border-vitorra-gold/50 focus:bg-vitorra-bg/80 transition-all text-sm";
  const labelClass = "block text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-2";
  const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vitorra-muted/60";

  return (
    <div className="min-h-screen bg-vitorra-bg flex items-center justify-center pt-24 pb-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/images/vitorralogo.png" alt="Vitorra" className="w-44 mx-auto mb-6 hover:opacity-90 transition-opacity" />
          </Link>
        </div>

        {/* Card */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-vitorra-card border border-vitorra-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-vitorra-gold to-transparent opacity-50" />

          {/* Mode tabs */}
          {mode !== 'reset' && (
            <div className="flex bg-vitorra-bg/50 rounded-xl p-1 mb-8 border border-vitorra-border">
              <button
                onClick={() => switchMode('signin')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'signin' ? 'bg-vitorra-gold text-vitorra-gold-text shadow-lg' : 'text-vitorra-muted hover:text-vitorra-text'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode('register')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-vitorra-gold text-vitorra-gold-text shadow-lg' : 'text-vitorra-muted hover:text-vitorra-text'}`}
              >
                Register
              </button>
            </div>
          )}

          {/* Error display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── SIGN IN ─── */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail className={iconClass} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <Lock className={iconClass} />
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-vitorra-muted/40 hover:text-vitorra-muted transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <button type="button" onClick={() => switchMode('reset')} className="text-xs text-vitorra-gold hover:underline">Forgot password?</button>
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-vitorra-gold/20 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* ─── REGISTER ─── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className={labelClass}>Full Name</label>
                <div className="relative">
                  <User className={iconClass} />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail className={iconClass} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <Lock className={iconClass} />
                    <input type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 chars" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirm</label>
                  <div className="relative">
                    <Lock className={iconClass} />
                    <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm" className={`${inputClass} ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : ''}`} />
                  </div>
                </div>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Passwords don't match</p>
              )}

              {/* Account Type */}
              <div>
                <label className={labelClass}>Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setAccountType('individual')}
                    className={`p-4 rounded-xl border text-center transition-all ${accountType === 'individual' ? 'bg-vitorra-gold/10 border-vitorra-gold/30 text-vitorra-gold' : 'bg-vitorra-bg/30 border-vitorra-border text-vitorra-muted hover:border-vitorra-gold/20'}`}>
                    <User className="w-5 h-5 mx-auto mb-2" />
                    <span className="text-xs font-bold uppercase tracking-wider">Individual</span>
                  </button>
                  <button type="button" onClick={() => setAccountType('business')}
                    className={`p-4 rounded-xl border text-center transition-all ${accountType === 'business' ? 'bg-vitorra-gold/10 border-vitorra-gold/30 text-vitorra-gold' : 'bg-vitorra-bg/30 border-vitorra-border text-vitorra-muted hover:border-vitorra-gold/20'}`}>
                    <Building2 className="w-5 h-5 mx-auto mb-2" />
                    <span className="text-xs font-bold uppercase tracking-wider">Business</span>
                  </button>
                </div>
              </div>

              {/* B2B fields */}
              <AnimatePresence>
                {accountType === 'business' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                    <div>
                      <label className={labelClass}>Company Name</label>
                      <div className="relative">
                        <Building2 className={iconClass} />
                        <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Corporation" className={inputClass} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Tax ID / TIN</label>
                        <div className="relative">
                          <FileText className={iconClass} />
                          <input type="text" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="TIN-XXXX" className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Reg. Number</label>
                        <div className="relative">
                          <FileText className={iconClass} />
                          <input type="text" value={registrationNo} onChange={e => setRegistrationNo(e.target.value)} placeholder="REG-XXXX" className={inputClass} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading || (!!confirmPassword && password !== confirmPassword)} className="w-full py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-vitorra-gold/20 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* ─── PASSWORD RESET ─── */}
          {mode === 'reset' && (
            <div>
              <button onClick={() => switchMode('signin')} className="text-xs text-vitorra-muted hover:text-vitorra-text mb-6 flex items-center gap-1">
                ← Back to Sign In
              </button>
              <h3 className="text-xl font-bold text-vitorra-text mb-2">Reset Password</h3>
              <p className="text-sm text-vitorra-muted mb-6">Enter your email and we'll send you a reset link.</p>

              {resetSent ? (
                <div className="flex items-start gap-3 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm mb-1">Reset email sent!</p>
                    <p className="text-xs opacity-80">Check your inbox and follow the link to reset your password.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <div className="relative">
                      <Mail className={iconClass} />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-vitorra-gold/20 flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Google Sign-In (not on reset) */}
          {mode !== 'reset' && (
            <>
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-vitorra-border" />
                <span className="text-[10px] text-vitorra-muted uppercase tracking-widest font-bold">or</span>
                <div className="flex-1 h-px bg-vitorra-border" />
              </div>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 bg-vitorra-bg/50 border border-vitorra-border rounded-xl text-vitorra-text font-medium hover:bg-vitorra-bg/80 hover:border-vitorra-gold/20 transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-vitorra-muted/50 mt-8">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="text-vitorra-gold/70 hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-vitorra-gold/70 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

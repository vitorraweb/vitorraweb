import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Building2, FileText, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Loader2, Shield, Sparkles } from 'lucide-react';

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
    if (password !== confirmPassword) return;
    if (password.length < 6) return;
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

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0e17' }}>

      {/* ═══ LEFT PANEL — Branding ═══ */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden flex-col justify-between"
        style={{
          background: 'linear-gradient(145deg, #0d1321 0%, #111827 40%, #0f172a 100%)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.03]"
            style={{ background: 'radial-gradient(circle, #d4a853, transparent 70%)' }} />
          <div className="absolute bottom-20 -right-20 w-72 h-72 rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, #d4a853, transparent 60%)' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center flex-1 px-12 xl:px-16 pt-24">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #d4a853, #b8922e)', boxShadow: '0 4px 20px rgba(212,168,83,0.3)' }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: '#d4a853' }}>
                Client Portal
              </span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-serif leading-tight mb-5" style={{ color: '#f0ece4' }}>
              Welcome to your<br />
              <span style={{ color: '#d4a853' }}>secure workspace</span>
            </h1>
            <p className="text-base leading-relaxed max-w-sm" style={{ color: 'rgba(240,236,228,0.45)' }}>
              Access your orders, manage procurement, and connect directly with our team through your personalized portal.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-4">
            {[
              { icon: <Shield className="w-4 h-4" />, text: 'Enterprise-grade security' },
              { icon: <Sparkles className="w-4 h-4" />, text: 'Real-time order tracking' },
              { icon: <Building2 className="w-4 h-4" />, text: 'B2B & individual accounts' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.12)' }}>
                  <span style={{ color: '#d4a853' }}>{item.icon}</span>
                </div>
                <span className="text-sm font-medium" style={{ color: 'rgba(240,236,228,0.5)' }}>{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 px-12 xl:px-16 pb-8">
          <div className="h-px w-full mb-6" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <p className="text-[11px] tracking-wider" style={{ color: 'rgba(240,236,228,0.2)' }}>
            © {new Date().getFullYear()} Vitorra Holdings Limited
          </p>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Auth Form ═══ */}
      <div className="flex-1 flex items-center justify-center px-6 pt-28 pb-12 lg:px-12"
        style={{ background: 'linear-gradient(180deg, #0f1419 0%, #0a0e14 100%)' }}
      >
        <div className="w-full max-w-[440px]">

          {/* Mobile header (visible only on small screens) */}
          <div className="lg:hidden text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #d4a853, #b8922e)' }}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: '#d4a853' }}>
                Client Portal
              </span>
            </div>
          </div>

          {/* Form header */}
          <motion.div
            key={mode + '-header'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold mb-2" style={{ color: '#f0ece4', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {mode === 'signin' ? 'Sign in to your account' : mode === 'register' ? 'Create your account' : 'Reset password'}
            </h2>
            <p className="text-sm" style={{ color: 'rgba(240,236,228,0.35)' }}>
              {mode === 'signin' ? (
                <>Don't have an account? <button onClick={() => switchMode('register')} className="font-semibold hover:underline" style={{ color: '#d4a853' }}>Create one</button></>
              ) : mode === 'register' ? (
                <>Already have an account? <button onClick={() => switchMode('signin')} className="font-semibold hover:underline" style={{ color: '#d4a853' }}>Sign in</button></>
              ) : (
                <>Remember your password? <button onClick={() => switchMode('signin')} className="font-semibold hover:underline" style={{ color: '#d4a853' }}>Sign in</button></>
              )}
            </p>
          </motion.div>

          {/* Error display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── GOOGLE SIGN-IN (top, prominent) ─── */}
          {mode !== 'reset' && (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-3 text-sm transition-all disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f0ece4',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(212,168,83,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(240,236,228,0.2)' }}>or continue with email</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>
            </>
          )}

          {/* ─── SIGN IN FORM ─── */}
          {mode === 'signin' && (
            <motion.form
              key="signin"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSignIn}
              className="space-y-4"
            >
              <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} required />
              <InputField label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="••••••••" icon={<Lock className="w-4 h-4" />} required
                suffix={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 transition-colors" style={{ color: 'rgba(240,236,228,0.25)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(240,236,228,0.5)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,236,228,0.25)'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <div className="text-right">
                <button type="button" onClick={() => switchMode('reset')} className="text-xs font-medium transition-colors" style={{ color: '#d4a853' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >Forgot password?</button>
              </div>
              <SubmitButton loading={loading} text="Sign In" />
            </motion.form>
          )}

          {/* ─── REGISTER FORM ─── */}
          {mode === 'register' && (
            <motion.form
              key="register"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <InputField label="Full Name" type="text" value={name} onChange={setName} placeholder="John Doe" icon={<User className="w-4 h-4" />} required />
              <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} required />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="Min 6 chars" icon={<Lock className="w-4 h-4" />} required minLength={6} />
                <InputField label="Confirm" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm" icon={<Lock className="w-4 h-4" />} required
                  error={!!confirmPassword && password !== confirmPassword}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}><AlertCircle className="w-3 h-3" /> Passwords don't match</p>
              )}

              {/* Account Type */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: 'rgba(240,236,228,0.3)' }}>Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: 'individual' as const, icon: <User className="w-4 h-4" />, label: 'Individual' },
                    { key: 'business' as const, icon: <Building2 className="w-4 h-4" />, label: 'Business' },
                  ]).map(opt => (
                    <button key={opt.key} type="button" onClick={() => setAccountType(opt.key)}
                      className="py-3 rounded-xl text-center transition-all flex flex-col items-center gap-2"
                      style={{
                        background: accountType === opt.key ? 'rgba(212,168,83,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${accountType === opt.key ? 'rgba(212,168,83,0.25)' : 'rgba(255,255,255,0.06)'}`,
                        color: accountType === opt.key ? '#d4a853' : 'rgba(240,236,228,0.35)',
                      }}
                    >
                      {opt.icon}
                      <span className="text-[10px] font-bold uppercase tracking-wider">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* B2B fields */}
              <AnimatePresence>
                {accountType === 'business' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                    <InputField label="Company Name" type="text" value={companyName} onChange={setCompanyName} placeholder="Acme Corporation" icon={<Building2 className="w-4 h-4" />} required />
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="Tax ID / TIN" type="text" value={taxId} onChange={setTaxId} placeholder="TIN-XXXX" icon={<FileText className="w-4 h-4" />} />
                      <InputField label="Reg. Number" type="text" value={registrationNo} onChange={setRegistrationNo} placeholder="REG-XXXX" icon={<FileText className="w-4 h-4" />} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <SubmitButton loading={loading} text="Create Account" disabled={!!confirmPassword && password !== confirmPassword} />
            </motion.form>
          )}

          {/* ─── PASSWORD RESET ─── */}
          {mode === 'reset' && (
            <motion.div
              key="reset"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {resetSent ? (
                <div className="flex items-start gap-3 p-5 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', color: '#34d399' }}>
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm mb-1">Reset email sent!</p>
                    <p className="text-xs opacity-80">Check your inbox and follow the link to reset your password.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <InputField label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} required />
                  <SubmitButton loading={loading} text="Send Reset Link" />
                </form>
              )}
            </motion.div>
          )}

          {/* Footer */}
          <p className="text-center mt-8" style={{ fontSize: '11px', color: 'rgba(240,236,228,0.15)' }}>
            By signing in, you agree to our{' '}
            <Link to="/terms" className="hover:underline" style={{ color: 'rgba(212,168,83,0.4)' }}>Terms</Link>{' '}
            and{' '}
            <Link to="/privacy" className="hover:underline" style={{ color: 'rgba(212,168,83,0.4)' }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable Input Field ── */
function InputField({ label, type, value, onChange, placeholder, icon, suffix, required, minLength, error: hasError }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ReactNode; suffix?: React.ReactNode;
  required?: boolean; minLength?: number; error?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: 'rgba(240,236,228,0.3)' }}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: focused ? '#d4a853' : 'rgba(240,236,228,0.2)', transition: 'color 0.15s' }}>
          {icon}
        </span>
        <input
          type={type}
          required={required}
          minLength={minLength}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full outline-none text-sm"
          style={{
            padding: '11px 12px 11px 40px',
            paddingRight: suffix ? 40 : 12,
            background: focused ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${hasError ? 'rgba(239,68,68,0.4)' : focused ? 'rgba(212,168,83,0.3)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 12,
            color: '#f0ece4',
            transition: 'all 0.15s',
          }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Submit Button ── */
function SubmitButton({ loading, text, disabled }: { loading: boolean; text: string; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
      style={{
        background: 'linear-gradient(135deg, #d4a853, #c49b45)',
        color: '#0a0e17',
        boxShadow: '0 4px 24px rgba(212,168,83,0.2)',
        marginTop: 8,
      }}
      onMouseEnter={e => { if (!loading && !disabled) e.currentTarget.style.boxShadow = '0 6px 32px rgba(212,168,83,0.35)'; }}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(212,168,83,0.2)'}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{text} <ArrowRight className="w-4 h-4" /></>}
    </button>
  );
}

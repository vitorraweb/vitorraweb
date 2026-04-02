import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const { signIn, profile, firebaseUser, error } = useAuth();
  const navigate = useNavigate();

  // If already logged in as admin, redirect
  if (firebaseUser && profile) {
    const adminRoles = ['admin', 'Super Admin', 'Ops Manager', 'Viewer'];
    if (adminRoles.includes(profile.role)) {
      navigate('/admin/dashboard', { replace: true });
      return null;
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');

    try {
      await signIn(email, password);
      // Wait for AuthContext to fetch the profile naturally.
      // The top-level check will handle the actual redirect when data is ready.
    } catch (err: any) {
      setLocalError('Invalid credentials or unauthorized access.');
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-vitorra-bg flex items-center justify-center pt-24 pb-12 px-4">
      <div className="w-full max-w-md bg-vitorra-card p-8 rounded-2xl border border-vitorra-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-vitorra-gold to-transparent opacity-50"></div>

        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-vitorra-gold/10 backdrop-blur-md border border-vitorra-gold/20 rounded-xl flex items-center justify-center text-vitorra-gold shadow-lg shadow-vitorra-gold/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>

        <h2 className="text-3xl font-heading text-vitorra-text text-center mb-2">Admin Portal</h2>
        <p className="text-vitorra-muted text-center mb-8 text-sm">Sign in with your administrator account</p>

        {displayError && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {displayError}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-vitorra-muted uppercase tracking-widest mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-vitorra-bg/50 border border-vitorra-border rounded-xl px-4 py-3 text-vitorra-text placeholder-vitorra-muted/40 focus:outline-none focus:border-vitorra-gold/50 transition-all"
              placeholder="admin@vitorra.com"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-vitorra-muted uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-vitorra-bg/50 border border-vitorra-border rounded-xl px-4 py-3 text-vitorra-text placeholder-vitorra-muted/40 focus:outline-none focus:border-vitorra-gold/50 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-vitorra-gold text-vitorra-gold-text font-bold py-3.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-vitorra-gold/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth, Address, UserProfile } from '../context/AuthContext';
import { useCMS, Order } from '../context/CMSContext';
import { db, auth as fbAuth, storage } from '../lib/firebase';
import { collection, onSnapshot, orderBy, query, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendPasswordResetEmail } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { generateDocument, type CompanySettings } from '../lib/generateDocument';
import {
  LayoutDashboard, Package, User, FileText, LogOut, Settings,
  ShoppingBag, Clock, Truck, ChevronRight, ChevronDown,
  MapPin, Plus, Edit3, Trash2, Lock, Mail, Phone, Copy,
  Building2, Globe, Bell, Shield, ArrowRight, X, Check, Loader2,
  CreditCard, Download, KeyRound, Landmark, Calendar,
  MessageSquare, Banknote, HelpCircle, ExternalLink,
  Menu, AlertTriangle, Activity, Eye, EyeOff, Camera,
} from 'lucide-react';
import { getCarrier, getTrackingUrl } from '../lib/carriers';
import OrderTrackingTimeline from '../components/portal/OrderTrackingTimeline';

type Page = 'dashboard' | 'orders' | 'documents' | 'account' | 'support';

export default function Portal() {
  const { firebaseUser, profile, loading: authLoading, logout, updateUserProfile, addAddress, updateAddress, removeAddress } = useAuth();
  const { state } = useCMS();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPage = (searchParams.get('tab') as Page) || 'dashboard';
  const [page, setPage] = useState<Page>(initialPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real-time orders
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [bankSettings, setBankSettings] = useState<any>(null);
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !firebaseUser) navigate('/auth', { replace: true });
  }, [authLoading, firebaseUser, navigate]);

  useEffect(() => {
    if (!db || !firebaseUser) { setOrdersLoading(false); return; }
    const q = query(collection(db, 'users', firebaseUser.uid, 'orders'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setLiveOrders(snap.docs.map(d => ({ ...d.data(), id: d.id } as Order)));
      setOrdersLoading(false);
    }, () => {
      setLiveOrders(state.orders.filter(o => o.customerEmail === profile?.email || o.customerId === profile?.uid)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setOrdersLoading(false);
    });
    return () => unsub();
  }, [firebaseUser]);

  useEffect(() => {
    if (state.settings?.banking) setBankSettings(state.settings.banking);
    if (!db) return;
    getDoc(doc(db, 'system', 'settings')).then(snap => {
      if (snap.exists() && snap.data()?.banking) setBankSettings(snap.data().banking);
    }).catch(() => {});
  }, [state.settings]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-vitorra-bg pt-40 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-vitorra-gold animate-spin" />
      </div>
    );
  }

  const userOrders = liveOrders.length > 0 ? liveOrders : state.orders
    .filter(o => o.customerEmail === profile.email || o.customerId === profile.uid)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

  const initials = profile.displayName
    ? profile.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : profile.email[0].toUpperCase();

  const navItems: { id: Page; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'orders', label: 'My Orders', icon: <Package className="w-5 h-5" />, badge: userOrders.length },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
    { id: 'account', label: 'Account', icon: <Settings className="w-5 h-5" /> },
    { id: 'support', label: 'Help & Support', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  const handleNav = (id: Page) => {
    setPage(id);
    setSidebarOpen(false);
  };

  return (
    <div className="bg-vitorra-bg pt-36">
      <div className="flex min-h-[calc(100vh-9rem)]">
        {/* ═══ SIDEBAR ═══ */}
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Desktop sidebar — sticky wrapper (scrolls away with content at footer) */}
        <div className="hidden lg:block w-[280px] shrink-0 pl-4 pt-2">
          <div className="sticky top-[152px]">
            <aside className="flex flex-col h-[calc(100vh-10rem)] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl z-30 shadow-2xl shadow-black/20 overflow-hidden">
              <SidebarContent profile={profile} initials={initials} navItems={navItems} page={page} handleNav={handleNav} logout={logout} navigate={navigate} />
            </aside>
          </div>
        </div>

        {/* Mobile sidebar — fixed drawer */}
        <aside className={`fixed top-0 left-0 bottom-0 w-[280px] bg-vitorra-bg/95 backdrop-blur-2xl border-r border-white/[0.08] z-50 flex flex-col transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent profile={profile} initials={initials} navItems={navItems} page={page} handleNav={handleNav} logout={logout} navigate={navigate} />
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden sticky top-36 z-30 bg-vitorra-bg/90 backdrop-blur-md border-b border-vitorra-border px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-vitorra-muted hover:text-vitorra-text rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vitorra-gold/80 to-amber-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {profile.photoURL ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <span className="text-sm font-bold text-vitorra-text">{navItems.find(n => n.id === page)?.label}</span>
          </div>

          <div className="p-6 md:p-8 lg:p-10 max-w-6xl">
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {page === 'dashboard' && <DashboardPage profile={profile} orders={userOrders} formatPrice={formatPrice} bankSettings={bankSettings} loading={ordersLoading} onOrderClick={(id) => { setFocusOrderId(id); setPage('orders'); }} setPage={setPage} initials={initials} />}
                {page === 'orders' && <OrdersPage orders={userOrders} formatPrice={formatPrice} bankSettings={bankSettings} initialExpandedId={focusOrderId} onMount={() => setFocusOrderId(null)} />}
                {page === 'documents' && <DocumentsPage orders={userOrders} formatPrice={formatPrice} settings={state.settings} companyInfo={state.companyInfo} />}
                {page === 'account' && <AccountPage profile={profile} updateUserProfile={updateUserProfile} addAddress={addAddress} updateAddress={updateAddress} removeAddress={removeAddress} />}
                {page === 'support' && <SupportPage />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   PAGE: DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */
function DashboardPage({ profile, orders, formatPrice, bankSettings, loading, onOrderClick, setPage, initials }: {
  profile: UserProfile; orders: Order[]; formatPrice: (n: number) => string; bankSettings: any;
  loading: boolean; onOrderClick: (id: string) => void; setPage: (p: Page) => void; initials: string;
}) {
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const pending = orders.filter(o => ['pending', 'awaiting_invoice', 'awaiting_payment'].includes(o.status)).length;
  const inTransit = orders.filter(o => ['processing', 'shipped'].includes(o.status)).length;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const unpaidOrders = orders.filter(o => (o.paymentStatus === 'unpaid' || o.paymentStatus === 'awaiting_payment') || (o.status === 'pending' && o.paymentMethod === 'bank_transfer'));
  const [copied, setCopied] = useState('');

  // Profile completion
  const completionFields = [
    !!profile.displayName, !!profile.phone, !!profile.email,
    !!profile.company?.name, (profile.addresses?.length || 0) > 0,
    profile.emailVerified,
  ];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-vitorra-text tracking-tight mb-1">
            {greeting}, <span className="text-vitorra-gold">{profile.displayName?.split(' ')[0] || 'there'}</span>
          </h1>
          <p className="text-sm text-vitorra-muted">Here's what's happening with your account today.</p>
        </div>
        {completionPct < 100 && (
          <button onClick={() => setPage('account')} className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-vitorra-card border border-vitorra-border rounded-xl hover:border-vitorra-gold/20 transition-all group">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-vitorra-border" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-vitorra-gold" strokeWidth="3" strokeDasharray={`${completionPct}, 100`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-vitorra-gold">{completionPct}%</span>
            </div>
            <div>
              <p className="text-xs font-bold text-vitorra-text group-hover:text-vitorra-gold transition-colors">Complete Profile</p>
              <p className="text-[10px] text-vitorra-muted">Finish setting up</p>
            </div>
          </button>
        )}
      </div>

      {/* Payment Alert */}
      {unpaidOrders.length > 0 && (
        <div className="p-5 bg-amber-500/5 border-l-4 border-l-amber-400 border border-amber-500/20 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-vitorra-text mb-1">Payment Required</h4>
              <p className="text-xs text-vitorra-muted mb-3">{unpaidOrders.length} order{unpaidOrders.length > 1 ? 's' : ''} awaiting bank transfer payment.</p>
              {bankSettings?.bankName && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-vitorra-card/50 rounded-lg border border-vitorra-border/50">
                  {[
                    { l: 'Bank', v: bankSettings.bankName },
                    { l: 'Account', v: bankSettings.accountName || '—' },
                    { l: 'Acc. No.', v: bankSettings.accountNumber || '—' },
                    { l: 'Reference', v: unpaidOrders[0]?.id || '—' },
                  ].map(r => (
                    <div key={r.l}>
                      <p className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-0.5">{r.l}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-vitorra-text truncate">{r.v}</p>
                        <button onClick={() => { navigator.clipboard.writeText(r.v); setCopied(r.l); setTimeout(() => setCopied(''), 1500); }} className="text-vitorra-muted/40 hover:text-vitorra-gold shrink-0">
                          {copied === r.l ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length.toString(), icon: <Package className="w-5 h-5" />, color: 'text-vitorra-gold', bg: 'bg-vitorra-gold/10 border-vitorra-gold/20' },
          { label: 'Pending', value: pending.toString(), icon: <Clock className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'In Transit', value: inTransit.toString(), icon: <Truck className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Total Spent', value: formatPrice(totalSpent), icon: <ShoppingBag className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map(s => (
          <div key={s.label} className="bg-vitorra-card border border-vitorra-border rounded-2xl p-5 hover:border-vitorra-gold/10 transition-all">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${s.color} ${s.bg} mb-3`}>{s.icon}</div>
            <p className="text-[11px] text-vitorra-muted uppercase font-bold tracking-widest mb-1">{s.label}</p>
            <p className="text-xl font-bold text-vitorra-text truncate">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-vitorra-card border border-vitorra-border rounded-2xl">
          <div className="flex items-center justify-between p-5 border-b border-vitorra-border/50">
            <h3 className="text-sm font-bold text-vitorra-text uppercase tracking-wider">Recent Orders</h3>
            <button onClick={() => setPage('orders')} className="text-xs text-vitorra-gold font-bold hover:underline">View All →</button>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="py-12 text-center"><Loader2 className="w-6 h-6 text-vitorra-gold animate-spin mx-auto" /></div>
            ) : orders.length > 0 ? (
              <div className="space-y-1">
                {orders.slice(0, 5).map(o => {
                  const statusColor: Record<string, string> = { pending: 'text-amber-400', processing: 'text-indigo-400', shipped: 'text-cyan-400', delivered: 'text-emerald-400', cancelled: 'text-red-400', awaiting_invoice: 'text-blue-400', awaiting_payment: 'text-purple-400' };
                  return (
                    <button key={o.id} onClick={() => onOrderClick(o.id)} className="w-full flex items-center justify-between py-3 px-3 -mx-1 rounded-xl hover:bg-vitorra-bg/50 transition-all cursor-pointer text-left group">
                      <div className="flex items-center gap-3">
                        <Package className={`w-4 h-4 ${statusColor[o.status] || 'text-vitorra-muted'}`} />
                        <div>
                          <p className="text-sm font-bold text-vitorra-text font-mono group-hover:text-vitorra-gold transition-colors">{o.id}</p>
                          <p className="text-xs text-vitorra-muted">{new Date(o.date).toLocaleDateString()} · {o.items.length} items</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-vitorra-text text-sm">{formatPrice(o.total)}</span>
                        <ChevronRight className="w-4 h-4 text-vitorra-muted/30 group-hover:text-vitorra-gold transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <ShoppingBag className="w-10 h-10 text-vitorra-muted/20 mx-auto mb-4" />
                <p className="text-vitorra-muted text-sm mb-4">No orders yet</p>
                <Link to="/shop" className="text-sm text-vitorra-gold font-bold hover:underline">Browse Products</Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-vitorra-text uppercase tracking-wider">Quick Actions</h3>
          {[
            { label: 'Browse Shop', desc: 'Explore our catalog', icon: <ShoppingBag className="w-5 h-5 text-vitorra-gold" />, href: '/shop' },
            { label: 'Track Orders', desc: 'View order statuses', icon: <Truck className="w-5 h-5 text-blue-400" />, action: () => setPage('orders') },
            { label: 'Account Settings', desc: 'Manage your profile', icon: <Settings className="w-5 h-5 text-purple-400" />, action: () => setPage('account') },
            { label: 'Get Support', desc: 'Contact our team', icon: <MessageSquare className="w-5 h-5 text-emerald-400" />, href: '/contact' },
          ].map(a => {
            const inner = (<>
              <div className="w-10 h-10 rounded-xl bg-vitorra-bg/50 border border-vitorra-border flex items-center justify-center shrink-0">{a.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-vitorra-text group-hover:text-vitorra-gold transition-colors">{a.label}</p>
                <p className="text-xs text-vitorra-muted">{a.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-vitorra-muted/30 group-hover:text-vitorra-gold transition-colors shrink-0" />
            </>);
            const cls = "w-full flex items-center gap-4 p-4 bg-vitorra-card border border-vitorra-border rounded-xl hover:border-vitorra-gold/20 hover:-translate-y-0.5 transition-all duration-200 group text-left";
            return a.href ? (
              <Link key={a.label} to={a.href} className={cls}>{inner}</Link>
            ) : (
              <button key={a.label} onClick={a.action} className={cls}>{inner}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   PAGE: ORDERS
   ═══════════════════════════════════════════════════════════════════ */
function OrdersPage({ orders, formatPrice, bankSettings, initialExpandedId, onMount }: {
  orders: Order[]; formatPrice: (n: number) => string; bankSettings: any; initialExpandedId?: string | null; onMount?: () => void;
}) {
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId || null);
  const [copied, setCopied] = useState('');
  const [paymentNotified, setPaymentNotified] = useState<Set<string>>(new Set());

  useEffect(() => { if (onMount) onMount(); }, []);

  const statuses = ['all', 'pending', 'awaiting_payment', 'processing', 'shipped', 'delivered', 'cancelled'];
  const statusLabel: Record<string, string> = { pending: 'Pending', awaiting_invoice: 'Awaiting Invoice', awaiting_payment: 'Awaiting Payment', processing: 'Processing', shipped: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled', confirmed: 'Confirmed' };
  const statusColor: Record<string, string> = { pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20', awaiting_invoice: 'text-blue-400 bg-blue-500/10 border-blue-500/20', awaiting_payment: 'text-purple-400 bg-purple-500/10 border-purple-500/20', processing: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', confirmed: 'text-blue-400 bg-blue-500/10 border-blue-500/20', shipped: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', delivered: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', cancelled: 'text-red-400 bg-red-500/10 border-red-500/20' };
  const borderColor: Record<string, string> = { pending: 'border-l-amber-400', awaiting_payment: 'border-l-purple-400', processing: 'border-l-indigo-400', shipped: 'border-l-cyan-400', delivered: 'border-l-emerald-400', cancelled: 'border-l-red-400' };
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const handleNotifyPayment = async (orderId: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { customerPaymentClaim: new Date().toISOString(), notes: 'Customer claims payment has been made via bank transfer.' });
      setPaymentNotified(prev => new Set(prev).add(orderId));
    } catch { /* fail silently */ }
  };

  const copyText = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-vitorra-text tracking-tight">My Orders</h1>
          <p className="text-sm text-vitorra-muted mt-1">Track and manage your orders</p>
        </div>
        <Link to="/shop" className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-vitorra-gold/20">
          <ShoppingBag className="w-4 h-4" /> New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filter === s ? 'bg-vitorra-gold text-vitorra-gold-text shadow-md' : 'bg-vitorra-card border border-vitorra-border text-vitorra-muted hover:text-vitorra-text'}`}>
            {s === 'all' ? `All (${orders.length})` : `${statusLabel[s] || s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Order list */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(o => {
            const isUnpaid = o.status === 'pending' || o.status === 'awaiting_payment';
            return (
              <div key={o.id} className={`bg-vitorra-card border border-vitorra-border rounded-2xl overflow-hidden hover:border-vitorra-gold/10 transition-all border-l-4 ${borderColor[o.status] || 'border-l-vitorra-border'}`}>
                <button onClick={() => setExpandedId(expandedId === o.id ? null : o.id)} className="w-full p-5 flex items-center justify-between text-left">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${isUnpaid ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-vitorra-bg/50 border-vitorra-border text-vitorra-gold'}`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-bold text-vitorra-text font-mono">{o.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColor[o.status] || statusColor.pending}`}>{statusLabel[o.status] || o.status}</span>
                      </div>
                      <p className="text-xs text-vitorra-muted">
                        {new Date(o.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} · {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                        {o.paymentStatus === 'paid' && <span className="ml-2 text-emerald-400">✓ Paid</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-lg font-bold text-vitorra-text">{formatPrice(o.total)}</span>
                    <ChevronRight className={`w-5 h-5 text-vitorra-muted transition-transform ${expandedId === o.id ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {expandedId === o.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-vitorra-border/50 pt-5 space-y-5">
                        {/* Status + Payment badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${statusColor[o.status] || statusColor.pending}`}>Order: {statusLabel[o.status] || o.status}</span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${o.paymentStatus === 'paid' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                            <Banknote className="w-3 h-3 inline mr-1" />Payment: {o.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase text-vitorra-muted bg-vitorra-bg/50 border border-vitorra-border">
                            <CreditCard className="w-3 h-3 inline mr-1" />{o.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : o.paymentMethod || 'Bank Transfer'}
                          </span>
                          <span className="ml-auto text-[11px] text-vitorra-muted">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(o.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Bank payment details */}
                        {isUnpaid && (
                          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                            <h5 className="text-[11px] text-amber-400 uppercase font-bold tracking-widest mb-3 flex items-center gap-1"><Landmark className="w-3 h-3" /> Bank Transfer Details</h5>
                            {bankSettings?.bankName ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                {[
                                  { l: 'Bank', v: bankSettings.bankName, k: `bank-${o.id}` },
                                  { l: 'Account Name', v: bankSettings.accountName || '—', k: `name-${o.id}` },
                                  { l: 'Account No.', v: bankSettings.accountNumber || '—', k: `acct-${o.id}` },
                                  { l: 'Reference', v: o.id, k: `ref-${o.id}` },
                                ].map(r => (
                                  <div key={r.k}>
                                    <p className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-0.5">{r.l}</p>
                                    <div className="flex items-center gap-1">
                                      <p className="text-xs font-bold text-vitorra-text truncate">{r.v}</p>
                                      <button onClick={() => copyText(r.v, r.k)} className="text-vitorra-muted/40 hover:text-vitorra-gold shrink-0">
                                        {copied === r.k ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-vitorra-muted mb-3">Bank details pending. Reference: <span className="font-bold text-vitorra-text font-mono">{o.id}</span>.</p>
                            )}
                            <button onClick={() => handleNotifyPayment(o.id)} disabled={paymentNotified.has(o.id)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${paymentNotified.has(o.id) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-vitorra-gold text-vitorra-gold-text hover:opacity-90'}`}>
                              {paymentNotified.has(o.id) ? <><Check className="w-3 h-3 inline mr-1" /> Admin Notified</> : "I've Made the Payment"}
                            </button>
                          </div>
                        )}

                        {/* Timeline */}
                        <div>
                          <h5 className="text-[11px] text-vitorra-muted uppercase font-bold tracking-widest mb-4">Order Timeline</h5>
                          <div className="flex items-start gap-0 overflow-x-auto pb-2">
                            {[
                              { key: 'pending', label: 'Placed' },
                              { key: 'confirmed', label: 'Confirmed' },
                              { key: 'processing', label: 'Processing' },
                              { key: 'shipped', label: 'Shipped' },
                              { key: 'delivered', label: 'Delivered' },
                            ].map((step, i, arr) => {
                              const statusOrder = ['pending', 'awaiting_invoice', 'awaiting_payment', 'confirmed', 'processing', 'shipped', 'delivered'];
                              const currentIdx = statusOrder.indexOf(o.status);
                              const stepIdx = statusOrder.indexOf(step.key);
                              const isComplete = stepIdx <= currentIdx;
                              return (
                                <div key={step.key} className="flex items-center">
                                  <div className="flex flex-col items-center min-w-[56px]">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${isComplete ? 'bg-vitorra-gold border-vitorra-gold text-vitorra-gold-text' : 'border-vitorra-border text-vitorra-muted'}`}>
                                      {isComplete ? <Check className="w-3.5 h-3.5" /> : i + 1}
                                    </div>
                                    <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider ${isComplete ? 'text-vitorra-gold' : 'text-vitorra-muted/50'}`}>{step.label}</p>
                                  </div>
                                  {i < arr.length - 1 && (
                                    <div className={`w-8 h-0.5 mt-[-16px] ${isComplete ? 'bg-vitorra-gold' : 'bg-vitorra-border'}`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Order Timeline */}
                        <OrderTrackingTimeline currentStatus={o.status} history={o.statusHistory} />

                        {/* Items */}
                        <div>
                          <h5 className="text-[11px] text-vitorra-muted uppercase font-bold tracking-widest mb-3">Items ({o.items.length})</h5>
                          <div className="space-y-2">
                            {o.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-4 py-2.5 border-b border-vitorra-border/30 last:border-0">
                                <div className="w-10 h-10 bg-vitorra-bg/50 rounded-lg border border-vitorra-border flex items-center justify-center shrink-0">
                                  {(item as any).image ? <img src={(item as any).image} alt={item.name} className="w-full h-full object-cover rounded-lg" /> : <Package className="w-4 h-4 text-vitorra-muted/30" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-vitorra-text truncate">{item.name}</p>
                                  <p className="text-xs text-vitorra-muted">{formatPrice(item.price)} × {item.quantity}</p>
                                </div>
                                <p className="text-sm font-bold text-vitorra-text shrink-0">{formatPrice(item.price * item.quantity)}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="p-4 bg-vitorra-bg/50 rounded-xl border border-vitorra-border">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-vitorra-muted">Subtotal</span>
                              <span className="text-vitorra-text">{formatPrice((o as any).subtotal || o.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-vitorra-muted">Shipping</span>
                              <span className="text-vitorra-text">{(o as any).shipping ? formatPrice((o as any).shipping) : 'Included'}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold pt-2 border-t border-vitorra-border">
                              <span className="text-vitorra-text">Total</span>
                              <span className="text-vitorra-gold text-base">{formatPrice(o.total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Shipping + Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {o.shippingAddress && (
                            <div className="p-4 bg-vitorra-bg/50 rounded-xl border border-vitorra-border">
                              <h5 className="text-[11px] text-vitorra-muted uppercase font-bold tracking-widest mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> Delivery Address</h5>
                              <p className="text-sm text-vitorra-text">{typeof o.shippingAddress === 'string' ? o.shippingAddress : JSON.stringify(o.shippingAddress)}</p>
                            </div>
                          )}
                          {o.notes && (
                            <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                              <h5 className="text-[11px] text-blue-400 uppercase font-bold tracking-widest mb-2 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Admin Notes</h5>
                              <p className="text-sm text-vitorra-text">{o.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Shipment Tracking Card */}
                        {o.carrier && o.trackingNumber && (
                          <PortalShipmentCard carrier={o.carrier} trackingNumber={o.trackingNumber} status={o.status} estimatedDelivery={o.estimatedDelivery} />
                        )}

                        {/* Documents */}
                        {(o.proformaUrl || (o as any).invoiceUrl) && (
                          <div>
                            <h5 className="text-[11px] text-vitorra-muted uppercase font-bold tracking-widest mb-3">Documents</h5>
                            <div className="flex flex-wrap gap-3">
                              {o.proformaUrl && (
                                <a href={o.proformaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-vitorra-bg/50 border border-vitorra-border rounded-xl text-xs font-bold text-vitorra-gold hover:border-vitorra-gold/30 transition-all">
                                  <Download className="w-3.5 h-3.5" /> Proforma Invoice
                                </a>
                              )}
                              {(o as any).invoiceUrl && (
                                <a href={(o as any).invoiceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-vitorra-bg/50 border border-vitorra-border rounded-xl text-xs font-bold text-vitorra-gold hover:border-vitorra-gold/30 transition-all">
                                  <Download className="w-3.5 h-3.5" /> Invoice
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-vitorra-card border border-vitorra-border rounded-2xl">
          <Package className="w-12 h-12 text-vitorra-muted/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-vitorra-text mb-2">No orders found</p>
          <p className="text-sm text-vitorra-muted mb-6">Start by browsing our product catalog</p>
          <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-vitorra-gold/20">
            <ShoppingBag className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   PAGE: DOCUMENTS
   ═══════════════════════════════════════════════════════════════════ */
function DocumentsPage({ orders, formatPrice, settings, companyInfo }: { orders: Order[]; formatPrice: (n: number) => string; settings: any; companyInfo: any }) {
  const [generating, setGenerating] = useState<string | null>(null);

  // Build company settings for the PDF generator
  const companySettings: CompanySettings = {
    general: {
      companyName: companyInfo?.name || settings?.general?.companyName || 'Vitorra Holdings Limited',
      supportEmail: companyInfo?.email || settings?.general?.supportEmail || 'info@vitorraholdings.com',
      supportPhone: companyInfo?.phone || settings?.general?.supportPhone || '',
      address: companyInfo?.address?.join(', ') || settings?.general?.address || 'Kampala, Uganda',
      registrationNumber: settings?.general?.registrationNumber || '80034340923220',
    },
    banking: settings?.banking || {
      bankName: 'Stanbic Bank Uganda',
      accountName: 'Vitorra Holdings Limited',
      accountNumber: '9030005678901',
      branchName: 'Kampala Main Branch',
      swiftCode: 'SBICUGKX',
      currency: 'UGX',
      additionalInstructions: 'Please include your Order ID as payment reference.',
    },
    invoicing: settings?.invoicing || {
      companyTIN: '',
      invoicePrefix: 'INV-',
      proformaPrefix: 'PRO-',
      invoiceFooter: 'Payment is due within the agreed terms. Thank you for your business.',
      proformaValidityDays: 14,
      showBankDetailsOnInvoice: true,
    },
    financials: settings?.financials || { currency: 'UGX' },
  };

  // Build document list from orders
  const docs = orders.flatMap(o => {
    const items: { type: 'proforma' | 'invoice'; label: string; orderId: string; date: string; total: number; uploadedUrl?: string; icon: React.ReactNode; available: boolean; statusHint?: string }[] = [];

    // Proforma Invoice — available for pending/awaiting orders, or if admin uploaded one
    const needsProforma = ['pending', 'awaiting_invoice', 'awaiting_payment'].includes(o.status) || o.proformaUrl;
    if (needsProforma) {
      items.push({
        type: 'proforma',
        label: 'Proforma Invoice',
        orderId: o.id,
        date: o.date,
        total: o.total,
        uploadedUrl: o.proformaUrl || undefined,
        icon: <FileText className="w-5 h-5" />,
        available: true,
        statusHint: o.proformaUrl ? 'Admin-issued' : 'Auto-generated',
      });
    }

    // Invoice — available for paid/delivered orders, or if admin uploaded one
    const hasInvoice = ['delivered', 'shipped'].includes(o.status) || o.paymentStatus === 'paid' || o.invoiceUrl;
    if (hasInvoice) {
      items.push({
        type: 'invoice',
        label: 'Invoice',
        orderId: o.id,
        date: o.date,
        total: o.total,
        uploadedUrl: o.invoiceUrl || undefined,
        icon: <CreditCard className="w-5 h-5" />,
        available: true,
        statusHint: o.invoiceUrl ? 'Admin-issued' : 'Auto-generated',
      });
    }

    return items;
  });

  const handleDownload = async (d: typeof docs[0]) => {
    const key = `${d.type}-${d.orderId}`;
    setGenerating(key);
    try {
      // If admin uploaded a URL, open that instead
      if (d.uploadedUrl) {
        window.open(d.uploadedUrl, '_blank');
        setGenerating(null);
        return;
      }

      // Find the full order object
      const order = orders.find(o => o.id === d.orderId);
      if (!order) throw new Error('Order not found');

      // Generate PDF (runs synchronously, but we wrap in a small delay for UX)
      await new Promise(resolve => setTimeout(resolve, 300));
      generateDocument(order, d.type, companySettings);
    } catch (err) {
      console.error('Document generation failed:', err);
    } finally {
      setGenerating(null);
    }
  };

  const typeColors: Record<string, { bg: string; border: string; text: string }> = {
    proforma: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    invoice: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-vitorra-text tracking-tight">Documents</h1>
        <p className="text-sm text-vitorra-muted mt-1">Download proforma invoices and final invoices as PDF</p>
      </div>

      {/* Quick Stats */}
      {docs.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Proformas', count: docs.filter(d => d.type === 'proforma').length, ...typeColors.proforma },
            { label: 'Invoices', count: docs.filter(d => d.type === 'invoice').length, ...typeColors.invoice },
          ].map(s => (
            <div key={s.label} className={`p-3 rounded-xl ${s.bg} border ${s.border}`}>
              <div className={`text-xl font-bold ${s.text}`}>{s.count}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-vitorra-muted">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {docs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((d, i) => {
            const key = `${d.type}-${d.orderId}`;
            const isGenerating = generating === key;
            const colors = typeColors[d.type];
            return (
              <div key={i} className="bg-vitorra-card border border-vitorra-border rounded-2xl p-5 hover:border-vitorra-gold/10 transition-all group">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text} shrink-0`}>
                    {d.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-vitorra-text">{d.label}</p>
                      {d.statusHint && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-vitorra-bg/50 border border-vitorra-border text-vitorra-muted font-bold uppercase">{d.statusHint}</span>
                      )}
                    </div>
                    <p className="text-xs text-vitorra-muted font-mono mb-1">{d.orderId}</p>
                    <div className="flex items-center gap-3 text-xs text-vitorra-muted">
                      <span>{new Date(d.date).toLocaleDateString()}</span>
                      <span className="font-bold text-vitorra-text">{formatPrice(d.total)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(d)}
                    disabled={isGenerating}
                    className="p-2.5 bg-vitorra-gold/10 text-vitorra-gold border border-vitorra-gold/20 rounded-xl hover:bg-vitorra-gold hover:text-vitorra-gold-text transition-all shrink-0 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-vitorra-card border border-vitorra-border rounded-2xl">
          <FileText className="w-12 h-12 text-vitorra-muted/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-vitorra-text mb-2">No documents yet</p>
          <p className="text-sm text-vitorra-muted">Documents will appear here as your orders are processed</p>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   PAGE: ACCOUNT SETTINGS
   ═══════════════════════════════════════════════════════════════════ */
function AccountPage({ profile, updateUserProfile, addAddress, updateAddress, removeAddress }: {
  profile: UserProfile;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  addAddress: (addr: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, data: Partial<Address>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
}) {
  const [section, setSection] = useState<'personal' | 'company' | 'addresses' | 'security' | 'notifications' | 'danger'>('personal');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Personal info
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [phone, setPhone] = useState(profile.phone || '');

  // Company
  const [companyName, setCompanyName] = useState(profile.company?.name || '');
  const [companyReg, setCompanyReg] = useState(profile.company?.registrationNo || '');
  const [companyTax, setCompanyTax] = useState(profile.company?.taxId || '');
  const [companyWeb, setCompanyWeb] = useState(profile.company?.website || '');

  // Notifications
  const [orderNotif, setOrderNotif] = useState(profile.preferences?.emailNotifications?.orderUpdates ?? true);
  const [promoNotif, setPromoNotif] = useState(profile.preferences?.emailNotifications?.promotions ?? false);
  const [newsNotif, setNewsNotif] = useState(profile.preferences?.emailNotifications?.newsletter ?? false);
  const [currency, setCurrency] = useState(profile.preferences?.currency || 'UGX');

  // Address form
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editAddrId, setEditAddrId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({ label: 'Home', fullName: profile.displayName, street: '', city: '', state: '', postalCode: '', country: 'Uganda', phone: phone, type: 'both' as 'both' | 'billing' | 'shipping', isDefault: false });

  const save = async (fn: () => Promise<void>) => { setSaving(true); await fn(); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const inputClass = "w-full bg-vitorra-bg/50 border border-vitorra-border rounded-xl px-4 py-3 text-vitorra-text placeholder-vitorra-muted/40 outline-none focus:border-vitorra-gold/50 transition-all text-sm";
  const labelClass = "block text-[12px] text-vitorra-muted uppercase font-semibold tracking-wider mb-2";

  const initials = profile.displayName
    ? profile.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : profile.email[0].toUpperCase();

  // Profile completion
  const completionItems = [
    { label: 'Full Name', done: !!profile.displayName },
    { label: 'Email Verified', done: profile.emailVerified },
    { label: 'Phone Number', done: !!profile.phone },
    { label: 'Company Info', done: !!profile.company?.name },
    { label: 'Default Address', done: (profile.addresses?.length || 0) > 0 },
  ];
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100);

  const tabs = [
    { id: 'personal' as const, label: 'Personal', icon: <User className="w-4 h-4" /> },
    { id: 'company' as const, label: 'Business', icon: <Building2 className="w-4 h-4" /> },
    { id: 'addresses' as const, label: 'Addresses', icon: <MapPin className="w-4 h-4" />, count: profile.addresses?.length || 0 },
    { id: 'security' as const, label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'danger' as const, label: 'Danger Zone', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-vitorra-text tracking-tight">Account Settings</h1>
        <p className="text-sm text-vitorra-muted mt-1">Manage your profile, security, and preferences</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-vitorra-gold/80 to-amber-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-vitorra-gold/20 shrink-0 overflow-hidden">
            {profile.photoURL ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-vitorra-text">{profile.displayName || 'User'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-vitorra-muted">{profile.email}</p>
              {profile.emailVerified && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${profile.accountType === 'business' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-vitorra-gold/10 text-vitorra-gold border-vitorra-gold/20'}`}>
                {profile.accountType === 'business' ? 'Business Account' : 'Individual'}
              </span>
              <span className="text-xs text-vitorra-muted">Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</span>
            </div>
          </div>
          {/* Completion */}
          <div className="hidden md:flex flex-col items-center gap-2 shrink-0">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-vitorra-border" strokeWidth="2.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-vitorra-gold" strokeWidth="2.5" strokeDasharray={`${completionPct}, 100`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-vitorra-gold">{completionPct}%</span>
            </div>
            <p className="text-[10px] text-vitorra-muted uppercase font-bold tracking-wider">Complete</p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSection(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              section === t.id
                ? 'bg-vitorra-gold/10 text-vitorra-gold border border-vitorra-gold/20'
                : t.id === 'danger'
                  ? 'text-red-400/50 hover:text-red-400 hover:bg-red-400/5'
                  : 'text-vitorra-muted hover:text-vitorra-text hover:bg-vitorra-bg/50'
            }`}>
            {t.icon} {t.label}
            {t.count !== undefined && t.count > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-vitorra-bg">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={section} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

          {/* ─── PERSONAL INFO ─── */}
          {section === 'personal' && (
            <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-vitorra-text">Personal Information</h3>
                  <p className="text-xs text-vitorra-muted mt-0.5">Update your personal details and profile photo</p>
                </div>
              </div>
              {/* Avatar Upload */}
              <AvatarUpload profile={profile} initials={initials} updateUserProfile={updateUserProfile} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelClass}>Full Name</label><input value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} /></div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <div className="relative">
                    <input value={profile.email} disabled className={`${inputClass} opacity-50 cursor-not-allowed pr-20`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${profile.emailVerified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {profile.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
                <div><label className={labelClass}>Phone Number</label><input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+256 700 000 000" /></div>
                <div><label className={labelClass}>Account Type</label><input value={profile.accountType === 'business' ? 'Business (B2B)' : 'Individual (B2C)'} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} /></div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Account ID</label>
                  <div className="flex items-center gap-2">
                    <input value={profile.uid} disabled className={`${inputClass} opacity-50 cursor-not-allowed font-mono text-xs`} />
                    <button onClick={() => navigator.clipboard.writeText(profile.uid)} className="p-3 bg-vitorra-bg/50 border border-vitorra-border rounded-xl text-vitorra-muted hover:text-vitorra-gold transition-all shrink-0">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={() => save(() => updateUserProfile({ displayName, phone }))} disabled={saving}
                  className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all text-sm disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ─── COMPANY ─── */}
          {section === 'company' && (
            <div className="space-y-6">
              {profile.accountType === 'business' && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-vitorra-text">B2B Account Active</p>
                    <p className="text-xs text-vitorra-muted">You have access to wholesale pricing and bulk order features.</p>
                  </div>
                </div>
              )}
              <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-vitorra-text">Business Details</h3>
                  <p className="text-xs text-vitorra-muted mt-0.5">Add company info to enable B2B pricing and wholesale features</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>Company Name</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} placeholder="Acme Corporation" /></div>
                  <div><label className={labelClass}>Registration Number</label><input value={companyReg} onChange={e => setCompanyReg(e.target.value)} className={inputClass} placeholder="REG-XXXX" /></div>
                  <div><label className={labelClass}>Tax ID / TIN</label><input value={companyTax} onChange={e => setCompanyTax(e.target.value)} className={inputClass} placeholder="TIN-XXXX" /></div>
                  <div><label className={labelClass}>Website</label><input value={companyWeb} onChange={e => setCompanyWeb(e.target.value)} className={inputClass} placeholder="https://company.com" /></div>
                </div>
                <button onClick={() => save(() => updateUserProfile({ company: { name: companyName, registrationNo: companyReg, taxId: companyTax, website: companyWeb }, accountType: companyName ? 'business' : 'individual', role: companyName ? 'b2b' : 'b2c' }))} disabled={saving}
                  className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all text-sm disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Company Info'}
                </button>
              </div>
            </div>
          )}

          {/* ─── ADDRESSES ─── */}
          {section === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-vitorra-text">Address Book</h3>
                  <p className="text-xs text-vitorra-muted mt-0.5">Manage your shipping and billing addresses</p>
                </div>
                <button onClick={() => { setEditAddrId(null); setAddrForm({ label: 'Home', fullName: profile.displayName, street: '', city: '', state: '', postalCode: '', country: 'Uganda', phone: phone, type: 'both', isDefault: false }); setShowAddrForm(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl text-xs uppercase tracking-wider">
                  <Plus className="w-4 h-4" /> Add Address
                </button>
              </div>

              {/* Address Form */}
              <AnimatePresence>
                {showAddrForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="bg-vitorra-card border border-vitorra-gold/20 rounded-2xl p-6 space-y-5">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-vitorra-text">{editAddrId ? 'Edit Address' : 'New Address'}</h4>
                        <button onClick={() => setShowAddrForm(false)} className="p-1.5 text-vitorra-muted hover:text-vitorra-text rounded-lg"><X className="w-5 h-5" /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className={labelClass}>Label</label>
                          <select value={addrForm.label} onChange={e => setAddrForm({...addrForm, label: e.target.value})} className={inputClass}>
                            <option>Home</option><option>Office</option><option>Warehouse</option><option>Other</option>
                          </select>
                        </div>
                        <div><label className={labelClass}>Full Name</label><input value={addrForm.fullName} onChange={e => setAddrForm({...addrForm, fullName: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Phone</label><input value={addrForm.phone} onChange={e => setAddrForm({...addrForm, phone: e.target.value})} className={inputClass} /></div>
                      </div>
                      <div><label className={labelClass}>Street Address</label><input value={addrForm.street} onChange={e => setAddrForm({...addrForm, street: e.target.value})} className={inputClass} /></div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><label className={labelClass}>City</label><input value={addrForm.city} onChange={e => setAddrForm({...addrForm, city: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>State</label><input value={addrForm.state} onChange={e => setAddrForm({...addrForm, state: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Postal</label><input value={addrForm.postalCode} onChange={e => setAddrForm({...addrForm, postalCode: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Country</label><input value={addrForm.country} onChange={e => setAddrForm({...addrForm, country: e.target.value})} className={inputClass} /></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-vitorra-muted cursor-pointer"><input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm({...addrForm, isDefault: e.target.checked})} className="accent-vitorra-gold" /> Set as default</label>
                        <select value={addrForm.type} onChange={e => setAddrForm({...addrForm, type: e.target.value as any})} className={`${inputClass} w-auto`}>
                          <option value="both">Billing & Shipping</option><option value="billing">Billing Only</option><option value="shipping">Shipping Only</option>
                        </select>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={async () => { setSaving(true); if (editAddrId) { await updateAddress(editAddrId, addrForm); } else { await addAddress(addrForm); } setShowAddrForm(false); setEditAddrId(null); setAddrForm({ label: 'Home', fullName: profile.displayName, street: '', city: '', state: '', postalCode: '', country: 'Uganda', phone: phone, type: 'both', isDefault: false }); setSaving(false); }} disabled={saving}
                          className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl text-sm disabled:opacity-50">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editAddrId ? 'Update' : 'Save Address'}
                        </button>
                        <button onClick={() => setShowAddrForm(false)} className="px-6 py-3 text-vitorra-muted text-sm hover:text-vitorra-text transition-colors">Cancel</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Address Cards */}
              {profile.addresses && profile.addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.addresses.map(addr => {
                    const typeColors: Record<string, string> = { billing: 'border-l-blue-400', shipping: 'border-l-emerald-400', both: 'border-l-vitorra-gold' };
                    return (
                      <div key={addr.id} className={`bg-vitorra-card border border-vitorra-border rounded-2xl p-5 border-l-4 ${typeColors[addr.type] || 'border-l-vitorra-gold'} hover:border-vitorra-gold/10 transition-all`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-vitorra-gold" />
                            <span className="font-bold text-vitorra-text text-sm">{addr.label}</span>
                            {addr.isDefault && <span className="text-[10px] px-2 py-0.5 bg-vitorra-gold/10 text-vitorra-gold border border-vitorra-gold/20 rounded-full font-bold uppercase">Default</span>}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setAddrForm({ label: addr.label, fullName: addr.fullName, street: addr.street, city: addr.city, state: addr.state, postalCode: addr.postalCode, country: addr.country, phone: addr.phone, type: addr.type, isDefault: addr.isDefault }); setEditAddrId(addr.id); setShowAddrForm(true); }} className="p-1.5 text-vitorra-muted hover:text-vitorra-gold hover:bg-vitorra-gold/10 rounded-lg transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { if (confirm('Remove this address?')) removeAddress(addr.id); }} className="p-1.5 text-vitorra-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-vitorra-muted">
                          <p>{addr.fullName}</p>
                          <p>{addr.street}</p>
                          <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}</p>
                          <p>{addr.country} · {addr.phone}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-vitorra-border/50">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${addr.type === 'billing' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : addr.type === 'shipping' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-vitorra-gold bg-vitorra-gold/10 border-vitorra-gold/20'}`}>
                            {addr.type === 'both' ? 'Billing & Shipping' : addr.type === 'billing' ? 'Billing' : 'Shipping'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center bg-vitorra-card border border-dashed border-vitorra-border rounded-2xl">
                  <MapPin className="w-12 h-12 text-vitorra-muted/20 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-vitorra-text mb-2">No saved addresses</p>
                  <p className="text-sm text-vitorra-muted mb-6">Add an address to speed up your checkout process</p>
                  <button onClick={() => setShowAddrForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl text-xs uppercase tracking-wider">
                    <Plus className="w-4 h-4" /> Add Your First Address
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── SECURITY ─── */}
          {section === 'security' && (
            <div className="space-y-6">
              <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 md:p-8 space-y-5">
                <h3 className="text-lg font-bold text-vitorra-text">Security & Privacy</h3>

                {/* Email Verification */}
                <div className="flex items-center justify-between p-4 bg-vitorra-bg/50 rounded-xl border border-vitorra-border">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.emailVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-vitorra-text">Email Verification</p>
                      <p className="text-xs text-vitorra-muted">{profile.email}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase ${profile.emailVerified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {profile.emailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>

                {/* Password */}
                <div className="flex items-center justify-between p-4 bg-vitorra-bg/50 rounded-xl border border-vitorra-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-vitorra-gold/10 text-vitorra-gold flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-vitorra-text">Password</p>
                      <p className="text-xs text-vitorra-muted">Reset via email link</p>
                    </div>
                  </div>
                  <PasswordResetButton email={profile.email} />
                </div>

                {/* Connected Accounts */}
                <div className="flex items-center justify-between p-4 bg-vitorra-bg/50 rounded-xl border border-vitorra-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-vitorra-text">Sign-in Method</p>
                      <p className="text-xs text-vitorra-muted">{profile.providers?.join(', ') || 'Email/Password'}</p>
                    </div>
                  </div>
                  {profile.providers?.includes('google.com') ? (
                    <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">Google Linked</span>
                  ) : (
                    <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase bg-vitorra-bg/50 text-vitorra-muted border border-vitorra-border">Email Only</span>
                  )}
                </div>

                {/* 2FA Placeholder */}
                <div className="flex items-center justify-between p-4 bg-vitorra-bg/50 rounded-xl border border-dashed border-vitorra-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-vitorra-text">Two-Factor Authentication</p>
                      <p className="text-xs text-vitorra-muted">Additional layer of security for your account</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase bg-vitorra-bg/50 text-vitorra-muted border border-vitorra-border">Coming Soon</span>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 md:p-8">
                <h3 className="text-lg font-bold text-vitorra-text mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Account Created', value: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A', icon: <Calendar className="w-4 h-4 text-vitorra-gold" /> },
                    { label: 'Last Login', value: profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A', icon: <Activity className="w-4 h-4 text-blue-400" /> },
                    { label: 'Account Status', value: profile.status === 'active' ? 'Active' : 'Suspended', icon: <Check className="w-4 h-4 text-emerald-400" /> },
                  ].map(i => (
                    <div key={i.label} className="p-4 bg-vitorra-bg/50 rounded-xl border border-vitorra-border">
                      <div className="flex items-center gap-2 mb-2">{i.icon}<p className="text-[11px] text-vitorra-muted uppercase font-bold tracking-widest">{i.label}</p></div>
                      <p className="text-sm text-vitorra-text font-medium">{i.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── NOTIFICATIONS ─── */}
          {section === 'notifications' && (
            <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-vitorra-text">Notification Preferences</h3>
                <p className="text-xs text-vitorra-muted mt-0.5">Choose what updates you'd like to receive</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Order Updates', desc: 'Get notified when your order status changes', icon: <Package className="w-5 h-5 text-vitorra-gold" />, value: orderNotif, set: setOrderNotif },
                  { label: 'Payment Reminders', desc: 'Receive reminders for pending payments', icon: <CreditCard className="w-5 h-5 text-amber-400" />, value: true, set: () => {} },
                  { label: 'Promotions & Offers', desc: 'Receive promotional offers and discounts', icon: <ShoppingBag className="w-5 h-5 text-purple-400" />, value: promoNotif, set: setPromoNotif },
                  { label: 'Newsletter', desc: 'Monthly newsletter with industry updates', icon: <Mail className="w-5 h-5 text-blue-400" />, value: newsNotif, set: setNewsNotif },
                  { label: 'Product Announcements', desc: 'Be the first to know about new products', icon: <Bell className="w-5 h-5 text-emerald-400" />, value: false, set: () => {} },
                ].map(pref => (
                  <div key={pref.label} className="flex items-center justify-between p-4 bg-vitorra-bg/50 rounded-xl border border-vitorra-border hover:border-vitorra-gold/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-vitorra-card border border-vitorra-border flex items-center justify-center shrink-0">{pref.icon}</div>
                      <div>
                        <p className="text-sm font-bold text-vitorra-text">{pref.label}</p>
                        <p className="text-xs text-vitorra-muted">{pref.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => pref.set(!pref.value)} className={`w-12 h-7 rounded-full transition-all ${pref.value ? 'bg-vitorra-gold' : 'bg-vitorra-border'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${pref.value ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-[12px] text-vitorra-muted uppercase font-semibold tracking-wider mb-2">Preferred Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className={`${inputClass} max-w-xs`}>
                  <option value="UGX">UGX - Ugandan Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              <button onClick={() => save(() => updateUserProfile({ preferences: { ...profile.preferences, currency, emailNotifications: { orderUpdates: orderNotif, promotions: promoNotif, newsletter: newsNotif } } }))} disabled={saving}
                className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all text-sm disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Preferences'}
              </button>
            </div>
          )}

          {/* ─── DANGER ZONE ─── */}
          {section === 'danger' && (
            <DangerZone profile={profile} />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   COMPONENT: DANGER ZONE (Export + Delete)
   ═══════════════════════════════════════════════════════════════════ */
function DangerZone({ profile }: { profile: UserProfile }) {
  const { logout, firebaseUser } = useAuth();
  const { state } = useCMS();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // ─── EXPORT DATA ─────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      // Gather all user data
      const userOrders = state.orders.filter(
        o => o.customerEmail === profile.email || o.customerId === profile.uid
      );

      const exportData = {
        exportDate: new Date().toISOString(),
        profile: {
          displayName: profile.displayName,
          email: profile.email,
          phone: profile.phone,
          accountType: profile.accountType,
          company: profile.company,
          createdAt: profile.createdAt,
        },
        addresses: profile.addresses || [],
        preferences: profile.preferences || {},
        orders: userOrders.map(o => ({
          id: o.id,
          date: o.date,
          status: o.status,
          items: o.items,
          total: o.total,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          shippingMethod: o.shippingMethod,
          shippingAddress: o.shippingAddress,
        })),
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vitorra_account_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // ─── DELETE ACCOUNT ──────────────────────────────────────────
  const handleDelete = async () => {
    if (!firebaseUser || !db) return;
    setDeleteError('');
    setDeleting(true);

    try {
      // Re-authenticate the user (required for account deletion)
      const { EmailAuthProvider, reauthenticateWithCredential, deleteUser } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(profile.email, deletePassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Log deletion request to Firestore (admin audit trail)
      const { addDoc, collection: firestoreCollection, serverTimestamp, deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');
      await addDoc(firestoreCollection(db, 'deletionRequests'), {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        reason: 'user_initiated',
        requestedAt: serverTimestamp(),
      });

      // Delete user's Firestore profile document
      try {
        await deleteDoc(firestoreDoc(db, 'users', profile.uid));
      } catch { /* profile doc may not exist in some cases */ }

      // Delete the Firebase Auth account
      await deleteUser(firebaseUser);

      // Logout and redirect
      await logout();
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Account deletion failed:', err);
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setDeleteError('Incorrect password. Please try again.');
      } else if (err?.code === 'auth/too-many-requests') {
        setDeleteError('Too many attempts. Please wait and try again later.');
      } else if (err?.code === 'auth/requires-recent-login') {
        setDeleteError('Please sign out and sign back in, then try again.');
      } else {
        setDeleteError('Deletion failed. Please contact support.');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-bold text-red-400">Danger Zone</h3>
        </div>
        <p className="text-sm text-vitorra-muted mb-6">These actions are permanent and cannot be undone.</p>

        <div className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 bg-vitorra-card border border-vitorra-border rounded-xl">
            <div>
              <p className="text-sm font-bold text-vitorra-text">Export Your Data</p>
              <p className="text-xs text-vitorra-muted">Download a copy of your account data as JSON</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 text-xs font-bold text-vitorra-text border border-vitorra-border rounded-xl hover:border-vitorra-gold/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>

          {/* Delete Account */}
          <div className="p-4 bg-vitorra-card border border-red-500/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-vitorra-text">Delete Account</p>
                <p className="text-xs text-vitorra-muted">Permanently remove your account and all data</p>
              </div>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-xs font-bold text-red-400 border border-red-500/20 rounded-xl hover:bg-red-400/10 transition-all"
                >
                  Delete Account
                </button>
              ) : (
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                  className="px-4 py-2 text-xs font-bold text-vitorra-muted border border-vitorra-border rounded-xl hover:text-vitorra-text transition-all"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Delete Confirmation Flow */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-4 pt-4 border-t border-red-500/10 space-y-3">
                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <p className="text-xs text-red-400 font-bold mb-1">⚠️ This action is irreversible</p>
                      <p className="text-xs text-vitorra-muted">All your data including profile, orders, and addresses will be permanently deleted. Enter your password to confirm.</p>
                    </div>

                    {deleteError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-xs text-red-400 font-bold">{deleteError}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <input
                        type="password"
                        placeholder="Enter your password to confirm"
                        value={deletePassword}
                        onChange={e => setDeletePassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && deletePassword && handleDelete()}
                        className="flex-1 bg-vitorra-bg/50 border border-red-500/20 rounded-xl px-4 py-2.5 text-vitorra-text placeholder-vitorra-muted/40 outline-none focus:border-red-500/50 transition-all text-sm"
                      />
                      <button
                        onClick={handleDelete}
                        disabled={deleting || !deletePassword}
                        className="px-5 py-2.5 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        {deleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...</> : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   PAGE: SUPPORT
   ═══════════════════════════════════════════════════════════════════ */
function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = [
    { q: 'How do I track my order?', a: 'Go to the "My Orders" section in the sidebar. Click on any order to see its full timeline, current status, and tracking details.' },
    { q: 'What payment methods do you accept?', a: 'We currently accept bank wire transfers. After placing an order, you\'ll receive banking details to complete your payment. We are working on adding more payment methods soon.' },
    { q: 'How do I update my shipping address?', a: 'Navigate to Account → Addresses. You can add, edit, or remove addresses at any time. Set a default address to speed up future checkouts.' },
    { q: 'Can I cancel an order?', a: 'Orders in "Pending" or "Awaiting Payment" status can be cancelled. Open the order details and click "Request Cancellation". Our team will confirm within 24 hours.' },
    { q: 'How long does shipping take?', a: 'Delivery times depend on your location and order size. Local deliveries typically take 2-5 business days. International orders may take 7-21 business days.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-vitorra-text tracking-tight">Help & Support</h1>
        <p className="text-sm text-vitorra-muted mt-1">Get help with your account, orders, and more</p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/contact" className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 hover:border-vitorra-gold/20 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-vitorra-gold/10 text-vitorra-gold flex items-center justify-center mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-vitorra-text mb-1 group-hover:text-vitorra-gold transition-colors">Contact Us</h3>
          <p className="text-xs text-vitorra-muted mb-3">Send us a message and we'll get back to you within 24 hours.</p>
          <span className="text-xs text-vitorra-gold font-bold flex items-center gap-1">Get in touch <ArrowRight className="w-3 h-3" /></span>
        </Link>

        <a href="mailto:support@vitorra.org" className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 hover:border-vitorra-gold/20 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-vitorra-text mb-1 group-hover:text-vitorra-gold transition-colors">Email Support</h3>
          <p className="text-xs text-vitorra-muted mb-3">Reach us directly at support@vitorra.org for urgent matters.</p>
          <span className="text-xs text-blue-400 font-bold flex items-center gap-1">support@vitorra.org <ExternalLink className="w-3 h-3" /></span>
        </a>
      </div>

      {/* FAQ */}
      <div className="bg-vitorra-card border border-vitorra-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-vitorra-border/50">
          <h3 className="text-sm font-bold text-vitorra-text uppercase tracking-wider">Frequently Asked Questions</h3>
        </div>
        <div className="divide-y divide-vitorra-border/50">
          {faqs.map((faq, idx) => (
            <div key={idx}>
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex items-center justify-between px-6 py-4 text-left group">
                <span className="text-sm text-vitorra-text font-medium pr-4 group-hover:text-vitorra-gold transition-colors">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-vitorra-muted shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-6 pb-4 text-sm text-vitorra-muted leading-relaxed">{faq.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   HELPER: AVATAR UPLOAD
   ═══════════════════════════════════════════════════════════════════ */
function AvatarUpload({ profile, initials, updateUserProfile }: {
  profile: UserProfile; initials: string;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }

    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${profile.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateUserProfile({ photoURL: url });
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Upload failed. Please try again.');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleRemove = async () => {
    if (!confirm('Remove your profile photo?')) return;
    setUploading(true);
    await updateUserProfile({ photoURL: '' });
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-6">
      {/* Avatar with upload overlay */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-vitorra-gold/80 to-amber-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-vitorra-gold/20 overflow-hidden">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>

      {/* Info + actions */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-vitorra-text">Profile Photo</p>
        <p className="text-xs text-vitorra-muted">JPG, PNG or GIF. Max 5MB.</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 text-xs font-bold text-vitorra-gold border border-vitorra-gold/20 rounded-xl hover:bg-vitorra-gold/10 transition-all disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : profile.photoURL ? 'Change Photo' : 'Upload Photo'}
          </button>
          {profile.photoURL && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="px-4 py-2 text-xs font-bold text-red-400/70 border border-red-400/20 rounded-xl hover:bg-red-400/10 hover:text-red-400 transition-all disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   HELPER: SIDEBAR CONTENT (shared between desktop & mobile)
   ═══════════════════════════════════════════════════════════════════ */
function SidebarContent({ profile, initials, navItems, page, handleNav, logout, navigate }: {
  profile: UserProfile; initials: string;
  navItems: { id: string; label: string; icon: React.ReactNode; badge?: number }[];
  page: string; handleNav: (id: any) => void;
  logout: () => Promise<void>; navigate: (path: string) => void;
}) {
  return (
    <>
      {/* Profile block */}
      <div className="p-6 border-b border-vitorra-border/50">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-vitorra-gold/80 to-amber-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-vitorra-gold/20 shrink-0 overflow-hidden">
            {profile.photoURL ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-vitorra-text truncate">{profile.displayName || 'User'}</p>
            <p className="text-xs text-vitorra-muted truncate">{profile.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${profile.accountType === 'business' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-vitorra-gold/10 text-vitorra-gold border-vitorra-gold/20'}`}>
                {profile.accountType === 'business' ? 'B2B' : 'Individual'}
              </span>
              {profile.emailVerified && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left group ${
              page === item.id
                ? 'bg-vitorra-gold/10 text-vitorra-gold border-l-[3px] border-l-vitorra-gold pl-[13px]'
                : 'text-vitorra-muted hover:text-vitorra-text hover:bg-vitorra-bg/50'
            }`}
          >
            <span className={page === item.id ? 'text-vitorra-gold' : 'text-vitorra-muted group-hover:text-vitorra-text'}>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className={`text-[10px] min-w-[20px] h-5 px-1.5 rounded-full font-bold flex items-center justify-center ${page === item.id ? 'bg-vitorra-gold/20 text-vitorra-gold' : 'bg-vitorra-bg text-vitorra-muted'}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-vitorra-border/50 space-y-2">
        <div className="px-4 py-2">
          <p className="text-[10px] text-vitorra-muted/50 uppercase tracking-widest font-bold">
            Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
          </p>
        </div>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-all text-left"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   HELPER: PASSWORD RESET BUTTON
   ═══════════════════════════════════════════════════════════════════ */
function PasswordResetButton({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const handleReset = async () => {
    if (!fbAuth || !email) return;
    setState('sending');
    try {
      await sendPasswordResetEmail(fbAuth, email);
      setState('sent');
      setTimeout(() => setState('idle'), 5000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };
  return (
    <button onClick={handleReset} disabled={state === 'sending' || state === 'sent'}
      className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
        state === 'sent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
        state === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
        'text-vitorra-gold hover:bg-vitorra-gold/10 border border-vitorra-gold/20'
      }`}>
      {state === 'sending' ? <><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Sending...</> :
       state === 'sent' ? <><Check className="w-3 h-3 inline mr-1" /> Reset Email Sent!</> :
       state === 'error' ? 'Failed — Try Again' :
       <><KeyRound className="w-3 h-3 inline mr-1" /> Send Reset Email</>}
    </button>
  );
}

/* ── Shipment Tracking Card (customer portal) ────────────────────── */
function PortalShipmentCard({ carrier, trackingNumber, status, estimatedDelivery }: {
  carrier: string; trackingNumber: string; status: string; estimatedDelivery?: string;
}) {
  const carrierInfo = getCarrier(carrier);
  const trackUrl = getTrackingUrl(carrier, trackingNumber);
  const carrierName = carrierInfo?.name || carrier;
  const carrierColor = carrierInfo?.color || '#b49b32';
  return (
    <div className="p-5 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-4 h-4 text-emerald-400" />
        <h5 className="text-[11px] text-emerald-400 uppercase font-bold tracking-widest">Shipment Tracking</h5>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: carrierColor }} />
          <div>
            <p className="text-sm font-bold text-vitorra-text">{carrierName}</p>
            <p className="text-xs font-mono text-vitorra-muted tracking-wider">{trackingNumber}</p>
          </div>
        </div>
        <div className="text-right">
          {estimatedDelivery && (
            <p className="text-xs text-vitorra-muted">
              Est. delivery: <span className="text-vitorra-text font-bold">{new Date(estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </p>
          )}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest ${status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
            {status === 'delivered' ? 'Delivered' : 'In Transit'}
          </span>
        </div>
      </div>
      {trackUrl ? (
        <a
          href={trackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-emerald-500 text-white font-bold rounded-xl text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          <ExternalLink className="w-4 h-4" />
          Track My Package on {carrierName}
        </a>
      ) : (
        <p className="text-xs text-vitorra-muted text-center">Contact us for tracking updates on this shipment.</p>
      )}
    </div>
  );
}

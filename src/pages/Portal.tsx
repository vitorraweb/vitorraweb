import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth, Address, UserProfile } from '../context/AuthContext';
import { useCMS, Order, Product } from '../context/CMSContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Package, User, FileText, LogOut, Settings,
  ShoppingBag, Clock, Truck, CheckCircle2, XCircle, ChevronRight,
  MapPin, Plus, Minus, Edit3, Trash2, Eye, EyeOff, Lock, Mail, Phone,
  Building2, Globe, Bell, Shield, ArrowRight, X, Check, Loader2, AlertCircle,
} from 'lucide-react';

type Tab = 'dashboard' | 'orders' | 'profile' | 'documents';

export default function Portal() {
  const { firebaseUser, profile, loading: authLoading, logout, updateUserProfile, addAddress, updateAddress, removeAddress } = useAuth();
  const { state } = useCMS();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'dashboard';
  const [tab, setTab] = useState<Tab>(initialTab);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !firebaseUser) navigate('/auth', { replace: true });
  }, [authLoading, firebaseUser, navigate]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-vitorra-bg pt-40 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-vitorra-gold animate-spin" />
      </div>
    );
  }

  const userOrders = state.orders.filter(o => o.customerEmail === profile.email || o.customerId === profile.uid)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <Package className="w-4 h-4" /> },
    { id: 'profile', label: 'Account', icon: <User className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-vitorra-bg pt-40 pb-20 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase block mb-2">Customer Portal</span>
            <h2 className="text-3xl md:text-4xl font-medium text-vitorra-text tracking-tight">
              <span className="text-5xl md:text-6xl font-serif italic text-vitorra-gold mr-[1px]">W</span>elcome, <span className="text-vitorra-gold font-bold">{profile.displayName?.split(' ')[0]}</span>
            </h2>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 px-5 py-2.5 text-vitorra-muted hover:text-red-400 hover:bg-red-400/10 rounded-xl border border-vitorra-border transition-all text-sm font-medium">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tab === t.id ? 'bg-vitorra-gold text-vitorra-gold-text shadow-lg shadow-vitorra-gold/20' : 'bg-vitorra-card border border-vitorra-border text-vitorra-muted hover:text-vitorra-text hover:border-vitorra-gold/20'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {tab === 'dashboard' && <DashboardTab profile={profile} orders={userOrders} formatPrice={formatPrice} setTab={setTab} />}
            {tab === 'orders' && <OrdersTab orders={userOrders} formatPrice={formatPrice} />}
            {tab === 'profile' && <ProfileTab profile={profile} updateUserProfile={updateUserProfile} addAddress={addAddress} updateAddress={updateAddress} removeAddress={removeAddress} />}
            {tab === 'documents' && <DocumentsTab orders={userOrders} formatPrice={formatPrice} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════ DASHBOARD TAB ═══════════════════════════ */
function DashboardTab({ profile, orders, formatPrice, setTab }: { profile: UserProfile; orders: Order[]; formatPrice: (n: number) => string; setTab: (t: Tab) => void }) {
  const pending = orders.filter(o => ['pending', 'awaiting_invoice', 'awaiting_payment'].includes(o.status)).length;
  const processing = orders.filter(o => ['processing', 'shipped'].includes(o.status)).length;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={orders.length.toString()} icon={<Package className="w-5 h-5" />} color="text-vitorra-gold" />
        <StatCard label="Pending" value={pending.toString()} icon={<Clock className="w-5 h-5" />} color="text-amber-400" />
        <StatCard label="In Transit" value={processing.toString()} icon={<Truck className="w-5 h-5" />} color="text-blue-400" />
        <StatCard label="Total Spent" value={formatPrice(totalSpent)} icon={<ShoppingBag className="w-5 h-5" />} color="text-emerald-400" />
      </div>

      {/* Recent Orders */}
      <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-vitorra-text">Recent Orders</h3>
          <button onClick={() => setTab('orders')} className="text-xs text-vitorra-gold font-bold uppercase tracking-widest hover:underline">View All</button>
        </div>
        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.slice(0, 5).map(o => (
              <OrderRow key={o.id} order={o} formatPrice={formatPrice} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <ShoppingBag className="w-10 h-10 text-vitorra-muted/20 mx-auto mb-4" />
            <p className="text-vitorra-muted text-sm mb-4">No orders yet</p>
            <Link to="/shop" className="text-sm text-vitorra-gold font-bold hover:underline">Browse Products</Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/shop" className="flex items-center gap-4 p-5 bg-vitorra-card border border-vitorra-border rounded-2xl hover:border-vitorra-gold/20 transition-all group text-left w-full">
          <ShoppingBag className="w-5 h-5 text-vitorra-gold" />
          <div className="flex-1"><p className="text-sm font-bold text-vitorra-text">Browse Products</p><p className="text-xs text-vitorra-muted">Explore our catalog</p></div>
          <ArrowRight className="w-4 h-4 text-vitorra-muted/30 group-hover:text-vitorra-gold transition-colors" />
        </Link>
        <button onClick={() => setTab('profile')} className="flex items-center gap-4 p-5 bg-vitorra-card border border-vitorra-border rounded-2xl hover:border-vitorra-gold/20 transition-all group text-left">
          <Settings className="w-5 h-5 text-blue-400" />
          <div className="flex-1"><p className="text-sm font-bold text-vitorra-text">Account Settings</p><p className="text-xs text-vitorra-muted">Manage your profile</p></div>
          <ArrowRight className="w-4 h-4 text-vitorra-muted/30 group-hover:text-vitorra-gold transition-colors" />
        </button>
        <Link to="/contact" className="flex items-center gap-4 p-5 bg-vitorra-card border border-vitorra-border rounded-2xl hover:border-vitorra-gold/20 transition-all group">
          <Mail className="w-5 h-5 text-purple-400" />
          <div className="flex-1"><p className="text-sm font-bold text-vitorra-text">Contact Support</p><p className="text-xs text-vitorra-muted">Get help with orders</p></div>
          <ArrowRight className="w-4 h-4 text-vitorra-muted/30 group-hover:text-vitorra-gold transition-colors" />
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════ ORDERS TAB ═══════════════════════════ */
function OrdersTab({ orders, formatPrice }: { orders: Order[]; formatPrice: (n: number) => string }) {
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const statuses = ['all', 'pending', 'awaiting_invoice', 'awaiting_payment', 'processing', 'shipped', 'delivered', 'cancelled'];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const statusLabel: Record<string, string> = {
    pending: 'Pending', awaiting_invoice: 'Awaiting Invoice', awaiting_payment: 'Awaiting Payment',
    processing: 'Processing', shipped: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled',
  };
  const statusColor: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    awaiting_invoice: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    awaiting_payment: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    processing: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    shipped: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    delivered: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filter === s ? 'bg-vitorra-gold text-vitorra-gold-text' : 'bg-vitorra-card border border-vitorra-border text-vitorra-muted hover:text-vitorra-text'}`}>
            {s === 'all' ? 'All Orders' : statusLabel[s] || s}
          </button>
        ))}
      </div>

      {/* Order list */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(o => (
            <div key={o.id} className="bg-vitorra-card border border-vitorra-border rounded-2xl overflow-hidden hover:border-vitorra-gold/20 transition-all">
              <button onClick={() => setExpandedId(expandedId === o.id ? null : o.id)} className="w-full p-6 flex items-center justify-between text-left">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-vitorra-bg/50 rounded-xl border border-vitorra-border flex items-center justify-center text-vitorra-gold">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-bold text-vitorra-text font-mono">{o.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusColor[o.status] || statusColor.pending}`}>{statusLabel[o.status] || o.status}</span>
                    </div>
                    <p className="text-xs text-vitorra-muted">{new Date(o.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • {o.items.length} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-vitorra-text">{formatPrice(o.total)}</span>
                  <ChevronRight className={`w-5 h-5 text-vitorra-muted transition-transform ${expandedId === o.id ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {expandedId === o.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-6 pb-6 border-t border-vitorra-border pt-6 space-y-6">
                      {/* Status timeline */}
                      <div>
                        <h5 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-4">Order Timeline</h5>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                          {['pending', 'awaiting_payment', 'processing', 'shipped', 'delivered'].map((s, i, arr) => {
                            const statusOrder = ['pending', 'awaiting_invoice', 'awaiting_payment', 'processing', 'shipped', 'delivered'];
                            const currentIdx = statusOrder.indexOf(o.status);
                            const stepIdx = statusOrder.indexOf(s);
                            const isComplete = stepIdx <= currentIdx;
                            const isCurrent = s === o.status;
                            return (
                              <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${isComplete ? 'bg-vitorra-gold border-vitorra-gold text-vitorra-gold-text' : 'border-vitorra-border text-vitorra-muted'}`}>
                                  {isComplete ? <Check className="w-3 h-3" /> : i + 1}
                                </div>
                                {i < arr.length - 1 && <div className={`w-8 h-0.5 ${isComplete ? 'bg-vitorra-gold' : 'bg-vitorra-border'}`} />}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <h5 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-3">Items</h5>
                        {o.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-vitorra-border/50 last:border-0">
                            <span className="text-sm text-vitorra-text">{item.quantity}× {item.name}</span>
                            <span className="text-sm font-bold text-vitorra-text">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Shipping & Tracking */}
                      {(o.shippingAddress || o.trackingNumber) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {o.shippingAddress && (
                            <div className="p-4 bg-vitorra-bg/50 rounded-xl">
                              <h5 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> Shipping</h5>
                              <p className="text-sm text-vitorra-text">{o.shippingAddress}</p>
                            </div>
                          )}
                          {o.trackingNumber && (
                            <div className="p-4 bg-vitorra-bg/50 rounded-xl">
                              <h5 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-2 flex items-center gap-1"><Truck className="w-3 h-3" /> Tracking</h5>
                              <p className="text-sm text-vitorra-gold font-mono font-bold">{o.trackingNumber}</p>
                              {o.carrier && <p className="text-xs text-vitorra-muted mt-1">{o.carrier}</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-vitorra-card border border-vitorra-border rounded-2xl">
          <Package className="w-10 h-10 text-vitorra-muted/20 mx-auto mb-4" />
          <p className="text-vitorra-muted mb-4">No orders found</p>
          <Link to="/shop" className="text-sm text-vitorra-gold font-bold hover:underline">Browse Products</Link>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════ PROFILE TAB ═══════════════════════════ */
function ProfileTab({ profile, updateUserProfile, addAddress, updateAddress, removeAddress }: {
  profile: UserProfile;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  addAddress: (addr: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, data: Partial<Address>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
}) {
  const [section, setSection] = useState<'personal' | 'company' | 'addresses' | 'security' | 'preferences'>('personal');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Personal info
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [phone, setPhone] = useState(profile.phone || '');

  // Company info
  const [companyName, setCompanyName] = useState(profile.company?.name || '');
  const [companyReg, setCompanyReg] = useState(profile.company?.registrationNo || '');
  const [companyTax, setCompanyTax] = useState(profile.company?.taxId || '');
  const [companyWeb, setCompanyWeb] = useState(profile.company?.website || '');

  // Preferences
  const [orderNotif, setOrderNotif] = useState(profile.preferences?.emailNotifications?.orderUpdates ?? true);
  const [promoNotif, setPromoNotif] = useState(profile.preferences?.emailNotifications?.promotions ?? false);
  const [newsNotif, setNewsNotif] = useState(profile.preferences?.emailNotifications?.newsletter ?? false);
  const [currency, setCurrency] = useState(profile.preferences?.currency || 'UGX');

  // Address form
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editAddrId, setEditAddrId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({ label: 'Home', fullName: profile.displayName, street: '', city: '', state: '', postalCode: '', country: 'Uganda', phone: phone, type: 'both' as 'both' | 'billing' | 'shipping', isDefault: false });

  const savePersonal = async () => {
    setSaving(true);
    await updateUserProfile({ displayName, phone });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const saveCompany = async () => {
    setSaving(true);
    await updateUserProfile({
      company: { name: companyName, registrationNo: companyReg, taxId: companyTax, website: companyWeb },
      accountType: companyName ? 'business' : 'individual',
      role: companyName ? 'b2b' : 'b2c',
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const savePreferences = async () => {
    setSaving(true);
    await updateUserProfile({
      preferences: {
        ...profile.preferences,
        currency,
        emailNotifications: { orderUpdates: orderNotif, promotions: promoNotif, newsletter: newsNotif },
      },
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleAddressSubmit = async () => {
    setSaving(true);
    if (editAddrId) {
      await updateAddress(editAddrId, addrForm);
    } else {
      await addAddress(addrForm);
    }
    setShowAddrForm(false); setEditAddrId(null);
    setAddrForm({ label: 'Home', fullName: profile.displayName, street: '', city: '', state: '', postalCode: '', country: 'Uganda', phone: phone, type: 'both', isDefault: false });
    setSaving(false);
  };

  const startEditAddr = (addr: Address) => {
    setAddrForm({ label: addr.label, fullName: addr.fullName, street: addr.street, city: addr.city, state: addr.state, postalCode: addr.postalCode, country: addr.country, phone: addr.phone, type: addr.type, isDefault: addr.isDefault });
    setEditAddrId(addr.id);
    setShowAddrForm(true);
  };

  const inputClass = "w-full bg-vitorra-bg/50 border border-vitorra-border rounded-xl px-4 py-3 text-vitorra-text placeholder-vitorra-muted/40 outline-none focus:border-vitorra-gold/50 transition-all text-sm";
  const labelClass = "block text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-2";

  const sections = [
    { id: 'personal' as const, label: 'Personal Info', icon: <User className="w-4 h-4" /> },
    { id: 'company' as const, label: 'Company', icon: <Building2 className="w-4 h-4" /> },
    { id: 'addresses' as const, label: 'Addresses', icon: <MapPin className="w-4 h-4" /> },
    { id: 'security' as const, label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'preferences' as const, label: 'Preferences', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Sidebar */}
      <div className="space-y-2">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${section === s.id ? 'bg-vitorra-gold/10 text-vitorra-gold border border-vitorra-gold/20' : 'text-vitorra-muted hover:text-vitorra-text hover:bg-vitorra-bg/50'}`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="md:col-span-3">
        <AnimatePresence mode="wait">
          <motion.div key={section} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Personal Info */}
            {section === 'personal' && (
              <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-8 space-y-6">
                <h3 className="text-lg font-bold text-vitorra-text">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>Full Name</label><input value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>Email Address</label><input value={profile.email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} /><p className="text-[9px] text-vitorra-muted mt-1">Email is linked to your auth account</p></div>
                  <div><label className={labelClass}>Phone Number</label><input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+256 700 000 000" /></div>
                  <div><label className={labelClass}>Account Type</label><input value={profile.accountType === 'business' ? 'Business (B2B)' : 'Individual (B2C)'} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} /></div>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <button onClick={savePersonal} disabled={saving} className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all text-sm disabled:opacity-50 flex items-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Company */}
            {section === 'company' && (
              <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-8 space-y-6">
                <h3 className="text-lg font-bold text-vitorra-text">Company Details</h3>
                <p className="text-sm text-vitorra-muted">Add company information to enable B2B pricing and wholesale features.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>Company Name</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} placeholder="Acme Corporation" /></div>
                  <div><label className={labelClass}>Registration Number</label><input value={companyReg} onChange={e => setCompanyReg(e.target.value)} className={inputClass} placeholder="REG-XXXX" /></div>
                  <div><label className={labelClass}>Tax ID / TIN</label><input value={companyTax} onChange={e => setCompanyTax(e.target.value)} className={inputClass} placeholder="TIN-XXXX" /></div>
                  <div><label className={labelClass}>Website</label><input value={companyWeb} onChange={e => setCompanyWeb(e.target.value)} className={inputClass} placeholder="https://company.com" /></div>
                </div>
                <button onClick={saveCompany} disabled={saving} className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all text-sm disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Company Info'}
                </button>
              </div>
            )}

            {/* Addresses */}
            {section === 'addresses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-vitorra-text">Saved Addresses</h3>
                  <button onClick={() => { setEditAddrId(null); setAddrForm({ label: 'Home', fullName: profile.displayName, street: '', city: '', state: '', postalCode: '', country: 'Uganda', phone: phone, type: 'both', isDefault: false }); setShowAddrForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl text-sm">
                    <Plus className="w-4 h-4" /> Add Address
                  </button>
                </div>

                {/* Address Form Modal */}
                {showAddrForm && (
                  <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-8 space-y-5 mb-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-vitorra-text">{editAddrId ? 'Edit Address' : 'New Address'}</h4>
                      <button onClick={() => setShowAddrForm(false)} className="text-vitorra-muted hover:text-vitorra-text"><X className="w-5 h-5" /></button>
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
                    <div><label className={labelClass}>Street</label><input value={addrForm.street} onChange={e => setAddrForm({...addrForm, street: e.target.value})} className={inputClass} /></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><label className={labelClass}>City</label><input value={addrForm.city} onChange={e => setAddrForm({...addrForm, city: e.target.value})} className={inputClass} /></div>
                      <div><label className={labelClass}>State</label><input value={addrForm.state} onChange={e => setAddrForm({...addrForm, state: e.target.value})} className={inputClass} /></div>
                      <div><label className={labelClass}>Postal</label><input value={addrForm.postalCode} onChange={e => setAddrForm({...addrForm, postalCode: e.target.value})} className={inputClass} /></div>
                      <div><label className={labelClass}>Country</label><input value={addrForm.country} onChange={e => setAddrForm({...addrForm, country: e.target.value})} className={inputClass} /></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-vitorra-muted cursor-pointer">
                        <input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm({...addrForm, isDefault: e.target.checked})} className="accent-vitorra-gold" /> Set as default
                      </label>
                      <select value={addrForm.type} onChange={e => setAddrForm({...addrForm, type: e.target.value as any})} className={`${inputClass} w-auto`}>
                        <option value="both">Billing & Shipping</option><option value="billing">Billing Only</option><option value="shipping">Shipping Only</option>
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleAddressSubmit} disabled={saving} className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl text-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editAddrId ? 'Update' : 'Save Address'}
                      </button>
                      <button onClick={() => setShowAddrForm(false)} className="px-6 py-3 text-vitorra-muted text-sm">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Address List */}
                {profile.addresses && profile.addresses.length > 0 ? profile.addresses.map(addr => (
                  <div key={addr.id} className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 flex items-start justify-between hover:border-vitorra-gold/20 transition-all">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-vitorra-gold" />
                        <span className="font-bold text-vitorra-text text-sm">{addr.label}</span>
                        {addr.isDefault && <span className="text-[9px] px-2 py-0.5 bg-vitorra-gold/10 text-vitorra-gold border border-vitorra-gold/20 rounded-full font-bold uppercase">Default</span>}
                        <span className="text-[9px] px-2 py-0.5 bg-vitorra-bg/50 text-vitorra-muted border border-vitorra-border rounded-full font-bold uppercase">{addr.type}</span>
                      </div>
                      <p className="text-sm text-vitorra-muted ml-6">{addr.fullName}</p>
                      <p className="text-sm text-vitorra-muted ml-6">{addr.street}, {addr.city} {addr.postalCode}</p>
                      <p className="text-sm text-vitorra-muted ml-6">{addr.country} • {addr.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditAddr(addr)} className="p-2 text-vitorra-muted hover:text-vitorra-gold hover:bg-vitorra-gold/10 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Remove this address?')) removeAddress(addr.id); }} className="p-2 text-vitorra-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center bg-vitorra-card border border-vitorra-border rounded-2xl">
                    <MapPin className="w-8 h-8 text-vitorra-muted/20 mx-auto mb-3" />
                    <p className="text-vitorra-muted text-sm">No saved addresses</p>
                  </div>
                )}
              </div>
            )}

            {/* Security */}
            {section === 'security' && (
              <div className="space-y-6">
                <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-8 space-y-6">
                  <h3 className="text-lg font-bold text-vitorra-text">Security Settings</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-vitorra-bg/50 rounded-xl border border-vitorra-border">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-vitorra-gold" />
                        <div>
                          <p className="text-sm font-bold text-vitorra-text">Email Verification</p>
                          <p className="text-xs text-vitorra-muted">{profile.email}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${profile.emailVerified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {profile.emailVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-vitorra-bg/50 rounded-xl border border-vitorra-border">
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-vitorra-gold" />
                        <div>
                          <p className="text-sm font-bold text-vitorra-text">Password</p>
                          <p className="text-xs text-vitorra-muted">Last changed: Unknown</p>
                        </div>
                      </div>
                      <Link to="/auth" className="text-xs text-vitorra-gold font-bold hover:underline">Change Password</Link>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-vitorra-bg/50 rounded-xl border border-vitorra-border">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-vitorra-gold" />
                        <div>
                          <p className="text-sm font-bold text-vitorra-text">Connected Accounts</p>
                          <p className="text-xs text-vitorra-muted">{profile.providers?.join(', ') || 'Email/Password'}</p>
                        </div>
                      </div>
                      {profile.providers?.includes('google.com') ? (
                        <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">Google Linked</span>
                      ) : (
                        <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase bg-vitorra-bg/50 text-vitorra-muted border border-vitorra-border">Email Only</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-8 space-y-4">
                  <h3 className="text-lg font-bold text-vitorra-text">Account Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-vitorra-bg/50 rounded-xl">
                      <p className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-1">Account Created</p>
                      <p className="text-vitorra-text font-medium">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-vitorra-bg/50 rounded-xl">
                      <p className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-1">Last Login</p>
                      <p className="text-vitorra-text font-medium">{profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences */}
            {section === 'preferences' && (
              <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-8 space-y-6">
                <h3 className="text-lg font-bold text-vitorra-text">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Order Updates', desc: 'Get notified about order status changes', value: orderNotif, set: setOrderNotif },
                    { label: 'Promotions', desc: 'Receive promotional offers and discounts', value: promoNotif, set: setPromoNotif },
                    { label: 'Newsletter', desc: 'Monthly newsletter with industry news', value: newsNotif, set: setNewsNotif },
                  ].map(pref => (
                    <div key={pref.label} className="flex items-center justify-between p-4 bg-vitorra-bg/50 rounded-xl border border-vitorra-border">
                      <div>
                        <p className="text-sm font-bold text-vitorra-text">{pref.label}</p>
                        <p className="text-xs text-vitorra-muted">{pref.desc}</p>
                      </div>
                      <button onClick={() => pref.set(!pref.value)} className={`w-12 h-7 rounded-full transition-all ${pref.value ? 'bg-vitorra-gold' : 'bg-vitorra-border'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${pref.value ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-2">Preferred Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className={`${inputClass} max-w-xs`}>
                    <option value="UGX">UGX - Ugandan Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <button onClick={savePreferences} disabled={saving} className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all text-sm disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Preferences'}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════ DOCUMENTS TAB ═══════════════════════════ */
function DocumentsTab({ orders, formatPrice }: { orders: Order[]; formatPrice: (n: number) => string }) {
  const docs = orders.flatMap(o => {
    const items: { type: string; orderId: string; date: string; total: number; url?: string }[] = [];
    items.push({ type: 'Order Confirmation', orderId: o.id, date: o.date, total: o.total });
    if (o.proformaUrl) items.push({ type: 'Proforma Invoice', orderId: o.id, date: o.date, total: o.total, url: o.proformaUrl });
    if ((o as any).invoiceUrl) items.push({ type: 'Invoice', orderId: o.id, date: o.date, total: o.total, url: (o as any).invoiceUrl });
    return items;
  });

  return (
    <div>
      <h3 className="text-lg font-bold text-vitorra-text mb-6">Documents & Invoices</h3>
      {docs.length > 0 ? (
        <div className="bg-vitorra-card border border-vitorra-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-vitorra-muted uppercase tracking-widest border-b border-vitorra-border">
                <th className="p-4 text-left font-bold">Document</th>
                <th className="p-4 text-left font-bold">Order</th>
                <th className="p-4 text-left font-bold">Date</th>
                <th className="p-4 text-right font-bold">Amount</th>
                <th className="p-4 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={i} className="border-b border-vitorra-border/50 last:border-0 hover:bg-vitorra-bg/30 transition-colors">
                  <td className="p-4 text-sm text-vitorra-text font-medium flex items-center gap-2"><FileText className="w-4 h-4 text-vitorra-gold" /> {d.type}</td>
                  <td className="p-4 text-sm text-vitorra-muted font-mono">{d.orderId}</td>
                  <td className="p-4 text-sm text-vitorra-muted">{new Date(d.date).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-vitorra-text font-bold text-right">{formatPrice(d.total)}</td>
                  <td className="p-4 text-right">
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-vitorra-gold font-bold hover:underline">Download</a>
                    ) : (
                      <span className="text-xs text-vitorra-muted/40">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-16 text-center bg-vitorra-card border border-vitorra-border rounded-2xl">
          <FileText className="w-10 h-10 text-vitorra-muted/20 mx-auto mb-4" />
          <p className="text-vitorra-muted">No documents available yet</p>
          <p className="text-xs text-vitorra-muted/60 mt-1">Documents will appear here as your orders are processed</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════ HELPERS ═══════════════════════════ */
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-5 hover:border-vitorra-gold/20 transition-all shadow-sm">
      <div className={`p-2 rounded-lg bg-vitorra-bg/50 border border-vitorra-border ${color} w-fit mb-3`}>{icon}</div>
      <p className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-1">{label}</p>
      <p className="text-lg font-bold text-vitorra-text truncate">{value}</p>
    </div>
  );
}

function OrderRow({ order, formatPrice }: { order: Order; formatPrice: (n: number) => string }) {
  const statusColor: Record<string, string> = {
    pending: 'text-amber-400', processing: 'text-indigo-400', shipped: 'text-cyan-400', delivered: 'text-emerald-400', cancelled: 'text-red-400',
    awaiting_invoice: 'text-blue-400', awaiting_payment: 'text-purple-400',
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-vitorra-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <Package className={`w-4 h-4 ${statusColor[order.status] || 'text-vitorra-muted'}`} />
        <div>
          <p className="text-sm font-bold text-vitorra-text font-mono">{order.id}</p>
          <p className="text-xs text-vitorra-muted">{new Date(order.date).toLocaleDateString()} • {order.items.length} items</p>
        </div>
      </div>
      <span className="font-bold text-vitorra-text text-sm">{formatPrice(order.total)}</span>
    </div>
  );
}

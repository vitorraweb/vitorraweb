import { useState } from 'react';
import { useCMS, Customer, Order } from '../../../context/CMSContext';
import { useAuth } from '../../../context/AuthContext';
import { Search, Plus, X, UserCheck, UserX, Edit3, Trash2, ChevronDown, ChevronRight, Check, Package, DollarSign, Truck, Eye, FileText, Phone, Mail, MapPin, Building2, TrendingUp, History, ShieldCheck } from 'lucide-react';

export default function CustomersManager() {
  const { user } = useAuth();
  const { state, addCustomer, updateCustomer, removeCustomer } = useCMS();
  const isViewer = user?.role === 'Viewer';
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'b2b' | 'b2c'>('all');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  const emptyForm: Partial<Customer> = { name: '', email: '', phone: '', role: 'b2c', companyName: '', status: 'active', totalOrders: 0, totalSpent: 0, address: '', notes: '' };
  const [formData, setFormData] = useState<Partial<Customer>>(emptyForm);

  const formatPrice = (n: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

  const filtered = state.customers.filter(c => {
    const s = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || (c.companyName || '').toLowerCase().includes(s);
    const matchRole = filterRole === 'all' || c.role === filterRole;
    return matchSearch && matchRole;
  });

  const totalRevenue = state.customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
  const activeCustomers = state.customers.filter(c => c.status === 'active').length;

  const startEdit = (c: Customer) => { setFormData({ ...c }); setEditingId(c.id); setShowForm(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateCustomer(editingId, formData);
      setEditingId(null);
    } else {
      addCustomer({
        ...(formData as Customer),
        id: `CUST-${Date.now().toString().slice(-4)}`,
        joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        orders: []
      });
    }
    setShowForm(false); setFormData(emptyForm);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-3xl font-serif text-vitorra-text mb-1">Customer CRM</h3>
          <p className="text-vitorra-muted text-sm">Deep insights into customer relationships, lifetime value, and order history.</p>
        </div>
        {!isViewer && (
          <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }}
            className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text rounded-2xl font-bold shadow-lg shadow-vitorra-gold/20 hover:bg-yellow-500 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Key Partner
          </button>
        )}
      </div>

      {/* CRM KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 hover:shadow-xl hover:shadow-emerald-500/5 transition-all shadow-sm">
          <div className="flex items-center gap-2 text-emerald-400 mb-2"><UserCheck className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Active Members</span></div>
          <div className="text-3xl font-serif text-vitorra-text">{activeCustomers}</div>
        </div>
        <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-blue-400 mb-2"><Building2 className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-widest">B2B Partners</span></div>
          <div className="text-3xl font-serif text-vitorra-text">{state.customers.filter(c => c.role === 'b2b').length}</div>
        </div>
        <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-purple-400 mb-2"><TrendingUp className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Total LTV</span></div>
          <div className="text-3xl font-serif text-vitorra-gold">{formatPrice(totalRevenue)}</div>
        </div>
        <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-vitorra-muted mb-2"><Package className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Avg. Orders</span></div>
          <div className="text-3xl font-serif text-vitorra-text">{(totalRevenue / (state.customers.length || 1) / 1000000).toFixed(1)}M</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-vitorra-bg/40 border border-vitorra-border rounded-2xl p-4 backdrop-blur-md">
        <div className="relative flex-1 w-full max-w-md bg-vitorra-bg/10 border border-vitorra-border rounded-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vitorra-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, or company..."
            className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-vitorra-text outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-vitorra-gold">
            <option value="all">All Profiles</option><option value="b2b">Wholesale (B2B)</option><option value="b2c">Retail (B2C)</option>
          </select>
        </div>
      </div>

      {/* Customer Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-vitorra-card border border-vitorra-border rounded-3xl p-8 lg:p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-vitorra-gold/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-2xl font-serif text-vitorra-text">{editingId ? 'Edit Profile' : 'New Customer Profile'}</h4>
              <button onClick={() => setShowForm(false)} className="text-vitorra-muted hover:text-vitorra-text p-2 rounded-lg hover:bg-vitorra-bg/5"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><label className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">Consignee Name</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-vitorra-gold" /></div>
                <div className="space-y-2"><label className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">Email Address</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-vitorra-gold" /></div>
                <div className="space-y-2"><label className="block text-[10px] text-vitorra-muted uppercase font-bold tracking-widest">Role Segment</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full bg-vitorra-bg-alt border border-vitorra-border rounded-xl px-4 py-3.5 text-vitorra-text outline-none focus:border-vitorra-gold">
                    <option value="b2c">Retail (B2C)</option><option value="b2b">Wholesale (B2B)</option>
                  </select></div>
                <div className="space-y-2"><label className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">{formData.role === 'b2b' ? 'Company / Org' : 'Optional Tag'}</label>
                  <input value={formData.companyName || ''} onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-vitorra-gold placeholder:text-gray-700" placeholder="e.g. Acme Corp" /></div>
                
                {formData.role === 'b2b' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-[10px] text-vitorra-gold uppercase font-bold tracking-widest">Tax ID / TIN (Required for B2B)</label>
                    <input value={(formData as any).taxId || ''} onChange={e => setFormData({ ...formData, taxId: e.target.value } as any)}
                      placeholder="e.g. TIN-9988-77"
                      className="w-full bg-vitorra-gold/5 border border-vitorra-gold/20 rounded-xl px-4 py-3.5 text-white outline-none focus:border-vitorra-gold placeholder:text-vitorra-gold/20" />
                  </div>
                )}
              </div>
              <div className="space-y-2"><label className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">Physical Address</label>
                <input value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-vitorra-gold" /></div>
              <div className="flex items-center gap-4 pt-6">
                <button type="submit" className="flex-1 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-2xl hover:bg-yellow-500 transition-all shadow-xl shadow-vitorra-gold/10">
                  {editingId ? 'Update Profile' : 'Register Customer'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 bg-vitorra-bg/5 text-vitorra-text rounded-2xl border border-vitorra-border hover:bg-vitorra-bg/10 transition-all font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer List */}
      <div className="space-y-4">
        {filtered.map(c => (
          <div key={c.id} className="bg-vitorra-card border border-vitorra-border rounded-3xl overflow-hidden transition-all hover:border-vitorra-gold/20 group shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 cursor-pointer" onClick={() => setExpandedCustomer(expandedCustomer === c.id ? null : c.id)}>
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-serif font-bold border-2 ${c.status === 'active' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-red-500/5 text-red-400 border-red-500/20'}`}>
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-bold text-white group-hover:text-vitorra-gold transition-colors">{c.name}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${c.role === 'b2b' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>{c.role}</span>
                    {(c as any).taxId && <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase tracking-tighter bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20"><ShieldCheck className="w-3 h-3" /> VETTED</span>}
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-4 items-center">
                    <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {c.email}</span>
                    <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {c.phone || 'N/A'}</span>
                    <span className="text-gray-700">• {c.joinDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 px-6 border-l border-white/5 h-12">
                <div className="text-right"><div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">LTV</div><div className="text-lg font-serif text-white">{formatPrice(c.totalSpent || 0)}</div></div>
                <div className="text-right shrink-0"><div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">Orders</div><div className="text-lg font-serif text-white">{c.totalOrders}</div></div>
              </div>

              <div className="flex items-center gap-2 shrink-0 border-l border-white/5 pl-6">
                {!isViewer && (
                  <>
                    <button onClick={e => { e.stopPropagation(); startEdit(c) }} className="p-3 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-vitorra-gold hover:bg-vitorra-gold/10 transition-all"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={e => { e.stopPropagation(); if (confirm('Suspend customer?')) updateCustomer(c.id, { status: 'suspended' }) }} className="p-3 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"><UserX className="w-4 h-4" /></button>
                  </>
                )}
                {expandedCustomer === c.id ? <ChevronDown className="w-5 h-5 text-vitorra-gold" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
              </div>
            </div>

            {/* Profile Dropdown */}
            {expandedCustomer === c.id && (
              <div className="border-t border-vitorra-border bg-vitorra-bg/40 p-8 pt-0 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
                  {/* Bio & Details */}
                  <div className="space-y-8">
                    <div>
                      <h5 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-4">Entity Credentials</h5>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                          <MapPin className="w-4 h-4 text-vitorra-gold shrink-0 mt-0.5" />
                          <div className="text-sm text-gray-300 leading-relaxed font-medium">{c.address || 'No physical address specified on this account.'}</div>
                        </div>
                        {c.companyName && (
                          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <Building2 className="w-4 h-4 text-blue-400" />
                            <div className="text-sm text-white font-bold">{c.companyName}</div>
                          </div>
                        )}
                        {(c as any).taxId && (
                          <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                            <FileText className="w-4 h-4 text-emerald-400" />
                            <div className="text-xs text-emerald-400 font-black uppercase tracking-widest">Tax ID: {(c as any).taxId}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-[10px] text-gray-600 uppercase font-bold tracking-widest mb-4 flex justify-between">Relationship Status <span className="text-vitorra-gold cursor-pointer">Edit</span></h5>
                      <p className="text-xs text-gray-500 italic bg-white/5 p-4 rounded-2xl border border-dashed border-white/10">{c.notes || 'No internal relationship annotations.'}</p>
                    </div>
                  </div>

                  {/* Order History */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                      <h5 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest flex items-center gap-2"><History className="w-3 h-3" /> Transaction History</h5>
                      <button className="text-[10px] font-bold text-vitorra-gold uppercase tracking-widest hover:text-vitorra-text transition-all">+ New Transaction</button>
                    </div>
                    {(c.orders || []).length > 0 ? (
                      <div className="space-y-3">
                        {(c.orders || []).map(o => (
                          <div key={o.id} className="flex items-center justify-between p-4 bg-[#2b2b2b] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-gray-500 group-hover:text-vitorra-gold transition-colors"><Package className="w-5 h-5" /></div>
                              <div>
                                <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">{o.id} <span className="text-gray-700 font-sans">•</span> <span className="text-gray-500 font-sans font-bold text-[10px] uppercase">{o.date}</span></div>
                                <div className="text-[11px] text-gray-600 font-bold uppercase tracking-tighter">{o.items.length} units • {o.status}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-vitorra-text font-serif font-bold text-lg">{formatPrice(o.total)}</div>
                              <div className="text-[9px] text-vitorra-gold font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">View Receipt</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 border border-dashed border-vitorra-border rounded-3xl text-center">
                        <History className="w-8 h-8 text-vitorra-muted/20 mx-auto mb-3" />
                        <p className="text-sm text-vitorra-muted/60 italic">No transactions recorded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

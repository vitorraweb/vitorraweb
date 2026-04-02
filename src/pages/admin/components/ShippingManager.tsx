import { useState } from 'react';
import { useCMS, Order } from '../../../context/CMSContext';
import { useAuth } from '../../../context/AuthContext';
import { Search, Truck, MapPin, Calendar, ExternalLink, Globe, ShieldCheck, Clock, CheckCircle2, Package, Filter, MoreVertical, Plus } from 'lucide-react';

export default function ShippingManager() {
  const { user } = useAuth();
  const { state, updateOrder } = useCMS();
  const isViewer = user?.role === 'Viewer';
  const [search, setSearch] = useState('');
  const [filterCarrier, setFilterCarrier] = useState('all');

  const inTransitOrders = state.orders.filter(o => o.status === 'shipped');
  const allShippingOrders = state.orders.filter(o => ['processing', 'shipped', 'delivered'].includes(o.status));

  const filtered = allShippingOrders.filter(o => {
    const s = search.toLowerCase();
    const matchSearch = (o.customerName || '').toLowerCase().includes(s) || (o.trackingNumber || '').toLowerCase().includes(s) || o.id.toLowerCase().includes(s);
    const matchCarrier = filterCarrier === 'all' || o.carrier === filterCarrier;
    return matchSearch && matchCarrier;
  });

  const getStatusProgress = (status: Order['status']) => {
    if (status === 'processing') return 33;
    if (status === 'shipped') return 66;
    if (status === 'delivered') return 100;
    return 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-3xl font-serif text-vitorra-text mb-1">Logistics & Shipping</h3>
          <p className="text-vitorra-muted text-sm">Manage global shipments, track carriers, and ensure on-time delivery.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-vitorra-bg/5 border border-vitorra-border rounded-xl text-xs font-bold text-vitorra-text hover:bg-vitorra-bg/10 transition-all flex items-center gap-2">
            <Globe className="w-4 h-4 text-vitorra-gold" /> Global View
          </button>
          {!isViewer && (
            <button className="px-4 py-2 bg-vitorra-gold text-vitorra-gold-text rounded-xl text-xs font-bold shadow-lg shadow-vitorra-gold/20 hover:bg-yellow-500 transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Shipment
            </button>
          )}
        </div>
      </div>

      {/* Shipping Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Truck className="w-16 h-16 text-vitorra-gold" />
          </div>
          <div className="text-sm text-vitorra-muted uppercase tracking-widest mb-2 font-medium">Active Shipments</div>
          <div className="text-4xl font-serif text-vitorra-text mb-2">{inTransitOrders.length}</div>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> 100% on schedule
          </div>
        </div>

        <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-16 h-16 text-blue-500" />
          </div>
          <div className="text-sm text-vitorra-muted uppercase tracking-widest mb-2 font-medium">Pending Fulfillment</div>
          <div className="text-4xl font-serif text-vitorra-text mb-2">{state.orders.filter(o => o.status === 'processing').length}</div>
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <Clock className="w-3 h-3" /> Avg. 1.2 days processing
          </div>
        </div>

        <div className="bg-[#2b2b2b] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-16 h-16 text-purple-500" />
          </div>
          <div className="text-sm text-vitorra-muted uppercase tracking-widest mb-2 font-medium">Delivered (30d)</div>
          <div className="text-4xl font-serif text-vitorra-text mb-2">{state.orders.filter(o => o.status === 'delivered').length}</div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Package className="w-3 h-3" /> High successful delivery rate
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vitorra-muted" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by Order ID, Tracking, or Customer..."
            className="w-full bg-vitorra-bg/5 border border-vitorra-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-vitorra-text outline-none focus:border-vitorra-gold" 
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            value={filterCarrier} 
            onChange={e => setFilterCarrier(e.target.value)}
            className="bg-vitorra-bg/5 border border-vitorra-border rounded-xl px-4 py-2.5 text-sm text-vitorra-text outline-none focus:border-vitorra-gold flex-1 md:flex-none"
          >
            <option value="all">All Carriers</option>
            {state.settings.logistics.carriers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <button className="p-2.5 bg-vitorra-bg/5 border border-vitorra-border rounded-xl text-vitorra-muted hover:text-vitorra-text transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Shipment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map(o => (
          <div key={o.id} className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 hover:border-vitorra-gold/20 transition-all group relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-vitorra-gold/5 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl border ${o.status === 'shipped' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : o.status === 'delivered' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-vitorra-text font-bold font-mono tracking-tight">{o.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${o.status === 'shipped' ? 'bg-blue-500/10 text-blue-400' : o.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="text-xs text-vitorra-muted mt-1">{o.customerName} • {o.items.length} Package(s)</div>
                </div>
              </div>
              {!isViewer && (
                <button className="p-2 text-vitorra-muted hover:text-vitorra-text rounded-lg hover:bg-vitorra-bg/5"><MoreVertical className="w-5 h-5" /></button>
              )}
            </div>

            <div className="space-y-6 relative z-10">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-vitorra-muted uppercase tracking-widest font-bold">
                  <span>Processing</span>
                  <span>In Transit</span>
                  <span>Delivered</span>
                </div>
                <div className="h-1.5 w-full bg-vitorra-bg/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${o.status === 'delivered' ? 'bg-emerald-500' : o.status === 'shipped' ? 'bg-blue-500' : 'bg-amber-500'}`}
                    style={{ width: `${getStatusProgress(o.status)}%` }}
                  />
                </div>
              </div>

              {/* Logistics Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-vitorra-bg/5 border border-vitorra-border rounded-xl">
                  <div className="flex items-center gap-2 text-[10px] text-vitorra-muted uppercase mb-1"><MapPin className="w-3 h-3" /> Destination</div>
                  <div className="text-xs text-vitorra-text truncate">{o.shippingAddress || 'Address on file'}</div>
                </div>
                <div className="p-3 bg-vitorra-bg/5 border border-vitorra-border rounded-xl">
                  <div className="flex items-center gap-2 text-[10px] text-vitorra-muted uppercase mb-1"><Calendar className="w-3 h-3" /> Est. Delivery</div>
                  <div className="text-xs text-vitorra-text">{o.estimatedDelivery || 'Calculated at dispatch'}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-vitorra-border">
                <div className="flex items-center gap-3">
                  <div className="text-xs text-vitorra-muted">
                    <div className="uppercase text-[9px] tracking-tighter mb-0.5">Tracking Number</div>
                    <div className="font-mono text-vitorra-text text-[11px]">{o.trackingNumber || 'PENDING ASSIGNMENT'}</div>
                  </div>
                  {o.trackingNumber && <button className="p-1.5 bg-vitorra-bg/5 border border-vitorra-border rounded-lg text-vitorra-gold hover:text-vitorra-text transition-colors"><ExternalLink className="w-3 h-3" /></button>}
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-right">
                    <div className="uppercase text-[9px] tracking-tighter mb-0.5 text-vitorra-muted text-right">Carrier</div>
                    <div className="text-xs text-vitorra-text font-bold">{o.carrier || 'TBD'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="lg:col-span-2 py-20 bg-vitorra-bg/5 border border-dashed border-vitorra-border rounded-3xl text-center">
            <Truck className="w-12 h-12 text-vitorra-muted/20 mx-auto mb-4" />
            <h4 className="text-lg text-vitorra-text font-serif mb-2">No active shipments found</h4>
            <p className="text-sm text-vitorra-muted/60 max-w-xs mx-auto">Try adjusting your filters or search terms to find specific orders.</p>
          </div>
        )}
      </div>
    </div>
  );
}

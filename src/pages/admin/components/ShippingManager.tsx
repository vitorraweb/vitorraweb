import { useState, useMemo } from 'react';
import { useCMS, Order } from '../../../context/CMSContext';
import { useAuth } from '../../../context/AuthContext';
import {
  Search, Truck, MapPin, Calendar, ExternalLink, Globe, ShieldCheck, Clock,
  CheckCircle2, Package, Filter, Plus, ChevronDown, ChevronRight, Eye,
  Copy, AlertTriangle, ArrowRight, BarChart3
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  processing: { color: 'var(--warning)', bg: 'var(--warning-muted)', border: 'var(--warning-border)', label: 'Processing' },
  shipped:    { color: 'var(--info)', bg: 'var(--info-muted)', border: 'var(--info-border)', label: 'In Transit' },
  delivered:  { color: 'var(--success)', bg: 'var(--success-muted)', border: 'var(--success-border)', label: 'Delivered' },
};

export default function ShippingManager() {
  const { user } = useAuth();
  const { state, updateOrder } = useCMS();
  const isViewer = user?.role === 'Viewer';
  const [search, setSearch] = useState('');
  const [filterCarrier, setFilterCarrier] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'processing' | 'shipped' | 'delivered'>('all');
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

  const allShippingOrders = useMemo(() =>
    state.orders.filter(o => ['processing', 'shipped', 'delivered'].includes(o.status))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.orders]
  );

  const filtered = allShippingOrders.filter(o => {
    const s = search.toLowerCase();
    const matchSearch = (o.customerName || '').toLowerCase().includes(s) || (o.trackingNumber || '').toLowerCase().includes(s) || o.id.toLowerCase().includes(s);
    const matchCarrier = filterCarrier === 'all' || o.carrier === filterCarrier;
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchCarrier && matchStatus;
  });

  const carriers = ['all', ...new Set(allShippingOrders.map(o => o.carrier).filter(Boolean))];

  // Stats
  const inTransit = allShippingOrders.filter(o => o.status === 'shipped').length;
  const pendingFulfill = allShippingOrders.filter(o => o.status === 'processing').length;
  const delivered = allShippingOrders.filter(o => o.status === 'delivered').length;
  const totalShipValue = allShippingOrders.filter(o => o.status === 'shipped').reduce((s, o) => s + o.total, 0);

  const fmt = (n: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

  const getProgress = (status: string) => {
    if (status === 'processing') return 33;
    if (status === 'shipped') return 66;
    if (status === 'delivered') return 100;
    return 0;
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 36, padding: '0 14px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
    borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-sm)', color: 'var(--text-primary)', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ═══ Header ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Logistics & Shipping
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Track shipments, manage carriers, and ensure on-time delivery across your supply chain.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            padding: '8px 16px', background: 'var(--bg-elevated)',
            border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'var(--transition-fast)',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-dim)'; }}
          ><Globe size={14} style={{ color: 'var(--accent-primary)' }} /> Global View</button>
        </div>
      </div>

      {/* ═══ Metrics ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { value: inTransit, label: 'In Transit', color: 'var(--info)', icon: <Truck size={18} />, sub: '100% on schedule', subColor: 'var(--success)' },
          { value: pendingFulfill, label: 'Pending Fulfillment', color: 'var(--warning)', icon: <Clock size={18} />, sub: 'Avg. 1.2d processing', subColor: 'var(--warning)' },
          { value: delivered, label: 'Delivered (30d)', color: 'var(--success)', icon: <CheckCircle2 size={18} />, sub: 'High success rate', subColor: 'var(--text-tertiary)' },
          { value: fmt(totalShipValue), label: 'In-Transit Value', color: 'var(--accent-primary)', icon: <BarChart3 size={18} />, sub: 'Active shipments', subColor: 'var(--text-tertiary)' },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', position: 'relative', overflow: 'hidden',
            transition: 'var(--transition-fast)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-faint)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ color: m.color, display: 'flex' }}>{m.icon}</div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: typeof m.value === 'string' ? 'var(--text-lg)' : 'var(--text-3xl)', fontWeight: 700, color: m.color, marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: m.subColor, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={10} /> {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Toolbar ═══ */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center',
        background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
      }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Order ID, Tracking, or Customer..."
            style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-dim)' }}>
          {(['all', 'processing', 'shipped', 'delivered'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '4px 12px', borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: filterStatus === s ? 600 : 400,
              border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              background: filterStatus === s ? 'var(--accent-primary)' : 'transparent',
              color: filterStatus === s ? 'white' : 'var(--text-secondary)',
              transition: 'var(--transition-fast)',
            }}>{s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}</button>
          ))}
        </div>
        {carriers.length > 2 && (
          <select value={filterCarrier} onChange={e => setFilterCarrier(e.target.value)} style={{
            ...inputStyle, width: 'auto', padding: '0 12px', fontSize: 'var(--text-xs)',
          }}>
            {carriers.map(c => <option key={c} value={c}>{c === 'all' ? 'All Carriers' : c}</option>)}
          </select>
        )}
      </div>

      {/* ═══ SHIPMENTS TABLE ═══ */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '44px 1fr 140px 140px 120px 100px 80px',
          padding: '10px 20px', borderBottom: '1px solid var(--border-dim)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700,
          color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em',
          background: 'var(--bg-elevated)',
        }}>
          <span />
          <span>Shipment</span>
          <span>Carrier</span>
          <span>Tracking</span>
          <span>Destination</span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Progress</span>
        </div>

        {/* Rows */}
        {filtered.map(o => {
          const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.processing;
          const isExp = expandedShipment === o.id;
          const progress = getProgress(o.status);
          return (
            <div key={o.id} style={{ borderBottom: '1px solid var(--border-faint)' }}>
              <div
                onClick={() => setExpandedShipment(isExp ? null : o.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '44px 1fr 140px 140px 120px 100px 80px',
                  padding: '12px 20px', alignItems: 'center', cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: cfg.color,
                }}><Truck size={16} /></div>

                {/* Shipment info */}
                <div style={{ minWidth: 0, paddingRight: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{o.id}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.customerName || 'Guest'} • {o.items.length} package(s) • {fmt(o.total)}
                  </div>
                </div>

                {/* Carrier */}
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {o.carrier || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>TBD</span>}
                </div>

                {/* Tracking */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: o.trackingNumber ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                    {o.trackingNumber || 'PENDING'}
                  </span>
                  {o.trackingNumber && (
                    <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(o.trackingNumber!); }} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                      padding: 2, display: 'flex',
                    }} title="Copy tracking"><Copy size={11} /></button>
                  )}
                </div>

                {/* Destination */}
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {o.shippingAddress ? o.shippingAddress.split(',')[0] : 'On file'}
                </div>

                {/* Status badge */}
                <div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase',
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                  }}>{cfg.label}</span>
                </div>

                {/* Progress + expand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                  <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--bg-overlay)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${progress}%`, height: '100%', borderRadius: 2,
                      background: cfg.color, transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ color: isExp ? 'var(--accent-primary)' : 'var(--text-tertiary)', display: 'flex' }}>
                    {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>
              </div>

              {/* ── Expanded detail panel ── */}
              {isExp && (
                <div style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-faint)', padding: '20px 24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
                    <InfoCard icon={<MapPin size={14} />} label="Full Destination" value={o.shippingAddress || 'Address on file'} />
                    <InfoCard icon={<Calendar size={14} />} label="Estimated Delivery" value={(o as any).estimatedDelivery || 'Calculated at dispatch'} />
                    <InfoCard icon={<Package size={14} />} label="Order Date" value={new Date(o.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} />
                  </div>

                  {/* Progress stepper */}
                  <div style={{ marginBottom: 20 }}>
                    <DetailLabel>Shipment Progress</DetailLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      {['processing', 'shipped', 'delivered'].map((step, i) => {
                        const scfg = STATUS_CONFIG[step];
                        const currentIdx = ['processing', 'shipped', 'delivered'].indexOf(o.status);
                        const done = i <= currentIdx;
                        const isCurrent = i === currentIdx;
                        return (
                          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : undefined }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: done ? scfg.color : 'transparent',
                              border: done ? 'none' : '2px solid var(--border-default)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: isCurrent ? `0 0 0 4px ${scfg.bg}` : 'none',
                              transition: 'var(--transition-base)', flexShrink: 0,
                            }}>
                              {done && <CheckCircle2 size={14} style={{ color: 'white' }} />}
                            </div>
                            {i < 2 && (
                              <div style={{
                                flex: 1, height: 2, margin: '0 4px',
                                background: done && i < currentIdx ? scfg.color : 'var(--border-dim)',
                                transition: 'var(--transition-base)',
                              }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      {['Processing', 'In Transit', 'Delivered'].map((label, i) => {
                        const currentIdx = ['processing', 'shipped', 'delivered'].indexOf(o.status);
                        return (
                          <span key={label} style={{
                            fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
                            color: i <= currentIdx ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            fontWeight: i === currentIdx ? 700 : 400, textAlign: 'center', flex: 1,
                          }}>{label}</span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Items list */}
                  <DetailLabel>Packages ({o.items.length})</DetailLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    {o.items.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
                        borderRadius: 'var(--radius-md)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-overlay)', border: '1px solid var(--border-dim)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, color: 'var(--text-tertiary)',
                          }}>{item.quantity}×</span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {!isViewer && o.status !== 'delivered' && (
                    <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-faint)' }}>
                      {o.status === 'processing' && (
                        <button onClick={() => updateOrder(o.id, { status: 'shipped' })} style={{
                          padding: '8px 20px', background: 'var(--info)', color: 'white',
                          borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 700,
                          fontSize: 'var(--text-xs)', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}><Truck size={13} /> Mark as Shipped</button>
                      )}
                      {o.status === 'shipped' && (
                        <button onClick={() => updateOrder(o.id, { status: 'delivered' })} style={{
                          padding: '8px 20px', background: 'var(--success)', color: 'white',
                          borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 700,
                          fontSize: 'var(--text-xs)', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}><CheckCircle2 size={13} /> Mark as Delivered</button>
                      )}
                      {o.trackingNumber && (
                        <button onClick={() => window.open(`https://track.aftership.com/${o.trackingNumber}`, '_blank')} style={{
                          padding: '8px 16px', background: 'var(--bg-surface)',
                          border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)',
                          fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 'var(--text-xs)',
                          color: 'var(--text-secondary)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}><ExternalLink size={12} /> Track Shipment</button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
          }}>
            <Truck size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px', opacity: 0.2 }} />
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px' }}>No active shipments found</h4>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: 320, margin: '0 auto' }}>Try adjusting your filters or search terms to find specific orders.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ HELPER COMPONENTS ═══ */
function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
      color: 'var(--text-tertiary)', marginBottom: 8,
    }}>{children}</div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
      borderRadius: 'var(--radius-md)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{ color: 'var(--accent-primary)', display: 'flex' }}>{icon}</div>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}

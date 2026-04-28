import { useMemo } from 'react';
import { useCMS } from '../../../context/CMSContext';
import StatusBadge, { getStatusLabel, mapPaymentStatus } from '../ui/StatusBadge';
import {
  DollarSign, Truck, Users, ShoppingCart, Package, Clock, TrendingUp,
  AlertTriangle, ArrowUpRight, CreditCard, FileText, BarChart3,
  CheckCircle2, XCircle, Box, Layers, ChevronRight,
} from 'lucide-react';

/* ── Styles ─────────────────────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
  borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
};
const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700,
  color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em',
};

const fmt = (n: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);
const relTime = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const hrs = diff / 3600000;
  if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (hrs < 24) return `${Math.floor(hrs)}h ago`;
  if (hrs < 168) return `${Math.floor(hrs / 24)}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function DashboardOverview() {
  const { state } = useCMS();

  /* ══════ DERIVED DATA — 100% from CMS state, zero hardcodes ══════ */
  const orders = useMemo(() =>
    [...state.orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.orders]
  );

  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = activeOrders.reduce((s, o) => s + o.total, 0);
  const paidRevenue = activeOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.paymentAmount || o.total), 0);
  const unpaidRevenue = totalRevenue - paidRevenue;

  // Order status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  // Payment status counts
  const paymentCounts = useMemo(() => {
    const counts = { unpaid: 0, proforma_sent: 0, awaiting_payment: 0, partial: 0, paid: 0 };
    activeOrders.forEach(o => {
      const ps = o.paymentStatus || 'unpaid';
      if (ps in counts) counts[ps as keyof typeof counts]++;
      else counts.unpaid++;
    });
    return counts;
  }, [activeOrders]);

  // Low stock products
  const lowStockItems = useMemo(() => {
    const items: { product: string; variant: string; stock: number }[] = [];
    state.products.forEach(p => {
      (p.variants || []).forEach(v => {
        if (typeof v.stock === 'number' && v.stock < 15) {
          items.push({ product: p.name, variant: v.name, stock: v.stock });
        }
      });
    });
    return items.sort((a, b) => a.stock - b.stock).slice(0, 6);
  }, [state.products]);

  // Recent orders
  const recentOrders = orders.slice(0, 8);

  // KPI data
  const kpis = [
    { label: 'Total Revenue', value: fmt(totalRevenue), icon: <DollarSign size={18} />, color: 'var(--accent-primary)', bg: 'var(--accent-primary-muted)' },
    { label: 'Paid Revenue', value: fmt(paidRevenue), icon: <CheckCircle2 size={18} />, color: 'var(--success)', bg: 'var(--success-muted)' },
    { label: 'Outstanding', value: fmt(unpaidRevenue), icon: <Clock size={18} />, color: 'var(--warning)', bg: 'var(--warning-muted)' },
    { label: 'Active Orders', value: String(activeOrders.length), icon: <ShoppingCart size={18} />, color: 'var(--info)', bg: 'var(--info-muted)' },
    { label: 'In Transit', value: String(statusCounts['shipped'] || 0), icon: <Truck size={18} />, color: 'var(--order-shipped)', bg: 'var(--order-shipped-bg)' },
    { label: 'Customers', value: String(state.customers.length), icon: <Users size={18} />, color: 'var(--order-confirmed)', bg: 'var(--order-confirmed-bg)' },
  ];

  // Order pipeline data
  const pipelineStatuses = [
    { key: 'pending', label: 'Pending', color: 'var(--order-pending)' },
    { key: 'confirmed', label: 'Confirmed', color: 'var(--order-confirmed)' },
    { key: 'processing', label: 'Processing', color: 'var(--order-processing)' },
    { key: 'shipped', label: 'Shipped', color: 'var(--order-shipped)' },
    { key: 'delivered', label: 'Delivered', color: 'var(--order-delivered)' },
    { key: 'cancelled', label: 'Cancelled', color: 'var(--order-cancelled)' },
  ];
  const maxPipelineCount = Math.max(1, ...pipelineStatuses.map(s => statusCounts[s.key] || 0));

  // Payment breakdown data
  const paymentBreakdown = [
    { key: 'paid', label: 'Paid', color: 'var(--success)', count: paymentCounts.paid },
    { key: 'awaiting_payment', label: 'Awaiting Payment', color: 'var(--warning)', count: paymentCounts.awaiting_payment },
    { key: 'proforma_sent', label: 'Proforma Sent', color: 'var(--order-processing)', count: paymentCounts.proforma_sent },
    { key: 'unpaid', label: 'Unpaid', color: 'var(--order-pending)', count: paymentCounts.unpaid },
    { key: 'partial', label: 'Partial', color: 'var(--order-confirmed)', count: paymentCounts.partial },
  ];
  const totalPaymentOrders = paymentBreakdown.reduce((s, p) => s + p.count, 0) || 1;

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock size={14} />, confirmed: <CheckCircle2 size={14} />,
    processing: <Layers size={14} />, shipped: <Truck size={14} />,
    delivered: <Package size={14} />, cancelled: <XCircle size={14} />,
  };

  /* ══════ RENDER ══════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* ═══ Header ═══ */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Dashboard</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
          Real-time operational overview · {orders.length} total orders · {state.products.length} products
        </p>
      </div>

      {/* ═══ KPI Row — 6 cards ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-3)' }}>
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className="ad-fade-in"
            style={{
              ...card, padding: 'var(--space-4)',
              transition: 'var(--transition-base)', cursor: 'default',
              animationDelay: `${i * 50}ms`,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-faint)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-md)',
              background: k.bg, color: k.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--space-3)',
            }}>{k.icon}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>{k.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: k.color, margin: 0, lineHeight: 1.2 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ═══ Row 2: Pipeline + Payment Breakdown ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 'var(--space-5)' }}>

        {/* Order Pipeline */}
        <div style={{ ...card, padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Order Pipeline</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>Distribution by fulfillment status</p>
            </div>
            <span style={{ ...sectionLabel, fontSize: '9px' }}>{orders.length} total</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pipelineStatuses.map(s => {
              const count = statusCounts[s.key] || 0;
              const pct = maxPipelineCount > 0 ? (count / maxPipelineCount) * 100 : 0;
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 90, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: s.color, display: 'flex' }}>{statusIcons[s.key]}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)' }}>{s.label}</span>
                  </div>
                  <div style={{ flex: 1, height: 22, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%', width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                      background: s.color, borderRadius: 'var(--radius-sm)',
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6,
                    }}>
                      {count > 0 && pct > 15 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, color: 'white' }}>{count}</span>
                      )}
                    </div>
                  </div>
                  <span style={{ width: 28, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, color: count > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Breakdown */}
        <div style={{ ...card, padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Payment Status</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>Revenue collection overview</p>
            </div>
            <CreditCard size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>

          {/* Stacked bar */}
          <div style={{ height: 12, borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex', marginBottom: 'var(--space-4)', background: 'var(--bg-elevated)' }}>
            {paymentBreakdown.filter(p => p.count > 0).map(p => (
              <div key={p.key} style={{
                width: `${(p.count / totalPaymentOrders) * 100}%`,
                background: p.color, height: '100%', transition: 'width 0.5s ease',
                minWidth: p.count > 0 ? 4 : 0,
              }} title={`${p.label}: ${p.count}`} />
            ))}
          </div>

          {/* Legend items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paymentBreakdown.map(p => (
              <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{p.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: p.count > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{p.count}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', width: 36, textAlign: 'right' }}>
                    {totalPaymentOrders > 0 ? Math.round((p.count / totalPaymentOrders) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue summary */}
          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-faint)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-3)', background: 'var(--success-muted)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success-border)' }}>
              <p style={{ ...sectionLabel, margin: '0 0 2px', color: 'var(--success)' }}>Collected</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--success)', margin: 0 }}>{fmt(paidRevenue)}</p>
            </div>
            <div style={{ padding: 'var(--space-3)', background: 'var(--warning-muted)', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning-border)' }}>
              <p style={{ ...sectionLabel, margin: '0 0 2px', color: 'var(--warning)' }}>Outstanding</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--warning)', margin: 0 }}>{fmt(unpaidRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Row 3: Recent Orders + Low Stock + Stats ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-5)' }}>

        {/* Recent Orders */}
        <div style={{ ...card, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-faint)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Orders</h2>
            <span style={{ ...sectionLabel, fontSize: '9px' }}>{recentOrders.length} latest</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {recentOrders.length > 0 ? recentOrders.map((o, i) => {
              const payStatus = o.paymentStatus || 'unpaid';
              return (
                <div key={o.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i < recentOrders.length - 1 ? '1px solid var(--border-faint)' : 'none',
                }}>
                  {/* Status icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-md)', flexShrink: 0,
                    background: `var(--order-${o.status}-bg, var(--neutral-muted))`,
                    color: `var(--order-${o.status}, var(--neutral))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{statusIcons[o.status] || <ShoppingCart size={14} />}</div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>{o.id}</span>
                      <StatusBadge status={o.status as any} size="sm" />
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.customerName || 'Guest'} · {o.items.length} item(s)
                    </p>
                  </div>

                  {/* Amount + payment */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{fmt(o.total)}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: payStatus === 'paid' ? 'var(--success)' : payStatus === 'awaiting_payment' ? 'var(--warning)' : 'var(--text-tertiary)',
                      }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                        {payStatus === 'paid' ? 'Paid' : payStatus === 'awaiting_payment' ? 'Awaiting' : payStatus === 'proforma_sent' ? 'Proforma' : 'Unpaid'}
                      </span>
                    </div>
                  </div>

                  {/* Time */}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', width: 48, textAlign: 'right', flexShrink: 0 }}>
                    {relTime(o.date)}
                  </span>
                </div>
              );
            }) : (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Package size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px', opacity: 0.3 }} />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>No orders yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div style={{ ...card, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-faint)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Stock Alerts</h2>
            {lowStockItems.length > 0 && (
              <span style={{
                ...sectionLabel, fontSize: '9px', color: 'var(--danger)',
                background: 'var(--danger-muted)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                border: '1px solid var(--danger-border)',
              }}>{lowStockItems.length} low</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {lowStockItems.length > 0 ? lowStockItems.map((item, i) => {
              const level = item.stock === 0 ? 'danger' : item.stock < 5 ? 'danger' : 'warning';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                  borderBottom: i < lowStockItems.length - 1 ? '1px solid var(--border-faint)' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                    background: level === 'danger' ? 'var(--danger-muted)' : 'var(--warning-muted)',
                    color: level === 'danger' ? 'var(--danger)' : 'var(--warning)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{item.stock === 0 ? <XCircle size={12} /> : <AlertTriangle size={12} />}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', color: 'var(--text-tertiary)', margin: 0 }}>{item.variant}</p>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700,
                    color: level === 'danger' ? 'var(--danger)' : 'var(--warning)',
                    padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                    background: level === 'danger' ? 'var(--danger-muted)' : 'var(--warning-muted)',
                  }}>{item.stock}</span>
                </div>
              );
            }) : (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <CheckCircle2 size={28} style={{ color: 'var(--success)', margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>All stock levels healthy</p>
              </div>
            )}
          </div>
        </div>

        {/* Business Snapshot */}
        <div style={{ ...card, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-faint)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Business Snapshot</h2>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Products', value: String(state.products.length), icon: <Box size={14} />, color: 'var(--accent-primary)' },
              { label: 'Blog Posts', value: String(state.blogs.length), icon: <FileText size={14} />, color: 'var(--info)' },
              { label: 'Job Postings', value: String(state.jobs.length), icon: <Layers size={14} />, color: 'var(--order-processing)' },
              { label: 'B2B Customers', value: String(state.customers.filter(c => c.role === 'b2b').length), icon: <Users size={14} />, color: 'var(--success)' },
              { label: 'Active Customers', value: String(state.customers.filter(c => c.status === 'active').length), icon: <TrendingUp size={14} />, color: 'var(--order-confirmed)' },
              {
                label: 'Avg. Order Value',
                value: activeOrders.length > 0 ? fmt(totalRevenue / activeOrders.length) : fmt(0),
                icon: <BarChart3 size={14} />,
                color: 'var(--accent-primary)',
              },
            ].map(s => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-faint)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: s.color, display: 'flex' }}>{s.icon}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{s.label}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

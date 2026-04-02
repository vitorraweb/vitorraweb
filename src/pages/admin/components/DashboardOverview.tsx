import { useCMS } from '../../../context/CMSContext';
import { getStatusLabel } from '../ui/StatusBadge';
import {
  BarChart3, TrendingUp, Users, ShoppingCart, Truck, ArrowUpRight, ArrowDownRight,
  Activity, Package, DollarSign, Clock,
} from 'lucide-react';

export default function DashboardOverview() {
  const { state } = useCMS();

  const sorted = [...state.orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalRevenue = state.orders.reduce((s, o) => s + o.total, 0);
  const pendingOrders = state.orders.filter(o => o.status === 'pending').length;
  const inTransit = state.orders.filter(o => o.status === 'shipped').length;
  const totalCustomers = state.customers.length;
  const recentOrders = sorted.slice(0, 6);

  const fmt = (n: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

  const relTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const hrs = diff / 3600000;
    if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (hrs < 24) return `${Math.floor(hrs)}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const statusColors: Record<string, string> = {
    pending: 'var(--order-pending)',
    confirmed: 'var(--order-confirmed)',
    processing: 'var(--order-processing)',
    shipped: 'var(--order-shipped)',
    delivered: 'var(--order-delivered)',
    cancelled: 'var(--order-cancelled)',
  };

  const card: React.CSSProperties = {
    background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
    borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
  };

  const kpis = [
    { label: 'Total Revenue', val: fmt(totalRevenue), trend: '+12.5%', up: true, icon: <DollarSign size={18} />, color: 'var(--accent-primary)', bg: 'var(--accent-primary-muted)' },
    { label: 'Active Shipments', val: String(inTransit), trend: 'In transit', up: true, icon: <Truck size={18} />, color: 'var(--order-shipped)', bg: 'var(--order-shipped-bg)' },
    { label: 'Pending Orders', val: String(pendingOrders), trend: 'Awaiting action', up: false, icon: <ShoppingCart size={18} />, color: 'var(--order-pending)', bg: 'var(--order-pending-bg)' },
    { label: 'Total Customers', val: String(totalCustomers), trend: '+3 this week', up: true, icon: <Users size={18} />, color: 'var(--success)', bg: 'var(--success-muted)' },
  ];

  return (
    <div>
      {/* Page Header */}
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Overview</h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Operational snapshot of orders, revenue, and logistics.</p>

      {/* KPI Cards — §7.3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className="ad-fade-in"
            style={{
              ...card, padding: 'var(--space-5)',
              transition: 'var(--transition-base)', cursor: 'default',
              animationDelay: `${i * 60}ms`,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-faint)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: k.bg, color: k.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{k.icon}</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500,
                color: k.up ? 'var(--success)' : 'var(--order-pending)',
              }}>
                {k.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {k.trend}
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 var(--space-1)' }}>{k.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{k.val}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-5)' }}>
        {/* Logistics Velocity Chart — §19 */}
        <div style={{ ...card, padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Logistics Velocity</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>Average delivery time by region</p>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 600,
              color: 'var(--success)', background: 'var(--success-muted)',
              padding: '4px 10px', borderRadius: 'var(--radius-full)',
              border: '1px solid var(--success-border)',
            }}>
              <Activity size={12} /> Live
            </div>
          </div>

          {/* Bar Chart §19.4 */}
          <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', paddingBottom: 'var(--space-6)' }}>
            {[75, 45, 90, 60, 85, 40, 95].map((h, i) => (
              <div key={i} style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${h}%`,
                    background: `var(--chart-${(i % 8) + 1})`,
                    opacity: 0.7,
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    transition: 'opacity 0.2s ease, filter 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.filter = 'brightness(1.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.filter = 'none'; }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            <span>E. Africa</span><span>Europe</span><span>N. America</span><span>Asia</span><span>Gulf</span><span>W. Africa</span><span>S. Africa</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ ...card, padding: 'var(--space-6)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-faint)', paddingBottom: 'var(--space-4)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Activity</h2>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{recentOrders.length}</span>
          </div>
          <div style={{ flex: 1 }}>
            {recentOrders.length > 0 ? recentOrders.map(o => (
              <div key={o.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                padding: 'var(--space-3) 0',
                borderBottom: '1px solid var(--border-faint)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: statusColors[o.status] ? `color-mix(in srgb, ${statusColors[o.status]} 15%, transparent)` : 'var(--neutral-muted)',
                  color: statusColors[o.status] || 'var(--neutral)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {o.status === 'pending' ? <Clock size={14} /> :
                   o.status === 'shipped' ? <Truck size={14} /> :
                   o.status === 'delivered' ? <Package size={14} /> :
                   <ShoppingCart size={14} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                      {o.status === 'pending' ? 'New Order' : `${getStatusLabel(o.status)}`}
                    </p>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {relTime(o.date)}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.customerName || 'Guest'} — {o.items.length} items
                  </p>
                </div>
              </div>
            )) : (
              <div style={{ paddingTop: 'var(--space-10)', paddingBottom: 'var(--space-10)', textAlign: 'center' }}>
                <Package size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 var(--space-2)' }}>No recent activity</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Orders will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import { db } from '../../lib/firebase';
import { ToastProvider } from './ui/Toast';
import './admin.css';
import {
  BarChart3, ShoppingCart, Package, Users, Truck, Newspaper, Briefcase,
  Settings, LogOut, ChevronLeft, ChevronRight, Search, Bell, X, Menu,
  Loader2, DollarSign, Globe, Trash2, LayoutGrid, Warehouse, Activity,
  Archive, Shield, FileText, UserCog,
} from 'lucide-react';

import DashboardOverview from './components/DashboardOverview';
import CustomersManager from './components/CustomersManager';
import OrdersManager from './components/OrdersManager';
import ShippingManager from './components/ShippingManager';
import ProductsManager from './components/ProductsManager';
import BlogsManager from './components/BlogsManager';
import JobsManager from './components/JobsManager';

type Tab = 'overview' | 'orders' | 'products' | 'shipping' | 'customers' | 'blogs' | 'jobs' | 'settings';

interface NavItem { id: Tab; label: string; icon: React.ReactNode; badge?: number }

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const { state } = useCMS();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [commandBarOpen, setCommandBarOpen] = useState(false);

  /* Auth guard */
  useEffect(() => {
    if (loading) return;
    const roles = ['admin', 'Super Admin', 'Ops Manager', 'Viewer'];
    if (!user || !roles.includes(user.role)) navigate('/admin');
  }, [user, navigate, loading]);

  /* ⌘K shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandBarOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (loading) {
    return (
      <div className="admin-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="ad-spinner dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
      </div>
    );
  }

  if (!user) return null;
  const adminRoles = ['admin', 'Super Admin', 'Ops Manager', 'Viewer'];
  if (!adminRoles.includes(user.role)) return null;

  const isOpsManager = user.role === 'Ops Manager';
  const isViewer = user.role === 'Viewer';
  const pendingOrders = state.orders.filter(o => o.status === 'pending').length;
  const inTransitCount = state.orders.filter(o => o.status === 'shipped').length;

  const tabLabel = (): string => ({ overview: 'Overview', orders: 'Orders', products: 'Products', shipping: 'Shipping', customers: 'Customers', blogs: 'News', jobs: 'Careers', settings: 'Settings' }[activeTab] || 'Dashboard');

  /* §6.1 Navigation Groups */
  const overviewNav: NavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: <BarChart3 size={18} /> },
  ];
  const commerceNav: NavItem[] = [
    { id: 'orders', label: 'Orders', icon: <ShoppingCart size={18} />, badge: pendingOrders > 0 ? pendingOrders : undefined },
    { id: 'products', label: 'Products', icon: <Package size={18} /> },
    { id: 'shipping', label: 'Logistics', icon: <Truck size={18} />, badge: inTransitCount > 0 ? inTransitCount : undefined },
    ...(!isOpsManager ? [{ id: 'customers' as Tab, label: 'Customers', icon: <Users size={18} /> }] : []),
  ];
  const contentNav: NavItem[] = [
    { id: 'blogs', label: 'News', icon: <Newspaper size={18} /> },
    { id: 'jobs', label: 'Careers', icon: <Briefcase size={18} /> },
  ];
  const settingsNav: NavItem[] = !isOpsManager ? [
    { id: 'settings' as Tab, label: 'Configuration', icon: <Settings size={18} /> },
  ] : [];

  const switchTab = (t: Tab) => {
    setActiveTab(t);
    if (window.innerWidth < 1024) setSidebarExpanded(false);
  };

  const sidebarWidth = sidebarExpanded ? 240 : 64;

  return (
    <ToastProvider>
      <div className="admin-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ═══ §5 TOPBAR ═══════════════════════════════════════════════════ */}
        <header style={{
          height: 56, position: 'sticky', top: 0,
          zIndex: 'var(--z-sticky)' as any,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-faint)',
          boxShadow: '0 1px 0 var(--border-faint)',
          display: 'flex', alignItems: 'center',
          padding: '0 var(--space-6)',
        }}>
          {/* Brand area */}
          <div style={{ width: sidebarWidth - 24, display: 'flex', alignItems: 'center', gap: 'var(--space-3)', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0 }}>
            <button onClick={() => setSidebarExpanded(!sidebarExpanded)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
              padding: 4, borderRadius: 'var(--radius-md)', transition: 'var(--transition-fast)',
              display: 'flex',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <Menu size={20} />
            </button>
            {sidebarExpanded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'white',
                }}>V</div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Vitorra</span>
              </div>
            )}
          </div>

          {/* §5.3 Global Search */}
          <div style={{
            flex: 1, display: 'flex', justifyContent: 'center', padding: '0 var(--space-6)',
          }}>
            <div
              style={{
                width: searchFocused ? 480 : 320, transition: 'width 0.2s ease',
                position: 'relative',
              }}
            >
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                placeholder="Search orders, customers, products…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => { setSearchFocused(false); }}
                style={{
                  width: '100%', height: 36,
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${searchFocused ? 'var(--border-focus)' : 'var(--border-dim)'}`,
                  boxShadow: searchFocused ? 'var(--shadow-glow)' : 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '0 36px 0 36px',
                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--text-primary)',
                  outline: 'none', transition: 'var(--transition-fast)',
                }}
              />
              <span style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)',
                background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
                padding: '2px 6px', borderRadius: 'var(--radius-sm)',
              }}>⌘K</span>
            </div>
          </div>

          {/* Right icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {/* Notification bell */}
            <button style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'var(--transition-fast)', position: 'relative',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <Bell size={18} />
              {pendingOrders > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--danger)',
                }} />
              )}
            </button>

            {/* User avatar */}
            <div style={{
              marginLeft: 'var(--space-2)', paddingLeft: 'var(--space-3)',
              borderLeft: '1px solid var(--border-faint)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', fontWeight: 700,
                border: '2px solid var(--border-dim)',
                transition: 'var(--transition-fast)', cursor: 'pointer',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-dim)'}
              >
                {user.name.charAt(0)}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{user.name}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: 0 }}>{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ §5.3 COMMAND PALETTE ════════════════════════════════════════ */}
        {commandBarOpen && (
          <div
            onClick={() => setCommandBarOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 'var(--z-modal-bg)' as any,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh',
              animation: 'admin-fade-in 0.15s ease both',
            }}
          >
            <div onClick={e => e.stopPropagation()} style={{
              width: '100%', maxWidth: 520,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border-faint)' }}>
                <Search size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <input autoFocus placeholder="Search orders, products, customers..." style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', color: 'var(--text-primary)',
                }} />
              </div>
              <div style={{ padding: 'var(--space-2)' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.10em', padding: '8px 12px' }}>Quick Actions</p>
                {[
                  { label: 'View Orders', icon: <ShoppingCart size={16} />, tab: 'orders' as Tab },
                  { label: 'Manage Products', icon: <Package size={16} />, tab: 'products' as Tab },
                  { label: 'View Customers', icon: <Users size={16} />, tab: 'customers' as Tab },
                  { label: 'Logistics', icon: <Truck size={16} />, tab: 'shipping' as Tab },
                ].map(item => (
                  <button key={item.tab} onClick={() => { setActiveTab(item.tab); setCommandBarOpen(false); }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 12px', borderRadius: 'var(--radius-md)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                    transition: 'var(--transition-fast)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <span style={{ color: 'var(--text-tertiary)', display: 'flex' }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ═══ §6 SIDEBAR ═══════════════════════════════════════════════ */}
          <aside style={{
            width: sidebarWidth,
            height: 'calc(100vh - 56px)',
            position: 'sticky', top: 56,
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-faint)',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto', overflowX: 'hidden',
            transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
            flexShrink: 0,
          }}>
            <nav style={{ flex: 1, padding: 'var(--space-4) var(--space-2)' }}>
              {/* Nav groups */}
              <NavGroup label="Overview" items={overviewNav} activeTab={activeTab} expanded={sidebarExpanded} onSelect={switchTab} />
              <NavGroup label="Commerce" items={commerceNav} activeTab={activeTab} expanded={sidebarExpanded} onSelect={switchTab} />
              <NavGroup label="Content" items={contentNav} activeTab={activeTab} expanded={sidebarExpanded} onSelect={switchTab} />
              {settingsNav.length > 0 && (
                <NavGroup label="Settings" items={settingsNav} activeTab={activeTab} expanded={sidebarExpanded} onSelect={switchTab} />
              )}
            </nav>

            {/* §6.5 Sidebar Footer */}
            <div style={{ padding: 'var(--space-3) var(--space-2)', borderTop: '1px solid var(--border-faint)', flexShrink: 0 }}>
              {sidebarExpanded && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '8px var(--space-2)', marginBottom: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0,
                  }}>{user.name.charAt(0)}</div>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: 0 }}>{user.role}</p>
                  </div>
                </div>
              )}

              <SidebarButton
                icon={<LogOut size={18} />}
                label="Sign Out"
                expanded={sidebarExpanded}
                danger
                onClick={() => { logout(); navigate('/admin'); }}
              />

              {/* Collapse toggle */}
              <SidebarButton
                icon={sidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                label={sidebarExpanded ? 'Collapse' : ''}
                expanded={sidebarExpanded}
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
              />

              {sidebarExpanded && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 8 }}>v1.0.0</p>
              )}
            </div>
          </aside>

          {/* ═══ §4 MAIN CONTENT AREA ════════════════════════════════════ */}
          <main style={{
            flex: 1, minWidth: 0,
            overflowY: 'auto',
            height: 'calc(100vh - 56px)',
            padding: 'var(--space-6)',
            background: 'var(--bg-canvas)',
          }}>
            {/* Breadcrumb */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 'var(--space-5)',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
            }}>
              <span
                onClick={() => setActiveTab('overview')}
                style={{ color: 'var(--text-tertiary)', cursor: 'pointer', transition: 'var(--transition-fast)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >Dashboard</span>
              <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{tabLabel()}</span>
            </div>

            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
              {activeTab === 'overview' && <DashboardOverview />}
              {activeTab === 'orders' && <OrdersManager />}
              {activeTab === 'products' && <ProductsManager />}
              {activeTab === 'shipping' && <ShippingManager />}
              {activeTab === 'customers' && <CustomersManager />}
              {activeTab === 'blogs' && <BlogsManager />}
              {activeTab === 'jobs' && <JobsManager />}
              {activeTab === 'settings' && <AdminSettings />}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

/* ── §6 NAV GROUP ────────────────────────────────────────────────────── */
function NavGroup({ label, items, activeTab, expanded, onSelect }: {
  label: string; items: NavItem[]; activeTab: Tab; expanded: boolean; onSelect: (t: Tab) => void;
}) {
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      {expanded && (
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700,
          color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.10em',
          padding: '0 var(--space-4)', marginBottom: 'var(--space-1)',
          marginTop: 'var(--space-5)',
        }}>{label}</p>
      )}
      {items.map(item => {
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            title={!expanded ? item.label : undefined}
            style={{
              width: '100%',
              height: 38,
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: expanded ? '0 var(--space-3) 0 var(--space-4)' : '0',
              justifyContent: expanded ? 'flex-start' : 'center',
              borderRadius: 'var(--radius-md)',
              margin: '2px 0',
              background: active ? 'var(--accent-primary-muted)' : 'transparent',
              border: 'none',
              borderLeft: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              position: 'relative',
              outline: 'none',
              boxShadow: active ? 'inset 0 0 20px var(--accent-primary-glow)' : 'none',
            }}
            onMouseEnter={e => {
              if (!active) {
                e.currentTarget.style.background = 'var(--bg-elevated)';
                e.currentTarget.style.borderLeftColor = 'var(--border-strong)';
                const icon = e.currentTarget.querySelector('.nav-icon') as HTMLElement;
                const lbl = e.currentTarget.querySelector('.nav-label') as HTMLElement;
                if (icon) icon.style.color = 'var(--text-primary)';
                if (lbl) lbl.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderLeftColor = 'transparent';
                const icon = e.currentTarget.querySelector('.nav-icon') as HTMLElement;
                const lbl = e.currentTarget.querySelector('.nav-label') as HTMLElement;
                if (icon) icon.style.color = 'var(--text-tertiary)';
                if (lbl) lbl.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <span className="nav-icon" style={{
              color: active ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              display: 'flex', flexShrink: 0, transition: 'var(--transition-fast)',
            }}>{item.icon}</span>

            {expanded && (
              <span className="nav-label" style={{
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                flex: 1, textAlign: 'left', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
                transition: 'var(--transition-fast)',
              }}>{item.label}</span>
            )}

            {expanded && item.badge !== undefined && item.badge > 0 && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 600,
                background: active ? 'rgba(255,255,255,0.15)' : 'var(--danger)',
                color: 'white',
                padding: '2px 6px', borderRadius: 'var(--radius-full)',
                minWidth: 20, textAlign: 'center',
                animation: 'pulse-ring 1.8s ease infinite',
              }}>{item.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SidebarButton({ icon, label, expanded, onClick, danger }: {
  icon: React.ReactNode; label: string; expanded: boolean; onClick: () => void; danger?: boolean;
}) {
  return (
    <button onClick={onClick} title={!expanded ? label : undefined} style={{
      width: '100%', height: 38,
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      padding: expanded ? '0 var(--space-3) 0 var(--space-4)' : '0',
      justifyContent: expanded ? 'flex-start' : 'center',
      borderRadius: 'var(--radius-md)', margin: '2px 0',
      background: 'transparent', border: 'none', cursor: 'pointer',
      color: danger ? 'var(--danger)' : 'var(--text-secondary)',
      fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500,
      transition: 'var(--transition-fast)', outline: 'none',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'var(--danger-muted)' : 'var(--bg-elevated)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
      {expanded && label}
    </button>
  );
}

/* ── ADMIN SETTINGS (inline) ─────────────────────────────────────────── */
function AdminSettings() {
  const { user } = useAuth();
  const { state: { settings }, updateSettings } = useCMS();
  const isViewer = user?.role === 'Viewer';
  const [tab, setTab] = useState<'general' | 'logistics' | 'financials'>('general');

  const handleUpdate = (path: string, value: any) => {
    const keys = path.split('.');
    const s = JSON.parse(JSON.stringify(settings));
    let c: any = s;
    for (let i = 0; i < keys.length - 1; i++) { if (!c[keys[i]]) c[keys[i]] = {}; c = c[keys[i]]; }
    c[keys[keys.length - 1]] = value;
    updateSettings(s);
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-sm)',
    marginBottom: 'var(--space-5)',
  };

  const labelSty: React.CSSProperties = {
    fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: 'var(--space-1)', display: 'block',
  };

  const inputSty: React.CSSProperties = {
    width: '100%', height: 38, padding: '0 var(--space-3)',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
    borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-base)', color: 'var(--text-primary)', outline: 'none',
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Settings</h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Manage configuration, logistics, and financials.</p>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-faint)', borderRadius: 'var(--radius-md)', padding: 4, width: 'fit-content', marginBottom: 'var(--space-6)' }}>
        {[
          { id: 'general' as const, label: 'General', icon: <Globe size={14} /> },
          { id: 'logistics' as const, label: 'Logistics', icon: <Truck size={14} /> },
          { id: 'financials' as const, label: 'Financials', icon: <DollarSign size={14} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px',
            borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)', fontWeight: tab === t.id ? 600 : 400, border: 'none', cursor: 'pointer',
            background: tab === t.id ? 'var(--accent-primary)' : 'transparent',
            color: tab === t.id ? 'white' : 'var(--text-secondary)',
            transition: 'var(--transition-fast)',
          }}>{t.icon}{t.label}</button>
        ))}
      </div>

      {tab === 'general' && (
        <>
          <div style={cardStyle}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--space-4)' }}>Branding & Identity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div><label style={labelSty}>Company Name</label><input style={inputSty} defaultValue={settings.general.companyName} onBlur={e => handleUpdate('general.companyName', e.target.value)} disabled={isViewer} /></div>
              <div><label style={labelSty}>Support Phone</label><input style={inputSty} defaultValue={settings.general.supportPhone} onBlur={e => handleUpdate('general.supportPhone', e.target.value)} disabled={isViewer} /></div>
              <div><label style={labelSty}>Support Email</label><input style={inputSty} defaultValue={settings.general.supportEmail} onBlur={e => handleUpdate('general.supportEmail', e.target.value)} disabled={isViewer} /></div>
              <div>
                <label style={labelSty}>Brand Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: settings.general.brandColor || '#4A8FFF', border: '1px solid var(--border-dim)' }} />
                  <input style={{ ...inputSty, fontFamily: 'var(--font-mono)' }} value={settings.general.brandColor} onChange={e => handleUpdate('general.brandColor', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Team Members</h3>
              {!isViewer && <button onClick={() => {
                const id = Math.random().toString(36).substr(2, 9);
                handleUpdate('general.team', [...settings.general.team, { id, name: 'New Member', email: '', role: 'Viewer', status: 'invited' }]);
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-primary)' }}>+ Invite Member</button>}
            </div>
            {settings.general.team.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-faint)',
                marginBottom: 'var(--space-2)', transition: 'var(--transition-fast)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 'var(--text-xs)', fontWeight: 700,
                  }}>{m.name.charAt(0)}</div>
                  <div>
                    <input defaultValue={m.name} style={{ background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', width: 120 }}
                      onBlur={e => handleUpdate('general.team', settings.general.team.map(t => t.id === m.id ? { ...t, name: e.target.value } : t))} />
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: 0 }}>{m.email || 'No email'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <select disabled={isViewer} value={m.role} onChange={e => handleUpdate('general.team', settings.general.team.map(t => t.id === m.id ? { ...t, role: e.target.value } : t))}
                    style={{ ...inputSty, width: 'auto', height: 28, fontSize: 'var(--text-xs)', padding: '0 8px' }}>
                    <option>Super Admin</option><option>Ops Manager</option><option>Viewer</option>
                  </select>
                  {!isViewer && <button onClick={() => handleUpdate('general.team', settings.general.team.filter(t => t.id !== m.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, transition: 'var(--transition-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                  ><Trash2 size={14} /></button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'logistics' && (
        <>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Carriers</h3>
              {!isViewer && <button onClick={() => handleUpdate('logistics.carriers', [...settings.logistics.carriers, { id: Date.now().toString(), name: 'New Carrier', pattern: '', active: true }])}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-primary)' }}>+ Add Carrier</button>}
            </div>
            {settings.logistics.carriers.map(c => (
              <div key={c.id} style={{ padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-faint)', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <input defaultValue={c.name} style={{ background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}
                    onBlur={e => handleUpdate('logistics.carriers', settings.logistics.carriers.map(x => x.id === c.id ? { ...x, name: e.target.value } : x))} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button disabled={isViewer} onClick={() => handleUpdate('logistics.carriers', settings.logistics.carriers.map(x => x.id === c.id ? { ...x, active: !x.active } : x))}
                      style={{
                        fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 600, padding: '2px 8px',
                        borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
                        background: c.active ? 'var(--success-muted)' : 'var(--neutral-muted)',
                        color: c.active ? 'var(--success)' : 'var(--neutral)',
                      }}>{c.active ? 'Active' : 'Inactive'}</button>
                    {!isViewer && <button onClick={() => handleUpdate('logistics.carriers', settings.logistics.carriers.filter(x => x.id !== c.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                    ><Trash2 size={14} /></button>}
                  </div>
                </div>
                <div>
                  <label style={{ ...labelSty, fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tracking URL Template</label>
                  <input style={{ ...inputSty, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }} defaultValue={c.pattern}
                    onBlur={e => handleUpdate('logistics.carriers', settings.logistics.carriers.map(x => x.id === c.id ? { ...x, pattern: e.target.value } : x))} />
                </div>
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--space-4)' }}>Fulfillment Rules</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div><label style={labelSty}>Base Domestic Rate (UGX)</label><input type="number" style={{ ...inputSty, fontFamily: 'var(--font-mono)' }} disabled={isViewer} defaultValue={settings.logistics.baseDomesticRate} onBlur={e => handleUpdate('logistics.baseDomesticRate', parseInt(e.target.value))} /></div>
              <div><label style={labelSty}>Free Shipping Threshold (UGX)</label><input type="number" style={{ ...inputSty, fontFamily: 'var(--font-mono)' }} disabled={isViewer} defaultValue={settings.logistics.freeShippingThreshold} onBlur={e => handleUpdate('logistics.freeShippingThreshold', parseInt(e.target.value))} /></div>
            </div>
          </div>
        </>
      )}

      {tab === 'financials' && (
        <>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Tax Rates</h3>
              {!isViewer && <button onClick={() => handleUpdate('financials.taxRates', [...settings.financials.taxRates, { id: Date.now().toString(), region: 'New Region', rate: 0 }])}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-primary)' }}>+ Add Rate</button>}
            </div>
            <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-faint)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    <th style={{ padding: '0 var(--space-4)', height: 40, textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Region</th>
                    <th style={{ padding: '0 var(--space-4)', height: 40, textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rate</th>
                    <th style={{ padding: '0 var(--space-4)', height: 40, textAlign: 'right', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.financials.taxRates.map(t => (
                    <tr key={t.id} style={{ borderTop: '1px solid var(--border-faint)' }}>
                      <td style={{ padding: '0 var(--space-4)', height: 52 }}>
                        <input defaultValue={t.region} style={{ background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', width: '100%' }}
                          onBlur={e => handleUpdate('financials.taxRates', settings.financials.taxRates.map(x => x.id === t.id ? { ...x, region: e.target.value } : x))} />
                      </td>
                      <td style={{ padding: '0 var(--space-4)', height: 52 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <input type="number" disabled={isViewer} defaultValue={t.rate} style={{ background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--success)', width: 48 }}
                            onBlur={e => handleUpdate('financials.taxRates', settings.financials.taxRates.map(x => x.id === t.id ? { ...x, rate: parseFloat(e.target.value) } : x))} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--success)' }}>%</span>
                        </span>
                      </td>
                      <td style={{ padding: '0 var(--space-4)', height: 52, textAlign: 'right' }}>
                        {!isViewer && <button onClick={() => handleUpdate('financials.taxRates', settings.financials.taxRates.filter(x => x.id !== t.id))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                        ><Trash2 size={14} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--space-4)' }}>Payment Methods</h3>
            {settings.financials.paymentMethods.map(method => (
              <div key={method.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-faint)', marginBottom: 'var(--space-2)',
                transition: 'var(--transition-fast)',
              }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{method.name}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 600, color: method.active ? 'var(--success)' : 'var(--text-tertiary)', textTransform: 'uppercase', margin: '2px 0 0' }}>{method.active ? 'Active' : 'Inactive'}</p>
                </div>
                <button disabled={isViewer} onClick={() => handleUpdate('financials.paymentMethods', settings.financials.paymentMethods.map(x => x.id === method.id ? { ...x, active: !x.active } : x))}
                  style={{
                    width: 44, height: 24, borderRadius: 'var(--radius-full)', position: 'relative', border: 'none', cursor: 'pointer',
                    background: method.active ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                    transition: 'var(--transition-base)', opacity: isViewer ? 0.5 : 1,
                  }}>
                  <span style={{
                    position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                    background: 'white', boxShadow: 'var(--shadow-sm)',
                    left: method.active ? 23 : 3,
                    transition: 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }} />
                </button>
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--space-4)' }}>System</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
              <div><p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>Currency</p><p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginTop: 4 }}>{settings.financials.currency}</p></div>
              <div><p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>Prefix</p><p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginTop: 4 }}>{settings.financials.orderPrefix}</p></div>
              <div><p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>Next Order #</p><p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginTop: 4 }}>{settings.financials.nextOrderNumber}</p></div>
              <div><p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>Firebase</p><p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: db ? 'var(--success)' : 'var(--warning)', marginTop: 4 }}>{db ? 'Connected' : 'Local Mode'}</p></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

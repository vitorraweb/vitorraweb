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
  Archive, Shield, FileText, UserCog, Image, Inbox,
} from 'lucide-react';

import DashboardOverview from './components/DashboardOverview';
import CustomersManager from './components/CustomersManager';
import OrdersManager from './components/OrdersManager';
import ShippingManager from './components/ShippingManager';
import ProductsManager from './components/ProductsManager';
import BlogsManager from './components/BlogsManager';
import JobsManager from './components/JobsManager';
import SettingsManager from './components/SettingsManager';
import MediaLibrary from './components/MediaLibrary';
import InboxManager, { useInboxBadge } from './components/InboxManager';

type Tab = 'overview' | 'orders' | 'products' | 'shipping' | 'customers' | 'blogs' | 'jobs' | 'media' | 'inbox' | 'settings';

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
  const inboxBadge = useInboxBadge();

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

  const tabLabel = (): string => ({ overview: 'Overview', orders: 'Orders', products: 'Products', shipping: 'Shipping', customers: 'Customers', blogs: 'News', jobs: 'Careers', media: 'Media Library', inbox: 'Inbox', settings: 'Settings' }[activeTab] || 'Dashboard');

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
    { id: 'media', label: 'Media', icon: <Image size={18} /> },
    { id: 'inbox', label: 'Inbox', icon: <Inbox size={18} />, badge: inboxBadge > 0 ? inboxBadge : undefined },
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
              {activeTab === 'media' && <MediaLibrary />}
              {activeTab === 'inbox' && <InboxManager />}
              {activeTab === 'settings' && <SettingsManager />}
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


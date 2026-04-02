import { useState, useEffect, useRef, useMemo } from 'react';
import { useCMS, Order } from '../../../context/CMSContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../ui/Toast';
import AdminButton from '../ui/AdminButton';
import StatusBadge, { getStatusLabel, mapPaymentStatus } from '../ui/StatusBadge';
import { AdminInput, AdminSelect, AdminTextarea } from '../ui/AdminInput';
import Modal from '../ui/Modal';
import Drawer from '../ui/Drawer';
import {
  Search, Package, Clock, Truck, CheckCircle2, XCircle, ArrowRight,
  DollarSign, MapPin, Calendar, ExternalLink, CreditCard, FileText,
  Users, MoreHorizontal, ChevronLeft, ChevronRight, Printer, Copy,
  X, Send, Box, History, AlertTriangle, Eye, Edit3, ClipboardCopy,
  Mail, Flag, Trash2, Download, ChevronDown, ArrowUpRight,
} from 'lucide-react';
import { uploadFile } from '../../../services/uploadService';

/* ── Styles (using CSS vars, no hardcodes) ─────────────────────────── */
const S = {
  card: { background: 'var(--bg-surface)', border: '1px solid var(--border-faint)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' } as React.CSSProperties,
  tableHeader: { background: 'var(--bg-elevated)', height: 40, position: 'sticky' as const, top: 0, zIndex: 10 } as React.CSSProperties,
  th: { padding: '0 var(--space-4)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  td: { padding: '0 var(--space-4)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' } as React.CSSProperties,
  mono: { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' } as React.CSSProperties,
  price: { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' as const } as React.CSSProperties,
  sectionLabel: { fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-3)' } as React.CSSProperties,
};

/* ── Helpers ───────────────────────────────────────────────────────── */
const fmt = (n: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);
const relativeTime = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const hrs = diff / 3600000;
  if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (hrs < 24) return `${Math.floor(hrs)}h ago`;
  if (hrs < 168) return `${Math.floor(hrs / 24)}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const statusFlow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrdersManager() {
  const { user } = useAuth();
  const { state, updateOrder } = useCMS();
  const { addToast } = useToast();
  const isViewer = user?.role === 'Viewer';

  /* ── State ─────────────────────────────────────────────────── */
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; order: Order } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Modals
  const [fulfillModal, setFulfillModal] = useState<Order | null>(null);
  const [forwardModal, setForwardModal] = useState<Order | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Order | null>(null);
  const [fulfillData, setFulfillData] = useState({ carrier: '', trackingNumber: '' });
  const [forwardData, setForwardData] = useState({ supplier: '', department: '', priority: 'Normal', message: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [uploading, setUploading] = useState<'proforma' | 'invoice' | null>(null);

  /* ── Derived ───────────────────────────────────────────────── */
  const allOrders = useMemo(() =>
    [...state.orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.orders]
  );

  const filtered = useMemo(() => allOrders.filter(o => {
    const s = search.toLowerCase();
    const matchSearch =
      o.id.toLowerCase().includes(s) ||
      (o.customerName || '').toLowerCase().includes(s) ||
      (o.customerEmail || '').toLowerCase().includes(s) ||
      (o.trackingNumber || '').toLowerCase().includes(s);
    return matchSearch && (filterStatus === 'all' || o.status === filterStatus);
  }), [allOrders, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // KPIs
  const totalRevenue = allOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const kpis = [
    { label: 'Total Orders', value: allOrders.length, color: 'var(--text-primary)' },
    { label: 'Pending', value: allOrders.filter(o => o.status === 'pending').length, color: 'var(--order-pending)' },
    { label: 'In Transit', value: allOrders.filter(o => o.status === 'shipped').length, color: 'var(--order-shipped)' },
    { label: 'Delivered', value: allOrders.filter(o => o.status === 'delivered').length, color: 'var(--order-delivered)' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
  ];

  /* ── Handlers ──────────────────────────────────────────────── */
  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const toggleAll = () => setSelectedIds(prev =>
    prev.size === paginated.length ? new Set() : new Set(paginated.map(o => o.id))
  );

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    addToast('info', 'Copied', `Order ID ${id} copied to clipboard.`);
  };

  const advanceStatus = (order: Order) => {
    const idx = statusFlow.indexOf(order.status);
    if (idx < 0 || idx >= statusFlow.length - 1) return;
    const next = statusFlow[idx + 1];
    const timeline = [...(order.statusHistory || []), { status: next, date: new Date().toISOString(), note: `Status advanced by ${user?.name || 'Admin'}` }];
    updateOrder(order.id, { status: next as any, statusHistory: timeline });
    if (drawerOrder?.id === order.id) setDrawerOrder({ ...order, status: next as any, statusHistory: timeline });
    addToast('success', `Status updated to ${getStatusLabel(next)}`);
  };

  const handleFulfill = async () => {
    if (!fulfillModal || !fulfillData.carrier || !fulfillData.trackingNumber) return;
    setModalLoading(true);
    try {
      const timeline = [...(fulfillModal.statusHistory || []), {
        status: 'shipped', date: new Date().toISOString(),
        note: `Shipped via ${fulfillData.carrier}. Tracking: ${fulfillData.trackingNumber}`,
      }];
      await updateOrder(fulfillModal.id, { status: 'shipped', carrier: fulfillData.carrier, trackingNumber: fulfillData.trackingNumber, statusHistory: timeline });
      const updated = { ...fulfillModal, status: 'shipped' as const, carrier: fulfillData.carrier, trackingNumber: fulfillData.trackingNumber, statusHistory: timeline };
      if (drawerOrder?.id === fulfillModal.id) setDrawerOrder(updated);
      setFulfillModal(null);
      setFulfillData({ carrier: '', trackingNumber: '' });
      addToast('success', 'Order marked as shipped', 'Customer will be notified.');
    } catch { addToast('error', 'Failed to update order'); }
    finally { setModalLoading(false); }
  };

  const handleForward = async () => {
    if (!forwardModal || !forwardData.supplier || !forwardData.message) return;
    setModalLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const timeline = [...(forwardModal.statusHistory || []), {
        status: 'processing', date: new Date().toISOString(),
        note: `Escalated to ${forwardData.department || forwardData.supplier} by ${user?.name || 'Admin'}`,
      }];
      await updateOrder(forwardModal.id, { status: 'processing', adminNotes: `Forwarded to: ${forwardData.supplier}`, statusHistory: timeline });
      if (drawerOrder?.id === forwardModal.id) setDrawerOrder({ ...forwardModal, status: 'processing' as any, statusHistory: timeline } as Order);
      setForwardModal(null);
      setForwardData({ supplier: '', department: '', priority: 'Normal', message: '' });
      addToast('success', `Order forwarded to ${forwardData.supplier}`, 'Supplier has been notified.');
    } catch { addToast('error', 'Failed to forward order'); }
    finally { setModalLoading(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'proforma' | 'invoice') => {
    if (!e.target.files?.length || !drawerOrder) return;
    setUploading(type);
    try {
      const url = await uploadFile(e.target.files[0], `orders/${drawerOrder.id}`);
      const data = type === 'proforma' ? { proformaUrl: url } : { invoiceUrl: url };
      await updateOrder(drawerOrder.id, data);
      setDrawerOrder({ ...drawerOrder, ...data } as Order);
      addToast('success', `${type === 'proforma' ? 'Proforma' : 'Invoice'} uploaded`);
    } catch { addToast('error', 'Upload failed'); }
    finally { setUploading(null); e.target.value = ''; }
  };

  // Close context menu on click outside
  useEffect(() => {
    const h = () => setContextMenu(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  /* ════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* ── PAGE HEADER ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Orders</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Manage orders, fulfillment, and supplier forwarding.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>Total Revenue</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>{fmt(totalRevenue)}</p>
        </div>
      </div>

      {/* ── KPI CARDS ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            ...S.card, padding: 'var(--space-5)',
            transition: 'var(--transition-base)', cursor: 'default',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-faint)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
          >
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 var(--space-2)' }}>{k.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: k.color, margin: 0 }} className="ad-fade-in">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── TOOLBAR ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search orders, customers, tracking…"
            style={{
              width: '100%', height: 38,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
              borderRadius: 'var(--radius-md)', padding: '0 var(--space-3) 0 36px',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--text-primary)',
              outline: 'none', transition: 'var(--transition-fast)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          style={{
            height: 38, padding: '0 32px 0 12px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
            borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
            outline: 'none', appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23505A6E' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
          }}
        >
          {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <AdminButton variant="secondary" size="sm" icon={<Download size={14} />}>Export</AdminButton>
      </div>

      {/* ── BULK ACTION BAR ─────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div style={{
          ...S.card, background: 'var(--accent-primary-muted)', border: '1px solid var(--accent-primary)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          animation: 'admin-fade-in 0.2s ease both',
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-primary)' }}>
            {selectedIds.size} selected
          </span>
          <AdminButton variant="ghost" size="xs" icon={<Truck size={14} />}>Mark Shipped</AdminButton>
          <AdminButton variant="ghost" size="xs" icon={<CheckCircle2 size={14} />}>Mark Delivered</AdminButton>
          <AdminButton variant="ghost" size="xs" icon={<Download size={14} />}>Export</AdminButton>
          <span style={{ flex: 1 }} />
          <button onClick={() => setSelectedIds(new Set())} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-link)',
          }}>Clear selection</button>
        </div>
      )}

      {/* ── DATA TABLE ───────────────────────────────────────────────── */}
      <div style={{ ...S.card, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
            <thead>
              <tr style={S.tableHeader}>
                <th style={{ ...S.th, width: 40, textAlign: 'center' }}>
                  <input type="checkbox" checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleAll}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)', cursor: 'pointer' }} />
                </th>
                <th style={{ ...S.th, width: 120 }}>Order ID</th>
                <th style={{ ...S.th, width: 140 }}>Date</th>
                <th style={{ ...S.th, width: 180 }}>Customer</th>
                <th style={{ ...S.th, width: 80, textAlign: 'center' }}>Items</th>
                <th style={{ ...S.th, width: 110, textAlign: 'right' }}>Total</th>
                <th style={{ ...S.th, width: 120, textAlign: 'center' }}>Payment</th>
                <th style={{ ...S.th, width: 140, textAlign: 'center' }}>Status</th>
                <th style={{ ...S.th, width: 100, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(o => {
                const payStatus = (o as any).paymentStatus || (o.status === 'delivered' ? 'paid' : 'pending');
                const isSelected = selectedIds.has(o.id);
                const isHovered = hoveredRow === o.id;
                return (
                  <tr
                    key={o.id}
                    onMouseEnter={() => setHoveredRow(o.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => setDrawerOrder(o)}
                    onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, order: o }); }}
                    style={{
                      height: 52, cursor: 'pointer',
                      borderBottom: '1px solid var(--border-faint)',
                      background: isSelected ? 'var(--accent-primary-muted)' : isHovered ? 'var(--bg-overlay)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    <td style={{ ...S.td, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(o.id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)', cursor: 'pointer' }} />
                    </td>
                    <td style={S.td}>
                      <span
                        style={{ ...S.mono, cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); copyId(o.id); }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-link)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        title="Click to copy"
                      >
                        {copiedId === o.id ? '✓ Copied!' : o.id}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }} title={new Date(o.date).toISOString()}>
                        {relativeTime(o.date)}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div>
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{o.customerName || 'Guest'}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>{o.customerEmail}</p>
                      </div>
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{o.items.length}</span>
                    </td>
                    <td style={S.td}><span style={S.price}>{fmt(o.total)}</span></td>
                    <td style={{ ...S.td, textAlign: 'center' }}><StatusBadge status={mapPaymentStatus(payStatus)} label={getStatusLabel(payStatus)} /></td>
                    <td style={{ ...S.td, textAlign: 'center' }}><StatusBadge status={o.status as any} /></td>
                    <td style={{ ...S.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s' }}>
                        <button onClick={() => setDrawerOrder(o)} style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition-fast)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                          title="View Details"><Eye size={16} /></button>
                        <button onClick={e => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, order: o }); }} style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition-fast)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                          title="More Actions"><MoreHorizontal size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty state */}
          {paginated.length === 0 && (
            <div style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
              <Package size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-4)' }} />
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 var(--space-2)' }}>No orders found</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: 320, margin: '0 auto' }}>Try adjusting your filters or create your first order.</p>
            </div>
          )}
        </div>

        {/* ── PAGINATION ─────────────────────────────────────────────── */}
        {totalPages > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--border-faint)',
          }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Showing <b style={{ color: 'var(--text-primary)' }}>{Math.min((page - 1) * perPage + 1, filtered.length)}</b>–<b style={{ color: 'var(--text-primary)' }}>{Math.min(page * perPage, filtered.length)}</b> of <b style={{ color: 'var(--text-primary)' }}>{filtered.length}</b>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                style={{ height: 30, padding: '0 24px 0 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', outline: 'none', appearance: 'none' }}>
                <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
              </select>
              <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></PageBtn>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{
                  width: 30, height: 30, borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: page === p ? 600 : 400,
                  background: page === p ? 'var(--accent-primary)' : 'transparent',
                  color: page === p ? 'white' : 'var(--text-secondary)',
                  border: 'none', cursor: 'pointer', transition: 'var(--transition-fast)',
                }}>{p}</button>
              ))}
              <PageBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></PageBtn>
            </div>
          </div>
        )}
      </div>

      {/* ── CONTEXT MENU ─────────────────────────────────────────────── */}
      {contextMenu && (
        <div style={{
          position: 'fixed', left: contextMenu.x, top: contextMenu.y,
          zIndex: 'var(--z-dropdown)' as any,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
          minWidth: 220, padding: 'var(--space-1)',
          animation: 'admin-fade-in 0.15s ease both',
        }}>
          <CtxItem icon={<Eye size={16} />} label="View Details" onClick={() => { setDrawerOrder(contextMenu.order); setContextMenu(null); }} />
          <CtxItem icon={<Edit3 size={16} />} label="Edit Order" onClick={() => { setDrawerOrder(contextMenu.order); setContextMenu(null); }} />
          <CtxItem icon={<ClipboardCopy size={16} />} label="Duplicate Order" onClick={() => { addToast('info', 'Order duplicated'); setContextMenu(null); }} />
          <div style={{ height: 1, background: 'var(--border-faint)', margin: '4px 0' }} />
          <CtxItem icon={<Truck size={16} />} label="Mark as Shipped" onClick={() => { setFulfillModal(contextMenu.order); setContextMenu(null); }} />
          <CtxItem icon={<CheckCircle2 size={16} />} label="Mark as Delivered" onClick={() => { advanceStatus(contextMenu.order); setContextMenu(null); }} />
          <CtxItem icon={<Send size={16} />} label="Forward Order" onClick={() => { setForwardModal(contextMenu.order); setContextMenu(null); }} />
          <div style={{ height: 1, background: 'var(--border-faint)', margin: '4px 0' }} />
          <CtxItem icon={<Download size={16} />} label="Export as PDF" onClick={() => { addToast('info', 'Exporting…'); setContextMenu(null); }} />
          <CtxItem icon={<Mail size={16} />} label="Resend Confirmation" onClick={() => { addToast('success', 'Email sent'); setContextMenu(null); }} />
          <CtxItem icon={<Flag size={16} />} label="Flag Order" onClick={() => { addToast('warning', 'Order flagged for review'); setContextMenu(null); }} />
          <div style={{ height: 1, background: 'var(--border-faint)', margin: '4px 0' }} />
          <CtxItem icon={<Trash2 size={16} />} label="Delete Order" danger onClick={() => { setConfirmDelete(contextMenu.order); setContextMenu(null); }} />
        </div>
      )}

      {/* ── ORDER DETAIL DRAWER ──────────────────────────────────────── */}
      <Drawer
        open={!!drawerOrder && !fulfillModal && !forwardModal && !confirmDelete}
        onClose={() => setDrawerOrder(null)}
        title={drawerOrder ? `Order ${drawerOrder.id}` : ''}
        width={580}
        footer={drawerOrder && !isViewer && drawerOrder.status !== 'delivered' && drawerOrder.status !== 'cancelled' ? (
          <>
            {['pending', 'confirmed', 'processing'].includes(drawerOrder.status) && (
              <AdminButton variant="primary" icon={<Truck size={14} />} onClick={() => setFulfillModal(drawerOrder)}>Ship Order</AdminButton>
            )}
            {['pending', 'confirmed'].includes(drawerOrder.status) && (
              <AdminButton variant="secondary" icon={<Send size={14} />} onClick={() => setForwardModal(drawerOrder)}>Forward</AdminButton>
            )}
            <AdminButton variant="ghost" icon={<ArrowRight size={14} />} onClick={() => advanceStatus(drawerOrder)}>Advance</AdminButton>
          </>
        ) : undefined}
      >
        {drawerOrder && (
          <div>
            {/* Status + Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              <StatusBadge status={drawerOrder.status as any} size="md" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {new Date(drawerOrder.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {/* Status Stepper §15.5 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
              {statusFlow.map((s, i) => {
                const currentIdx = statusFlow.indexOf(drawerOrder.status);
                const done = i <= currentIdx;
                const current = i === currentIdx;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < statusFlow.length - 1 ? 1 : undefined }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: done ? 'var(--accent-primary)' : 'transparent',
                      border: done ? 'none' : '2px solid var(--border-default)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: current ? '0 0 0 4px var(--accent-primary-glow)' : 'none',
                      transition: 'var(--transition-base)', flexShrink: 0,
                    }}>
                      {done && <CheckCircle2 size={14} style={{ color: 'white' }} />}
                    </div>
                    {i < statusFlow.length - 1 && (
                      <div style={{ flex: 1, height: 2, marginLeft: 4, marginRight: 4, background: done && i < currentIdx ? 'var(--accent-primary)' : 'var(--border-dim)', transition: 'var(--transition-base)' }} />
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)', marginTop: -16 }}>
              {statusFlow.map((s, i) => {
                const currentIdx = statusFlow.indexOf(drawerOrder.status);
                return <span key={s} style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: i <= currentIdx ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: i === currentIdx ? 600 : 400, textAlign: 'center', flex: 1 }}>{getStatusLabel(s)}</span>;
              })}
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p style={S.sectionLabel}>Line Items</p>
              <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-faint)', overflow: 'hidden' }}>
                {drawerOrder.items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    borderBottom: i < drawerOrder.items.length - 1 ? '1px solid var(--border-faint)' : 'none',
                    background: 'var(--bg-elevated)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)',
                      }}>{item.quantity}×</span>
                      <div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{item.name}</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>{fmt(item.price)} / unit</p>
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--text-primary)' }}>{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ ...S.card, padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <p style={{ ...S.sectionLabel, margin: '0 0 var(--space-3)' }}>Financial Summary</p>
              {[
                { l: 'Subtotal', v: drawerOrder.items.reduce((s, i) => s + i.price * i.quantity, 0) },
                { l: 'Shipping', v: (drawerOrder as any).shippingCost || 0 },
                { l: 'Tax', v: 0 },
              ].map(r => (
                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{r.l}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{fmt(r.v)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border-faint)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(drawerOrder.total)}</span>
              </div>
            </div>

            {/* Customer + Shipping in 2 cols */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div style={{ ...S.card, padding: 'var(--space-4)' }}>
                <p style={{ ...S.sectionLabel, margin: '0 0 var(--space-2)', display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> Customer</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{drawerOrder.customerName || 'Unknown'}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{drawerOrder.customerEmail}</p>
                {drawerOrder.phone && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{drawerOrder.phone}</p>}
              </div>
              <div style={{ ...S.card, padding: 'var(--space-4)' }}>
                <p style={{ ...S.sectionLabel, margin: '0 0 var(--space-2)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> Shipping</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', margin: 0 }}>{drawerOrder.shippingAddress || 'Not provided'}</p>
                {drawerOrder.carrier && <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Carrier: {drawerOrder.carrier}</p>}
                {drawerOrder.trackingNumber && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-link)', margin: '2px 0 0' }}>Tracking: {drawerOrder.trackingNumber}</p>}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p style={S.sectionLabel}>Internal Notes</p>
              <textarea
                rows={3}
                placeholder="Add internal notes…"
                value={drawerOrder.notes || ''}
                disabled={isViewer}
                onChange={e => {
                  updateOrder(drawerOrder.id, { notes: e.target.value });
                  setDrawerOrder({ ...drawerOrder, notes: e.target.value });
                }}
                style={{
                  width: '100%', padding: 'var(--space-3)', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                  outline: 'none', resize: 'vertical', minHeight: 72,
                }}
              />
            </div>

            {/* Timeline */}
            {(drawerOrder.statusHistory || []).length > 0 && (
              <div>
                <p style={{ ...S.sectionLabel, display: 'flex', alignItems: 'center', gap: 4 }}><History size={12} /> Timeline</p>
                <div>
                  {(drawerOrder.statusHistory || []).slice().reverse().map((entry, i) => (
                    <div key={i} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                          background: i === 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                        }} />
                        {i < (drawerOrder.statusHistory || []).length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border-dim)', margin: '4px 0' }} />}
                      </div>
                      <div style={{ paddingBottom: 'var(--space-4)' }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>{entry.note || getStatusLabel(entry.status)}</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{new Date(entry.date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── FULFILL MODAL ────────────────────────────────────────────── */}
      <Modal
        open={!!fulfillModal}
        onClose={() => setFulfillModal(null)}
        title={`Ship Order ${fulfillModal?.id || ''}`}
        subtitle="Enter shipping details to mark this order as fulfilled."
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setFulfillModal(null)}>Cancel</AdminButton>
            <AdminButton variant="primary" loading={modalLoading} disabled={!fulfillData.carrier || !fulfillData.trackingNumber}
              icon={<Truck size={14} />} onClick={handleFulfill}>Mark as Shipped</AdminButton>
          </>
        }
      >
        <AdminSelect label="Carrier" required value={fulfillData.carrier} onChange={e => setFulfillData({ ...fulfillData, carrier: e.target.value })}
          options={[
            { value: '', label: 'Select carrier…' },
            { value: 'Vitorra Express', label: 'Vitorra Express' },
            { value: 'DHL', label: 'DHL' }, { value: 'FedEx', label: 'FedEx' },
            { value: 'UPS', label: 'UPS' }, { value: 'Warehouse Pickup', label: 'Warehouse Pickup' },
          ]} />
        <AdminInput label="Tracking Number" required placeholder="e.g. VIT-TRK-00001"
          value={fulfillData.trackingNumber} onChange={e => setFulfillData({ ...fulfillData, trackingNumber: e.target.value })} />
      </Modal>

      {/* ── FORWARD MODAL §15.8 ──────────────────────────────────────── */}
      <Modal
        open={!!forwardModal}
        onClose={() => setForwardModal(null)}
        title={`Forward Order ${forwardModal?.id || ''}`}
        subtitle="Send order data to a supplier or team for fulfillment."
        size="large"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setForwardModal(null)}>Cancel</AdminButton>
            <AdminButton variant="primary" loading={modalLoading} disabled={!forwardData.supplier || !forwardData.message}
              icon={<Send size={14} />} onClick={handleForward}>Forward Order</AdminButton>
          </>
        }
      >
        {/* Items summary */}
        {forwardModal && (
          <div style={{ ...S.card, padding: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            {forwardModal.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--text-primary)' }}>{item.quantity}× {item.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{fmt(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <AdminSelect label="Supplier / Vendor" required value={forwardData.supplier}
            onChange={e => setForwardData({ ...forwardData, supplier: e.target.value })}
            options={[
              { value: '', label: 'Select supplier…' },
              { value: 'SEAL Industries', label: 'SEAL Industries' },
              { value: 'Vitorra Agri-Division', label: 'Vitorra Agri-Division' },
              { value: 'FET Partner Network', label: 'FET Partner Network' },
              { value: 'External Vendor', label: 'External Vendor' },
            ]} />
          <AdminSelect label="Department" value={forwardData.department}
            onChange={e => setForwardData({ ...forwardData, department: e.target.value })}
            options={[
              { value: '', label: 'Select department…' },
              { value: 'Support', label: 'Support' }, { value: 'Warehouse', label: 'Warehouse' },
              { value: 'Finance', label: 'Finance' }, { value: 'Logistics', label: 'Logistics' },
            ]} />
        </div>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Priority</p>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {['Low', 'Normal', 'High', 'Urgent'].map(p => (
              <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="radio" name="priority" value={p} checked={forwardData.priority === p}
                  onChange={e => setForwardData({ ...forwardData, priority: e.target.value })}
                  style={{ accentColor: p === 'Urgent' ? 'var(--danger)' : 'var(--accent-primary)' }} />
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
                  color: p === 'Urgent' ? 'var(--danger)' : 'var(--text-primary)',
                }}>{p}</span>
              </label>
            ))}
          </div>
        </div>
        <AdminTextarea label="Message" required placeholder="Provide context for the recipient…"
          value={forwardData.message} onChange={e => setForwardData({ ...forwardData, message: e.target.value })} />
      </Modal>

      {/* ── DELETE CONFIRMATION ───────────────────────────────────────── */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Order"
        subtitle={`Are you sure you want to delete order ${confirmDelete?.id}? This action cannot be undone.`}
        size="compact"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</AdminButton>
            <AdminButton variant="danger" icon={<Trash2 size={14} />} onClick={() => {
              addToast('success', 'Order deleted');
              setConfirmDelete(null);
            }}>Delete Order</AdminButton>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
          <AlertTriangle size={40} style={{ color: 'var(--danger)', margin: '0 auto var(--space-3)' }} />
        </div>
      </Modal>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */
function PageBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 30, height: 30, borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-dim)', background: 'transparent',
      color: disabled ? 'var(--text-tertiary)' : 'var(--text-secondary)',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.3 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'var(--transition-fast)',
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >{children}</button>
  );
}

function CtxItem({ icon, label, danger, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', height: 36, display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      padding: '0 var(--space-4)', border: 'none',
      borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer',
      fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 400,
      color: danger ? 'var(--danger)' : 'var(--text-primary)',
      transition: 'var(--transition-fast)',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'var(--danger-muted)' : 'var(--bg-overlay)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ color: danger ? 'var(--danger)' : 'var(--text-secondary)', display: 'flex', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
}

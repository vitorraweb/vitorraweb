import { useState } from 'react';
import { useCMS, Customer } from '../../../context/CMSContext';
import { useAuth } from '../../../context/AuthContext';
import {
  Search, Plus, X, UserCheck, UserX, Edit3, Trash2, ChevronDown, ChevronRight,
  Check, Package, DollarSign, Phone, Mail, MapPin, Building2, TrendingUp,
  History, ShieldCheck, FileText, Eye, Copy, Users
} from 'lucide-react';

export default function CustomersManager() {
  const { user } = useAuth();
  const { state, addCustomer, updateCustomer, removeCustomer } = useCMS();
  const isViewer = user?.role === 'Viewer';
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'b2b' | 'b2c'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  const emptyForm: Partial<Customer> = { name: '', email: '', phone: '', role: 'b2c', companyName: '', status: 'active', totalOrders: 0, totalSpent: 0, address: '', notes: '' };
  const [formData, setFormData] = useState<Partial<Customer>>(emptyForm);

  const formatPrice = (n: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

  const filtered = state.customers.filter(c => {
    const s = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || (c.companyName || '').toLowerCase().includes(s);
    const matchRole = filterRole === 'all' || c.role === filterRole;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const totalRevenue = state.customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
  const activeCustomers = state.customers.filter(c => c.status === 'active').length;
  const b2bCount = state.customers.filter(c => c.role === 'b2b').length;
  const avgLTV = state.customers.length > 0 ? totalRevenue / state.customers.length : 0;

  const startEdit = (c: Customer) => { setFormData({ ...c }); setEditingId(c.id); setShowForm(true); };
  const cancelForm = () => { setShowForm(false); setEditingId(null); setFormData(emptyForm); };

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

  // Styles
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
    fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 8,
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 14px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
    borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-base)', color: 'var(--text-primary)', outline: 'none',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ═══ Header ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Customer CRM</h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Deep insights into customer relationships, lifetime value, and order history.
          </p>
        </div>
        {!isViewer && (
          <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }} style={{
            padding: '10px 24px', background: 'var(--accent-primary)', color: 'white',
            borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 700,
            fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(198,137,88,0.3)', transition: 'var(--transition-fast)',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-primary)'}
          ><Plus size={16} /> Add Key Partner</button>
        )}
      </div>

      {/* ═══ Metrics ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { value: activeCustomers, label: 'Active Members', color: 'var(--success)', icon: <UserCheck size={18} /> },
          { value: b2bCount, label: 'B2B Partners', color: '#4AB4FF', icon: <Building2 size={18} /> },
          { value: formatPrice(totalRevenue), label: 'Total LTV', color: 'var(--accent-primary)', icon: <TrendingUp size={18} /> },
          { value: formatPrice(avgLTV), label: 'Avg. LTV', color: 'var(--text-primary)', icon: <DollarSign size={18} /> },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
            display: 'flex', alignItems: 'center', gap: 14, transition: 'var(--transition-fast)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-faint)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: m.color,
            }}>{m.icon}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: typeof m.value === 'string' ? 'var(--text-md)' : 'var(--text-xl)', fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{m.label}</div>
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
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, or company..."
            style={{ ...inputStyle, paddingLeft: 36, height: 36, fontSize: 'var(--text-sm)' }} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-dim)' }}>
          {(['all', 'b2b', 'b2c'] as const).map(r => (
            <button key={r} onClick={() => setFilterRole(r)} style={{
              padding: '4px 12px', borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: filterRole === r ? 600 : 400,
              border: 'none', cursor: 'pointer', textTransform: 'uppercase',
              background: filterRole === r ? 'var(--accent-primary)' : 'transparent',
              color: filterRole === r ? 'white' : 'var(--text-secondary)',
              transition: 'var(--transition-fast)',
            }}>{r === 'all' ? 'All' : r}</button>
          ))}
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{
          ...selectStyle, width: 'auto', height: 36, fontSize: 'var(--text-xs)', padding: '0 12px',
        }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* ═══ Customer Form Modal ═══ */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 70,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        }} onClick={cancelForm}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 680, background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)',
            padding: '32px 36px', position: 'relative', overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40, width: 200, height: 200,
              background: 'rgba(198,137,88,0.06)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative', zIndex: 10 }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  {editingId ? 'Edit Customer Profile' : 'New Customer Profile'}
                </h4>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>Register a new customer or update existing details.</p>
              </div>
              <button onClick={cancelForm} style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
                borderRadius: 'var(--radius-md)', width: 34, height: 34, cursor: 'pointer', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 10 }}>
              <SectionHeader icon={<Users size={13} />} title="Contact Information" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+256 700 000 000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Segment</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} style={selectStyle}>
                    <option value="b2c">Retail (B2C)</option><option value="b2b">Wholesale (B2B)</option>
                  </select>
                </div>
              </div>

              <SectionHeader icon={<Building2 size={13} />} title="Business Details" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>{formData.role === 'b2b' ? 'Company / Organization' : 'Optional Tag'}</label>
                  <input value={formData.companyName || ''} onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Acme Corp" style={inputStyle} />
                </div>
                {formData.role === 'b2b' && (
                  <div>
                    <label style={{ ...labelStyle, color: 'var(--accent-primary)' }}>Tax ID / TIN</label>
                    <input value={(formData as any).taxId || ''} onChange={e => setFormData({ ...formData, taxId: e.target.value } as any)}
                      placeholder="e.g. TIN-9988-77" style={{ ...inputStyle, borderColor: 'rgba(198,137,88,0.25)' }} />
                  </div>
                )}
              </div>

              <SectionHeader icon={<MapPin size={13} />} title="Address" />
              <div style={{ marginBottom: 20 }}>
                <input value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full physical address" style={inputStyle} />
              </div>

              <SectionHeader icon={<FileText size={13} />} title="Internal Notes" />
              <div style={{ marginBottom: 24 }}>
                <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal annotations about this customer..." rows={3}
                  style={{ ...inputStyle, height: 'auto', padding: 14, resize: 'vertical', minHeight: 72 } as any} />
              </div>

              <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border-faint)' }}>
                <button type="submit" style={{
                  flex: 1, padding: '12px 0', background: 'var(--accent-primary)', color: 'white',
                  borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 700,
                  fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(198,137,88,0.3)',
                }}>{editingId ? 'Update Profile' : 'Register Customer'}</button>
                <button type="button" onClick={cancelForm} style={{
                  padding: '12px 24px', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ DATA TABLE ═══ */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '48px 1fr 120px 120px 110px 100px 120px',
          padding: '10px 20px', borderBottom: '1px solid var(--border-dim)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700,
          color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em',
          background: 'var(--bg-elevated)',
        }}>
          <span />
          <span>Customer</span>
          <span>Segment</span>
          <span style={{ textAlign: 'right' }}>LTV</span>
          <span style={{ textAlign: 'center' }}>Orders</span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        {filtered.map(c => {
          const isExp = expandedCustomer === c.id;
          return (
            <div key={c.id} style={{ borderBottom: '1px solid var(--border-faint)' }}>
              {/* Row */}
              <div
                onClick={() => setExpandedCustomer(isExp ? null : c.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '48px 1fr 120px 120px 110px 100px 120px',
                  padding: '12px 20px', alignItems: 'center', cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: c.status === 'active' ? 'var(--success-muted)' : 'var(--danger-muted)',
                  color: c.status === 'active' ? 'var(--success)' : 'var(--danger)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 700,
                  border: `1px solid ${c.status === 'active' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                }}>{c.name.charAt(0)}</div>

                {/* Name + contact */}
                <div style={{ minWidth: 0, paddingRight: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                    {(c as any).taxId && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 5px',
                        borderRadius: 'var(--radius-full)', fontSize: '8px', fontWeight: 800,
                        background: 'var(--success-muted)', color: 'var(--success)', border: '1px solid var(--success-border)',
                        textTransform: 'uppercase',
                      }}><ShieldCheck size={8} /> VETTED</span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.email} {c.companyName ? `• ${c.companyName}` : ''}
                  </div>
                </div>

                {/* Segment */}
                <div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase',
                    background: c.role === 'b2b' ? 'var(--info-muted)' : 'var(--success-muted)',
                    color: c.role === 'b2b' ? 'var(--info)' : 'var(--success)',
                    border: `1px solid ${c.role === 'b2b' ? 'var(--info-border)' : 'var(--success-border)'}`,
                  }}>{c.role}</span>
                </div>

                {/* LTV */}
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {formatPrice(c.totalSpent || 0)}
                </div>

                {/* Orders */}
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {c.totalOrders}
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase',
                    background: c.status === 'active' ? 'var(--success-muted)' : 'var(--danger-muted)',
                    color: c.status === 'active' ? 'var(--success)' : 'var(--danger)',
                  }}>{c.status}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  {!isViewer && (
                    <>
                      <ActionBtn onClick={e => { e.stopPropagation(); startEdit(c); }} title="Edit" hoverColor="var(--accent-primary)"><Edit3 size={14} /></ActionBtn>
                      <ActionBtn onClick={e => { e.stopPropagation(); updateCustomer(c.id, { status: c.status === 'active' ? 'suspended' : 'active' }); }} title={c.status === 'active' ? 'Suspend' : 'Activate'} hoverColor={c.status === 'active' ? 'var(--danger)' : 'var(--success)'}>{c.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}</ActionBtn>
                    </>
                  )}
                  <div style={{ width: 1, height: 16, background: 'var(--border-dim)', margin: '0 2px' }} />
                  <div style={{ color: isExp ? 'var(--accent-primary)' : 'var(--text-tertiary)', display: 'flex' }}>
                    {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>
              </div>

              {/* ── Expanded Detail Panel ── */}
              {isExp && (
                <div style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-faint)', padding: '20px 24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
                    {/* Profile details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <DetailLabel>Entity Credentials</DetailLabel>
                      <InfoRow icon={<Mail size={13} />} label="Email" value={c.email} />
                      <InfoRow icon={<Phone size={13} />} label="Phone" value={c.phone || 'N/A'} />
                      <InfoRow icon={<MapPin size={13} />} label="Address" value={c.address || 'Not provided'} />
                      {c.companyName && <InfoRow icon={<Building2 size={13} />} label="Company" value={c.companyName} />}
                      {(c as any).taxId && <InfoRow icon={<ShieldCheck size={13} />} label="Tax ID" value={(c as any).taxId} accent />}
                      <InfoRow icon={<History size={13} />} label="Joined" value={c.joinDate || '—'} />

                      {c.notes && (
                        <div style={{ marginTop: 8 }}>
                          <DetailLabel>Internal Notes</DetailLabel>
                          <p style={{
                            fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
                            fontStyle: 'italic', padding: 12, background: 'var(--bg-surface)',
                            border: '1px dashed var(--border-dim)', borderRadius: 'var(--radius-md)',
                            margin: 0, lineHeight: 1.6,
                          }}>{c.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Order History */}
                    <div>
                      <DetailLabel>Transaction History ({(c.orders || []).length})</DetailLabel>
                      {(c.orders || []).length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(c.orders || []).map(o => (
                            <div key={o.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
                              borderRadius: 'var(--radius-md)', transition: 'var(--transition-fast)',
                            }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-dim)'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-faint)'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                                  background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'var(--text-tertiary)',
                                }}><Package size={14} /></div>
                                <div>
                                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>{o.id}</div>
                                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>{o.date} • {o.items.length} item(s) • <span style={{ textTransform: 'capitalize' }}>{o.status}</span></div>
                                </div>
                              </div>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {formatPrice(o.total)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          textAlign: 'center', padding: '40px 16px',
                          border: '1px dashed var(--border-dim)', borderRadius: 'var(--radius-md)',
                        }}>
                          <History size={24} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px', opacity: 0.3 }} />
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>No transactions recorded yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)',
          }}>No customers match your filters.</div>
        )}
      </div>
    </div>
  );
}

/* ═══ HELPER COMPONENTS ═══ */
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
      color: 'var(--accent-primary)', marginBottom: 12, paddingBottom: 8,
      borderBottom: '1px solid var(--border-faint)',
    }}>{icon} {title}</div>
  );
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
      color: 'var(--text-tertiary)', marginBottom: 8,
    }}>{children}</div>
  );
}

function InfoRow({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
      background: accent ? 'var(--success-muted)' : 'var(--bg-surface)',
      border: `1px solid ${accent ? 'var(--success-border)' : 'var(--border-faint)'}`,
      borderRadius: 'var(--radius-md)',
    }}>
      <div style={{ color: accent ? 'var(--success)' : 'var(--accent-primary)', display: 'flex', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: accent ? 'var(--success)' : 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, title, hoverColor }: {
  children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title: string; hoverColor?: string;
}) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 32, height: 32, borderRadius: 'var(--radius-md)',
      background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
      cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', transition: 'var(--transition-fast)',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.color = hoverColor || 'var(--text-primary)';
        e.currentTarget.style.borderColor = hoverColor || 'var(--border-strong)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text-tertiary)';
        e.currentTarget.style.borderColor = 'var(--border-dim)';
      }}
    >{children}</button>
  );
}

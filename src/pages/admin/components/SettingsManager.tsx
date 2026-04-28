import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCMS } from '../../../context/CMSContext';
import { db, functions as fbFunctions, auth as fbAuth } from '../../../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import {
  Globe, Truck, DollarSign, FileText, ShoppingCart, Trash2, Building2,
  CreditCard, Clock, Shield, Users, Phone, Mail, MapPin, Landmark,
  Hash, AlertTriangle, CheckCircle2, ChevronRight, Copy, Eye, EyeOff,
  KeyRound, Loader2, RefreshCw,
} from 'lucide-react';

const S = {
  card: { background: 'var(--bg-surface)', border: '1px solid var(--border-faint)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--space-5)' } as React.CSSProperties,
  label: { fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' } as React.CSSProperties,
  input: { width: '100%', height: 38, padding: '0 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', outline: 'none' } as React.CSSProperties,
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
  sectionIcon: { color: 'var(--accent-primary)', display: 'flex' } as React.CSSProperties,
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' } as React.CSSProperties,
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' } as React.CSSProperties,
  hint: { fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', marginTop: 2 } as React.CSSProperties,
};

type SettingsTab = 'general' | 'quoting' | 'banking' | 'invoicing' | 'logistics' | 'tax';

export default function SettingsManager() {
  const { user } = useAuth();
  const { state: { settings }, updateSettings } = useCMS();
  const isViewer = user?.role === 'Viewer';
  const [tab, setTab] = useState<SettingsTab>('general');
  const [showAccount, setShowAccount] = useState(false);
  const [saved, setSaved] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [inviteData, setInviteData] = useState({ displayName: '', email: '', role: 'Viewer', tempPassword: '' });
  const [teamError, setTeamError] = useState('');
  const [liveTeam, setLiveTeam] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [resetSent, setResetSent] = useState('');

  // Load real admin users from Firestore
  useEffect(() => {
    if (!db) { setTeamLoading(false); return; }
    const adminRoles = ['admin', 'Super Admin', 'Ops Manager', 'Viewer'];
    const q = query(collection(db, 'users'), where('role', 'in', adminRoles));
    const unsub = onSnapshot(q, (snap) => {
      const members = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      members.sort((a: any, b: any) => {
        const order: Record<string, number> = { 'admin': 0, 'Super Admin': 1, 'Ops Manager': 2, 'Viewer': 3 };
        return (order[a.role] ?? 99) - (order[b.role] ?? 99);
      });
      setLiveTeam(members);
      setTeamLoading(false);
    }, () => setTeamLoading(false));
    return () => unsub();
  }, []);

  const handleUpdate = (path: string, value: any) => {
    const keys = path.split('.');
    const s = JSON.parse(JSON.stringify(settings));
    let c: any = s;
    for (let i = 0; i < keys.length - 1; i++) { if (!c[keys[i]]) c[keys[i]] = {}; c = c[keys[i]]; }
    c[keys[keys.length - 1]] = value;
    updateSettings(s);
    setSaved(path); setTimeout(() => setSaved(''), 1500);
  };

  const Field = ({ label, path, hint, mono, type, disabled: d }: { label: string; path: string; hint?: string; mono?: boolean; type?: string; disabled?: boolean }) => {
    const keys = path.split('.');
    let val: any = settings;
    for (const k of keys) val = val?.[k];
    return (
      <div>
        <label style={S.label}>{label}</label>
        <input type={type || 'text'} style={{ ...S.input, ...(mono ? { fontFamily: 'var(--font-mono)' } : {}) }}
          defaultValue={val ?? ''} disabled={isViewer || d}
          onBlur={e => handleUpdate(path, type === 'number' ? Number(e.target.value) : e.target.value)} />
        {hint && <p style={S.hint}>{hint}</p>}
        {saved === path && <p style={{ ...S.hint, color: 'var(--success)' }}>✓ Saved</p>}
      </div>
    );
  };

  const Toggle = ({ label, path, hint }: { label: string; path: string; hint?: string }) => {
    const keys = path.split('.');
    let val: any = settings;
    for (const k of keys) val = val?.[k];
    const active = !!val;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-faint)' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
          {hint && <p style={{ ...S.hint, margin: '2px 0 0' }}>{hint}</p>}
        </div>
        <button disabled={isViewer} onClick={() => handleUpdate(path, !active)} style={{
          width: 44, height: 24, borderRadius: 'var(--radius-full)', position: 'relative', border: 'none', cursor: 'pointer',
          background: active ? 'var(--accent-primary)' : 'var(--bg-subtle)', transition: 'var(--transition-base)',
        }}>
          <span style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: 'var(--shadow-sm)', left: active ? 23 : 3, transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
        </button>
      </div>
    );
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'Company', icon: <Globe size={14} /> },
    { id: 'quoting', label: 'Quotes & Orders', icon: <ShoppingCart size={14} /> },
    { id: 'banking', label: 'Bank Details', icon: <Landmark size={14} /> },
    { id: 'invoicing', label: 'Invoicing', icon: <FileText size={14} /> },
    { id: 'logistics', label: 'Logistics', icon: <Truck size={14} /> },
    { id: 'tax', label: 'Tax & System', icon: <DollarSign size={14} /> },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Settings</h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Configure your business operations, payments, and system preferences.</p>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-faint)', borderRadius: 'var(--radius-md)', padding: 4, width: 'fit-content', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
            borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)', fontWeight: tab === t.id ? 600 : 400, border: 'none', cursor: 'pointer',
            background: tab === t.id ? 'var(--accent-primary)' : 'transparent',
            color: tab === t.id ? 'white' : 'var(--text-secondary)', transition: 'var(--transition-fast)',
          }}>{t.icon}{t.label}</button>
        ))}
      </div>

      {/* ═══ COMPANY ═══ */}
      {tab === 'general' && (<>
        <div style={S.card}>
          <h3 style={S.sectionTitle}><span style={S.sectionIcon}><Building2 size={18} /></span> Company Identity</h3>
          <div style={S.grid2}>
            <Field label="Company Name" path="general.companyName" />
            <Field label="Tagline" path="general.companyTagline" hint="Shown on documents and emails" />
            <Field label="Registration Number" path="general.registrationNumber" mono hint="Company reg / incorporation #" />
            <Field label="Website" path="general.website" />
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.sectionTitle}><span style={S.sectionIcon}><Phone size={18} /></span> Contact Details</h3>
          <div style={S.grid2}>
            <Field label="Support Email" path="general.supportEmail" />
            <Field label="Support Phone" path="general.supportPhone" />
            <Field label="WhatsApp" path="general.whatsapp" />
            <Field label="Business Hours" path="general.businessHours" />
          </div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Field label="Address" path="general.address" />
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.sectionTitle}><span style={S.sectionIcon}><span style={{ width: 18, height: 18, borderRadius: 'var(--radius-sm)', background: settings.general.brandColor || '#CFB53B', display: 'inline-block' }} /></span> Branding</h3>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>Brand Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: settings.general.brandColor || '#CFB53B', border: '1px solid var(--border-dim)' }} />
                <input style={{ ...S.input, fontFamily: 'var(--font-mono)' }} value={settings.general.brandColor} onChange={e => handleUpdate('general.brandColor', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ ...S.sectionTitle, margin: 0 }}><span style={S.sectionIcon}><Users size={18} /></span> Team Members</h3>
            {!isViewer && <button onClick={() => { setInviteOpen(true); setInviteResult(null); setTeamError(''); setInviteData({ displayName: '', email: '', role: 'Viewer', tempPassword: '' }); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-primary)' }}>+ Invite Member</button>}
          </div>

          {/* Invite Modal */}
          {inviteOpen && (
            <div style={{ padding: 'var(--space-5)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent-primary)', marginBottom: 'var(--space-4)' }}>
              {inviteResult ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
                    <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--success)' }}>Member Invited Successfully</span>
                  </div>
                  <div style={{ padding: 'var(--space-3)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-faint)', marginBottom: 'var(--space-3)' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '0 0 4px' }}>Email: <strong style={{ color: 'var(--text-primary)' }}>{inviteResult.email}</strong></p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>Temporary Password: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{inviteResult.tempPassword}</strong></p>
                      <button onClick={() => { navigator.clipboard.writeText(inviteResult.tempPassword); }}
                        style={{ background: 'none', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '2px 6px', color: 'var(--text-tertiary)', display: 'flex' }}><Copy size={12} /></button>
                    </div>
                  </div>
                  <p style={{ ...S.hint, color: 'var(--warning)', marginBottom: 'var(--space-3)' }}>
                    <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Share these credentials securely. The member should change their password on first login.
                  </p>
                  <button onClick={() => { setInviteOpen(false); setInviteResult(null); }}
                    style={{ padding: '6px 16px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Done</button>
                </div>
              ) : (
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--space-4)' }}>Invite Team Member</p>
                  {teamError && <div style={{ padding: 'var(--space-3)', background: 'var(--danger-muted)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} />{teamError}</div>}
                  <div style={S.grid2}>
                    <div><label style={S.label}>Full Name *</label><input style={S.input} placeholder="e.g. John Doe" value={inviteData.displayName} onChange={e => setInviteData({ ...inviteData, displayName: e.target.value })} /></div>
                    <div><label style={S.label}>Email Address *</label><input style={S.input} type="email" placeholder="john@vitorra.com" value={inviteData.email} onChange={e => setInviteData({ ...inviteData, email: e.target.value })} /></div>
                    <div><label style={S.label}>Role *</label>
                      <select style={S.input} value={inviteData.role} onChange={e => setInviteData({ ...inviteData, role: e.target.value })}>
                        <option value="Super Admin">Super Admin — Full access</option>
                        <option value="Ops Manager">Ops Manager — Orders & logistics</option>
                        <option value="Viewer">Viewer — Read-only access</option>
                      </select>
                    </div>
                    <div><label style={S.label}>Temp Password <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span></label><input style={{ ...S.input, fontFamily: 'var(--font-mono)' }} type="text" placeholder="Auto-generated if empty" value={inviteData.tempPassword} onChange={e => setInviteData({ ...inviteData, tempPassword: e.target.value })} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-4)' }}>
                    <button disabled={inviteLoading || !inviteData.displayName || !inviteData.email} onClick={async () => {
                      if (!fbFunctions) { setTeamError('Firebase Functions not available.'); return; }
                      setInviteLoading(true); setTeamError('');
                      try {
                        const fn = httpsCallable(fbFunctions, 'inviteTeamMember');
                        const res = await fn(inviteData) as any;
                        setInviteResult({ email: res.data.email, tempPassword: res.data.tempPassword });
                      } catch (err: any) {
                        setTeamError(err.message || 'Failed to invite member.');
                      } finally { setInviteLoading(false); }
                    }} style={{ padding: '8px 20px', background: inviteLoading ? 'var(--bg-subtle)' : 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: inviteLoading ? 'wait' : 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {inviteLoading && <span className="ad-spinner dark" style={{ width: 14, height: 14, borderWidth: 2 }} />}
                      {inviteLoading ? 'Creating…' : 'Create & Invite'}
                    </button>
                    <button onClick={() => setInviteOpen(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Team list — live from Firestore */}
          {teamLoading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <Loader2 size={24} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 8 }}>Loading team from Firebase…</p>
            </div>
          ) : liveTeam.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>
              <Users size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', margin: 0 }}>No admin users found. Invite your first team member above.</p>
            </div>
          ) : liveTeam.map((m: any) => {
            const isSelf = m.uid === user?.id;
            const isActive = m.status !== 'suspended';
            const statusColor = isActive ? 'var(--success)' : 'var(--danger)';
            const lastLogin = m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never';
            return (
              <div key={m.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: `1px solid ${isSelf ? 'var(--accent-primary)' : 'var(--border-faint)'}`, marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: isSelf ? 'var(--accent-primary)' : 'var(--accent-primary-muted)', color: isSelf ? 'white' : 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 700, flexShrink: 0 }}>
                    {(m.displayName || m.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{m.displayName || 'Unnamed'}</span>
                      {isSelf && <span style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--accent-primary-muted)', padding: '1px 6px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase' }}>You</span>}
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{m.email}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--text-tertiary)', margin: '1px 0 0' }}>Last login: {lastLogin}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {/* Password Reset */}
                  {!isViewer && !isSelf && (
                    <button onClick={async () => {
                      if (!fbAuth || !m.email) return;
                      try {
                        await sendPasswordResetEmail(fbAuth, m.email);
                        setResetSent(m.uid);
                        setTimeout(() => setResetSent(''), 3000);
                      } catch (err) { console.warn('Reset failed:', err); }
                    }} title="Send password reset email" style={{ background: 'none', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', cursor: 'pointer', padding: '4px 8px', color: resetSent === m.uid ? 'var(--success)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-body)' }}>
                      {resetSent === m.uid ? <><CheckCircle2 size={12} /> Sent</> : <><KeyRound size={12} /> Reset PW</>}
                    </button>
                  )}
                  {/* Role selector */}
                  <select disabled={isViewer || isSelf} value={m.role}
                    onChange={async e => {
                      const newRole = e.target.value;
                      if (fbFunctions) {
                        try {
                          const fn = httpsCallable(fbFunctions, 'updateTeamMemberRole');
                          await fn({ targetUid: m.uid, newRole });
                        } catch (err) { console.warn('Role sync failed:', err); }
                      }
                    }}
                    style={{ ...S.input, width: 'auto', height: 30, fontSize: 'var(--text-xs)', padding: '0 8px' }}>
                    <option value="Super Admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="Ops Manager">Ops Manager</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  {/* Remove */}
                  {!isViewer && !isSelf && <button onClick={async () => {
                    if (!confirm(`Remove ${m.displayName || m.email} from the team? Their account will be disabled.`)) return;
                    if (fbFunctions) {
                      try {
                        const fn = httpsCallable(fbFunctions, 'removeTeamMember');
                        await fn({ targetUid: m.uid });
                      } catch (err) { console.warn('Remove sync failed:', err); }
                    }
                  }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}><Trash2 size={14} /></button>}
                </div>
              </div>
            );
          })}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)', fontStyle: 'italic' }}>
            {liveTeam.length} member{liveTeam.length !== 1 ? 's' : ''} · Live from Firebase
          </p>
        </div>
      </>)}

      {/* ═══ QUOTES & ORDERS ═══ */}
      {tab === 'quoting' && (<>
        <div style={S.card}>
          <h3 style={S.sectionTitle}><span style={S.sectionIcon}><ShoppingCart size={18} /></span> Quote Configuration</h3>
          <div style={S.grid2}>
            <Field label="Quote Validity (Days)" path="quoting.quoteValidityDays" type="number" hint="How long quotes remain valid" />
            <Field label="Minimum Order Value (UGX)" path="quoting.minimumOrderValue" type="number" mono hint="Orders below this value are rejected" />
            <div>
              <label style={S.label}>Default Payment Terms</label>
              <select value={settings.quoting?.defaultPaymentTerms || 'net_30'}
                onChange={e => handleUpdate('quoting.defaultPaymentTerms', e.target.value)}
                disabled={isViewer} style={S.input}>
                <option value="due_on_receipt">Due on Receipt</option>
                <option value="net_15">Net 15 Days</option>
                <option value="net_30">Net 30 Days</option>
                <option value="net_60">Net 60 Days</option>
              </select>
              <p style={S.hint}>Applied to all new proformas by default</p>
            </div>
            <Field label="Cancellation Window (Hours)" path="quoting.cancellationWindowHours" type="number" hint="Hours after order in which customer can cancel" />
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.sectionTitle}><span style={S.sectionIcon}><Shield size={18} /></span> Order Policies</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Toggle label="Auto-Confirm Orders" path="quoting.autoConfirmOrders" hint="Skip manual review and auto-confirm new orders" />
            <Toggle label="Require Purchase Order (PO)" path="quoting.requirePO" hint="Customers must upload a PO document with their order" />
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.sectionTitle}><span style={S.sectionIcon}><Hash size={18} /></span> Order Numbering</h3>
          <div style={S.grid3}>
            <Field label="Order Prefix" path="financials.orderPrefix" mono hint='e.g. VIT-' />
            <Field label="Next Order Number" path="financials.nextOrderNumber" type="number" mono />
            <div>
              <label style={S.label}>Preview</label>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--accent-primary)', margin: '8px 0 0' }}>
                {settings.financials.orderPrefix}{settings.financials.nextOrderNumber}
              </p>
            </div>
          </div>
        </div>
      </>)}

      {/* ═══ BANK DETAILS ═══ */}
      {tab === 'banking' && (<>
        <div style={{ padding: 'var(--space-4)', background: 'var(--info-muted)', border: '1px solid var(--info-border)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Landmark size={18} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--info)', margin: '0 0 4px' }}>Bank Transfer Only</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>These details are displayed on proformas and invoices so customers know where to send payment. Ensure all information is accurate.</p>
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.sectionTitle}><span style={S.sectionIcon}><Landmark size={18} /></span> Bank Account Details</h3>
          <div style={S.grid2}>
            <Field label="Bank Name" path="banking.bankName" hint="e.g. Stanbic Bank Uganda" />
            <Field label="Account Name" path="banking.accountName" />
            <div>
              <label style={S.label}>Account Number</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type={showAccount ? 'text' : 'password'} style={{ ...S.input, fontFamily: 'var(--font-mono)' }}
                  defaultValue={settings.banking?.accountNumber || ''} disabled={isViewer}
                  onBlur={e => handleUpdate('banking.accountNumber', e.target.value)} />
                <button onClick={() => setShowAccount(!showAccount)} style={{ background: 'none', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '8px', display: 'flex' }}>
                  {showAccount ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Field label="Branch Name" path="banking.branchName" />
            <Field label="SWIFT / BIC Code" path="banking.swiftCode" mono hint="For international transfers" />
            <Field label="Currency" path="banking.currency" mono />
          </div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Field label="Bank Address" path="banking.bankAddress" hint="Physical address of bank branch" />
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.sectionTitle}><span style={S.sectionIcon}><FileText size={18} /></span> Payment Instructions</h3>
          <div>
            <label style={S.label}>Additional Instructions for Customers</label>
            <textarea rows={3} style={{ ...S.input, height: 'auto', padding: '10px 12px', resize: 'vertical', minHeight: 72 }}
              defaultValue={settings.banking?.additionalInstructions || ''} disabled={isViewer}
              onBlur={e => handleUpdate('banking.additionalInstructions', e.target.value)} />
            <p style={S.hint}>This text appears on proformas below the bank details</p>
          </div>
        </div>
        {/* Preview card */}
        <div style={{ ...S.card, background: 'var(--bg-elevated)', borderColor: 'var(--accent-primary)', borderWidth: 2 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 var(--space-3)' }}>Preview — How this appears on invoices</p>
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-faint)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', textTransform: 'uppercase' }}>Bank Transfer Details</p>
            {[
              ['Bank', settings.banking?.bankName || '—'],
              ['Account Name', settings.banking?.accountName || '—'],
              ['Account No.', settings.banking?.accountNumber ? '••••' + settings.banking.accountNumber.slice(-4) : '—'],
              ['Branch', settings.banking?.branchName || '—'],
              ['SWIFT', settings.banking?.swiftCode || '—'],
              ['Currency', settings.banking?.currency || 'UGX'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--border-faint)' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)' }}>{v}</span>
              </div>
            ))}
            {settings.banking?.additionalInstructions && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: 8, margin: '8px 0 0' }}>{settings.banking.additionalInstructions}</p>
            )}
          </div>
        </div>
      </>)}

      {/* ═══ INVOICING ═══ */}
      {tab === 'invoicing' && (<>
        <div style={S.card}>
          <h3 style={S.sectionTitle}><span style={S.sectionIcon}><FileText size={18} /></span> Invoice Configuration</h3>
          <div style={S.grid2}>
            <Field label="Company TIN / Tax ID" path="invoicing.companyTIN" mono hint="Printed on all invoices" />
            <Field label="Invoice Prefix" path="invoicing.invoicePrefix" mono hint="e.g. INV-" />
            <Field label="Proforma Prefix" path="invoicing.proformaPrefix" mono hint="e.g. PRO-" />
            <Field label="Proforma Validity (Days)" path="invoicing.proformaValidityDays" type="number" />
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.sectionTitle}><span style={S.sectionIcon}><FileText size={18} /></span> Document Footer</h3>
          <div>
            <label style={S.label}>Invoice Footer Text</label>
            <textarea rows={3} style={{ ...S.input, height: 'auto', padding: '10px 12px', resize: 'vertical', minHeight: 72 }}
              defaultValue={settings.invoicing?.invoiceFooter || ''} disabled={isViewer}
              onBlur={e => handleUpdate('invoicing.invoiceFooter', e.target.value)} />
            <p style={S.hint}>Appears at the bottom of every invoice and proforma</p>
          </div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Toggle label="Show Bank Details on Invoice" path="invoicing.showBankDetailsOnInvoice" hint="Include bank transfer details on all documents" />
          </div>
        </div>
      </>)}

      {/* ═══ LOGISTICS ═══ */}
      {tab === 'logistics' && (<>
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ ...S.sectionTitle, margin: 0 }}><span style={S.sectionIcon}><Truck size={18} /></span> Carriers</h3>
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
                    style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', background: c.active ? 'var(--success-muted)' : 'var(--neutral-muted)', color: c.active ? 'var(--success)' : 'var(--neutral)' }}>{c.active ? 'Active' : 'Inactive'}</button>
                  {!isViewer && <button onClick={() => handleUpdate('logistics.carriers', settings.logistics.carriers.filter(x => x.id !== c.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}><Trash2 size={14} /></button>}
                </div>
              </div>
              <label style={{ ...S.label, fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tracking URL Template</label>
              <input style={{ ...S.input, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }} defaultValue={c.pattern}
                onBlur={e => handleUpdate('logistics.carriers', settings.logistics.carriers.map(x => x.id === c.id ? { ...x, pattern: e.target.value } : x))} />
            </div>
          ))}
        </div>
        <div style={S.card}>
          <h3 style={S.sectionTitle}><span style={S.sectionIcon}><MapPin size={18} /></span> Fulfillment</h3>
          <div style={S.grid2}>
            <Field label="Base Domestic Rate (UGX)" path="logistics.baseDomesticRate" type="number" mono />
            <Field label="Free Shipping Threshold (UGX)" path="logistics.freeShippingThreshold" type="number" mono />
            <Field label="Est. Domestic Delivery (Days)" path="logistics.estimatedDomesticDays" type="number" />
            <Field label="Est. International Delivery (Days)" path="logistics.estimatedInternationalDays" type="number" />
          </div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Field label="Warehouse / Dispatch Address" path="logistics.warehouseAddress" />
          </div>
        </div>
      </>)}

      {/* ═══ TAX & SYSTEM ═══ */}
      {tab === 'tax' && (<>
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ ...S.sectionTitle, margin: 0 }}><span style={S.sectionIcon}><DollarSign size={18} /></span> Tax Rates</h3>
            {!isViewer && <button onClick={() => handleUpdate('financials.taxRates', [...settings.financials.taxRates, { id: Date.now().toString(), region: 'New Region', rate: 0 }])}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-primary)' }}>+ Add Rate</button>}
          </div>
          <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-faint)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
              <thead><tr style={{ background: 'var(--bg-elevated)' }}>
                <th style={{ padding: '0 16px', height: 40, textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Region</th>
                <th style={{ padding: '0 16px', height: 40, textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Rate</th>
                <th style={{ padding: '0 16px', height: 40, textAlign: 'right', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Action</th>
              </tr></thead>
              <tbody>{settings.financials.taxRates.map(t => (
                <tr key={t.id} style={{ borderTop: '1px solid var(--border-faint)' }}>
                  <td style={{ padding: '0 16px', height: 52 }}>
                    <input defaultValue={t.region} style={{ background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', width: '100%' }}
                      onBlur={e => handleUpdate('financials.taxRates', settings.financials.taxRates.map(x => x.id === t.id ? { ...x, region: e.target.value } : x))} /></td>
                  <td style={{ padding: '0 16px', height: 52 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <input type="number" disabled={isViewer} defaultValue={t.rate} style={{ background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--success)', width: 48 }}
                        onBlur={e => handleUpdate('financials.taxRates', settings.financials.taxRates.map(x => x.id === t.id ? { ...x, rate: parseFloat(e.target.value) } : x))} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--success)' }}>%</span>
                    </span></td>
                  <td style={{ padding: '0 16px', height: 52, textAlign: 'right' }}>
                    {!isViewer && <button onClick={() => handleUpdate('financials.taxRates', settings.financials.taxRates.filter(x => x.id !== t.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}><Trash2 size={14} /></button>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.sectionTitle}><span style={S.sectionIcon}><Shield size={18} /></span> System</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
            {[
              { label: 'Currency', value: settings.financials.currency },
              { label: 'Order Prefix', value: settings.financials.orderPrefix },
              { label: 'Next Order #', value: String(settings.financials.nextOrderNumber) },
              { label: 'Firebase', value: db ? 'Connected' : 'Local Mode', color: db ? 'var(--success)' : 'var(--warning)' },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: (s as any).color || 'var(--text-primary)', marginTop: 4 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </>)}
    </div>
  );
}

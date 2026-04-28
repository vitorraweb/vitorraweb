import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import {
  Mail, Users, ChevronDown, ChevronRight, Star, Trash2, CheckCircle2,
  Clock, Eye, EyeOff, Loader2, Inbox, Globe, Calendar, User, Phone,
  MessageSquare, X, Filter, Search, ArrowRight, RefreshCw
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */
interface ContactSubmission {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string; // legacy fallback
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  createdAt: any;
  submittedAt?: any; // legacy fallback
  read?: boolean;
  starred?: boolean;
  repliedAt?: string;
  notes?: string;
  source?: string;
  status?: string;
}

interface Subscriber {
  id: string;
  email: string;
  source?: string;
  subscribedAt: any;
}

type Tab = 'contacts' | 'subscribers';

/* ── Styles ────────────────────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
  borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
};
const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700,
  color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em',
};

const getTimestamp = (c: ContactSubmission): any => c.createdAt || c.submittedAt;

const relTime = (ts: any): string => {
  if (!ts) return 'Unknown';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return 'Unknown';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDate = (ts: any): string => {
  if (!ts) return 'Unknown';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
};

const getDisplayName = (c: ContactSubmission): string => {
  if (c.firstName || c.lastName) {
    return [c.firstName, c.lastName].filter(Boolean).join(' ');
  }
  return c.name || 'Anonymous';
};

export default function InboxManager() {
  const [tab, setTab] = useState<Tab>('contacts');
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'starred'>('all');

  // ─── FIRESTORE LISTENERS ──────────────────────────────────────
  useEffect(() => {
    if (!db) { setLoading(false); return; }

    setLoading(true);
    const unsubs: (() => void)[] = [];

    // Contact submissions listener
    try {
      const contactsRef = collection(db, 'contactSubmissions');
      const unsub1 = onSnapshot(contactsRef, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as ContactSubmission));
        // Sort by submittedAt descending
        items.sort((a, b) => {
          const da = getTimestamp(a);
          const db_ = getTimestamp(b);
          const ta = da?.toDate ? da.toDate().getTime() : new Date(da || 0).getTime();
          const tb = db_?.toDate ? db_.toDate().getTime() : new Date(db_ || 0).getTime();
          return tb - ta;
        });
        setContacts(items);
        setLoading(false);
      }, (err) => { console.warn('Inbox: contactSubmissions error:', err); setLoading(false); });
      unsubs.push(unsub1);
    } catch { setLoading(false); }

    // Subscribers listener
    try {
      const subsRef = collection(db, 'subscribers');
      const unsub2 = onSnapshot(subsRef, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Subscriber));
        items.sort((a, b) => {
          const da = a.subscribedAt?.toDate ? a.subscribedAt.toDate().getTime() : new Date(a.subscribedAt || 0).getTime();
          const db_ = b.subscribedAt?.toDate ? b.subscribedAt.toDate().getTime() : new Date(b.subscribedAt || 0).getTime();
          return db_ - da;
        });
        setSubscribers(items);
      }, (err) => console.warn('Inbox: subscribers error:', err));
      unsubs.push(unsub2);
    } catch {}

    return () => unsubs.forEach(u => u());
  }, []);

  // ─── ACTIONS ──────────────────────────────────────────────────
  const markRead = async (id: string, read: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'contactSubmissions', id), { read });
    setContacts(prev => prev.map(c => c.id === id ? { ...c, read } : c));
    if (selectedContact?.id === id) setSelectedContact(prev => prev ? { ...prev, read } : prev);
  };

  const toggleStar = async (id: string, starred: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'contactSubmissions', id), { starred });
    setContacts(prev => prev.map(c => c.id === id ? { ...c, starred } : c));
    if (selectedContact?.id === id) setSelectedContact(prev => prev ? { ...prev, starred } : prev);
  };

  const deleteContact = async (id: string) => {
    if (!db || !confirm('Delete this submission permanently?')) return;
    await deleteDoc(doc(db, 'contactSubmissions', id));
    if (selectedContact?.id === id) setSelectedContact(null);
  };

  const deleteSubscriber = async (id: string) => {
    if (!db || !confirm('Remove this subscriber?')) return;
    await deleteDoc(doc(db, 'subscribers', id));
  };

  // ─── DERIVED ──────────────────────────────────────────────────
  const unreadCount = contacts.filter(c => !c.read).length;
  const starredCount = contacts.filter(c => c.starred).length;

  const filteredContacts = contacts.filter(c => {
    if (filterRead === 'unread' && c.read) return false;
    if (filterRead === 'starred' && !c.starred) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return getDisplayName(c).toLowerCase().includes(q) || 
             c.email?.toLowerCase().includes(q) || 
             c.subject?.toLowerCase().includes(q) ||
             c.message?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredSubscribers = subscribers.filter(s => {
    if (searchText) return s.email?.toLowerCase().includes(searchText.toLowerCase());
    return true;
  });

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Inbox</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Customer inquiries and newsletter subscriptions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {unreadCount > 0 && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700,
              background: 'var(--danger)', color: 'white',
              padding: '4px 10px', borderRadius: 'var(--radius-full)',
            }}>{unreadCount} unread</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-faint)', paddingBottom: 'var(--space-2)' }}>
        {([
          { id: 'contacts' as Tab, label: 'Contact Submissions', icon: <Mail size={16} />, count: contacts.length, badge: unreadCount },
          { id: 'subscribers' as Tab, label: 'Newsletter Subscribers', icon: <Users size={16} />, count: subscribers.length, badge: 0 },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 'var(--radius-md)',
            background: tab === t.id ? 'var(--accent-primary-muted)' : 'transparent',
            border: tab === t.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
            cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
            fontWeight: tab === t.id ? 600 : 500,
            color: tab === t.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
            transition: 'var(--transition-fast)',
          }}>
            {t.icon}
            {t.label}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 700,
              background: tab === t.id ? 'var(--accent-primary)' : 'var(--bg-elevated)',
              color: tab === t.id ? 'white' : 'var(--text-tertiary)',
              padding: '2px 6px', borderRadius: 'var(--radius-full)',
            }}>{t.count}</span>
            {t.badge > 0 && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                background: 'var(--danger)', color: 'white',
                padding: '2px 6px', borderRadius: 'var(--radius-full)',
                animation: 'pulse-ring 1.8s ease infinite',
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            placeholder={tab === 'contacts' ? 'Search by name, email, subject...' : 'Search by email...'}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{
              width: '100%', height: 36, paddingLeft: 36, paddingRight: 12,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
              borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)', color: 'var(--text-primary)', outline: 'none',
            }}
          />
        </div>
        {tab === 'contacts' && (
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            {(['all', 'unread', 'starred'] as const).map(f => (
              <button key={f} onClick={() => setFilterRead(f)} style={{
                padding: '6px 12px', borderRadius: 'var(--radius-md)',
                background: filterRead === f ? 'var(--accent-primary-muted)' : 'transparent',
                border: filterRead === f ? '1px solid var(--accent-primary)' : '1px solid var(--border-dim)',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
                fontWeight: 600, color: filterRead === f ? 'var(--accent-primary)' : 'var(--text-secondary)',
                textTransform: 'capitalize',
              }}>{f}{f === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : f === 'starred' && starredCount > 0 ? ` (${starredCount})` : ''}</button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ ...card, padding: '60px 0', textAlign: 'center' }}>
          <Loader2 size={24} style={{ color: 'var(--accent-primary)', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 12 }}>Loading inbox...</p>
        </div>
      ) : tab === 'contacts' ? (
        /* ═══ CONTACTS TAB ═══ */
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          {/* List */}
          <div style={{ flex: selectedContact ? '0 0 400px' : 1, display: 'flex', flexDirection: 'column', gap: 2, ...card, overflow: 'hidden' }}>
            {/* List Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-faint)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={sectionLabel}>{filteredContacts.length} message{filteredContacts.length !== 1 ? 's' : ''}</span>
            </div>

            {filteredContacts.length > 0 ? (
              <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
                {filteredContacts.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedContact(c); if (!c.read) markRead(c.id, true); }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '14px 16px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-faint)',
                      background: selectedContact?.id === c.id ? 'var(--accent-primary-muted)' : !c.read ? 'var(--bg-elevated)' : 'transparent',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    {/* Unread dot */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: !c.read ? 'var(--accent-primary)' : 'transparent' }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: !c.read ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getDisplayName(c)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                          {relTime(getTimestamp(c))}
                        </span>
                      </div>
                      {c.subject && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: !c.read ? 600 : 400, color: 'var(--text-secondary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.subject}
                        </p>
                      )}
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.message?.substring(0, 80)}...
                      </p>
                    </div>

                    {/* Star */}
                    <button onClick={e => { e.stopPropagation(); toggleStar(c.id, !c.starred); }} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0,
                      color: c.starred ? 'var(--warning)' : 'var(--text-tertiary)', transition: 'var(--transition-fast)',
                    }}>
                      <Star size={14} fill={c.starred ? 'var(--warning)' : 'none'} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Inbox size={36} style={{ color: 'var(--text-tertiary)', opacity: 0.3, margin: '0 auto 12px' }} />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>
                  {searchText || filterRead !== 'all' ? 'No messages match your filters' : 'No contact submissions yet'}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 0', opacity: 0.7 }}>
                  Messages from the contact form will appear here
                </p>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedContact && (
            <div style={{ flex: 1, ...card, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Detail Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-faint)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedContact.subject || 'No Subject'}
                </h3>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button onClick={() => markRead(selectedContact.id, !selectedContact.read)} title={selectedContact.read ? 'Mark unread' : 'Mark read'} style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'none', border: '1px solid var(--border-dim)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-secondary)', transition: 'var(--transition-fast)',
                  }}>
                    {selectedContact.read ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => toggleStar(selectedContact.id, !selectedContact.starred)} style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'none', border: '1px solid var(--border-dim)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: selectedContact.starred ? 'var(--warning)' : 'var(--text-secondary)', transition: 'var(--transition-fast)',
                  }}>
                    <Star size={14} fill={selectedContact.starred ? 'var(--warning)' : 'none'} />
                  </button>
                  <button onClick={() => deleteContact(selectedContact.id)} style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'none', border: '1px solid var(--danger-border)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--danger)', transition: 'var(--transition-fast)',
                  }}>
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => setSelectedContact(null)} style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'none', border: '1px solid var(--border-dim)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-secondary)', transition: 'var(--transition-fast)',
                  }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Sender Info */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-faint)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 700,
                  }}>
                    {(getDisplayName(selectedContact) || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {getDisplayName(selectedContact)}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                      {selectedContact.email}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  {selectedContact.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={12} style={{ color: 'var(--text-tertiary)' }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{selectedContact.phone}</span>
                    </div>
                  )}
                  {selectedContact.company && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Globe size={12} style={{ color: 'var(--text-tertiary)' }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{selectedContact.company}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{formatDate(getTimestamp(selectedContact))}</span>
                  </div>
                  {selectedContact.source && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Globe size={12} style={{ color: 'var(--text-tertiary)' }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{selectedContact.source}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Body */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selectedContact.message}
                </p>
              </div>

              {/* Reply Action */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-faint)', display: 'flex', gap: 'var(--space-2)' }}>
                <a
                  href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject || 'Your inquiry'}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-primary)', color: 'white',
                    fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600,
                    textDecoration: 'none', cursor: 'pointer',
                  }}
                >
                  <ArrowRight size={14} /> Reply via Email
                </a>
                {selectedContact.phone && (
                  <a
                    href={`https://wa.me/${selectedContact.phone.replace(/[^0-9+]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 'var(--radius-md)',
                      background: 'none', border: '1px solid var(--border-dim)',
                      fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500,
                      color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer',
                    }}
                  >
                    <MessageSquare size={14} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ═══ SUBSCRIBERS TAB ═══ */
        <div style={card}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-faint)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={sectionLabel}>{filteredSubscribers.length} subscriber{filteredSubscribers.length !== 1 ? 's' : ''}</span>
            {subscribers.length > 0 && (
              <button
                onClick={() => {
                  const csv = 'Email,Source,Subscribed At\n' + subscribers.map(s => {
                    const date = s.subscribedAt?.toDate ? s.subscribedAt.toDate().toISOString() : s.subscribedAt || '';
                    return `${s.email},${s.source || 'unknown'},${date}`;
                  }).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `vitorra_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-primary-muted)', border: '1px solid var(--accent-primary)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
                  fontWeight: 600, color: 'var(--accent-primary)',
                }}
              >
                Export CSV
              </button>
            )}
          </div>

          {filteredSubscribers.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
                    {['Email', 'Source', 'Subscribed', 'Actions'].map(h => (
                      <th key={h} style={{
                        ...sectionLabel, padding: '10px 16px', textAlign: 'left',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-faint)' }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                            background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-display)', fontSize: 'var(--text-xs)', fontWeight: 700,
                          }}>{s.email.charAt(0).toUpperCase()}</div>
                          {s.email}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 600,
                          padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                          background: s.source === 'news_page' ? 'var(--info-muted)' : 'var(--bg-elevated)',
                          color: s.source === 'news_page' ? 'var(--info)' : 'var(--text-tertiary)',
                          border: `1px solid ${s.source === 'news_page' ? 'var(--info-border)' : 'var(--border-dim)'}`,
                          textTransform: 'uppercase',
                        }}>{s.source || 'unknown'}</span>
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        {relTime(s.subscribedAt)}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <button onClick={() => deleteSubscriber(s.id)} style={{
                          background: 'none', border: '1px solid var(--danger-border)',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          padding: '4px 8px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4,
                          fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
                        }}>
                          <Trash2 size={12} /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Users size={36} style={{ color: 'var(--text-tertiary)', opacity: 0.3, margin: '0 auto 12px' }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>
                {searchText ? 'No subscribers match your search' : 'No newsletter subscribers yet'}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 0', opacity: 0.7 }}>
                Subscribers from the News page will appear here
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Return unread count for badge ── */
export function useInboxBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'contactSubmissions'), (snap) => {
      const unread = snap.docs.filter(d => !d.data().read).length;
      setCount(unread);
    }, () => {});
    return () => unsub();
  }, []);
  return count;
}

import { useState } from 'react';
import { useCMS, JobPosting } from '../../../context/CMSContext';
import RichTextEditor from './RichTextEditor';
import {
  Search, Plus, X, Edit3, Trash2, Eye, EyeOff, Check, Briefcase, MapPin,
  Clock, Users, ChevronDown, ChevronRight, DollarSign, Globe, Mail, Link,
  CalendarDays, Star, AlertTriangle, Zap, GraduationCap, Heart, Sparkles,
  Copy, Building2, Hash
} from 'lucide-react';

const EXP_LABELS: Record<string, string> = {
  entry: 'Entry Level', mid: 'Mid Level', senior: 'Senior', lead: 'Lead / Manager', executive: 'Executive',
};
const REMOTE_LABELS: Record<string, string> = {
  'on-site': 'On-Site', hybrid: 'Hybrid', remote: 'Fully Remote',
};
const PRIORITY_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  normal: { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: null },
  urgent: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: <AlertTriangle size={10} /> },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', icon: <Zap size={10} /> },
};

export default function JobsManager() {
  const { state, addJob, updateJob, removeJob } = useCMS();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [filterDept, setFilterDept] = useState('all');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // List input states
  const [reqInput, setReqInput] = useState('');
  const [respInput, setRespInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');

  const emptyForm: Partial<JobPosting> = {
    title: '', department: '', location: '', type: 'full-time',
    description: '', requirements: [], responsibilities: [], salary: '', status: 'open',
    experienceLevel: 'mid', remote: 'on-site', benefits: [], skills: [],
    applicationEmail: '', applicationUrl: '', deadline: '', priority: 'normal',
    category: 'Operations', positions: 1,
  };
  const [formData, setFormData] = useState<Partial<JobPosting>>(emptyForm);

  const departments = ['all', ...new Set(state.jobs.map(j => j.department).filter(Boolean))];

  const filtered = state.jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || j.status === filterStatus;
    const matchDept = filterDept === 'all' || j.department === filterDept;
    return matchSearch && matchStatus && matchDept;
  });

  const startEdit = (j: JobPosting) => {
    setFormData({ ...j });
    setEditingId(j.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateJob(editingId, formData);
      setEditingId(null);
    } else {
      addJob({
        ...(formData as JobPosting),
        id: `job-${Date.now()}`,
        postedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      });
    }
    setShowForm(false);
    setFormData(emptyForm);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setFormData(emptyForm); };

  const duplicateJob = (j: JobPosting) => {
    addJob({
      ...j,
      id: `job-${Date.now()}`,
      title: `${j.title} (Copy)`,
      status: 'open',
      postedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    });
  };

  // List helpers
  const addListItem = (field: 'requirements' | 'responsibilities' | 'skills' | 'benefits', value: string, setter: (v: string) => void) => {
    if (value.trim()) {
      setFormData({ ...formData, [field]: [...(formData[field] as string[] || []), value.trim()] });
      setter('');
    }
  };
  const removeListItem = (field: 'requirements' | 'responsibilities' | 'skills' | 'benefits', idx: number) => {
    setFormData({ ...formData, [field]: (formData[field] as string[] || []).filter((_, i) => i !== idx) });
  };

  const typeLabels: Record<string, string> = {
    'full-time': 'Full-Time', 'part-time': 'Part-Time', 'contract': 'Contract', 'internship': 'Internship'
  };

  // Stats
  const openJobs = state.jobs.filter(j => j.status === 'open').length;
  const closedJobs = state.jobs.filter(j => j.status === 'closed').length;
  const urgentJobs = state.jobs.filter(j => j.priority === 'urgent' || j.priority === 'critical').length;
  const deptCount = new Set(state.jobs.map(j => j.department).filter(Boolean)).size;

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
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Careers & Job Postings
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Manage open positions, qualifications, benefits, and application workflows for the "Join Our Team" page.
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }} style={{
          padding: '10px 24px', background: 'var(--accent-primary)', color: 'white',
          borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 700,
          fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 12px rgba(198,137,88,0.3)', transition: 'var(--transition-fast)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-primary-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-primary)'}
        ><Plus size={16} /> Post New Position</button>
      </div>

      {/* ═══ Metrics ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { value: state.jobs.length, label: 'Total Postings', color: 'var(--text-primary)', icon: <Briefcase size={18} /> },
          { value: openJobs, label: 'Open Positions', color: 'var(--success)', icon: <Eye size={18} /> },
          { value: closedJobs, label: 'Closed', color: 'var(--text-tertiary)', icon: <EyeOff size={18} /> },
          { value: urgentJobs, label: 'Urgent / Critical', color: 'var(--warning)', icon: <AlertTriangle size={18} /> },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: m.color,
            }}>{m.icon}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: m.color }}>{m.value}</div>
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
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search positions..."
            style={{ ...inputStyle, paddingLeft: 36, height: 38, fontSize: 'var(--text-sm)' }} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 4, border: '1px solid var(--border-dim)' }}>
          {(['all', 'open', 'closed'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '5px 14px', borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: filterStatus === s ? 600 : 400,
              border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              background: filterStatus === s ? 'var(--accent-primary)' : 'transparent',
              color: filterStatus === s ? 'white' : 'var(--text-secondary)',
              transition: 'var(--transition-fast)',
            }}>{s}</button>
          ))}
        </div>
        {departments.length > 2 && (
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{
            ...selectStyle, width: 'auto', height: 38, fontSize: 'var(--text-xs)', padding: '0 12px',
          }}>
            {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
          </select>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          JOB POSTING FORM
         ═══════════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)', padding: '28px 32px', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200,
            background: 'rgba(198,137,88,0.06)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, position: 'relative', zIndex: 10 }}>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                {editingId ? 'Edit Position' : 'Create New Job Posting'}
              </h4>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                Fill in position details, requirements, and application configuration.
              </p>
            </div>
            <button onClick={cancelForm} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
              borderRadius: 'var(--radius-md)', width: 34, height: 34, cursor: 'pointer', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 10 }}>

            {/* ── Section: Basic Info ── */}
            <SectionHeader icon={<Briefcase size={13} />} title="Position Details" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Job Title *</label>
                <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Operations Manager"
                  style={{ ...inputStyle, fontSize: 'var(--text-lg)', fontWeight: 600, height: 48 }} />
              </div>
              <div>
                <label style={labelStyle}>Department *</label>
                <input required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Logistics" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={formData.category || 'Operations'} onChange={e => setFormData({ ...formData, category: e.target.value })} style={selectStyle}>
                  <option value="Operations">Operations</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Supply Chain">Supply Chain</option>
                  <option value="Executive">Executive</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* ── Section: Location & Type ── */}
            <SectionHeader icon={<MapPin size={13} />} title="Location & Employment" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>Location *</label>
                <input required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Kampala, Uganda" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Employment Type</label>
                <select value={formData.type || 'full-time'} onChange={e => setFormData({ ...formData, type: e.target.value as any })} style={selectStyle}>
                  <option value="full-time">Full-Time</option><option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option><option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Work Arrangement</label>
                <select value={formData.remote || 'on-site'} onChange={e => setFormData({ ...formData, remote: e.target.value as any })} style={selectStyle}>
                  <option value="on-site">On-Site</option><option value="hybrid">Hybrid</option><option value="remote">Fully Remote</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Experience Level</label>
                <select value={formData.experienceLevel || 'mid'} onChange={e => setFormData({ ...formData, experienceLevel: e.target.value as any })} style={selectStyle}>
                  <option value="entry">Entry Level</option><option value="mid">Mid Level</option>
                  <option value="senior">Senior</option><option value="lead">Lead / Manager</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>

            {/* ── Section: Compensation ── */}
            <SectionHeader icon={<DollarSign size={13} />} title="Compensation & Logistics" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>Salary Range</label>
                <input value={formData.salary || ''} onChange={e => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g. UGX 2,000,000 – 4,000,000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Open Positions</label>
                <input type="number" min={1} value={formData.positions || 1} onChange={e => setFormData({ ...formData, positions: Number(e.target.value) })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Application Deadline</label>
                <input type="date" value={formData.deadline || ''} onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
              </div>
            </div>

            {/* ── Section: Rich Description ── */}
            <SectionHeader icon={<Star size={13} />} title="Full Job Description" />
            <div style={{ marginBottom: 24 }}>
              <RichTextEditor
                value={formData.description || ''}
                onChange={html => setFormData({ ...formData, description: html })}
                placeholder="Write the full position description, team context, and role expectations..."
              />
            </div>

            {/* ── Section: Requirements & Responsibilities ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div>
                <SectionHeader icon={<GraduationCap size={13} />} title="Requirements" />
                <ListEditor items={formData.requirements || []} inputValue={reqInput}
                  onInputChange={setReqInput}
                  onAdd={() => addListItem('requirements', reqInput, setReqInput)}
                  onRemove={idx => removeListItem('requirements', idx)}
                  placeholder="e.g. 5+ years in logistics management..." />
              </div>
              <div>
                <SectionHeader icon={<Check size={13} />} title="Responsibilities" />
                <ListEditor items={formData.responsibilities || []} inputValue={respInput}
                  onInputChange={setRespInput}
                  onAdd={() => addListItem('responsibilities', respInput, setRespInput)}
                  onRemove={idx => removeListItem('responsibilities', idx)}
                  placeholder="e.g. Oversee daily fleet operations..." />
              </div>
            </div>

            {/* ── Section: Skills & Benefits ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div>
                <SectionHeader icon={<Sparkles size={13} />} title="Key Skills / Tags" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {(formData.skills || []).map((skill, i) => (
                    <span key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                      background: 'rgba(74,180,255,0.1)', color: '#4AB4FF',
                      border: '1px solid rgba(74,180,255,0.2)', borderRadius: 'var(--radius-full)',
                      fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500,
                    }}>
                      {skill}
                      <button type="button" onClick={() => removeListItem('skills', i)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex',
                      }}><X size={11} /></button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addListItem('skills', skillInput, setSkillInput); } }}
                    placeholder="e.g. Fleet Management, ERP Systems..."
                    style={{ ...inputStyle, flex: 1, height: 36, fontSize: 'var(--text-sm)' }} />
                  <SmallBtn onClick={() => addListItem('skills', skillInput, setSkillInput)}>Add</SmallBtn>
                </div>
              </div>
              <div>
                <SectionHeader icon={<Heart size={13} />} title="Benefits & Perks" />
                <ListEditor items={formData.benefits || []} inputValue={benefitInput}
                  onInputChange={setBenefitInput}
                  onAdd={() => addListItem('benefits', benefitInput, setBenefitInput)}
                  onRemove={idx => removeListItem('benefits', idx)}
                  placeholder="e.g. Health insurance, company vehicle..." />
              </div>
            </div>

            {/* ── Section: Application Config ── */}
            <SectionHeader icon={<Mail size={13} />} title="Application Configuration" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>Application Email</label>
                <input type="email" value={formData.applicationEmail || ''} onChange={e => setFormData({ ...formData, applicationEmail: e.target.value })}
                  placeholder="careers@vitorra.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>External Application URL</label>
                <input value={formData.applicationUrl || ''} onChange={e => setFormData({ ...formData, applicationUrl: e.target.value })}
                  placeholder="https://forms.google.com/..." style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={formData.status || 'open'} onChange={e => setFormData({ ...formData, status: e.target.value as any })} style={selectStyle}>
                    <option value="open">Open</option><option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select value={formData.priority || 'normal'} onChange={e => setFormData({ ...formData, priority: e.target.value as any })} style={selectStyle}>
                    <option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Actions ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              paddingTop: 20, marginTop: 4, borderTop: '1px solid var(--border-faint)',
            }}>
              <button type="submit" style={{
                padding: '10px 28px', background: 'var(--accent-primary)', color: 'white',
                borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 700,
                fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 12px rgba(198,137,88,0.3)', transition: 'var(--transition-fast)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-primary-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-primary)'}
              >
                <Check size={16} /> {editingId ? 'Update Position' : 'Publish Job Posting'}
              </button>
              <button type="button" onClick={cancelForm} style={{
                padding: '10px 20px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}>Discard</button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          JOB POSTINGS LIST (Expandable)
         ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filtered.map(j => {
          const isExpanded = expandedJob === j.id;
          const pri = PRIORITY_CONFIG[j.priority || 'normal'];
          return (
            <div key={j.id} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'var(--transition-fast)',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(198,137,88,0.25)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-faint)'}
            >
              {/* Row header — clickable to expand */}
              <div onClick={() => setExpandedJob(isExpanded ? null : j.id)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', cursor: 'pointer', transition: 'var(--transition-fast)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}><Briefcase size={20} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>{j.title}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase',
                        background: j.status === 'open' ? 'var(--success-muted)' : 'var(--neutral-muted)',
                        color: j.status === 'open' ? 'var(--success)' : 'var(--neutral)',
                      }}>{j.status}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase',
                        background: 'rgba(74,180,255,0.1)', color: '#4AB4FF',
                      }}>{typeLabels[j.type] || j.type}</span>
                      {j.remote && j.remote !== 'on-site' && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase',
                          background: 'rgba(167,139,250,0.1)', color: '#A78BFA',
                        }}>{REMOTE_LABELS[j.remote]}</span>
                      )}
                      {j.priority && j.priority !== 'normal' && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase',
                          background: pri.bg, color: pri.color.replace('text-', ''),
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>{pri.icon} {j.priority}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={12} />{j.department}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{j.location}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{j.postedDate}</span>
                      {j.salary && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={12} />{j.salary}</span>}
                      {j.experienceLevel && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><GraduationCap size={12} />{EXP_LABELS[j.experienceLevel]}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                  <ActionBtn onClick={e => { e.stopPropagation(); duplicateJob(j); }} title="Duplicate">
                    <Copy size={15} />
                  </ActionBtn>
                  <ActionBtn onClick={e => { e.stopPropagation(); updateJob(j.id, { status: j.status === 'open' ? 'closed' : 'open' }); }} title={j.status === 'open' ? 'Close' : 'Reopen'}>
                    {j.status === 'open' ? <EyeOff size={15} /> : <Eye size={15} />}
                  </ActionBtn>
                  <ActionBtn onClick={e => { e.stopPropagation(); startEdit(j); }} title="Edit" hoverColor="var(--accent-primary)">
                    <Edit3 size={15} />
                  </ActionBtn>
                  <ActionBtn onClick={e => { e.stopPropagation(); if (confirm(`Delete "${j.title}"?`)) removeJob(j.id); }} title="Delete" hoverColor="var(--danger)">
                    <Trash2 size={15} />
                  </ActionBtn>
                  <div style={{ width: 1, height: 20, background: 'var(--border-dim)', margin: '0 4px' }} />
                  <div style={{ color: isExpanded ? 'var(--accent-primary)' : 'var(--text-tertiary)', transition: 'var(--transition-fast)' }}>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </div>
              </div>

              {/* Expanded panel */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border-faint)', background: 'var(--bg-elevated)', padding: '20px 24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                    {/* Description */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <DetailLabel>Job Description</DetailLabel>
                      <div
                        dangerouslySetInnerHTML={{ __html: j.description || '<em style="color:#505A6E">No description provided.</em>' }}
                        style={{
                          fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                          lineHeight: 1.7, maxHeight: 200, overflow: 'auto',
                        }}
                      />
                    </div>

                    {/* Requirements */}
                    <div>
                      <DetailLabel>Requirements ({j.requirements?.length || 0})</DetailLabel>
                      {(j.requirements || []).length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 16, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                          {j.requirements.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      ) : <EmptyDetail />}
                    </div>

                    {/* Responsibilities */}
                    <div>
                      <DetailLabel>Responsibilities ({j.responsibilities?.length || 0})</DetailLabel>
                      {(j.responsibilities || []).length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 16, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                          {j.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      ) : <EmptyDetail />}
                    </div>

                    {/* Benefits */}
                    <div>
                      <DetailLabel>Benefits & Perks ({j.benefits?.length || 0})</DetailLabel>
                      {(j.benefits || []).length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 16, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                          {j.benefits.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                      ) : <EmptyDetail />}
                    </div>

                    {/* Skills tags */}
                    {(j.skills || []).length > 0 && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <DetailLabel>Skills & Tags</DetailLabel>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {j.skills!.map((s, i) => (
                            <span key={i} style={{
                              padding: '3px 10px', borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--text-xs)', fontWeight: 500,
                              background: 'rgba(74,180,255,0.08)', color: '#4AB4FF',
                              border: '1px solid rgba(74,180,255,0.15)',
                            }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Application info */}
                    {(j.applicationEmail || j.applicationUrl || j.deadline) && (
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 20, paddingTop: 12, borderTop: '1px solid var(--border-faint)' }}>
                        {j.applicationEmail && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            <Mail size={13} style={{ color: 'var(--accent-primary)' }} /> {j.applicationEmail}
                          </div>
                        )}
                        {j.applicationUrl && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            <Link size={13} style={{ color: 'var(--accent-primary)' }} />
                            <a href={j.applicationUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>External Form</a>
                          </div>
                        )}
                        {j.deadline && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            <CalendarDays size={13} style={{ color: 'var(--warning)' }} /> Deadline: {j.deadline}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            border: '1px dashed var(--border-dim)', borderRadius: 'var(--radius-lg)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)',
          }}>
            {search || filterStatus !== 'all' ? 'No positions match your filters.' : 'No job postings yet. Create your first listing!'}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

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

function EmptyDetail() {
  return <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>None specified</span>;
}

function ListEditor({ items, inputValue, onInputChange, onAdd, onRemove, placeholder }: {
  items: string[]; inputValue: string; onInputChange: (v: string) => void;
  onAdd: () => void; onRemove: (idx: number) => void; placeholder: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
            borderRadius: 'var(--radius-md)',
          }}>
            <Hash size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0, opacity: 0.5 }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', flex: 1 }}>{item}</span>
            <button type="button" onClick={() => onRemove(idx)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
              padding: 2, display: 'flex', flexShrink: 0,
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            ><X size={13} /></button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={inputValue} onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          style={{
            flex: 1, height: 36, padding: '0 12px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
            borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)', color: 'var(--text-primary)', outline: 'none',
          }} />
        <SmallBtn onClick={onAdd}>Add</SmallBtn>
      </div>
    </div>
  );
}

function SmallBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '0 16px', height: 36, background: 'var(--bg-elevated)',
      border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500,
      color: 'var(--text-secondary)', cursor: 'pointer', transition: 'var(--transition-fast)',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >{children}</button>
  );
}

function ActionBtn({ children, onClick, title, hoverColor }: {
  children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title: string; hoverColor?: string;
}) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 34, height: 34, borderRadius: 'var(--radius-md)',
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

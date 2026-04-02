import { useState } from 'react';
import { useCMS, JobPosting } from '../../../context/CMSContext';
import { Search, Plus, X, Edit3, Trash2, Eye, EyeOff, Check, Briefcase, MapPin, Clock, Users, ChevronDown } from 'lucide-react';

export default function JobsManager() {
  const { state, addJob, updateJob, removeJob } = useCMS();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [reqInput, setReqInput] = useState('');
  const [respInput, setRespInput] = useState('');

  const emptyForm: Partial<JobPosting> = {
    title: '', department: '', location: '', type: 'full-time',
    description: '', requirements: [], responsibilities: [], salary: '', status: 'open',
  };
  const [formData, setFormData] = useState<Partial<JobPosting>>(emptyForm);

  const filtered = state.jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || j.status === filterStatus;
    return matchSearch && matchStatus;
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

  const addReq = () => {
    if (reqInput.trim()) {
      setFormData({ ...formData, requirements: [...(formData.requirements || []), reqInput.trim()] });
      setReqInput('');
    }
  };
  const removeReq = (idx: number) => {
    setFormData({ ...formData, requirements: (formData.requirements || []).filter((_, i) => i !== idx) });
  };

  const addResp = () => {
    if (respInput.trim()) {
      setFormData({ ...formData, responsibilities: [...(formData.responsibilities || []), respInput.trim()] });
      setRespInput('');
    }
  };
  const removeResp = (idx: number) => {
    setFormData({ ...formData, responsibilities: (formData.responsibilities || []).filter((_, i) => i !== idx) });
  };

  const typeLabels: Record<string, string> = {
    'full-time': 'Full-Time', 'part-time': 'Part-Time', 'contract': 'Contract', 'internship': 'Internship'
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-3xl font-serif text-white mb-1">Careers & Job Postings</h3>
          <p className="text-gray-400 text-sm">Create and manage open positions displayed on the "Join Our Team" page.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }}
          className="px-6 py-3 bg-vitorra-gold text-[#242424] rounded-xl font-bold shadow-lg shadow-vitorra-gold/20 hover:bg-yellow-500 transition-colors flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Post New Job
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-black/40 border border-white/5 rounded-xl p-4">
          <div className="text-2xl font-serif text-white">{state.jobs.length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Total Postings</div>
        </div>
        <div className="bg-black/40 border border-white/5 rounded-xl p-4">
          <div className="text-2xl font-serif text-emerald-400">{state.jobs.filter(j => j.status === 'open').length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Open</div>
        </div>
        <div className="bg-black/40 border border-white/5 rounded-xl p-4">
          <div className="text-2xl font-serif text-gray-400">{state.jobs.filter(j => j.status === 'closed').length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Closed</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-black/30 border border-white/5 rounded-2xl p-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold" />
        </div>
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
          {(['all', 'open', 'closed'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${filterStatus === s ? 'bg-vitorra-gold text-black' : 'text-gray-400 hover:text-white'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-vitorra-gold/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h4 className="text-xl font-serif text-white">{editingId ? 'Edit Position' : 'New Job Posting'}</h4>
            <button onClick={cancelForm} className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Job Title *</label>
                <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold" placeholder="e.g. Operations Manager" /></div>
              <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Department *</label>
                <input required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold" placeholder="e.g. Logistics" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Location *</label>
                <input required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold" placeholder="e.g. Kampala, Uganda" /></div>
              <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Employment Type</label>
                <select value={formData.type || 'full-time'} onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold">
                  <option value="full-time">Full-Time</option><option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option><option value="internship">Internship</option>
                </select></div>
              <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Salary Range (Optional)</label>
                <input value={formData.salary || ''} onChange={e => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold" placeholder="e.g. UGX 2,000,000 - 4,000,000" /></div>
            </div>

            <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Job Description *</label>
              <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold h-32 resize-none" placeholder="Full description of the role, team, and expectations..." /></div>

            {/* Requirements */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Requirements</label>
              <div className="space-y-2 mb-3">
                {(formData.requirements || []).map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg">
                    <span className="text-sm text-white flex-1">{req}</span>
                    <button type="button" onClick={() => removeReq(idx)} className="text-gray-500 hover:text-red-400 shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={reqInput} onChange={e => setReqInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addReq(); } }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-vitorra-gold" placeholder="Add a requirement..." />
                <button type="button" onClick={addReq} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10">Add</button>
              </div>
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Responsibilities</label>
              <div className="space-y-2 mb-3">
                {(formData.responsibilities || []).map((resp, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg">
                    <span className="text-sm text-white flex-1">{resp}</span>
                    <button type="button" onClick={() => removeResp(idx)} className="text-gray-500 hover:text-red-400 shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={respInput} onChange={e => setRespInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addResp(); } }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-vitorra-gold" placeholder="Add a responsibility..." />
                <button type="button" onClick={addResp} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10">Add</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Status</label>
                <select value={formData.status || 'open'} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold">
                  <option value="open">Open</option><option value="closed">Closed</option>
                </select></div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button type="submit" className="px-8 py-3 bg-vitorra-gold text-black font-bold rounded-xl hover:bg-yellow-500 shadow-lg transition-colors flex items-center gap-2">
                <Check className="w-4 h-4" /> {editingId ? 'Update Position' : 'Post Job'}
              </button>
              <button type="button" onClick={cancelForm} className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors border border-white/10">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-3">
        {filtered.map(j => (
          <div key={j.id} className="group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-[#0d0d0d] border border-white/5 hover:border-vitorra-gold/20 rounded-2xl transition-all">
            <div className="flex gap-4 items-start sm:items-center w-full">
              <div className="w-12 h-12 rounded-xl bg-vitorra-gold/10 text-vitorra-gold flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-base font-medium text-white group-hover:text-vitorra-gold transition-colors">{j.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${j.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                    {j.status}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold uppercase">{typeLabels[j.type] || j.type}</span>
                </div>
                <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{j.department}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{j.postedDate}</span>
                  {j.requirements.length > 0 && <span>{j.requirements.length} requirement{j.requirements.length > 1 ? 's' : ''}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button onClick={() => updateJob(j.id, { status: j.status === 'open' ? 'closed' : 'open' })} title={j.status === 'open' ? 'Close Position' : 'Reopen Position'}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10">
                {j.status === 'open' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => startEdit(j)}
                className="p-2 rounded-lg bg-white/5 hover:bg-vitorra-gold/10 text-gray-400 hover:text-vitorra-gold transition-colors border border-white/10">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => { if (confirm(`Delete "${j.title}"?`)) removeJob(j.id) }}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors border border-white/10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl text-gray-500">
            {search || filterStatus !== 'all' ? 'No jobs match your filters.' : 'No job postings yet. Create your first listing!'}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useCMS, BlogPost } from '../../../context/CMSContext';
import FileUpload from '../../../components/ui/FileUpload';
import { useAuth } from '../../../context/AuthContext';
import { Search, Plus, X, Edit3, Trash2, Eye, EyeOff, Check, CalendarDays, User, Tag } from 'lucide-react';

export default function BlogsManager() {
  const { state, addBlog, updateBlog, removeBlog } = useCMS();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [tagInput, setTagInput] = useState('');

  const emptyForm: Partial<BlogPost> = { title: '', excerpt: '', content: '', imageUrl: '', status: 'draft', tags: [], category: 'News' };
  const [formData, setFormData] = useState<Partial<BlogPost>>(emptyForm);

  const filtered = state.blogs.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (b.status || 'published') === filterStatus;
    return matchSearch && matchStatus;
  });

  const startEdit = (b: BlogPost) => {
    setFormData({ ...b });
    setEditingId(b.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateBlog(editingId, formData);
      setEditingId(null);
    } else {
      addBlog({
        ...(formData as BlogPost),
        id: Date.now().toString(),
        author: user?.name || "Vitorra Administration",
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      });
    }
    setShowForm(false);
    setFormData(emptyForm);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setFormData(emptyForm); };

  const addTag = () => {
    if (tagInput.trim() && !(formData.tags || []).includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] });
      setTagInput('');
    }
  };
  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: (formData.tags || []).filter(t => t !== tag) });
  };

  const toggleStatus = (b: BlogPost) => {
    updateBlog(b.id, { status: (b.status || 'published') === 'published' ? 'draft' : 'published' });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-3xl font-serif text-white mb-1">News & Publications</h3>
          <p className="text-gray-400 text-sm">Create, edit, and manage articles, press releases, and company updates.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }}
          className="px-6 py-3 bg-vitorra-gold text-[#242424] rounded-xl font-bold shadow-lg shadow-vitorra-gold/20 hover:bg-yellow-500 transition-colors flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Write New Post
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-black/40 border border-white/5 rounded-xl p-4">
          <div className="text-2xl font-serif text-white">{state.blogs.length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Total Posts</div>
        </div>
        <div className="bg-black/40 border border-white/5 rounded-xl p-4">
          <div className="text-2xl font-serif text-emerald-400">{state.blogs.filter(b => (b.status || 'published') === 'published').length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Published</div>
        </div>
        <div className="bg-black/40 border border-white/5 rounded-xl p-4">
          <div className="text-2xl font-serif text-amber-400">{state.blogs.filter(b => b.status === 'draft').length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Drafts</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-black/30 border border-white/5 rounded-2xl p-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold" />
        </div>
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
          {(['all', 'published', 'draft'] as const).map(s => (
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
            <h4 className="text-xl font-serif text-white">{editingId ? 'Edit Post' : 'New Publication'}</h4>
            <button onClick={cancelForm} className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Post Title *</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg outline-none focus:border-vitorra-gold" placeholder="Enter a compelling headline..." /></div>
                <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Excerpt (shows on card) *</label>
                  <textarea required value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold h-20 resize-none" placeholder="A brief summary for the news grid..." /></div>
                <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Full Content *</label>
                  <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold h-72 font-mono text-sm resize-none" placeholder="Write the full publication here..." /></div>
                {/* Tags */}
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(formData.tags || []).map(tag => (
                      <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-vitorra-gold/10 text-vitorra-gold border border-vitorra-gold/20 rounded-full text-xs font-medium">
                        <Tag className="w-3 h-3" />{tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addTag(); }}}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-vitorra-gold" placeholder="Add a tag..." />
                    <button type="button" onClick={addTag} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition">Add</button>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <FileUpload label="Cover Image" currentImage={formData.imageUrl} onUploadSuccess={url => setFormData({...formData, imageUrl: url})} />
                <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Publish Status</label>
                  <select value={formData.status || 'draft'} onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold">
                    <option value="published">Published</option><option value="draft">Draft</option>
                  </select></div>
                <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Category</label>
                  <select value={formData.category || 'News'} onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold">
                    <option value="News">News</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Press Release">Press Release</option>
                    <option value="Industry Insights">Industry Insights</option>
                  </select></div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Author</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-vitorra-gold/20 text-vitorra-gold flex items-center justify-center font-bold text-xs">{user?.name.charAt(0) || 'A'}</div>
                    <span className="text-white text-sm font-medium">{user?.name || 'Administrator'}</span>
                  </div>
                  {editingId && <p className="text-xs text-gray-500 mt-3">Originally by: {state.blogs.find(b => b.id === editingId)?.author}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button type="submit" className="px-8 py-3 bg-vitorra-gold text-black font-bold rounded-xl hover:bg-yellow-500 shadow-lg transition-colors flex items-center gap-2">
                <Check className="w-4 h-4" /> {editingId ? 'Update Post' : formData.status === 'published' ? 'Publish Now' : 'Save as Draft'}
              </button>
              <button type="button" onClick={cancelForm} className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors border border-white/10">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-3">
        {filtered.map(b => (
          <div key={b.id} className="group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-[#0d0d0d] border border-white/5 hover:border-vitorra-gold/20 rounded-2xl transition-all">
            <div className="flex gap-4 items-start sm:items-center w-full">
              {b.imageUrl ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 hidden sm:block">
                  <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 hidden sm:flex items-center justify-center text-gray-600 text-xs font-bold">V</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-medium text-white group-hover:text-vitorra-gold transition-colors truncate">{b.title}</h4>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${(b.status || 'published') === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {b.status || 'published'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate max-w-lg mb-2">{b.excerpt}</p>
                <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{b.date}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{b.author}</span>
                  {b.tags && b.tags.length > 0 && b.tags.slice(0, 3).map(t => (
                    <span key={t} className="px-1.5 py-0.5 bg-white/5 rounded text-[10px]">{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button onClick={() => toggleStatus(b)} title={b.status === 'published' ? 'Unpublish' : 'Publish'}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10">
                {(b.status || 'published') === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => startEdit(b)}
                className="p-2 rounded-lg bg-white/5 hover:bg-vitorra-gold/10 text-gray-400 hover:text-vitorra-gold transition-colors border border-white/10">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => { if(confirm(`Delete "${b.title}"?`)) removeBlog(b.id) }}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors border border-white/10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl text-gray-500">
            {search || filterStatus !== 'all' ? 'No posts match your filters.' : 'No publications yet. Create your first post!'}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useCMS, BlogPost } from '../../../context/CMSContext';
import MediaPickerButton from '../ui/MediaPickerButton';
import { useAuth } from '../../../context/AuthContext';
import { Search, Plus, X, Edit3, Trash2, Eye, EyeOff, Check, CalendarDays, User, Tag, FileText } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

export default function BlogsManager() {
  const { state, addBlog, updateBlog, removeBlog } = useCMS();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [tagInput, setTagInput] = useState('');

  const emptyForm: Partial<BlogPost> = { title: '', excerpt: '', content: '', imageUrl: '', documentUrl: '', documentName: '', status: 'draft', tags: [], category: 'News' };
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
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>News & Publications</h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Create, edit, and manage articles, press releases, and company updates.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }}
          style={{
            padding: '10px 24px', background: 'var(--accent-primary)', color: 'white',
            borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 700,
            fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(198,137,88,0.3)',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-primary-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-primary)'}
        >
          <Plus className="w-4 h-4" /> Write New Post
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { value: state.blogs.length, label: 'Total Posts', color: 'var(--text-primary)' },
          { value: state.blogs.filter(b => (b.status || 'published') === 'published').length, label: 'Published', color: 'var(--success)' },
          { value: state.blogs.filter(b => b.status === 'draft').length, label: 'Drafts', color: 'var(--warning)' },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)',
        alignItems: 'center', background: 'var(--bg-surface)',
        border: '1px solid var(--border-faint)', borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
      }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..."
            style={{
              width: '100%', height: 38, paddingLeft: 36, paddingRight: 12,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', outline: 'none',
            }} />
        </div>
        <div style={{
          display: 'flex', gap: 4, background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)', padding: 4, border: '1px solid var(--border-dim)',
        }}>
          {(['all', 'published', 'draft'] as const).map(s => (
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
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)', padding: '24px 28px', position: 'relative',
        }}>
          {/* Gold glow accent */}
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200,
            background: 'rgba(198,137,88,0.06)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative', zIndex: 10 }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {editingId ? 'Edit Post' : 'New Publication'}
            </h4>
            <button onClick={cancelForm} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
              borderRadius: 'var(--radius-md)', width: 32, height: 32, cursor: 'pointer', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition-fast)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-muted)'; e.currentTarget.style.color = 'var(--danger)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            ><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
              {/* Left column — content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Title */}
                <div>
                  <label style={labelStyle}>Post Title *</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter a compelling headline..."
                    style={{ ...inputStyle, fontSize: 'var(--text-lg)', fontWeight: 600, height: 48 }} />
                </div>

                {/* Excerpt */}
                <div>
                  <label style={labelStyle}>Excerpt (shows on card) *</label>
                  <textarea required value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})}
                    placeholder="A brief summary for the news grid..."
                    style={{ ...inputStyle, height: 72, resize: 'none', paddingTop: 10 }} />
                </div>

                {/* Rich Text Editor */}
                <div>
                  <label style={labelStyle}>Full Content *</label>
                  <RichTextEditor
                    value={formData.content || ''}
                    onChange={(html) => setFormData({...formData, content: html})}
                    placeholder="Write your full publication here..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label style={labelStyle}>Tags</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {(formData.tags || []).map(tag => (
                      <span key={tag} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                        background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)',
                        border: '1px solid rgba(198,137,88,0.25)', borderRadius: 'var(--radius-full)',
                        fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500,
                      }}>
                        <Tag size={11} />{tag}
                        <button type="button" onClick={() => removeTag(tag)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex',
                        }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                        ><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addTag(); }}}
                      placeholder="Add a tag..."
                      style={{ ...inputStyle, flex: 1, height: 36, fontSize: 'var(--text-sm)' }} />
                    <button type="button" onClick={addTag} style={{
                      padding: '0 16px', height: 36, background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500,
                      color: 'var(--text-secondary)', cursor: 'pointer', transition: 'var(--transition-fast)',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >Add</button>
                  </div>
                </div>
              </div>

              {/* Right column — metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Cover Image */}
                <MediaPickerButton label="Cover Image" value={formData.imageUrl} onChange={url => setFormData({...formData, imageUrl: url})} accept="image" />

                {/* Document attachment */}
                <div style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                }}>
                  <label style={labelStyle}>Attached Document (PDF)</label>
                  {formData.documentUrl ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-dim)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <FileText size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formData.documentName || 'Document attached'}
                        </span>
                      </div>
                      <button type="button" onClick={() => setFormData({...formData, documentUrl: '', documentName: ''})}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4, display: 'flex', flexShrink: 0 }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <MediaPickerButton label="Upload PDF" value="" onChange={(url) => setFormData({...formData, documentUrl: url, documentName: 'Attached Document'})} accept="document" />
                  )}
                </div>

                {/* Status */}
                <div>
                  <label style={labelStyle}>Publish Status</label>
                  <select value={formData.status || 'draft'} onChange={e => setFormData({...formData, status: e.target.value as any})}
                    style={{ ...inputStyle, height: 42, cursor: 'pointer' }}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={formData.category || 'News'} onChange={e => setFormData({...formData, category: e.target.value})}
                    style={{ ...inputStyle, height: 42, cursor: 'pointer' }}>
                    <option value="News">News</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Press Release">Press Release</option>
                    <option value="Industry Insights">Industry Insights</option>
                  </select>
                </div>

                {/* Author */}
                <div style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, margin: '0 0 8px' }}>Author</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: 'var(--text-xs)', fontWeight: 700,
                    }}>{user?.name.charAt(0) || 'A'}</div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{user?.name || 'Administrator'}</span>
                  </div>
                  {editingId && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', marginTop: 10 }}>
                      Originally by: {state.blogs.find(b => b.id === editingId)?.author}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              paddingTop: 20, marginTop: 24, borderTop: '1px solid var(--border-faint)',
            }}>
              <button type="submit" style={{
                padding: '10px 28px', background: 'var(--accent-primary)', color: 'white',
                borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 700,
                fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 12px rgba(198,137,88,0.3)',
                transition: 'var(--transition-fast)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-primary-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-primary)'}
              >
                <Check size={16} /> {editingId ? 'Update Post' : formData.status === 'published' ? 'Publish Now' : 'Save as Draft'}
              </button>
              <button type="button" onClick={cancelForm} style={{
                padding: '10px 20px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)', cursor: 'pointer', transition: 'var(--transition-fast)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filtered.map(b => (
          <div key={b.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'var(--space-5)', background: 'var(--bg-surface)',
            border: '1px solid var(--border-faint)', borderRadius: 'var(--radius-lg)',
            transition: 'var(--transition-fast)', cursor: 'default',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(198,137,88,0.25)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-faint)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, minWidth: 0 }}>
              {b.imageUrl ? (
                <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-dim)' }}>
                  <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-md)', flexShrink: 0,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-tertiary)',
                }}>V</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h4 style={{
                    fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', fontWeight: 600,
                    color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{b.title}</h4>
                  <span style={{
                    flexShrink: 0, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase',
                    background: (b.status || 'published') === 'published' ? 'var(--success-muted)' : 'var(--warning-muted)',
                    color: (b.status || 'published') === 'published' ? 'var(--success)' : 'var(--warning)',
                  }}>{b.status || 'published'}</span>
                </div>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                  margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500,
                }}>{b.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CalendarDays size={12} />{b.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} />{b.author}</span>
                  {b.tags && b.tags.length > 0 && b.tags.slice(0, 3).map(t => (
                    <span key={t} style={{
                      padding: '1px 6px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-2xs)',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 16 }}>
              <ActionBtn onClick={() => toggleStatus(b)} title={b.status === 'published' ? 'Unpublish' : 'Publish'}>
                {(b.status || 'published') === 'published' ? <EyeOff size={15} /> : <Eye size={15} />}
              </ActionBtn>
              <ActionBtn onClick={() => startEdit(b)} title="Edit" hoverColor="var(--accent-primary)">
                <Edit3 size={15} />
              </ActionBtn>
              <ActionBtn onClick={() => { if(confirm(`Delete "${b.title}"?`)) removeBlog(b.id) }} title="Delete" hoverColor="var(--danger)">
                <Trash2 size={15} />
              </ActionBtn>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            border: '1px dashed var(--border-dim)', borderRadius: 'var(--radius-lg)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)',
          }}>
            {search || filterStatus !== 'all' ? 'No posts match your filters.' : 'No publications yet. Create your first post!'}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared styles ─────────────────────────────────────────── */
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

/* ── Small action button ──────────────────────────────────── */
function ActionBtn({ children, onClick, title, hoverColor }: {
  children: React.ReactNode; onClick: () => void; title: string; hoverColor?: string;
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
        e.currentTarget.style.background = hoverColor ? `${hoverColor}15` : 'var(--bg-overlay)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text-tertiary)';
        e.currentTarget.style.borderColor = 'var(--border-dim)';
        e.currentTarget.style.background = 'var(--bg-elevated)';
      }}
    >{children}</button>
  );
}

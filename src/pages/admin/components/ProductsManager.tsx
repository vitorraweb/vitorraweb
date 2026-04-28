import { useState } from 'react';
import { useCMS, Product, ProductVariant } from '../../../context/CMSContext';
import MediaPickerButton from '../ui/MediaPickerButton';
import RichTextEditor from './RichTextEditor';
import {
  Search, Plus, X, Package, Edit3, Trash2, Eye, EyeOff, Check, ChevronDown, ChevronRight,
  DollarSign, Archive, LayoutGrid, List, AlertTriangle, Copy, Hash, ImagePlus,
  Info, MapPin, Palette, Settings, Tag, BarChart3, Layers
} from 'lucide-react';

type ViewMode = 'table' | 'grid';

export default function ProductsManager() {
  const { state, addProduct, updateProduct, removeProduct } = useCMS();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [variantsOpen, setVariantsOpen] = useState(true);

  const emptyForm: Partial<Product> = {
    name: '', description: '', icon: 'Globe', imageUrl: '', path: '/products/new',
    type: 'square', category: '', categoryId: '', color: 'text-vitorra-gold', price: 0, sku: '', stock: 100, status: 'active',
    variants: [],
  };
  const [formData, setFormData] = useState<Partial<Product>>(emptyForm);

  const categories = ['all', ...new Set(state.products.map(p => p.category).filter(Boolean))];

  const filtered = state.products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || p.category === filterCategory;
    const matchStatus = filterStatus === 'all' || (p.status || 'active') === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const formatPrice = (n?: number) => n ? new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n) : '—';

  const startEdit = (p: Product) => {
    setFormData({ ...p, variants: p.variants ? [...p.variants] : [] });
    setEditingId(p.id);
    setShowForm(true);
    setVariantsOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateProduct(editingId, formData);
      setEditingId(null);
    } else {
      addProduct({ ...(formData as Product), id: Date.now().toString() });
    }
    setShowForm(false);
    setFormData(emptyForm);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setFormData(emptyForm); };

  const duplicateProduct = (p: Product) => {
    addProduct({ ...p, id: Date.now().toString(), name: `${p.name} (Copy)`, status: 'draft' });
  };

  // Variant helpers
  const addVariant = () => {
    const nv: ProductVariant = { id: `var-${Date.now()}`, name: '', price: 0, sku: '', stock: 0, description: '', isB2B: false };
    setFormData({ ...formData, variants: [...(formData.variants || []), nv] });
  };
  const updateVariant = (vid: string, updates: Partial<ProductVariant>) => {
    setFormData({ ...formData, variants: (formData.variants || []).map(v => v.id === vid ? { ...v, ...updates } : v) });
  };
  const removeVariant = (vid: string) => {
    setFormData({ ...formData, variants: (formData.variants || []).filter(v => v.id !== vid) });
  };

  // Stats
  const totalProducts = state.products.length;
  const activeProducts = state.products.filter(p => p.status !== 'archived' && p.status !== 'draft').length;
  const totalVariants = state.products.reduce((s, p) => s + (p.variants?.length || 0), 0);
  const lowStock = state.products.filter(p => (p.stock || 0) < 10 && p.status === 'active').length;

  const stockBadge = (stock?: number) => {
    const s = stock || 0;
    if (s === 0) return { label: 'Out of Stock', color: 'var(--danger)', bg: 'var(--danger-muted)' };
    if (s < 10) return { label: `Low (${s})`, color: 'var(--warning)', bg: 'var(--warning-muted)' };
    return { label: `${s} in stock`, color: 'var(--success)', bg: 'var(--success-muted)' };
  };

  // Shared styles
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
            Products & Subsidiaries
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Manage your entire product catalog — details, pricing, variants, and inventory.
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
        ><Plus size={16} /> Add Product</button>
      </div>

      {/* ═══ Metrics ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { value: totalProducts, label: 'Total Products', color: 'var(--text-primary)', icon: <Package size={18} /> },
          { value: activeProducts, label: 'Active', color: 'var(--success)', icon: <Eye size={18} /> },
          { value: totalVariants, label: 'Total Variants', color: '#4AB4FF', icon: <Layers size={18} /> },
          { value: lowStock, label: 'Low Stock', color: 'var(--warning)', icon: <AlertTriangle size={18} /> },
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
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            style={{ ...inputStyle, paddingLeft: 36, height: 36, fontSize: 'var(--text-sm)' }} />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{
          ...selectStyle, width: 'auto', height: 36, fontSize: 'var(--text-xs)', padding: '0 12px',
        }}>
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-dim)' }}>
          {(['all', 'active', 'draft', 'archived'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '4px 12px', borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: filterStatus === s ? 600 : 400,
              border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              background: filterStatus === s ? 'var(--accent-primary)' : 'transparent',
              color: filterStatus === s ? 'white' : 'var(--text-secondary)',
              transition: 'var(--transition-fast)',
            }}>{s}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-dim)' }}>
          <button onClick={() => setViewMode('table')} style={{
            padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
            background: viewMode === 'table' ? 'var(--accent-primary)' : 'transparent',
            color: viewMode === 'table' ? 'white' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', transition: 'var(--transition-fast)',
          }}><List size={14} /></button>
          <button onClick={() => setViewMode('grid')} style={{
            padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
            background: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent',
            color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', transition: 'var(--transition-fast)',
          }}><LayoutGrid size={14} /></button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PRODUCT FORM
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
                {editingId ? 'Edit Product' : 'Create New Product'}
              </h4>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                Configure product details, pricing, inventory, and variants.
              </p>
            </div>
            <button onClick={cancelForm} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
              borderRadius: 'var(--radius-md)', width: 34, height: 34, cursor: 'pointer', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 10 }}>

            {/* ── Basic Info ── */}
            <SectionHeader icon={<Info size={13} />} title="Basic Information" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 28 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Product Name *</label>
                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. SEAL Wound Care" style={{ ...inputStyle, fontSize: 'var(--text-lg)', fontWeight: 600, height: 48 }} />
                  </div>
                  <div>
                    <label style={labelStyle}>SKU Code</label>
                    <input value={formData.sku || ''} onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g. SEAL-OTC-001" style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Description *</label>
                  <RichTextEditor value={formData.description || ''} onChange={html => setFormData({ ...formData, description: html })}
                    placeholder="Full product description, features, and positioning..." />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <MediaPickerButton label="Product Image" value={formData.imageUrl} onChange={url => setFormData({ ...formData, imageUrl: url })} accept="image" />
                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={formData.categoryId || ''} onChange={e => {
                    const cat = state.categories.find(c => c.id === e.target.value);
                    setFormData({ ...formData, categoryId: e.target.value, category: cat?.name || e.target.value });
                  }} style={selectStyle}>
                    <option value="">Select...</option>
                    {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={formData.status || 'active'} onChange={e => setFormData({ ...formData, status: e.target.value as any })} style={selectStyle}>
                    <option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Pricing & Inventory ── */}
            <SectionHeader icon={<DollarSign size={13} />} title="Pricing & Inventory" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
              <div>
                <label style={labelStyle}>Base Price (UGX)</label>
                <input type="number" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Stock Qty</label>
                <input type="number" value={formData.stock ?? ''} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Grid Type</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} style={selectStyle}>
                  <option value="square">Standard (1 Col)</option><option value="wide">Featured (2 Cols)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Route Path</label>
                <input value={formData.path} onChange={e => setFormData({ ...formData, path: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }} />
              </div>
            </div>

            {/* ── Variants ── */}
            <div style={{
              border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-lg)',
              overflow: 'hidden', marginBottom: 28,
            }}>
              <button type="button" onClick={() => setVariantsOpen(!variantsOpen)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', background: 'var(--bg-elevated)', border: 'none', cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Layers size={15} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>Product Variants</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-2xs)', fontWeight: 700,
                    background: 'var(--bg-overlay)', color: 'var(--text-tertiary)',
                  }}>{(formData.variants || []).length}</span>
                </div>
                <div style={{ color: 'var(--text-tertiary)' }}>
                  {variantsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>
              {variantsOpen && (
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(formData.variants || []).length === 0 && (
                    <div style={{
                      textAlign: 'center', padding: '32px 16px',
                      fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)',
                    }}>No variants — add variants for different sizes, configurations, or pricing tiers.</div>
                  )}
                  {(formData.variants || []).map((variant, idx) => (
                    <div key={variant.id} style={{
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
                      borderRadius: 'var(--radius-md)', padding: 16,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Variant {idx + 1}</span>
                        <button type="button" onClick={() => removeVariant(variant.id)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, display: 'flex',
                        }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                        ><Trash2 size={14} /></button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ ...labelStyle, fontSize: '9px', marginBottom: 4 }}>Name *</label>
                          <input value={variant.name} onChange={e => updateVariant(variant.id, { name: e.target.value })}
                            placeholder="e.g. SEAL™ OTC Spray (1.5 oz)" style={{ ...inputStyle, height: 36, fontSize: 'var(--text-sm)' }} />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, fontSize: '9px', marginBottom: 4 }}>Price (UGX)</label>
                          <input type="number" value={variant.price || ''} onChange={e => updateVariant(variant.id, { price: Number(e.target.value) })}
                            style={{ ...inputStyle, height: 36, fontSize: 'var(--text-sm)' }} />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, fontSize: '9px', marginBottom: 4 }}>SKU</label>
                          <input value={variant.sku} onChange={e => updateVariant(variant.id, { sku: e.target.value })}
                            style={{ ...inputStyle, height: 36, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }} />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, fontSize: '9px', marginBottom: 4 }}>Stock</label>
                          <input type="number" value={variant.stock ?? ''} onChange={e => updateVariant(variant.id, { stock: Number(e.target.value) })}
                            style={{ ...inputStyle, height: 36, fontSize: 'var(--text-sm)' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addVariant} style={{
                    width: '100%', padding: '10px 0',
                    border: '2px dashed var(--border-dim)', borderRadius: 'var(--radius-md)',
                    background: 'transparent', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500,
                    color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'var(--transition-fast)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                  ><Plus size={15} /> Add Variant</button>
                </div>
              )}
            </div>

            {/* ── Actions ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              paddingTop: 20, borderTop: '1px solid var(--border-faint)',
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
                <Check size={16} /> {editingId ? 'Save Changes' : 'Create Product'}
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
          TABLE VIEW (Default — Professional Inventory Style)
         ═══════════════════════════════════════════════════════════════════ */}
      {viewMode === 'table' && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '56px 1fr 120px 100px 80px 110px 100px 130px',
            padding: '10px 20px', borderBottom: '1px solid var(--border-dim)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700,
            color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em',
            background: 'var(--bg-elevated)',
          }}>
            <span />
            <span>Product</span>
            <span>Category</span>
            <span style={{ textAlign: 'center' }}>Variants</span>
            <span style={{ textAlign: 'center' }}>Stock</span>
            <span style={{ textAlign: 'right' }}>Price</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {/* Rows */}
          {filtered.map(p => {
            const sb = stockBadge(p.stock || (p.variants?.reduce((s, v) => s + v.stock, 0) || 0));
            const isExp = expandedRow === p.id;
            return (
              <div key={p.id} style={{ borderBottom: '1px solid var(--border-faint)' }}>
                <div
                  onClick={() => setExpandedRow(isExp ? null : p.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '56px 1fr 120px 100px 80px 110px 100px 130px',
                    padding: '12px 20px', alignItems: 'center', cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    overflow: 'hidden', border: '1px solid var(--border-dim)', flexShrink: 0,
                  }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={16} style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                    )}
                  </div>

                  {/* Name & description */}
                  <div style={{ minWidth: 0, paddingRight: 12 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.sku ? <span style={{ fontFamily: 'var(--font-mono)', marginRight: 8 }}>{p.sku}</span> : null}
                      {p.description?.replace(/<[^>]*>/g, '').slice(0, 60)}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-2xs)', fontWeight: 600,
                      background: 'var(--bg-overlay)', color: 'var(--text-secondary)',
                      border: '1px solid var(--border-dim)',
                    }}>{p.category || '—'}</span>
                  </div>

                  {/* Variants */}
                  <div style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.variants?.length || 0}
                  </div>

                  {/* Stock */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-2xs)', fontWeight: 700,
                      background: sb.bg, color: sb.color,
                    }}>{(p.stock || p.variants?.reduce((s, v) => s + v.stock, 0) || 0)}</span>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {formatPrice(p.price)}
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase',
                      background: (p.status || 'active') === 'active' ? 'var(--success-muted)' : (p.status === 'archived' ? 'var(--neutral-muted)' : 'var(--warning-muted)'),
                      color: (p.status || 'active') === 'active' ? 'var(--success)' : (p.status === 'archived' ? 'var(--neutral)' : 'var(--warning)'),
                    }}>{p.status || 'active'}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <ActionBtn onClick={e => { e.stopPropagation(); duplicateProduct(p); }} title="Duplicate"><Copy size={14} /></ActionBtn>
                    <ActionBtn onClick={e => { e.stopPropagation(); startEdit(p); }} title="Edit" hoverColor="var(--accent-primary)"><Edit3 size={14} /></ActionBtn>
                    <ActionBtn onClick={e => { e.stopPropagation(); updateProduct(p.id, { status: p.status === 'archived' ? 'active' : 'archived' }); }} title="Archive"><Archive size={14} /></ActionBtn>
                    <ActionBtn onClick={e => { e.stopPropagation(); if (confirm(`Delete ${p.name}?`)) removeProduct(p.id); }} title="Delete" hoverColor="var(--danger)"><Trash2 size={14} /></ActionBtn>
                    <div style={{ width: 1, height: 16, background: 'var(--border-dim)', margin: '0 2px' }} />
                    <div style={{ color: isExp ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                      {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>
                </div>

                {/* Expanded variant table */}
                {isExp && (
                  <div style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-faint)', padding: '16px 24px 16px 76px' }}>
                    {(p.variants || []).length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)' }}>
                        <thead>
                          <tr style={{ fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 'var(--text-2xs)' }}>
                            <th style={{ padding: '6px 0', textAlign: 'left' }}>SKU</th>
                            <th style={{ padding: '6px 0', textAlign: 'left' }}>Variant</th>
                            <th style={{ padding: '6px 0', textAlign: 'right' }}>Price</th>
                            <th style={{ padding: '6px 0', textAlign: 'right' }}>Stock</th>
                            <th style={{ padding: '6px 0', textAlign: 'center' }}>B2B</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.variants!.map(v => {
                            const vs = stockBadge(v.stock);
                            return (
                              <tr key={v.id} style={{ borderTop: '1px solid var(--border-faint)' }}>
                                <td style={{ padding: '8px 0', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', opacity: 0.7 }}>{v.sku || '—'}</td>
                                <td style={{ padding: '8px 0', color: 'var(--text-primary)', fontWeight: 500 }}>{v.name}</td>
                                <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--text-secondary)' }}>{formatPrice(v.price)}</td>
                                <td style={{ padding: '8px 0', textAlign: 'right' }}>
                                  <span style={{ padding: '2px 6px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-2xs)', fontWeight: 700, background: vs.bg, color: vs.color }}>{v.stock}</span>
                                </td>
                                <td style={{ padding: '8px 0', textAlign: 'center', color: v.isB2B ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>{v.isB2B ? '✓' : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '8px 0' }}>
                        No variants configured for this product.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '48px 20px',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)',
            }}>No products match your filters.</div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          GRID VIEW (Compact cards)
         ═══════════════════════════════════════════════════════════════════ */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filtered.map(p => {
            const sb = stockBadge(p.stock || (p.variants?.reduce((s, v) => s + v.stock, 0) || 0));
            return (
              <div key={p.id} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                transition: 'var(--transition-fast)', opacity: p.status === 'archived' ? 0.5 : 1,
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(198,137,88,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-faint)'}
              >
                {/* Image */}
                <div style={{ position: 'relative', height: 120, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />}
                  <div style={{ position: 'absolute', top: 8, left: 8 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase',
                      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                      color: 'var(--text-secondary)', border: '1px solid var(--border-dim)',
                    }}>{p.category || '—'}</span>
                  </div>
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase',
                      background: (p.status || 'active') === 'active' ? 'var(--success-muted)' : 'var(--warning-muted)',
                      color: (p.status || 'active') === 'active' ? 'var(--success)' : 'var(--warning)',
                    }}>{p.status || 'active'}</span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: 16 }}>
                  <h4 style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>{p.name}</h4>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '0 0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.description?.replace(/<[^>]*>/g, '').slice(0, 80) || '—'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '10px 0', borderTop: '1px solid var(--border-faint)', borderBottom: '1px solid var(--border-faint)', marginBottom: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>Price</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(p.price)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>Variants</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{p.variants?.length || 0}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>Stock</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: sb.color }}>{p.stock || p.variants?.reduce((s, v) => s + v.stock, 0) || 0}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startEdit(p)} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '7px 0', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
                      fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500,
                      color: 'var(--text-secondary)', cursor: 'pointer', transition: 'var(--transition-fast)',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-dim)'; }}
                    ><Edit3 size={13} /> Edit</button>
                    <ActionBtn onClick={() => duplicateProduct(p)} title="Duplicate"><Copy size={13} /></ActionBtn>
                    <ActionBtn onClick={() => updateProduct(p.id, { status: p.status === 'archived' ? 'active' : 'archived' })} title="Archive"><Archive size={13} /></ActionBtn>
                    <ActionBtn onClick={() => { if (confirm(`Delete ${p.name}?`)) removeProduct(p.id); }} title="Delete" hoverColor="var(--danger)"><Trash2 size={13} /></ActionBtn>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{
              gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px',
              border: '1px dashed var(--border-dim)', borderRadius: 'var(--radius-lg)',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)',
            }}>No products match your filters.</div>
          )}
        </div>
      )}
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

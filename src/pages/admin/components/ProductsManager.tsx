import { useState } from 'react';
import { useCMS, Product, ProductVariant } from '../../../context/CMSContext';
import FileUpload from '../../../components/ui/FileUpload';
import { Search, Plus, X, Package, Edit3, Trash2, Eye, EyeOff, MoreVertical, DollarSign, Archive, Check, ChevronDown, ChevronUp, ImagePlus } from 'lucide-react';

type ViewMode = 'grid' | 'table';

export default function ProductsManager() {
  const { state, addProduct, updateProduct, removeProduct } = useCMS();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
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
    return matchSearch && matchCat;
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

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  // ─── Variant Helpers ───
  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      name: '',
      price: 0,
      sku: '',
      stock: 0,
      image: '',
      description: '',
      isB2B: false,
    };
    setFormData({ ...formData, variants: [...(formData.variants || []), newVariant] });
  };

  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    setFormData({
      ...formData,
      variants: (formData.variants || []).map(v => v.id === variantId ? { ...v, ...updates } : v)
    });
  };

  const removeVariant = (variantId: string) => {
    setFormData({
      ...formData,
      variants: (formData.variants || []).filter(v => v.id !== variantId)
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-3xl font-serif text-white mb-1">Products & Subsidiaries</h3>
          <p className="text-gray-400 text-sm">Manage your entire product catalog with full control over details, pricing, variants, and inventory.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }}
          className="px-6 py-3 bg-vitorra-gold text-[#2b2b2b] rounded-xl font-bold shadow-lg shadow-vitorra-gold/20 hover:bg-yellow-500 transition-colors flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-black/30 border border-white/5 rounded-2xl p-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold capitalize">
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
          <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-vitorra-gold text-black' : 'text-gray-400 hover:text-white'}`}>Grid</button>
          <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-vitorra-gold text-black' : 'text-gray-400 hover:text-white'}`}>Table</button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-white/5 rounded-xl p-4">
          <div className="text-2xl font-serif text-white">{state.products.length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Total Products</div>
        </div>
        <div className="bg-black/40 border border-white/5 rounded-xl p-4">
          <div className="text-2xl font-serif text-emerald-400">{state.products.filter(p => p.status !== 'archived').length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Active</div>
        </div>
        <div className="bg-black/40 border border-white/5 rounded-xl p-4">
          <div className="text-2xl font-serif text-white">{state.products.reduce((s, p) => s + (p.variants?.length || 0), 0)}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Total Variants</div>
        </div>
        <div className="bg-black/40 border border-white/5 rounded-xl p-4">
          <div className="text-2xl font-serif text-vitorra-gold">{state.products.filter(p => (p.stock || 0) < 10).length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Low Stock</div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-vitorra-gold/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h4 className="text-xl font-serif text-white">{editingId ? 'Edit Product' : 'New Product'}</h4>
            <button onClick={cancelForm} className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Product Name *</label>
                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold transition-colors" placeholder="e.g. SEAL Wound Care" /></div>
                  <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">SKU Code</label>
                    <input value={formData.sku || ''} onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold transition-colors font-mono" placeholder="e.g. SEAL-OTC-001" /></div>
                </div>
                <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Description *</label>
                  <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold transition-colors h-28 resize-none" /></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Base Price (UGX)</label>
                    <input type="number" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold" placeholder="0" /></div>
                  <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Stock Qty</label>
                    <input type="number" value={formData.stock ?? ''} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold" /></div>
                  <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Category</label>
                    <select value={formData.categoryId || ''} onChange={e => {
                      const cat = state.categories.find(c => c.id === e.target.value);
                      setFormData({ ...formData, categoryId: e.target.value, category: cat?.name || e.target.value });
                    }}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold">
                      <option value="">Select...</option>
                      {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select></div>
                  <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Status</label>
                    <select value={formData.status || 'active'} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold">
                      <option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Route Path</label>
                    <input value={formData.path} onChange={e => setFormData({ ...formData, path: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-vitorra-gold" /></div>
                  <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Grid Type</label>
                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold">
                      <option value="square">Standard (1 Col)</option><option value="wide">Featured (2 Cols)</option>
                    </select></div>
                  <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Icon</label>
                    <select value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold">
                      <option value="Globe">Globe</option><option value="Truck">Truck</option><option value="Leaf">Leaf</option><option value="ShieldCheck">Shield</option>
                    </select></div>
                </div>
              </div>
              <div className="space-y-5">
                <FileUpload label="Product Image" currentImage={formData.imageUrl} onUploadSuccess={url => setFormData({ ...formData, imageUrl: url })} />
                <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Accent Color</label>
                  <select value={formData.color || 'text-vitorra-gold'} onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold">
                    <option value="text-vitorra-gold">Gold</option><option value="text-blue-400">Blue</option><option value="text-emerald-400">Green</option>
                    <option value="text-red-500">Red</option><option value="text-purple-400">Purple</option>
                  </select></div>
              </div>
            </div>

            {/* ═══════ VARIANTS EDITOR ═══════ */}
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <button type="button" onClick={() => setVariantsOpen(!variantsOpen)}
                className="w-full flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-vitorra-gold" />
                  <span className="text-sm font-bold text-white">Product Variants</span>
                  <span className="text-[10px] px-2 py-0.5 bg-white/10 text-gray-400 rounded-full font-bold">{(formData.variants || []).length}</span>
                </div>
                {variantsOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>

              {variantsOpen && (
                <div className="p-6 space-y-4">
                  {(formData.variants || []).length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No variants yet. Add variants to define different sizes, configurations, or pricing tiers.
                    </div>
                  )}

                  {(formData.variants || []).map((variant, idx) => (
                    <div key={variant.id} className="bg-black/40 border border-white/10 rounded-xl p-5 space-y-4 relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-vitorra-gold font-bold uppercase tracking-widest">Variant {idx + 1}</span>
                        <button type="button" onClick={() => removeVariant(variant.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Variant Name *</label>
                          <input value={variant.name} onChange={e => updateVariant(variant.id, { name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold" placeholder="e.g. SEAL™ OTC Spray (1.5 oz)" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">SKU</label>
                          <input value={variant.sku} onChange={e => updateVariant(variant.id, { sku: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold font-mono" placeholder="SEAL-OTC-001" /></div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Price (UGX)</label>
                          <input type="number" value={variant.price || ''} onChange={e => updateVariant(variant.id, { price: Number(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Stock</label>
                          <input type="number" value={variant.stock ?? ''} onChange={e => updateVariant(variant.id, { stock: Number(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold" /></div>
                        <div className="flex items-end gap-3">
                          <label className="flex items-center gap-2 cursor-pointer py-2.5">
                            <input type="checkbox" checked={variant.isB2B || false} onChange={e => updateVariant(variant.id, { isB2B: e.target.checked })}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-vitorra-gold focus:ring-vitorra-gold" />
                            <span className="text-xs text-gray-400 font-bold">B2B Only</span>
                          </label>
                        </div>
                        <div><label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Tag</label>
                          <input value={variant.tag || ''} onChange={e => updateVariant(variant.id, { tag: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold" placeholder="e.g. Best Seller" /></div>
                      </div>

                      <div><label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Variant Description</label>
                        <textarea value={variant.description || ''} onChange={e => updateVariant(variant.id, { description: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold h-16 resize-none" placeholder="Optional description for this variant..." /></div>

                      <div><label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Image URL</label>
                        <div className="flex items-center gap-3">
                          <input value={variant.image || ''} onChange={e => updateVariant(variant.id, { image: e.target.value })}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold font-mono" placeholder="https://..." />
                          {variant.image && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                              <img src={variant.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={addVariant}
                    className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-sm text-gray-400 hover:text-vitorra-gold hover:border-vitorra-gold/30 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Variant
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button type="submit" className="px-8 py-3 bg-vitorra-gold text-black font-bold rounded-xl hover:bg-yellow-500 shadow-lg transition-colors flex items-center gap-2">
                <Check className="w-4 h-4" /> {editingId ? 'Save Changes' : 'Create Product'}
              </button>
              <button type="button" onClick={cancelForm} className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors border border-white/10">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-black/30 border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-xs uppercase tracking-widest text-gray-500 border-b border-white/10">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">SKU</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium text-center">Variants</th>
                  <th className="p-4 font-medium text-right">Price</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div><div className="font-medium text-white">{p.name}</div><div className="text-gray-500 text-xs truncate max-w-[200px]">{p.description}</div></div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400 font-mono text-xs">{p.sku || '—'}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300">{p.category || '—'}</span></td>
                    <td className="p-4 text-center"><span className="text-white font-bold">{p.variants?.length || 0}</span></td>
                    <td className="p-4 text-right text-white font-medium">{formatPrice(p.price)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : p.status === 'archived' ? 'bg-gray-500/10 text-gray-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {p.status || 'active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-vitorra-gold transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => updateProduct(p.id, { status: p.status === 'archived' ? 'active' : 'archived' })} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-amber-400 transition-colors"><Archive className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm(`Delete ${p.name}?`)) removeProduct(p.id) }} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="p-12 text-center text-gray-500">No products match your search.</div>}
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <div key={p.id} className={`group relative overflow-hidden flex flex-col bg-[#0d0d0d] border border-white/5 hover:border-vitorra-gold/30 rounded-2xl transition-all duration-300 ${p.type === 'wide' ? 'md:col-span-2' : ''} ${p.status === 'archived' ? 'opacity-50' : ''}`}>
              {/* Image Header */}
              <div className="relative h-40 overflow-hidden bg-[#242424]">
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />
                <div className="absolute top-3 right-3 flex gap-1.5">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-md ${p.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : p.status === 'archived' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    {p.status || 'active'}
                  </span>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold uppercase text-gray-300 border border-white/10">{p.category || 'Uncategorized'}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h4 className="text-lg font-serif text-white mb-1 group-hover:text-vitorra-gold transition-colors">{p.name}</h4>
                <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">{p.description}</p>

                <div className="grid grid-cols-3 gap-3 text-center mb-4 py-3 bg-white/5 rounded-xl">
                  <div><div className="text-xs text-gray-500 uppercase mb-1">Price</div><div className="text-sm text-white font-medium">{p.price ? formatPrice(p.price) : '—'}</div></div>
                  <div><div className="text-xs text-gray-500 uppercase mb-1">Variants</div><div className="text-sm text-white font-medium">{p.variants?.length || 0}</div></div>
                  <div><div className="text-xs text-gray-500 uppercase mb-1">SKU</div><div className="text-sm text-gray-400 font-mono">{p.sku || '—'}</div></div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <button onClick={() => startEdit(p)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-vitorra-gold/10 text-gray-400 hover:text-vitorra-gold text-sm font-medium transition-colors border border-white/10 hover:border-vitorra-gold/30">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => updateProduct(p.id, { status: p.status === 'archived' ? 'active' : 'archived' })}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-amber-400 transition-colors border border-white/10">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (confirm(`Delete ${p.name}?`)) removeProduct(p.id) }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors border border-white/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {filtered.length === 0 && viewMode === 'grid' && (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl text-gray-500">No products match your filters.</div>
      )}
    </div>
  );
}

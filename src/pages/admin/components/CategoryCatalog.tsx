import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCMS, Product, ProductVariant, ProductCategory, ProductSection } from '../../../context/CMSContext';
import MediaPickerButton from '../ui/MediaPickerButton';
import {
  Plus, X, Edit3, Trash2, Check, Search, Package, DollarSign,
  BarChart3, Eye, EyeOff, Copy, ChevronDown, ChevronRight,
  ShoppingCart, Layout, Image as ImageIcon, Settings, Info,
  List, Type, Video, Palette, MoreHorizontal
} from 'lucide-react';

interface Props {
  categoryId: string;
}

export default function CategoryCatalog({ categoryId }: Props) {
  const { state, addProduct, updateProduct, removeProduct, updateCategory } = useCMS();

  const category = state.categories.find(c => c.id === categoryId);
  const products = state.products.filter(p => p.categoryId === categoryId);

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState(false);
  const [categoryData, setCategoryData] = useState<Partial<ProductCategory>>({});
  const [search, setSearch] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showVariantForm, setShowVariantForm] = useState<string | null>(null);

  // Product form
  const emptyForm: Partial<Product> = {
    name: '', description: '', icon: category?.icon || 'Package', imageUrl: '', path: '',
    type: 'square', category: category?.name || '', categoryId, color: category?.color || 'text-vitorra-gold',
    status: 'active', price: 0, sku: '', stock: 0, variants: [], gallery: [], useDynamicPage: true,
    sections: [], specs: {},
  };
  const [formData, setFormData] = useState<Partial<Product>>(emptyForm);

  // Variant form
  const emptyVariant: Partial<ProductVariant> = { name: '', price: 0, sku: '', stock: 0, isB2B: false, attributes: {} };
  const [variantForm, setVariantForm] = useState<Partial<ProductVariant>>(emptyVariant);
  const [attrKey, setAttrKey] = useState('');
  const [attrVal, setAttrVal] = useState('');

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n || 0);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = products.reduce((s, p) => s + (p.variants?.reduce((vs, v) => vs + v.stock, 0) || p.stock || 0), 0);
  const totalVariants = products.reduce((s, p) => s + (p.variants?.length || 0), 0);
  const activeProducts = products.filter(p => p.status === 'active').length;

  const startEditProduct = (p: Product) => {
    setFormData({ ...p, sections: p.sections || [], gallery: p.gallery || [], specs: p.specs || {} });
    setEditingId(p.id);
    setShowProductForm(true);
  };

  const startEditCategory = () => {
    if (!category) return;
    setCategoryData({ ...category });
    setEditingCategory(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = (formData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (editingId) {
      updateProduct(editingId, { ...formData, path: formData.useDynamicPage ? `/products/${slug}` : formData.path });
      setEditingId(null);
    } else {
      addProduct({
        ...(formData as Product),
        id: slug || Date.now().toString(),
        path: `/products/${slug}`,
        useDynamicPage: true,
      });
    }
    setShowProductForm(false);
    setFormData(emptyForm);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (category) {
      await updateCategory(category.id, categoryData);
      setEditingCategory(false);
    }
  };

  const addVariant = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newVariant: ProductVariant = {
      ...(variantForm as ProductVariant),
      id: (variantForm.name || 'variant').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };
    updateProduct(productId, { variants: [...(product.variants || []), newVariant] });
    setVariantForm(emptyVariant);
    setShowVariantForm(null);
  };

  const removeVariant = (productId: string, variantId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    updateProduct(productId, { variants: (product.variants || []).filter(v => v.id !== variantId) });
  };

  const toggleProductStatus = (p: Product) => {
    updateProduct(p.id, { status: p.status === 'active' ? 'draft' : 'active' });
  };

  // Section Management
  const addSection = (type: ProductSection['type']) => {
    const newSection: ProductSection = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: '',
      subtitle: '',
      content: '',
      items: [],
      config: {}
    };
    setFormData(prev => ({ ...prev, sections: [...(prev.sections || []), newSection] }));
  };

  const updateSection = (secId: string, data: Partial<ProductSection>) => {
    setFormData(prev => ({
      ...prev,
      sections: (prev.sections || []).map(s => s.id === secId ? { ...s, ...data } : s)
    }));
  };

  const removeSection = (secId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: (prev.sections || []).filter(s => s.id !== secId)
    }));
  };

  if (!category) return <div className="p-8 text-gray-500">Category not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ─── Category Settings ─── */}
      {editingCategory ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-[#242424] border border-vitorra-gold/20 rounded-2xl p-6 lg:p-8 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-serif text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-vitorra-gold" /> Category Settings
            </h3>
            <button onClick={() => setEditingCategory(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleCategorySubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Category Name</label>
                <input value={categoryData.name} onChange={e => setCategoryData({ ...categoryData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Icon ID (Lucide)</label>
                <input value={categoryData.icon} onChange={e => setCategoryData({ ...categoryData, icon: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Global Description</label>
              <textarea value={categoryData.description} onChange={e => setCategoryData({ ...categoryData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vitorra-gold h-24 resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditingCategory(false)} className="px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 border border-white/10">Discard</button>
              <button type="submit" className="px-6 py-2 bg-vitorra-gold text-black font-bold rounded-lg hover:bg-yellow-500">Save Changes</button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#242424] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${category.color}`}>
              <Package className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-serif text-white">{category.name}</h3>
                <button onClick={startEditCategory} className="p-1.5 rounded-lg text-gray-500 hover:text-vitorra-gold hover:bg-white/5 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-1">{category.description}</p>
            </div>
          </div>
          <button onClick={() => { setShowProductForm(true); setEditingId(null); setFormData(emptyForm); }}
            className="px-6 py-3 bg-vitorra-gold text-[#1a1a1a] rounded-xl font-bold shadow-lg shadow-vitorra-gold/20 hover:bg-yellow-500 transition-colors flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Products', value: products.length, color: 'text-white' },
          { label: 'Active', value: activeProducts, color: 'text-emerald-400' },
          { label: 'Variants', value: totalVariants, color: 'text-blue-400' },
          { label: 'Total Stock', value: totalStock, color: 'text-vitorra-gold' },
        ].map(m => (
          <div key={m.label} className="bg-[#2b2b2b] border border-white/5 rounded-xl p-4">
            <div className={`text-2xl font-serif ${m.color}`}>{m.value}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">{m.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Product Form (Expanded for Deep Editing) ─── */}
      <AnimatePresence>
        {showProductForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="bg-[#242424] border border-white/10 rounded-[2.5rem] p-6 lg:p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-vitorra-gold/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/5 pb-6">
              <div>
                <h4 className="text-3xl font-serif text-white">{editingId ? 'Edit Product' : 'Create New Product'}</h4>
                <p className="text-gray-500 text-sm mt-1">Configure deep details, sections, and variants for your catalog.</p>
              </div>
              <button onClick={() => { setShowProductForm(false); setEditingId(null); setFormData(emptyForm); }}
                className="text-gray-500 hover:text-white p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-10 relative z-10">

              {/* Basic Info & Pricing */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-vitorra-gold font-bold uppercase tracking-[0.2em] text-[10px]">
                  <Info className="w-3 h-3" /> Basic Information
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-5">
                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Product Name *</label>
                      <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xl font-serif outline-none focus:border-vitorra-gold transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Short Description</label>
                      <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-vitorra-gold h-32 resize-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Base Price (UGX)</label>
                        <input type="number" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-vitorra-gold" /></div>
                      <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Base SKU</label>
                        <input value={formData.sku || ''} onChange={e => setFormData({ ...formData, sku: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-vitorra-gold font-mono" /></div>
                      <div><label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Status</label>
                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-vitorra-gold">
                          <option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option>
                        </select></div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <MediaPickerButton label="Main Feature Image" value={formData.imageUrl} onChange={url => setFormData({ ...formData, imageUrl: url })} accept="image" />
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Layout className="w-3 h-3" /> Page Config
                      </p>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={formData.useDynamicPage ?? true}
                          onChange={e => setFormData({ ...formData, useDynamicPage: e.target.checked })}
                          className="w-5 h-5 accent-vitorra-gold" />
                        <div>
                          <span className="text-sm text-gray-200 font-medium group-hover:text-vitorra-gold transition-colors">Enabled Dynamic Page</span>
                          <p className="text-[10px] text-gray-500 mt-0.5">Automates URL generation & SEO</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              {/* Advanced Content Sections */}
              <section className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-vitorra-gold font-bold uppercase tracking-[0.2em] text-[10px]">
                    <List className="w-3 h-3" /> Enhanced Page Content (Sections)
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addSection('hero')} className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">Add Hero</button>
                    <button type="button" onClick={() => addSection('features')} className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">Add Features</button>
                    <button type="button" onClick={() => addSection('content')} className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">Add Text Block</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {(formData.sections || []).length === 0 ? (
                    <div className="text-center py-12 bg-white/2 border border-dashed border-white/10 rounded-3xl text-gray-600 text-sm">
                      No custom content sections defined. Use the buttons above to build your product page layout.
                    </div>
                  ) : (
                    formData.sections?.map((sec, idx) => (
                      <div key={sec.id} className="bg-white/2 border border-white/10 rounded-2xl p-6 relative group">
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 rounded bg-vitorra-gold/10 text-vitorra-gold text-[10px] font-bold uppercase tracking-widest">{sec.type} Section</span>
                          <button type="button" onClick={() => removeSection(sec.id)} className="text-gray-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] text-gray-500 uppercase mb-1">Title</label>
                            <input value={sec.title || ''} onChange={e => updateSection(sec.id, { title: e.target.value })}
                              className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-vitorra-gold" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 uppercase mb-1">Subtitle</label>
                            <input value={sec.subtitle || ''} onChange={e => updateSection(sec.id, { subtitle: e.target.value })}
                              className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-vitorra-gold" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] text-gray-500 uppercase mb-1">Content / Body</label>
                            <textarea value={sec.content || ''} onChange={e => updateSection(sec.id, { content: e.target.value })}
                              className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-vitorra-gold h-20 resize-none" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Gallery & Media */}
              <section className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-vitorra-gold font-bold uppercase tracking-[0.2em] text-[10px]">
                  <ImageIcon className="w-3 h-3" /> Product Gallery
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {(formData.gallery || []).map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                      <img src={url} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, gallery: prev.gallery?.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="aspect-square rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center text-gray-500 hover:border-vitorra-gold/50 hover:bg-white/10 transition-all">
                    <Plus className="w-5 h-5 mb-1" />
                    <span className="text-[10px] uppercase font-bold">Add Image</span>
                  </button>
                </div>
              </section>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-10 border-t border-white/10">
                <button type="submit" className="px-10 py-4 bg-vitorra-gold text-black font-bold rounded-2xl hover:bg-yellow-500 shadow-xl shadow-vitorra-gold/20 transition-all flex items-center gap-2">
                  <Check className="w-5 h-5" /> {editingId ? 'Save Product Details' : 'Launch New Product'}
                </button>
                <button type="button" onClick={() => { setShowProductForm(false); setEditingId(null); setFormData(emptyForm); }}
                  className="px-8 py-4 bg-white/5 text-white font-medium rounded-2xl hover:bg-white/10 transition-colors border border-white/10">Discard Changes</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Product List ─── */}
      <div className="flex items-center bg-[#2b2b2b] border border-white/5 rounded-2xl p-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${category.name} catalog...`}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold" />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-[#242424] border border-white/5 rounded-3xl overflow-hidden transition-all hover:border-white/10 shadow-lg">
            {/* Product Row */}
            <div className="flex items-center gap-4 p-6 cursor-pointer" onClick={() => setExpandedProduct(expandedProduct === p.id ? null : p.id)}>
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0 hidden sm:block">
                {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-600"><Package className="w-8 h-8" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-xl font-serif text-white truncate">{p.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : p.status === 'archived' ? 'bg-gray-500/10 text-gray-400' : 'bg-amber-500/10 text-amber-400'}`}>{p.status || 'draft'}</span>
                </div>
                <p className="text-sm text-gray-500 truncate max-w-md">{p.description}</p>
              </div>
              <div className="hidden lg:flex items-center gap-8 shrink-0 mr-4">
                <div className="text-right"><p className="text-white font-serif text-lg">{formatPrice(p.variants?.[0]?.price || p.price || 0)}</p><p className="text-[10px] text-gray-500 uppercase tracking-widest">Base Price</p></div>
                <div className="text-right"><p className="text-white font-serif text-lg">{p.stock || (p.variants?.reduce((s, v) => s + v.stock, 0) || 0)}</p><p className="text-[10px] text-gray-500 uppercase tracking-widest">In Stock</p></div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={e => { e.stopPropagation(); toggleProductStatus(p); }} className="p-2.5 rounded-xl text-gray-400 hover:text-vitorra-gold hover:bg-white/5 transition-colors">
                  {p.status === 'active' ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                <button onClick={e => { e.stopPropagation(); startEditProduct(p); }} className="p-2.5 rounded-xl text-gray-400 hover:text-vitorra-gold hover:bg-white/5 transition-colors"><Edit3 className="w-5 h-5" /></button>
                <button onClick={e => { e.stopPropagation(); if (window.confirm('Delete?')) removeProduct(p.id); }} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-white/10 mx-2" />
                {expandedProduct === p.id ? <ChevronDown className="w-5 h-5 text-vitorra-gold" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
              </div>
            </div>

            {/* Expanded Content: Variants & Deep Stats */}
            {expandedProduct === p.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-white/5 bg-[#2b2b2b] overflow-hidden">
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h5 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Layout className="w-4 h-4" /> Inventory & Variants
                    </h5>
                    <button onClick={() => setShowVariantForm(showVariantForm === p.id ? null : p.id)}
                      className="px-5 py-2 bg-vitorra-gold/10 text-vitorra-gold text-xs font-bold rounded-xl hover:bg-vitorra-gold/20 border border-vitorra-gold/20 flex items-center gap-2 transition-colors">
                      <Plus className="w-4 h-4" /> Add Variant
                    </button>
                  </div>

                  {/* Variant Form Stubbed - Reusing logic but with cleaner UI */}
                  {showVariantForm === p.id && (
                    <div className="bg-[#2b2b2b] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-2">Variant Name</label>
                          <input value={variantForm.name} onChange={e => setVariantForm({ ...variantForm, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-2">Price (UGX)</label>
                          <input type="number" value={variantForm.price} onChange={e => setVariantForm({ ...variantForm, price: Number(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-2">SKU</label>
                          <input value={variantForm.sku} onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold font-mono" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-2">Current Stock</label>
                          <input type="number" value={variantForm.stock} onChange={e => setVariantForm({ ...variantForm, stock: Number(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-vitorra-gold" /></div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setShowVariantForm(null)} className="px-5 py-2 text-gray-400 text-sm hover:text-white transition-colors">Cancel</button>
                        <button onClick={() => addVariant(p.id)} className="px-6 py-2 bg-vitorra-gold text-black rounded-xl text-sm font-bold hover:bg-yellow-500 shadow-lg shadow-vitorra-gold/20">Create Variant</button>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#242424] border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-white/2 border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                          <th className="p-4">SKU</th>
                          <th className="p-4">Variant</th>
                          <th className="p-4 text-right">Price</th>
                          <th className="p-4 text-right">Stock</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(p.variants || []).map(v => (
                          <tr key={v.id} className="border-b border-white/2 hover:bg-white/2 transition-colors">
                            <td className="p-4 font-mono text-xs text-vitorra-gold/70">{v.sku}</td>
                            <td className="p-4 text-white font-medium">{v.name}</td>
                            <td className="p-4 text-right text-gray-300">{formatPrice(v.price)}</td>
                            <td className="p-4 text-right font-medium text-emerald-400">{v.stock}</td>
                            <td className="p-4 text-right">
                              <button onClick={() => removeVariant(p.id, v.id)} className="p-2 text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                        {(!p.variants || p.variants.length === 0) && (
                          <tr><td colSpan={5} className="p-8 text-center text-gray-600 text-sm italic">No variants configured for this product.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

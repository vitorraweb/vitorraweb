import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useCMS, Product, ProductVariant } from '../../context/CMSContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, ArrowRight, Star, Shield, Check, ChevronRight, Package, Search, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useExchangeRate, parseEurPrice } from '../../hooks/useExchangeRate';

export default function DynamicProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { state } = useCMS();
  const { addToCart } = useCart();
  const { eurToUgx, rate, lastUpdated } = useExchangeRate();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const product = state.products.find(p => {
    const pathSlug = p.path.split('/').pop();
    return pathSlug === slug || p.id === slug;
  });

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => { });
    }
  }, [slug]);

  if (!product) {
    return (
      <div className="w-full bg-[#1a1a1a] min-h-screen flex flex-col items-center justify-center text-center px-4">
        <Package className="w-16 h-16 text-gray-600 mb-6" />
        <h1 className="text-4xl font-serif text-white mb-3">Product Not Found</h1>
        <p className="text-gray-400 mb-8 max-w-md">The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/news" className="px-8 py-3 bg-vitorra-gold text-black font-bold rounded-full hover:bg-yellow-500 transition-colors">
          Browse All Products
        </Link>
      </div>
    );
  }

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

  const accentColor = product.accentColor || product.color || 'text-vitorra-gold';
  const accentBg = accentColor.replace('text-', 'bg-');

  const allImages = [product.imageUrl, ...(product.gallery || [])].filter(Boolean);
  const rawVariants = product.variants || [];

  // Apply live EUR→UGX pricing to variants that have an RRP (EUR) attribute
  const variants = useMemo(() => rawVariants.map(v => {
    const eurPrice = parseEurPrice(v.attributes?.['RRP (EUR)']);
    if (eurPrice) {
      return { ...v, price: eurToUgx(eurPrice) };
    }
    return v;
  }), [rawVariants, eurToUgx]);

  const activeVariant = variants.find(v => v.id === selectedVariant) || variants[0];

  const handleAddToCart = (variant?: ProductVariant) => {
    const v = variant || activeVariant;
    if (!v) return;
    addToCart({
      id: `${product.id}-${v.id}`,
      name: `${product.name} — ${v.name}`,
      price: v.price,
      quantity: 1,
      image: v.image || product.imageUrl,
      category: product.category || 'Products',
      isB2B: v.isB2B || false,
    });
  };

  const specs = product.specs || {};
  const sections = product.sections || [];

  return (
    <div className="w-full bg-vitorra-bg min-h-screen text-vitorra-text font-sans transition-colors duration-500">
      {/* Hero — Half-style */}
      <section className="relative flex items-center overflow-hidden bg-vitorra-bg pt-28 md:pt-[132px] pb-10 md:pb-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-y-0 right-0 w-full md:w-[55%] overflow-hidden">
            {product.heroVideo ? (
              <video ref={videoRef} key={slug} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-30 md:opacity-100">
                <source src={product.heroVideo} type="video/mp4" />
              </video>
            ) : (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover opacity-30 md:opacity-100" />
            )}
          </div>
          <div className="absolute inset-y-0 left-0 w-full md:w-[65%] bg-gradient-to-r from-vitorra-bg via-vitorra-bg via-[80%] to-transparent z-10" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm text-vitorra-muted mb-6">
              <Link to="/" className="hover:text-vitorra-text transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/shop" className="hover:text-vitorra-text transition-colors">Shop</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-vitorra-gold">{product.name}</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vitorra-card border border-vitorra-border mb-6">
              <div className="w-2 h-2 rounded-full bg-vitorra-gold animate-pulse" />
              <span className="text-vitorra-muted text-xs font-bold tracking-widest uppercase">{product.category}</span>
            </div>

            <h2 className="font-serif mb-4 text-vitorra-text text-2xl md:text-4xl">
              {product.name.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="text-vitorra-gold">{product.name.split(' ').pop()}.</span>
            </h2>

            <p className="text-sm md:text-base text-vitorra-muted max-w-xl leading-relaxed mb-6 md:mb-8">
              {product.description}
            </p>

            <div className="flex flex-wrap gap-4">
              {variants.length > 0 ? (
                <a href="#variants" className="px-8 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:bg-vitorra-gold-hover transition-all flex items-center gap-2 uppercase tracking-[0.15em] text-xs shadow-xl shadow-vitorra-gold/25">
                  View Products <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <Link to="/contact" className="px-8 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:bg-vitorra-gold-hover transition-all flex items-center gap-2 uppercase tracking-[0.15em] text-xs shadow-xl shadow-vitorra-gold/25">
                  Get in Touch <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery (if present) */}
      {allImages.length > 1 && (
        <section className="py-16 bg-vitorra-bg-alt border-t border-vitorra-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-4 aspect-[16/9] rounded-2xl overflow-hidden border border-vitorra-border">
                <img src={allImages[activeGalleryIndex]} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveGalleryIndex(i)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === activeGalleryIndex ? 'border-vitorra-gold scale-105' : 'border-vitorra-border opacity-60 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Sections */}
      {sections.map(section => (
        <section key={section.id} className={`py-24 border-t border-vitorra-border ${section.type === 'features' ? 'bg-vitorra-bg-alt' : 'bg-vitorra-bg'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {section.title && (
              <div className="text-center mb-16">
                <h2 className="text-2xl md:text-3xl font-serif mb-4 text-vitorra-text">{section.title}</h2>
                {section.subtitle && <p className="text-vitorra-muted max-w-2xl mx-auto text-lg">{section.subtitle}</p>}
              </div>
            )}
            {section.type === 'content' && section.content && (
              <div className="max-w-3xl mx-auto text-vitorra-muted text-lg leading-relaxed whitespace-pre-line">{section.content}</div>
            )}
            {section.type === 'features' && section.items && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((item, i) => (
                  <div key={i} className="p-8 rounded-2xl bg-vitorra-card border border-vitorra-border hover:border-vitorra-gold/20 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-vitorra-gold/10 flex items-center justify-center text-vitorra-gold mb-6 group-hover:scale-110 transition-transform">
                      <Star className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-serif text-vitorra-text mb-3">{item.title}</h3>
                    <p className="text-vitorra-muted text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      {/* Specs Table (if present) */}
      {Object.keys(specs).length > 0 && (
        <section className="py-24 bg-vitorra-bg-alt border-t border-vitorra-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-serif mb-12 text-vitorra-text text-center">Technical Specifications</h2>
            <div className="bg-vitorra-card border border-vitorra-border rounded-2xl overflow-hidden">
              {Object.entries(specs).map(([key, val], i) => (
                <div key={key} className={`flex items-center justify-between px-6 py-4 ${i > 0 ? 'border-t border-vitorra-border' : ''}`}>
                  <span className="text-vitorra-muted font-medium">{key}</span>
                  <span className="text-vitorra-text">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Product Variants / Shop */}
      {variants.length > 0 && (
        <VariantsShop product={product} variants={variants} formatPrice={formatPrice} accentColor={accentColor} accentBg={accentBg} handleAddToCart={handleAddToCart} exchangeRate={rate} lastUpdated={lastUpdated} />
      )}

      {/* CTA */}
      <section className="py-24 bg-vitorra-bg border-t border-vitorra-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="w-12 h-12 text-vitorra-gold mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-serif mb-6 text-vitorra-text">Interested in {product.name}?</h2>
          <p className="text-vitorra-muted text-lg mb-10 max-w-xl mx-auto">
            Contact our team to discuss bulk orders, distribution partnerships, or custom requirements.
          </p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:bg-vitorra-gold-hover transition-all uppercase tracking-[0.15em] text-xs shadow-xl shadow-vitorra-gold/25">
            Get in Touch <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   VARIANTS SHOP — with sub-category filtering for large catalogs
   ═══════════════════════════════════════════════════════════════════════ */
function VariantsShop({ product, variants, formatPrice, accentColor, accentBg, handleAddToCart, exchangeRate, lastUpdated }: {
  product: Product; variants: ProductVariant[]; formatPrice: (n: number) => string;
  accentColor: string; accentBg: string; handleAddToCart: (v: ProductVariant) => void;
  exchangeRate?: number; lastUpdated?: Date | null;
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isFET = product.id === 'fet';
  const subCategories = isFET ? [
    { id: 'all', label: 'All', filter: (_v: ProductVariant) => true },
    { id: 'passenger', label: 'Passenger Cars', filter: (v: ProductVariant) => {
      const vc = v.attributes?.['Vehicle Class'] || '';
      return ['Small Cars', 'Compact Class', 'Mid-Range', 'Upper Class'].includes(vc);
    }},
    { id: 'suv', label: 'SUV & Crossover', filter: (v: ProductVariant) => {
      const vc = v.attributes?.['Vehicle Class'] || '';
      return vc.toLowerCase().includes('suv');
    }},
    { id: 'sports', label: 'Sports Cars', filter: (v: ProductVariant) => {
      const vc = v.attributes?.['Vehicle Class'] || '';
      return vc.toLowerCase().includes('sport') || vc.toLowerCase().includes('supersport');
    }},
    { id: 'van', label: 'Mini Bus & Van', filter: (v: ProductVariant) => {
      const vc = v.attributes?.['Vehicle Class'] || '';
      return vc.toLowerCase().includes('mini bus') || vc.toLowerCase().includes('van');
    }},
    { id: 'transporter', label: 'Transporter', filter: (v: ProductVariant) => {
      const vc = v.attributes?.['Vehicle Class'] || '';
      return vc.toLowerCase().includes('transporter') || vc.toLowerCase().includes('sprinter');
    }},
    { id: 'light', label: 'Light Trucks', filter: (v: ProductVariant) => (v.attributes?.['Vehicle Class'] || '') === 'Light Trucks' },
    { id: 'medium', label: 'Medium Trucks', filter: (v: ProductVariant) => (v.attributes?.['Vehicle Class'] || '') === 'Medium Trucks' },
    { id: 'heavy', label: 'Heavy Trucks', filter: (v: ProductVariant) => (v.attributes?.['Vehicle Class'] || '') === 'Heavy Trucks' },
  ] : [{ id: 'all', label: 'All', filter: (_v: ProductVariant) => true }];

  const activeFilter = subCategories.find(c => c.id === activeTab)?.filter || ((_v: ProductVariant) => true);
  const filtered = variants
    .filter(v => activeFilter(v))
    .filter(v => !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.description?.toLowerCase().includes(searchQuery.toLowerCase()) || v.attributes?.['Vehicle Class']?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <section id="variants" className="py-24 bg-vitorra-bg-alt border-t border-vitorra-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-serif mb-4 text-vitorra-text">Shop {product.name}</h2>
          <p className="text-vitorra-muted text-lg max-w-xl mx-auto">{
            product.id === 'fet' ? 'Choose the configuration that fits your vehicle class and performance needs.' :
            product.id === 'seal' ? 'Professional-grade hemostatic wound care for medical, veterinary, and consumer use.' :
            product.id === 'coffee' ? 'Select from our premium single-origin roasts, sourced directly from Ugandan highlands.' :
            'Browse our available product variants below.'
          }</p>
          <p className="text-vitorra-tertiary text-sm mt-3">{variants.length} {
            product.id === 'fet' ? 'configurations' : product.id === 'seal' ? 'products' : product.id === 'coffee' ? 'roasts' : 'variants'
          } available</p>
        </div>

        {isFET && (
          <div className="mb-10 space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {subCategories.map(cat => {
                const count = variants.filter(v => cat.filter(v)).length;
                return (
                  <button key={cat.id} onClick={() => setActiveTab(cat.id)}
                    className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                      activeTab === cat.id
                        ? 'bg-vitorra-gold text-black shadow-lg shadow-vitorra-gold/20'
                        : 'bg-vitorra-card border border-vitorra-border text-vitorra-muted hover:text-vitorra-text hover:border-vitorra-gold/30'
                    }`}>
                    {cat.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === cat.id ? 'bg-black/20' : 'bg-white/5'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vitorra-tertiary" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by vehicle, displacement, class..."
                className="w-full pl-11 pr-4 py-3 bg-vitorra-card border border-vitorra-border rounded-xl text-sm text-vitorra-text placeholder-vitorra-tertiary outline-none focus:border-vitorra-gold/50 transition-all" />
            </div>
          </div>
        )}

        {isFET && filtered.some(v => v.isB2B) && (
          <div className="mb-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-400 mb-1">Metal Supply Lines Notice</p>
              <p className="text-xs text-amber-400/70 leading-relaxed">If the supply lines are made of metal, they must be procured in advance, as they will then be installed in the customer&apos;s vehicle with the convection-cooled FET.</p>
            </div>
          </div>
        )}

        <div className={`grid gap-6 ${filtered.length > 6 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {filtered.map(v => (
            <div key={v.id} className="group bg-vitorra-card border border-vitorra-border rounded-2xl overflow-hidden hover:border-vitorra-gold/20 transition-all duration-300 flex flex-col">
              {product.id === 'coffee' ? (
                <>
                  <div className="relative h-56 overflow-hidden bg-vitorra-elevated">
                    <img src={v.image || product.imageUrl} alt={v.name} className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-vitorra-card via-vitorra-card/40 to-transparent" />
                    {v.tag && <div className="absolute top-4 left-4 px-3.5 py-1.5 bg-[#1a1412]/60 backdrop-blur-md border border-[#c68958]/30 rounded-full text-[11px] text-[#c68958] font-bold uppercase tracking-[0.2em] shadow-xl">{v.tag}</div>}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-serif text-vitorra-text mb-2 leading-tight">{v.name}</h3>
                    {v.description && <p className="text-sm text-vitorra-muted leading-relaxed mb-6 font-light">{v.description}</p>}
                    {v.attributes && Object.keys(v.attributes).length > 0 && (
                      <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-vitorra-border">
                        {Object.entries(v.attributes).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between"><span className="text-vitorra-tertiary text-xs uppercase tracking-widest font-bold">{key}</span><span className="text-vitorra-text text-sm font-serif italic">{val}</span></div>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-5">
                        <p className="text-2xl font-serif text-vitorra-gold">{formatPrice(v.price)}</p>
                        <div className="text-right">
                          <span className="text-[11px] font-mono text-vitorra-tertiary block mb-1">{v.sku}</span>
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${v.stock > 0 ? 'text-emerald-500' : 'text-red-400'}`}>{v.stock > 0 ? `${v.stock} available` : 'Out of stock'}</span>
                        </div>
                      </div>
                      <button onClick={() => handleAddToCart(v)} disabled={v.stock === 0} className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-300 ${v.stock > 0 ? 'bg-vitorra-gold/10 border border-vitorra-gold/20 text-vitorra-gold hover:bg-vitorra-gold hover:text-vitorra-gold-text shadow-lg' : 'bg-vitorra-border border border-vitorra-border text-vitorra-tertiary cursor-not-allowed'}`}>
                        <ShoppingCart className="w-4 h-4" /> {v.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                </>
              ) : product.id === 'seal' ? (
                <>
                  <div className="relative h-72 bg-vitorra-elevated overflow-hidden flex items-center justify-center border-b border-vitorra-border">
                    <img src={v.image || product.imageUrl} alt={v.name} className="relative z-10 w-full h-full object-contain scale-150 group-hover:scale-[1.6] group-hover:-translate-y-1 transition-all duration-500" />
                    {v.tag && <div className="absolute top-3 left-3 px-3 py-1 bg-vitorra-card/80 backdrop-blur-md border border-vitorra-border rounded-full text-[11px] text-vitorra-text font-bold tracking-widest uppercase shadow-lg">{v.tag}</div>}
                    {v.isB2B && <div className="absolute top-3 right-3 px-3 py-1 bg-vitorra-gold/20 backdrop-blur-md border border-vitorra-gold/30 rounded-full text-[11px] text-vitorra-gold font-bold tracking-widest uppercase shadow-lg">B2B Only</div>}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-serif text-vitorra-text mb-1.5">{v.name}</h3>
                    <div className="font-mono text-[11px] text-vitorra-tertiary mb-5">SKU: {v.sku}</div>
                    {v.attributes && Object.keys(v.attributes).length > 0 && (
                      <div className="flex flex-col gap-2.5 mb-6 pb-6 border-b border-vitorra-border">
                        {Object.entries(v.attributes).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-sm"><span className="text-vitorra-muted font-medium">{key}</span><span className="text-vitorra-text">{val}</span></div>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-5">
                        <div><p className="text-2xl font-serif text-vitorra-gold">{formatPrice(v.price)}</p><p className="text-[11px] text-vitorra-tertiary mt-0.5 uppercase tracking-widest">Per Min. Order Qty</p></div>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${v.stock > 0 ? 'text-emerald-500' : 'text-red-400'}`}>{v.stock > 0 ? `In Stock (${v.stock})` : 'Out of Stock'}</span>
                      </div>
                      <button onClick={() => handleAddToCart(v)} disabled={v.stock === 0} className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${v.stock > 0 ? 'bg-vitorra-gold/10 border border-vitorra-gold/20 text-vitorra-gold hover:bg-vitorra-gold hover:text-vitorra-gold-text hover:shadow-lg hover:shadow-vitorra-gold/20' : 'bg-vitorra-border border border-vitorra-border text-vitorra-tertiary cursor-not-allowed'}`}>
                        <ShoppingCart className="w-4 h-4" /> {v.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative pt-6 px-5 pb-4 border-b border-vitorra-border bg-vitorra-elevated overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-1 ${v.price <= 937500 ? 'bg-emerald-500' : v.price <= 1687500 ? 'bg-vitorra-gold' : v.price <= 2812500 ? 'bg-orange-500' : 'bg-rose-500'}`} />
                    <div className="flex justify-between items-start">
                      {v.tag && <div className={`px-3 py-1 rounded text-[11px] font-bold uppercase tracking-widest border ${v.price <= 937500 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : v.price <= 1687500 ? 'bg-vitorra-gold/10 text-vitorra-gold border-vitorra-gold/20' : v.price <= 2812500 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{v.tag}</div>}
                      <div className="flex flex-col gap-1 items-end">
                        {v.isB2B && <div className="text-[11px] px-2 py-0.5 rounded bg-vitorra-gold/10 text-vitorra-gold border border-vitorra-gold/20 font-bold uppercase tracking-widest">B2B</div>}
                        {v.stock <= 15 && v.stock > 0 && <div className="text-[11px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase tracking-widest">Low Stock</div>}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-base font-bold text-vitorra-text mb-1 leading-snug">{v.name}</h3>
                    {v.description && <p className="text-xs text-vitorra-muted leading-relaxed mb-4">{v.description}</p>}
                    {v.attributes && Object.keys(v.attributes).length > 0 && (
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-4 pb-4 border-b border-vitorra-border">
                        {Object.entries(v.attributes)
                          .filter(([key]) => ['Vehicle Class', 'Weight Class', 'Displacement', 'Power', 'Torque', 'FET Designation', 'Line Size'].includes(key))
                          .map(([key, val]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-[11px] text-vitorra-tertiary uppercase tracking-wider font-bold">{key}</span>
                            <span className="text-[11px] text-vitorra-text font-medium">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto">
                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <p className={`text-xl font-bold text-vitorra-gold`}>{formatPrice(v.price)}</p>
                          {v.attributes?.['RRP (EUR)'] && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[11px] text-vitorra-tertiary">RRP {v.attributes['RRP (EUR)']}</p>
                              {exchangeRate && <span className="text-[9px] text-vitorra-tertiary/50">@ {exchangeRate.toFixed(0)} UGX/EUR</span>}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-mono text-vitorra-tertiary block">{v.sku}</span>
                          <span className={`text-[11px] font-bold ${v.stock > 0 ? 'text-emerald-500' : 'text-red-400'}`}>{v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}</span>
                        </div>
                      </div>
                      <button onClick={() => handleAddToCart(v)} disabled={v.stock === 0} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${v.stock > 0 ? 'bg-vitorra-gold/10 border border-vitorra-gold/20 text-vitorra-gold hover:bg-vitorra-gold hover:text-vitorra-gold-text hover:shadow-lg hover:shadow-vitorra-gold/20' : 'bg-vitorra-border border border-vitorra-border text-vitorra-tertiary cursor-not-allowed'}`}>
                        <ShoppingCart className="w-4 h-4" /> {v.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-vitorra-tertiary mx-auto mb-4" />
            <p className="text-vitorra-muted">No variants match your search. Try a different filter.</p>
          </div>
        )}

        {variants.some(v => v.attributes) && (
          <div className="mt-12 p-6 rounded-2xl bg-vitorra-card border border-vitorra-border">
            <p className="text-[11px] text-vitorra-tertiary uppercase tracking-widest font-bold mb-3">Technical Assignment Criteria</p>
            <p className="text-xs text-vitorra-muted leading-relaxed">
              Class assignment is based on: inner diameter of the fuel line, flow rate / motor power / displacement, injection system, vehicle class, and typical consumption behavior and usage profiles. Contact us for a precise recommendation for your vehicle.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

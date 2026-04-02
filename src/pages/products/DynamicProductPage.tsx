import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useCMS, Product, ProductVariant } from '../../context/CMSContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, ArrowRight, Star, Shield, Check, ChevronRight, Package } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function DynamicProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { state } = useCMS();
  const { addToCart } = useCart();
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
  const variants = product.variants || [];
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
    <div className="w-full bg-[#1a1a1a] min-h-screen text-gray-300 font-sans">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          {product.heroVideo ? (
            <video ref={videoRef} key={slug} autoPlay muted loop playsInline className="w-full h-full object-cover">
              <source src={product.heroVideo} type="video/mp4" />
            </video>
          ) : (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/60 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pb-16 pt-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/news" className="hover:text-white transition-colors">Products</Link>
              <ChevronRight className="w-3 h-3" />
              <span className={accentColor}>{product.name}</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-6">
              <div className={`w-2 h-2 rounded-full ${accentBg} animate-pulse`} />
              <span className="text-gray-300 text-xs font-bold tracking-widest uppercase">{product.category}</span>
            </div>

            <h1 className="font-serif mb-6 text-white">
              {product.name.split(' ').slice(0, -1).join(' ')} <br />
              <span className={accentColor}>{product.name.split(' ').pop()}.</span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl leading-relaxed font-light mb-10">
              {product.description}
            </p>

            <div className="flex flex-wrap gap-4">
              {variants.length > 0 ? (
                <a href="#variants" className={`px-8 py-4 ${accentBg.replace('bg-', 'bg-')}/90 backdrop-blur-md text-white font-medium rounded-full hover:opacity-90 transition-all flex items-center gap-2 shadow-lg border border-white/10`}>
                  View Products <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <Link to="/contact" className={`px-8 py-4 ${accentBg}/90 backdrop-blur-md text-white font-medium rounded-full hover:opacity-90 transition-all flex items-center gap-2 shadow-lg border border-white/10`}>
                  Get in Touch <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery (if present) */}
      {allImages.length > 1 && (
        <section className="py-16 bg-[#242424] border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-4 aspect-[16/9] rounded-2xl overflow-hidden border border-white/10">
                <img src={allImages[activeGalleryIndex]} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveGalleryIndex(i)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === activeGalleryIndex ? 'border-vitorra-gold scale-105' : 'border-white/10 opacity-60 hover:opacity-100'}`}>
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
        <section key={section.id} className="py-24 border-b border-white/5" style={{ background: section.type === 'features' ? '#242424' : '#1a1a1a' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {section.title && (
              <div className="text-center mb-16">
                <h2 className="text-2xl md:text-3xl font-serif mb-4 text-white">{section.title}</h2>
                {section.subtitle && <p className="text-gray-400 max-w-2xl mx-auto text-lg">{section.subtitle}</p>}
              </div>
            )}
            {section.type === 'content' && section.content && (
              <div className="max-w-3xl mx-auto text-gray-400 text-lg leading-relaxed whitespace-pre-line">{section.content}</div>
            )}
            {section.type === 'features' && section.items && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((item, i) => (
                  <div key={i} className="p-8 rounded-2xl bg-[#2b2b2b] border border-white/10 hover:border-white/20 transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${accentColor} mb-6 group-hover:scale-110 transition-transform`}>
                      <Star className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-serif text-white mb-3">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      {/* Specs Table (if present) */}
      {Object.keys(specs).length > 0 && (
        <section className="py-24 bg-[#242424] border-b border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-serif mb-12 text-white text-center">Technical Specifications</h2>
            <div className="bg-[#2b2b2b] border border-white/10 rounded-2xl overflow-hidden">
              {Object.entries(specs).map(([key, val], i) => (
                <div key={key} className={`flex items-center justify-between px-6 py-4 ${i > 0 ? 'border-t border-white/5' : ''}`}>
                  <span className="text-gray-400 font-medium">{key}</span>
                  <span className="text-white">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Product Variants / Shop */}
      {variants.length > 0 && (
        <section id="variants" className="py-24 bg-[#1a1a1a] border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-serif mb-4 text-white">Shop {product.name}</h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">Choose the variant that fits your needs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {variants.map(v => (
                <div key={v.id} className="group bg-[#2b2b2b] border border-white/10 rounded-[2rem] p-6 hover:border-white/20 transition-all duration-300">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 bg-[#242424]">
                    <img src={v.image || product.imageUrl} alt={v.name}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                    {v.isB2B && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-vitorra-gold/20 text-vitorra-gold border border-vitorra-gold/30 rounded-full text-[10px] font-bold uppercase backdrop-blur-md">
                        B2B Only
                      </div>
                    )}
                    {v.stock < 20 && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-bold uppercase backdrop-blur-md">
                        Low Stock ({v.stock} left)
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-serif text-white mb-2">{v.name}</h3>
                  <p className={`text-2xl font-serif ${accentColor} mb-4`}>{formatPrice(v.price)}</p>

                  {v.attributes && Object.keys(v.attributes).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {Object.entries(v.attributes).map(([key, val]) => (
                        <span key={key} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
                          {key}: {val}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                    <span className="font-mono">{v.sku}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className={v.stock > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>

                  <button onClick={() => handleAddToCart(v)} disabled={v.stock === 0}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all duration-300 ${v.stock > 0
                      ? 'bg-white/5 border border-white/10 text-white hover:bg-vitorra-gold hover:text-black hover:border-vitorra-gold hover:shadow-lg hover:shadow-vitorra-gold/20'
                      : 'bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed'
                      }`}>
                    <ShoppingCart className="w-5 h-5" />
                    {v.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 bg-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className={`w-12 h-12 ${accentColor} mx-auto mb-6`} />
          <h2 className="text-2xl md:text-3xl font-serif mb-6 text-white">Interested in {product.name}?</h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Contact our team to discuss bulk orders, distribution partnerships, or custom requirements.
          </p>
          <Link to="/contact" className={`inline-flex items-center gap-2 px-8 py-4 ${accentBg} text-white font-bold rounded-full hover:opacity-90 transition-all uppercase tracking-widest text-sm shadow-lg`}>
            Get in Touch <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCMS, Product } from '../context/CMSContext';
import { motion } from 'motion/react';
import { ShoppingBag, ChevronRight } from 'lucide-react';

export default function Shop() {
  const { state } = useCMS();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

  // Filter out logistics
  const shopProducts = state.products.filter(p => p.id !== 'logistics' && p.status === 'active' && p.variants && p.variants.length > 0);
  const categories = state.categories.filter(c => c.id !== 'logistics');

  const filtered = activeCategory === 'all'
    ? shopProducts
    : shopProducts.filter(p => p.categoryId === activeCategory);

  const getLowestPrice = (p: Product) => {
    if (!p.variants || p.variants.length === 0) return p.price || 0;
    return Math.min(...p.variants.map(v => v.price));
  };

  return (
    <div className="min-h-screen bg-vitorra-bg pt-40 pb-20 transition-colors duration-500 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase block mb-2">Our Store</span>
            <h1 className="text-4xl md:text-5xl font-serif text-vitorra-text mb-4">Product Catalog</h1>
            <p className="text-vitorra-muted text-lg max-w-2xl">Browse and procure directly from the Vitorra Holdings product range.</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-vitorra-gold text-vitorra-gold-text shadow-lg shadow-vitorra-gold/20'
                : 'bg-vitorra-card border border-vitorra-border text-vitorra-muted hover:text-vitorra-text hover:border-vitorra-gold/20'
            }`}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-vitorra-gold text-vitorra-gold-text shadow-lg shadow-vitorra-gold/20'
                  : 'bg-vitorra-card border border-vitorra-border text-vitorra-muted hover:text-vitorra-text hover:border-vitorra-gold/20'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(product => (
            <Link
              key={product.id}
              to={`/shop/${product.id}`}
              className="group text-left bg-vitorra-card border border-vitorra-border rounded-3xl overflow-hidden hover:border-vitorra-gold/30 hover:shadow-2xl hover:shadow-vitorra-gold/5 transition-all duration-300 flex flex-col"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden bg-vitorra-bg/50">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-vitorra-card via-transparent to-transparent opacity-80" />
                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="text-[10px] px-3 py-1 bg-vitorra-bg/80 backdrop-blur-md text-vitorra-gold border border-vitorra-gold/20 rounded-full font-bold uppercase tracking-widest">
                    {product.categoryId}
                  </span>
                </div>
                {/* Variant count */}
                <div className="absolute bottom-4 right-4 z-10">
                  <span className="text-[10px] px-3 py-1.5 bg-vitorra-bg/80 backdrop-blur-md text-vitorra-muted border border-vitorra-border rounded-full font-bold uppercase tracking-widest">
                    {product.variants?.length} variant{(product.variants?.length || 0) > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-serif text-vitorra-text mb-2 group-hover:text-vitorra-gold transition-colors">{product.name}</h3>
                <p className="text-sm text-vitorra-muted line-clamp-2 mb-6 leading-relaxed flex-1">{product.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-vitorra-border/50">
                  <span className="text-lg font-bold text-vitorra-gold">
                    From {formatPrice(getLowestPrice(product))}
                  </span>
                  <span className="text-[11px] text-vitorra-muted uppercase tracking-widest font-bold group-hover:text-vitorra-gold transition-colors flex items-center gap-1">
                    Select <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center bg-vitorra-card border border-vitorra-border rounded-3xl">
            <ShoppingBag className="w-12 h-12 text-vitorra-muted/20 mx-auto mb-6" />
            <p className="text-vitorra-muted text-lg">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

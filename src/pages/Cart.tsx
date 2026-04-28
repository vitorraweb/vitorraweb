import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, Package } from 'lucide-react';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

  const handleCheckout = () => {
    if (!firebaseUser) {
      navigate('/auth');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-vitorra-bg pt-40 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-24 h-24 mx-auto bg-vitorra-gold/10 rounded-3xl flex items-center justify-center mb-8 border border-vitorra-gold/20">
              <ShoppingBag className="w-10 h-10 text-vitorra-gold" />
            </div>
            <h1 className="text-2xl font-bold text-vitorra-text mb-4">Your Cart is Empty</h1>
            <p className="text-vitorra-muted max-w-md mx-auto mb-10">
              Explore our product range and add items to get started.
            </p>
            <Link to="/shop" className="inline-flex items-center gap-3 px-10 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all uppercase tracking-widest text-sm shadow-lg shadow-vitorra-gold/20">
              <ArrowLeft className="w-4 h-4" /> Browse Products
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vitorra-bg pt-40 pb-20 transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase block mb-4">Shopping Cart</span>
          <h1 className="text-2xl font-bold text-vitorra-text">Your Cart <span className="text-vitorra-gold">({totalItems})</span></h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex gap-6 p-6 bg-vitorra-card border border-vitorra-border rounded-2xl group hover:border-vitorra-gold/20 transition-all shadow-sm"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 rounded-xl bg-vitorra-bg/50 border border-vitorra-border overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-vitorra-muted/30">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-vitorra-text font-bold text-sm mb-1 truncate">{item.name}</h3>
                        <p className="text-vitorra-muted text-xs uppercase tracking-wider font-medium">{item.category}</p>
                        {item.isB2B && (
                          <span className="inline-block mt-1 text-[11px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold uppercase tracking-wider">B2B</span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-vitorra-muted/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1 bg-vitorra-bg/50 border border-vitorra-border rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-2 text-vitorra-muted hover:text-vitorra-text hover:bg-vitorra-bg/80 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-4 py-2 text-vitorra-text font-bold text-sm min-w-[40px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-2 text-vitorra-muted hover:text-vitorra-text hover:bg-vitorra-bg/80 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-vitorra-text font-bold">{formatPrice(item.price * item.quantity)}</div>
                        {item.quantity > 1 && (
                          <div className="text-vitorra-muted text-[11px] font-medium">{formatPrice(item.price)} each</div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Continue Shopping */}
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-vitorra-muted hover:text-vitorra-gold transition-colors mt-4">
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-8 sticky top-32 shadow-sm">
              <h3 className="text-lg font-bold text-vitorra-text mb-6">Order Summary</h3>

              <div className="space-y-4 mb-6 pb-6 border-b border-vitorra-border">
                <div className="flex justify-between text-sm">
                  <span className="text-vitorra-muted">Subtotal ({totalItems} items)</span>
                  <span className="text-vitorra-text font-medium">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vitorra-muted">Shipping</span>
                  <span className="text-vitorra-muted text-xs">Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between mb-8">
                <span className="text-vitorra-text font-bold">Total</span>
                <span className="text-xl font-bold text-vitorra-text">{formatPrice(totalPrice)}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-vitorra-gold/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                {firebaseUser ? 'Proceed to Checkout' : 'Sign In to Checkout'} <ArrowRight className="w-4 h-4" />
              </button>

              {!firebaseUser && (
                <p className="text-center text-xs text-vitorra-muted/60 mt-4">
                  You need an account to place orders
                </p>
              )}

              {/* Payment Info */}
              <div className="mt-6 pt-6 border-t border-vitorra-border">
                <p className="text-[11px] text-vitorra-muted/60 uppercase tracking-widest font-bold mb-2">Payment Method</p>
                <p className="text-xs text-vitorra-muted">Bank Wire Transfer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

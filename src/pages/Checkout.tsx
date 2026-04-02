import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth, Address } from '../context/AuthContext';
import { motion } from 'motion/react';
import {
  ArrowLeft, ArrowRight, MapPin, Plus, Check, CreditCard, Package, Copy,
  CheckCircle, Loader2, AlertTriangle, Smartphone, Building2, Globe,
} from 'lucide-react';
import {
  validateCart as serverValidateCart,
  createOrder as serverCreateOrder,
  initializePayment,
  type ValidateCartResponse,
  type ValidatedCartItem,
} from '../lib/functions';

type Step = 'shipping' | 'payment' | 'review' | 'processing' | 'confirmed';
type PaymentGateway = 'flutterwave' | 'paypal' | 'bank_transfer';

export default function Checkout() {
  const { items, clearCart } = useCart();
  const { profile, addAddress } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>('shipping');
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    profile?.addresses?.find(a => a.isDefault)?.id || profile?.addresses?.[0]?.id || ''
  );
  const [showNewAddress, setShowNewAddress] = useState(!profile?.addresses?.length);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('flutterwave');
  const [bankDetails, setBankDetails] = useState<any>(null);

  // Server-validated cart data (prices come from HERE, not from CartContext)
  const [serverCart, setServerCart] = useState<ValidateCartResponse | null>(null);

  // New address form
  const [newAddr, setNewAddr] = useState({
    label: 'Home', fullName: profile?.displayName || '', street: '', city: '', state: '',
    postalCode: '', country: 'Uganda', phone: profile?.phone || '', type: 'both' as const, isDefault: true,
  });

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

  if (!profile) { navigate('/auth'); return null; }
  if (items.length === 0 && step !== 'confirmed' && step !== 'processing') { navigate('/cart'); return null; }

  // Handle cancelled payment return
  useEffect(() => {
    if (searchParams.get('cancelled') === 'true') {
      setError('Payment was cancelled. Your order has been saved — you can retry payment.');
    }
  }, [searchParams]);

  const selectedAddress = profile.addresses?.find(a => a.id === selectedAddressId);

  const handleSaveAddress = async () => {
    await addAddress(newAddr);
    setShowNewAddress(false);
  };

  // ─── STEP TRANSITION: Shipping → Payment ───────────────────────────────────
  // Validate cart with the server (get real prices)
  const handleContinueToPayment = async () => {
    setValidating(true);
    setError('');
    try {
      const cartPayload = items.map(i => ({
        productId: i.id.split('__')[0], // strip variant suffix if present
        variantId: i.id.includes('__') ? i.id.split('__')[1] : undefined,
        quantity: i.quantity,
      }));
      const result = await serverValidateCart(cartPayload, 'vitorra_logistics');
      setServerCart(result);
      setStep('payment');
    } catch (err: any) {
      const msg = err?.message || err?.details || 'Failed to validate cart. Please try again.';
      setError(msg);
    } finally {
      setValidating(false);
    }
  };

  // ─── STEP TRANSITION: Payment → Review ─────────────────────────────────────
  const handleContinueToReview = () => {
    setStep('review');
  };

  // ─── PLACE ORDER ───────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const addr = selectedAddress || newAddr;

      // 1. Create the order on the server (atomic transaction)
      const orderResult = await serverCreateOrder({
        items: items.map(i => ({
          productId: i.id.split('__')[0],
          variantId: i.id.includes('__') ? i.id.split('__')[1] : undefined,
          quantity: i.quantity,
        })),
        shippingAddress: {
          fullName: addr.fullName,
          street: addr.street,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
          phone: addr.phone || profile.phone || '',
        },
        shippingMethod: 'vitorra_logistics',
        paymentMethod: selectedGateway,
      });

      setOrderId(orderResult.orderId);

      // 2. Initialize payment
      const paymentResult = await initializePayment(orderResult.orderId, selectedGateway);

      // 3. Handle based on gateway
      if (selectedGateway === 'flutterwave' && paymentResult.paymentLink) {
        // Redirect to Flutterwave hosted checkout
        clearCart();
        window.location.href = paymentResult.paymentLink;
        return;
      }

      if (selectedGateway === 'paypal' && paymentResult.approvalUrl) {
        // Redirect to PayPal approval
        clearCart();
        window.location.href = paymentResult.approvalUrl;
        return;
      }

      if (selectedGateway === 'bank_transfer') {
        setBankDetails(paymentResult.bankDetails);
        clearCart();
        setStep('confirmed');
        return;
      }

      // Fallback: show confirmation
      clearCart();
      setStep('confirmed');
    } catch (err: any) {
      const msg = err?.message || err?.details || 'Failed to place order. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const inputClass = "w-full bg-vitorra-bg/50 border border-vitorra-border rounded-xl px-4 py-3 text-vitorra-text placeholder-vitorra-muted/40 outline-none focus:border-vitorra-gold/50 transition-all text-sm";
  const labelClass = "block text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-2";

  const paymentGateways: { id: PaymentGateway; name: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'flutterwave', name: 'Flutterwave', desc: 'Mobile Money, Card, Bank Transfer, USSD', icon: <Smartphone className="w-5 h-5" /> },
    { id: 'paypal', name: 'PayPal', desc: 'Pay with PayPal balance or linked cards', icon: <Globe className="w-5 h-5" /> },
    { id: 'bank_transfer', name: 'Direct Bank Transfer', desc: 'Manual wire transfer to Stanbic Bank', icon: <Building2 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-vitorra-bg pt-40 pb-20 transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress indicator */}
        {!['confirmed', 'processing'].includes(step) && (
          <div className="flex items-center gap-4 mb-10">
            <Link to="/cart" className="flex items-center gap-2 text-sm text-vitorra-muted hover:text-vitorra-gold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Cart
            </Link>
            <div className="flex-1 flex items-center gap-2 justify-end">
              {(['shipping', 'payment', 'review'] as const).map((s, i) => {
                const stepOrder = ['shipping', 'payment', 'review'];
                const currentIdx = stepOrder.indexOf(step);
                const isComplete = stepOrder.indexOf(s) < currentIdx;
                const isActive = s === step;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${isComplete ? 'bg-vitorra-gold text-vitorra-gold-text border-vitorra-gold' : isActive ? 'bg-vitorra-gold text-vitorra-gold-text border-vitorra-gold' : 'bg-vitorra-bg/50 text-vitorra-muted border-vitorra-border'}`}>
                      {isComplete ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider hidden sm:inline ${isActive ? 'text-vitorra-gold' : isComplete ? 'text-vitorra-text' : 'text-vitorra-muted/50'}`}>
                      {s === 'shipping' ? 'Shipping' : s === 'payment' ? 'Payment' : 'Review'}
                    </span>
                    {i < 2 && <div className="w-12 h-px bg-vitorra-border" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-bold">Something went wrong</p>
              <p className="text-xs text-red-400/80 mt-1">{error}</p>
            </div>
            <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400 text-xs">Dismiss</button>
          </div>
        )}

        <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* ─── STEP 1: SHIPPING ─── */}
          {step === 'shipping' && (
            <div>
              <h2 className="text-vitorra-text mb-8">Shipping Address</h2>

              {/* Saved Addresses */}
              {profile.addresses && profile.addresses.length > 0 && !showNewAddress && (
                <div className="space-y-4 mb-6">
                  {profile.addresses.map(addr => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`w-full text-left p-6 rounded-2xl border transition-all ${selectedAddressId === addr.id ? 'bg-vitorra-gold/5 border-vitorra-gold/30' : 'bg-vitorra-card border-vitorra-border hover:border-vitorra-gold/20'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-vitorra-text text-sm">{addr.fullName}</span>
                            <span className="text-[9px] px-2 py-0.5 bg-vitorra-bg/50 border border-vitorra-border rounded-full text-vitorra-muted font-bold uppercase">{addr.label}</span>
                          </div>
                          <p className="text-sm text-vitorra-muted">{addr.street}, {addr.city}, {addr.state} {addr.postalCode}</p>
                          <p className="text-sm text-vitorra-muted">{addr.country} • {addr.phone}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-vitorra-gold bg-vitorra-gold' : 'border-vitorra-border'}`}>
                          {selectedAddressId === addr.id && <Check className="w-3 h-3 text-vitorra-gold-text" />}
                        </div>
                      </div>
                    </button>
                  ))}
                  <button onClick={() => setShowNewAddress(true)} className="flex items-center gap-2 text-sm text-vitorra-gold hover:underline">
                    <Plus className="w-4 h-4" /> Add new address
                  </button>
                </div>
              )}

              {/* New Address Form */}
              {(showNewAddress || !profile.addresses?.length) && (
                <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-8 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className={labelClass}>Full Name</label><input value={newAddr.fullName} onChange={e => setNewAddr({...newAddr, fullName: e.target.value})} className={inputClass} placeholder="Full name" /></div>
                    <div><label className={labelClass}>Phone</label><input value={newAddr.phone} onChange={e => setNewAddr({...newAddr, phone: e.target.value})} className={inputClass} placeholder="+256 700 000 000" /></div>
                  </div>
                  <div><label className={labelClass}>Street Address</label><input value={newAddr.street} onChange={e => setNewAddr({...newAddr, street: e.target.value})} className={inputClass} placeholder="Plot 32, Lumumba Avenue" /></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div><label className={labelClass}>City</label><input value={newAddr.city} onChange={e => setNewAddr({...newAddr, city: e.target.value})} className={inputClass} placeholder="Kampala" /></div>
                    <div><label className={labelClass}>State/Region</label><input value={newAddr.state} onChange={e => setNewAddr({...newAddr, state: e.target.value})} className={inputClass} placeholder="Central" /></div>
                    <div><label className={labelClass}>Postal Code</label><input value={newAddr.postalCode} onChange={e => setNewAddr({...newAddr, postalCode: e.target.value})} className={inputClass} placeholder="00000" /></div>
                    <div><label className={labelClass}>Country</label><input value={newAddr.country} onChange={e => setNewAddr({...newAddr, country: e.target.value})} className={inputClass} /></div>
                  </div>
                  {profile.addresses && profile.addresses.length > 0 && (
                    <div className="flex gap-3">
                      <button onClick={handleSaveAddress} className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl text-sm">Save Address</button>
                      <button onClick={() => setShowNewAddress(false)} className="px-6 py-3 text-vitorra-muted text-sm">Cancel</button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleContinueToPayment}
                disabled={(!selectedAddressId && !newAddr.street) || validating}
                className="w-full mt-8 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-vitorra-gold/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {validating ? <><Loader2 className="w-4 h-4 animate-spin" /> Validating Cart...</> : <>Continue to Payment <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {/* ─── STEP 2: PAYMENT METHOD ─── */}
          {step === 'payment' && serverCart && (
            <div>
              <h2 className="text-vitorra-text mb-8">Select Payment Method</h2>

              <div className="grid grid-cols-1 gap-4 mb-8">
                {paymentGateways.map(gw => (
                  <button
                    key={gw.id}
                    onClick={() => setSelectedGateway(gw.id)}
                    className={`w-full text-left p-6 rounded-2xl border transition-all flex items-center gap-5 ${selectedGateway === gw.id ? 'bg-vitorra-gold/5 border-vitorra-gold/30' : 'bg-vitorra-card border-vitorra-border hover:border-vitorra-gold/20'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${selectedGateway === gw.id ? 'bg-vitorra-gold/10 border-vitorra-gold/30 text-vitorra-gold' : 'bg-vitorra-bg/50 border-vitorra-border text-vitorra-muted'}`}>
                      {gw.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-vitorra-text">{gw.name}</p>
                      <p className="text-xs text-vitorra-muted">{gw.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedGateway === gw.id ? 'border-vitorra-gold bg-vitorra-gold' : 'border-vitorra-border'}`}>
                      {selectedGateway === gw.id && <Check className="w-3 h-3 text-vitorra-gold-text" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Server-calculated order summary */}
              <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 mb-8">
                <h4 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest flex items-center gap-2 mb-4">
                  <Package className="w-3 h-3" /> Server-Verified Order Summary
                </h4>
                {serverCart.validatedItems.map((item: ValidatedCartItem, i: number) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-vitorra-border last:border-0">
                    <div>
                      <p className="text-sm text-vitorra-text">{item.quantity}× {item.name}</p>
                      <p className="text-xs text-vitorra-muted">{formatPrice(item.unitPrice)} each</p>
                    </div>
                    <span className="font-bold text-vitorra-text">{formatPrice(item.lineTotal)}</span>
                  </div>
                ))}
                <div className="pt-4 space-y-2 border-t border-vitorra-border mt-4">
                  <div className="flex justify-between text-sm"><span className="text-vitorra-muted">Subtotal</span><span className="text-vitorra-text">{formatPrice(serverCart.subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-vitorra-muted">Shipping</span><span className="text-vitorra-text">{serverCart.shipping === 0 ? 'Free' : formatPrice(serverCart.shipping)}</span></div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-vitorra-border"><span className="text-vitorra-text">Total</span><span className="text-vitorra-gold">{formatPrice(serverCart.grandTotal)}</span></div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep('shipping')} className="px-8 py-4 bg-vitorra-bg/50 border border-vitorra-border text-vitorra-text font-bold rounded-xl hover:bg-vitorra-bg/80 transition-all text-sm">
                  <ArrowLeft className="w-4 h-4 inline mr-2" /> Back
                </button>
                <button
                  onClick={handleContinueToReview}
                  className="flex-1 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-vitorra-gold/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  Continue to Review <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: REVIEW ─── */}
          {step === 'review' && serverCart && (
            <div>
              <h2 className="text-vitorra-text mb-8">Review Your Order</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Items (server-priced) */}
                <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6 space-y-4">
                  <h4 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest flex items-center gap-2"><Package className="w-3 h-3" /> Order Items</h4>
                  {serverCart.validatedItems.map((item: ValidatedCartItem, i: number) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-vitorra-border last:border-0">
                      <div>
                        <p className="text-sm font-bold text-vitorra-text">{item.quantity}× {item.name}</p>
                        <p className="text-xs text-vitorra-muted">{formatPrice(item.unitPrice)} each</p>
                      </div>
                      <span className="font-bold text-vitorra-text">{formatPrice(item.lineTotal)}</span>
                    </div>
                  ))}
                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-vitorra-muted">Subtotal</span><span className="text-vitorra-text">{formatPrice(serverCart.subtotal)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-vitorra-muted">Shipping</span><span className="text-vitorra-text">{serverCart.shipping === 0 ? 'Free' : formatPrice(serverCart.shipping)}</span></div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-vitorra-border"><span className="text-vitorra-text">Total</span><span className="text-vitorra-gold">{formatPrice(serverCart.grandTotal)}</span></div>
                  </div>
                </div>

                {/* Shipping + Payment */}
                <div className="space-y-6">
                  <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6">
                    <h4 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest flex items-center gap-2 mb-4"><MapPin className="w-3 h-3" /> Shipping To</h4>
                    {selectedAddress ? (
                      <div className="text-sm text-vitorra-text">
                        <p className="font-bold">{selectedAddress.fullName}</p>
                        <p className="text-vitorra-muted">{selectedAddress.street}</p>
                        <p className="text-vitorra-muted">{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</p>
                        <p className="text-vitorra-muted">{selectedAddress.country} • {selectedAddress.phone}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-vitorra-text">
                        <p className="font-bold">{newAddr.fullName}</p>
                        <p className="text-vitorra-muted">{newAddr.street}, {newAddr.city}</p>
                        <p className="text-vitorra-muted">{newAddr.country} • {newAddr.phone}</p>
                      </div>
                    )}
                    <button onClick={() => setStep('shipping')} className="text-xs text-vitorra-gold mt-3 hover:underline">Change</button>
                  </div>

                  <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-6">
                    <h4 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest flex items-center gap-2 mb-4"><CreditCard className="w-3 h-3" /> Payment Method</h4>
                    <div className="flex items-center gap-3 p-4 bg-vitorra-gold/5 border border-vitorra-gold/20 rounded-xl">
                      {paymentGateways.find(g => g.id === selectedGateway)?.icon}
                      <div>
                        <p className="text-sm font-bold text-vitorra-text">{paymentGateways.find(g => g.id === selectedGateway)?.name}</p>
                        <p className="text-xs text-vitorra-muted">{paymentGateways.find(g => g.id === selectedGateway)?.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => setStep('payment')} className="text-xs text-vitorra-gold mt-3 hover:underline">Change</button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep('payment')} className="px-8 py-4 bg-vitorra-bg/50 border border-vitorra-border text-vitorra-text font-bold rounded-xl hover:bg-vitorra-bg/80 transition-all text-sm">
                  <ArrowLeft className="w-4 h-4 inline mr-2" /> Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-1 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-vitorra-gold/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <>
                    {selectedGateway === 'bank_transfer' ? 'Place Order' : `Pay ${formatPrice(serverCart.grandTotal)}`} <ArrowRight className="w-4 h-4" />
                  </>}
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 4: CONFIRMED ─── */}
          {step === 'confirmed' && (
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-vitorra-text mb-4">Order Confirmed!</h2>
              <p className="text-vitorra-muted mb-2">Your order <span className="text-vitorra-gold font-bold">{orderId}</span> has been placed successfully.</p>
              {selectedGateway === 'bank_transfer' && (
                <p className="text-vitorra-muted mb-10">Please complete the bank transfer to process your order.</p>
              )}
              {selectedGateway === 'flutterwave' && (
                <p className="text-vitorra-muted mb-10">Your payment is being processed. You'll receive a confirmation email shortly.</p>
              )}
              {selectedGateway === 'paypal' && (
                <p className="text-vitorra-muted mb-10">Your PayPal payment is being verified. We'll update your order status shortly.</p>
              )}

              {/* Bank Details (only for bank transfer) */}
              {selectedGateway === 'bank_transfer' && bankDetails && (
                <div className="bg-vitorra-card border border-vitorra-border rounded-2xl p-8 text-left mb-8">
                  <h4 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-6 flex items-center gap-2">
                    <Building2 className="w-3 h-3 text-vitorra-gold" /> Bank Transfer Details
                  </h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Bank Name', value: bankDetails.bankName, key: 'bank' },
                      { label: 'Account Name', value: bankDetails.accountName, key: 'name' },
                      { label: 'Account Number', value: bankDetails.accountNumber, key: 'acct' },
                      { label: 'Reference', value: bankDetails.reference || orderId, key: 'ref' },
                    ].map(row => (
                      <div key={row.key} className="flex items-center justify-between py-3 border-b border-vitorra-border last:border-0">
                        <span className="text-xs text-vitorra-muted uppercase font-bold tracking-wider">{row.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-vitorra-text">{row.value}</span>
                          <button onClick={() => copyToClipboard(row.value, row.key)} className="p-1 text-vitorra-muted/40 hover:text-vitorra-gold transition-colors">
                            {copied === row.key ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Link to="/portal" className="px-8 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-vitorra-gold/20 flex items-center gap-2 uppercase tracking-widest text-xs">
                  View in Portal <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/" className="px-8 py-4 bg-vitorra-bg/50 border border-vitorra-border text-vitorra-text font-bold rounded-xl hover:bg-vitorra-bg/80 transition-all text-xs uppercase tracking-widest">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

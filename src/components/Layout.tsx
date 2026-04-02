import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Facebook, Instagram, ShoppingCart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCMS } from '../context/CMSContext';
import { useLanguage } from '../context/LanguageContext';
import Logo from './Logo';


export default function Layout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [fbPopupOpen, setFbPopupOpen] = useState(false);
  const location = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();
  const { state } = useCMS();
  const { t } = useLanguage();


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProductsDropdownOpen(false);
    setShopDropdownOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navProducts = state.products.map(p => ({ name: p.name, path: p.path }));
  const shopProducts = state.products.filter(p => p.id !== 'logistics' && p.variants && p.variants.length > 0).map(p => ({ name: p.name, path: `/shop/${p.id}` }));

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden max-w-[100vw]">
      {/* Navbar — hidden on admin routes which have their own top bar */}
      {!isAdminRoute && (
        <header
          translate="no"
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
            ? 'bg-vitorra-bg/80 backdrop-blur-2xl border-b border-vitorra-border py-4 shadow-2xl'
            : 'bg-transparent py-6'
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <Link to="/" className="flex items-center group -ml-2">
                <img src="/images/vitorralogo.png" alt="Vitorra Holdings Limited" className="h-16 sm:h-20 md:h-24 w-auto object-contain hover:opacity-90 transition-opacity drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]" />
              </Link>

              {/* Desktop Merged Navigation & Icons */}
              <div data-nav="desktop" className={`hidden md:flex items-center p-1.5 transition-all duration-500 rounded-full border border-vitorra-border shadow-2xl ${isScrolled
                  ? 'bg-vitorra-bg/40 backdrop-blur-xl'
                  : 'bg-vitorra-bg/40 backdrop-blur-2xl border-vitorra-gold/20'
                }`}>
                <nav className="flex items-center gap-8 px-6">
                  <Link to="/" className="nav-link font-medium hover:text-vitorra-gold transition-colors text-vitorra-text/80">{t('home')}</Link>
                  <Link to="/about" className="nav-link font-medium hover:text-vitorra-gold transition-colors text-vitorra-text/80">{t('about')}</Link>

                  {/* Products Dropdown */}
                  <div
                    className="relative group h-full flex items-center"
                    onMouseEnter={() => setProductsDropdownOpen(true)}
                    onMouseLeave={() => setProductsDropdownOpen(false)}
                  >
                    <button className="flex items-center gap-1 nav-link font-medium hover:text-vitorra-gold transition-colors py-2 text-vitorra-text/80">
                      {t('products')} <ChevronDown className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                      {productsDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-64 bg-vitorra-bg/90 backdrop-blur-xl border border-vitorra-border shadow-2xl rounded-2xl overflow-hidden"
                        >
                          {navProducts.map((product) => (
                            <Link
                              key={product.path}
                              to={product.path}
                              className="block px-6 py-4 text-sm text-vitorra-text/80 hover:bg-vitorra-gold/10 hover:text-vitorra-gold transition-colors border-b border-vitorra-border last:border-0"
                            >
                              {product.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>


                  <div
                    className="relative group h-full flex items-center"
                    onMouseEnter={() => setShopDropdownOpen(true)}
                    onMouseLeave={() => setShopDropdownOpen(false)}
                  >
                    <button className="flex items-center gap-1 nav-link font-medium hover:text-vitorra-gold transition-colors py-2 text-vitorra-text/80">
                      Shop <ChevronDown className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                      {shopDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-64 bg-vitorra-bg/90 backdrop-blur-xl border border-vitorra-border shadow-2xl rounded-2xl overflow-hidden"
                        >
                          <Link
                            to="/shop"
                            className="block px-6 py-4 text-sm font-bold text-vitorra-gold hover:bg-vitorra-gold/10 transition-colors border-b border-vitorra-border"
                          >
                            All Products
                          </Link>
                          {shopProducts.map((product) => (
                            <Link
                              key={product.path}
                              to={product.path}
                              className="block px-6 py-4 text-sm text-vitorra-text/80 hover:bg-vitorra-gold/10 hover:text-vitorra-gold transition-colors border-b border-vitorra-border last:border-0"
                            >
                              {product.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Link to="/news" className="nav-link font-medium hover:text-vitorra-gold transition-colors text-vitorra-text/80">{t('news')}</Link>
                  <Link to="/contact" className="nav-link font-medium hover:text-vitorra-gold transition-colors text-vitorra-text/80">{t('contact')}</Link>
                </nav>

                {/* Divider */}
                <div className="w-px h-8 bg-vitorra-border mx-2"></div>

                {/* Icons */}
                <div className="flex items-center pr-1 gap-1">

                  <Link to="/cart" className="relative text-vitorra-text/80 hover:text-vitorra-gold transition-colors w-10 h-10 flex items-center justify-center rounded-full hover:bg-vitorra-gold/10 bg-vitorra-bg/20 border border-vitorra-border shadow-lg">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-vitorra-gold text-vitorra-gold-text text-[11px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-lg">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                  <Link
                    to={user ? "/portal" : "/auth"}
                    className="relative text-vitorra-text/80 hover:text-vitorra-gold transition-colors w-10 h-10 flex items-center justify-center rounded-full hover:bg-vitorra-gold/10 bg-vitorra-bg/20 border border-vitorra-border shadow-lg backdrop-blur-md"
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    {user && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#2b2b2b]"></span>
                    )}
                  </Link>


                </div>
              </div>

              {/* Mobile Icons & Menu Button */}
              <div data-nav="mobile" className="md:hidden flex items-center gap-3">

                <Link to="/cart" className="relative text-vitorra-text/80 hover:text-vitorra-gold transition-colors bg-vitorra-bg/20 backdrop-blur-xl border border-vitorra-border p-2 rounded-lg shadow-lg">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-vitorra-gold text-vitorra-gold-text text-[11px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
                <Link
                  to={user ? "/portal" : "/auth"}
                  className="relative text-vitorra-text/80 hover:text-vitorra-gold transition-colors bg-vitorra-bg/20 backdrop-blur-xl border border-vitorra-border p-2 rounded-lg shadow-lg"
                >
                  <User className="w-5 h-5" />
                  {user && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border border-vitorra-bg"></span>
                  )}
                </Link>



                {/* Mobile Menu Button */}
                <button
                  className="text-vitorra-text/80 hover:text-vitorra-gold transition-colors bg-vitorra-bg/20 backdrop-blur-xl border border-vitorra-border p-2 rounded-lg shadow-lg"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-vitorra-bg/95 backdrop-blur-xl border-b border-vitorra-border overflow-hidden shadow-2xl"
              >
                <div className="px-4 py-6 flex flex-col gap-4">
                  <Link to="/" className="text-lg font-medium text-vitorra-text/80 hover:text-vitorra-gold transition-colors">{t('home')}</Link>
                  <Link to="/about" className="text-lg font-medium text-vitorra-text/80 hover:text-vitorra-gold transition-colors">{t('about')}</Link>

                  <div className="flex flex-col gap-2">
                    <span className="text-vitorra-muted text-lg font-medium">{t('products')}</span>
                    <div className="pl-4 flex flex-col gap-3 border-l border-vitorra-border ml-2">
                      {navProducts.map((product) => (
                        <Link
                          key={product.path}
                          to={product.path}
                          className="text-base text-vitorra-muted hover:text-vitorra-gold transition-colors"
                        >
                          {product.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-vitorra-text/80 hover:text-vitorra-gold transition-colors">Shop</Link>
                    <div className="pl-4 flex flex-col gap-3 border-l border-vitorra-border ml-2">
                      {shopProducts.map((product) => (
                        <Link
                          key={product.path}
                          to={product.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-base text-vitorra-muted hover:text-vitorra-gold transition-colors"
                        >
                          {product.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <Link to="/news" className="text-lg font-medium text-vitorra-text/80 hover:text-vitorra-gold transition-colors">{t('news')}</Link>
                  <Link to="/contact" className="text-lg font-medium text-vitorra-text/80 hover:text-vitorra-gold transition-colors">{t('contact')}</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Theme Switcher removed — Midnight Blue locked */}

      {/* Footer — CMS-driven */}
      {!isAdminRoute && (
        <footer translate="no" className="bg-vitorra-bg border-t border-vitorra-border pt-12 lg:pt-16 pb-8 transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-x-2 sm:gap-x-6 gap-y-10 mb-12">

              {/* Company Info & Logo */}
              <div className="col-span-3 lg:col-span-1 flex flex-col items-center lg:items-start space-y-6">
                <Link to="/" className="flex items-center group">
                  <img src="/images/vitorralogo.png" alt="Vitorra Holdings" className="h-28 sm:h-36 lg:h-40 w-auto object-contain hover:opacity-90 transition-opacity drop-shadow-md mx-auto lg:mx-0" />
                </Link>
                <div className="flex justify-center lg:justify-start gap-4 relative w-full pl-2 lg:pl-0">
                  {/* Facebook — dual page popup */}
                  <div className="relative">
                    <button
                      onClick={() => setFbPopupOpen(!fbPopupOpen)}
                      className="w-10 h-10 rounded-full bg-vitorra-bg/5 border border-vitorra-border flex items-center justify-center text-vitorra-muted hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {fbPopupOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }}
                          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-vitorra-bg/95 backdrop-blur-xl border border-vitorra-border rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                          <a href="https://www.facebook.com/profile.php?id=61578493897367" target="_blank" rel="noopener noreferrer" onClick={() => setFbPopupOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-vitorra-text hover:bg-blue-500/10 hover:text-blue-400 transition-colors border-b border-vitorra-border">
                            <Facebook className="w-4 h-4" /> SEAL
                          </a>
                          <a href="https://www.facebook.com/profile.php?id=61578465107026" target="_blank" rel="noopener noreferrer" onClick={() => setFbPopupOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-vitorra-text hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
                            <Facebook className="w-4 h-4" /> Fuel Eco Tech
                          </a>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* X (Twitter) */}
                  <a href="https://x.com/Vitorra279710" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-vitorra-bg/5 border border-vitorra-border flex items-center justify-center text-vitorra-muted hover:text-vitorra-gold hover:bg-vitorra-bg/10 transition-all" aria-label="X">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>

                  {/* Instagram */}
                  <a href="https://www.instagram.com/vitorraholdingsltd/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-vitorra-bg/5 border border-vitorra-border flex items-center justify-center text-vitorra-muted hover:text-pink-400 hover:bg-pink-400/10 transition-all" aria-label="Instagram">
                    <Instagram className="w-4 h-4" />
                  </a>

                  {/* WhatsApp */}
                  <a href={state.companyInfo.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-vitorra-bg/5 border border-vitorra-border flex items-center justify-center text-vitorra-muted hover:text-green-400 hover:bg-green-400/10 transition-all" aria-label="WhatsApp">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div className="col-span-1">
                <h4 className="font-heading mb-4 sm:mb-6 text-vitorra-text font-bold uppercase tracking-widest text-[9px] sm:text-[11px] lg:text-label">{t('company')}</h4>
                <ul className="space-y-2 sm:space-y-3">
                  <li><Link to="/about" className="text-vitorra-muted hover:text-vitorra-gold transition-colors text-[10px] sm:text-sm lg:text-base leading-tight break-words">{t('about')}</Link></li>
                  <li><Link to="/news" className="text-vitorra-muted hover:text-vitorra-gold transition-colors text-[10px] sm:text-sm lg:text-base leading-tight break-words">{t('news')}</Link></li>
                  <li><Link to="/contact" className="text-vitorra-muted hover:text-vitorra-gold transition-colors text-[10px] sm:text-sm lg:text-base leading-tight break-words">{t('contact')}</Link></li>
                  <li><Link to="/join-our-team" className="text-vitorra-muted hover:text-vitorra-gold transition-colors text-[10px] sm:text-sm lg:text-base leading-tight break-words">{t('join_our_team')}</Link></li>
                </ul>
              </div>

              {/* Products — now driven from CMS products */}
              <div className="col-span-1">
                <h4 className="font-heading mb-4 sm:mb-6 text-vitorra-text font-bold uppercase tracking-widest text-[9px] sm:text-[11px] lg:text-label">{t('products')}</h4>
                <ul className="space-y-2 sm:space-y-3">
                  {navProducts.map((product) => (
                    <li key={product.path}>
                      <Link to={product.path} className="text-vitorra-muted hover:text-vitorra-gold transition-colors text-[10px] sm:text-sm lg:text-base leading-tight block break-words pr-1">
                        {product.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact — now driven from CMS */}
              <div className="col-span-1 text-left lg:text-left">
                <h4 className="font-heading mb-4 sm:mb-6 text-vitorra-text font-bold uppercase tracking-widest text-[9px] sm:text-[11px] lg:text-label">{t('contact')}</h4>
                <ul className="space-y-2 sm:space-y-3 text-[10px] sm:text-sm lg:text-base text-vitorra-muted leading-tight break-words">
                  {state.companyInfo.address.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                  <li><a href={`mailto:${state.companyInfo.email}`} className="hover:text-vitorra-gold transition-colors break-all">{state.companyInfo.email}</a></li>
                  <li className="whitespace-nowrap">{state.companyInfo.phone}</li>
                </ul>
              </div>

            </div>

            <div className="border-t border-vitorra-border pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-vitorra-muted/60 text-[11px] sm:text-xs text-center md:text-left px-4 md:px-0 leading-relaxed max-w-sm md:max-w-full">
                &copy; {new Date().getFullYear()} {state.companyInfo.name}.<br className="md:hidden" /> {t('all_rights_reserved')}
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <Link to="/privacy" className="text-vitorra-muted/60 hover:text-vitorra-gold transition-colors text-[11px] sm:text-xs tracking-wide">{t('privacy_policy')}</Link>
                <Link to="/terms" className="text-vitorra-muted/60 hover:text-vitorra-gold transition-colors text-[11px] sm:text-xs tracking-wide">{t('terms')}</Link>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

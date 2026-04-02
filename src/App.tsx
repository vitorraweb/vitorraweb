import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';

import Contact from './pages/Contact';
import News from './pages/News';
import BlogArticle from './pages/BlogArticle';
import JoinOurTeam from './pages/JoinOurTeam';
import FETLabTest from './pages/FETLabTest';
import FET from './pages/products/FET';
import Seal from './pages/products/Seal';
import Coffee from './pages/products/Coffee';
import Logistics from './pages/products/Logistics';
import DynamicProductPage from './pages/products/DynamicProductPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Auth from './pages/Auth';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Portal from './pages/Portal';
import Shop from './pages/Shop';
import { AuthProvider } from './context/AuthContext';
import { CMSProvider } from './context/CMSContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CMSProvider>
            <CartProvider>
              <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="about" element={<About />} />

                    <Route path="contact" element={<Contact />} />
                    <Route path="news" element={<News />} />
                    <Route path="news/fet-lab-test" element={<FETLabTest />} />
                    <Route path="news/:id" element={<BlogArticle />} />
                    <Route path="join-our-team" element={<JoinOurTeam />} />
                    <Route path="products/fet" element={<FET />} />
                    <Route path="products/seal" element={<Seal />} />
                    <Route path="products/coffee" element={<Coffee />} />
                    <Route path="products/logistics" element={<Logistics />} />
                    <Route path="products/:slug" element={<DynamicProductPage />} />
                    <Route path="privacy" element={<PrivacyPolicy />} />
                    <Route path="terms" element={<TermsOfService />} />
                    <Route path="auth" element={<Auth />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="portal" element={<Portal />} />
                    <Route path="shop" element={<Shop />} />
                    <Route path="shop/:slug" element={<DynamicProductPage />} />

                    {/* Admin Routes */}
                    <Route path="admin" element={<AdminLogin />} />
                    <Route path="admin/dashboard" element={<AdminDashboard />} />
                  </Route>
                </Routes>
            </CartProvider>
          </CMSProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

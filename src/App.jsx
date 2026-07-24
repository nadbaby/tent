import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './screen/home/home';
import ProductsPage from './screen/products/products';
import BrandsPage from './screen/brands/brands';
import AuthPage from './screen/auth/auth';
import ProfilePage from './screen/profile/profile';
import OrderSuccessPage from './screen/order-success/order-success';
import OrderFailurePage from './screen/order-failure/order-failure';
import OrdersPage from './screen/orders/orders';
import ContactPage from './screen/contact/contact';
import OrderOperationsDashboard from './screen/employee-panel/employee-panel';
import StaffOperationsDashboard from './screen/employee-management/employee-management';
import CustomerOperationsDashboard from './screen/user-management/user-management';
import TodaysOrdersDashboard from './screen/todays-orders/todays-orders';
import AboutPage from './screen/about/about';
import RequestQuotePage from './screen/request-quote/request-quote';
import LegalPage from './screen/legal/legal';
import ProductDetailPage from './screen/product-detail/product-detail';
import WhatsAppFloat from './components/common/WhatsAppFloat';
import QuoteFloat from './components/common/QuoteFloat';
import Chatbot from './components/common/Chatbot';
import ScrollToTop from './components/common/ScrollToTop';
import CheckoutPage from './screen/checkout/checkout';
import WishlistPage from './screen/wishlist/wishlist';
import UserTickets from './screen/tickets/UserTickets';
import TicketCreate from './screen/tickets/TicketCreate';
import TicketDetail from './screen/tickets/TicketDetail';
import Profile from './screen/profile/profile';
import PrivacyPolicy from './screen/legal/PrivacyPolicy';
import TermsOfService from './screen/legal/TermsOfService';
import VerifyEmail from './screen/auth/VerifyEmail';
import ShippingManagement from './screen/shipping-management/ShippingManagement';
import AnalyticsDashboard from './screen/analytics/AnalyticsDashboard';

import CartSync from './components/common/CartSync';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import OfflineStatus from './components/common/OfflineStatus';
import OfflineScreen from './screen/offline/OfflineScreen';
import './App.css';

import { ToastProvider } from './context/ToastContext';
import { LoaderProvider, useLoader } from './context/LoaderContext';
const AppInitializer = ({ children }) => {
  const { showLoader, hideLoader } = useLoader();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    showLoader("Fine Bearing & Oil Seal");
    const timer = setTimeout(() => {
      hideLoader();
      setIsReady(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div style={{ filter: isReady ? 'none' : 'blur(4px)', opacity: isReady ? 1 : 0.8, transition: 'filter 0.5s ease-in-out, opacity 0.5s ease-in-out', pointerEvents: isReady ? 'auto' : 'none' }}>
        {children}
      </div>
    </>
  );
};

const AppLayout = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineScreenDismissed, setIsOfflineScreenDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsOfflineScreenDismissed(false); // Reset dismissal so it shows next time they go offline
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Custom event listener for custom wishlist navigation trigger inside OfflineScreen
    const handleWishlistTrigger = () => {
      // Trigger navigation
      window.location.href = '/wishlist';
    };
    window.addEventListener('navigate-wishlist', handleWishlistTrigger);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('navigate-wishlist', handleWishlistTrigger);
    };
  }, []);

  return (
    <div className={`app ${isLoginPage ? 'auth-layout' : 'standard-layout'}`}>
      {!isOnline && !isOfflineScreenDismissed && (
        <OfflineScreen onDismiss={() => setIsOfflineScreenDismissed(true)} />
      )}
      <OfflineStatus />
      <Navbar />
      <WhatsAppFloat />
      <QuoteFloat />
      <Chatbot />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/brands" element={<BrandsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/order-failure" element={<OrderFailurePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/admin/todays-orders" element={<TodaysOrdersDashboard />} />
          <Route path="/employee-panel" element={<OrderOperationsDashboard />} />
          <Route path="/admin/employees" element={<StaffOperationsDashboard />} />
          <Route path="/admin/users" element={<CustomerOperationsDashboard />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/quote" element={<RequestQuotePage />} />
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/my-tickets" element={<UserTickets />} />
          <Route path="/support/create" element={<TicketCreate />} />
          <Route path="/ticket/:id" element={<TicketDetail />} />
          <Route path="/admin/shipping" element={<ShippingManagement />} />
          <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <LoaderProvider>
      <ToastProvider>
        <AppInitializer>
          <Router>
            <ScrollToTop />
            <CartSync />
            <PWAInstallPrompt />
            <AppLayout />
          </Router>
        </AppInitializer>
      </ToastProvider>
    </LoaderProvider>
  );
}

export default App;


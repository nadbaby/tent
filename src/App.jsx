import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/common/ErrorBoundary';
const HomePage = lazy(() => import('./screen/home/home'));
const ProductsPage = lazy(() => import('./screen/products/products'));
const BrandsPage = lazy(() => import('./screen/brands/brands'));
const AuthPage = lazy(() => import('./screen/auth/auth'));
const OrderSuccessPage = lazy(() => import('./screen/order-success/order-success'));
const OrderFailurePage = lazy(() => import('./screen/order-failure/order-failure'));
const OrdersPage = lazy(() => import('./screen/orders/orders'));
const ContactPage = lazy(() => import('./screen/contact/contact'));
const OrderOperationsDashboard = lazy(() => import('./screen/employee-panel/employee-panel'));
const StaffOperationsDashboard = lazy(() => import('./screen/employee-management/employee-management'));
const CustomerOperationsDashboard = lazy(() => import('./screen/user-management/user-management'));
const TodaysOrdersDashboard = lazy(() => import('./screen/todays-orders/todays-orders'));
const AboutPage = lazy(() => import('./screen/about/about'));
const RequestQuotePage = lazy(() => import('./screen/request-quote/request-quote'));
const LegalPage = lazy(() => import('./screen/legal/legal'));
const ProductDetailPage = lazy(() => import('./screen/product-detail/product-detail'));
import WhatsAppFloat from './components/common/WhatsAppFloat';
import QuoteFloat from './components/common/QuoteFloat';
import Chatbot from './components/common/Chatbot';
import ScrollToTop from './components/common/ScrollToTop';
import MobileCartPopup from './components/common/MobileCartPopup';
const CheckoutPage = lazy(() => import('./screen/checkout/checkout'));
const WishlistPage = lazy(() => import('./screen/wishlist/wishlist'));
const UserTickets = lazy(() => import('./screen/tickets/UserTickets'));
const TicketCreate = lazy(() => import('./screen/tickets/TicketCreate'));
const TicketDetail = lazy(() => import('./screen/tickets/TicketDetail'));
const AdminTickets = lazy(() => import('./screen/tickets/AdminTickets'));
const Profile = lazy(() => import('./screen/profile/profile'));
const PrivacyPolicy = lazy(() => import('./screen/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./screen/legal/TermsOfService'));
const VerifyEmail = lazy(() => import('./screen/auth/VerifyEmail'));
const ShippingManagement = lazy(() => import('./screen/shipping-management/ShippingManagement'));
const AnalyticsDashboard = lazy(() => import('./screen/analytics/AnalyticsDashboard'));

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
    setIsReady(true);
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
      <MobileCartPopup />
      <main>
        <ErrorBoundary>
          <Suspense fallback={<div className="loading-fallback" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}>
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
              <Route path="/admin/tickets" element={<AdminTickets />} />
              <Route path="/admin/shipping" element={<ShippingManagement />} />
              <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
              <Route path="/wishlist" element={<WishlistPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
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


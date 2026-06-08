import React, { useState, useEffect } from 'react';
import { WifiOff, ShoppingCart, Heart, MessageSquare, RefreshCw, ChevronRight } from 'lucide-react';
import './OfflineScreen.css';

const OfflineScreen = ({ onDismiss }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      if (navigator.onLine) {
        window.location.reload();
      } else {
        // Trigger a shake animation on card
        const card = document.querySelector('.offline-screen-card');
        if (card) {
          card.classList.add('shake-card');
          setTimeout(() => card.classList.remove('shake-card'), 500);
        }
      }
    }, 800);
  };

  return (
    <div className="offline-screen-overlay">
      <div className="offline-screen-card">
        {/* Connection Lost Header */}
        <div className="offline-screen-header">
          <div className="offline-badge">
            <span className="pulse-dot"></span>
            No Connection
          </div>
          <div className="offline-wifi-icon-wrapper">
            <WifiOff size={48} className="wifi-off-icon" />
          </div>
          <h1>Connection Lost</h1>
          <p>It looks like you're offline. Don't worry, you can still access some offline features or contact us directly.</p>
        </div>

        {/* Offline Features List */}
        <div className="offline-options-list">
          <button 
            className="offline-option-item"
            onClick={() => {
              onDismiss();
              // Trigger Cart open event/action
              const cartBtn = document.querySelector('.cart-btn');
              if (cartBtn) cartBtn.click();
            }}
          >
            <div className="option-icon-bg cart-bg">
              <ShoppingCart size={18} />
            </div>
            <div className="option-text">
              <strong>View Offline Cart</strong>
              <span>Review items you've added to your cart</span>
            </div>
            <ChevronRight size={16} className="arrow-right" />
          </button>

          <button 
            className="offline-option-item"
            onClick={() => {
              onDismiss();
              window.location.hash = '/wishlist';
              // Since it's react router we can navigate
              window.dispatchEvent(new CustomEvent('navigate-wishlist'));
            }}
          >
            <div className="option-icon-bg wishlist-bg">
              <Heart size={18} />
            </div>
            <div className="option-text">
              <strong>View Saved Items</strong>
              <span>Browse items in your wishlist offline</span>
            </div>
            <ChevronRight size={16} className="arrow-right" />
          </button>

          <a 
            href="https://wa.me/918146119761?text=Hello%2C%20I%20am%20offline%20but%20want%20to%20place%20an%20order%20for%20bearings."
            target="_blank"
            rel="noopener noreferrer"
            className="offline-option-item anchor-item"
          >
            <div className="option-icon-bg whatsapp-bg">
              <MessageSquare size={18} />
            </div>
            <div className="option-text">
              <strong>Order via WhatsApp</strong>
              <span>Send catalog specs & place offline orders</span>
            </div>
            <ChevronRight size={16} className="arrow-right" />
          </a>
        </div>

        {/* Bottom Actions */}
        <div className="offline-screen-actions">
          <button 
            className="btn-retry-primary" 
            onClick={handleRetry}
            disabled={isChecking}
          >
            <RefreshCw size={16} className={isChecking ? 'spin-icon' : ''} />
            {isChecking ? 'Checking Connection...' : 'Try Reconnecting'}
          </button>
          
          <button className="btn-browse-offline" onClick={onDismiss}>
            Browse Cached Pages
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineScreen;

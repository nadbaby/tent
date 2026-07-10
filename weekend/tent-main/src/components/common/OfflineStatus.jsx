import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, MessageSquare } from 'lucide-react';
import './OfflineStatus.css';

const OfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(!navigator.onLine);
  const [connectionRestored, setConnectionRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionRestored(true);
      setShowStatus(true);
      // Hide the restored message after 4 seconds
      const timer = setTimeout(() => {
        setShowStatus(false);
        setConnectionRestored(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionRestored(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    // Force browser network check
    if (navigator.onLine) {
      window.location.reload();
    } else {
      // Flash the button to show it was clicked but still offline
      const btn = document.querySelector('.offline-retry-btn');
      if (btn) {
        btn.classList.add('flash-error');
        setTimeout(() => btn.classList.remove('flash-error'), 500);
      }
    }
  };

  if (!showStatus) return null;

  return (
    <div className={`offline-status-container ${isOnline ? 'online' : 'offline'}`}>
      <div className="offline-status-card">
        {isOnline ? (
          <div className="online-content animate-fade-in">
            <div className="status-icon-wrapper online-icon">
              <Wifi size={20} />
            </div>
            <div className="status-text">
              <strong>Connection Restored</strong>
              <span>You are back online. syncing data...</span>
            </div>
          </div>
        ) : (
          <div className="offline-content">
            <div className="status-icon-wrapper offline-icon animate-pulse">
              <WifiOff size={20} />
            </div>
            <div className="status-text">
              <strong>Working Offline</strong>
              <span>Showing cached product list and cart data.</span>
            </div>
            <div className="offline-actions">
              <button className="offline-retry-btn" onClick={handleRetry}>
                <RefreshCw size={14} className="retry-spinner" />
                <span>Retry</span>
              </button>
              <a 
                href="https://wa.me/918146119761?text=Hello%2C%20I%20am%20offline%20but%20want%20to%20place%20an%20order%20for%20bearings."
                target="_blank"
                rel="noopener noreferrer"
                className="offline-whatsapp-btn"
                title="Order via WhatsApp"
              >
                <MessageSquare size={14} />
                <span>WhatsApp Order</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineStatus;

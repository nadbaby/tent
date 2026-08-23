import React, { useState, useEffect } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './PWAInstallPrompt.css';

// Inline Safari Share icon (iOS-style arrow-out-of-box)
const SafariShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

// Plus icon for "Add to Home Screen"
const PlusSquareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const PWAInstallPrompt = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  // Service Worker update handling
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log('[PWA] Service Worker registered:', swUrl);
      // Check for updates every hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  });

  // Detect iOS Safari
  const isIOS = () => {
    const ua = window.navigator.userAgent;
    return /iphone|ipad|ipod/i.test(ua) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad OS 13+
  };

  const isInStandaloneMode = () => {
    return window.navigator.standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches;
  };

  const isSafari = () => {
    const ua = window.navigator.userAgent;
    return /safari/i.test(ua) && !/chrome|crios|fxios|edgios|opera/i.test(ua);
  };

  // Listen for the browser's install prompt (Android/Desktop)
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed && !sessionStorage.getItem('pwa-install-dismissed')) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('[PWA] App installed successfully');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  // Show iOS prompt after a short delay
  useEffect(() => {
    if (isIOS() && isSafari() && !isInStandaloneMode()) {
      const iosDismissed = localStorage.getItem('pwa-ios-dismissed');
      if (!iosDismissed) {
        // Show after 3 seconds so user has time to see the page first
        const timer = setTimeout(() => {
          setShowIOSPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleIOSDismiss = () => {
    setShowIOSPrompt(false);
    localStorage.setItem('pwa-ios-dismissed', 'true');
  };

  return (
    <>
      {/* Android/Desktop Install Prompt Banner */}
      {showInstallPrompt && (
        <div className="pwa-install-banner">
          <div className="pwa-install-content">
            <div className="pwa-install-icon">
              <Download size={22} />
            </div>
            <div className="pwa-install-text">
              <strong>Install Fine Bearing App</strong>
              <span>Quick access from your home screen — works offline too!</span>
            </div>
            <div className="pwa-install-actions">
              <button className="pwa-install-btn" onClick={handleInstall}>
                Install
              </button>
              <button className="pwa-dismiss-btn" onClick={handleDismiss}>
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Install Guide Banner */}
      {showIOSPrompt && (
        <div className="pwa-ios-banner">
          <div className="pwa-ios-content">
            <button className="pwa-ios-close" onClick={handleIOSDismiss}>
              <X size={16} />
            </button>
            <div className="pwa-ios-header">
              <div className="pwa-ios-app-icon">
                <img src="/pwa-192x192.webp" alt="Fine Bearing" />
              </div>
              <div className="pwa-ios-title">
                <strong>Install Fine Bearing</strong>
                <span>Add to your home screen for the best experience</span>
              </div>
            </div>
            <div className="pwa-ios-steps">
              <div className="pwa-ios-step">
                <div className="pwa-ios-step-num">1</div>
                <span>Tap the <strong>Share</strong> button</span>
                <div className="pwa-ios-share-icon"><SafariShareIcon /></div>
              </div>
              <div className="pwa-ios-step">
                <div className="pwa-ios-step-num">2</div>
                <span>Scroll down & tap <strong>Add to Home Screen</strong></span>
                <div className="pwa-ios-plus-icon"><PlusSquareIcon /></div>
              </div>
            </div>
            <div className="pwa-ios-arrow">▼</div>
          </div>
        </div>
      )}

      {/* Update Available Toast */}
      {needRefresh && (
        <div className="pwa-update-toast">
          <div className="pwa-update-content">
            <RefreshCw size={20} className="pwa-update-icon" />
            <span>New version available!</span>
            <button
              className="pwa-update-btn"
              onClick={() => updateServiceWorker(true)}
            >
              Update Now
            </button>
            <button
              className="pwa-dismiss-btn"
              onClick={() => setNeedRefresh(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;

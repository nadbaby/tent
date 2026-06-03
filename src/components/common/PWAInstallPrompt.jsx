import React, { useState, useEffect } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './PWAInstallPrompt.css';

const PWAInstallPrompt = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
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

  // Listen for the browser's install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not previously dismissed this session
      if (!dismissed && !sessionStorage.getItem('pwa-install-dismissed')) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('[PWA] App installed successfully');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

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

  return (
    <>
      {/* Install Prompt Banner */}
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

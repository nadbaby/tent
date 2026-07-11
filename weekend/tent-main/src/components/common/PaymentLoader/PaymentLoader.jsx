import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, RefreshCw, CreditCard } from 'lucide-react';
import './PaymentLoader.css';

const PaymentLoader = () => {
  const [statusIndex, setStatusIndex] = useState(0);
  
  const statuses = [
    "Establishing secure connection...",
    "Verifying transaction details...",
    "Authenticating with gateway...",
    "Securing your payment session...",
    "Almost there, please wait..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="payment-loader-overlay">
      <div className="payment-loader-content">
        <div className="payment-loader-ring">
          <div className="ring-outer"></div>
          <div className="ring-inner"></div>
          <CreditCard className="payment-loader-icon" size={40} />
        </div>

        <h2 className="payment-loader-title">Processing Payment</h2>
        <p className="payment-loader-status">{statuses[statusIndex]}</p>

        <div className="payment-loader-footer">
          <div className="payment-progress-bar">
            <div className="payment-progress-fill"></div>
          </div>
          
          <div className="payment-security-badge">
            <ShieldCheck size={14} />
            <span>256-bit SSL Encrypted Transaction</span>
          </div>
          
          <div className="payment-security-badge" style={{ marginTop: '-8px' }}>
            <Lock size={14} />
            <span>PCI DSS Compliant Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentLoader;

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { XCircle, RefreshCcw, ShoppingBag } from 'lucide-react';
import './order-failure.css';

const OrderFailure = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { error, orderId } = location.state || { error: 'Payment could not be processed.' };

  return (
    <div className="order-failure-screen">
      <div className="liquid-bg">
        <div className="blob blob-red"></div>
        <div className="blob blob-orange"></div>
      </div>
      
      <div className="container">
        <div className="failure-card">
          <div className="icon-wrapper">
            <XCircle size={80} className="failure-icon" />
          </div>
          
          <h1>Payment Failed</h1>
          <p className="error-description">{error}</p>
          
          {orderId && (
            <div className="order-id-badge">
              Order ID: <span>#{orderId}</span>
            </div>
          )}
          
          <div className="failure-reasons">
            <h4>Common Troubleshooting:</h4>
            <ul>
              <li>Check your network connection</li>
              <li>Ensure card/UPI has sufficient balance</li>
              <li>Verify your OTP and card details</li>
            </ul>
          </div>

          <div className="failure-actions">
            <Link to="/products" className="btn-exit">
              <ShoppingBag size={18} /> Exit
            </Link>
            <button className="btn-retry" onClick={() => navigate('/checkout')}>
              <RefreshCcw size={18} /> Retry Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFailure;

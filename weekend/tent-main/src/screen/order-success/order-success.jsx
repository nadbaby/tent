import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Phone } from 'lucide-react';
import './order-success.css';

const OrderSuccess = () => {
  const location = useLocation();
  const { order } = location.state || {};

  if (!order) return <div className="error-container"><h2>Order Not Found</h2><Link to="/products">Shop Now</Link></div>;

  const isPorter = order.deliveryMethod === 'PORTER';

  return (
    <div className="order-success-screen">
      <div className="container">
        <div className="success-card">
          <CheckCircle size={80} color={isPorter ? "#ea580c" : "#10b981"} />
          <h1>{isPorter ? "Porter Delivery Requested!" : "Order Confirmed!"}</h1>
          <p>Order ID: <span>{order.orderId}</span></p>

          {isPorter ? (
            <div className="porter-success-alert" style={{
              background: '#fff7ed',
              border: '1px solid #ffedd5',
              borderRadius: '12px',
              padding: '20px',
              margin: '24px 0',
              textAlign: 'left',
              color: '#9a3412',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              <strong>Fast Local Delivery Request Received:</strong> Thank you for your order. Your fast local delivery request has been received. Our team will verify product availability and delivery charges, then confirm your Porter delivery.
            </div>
          ) : null}

          {isPorter && (
            <div style={{ marginBottom: '24px' }}>
              <a 
                href={`https://wa.me/918146119761?text=${encodeURIComponent("Hello Fine Bearing, I have placed an order and selected Fast Local Delivery through Porter. Please confirm availability and delivery charges.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Confirm Fast Delivery on WhatsApp
              </a>
            </div>
          )}
          
          <div className="summary-box">
            <h3><Package size={20} /> Order Summary</h3>
            <div className="items">
              {order.items.map((item, i) => (
                <div key={i} className="item">
                  <span>{item.quantity}x {item.name}</span>
                  <span>₹{item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="total">
              <span>{isPorter ? "Total (Excl. Shipping)" : "Total Paid"}</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
            {isPorter && (
              <div style={{ 
                padding: '12px 15px', 
                background: '#f8fafc', 
                borderTop: '1px dashed #e2e8f0', 
                fontSize: '0.85rem', 
                color: '#64748b', 
                textAlign: 'left',
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px'
              }}>
                <strong>Delivery Charges:</strong> To be confirmed after verification
              </div>
            )}
          </div>

          <div className="actions">
            <Link to="/orders" className="btn btn-outline">View Orders</Link>
            <Link to="/products" className="btn btn-primary">Continue Shopping <ArrowRight size={18} /></Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import './order-success.css';

const OrderSuccess = () => {
  const location = useLocation();
  const { order } = location.state || {};

  if (!order) return <div className="error-container"><h2>Order Not Found</h2><Link to="/products">Shop Now</Link></div>;

  return (
    <div className="order-success-screen">
      <div className="container">
        <div className="success-card">
          <CheckCircle size={80} color="#10b981" />
          <h1>Order Confirmed!</h1>
          <p>Order ID: <span>{order.orderId}</span></p>
          
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
              <span>Total Paid</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
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

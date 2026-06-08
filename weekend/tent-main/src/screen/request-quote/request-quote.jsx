import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart, addItem } from '../../redux/cartSlice';
import { Send, FileText, Package, CheckCircle, Loader2 } from 'lucide-react';
import './request-quote.css';

const RequestQuote = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    product: '',
    quantity: '',
    message: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login?redirect=/quote');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      const searchParams = new URLSearchParams(location.search);
      const queryProduct = searchParams.get('product') || location.state?.product || '';
      const queryQuantity = searchParams.get('quantity') || location.state?.quantity || '';

      setFormData(prev => ({
        ...prev,
        name: user.name || user.displayName || user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        product: queryProduct || prev.product,
        quantity: queryQuantity || prev.quantity
      }));
    }
  }, [navigate, location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to submit a quote request.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setLoading(true);
    setError('');

    // Prepare payload. If cart has items, attach them.
    const payload = {
      ...formData,
      items: cartItems.length > 0 ? cartItems : undefined
    };

    try {
      const response = await fetch(apiUrl('/api/request-quote'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitted(true);
        if (cartItems.length > 0) {
          dispatch(clearCart());
        }
        setFormData({
          name: currentUser?.name || '',
          company: currentUser?.company || '',
          email: currentUser?.email || '',
          phone: currentUser?.phone || '',
          product: '',
          quantity: '',
          message: ''
        });
      } else {
        const data = await response.json();
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Submission Error:', err);
      setError('Failed to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="quote-success-screen">
        <div className="container">
          <div className="success-card">
            <CheckCircle size={80} color="#10b981" />
            <h1>Quote Request Received!</h1>
            <p>Our sales team will review your B2B requirements and get back to you within 24 hours.</p>
            <div className="success-actions">
              <button onClick={() => navigate('/my-quotes')} className="btn btn-primary">
                View My Quotes Dashboard
              </button>
              <button onClick={() => setSubmitted(false)} className="btn btn-secondary" style={{ marginLeft: '12px' }}>
                Request Another Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quote-screen">
      <div className="container">
        <div className="quote-container">
          <div className="quote-info">
            <h1>Request a Bulk Quote</h1>
            <p>Get customized pricing for large volume B2B orders or negotiated items.</p>
            
            {cartItems.length > 0 && (
              <div className="quote-cart-items-box">
                <h3>Items In Request ({cartItems.length})</h3>
                <div className="quote-items-scroll">
                  {cartItems.map((item) => (
                    <div key={item.id} className="quote-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <div className="item-name-col">{item.name}</div>
                      <div className="item-qty-col" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Qty:</span>
                        <input
                          type="number"
                          value={item.quantity}
                          min="1"
                          onChange={(e) => {
                            const newQty = parseInt(e.target.value);
                            if (!isNaN(newQty) && newQty >= 1) {
                              dispatch(addItem({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                image: item.image,
                                quantity: newQty,
                                replace: true
                              }));
                            }
                          }}
                          style={{
                            width: '80px',
                            padding: '6px 10px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            color: '#1e293b',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="quote-items-notice">
                  These items will automatically be submitted for B2B pricing negotiation.
                </div>
              </div>
            )}

            <div className="benefit-item">
              <Package size={24} />
              <div>
                <h4>Wholesale Pricing</h4>
                <p>Significant discounts on bulk purchases.</p>
              </div>
            </div>
            <div className="benefit-item">
              <FileText size={24} />
              <div>
                <h4>Priority Support</h4>
                <p>Dedicated manager for your business account.</p>
              </div>
            </div>
          </div>

          <div className="quote-form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label>Company Name *</label>
                  <input name="company" value={formData.company} onChange={handleChange} required placeholder="ACME Corp" />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Business Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@company.com" />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+91 9876543210" />
                </div>
              </div>

              {cartItems.length === 0 && (
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Product Name / Part No. *</label>
                    <input name="product" value={formData.product} onChange={handleChange} required placeholder="e.g. SKF 6205 Bearing" />
                  </div>
                  <div className="form-group">
                    <label>Expected Quantity *</label>
                    <input name="quantity" value={formData.quantity} onChange={handleChange} required placeholder="e.g. 500 units" />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Specific Requirements & Target Price</label>
                <textarea name="message" value={formData.message} onChange={handleChange} rows="4" placeholder="Tell us more about your target pricing, delivery timelines, etc..."></textarea>
              </div>

              {error && <div className="form-error">{error}</div>}

              <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                {loading ? <><Loader2 className="animate-spin" size={18} /> Sending...</> : <>Send Request <Send size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestQuote;

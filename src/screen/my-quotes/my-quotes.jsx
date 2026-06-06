import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, MessageSquare, ChevronRight, CornerDownRight, 
  DollarSign, Check, X, ArrowLeft, RefreshCw, Send, 
  ShoppingBag, Calendar, ArrowRight, Loader2, Award, Clock
} from 'lucide-react';
import { resolveImageUrl } from '../../components/home/ProductCard';
import './my-quotes.css';

const MyQuotes = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields for reply/counter-offering
  const [chatMessage, setChatMessage] = useState('');
  const [counterPrices, setCounterPrices] = useState({}); // productId -> price

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/my-quotes');
      return;
    }
    fetchQuotes();
  }, [user]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/quotes/my-quotes'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
      }
    } catch (err) {
      console.error("Failed to fetch quotes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuoteDetail = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/quotes/${id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedQuote(data);
        // Initialize counter price inputs with currently offered prices
        const initialCounters = {};
        data.items.forEach(item => {
          initialCounters[item.productId] = item.counterPrice || item.offeredPrice || item.originalPrice;
        });
        setCounterPrices(initialCounters);
      }
    } catch (err) {
      console.error("Failed to load quote details:", err);
    }
  };

  const handleSelectQuote = (quote) => {
    setSelectedQuote(quote);
    fetchQuoteDetail(quote.id);
  };

  const handleCounterPriceChange = (productId, val) => {
    setCounterPrices(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  const handleNegotiate = async (action) => {
    if (!selectedQuote) return;
    setSubmitting(true);
    setError('');

    const token = localStorage.getItem('token');
    
    // Format items if action is counter
    const itemsPayload = action === 'counter' 
      ? selectedQuote.items.map(item => ({
          productId: item.productId,
          counterPrice: Number(counterPrices[item.productId]) || item.offeredPrice
        }))
      : undefined;

    try {
      const res = await fetch(apiUrl(`/api/quotes/${selectedQuote.id}/negotiate`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          message: chatMessage,
          items: itemsPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedQuote(data.quote);
        setChatMessage('');
        fetchQuotes(); // Refresh list in background
      } else {
        const data = await res.json();
        setError(data.message || 'Action failed');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!selectedQuote) return;
    setSubmitting(true);
    setError('');

    const token = localStorage.getItem('token');
    try {
      // 1. Convert quote to order
      const res = await fetch(apiUrl(`/api/quotes/${selectedQuote.id}/convert-to-order`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Order conversion failed');
      }

      const { orderId } = await res.json();
      
      // 2. Initialize Payment Flow
      const payRes = await fetch(apiUrl(`/api/quotes/${selectedQuote.id}/pay`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!payRes.ok) {
        const data = await payRes.json();
        throw new Error(data.message || 'Payment initialization failed');
      }

      const payData = await payRes.json();

      // Load Razorpay
      const rzpOptions = {
        key: payData.razorpayKeyId,
        amount: payData.amount,
        currency: payData.currency,
        name: "Fine Bearing & Oil Seal",
        description: `B2B Negotiated Quote ${selectedQuote.id}`,
        order_id: payData.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(apiUrl('/api/payment/verify'), {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }),
            });

            if (verifyRes.ok) {
              const verifyResult = await verifyRes.json();
              navigate('/order-success', { state: { order: verifyResult.order } });
            } else {
              navigate('/order-failure');
            }
          } catch (err) {
            navigate('/order-failure');
          }
        },
        prefill: {
          name: user.name || user.username,
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: { color: "#ea580c" }
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();

    } catch (err) {
      setError(err.message || 'Failed to complete order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending Review': return 'status-pending';
      case 'Price Offered': return 'status-offered';
      case 'Counter Offered': return 'status-countered';
      case 'Accepted': return 'status-accepted';
      case 'Converted to Order': return 'status-completed';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="quotes-loading-wrapper">
        <Loader2 className="animate-spin" size={40} color="#ea580c" />
        <p>Loading your B2B RFQs...</p>
      </div>
    );
  }

  return (
    <div className="my-quotes-wrapper">
      <div className="container">
        {!selectedQuote ? (
          // LIST VIEW
          <div className="quotes-list-section">
            <div className="dashboard-header">
              <h1>Interactive RFQ Portal</h1>
              <p>Negotiate tailored B2B bulk volumes and custom rates directly with our management team.</p>
            </div>

            {quotes.length === 0 ? (
              <div className="empty-quotes">
                <ShoppingBag size={64} strokeWidth={1.5} color="#94a3b8" />
                <h3>No Quotes Submitted</h3>
                <p>Add items to your cart and request a wholesale quote to initiate negotiations.</p>
                <button onClick={() => navigate('/products')} className="btn btn-primary">Browse Products</button>
              </div>
            ) : (
              <div className="quotes-grid">
                {quotes.map(quote => (
                  <div key={quote.id} className="quote-card-glass" onClick={() => handleSelectQuote(quote)}>
                    <div className="quote-card-header">
                      <span className="quote-id">{quote.id}</span>
                      <span className={`quote-status-badge ${getStatusClass(quote.status)}`}>
                        {quote.status}
                      </span>
                    </div>
                    
                    <div className="quote-card-body">
                      {quote.items && quote.items.length > 0 ? (
                        <div className="quote-items-summary">
                          <strong>{quote.items[0].name}</strong>
                          {quote.items.length > 1 && <span> and {quote.items.length - 1} other items</span>}
                        </div>
                      ) : (
                        <div className="quote-items-summary">
                          <strong>{quote.product || 'Custom Requirements'}</strong>
                          <span> ({quote.quantity || 'Bulk'} units)</span>
                        </div>
                      )}
                      <p className="quote-card-message">"{quote.message || 'No initial requirements note.'}"</p>
                    </div>

                    <div className="quote-card-footer">
                      <div className="quote-date">
                        <Calendar size={14} style={{ marginRight: '6px' }} />
                        {new Date(quote.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="view-details-link">
                        Negotiate Details <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // DETAIL VIEW
          <div className="quote-detail-section">
            <button className="back-to-list-btn" onClick={() => setSelectedQuote(null)}>
              <ArrowLeft size={16} /> Back to My Quotes
            </button>

            <div className="detail-grid-container">
              {/* LEFT SIDE: Quote Info, Items list, negotiation panel */}
              <div className="detail-main-flow">
                <div className="detail-card-glass">
                  <div className="detail-header-row">
                    <div>
                      <h2>RFQ Details {selectedQuote.id}</h2>
                      <span className="quote-timestamp">Created on {new Date(selectedQuote.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className={`quote-status-badge ${getStatusClass(selectedQuote.status)}`}>
                      {selectedQuote.status}
                    </span>
                  </div>

                  {/* B2B items table */}
                  <div className="negotiation-table-wrapper">
                    <h3>Volume Pricing Comparison</h3>
                    <table className="negotiation-table">
                      <thead>
                        <tr>
                          <th>Item Description</th>
                          <th className="text-center">Qty</th>
                          <th className="text-right">List Price</th>
                          <th className="text-right">Offered Price</th>
                          {['Price Offered', 'Counter Offered'].includes(selectedQuote.status) && (
                            <th className="text-right">My Counter Price</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuote.items && selectedQuote.items.length > 0 ? (
                          selectedQuote.items.map(item => (
                            <tr key={item.productId}>
                              <td>
                                <div className="table-item-info">
                                  <img src={resolveImageUrl(item.image)} alt={item.name} className="table-item-img" />
                                  <span className="table-item-name">{item.name}</span>
                                </div>
                              </td>
                              <td className="text-center font-bold">{item.quantity}</td>
                              <td className="text-right text-muted">₹{item.originalPrice}</td>
                              <td className="text-right text-orange font-bold">₹{item.offeredPrice}</td>
                              {['Price Offered', 'Counter Offered'].includes(selectedQuote.status) && (
                                <td className="text-right">
                                  <div className="counter-input-box">
                                    <span>₹</span>
                                    <input 
                                      type="number" 
                                      value={counterPrices[item.productId] || ''} 
                                      onChange={(e) => handleCounterPriceChange(item.productId, e.target.value)}
                                    />
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4">
                              <div className="fallback-item-desc">
                                <strong>{selectedQuote.product || 'Custom Request'}</strong>
                                <p>{selectedQuote.message}</p>
                              </div>
                            </td>
                            <td className="text-center font-bold">{selectedQuote.quantity || '1'}</td>
                            <td className="text-right text-muted">-</td>
                            <td className="text-right text-orange font-bold">-</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Calculations Grid */}
                  <div className="total-calculation-grid">
                    <div className="calc-card">
                      <span>Original Cost</span>
                      <h4>₹{selectedQuote.totalOriginalAmount?.toLocaleString('en-IN') || '-'}</h4>
                    </div>
                    <div className="calc-card offered">
                      <span>Offered Cost</span>
                      <h4>₹{selectedQuote.totalOfferedAmount?.toLocaleString('en-IN') || '-'}</h4>
                      {selectedQuote.totalOriginalAmount > 0 && selectedQuote.totalOfferedAmount > 0 && (
                        <span className="savings-badge">
                          Save {Math.round((1 - selectedQuote.totalOfferedAmount / selectedQuote.totalOriginalAmount) * 100)}%
                        </span>
                      )}
                    </div>
                    {selectedQuote.totalCounterAmount > 0 && (
                      <div className="calc-card countered">
                        <span>Counter Cost</span>
                        <h4>₹{selectedQuote.totalCounterAmount?.toLocaleString('en-IN')}</h4>
                      </div>
                    )}
                  </div>

                  {/* CONVERT TO ORDER & PAYMENT PANEL */}
                  {selectedQuote.status === 'Accepted' && (
                    <div className="payment-action-card">
                      <div className="payment-card-icon">
                        <Award size={32} color="#16a34a" />
                      </div>
                      <div className="payment-card-body">
                        <h4>Offer Accepted! Ready for Payment</h4>
                        <p>Place this order immediately to secure your negotiated B2B discount rates.</p>
                      </div>
                      <button 
                        onClick={handleConvertToOrder} 
                        className="btn btn-primary payment-trigger-btn"
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <>Pay & Order Now <ArrowRight size={16} /></>}
                      </button>
                    </div>
                  )}

                  {/* NEGOTIATION CONSOLE */}
                  {['Price Offered', 'Counter Offered', 'Pending Review'].includes(selectedQuote.status) && (
                    <div className="negotiation-console">
                      <h3>Propose Response</h3>
                      <div className="form-group">
                        <label>Comment / Message to Manager</label>
                        <textarea 
                          rows="3" 
                          placeholder="Suggest alternative pricing, shipment arrangements or volume requirements..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                        />
                      </div>

                      {error && <div className="console-error-alert">{error}</div>}

                      <div className="console-actions-row">
                        {selectedQuote.status !== 'Pending Review' && (
                          <>
                            <button 
                              className="btn btn-success" 
                              onClick={() => handleNegotiate('accept')}
                              disabled={submitting}
                            >
                              <Check size={18} style={{ marginRight: '6px' }} /> Accept Offered Deal
                            </button>
                            <button 
                              className="btn btn-outline-danger" 
                              onClick={() => handleNegotiate('reject')}
                              disabled={submitting}
                            >
                              <X size={18} style={{ marginRight: '6px' }} /> Reject Quote
                            </button>
                            <button 
                              className="btn btn-warning" 
                              onClick={() => handleNegotiate('counter')}
                              disabled={submitting}
                            >
                              <RefreshCw size={16} className={submitting ? "animate-spin" : ""} style={{ marginRight: '6px' }} /> Propose Counter Price
                            </button>
                          </>
                        )}
                        {selectedQuote.status === 'Pending Review' && (
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleNegotiate('counter')}
                            disabled={submitting || !chatMessage}
                          >
                            <Send size={16} style={{ marginRight: '6px' }} /> Send Message
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE: Chat & history logger */}
              <div className="detail-sidebar-history">
                <div className="history-card-glass">
                  <h3>Negotiation History Log</h3>
                  <div className="negotiation-chat-thread">
                    {selectedQuote.negotiationHistory && selectedQuote.negotiationHistory.length > 0 ? (
                      selectedQuote.negotiationHistory.map((historyItem, idx) => {
                        const isAdmin = historyItem.sender === 'admin';
                        return (
                          <div key={idx} className={`chat-bubble-wrapper ${isAdmin ? 'admin-msg' : 'user-msg'}`}>
                            <div className="chat-meta">
                              <strong>{historyItem.senderName}</strong>
                              <span>{new Date(historyItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="chat-bubble">
                              {historyItem.message}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-history">
                        <MessageSquare size={32} />
                        <p>No negotiation records yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQuotes;

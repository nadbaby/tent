import React, { useState, useEffect, useMemo } from 'react';
import { apiUrl } from '../../utils/api';
import { NavLink } from 'react-router-dom';
import { 
  Search, Edit2, Save, X, Calendar, User, Phone, Mail, 
  MessageSquare, ChevronRight, Check, Shield, Users, 
  Package, DollarSign, RefreshCw, Filter, Clock, Info, Eye, Send, Loader2
} from 'lucide-react';
import { resolveImageUrl } from '../../components/home/ProductCard';
import './employee-quotes.css';

const QuoteOperationsDashboard = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [offeredPrices, setOfferedPrices] = useState({}); // productId -> offeredPrice
  const [responseMessage, setResponseMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const isSuperAdmin = user?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl('/api/admin/quotes'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setQuotes(data);
      } else {
        setError("Failed to fetch B2B quotes. Permission denied.");
      }
    } catch (err) {
      setError("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuote = (quote) => {
    setSelectedQuote(quote);
    const initialOffered = {};
    quote.items.forEach(item => {
      initialOffered[item.productId] = item.offeredPrice || item.originalPrice;
    });
    setOfferedPrices(initialOffered);
    setResponseMessage('');
  };

  const handlePriceChange = (productId, val) => {
    setOfferedPrices(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!selectedQuote) return;
    setSubmitting(true);

    const itemsPayload = selectedQuote.items.map(item => ({
      productId: item.productId,
      offeredPrice: Number(offeredPrices[item.productId]) || item.originalPrice
    }));

    try {
      const res = await fetch(apiUrl(`/api/admin/quotes/${selectedQuote.id}/offer`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: itemsPayload,
          message: responseMessage
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedQuote(data.quote);
        setResponseMessage('');
        fetchQuotes(); // Refresh list
        alert("B2B price offer submitted successfully!");
      } else {
        alert("Failed to submit price offer.");
      }
    } catch (err) {
      alert("Error contacting server.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchesSearch = 
        (q.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.company || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || q.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

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
      <div className="employee-quotes-screen">
        <div className="container">
          <header className="panel-header">
            <div className="header-info">
              <h1>Quote Negotiations</h1>
              <p>Loading active RFQ negotiations...</p>
            </div>
          </header>
          <div className="quotes-loading-spinner">
            <Loader2 className="animate-spin" size={40} color="#ea580c" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-quotes-screen">
      <div className="container">
        <header className="panel-header">
          <div className="header-info">
            <h1>{user?.role?.toLowerCase() === 'admin' ? 'Admin Dashboard' : 'Employee Portal'}</h1>
            <p>Managing B2B Quote Negotiations for <span>Fine Bearing & Oil Seal Store</span></p>
          </div>
          <div className="user-welcome">
            Welcome, <strong>{user?.name}</strong>
          </div>
        </header>

        <div className="admin-tabs">
          <NavLink to="/admin/todays-orders" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Today's Orders</span>
          </NavLink>
          <NavLink to="/employee-panel" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
            <Package size={18} />
            <span>Past Orders</span>
          </NavLink>
          <NavLink to="/admin/quotes" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
            <DollarSign size={18} />
            <span>B2B RFQs</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Customer Discounts</span>
          </NavLink>
          {isSuperAdmin && (
            <NavLink to="/admin/employees" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Shield size={18} />
              <span>Employee Mgmt</span>
            </NavLink>
          )}
        </div>

        {error && <div className="panel-error-alert">{error}</div>}

        {/* TOOLBAR */}
        <div className="quotes-toolbar">
          <div className="search-wrapper">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Search by ID, customer name, email or company..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="filter-btn" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Price Offered">Price Offered</option>
            <option value="Counter Offered">Counter Offered</option>
            <option value="Accepted">Accepted</option>
            <option value="Converted to Order">Converted to Order</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* QUOTES LIST TABLE */}
        <div className="quotes-table-container-glass">
          <table className="quotes-table">
            <thead>
              <tr>
                <th>Quote ID</th>
                <th>Company / Name</th>
                <th>Contact Details</th>
                <th>Requested Products</th>
                <th>Status</th>
                <th className="text-right">Original Cost</th>
                <th className="text-right">Offered Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-row">No B2B quotes found matching current search/filters.</td>
                </tr>
              ) : (
                filteredQuotes.map(q => (
                  <tr key={q.id} className="quote-row-item">
                    <td className="quote-id-col">{q.id}</td>
                    <td>
                      <div className="company-details">
                        <strong>{q.company || 'Individual'}</strong>
                        <span>{q.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-details">
                        <span>{q.phone}</span>
                        <span>{q.email}</span>
                      </div>
                    </td>
                    <td>
                      {q.items && q.items.length > 0 ? (
                        <div className="requested-summary">
                          <strong>{q.items[0].name}</strong>
                          {q.items.length > 1 && <span> (+{q.items.length - 1} more items)</span>}
                        </div>
                      ) : (
                        <div className="requested-summary">
                          <strong>{q.product}</strong>
                          <span> (Qty: {q.quantity})</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`quote-status-badge ${getStatusClass(q.status)}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="text-right text-muted">₹{q.totalOriginalAmount?.toLocaleString('en-IN') || '-'}</td>
                    <td className="text-right text-orange font-bold">₹{q.totalOfferedAmount?.toLocaleString('en-IN') || '-'}</td>
                    <td>
                      <button className="btn-table-action" onClick={() => handleSelectQuote(q)}>
                        <Eye size={16} /> Review Deal
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REVIEW & NEGOTIATION MODAL PANEL */}
      {selectedQuote && (
        <div className="negotiation-modal-backdrop" onClick={() => setSelectedQuote(null)}>
          <div className="negotiation-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setSelectedQuote(null)}>
              <X size={20} />
            </button>

            <div className="modal-header-row">
              <div>
                <h2>Review B2B RFQ {selectedQuote.id}</h2>
                <span className="customer-meta">Requested by: {selectedQuote.company} ({selectedQuote.name})</span>
              </div>
              <span className={`quote-status-badge ${getStatusClass(selectedQuote.status)}`}>
                {selectedQuote.status}
              </span>
            </div>

            <div className="modal-body-grid">
              {/* Left Column: Negotiation details and item inputs */}
              <div className="modal-left-details">
                <form onSubmit={handleSubmitOffer}>
                  <h3>Itemized Discount Offering</h3>
                  
                  <div className="items-offering-list">
                    {selectedQuote.items && selectedQuote.items.length > 0 ? (
                      selectedQuote.items.map(item => (
                        <div key={item.productId} className="item-offering-row">
                          <img src={resolveImageUrl(item.image)} alt={item.name} className="item-thumbnail" />
                          <div className="item-info">
                            <strong>{item.name}</strong>
                            <span>Qty: {item.quantity} | Original unit price: ₹{item.originalPrice}</span>
                          </div>
                          
                          <div className="offering-prices-inputs">
                            {item.counterPrice > 0 && (
                              <div className="price-tag counter">
                                <span>Cust Counter</span>
                                <strong>₹{item.counterPrice}</strong>
                              </div>
                            )}
                            
                            <div className="offer-input-wrapper">
                              <label>Offer Unit Price</label>
                              <div className="input-box">
                                <span>₹</span>
                                <input 
                                  type="number" 
                                  value={offeredPrices[item.productId] || ''}
                                  onChange={(e) => handlePriceChange(item.productId, e.target.value)}
                                  required
                                  disabled={['Accepted', 'Converted to Order', 'Rejected'].includes(selectedQuote.status)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="fallback-custom-product">
                        <strong>Custom requirements: {selectedQuote.product}</strong>
                        <p>Quantity requested: {selectedQuote.quantity}</p>
                        <p className="requirements-notes">Notes: "{selectedQuote.message}"</p>
                      </div>
                    )}
                  </div>

                  {/* Pricing Comparison Stats */}
                  <div className="stats-offering-summary">
                    <div className="stat-offering-card">
                      <span>Original Total</span>
                      <strong>₹{selectedQuote.totalOriginalAmount?.toLocaleString('en-IN') || '-'}</strong>
                    </div>
                    <div className="stat-offering-card orange">
                      <span>Offered Total</span>
                      <strong>₹{selectedQuote.totalOfferedAmount?.toLocaleString('en-IN') || '-'}</strong>
                    </div>
                    {selectedQuote.totalCounterAmount > 0 && (
                      <div className="stat-offering-card blue">
                        <span>Counter Total</span>
                        <strong>₹{selectedQuote.totalCounterAmount?.toLocaleString('en-IN') || '-'}</strong>
                      </div>
                    )}
                  </div>

                  {/* Send Response Panel */}
                  {!['Accepted', 'Converted to Order', 'Rejected'].includes(selectedQuote.status) && (
                    <div className="response-message-panel">
                      <div className="form-group">
                        <label>Response Note / Message</label>
                        <textarea 
                          rows="3" 
                          placeholder="Provide details about discounts, availability, shipping conditions..."
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                        />
                      </div>
                      
                      <button 
                        type="submit" 
                        className="btn btn-primary submit-offer-btn"
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="animate-spin" size={16} /> : <>Submit Specialized Price Offer <Send size={16} style={{ marginLeft: '6px' }} /></>}
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Right Column: Chat/Negotiation thread */}
              <div className="modal-right-chat">
                <h3>Negotiation Logs</h3>
                
                <div className="modal-chat-thread">
                  {selectedQuote.negotiationHistory && selectedQuote.negotiationHistory.length > 0 ? (
                    selectedQuote.negotiationHistory.map((h, index) => {
                      const isAdmin = h.sender === 'admin';
                      return (
                        <div key={index} className={`chat-bubble-wrapper ${isAdmin ? 'admin-msg' : 'user-msg'}`}>
                          <div className="chat-meta">
                            <strong>{h.senderName}</strong>
                            <span>{new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="chat-bubble">
                            {h.message}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-logs">No messages logged yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteOperationsDashboard;

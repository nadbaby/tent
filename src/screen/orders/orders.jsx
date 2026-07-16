import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../../utils/api';
import { downloadInvoice } from '../../utils/invoiceGenerator';
import { 
  Package, ShoppingBag, Clock, CheckCircle2, Truck, Box, 
  XCircle, MapPin, X, Phone, Mail, CreditCard, 
  ReceiptText, ArrowRight, Search, Filter, 
  Download, LifeBuoy, ChevronRight, Calendar, 
  Hash, ExternalLink, ArrowUpDown
} from 'lucide-react';
import { resolveImageUrl } from '../../components/home/ProductCard';
import './orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, amount-high, amount-low
  const [isHiding, setIsHiding] = useState(null); // orderId being hidden

  const user = JSON.parse(localStorage.getItem('user'));

  // --- Data Fetching ---
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(apiUrl(`/api/orders/${user.email || user.username}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (error) {
        console.error("Fetch Orders Error:", error);
      } finally {
        setTimeout(() => setLoading(false), 800); // Slight delay for premium feel
      }
    };
    fetchOrders();
  }, [user]);

  // --- Logic: Search, Filter, Sort ---
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Search
    if (searchQuery) {
      result = result.filter(o => 
        o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter
    if (statusFilter !== 'All') {
      result = result.filter(o => o.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);
      if (sortBy === 'newest') return dateB - dateA;
      if (sortBy === 'oldest') return dateA - dateB;
      if (sortBy === 'amount-high') return (b.total || 0) - (a.total || 0);
      if (sortBy === 'amount-low') return (a.total || 0) - (b.total || 0);
      return 0;
    });

    return result;
  }, [orders, searchQuery, statusFilter, sortBy]);

  // --- Handlers ---
  const handleDownload = async (order, e) => {
    e?.stopPropagation();
    const paidStatuses = ['paid', 'processing', 'packed', 'dispatched', 'delivered'];
    if (!paidStatuses.includes(order.status?.toLowerCase())) {
      alert("Invoices are only available for paid orders.");
      return;
    }
    setIsDownloading(true);
    try {
      await downloadInvoice(order);
    } catch (err) {
      console.error("Invoice Error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleHideOrder = async (orderId, e) => {
    e?.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this order from your history? This action cannot be undone.")) return;
    
    setIsHiding(orderId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/orders/${orderId}/hide`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setOrders(prev => prev.filter(o => o.orderId !== orderId));
        if (selectedOrder?.orderId === orderId) setSelectedOrder(null);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to remove order. Please try again.");
      }
    } catch (err) {
      console.error("Hide Order Error:", err);
      alert("Connection error. Please check your internet.");
    } finally {
      setIsHiding(null);
    }
  };

  const getStatusInfo = (status) => {
    const s = status?.toLowerCase();
    if (s === 'processing') return { color: 'processing', icon: <Clock size={16} />, progress: 25 };
    if (s === 'packed') return { color: 'processing', icon: <Box size={16} />, progress: 50 };
    if (s === 'dispatched' || s === 'shipped') return { color: 'shipped', icon: <Truck size={16} />, progress: 75 };
    if (s === 'delivered') return { color: 'delivered', icon: <CheckCircle2 size={16} />, progress: 100 };
    if (s === 'cancelled') return { color: 'cancelled', icon: <XCircle size={16} />, progress: 0 };
    return { color: 'processing', icon: <Package size={16} />, progress: 10 };
  };

  // --- Render Components ---
  if (!user) {
    return (
      <div className="orders-page-wrapper">
        <div className="orders-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="orders-empty">
            <ShoppingBag size={80} strokeWidth={1} color="#EA580C" />
            <h2>Sign in to view orders</h2>
            <p>You need to be logged in to manage your professional inventory and track shipments.</p>
            <button onClick={() => window.location.href = '/login'} className="btn-premium">Login to Account</button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-wrapper">
      <div className="orders-container">
        {/* Floating Header */}
        <header className="orders-floating-header">
          <div className="header-left">
            <h1>My Orders</h1>
          </div>
          <div className="header-right">
             <div className={`status-pill ${statusFilter.toLowerCase()}`}>
                {statusFilter}
             </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="orders-toolbar">
          <div className="search-wrapper">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Product Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="filter-btn" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select 
            className="filter-btn" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Amount: High to Low</option>
            <option value="amount-low">Amount: Low to High</option>
          </select>
        </div>

        {/* Orders List */}
        <div className="orders-list">
          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="skeleton-card" />)
          ) : filteredOrders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="orders-empty">
              <Package size={80} strokeWidth={1} color="#94a3b8" />
              <h2>No matches found</h2>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
              <button onClick={() => { setSearchQuery(''); setStatusFilter('All'); }} className="btn-secondary">Clear All Filters</button>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredOrders.map((order, idx) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <motion.div 
                    key={order.orderId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="order-glass-card"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="order-card-header">
                      <div className="order-id-group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Hash size={14} color="#EA580C" />
                          <h3>{order.orderId}</h3>
                        </div>
                        <span className="order-date-text">
                          <Calendar size={12} style={{ marginRight: '4px' }} />
                          {new Date(order.createdAt || order.date).toLocaleDateString(undefined, { 
                            month: 'short', day: 'numeric', year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className={`status-tag ${statusInfo.color}`}>
                        {statusInfo.icon}
                        <span style={{ marginLeft: '6px' }}>{order.status}</span>
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="order-timeline">
                      <div className="timeline-line"></div>
                      <motion.div 
                        className="timeline-progress" 
                        initial={{ width: 0 }}
                        animate={{ width: `${statusInfo.progress}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                      />
                      
                      {['Processing', 'Packed', 'Shipped', 'Delivered'].map((step, i) => {
                        const stepLower = step.toLowerCase();
                        const currentLower = order.status.toLowerCase();
                        const isCompleted = statusInfo.progress > (i * 25);
                        const isActive = (i === 0 && currentLower === 'processing') ||
                                         (i === 1 && currentLower === 'packed') ||
                                         (i === 2 && (currentLower === 'dispatched' || currentLower === 'shipped')) ||
                                         (i === 3 && currentLower === 'delivered');

                        return (
                          <div key={step} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                            <div className="step-dot">
                              {isCompleted ? <CheckCircle2 size={16} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />}
                            </div>
                            <span className="step-label">{step}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Item Preview */}
                    <div className="order-items-preview">
                      {order.items.slice(0, 4).map((item, i) => (
                        <div key={i} className="item-thumbnail">
                          <img src={resolveImageUrl(item.image)} alt={item.name} />
                          {item.quantity > 1 && <div className="item-qty-badge">{item.quantity}</div>}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="item-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#86868b' }}>+{order.items.length - 4}</span>
                        </div>
                      )}
                    </div>

                    <div className="order-card-footer">
                      <div className="order-total-group">
                        <span className="total-label">ORDER TOTAL</span>
                        <span className="total-amount">₹{order.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="card-actions">
                         <button 
                          className="btn-secondary" 
                          onClick={(e) => handleHideOrder(order.orderId, e)}
                          title="Remove from history"
                          disabled={isHiding === order.orderId}
                        >
                          <X size={18} />
                        </button>
                        <button 
                          className="btn-secondary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/support/create?orderId=${order.orderId}`;
                          }}
                          title="Raise Support Ticket"
                        >
                          <LifeBuoy size={18} />
                        </button>
                        <button 
                          className="btn-secondary" 
                          onClick={(e) => handleDownload(order, e)}
                          disabled={isDownloading}
                        >
                          <Download size={18} />
                        </button>
                        <button className="btn-premium">
                          Track Details <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* --- Detail Side Panel (Glassmorphism Modal) --- */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="detail-panel-backdrop" 
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="detail-panel"
            >
              <button className="close-panel" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>

              <div style={{ marginBottom: '40px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#EA580C', letterSpacing: '0.1em' }}>ORDER DETAILS</span>
                <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '8px 0', letterSpacing: '-0.02em' }}>#{selectedOrder.orderId}</h2>
                <div style={{ display: 'flex', gap: '16px', color: '#86868b', fontSize: '0.9rem' }}>
                  <span>Placed on {new Date(selectedOrder.createdAt || selectedOrder.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Quick Status Banner */}
              <div className={`status-banner ${getStatusInfo(selectedOrder.status).color}`} style={{ borderRadius: '20px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '12px', color: '#1d1d1f' }}>
                    {getStatusInfo(selectedOrder.status).icon}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Order is {selectedOrder.status}</h4>
                    <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.85rem' }}>We'll notify you of any updates to your shipment.</p>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShoppingBag size={20} /> Items Summary
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: '#f5f5f7', borderRadius: '16px' }}>
                      <img src={resolveImageUrl(item.image)} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <h5 style={{ margin: 0, fontSize: '0.95rem' }}>{item.name}</h5>
                        {item.size && (
                          <p style={{ margin: '2px 0 0', color: '#ea580c', fontSize: '0.8rem', fontWeight: '600' }}>
                            Size: {item.size}
                          </p>
                        )}
                        <p style={{ margin: '4px 0 0', color: '#86868b', fontSize: '0.85rem' }}>{item.quantity} units</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ fontWeight: '700' }}>₹{item.totalPrice?.toLocaleString('en-IN')}</div>
                        <button 
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#f47b20', 
                            fontSize: '0.8rem', 
                            fontWeight: '600', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            transition: 'background 0.2s'
                          }}
                          onClick={() => {
                            window.location.href = `/support/create?orderId=${selectedOrder.orderId}&productSku=${item.sku || item.name}`;
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#ffe5d4'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <LifeBuoy size={12} /> Raise Ticket
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '40px' }}>
                <div className="info-card" style={{ background: '#f5f5f7', border: 'none' }}>
                  <h5 style={{ margin: '0 0 12px', color: '#86868b', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Shipping To</h5>
                  {selectedOrder.shippingAddress ? (
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                      <strong>{selectedOrder.shippingAddress.fullName}</strong>
                      <p style={{ margin: '4px 0' }}>{selectedOrder.shippingAddress.street}</p>
                      <p style={{ margin: 0 }}>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}</p>
                    </div>
                  ) : <p>Address not available.</p>}
                </div>

                <div className="info-card" style={{ background: '#f5f5f7', border: 'none' }}>
                  <h5 style={{ margin: '0 0 12px', color: '#86868b', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Payment</h5>
                  <div style={{ fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: '700' }}>
                      <CreditCard size={14} /> Verified Paid
                    </div>
                    <p style={{ margin: '8px 0 0', fontStyle: 'italic', color: '#86868b' }}>Razorpay Secure Transaction</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '40px', display: 'flex', gap: '16px', paddingBottom: '20px' }}>
                <button 
                  className="btn-premium" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleDownload(selectedOrder)}
                  disabled={isDownloading}
                >
                  <Download size={18} /> {isDownloading ? 'Generating...' : 'Download Invoice'}
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleHideOrder(selectedOrder.orderId)}
                  disabled={isHiding === selectedOrder.orderId}
                >
                  <XCircle size={18} /> Hide Order
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => window.location.href = `/support/create?orderId=${selectedOrder.orderId}`}
                >
                  <LifeBuoy size={18} /> Support Ticket
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;

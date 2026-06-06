import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/api';
import { Search, Edit2, Save, X, CreditCard, Users, Shield, Package, RefreshCw, Filter, Download, Calendar, MapPin, Eye, FileText, ChevronRight, AlertCircle, Clock, Truck, CheckCircle, Info, SortAsc, SortDesc } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Skeleton, SkeletonTable, SkeletonStatsGrid } from '../../components/common/Skeleton/Skeleton';
import { useToast } from '../../context/ToastContext';
import './todays-orders.css';

const TodaysOrdersDashboard = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting states
  const [sortBy, setSortBy] = useState('time'); // 'time', 'total', 'status'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  const [editingOrderId, setEditingOrderId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('overview');
  const [newTrackingId, setNewTrackingId] = useState('');
  const [newTrackingLink, setNewTrackingLink] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl('/api/admin/orders'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter ONLY today's orders
        const today = new Date().toDateString();
        const todaysOrders = data.filter(o => new Date(o.createdAt || o.date || 0).toDateString() === today);
        setOrders(todaysOrders);
      } else {
        setError("Failed to fetch orders. Check your permissions.");
      }
    } catch (err) {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId) => {
    try {
      const response = await fetch(apiUrl(`/api/admin/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          trackingId: newTrackingId,
          trackingLink: newTrackingLink
        })
      });

      if (response.ok) {
        setEditingOrderId(null);
        fetchOrders();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      alert("Error connecting to server");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      (o.orderId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.shippingAddress?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.shippingAddress?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.shippingAddress?.phone || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.shippingAddress?.gstNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Apply sorting
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'time') {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      comparison = timeA - timeB;
    } else if (sortBy === 'total') {
      comparison = (a.total || 0) - (b.total || 0);
    } else if (sortBy === 'status') {
      comparison = (a.status || '').localeCompare(b.status || '');
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const exportToCSV = () => {
    if (!sortedOrders || sortedOrders.length === 0) {
      showToast("There are no orders to export for today.", "warning");
      return;
    }
    showToast("Exporting today's orders...", "success");
    
    const headers = ["Order ID", "Time", "Customer", "Email", "Phone", "GST", "City", "Total", "Payment Status", "Order Status"];
    
    // Helper to escape quotes in strings and wrap in double quotes
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return '"' + str.replace(/"/g, '""') + '"';
    };

    const rows = sortedOrders.map(o => [
      escapeCsv(o.orderId),
      escapeCsv(formatDate(o.createdAt)),
      escapeCsv(o.shippingAddress?.fullName || 'N/A'),
      escapeCsv(o.shippingAddress?.email || 'N/A'),
      escapeCsv(o.shippingAddress?.phone || 'N/A'),
      escapeCsv(o.shippingAddress?.gstNumber || 'N/A'),
      escapeCsv(o.shippingAddress?.city || 'N/A'),
      escapeCsv(o.total),
      escapeCsv(o.paymentDetails?.status || 'PENDING'),
      escapeCsv(o.status)
    ]);

    let csvContent = headers.map(escapeCsv).join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `todays_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (loading) return (
    <div className="employee-panel-screen">
      <div className="container">
        <header className="panel-header">
          <div className="header-info">
            <h1>Admin Dashboard - Today's Orders</h1>
            <Skeleton type="skeleton-text" style={{ width: '300px' }} />
          </div>
        </header>
        <SkeletonStatsGrid count={4} />
        {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') && (
          <div className="admin-tabs">
            <div className="admin-tab active"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
            <div className="admin-tab"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
            <div className="admin-tab"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
            {user?.role?.toLowerCase() === 'admin' && (
              <div className="admin-tab"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
            )}
          </div>
        )}
        <div className="orders-dashboard-table" style={{ border: 'none' }}>
          <SkeletonTable rows={10} columns={6} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="employee-panel-screen">
      <div className="container">
        <header className="panel-header">
          <div className="header-info">
            <h1>Admin Dashboard - Today's Orders</h1>
            <p>Managing today's operations for <span>Fine Bearing & Oil Seal Store</span></p>
          </div>
          <div className="user-welcome">
            Welcome, <strong>{user?.name}</strong>
          </div>
        </header>

        {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') && (
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
              <Package size={18} />
              <span>B2B RFQs</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Customer Discounts</span>
            </NavLink>
            {user?.role?.toLowerCase() === 'admin' && (
              <NavLink to="/admin/employees" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                <Shield size={18} />
                <span>Team Management</span>
              </NavLink>
            )}
          </div>
        )}

        <div className="dashboard-stats-grid">
          <div className="stat-pill stat-pill-today">
            <span className="label">Today's Orders</span>
            <span className="value">{orders.length}</span>
          </div>
          <div className="stat-pill success">
            <span className="label">Paid Today</span>
            <span className="value">{orders.filter(o => o.paymentDetails?.status === 'SUCCESS').length}</span>
          </div>
          <div className="stat-pill warning">
            <span className="label">Pending Today</span>
            <span className="value">{orders.filter(o => o.status === 'PENDING').length}</span>
          </div>
          <div className="stat-pill danger">
            <span className="label">Failed Today</span>
            <span className="value">{orders.filter(o => o.paymentDetails?.status === 'FAILED').length}</span>
          </div>
        </div>

        <div className="dashboard-controls-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="controls-top">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by ID, Email, Phone, or GST..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="action-buttons">
              <div className="sort-controls-premium">
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Sort By:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select-premium"
                >
                  <option value="time">Time</option>
                  <option value="total">Order Total</option>
                  <option value="status">Status</option>
                </select>
                <button 
                  onClick={toggleSortOrder} 
                  className="btn-icon" 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: '#3b82f6', transition: 'transform 0.2s' }}
                  title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                >
                  {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                </button>
              </div>

              <button className="btn-export-premium" onClick={exportToCSV} title="Export CSV (Sorted)">
                <Download size={18} /> Export List
              </button>
              <button className="btn-icon refresh" onClick={fetchOrders} title="Refresh Data">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        <div className="orders-dashboard-table">
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Order Info</th>
                  <th>Customer Details</th>
                  <th>Financials</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Operations</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.length > 0 ? (
                  sortedOrders.map(order => (
                    <tr key={order.orderId} className={order.paymentDetails?.status === 'FAILED' ? 'row-danger' : ''}>
                      <td>
                        <div className="order-ref">
                          <span className="id">#{order.orderId}</span>
                          <span className="date"><Clock size={12} /> {formatDate(order.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="customer-blob">
                          <span className="name">{order.shippingAddress?.fullName || 'Guest'}</span>
                          <span className="sub">{order.shippingAddress?.email}</span>
                          {order.shippingAddress?.gstNumber && <span className="gst-tag">GST: {order.shippingAddress.gstNumber}</span>}
                          <span className="loc"><MapPin size={12} /> {order.shippingAddress?.city}, {order.shippingAddress?.state}</span>
                        </div>
                      </td>
                      <td>
                        <div className="financial-blob">
                          <span className="total">₹{order.total?.toFixed(2)}</span>
                          <span className="sub">{order.items?.length || 0} items</span>
                          {order.discountAmount > 0 && <span className="discount">-₹{order.discountAmount.toFixed(2)}</span>}
                        </div>
                      </td>
                      <td>
                        <div className={`payment-status ${order.paymentDetails?.status?.toLowerCase() || 'pending'}`}>
                          <span className="dot"></span>
                          <span className="label">{order.paymentDetails?.status || 'PENDING'}</span>
                          {order.paymentDetails?.transactionId && <span className="txid">{order.paymentDetails.transactionId}</span>}
                        </div>
                      </td>
                      <td>
                        {editingOrderId === order.orderId ? (
                          <div className="inline-edit">
                            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                              <option value="PENDING">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Packed">Packed</option>
                              <option value="Dispatched">Dispatched</option>
                              <option value="In Transit">In Transit</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <div className="edit-actions">
                              <button onClick={() => handleUpdateStatus(order.orderId)}><Save size={14} /></button>
                              <button onClick={() => setEditingOrderId(null)}><X size={14} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className={`order-status-badge ${order.status.toLowerCase().replace(' ', '-')}`}>
                            {order.status}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="action-row">
                          <button className="btn-action view" onClick={() => { setSelectedOrder(order); setActiveModalTab('overview'); }} title="View Full Details">
                            <Eye size={16} />
                          </button>
                          <button className="btn-action edit" onClick={() => { setEditingOrderId(order.orderId); setNewStatus(order.status); }} title="Quick Status Edit">
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-state-cell" style={{ borderBottom: 'none' }}>
                      <div className="empty-state-premium animate-in">
                        <div className="empty-icon-wrapper">
                          <Package size={40} />
                        </div>
                        <h3>No orders today</h3>
                        <p>Looks like things are quiet. Orders placed today will automatically appear here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Staff Order Detail Modal --- */}
      {selectedOrder && (
        <div className="ops-drawer-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="ops-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="order-title">
                <h2>Order Details</h2>
                <span className="badge">#{selectedOrder.orderId}</span>
              </div>
              <div className="header-actions">
                <button className="btn-print" onClick={() => window.print()}><FileText size={18} /> Invoice</button>
                <button className="btn-close" onClick={() => setSelectedOrder(null)}><X size={24} /></button>
              </div>
            </div>

            <div className="drawer-tabs">
              <button className={activeModalTab === 'overview' ? 'active' : ''} onClick={() => setActiveModalTab('overview')}>Overview</button>
              <button className={activeModalTab === 'customer' ? 'active' : ''} onClick={() => setActiveModalTab('customer')}>Customer & Address</button>
              <button className={activeModalTab === 'items' ? 'active' : ''} onClick={() => setActiveModalTab('items')}>Products</button>
              <button className={activeModalTab === 'payment' ? 'active' : ''} onClick={() => setActiveModalTab('payment')}>Payment Details</button>
            </div>

            <div className="drawer-content">
              {activeModalTab === 'overview' && (
                <div className="tab-pane animate-in">
                  <div className="info-grid">
                    <div className="info-card">
                      <label><Clock size={14} /> Order Timeline</label>
                      <div className="timeline">
                        <div className="timeline-item active"><span className="dot"></span> <div><strong>Order Placed</strong><p>{formatDate(selectedOrder.createdAt)}</p></div></div>
                        <div className={`timeline-item ${selectedOrder.status !== 'PENDING' ? 'active' : ''}`}><span className="dot"></span> <div><strong>Status: {selectedOrder.status}</strong><p>Current operation phase</p></div></div>
                        {selectedOrder.paidAt && <div className="timeline-item active"><span className="dot success"></span> <div><strong>Payment Received</strong><p>{formatDate(selectedOrder.paidAt)}</p></div></div>}
                      </div>
                    </div>
                    <div className="info-card">
                      <label><Truck size={14} /> Delivery Info</label>
                      <div className="delivery-summary">
                        <p><strong>Status:</strong> {selectedOrder.status}</p>
                        {selectedOrder.trackingId && <p><strong>Tracking ID:</strong> {selectedOrder.trackingId}</p>}
                        {selectedOrder.trackingLink && <a href={selectedOrder.trackingLink} target="_blank" rel="noreferrer" className="track-link">Track Shipment <ChevronRight size={14} /></a>}
                        {!selectedOrder.trackingId && <p className="hint">No tracking assigned yet.</p>}
                      </div>
                    </div>
                  </div>
                  <div className="admin-notes-section">
                    <label><Info size={14} /> Internal Notes</label>
                    <div className="notes-box">
                      <p>{selectedOrder.shippingAddress?.deliveryInstructions || "No delivery instructions provided by customer."}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'customer' && (
                <div className="tab-pane animate-in">
                  <div className="customer-detail-grid">
                    <div className="detail-box">
                      <h4>Contact Information</h4>
                      <p><strong>Name:</strong> {selectedOrder.shippingAddress?.fullName}</p>
                      <p><strong>Email:</strong> {selectedOrder.shippingAddress?.email}</p>
                      <p><strong>Phone:</strong> {selectedOrder.shippingAddress?.phone}</p>
                      {selectedOrder.shippingAddress?.gstNumber && <p className="gst-highlight"><strong>GSTIN:</strong> {selectedOrder.shippingAddress.gstNumber}</p>}
                    </div>
                    <div className="detail-box">
                      <h4>Shipping Address</h4>
                      <p>{selectedOrder.shippingAddress?.street}</p>
                      <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                      <p>{selectedOrder.shippingAddress?.zip} | {selectedOrder.shippingAddress?.country}</p>
                      {selectedOrder.shippingAddress?.landmark && <p className="landmark">📍 Landmark: {selectedOrder.shippingAddress.landmark}</p>}
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'items' && (
                <div className="tab-pane animate-in">
                  <div className="order-items-table">
                    <table>
                      <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                      <tbody>
                        {selectedOrder.items?.map((item, i) => (
                          <tr key={i}>
                            <td>
                              <div className="item-cell">
                                <strong>{item.name}</strong>
                                <small>SKU: FB-{item.id || 'N/A'}</small>
                              </div>
                            </td>
                            <td>{item.quantity}</td>
                            <td>₹{item.price?.toFixed(2)}</td>
                            <td>₹{item.totalPrice?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr><td colSpan="3">Items Subtotal</td><td>₹{selectedOrder.subtotal?.toFixed(2)}</td></tr>
                        {selectedOrder.discountAmount > 0 && <tr className="discount-row"><td colSpan="3">Discounts (Coupon/Special)</td><td>-₹{selectedOrder.discountAmount.toFixed(2)}</td></tr>}
                        <tr><td colSpan="3">GST / Tax (18%)</td><td>₹{selectedOrder.gstAmount?.toFixed(2)}</td></tr>
                        <tr><td colSpan="3">Shipping & Handling</td><td>₹{selectedOrder.shippingCharge?.toFixed(2)}</td></tr>
                        <tr className="grand-total"><td colSpan="3">Final Payable</td><td>₹{selectedOrder.total?.toFixed(2)}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {activeModalTab === 'payment' && (
                <div className="tab-pane animate-in">
                  <div className={`payment-summary-card ${selectedOrder.paymentDetails?.status?.toLowerCase() || 'pending'}`}>
                    <div className="pay-header">
                      <CreditCard size={24} />
                      <div>
                        <strong>{selectedOrder.paymentDetails?.status || 'PENDING'}</strong>
                        <p>{selectedOrder.paymentDetails?.transactionId || 'No Transaction ID'}</p>
                      </div>
                    </div>
                    <div className="pay-details">
                      <div className="pay-row"><span>Method</span><span>Razorpay / UPI / Card</span></div>
                      <div className="pay-row"><span>Gateway Order ID</span><code>{selectedOrder.razorpayOrderId}</code></div>
                      {selectedOrder.paymentDetails?.errorMessage && (
                        <div className="pay-error">
                          <AlertCircle size={14} />
                          <span>Error: {selectedOrder.paymentDetails.errorMessage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedOrder.couponCode && (
                    <div className="coupon-history-card">
                      <h4>Milestone Coupon Used</h4>
                      <p><strong>Code:</strong> {selectedOrder.couponCode}</p>
                      <p><strong>Milestone:</strong> Order #{selectedOrder.purchaseCount || 'N/A'} for this customer/GST</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="drawer-footer">
              <button className="btn-primary" onClick={() => setSelectedOrder(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodaysOrdersDashboard;

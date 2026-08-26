import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/api';
import {
    Search, Download, RefreshCw, X, CreditCard, DollarSign,
    ShoppingCart, AlertCircle, FileText, Calendar, Package, Users, Shield, Megaphone, LifeBuoy
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

import { SkeletonStatsGrid, SkeletonTable, Skeleton } from '../../components/common/Skeleton/Skeleton';
import './payment-dashboard.css';

const PaymentDashboard = () => {
    const [data, setData] = useState({ data: [], summary: {}, trendData: [], pagination: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [selectedTxn, setSelectedTxn] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page, limit, search, status: statusFilter, method: methodFilter, startDate, endDate
            });
            const res = await fetch(apiUrl(`/api/admin/payments?${queryParams}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch payments data');
            const json = await res.json();
            if (json.success) {
                setData(json);
            } else {
                throw new Error(json.message || 'Error loading payments');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [page, limit, search, statusFilter, methodFilter, startDate, endDate]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setPage(1);
            setSearch(searchInput);
        }
    };

    const exportToCSV = () => {
        if (!data.data || data.data.length === 0) {
            alert("No data to export.");
            return;
        }
        const headers = ["Order ID", "Date", "Customer Name", "Email", "Phone", "Amount", "Payment Status", "Order Status", "Payment Method", "Transaction ID"];
        const escapeCsv = (val) => val ? `"${String(val).replace(/"/g, '""')}"` : '""';

        const rows = data.data.map(o => [
            escapeCsv(o.orderId),
            escapeCsv(new Date(o.createdAt).toLocaleString()),
            escapeCsv(o.shippingAddress?.fullName),
            escapeCsv(o.shippingAddress?.email),
            escapeCsv(o.shippingAddress?.phone),
            escapeCsv(o.total),
            escapeCsv(o.paymentDetails?.status),
            escapeCsv(o.status),
            escapeCsv(o.shippingDetails?.method),
            escapeCsv(o.paymentDetails?.transactionId)
        ]);

        let csvContent = headers.map(escapeCsv).join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (val) => val ? `₹${val.toLocaleString('en-IN')}` : '₹0';

    if (error) return <div className="payment-dashboard-screen"><div className="container"><h2>Error: {error}</h2></div></div>;

    return (
        <div className="payment-dashboard-screen">
            <div className="container">

                {/* Header & Tabs */}
                <header className="panel-header">
                    <div className="header-info">
                        <h1>Financial Dashboard</h1>
                        <p>Comprehensive overview of payments & transactions</p>
                    </div>
                    <div className="user-welcome">
                        Welcome, <strong>{user?.name}</strong>
                    </div>
                </header>

                {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') && (
                    <div className="admin-tabs">
                        <NavLink to="/admin/todays-orders" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                            <Calendar size={18} /><span>Today's Orders</span>
                        </NavLink>
                        <NavLink to="/employee-panel" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                            <Package size={18} /><span>Past Orders</span>
                        </NavLink>
                        <NavLink to="/admin/users" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                            <Users size={18} /><span>Customer Discounts</span>
                        </NavLink>
                        {user?.role?.toLowerCase() === 'admin' && (
                            <NavLink to="/admin/employees" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                                <Shield size={18} /><span>Team Management</span>
                            </NavLink>
                        )}
                        <NavLink to="/admin/promotions" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                            <Megaphone size={18} /><span>Promotions</span>
                        </NavLink>
                        <NavLink to="/admin/tickets" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                            <LifeBuoy size={18} /><span>Support Tickets</span>
                        </NavLink>
                        <NavLink to="/admin/payments" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                            <DollarSign size={18} /><span>Payments</span>
                        </NavLink>
                    </div>
                )}

                {/* KPIs */}
                {loading && !data.summary.totalSales ? (
                    <SkeletonStatsGrid count={4} />
                ) : (
                    <div className="payment-kpi-grid">
                        <div className="payment-kpi-card">
                            <div className="payment-kpi-icon primary"><DollarSign size={24} /></div>
                            <div className="payment-kpi-info">
                                <h4>Total Payment Received</h4>
                                <h2>{formatCurrency(data.summary.totalSales)}</h2>
                                <p>{data.summary.totalTransactions} Total Successful Txns</p>
                            </div>
                        </div>

                        <div className="payment-kpi-card">
                            <div className="payment-kpi-icon success"><CreditCard size={24} /></div>
                            <div className="payment-kpi-info">
                                <h4>Today's Payments</h4>
                                <h2>{formatCurrency(data.summary.todaySales)}</h2>
                                <p>Collected Today</p>
                            </div>
                        </div>

                        <div className="payment-kpi-card">
                            <div className="payment-kpi-icon info"><Calendar size={24} /></div>
                            <div className="payment-kpi-info">
                                <h4>This Month's Payments</h4>
                                <h2>{formatCurrency(data.summary.monthSales)}</h2>
                                <p>Total Revenue This Month</p>
                            </div>
                        </div>

                        <div className="payment-kpi-card">
                            <div className="payment-kpi-icon warning"><AlertCircle size={24} /></div>
                            <div className="payment-kpi-info">
                                <h4>Pending Payments</h4>
                                <h2>{formatCurrency(data.summary.pendingAmount)}</h2>
                                <p>{data.summary.pendingCount} Pending Transactions</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Charts */}
                <div className="payment-charts-row">
                    <div className="chart-container" style={{ gridColumn: 'span 2' }}>
                        <h3>Revenue Trend (Successful Payments)</h3>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={data.trendData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="payment-controls-card">
                    <div className="payment-controls-top">
                        <div className="search-bar">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by Order ID, Transaction ID, Name, Email, Phone..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                        <div className="action-buttons" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>From:</span>
                                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} style={{ border: 'none', background: 'transparent', outline: 'none', color: '#475569', fontSize: '0.9rem' }} />
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>To:</span>
                                <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} style={{ border: 'none', background: 'transparent', outline: 'none', color: '#475569', fontSize: '0.9rem' }} />
                            </div>
                            <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                                <option value="">All Statuses</option>
                                <option value="SUCCESS">Success</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                                <option value="REFUNDED">Refunded</option>
                            </select>
                            <select className="filter-select" value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1); }}>
                                <option value="">All Methods</option>
                                <option value="ONLINE">Online Payment</option>
                                <option value="COD">COD</option>
                            </select>
                            <button className="btn-export-premium" onClick={exportToCSV}>
                                <Download size={18} /> Export CSV
                            </button>
                            <button className="btn-refresh" onClick={fetchPayments}>
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="payments-table-container">
                    {loading && data.data.length === 0 ? (
                        <SkeletonTable rows={10} columns={6} />
                    ) : (
                        <>
                            <table className="payments-table">
                                <thead>
                                    <tr>
                                        <th>Order ID / Date</th>
                                        <th>Customer</th>
                                        <th>Amount</th>
                                        <th>Payment Method</th>
                                        <th>Payment Status</th>
                                        <th>Order Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.data.map(txn => (
                                        <tr key={txn._id} onClick={() => setSelectedTxn(txn)}>
                                            <td>
                                                <strong>#{txn.orderId}</strong><br />
                                                <span className="date-cell">{new Date(txn.createdAt).toLocaleString()}</span>
                                            </td>
                                            <td>
                                                <div className="customer-cell">
                                                    <strong>{txn.shippingAddress?.fullName}</strong>
                                                    <span>{txn.shippingAddress?.phone}</span>
                                                </div>
                                            </td>
                                            <td className="amount-cell">{formatCurrency(txn.total)}</td>
                                            <td>{txn.shippingDetails?.method || 'ONLINE'}</td>
                                            <td>
                                                <span className={`table-status ${txn.paymentDetails?.status?.toLowerCase() || 'pending'}`}>
                                                    {txn.paymentDetails?.status || 'PENDING'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`table-status ${txn.status === 'Cancelled' ? 'failed' : 'refunded'}`}>
                                                    {txn.status || 'PENDING'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.data.length === 0 && (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No transactions found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            {data.pagination?.pages > 1 && (
                                <div className="pagination-controls">
                                    <span className="page-info">Showing page {data.pagination.page} of {data.pagination.pages}</span>
                                    <div className="page-buttons">
                                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                                        <button disabled={page === data.pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Transaction Details Modal */}
            {selectedTxn && (
                <div className="payment-modal-overlay" onClick={() => setSelectedTxn(null)}>
                    <div className="payment-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><FileText size={20} /> Transaction Details #{selectedTxn.orderId}</h2>
                            <button className="modal-close" onClick={() => setSelectedTxn(null)}><X size={24} /></button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-section">
                                <div className="detail-group">
                                    <label>Payment Status</label>
                                    <p>
                                        <span className={`table-status ${selectedTxn.paymentDetails?.status?.toLowerCase() || 'pending'}`} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                                            {selectedTxn.paymentDetails?.status || 'PENDING'}
                                        </span>
                                    </p>
                                </div>
                                <div className="detail-group">
                                    <label>Order Status</label>
                                    <p>{selectedTxn.status}</p>
                                </div>
                                <div className="detail-group">
                                    <label>Transaction ID / Gateway ID</label>
                                    <p><code>{selectedTxn.paymentDetails?.transactionId || selectedTxn.razorpayPaymentId || 'N/A'}</code></p>
                                </div>
                                <div className="detail-group">
                                    <label>Payment Gateway</label>
                                    <p>{selectedTxn.paymentDetails?.transactionId ? 'Razorpay' : (selectedTxn.shippingDetails?.method?.includes('COD') ? 'Cash on Delivery' : 'N/A')}</p>
                                </div>
                                <div className="detail-group">
                                    <label>Total Amount Paid</label>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>{formatCurrency(selectedTxn.total)}</p>
                                </div>
                                <div className="detail-group">
                                    <label>Payment Date</label>
                                    <p>{selectedTxn.paidAt ? new Date(selectedTxn.paidAt).toLocaleString() : new Date(selectedTxn.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="detail-section">
                                <div className="detail-group full-width">
                                    <label>Customer Information</label>
                                    <p><strong>Name:</strong> {selectedTxn.shippingAddress?.fullName}</p>
                                    <p><strong>Email:</strong> {selectedTxn.shippingAddress?.email}</p>
                                    <p><strong>Phone:</strong> {selectedTxn.shippingAddress?.phone}</p>
                                    <p><strong>Address:</strong> {selectedTxn.shippingAddress?.street}, {selectedTxn.shippingAddress?.city}, {selectedTxn.shippingAddress?.state}</p>
                                </div>
                            </div>

                            <div className="detail-section" style={{ marginBottom: 0 }}>
                                <div className="detail-group full-width">
                                    <label>Order Breakdown</label>
                                    <div style={{ marginTop: '10px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Item</th>
                                                    <th style={{ textAlign: 'center' }}>Qty</th>
                                                    <th style={{ textAlign: 'right' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedTxn.items?.map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                        <td style={{ padding: '8px 0', fontSize: '0.9rem' }}>{item.name}</td>
                                                        <td style={{ textAlign: 'center', fontSize: '0.9rem' }}>{item.quantity}</td>
                                                        <td style={{ textAlign: 'right', fontSize: '0.9rem' }}>{formatCurrency(item.totalPrice)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan="2" style={{ textAlign: 'right', padding: '8px 0', color: '#64748b' }}>Subtotal:</td>
                                                    <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 'bold' }}>{formatCurrency(selectedTxn.subtotal)}</td>
                                                </tr>
                                                {selectedTxn.discountAmount > 0 && (
                                                    <tr>
                                                        <td colSpan="2" style={{ textAlign: 'right', padding: '4px 0', color: '#64748b' }}>Discount:</td>
                                                        <td style={{ textAlign: 'right', padding: '4px 0', color: '#ea580c' }}>-{formatCurrency(selectedTxn.discountAmount)}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td colSpan="2" style={{ textAlign: 'right', padding: '4px 0', color: '#64748b' }}>Taxes & GST:</td>
                                                    <td style={{ textAlign: 'right', padding: '4px 0' }}>{formatCurrency(selectedTxn.gstAmount)}</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan="2" style={{ textAlign: 'right', padding: '4px 0', color: '#64748b' }}>Shipping:</td>
                                                    <td style={{ textAlign: 'right', padding: '4px 0' }}>{formatCurrency(selectedTxn.shippingCharge)}</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan="2" style={{ textAlign: 'right', padding: '8px 0', fontWeight: 'bold', fontSize: '1.1rem' }}>Grand Total:</td>
                                                    <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 'bold', fontSize: '1.1rem' }}>{formatCurrency(selectedTxn.total)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PaymentDashboard;

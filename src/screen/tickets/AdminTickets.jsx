import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Ticket, Clock, MessageSquare, AlertCircle, CheckCircle2, ChevronRight, LifeBuoy, Users, Shield, Package, RefreshCw, Box, Download, Home, Settings, Truck, ChartBar, FileText, ClipboardList, Calendar, Megaphone } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { apiUrl } from '../../utils/api';
import { Skeleton } from '../../components/common/Skeleton/Skeleton';
import './AdminTickets.css';

const AdminTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('All');

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(apiUrl('/api/admin/tickets'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            } else {
                showToast('Failed to fetch tickets', 'error');
            }
        } catch (err) {
            showToast('An error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Open': return 'badge-open';
            case 'In Progress': return 'badge-progress';
            case 'Waiting for Customer': return 'badge-waiting';
            case 'Resolved': return 'badge-resolved';
            case 'Closed': return 'badge-closed';
            default: return 'badge-default';
        }
    };

    const getPriorityBadgeClass = (priority) => {
        switch (priority) {
            case 'High': return 'priority-high';
            case 'Medium': return 'priority-medium';
            case 'Low': return 'priority-low';
            default: return 'priority-low';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Open': return <AlertCircle size={16} />;
            case 'In Progress': return <Clock size={16} />;
            case 'Waiting for Customer': return <MessageSquare size={16} />;
            case 'Resolved': return <CheckCircle2 size={16} />;
            case 'Closed': return <CheckCircle2 size={16} />;
            default: return <AlertCircle size={16} />;
        }
    };

    const filteredTickets = filter === 'All' ? tickets : tickets.filter(t => t.status === filter);

    return (
        <div className="admin-tickets-container">
            {/* Universal Admin Navigation Tabs */}
            <div className="admin-tabs" style={{ marginBottom: '20px' }}>
                <NavLink to="/admin/todays-orders" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                    <Calendar size={18} />
                    <span>Today's Orders</span>
                </NavLink>
                <NavLink to="/employee-panel" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                    <Package size={18} />
                    <span>Past Orders</span>
                </NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                    <Users size={18} />
                    <span>Customer Discounts</span>
                </NavLink>
                {/* Admin-only Team Mgmt removed for simplification, if we don't have user object here. Wait, we can get user from localStorage. But for now just standard static links or fetch user. */}
                <NavLink to="/admin/employees" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                    <Shield size={18} />
                    <span>Team Management</span>
                </NavLink>
                <NavLink to="/admin/promotions" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                    <Megaphone size={18} />
                    <span>Promotions</span>
                </NavLink>
                <NavLink to="/admin/tickets" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                    <LifeBuoy size={18} />
                    <span>Support Tickets</span>
                </NavLink>
            </div>

            <div className="tickets-header-section">
                <div className="header-text">
                    <h1>Support Tickets Center</h1>
                    <p>Manager Dashboard for handling customer inquiries and complaints.</p>
                </div>

                <div className="header-actions">
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} className="ticket-filter-select">
                        <option value="All">All Tickets</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Waiting for Customer">Waiting for Customer</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>
                    <button onClick={fetchTickets} className="btn-refresh">
                        <RefreshCw size={18} /> Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="ticket-list">
                    {Array(5).fill(0).map((_, i) => (
                        <div className="ticket-card" key={i} style={{ border: 'none', background: '#f8fafc' }}>
                            <Skeleton type="skeleton-rect" style={{ width: '100%', height: '80px', borderRadius: '12px' }} />
                        </div>
                    ))}
                </div>
            ) : filteredTickets.length === 0 ? (
                <div className="no-tickets">
                    <div className="empty-icon-circle">
                        <LifeBuoy size={40} />
                    </div>
                    <h3>No Support Tickets Found</h3>
                    <p>{filter !== 'All' ? `No tickets found matching "${filter}" status.` : "The ticket queue is currently empty."}</p>
                </div>
            ) : (
                <div className="ticket-list">
                    {filteredTickets.map(ticket => (
                        <NavLink to={`/ticket/${ticket.ticketId}`} className="ticket-card admin-ticket-card" key={ticket.id}>
                            <div className="ticket-card-left">
                                <div className="ticket-icon-wrapper" style={{ background: ticket.assignedTo ? '#eff6ff' : '#fff7ed', color: ticket.assignedTo ? '#3b82f6' : '#ea580c' }}>
                                    <Ticket size={24} />
                                </div>
                                <div className="ticket-main-info">
                                    <h3>{ticket.subject}</h3>
                                    <p>
                                        <span className="ticket-id-tag">{ticket.ticketId}</span>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{ticket.fullName}</span>
                                        <span>•</span>
                                        <span>{ticket.category}</span>
                                        <span>•</span>
                                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="ticket-card-right">
                                <div className="admin-assigned-badge">
                                    {ticket.assignedTo ? (
                                        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{ticket.assignedTo}</span>
                                    ) : (
                                        <span style={{ color: '#ea580c', fontWeight: 'bold' }}>Unassigned</span>
                                    )}
                                </div>
                                <div className="ticket-priority">
                                    <span className={`priority-dot ${getPriorityBadgeClass(ticket.priority)}`}></span>
                                    {ticket.priority}
                                </div>
                                <div className={`status-badge ${getStatusBadgeClass(ticket.status)}`}>
                                    {getStatusIcon(ticket.status)}
                                    <span>{ticket.status}</span>
                                </div>
                                <ChevronRight className="chevron-icon" size={20} />
                            </div>
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminTickets;

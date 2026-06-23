import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Plus, Clock, MessageSquare, AlertCircle, CheckCircle2, ChevronRight, LifeBuoy } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { apiUrl } from '../../utils/api';
import { Skeleton } from '../../components/common/Skeleton/Skeleton';
import './UserTickets.css';

const UserTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchTickets = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    const identifier = user.email || user.username || user.phone;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/tickets/my-tickets/${encodeURIComponent(identifier)}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Sort descending by date
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    Promise.resolve().then(() => {
      fetchTickets();
    });
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
    switch(status) {
      case 'Open': return <AlertCircle size={16} />;
      case 'In Progress': return <Clock size={16} />;
      case 'Waiting for Customer': return <MessageSquare size={16} />;
      case 'Resolved': return <CheckCircle2 size={16} />;
      case 'Closed': return <CheckCircle2 size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="user-tickets-container">
      <div className="tickets-header-section">
        <div className="header-text">
          <h1>Support Center</h1>
          <p>Track and manage your complaints and inquiries.</p>
        </div>
        <Link to="/support/create" className="btn-raise-ticket">
          <Plus size={18} /> Raise New Ticket
        </Link>
      </div>

      {loading ? (
        <div className="ticket-list">
          {Array(4).fill(0).map((_, i) => (
            <div className="ticket-card skeleton-card-override" key={i} style={{ border: 'none', background: '#f8fafc' }}>
              <div className="ticket-card-left" style={{ flex: 1 }}>
                <Skeleton type="skeleton-avatar" style={{ width: '40px', height: '40px' }} />
                <div className="ticket-main-info" style={{ flex: 1 }}>
                  <Skeleton type="skeleton-title" style={{ width: '60%', marginBottom: '8px' }} />
                  <Skeleton type="skeleton-text" style={{ width: '40%' }} />
                </div>
              </div>
              <div className="ticket-card-right">
                <Skeleton type="skeleton-btn" style={{ width: '100px', height: '30px', borderRadius: '20px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="no-tickets">
          <div className="empty-icon-circle">
            <LifeBuoy size={40} />
          </div>
          <h3>No Support Tickets</h3>
          <p>You haven't raised any support tickets yet. We are here to help!</p>
          <Link to="/support/create" className="btn-raise-ticket mt-3" style={{display: 'inline-flex', margin: '0 auto'}}>
            <Plus size={18} /> Raise Ticket
          </Link>
        </div>
      ) : (
        <div className="ticket-list">
          {tickets.map(ticket => (
            <Link to={`/ticket/${ticket.ticketId}`} className="ticket-card" key={ticket.id}>
              <div className="ticket-card-left">
                <div className="ticket-icon-wrapper">
                  <Ticket size={24} />
                </div>
                <div className="ticket-main-info">
                  <h3>{ticket.subject}</h3>
                  <p>
                    <span className="ticket-id-tag">{ticket.ticketId}</span>
                    <span>{ticket.category}</span>
                    <span>•</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </p>
                </div>
              </div>
              
              <div className="ticket-card-right">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserTickets;

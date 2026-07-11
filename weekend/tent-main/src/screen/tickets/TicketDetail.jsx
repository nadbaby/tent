import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { apiUrl } from '../../utils/api';
import { Skeleton } from '../../components/common/Skeleton/Skeleton';
import './TicketDetail.css';

const TicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const { showToast } = useToast();
  const [file, setFile] = useState(null);

  const [adminStatus, setAdminStatus] = useState('');
  const [adminPriority, setAdminPriority] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const userRole = localStorage.getItem('role') || 'user';
  const isAdminOrEmployee = ['admin', 'employee', 'staff', 'manager', 'support staff'].includes(userRole.toLowerCase());

  useEffect(() => {
    fetchTicketDetail();
  }, [id]);

  const fetchTicketDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/tickets/${id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
        setAdminStatus(data.status);
        setAdminPriority(data.priority);
        setInternalNotes(data.internalNotes || '');
      } else {
        showToast('Failed to fetch ticket details', 'error');
      }
    } catch (err) {
      showToast('An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setReplyLoading(true);
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const senderRole = user.role || localStorage.getItem('role') || 'user';
    const senderName = user.displayName || user.name || user.email || user.username || user.phone || 'Customer';

    try {
      let fileUrl = '';
      if (file) {
        const uploadData = new FormData();
        uploadData.append('image', file);
        const uploadRes = await fetch(apiUrl('/api/upload'), {
          method: 'POST',
          body: uploadData
        });
        const uploadJson = await uploadRes.json();
        if (uploadRes.ok) {
          fileUrl = uploadJson.filePath;
        }
      }

      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/tickets/${id}/reply`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: replyMessage, fileUrl, senderRole, senderName })
      });

      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
        setReplyMessage('');
        setFile(null);
        showToast('Reply sent', 'success');
      } else {
        showToast('Failed to send reply', 'error');
      }
    } catch (err) {
      showToast('An error occurred', 'error');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleClaimTicket = async () => {
    setUpdateLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(apiUrl(`/api/admin/tickets/${id}/assign`), {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
        showToast('Ticket claimed successfully', 'success');
      } else {
        showToast('Failed to claim ticket', 'error');
      }
    } catch(err) {
      showToast('An error occurred', 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    setUpdateLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(apiUrl(`/api/tickets/${id}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: adminStatus, priority: adminPriority, internalNotes })
      });
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
        showToast('Ticket updated successfully', 'success');
      } else {
        showToast('Failed to update ticket', 'error');
      }
    } catch (err) {
      showToast('An error occurred', 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) return (
    <div className="ticket-detail-container">
      <div className="ticket-detail-header">
        <Skeleton type="skeleton-text" style={{ width: '150px' }} />
        <div className="title-row">
          <Skeleton type="skeleton-title" style={{ width: '60%', height: '2.5rem' }} />
          <Skeleton type="skeleton-btn" style={{ width: '100px', height: '30px', borderRadius: '20px' }} />
        </div>
        <Skeleton type="skeleton-text" style={{ width: '300px' }} />
      </div>
      <div className="ticket-content-layout">
        <div className="ticket-main">
          <Skeleton type="skeleton-rect" style={{ height: '150px', borderRadius: '12px', marginBottom: '20px' }} />
          <Skeleton type="skeleton-rect" style={{ height: '100px', borderRadius: '12px', marginBottom: '20px' }} />
          <Skeleton type="skeleton-rect" style={{ height: '100px', borderRadius: '12px', marginBottom: '20px' }} />
        </div>
        <div className="ticket-sidebar">
          <Skeleton type="skeleton-title" style={{ width: '100px' }} />
          {Array(6).fill(0).map((_, i) => (
            <div key={i} style={{ marginBottom: '15px' }}>
              <Skeleton type="skeleton-text" style={{ width: '40%' }} />
              <Skeleton type="skeleton-text" style={{ width: '80%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (!ticket) return <div className="ticket-not-found">Ticket not found</div>;

  return (
    <div className="ticket-detail-container">
      <div className="ticket-detail-header">
        <Link to="/my-tickets" className="back-link">← Back to Tickets</Link>
        <div className="title-row">
          <h1>{ticket.subject}</h1>
          <span className={`status-badge badge-${ticket.status.replace(/ /g, '-').toLowerCase()}`}>
            {ticket.status}
          </span>
        </div>
        <p className="ticket-meta">
          Ticket ID: <strong>{ticket.ticketId}</strong> | Created: {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="ticket-content-layout">
        <div className="ticket-main">
          <div className="ticket-original-message box-shadow">
            <div className="message-header">
              <div className="sender-avatar">{ticket.fullName.charAt(0).toUpperCase()}</div>
              <div>
                <strong>{ticket.fullName}</strong> (You)
                <div className="message-time">{new Date(ticket.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="message-body">
              {ticket.message}
            </div>
            {ticket.fileUrl && (
              <div className="attachment">
                <a href={apiUrl(ticket.fileUrl)} target="_blank" rel="noreferrer">
                  📎 View Attachment
                </a>
              </div>
            )}
          </div>

          <div className="replies-section">
            {ticket.replies.map((reply) => (
              <div key={reply.id} className={`reply-card box-shadow ${reply.sender === 'Customer' ? 'reply-customer' : 'reply-admin'}`}>
                <div className="message-header">
                  <div className={`sender-avatar ${reply.sender === 'Admin' ? 'avatar-admin' : ''}`}>
                    {reply.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>{reply.senderName}</strong> {reply.sender === 'Admin' ? '(Support)' : '(You)'}
                    <div className="message-time">{new Date(reply.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="message-body">
                  {reply.message}
                </div>
                {reply.fileUrl && (
                  <div className="attachment">
                    <a href={apiUrl(reply.fileUrl)} target="_blank" rel="noreferrer">
                      📎 View Attachment
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          {ticket.status !== 'Closed' && ticket.status !== 'Resolved' && (
            <div className="reply-form-container box-shadow">
              <h3>Send a Reply</h3>
              <form onSubmit={handleReplySubmit}>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows="4"
                  placeholder="Type your message here..."
                  required
                ></textarea>
                <div className="reply-actions">
                  <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*,.pdf" className="file-input" />
                  <button type="submit" className="btn-primary" disabled={replyLoading}>
                    {replyLoading ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="ticket-sidebar box-shadow">
          {isAdminOrEmployee && (
            <div className="admin-controls mb-4">
              <h3 className="admin-title" style={{ color: '#f47b20', borderBottom: '1px solid #f47b20', paddingBottom: '10px' }}>Admin Controls</h3>
              
              {!ticket.assignedTo ? (
                <button 
                  onClick={handleClaimTicket}
                  disabled={updateLoading}
                  style={{width:'100%', padding:'10px', background:'#f47b20', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'600', marginBottom:'15px'}}
                >
                  {updateLoading ? 'Claiming...' : 'Claim Ticket'}
                </button>
              ) : (
                <div style={{marginBottom:'15px', padding:'10px', background:'#f9f9f9', borderRadius:'4px', border:'1px solid #ddd'}}>
                  <strong style={{fontSize:'12px', color:'#666', display:'block'}}>Assigned To</strong>
                  <span>{ticket.assignedTo}</span>
                </div>
              )}

              <div className="admin-form-group">
                <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'600'}}>Update Status</label>
                <select value={adminStatus} onChange={(e) => setAdminStatus(e.target.value)} style={{width:'100%', padding:'8px', marginBottom:'15px', borderRadius:'4px', border:'1px solid #ddd'}}>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting for Customer">Waiting for Customer</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'600'}}>Update Priority</label>
                <select value={adminPriority} onChange={(e) => setAdminPriority(e.target.value)} style={{width:'100%', padding:'8px', marginBottom:'15px', borderRadius:'4px', border:'1px solid #ddd'}}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'600'}}>Internal Notes</label>
                <textarea 
                  value={internalNotes} 
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows="3"
                  placeholder="Notes only visible to admins..."
                  style={{width:'100%', padding:'8px', marginBottom:'15px', borderRadius:'4px', border:'1px solid #ddd'}}
                ></textarea>
              </div>
              <button 
                onClick={handleUpdateTicket} 
                disabled={updateLoading}
                style={{width:'100%', padding:'10px', background:'#222', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'600'}}
              >
                {updateLoading ? 'Updating...' : 'Update Ticket'}
              </button>
            </div>
          )}

          <h3 style={{ marginTop: isAdminOrEmployee ? '30px' : '0' }}>Ticket Information</h3>
          <ul className="info-list">
            <li>
              <span>Assigned To</span>
              <strong>{ticket.assignedTo ? ticket.assignedTo : <span style={{color:'#f47b20'}}>Unassigned</span>}</strong>
            </li>
            <li>
              <span>Category</span>
              <strong>{ticket.category}</strong>
            </li>
            <li>
              <span>Priority</span>
              <strong>{ticket.priority}</strong>
            </li>
            <li>
              <span>Order ID</span>
              <strong>{ticket.orderId || 'N/A'}</strong>
            </li>
            <li>
              <span>Product SKU</span>
              <strong>{ticket.productSku || 'N/A'}</strong>
            </li>
            <li>
              <span>Email</span>
              <strong>{ticket.email}</strong>
            </li>
            <li>
              <span>Mobile</span>
              <strong>{ticket.mobile}</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;

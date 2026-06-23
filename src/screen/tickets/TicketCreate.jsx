import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { apiUrl } from '../../utils/api';
import './TicketCreate.css';

const TicketCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    orderId: '',
    productSku: '',
    category: 'Product Defect',
    priority: 'Low',
    subject: '',
    message: ''
  });
  const [file, setFile] = useState(null);

  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    let user = {};
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        console.error("Failed to parse user storage:", e);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const urlOrderId = params.get('orderId') || '';
    const urlProductSku = params.get('productSku') || '';

    setFormData(prev => ({
      ...prev,
      fullName: user.name || user.displayName || user.username || '',
      email: user.email || '',
      mobile: user.phone || '',
      orderId: urlOrderId,
      productSku: urlProductSku
    }));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      showToast('Please login to raise a ticket', 'error');
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    const userIdentifier = user.email || user.username || user.phone;

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
      const res = await fetch(apiUrl('/api/tickets/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, fileUrl, userIdentifier })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Ticket created successfully', 'success');
        navigate('/my-tickets');
      } else {
        showToast(data.message || 'Failed to create ticket', 'error');
      }
    } catch (err) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ticket-create-container">
      <div className="ticket-header">
        <h1>Raise a Support Ticket</h1>
        <p>Our B2B support team is here to help with your orders and products.</p>
      </div>

      <form className="ticket-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label>Mobile Number *</label>
            <input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} placeholder="+91 9876543210" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email Address *</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="john@company.com" />
          </div>
          <div className="form-group">
            <label>Order ID (Optional)</label>
            <input type="text" name="orderId" value={formData.orderId} onChange={handleChange} placeholder="e.g. ORD_123456" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Product Name / SKU (Optional)</label>
            <input type="text" name="productSku" value={formData.productSku} onChange={handleChange} placeholder="e.g. Bearing 6204-ZZ" />
          </div>
          <div className="form-group">
            <label>Complaint Category *</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="Product Defect">Product Defect</option>
              <option value="Wrong Item Received">Wrong Item Received</option>
              <option value="Missing Parts">Missing Parts</option>
              <option value="Delivery Delay">Delivery Delay</option>
              <option value="Payment Issue">Payment Issue</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Priority *</label>
            <select name="priority" value={formData.priority} onChange={handleChange}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Attachment (Image/PDF)</label>
            <input type="file" onChange={handleFileChange} accept="image/*,.pdf" />
          </div>
        </div>

        <div className="form-group full-width">
          <label>Subject *</label>
          <input type="text" name="subject" required value={formData.subject} onChange={handleChange} placeholder="Brief description of the issue" />
        </div>

        <div className="form-group full-width">
          <label>Message *</label>
          <textarea name="message" required value={formData.message} onChange={handleChange} rows="6" placeholder="Please describe your issue in detail..."></textarea>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/my-tickets')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketCreate;

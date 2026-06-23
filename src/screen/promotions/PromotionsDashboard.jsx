import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users, Search, CheckCircle2, Calendar, Send, Megaphone,
  MessageSquare, Phone, AlertCircle, ChevronDown, X, CheckSquare, Square
} from 'lucide-react';
import './PromotionsDashboard.css';

const API_BASE = 'http://localhost:5000';

const getToken = () => {
  try {
    const admin = JSON.parse(localStorage.getItem('adminAuth') || '{}');
    if (admin?.token) return admin.token;
    const emp = JSON.parse(localStorage.getItem('employeeAuth') || '{}');
    if (emp?.token) return emp.token;
  } catch { }
  return localStorage.getItem('token') || '';
};

export default function PromotionsDashboard() {
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [message, setMessage] = useState('Hello {{name}}! Check out our latest products at Fine Bearing & Oil Seal Store.');
  const [channels, setChannels] = useState({ sms: true, whatsapp: false });
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [previewTab, setPreviewTab] = useState('sms');

  const token = getToken();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchCustomers();
    fetchCampaigns();
  }, []);

  const fetchCustomers = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/users`, { headers });
      const data = await r.json();
      const withPhone = (Array.isArray(data) ? data : []).filter(u => u.phone);
      setCustomers(withPhone);
    } catch { }
  };

  const fetchCampaigns = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/promotions`, { headers });
      const data = await r.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch { }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleChannel = (ch) => setChannels(prev => ({ ...prev, [ch]: !prev[ch] }));

  const filteredCustomers = customers.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const toggleSelect = (id) => setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const selectAll = () => setSelectedIds(
    selectedIds.length === filteredCustomers.length ? [] : filteredCustomers.map(c => c.id)
  );

  const previewText = (name = '{{name}}', company = '{{company}}') =>
    message.replace(/{{name}}/gi, name).replace(/{{company}}/gi, company);

  const samplePreview = previewText('Rahul', 'ABC Corp');

  const handleSend = async () => {
    if (!message.trim()) return showToast('Please write a message.', 'error');
    if (!channels.sms && !channels.whatsapp) return showToast('Select at least one channel.', 'error');
    if (selectedIds.length === 0) return showToast('Select at least one recipient.', 'error');

    setSending(true);
    try {
      const activeChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);
      const r = await fetch(`${API_BASE}/api/admin/promotions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, channels: activeChannels, userIds: selectedIds })
      });
      const data = await r.json();
      if (r.ok) {
        showToast(`Campaign sent to ${selectedIds.length} recipient(s)!`, 'success');
        setSelectedIds([]);
        fetchCampaigns();
      } else {
        showToast(data.message || 'Failed to send campaign.', 'error');
      }
    } catch {
      showToast('Network error. Please retry.', 'error');
    }
    setSending(false);
  };

  return (
    <div className="promo-screen">
      {/* Admin Tabs */}
      <div className="admin-tabs">
        <NavLink to="/admin/todays-orders" className={({ isActive }) => isActive ? 'tab active' : 'tab'}>Today's Orders</NavLink>
        <NavLink to="/employee-panel" className={({ isActive }) => isActive ? 'tab active' : 'tab'}>Past Orders</NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'tab active' : 'tab'}>Customers</NavLink>
        <NavLink to="/admin/employees" className={({ isActive }) => isActive ? 'tab active' : 'tab'}>Team</NavLink>
        <NavLink to="/admin/analytics" className={({ isActive }) => isActive ? 'tab active' : 'tab'}>Analytics</NavLink>
        <NavLink to="/admin/shipping" className={({ isActive }) => isActive ? 'tab active' : 'tab'}>Shipping</NavLink>
        <NavLink to="/admin/promotions" className={({ isActive }) => isActive ? 'tab active' : 'tab'}>
          <Megaphone size={14} /> Promotions
        </NavLink>
      </div>

      {toast && (
        <div className={`promo-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="promo-header">
        <Megaphone size={28} />
        <div>
          <h1>Promotional Broadcasts</h1>
          <p>Send SMS &amp; WhatsApp campaigns to your customers</p>
        </div>
      </div>

      <div className="promo-grid">
        {/* Left: Composer */}
        <div className="promo-card composer-card">
          <h2><MessageSquare size={18} /> Compose Message</h2>

          <div className="channel-row">
            <button className={`channel-btn ${channels.sms ? 'active-sms' : ''}`} onClick={() => toggleChannel('sms')}>
              <Phone size={14} /> SMS {channels.sms ? '✓' : ''}
            </button>
            <button className={`channel-btn ${channels.whatsapp ? 'active-wa' : ''}`} onClick={() => toggleChannel('whatsapp')}>
              <MessageSquare size={14} /> WhatsApp {channels.whatsapp ? '✓' : ''}
            </button>
          </div>

          <textarea
            className="promo-textarea"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message here... Use {{name}} and {{company}} as placeholders."
            rows={6}
          />

          <div className="placeholder-tags">
            <span>Placeholders:</span>
            <button onClick={() => setMessage(m => m + '{{name}}')}>+ name</button>
            <button onClick={() => setMessage(m => m + '{{company}}')}>+ company</button>
          </div>

          <div className="char-count">{message.length} chars</div>

          {/* Recipient Selector */}
          <div className="recipients-section">
            <div className="recipients-header">
              <h3><Users size={15} /> Recipients ({selectedIds.length} selected)</h3>
              <button className="select-all-btn" onClick={selectAll}>
                {selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0
                  ? <><CheckSquare size={13} /> Deselect All</>
                  : <><Square size={13} /> Select All</>}
              </button>
            </div>
            <div className="recipient-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="recipient-list">
              {filteredCustomers.length === 0
                ? <p className="no-customers">No customers with phone numbers found.</p>
                : filteredCustomers.map(c => (
                  <div
                    key={c.id}
                    className={`recipient-item ${selectedIds.includes(c.id) ? 'selected' : ''}`}
                    onClick={() => toggleSelect(c.id)}
                  >
                    <div className="recipient-avatar">{(c.name || '?')[0].toUpperCase()}</div>
                    <div className="recipient-info">
                      <span className="recipient-name">{c.name || 'Unknown'}</span>
                      <span className="recipient-phone">{c.phone}</span>
                    </div>
                    <div className="recipient-check">
                      {selectedIds.includes(c.id) ? <CheckSquare size={16} className="checked" /> : <Square size={16} />}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          <button
            className="send-btn"
            onClick={handleSend}
            disabled={sending || !message.trim() || selectedIds.length === 0}
          >
            {sending ? <span className="spinner" /> : <Send size={16} />}
            {sending ? 'Sending…' : `Send to ${selectedIds.length} Recipient${selectedIds.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Right: Preview + History */}
        <div className="promo-right">
          {/* Live Preview */}
          <div className="promo-card preview-card">
            <h2>Live Preview</h2>
            <div className="preview-tabs">
              <button className={previewTab === 'sms' ? 'active' : ''} onClick={() => setPreviewTab('sms')}>SMS</button>
              <button className={previewTab === 'whatsapp' ? 'active' : ''} onClick={() => setPreviewTab('whatsapp')}>WhatsApp</button>
            </div>
            <div className="phone-frame">
              <div className="phone-notch" />
              <div className={`phone-screen ${previewTab}`}>
                {previewTab === 'sms' ? (
                  <div className="sms-bubble-wrap">
                    <div className="sms-header">
                      <div className="sms-avatar">FB</div>
                      <div>
                        <div className="sms-name">Fine Bearing Store</div>
                        <div className="sms-time">Now</div>
                      </div>
                    </div>
                    <div className="sms-bubble">{samplePreview}</div>
                  </div>
                ) : (
                  <div className="wa-bubble-wrap">
                    <div className="wa-header">
                      <div className="wa-avatar">🏭</div>
                      <div>
                        <div className="wa-name">Fine Bearing Store</div>
                        <div className="wa-status">Business Account</div>
                      </div>
                    </div>
                    <div className="wa-bubble">
                      <p>{samplePreview}</p>
                      <span className="wa-time">Now ✓✓</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campaign History */}
          <div className="promo-card history-card">
            <h2><Calendar size={16} /> Campaign History</h2>
            {campaigns.length === 0
              ? <p className="no-campaigns">No campaigns sent yet.</p>
              : <div className="campaign-list">
                {campaigns.slice(0, 10).map(c => (
                  <div key={c.id} className="campaign-item">
                    <div className="campaign-meta">
                      <span className="campaign-msg">{c.message?.substring(0, 60)}…</span>
                      <span className="campaign-date">
                        {new Date(c.sentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="campaign-stats">
                      <span className="badge">{c.recipients?.length || 0} sent</span>
                      {c.channels?.map(ch => (
                        <span key={ch} className={`badge ch-${ch}`}>{ch.toUpperCase()}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

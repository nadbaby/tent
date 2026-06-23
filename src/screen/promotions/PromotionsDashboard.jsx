import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users, Search, CheckCircle2, Calendar, Send, Megaphone,
  MessageSquare, Phone, AlertCircle, Package, Shield,
  RefreshCw, CheckSquare, Square, DollarSign
} from 'lucide-react';
import { apiUrl } from '../../utils/api';
import { getAuthToken } from '../../utils/auth';
import './PromotionsDashboard.css';

export default function PromotionsDashboard() {
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Hello {{name}}, check out our latest bearings & oil seals at Fine Bearing Store!');
  const [channels, setChannels] = useState({ sms: true, whatsapp: false });
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [previewTab, setPreviewTab] = useState('sms');

  const token = getAuthToken();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchCustomers();
    fetchCampaigns();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const r = await fetch(apiUrl('/api/admin/users'), { headers });
      const data = await r.json();
      setCustomers((Array.isArray(data) ? data : []).filter(u => u.phone));
    } catch { }
    setLoading(false);
  };

  const fetchCampaigns = async () => {
    try {
      const r = await fetch(apiUrl('/api/admin/promotions'), { headers });
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
    (c.phone || '').includes(search) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAll = () =>
    setSelectedIds(selectedIds.length === filteredCustomers.length ? [] : filteredCustomers.map(c => c.id));

  const previewText = (name = 'Rahul', company = 'ABC Traders') =>
    message.replace(/{{name}}/gi, name).replace(/{{company}}/gi, company);

  const handleSend = async () => {
    if (!message.trim()) return showToast('Please write a promotional message.', 'error');
    if (!channels.sms && !channels.whatsapp) return showToast('Please select at least one channel.', 'error');
    if (selectedIds.length === 0) return showToast('Please select at least one recipient.', 'error');

    setSending(true);
    try {
      const activeChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);
      const r = await fetch(apiUrl('/api/admin/promotions'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, channels: activeChannels, userIds: selectedIds })
      });
      const data = await r.json();
      if (r.ok) {
        showToast(`✅ Campaign sent to ${selectedIds.length} recipient(s)!`, 'success');
        setSelectedIds([]);
        fetchCampaigns();
      } else {
        showToast(data.message || 'Failed to send campaign.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    }
    setSending(false);
  };

  const sentCount = campaigns.reduce((acc, c) => acc + (c.recipients?.length || 0), 0);
  const smsCount = campaigns.filter(c => c.channels?.includes('sms')).length;
  const waCount = campaigns.filter(c => c.channels?.includes('whatsapp')).length;

  return (
    <div className="promo-screen">

      {/* Toast */}
      {toast && (
        <div className={`promo-toast-banner ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mgmt-header">
        <div className="header-info">
          <h1>Promotional Campaigns</h1>
          <p>Broadcast SMS &amp; WhatsApp messages to your customer base</p>
        </div>
        <button className="btn-export-premium" onClick={() => { fetchCustomers(); fetchCampaigns(); }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard-stats-grid">
        <div className="stat-pill">
          <span className="label">Total Customers</span>
          <span className="value">{customers.length}</span>
        </div>
        <div className="stat-pill">
          <span className="label">Selected Recipients</span>
          <span className="value" style={{ color: '#ea580c' }}>{selectedIds.length}</span>
        </div>
        <div className="stat-pill success">
          <span className="label">Total Sent</span>
          <span className="value">{sentCount}</span>
        </div>
        <div className="stat-pill">
          <span className="label">Campaigns Run</span>
          <span className="value">{campaigns.length}</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="admin-tabs">
        <NavLink to="/admin/todays-orders" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
          <Calendar size={18} /><span>Today's Orders</span>
        </NavLink>
        <NavLink to="/employee-panel" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
          <Package size={18} /><span>Past Orders</span>
        </NavLink>
        <NavLink to="/admin/quotes" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
          <DollarSign size={18} /><span>B2B RFQs</span>
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
      </div>

      {/* Main 2-column Grid */}
      <div className="promo-main-grid">

        {/* LEFT: Composer */}
        <div>
          {/* Channel picker */}
          <div className="promo-section-card">
            <div className="promo-card-title">
              <MessageSquare size={18} className="promo-card-icon" />
              <h2>Compose Message</h2>
            </div>

            <label className="promo-field-label">Delivery Channels</label>
            <div className="promo-channel-row">
              <button
                className={`promo-channel-btn ${channels.sms ? 'active-sms' : ''}`}
                onClick={() => toggleChannel('sms')}
              >
                <Phone size={15} />
                <span>SMS</span>
                {channels.sms && <CheckCircle2 size={14} className="ch-check" />}
              </button>
              <button
                className={`promo-channel-btn ${channels.whatsapp ? 'active-wa' : ''}`}
                onClick={() => toggleChannel('whatsapp')}
              >
                <MessageSquare size={15} />
                <span>WhatsApp</span>
                {channels.whatsapp && <CheckCircle2 size={14} className="ch-check" />}
              </button>
            </div>

            <label className="promo-field-label" style={{ marginTop: 16 }}>Message</label>
            <textarea
              className="promo-textarea"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your promotional message here... Use {{name}} and {{company}} for personalisation."
              rows={5}
            />
            <div className="promo-placeholder-row">
              <span>Insert:</span>
              <button onClick={() => setMessage(m => m + '{{name}}')}>+ name</button>
              <button onClick={() => setMessage(m => m + '{{company}}')}>+ company</button>
              <span className="char-count">{message.length} chars</span>
            </div>
          </div>

          {/* Recipient Selector */}
          <div className="promo-section-card" style={{ marginTop: 16 }}>
            <div className="promo-card-title">
              <Users size={18} className="promo-card-icon" />
              <h2>Select Recipients</h2>
              <button className="promo-select-all-btn" onClick={selectAll}>
                {selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0
                  ? <><CheckSquare size={13} /> Deselect All</>
                  : <><Square size={13} /> Select All</>
                }
              </button>
            </div>

            <div className="search-box" style={{ marginBottom: 12 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name, phone or company..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="promo-recipient-list">
              {loading ? (
                <div className="promo-loading-row">Loading customers...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="promo-empty-row">No customers with phone numbers found.</div>
              ) : filteredCustomers.map(c => (
                <div
                  key={c.id}
                  className={`promo-recipient-item ${selectedIds.includes(c.id) ? 'selected' : ''}`}
                  onClick={() => toggleSelect(c.id)}
                >
                  <div className="user-avatar" style={{ flexShrink: 0 }}>
                    {(c.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{c.name || 'Unknown'}</span>
                    <span className="user-id">{c.phone} {c.company ? `· ${c.company}` : ''}</span>
                  </div>
                  <div className="promo-check-col">
                    {selectedIds.includes(c.id)
                      ? <CheckSquare size={18} className="promo-checked" />
                      : <Square size={18} className="promo-unchecked" />
                    }
                  </div>
                </div>
              ))}
            </div>

            <button
              className="promo-send-btn"
              onClick={handleSend}
              disabled={sending || !message.trim() || selectedIds.length === 0}
            >
              {sending
                ? <><span className="promo-spinner" /> Sending Campaign…</>
                : <><Send size={16} /> Send to {selectedIds.length} Recipient{selectedIds.length !== 1 ? 's' : ''}</>
              }
            </button>
          </div>
        </div>

        {/* RIGHT: Preview + History */}
        <div>
          {/* Live Preview */}
          <div className="promo-section-card">
            <div className="promo-card-title">
              <Phone size={18} className="promo-card-icon" />
              <h2>Live Preview</h2>
            </div>
            <div className="promo-preview-tabs">
              <button className={previewTab === 'sms' ? 'active' : ''} onClick={() => setPreviewTab('sms')}>
                <Phone size={13} /> SMS
              </button>
              <button className={previewTab === 'whatsapp' ? 'active' : ''} onClick={() => setPreviewTab('whatsapp')}>
                <MessageSquare size={13} /> WhatsApp
              </button>
            </div>
            <div className="promo-phone-wrap">
              <div className="promo-phone-frame">
                <div className="promo-phone-status">
                  <span>9:41</span>
                  <span>●●●</span>
                </div>
                {previewTab === 'sms' ? (
                  <div className="promo-sms-screen">
                    <div className="promo-sms-header">
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12, background: '#ea580c' }}>FB</div>
                      <div>
                        <div className="promo-contact-name">Fine Bearing Store</div>
                        <div className="promo-contact-sub">Business SMS</div>
                      </div>
                    </div>
                    <div className="promo-sms-bubble">{previewText()}</div>
                    <div className="promo-msg-time">Now · Delivered</div>
                  </div>
                ) : (
                  <div className="promo-wa-screen">
                    <div className="promo-wa-header">
                      <div className="promo-wa-avatar">🏭</div>
                      <div>
                        <div className="promo-contact-name" style={{ color: '#fff' }}>Fine Bearing Store</div>
                        <div className="promo-contact-sub" style={{ color: '#9de1a3' }}>Business Account · Online</div>
                      </div>
                    </div>
                    <div className="promo-wa-body">
                      <div className="promo-wa-bubble">
                        <p>{previewText()}</p>
                        <span className="promo-wa-time">Now ✓✓</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campaign History */}
          <div className="promo-section-card" style={{ marginTop: 16 }}>
            <div className="promo-card-title">
              <Calendar size={18} className="promo-card-icon" />
              <h2>Campaign History</h2>
            </div>
            {campaigns.length === 0 ? (
              <div className="promo-empty-row" style={{ padding: '32px 0', textAlign: 'center' }}>
                No campaigns sent yet.
              </div>
            ) : (
              <div className="promo-history-list">
                {campaigns.slice(0, 8).map(c => (
                  <div key={c.id} className="promo-history-item">
                    <div className="promo-history-msg">
                      {c.message?.substring(0, 70)}{c.message?.length > 70 ? '…' : ''}
                    </div>
                    <div className="promo-history-meta">
                      <span className="promo-badge">{c.recipients?.length || 0} sent</span>
                      {c.channels?.map(ch => (
                        <span key={ch} className={`promo-badge promo-ch-${ch}`}>
                          {ch === 'sms' ? <Phone size={10} /> : <MessageSquare size={10} />}
                          {ch.toUpperCase()}
                        </span>
                      ))}
                      <span className="promo-history-date">
                        {new Date(c.sentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

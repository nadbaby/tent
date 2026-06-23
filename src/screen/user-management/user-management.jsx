import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/api';
import { Users, Search, Percent, Save, User as UserIcon, Building2, Phone, Calendar, CheckCircle2, Mail, Shield, Package, RefreshCw, Filter, Download, Megaphone, DollarSign } from 'lucide-react';
import { getAuthToken, isAdmin } from '../../utils/auth';
import { NavLink } from 'react-router-dom';
import { Skeleton, SkeletonTable, SkeletonStatsGrid } from '../../components/common/Skeleton/Skeleton';
import './user-management.css';

const CustomerOperationsDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [successState, setSuccessState] = useState({ id: null, type: null });

  const token = getAuthToken();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManagerOrAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager';

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl('/api/admin/users'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errData = await response.json();
        setError(errData.message || "Failed to load users");
      }
    } catch (error) {
      console.error("Fetch Users Error:", error);
      setError("Network error. Please make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isManagerOrAdmin) {
      window.location.href = '/login';
      return;
    }
    Promise.resolve().then(() => {
      fetchUsers();
    });
  }, [isManagerOrAdmin]);

  const handleUpdateDiscount = async (userId, discount) => {
    setUpdatingId(userId);
    try {
      const response = await fetch(apiUrl(`/api/admin/users/${userId}/discount`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ specialDiscount: discount })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));

        setSuccessState({ id: userId, type: 'discount' });
        setTimeout(() => setSuccessState({ id: null, type: null }), 2000);

        // Also update local storage if it's the current user (though unlikely for admin to discount themselves here)
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (currentUser && currentUser.id === userId) {
          localStorage.setItem('user', JSON.stringify({ ...currentUser, specialDiscount: discount }));
        }
      } else {
        alert("Failed to update discount");
      }
    } catch (error) {
      console.error("Update Discount Error:", error);
      alert("Network error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateGst = async (userId, gst) => {
    setUpdatingId(userId);
    try {
      const response = await fetch(apiUrl(`/api/admin/users/${userId}/gst`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gstNumber: gst })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));

        setSuccessState({ id: userId, type: 'gst' });
        setTimeout(() => setSuccessState({ id: null, type: null }), 2000);
      } else {
        alert("Failed to update GST");
      }
    } catch (error) {
      console.error("Update GST Error:", error);
      alert("Network error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.phone || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.company || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.gstNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.id || user._id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="user-management-screen">
      <div className="container">
        <header className="mgmt-header">
          <div className="header-info">
            <h1>Admin Dashboard</h1>
            <Skeleton type="skeleton-text" style={{ width: '300px' }} />
          </div>
        </header>
        <SkeletonStatsGrid count={2} />
        <div className="admin-tabs">
          <div className="admin-tab"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
          <div className="admin-tab"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
          <div className="admin-tab"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
          <div className="admin-tab active"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
          {user?.role?.toLowerCase() === 'admin' && (
            <div className="admin-tab"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
          )}
          <div className="admin-tab"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
        </div>
        <div className="users-table-container" style={{ border: 'none' }}>
          <SkeletonTable rows={8} columns={7} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="user-management-screen">
      <div className="container">
        <header className="mgmt-header">
          <div className="header-info">
            <h1>Admin Dashboard</h1>
            <p>Manage special percentage-off discounts for specific customers.</p>
          </div>
        </header>
        <div className="dashboard-stats-grid">
          <div className="stat-pill">
            <span className="label">Total Customers</span>
            <span className="value">{users.length}</span>
          </div>
          <div className="stat-pill success">
            <span className="label">Active Business</span>
            <span className="value">{users.filter(u => u.gstNumber).length}</span>
          </div>
        </div>

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
          {user?.role?.toLowerCase() === 'admin' && (
            <NavLink to="/admin/employees" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Shield size={18} />
              <span>Team Management</span>
            </NavLink>
          )}
          <NavLink to="/admin/promotions" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
            <Megaphone size={18} />
            <span>Promotions</span>
          </NavLink>
        </div>

        <div className="mgmt-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name, phone or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-export-premium" onClick={fetchUsers}><RefreshCw size={18} /> Refresh List</button>
        </div>

        {error && <div className="mgmt-error-alert">{error}</div>}

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Customer Details</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Registered</th>
                <th>GST Number</th>
                <th>Special Discount</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id || user._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}</div>
                      <div className="user-info">
                        <span className="user-name">{user.name || user.email?.split('@')[0] || 'Unknown User'}</span>
                        <span className="user-id">ID: {String(user.id || user._id || '').slice(-6)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="company-cell">
                      <Building2 size={14} />
                      <span>{user.company || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <Phone size={14} />
                      <span>{user.phone || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="email-cell">
                      <Mail size={14} />
                      <span>{user.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Calendar size={14} />
                      <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td>
                    <div className="gst-input-group" style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Add GSTIN"
                        className={`mgmt-gst-input ${successState.id === user.id && successState.type === 'gst' ? 'input-success' : ''}`}
                        defaultValue={user.gstNumber || ''}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val !== (user.gstNumber || '')) {
                            handleUpdateGst(user.id, val);
                          }
                        }}
                        disabled={updatingId === user.id}
                      />
                      {successState.id === user.id && successState.type === 'gst' && (
                        <CheckCircle2 size={16} className="mini-success-icon" style={{ position: 'absolute', right: '-25px', top: '50%', transform: 'translateY(-50%)' }} />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="discount-input-group">
                      <div className="input-wrapper">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className={successState.id === user.id && successState.type === 'discount' ? 'input-success' : ''}
                          defaultValue={user.specialDiscount || 0}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== (user.specialDiscount || 0)) {
                              handleUpdateDiscount(user.id, val);
                            }
                          }}
                          disabled={updatingId === user.id}
                        />
                        <Percent size={14} className="percent-icon" />
                      </div>
                      {updatingId === user.id && <div className="mini-loader"></div>}
                      {successState.id === user.id && successState.type === 'discount' && (
                        <CheckCircle2 size={18} className="mini-success-icon" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && !loading && (
            <div className="empty-state">
              <Users size={48} />
              <h3>No customers found</h3>
              <p>Try a different search term or wait for new registrations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerOperationsDashboard;

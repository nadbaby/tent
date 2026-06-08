import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/api';
import { Users, UserPlus, Trash2, Edit2, Mail, Shield, User, Phone, Package, RefreshCw, Filter, CheckCircle, Calendar } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

import { Skeleton, SkeletonStatsGrid } from '../../components/common/Skeleton/Skeleton';
import './employee-management.css';

const firebaseConfig = {
  apiKey: "AIzaSyDKcdRS5H2khDGLPxjw_IHAIo1WG4bnQkU",
  authDomain: "finebear-bf157.firebaseapp.com",
  projectId: "finebear-bf157",
  storageBucket: "finebear-bf157.firebasestorage.app",
  messagingSenderId: "296985767202",
  appId: "1:296985767202:web:d73a50e49ef218408a497b",
  measurementId: "G-2H9Q5NBRC8"
};

const StaffOperationsDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdminAuthenticated') === 'true';
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : {};
  const isSuperAdmin = currentUser.email === 'dipanshu@pvtchopra.com';

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    gstNumber: '',
    role: 'Staff', // Default role
    permissions: ['view_orders', 'edit_status']
  });

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/login';
      return;
    }
    fetchEmployees();
  }, [isAdmin]);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl('/api/admin/employees'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else {
        const errData = await response.json();
        setError(errData.message || "Failed to load employees");
      }
    } catch (error) {
      console.error("Fetch Employees Error:", error);
      setError("Network error. Please make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePermissionToggle = (perm) => {
    const newPerms = formData.permissions.includes(perm)
      ? formData.permissions.filter(p => p !== perm)
      : [...formData.permissions, perm];
    setFormData({ ...formData, permissions: newPerms });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if email or username already exists (local check)
    const duplicate = employees.find(emp =>
      (emp.email.toLowerCase() === formData.email.toLowerCase() ||
        emp.username.toLowerCase() === formData.username.toLowerCase()) &&
      emp.id !== editingId
    );

    if (duplicate) {
      alert(`Error: An account with this ${duplicate.email.toLowerCase() === formData.email.toLowerCase() ? 'email' : 'username'} is already registered.`);
      return;
    }

    try {
      // 1. Create in Firebase Authentication (Primary Step)
      // We use a secondary app to avoid logging out the admin
      let firebaseUid = null;
      if (!editingId) {
        try {
          const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp_${Date.now()}`);
          const secondaryAuth = getAuth(secondaryApp);
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
          firebaseUid = userCredential.user.uid;
          await deleteApp(secondaryApp); // Cleanup
          console.log("Firebase Auth account created successfully");
        } catch (authErr) {
          console.error("Firebase Auth Error:", authErr);
          if (authErr.code === 'auth/email-already-in-use') {
            alert("Error: This email is already registered in Firebase Authentication.");
            return;
          }
          alert("Failed to create Firebase Authentication account: " + authErr.message);
          return;
        }
      }

      // 2. Save to Backend (employees.json)
      const url = editingId
        ? apiUrl(`/api/admin/employees/${editingId}`)
        : apiUrl('/api/admin/employees');

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          firebaseUid,
          backendRole: formData.role === 'Admin' ? 'admin' : 'employee'
        })
      });

      if (response.ok) {
        setShowAddForm(false);
        setEditingId(null);
        setFormData({ username: '', password: '', name: '', email: '', phone: '', gstNumber: '', role: 'Staff', permissions: ['view_orders', 'edit_status'] });
        fetchEmployees();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to save employee to backend");
      }
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("Network error: Could not reach the server.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      // 1. Delete from Backend
      const response = await fetch(apiUrl(`/api/admin/employees/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // 2. Try delete from Firestore (using the same ID)
        try {
          await deleteDoc(doc(db, "employees", id));
        } catch (fErr) {
          console.warn("Firestore delete skipped or failed:", fErr);
        }
        fetchEmployees();
      }
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const handleEdit = (emp) => {
    setEditingId(emp.id);
    setFormData({
      username: emp.username,
      password: emp.password,
      name: emp.name,
      email: emp.email,
      role: emp.role || 'Staff',
      phone: emp.phone || '',
      gstNumber: emp.gstNumber || '',
      permissions: emp.permissions
    });
    setShowAddForm(true);
  };

  if (loading) return (
    <div className="employee-management-screen">
      <div className="container">
        <header className="mgmt-header">
          <div className="header-info">
            <h1>Admin Dashboard</h1>
            <Skeleton type="skeleton-text" style={{ width: '300px' }} />
          </div>
        </header>
        <SkeletonStatsGrid count={3} />
        <div className="admin-tabs">
          <div className="admin-tab"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
          <div className="admin-tab"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
          <div className="admin-tab"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
          {currentUser?.role?.toLowerCase() === 'admin' && (
            <div className="admin-tab active"><Skeleton type="skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></div>
          )}
        </div>
        <div className="team-grid">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="team-card">
              <div className="card-top">
                <Skeleton type="skeleton-avatar" style={{ width: '48px', height: '48px' }} />
                <div className="user-meta">
                  <Skeleton type="skeleton-text" style={{ width: '120px' }} />
                  <Skeleton type="skeleton-text" style={{ width: '60px' }} />
                </div>
              </div>
              <div className="card-body">
                <Skeleton type="skeleton-text" />
                <Skeleton type="skeleton-text" />
                <Skeleton type="skeleton-text" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="employee-management-screen">
      <div className="container">
        {error && (
          <div className="mgmt-error-alert">
            <p>{error}</p>
            <button className="btn btn-outline" onClick={fetchEmployees}>Retry</button>
          </div>
        )}
        <header className="mgmt-header">
          <div className="header-info">
            <h1>Admin Dashboard</h1>
            <p>Administer access, roles, and operational permissions for your staff.</p>
          </div>
          {isSuperAdmin && (
            <button className="btn btn-primary add-btn" onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
              if (!showAddForm) window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
              {showAddForm ? 'Close Editor' : <><UserPlus size={18} /> Add New Member</>}
            </button>
          )}
        </header>

        <div className="dashboard-stats-grid">
          <div className="stat-pill">
            <span className="label">Total Team</span>
            <span className="value">{employees.length}</span>
          </div>
          <div className="stat-pill success">
            <span className="label">Admins</span>
            <span className="value">{employees.filter(e => e.role === 'Admin').length}</span>
          </div>
          <div className="stat-pill warning">
            <span className="label">Staff</span>
            <span className="value">{employees.filter(e => e.role === 'Staff').length}</span>
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
              <Package size={18} />
              <span>B2B RFQs</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Customer Discounts</span>
            </NavLink>
            {currentUser?.role?.toLowerCase() === 'admin' && (
              <NavLink to="/admin/employees" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                <Shield size={18} />
                <span>Team Management</span>
              </NavLink>
            )}
          </div>

        {isSuperAdmin && showAddForm && (
          <div className="mgmt-form-card animate-in">
            <form onSubmit={handleSubmit}>
              <div className="form-header">
                <h3>{editingId ? 'Edit Team Member' : 'Register New Team Member'}</h3>
                <p>Fill in the credentials and assign specific access rights.</p>
              </div>

              <div className="form-sections">
                <div className="form-section">
                  <h4><Users size={16} /> Basic Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input name="name" placeholder="e.g. Rahul Sharma" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" name="email" placeholder="rahul@company.com" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Login Username</label>
                      <input name="username" placeholder="rahul_staff" value={formData.username} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input name="phone" placeholder="e.g. +91 98881 09761" value={formData.phone} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>GST Number (Optional)</label>
                      <input name="gstNumber" placeholder="22AAAAA0000A1Z5" value={formData.gstNumber} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Access Password</label>
                      <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4><Shield size={16} /> Access & Role</h4>
                  <div className="role-selector">
                    <label>Assigned Role</label>
                    <div className="role-options">
                      {['Staff', 'Manager'].map(r => (
                        <button
                          key={r}
                          type="button"
                          className={`role-opt ${formData.role === r ? 'active' : ''}`}
                          onClick={() => {
                            const defaultPerms = r === 'Manager'
                              ? ['view_orders', 'edit_status', 'manage_inventory']
                              : ['view_orders', 'edit_status'];
                            setFormData({ ...formData, role: r, permissions: defaultPerms });
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="permissions-area">
                    <label>Functional Permissions</label>
                    <div className="permissions-grid">
                      {[
                        { id: 'view_orders', label: 'Order Access', desc: 'Can view and track all customer orders' },
                        { id: 'edit_status', label: 'Operations', desc: 'Can update shipping and payment status' },
                        { id: 'manage_inventory', label: 'Inventory', desc: 'Can add, edit, or remove products' }
                      ].map(perm => (
                        <div key={perm.id} className={`perm-box ${formData.permissions.includes(perm.id) ? 'checked' : ''}`} onClick={() => handlePermissionToggle(perm.id)}>
                          <div className="perm-check">
                            <input type="checkbox" checked={formData.permissions.includes(perm.id)} readOnly />
                          </div>
                          <div className="perm-info">
                            <span className="perm-label">{perm.label}</span>
                            <span className="perm-desc">{perm.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)}>Discard Changes</button>
                <button type="submit" className="btn btn-primary save-btn">
                  {editingId ? 'Update Account' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="team-grid">
          {employees.map(emp => (
            <div key={emp.id} className="team-card animate-in">
              <div className="card-top">
                <div className="user-avatar">
                  {emp.name.charAt(0)}
                </div>
                <div className="user-meta">
                  <h4>{emp.name}</h4>
                  <span className={`role-badge ${emp.role?.toLowerCase() || 'staff'}`}>{emp.role || 'Staff'}</span>
                </div>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <Mail size={14} />
                  <span>{emp.email}</span>
                </div>
                <div className="info-row">
                  <User size={14} />
                  <span>@{emp.username}</span>
                </div>
                {emp.phone && (
                  <div className="info-row">
                    <Phone size={14} />
                    <span>{emp.phone}</span>
                  </div>
                )}
                {emp.gstNumber && (
                  <div className="info-row">
                    <Shield size={14} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>GST: {emp.gstNumber}</span>
                  </div>
                )}

                <div className="card-perms">
                  <p>Permissions:</p>
                  <div className="tags">
                    {emp.permissions.map(p => (
                      <span key={p} className="tag">{p.replace('_', ' ')}</span>
                    ))}
                  </div>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="card-actions">
                  <button className="action-btn edit" onClick={() => handleEdit(emp)}><Edit2 size={14} /> Edit</button>
                  <button className="action-btn delete" onClick={() => handleDelete(emp.id)}><Trash2 size={14} /> Remove</button>
                </div>
              )}
            </div>
          ))}

          {employees.length === 0 && !loading && (
            <div className="empty-state">
              <Users size={48} />
              <h3>No team members yet</h3>
              <p>Start by adding your first employee or manager.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffOperationsDashboard;

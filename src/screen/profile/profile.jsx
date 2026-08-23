import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { User, Building, Shield, LogOut, Save, ArrowLeft, Mail, FileText, Camera, Loader2, MapPin } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { getAuthToken } from '../../utils/auth';
import './profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [profilePic, setProfilePic] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const authStatus = localStorage.getItem('isAdminAuthenticated');

    if (!userData) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userData);
    setCurrentUser(user);
    setIsAdmin(authStatus === 'true');

    setName(user.name || user.displayName || user.username || '');
    setEmail(user.email || '');
    setCompany(user.company || '');
    setGstNumber(user.gstNumber || '');
    setProfilePic(user.profilePic || '');
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(apiUrl('/api/upload'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfilePic(data.filePath);
      } else {
        setErrorMsg('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMsg('Network error while uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const token = getAuthToken();
    try {
      const response = await fetch(apiUrl('/api/user/update-profile'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, company, gstNumber, profilePic })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const err = await response.json();
        setErrorMsg(err.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resolveImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return apiUrl(path);
  };

  if (!currentUser) return null;

  return (
    <div className="profile-screen">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-large">
              {profilePic ? (
                <img src={resolveImageUrl(profilePic)} alt={name} className="avatar-img" />
              ) : (
                name ? name.charAt(0).toUpperCase() : <User size={40} />
              )}
              {isUploading && <div className="avatar-loader"><Loader2 className="animate-spin" /></div>}
            </div>
            <button
              type="button"
              className="camera-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Picture"
            >
              <Camera size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              accept="image/*"
            />
          </div>
          <div className="profile-title">
            <h2>{name || 'Account Settings'}</h2>
            <p>{currentUser.phone}</p>
          </div>
          <button className="icon-btn back-btn" onClick={() => navigate('/')}><ArrowLeft size={24} /></button>
        </div>

        <div className="profile-content">
          <form onSubmit={handleUpdateProfile}>
            <div className="form-section">
              <div className="section-title">
                <User size={18} />
                <h3>Personal Information</h3>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-title">
                <Building size={18} />
                <h3>Business Details</h3>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name</label>
                  <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company Ltd" />
                </div>
                <div className="form-group">
                  <label>GST Number</label>
                  <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="22AAAAA0000A1Z5" />
                </div>
              </div>
            </div>

            {successMsg && <div className="profile-alert success">{successMsg}</div>}
            {errorMsg && <div className="profile-alert error">{errorMsg}</div>}

            <div className="profile-actions">
              <button type="button" className="btn btn-logout" onClick={handleLogout}><LogOut size={18} /> Logout</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading || isUploading}>
                {isLoading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
              </button>
            </div>

            <div className="form-section">
              <div className="section-title">
                <MapPin size={18} />
                <h3>Saved Addresses</h3>
              </div>
              {currentUser.addresses && currentUser.addresses.length > 0 ? (
                <div className="address-grid">
                  {currentUser.addresses.map((addr, idx) => (
                    <div key={addr.id || idx} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
                      <div className="address-card-header">
                        <span className="address-type">{addr.fullName}</span>
                        {addr.isDefault && <span className="default-badge">Default</span>}
                      </div>
                      <p className="address-text">
                        {addr.street}, {addr.city}, {addr.state} - {addr.zip}
                      </p>
                      <p className="address-phone">{addr.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-addresses">
                  <p>No saved addresses found.</p>
                  <button type="button" className="btn-text" onClick={() => navigate('/checkout')}>Add one during checkout</button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

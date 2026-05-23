import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, ShoppingCart, User, Users, Menu, X, ChevronDown, LogOut, Shield, Package, Settings } from 'lucide-react';
import CartDrawer from './CartDrawer';
import fineLogo from '../../assets/Fine LOGO.png';
import './Navbar.css';
import PromoMarquee from './PromoMarquee';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    if (isSearchVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Check authentication
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    setIsAdmin(authStatus === 'true');

    const userData = localStorage.getItem('user');
    setCurrentUser(userData ? JSON.parse(userData) : null);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [location, isSearchVisible]);

  // Hide Navbar on Login page
  if (location.pathname === '/login') return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('isAdminAuthenticated');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAdmin(false);
      setCurrentUser(null);
      window.location.href = '/login'; // Redirect to login after logout
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear local storage anyway
      localStorage.removeItem('isAdminAuthenticated');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };


  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container container">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <img src={fineLogo} alt="Fine Bearing Logo" className="logo-image" />
          </Link>

          {/* Desktop Menu */}
          <div className="navbar-menu">
            <div className="nav-item">
              <NavLink to="/products" className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>Products <ChevronDown size={16} /></NavLink>
            </div>
            {/* Regular Links (Hidden for Admin) */}
            {(!currentUser || currentUser.role?.toLowerCase() !== 'admin') && (
              <>
                <div className="nav-item">
                  <NavLink to="/brands" className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>Brands</NavLink>
                </div>
                <div className="nav-item">
                  <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>About</NavLink>
                </div>
                <div className="nav-item">
                  <NavLink to="/contact" className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>Contact</NavLink>
                </div>
              </>
            )}
            {currentUser && (
              <div className="nav-item">
                <NavLink to="/orders" className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>My Orders</NavLink>
              </div>
            )}
            {currentUser && (
              <div className="nav-item">
                <NavLink to="/my-tickets" className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>Support</NavLink>
              </div>
            )}
            {currentUser && (['employee', 'manager', 'staff', 'admin'].includes(currentUser.role?.toLowerCase())) && (
              <>
                <div className="nav-item">
                  <NavLink to="/employee-panel" className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>Management</NavLink>
                </div>
                {currentUser.role?.toLowerCase() === 'admin' && (
                  <div className="nav-item">
                    <NavLink to="/admin/analytics" className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>Analytics</NavLink>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Search Bar (Desktop) */}
          <form className="navbar-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn">
              <Search size={18} />
            </button>
          </form>

          {/* Actions */}
          <div className="navbar-actions">
            {currentUser && (['employee', 'manager', 'staff', 'admin'].includes(currentUser.role?.toLowerCase())) && (
              <div className="navbar-role-links">
                <Link to="/employee-panel" className="icon-btn" title="Management">
                  <Settings size={22} color="var(--color-accent)" />
                </Link>
              </div>
            )}
            {currentUser ? (
              <div className="navbar-user">
                {isAdmin && <span className="admin-badge">Admin</span>}
                <Link to="/profile" className="icon-btn profile-link" title="My Profile" style={{ color: isAdmin ? 'var(--color-accent)' : 'inherit' }}>
                  <User size={22} />
                </Link>
              </div>
            ) : (
              <Link to="/login" className="icon-btn">
                <User size={22} />
              </Link>
            )}
            <button className="icon-btn cart-btn" onClick={() => setCartOpen(true)}>
              <ShoppingCart size={22} />
              {totalQuantity > 0 && <span className="cart-badge">{totalQuantity}</span>}
            </button>
            
            <button className="icon-btn mobile-search-toggle" onClick={() => setIsSearchVisible(true)}>
              <Search size={22} />
            </button>

            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* iOS Style Mobile Search Bar */}
        <div className={`ios-search-overlay ${isSearchVisible ? 'active' : ''}`}>
          <div className="ios-search-container" ref={searchRef}>
            <div className="ios-search-field">
              <Search size={16} className="ios-search-icon" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                autoFocus={isSearchVisible}
              />
              {searchQuery && (
                <button className="ios-clear-btn" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="ios-cancel-btn" onClick={() => {
              setIsSearchVisible(false);
              setSearchQuery('');
            }}>
              Cancel
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <form className="mobile-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit"><Search size={18} /></button>
          </form>
          <div className="mobile-nav-links">
            <Link to="/products" onClick={() => setMobileMenuOpen(false)}>Products</Link>

            {(!currentUser || currentUser.role?.toLowerCase() !== 'admin') && (
              <>
                <Link to="/brands" onClick={() => setMobileMenuOpen(false)}>Brands</Link>
                <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
              </>
            )}
            {currentUser && currentUser.role?.toLowerCase() === 'user' && (
              <Link to="/orders" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
            )}
            {currentUser && (
              <Link to="/my-tickets" onClick={() => setMobileMenuOpen(false)}>Support Tickets</Link>
            )}
            {currentUser && (['employee', 'manager', 'staff', 'admin'].includes(currentUser.role?.toLowerCase())) && (
              <>
                <Link to="/employee-panel" onClick={() => setMobileMenuOpen(false)}>Management</Link>
                {currentUser.role?.toLowerCase() === 'admin' && (
                  <Link to="/admin/analytics" onClick={() => setMobileMenuOpen(false)}>Business Analytics</Link>
                )}
              </>
            )}
          </div>

        </div>
        <PromoMarquee />
      </nav>

      {/* Cart Drawer — rendered outside nav for proper z-index stacking */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};


export default Navbar;

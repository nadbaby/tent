import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, ShoppingCart, User, Users, Menu, X, ChevronDown, LogOut, Shield, Package, Settings, Heart, ArrowLeft } from 'lucide-react';
import CartDrawer from './CartDrawer';
import fineLogo from '../../assets/Fine LOGO.png';
import './Navbar.css';
import PromoMarquee from './PromoMarquee';
import { apiUrl } from '../../utils/api';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [suggestions, setSuggestions] = useState({ suggestions: [], products: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const searchRef = useRef(null);
  const desktopSearchRef = useRef(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);
  const wishlistCount = useSelector((state) => state.wishlist?.items?.length || 0);

  // Debounced search suggestion fetch
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions({ suggestions: [], products: [] });
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(apiUrl(`/api/products/autocomplete?q=${encodeURIComponent(searchQuery.trim())}`));
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.suggestions.length > 0 || data.products.length > 0);
          setActiveIndex(-1);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close desktop suggestions
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard navigation within suggestions (combines text suggestions and product suggestions)
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    const suggestionList = suggestions.suggestions || [];
    const productList = suggestions.products || [];
    const totalLength = suggestionList.length + productList.length;
    if (totalLength === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 < totalLength ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalLength - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < totalLength) {
        e.preventDefault();
        if (activeIndex < suggestionList.length) {
          handleKeywordClick(suggestionList[activeIndex]);
        } else {
          handleSuggestionClick(productList[activeIndex - suggestionList.length]);
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (product) => {
    navigate(`/product/${product.id}`);
    setSearchQuery('');
    setShowSuggestions(false);
    setIsSearchVisible(false);
    setMobileMenuOpen(false);
  };

  const highlightMatch = (text, query) => {
    if (!query) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? 
            <strong key={i} className="search-highlight">{part}</strong> : 
            <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  const handleKeywordClick = (keyword) => {
    navigate(`/products?search=${encodeURIComponent(keyword)}`);
    setSearchQuery('');
    setShowSuggestions(false);
    setIsSearchVisible(false);
    setMobileMenuOpen(false);
  };

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
          {/* Back Button */}
          {location.pathname !== '/' && (
            <button 
              className="navbar-back-btn"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
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
          <form 
            className="navbar-search" 
            onSubmit={handleSearch} 
            ref={desktopSearchRef}
            onKeyDown={handleKeyDown}
          >
            <input
              type="text"
              placeholder="Search products, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions((suggestions.suggestions && suggestions.suggestions.length > 0) || (suggestions.products && suggestions.products.length > 0))}
            />
            <button type="submit" className="search-btn">
              <Search size={18} />
            </button>

            {/* Desktop Autocomplete Suggestions Dropdown */}
            {showSuggestions && ((suggestions.suggestions && suggestions.suggestions.length > 0) || (suggestions.products && suggestions.products.length > 0)) && (
              <div className="search-suggestions-dropdown">
                <div className="suggestions-dropdown-content">
                  {/* Left Column: Keyword suggestions */}
                  {suggestions.suggestions && suggestions.suggestions.length > 0 && (
                    <div className="suggestions-left-col">
                      <div className="suggestions-header">Search Suggestions</div>
                      <div className="suggestions-terms-list">
                        {suggestions.suggestions.map((term, idx) => {
                          const isFocused = idx === activeIndex;
                          return (
                            <div
                              key={term}
                              className={`suggestion-term-row ${isFocused ? 'active' : ''}`}
                              onClick={() => handleKeywordClick(term)}
                              onMouseEnter={() => setActiveIndex(idx)}
                            >
                              <Search size={14} className="suggestion-term-icon" />
                              <span className="suggestion-term-text">{highlightMatch(term, searchQuery)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Right Column: Direct product items */}
                  {suggestions.products && suggestions.products.length > 0 && (
                    <div className="suggestions-right-col">
                      <div className="suggestions-header">Product Matches</div>
                      <div className="suggestions-list-container">
                        {suggestions.products.map((product, idx) => {
                          const offsetIdx = (suggestions.suggestions ? suggestions.suggestions.length : 0) + idx;
                          const isFocused = offsetIdx === activeIndex;
                          return (
                            <div
                              key={product.id}
                              className={`suggestion-item-row ${isFocused ? 'active' : ''}`}
                              onClick={() => handleSuggestionClick(product)}
                              onMouseEnter={() => setActiveIndex(offsetIdx)}
                            >
                              <div className="suggestion-img-wrapper">
                                <img 
                                  src={product.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=50'} 
                                  alt={product.name} 
                                />
                              </div>
                              <div className="suggestion-details">
                                <span className="suggestion-name">{highlightMatch(product.name, searchQuery)}</span>
                                <div className="suggestion-meta-row">
                                  <span className="suggestion-brand-tag">{product.brand}</span>
                                  {product.sku && <span className="suggestion-sku-tag">{product.sku}</span>}
                                </div>
                              </div>
                              <div className="suggestion-price-col">
                                ₹{Number(product.price).toLocaleString('en-IN')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div 
                  className="suggestions-view-all"
                  onClick={() => {
                    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                    setShowSuggestions(false);
                  }}
                >
                  Show all results for "{searchQuery}" &rarr;
                </div>
              </div>
            )}
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
            <Link to="/wishlist" className="icon-btn wishlist-nav-btn" title="My Wishlist">
              <Heart size={20} />
              {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
            </Link>

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

          {/* Mobile Autocomplete Suggestions */}
          {isSearchVisible && searchQuery.trim() && ((suggestions.suggestions && suggestions.suggestions.length > 0) || (suggestions.products && suggestions.products.length > 0)) && (
            <div className="ios-search-results">
              {/* 1. Mobile Keyword recommendations */}
              {suggestions.suggestions && suggestions.suggestions.length > 0 && (
                <div className="ios-suggestions-terms-section">
                  <div className="ios-results-header">Search Suggestions</div>
                  <div className="ios-results-list">
                    {suggestions.suggestions.map((term) => (
                      <div
                        key={term}
                        className="ios-term-item"
                        onClick={() => handleKeywordClick(term)}
                      >
                        <Search size={16} className="ios-term-icon" />
                        <span className="ios-term-text">{highlightMatch(term, searchQuery)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Mobile Product shortcuts */}
              {suggestions.products && suggestions.products.length > 0 && (
                <div className="ios-suggestions-products-section">
                  <div className="ios-results-header">Suggested Products</div>
                  <div className="ios-results-list">
                    {suggestions.products.map((product) => (
                      <div
                        key={product.id}
                        className="ios-result-item"
                        onClick={() => handleSuggestionClick(product)}
                      >
                        <div className="ios-result-img-wrapper">
                          <img 
                            src={product.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=50'} 
                            alt={product.name} 
                          />
                        </div>
                        <div className="ios-result-info">
                          <span className="ios-result-name">{highlightMatch(product.name, searchQuery)}</span>
                          <div className="ios-result-meta">
                            <span className="ios-brand-badge">{product.brand}</span>
                            {product.sku && <span className="ios-sku-text">SKU: {product.sku}</span>}
                          </div>
                        </div>
                        <span className="ios-result-price">
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div 
                className="ios-results-footer"
                onClick={() => {
                  navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                  setIsSearchVisible(false);
                  setSearchQuery('');
                }}
              >
                Show all results for "{searchQuery}" &rarr;
              </div>
            </div>
          )}
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

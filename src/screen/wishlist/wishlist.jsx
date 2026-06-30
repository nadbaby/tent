import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, ArrowLeft, AlertCircle } from 'lucide-react';
import { removeFromWishlist, clearWishlist } from '../../redux/wishlistSlice';
import { addItem } from '../../redux/cartSlice';
import { useToast } from '../../context/ToastContext';
import ProtectedImage from '../../components/common/ProtectedImage';
import { resolveImageUrl } from '../../components/home/ProductCard';
import './wishlist.css';

const Wishlist = () => {
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleRemove = (id, name) => {
    dispatch(removeFromWishlist(id));
    showToast(`${name} removed from wishlist`, 'info');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      dispatch(clearWishlist());
      showToast('Wishlist cleared', 'info');
    }
  };

  const handleAddToCart = (product) => {
    dispatch(addItem({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      image: product.image,
      quantity: 1,
      replace: false
    }));
    showToast(`${product.name} added to cart!`, 'success');
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-empty-container">
        <div className="wishlist-empty-content">
          <div className="empty-icon-wrapper">
            <Heart size={48} className="empty-icon" />
          </div>
          <h2>Your Wishlist is Empty</h2>
          <p>You haven't saved any items yet. Start exploring our industrial solutions to build your wishlist!</p>
          <Link to="/products" className="continue-shopping-btn">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <div className="wishlist-header">
          <div className="header-left">
            <button onClick={() => navigate(-1)} className="back-btn">
              <ArrowLeft size={20} />
            </button>
            <h1>My Wishlist <span className="wishlist-count">({wishlistItems.length} items)</span></h1>
          </div>
          <button className="clear-wishlist-btn" onClick={handleClearAll}>
            <Trash2 size={18} /> Clear All
          </button>
        </div>

        <div className="wishlist-grid">
          {wishlistItems.map((item) => (
            <div key={item.id} className="wishlist-card">
              <div className="wishlist-card-image-wrapper">
                <ProtectedImage
                  src={resolveImageUrl(item.image)}
                  alt={item.name}
                  className="wishlist-card-image"
                />
                <button
                  className="wishlist-remove-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(item.id, item.name);
                  }}
                  title="Remove from wishlist"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="wishlist-card-info">
                <div className="wishlist-card-meta">
                  <span className="wishlist-category">{item.category}</span>
                </div>

                <h3
                  className="wishlist-card-title"
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  {item.name}
                </h3>

                <div className="wishlist-card-footer">
                  <div className="wishlist-price">
                    {item.price ? (
                      `₹${item.price.toLocaleString()}`
                    ) : (
                      <span className="quote-text">Request Quote</span>
                    )}
                  </div>

                  <button
                    className="wishlist-add-cart-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(item);
                    }}
                  >
                    <ShoppingCart size={18} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;

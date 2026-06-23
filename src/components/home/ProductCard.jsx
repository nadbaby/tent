import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addItem } from '../../redux/cartSlice';
import { ShoppingCart, Heart } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { apiUrl } from '../../utils/api';
import { toggleWishlist } from '../../redux/wishlistSlice';
import ProtectedImage from '../common/ProtectedImage';
import './ProductCard.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || '';
const FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" style="background:%23f8fafc;"><circle cx="50" cy="50" r="30" fill="none" stroke="%23cbd5e1" stroke-width="4" stroke-dasharray="10 6"/><circle cx="50" cy="50" r="15" fill="none" stroke="%23cbd5e1" stroke-width="4"/><path d="M50 10 L50 25 M50 75 L50 90 M10 50 L25 50 M75 50 L90 50" stroke="%23cbd5e1" stroke-width="4" stroke-linecap="round"/></svg>`;

/**
 * Resolves a product image path to a full displayable URL.
 */
const resolveImageUrl = (imagePath) => {
  if (!imagePath) return FALLBACK_IMAGE;
  if (Array.isArray(imagePath)) {
    imagePath = imagePath[0];
  }
  if (typeof imagePath !== 'string' || imagePath.trim() === '') return FALLBACK_IMAGE;

  // Convert Apple's HEIC format to standard JPG (Cloudinary converts this on-the-fly when changing file extension in URL)
  if (imagePath.toLowerCase().includes('.heic')) {
    imagePath = imagePath.replace(/\.heic/gi, '.jpg');
  }

  // Extract first http:// or https:// URL if present (e.g. handles prefixes like "main: " or comma lists)
  const httpMatch = imagePath.match(/(https?:\/\/[^\s,]+)/);
  if (httpMatch) {
    return httpMatch[0];
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return apiUrl(cleanPath);
};

const highlightText = (text, highlight) => {
  if (!highlight || !text) return text;
  const parts = String(text).split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} style={{ backgroundColor: '#fde047', color: '#1e293b', padding: '0 2px', borderRadius: '2px' }}>{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const ProductCard = ({ product, isAdmin, onEdit, onDelete, searchTerm }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const isWishlisted = useSelector((state) => state.wishlist?.items?.some(item => item.id === product.id));

  const secureImageUrl = resolveImageUrl(product.image);

  const [quantity, setQuantity] = useState(1);

  // Sync quantity with cart if item exists
  React.useEffect(() => {
    const existingItem = cartItems.find(item => String(item.id) === String(product.id));
    if (existingItem) {
      setQuantity(existingItem.quantity);
    } else {
      setQuantity(1);
    }
  }, [product.id, cartItems]);

  const { showToast } = useToast();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Mandatory Login Check
    const user = localStorage.getItem('user');
    if (!user) {
      showToast("Login required to add to cart", "error");
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        navigate('/login');
      }, 800);
      return;
    }

    dispatch(addItem({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      image: product.image,
      quantity: quantity,
      replace: true
    }));
  };

  const handleQtyChange = (e, delta) => {
    e.stopPropagation();
    e.preventDefault();
    const newQty = quantity + delta;
    if (newQty >= 1) {
      setQuantity(newQty);
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product.slug || product.id}`);
  };

  return (
    <div className={`product-card ${isShaking ? 'shake-animation' : ''}`} onClick={handleCardClick}>
      <div className="product-image-container">
        <div className="product-name-overlay">{highlightText(product.name, searchTerm)}</div>
        <ProtectedImage
          src={secureImageUrl}
          alt={product.name}
          className="product-image"
        />
        <div className="product-badges desktop-only-badges">
          {product.isNew && <span className="badge badge-new">New</span>}
          {product.isFeatured && <span className="badge badge-featured">Featured</span>}
        </div>

        {!isAdmin && (
          <button
            className={`wishlist-heart-btn ${isWishlisted ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const user = localStorage.getItem('user');
              if (!user) {
                navigate('/login');
                return;
              }
              dispatch(toggleWishlist(product));
              showToast(
                isWishlisted ? `Removed from wishlist` : `Added to wishlist`,
                isWishlisted ? 'info' : 'success'
              );
            }}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={18} fill={isWishlisted ? '#ef4444' : 'none'} color={isWishlisted ? '#ef4444' : '#64748b'} />
          </button>
        )}

        {isAdmin && (
          <div className="admin-quick-actions" onClick={(e) => e.stopPropagation()}>
            <button className="admin-btn edit" onClick={() => onEdit(product)}>Edit</button>
            <button className="admin-btn delete" onClick={() => onDelete(product.id)}>Delete</button>
          </div>
        )}
      </div>

      <div className="product-info">
        <div className="product-meta">
          <p className="product-category">{highlightText(product.category, searchTerm)}</p>
        </div>

        {/* Mobile Badges - Visible only on mobile inside info section, ensuring 0% image overlap */}
        {(product.isNew || product.isFeatured) && (
          <div className="product-badges mobile-only-badges">
            {product.isNew && <span className="badge badge-new">New</span>}
            {product.isFeatured && <span className="badge badge-featured">Featured</span>}
          </div>
        )}

        <h3 className="product-name">{highlightText(product.subcategory || 'Sub Category', searchTerm)}</h3>
        <p className="product-specs">{product.specs}</p>

        <div className="product-footer">
          <div className="product-pricing">
            {product.price ? (
              <span className="product-price">₹{product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            ) : (
              <span
                className="product-price quote"
                onClick={(e) => {
                  e.stopPropagation();
                  const userStr = localStorage.getItem('user');
                  if (!userStr) {
                    navigate(`/login?redirect=${encodeURIComponent('/quote?product=' + encodeURIComponent(product.subcategory || product.name) + '&quantity=' + quantity)}`);
                  } else {
                    navigate('/quote', { state: { product: product.subcategory || product.name, quantity: quantity } });
                  }
                }}
              >
                Request Quote
              </span>
            )}
          </div>

          <div className="product-action-row" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
            {!isAdmin ? (
              <>
                <div className="product-qty-control">
                  <button className="qty-btn-small" onClick={(e) => handleQtyChange(e, -1)}>-</button>
                  <input
                    type="number"
                    className="qty-display-small"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1) {
                        setQuantity(val);
                      }
                    }}
                    style={{
                      width: '40px',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      textAlign: 'center',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      color: '#1e293b',
                      padding: 0
                    }}
                  />
                  <button className="qty-btn-small" onClick={(e) => handleQtyChange(e, 1)}>+</button>
                </div>
                <button
                  className="add-to-cart-btn"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart size={16} />
                  <span>Add</span>
                </button>
              </>
            ) : (
              <span className="admin-view-only">View Only</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { resolveImageUrl };
export default ProductCard;

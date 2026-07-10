import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/api';
import ProtectedImage from '../../components/common/ProtectedImage';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '../../redux/cartSlice';
import {
  ShoppingCart,
  Heart,
  Share2,
  ChevronRight,
  Star,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  FileText
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { isAdmin } from '../../utils/auth';
import { toggleWishlist } from '../../redux/wishlistSlice';
import ProductCard, { resolveImageUrl } from '../../components/home/ProductCard';
import { Skeleton } from '../../components/common/Skeleton/Skeleton';
import './product-detail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const cartItems = useSelector((state) => state.cart.items);
  const isAdminUser = isAdmin();
  const isWishlisted = useSelector((state) => state.wishlist?.items?.some(item => String(item.id) === String(id)));

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Sync quantity with cart if item exists
  useEffect(() => {
    if (product) {
      const existingItem = cartItems.find(item => String(item.id) === String(product.id));
      if (existingItem) {
        setQuantity(existingItem.quantity);
      }
    }
  }, [product, cartItems]); // Sync when product loads or cart changes

  const [activeTab, setActiveTab] = useState('specs');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center' });

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  };

  const handleViewCatalogue = () => {
    if (!product || !product.catalogue) return;

    if (product.catalogue.startsWith('data:application/pdf;base64,')) {
      try {
        const base64Data = product.catalogue.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (err) {
        console.error("Error opening PDF Blob:", err);
        alert("Could not open PDF. It might be corrupted.");
      }
    } else if (product.catalogue.includes('drive.google.com')) {
      // Handle Google Drive links: Transform into a clean "preview" URL for instant viewing
      let driveUrl = product.catalogue;
      const fileIdMatch = driveUrl.match(/\/d\/([^\/]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        // /preview is much more reliable than /view for direct embedding/viewing
        window.open(`https://drive.google.com/file/d/${fileId}/preview`, '_blank');
      } else {
        window.open(driveUrl, '_blank');
      }
    } else {
      // Use Google PDF Viewer to ensure "raw" Cloudinary files (octet-stream) are rendered correctly as PDFs
      const encodedUrl = encodeURIComponent(resolveImageUrl(product.catalogue));
      window.open(`https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`, '_blank');
    }
  };

  const handleMouseLeave = () => {
    setZoomStyle({ transformOrigin: 'center center' });
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(apiUrl(`/api/products/${id}`));
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();

        const enrichedProduct = {
          ...data,
          images: data.images || [data.image, data.image, data.image, data.image, data.image, data.image],
          features: data.features || [
            "High-precision industrial grade component",
            "Durable construction for extended service life",
            "Optimized for high-load applications",
            "Easy installation and maintenance",
            "Certified quality standards compliant"
          ],
          specifications: data.specifications || {
            "Brand": data.brand || "N/A",
            "SKU": data.sku || "N/A"
          },
          rating: data.rating || 4.5,
          reviewsCount: data.reviewsCount || 128,
          shortDescription: data.description || ""
        };

        setProduct(enrichedProduct);

        const allRes = await fetch(apiUrl('/api/products'));
        if (allRes.ok) {
          const allData = await allRes.json();
          const filtered = allData.filter(p => String(p.id) !== String(data.id) && String(p.slug) !== String(data.slug));

          let related = [];

          // 1. Same subcategory
          if (data.subcategory) {
            const sameSubcategory = filtered.filter(p => p.subcategory === data.subcategory);
            related = [...related, ...sameSubcategory];
          }

          // 2. Same category
          if (related.length < 8 && data.category) {
            const sameCategory = filtered.filter(p => p.category === data.category && !related.find(r => r.id === p.id));
            related = [...related, ...sameCategory];
          }

          // 3. Same brand
          if (related.length < 8 && data.brand) {
            const sameBrand = filtered.filter(p => p.brand === data.brand && !related.find(r => r.id === p.id));
            related = [...related, ...sameBrand];
          }

          // 4. Latest products if not enough
          if (related.length < 4) {
            const remaining = filtered.filter(p => !related.find(r => r.id === p.id));
            related = [...related, ...remaining];
          }

          setRelatedProducts(related.slice(0, 8));
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const [isShaking, setIsShaking] = useState(false);

  const handleAddToCart = () => {
    if (!product) return;

    // Mandatory Login Check
    const user = localStorage.getItem('user');
    if (!user) {
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        navigate('/login');
      }, 600);
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
    alert(`${quantity} item(s) added to cart!`);
  };

  const handleBuyNow = () => {
    if (!product) return;

    // Mandatory Login Check
    const user = localStorage.getItem('user');
    if (!user) {
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        navigate('/login');
      }, 600);
      return;
    }

    handleAddToCart();
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <nav className="breadcrumb-nav">
            <Skeleton type="skeleton-text" style={{ width: '200px' }} />
          </nav>
          <div className="product-main-content">
            <div className="product-gallery">
              <Skeleton type="skeleton-image" style={{ height: '400px', marginBottom: '1rem' }} />
              <div className="thumbnail-list">
                {Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} type="skeleton-rect" style={{ width: '80px', height: '80px', borderRadius: '8px' }} />
                ))}
              </div>
            </div>
            <div className="product-info-section">
              <Skeleton type="skeleton-text" style={{ width: '100px' }} />
              <Skeleton type="skeleton-title" style={{ width: '80%', height: '2.5rem' }} />
              <Skeleton type="skeleton-text" style={{ width: '200px', marginBottom: '2rem' }} />
              <Skeleton type="skeleton-rect" style={{ height: '300px', borderRadius: '12px' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) return <div>Error: {error}</div>;
  if (!product) return null;

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        <nav className="breadcrumb-nav">
          <Link to="/">Home</Link>
          <span><ChevronRight size={14} /></span>
          <Link to="/products">Products</Link>
          <span><ChevronRight size={14} /></span>
          <span className="current">{product.name}</span>
        </nav>

        <div className="product-main-content">
          <div className="product-gallery">
            <div
              className="main-image-wrapper"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <ProtectedImage
                src={resolveImageUrl(product.images[selectedImageIndex])}
                alt={product.name}
                className="main-image main-image-zoom"
                style={zoomStyle}
              />
            </div>
            <div className="thumbnail-list">
              {product.images.map((img, index) => (
                <div key={index} className={`thumbnail-item ${selectedImageIndex === index ? 'active' : ''}`} onClick={() => setSelectedImageIndex(index)}>
                  <ProtectedImage src={resolveImageUrl(img)} alt={index} />
                </div>
              ))}
            </div>
          </div>

          <div className="product-info-section">
            <div className="product-brand-name">{product.brand}</div>
            <h1 className="product-title">{product.name}</h1>

            <div className="product-meta-top">
              <span className="rating-summary">
                <Star size={16} fill="currentColor" /> {product.rating} ({product.reviewsCount} Reviews)
              </span>
              <span className="sku-badge">SKU: {product.sku}</span>
            </div>

            <div className="key-features" style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Key Features:</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {product.features.map((f, i) => <li key={i} style={{ marginBottom: '4px' }}>✓ {f}</li>)}
              </ul>
            </div>

            {/* ACTION CARD */}
            <div
              className={isShaking ? 'shake-animation' : ''}
              style={{
                background: '#ffffff',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '2px solid #f1f5f9',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                marginBottom: '1.5rem',
                transition: 'border-color 0.3s, box-shadow 0.3s'
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem' }}>
                ₹{product.price?.toLocaleString()}
              </div>

              {/* Porter Delivery Badge */}
              <div className="porter-delivery-badge" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                background: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '1.5rem',
                color: '#c2410c'
              }}>
                <Truck size={20} style={{ color: '#ea580c', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: '#9a3412', fontWeight: '600' }}>
                    Fast Local Delivery Available in Ludhiana
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#c2410c', marginTop: '2px' }}>
                    Urgent order? We can arrange local delivery through Porter.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
                {!isAdminUser ? (
                  <>
                    <span style={{ fontWeight: '600' }}>Quantity:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px' }}>
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '5px 10px', background: 'none', border: 'none', cursor: 'pointer' }}>-</button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1) {
                            setQuantity(val);
                          }
                        }}
                        style={{
                          width: '50px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          border: 'none',
                          outline: 'none',
                          background: 'none',
                          fontSize: '1rem',
                          color: '#0f172a'
                        }}
                      />
                      <button onClick={() => setQuantity(quantity + 1)} style={{ padding: '5px 10px', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
                    </div>
                  </>
                ) : (
                  <span style={{ fontWeight: '600', color: '#94a3b8', fontStyle: 'italic' }}>Admin View - Purchasing Disabled</span>
                )}
              </div>

              {/* CATALOGUE PDF BUTTON */}
              {product.catalogue && (
                <button
                  onClick={handleViewCatalogue}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#f1f5f9',
                    color: '#ea580c',
                    border: '1.5px solid #ea580c',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '1rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(234, 88, 12, 0.1)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#ea580c'; e.currentTarget.style.color = '#fff'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#ea580c'; }}
                >
                  <FileText size={18} /> Download Technical PDF
                </button>
              )}

              {!isAdminUser && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const user = localStorage.getItem('user');
                      if (!user) { navigate('/login'); return; }
                      dispatch(toggleWishlist(product));
                      showToast(
                        isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
                        isWishlisted ? 'info' : 'success'
                      );
                    }}
                    title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    style={{
                      width: '56px',
                      background: isWishlisted ? '#fef2f2' : '#f8fafc',
                      color: isWishlisted ? '#ef4444' : '#64748b',
                      border: isWishlisted ? '1px solid #fecaca' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    <Heart size={22} fill={isWishlisted ? '#ef4444' : 'none'} />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      padding: '16px',
                      background: '#f1f5f9',
                      color: '#0f172a',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      padding: '16px',
                      background: '#EA580C',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={() => {
                      const userStr = localStorage.getItem('user');
                      if (!userStr) {
                        navigate(`/login?redirect=${encodeURIComponent('/quote?product=' + encodeURIComponent(product.name) + '&quantity=' + quantity)}`);
                      } else {
                        navigate('/quote', { state: { product: product.name, quantity: quantity } });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: '#fff',
                      color: '#ea580c',
                      border: '1.5px solid #ea580c',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <FileText size={18} /> Request Bulk Quote
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.875rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Truck size={18} /> Fast Delivery</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><ShieldCheck size={18} /> Genuine Product</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><RotateCcw size={18} /> 7 Days Return</span>
            </div>
          </div>
        </div>

        <div className="product-details-tabs" style={{ marginTop: '3rem' }}>
          <div className="tabs-header">
            <button className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`} onClick={() => setActiveTab('specs')}>Specifications</button>
            <button className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>Description</button>
          </div>
          <div className="tab-content" style={{ background: 'white', padding: '2rem' }}>
            {activeTab === 'specs' ? (
              <table className="specs-table">
                <tbody>
                  {Object.entries(product.specifications).map(([k, v]) => (
                    <tr key={k}><th>{k}</th><td>{v}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <p>{product.description}</p>}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="related-products-section" style={{ marginTop: '4rem' }}>
            <h2 className="section-title" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Related Products
              <Link to="/products" style={{ fontSize: '0.875rem', color: '#f97316', textDecoration: 'none' }}>View All</Link>
            </h2>
            <div className="related-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {relatedProducts.map(item => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

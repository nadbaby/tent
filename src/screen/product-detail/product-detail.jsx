import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../utils/api';
import ProtectedImage from '../../components/common/ProtectedImage';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '../../redux/cartSlice';
import { toggleWishlist } from '../../redux/wishlistSlice';
import { useToast } from '../../context/ToastContext';
import { isAdmin } from '../../utils/auth';
import ProductCard, { resolveImageUrl } from '../../components/home/ProductCard';
import { Skeleton } from '../../components/common/Skeleton/Skeleton';
import './product-detail.css';

import {
  ShoppingCart, Heart, Share2, ChevronRight, Star, Plus, Minus,
  CheckCircle2, AlertCircle, Truck, ShieldCheck, RotateCcw, FileText,
  Maximize2, PlayCircle, RotateCw, Download, GitCompare, HelpCircle,
  Award, ShieldAlert, Lock, ChevronDown, Check, UserCheck, ThumbsUp
} from 'lucide-react';

let globalProductsCache = null;

const findSeriesProducts = (currentProduct, allData) => {
  if (!currentProduct) return [];
  const currentCat = currentProduct.category || "";
  const currentSubcat = currentProduct.subcategory || "";

  // Filter candidates by same category and subcategory
  let candidates = [];

  const isRailOrHgr = (p) => {
    const text = `${p.name || ''} ${p.category || ''} ${p.subcategory || ''}`.toLowerCase();
    return text.includes('rail') || text.includes('hgr');
  };

  if (isRailOrHgr(currentProduct)) {
    candidates = allData.filter(p => isRailOrHgr(p));
  } else {
    // Start with category and subcategory filtering
    let baseGroup = currentSubcat
      ? allData.filter(p => p.category === currentCat && p.subcategory === currentSubcat)
      : allData.filter(p => p.category === currentCat);

    // Group items strictly by their alphabetic prefix (e.g., LMK, LMF, LM, SK)
    const getAlphabeticPrefix = (name) => {
      if (!name) return "";
      const match = name.match(/^([a-zA-Z]+)/);
      return match ? match[1].toLowerCase() : "";
    };

    const currentPrefix = getAlphabeticPrefix(currentProduct.name);

    if (currentPrefix) {
      baseGroup = baseGroup.filter(p => getAlphabeticPrefix(p.name) === currentPrefix);
    }

    candidates = baseGroup;
  }

  // Sort them numerically by size / number in name
  candidates.sort((a, b) => {
    // If it's a seal, extract dimensions (e.g. "80X96X10")
    const isSeal = currentCat.toLowerCase().includes("seal");
    if (isSeal) {
      const matchA = a.name.match(/^(\d+)/);
      const matchB = b.name.match(/^(\d+)/);
      if (matchA && matchB) {
        const valA = parseInt(matchA[1]);
        const valB = parseInt(matchB[1]);
        if (valA !== valB) return valA - valB;
      }
    }

    // Default numeric sort: extract first contiguous digit sequence in name
    const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
    if (numA !== numB) {
      return numA - numB;
    }
    // Fallback to alphabetical
    return a.name.localeCompare(b.name);
  });

  return candidates;
};



const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const cartItems = useSelector((state) => state.cart.items);
  const isAdminUser = isAdmin();
  const isWishlisted = useSelector((state) => state.wishlist?.items?.some(item => String(item.id) === String(id)));

  const userStr = localStorage.getItem('user');
  let isLudhianaUser = false;
  if (userStr) {
    try {
      const userObj = JSON.parse(userStr);
      const address = userObj.address || '';
      const city = userObj.city || '';
      if (address.toLowerCase().includes('ludhiana') || city.toLowerCase().includes('ludhiana')) {
        isLudhianaUser = true;
      }
    } catch (e) { }
  }

  // States
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center' });
  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeOptions, setSizeOptions] = useState([]);

  // Modal / Interactive States
  const [is360Active, setIs360Active] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [showRatingBreakdown, setShowRatingBreakdown] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [helpfulReviews, setHelpfulReviews] = useState({});
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [seriesProducts, setSeriesProducts] = useState([]);

  // Refs
  const specsRef = useRef(null);

  // Sync quantity with cart
  useEffect(() => {
    if (product) {
      const existingItem = cartItems.find(item => String(item.id) === String(product.id));
      if (existingItem) {
        setQuantity(existingItem.quantity);
      }
    }
  }, [product, cartItems]);

  // Load product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!product) setLoading(true);
      try {
        let dataPromise = fetch(apiUrl(`/api/products/${id}`)).then(res => {
          if (!res.ok) throw new Error('Product not found');
          return res.json();
        });

        let allDataPromise = globalProductsCache
          ? Promise.resolve(globalProductsCache)
          : fetch(apiUrl('/api/products')).then(res => res.ok ? res.json() : []).then(d => {
            globalProductsCache = d;
            return d;
          });

        const [data, allData] = await Promise.all([dataPromise, allDataPromise]);

        // Dynamically enrich features to avoid double checkmarks and add industrial detail
        const dbFeatures = data.features || [];
        const defaultFeatures = [
          "High Load Capacity Engineered",
          "Double-Lip Dual Rubber Seals (2RS)",
          "Chrome Steel Cage (GCr15) Composition",
          "Pre-lubricated with High-Shear Lithium Grease",
          "ABEC-3 / P6 High Precision Standards",
          "Designed for Vibration and Shaft Misalignment"
        ];
        const mergedFeatures = dbFeatures.length > 0 ? dbFeatures : defaultFeatures;
        const cleanedFeatures = mergedFeatures.map(f => f.replace(/^[✓\s•\-]+/, '').trim());

        // Rich Specifications structure
        const brand = data.brand || "FINHY";
        const sku = data.sku || "FB-" + String(data.id || "001").toUpperCase();
        const category = data.category || "Bearings";
        const price = data.price || 1200;
        const mrp = data.mrp || Math.round(price * 1.3);
        const discount = Math.round(((mrp - price) / mrp) * 100);

        const specifications = {
          "Brand": brand,
          "SKU / Part Number": sku,
          "Product Category": category,
          "Cage Material": data.material || "High-Carbon Chromium Steel (GCr15)",
          "Bore Diameter": data.innerDiameter || "20 mm",
          "Outer Diameter": data.outerDiameter || "47 mm",
          "Overall Width": data.width || "14 mm",
          "Static Load Rating (Co)": data.staticLoad || "7.85 kN",
          "Dynamic Load Rating (C)": data.dynamicLoad || "12.80 kN",
          "Limiting Speed": data.limitingSpeed || "14,000 RPM (Grease)",
          "Seal Type": data.sealType || "Rubber Sealed Dual-Lip (2RS)",
          "Radial Clearance": data.clearance || "C3 (Greater than Normal Clearance)",
          "Lubrication Pre-fill": data.lubrication || "Premium Lithium Multipurpose Grease",
          "Working Temperature": "-30°C to +120°C (Extended Range)",
          "Tolerances Grade": "ABEC-3 / ISO Normal Class"
        };

        const enrichedProduct = {
          ...data,
          name: data.name || "Precision Industrial Pillow Block Bearing",
          brand,
          sku,
          category,
          price,
          mrp,
          discount,
          images: data.images || [data.image, data.image, data.image, data.image],
          features: cleanedFeatures,
          specifications,
          rating: data.rating || 4.7,
          reviewsCount: data.reviewsCount || 148,
          description: data.description || "This high-precision industrial bearing block is meticulously engineered to support standard shaft guides and withstand higher radial and axial pressures. Pre-lubricated with high-grade protective lithium grease, it features superior dual-lip rubber seals (2RS) that prevent lubricant leak while keeping dynamic abrasive dust and wet moisture out of the rolling track.",
          overview: "Our professional-grade industrial bearings are structured to optimize motor efficiency, gearbox shafting, agriculture assemblies, and conveyor systems. Made from high-quality chromium steel alloy, they are designed to perform quietly under high vibrational environment, yielding an extended machinery service life of up to 300% compared to carbon steel alternatives.",
          benefits: [
            "Ensures smooth rotation and minimizes dynamic noise under heavy conveyor operations.",
            "Superior protection shields rotating bearings from fine quarry dust or industrial moisture.",
            "Extremely low heat buildup extends mechanical parts lifecycle and saves motor power.",
            "Designed with standard bolt holes for instantaneous mounting and secure shaft lock."
          ],
          maintenance: "Inspect assembly monthly for alignment issues. In standard operations, pre-greasing lasts for a normal lifespan. Re-grease every 6-12 months for heavy-duty 24/7 industrial mill operations.",
          installation: "1. Clean and polish the hosting shaft using a clean cloth.\n2. Ensure the shaft has no metal burrs or pits.\n3. Position the bearing onto the shaft sleeve evenly using a pneumatic pressure cap.\n4. Tighten lock screws to standard torque configurations."
        };

        // Derive default size options
        const bore = data.innerDiameter || specifications["Bore Diameter"];
        const outer = data.outerDiameter || specifications["Outer Diameter"];
        const width = data.width || specifications["Overall Width"];
        let defaultSize = "Standard Size";
        if (bore && outer && width) {
          defaultSize = `${String(bore).replace(/\s*mm/gi, '')} x ${String(outer).replace(/\s*mm/gi, '')} x ${String(width).replace(/\s*mm/gi, '')} mm`;
        } else if (bore) {
          defaultSize = `${bore} Bore`;
        }
        setSelectedSize(defaultSize);

        const options = [defaultSize];
        const isBearing = (data.category || category || "").toLowerCase().includes("bearing");
        if (isBearing) {
          options.push(`${defaultSize} (C3 Clearance)`);
          options.push(`${defaultSize} (CN Standard)`);
        } else {
          options.push(`${defaultSize} (Standard Fit)`);
        }
        setSizeOptions(options);

        setProduct(enrichedProduct);

        // Fetch related products and compute series
        if (allData && allData.length > 0) {
          const filtered = allData.filter(p => String(p.id) !== String(data.id) && String(p.slug) !== String(data.slug));
          let related = [];
          if (data.category) {
            related = filtered.filter(p => p.category === data.category);
          }
          if (related.length < 4 && data.brand) {
            const sameBrand = filtered.filter(p => p.brand === data.brand && !related.find(r => r.id === p.id));
            related = [...related, ...sameBrand];
          }
          if (related.length < 4) {
            const remaining = filtered.filter(p => !related.find(r => r.id === p.id));
            related = [...related, ...remaining];
          }
          setRelatedProducts(related.slice(0, 4));

          // Compute series products using the smart size matcher
          const matchedSeries = findSeriesProducts(enrichedProduct, allData);
          setSeriesProducts(matchedSeries);
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

  // Gallery zoom mouse effect
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ transformOrigin: 'center center' });
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
        console.error("Error opening PDF:", err);
      }
    } else {
      window.open(resolveImageUrl(product.catalogue), '_blank');
    }
  };

  const handleSeriesSelect = (item) => {
    const hasValidSlug = item.slug && item.slug.toLowerCase() !== 'sku' && item.slug.toLowerCase() !== 'default';
    navigate(`/product/${hasValidSlug ? item.slug : item.id}`);
    setShowSeriesModal(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
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
      size: selectedSize,
      replace: true
    }));
    showToast(`${quantity} item(s) added to cart!`, 'success');
  };

  const handleBuyNow = () => {
    if (!product) return;
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

  const handleHelpfulClick = (index) => {
    setHelpfulReviews(prev => ({
      ...prev,
      [index]: (prev[index] || 0) + 1
    }));
  };

  const scrollToSpecs = (e) => {
    e.preventDefault();
    if (specsRef.current) {
      specsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div className="product-main-content">
            <div className="product-gallery">
              <Skeleton type="skeleton-image" style={{ height: '450px', marginBottom: '1rem' }} />
              <div className="thumbnail-list">
                {Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} type="skeleton-rect" style={{ width: '80px', height: '80px', borderRadius: '12px' }} />
                ))}
              </div>
            </div>
            <div className="product-info-section">
              <Skeleton type="skeleton-text" style={{ width: '100px' }} />
              <Skeleton type="skeleton-title" style={{ width: '80%', height: '2.5rem' }} />
              <Skeleton type="skeleton-text" style={{ width: '200px', marginBottom: '2rem' }} />
              <Skeleton type="skeleton-rect" style={{ height: '300px', borderRadius: '16px' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="product-error-container">Error: {error}</div>;
  if (!product) return null;

  // Key stats for features limit
  const visibleFeatures = showAllFeatures ? product.features : product.features.slice(0, 4);
  const hiddenFeaturesCount = product.features.length - 4;



  // FAQ Accordion items
  const faqs = [
    { q: "Is this bearing dust-proof and moisture-proof?", a: "Yes, this bearing is engineered with premium dual-lip rubber seals (marked as 2RS) on both sides. These dual shields actively lock internal grease inside the raceway and prevent atmospheric dust particles, abrasives, or operational moisture from leaking in." },
    { q: "Can this pillow block handle high-vibration applications?", a: "Absolutely. Constructed using heavy-duty chrome steel (GCr15) with an augmented internal clearance (C3), it compensates for thermal extension and high axial/radial vibrations, ensuring continuous lubrication flow and reducing friction." },
    { q: "What is the delivery time within the Ludhiana region?", a: "For customers located inside Ludhiana, we support same-day dispatch and fast transit. Local direct deliveries can be quickly dispatched via Porter or regular local logistic services, bringing items straight to your site." },
    { q: "Does this product come with an installation manual and datasheet?", a: "Yes, standard technical datasheets and dimensional drawings can be viewed or downloaded directly on this page under the Downloads panel, or you can contact our technical support division for specific STEP/CAD drafting files." }
  ];

  return (
    <div className="product-detail-page">
      {/* Top Banner */}
      <div className="promo-top-banner">
        <div className="banner-content">
          <Truck size={16} />
          <span>FREE SHIPPING on all industrial orders above ₹999! Use coupon <strong>MEFIRST</strong> for Flat ₹500 OFF.</span>
        </div>
      </div>

      <div className="product-detail-container">
        {/* Hero Section */}
        <div className="product-main-content">

          {/* LEFT: Premium Product Images Column */}
          <div className="product-gallery">
            <div className="image-card-container">
              {/* Main image wrapper */}
              <div
                className="main-image-wrapper"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {!is360Active ? (
                  <ProtectedImage
                    src={resolveImageUrl(product.images[selectedImageIndex])}
                    alt={product.name}
                    className="main-image main-image-zoom font-orange-bg"
                    style={{ ...zoomStyle, backgroundColor: '#EA580C' }}
                  />
                ) : (
                  <div className="gallery-rotation-viewer" style={{ backgroundColor: '#EA580C' }}>
                    <ProtectedImage
                      src={resolveImageUrl(product.images[0])}
                      alt="Rotation view"
                      className="main-image"
                      style={{ filter: `hue-rotate(${rotationAngle}deg)`, backgroundColor: '#EA580C' }}
                    />
                    <div className="rotation-control-overlay">
                      <span className="rotation-label">Drag slider to rotate 360°</span>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={rotationAngle}
                        onChange={(e) => setRotationAngle(Number(e.target.value))}
                        className="rotation-slider"
                      />
                    </div>
                  </div>
                )}

                {/* Overlaid Badges */}

              </div>

              {/* Special interactive buttons bar */}

            </div>

            {/* Thumbnail list */}
            <div className="thumbnail-list">
              {product.images.map((img, index) => (
                <div
                  key={index}
                  className={`thumbnail-item ${selectedImageIndex === index && !is360Active && !isVideoActive ? 'active' : ''}`}
                  onClick={() => { setSelectedImageIndex(index); setIs360Active(false); setIsVideoActive(false); }}
                  style={{ backgroundColor: '#EA580C' }}
                >
                  <ProtectedImage src={resolveImageUrl(img)} alt={`Thumbnail ${index + 1}`} style={{ backgroundColor: '#EA580C' }} />
                </div>
              ))}
            </div>

            {/* Premium Features / Help / Guarantee Box */}
            <div className="gallery-info-addons">
              {/* Box 1: B2B Support & Assistance */}
              <div className="addon-card support-card">
                <HelpCircle className="addon-icon" size={24} />
                <div className="addon-text">
                  <h4>Need Technical Assistance?</h4>
                  <p>Speak directly with our Ludhiana bearing engineers for custom sizing, compatibility questions, or wholesale supply contracts.</p>
                  <button type="button" onClick={() => window.dispatchEvent(new Event('open-chatbot'))} className="addon-action-btn" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Talk to AI Chat bot
                  </button>
                </div>
              </div>

              {/* Box 2: Quality Certifications & Guarantees */}
              <div className="addon-card assurance-card">
                <div className="assurance-item">
                  <ShieldCheck size={20} className="check-icon" />
                  <div>
                    <h5>100% Genuine Products</h5>
                    <p>All items sourced directly from certified manufacturers with traceability certificates.</p>
                  </div>
                </div>
                {isLudhianaUser && (
                  <div className="assurance-item">
                    <Truck size={20} className="check-icon" />
                    <div>
                      <h5>Ludhiana Local Express</h5>
                      <p>Same-day dispatch and immediate door-step deliveries within Punjab industrial regions.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Product Information Column */}
          <div className="product-info-section">
            <div className="product-brand-row">
              <span className="brand-tag">{product.brand}</span>
              <span className="category-tag">{product.category}</span>
            </div>

            <h1 className="product-title">{product.name}</h1>

            {/* Micro rating popover */}
            <div className="product-meta-top">
              <div
                className="rating-popover-trigger"
                onMouseEnter={() => setShowRatingBreakdown(true)}
                onMouseLeave={() => setShowRatingBreakdown(false)}
              >
                <span className="rating-summary">
                  <Star size={16} fill="currentColor" /> {product.rating}
                </span>
                <span className="review-count">({product.reviewsCount} Reviews)</span>

                {showRatingBreakdown && (
                  <div className="rating-percentage-breakdown">
                    <h5 className="breakdown-title">Customer Ratings</h5>
                    <div className="breakdown-bar-row">
                      <span>5 Star</span>
                      <div className="breakdown-outer-bar"><div className="breakdown-inner-bar" style={{ width: '78%' }}></div></div>
                      <span className="percent-label">78%</span>
                    </div>
                    <div className="breakdown-bar-row">
                      <span>4 Star</span>
                      <div className="breakdown-outer-bar"><div className="breakdown-inner-bar" style={{ width: '15%' }}></div></div>
                      <span className="percent-label">15%</span>
                    </div>
                    <div className="breakdown-bar-row">
                      <span>3 Star</span>
                      <div className="breakdown-outer-bar"><div className="breakdown-inner-bar" style={{ width: '4%' }}></div></div>
                      <span className="percent-label">4%</span>
                    </div>
                    <div className="breakdown-bar-row">
                      <span>2 Star && 1 Star</span>
                      <div className="breakdown-outer-bar"><div className="breakdown-inner-bar" style={{ width: '3%' }}></div></div>
                      <span className="percent-label">3%</span>
                    </div>
                  </div>
                )}
              </div>

              <span className="sku-badge">SKU: {product.sku}</span>
            </div>

            {/* ACTION CARD */}
            <div className={`premium-purchase-card ${isShaking ? 'shake-animation' : ''}`}>
              {/* Pricing breakdown block */}
              <div className="pricing-box">
                <div className="price-tag-row">
                  <span className="main-price">₹{product.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  {product.mrp && product.mrp > product.price && (
                    <span className="mrp-strikethrough">MRP: ₹{product.mrp?.toLocaleString('en-IN')}</span>
                  )}
                </div>
                {product.mrp && product.mrp > product.price && (
                  <div className="savings-row">
                    <span className="save-badge">Save ₹{(product.mrp - product.price).toLocaleString()} ({product.discount}% OFF)</span>
                  </div>
                )}
                {/* <div className="gst-inclusive-label">
                  <CheckCircle2 size={12} className="success-icon" /> Price is inclusive of 18% GST (GST invoice available at checkout)
                </div> */}
              </div>

              {/* Status Badges */}
              <div className="operational-badges-row">
                <span className="badge in-stock-badge"><Check size={12} /> In Stock (Ludihana Store)</span>
                <span className="badge same-day-badge"><Truck size={12} /> Same-Day Dispatch</span>
              </div>

              {/* Local delivery info */}
              {isLudhianaUser && (
                <div className="porter-delivery-alert">
                  <Truck size={18} className="alert-truck-icon" />
                  <div className="alert-text-block">
                    <strong>Urgent Ludhiana Delivery</strong>
                    <span>Immediate dispatch via Porter local delivery is available on request.</span>
                  </div>
                </div>
              )}
              {/* Series Size Selector (Different Products/Sizes in the Series) */}
              {seriesProducts.length > 1 && (
                <div className="series-sizes-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Select Size ({seriesProducts.length} sizes available):
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSeriesModal(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ea580c',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0
                      }}
                    >
                      <Maximize2 size={12} /> View Details
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    maxHeight: seriesProducts.length > 15 ? '180px' : 'none',
                    overflowY: seriesProducts.length > 15 ? 'auto' : 'visible',
                    padding: seriesProducts.length > 15 ? '8px' : '0',
                    border: seriesProducts.length > 15 ? '1px solid #cbd5e1' : 'none',
                    borderRadius: seriesProducts.length > 15 ? '8px' : '0',
                    backgroundColor: seriesProducts.length > 15 ? '#f8fafc' : 'transparent'
                  }}>
                    {seriesProducts.map((item) => {
                      const isCurrent = String(item.id) === String(product.id);
                      const displayCode = item.name;

                      // Bore diameter info from item specs if available
                      const boreVal = item.innerDiameter || (item.specifications && (item.specifications["Bore Diameter"] || item.specifications["bore diameter"]));
                      const hasBoreInName = boreVal ? displayCode.toUpperCase().includes(String(boreVal).replace(/\s*mm/gi, '').toUpperCase()) : false;
                      const boreLabel = (boreVal && !hasBoreInName) ? ` (${String(boreVal).replace(/\s*mm/gi, '')}mm)` : '';

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (!isCurrent) {
                              const hasValidSlug = item.slug && item.slug.toLowerCase() !== 'sku' && item.slug.toLowerCase() !== 'default';
                              navigate(`/product/${hasValidSlug ? item.slug : item.id}`);
                            }
                          }}
                          className={`series-size-pill ${isCurrent ? 'active' : ''}`}
                        >
                          {displayCode}{boreLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity selector */}
              {!isAdminUser ? (
                <div className="purchase-qty-selector">
                  <span className="qty-label">Quantity:</span>
                  <div className="qty-control-buttons">
                    <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1) setQuantity(val);
                      }}
                      className="qty-numeric-input"
                    />
                    <button className="qty-btn" onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="admin-restrict-notice">
                  <Lock size={14} /> Admin View Mode - Purchasing is Disabled
                </div>
              )}

              {/* Action Buttons Grid */}
              {!isAdminUser ? (
                <div className="primary-actions-grid">
                  <button onClick={handleBuyNow} className="btn-buy-now-cta">
                    Buy Now
                  </button>
                  <button onClick={handleAddToCart} className="btn-add-to-cart-cta">
                    <ShoppingCart size={18} /> Add to Cart
                  </button>

                  <div className="secondary-ctas-row">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        const user = localStorage.getItem('user');
                        if (!user) { navigate('/login'); return; }
                        dispatch(toggleWishlist(product));
                        showToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', isWishlisted ? 'info' : 'success');
                      }}
                      className={`wishlist-cta-btn ${isWishlisted ? 'active' : ''}`}
                      style={{ width: '100%' }}
                    >
                      <Heart size={18} fill={isWishlisted ? '#EF4444' : 'none'} />
                      <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
                    </button>
                  </div>

                  <div className="industrial-actions-block">
                    <button onClick={handleViewCatalogue} className="industrial-catalog-btn">
                      <FileText size={16} /> Download Datasheet PDF
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
                      className="industrial-quote-btn"
                    >
                      <FileText size={16} /> Request Bulk Quote
                    </button>
                  </div>
                </div>
              ) : (
                <div className="admin-actions-disabled">
                  <span className="muted-text">Staff log shows purchasing controls are locking.</span>
                </div>
              )}
            </div>

            {/* Cleaner features list with expandable panel */}
            <div className="collapsible-key-features">
              <h4 className="card-section-title">Key Features:</h4>
              <ul className="sanitized-features-list">
                {visibleFeatures.map((f, i) => (
                  <li key={i} className="feature-li">
                    <span className="bullet-circle"><Check size={12} strokeWidth={3} /></span>
                    <span className="feature-text-val">{f}</span>
                  </li>
                ))}
              </ul>
              {product.features.length > 4 && (
                <button onClick={() => setShowAllFeatures(!showAllFeatures)} className="expand-features-btn">
                  {showAllFeatures ? "Show Less" : `+ ${hiddenFeaturesCount} more features...`}
                </button>
              )}
            </div>

            {/* Mini Trust Row */}
            <div className="mini-trust-footer">
              <span className="badge-item"><ShieldCheck size={16} /> Genuine Gear</span>
              {/* <span className="badge-item"><RotateCcw size={16} /> 7-Days Exchange</span> */}
              <span className="badge-item"><Award size={16} /> ISO Approved</span>
            </div>
          </div>
        </div>





        {/* Sticky Detail Tabs (Specs, Description, Downloads, Comparison) */}
        <div ref={specsRef} className="product-tabbed-details">
          <div className="tabs-header-nav">
            <button className={`nav-tab-btn ${activeTab === 'specs' ? 'active' : ''}`} onClick={() => setActiveTab('specs')}>
              Technical Specifications
            </button>
            <button className={`nav-tab-btn ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>
              Product Description
            </button>

          </div>

          <div className="tab-pane-content">
            {/* Tab 1: Specifications */}
            {activeTab === 'specs' && (
              <div className="specs-table-card">
                <table className="premium-specs-table">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <tr key={key}>
                        <th>{key}</th>
                        <td>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Rich Description */}
            {activeTab === 'description' && (
              <div className="description-rich-panel">
                <div className="desc-text-block">
                  <h4>Product Overview</h4>
                  <p>{product.overview}</p>
                </div>
                <div className="desc-text-block">
                  <h4>Key Benefits</h4>
                  <ul className="description-bullets-detail">
                    {product.benefits.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
                <div className="desc-text-block-grid">
                  <div className="block">
                    <h4>Maintenance Guidelines</h4>
                    <p>{product.maintenance}</p>
                  </div>
                  <div className="block">
                    <h4>Installation Guide</h4>
                    <p style={{ whiteSpace: 'pre-line' }}>{product.installation}</p>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="related-products-section">
            <h2 className="section-title-premium">
              Related Transmission Components
              <Link to="/products" className="view-all-link">Browse All Products</Link>
            </h2>
            <div className="related-grid-layout">
              {relatedProducts.map(item => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Mobile Shop Bar */}
      <div className="sticky-mobile-shop-bar">
        <div className="bar-wrapper">
          <div className="price-info">
            <span className="label">Fine Bearing:</span>
            <span className="price-val">₹{product.price?.toLocaleString()}</span>
          </div>
          <div className="button-group">
            <button
              onClick={(e) => {
                e.preventDefault();
                dispatch(toggleWishlist(product));
              }}
              className={`wishlist-icon-btn ${isWishlisted ? 'active' : ''}`}
            >
              <Heart size={20} fill={isWishlisted ? '#EF4444' : 'none'} color={isWishlisted ? '#EF4444' : '#64748b'} />
            </button>
            <button onClick={handleAddToCart} className="btn-mobile-add">Add</button>
            <button onClick={handleBuyNow} className="btn-mobile-buy">Buy Now</button>
          </div>
        </div>
      </div>

      {/* Visual Overlay Modals */}
      {isFullscreenActive && (
        <div className="fullscreen-overlay-modal" onClick={() => setIsFullscreenActive(false)}>
          <button className="close-fullscreen-overlay">Close ×</button>
          <img
            src={resolveImageUrl(product.images[selectedImageIndex])}
            alt="Fullscreen preview"
            className="fullscreen-image-target"
            style={{ backgroundColor: '#EA580C' }}
          />
        </div>
      )}

      {isVideoActive && (
        <div className="fullscreen-overlay-modal" onClick={() => setIsVideoActive(false)}>
          <button className="close-fullscreen-overlay">Close ×</button>
          <div className="modal-video-card-simulator" onClick={(e) => e.stopPropagation()}>
            <div className="loading-spinner-simulator"><RotateCw className="animate-spin" /> Playing Technical Product Preview...</div>
            <div className="demo-placeholder-movie-text" style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
              <h3>Fine Bearing Dynamic Fit Installation Video</h3>
              <p>Simulating 3D structural fitting, shaft alignment guide, and double-lip rubber seal protection demonstration.</p>
            </div>
          </div>
        </div>
      )}

      {/* Series Sizes Modal */}
      {showSeriesModal && (
        <div
          className="fullscreen-overlay-modal"
          onClick={() => setShowSeriesModal(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999
          }}
        >
          <div
            className="series-modal-content animate-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '90%',
              maxWidth: '650px',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Maximize2 size={18} style={{ color: '#ea580c' }} />
                  {product.name.split(/\s+/)[0]} Series Sizing
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Select a size below to view details and pricing.
                </p>
              </div>
              <button
                onClick={() => setShowSeriesModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#64748b',
                  transition: 'all 0.2s ease',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                ×
              </button>
            </div>

            {/* List Container */}
            <div style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {seriesProducts.map((item) => {
                const isCurrent = String(item.id) === String(product.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSeriesSelect(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: isCurrent ? '2px solid #ea580c' : '1px solid #e2e8f0',
                      background: isCurrent ? '#fff7ed' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.borderColor = '#ea580c';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ProtectedImage
                          src={resolveImageUrl(item.image)}
                          alt={item.name}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                          {item.name}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          SKU: {item.sku || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ea580c' }}>
                          ₹{item.price?.toFixed(2)}
                        </div>
                        {isCurrent && (
                          <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 'bold', display: 'block' }}>
                            Currently Viewing
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '100px', padding: '4px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)', marginLeft: '10px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const input = document.getElementById(`qty-${item.id}`);
                            if (input && parseInt(input.value) > 1) {
                              input.value = parseInt(input.value) - 1;
                            }
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ffffff', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', transition: 'all 0.2s ease' }}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          id={`qty-${item.id}`}
                          type="number"
                          min="1"
                          defaultValue={1}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '36px',
                            border: 'none',
                            textAlign: 'center',
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            color: '#0f172a',
                            background: 'transparent',
                            outline: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'textfield'
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const input = document.getElementById(`qty-${item.id}`);
                            if (input) {
                              input.value = parseInt(input.value) + 1;
                            }
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ffffff', border: 'none', cursor: 'pointer', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', transition: 'all 0.2s ease' }}
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const user = localStorage.getItem('user');
                          if (!user) {
                            navigate('/login');
                            return;
                          }
                          const qtyInput = document.getElementById(`qty-${item.id}`);
                          const addQty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

                          dispatch(addItem({
                            id: item.id,
                            name: item.name,
                            price: item.price || 0,
                            image: item.images ? item.images[0] : item.image,
                            quantity: addQty,
                            size: item.specifications ? item.specifications["Bore Diameter"] : "Standard Size",
                            replace: false
                          }));
                          showToast('Item added to cart!', 'success');
                        }}
                        style={{
                          background: '#ea580c',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Add to Cart"
                      >
                        <ShoppingCart size={16} />
                      </button>
                      <ChevronRight size={18} style={{ color: isCurrent ? '#ea580c' : '#94a3b8' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              textAlign: 'right',
              background: '#f8fafc'
            }}>
              <button
                onClick={() => setShowSeriesModal(false)}
                style={{
                  background: '#64748b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#475569'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#64748b'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { addItem } from '../../redux/cartSlice';
import { useToast } from '../../context/ToastContext';
import { apiUrl } from '../../utils/api';
import BrandsSection from '../../components/home/BrandsSection';
import { SkeletonProductGrid, Skeleton } from '../../components/common/Skeleton/Skeleton';
import {
  ArrowRight,
  Search,
  Upload,
  MessageSquare,
  ShieldCheck,
  Warehouse,
  Headphones,
  Truck,
  Globe,
  FileText,
  ShoppingCart,
  Star,
  Settings,
  Cpu,
  Wrench,
  Anchor,
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import './home.css';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Products states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Help states
  const [helperSearch, setHelperSearch] = useState('');
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'loading' | 'success'
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(apiUrl('/api/products'));
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();

        // Normalize specs list & fallback image paths
        const normalizedData = data.map(p => {
          let specObj = {
            'Inner Size': p.innerDiameter || p.innerSize || 'N/A',
            'Outer Size': p.outerDiameter || p.outerSize || 'N/A',
            'Thickness': p.width || p.thickness || 'N/A'
          };

          return {
            ...p,
            image: p.image || '/hero_industrial.png',
            specObj
          };
        });

        setProducts(normalizedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Event handlers
  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    e.preventDefault();

    const user = localStorage.getItem('user');
    if (!user) {
      showToast("Login required to add to cart", "error");
      navigate('/login');
      return;
    }

    dispatch(addItem({
      id: product.id || product._id,
      name: product.name,
      price: product.price || 0,
      image: product.image,
      quantity: 1,
      replace: true
    }));
    showToast(`${product.subcategory || product.name} added to cart`, "success");
  };

  const handleHelperSearchSubmit = () => {
    if (helperSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(helperSearch.trim())}`);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadStatus('loading');
      setTimeout(() => {
        setUploadStatus('success');
      }, 2200);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadStatus('loading');
      setTimeout(() => {
        setUploadStatus('success');
      }, 2200);
    }
  };

  const handleResetUpload = () => {
    setUploadStatus('idle');
  };

  const handleAddScanToCart = () => {
    const mockBearingProduct = {
      id: 'skf-6204',
      name: 'SKF Deep Groove Ball Bearing 6204-2Z',
      subcategory: 'SKF Deep Groove Ball Bearing',
      price: 210,
      image: '/bearing_skf.png'
    };

    const user = localStorage.getItem('user');
    if (!user) {
      showToast("Login required to add to cart", "error");
      navigate('/login');
      return;
    }

    dispatch(addItem({
      id: mockBearingProduct.id,
      name: mockBearingProduct.name,
      price: mockBearingProduct.price,
      image: mockBearingProduct.image,
      quantity: 1,
      replace: true
    }));
    showToast("Identified SKF 6204 Bearing added to Cart", "success");
    setUploadStatus('idle');
  };

  // Slice first 8 active products for showcase grid
  const showcaseProducts = products.filter(p => p.isActive !== false).slice(0, 8);

  return (
    <div className="home-screen">

      {/* 1. HERO SECTION */}
      <section className="hero-section-clean">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="hero-badge">Ludhiana Authorized Industrial Distributor</span>
            <h1 className="hero-title">
              Everything Your Machine Needs. <span className="highlight">All in One Place.</span>
            </h1>
            <p className="hero-subtitle">
              Authorized supplier of high-precision bearings, heavy-duty oil seals, hydraulic pumps, linear rails, and CNC spares. Get genuine components with PAN India door dispatch.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn-clean btn-clean-primary">Shop Products</Link>
              <Link to="/quote" className="btn-clean btn-clean-secondary">Get Quotation</Link>
              <a href="https://wa.me/918146119761?text=Hello%20Fine%20Bearing%20Store%2C%20I%20need%20wholesale%20price%20details%20for%20industrial%20spares."
                target="_blank" rel="noopener noreferrer" className="btn-clean btn-clean-whatsapp">
                <MessageSquare size={18} /> WhatsApp Us
              </a>
            </div>

            <div className="hero-highlights">
              <div className="highlight-item">
                <CheckCircle size={16} /> Genuine SKF, FAG & Nachi
              </div>
              <div className="highlight-item">
                <CheckCircle size={16} /> 100% GST Input Invoices
              </div>
              <div className="highlight-item">
                <CheckCircle size={16} /> 24-Hour Dispatch Guarantee
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-wrapper">
              <img src="/hero_industrial.png" alt="Industrial Bearings and Seals Catalog" className="hero-image" />
              <div className="floating-badge-clean badge-orange-clean">
                <strong>25,000+</strong>
                <span>Items in Stock</span>
              </div>
              <div className="floating-badge-clean badge-black-clean">
                <strong>GST Claim</strong>
                <span>18% Tax Savings</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BENTO CATEGORY GRID */}
      <section className="bento-section-clean">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="section-tag">Quick Jumps</span>
            <h2 className="section-title">Shop by Bento Categories</h2>
            <p className="section-subtitle">Select a product division to view sizes, load parameters, and brands.</p>
          </div>

          <div className="bento-grid-clean">

            {/* Bearings (Large) */}
            <div className="bento-card-clean bento-large-clean bearings-card" onClick={() => navigate('/products?category=Bearings')}>
              <div className="bento-content-clean">
                <div>
                  <span className="bento-card-badge">Most Popular</span>
                  <h3>Precision Ball Bearings</h3>
                  <p>Deep groove, tapered roller, spherical roller, linear motion, and pillow blocks from premium global brands.</p>
                </div>
                <div className="bento-card-footer">
                  <span className="bento-btn-text">Browse Bearings <ArrowRight size={14} /></span>
                  <span className="bento-brand-tag">SKF, FAG, NSK, Nachi</span>
                </div>
              </div>
              <div className="bento-visual-img-clean">
                <img src="/bearing_skf.png" alt="SKF Bearings" />
              </div>
            </div>

            {/* Oil Seals */}
            <div className="bento-card-clean" onClick={() => navigate('/products?category=Seals')}>
              <div className="bento-content-clean">
                <div>
                  <span className="bento-card-badge">Leak-Proof</span>
                  <h3>Rubber Oil Seals</h3>
                  <p>Double lip TC seals, Viton high-temperature, and custom size O-Rings.</p>
                </div>
                <div className="bento-card-footer">
                  <span className="bento-btn-text">Browse Seals <ArrowRight size={14} /></span>
                </div>
              </div>
              <div className="bento-visual-img-clean">
                <img src="/oil_seal_rubber.png" alt="Oil Seals" />
              </div>
            </div>

            {/* Hydraulics */}
            <div className="bento-card-clean" onClick={() => navigate('/products?category=Hydraulics Tools')}>
              <div className="bento-content-clean">
                <div>
                  <span className="bento-card-badge">High Pressure</span>
                  <h3>Hydraulics Spares</h3>
                  <p>Valves, seals, directional control blocks, and heavy equipment lines.</p>
                </div>
                <div className="bento-card-footer">
                  <span className="bento-btn-text">Explore <ArrowRight size={14} /></span>
                </div>
              </div>
              <div className="bento-visual-img-clean">
                <img src="/hydraulic_pump.png" alt="Hydraulic block" />
              </div>
            </div>

            {/* Pumps (Wide) */}
            <div className="bento-card-clean bento-wide-clean" onClick={() => navigate('/products?category=Pump')}>
              <div className="bento-content-clean">
                <div>
                  <span className="bento-card-badge">Heavy Flow</span>
                  <h3>Industrial Gear & Vane Pumps</h3>
                  <p>High performance pumps, Yuken replacements, cooling motors, and fluid power assemblies.</p>
                </div>
                <div className="bento-card-footer">
                  <span className="bento-btn-text">Browse Pumps <ArrowRight size={14} /></span>
                  <span className="bento-brand-tag">Yuken, Polyhydron</span>
                </div>
              </div>
              <div className="bento-visual-img-clean" style={{ width: '170px', height: '170px', bottom: '0px', right: '10px' }}>
                <img src="/hydraulic_pump.png" alt="Gear Pumps" />
              </div>
            </div>

            {/* Linear Guideways */}
            <div className="bento-card-clean bento-wide-clean" onClick={() => navigate('/products?category=Linear Guideway')}>
              <div className="bento-content-clean">
                <div>
                  <span className="bento-card-badge">CNC Machining</span>
                  <h3>Linear Guideway Rails & Blocks</h3>
                  <p>HIWIN high-load carriage blocks, ground rails, ball-screws, and customization cuttings.</p>
                </div>
                <div className="bento-card-footer">
                  <span className="bento-btn-text">Browse Guideways <ArrowRight size={14} /></span>
                  <span className="bento-brand-tag">HIWIN, PMI</span>
                </div>
              </div>
              <div className="bento-visual-img-clean" style={{ width: '170px', height: '170px', bottom: '0px', right: '10px' }}>
                <img src="/hero_industrial.png" alt="Linear Motion" />
              </div>
            </div>

            {/* Couplings */}
            <div className="bento-card-clean" onClick={() => navigate('/products?category=Coupling')}>
              <div className="bento-content-clean">
                <div>
                  <span className="bento-card-badge">Transmission</span>
                  <h3>Flexible Jaw Couplings</h3>
                  <p>Lovejoy, jaw spiders, gear couplings, and electric motor coupling blocks.</p>
                </div>
                <div className="bento-card-footer">
                  <span className="bento-btn-text">Browse <ArrowRight size={14} /></span>
                </div>
              </div>
              <div className="bento-visual-img-clean">
                <img src="/bearing_skf.png" alt="Coupling spacer" />
              </div>
            </div>

            {/* CNC Spares */}
            <div className="bento-card-clean" onClick={() => navigate('/products?category=CNC Machine Spares')}>
              <div className="bento-content-clean">
                <div>
                  <span className="bento-card-badge">High Precision</span>
                  <h3>CNC Router Spindle Spares</h3>
                  <p>High speed collets, ER chucks, spindle motors, brackets, and controllers.</p>
                </div>
                <div className="bento-card-footer">
                  <span className="bento-btn-text">Browse CNC <ArrowRight size={14} /></span>
                </div>
              </div>
              <div className="bento-visual-img-clean">
                <img src="/hero_industrial.png" alt="CNC spindle motor" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE HELPER SECTION */}
      <section className="helper-section-clean">
        <div className="container">
          <div className="helper-container-clean">
            <div className="helper-header-clean">
              <div className="helper-icon-wrapper-clean">
                <Wrench size={26} />
              </div>
              <h2>Not Sure Which Industrial Part You Need?</h2>
              <p>Don't worry! We have three easy helper routes designed for purchasing department managers, factory mechanics, and traders.</p>
            </div>

            <div className="helper-grid-clean">

              {/* Option A: Search model number */}
              <div className="helper-card-clean">
                <div className="helper-card-icon-clean">
                  <Search size={20} />
                </div>
                <h3>1. Search Serial / Dimension</h3>
                <p>Type the bearing code, oil seal dimensions (e.g. 40x62x10), or brand series directly below to find immediate catalog matches.</p>
                <div className="helper-input-group-clean">
                  <input
                    type="text"
                    placeholder="e.g. 6204, 40-62-10..."
                    value={helperSearch}
                    onChange={(e) => setHelperSearch(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleHelperSearchSubmit(); }}
                  />
                  <button onClick={handleHelperSearchSubmit} aria-label="Submit search">
                    <Search size={16} />
                  </button>
                </div>
              </div>

              {/* Option B: Photo upload scanner */}
              <div className="helper-card-clean">
                <div className="helper-card-icon-clean">
                  <Upload size={20} />
                </div>
                <h3>2. Scan Machinery Part Photo</h3>
                <p>Upload a clear photo of your old bearing or oil seal stamp. Our scanner will read the text/dimensions to identify the replacement part.</p>

                {uploadStatus === 'idle' && (
                  <div
                    className="photo-upload-zone-clean"
                    onClick={triggerFileSelect}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <Upload size={32} className="upload-icon-clean" />
                    <span className="upload-text-clean">Click or Drag Image Here</span>
                    <span className="upload-subtext-clean">Supports PNG, JPG, JPEG</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                )}

                {uploadStatus === 'loading' && (
                  <div className="upload-status-box-clean">
                    <div className="spinner-container-clean">
                      <div className="simple-spinner-clean"></div>
                      <span>Analyzing machinery stamp...</span>
                    </div>
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="upload-result-box-clean">
                    <div className="result-header-clean">
                      <CheckCircle size={16} /> Identified Part Details
                    </div>
                    <div className="result-details-clean">
                      <strong>SKF Ball Bearing 6204-2Z / C3</strong>
                      <span>Brand: SKF | Stock: <span className="stock-status-clean in-stock">In Stock</span></span>
                      <span>Price: ₹210.00 (+18% claimable GST)</span>
                    </div>
                    <div className="result-actions-clean">
                      <button className="btn-clean btn-clean-primary btn-sm-clean" onClick={handleAddScanToCart}>
                        Add to Cart
                      </button>
                      <button className="btn-clean btn-clean-secondary btn-sm-clean" onClick={handleResetUpload}>
                        <RotateCcw size={12} /> Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Option C: WhatsApp Chat */}
              <div className="helper-card-clean whatsapp-special-clean">
                <div className="helper-card-icon-clean" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                  <MessageSquare size={20} />
                </div>
                <h3>3. Consult Ludhiana Experts</h3>
                <p>Not sure about clearances or temperature ratings? Send a photo on WhatsApp to our senior sales engineers for direct manual identification.</p>
                <a
                  href="https://wa.me/918146119761?text=Hello%20Fine%20Bearing%20Store%2C%20I%20have%20attached%20a%20photo%20of%20a%20machinery%20part.%20Please%20help%20me%20identify%20and%20quote%20its%20price."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-clean btn-clean-whatsapp w-full"
                >
                  <MessageSquare size={16} /> Chat on WhatsApp
                </a>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 4. POPULAR SOLUTIONS GRID */}
      <section className="products-section-clean">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="section-tag">Hot Products</span>
            <h2 className="section-title">Popular Industrial Solutions</h2>
            <p className="section-subtitle">Direct pricing and quote requests for high-turnover spares.</p>
          </div>

          {loading ? (
            <SkeletonProductGrid count={4} />
          ) : (
            <div className="product-grid-clean">
              {showcaseProducts.map((p) => {
                const isPriced = p.price && p.price > 0;
                return (
                  <div key={p.id || p._id} className="product-card-clean">
                    <div className="product-card-top-clean" onClick={() => navigate(`/product/${p.slug || p.id || p._id}`)} style={{ cursor: 'pointer' }}>
                      <div className="badge-row-clean">
                        <span className="badge-stock-clean">In Stock</span>
                        <span className="badge-brand-clean">{p.brand || 'Premium'}</span>
                      </div>
                      <div className="product-card-img-wrapper-clean">
                        <img src={p.image} alt={p.name} />
                      </div>
                    </div>

                    <div className="product-details-clean" onClick={() => navigate(`/product/${p.slug || p.id || p._id}`)} style={{ cursor: 'pointer' }}>
                      <span className="product-model-clean">{p.sku || p.category}</span>
                      <h3 className="product-name-clean">{p.name || p.subcategory}</h3>

                      <div className="product-specs-clean">
                        <div className="spec-line-clean">
                          <span>Sizes:</span>
                          <span>{p.innerSize || p.innerDiameter ? `${p.innerSize || p.innerDiameter} mm` : 'Standard'}</span>
                        </div>
                        <div className="spec-line-clean">
                          <span>Subcategory:</span>
                          <span>{p.subcategory || 'Standard'}</span>
                        </div>
                      </div>

                      <div className="product-pricing-clean">
                        {isPriced ? (
                          <>
                            <span className="product-price-clean">₹{p.price}</span>
                            {p.mrp && <span className="product-price-mrp-clean">₹{p.mrp}</span>}
                          </>
                        ) : (
                          <span className="product-price-ask-clean">Ask Best Price</span>
                        )}
                      </div>
                    </div>

                    <div className="product-actions-clean">
                      {isPriced ? (
                        <button className="btn-clean btn-clean-primary" onClick={(e) => handleAddToCart(e, p)}>
                          <ShoppingCart size={16} /> Add to Cart
                        </button>
                      ) : (
                        <Link to={`/quote?product=${encodeURIComponent(p.name)}`} className="btn-clean btn-clean-secondary">
                          <FileText size={16} /> Request Quote
                        </Link>
                      )}

                      <a href={`https://wa.me/918146119761?text=Hello%20Fine%20Bearing%20Store%2C%20I%20am%20enquiring%20about%20the%20price%20of%20${encodeURIComponent(p.name)}.`}
                        target="_blank" rel="noopener noreferrer" className="btn-clean btn-clean-whatsapp">
                        <MessageSquare size={16} /> WhatsApp Enquiry
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>


      {/* 5. BULK DISCOUNT ACCENT BANNER */}
      <section className="bulk-banner-clean">
        <div className="container banner-content-clean">
          <div className="banner-text-clean">
            <span className="banner-badge-clean">Wholesale Dealers</span>
            <h2>Factory Procurement & Bulk Order Discounts</h2>
            <p>Traders, machine fabricators, and factory managers qualify for direct wholesale margin tiering on large lists. Send us your excel list/indent directly for custom pricing.</p>
          </div>
          <div className="banner-actions-clean">
            <Link to="/quote" className="btn-clean btn-clean-secondary" style={{ backgroundColor: '#ffffff', color: 'var(--color-primary)' }}>
              Request Bulk Quote
            </Link>
            <a href="https://wa.me/918146119761?text=Hello%20Fine%20Bearing%20Store%2C%20I%20want%20to%20send%20my%20bearing%20size%20requirement%20list%20for%20a%20bulk%20price%20quote."
              target="_blank" rel="noopener noreferrer" className="btn-clean btn-clean-whatsapp" style={{ backgroundColor: '#ffffff', color: '#16a34a' }}>
              Send Indent List
            </a>
          </div>
        </div>
      </section>

      {/* 6. TRUST BUILDING SECTION */}
      <section className="trust-section-clean">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="section-tag">Why Fine Bearing</span>
            <h2 className="section-title">Industrial Reliability Guaranteed</h2>
            <p className="section-subtitle">Serving industries, agricultural sectors, and CNC workshops across India.</p>
          </div>

          <div className="trust-grid-clean">

            <div className="trust-card-clean">
              <div className="trust-icon-clean">
                <ShieldCheck size={20} />
              </div>
              <h3>100% Genuine Brands</h3>
              <p>Direct supply paths. We supply genuine SKF, Nachi, HIWIN, Yuken, FAG, and NTN products with complete manufacturer credentials.</p>
            </div>

            <div className="trust-card-clean">
              <div className="trust-icon-clean">
                <Warehouse size={20} />
              </div>
              <h3>Huge Stock Holdings</h3>
              <p>Over 25,000+ codes and sizes stored locally in our Ludhiana warehouse to ensure zero machinery maintenance waiting times.</p>
            </div>

            <div className="trust-card-clean">
              <div className="trust-icon-clean">
                <Headphones size={20} />
              </div>
              <h3>Technical Consultation</h3>
              <p>Experienced team of mechanical sales engineers to help you select load tolerances, NBR vs Viton rubber seals, and correct clearances.</p>
            </div>

          </div>
        </div>
      </section>

      {/* 7. AUTHORIZED BRANDS ENDLESS MARQUEE */}
      <BrandsSection />

      {/* 8. INDUSTRIES WE SERVE */}
      <section className="industry-section-clean">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="section-tag">Applications</span>
            <h2 className="section-title">Industries We Cater To</h2>
            <p className="section-subtitle">Supplying high durability spares optimized for critical stress levels.</p>
          </div>

          <div className="industry-grid-clean">

            <div className="industry-card-clean">
              <div className="industry-icon-clean">
                <Settings size={24} />
              </div>
              <h3>CNC Machinery</h3>
              <p>High speed bearings, HIWIN carriages, ER series collets, chucks, and precision spindle motors.</p>
            </div>

            <div className="industry-card-clean">
              <div className="industry-icon-clean">
                <Cpu size={24} />
              </div>
              <h3>General Manufacturing</h3>
              <p>Electric motors, shaft gear couplings, fan bearings, and high temperature synthetic lubricants.</p>
            </div>

            <div className="industry-card-clean">
              <div className="industry-icon-clean">
                <Wrench size={24} />
              </div>
              <h3>Agricultural Machines</h3>
              <p>Pillow block units, combine harvester bearings, dust-shielded seals, and heavy tillage spares.</p>
            </div>

            <div className="industry-card-clean">
              <div className="industry-icon-clean">
                <Anchor size={24} />
              </div>
              <h3>Hydraulic Presses</h3>
              <p>Yuken replacement gear pumps, vane components, directional spool valves, and heavy rubber packing seals.</p>
            </div>

            <div className="industry-card-clean">
              <div className="industry-icon-clean">
                <Settings size={24} />
              </div>
              <h3>Textile Mills</h3>
              <p>High RPM bearings, needle rollers, low friction seals, and precise linear carriage guides.</p>
            </div>

            <div className="industry-card-clean">
              <div className="industry-icon-clean">
                <Wrench size={24} />
              </div>
              <h3>Heavy Machinery</h3>
              <p>Large tapered roller bearings, double-acting pneumatic cylinders, and durable transmission components.</p>
            </div>

          </div>
        </div>
      </section>

      {/* 9. GOOGLE LOCAL REVIEWS */}
      <section className="reviews-section-clean">
        <div className="container reviews-container-clean">

          <div className="reviews-summary-card-clean">
            <span className="google-badge-clean">Google Verified</span>
            <h3>4.8 / 5.0 Stars</h3>
            <div className="stars-row-clean">
              <Star size={20} className="star-filled-clean" />
              <Star size={20} className="star-filled-clean" />
              <Star size={20} className="star-filled-clean" />
              <Star size={20} className="star-filled-clean" />
              <Star size={20} className="star-filled-clean" />
            </div>
            <p>Based on 420+ reviews from Ludhiana mills, traders, and engineers.</p>
          </div>

          <div className="reviews-grid-clean">

            <div className="review-card-clean">
              <div className="review-header-clean">
                <div className="reviewer-avatar-clean">KK</div>
                <div className="reviewer-info-clean">
                  <h4>Karan Kumar</h4>
                  <span>CNC Workshop Owner, Ludhiana</span>
                </div>
                <div className="review-stars-clean">
                  5.0 <Star size={12} />
                </div>
              </div>
              <p>"Excellent stock of HIWIN linear blocks and CNC spares. Most traders take 3 days to source them, but Fine Bearing supplied genuine components immediately from Ludhiana warehousing. Highly recommended!"</p>
            </div>

            <div className="review-card-clean">
              <div className="review-header-clean">
                <div className="reviewer-avatar-clean">AS</div>
                <div className="reviewer-info-clean">
                  <h4>Amit Singh</h4>
                  <span>Procurement Manager, Agricultural Spares</span>
                </div>
                <div className="review-stars-clean">
                  5.0 <Star size={12} />
                </div>
              </div>
              <p>"Using their rubber oil seals and SKF bearings for our harvester gearboxes. Excellent wear life, double lip seal stays clean in heavy dust fields. Appreciate their Whatsapp quotation speed!"</p>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
};

export default Home;

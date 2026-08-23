import React, { useState, useEffect, useMemo } from 'react';
import { apiUrl } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Search, Package, ChevronRight, SlidersHorizontal, Grid, Tag, AlertCircle } from 'lucide-react';
import { resolveImageUrl } from '../../components/home/ProductCard';
import './brands.css';

// Dynamically import all brand logos from assets
const logoModules = import.meta.glob('../../assets/Logo/*.webp', { eager: true, import: 'default' });

const getBrandLogo = (brandName) => {
  if (!brandName) return null;
  const normalized = brandName.toLowerCase();

  const matchKey = Object.keys(logoModules).find(path => {
    const filename = path.split('/').pop().toLowerCase().replace('.webp', '');
    return filename === normalized || filename.includes(normalized) || normalized.includes(filename);
  });

  return matchKey ? logoModules[matchKey] : null;
};

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandType, setBrandType] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch(apiUrl('/api/brands/metadata'));
        if (!response.ok) throw new Error('Failed to fetch brand data');
        const data = await response.json();
        setBrands(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  // Derived filter options
  const brandTypes = ['All', ...new Set(brands.map(b => b.category))];

  // Filtering & Sorting
  const processedBrands = useMemo(() => {
    let result = brands.filter(b =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (brandType === 'All' || b.category === brandType)
    );

    if (sortBy === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'name-desc') result.sort((a, b) => b.name.localeCompare(a.name));
    if (sortBy === 'most-products') result.sort((a, b) => b.count - a.count);

    return result;
  }, [brands, searchTerm, brandType, sortBy]);

  const handleBrandClick = (brandName) => {
    navigate(`/products?brand=${encodeURIComponent(brandName)}`);
  };

  if (loading) return (
    <div className="brands-loading-state">
      <div className="spinner"></div>
      <p>Fetching authorized brands...</p>
    </div>
  );

  if (error) return (
    <div className="brands-error-state">
      <AlertCircle size={48} />
      <h2>Data Load Failed</h2>
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="brands-listing-layout">
      <div className="container">
        <div className="brands-main-grid-wrapper">

          {/* Sidebar */}
          <aside className="brands-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-group">
                <h3 className="sidebar-title">Search</h3>
                <div className="sidebar-search-wrapper">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search brands..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="sidebar-group">
                <h3 className="sidebar-title">Brand Type</h3>
                <div className="brand-type-filters">
                  {brandTypes.map(type => (
                    <label key={type} className="radio-filter">
                      <input
                        type="radio"
                        name="brandType"
                        checked={brandType === type}
                        onChange={() => setBrandType(type)}
                      />
                      <span className="radio-label">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="brands-content-area">
            {/* Toolbar */}
            <div className="brands-toolbar">
              <div className="toolbar-left">
                Showing <span>{processedBrands.length}</span> brands
              </div>
              <div className="toolbar-right">
                <div className="sort-box">
                  <SlidersHorizontal size={14} />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="default">Default Sorting</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="most-products">Most Products</option>
                  </select>
                </div>
                <button className="toolbar-filter-icon">
                  <Grid size={18} />
                </button>
              </div>
            </div>

            {/* Grid */}
            {processedBrands.length === 0 ? (
              <div className="brands-empty-state">
                <Tag size={64} strokeWidth={1} />
                <h3>No brands found</h3>
                <p>Try searching for a different manufacturer.</p>
              </div>
            ) : (
              <div className="brands-product-grid">
                {processedBrands.map((brand) => (
                  <div
                    key={brand.name}
                    className="brand-listing-card"
                    onClick={() => handleBrandClick(brand.name)}
                  >
                    <div className="brand-card-top">
                      {getBrandLogo(brand.name) ? (
                        <div className="brand-official-logo-wrapper">
                          <img
                            src={getBrandLogo(brand.name)}
                            alt={`${brand.name} Logo`}
                            className="official-logo-img"
                          />
                        </div>
                      ) : brand.sampleImage ? (
                        <img
                          src={resolveImageUrl(brand.sampleImage)}
                          alt={brand.name}
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div className="brand-placeholder" style={{ display: (!getBrandLogo(brand.name) && !brand.sampleImage) ? 'flex' : 'none' }}>
                        {brand.name.charAt(0)}
                      </div>
                    </div>

                    <div className="brand-card-body">
                      <span className="brand-tag">BRAND</span>
                      <div className="brand-badge">
                        <Package size={12} />
                        {brand.count} Products
                      </div>
                      <h2 className="brand-name-title">{brand.name}</h2>
                      <p className="brand-short-desc">
                        Official authorized dealer for premium {brand.name} industrial components and machinery parts.
                      </p>
                    </div>

                    <div className="brand-card-footer">
                      <span>Browse Products</span>
                      <ChevronRight size={6} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Brands;

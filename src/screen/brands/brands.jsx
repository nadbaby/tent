import React, { useState, useEffect, useMemo } from 'react';
import { apiUrl } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Search, Package, ChevronRight, SlidersHorizontal, Grid, Tag, AlertCircle } from 'lucide-react';
import { resolveImageUrl } from '../../components/home/ProductCard';
import './brands.css';

const Brands = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandType, setBrandType] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(apiUrl('/api/products'));
        if (!response.ok) throw new Error('Failed to fetch brand data');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Derive brands from product data
  const brands = useMemo(() => {
    const brandMap = {};
    products.forEach(p => {
      if (!p.brand) return;
      if (!brandMap[p.brand]) {
        brandMap[p.brand] = {
          name: p.brand,
          count: 0,
          sampleImage: null,
          category: p.category || 'Industrial'
        };
      }
      brandMap[p.brand].count++;
      if (!brandMap[p.brand].sampleImage && p.image) {
        brandMap[p.brand].sampleImage = p.image;
      }
    });
    return Object.values(brandMap);
  }, [products]);

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
                      {brand.sampleImage ? (
                        <img
                          src={resolveImageUrl(brand.sampleImage)}
                          alt={brand.name}
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div className="brand-placeholder" style={{ display: brand.sampleImage ? 'none' : 'flex' }}>
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

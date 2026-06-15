import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../utils/api';
import { useLocation } from 'react-router-dom';
import ProductCard, { resolveImageUrl } from '../../components/home/ProductCard';
import { Filter, ChevronDown, Search, Grid, List, SlidersHorizontal, Plus, X, Save, Download, Upload } from 'lucide-react';
import { isAdmin, getAuthToken } from '../../utils/auth';
import * as XLSX from 'xlsx';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Skeleton, SkeletonProductGrid } from '../../components/common/Skeleton/Skeleton';
import './products.css';

const Products = () => {
// ... existing state
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const brandParam = queryParams.get('brand');
  const categoryParam = queryParams.get('category');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subcategoryParam = queryParams.get('subcategory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'All');
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryParam || 'All');
  const [selectedBrand, setSelectedBrand] = useState(brandParam || 'All');
  const [sortBy, setSortBy] = useState('default');
  
  // Pagination / Infinite Scroll
  const [visibleCount, setVisibleCount] = useState(12);
  const observerTarget = useRef(null);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, selectedCategory, selectedSubcategory, selectedBrand, sortBy]);



  const [uploading, setUploading] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [uploadingCatalogue, setUploadingCatalogue] = useState(false);

  // Bulk Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);

  // Admin State
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const downloadTemplate = () => {
    const templateData = [
      {
        "Product ID": "",
        "Product Name": "Sample Product",
        "SKU": "SKU123",
        "Slug": "",
        "Brand": "Fine Bearing",
        "Category": "Ball Bearings",
        "Subcategory": "Deep Groove",
        "Price": 1200,
        "Stock": 50,
        "Technical PDF Catalogue": "https://example.com/catalog.pdf",
        "Main Image URL": "https://example.com/image.jpg",
        "Additional Images": "https://example.com/img2.jpg, https://example.com/img3.jpg",
        "Keywords (comma separated)": "bearing, industrial, steel",
        "HSN Code": "8482",
        "Description": "High quality industrial bearing",
        "Features (One per line)": "Premium Steel\nLong Life\nLow Noise",
        "Specifications (Key: Value per line)": "Material: Chrome Steel\nWeight: 0.5kg\nInner Diameter: 25mm"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Template");
    XLSX.writeFile(wb, "Product_Bulk_Import_Template.xlsx");
  };
  const initialFormData = {
    id: "",
    sku: "",
    name: "",
    slug: "",
    brand: "",
    category: "",
    subcategory: "",
    price: "",
    stock: "",
    description: "",
    image: "",
    images: [],
    features: "",
    specifications: "",
    catalogue: "",
    isActive: true,
    keywords: "",
    primaryKey: "",
    secondaryKey: "",
    hsnCode: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const admin = isAdmin();
  const token = getAuthToken();

  const fetchProducts = async () => {
    try {
      const response = await fetch(apiUrl('/api/products'));
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();

      const normalizedData = data.map(p => ({
        ...p,
        specs: p.description ? p.description.substring(0, 60) + '...' : (p.subcategory || p.brand)
      }));
      setProducts(normalizedData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Direct Cloudinary upload helper (bypasses backend)
  const CLOUDINARY_CLOUD = 'dn9atz3us';
  const CLOUDINARY_PRESET = 'finebear_unsigned';

  const uploadToCloudinary = async (file, folder = 'products', resourceType = 'auto') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_PRESET);
    fd.append('folder', folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`, {
      method: 'POST',
      body: fd,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || 'Cloudinary upload failed');
    }

    return await res.json();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, 'products');
      setFormData(prev => ({ ...prev, image: result.secure_url }));
      alert('Image uploaded successfully!');
    } catch (err) {
      alert('Error uploading image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAdditionalImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAdditional(true);
    try {
      const result = await uploadToCloudinary(file, 'products');
      setFormData(prev => ({ ...prev, images: [...prev.images, result.secure_url] }));
    } catch (err) {
      alert('Error uploading additional image: ' + err.message);
    } finally {
      setUploadingAdditional(false);
    }
  };


  const handleCatalogueUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file only.");
      return;
    }

    setUploadingCatalogue(true);
    
    try {
      // Cloudinary Raw Upload - Extremely reliable, bypasses most restrictions
      const result = await uploadToCloudinary(file, 'catalogues', 'raw');
      setFormData(prev => ({ ...prev, catalogue: result.secure_url }));
      alert('Catalogue PDF uploaded successfully! It is now securely stored.');
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      alert('Error uploading catalogue: ' + err.message);
    } finally {
      setUploadingCatalogue(false);
    }
  };


  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);
    try {
      const response = await fetch(apiUrl("/api/admin/products/bulk-import"), {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        let msg = `Bulk Import Result:\n- Total rows processed: ${result.totalRows}\n- Successfully imported/updated: ${result.importedCount}`;
        
        if (result.errors && result.errors.length > 0) {
          msg += `\n\n⚠️ Some rows had issues:\n${result.errors.slice(0, 5).join('\n')}`;
          if (result.errors.length > 5) msg += `\n...and ${result.errors.length - 5} more errors.`;
          msg += `\n\nPlease check your headers and data types.`;
        }
        
        alert(msg);
        fetchProducts(); // Refresh the list
      } else {
        alert("Import failed: " + (result.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Bulk import error:", err);
      alert("Error during bulk import. Please check connection and file format.");
    } finally {
      setImporting(false);
      // Clear the input
      e.target.value = "";
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    if (name === "keywords") {
      setFormData(prev => {
        const updated = { ...prev, keywords: value };
        // Auto-generate keys if they are empty
        if (!prev.primaryKey) {
          updated.primaryKey = value.split(',')[0].trim().toLowerCase().replace(/\s+/g, '_');
        }
        if (!prev.secondaryKey) {
          const parts = value.split(',');
          if (parts.length > 1) {
            updated.secondaryKey = parts[1].trim().toLowerCase().replace(/\s+/g, '_');
          }
        }
        return updated;
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowAdminForm(false);
  };

  const preparePayload = () => {
    const payload = { ...formData };
    payload.id = payload.id === "" ? null : Number(payload.id);
    payload.price = payload.price === "" ? null : Number(payload.price);
    payload.stock = payload.stock === "" ? null : Number(payload.stock);

    if (typeof payload.features === 'string') {
      payload.features = payload.features.split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (typeof payload.specifications === 'string') {
      const specs = {};
      payload.specifications.split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > -1) {
          const key = line.substring(0, idx).trim();
          const val = line.substring(idx + 1).trim();
          if (key) specs[key] = val;
        }
      });
      payload.specifications = specs;
    }
    return payload;
  };

  const handleAddProduct = async () => {
    try {
      const response = await fetch(apiUrl('/api/products'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preparePayload())
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setFormData({
      id: product.id || "",
      sku: product.sku || "",
      name: product.name || "",
      slug: product.slug || "",
      brand: product.brand || "",
      category: product.category || "",
      subcategory: product.subcategory || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      description: product.description || "",
      image: product.image || "",
      images: Array.isArray(product.images) ? product.images : [],
      features: Array.isArray(product.features) ? product.features.join("\n") : (product.features || ""),
      specifications: product.specifications
        ? Object.entries(product.specifications).map(([k, v]) => `${k}: ${v}`).join('\n')
        : "",
      catalogue: product.catalogue || "",
      isActive: product.isActive ?? true,
      keywords: product.keywords || "",
      primaryKey: product.primaryKey || "",
      secondaryKey: product.secondaryKey || "",
      hsnCode: product.hsnCode || "",
    });
    setShowAdminForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateProduct = async () => {
    try {
      const response = await fetch(apiUrl(`/api/products/${editingId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preparePayload()),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update product");
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(apiUrl(`/api/products/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete product');
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const categories = ['All', ...new Set(products.map(cat => cat.category).filter(Boolean))];
  const subcategories = ['All', ...new Set(products.filter(p => selectedCategory === 'All' || p.category === selectedCategory).map(p => p.subcategory).filter(Boolean))];
  const searchParam = queryParams.get('search');
  const [debouncedSearch, setDebouncedSearch] = useState('');
 
  useEffect(() => {
    if (searchParam) setSearchTerm(searchParam);
    if (categoryParam) setSelectedCategory(categoryParam);
    if (subcategoryParam) setSelectedSubcategory(subcategoryParam);
    if (brandParam) setSelectedBrand(brandParam);
  }, [searchParam, categoryParam, subcategoryParam, brandParam]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getProductScore = (p, searchStr) => {
    if (!searchStr) return 1;
    let score = 0;
    const s = searchStr.toLowerCase();
    const terms = s.split(/\s+/).filter(Boolean);

    if (p.sku && p.sku.toLowerCase() === s) score += 1000;
    else if (p.sku && p.sku.toLowerCase().includes(s)) score += 500;

    if (p.name && p.name.toLowerCase().includes(s)) score += 300;

    const SYNONYMS = {
      'bearing': ['ball bearing', 'roller bearing', 'thrust bearing', 'taper', 'pillow block'],
      'seal': ['o-ring', 'gasket', 'oil seal'],
      'motor': ['engine', 'drive'],
      'belt': ['v-belt', 'timing belt'],
    };

    let allTerms = [...terms];
    terms.forEach(t => {
      Object.keys(SYNONYMS).forEach(key => {
        if (t === key || SYNONYMS[key].includes(t)) {
          allTerms = [...allTerms, key, ...SYNONYMS[key]];
        }
      });
    });
    
    allTerms = [...new Set(allTerms)];

    allTerms.forEach(term => {
      if (p.name && p.name.toLowerCase().includes(term)) score += 100;
      if (p.brand && p.brand.toLowerCase().includes(term)) score += 80;
      if (p.category && p.category.toLowerCase().includes(term)) score += 60;
      if (p.subcategory && p.subcategory.toLowerCase().includes(term)) score += 50;
      if (p.keywords && p.keywords.toLowerCase().includes(term)) score += 40;
      if (p.slug && p.slug.toLowerCase().includes(term)) score += 30;
      if (p.description && p.description.toLowerCase().includes(term)) score += 10;
      if (p.specifications && JSON.stringify(p.specifications).toLowerCase().includes(term)) score += 10;
    });

    return score;
  };

  const filteredProducts = products
    .map(p => ({
      ...p,
      searchScore: getProductScore(p, debouncedSearch)
    }))
    .filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSubcategory = selectedSubcategory === 'All' || p.subcategory === selectedSubcategory;
      const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
      return p.searchScore > 0 && matchesCategory && matchesSubcategory && matchesBrand;
    })
    .sort((a, b) => {
      // If sortBy is 'default' and searching, use searchScore
      if (sortBy === 'default' && debouncedSearch) {
        if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore;
      }
      
      switch (sortBy) {
        case 'price-low':
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case 'price-high':
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'newest':
          return (b.id || 0) - (a.id || 0);
        default:
          // Fallback to search score if searching, otherwise no change
          if (debouncedSearch) return b.searchScore - a.searchScore;
          return 0;
      }
    });

  const [didYouMean, setDidYouMean] = useState('');
  useEffect(() => {
    if (debouncedSearch && filteredProducts.length === 0) {
      const words = debouncedSearch.toLowerCase().split(' ');
      const suggestion = products.find(p => 
        words.some(w => w.length > 3 && (
          (p.name && p.name.toLowerCase().includes(w)) || 
          (p.category && p.category.toLowerCase().includes(w))
        ))
      );
      if (suggestion) {
        setDidYouMean(suggestion.category || suggestion.name.split(' ')[0]);
      } else {
        setDidYouMean('');
      }
    } else {
      setDidYouMean('');
    }
  }, [debouncedSearch, filteredProducts.length, products]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 12);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [products, filteredProducts, visibleCount]); 


  if (loading) {
    return (
      <div className="products-page">
        <div className="container">
          <div className="products-layout">
            <aside className="filters-sidebar">
              <div className="filter-group">
                <Skeleton type="skeleton-title" style={{ width: '40%' }} />
                <Skeleton type="skeleton-rect" style={{ height: '40px', borderRadius: '8px' }} />
              </div>
              <div className="filter-group">
                <Skeleton type="skeleton-title" style={{ width: '60%' }} />
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} type="skeleton-text" style={{ marginBottom: '12px' }} />
                ))}
              </div>
              <div className="filter-group">
                <Skeleton type="skeleton-title" style={{ width: '50%' }} />
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} type="skeleton-text" style={{ marginBottom: '12px' }} />
                ))}
              </div>
            </aside>
            <main className="products-main">
              <div className="toolbar">
                <Skeleton type="skeleton-text" style={{ width: '150px', marginBottom: 0 }} />
                <Skeleton type="skeleton-btn" style={{ width: '180px', height: '36px' }} />
              </div>
              <SkeletonProductGrid count={9} />
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Oops! Something went wrong.</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-layout">
          <aside className="filters-sidebar">
            <div className="filter-group">
              <h3 className="filter-title">Search</h3>
              <div className="search-wrapper">
                <Search size={18} />
                <input type="text" placeholder="SKU or Product Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="filter-group">
              <h3 className="filter-title">Categories</h3>
              <div className="category-list">
                {categories.map(cat => (
                  <label key={cat} className="category-item">
                    <input type="radio" name="category" checked={selectedCategory === cat} onChange={() => { setSelectedCategory(cat); setSelectedSubcategory('All'); }} />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>
            {subcategories.length > 1 && (
              <div className="filter-group">
                <h3 className="filter-title">Subcategories</h3>
                <div className="category-list">
                  {subcategories.map(sub => (
                    <label key={sub} className="category-item">
                      <input type="radio" name="subcategory" checked={selectedSubcategory === sub} onChange={() => setSelectedSubcategory(sub)} />
                      <span>{sub}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="filter-group">
              <h3 className="filter-title">Brands</h3>
              <div className="category-list">
                {['All', ...new Set(products.map(p => p.brand).filter(Boolean))].map(brand => (
                  <label key={brand} className="category-item">
                    <input type="radio" name="brand" checked={selectedBrand === brand} onChange={() => setSelectedBrand(brand)} />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <main className="products-main">
            <div className="toolbar">
              <div className="results-count">Showing <span>{filteredProducts.length}</span> products</div>
              <div className="toolbar-actions">
                <div className="sort-wrapper">
                  <SlidersHorizontal size={16} />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="default">Sort by: Default</option>
                    <option value="newest">Sort by: Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                  </select>
                </div>
              </div>
            </div>

            {admin && (
              <div className="admin-management-section">
                <div className="admin-toolbar" style={{ display: 'flex', gap: '15px' }}>
                  <button className="btn btn-primary add-product-btn" onClick={() => setShowAdminForm(!showAdminForm)}>
                    {showAdminForm ? <X size={18} /> : <Plus size={18} />}
                    {showAdminForm ? 'Close Form' : 'Add New Product'}
                  </button>
                  <button className="btn btn-secondary bulk-import-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f1f5f9', color: '#0f172a', padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '600' }} onClick={() => setShowImportModal(true)}>
                    <Save size={18} />
                    Bulk Import
                  </button>
                </div>

                {/* Bulk Import Modal */}
                {showImportModal && (
                  <div className="import-modal-overlay" onClick={() => setShowImportModal(false)}>
                    <div className="import-modal-content" onClick={e => e.stopPropagation()}>
                      <div className="modal-header">
                        <h3>Bulk Product Import</h3>
                        <button className="close-modal" onClick={() => setShowImportModal(false)}><X size={20} /></button>
                      </div>
                      <div className="modal-body">
                        <p>Manage your inventory efficiently. Download our template, fill in your product details, and upload it back.</p>
                        
                        <div className="import-options">
                          <div className="import-option-card" onClick={downloadTemplate}>
                            <div className="option-icon"><Download size={32} /></div>
                            <h4>Download Template</h4>
                            <p>Get a pre-formatted Excel file with all required columns.</p>
                          </div>

                          <label className="import-option-card">
                            <div className="option-icon"><Upload size={32} /></div>
                            <h4>{importing ? 'Importing...' : 'Upload Excel'}</h4>
                            <p>Select your filled Excel file to start importing products.</p>
                            <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={(e) => { handleBulkImport(e); setShowImportModal(false); }} disabled={importing} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {showAdminForm && (
                  <div className="admin-product-form-card">
                    <div className="form-header">
                      <h3>{editingId ? 'Update Product Details' : 'Register New Industrial Product'}</h3>
                      <p>Ensure all specifications match the technical datasheet.</p>
                    </div>
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                      <div className="form-group"><label>Product ID</label><input className="form-input" type="number" name="id" value={formData.id} onChange={handleInputChange} placeholder="Auto-generated if empty" /></div>
                      <div className="form-group"><label>Product Name</label><input className="form-input" name="name" value={formData.name} onChange={handleInputChange} /></div>
                      <div className="form-group"><label>SKU</label><input className="form-input" name="sku" value={formData.sku} onChange={handleInputChange} /></div>
                      <div className="form-group"><label>Slug</label><input className="form-input" name="slug" value={formData.slug} onChange={handleInputChange} /></div>
                      <div className="form-group"><label>Brand</label><input className="form-input" name="brand" value={formData.brand} onChange={handleInputChange} /></div>
                      <div className="form-group"><label>Category</label><input className="form-input" name="category" value={formData.category} onChange={handleInputChange} /></div>
                      <div className="form-group"><label>Subcategory</label><input className="form-input" name="subcategory" value={formData.subcategory} onChange={handleInputChange} /></div>
                      <div className="form-group"><label>Price</label><input className="form-input" type="number" name="price" value={formData.price} onChange={handleInputChange} /></div>
                      <div className="form-group"><label>Stock</label><input className="form-input" type="number" name="stock" value={formData.stock} onChange={handleInputChange} /></div>
                      <div className="form-group">
                        <label>Technical PDF Catalogue Link</label>
                        <input 
                          className="form-input" 
                          name="catalogue" 
                          value={formData.catalogue} 
                          onChange={handleInputChange} 
                          placeholder="Paste PDF URL here (e.g. https://example.com/spec.pdf)" 
                        />
                      </div>
                      <div className="form-group">
                        <label>Main Image URL</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <input className="form-input" name="image" value={formData.image} onChange={handleInputChange} style={{ flex: 1 }} />
                          <label className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 10px', whiteSpace: 'nowrap', height: '100%', margin: 0 }}>
                            {uploading ? '...' : 'Upload'}
                            <input type="file" style={{ display: 'none' }} onChange={handleImageUpload} accept="image/*" />
                          </label>
                        </div>
                      </div>

                      {/* Search Keywords and Keys */}
                      <div className="form-group"><label>Keywords (comma separated)</label><input className="form-input" name="keywords" value={formData.keywords} onChange={handleInputChange} placeholder="bearing, steel, industrial" /></div>
                      <div className="form-group"><label>Primary Key</label><input className="form-input" name="primaryKey" value={formData.primaryKey} onChange={handleInputChange} placeholder="Auto-generated" /></div>
                      <div className="form-group"><label>Secondary Key</label><input className="form-input" name="secondaryKey" value={formData.secondaryKey} onChange={handleInputChange} placeholder="Auto-generated" /></div>
                      <div className="form-group"><label>HSN Code</label><input className="form-input" name="hsnCode" value={formData.hsnCode} onChange={handleInputChange} /></div>

                      <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label>Active Product</label>
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                      </div>
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea className="form-input" name="description" value={formData.description} onChange={handleInputChange} rows="4" />
                      </div>
                      <div className="form-group">
                        <label>Additional Images</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                          {formData.images.map((imgUrl, idx) => (
                            <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', background: '#f5f5f5' }}>
                              <img src={resolveImageUrl(imgUrl)} alt="Additional" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button type="button" onClick={(e) => { e.preventDefault(); handleRemoveAdditionalImage(idx); }} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255, 0, 0, 0.8)', color: 'white', border: 'none', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', padding: '5px 15px', fontSize: '14px' }}>
                          <Plus size={16} style={{ marginRight: '5px' }} />
                          {uploadingAdditional ? 'Uploading...' : 'Upload Image'}
                          <input type="file" style={{ display: 'none' }} onChange={handleAdditionalImageUpload} accept="image/*" />
                        </label>
                      </div>
                      <div className="form-group">
                        <label>Features (One per line)</label>
                        <textarea className="form-input" name="features" value={formData.features} onChange={handleInputChange} rows="4" placeholder="Feature 1&#10;Feature 2" />
                      </div>
                      <div className="form-group">
                        <label>Specifications (Key: Value per line)</label>
                        <textarea className="form-input" name="specifications" value={formData.specifications} onChange={handleInputChange} rows="4" placeholder="Weight: 1.9 kg&#10;Material: Cast Iron" />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button className="btn btn-outline" onClick={resetForm}>Cancel</button>
                      <button className="btn btn-primary" onClick={editingId ? handleUpdateProduct : handleAddProduct}>
                        {editingId ? 'Apply Changes' : 'Create Product Entry'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="products-grid-page">
              {filteredProducts.slice(0, visibleCount).map(product => (
                <ProductCard key={product.id} product={product} isAdmin={admin} onEdit={handleEditClick} onDelete={handleDeleteProduct} searchTerm={debouncedSearch} />
              ))}
              
              {/* Observer Target for Infinite Scroll */}
              {filteredProducts.length > visibleCount && (
                <div ref={observerTarget} className="scroll-sentinel" style={{ height: '20px', gridColumn: '1 / -1' }}></div>
              )}

              {filteredProducts.length === 0 && (
                <div className="no-results-container" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <Search size={48} color="#cbd5e1" style={{ marginBottom: '20px' }} />
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '10px' }}>No exact matches found</h3>
                  <p style={{ color: '#64748b', marginBottom: '20px' }}>We couldn't find any products matching "{debouncedSearch}".</p>
                  {didYouMean && (
                    <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '10px', display: 'inline-block' }}>
                      <p style={{ margin: 0, color: '#334155' }}>Did you mean: <button onClick={() => setSearchTerm(didYouMean)} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>{didYouMean}</button>?</p>
                    </div>
                  )}
                  {!didYouMean && (
                    <button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSelectedSubcategory('All'); setSelectedBrand('All'); }} className="btn btn-primary" style={{ marginTop: '10px' }}>Clear All Filters</button>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;

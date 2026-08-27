import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiUrl } from '../../utils/api';
import { useLocation, Link, useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard, { resolveImageUrl } from '../../components/home/ProductCard';
import ProtectedImage from '../../components/common/ProtectedImage';
import { Filter, ChevronDown, Search, Grid, List, SlidersHorizontal, Plus, X, Save, Download, Upload, Camera, Loader2, Database, FileSpreadsheet, ArrowLeft, ChevronLeft, ChevronRight, Disc, Workflow, Zap, Boxes, Component, Layers, Box, Sparkles, Droplet, Thermometer, Shield, Settings2, Maximize2, Minus, ShoppingCart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '../../redux/cartSlice';
import { useToast } from '../../context/ToastContext';
import { isAdmin, getAuthToken } from '../../utils/auth';

import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Skeleton, SkeletonProductGrid } from '../../components/common/Skeleton/Skeleton';
import SubcategoryCard from '../../components/products/SubcategoryCard';
import './products.css';
import { getFamilyKey } from '../../utils/productUtils';

const getSubcategoryIcon = (subcat) => {
  const name = (subcat || '').toLowerCase().trim();
  if (name === 'all') return <Layers size={20} />;
  if (name.includes('bearing') || name.includes('groove') || name.includes('ball') || name.includes('roller') || name.includes('ucp') || name.includes('ceramic') || name.includes('thrust') || name.includes('spherical')) {
    return <Disc size={20} />;
  }
  if (name.includes('valve') || name.includes('hydraulic') || name.includes('flow')) {
    return <Workflow size={20} />;
  }
  if (name.includes('motor') || name.includes('pump') || name.includes('engine') || name.includes('electric')) {
    return <Zap size={20} />;
  }
  if (name.includes('belt') || name.includes('timing') || name.includes('chain')) {
    return <Boxes size={20} />;
  }
  if (name.includes('coupling') || name.includes('joint') || name.includes('shaft')) {
    return <Component size={20} />;
  }
  if (name.includes('guideway') || name.includes('linear') || name.includes('rail')) {
    return <Settings2 size={20} />;
  }
  if (name.includes('grease')) {
    return <Droplet size={20} />;
  }
  if (name.includes('heat') || name.includes('exchan')) {
    return <Thermometer size={20} />;
  }
  if (name.includes('seal')) {
    return <Shield size={20} />;
  }
  return <Box size={20} />;
};

const getCategoryDesignStyle = (catName) => {
  const name = (catName || '').toLowerCase().trim();
  if (name === 'all') return { icon: <Sparkles size={14} />, bgClass: 'icon-bg-orange', containerClass: 'cat-card-all' };
  if (name.includes('bearing') || name.includes('groove') || name.includes('roller')) {
    return { icon: <Disc size={14} />, bgClass: 'icon-bg-lavender', containerClass: 'cat-card-standard' };
  }
  if (name.includes('hydraulic') || name.includes('valve') || name.includes('motor')) {
    return { icon: <Workflow size={14} />, bgClass: 'icon-bg-green', containerClass: 'cat-card-standard' };
  }
  if (name.includes('coupling') || name.includes('joint')) {
    return { icon: <Component size={14} />, bgClass: 'icon-bg-blue', containerClass: 'cat-card-standard' };
  }
  if (name.includes('pump')) {
    return { icon: <Droplet size={14} />, bgClass: 'icon-bg-blue', containerClass: 'cat-card-standard' };
  }
  if (name.includes('linear') || name.includes('guide')) {
    return { icon: <Settings2 size={14} />, bgClass: 'icon-bg-gray', containerClass: 'cat-card-standard' };
  }
  if (name.includes('grease')) {
    return { icon: <Droplet size={14} />, bgClass: 'icon-bg-pink', containerClass: 'cat-card-standard' };
  }
  if (name.includes('heat') || name.includes('exchan')) {
    return { icon: <Thermometer size={14} />, bgClass: 'icon-bg-orange', containerClass: 'cat-card-standard' };
  }
  if (name.includes('seal')) {
    return { icon: <Shield size={14} />, bgClass: 'icon-bg-lavender', containerClass: 'cat-card-standard' };
  }
  return { icon: <Box size={14} />, bgClass: 'icon-bg-gray', containerClass: 'cat-card-standard' };
};

const Products = () => {
  // ... existing state
  const [searchParams, setSearchParams] = useSearchParams();
  const brandParam = searchParams.get('brand');
  const categoryParam = searchParams.get('category');
  const subcategoryParam = searchParams.get('subcategory');
  const searchParam = searchParams.get('search');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'All');
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryParam || 'All');
  const [selectedBrand, setSelectedBrand] = useState(brandParam || 'All');
  const [sortBy, setSortBy] = useState('default');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const cartItems = useSelector((state) => state.cart.items);

  // Drawer States
  const [selectedDrawerProduct, setSelectedDrawerProduct] = useState(null);
  const [drawerQuantity, setDrawerQuantity] = useState(1);

  // Sizing/Voltage Modal States
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [selectedSeriesProduct, setSelectedSeriesProduct] = useState(null);
  const [seriesProducts, setSeriesProducts] = useState([]);
  const [seriesSearchItem, setSeriesSearchItem] = useState('');
  const [selectedVoltage, setSelectedVoltage] = useState('24V');
  const [modalQuantity, setModalQuantity] = useState(1);

  // Category Drawer States
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState('category'); // 'category' or 'subcategory'
  const hasAutoOpenedRef = useRef(null);

  // Desktop Collapsible Filter Sidebar States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({ search: false, category: false, brand: false, price: false });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [maxPrice, setMaxPrice] = useState(100000);

  // Auto-expand category if selectedCategory changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'All' && selectedCategory.toLowerCase() !== 'all') {
      setExpandedCategories(prev => ({ ...prev, [selectedCategory]: true }));
    }
  }, [selectedCategory]);

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handlePriceChange = (e, min, max) => {
    e.stopPropagation();
    setPriceRange([min, max]);
    setCurrentPage(1); // Reset page on filter change
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('minPrice', min);
      next.set('maxPrice', max);
      return next;
    }, { replace: true });
  };

  const toggleCategoryExpand = (cat, e) => {
    e.stopPropagation(); // prevent selecting the category when just toggling chevron
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSelectAllCategories = () => {
    setSelectedCategory('All');
    setSelectedSubcategory('All');
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('category');
      next.delete('subcategory');
      return next;
    }, { replace: true });
  };

  const handleCategorySelect = (category) => {
    if (selectedCategory && selectedCategory.toLowerCase() === category.toLowerCase()) {
      handleSelectAllCategories();
    } else {
      setSelectedCategory(category);
      setSelectedSubcategory('All');
      setExpandedCategories(prev => ({ ...prev, [category]: true }));
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('category', category);
        next.delete('subcategory');
        return next;
      }, { replace: true });
    }
  };

  const handleSubcategorySelect = (category, subcat) => {
    if (selectedCategory === category && selectedSubcategory === subcat) {
      setSelectedSubcategory('All');
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('subcategory');
        return next;
      }, { replace: true });
    } else {
      setSelectedCategory(category);
      setSelectedSubcategory(subcat);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('category', category);
        if (subcat && subcat !== 'All' && subcat.toLowerCase() !== 'all') {
          next.set('subcategory', subcat);
        } else {
          next.delete('subcategory');
        }
        return next;
      }, { replace: true });
    }
  };

  const handleBrandSelect = (brand) => {
    const nextBrand = (selectedBrand === brand || brand === 'All' || brand.toLowerCase() === 'all') ? 'All' : brand;
    setSelectedBrand(nextBrand);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (nextBrand !== 'All') {
        next.set('brand', nextBrand);
      } else {
        next.delete('brand');
      }
      return next;
    }, { replace: true });
  };

  // Get all variants of the product
  const getProductVariants = (currentProduct) => {
    if (!currentProduct) return [];

    // Ensure the variants logic EXACTLY matches the display card logic
    const currentFamily = getFamilyKey(currentProduct);

    return products.filter(p => p.category === currentProduct.category && getFamilyKey(p) === currentFamily);
  };

  const handleAddToCartClick = (product, quantity) => {
    // Mandatory Login Check
    const user = localStorage.getItem('user');
    if (!user) {
      showToast("Login required to add to cart", "error");
      navigate('/login');
      return;
    }

    const variants = getProductVariants(product);
    const hasVariants = variants.length > 1;
    const isSolenoidValves = (product.name || "").toLowerCase().includes("solenoid") ||
      (product.category || "").toLowerCase().includes("valve");

    if (hasVariants || isSolenoidValves) {
      setSelectedSeriesProduct(product);
      setSeriesProducts(variants);
      setSelectedVoltage("24V");
      setSeriesSearchItem("");
      setModalQuantity(quantity || 1);
      setShowSeriesModal(true);
    } else {
      dispatch(addItem({
        id: product.id,
        name: product.name,
        price: product.price || 0,
        image: product.image,
        quantity: quantity || 1,
        replace: true
      }));
      showToast("Added to cart", "success");
    }
  };

  const handleSeriesSelect = (item) => {
    const hasValidSlug = item.slug && item.slug.toLowerCase() !== 'sku' && item.slug.toLowerCase() !== 'default';
    navigate(`/product/${hasValidSlug ? item.slug : item.id}`);
    setShowSeriesModal(false);
    setSelectedSeriesProduct(null);
    setSeriesProducts([]);
  };

  const getVariantSizeLabel = (variantName, baseProduct) => {
    if (!variantName) return "";
    if (!baseProduct) return variantName;

    const getPrefix = (name) => {
      if (!name) return "";
      const match = name.match(/^([a-zA-Z\s]+)/);
      if (match) return match[1].trim();
      const firstToken = name.trim().split(/[\s\-]/)[0];
      return firstToken || name;
    };

    const prefix = getPrefix(baseProduct.name);
    if (!prefix) return variantName;

    // Remove the prefix from the name (case-insensitive)
    const regex = new RegExp(`^${prefix}\\s*[-_\\s]*`, 'i');
    const label = variantName.replace(regex, '').trim();
    return label || variantName;
  };


  const getProductDisplayName = (p) => {
    if (!p) return "";
    return p.name || p.sku || p.subcategory || "";
  };

  // Pagination / Infinite Scroll (Replaced with server-side page-based implementation)



  const [uploading, setUploading] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [uploadingCatalogue, setUploadingCatalogue] = useState(false);

  // Bulk Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [failedImportRows, setFailedImportRows] = useState([]);

  // Export States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCategories, setExportCategories] = useState(['All']);
  const [exportSubcategories, setExportSubcategories] = useState(['All']);

  // AI Visual Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scanImage, setScanImage] = useState(null);
  const [scanningInProgress, setScanningInProgress] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanMatches, setScanMatches] = useState([]);
  const [detectedBearingType, setDetectedBearingType] = useState('');
  const [scanReasoning, setScanReasoning] = useState('');

  // Admin State
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const handleSelectToggle = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const visibleIds = displayProducts.map((p) => p.id);
      setSelectedProductIds((prev) => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    } else {
      const visibleIds = displayProducts.map((p) => p.id);
      setSelectedProductIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    }
  };

  const downloadTemplate = async () => {
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
        "Weight (Kg)": 0.5,
        "Length (cm)": 15,
        "Width (cm)": 10,
        "Height (cm)": 5,
        "Technical PDF Catalogue": "https://example.com/catalog.pdf",
        "Main Image URL": "https://example.com/image.webp",
        "Additional Images": "https://example.com/img2.jpg, https://example.com/img3.webp",
        "Keywords (comma separated)": "bearing, industrial, steel",
        "HSN Code": "8482",
        "Description": "High quality industrial bearing",
        "Features (One per line)": "Premium Steel\nLong Life\nLow Noise",
        "Specifications (Key: Value per line)": "Material: Chrome Steel\nWeight: 0.5kg\nInner Diameter: 25mm"
      }
    ];

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Template");
    XLSX.writeFile(wb, "Product_Bulk_Import_Template.xlsx");
  };

  const handleCategoryChange = (cat, isChecked) => {
    let updatedCats;
    if (cat === 'All') {
      updatedCats = isChecked ? ['All'] : [];
    } else {
      if (isChecked) {
        updatedCats = exportCategories.filter(c => c !== 'All').concat(cat);
      } else {
        updatedCats = exportCategories.filter(c => c !== cat);
      }
      if (updatedCats.length === 0) {
        updatedCats = ['All'];
      }
    }
    setExportCategories(updatedCats);

    // Sync subcategories: calculate new available subcategories based on updated categories selection
    const newAvailableSubcats = [...new Set(
      products
        .filter(p => updatedCats.includes('All') || updatedCats.length === 0 || updatedCats.includes(p.category))
        .map(p => p.subcategory)
        .filter(Boolean)
    )];

    setExportSubcategories(prev => {
      if (prev.includes('All')) return ['All'];
      const filtered = prev.filter(s => newAvailableSubcats.includes(s));
      return filtered.length > 0 ? filtered : ['All'];
    });
  };

  const handleSubcategoryChange = (sub, isChecked) => {
    if (sub === 'All') {
      setExportSubcategories(isChecked ? ['All'] : []);
    } else {
      let updatedSubs;
      if (isChecked) {
        updatedSubs = exportSubcategories.filter(s => s !== 'All').concat(sub);
      } else {
        updatedSubs = exportSubcategories.filter(s => s !== sub);
      }
      if (updatedSubs.length === 0) {
        updatedSubs = ['All'];
      }
      setExportSubcategories(updatedSubs);
    }
  };

  const handleExportProducts = async () => {
    try {
      const response = await fetch(apiUrl('/api/products?export=true'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch full catalog for export");

      const fullCatalog = await response.json();
      let productsToExport = fullCatalog;

      // Filter by categories if specific categories are selected
      if (exportCategories.length > 0 && !exportCategories.includes('All')) {
        productsToExport = productsToExport.filter(p => exportCategories.includes(p.category));
      }

      // Filter by subcategories if specific subcategories are selected
      if (exportSubcategories.length > 0 && !exportSubcategories.includes('All')) {
        productsToExport = productsToExport.filter(p => exportSubcategories.includes(p.subcategory));
      }

      if (productsToExport.length === 0) {
        alert("No products match the selected categories and subcategories.");
        return;
      }

      const dataToExport = productsToExport.map(p => ({
        "Product ID": p.id || "",
        "Product Name": p.name || "",
        "SKU": p.sku || "",
        "Slug": p.slug || "",
        "Brand": p.brand || "",
        "Category": p.category || "",
        "Subcategory": p.subcategory || "",
        "Price": p.price || "",
        "Stock": p.stock || "",
        "Weight (Kg)": p.weightKg || "",
        "Length (cm)": p.dimensions?.length || "",
        "Width (cm)": p.dimensions?.width || "",
        "Height (cm)": p.dimensions?.height || "",
        "Technical PDF Catalogue": p.catalogue || "",
        "Main Image URL": p.image || "",
        "Additional Images": Array.isArray(p.images) ? p.images.join(", ") : "",
        "Keywords (comma separated)": p.keywords || "",
        "HSN Code": p.hsnCode || "",
        "Description": p.description || "",
        "Features (One per line)": Array.isArray(p.features) ? p.features.join("\n") : (p.features || ""),
        "Specifications (Key: Value per line)": p.specifications && Object.keys(p.specifications).length > 0 ? Object.entries(p.specifications).map(([k, v]) => `${k}: ${v}`).join('\n') : ""
      }));

      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products Export");
      XLSX.writeFile(wb, "Products_Export.xlsx");
      setShowExportModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to export products. Please try again.");
    }
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
    weightKg: "",
    length: "",
    width: "",
    height: "",
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

  const fetchProducts = async (overrideParams = {}) => {
    try {
      setLoading(true);
      const query = new URLSearchParams();

      const cat = overrideParams.category !== undefined ? overrideParams.category : selectedCategory;
      const sub = overrideParams.subcategory !== undefined ? overrideParams.subcategory : selectedSubcategory;
      const br = overrideParams.brand !== undefined ? overrideParams.brand : selectedBrand;
      const srch = overrideParams.search !== undefined ? overrideParams.search : debouncedSearch;
      const srt = overrideParams.sort !== undefined ? overrideParams.sort : sortBy;

      if (cat && cat !== 'All' && cat.toLowerCase() !== 'all') {
        query.set('category', cat);
      }
      if (sub && sub !== 'All' && sub.toLowerCase() !== 'all') {
        query.set('subcategory', sub);
      }
      if (br && br !== 'All' && br.toLowerCase() !== 'all') {
        query.set('brand', br);
      }
      if (srch && srch.trim()) {
        query.set('search', srch.trim());
      }
      if (srt && srt !== 'default') {
        query.set('sort', srt);
      }

      query.set('page', currentPage);
      query.set('limit', ITEMS_PER_PAGE);

      if (priceRange && priceRange.length === 2) {
        query.set('minPrice', priceRange[0]);
        query.set('maxPrice', priceRange[1]);
      }

      const queryString = query.toString();
      const endpoint = `/api/products/paginated${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(apiUrl(endpoint));
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();

      const normalize = (list) => list.map(p => ({
        ...p,
        specs: p.description ? p.description.substring(0, 60) + '...' : (p.subcategory || p.brand)
      }));

      const productsList = Array.isArray(data) ? data : (data.products || []);
      setProducts(normalize(productsList.filter(p => p.isActive !== false)));
      setTotalPagesLocal(data.totalPages || 1);
      setLoading(false);
      setIsBackgroundLoading(false);
    } catch (err) {
      console.error("Products Load Error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch sidebar metadata (categories, brands, subcategories) from lightweight endpoint
  const [serverMeta, setServerMeta] = useState({ categories: [], brands: [], subcategories: [], subcategoryDetails: [], categoryDetails: [] });
  useEffect(() => {
    fetch(apiUrl('/api/products/metadata'))
      .then(r => r.json())
      .then(data => setServerMeta(data))
      .catch(() => { });
  }, []);

  // Server-side pagination state
  const ITEMS_PER_PAGE = 16;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPagesLocal, setTotalPagesLocal] = useState(1);

  const [viewMode, setViewMode] = useState('categories'); // 'categories', 'series' or 'products'

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.trim() !== '') {
      setViewMode('products');
    } else if (!selectedCategory || selectedCategory === 'All' || selectedCategory.toLowerCase() === 'all') {
      setViewMode('categories');
    } else if (selectedSubcategory && selectedSubcategory !== 'All' && selectedSubcategory.toLowerCase() !== 'all') {
      setViewMode('products');
    } else {
      setViewMode('series');
    }
  }, [selectedCategory, selectedSubcategory, debouncedSearch]);

  const availableCategories = useMemo(() => {
    let details = serverMeta.categoryDetails || [];
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      details = details.filter(c => c.name.toLowerCase().includes(s));
    }
    return details;
  }, [serverMeta.categoryDetails, debouncedSearch]);

  const availableSeries = useMemo(() => {
    let details = serverMeta.subcategoryDetails || [];
    if (selectedCategory && selectedCategory !== 'All' && selectedCategory.toLowerCase() !== 'all') {
      details = details.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      details = details.filter(sub => sub.name.toLowerCase().includes(s) || (sub.category && sub.category.toLowerCase().includes(s)));
    }

    return details;
  }, [serverMeta.subcategoryDetails, selectedCategory, debouncedSearch]);

  // Handle traditional page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    setImporting(true);
    setImportProgress({ total: 0, processed: 0, success: 0, failed: 0, errors: [] });
    setFailedImportRows([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
          alert("No data found in the Excel file.");
          setImporting(false);
          return;
        }

        const totalRows = rows.length;
        setImportProgress({ total: totalRows, processed: 0, success: 0, failed: 0, errors: [] });

        const batchSize = 25; // 25 rows per batch is fast and extremely stable
        let successCount = 0;
        let failedCount = 0;
        const accumulatedErrors = [];
        const failedRowsObj = [];

        for (let i = 0; i < totalRows; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const startRowIndex = i + 2;

          try {
            const response = await fetch(apiUrl("/api/admin/products/import-batch"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ products: batch, startRowIndex })
            });

            const result = await response.json();
            if (response.ok) {
              successCount += result.importedCount;

              if (result.errors && result.errors.length > 0) {
                accumulatedErrors.push(...result.errors);
              }

              if (result.failures && result.failures.length > 0) {
                failedCount += result.failures.length;
                failedRowsObj.push(...result.failures.map(f => ({
                  rowData: f.rowData,
                  error: f.error
                })));
              }
            } else {
              // Whole batch failed
              failedCount += batch.length;
              const errMsg = result.message || "Failed to process batch";
              batch.forEach((row, idx) => {
                accumulatedErrors.push(`Row ${startRowIndex + idx}: ${errMsg}`);
                failedRowsObj.push({ rowData: row, error: errMsg });
              });
            }
          } catch (err) {
            // Network / fetch error
            failedCount += batch.length;
            batch.forEach((row, idx) => {
              accumulatedErrors.push(`Row ${startRowIndex + idx}: Network error (${err.message})`);
              failedRowsObj.push({ rowData: row, error: err.message });
            });
          }

          // Update progress stats in real time
          setImportProgress({
            total: totalRows,
            processed: Math.min(i + batch.length, totalRows),
            success: successCount,
            failed: failedCount,
            errors: accumulatedErrors
          });
          setFailedImportRows(failedRowsObj);
        }

        fetchProducts(); // Refresh product list
      } catch (err) {
        console.error("Error reading file:", err);
        alert("Error reading Excel file: " + err.message);
        setImporting(false);
      } finally {
        setImporting(false);
      }
    };

    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      alert("Error loading file.");
      setImporting(false);
    };

    reader.readAsArrayBuffer(file);
    // Reset file input value so same file can be imported again
    e.target.value = "";
  };

  const downloadFailedExcel = async () => {
    if (failedImportRows.length === 0) return;

    // Transform the failed rows to include a "Failure Reason" column at the beginning
    const dataToExport = failedImportRows.map(f => {
      return {
        "Failure Reason": f.error,
        ...f.rowData
      };
    });

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Failed Products");
    XLSX.writeFile(wb, `Failed_Imports_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImageScanChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show image preview
    const reader = new FileReader();
    reader.onload = () => {
      setScanImage(reader.result);
    };
    reader.readAsDataURL(file);

    setScanningInProgress(true);
    setScanError('');
    setScanMatches([]);
    setDetectedBearingType('');
    setScanReasoning('');

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(apiUrl('/api/products/search-image'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        let errorMsg = 'AI Vision Scanner could not process this image. Please make sure the image is in JPG/PNG format.';
        try {
          const errData = await response.json();
          if (errData.message || errData.error) {
            errorMsg = errData.message + (errData.error ? ': ' + errData.error : '');
          }
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (data.matches && data.matches.length > 0) {
        setScanMatches(data.matches);
        setDetectedBearingType(data.detectedType || 'Bearing / Oil Seal');
        setScanReasoning(data.reasoning || '');
      } else {
        setScanError('No matching products found in the catalog.');
      }
    } catch (err) {
      setScanError(err.message || 'Failed to complete vision scan.');
    } finally {
      setScanningInProgress(false);
    }
  };

  const handleApplyScanMatch = (sku) => {
    setSearchTerm(sku);
    setIsScanning(false);
    setScanImage(null);
    setScanMatches([]);
    setDetectedBearingType('');
    setScanReasoning('');
  };

  // Reset pagination to page 1 whenever active filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, selectedBrand, debouncedSearch, sortBy, priceRange]);

  useEffect(() => {
    const isProductDrillDown = selectedSubcategory && selectedSubcategory !== 'All' && selectedSubcategory.toLowerCase() !== 'all';
    const isSearching = debouncedSearch && debouncedSearch.trim() !== '';

    const debounceTimer = setTimeout(() => {
      if (isProductDrillDown || isSearching) {
        fetchProducts({
          category: selectedCategory,
          subcategory: selectedSubcategory,
          brand: selectedBrand,
          search: debouncedSearch,
          sort: sortBy
        });
      } else {
        // Eagerly clear products to free memory and prevent accidental rendering
        setProducts([]);
        setIsBackgroundLoading(false);
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [selectedCategory, selectedSubcategory, selectedBrand, debouncedSearch, sortBy, currentPage, priceRange]);

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
    payload.weightKg = payload.weightKg === "" ? 0 : Number(payload.weightKg);
    payload.dimensions = {
      length: payload.length === "" ? 0 : Number(payload.length),
      width: payload.width === "" ? 0 : Number(payload.width),
      height: payload.height === "" ? 0 : Number(payload.height),
    };

    // Cleanup flat dimensions for payload
    delete payload.length;
    delete payload.width;
    delete payload.height;

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
      weightKg: product.weightKg ?? "",
      length: product.dimensions?.length ?? "",
      width: product.dimensions?.width ?? "",
      height: product.dimensions?.height ?? "",
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
    const product = products.find(p => p.id === id);
    if (!product) return;

    const variants = getProductVariants(product);
    const hasVariants = variants.length > 1;

    let deleteIds = [id];

    if (hasVariants) {
      const choice = window.confirm(
        `This product has ${variants.length} sizes/variants.\n\n` +
        `Click OK to delete ALL ${variants.length} variants of this product/subcategory.\n` +
        `Click CANCEL to delete ONLY this specific variant.`
      );
      if (choice) {
        deleteIds = variants.map(v => v.id);
      } else {
        const secondChoice = window.confirm(`Delete only the specific item "${product.name}"?`);
        if (!secondChoice) return;
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this product?')) return;
    }

    try {
      if (deleteIds.length > 1) {
        const response = await fetch(apiUrl('/api/products/bulk-delete'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ids: deleteIds })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to delete products');
        }
        const result = await response.json();
        showToast(result.message || 'Products deleted successfully', 'success');
      } else {
        const response = await fetch(apiUrl(`/api/products/${id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to delete product');
        showToast('Product deleted successfully', 'success');
      }
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };


  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;

    const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));

    // Calculate variants
    const allRelatedProducts = [];
    selectedProducts.forEach(sp => {
      const variants = getProductVariants(sp);
      variants.forEach(v => {
        if (!allRelatedProducts.some(p => p.id === v.id)) {
          allRelatedProducts.push(v);
        }
      });
    });

    const hasVariants = allRelatedProducts.length > selectedProducts.length;

    let deleteIds = selectedProducts.map(p => p.id);

    if (hasVariants) {
      const choice = window.confirm(
        `You have selected ${selectedProducts.length} products.\n\n` +
        `Click OK to delete these products AND all of their variants/sizes (total ${allRelatedProducts.length} items).\n` +
        `Click CANCEL to only delete the specific selected variants.`
      );

      if (choice) {
        deleteIds = allRelatedProducts.map(p => p.id);
      } else {
        const secondChoice = window.confirm(`Delete only the specific selected items (${selectedProducts.length} items)?`);
        if (!secondChoice) return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete the ${selectedProducts.length} selected products?`)) {
        return;
      }
    }

    try {
      const response = await fetch(apiUrl('/api/products/bulk-delete'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: deleteIds })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to bulk delete products');
      }

      const result = await response.json();
      showToast(result.message || 'Products deleted successfully', 'success');
      setSelectedProductIds([]);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const rawCategories = useMemo(() => {
    const cats = [...(serverMeta.categories || [])];
    cats.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      if (aLower === 'bearings' && bLower !== 'bearings') return -1;
      if (bLower === 'bearings' && aLower !== 'bearings') return 1;
      if (aLower === 'seal' && bLower !== 'seal') return -1;
      if (bLower === 'seal' && aLower !== 'seal') return 1;
      return 0;
    });
    return cats;
  }, [serverMeta.categories]);

  const categories = useMemo(() => ['All', ...rawCategories], [rawCategories]);

  const subcategories = useMemo(() => {
    return ['All', ...(serverMeta.subcategories || [])];
  }, [serverMeta.subcategories]);

  const getSubcategoriesForCategory = (catName) => {
    // Since server metadata gives all subcategories globally, we filter from loaded products for category-specific subcats
    return [...new Set(products.filter(p => p.category === catName).map(p => p.subcategory).filter(Boolean))].sort();
  };

  const currentSubcategories = useMemo(() => {
    return selectedCategory && selectedCategory !== 'All' && selectedCategory.toLowerCase() !== 'all'
      ? ['All', ...getSubcategoriesForCategory(selectedCategory)]
      : [];
  }, [selectedCategory, products]);

  const showSubcategoriesBar = selectedCategory && selectedCategory !== 'All' && selectedCategory.toLowerCase() !== 'all' && currentSubcategories.length > 1;

  const exportAvailableSubcategories = useMemo(() => {
    const allDetails = serverMeta.subcategoryDetails || [];
    return [...new Set(
      allDetails
        .filter(sub => exportCategories.includes('All') || exportCategories.length === 0 || exportCategories.includes(sub.category))
        .map(sub => sub.name)
        .filter(Boolean)
    )].sort();
  }, [serverMeta.subcategoryDetails, exportCategories]);

  useEffect(() => {
    const currentCategory = searchParams.get('category');
    const currentSubcategory = searchParams.get('subcategory');
    const currentBrand = searchParams.get('brand');
    const currentSearch = searchParams.get('search');

    if (currentSearch !== null) {
      setSearchTerm(currentSearch);
    }

    if (currentCategory && currentCategory.toLowerCase() !== 'all') {
      const normalizedQueryCat = currentCategory.trim().toLowerCase().replace(/s$/, '');
      const foundCategory = categories.find(cat => {
        if (cat === 'All') return false;
        const normalizedDbCat = cat.trim().toLowerCase().replace(/s$/, '');
        return normalizedDbCat === normalizedQueryCat;
      });
      setSelectedCategory(foundCategory || currentCategory);
    } else {
      setSelectedCategory('All');
    }

    if (currentSubcategory && currentSubcategory.toLowerCase() !== 'all') {
      setSelectedSubcategory(currentSubcategory);
    } else {
      setSelectedSubcategory('All');
    }

    if (currentBrand && currentBrand.toLowerCase() !== 'all') {
      setSelectedBrand(currentBrand);
    } else {
      setSelectedBrand('All');
    }
  }, [searchParams, categories]);

  // Auto-open drawer removed per mobile UI flow requirements

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredProducts = products;
  const displayProducts = products;
  // removed obsolete getProductScore and didYouMean logic
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
        <div className={`products-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <aside className={`filters-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            {/* Collapse/Expand Sidebar Handler */}
            <button
              type="button"
              className="sidebar-collapse-toggle-btn"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand Filters" : "Collapse Filters"}
            >
              {isSidebarCollapsed ? <ChevronRight size={14} /> : <ArrowLeft size={14} />}
            </button>

            <div className="filters-sidebar-inner">
              {isSidebarCollapsed ? (
                <div className="collapsed-sidebar-icons">
                  <div className="collapsed-icon-btn" onClick={() => setIsSidebarCollapsed(false)} title="Search">
                    <Search size={18} />
                  </div>
                  <div className="collapsed-icon-btn" onClick={() => setIsSidebarCollapsed(false)} title="Categories">
                    <Filter size={18} />
                  </div>
                  <div className="collapsed-icon-btn" onClick={() => setIsSidebarCollapsed(false)} title="Brands">
                    <SlidersHorizontal size={18} />
                  </div>
                </div>
              ) : (
                <div className="sidebar-content">
                  {/* Search Section */}
                  <div className="sidebar-section premium-card search-section">
                    <div className="premium-card-header" onClick={() => toggleSection('search')}>
                      <div className="premium-header-title">
                        <div className="icon-wrapper icon-bg-pink">
                          <Search size={20} />
                        </div>
                        <div className="header-text">
                          <span className="section-title">Search</span>
                          <span className="section-subtitle">Find products quickly</span>
                        </div>
                      </div>
                      <ChevronDown size={18} className={`chevron-icon ${collapsedSections.search ? 'collapsed' : ''}`} />
                    </div>
                    {!collapsedSections.search && (
                      <div className="section-body">
                        <div className="premium-search-wrapper">
                          <Search size={18} className="search-input-icon" />
                          <input
                            type="text"
                            placeholder="SKU or Product Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Categories Section */}
                  <div className="sidebar-section premium-card category-section">
                    <div className="premium-card-header" onClick={() => toggleSection('category')}>
                      <div className="premium-header-title">
                        <div className="icon-wrapper icon-bg-orange">
                          <Grid size={20} />
                        </div>
                        <div className="header-text">
                          <span className="section-title">Categories</span>
                          <span className="section-subtitle">Browse by category</span>
                        </div>
                      </div>
                      <ChevronDown size={18} className={`chevron-icon ${collapsedSections.category ? 'collapsed' : ''}`} />
                    </div>
                    {!collapsedSections.category && (
                      <div className="section-body premium-categories-body">


                        {/* 'All' category option */}
                        <div className="tree-category-block">
                          <div
                            className={`premium-category-row cat-card-all ${selectedCategory === 'All' ? 'selected' : ''}`}
                            onClick={handleSelectAllCategories}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="premium-checkbox-wrapper">
                              <input
                                type="checkbox"
                                className="hidden-checkbox"
                                checked={selectedCategory === 'All'}
                                readOnly
                              />
                              <div className="custom-checkbox">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </div>
                            </div>
                            <span className="premium-category-name" title="All Categories">All Categories</span>
                            <Sparkles size={16} className="all-cats-sparkle" />
                          </div>
                        </div>

                        {/* Dynamic categories tree list */}
                        {categories.filter(c => c !== 'All').map(cat => {
                          const subcats = getSubcategoriesForCategory(cat);
                          const hasSubcategories = subcats.length > 0;
                          const isExpanded = expandedCategories[cat];
                          const design = getCategoryDesignStyle(cat);

                          return (
                            <div key={cat} className="tree-category-block">
                              <div className={`premium-category-row ${design.containerClass} ${selectedCategory === cat ? 'selected' : ''}`}>
                                <div className="premium-row-clickable-area" onClick={(e) => { e.preventDefault(); handleCategorySelect(cat); }}>
                                  <div className="premium-checkbox-wrapper">
                                    <input
                                      type="checkbox"
                                      className="hidden-checkbox"
                                      checked={selectedCategory === cat}
                                      readOnly
                                    />
                                    <div className="custom-checkbox">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                  </div>
                                  <div className={`category-icon-box ${design.bgClass}`} style={{ padding: 0, overflow: 'hidden' }}>
                                    {(() => {
                                      const catProduct = products.find(p => p.category === cat && p.image);
                                      if (catProduct) {
                                        return <img src={resolveImageUrl(catProduct.image)} alt={cat} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                                      }
                                      return design.icon;
                                    })()}
                                  </div>
                                  <span className="premium-category-name" title={cat}>{cat}</span>
                                </div>

                                {hasSubcategories && (
                                  <button
                                    type="button"
                                    className={`premium-expand-btn ${isExpanded ? 'rotated' : ''}`}
                                    onClick={(e) => toggleCategoryExpand(cat, e)}
                                  >
                                    <ChevronDown size={16} />
                                  </button>
                                )}
                              </div>

                              {/* Subcategories list */}
                              {hasSubcategories && isExpanded && (
                                <div className="premium-subcategories-list slide-down">
                                  {subcats.map(sub => (
                                    <div
                                      key={sub}
                                      className={`premium-subcategory-row ${selectedSubcategory === sub ? 'selected' : ''}`}
                                      onClick={(e) => { e.preventDefault(); handleSubcategorySelect(cat, sub); }}
                                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px 8px' }}
                                    >
                                      <div className="premium-checkbox-wrapper">
                                        <input
                                          type="checkbox"
                                          className="hidden-checkbox"
                                          checked={selectedSubcategory === sub}
                                          readOnly
                                        />
                                        <div className="custom-checkbox small">
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                      </div>
                                      <div className="subcategory-img-icon" style={{ width: 20, height: 20, borderRadius: '50%', overflow: 'hidden', marginRight: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                                        {(() => {
                                          const subProduct = products.find(p => p.category === cat && p.subcategory === sub && p.image);
                                          if (subProduct) {
                                            return <img src={resolveImageUrl(subProduct.image)} alt={sub} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                                          }
                                          return <span style={{ transform: 'scale(0.6)' }}>{getSubcategoryIcon(sub)}</span>;
                                        })()}
                                      </div>
                                      <span className="premium-category-name sub" title={sub}>{sub}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                        }
                      </div>
                    )}
                  </div>

                  {/* Brands Section */}
                  <div className="sidebar-section brand-section">
                    <div className="section-header" onClick={() => toggleSection('brand')}>
                      <span className="section-title">Brands</span>
                      <ChevronDown size={16} className={`chevron-icon ${collapsedSections.brand ? 'collapsed' : ''}`} />
                    </div>
                    {!collapsedSections.brand && (
                      <div className="section-body brands-scrollbox">
                        {['All', ...(serverMeta.brands || [])].map(brand => (
                          <label key={brand} className={`brand-checkbox-label ${selectedBrand === brand ? 'active' : ''}`}>
                            <input
                              type="checkbox"
                              checked={selectedBrand === brand}
                              onChange={() => handleBrandSelect(brand)}
                            />
                            <span className="label-text" title={brand}>{brand}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price Section */}
                  <div className="sidebar-section price-section">
                    <div className="section-header" onClick={() => toggleSection('price')}>
                      <span className="section-title">Price Range</span>
                      <ChevronDown size={16} className={`chevron-icon ${collapsedSections.price ? 'collapsed' : ''}`} />
                    </div>
                    {!collapsedSections.price && (
                      <div className="section-body">
                        <div className="price-slider-container">
                          <div className="price-slider-labels">
                            <span>₹0</span>
                            <span>Max: ₹{priceRange[1].toLocaleString()}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={maxPrice}
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                            className="price-range-input"
                          />
                          <div className="price-slider-footer">
                            <button
                              type="button"
                              className="price-reset-btn"
                              onClick={() => setPriceRange([0, maxPrice])}
                              disabled={priceRange[1] === maxPrice}
                            >
                              Reset Price
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <main className="products-main">
            <div className="toolbar">
              <div className="results-count">
                Showing <span>{displayProducts.length}</span> products{isBackgroundLoading ? ' (loading more...)' : ''}
              </div>
              <div className="toolbar-actions">
                <button
                  type="button"
                  className="toolbar-filter-btn"
                  onClick={() => {
                    setDrawerStep('category');
                    setIsCategoryDrawerOpen(true);
                  }}
                >
                  <Filter size={16} />
                  <span>Category</span>
                </button>
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
                  <button className="btn btn-secondary export-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f1f5f9', color: '#0f172a', padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '600' }} onClick={() => { setExportCategories(['All']); setExportSubcategories(['All']); setShowExportModal(true); }}>
                    <Download size={18} />
                    Export
                  </button>
                  <label className="btn btn-secondary select-all-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f1f5f9', color: '#0f172a', padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '600', userSelect: 'none', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={displayProducts.length > 0 && displayProducts.every(p => selectedProductIds.includes(p.id))}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#ea580c' }}
                    />
                    Select All
                  </label>
                </div>

                {/* Bulk Import Modal */}
                {showImportModal && (
                  <div className="import-modal-overlay" onClick={() => { if (!importing) setShowImportModal(false); }}>
                    <div className="import-modal-content" onClick={e => e.stopPropagation()}>
                      <div className="modal-header">
                        <h3>Bulk Product Import</h3>
                        <button
                          className="close-modal"
                          onClick={() => { if (!importing) setShowImportModal(false); }}
                          disabled={importing}
                          style={{ cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.5 : 1 }}
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="modal-body">
                        {!importProgress ? (
                          <>
                            <p style={{ marginBottom: '1.25rem', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
                              Manage your inventory efficiently. Download our template, fill in your product details, and upload it back.
                              <br />
                              <strong style={{ color: '#0f172a' }}>💡 Smart Update:</strong> Existing products matching by <strong>Product ID</strong>, <strong>SKU</strong>, or <strong>Name</strong> will be updated automatically. Empty Excel cells will not overwrite existing database fields, ensuring no data loss.
                            </p>

                            <div className="import-options">
                              <div className="import-option-card" onClick={downloadTemplate}>
                                <div className="option-icon"><Download size={32} /></div>
                                <h4>Download Template</h4>
                                <p>Get a pre-formatted Excel file with all required columns.</p>
                              </div>

                              <label className="import-option-card" style={{ cursor: 'pointer' }}>
                                <div className="option-icon"><Upload size={32} /></div>
                                <h4>Upload Excel</h4>
                                <p>Select your filled Excel file to start importing products.</p>
                                <input
                                  type="file"
                                  accept=".xlsx, .xls"
                                  style={{ display: 'none' }}
                                  onChange={handleBulkImport}
                                />
                              </label>
                            </div>
                          </>
                        ) : (
                          <div className="import-progress-container" style={{ padding: '10px 0' }}>
                            {/* Premium Import Animation */}
                            <div className="upload-animation-container">
                              <div className="upload-anim-node excel">
                                <div className="upload-anim-icon-wrapper">
                                  <FileSpreadsheet size={28} />
                                </div>
                                <span>Excel Sheet</span>
                              </div>

                              <div className="upload-flow-track">
                                {importProgress.processed < importProgress.total && (
                                  <div className="upload-flow-stream"></div>
                                )}
                              </div>

                              <div className={`upload-anim-node server ${importProgress.processed < importProgress.total ? 'active' : ''}`}>
                                <div className="upload-anim-icon-wrapper">
                                  <Database size={28} />
                                </div>
                                <span>Database</span>
                              </div>
                            </div>

                            <div className="progress-percentage-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0f172a' }}>
                                {importProgress.processed < importProgress.total ? 'Importing Products...' : 'Import Complete'}
                              </span>
                              <span style={{ fontWeight: '800', fontSize: '1.25rem', color: '#ea580c' }}>
                                {importProgress.total > 0 ? Math.round((importProgress.processed / importProgress.total) * 100) : 0}%
                              </span>
                            </div>

                            <div className="progress-bar-bg" style={{ background: '#f1f5f9', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                              <div
                                className="progress-bar-fill-animated"
                                style={{
                                  width: `${importProgress.total > 0 ? Math.round((importProgress.processed / importProgress.total) * 100) : 0}%`
                                }}
                              />
                            </div>

                            <div className="import-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                              <div className="stat-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Total</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{importProgress.total}</div>
                              </div>
                              <div className="stat-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: '#166534', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Success</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#15803d' }}>{importProgress.success}</div>
                              </div>
                              <div className="stat-card" style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Failed</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#b91c1c' }}>{importProgress.failed}</div>
                              </div>
                            </div>

                            {importProgress.processed < importProgress.total ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '0.9rem', marginBottom: '20px', background: '#fafaf9', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f5f5f4' }}>
                                <Loader2 size={18} style={{ color: '#ea580c', animation: 'spin 1s linear infinite' }} />
                                <span style={{ fontWeight: '500' }}>
                                  Uploading products... Processing rows {importProgress.processed + 1} to {Math.min(importProgress.processed + 25, importProgress.total)} of {importProgress.total}
                                </span>
                              </div>
                            ) : (
                              <div style={{ marginBottom: '20px' }}>
                                {importProgress.failed === 0 ? (
                                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', color: '#15803d', fontSize: '0.9rem', fontWeight: '500' }}>
                                    🎉 All products imported successfully!
                                  </div>
                                ) : (
                                  <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '12px', color: '#b45309', fontSize: '0.9rem', fontWeight: '500' }}>
                                    ⚠️ Imported with {importProgress.failed} failed items. Please download the failed products Excel sheet to inspect and correct the data.
                                  </div>
                                )}
                              </div>
                            )}

                            {importProgress.errors.length > 0 && (
                              <div style={{ marginBottom: '24px' }}>
                                <h5 style={{ fontSize: '0.85rem', color: '#334155', fontWeight: '700', marginBottom: '8px' }}>Error Details ({importProgress.errors.length})</h5>
                                <div style={{ maxHeight: '120px', overflowY: 'auto', background: '#0f172a', color: '#fda4af', fontFamily: 'monospace', fontSize: '0.75rem', padding: '10px 12px', borderRadius: '8px', lineHeight: '1.5' }}>
                                  {importProgress.errors.map((err, idx) => (
                                    <div key={idx} style={{ marginBottom: '4px' }}>• {err}</div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="progress-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                              {importProgress.processed === importProgress.total && failedImportRows.length > 0 && (
                                <button
                                  className="btn btn-secondary"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    border: '1px solid #fca5a5',
                                    fontWeight: '600',
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                  }}
                                  onClick={downloadFailedExcel}
                                >
                                  <Download size={16} />
                                  Download Failed Excel
                                </button>
                              )}

                              <button
                                className="btn"
                                style={{
                                  background: importProgress.processed === importProgress.total ? '#ea580c' : '#cbd5e1',
                                  color: '#fff',
                                  fontWeight: '600',
                                  padding: '0.6rem 1.5rem',
                                  borderRadius: '8px',
                                  cursor: importProgress.processed === importProgress.total ? 'pointer' : 'not-allowed'
                                }}
                                disabled={importProgress.processed < importProgress.total}
                                onClick={() => {
                                  setShowImportModal(false);
                                  setTimeout(() => {
                                    setImportProgress(null);
                                    setFailedImportRows([]);
                                  }, 300);
                                }}
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Modal */}
                {showExportModal && (
                  <div className="import-modal-overlay" onClick={() => setShowExportModal(false)}>
                    <div className="import-modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                      <div className="modal-header">
                        <h3>Export Products to Excel</h3>
                        <button className="close-modal" onClick={() => setShowExportModal(false)}><X size={20} /></button>
                      </div>
                      <div className="modal-body">
                        <p style={{ marginBottom: '1.25rem', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
                          Select categories and subcategories to filter your export. Leave them as "All" to export all products.
                        </p>

                        <div className="export-filters-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                          {/* Categories Section */}
                          <div className="export-filter-column">
                            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Categories</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#64748b' }}>({exportCategories.includes('All') ? 'All Selected' : `${exportCategories.length} Selected`})</span>
                            </h4>
                            <div className="selection-scrollbox" style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px', height: '220px', overflowY: 'auto', background: '#f8fafc' }}>
                              <label className="category-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', margin: '2px 0' }}>
                                <input
                                  type="checkbox"
                                  checked={exportCategories.includes('All')}
                                  onChange={(e) => handleCategoryChange('All', e.target.checked)}
                                />
                                <span style={{ fontWeight: '600' }}>All Categories</span>
                              </label>
                              {categories.filter(c => c !== 'All').map(cat => (
                                <label key={cat} className="category-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', margin: '2px 0' }}>
                                  <input
                                    type="checkbox"
                                    checked={exportCategories.includes(cat)}
                                    onChange={(e) => handleCategoryChange(cat, e.target.checked)}
                                  />
                                  <span>{cat}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Subcategories Section */}
                          <div className="export-filter-column">
                            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Subcategories</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#64748b' }}>({exportSubcategories.includes('All') ? 'All Selected' : `${exportSubcategories.length} Selected`})</span>
                            </h4>
                            <div className="selection-scrollbox" style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px', height: '220px', overflowY: 'auto', background: '#f8fafc' }}>
                              <label className="category-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', margin: '2px 0' }}>
                                <input
                                  type="checkbox"
                                  checked={exportSubcategories.includes('All')}
                                  onChange={(e) => handleSubcategoryChange('All', e.target.checked)}
                                />
                                <span style={{ fontWeight: '600' }}>All Subcategories</span>
                              </label>
                              {exportAvailableSubcategories.map(sub => (
                                <label key={sub} className="category-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', margin: '2px 0' }}>
                                  <input
                                    type="checkbox"
                                    checked={exportSubcategories.includes(sub)}
                                    onChange={(e) => handleSubcategoryChange(sub, e.target.checked)}
                                  />
                                  <span>{sub}</span>
                                </label>
                              ))}
                              {exportAvailableSubcategories.length === 0 && (
                                <div style={{ padding: '10px', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', fontStyle: 'italic' }}>
                                  No subcategories available for selected categories.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                          onClick={handleExportProducts}
                        >
                          <Download size={20} />
                          Export to Excel
                        </button>
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
                      <div className="form-group"><label>Weight (Kg)</label><input className="form-input" type="number" step="0.001" name="weightKg" value={formData.weightKg} onChange={handleInputChange} placeholder="e.g. 0.5" /></div>
                      <div className="form-group">
                        <label>Dimensions (LxWxH cm)</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <input className="form-input" type="number" placeholder="L" name="length" value={formData.length} onChange={handleInputChange} style={{ flex: 1 }} />
                          <input className="form-input" type="number" placeholder="W" name="width" value={formData.width} onChange={handleInputChange} style={{ flex: 1 }} />
                          <input className="form-input" type="number" placeholder="H" name="height" value={formData.height} onChange={handleInputChange} style={{ flex: 1 }} />
                        </div>
                      </div>
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

            {/* New Sub Categories Horizontal Scroll Section for Mobile UI/UX */}
            {showSubcategoriesBar && (
              <div className="mobile-subcategories-scroll-wrapper">
                <div className="mobile-subcategories-scroll">
                  {currentSubcategories.map(sub => {
                    const isActive = selectedSubcategory === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        className={`subcat-scroll-card ${isActive ? 'active' : ''}`}
                        onClick={(e) => {
                          handleSubcategorySelect(selectedCategory, sub);
                          e.currentTarget.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest',
                            inline: 'center'
                          });
                        }}
                      >
                        <div className="subcat-scroll-icon" style={{ overflow: 'hidden' }}>
                          {(() => {
                            if (sub === 'All') return getSubcategoryIcon(sub);
                            const subProduct = products.find(p => p.category === selectedCategory && p.subcategory === sub && p.image);
                            if (subProduct) {
                              return <img src={resolveImageUrl(subProduct.image)} alt={sub} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                            }
                            return getSubcategoryIcon(sub);
                          })()}
                        </div>
                        <span className="subcat-scroll-name">{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="products-grid-page">
              {(() => {
                if (viewMode === 'categories') {
                  if (availableCategories.length === 0) return <SkeletonProductGrid />;
                  return availableCategories.map(cat => (
                    <SubcategoryCard
                      key={cat.name}
                      subcategory={cat}
                      onClick={(name) => {
                        setSelectedCategory(name);
                        setSearchParams(prev => {
                          const next = new URLSearchParams(prev);
                          next.set('category', name);
                          next.delete('subcategory');
                          next.delete('page');
                          return next;
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  ));
                }

                if (viewMode === 'series') {
                  if (availableSeries.length === 0) return <SkeletonProductGrid />;
                  return (
                    <>
                      <div style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
                        <button
                          onClick={() => {
                            setSelectedCategory('All');
                            setSearchParams(prev => {
                              const next = new URLSearchParams(prev);
                              next.delete('category');
                              next.delete('subcategory');
                              next.delete('page');
                              return next;
                            });
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                        >
                          <ArrowLeft size={16} /> Back to Categories
                        </button>
                      </div>
                      {availableSeries.map(sub => (
                        <SubcategoryCard
                          key={sub.name}
                          subcategory={sub}
                          onClick={(name) => {
                            setSelectedSubcategory(name);
                            setSearchParams(prev => {
                              const next = new URLSearchParams(prev);
                              next.set('subcategory', name);
                              next.delete('page');
                              return next;
                            });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        />
                      ))}
                    </>
                  );
                }

                if (viewMode === 'products') {
                  return (
                    <>
                      <div style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
                        <button
                          onClick={() => {
                            setSelectedSubcategory('All');
                            setSearchParams(prev => {
                              const next = new URLSearchParams(prev);
                              next.delete('subcategory');
                              next.delete('page');
                              return next;
                            });
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                        >
                          <ArrowLeft size={16} /> Back to Series
                        </button>
                      </div>
                      {loading ? (
                        <SkeletonProductGrid />
                      ) : (
                        displayProducts.map(product => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            displayName={getProductDisplayName(product)}
                            isAdmin={admin}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteProduct}
                            searchTerm={debouncedSearch}
                            isSelected={selectedProductIds.includes(product.id)}
                            onSelectToggle={handleSelectToggle}
                            onAddToCart={handleAddToCartClick}
                          />
                        ))
                      )}
                    </>
                  );
                }

                return null;
              })()}


              {/* Server-Synced Pagination Controls */}
              {viewMode === 'products' && totalPagesLocal > 1 && (
                <div className="pagination-container" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '40px 0', marginTop: '20px' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ChevronLeft size={18} /> Prev
                  </button>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {Array.from({ length: Math.min(5, Math.max(1, totalPagesLocal)) }, (_, i) => {
                      const totalPages = Math.max(1, totalPagesLocal);
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage > 3) {
                          pageNum = currentPage - 2 + i;
                        }
                        if (currentPage > totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`btn ${currentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                          style={{ minWidth: '40px', padding: '8px', borderRadius: '8px' }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {Math.max(1, totalPagesLocal) > 5 && currentPage < Math.max(1, totalPagesLocal) - 2 && (
                      <>
                        <span style={{ color: '#94a3b8' }}>...</span>
                        <button
                          onClick={() => handlePageChange(Math.max(1, totalPagesLocal))}
                          className="btn btn-outline"
                          style={{ minWidth: '40px', padding: '8px', borderRadius: '8px' }}
                        >
                          {Math.max(1, totalPagesLocal)}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    disabled={currentPage >= Math.max(1, totalPagesLocal)}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {isBackgroundLoading && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-accent)' }}>
                  Loading page...
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* AI Visual Scanner Modal */}
      {isScanning && (
        <div className="scanner-modal-overlay" onClick={() => {
          setIsScanning(false);
          setScanImage(null);
          setScanMatches([]);
          setScanError('');
          setDetectedBearingType('');
          setScanReasoning('');
        }}>
          <div className="scanner-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>AI Bearing Visual Scanner</h3>
              <button className="close-modal" onClick={() => {
                setIsScanning(false);
                setScanImage(null);
                setScanMatches([]);
                setScanError('');
                setDetectedBearingType('');
                setScanReasoning('');
              }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {!scanImage ? (
                <div className="scanner-upload-placeholder">
                  <div className="scanner-icon-container">
                    <Camera size={48} className="scanner-icon" />
                  </div>
                  <p className="scanner-prompt">Upload or snap a photo of the bearing or oil seal to identify it instantly.</p>
                  <label className="btn btn-primary scanner-select-btn">
                    Take Photo / Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={handleImageScanChange}
                    />
                  </label>
                </div>
              ) : (
                <div className="scanner-preview-container">
                  <div className="image-preview-wrapper">
                    <img src={scanImage} alt="Bearing preview" className="bearing-scan-preview" />
                    {scanningInProgress && <div className="scanning-laser-line"></div>}
                  </div>

                  {scanningInProgress && (
                    <div className="scanning-status">
                      <Loader2 className="animate-spin" size={24} style={{ marginRight: '10px', color: 'var(--color-accent)' }} />
                      <span>Analyzing visual specs and matching with catalog...</span>
                    </div>
                  )}

                  {scanError && (
                    <div className="scan-error-alert">
                      <X size={18} style={{ marginRight: '8px' }} />
                      <span>{scanError}</span>
                    </div>
                  )}

                  {!scanningInProgress && !scanError && scanMatches.length > 0 && (
                    <div className="scan-results-container">
                      <div className="detected-header">
                        <h4>Detected: <span className="highlight-text">{detectedBearingType}</span></h4>
                      </div>
                      <p className="scan-reasoning">{scanReasoning}</p>

                      <h5 className="matches-title">Top Database Matches:</h5>
                      <div className="scan-matches-list">
                        {scanMatches.map((match, idx) => (
                          <div key={idx} className="scan-match-item" onClick={() => handleApplyScanMatch(match.sku)}>
                            <div className="match-info">
                              <span className="match-sku">{match.sku}</span>
                              <span className="match-reason">{match.reason}</span>
                            </div>
                            <div className="match-confidence">
                              <span className="confidence-pill" style={{ background: match.confidence > 80 ? '#dcfce7' : '#fef9c3', color: match.confidence > 80 ? '#15803d' : '#854d0e', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                {match.confidence}% Match
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="scanner-actions">
                    <button className="btn btn-outline" onClick={() => {
                      setScanImage(null);
                      setScanMatches([]);
                      setScanError('');
                      setDetectedBearingType('');
                      setScanReasoning('');
                    }}>
                      Scan Different Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Drawer Overlay */}
      {selectedDrawerProduct && (
        <div className="product-drawer-overlay" onClick={() => setSelectedDrawerProduct(null)}>
          <div className="product-drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Product Quick View</h3>
              <button className="close-modal" onClick={() => setSelectedDrawerProduct(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-image-section">
                <img
                  src={resolveImageUrl(selectedDrawerProduct.image)}
                  alt={selectedDrawerProduct.name}
                  className="drawer-image"
                />
              </div>

              <div className="drawer-details">
                {selectedDrawerProduct.brand && (
                  <span className="drawer-brand">{selectedDrawerProduct.brand}</span>
                )}
                <h2 className="drawer-title">{selectedDrawerProduct.name}</h2>
                <span className="drawer-category">
                  {selectedDrawerProduct.category} {selectedDrawerProduct.subcategory ? `> ${selectedDrawerProduct.subcategory}` : ''}
                </span>

                {selectedDrawerProduct.price ? (
                  <div className="drawer-price">
                    ₹{selectedDrawerProduct.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                ) : (
                  <div className="drawer-price" style={{ fontSize: '1.2rem', color: '#ea580c' }}>
                    Price on Request
                  </div>
                )}
              </div>

              {/* Sizes / Variants Selector */}
              {getProductVariants(selectedDrawerProduct).length > 1 && (
                <div className="drawer-sizes-section">
                  <h4 className="drawer-section-title">Available Sizes / Models</h4>
                  <div className="drawer-sizes-grid">
                    {getProductVariants(selectedDrawerProduct).map(variant => (
                      <button
                        key={variant.id}
                        className={`drawer-size-btn ${variant.id === selectedDrawerProduct.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedDrawerProduct(variant);
                          const existingCartItem = cartItems.find(item => String(item.id) === String(variant.id));
                          setDrawerQuantity(existingCartItem ? existingCartItem.quantity : 1);
                        }}
                        title={variant.name}
                      >
                        {getVariantSizeLabel(variant.name, selectedDrawerProduct)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description / Features */}
              {selectedDrawerProduct.description && (
                <div className="drawer-desc-section">
                  <h4 className="drawer-section-title">Description</h4>
                  <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                    {selectedDrawerProduct.description}
                  </p>
                </div>
              )}

              {selectedDrawerProduct.features && selectedDrawerProduct.features.length > 0 && (
                <div className="drawer-features-section">
                  <h4 className="drawer-section-title">Key Features</h4>
                  <ul className="drawer-features">
                    {selectedDrawerProduct.features.slice(0, 3).map((feat, idx) => (
                      <li key={idx}>{feat}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Drawer Actions */}
              <div className="drawer-actions-container" style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                {!admin ? (
                  <div className="drawer-actions">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Quantity:</span>
                      <div className="drawer-qty-selector">
                        <div className="drawer-qty-control">
                          <button
                            className="drawer-qty-btn"
                            onClick={() => setDrawerQuantity(Math.max(1, drawerQuantity - 1))}
                          >
                            -
                          </button>
                          <span className="drawer-qty-val">{drawerQuantity}</span>
                          <button
                            className="drawer-qty-btn"
                            onClick={() => setDrawerQuantity(drawerQuantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="drawer-cart-btn"
                        style={{ flex: 1 }}
                        onClick={() => {
                          const user = localStorage.getItem('user');
                          if (!user) {
                            showToast("Login required to add to cart", "error");
                            navigate('/login');
                            return;
                          }
                          dispatch(addItem({
                            id: selectedDrawerProduct.id,
                            name: selectedDrawerProduct.name,
                            price: selectedDrawerProduct.price || 0,
                            image: selectedDrawerProduct.image,
                            quantity: drawerQuantity,
                            replace: true
                          }));
                          showToast("Added to cart", "success");
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    Admin View - Purchasing Disabled
                  </div>
                )}

                <Link
                  to={`/product/${selectedDrawerProduct.slug || selectedDrawerProduct.id}`}
                  className="drawer-view-specs"
                  onClick={() => setSelectedDrawerProduct(null)}
                >
                  View Full Specifications & Downloads →
                </Link>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Category Selection Drawer */}
      {isCategoryDrawerOpen && (
        <div className="category-drawer-overlay" onClick={() => {
          setIsCategoryDrawerOpen(false);
          setDrawerStep('category');
        }}>
          <div className="category-drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {drawerStep === 'subcategory' && (
                  <button
                    type="button"
                    className="drawer-back-btn"
                    onClick={() => setDrawerStep('category')}
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h3>{drawerStep === 'category' ? 'Select Category' : 'Select Subcategory'}</h3>
              </div>
              <button
                type="button"
                className="close-modal"
                onClick={() => {
                  setIsCategoryDrawerOpen(false);
                  setDrawerStep('category');
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body">
              {drawerStep === 'category' ? (
                <div className="drawer-category-list">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={`drawer-category-item ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => {
                        if (cat === 'All') {
                          handleSelectAllCategories();
                        } else {
                          handleCategorySelect(cat);
                        }
                        setIsCategoryDrawerOpen(false);
                      }}
                    >
                      <span>{cat}</span>
                      {cat !== 'All' && <ChevronRight size={16} />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="drawer-category-list">
                  {subcategories.map(sub => (
                    <button
                      key={sub}
                      type="button"
                      className={`drawer-category-item ${selectedSubcategory === sub ? 'active' : ''}`}
                      onClick={() => {
                        handleSubcategorySelect(selectedCategory, sub);
                        setIsCategoryDrawerOpen(false);
                        setDrawerStep('category');
                      }}
                    >
                      <span>{sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {admin && selectedProductIds.length > 0 && (
        <div className="floating-bulk-actions-bar">
          <div className="bulk-actions-content">
            <span className="selected-count">
              <strong>{selectedProductIds.length}</strong> products selected
            </span>
            <div className="bulk-actions-buttons">
              <button className="btn btn-outline-light" onClick={() => setSelectedProductIds([])}>
                Clear Selection
              </button>
              <button className="btn btn-danger" onClick={handleBulkDelete}>
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Series Sizes Modal */}
      {showSeriesModal && selectedSeriesProduct && (
        <div
          className="fullscreen-overlay-modal"
          onClick={() => {
            setShowSeriesModal(false);
            setSelectedSeriesProduct(null);
            setSeriesProducts([]);
          }}
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
                  {selectedSeriesProduct.subcategory || selectedSeriesProduct.name.split(/\s+/)[0]} Sizing & Options
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Select options below to view details and add to cart.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSeriesModal(false);
                  setSelectedSeriesProduct(null);
                  setSeriesProducts([]);
                }}
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

            {/* Voltage Selector (if applicable) */}
            {((selectedSeriesProduct.name || "").toLowerCase().includes("solenoid") ||
              (selectedSeriesProduct.category || "").toLowerCase().includes("valve") ||
              (selectedSeriesProduct.name || "").toLowerCase().includes("heat exchanger") ||
              (selectedSeriesProduct.category || "").toLowerCase().includes("heat exchanger")) && (
                <div className="voltage-selector-container" style={{ padding: '0 24px', margin: '20px 0 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Select Voltage:
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(((selectedSeriesProduct.name || "").toLowerCase().includes("heat exchanger") || (selectedSeriesProduct.category || "").toLowerCase().includes("heat exchanger")) ? ['12V', '24V', '220V', '440V'] : ['12V', '24V', '120V', '240V']).map((v) => {
                      const isVoltageSelected = selectedVoltage === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSelectedVoltage(v)}
                          className={`size-option-pill ${isVoltageSelected ? 'active' : ''}`}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: isVoltageSelected ? '1px solid #ea580c' : '1px solid #cbd5e1',
                            background: isVoltageSelected ? 'rgba(234, 88, 12, 0.08)' : '#ffffff',
                            color: isVoltageSelected ? '#ea580c' : '#334155',
                            fontWeight: isVoltageSelected ? '700' : '600',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isVoltageSelected ? '0 2px 8px rgba(234, 88, 12, 0.15)' : '0 1px 3px rgba(0,0,0,0.02)'
                          }}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Search Bar - only show if there are multiple variants to search */}
            {seriesProducts.length > 1 && (
              <div style={{ padding: '0 24px', margin: '20px 0 0' }}>
                <input
                  type="text"
                  placeholder="Search precise sizes or SKUs..."
                  value={seriesSearchItem}
                  onChange={(e) => setSeriesSearchItem(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    outline: 'none',
                    fontSize: '0.95rem',
                    color: '#0f172a'
                  }}
                />
              </div>
            )}

            {/* List Container */}
            <div style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {seriesProducts.length === 0 ? (
                // If there are no other variants in the array (e.g. database load issue), fall back to the base product itself
                [selectedSeriesProduct].map((item) => {
                  const isCurrent = true;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSeriesSelect(item)}
                      className="series-modal-item current"
                    >
                      <div className="series-modal-info">
                        <div className="series-modal-img">
                          <ProtectedImage
                            src={resolveImageUrl(item.image)}
                            alt={item.name}
                          />
                        </div>
                        <div className="series-modal-text">
                          <h4>
                            {(item.category || "").toLowerCase().includes("seal") ? (item.sku || item.name) : item.name}
                          </h4>
                          <span>
                            SKU: {item.sku || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="series-modal-actions">
                        <div className="series-modal-price">
                          <div className="price-val">
                            ₹{item.price?.toFixed(2)}
                          </div>
                          <span className="viewing-label">
                            Selected
                          </span>
                        </div>
                        <div className="series-modal-qty">
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

                            const isVoltageProduct = (item.name || "").toLowerCase().includes("solenoid") ||
                              (item.category || "").toLowerCase().includes("valve") ||
                              (item.name || "").toLowerCase().includes("heat exchanger") ||
                              (item.category || "").toLowerCase().includes("heat exchanger");

                            const rawSize = item.specifications ? (item.specifications["Bore Diameter"] || item.specifications["bore diameter"]) : "";
                            const sizeStr = rawSize ? String(rawSize) : "";

                            const finalSize = isVoltageProduct
                              ? (sizeStr ? `${sizeStr} | Voltage: ${selectedVoltage}` : `Voltage: ${selectedVoltage}`)
                              : sizeStr || "Standard Size";

                            dispatch(addItem({
                              id: item.id,
                              name: item.name,
                              price: item.price || 0,
                              image: item.image,
                              quantity: addQty,
                              size: finalSize,
                              replace: false
                            }));
                            showToast('Added to cart!', 'success');
                          }}
                          className="series-modal-cart-btn"
                          title="Add to Cart"
                        >
                          <ShoppingCart size={16} />
                        </button>
                        <ChevronRight size={18} style={{ color: '#ea580c' }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                seriesProducts
                  .filter(item =>
                    item.name.toLowerCase().includes(seriesSearchItem.toLowerCase()) ||
                    (item.sku && item.sku.toLowerCase().includes(seriesSearchItem.toLowerCase()))
                  )
                  .map((item) => {
                    const isCurrent = String(item.id) === String(selectedSeriesProduct.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSeriesSelect(item)}
                        className={`series-modal-item ${isCurrent ? 'current' : ''}`}
                      >
                        <div className="series-modal-info">
                          <div className="series-modal-img">
                            <ProtectedImage
                              src={resolveImageUrl(item.image)}
                              alt={item.name}
                            />
                          </div>
                          <div className="series-modal-text">
                            <h4>
                              {(item.category || "").toLowerCase().includes("seal") ? (item.sku || item.name) : item.name}
                            </h4>
                            <span>
                              SKU: {item.sku || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="series-modal-actions">
                          <div className="series-modal-price">
                            <div className="price-val">
                              ₹{item.price?.toFixed(2)}
                            </div>
                            {isCurrent && (
                              <span className="viewing-label">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="series-modal-qty">
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

                              const isVoltageProduct = (item.name || "").toLowerCase().includes("solenoid") ||
                                (item.category || "").toLowerCase().includes("valve") ||
                                (item.name || "").toLowerCase().includes("heat exchanger") ||
                                (item.category || "").toLowerCase().includes("heat exchanger");

                              const rawSize = item.specifications ? (item.specifications["Bore Diameter"] || item.specifications["bore diameter"]) : "";
                              const sizeStr = rawSize ? String(rawSize) : "";

                              const finalSize = isVoltageProduct
                                ? (sizeStr ? `${sizeStr} | Voltage: ${selectedVoltage}` : `Voltage: ${selectedVoltage}`)
                                : sizeStr || "Standard Size";

                              dispatch(addItem({
                                id: item.id,
                                name: item.name,
                                price: item.price || 0,
                                image: item.image,
                                quantity: addQty,
                                size: finalSize,
                                replace: false
                              }));
                              showToast('Added to cart!', 'success');
                            }}
                            className="series-modal-cart-btn"
                            title="Add to Cart"
                          >
                            <ShoppingCart size={16} />
                          </button>
                          <ChevronRight size={18} style={{ color: isCurrent ? '#ea580c' : '#94a3b8' }} />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              textAlign: 'right',
              background: '#f8fafc'
            }}>
              <button
                onClick={() => {
                  setShowSeriesModal(false);
                  setSelectedSeriesProduct(null);
                  setSeriesProducts([]);
                }}
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

export default Products;

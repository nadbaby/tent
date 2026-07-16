import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../utils/api';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import ProductCard, { resolveImageUrl } from '../../components/home/ProductCard';
import { Filter, ChevronDown, Search, Grid, List, SlidersHorizontal, Plus, X, Save, Download, Upload, Camera, Loader2, Database, FileSpreadsheet } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '../../redux/cartSlice';
import { useToast } from '../../context/ToastContext';
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

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const cartItems = useSelector((state) => state.cart.items);

  // Drawer States
  const [selectedDrawerProduct, setSelectedDrawerProduct] = useState(null);
  const [drawerQuantity, setDrawerQuantity] = useState(1);

  // Get all variants of the product (same subcategory, or same name prefix/base)
  const getProductVariants = (currentProduct) => {
    if (!currentProduct) return [];
    
    // If product has a subcategory, all products sharing the same category and subcategory are variants
    if (currentProduct.subcategory && currentProduct.subcategory.trim() !== "" && currentProduct.subcategory.toLowerCase() !== "all") {
      return products.filter(p => 
        p.subcategory && 
        p.subcategory.trim().toLowerCase() === currentProduct.subcategory.trim().toLowerCase() && 
        p.category === currentProduct.category
      );
    }
    
    // Helper to get alphabetic/numeric prefix, e.g. "UCP" from "UCP 217 L3" or "6207" from "6207 2RS"
    const getPrefix = (name) => {
      if (!name) return "";
      const match = name.match(/^([a-zA-Z\s]+)/);
      if (match) return match[1].trim().toLowerCase();
      // For names starting with numbers, extract the first token/word
      const firstToken = name.trim().split(/[\s\-]/)[0];
      return firstToken ? firstToken.toLowerCase() : name.toLowerCase();
    };

    const currentPrefix = getPrefix(currentProduct.name);
    if (!currentPrefix) return [currentProduct];

    // Find all products in the database that share the same prefix and category
    return products.filter(p => {
      const pPrefix = getPrefix(p.name);
      return pPrefix === currentPrefix && p.category === currentProduct.category;
    });
  };

  const getVariantSizeLabel = (variantName, baseProduct) => {
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
    if (p.subcategory && p.subcategory.toLowerCase().trim() !== 'all') {
      return p.subcategory.trim();
    }
    if (!p.name) return "";
    const match = p.name.match(/^([a-zA-Z\s]+)/);
    if (match) return match[1].trim();
    return p.name.split(/[\s\-0-9]/)[0];
  };

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
        "Weight (Kg)": 0.5,
        "Length (cm)": 15,
        "Width (cm)": 10,
        "Height (cm)": 5,
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

  const handleExportProducts = () => {
    let productsToExport = products;
    
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

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Export");
    XLSX.writeFile(wb, "Products_Export.xlsx");
    setShowExportModal(false);
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

  const fetchProducts = async () => {
    try {
      setSelectedProductIds([]);
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

    setImporting(true);
    setImportProgress({ total: 0, processed: 0, success: 0, failed: 0, errors: [] });
    setFailedImportRows([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
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

  const downloadFailedExcel = () => {
    if (failedImportRows.length === 0) return;

    // Transform the failed rows to include a "Failure Reason" column at the beginning
    const dataToExport = failedImportRows.map(f => {
      return {
        "Failure Reason": f.error,
        ...f.rowData
      };
    });

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

  const categories = ['All', ...new Set(products.map(cat => cat.category).filter(Boolean))];
  const subcategories = ['All', ...new Set(products.filter(p => selectedCategory === 'All' || p.category === selectedCategory).map(p => p.subcategory).filter(Boolean))];

  const exportAvailableSubcategories = [...new Set(
    products
      .filter(p => exportCategories.includes('All') || exportCategories.length === 0 || exportCategories.includes(p.category))
      .map(p => p.subcategory)
      .filter(Boolean)
  )].sort();
  const searchParam = queryParams.get('search');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchParam) setSearchTerm(searchParam);
    if (categoryParam) {
      // Find the best match in the actual database categories list
      const normalizedQueryCat = categoryParam.trim().toLowerCase().replace(/s$/, ''); // e.g. "motors" -> "motor"
      const foundCategory = categories.find(cat => {
        if (cat === 'All') return false;
        const normalizedDbCat = cat.trim().toLowerCase().replace(/s$/, '');
        return normalizedDbCat === normalizedQueryCat;
      });
      if (foundCategory) {
        setSelectedCategory(foundCategory);
      } else {
        setSelectedCategory(categoryParam);
      }
    }
    if (subcategoryParam) setSelectedSubcategory(subcategoryParam);
    if (brandParam) setSelectedBrand(brandParam);
  }, [searchParam, categoryParam, subcategoryParam, brandParam, products]);

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
      const selectedLower = selectedCategory.toLowerCase().trim();
      const pCatLower = (p.category || '').toLowerCase().trim();

      const matchesCategory = selectedCategory === 'All' ||
        pCatLower === selectedLower ||
        (pCatLower && selectedLower.includes(pCatLower)) ||
        (pCatLower && pCatLower.includes(selectedLower.replace(/s$/, '')));
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

  const displayProducts = (() => {
    const collapsed = [];
    const seen = new Set();
    
    const getFamilyKey = (p) => {
      if (p.subcategory && p.subcategory.toLowerCase().trim() !== 'all') {
        return `sub_${p.subcategory.toLowerCase().trim()}`;
      }
      const getPrefix = (name) => {
        if (!name) return "";
        const match = name.match(/^([a-zA-Z\s]+)/);
        if (match) return match[1].trim().toLowerCase();
        return name.split(/[\s\-0-9]/)[0].toLowerCase();
      };
      return `prefix_${getPrefix(p.name)}_${p.category || ''}`;
    };

    filteredProducts.forEach(p => {
      const familyKey = getFamilyKey(p);
      if (!seen.has(familyKey)) {
        seen.add(familyKey);
        collapsed.push(p);
      }
    });
    return collapsed;
  })();

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
  }, [products, displayProducts, visibleCount]);


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
                <button
                  type="button"
                  className="scanner-btn"
                  title="Scan bearing image with AI"
                  onClick={() => setIsScanning(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', color: '#64748b', display: 'flex', alignItems: 'center' }}
                >
                  <Camera size={18} />
                </button>
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

            <div className="products-grid-page">
              {displayProducts.slice(0, visibleCount).map(product => (
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
                />
              ))}

              {/* Observer Target for Infinite Scroll */}
              {displayProducts.length > visibleCount && (
                <div ref={observerTarget} className="scroll-sentinel" style={{ height: '20px', gridColumn: '1 / -1' }}></div>
              )}

              {displayProducts.length === 0 && (
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
                      
                      {selectedDrawerProduct.price && (
                        <button 
                          className="drawer-checkout-btn" 
                          style={{ flex: 1 }}
                          onClick={() => {
                            const user = localStorage.getItem('user');
                            if (!user) {
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
                            navigate('/checkout');
                          }}
                        >
                          Buy Now
                        </button>
                      )}
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
    </div>
  );
};

export default Products;

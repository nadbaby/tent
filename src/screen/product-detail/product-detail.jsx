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
  Award, ShieldAlert, Lock, ChevronDown, Check, UserCheck, ThumbsUp,
  ZoomIn, ZoomOut, ChevronLeft, X, Move
} from 'lucide-react';

let globalProductsCache = null;

import { getFamilyKey } from '../../utils/productUtils';

const findSeriesProducts = (currentProduct, allData) => {
  if (!currentProduct) return [];
  const targetFamily = getFamilyKey(currentProduct);
  let candidates = allData.filter(p => p.category === currentProduct.category && getFamilyKey(p) === targetFamily);

  // Sort them numerically by size / number in name
  candidates.sort((a, b) => {
    const nameA = a.name || "";
    const nameB = b.name || "";

    // If it's a seal, extract dimensions (e.g. "80X96X10")
    const isSeal = (currentProduct?.category || "").toLowerCase().includes("seal");
    if (isSeal) {
      const matchA = nameA.match(/^(\d+)/);
      const matchB = nameB.match(/^(\d+)/);
      if (matchA && matchB) {
        const valA = parseInt(matchA[1]);
        const valB = parseInt(matchB[1]);
        if (valA !== valB) return valA - valB;
      }
    }

    // Default numeric sort: extract first contiguous digit sequence in name
    const numA = parseInt(nameA.replace(/\D/g, '')) || 0;
    const numB = parseInt(nameB.replace(/\D/g, '')) || 0;
    if (numA !== numB) {
      return numA - numB;
    }
    // Fallback to alphabetical
    return nameA.localeCompare(nameB);
  });

  return candidates;
};



const generateRealisticReviews = (productName, category, sku, brand, productId) => {
  const brandName = brand || "Fine Bearing";
  const nameClean = productName || "Bearing";
  const catClean = (category || "").toLowerCase();

  // Simple deterministic pseudo-random generator
  const seedString = `${productName}-${category}-${sku}-${brand}-${productId || ''}`;
  let h = 0;
  for (let i = 0; i < seedString.length; i++) {
    h = (Math.imul(31, h) + seedString.charCodeAt(i)) | 0;
  }
  const random = () => {
    let t = h += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Deterministically decide count of reviews between 5 and 7
  const reviewCount = Math.floor(random() * 3) + 5; // 5, 6, or 7

  // Pool of Indian business names and customer names
  const names = [
    "Rajesh Malhotra", "Gill Agri Works", "Sandeep Engineering Services", "Khanna Machine Tools",
    "Avtar Singh (Ludhiana)", "Singla & Sons", "Apex Hydraulics", "Balaji Bearings & Machinery",
    "Jaspreet Mechanicals", "Verma Precision Works", "Devendra Gupta", "Premier Auto Spares",
    "Jagjit Industrial Corp", "Mittal Steels", "G.S. Mechanicals (Pvt Ltd)", "K.R. Tooling Solutions",
    "Royal Forge Ludhiana", "Harish Chawla", "Standard Machinery Parts", "VK Industries",
    "Guru Nanak Lathe House", "Amrit Pal & Co", "Pawan Kumar", "Vardhman Tex & Mill",
    "Ludhiana Gear Systems", "Amit Sharma (Plant Head)", "H.S. Sodhi", "Unique Seal & Gasket Co",
    "National Metal Works", "Satnam Agro Tech", "Bharat Forge & Tool", "Gupta Steel Re-rolling",
    "Tarun Mechanical Division", "Vinod Machine House", "Northern Engineering Hub", "Dashmesh Alloys",
    "Friends Auto Ludhiana", "Oswal Industrial Unit", "Ravi Kant (Superintendent)", "Preet Agri Implements",
    "Ludhiana Die & Tooling", "M.S. Machine Parts", "Sohan Lal Agencies", "Dynamic Power Packs",
    "Shivam Trading Co", "Kohli Hydraulic Works", "Super Seals & Spares", "Jindal Steels Ludhiana",
    "Sukhdev Singh", "Chopra Enterprise Supplier", "Jagdish & Sons", "Bhandari Machine Tools",
    "Malhotra Industries", "Techno Bearing Hub", "Surjit Singh & Co", "Vikas Mechanical Works",
    "Ludhiana CNC Shop", "Lamba Auto Engineers", "Deepak Polymers", "Arora Tool Room"
  ];

  // Shuffling names so that they are randomly selected but distinct in this review list
  const shuffledNames = [...names];
  for (let i = shuffledNames.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = shuffledNames[i];
    shuffledNames[i] = shuffledNames[j];
    shuffledNames[j] = temp;
  }

  // Pool of sentence elements to build unique reviews:
  // Part A: Openers
  const openers = [
    "The quality of this product is outstanding.",
    "Very reliable component for industrial operations.",
    "Perfect choice for our factory repair works.",
    "Decent pricing and original brand build.",
    "Using this unit on our primary workshop assembly.",
    "Replaced the old worn-out parts with this one.",
    "Highly durable construction and clean design.",
    "Great product overall, matches description, extremely useful.",
    "Excellent value for money and premium finishing.",
    "We bought a batch of these for our production machinery.",
    "Impressed with the tolerances and dimensions.",
    "Exactly matches the engineering specifications."
  ];

  // Part B: Category-specific reviews
  const sealReviews = [
    `The lips on this ${nameClean} are highly flexible and provide a total leakproof sealing.`,
    "Replaced previous gear box seals with this and leakage stopped completely.",
    "Rubber chemical resistance is top-notch, vital for our chemical process machinery.",
    "SNUG fit inside the bearing housing and holds grease pressure perfectly.",
    `Dimensions on this ${brandName} seal match the catalog exactly.`,
    "Double lip design does a fantastic job of blocking heavy dust from entry.",
    "Highly robust construction, withstands continuous heating shifts.",
    "Prevents dirt and moisture intrusion flawlessly in our agricultural machines.",
    "Top class quality viton/nitrile compound used. Zero cracking after months."
  ];

  const bearingReviews = [
    `Runs incredibly silent even when operated under high 1440 RPM speeds.`,
    "Radial and axial load tolerances are excellent, very minor noise friction.",
    "Comes pre-lubricated with high-grade premium grease. Very smooth spin.",
    "Installed this in our electric compressor motor and vibration levels dropped.",
    `Authentic engineering specifications, the clearance is as per standard standards.`,
    "No excessive heating observed even under continuous 12-hour shifts.",
    `Outstanding finish, this ${nameClean} from ${brandName} is a top product.`,
    "Runs cool and has very low friction. Perfect for heavy motor drive pumps.",
    "High steel hardness rating, durability is excellent under heavy load conditions."
  ];

  const pillowBlockReviews = [
    "Cast iron pillow housing is rugged, thick and heavy.",
    "Self-aligning insert bearing adjusts to misalignments easily.",
    "Grease fitting/nipple is well positioned for regular grease gun refills.",
    "Bolted securely to our conveyor frame, zero slippage or shaft vibration.",
    `Very durable casting quality on this ${brandName} block.`,
    "Installed on our blower fan shaft. Pre-mounted unit saves a lot of setup time.",
    "Outstanding structural build quality, handles heavy load with ease.",
    "Perfect for agricultural conveyor systems. Solid steel and housing alignment."
  ];

  const generalReviews = [
    `Runs very smooth and matches standard industrial criteria.`,
    "Excellent build quality, material standard feels premium and long-lasting.",
    "Standard dimensions are 100% accurate, fits perfectly into the machinery.",
    "Works great under heavy workload without thermal expansion issues.",
    "Very heavy-duty build, perfect packaging from supplier.",
    "Quality exceeds local market brands at a much better rate.",
    "Genuine OEM product quality, clean threads and precise manufacturing.",
    "Solid performance over the past month of continuous operation."
  ];

  // Part C: Shipping/Distributor feedback
  const closers = [
    `Prompt B2B dispatch, local Porter courier delivered within 2 hours in Ludhiana.`,
    "Received catalog and official HSN-coded GST bill immediately. Excellent transaction.",
    "Packaged very securely in standard heavy box wrapping.",
    "Original holographic brand sticker was intact. Trustworthy seller.",
    "Will definitely purchase more units in bulk from Chopra Enterprises.",
    "Super fast local delivery. Chopra team called to verify our details pre-dispatch.",
    "Very happy with wholesale online prices compared to local vendors.",
    "Best supplier of industrial components in the region, highly recommended.",
    "Smooth purchasing process via cart checkout, secure delivery.",
    "Chopra's team arranged delivery on priority, saved our plant downtime."
  ];

  const reviews = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < reviewCount; i++) {
    // Generate date: within past 14 months (e.g. from June 2025 to July 2026)
    // Deterministic based on random()
    const dVal = random();
    const year = dVal > 0.5 ? 2025 : 2026;
    let monthIdx;
    if (year === 2026) {
      monthIdx = Math.floor(dVal * 7); // Jan to Jul 2026
    } else {
      monthIdx = Math.floor(dVal * 12); // Jan to Dec 2025
    }
    const day = Math.floor(dVal * 27) + 1; // 1 to 28 to avoid February out of range issues
    const dateStr = `${day} ${months[monthIdx]} ${year}`;

    // Generate rating: deterministic distribution (mostly 5s and 4s)
    let rating = 5;
    const rVal = random();
    if (rVal < 0.1) {
      rating = 3;
    } else if (rVal < 0.35) {
      rating = 4;
    }

    // Select opener, body, and closer based on random()
    const opener = openers[Math.floor(random() * openers.length)];
    const closer = closers[Math.floor(random() * closers.length)];

    let body = "";
    if (catClean.includes("seal")) {
      body = sealReviews[Math.floor(random() * sealReviews.length)];
    } else if (catClean.includes("pillow") || catClean.includes("ucp") || catClean.includes("block") || catClean.includes("ucf")) {
      body = pillowBlockReviews[Math.floor(random() * pillowBlockReviews.length)];
    } else if (catClean.includes("bearing") || productName.toLowerCase().includes("bearing")) {
      body = bearingReviews[Math.floor(random() * bearingReviews.length)];
    } else {
      body = generalReviews[Math.floor(random() * generalReviews.length)];
    }

    const comment = `${opener} ${body} ${closer}`;
    const name = shuffledNames[i % shuffledNames.length];

    reviews.push({
      name,
      rating,
      date: dateStr,
      comment
    });
  }

  // Sort reviews by date (newest first)
  const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  reviews.sort((a, b) => {
    const partsA = a.date.split(" ");
    const partsB = b.date.split(" ");
    const dateA = new Date(Number(partsA[2]), monthMap[partsA[1]], Number(partsA[0]));
    const dateB = new Date(Number(partsB[2]), monthMap[partsB[1]], Number(partsB[0]));
    return dateB - dateA;
  });

  return reviews;
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
  const reviews = product ? generateRealisticReviews(product.name, product.category, product.sku, product.brand, product.id) : [];
  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVoltage, setSelectedVoltage] = useState("24V");
  const [sizeOptions, setSizeOptions] = useState([]);

  // Modal / Interactive States
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [modalZoomScale, setModalZoomScale] = useState(1.0);
  const [modalPan, setModalPan] = useState({ x: 0, y: 0 });
  const [modalRotation, setModalRotation] = useState(0);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [dragStartModal, setDragStartModal] = useState({ x: 0, y: 0 });
  const [isHoveringMain, setIsHoveringMain] = useState(false);
  const [showRatingBreakdown, setShowRatingBreakdown] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [helpfulReviews, setHelpfulReviews] = useState({});
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [seriesProducts, setSeriesProducts] = useState([]);
  const [seriesSearchItem, setSeriesSearchItem] = useState('');

  // Refs
  const specsRef = useRef(null);
  const panTargetRef = useRef({ x: 0, y: 0 });
  const panCurrentRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef(null);
  const isHoveringRef = useRef(false);

  // Sync quantity with cart
  useEffect(() => {
    if (product) {
      const existingItem = cartItems.find(item => String(item.id) === String(product.id));
      if (existingItem) {
        setQuantity(existingItem.quantity);
      } else {
        setQuantity(1);
      }
    }
  }, [product, cartItems]);

  // Load product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!product) setLoading(true);
      setSelectedVoltage("24V");
      try {
        const res = await fetch(apiUrl(`/api/products/${id}`));
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || 'Product not found');
        }
        const data = await res.json();

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

        const prodReviews = generateRealisticReviews(data.name, category, sku, brand, data.id);
        const prodRating = prodReviews.length > 0
          ? parseFloat((prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length).toFixed(1))
          : 4.7;

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
          rating: prodRating,
          reviewsCount: prodReviews.length,
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

        // Fetch related products for the series and related row using category
        if (category) {
          try {
            const relRes = await fetch(apiUrl(`/api/products/related?category=${encodeURIComponent(category)}&brand=${encodeURIComponent(brand || '')}&excludeId=${data.id}`));
            if (relRes.ok) {
              const related = await relRes.json();
              setRelatedProducts(related);

              // Note: seriesProducts logically might require category members.
              // To keep series robust without massive payload, we can use the related products as series candidates.
              const matchedSeries = findSeriesProducts(enrichedProduct, related);
              setSeriesProducts(matchedSeries);
            }
          } catch (e) {
            console.warn("Could not fetch related products", e);
          }
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

  // Cleanup LERP pan animation loop on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Gallery LERP physics inertia smooth pan effect
  const animatePanLoop = () => {
    if (!isHoveringRef.current) return;

    // Smooth LERP (0.12 factor provides silky inertia physics acceleration/deceleration)
    panCurrentRef.current.x += (panTargetRef.current.x - panCurrentRef.current.x) * 0.12;
    panCurrentRef.current.y += (panTargetRef.current.y - panCurrentRef.current.y) * 0.12;

    setZoomStyle({
      transform: `scale(2.4) translate3d(${panCurrentRef.current.x.toFixed(2)}px, ${panCurrentRef.current.y.toFixed(2)}px, 0)`,
      transformOrigin: 'center center'
    });

    animFrameRef.current = requestAnimationFrame(animatePanLoop);
  };

  const handleMainMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scale = 2.4;
    const panX = ((rect.width / 2) - x) * (scale - 1) / scale;
    const panY = ((rect.height / 2) - y) * (scale - 1) / scale;

    panTargetRef.current = { x: panX, y: panY };
  };

  const handleMainMouseEnter = (e) => {
    setIsHoveringMain(true);
    isHoveringRef.current = true;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scale = 2.4;
    const panX = ((rect.width / 2) - x) * (scale - 1) / scale;
    const panY = ((rect.height / 2) - y) * (scale - 1) / scale;

    panTargetRef.current = { x: panX, y: panY };
    panCurrentRef.current = { x: panX, y: panY };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animatePanLoop);
  };

  const handleMainMouseLeave = () => {
    setIsHoveringMain(false);
    isHoveringRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    setZoomStyle({
      transform: 'scale(1) translate3d(0px, 0px, 0)',
      transformOrigin: 'center center'
    });
  };

  // HD Lightbox Professional Zoom Handlers
  const handleOpenLightbox = (index = selectedImageIndex) => {
    setSelectedImageIndex(index);
    setModalZoomScale(1.0);
    setModalPan({ x: 0, y: 0 });
    setModalRotation(0);
    setIsFullscreenActive(true);
  };

  const handleCloseLightbox = () => {
    setIsFullscreenActive(false);
    setModalZoomScale(1.0);
    setModalPan({ x: 0, y: 0 });
    setModalRotation(0);
    setIsDraggingModal(false);
  };

  const handleModalZoomIn = (e) => {
    if (e) e.stopPropagation();
    setModalZoomScale(prev => Math.min(4.0, +(prev + 0.5).toFixed(1)));
  };

  const handleModalZoomOut = (e) => {
    if (e) e.stopPropagation();
    setModalZoomScale(prev => {
      const next = Math.max(1.0, +(prev - 0.5).toFixed(1));
      if (next === 1.0) setModalPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleModalResetZoom = (e) => {
    if (e) e.stopPropagation();
    setModalZoomScale(1.0);
    setModalPan({ x: 0, y: 0 });
    setModalRotation(0);
  };

  const handleModalRotate = (e) => {
    if (e) e.stopPropagation();
    setModalRotation(prev => (prev + 90) % 360);
  };

  const handleModalPrevImage = (e) => {
    if (e) e.stopPropagation();
    if (!product || !product.images) return;
    setSelectedImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);
    setModalZoomScale(1.0);
    setModalPan({ x: 0, y: 0 });
  };

  const handleModalNextImage = (e) => {
    if (e) e.stopPropagation();
    if (!product || !product.images) return;
    setSelectedImageIndex(prev => (prev + 1) % product.images.length);
    setModalZoomScale(1.0);
    setModalPan({ x: 0, y: 0 });
  };

  const handleModalWheel = (e) => {
    if (!isFullscreenActive) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      setModalZoomScale(prev => Math.min(4.0, +(prev + 0.25).toFixed(2)));
    } else {
      setModalZoomScale(prev => {
        const next = Math.max(1.0, +(prev - 0.25).toFixed(2));
        if (next === 1.0) setModalPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleModalMouseDown = (e) => {
    if (modalZoomScale <= 1.0) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingModal(true);
    setDragStartModal({ x: e.clientX - modalPan.x, y: e.clientY - modalPan.y });
  };

  const handleModalMouseMove = (e) => {
    if (!isDraggingModal || modalZoomScale <= 1.0) return;
    e.preventDefault();
    setModalPan({
      x: e.clientX - dragStartModal.x,
      y: e.clientY - dragStartModal.y
    });
  };

  const handleModalMouseUp = () => {
    setIsDraggingModal(false);
  };

  const handleModalDoubleClick = (e) => {
    e.stopPropagation();
    if (modalZoomScale > 1.0) {
      setModalZoomScale(1.0);
      setModalPan({ x: 0, y: 0 });
    } else {
      setModalZoomScale(2.5);
    }
  };

  useEffect(() => {
    if (!isFullscreenActive) return;
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseLightbox();
      } else if (e.key === 'ArrowLeft') {
        handleModalPrevImage();
      } else if (e.key === 'ArrowRight') {
        handleModalNextImage();
      } else if (e.key === '+' || e.key === '=') {
        handleModalZoomIn();
      } else if (e.key === '-') {
        handleModalZoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        handleModalRotate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreenActive, product?.images?.length]);

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
    const isVoltageProduct = (product.name || "").toLowerCase().includes("solenoid") ||
      (product.category || "").toLowerCase().includes("valve") ||
      (product.name || "").toLowerCase().includes("heat exchanger") ||
      (product.category || "").toLowerCase().includes("heat exchanger");
    const finalSize = isVoltageProduct
      ? (selectedSize ? `${selectedSize} | Voltage: ${selectedVoltage}` : `Voltage: ${selectedVoltage}`)
      : selectedSize;

    dispatch(addItem({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      image: product.image,
      quantity: quantity,
      size: finalSize,
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
      {/* Top Banner Removed */}

      <div className="product-detail-container">
        {/* Hero Section */}
        <div className="product-main-content">

          {/* LEFT: Premium Product Images Column */}
          <div className="product-gallery">
            <div className="image-card-container">
              {/* Main image wrapper */}
              <div
                className="main-image-wrapper"
                onMouseMove={handleMainMouseMove}
                onMouseEnter={handleMainMouseEnter}
                onMouseLeave={handleMainMouseLeave}
                onClick={() => handleOpenLightbox(selectedImageIndex)}
                title="Click for HD Zoom & Fullscreen Lightbox"
              >
                <ProtectedImage
                  src={resolveImageUrl(product.images[selectedImageIndex])}
                  alt={product.name}
                  className="main-image main-image-pan"
                  style={{ ...zoomStyle, backgroundColor: '#ffffff' }}
                />

                <div className="zoom-hint-badge">
                  <ZoomIn size={14} />
                  <span>Click to Enlarge</span>
                </div>
              </div>

              {/* Gallery Interactive Toolbar */}
              <div className="gallery-interactive-bar">
                <button
                  type="button"
                  className={`interaction-btn ${isFullscreenActive ? 'active' : ''}`}
                  onClick={() => handleOpenLightbox(selectedImageIndex)}
                >
                  <Maximize2 size={16} /> Enlarge HD View
                </button>
              </div>
            </div>

            {/* Thumbnail list */}
            <div className="thumbnail-list">
              {product.images.map((img, index) => (
                <div
                  key={index}
                  className={`thumbnail-item ${selectedImageIndex === index && !isVideoActive ? 'active' : ''}`}
                  onClick={() => { setSelectedImageIndex(index); setIsVideoActive(false); }}
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <ProtectedImage src={resolveImageUrl(img)} alt={`Thumbnail ${index + 1}`} style={{ backgroundColor: '#ffffff' }} />
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

            <h1 className="product-title">
              {(product.category || "").toLowerCase().includes("seal") ? (product.sku || product.name) : product.name}
            </h1>

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
                new Date().getDay() !== 0 ? (
                  <div className="porter-delivery-alert">
                    <Truck size={18} className="alert-truck-icon" />
                    <div className="alert-text-block">
                      <strong>Urgent Ludhiana Delivery</strong>
                      <span>Immediate dispatch via Porter local delivery is available on request.</span>
                    </div>
                  </div>
                ) : (
                  <div className="porter-delivery-alert" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
                    <Truck size={18} className="alert-truck-icon" style={{ color: '#64748b' }} />
                    <div className="alert-text-block">
                      <strong>Porter Delivery (Closed Today)</strong>
                      <span>Porter local delivery is unavailable on Sundays. Standard shipping is active.</span>
                    </div>
                  </div>
                )
              )}
              {/* Series Size Selector (Different Products/Sizes in the Series) */}
              {seriesProducts.length > 1 && (
                <div className="series-sizes-container">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Select Size:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSeriesModal(true)}
                      className="select-size-trigger-btn"
                    >
                      <span className="select-size-trigger-label">
                        {(product.category || "").toLowerCase().includes("seal") ? (product.sku || product.name) : product.name}
                      </span>
                      <span className="select-size-trigger-action">
                        {seriesProducts.length} sizes available <ChevronDown size={16} />
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Voltage Selector */}
              {product && (
                (product.name || "").toLowerCase().includes("solenoid") ||
                (product.category || "").toLowerCase().includes("valve") ||
                (product.name || "").toLowerCase().includes("heat exchanger") ||
                (product.category || "").toLowerCase().includes("heat exchanger")
              ) && (
                  <div className="voltage-selector-container" style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Select Voltage:
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      {(((product.name || "").toLowerCase().includes("heat exchanger") || (product.category || "").toLowerCase().includes("heat exchanger")) ? ['12V', '24V', '220V', '440V'] : ['12V', '24V', '120V', '240V']).map((v) => {
                        const isSelected = selectedVoltage === v;
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setSelectedVoltage(v)}
                            className={`size-option-pill ${isSelected ? 'active' : ''}`}
                            style={{
                              padding: '10px 16px',
                              borderRadius: '8px',
                              border: isSelected ? '1px solid #ea580c' : '1px solid #cbd5e1',
                              background: isSelected ? 'rgba(234, 88, 12, 0.08)' : '#ffffff',
                              color: isSelected ? '#ea580c' : '#334155',
                              fontWeight: isSelected ? '700' : '600',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: isSelected ? '0 2px 8px rgba(234, 88, 12, 0.15)' : '0 1px 3px rgba(0,0,0,0.02)'
                            }}
                          >
                            {v}
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
                    {Object.entries(product.specifications)
                      .filter(([key]) => !['Bore Diameter', 'Outer Diameter', 'Overall Width'].includes(key))
                      .map(([key, val]) => (
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

        {/* Customer Reviews Section */}
        <section className="customer-reviews-section">
          <h2 className="section-title-premium" style={{ marginBottom: '2rem' }}>
            Customer Reviews & Ratings
          </h2>
          <div className="reviews-layout-grid">
            {/* Left: Summary Card */}
            <div className="reviews-summary-card">
              <div className="large-star-rating-box">
                <h3>{product.rating}</h3>
                <div className="star-stars">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} size={22} fill={i < Math.round(product.rating) ? "#ea580c" : "none"} color="#ea580c" />
                  ))}
                </div>
                <p>Based on {product.reviewsCount} verified reviews</p>
              </div>

              <div className="rating-progress-bar-column">
                <div className="progress-row">
                  <span>5 Star</span>
                  <div className="progress-bar-outer">
                    <div className="progress-bar-inner" style={{ width: '78%' }}></div>
                  </div>
                  <span>78%</span>
                </div>
                <div className="progress-row">
                  <span>4 Star</span>
                  <div className="progress-bar-outer">
                    <div className="progress-bar-inner" style={{ width: '15%' }}></div>
                  </div>
                  <span>15%</span>
                </div>
                <div className="progress-row">
                  <span>3 Star</span>
                  <div className="progress-bar-outer">
                    <div className="progress-bar-inner" style={{ width: '4%' }}></div>
                  </div>
                  <span>4%</span>
                </div>
                <div className="progress-row">
                  <span>2 Star</span>
                  <div className="progress-bar-outer">
                    <div className="progress-bar-inner" style={{ width: '2%' }}></div>
                  </div>
                  <span>2%</span>
                </div>
                <div className="progress-row">
                  <span>1 Star</span>
                  <div className="progress-bar-outer">
                    <div className="progress-bar-inner" style={{ width: '1%' }}></div>
                  </div>
                  <span>1%</span>
                </div>
              </div>
            </div>

            {/* Right: Reviews List */}
            <div className="reviews-list-block">
              {reviews.map((r, index) => {
                const initial = r.name ? r.name.charAt(0).toUpperCase() : 'B';
                return (
                  <div key={index} className="review-comment-card">
                    <div className="review-header">
                      <div className="buyer-meta">
                        <div className="buyer-avatar">
                          {initial}
                        </div>
                        <div>
                          <h5>{r.name}</h5>
                          <span className="verified-badge">
                            <CheckCircle2 size={14} /> Verified Buyer
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <div className="star-rating-small">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i} size={14} fill={i < r.rating ? "#ea580c" : "none"} color="#ea580c" />
                          ))}
                        </div>
                        <span className="review-date" style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.date}</span>
                      </div>
                    </div>
                    <p className="review-body">{r.comment}</p>
                    <div className="review-comment-footer">
                      <span>Was this review helpful?</span>
                      <button
                        onClick={() => handleHelpfulClick(index)}
                        className="helpful-btn"
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        <ThumbsUp size={12} />
                        Helpful ({helpfulReviews[index] || 0})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

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



      {/* Visual Overlay Modals */}
      {isFullscreenActive && (
        <div className="pro-lightbox-overlay" onClick={handleCloseLightbox}>
          {/* Lightbox Header Bar */}
          <div className="pro-lightbox-header" onClick={(e) => e.stopPropagation()}>
            <div className="pro-lightbox-title-block">
              <h3 className="pro-lightbox-title">{product.name}</h3>
              <span className="pro-lightbox-counter">
                Image {selectedImageIndex + 1} of {product.images.length}
              </span>
            </div>

            <div className="pro-lightbox-toolbar">
              <button
                type="button"
                className="lightbox-tool-btn"
                onClick={handleModalZoomOut}
                disabled={modalZoomScale <= 1.0}
                title="Zoom Out (-)"
              >
                <ZoomOut size={18} />
              </button>

              <span className="lightbox-scale-pill">
                {Math.round(modalZoomScale * 100)}%
              </span>

              <button
                type="button"
                className="lightbox-tool-btn"
                onClick={handleModalZoomIn}
                disabled={modalZoomScale >= 4.0}
                title="Zoom In (+)"
              >
                <ZoomIn size={18} />
              </button>

              <button
                type="button"
                className="lightbox-tool-btn"
                onClick={handleModalResetZoom}
                title="Reset View (R)"
              >
                <RotateCcw size={17} />
              </button>

              <button
                type="button"
                className="lightbox-tool-btn"
                onClick={handleModalRotate}
                title="Rotate 90°"
              >
                <RotateCw size={17} />
              </button>

              <div className="toolbar-divider"></div>

              <button
                type="button"
                className="lightbox-close-btn"
                onClick={handleCloseLightbox}
                title="Close Lightbox (Esc)"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Main Zoom Viewport */}
          <div
            className="pro-lightbox-viewport"
            onWheel={handleModalWheel}
            onMouseDown={handleModalMouseDown}
            onMouseMove={handleModalMouseMove}
            onMouseUp={handleModalMouseUp}
            onMouseLeave={handleModalMouseUp}
            onDoubleClick={handleModalDoubleClick}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: modalZoomScale > 1.0 ? (isDraggingModal ? 'grabbing' : 'grab') : 'zoom-in'
            }}
          >
            <div
              className="pro-lightbox-canvas"
              style={{
                transform: `translate3d(${modalPan.x}px, ${modalPan.y}px, 0) scale(${modalZoomScale}) rotate(${modalRotation}deg)`,
                transition: isDraggingModal ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <ProtectedImage
                src={resolveImageUrl(product.images[selectedImageIndex])}
                alt={`HD Preview ${selectedImageIndex + 1}`}
                className="pro-lightbox-image"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>

            {/* Navigation Arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  className="pro-lightbox-nav prev-arrow"
                  onClick={handleModalPrevImage}
                  title="Previous Image (←)"
                >
                  <ChevronLeft size={28} />
                </button>

                <button
                  type="button"
                  className="pro-lightbox-nav next-arrow"
                  onClick={handleModalNextImage}
                  title="Next Image (→)"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            {/* Interactive Floating Hint Bar */}
            <div className="pro-lightbox-hint-bar">
              <span>Scroll wheel to zoom</span> • <span>Drag to pan</span> • <span>Double click to toggle 2.5x</span> • <span>Arrow keys for next/prev</span>
            </div>
          </div>

          {/* Bottom Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="pro-lightbox-thumbnails" onClick={(e) => e.stopPropagation()}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`pro-lightbox-thumb ${selectedImageIndex === idx ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedImageIndex(idx);
                    setModalZoomScale(1.0);
                    setModalPan({ x: 0, y: 0 });
                  }}
                >
                  <ProtectedImage src={resolveImageUrl(img)} alt={`Thumb ${idx + 1}`} style={{ backgroundColor: 'transparent' }} />
                </button>
              ))}
            </div>
          )}
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

            {/* Search Bar */}
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

            {/* List Container */}
            <div style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {seriesProducts.filter(item => item.name.toLowerCase().includes(seriesSearchItem.toLowerCase()) || (item.sku && item.sku.toLowerCase().includes(seriesSearchItem.toLowerCase()))).map((item) => {
                const isCurrent = String(item.id) === String(product.id);
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
                            Currently Viewing
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
                        className="series-modal-cart-btn"
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

import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../utils/api';
import { getAuthToken } from '../../utils/auth';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCart } from '../../redux/cartSlice';
import { resolveImageUrl } from '../../components/home/ProductCard';
import { MapPin, ShoppingBag, CreditCard, CheckCircle, ChevronRight, User, Phone, Mail, Building, ArrowLeft, Search, Loader2, Info } from 'lucide-react';
import { indiaData } from '../../utils/indiaData';
import PaymentLoader from '../../components/common/PaymentLoader/PaymentLoader';
import './checkout.css';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalQuantity } = useSelector((state) => state.cart);
  const dropdownRef = useRef(null);

  const userData = JSON.parse(localStorage.getItem('user')) || null;
  const specialDiscount = userData?.specialDiscount || 0;

  const [step, setStep] = useState(1);
  const [addressSearch, setAddressSearch] = useState('');

  // Authentication Check
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login?redirect=checkout');
    }
  }, [navigate]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [addressData, setAddressData] = useState({
    fullName: userData?.name || '',
    phone: userData?.phone || '',
    email: userData?.email || '',
    company: userData?.company || '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
    lat: '',
    lng: '',
    landmark: '',
    nearbyPlaces: '',
    gstNumber: userData?.gstNumber || '',
    deliveryInstructions: ''
  });

  const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || '';

  // Debounced Search Effect
  useEffect(() => {
    if (addressSearch.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(() => fetchSuggestions(addressSearch), 400);
    return () => clearTimeout(timer);
  }, [addressSearch]);

  // Click Outside logic
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (text) => {
    if (!GEOAPIFY_KEY) {
      console.warn("Geoapify API key is missing. Address autocomplete will not work.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&filter=countrycode:in&limit=5&apiKey=${GEOAPIFY_KEY}`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setSuggestions(data.features || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Geoapify Autocomplete Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSuggestion = (feature) => {
    const props = feature.properties;
    const [lng, lat] = feature.geometry.coordinates;

    setAddressData(prev => ({
      ...prev,
      street: props.formatted,
      city: props.city || props.municipality || '',
      state: props.state || '',
      zip: props.postcode || '',
      country: props.country || 'India',
      lat: lat,
      lng: lng
    }));

    setAddressSearch(props.formatted);
    setShowDropdown(false);
  };

  const handleLocateMe = () => {
    setError('');
    if (!GEOAPIFY_KEY) {
      setError("Location services are not configured. (Missing API Key)");
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_KEY}`);
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const data = await res.json();
          if (data.features?.length > 0) {
            selectSuggestion(data.features[0]);
          } else {
            setError("Could not find address for your current location.");
          }
        } catch (err) {
          console.error("Reverse geocode error", err);
          setError("Failed to fetch address from coordinates.");
        }
      }, (err) => {
        console.error("Geolocation error", err);
        setError("Please enable location permissions in your browser.");
      });
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // --- Auto-fetch Location via IP (Geoapify) ---
  useEffect(() => {
    const fetchLocationByIP = async () => {
      if (!GEOAPIFY_KEY || addressData.city || addressData.state) return;

      try {
        const res = await fetch(`https://api.geoapify.com/v1/ipinfo?apiKey=${GEOAPIFY_KEY}`);
        if (!res.ok) return;
        
        const data = await res.json();
        if (data.city?.name || data.state?.name) {
          setAddressData(prev => ({
            ...prev,
            city: data.city?.name || prev.city,
            state: data.state?.name || prev.state,
            country: data.country?.name || prev.country,
            zip: data.postcode || prev.zip
          }));
          console.log("Auto-fetched location via IP:", data.city?.name, data.state?.name);
        }
      } catch (err) {
        console.warn("IP Location fetch failed:", err);
      }
    };

    fetchLocationByIP();
  }, [GEOAPIFY_KEY]);

  // --- Fetch Saved Addresses ---
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const res = await fetch(apiUrl('/api/user/addresses'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSavedAddresses(data.addresses || []);
          // Auto-select default if available
          const defaultAddr = data.addresses?.find(a => a.isDefault);
          if (defaultAddr) {
            handleSelectSavedAddress(defaultAddr);
          }
        }
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
      }
    };
    fetchSavedAddresses();
  }, []);

  const handleSelectSavedAddress = (addr) => {
    setAddressData({
      fullName: addr.fullName || userData?.name || '',
      phone: addr.phone || userData?.phone || '',
      email: addr.email || userData?.email || '',
      company: addr.company || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      zip: addr.zip || '',
      country: addr.country || 'India',
      lat: addr.lat || '',
      lng: addr.lng || '',
      landmark: addr.landmark || '',
      nearbyPlaces: addr.nearbyPlaces || '',
      gstNumber: addr.gstNumber || userData?.gstNumber || '',
      deliveryInstructions: addr.deliveryInstructions || ''
    });
    setSelectedAddressId(addr.id);
    setAddressSearch(addr.street || '');
  };

  const [shippingData, setShippingData] = useState({ 
    charge: 0, 
    days: '', 
    zone: '', 
    billableWeight: 0, 
    weights: null, 
    breakdown: null, 
    isFreeShippingApplied: false,
    freeShippingReason: '',
    apiIntegration: null,
    loading: false 
  });
  
  const [courierList, setCourierList] = useState([]);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PREPAID');

  // Load Courier Options on Mount
  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const res = await fetch(apiUrl('/api/shipping/couriers'));
        if (res.ok) {
          const data = await res.json();
          setCourierList(data);
          if (data.length > 0) {
            setSelectedCourierId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load couriers list:", err);
      }
    };
    fetchCouriers();
  }, []);

  // Fetch Shipping Charge dynamically based on address details, courier partner and prepaid/COD selection
  const fetchShippingCharge = async (zip, state, city, courierId = selectedCourierId, payMethod = paymentMethod) => {
    if (!city) return;

    setShippingData(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch(apiUrl('/api/calculate-shipping'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: items.map(i => ({ id: i.id, quantity: i.quantity })), 
          pincode: zip, 
          state, 
          city,
          invoiceValue: subtotal,
          courierId: courierId || undefined,
          paymentMethod: payMethod
        })
      });
      if (response.ok) {
        const data = await response.json();
        setShippingData({ 
          charge: data.finalTotal, 
          zone: data.zoneName, 
          billableWeight: Math.ceil(data.weights.chargeable), 
          weights: data.weights,
          breakdown: data.breakdown,
          isFreeShippingApplied: data.isFreeShippingApplied,
          freeShippingReason: data.freeShippingReason,
          apiIntegration: data.apiIntegration,
          loading: false 
        });
      }
    } catch (err) {
      console.error("Shipping API Error", err);
    } finally {
      setShippingData(prev => ({ ...prev, loading: false }));
    }
  };
  
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    if (!addressData.gstNumber) {
      setCouponError('Please enter your GST number in the shipping form first.');
      return;
    }
    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      const token = getAuthToken();
      const response = await fetch(apiUrl('/api/coupons/validate-gst'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          code: couponCode, 
          subtotal,
          gstNumber: addressData.gstNumber 
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setAppliedCoupon(data);
        setCouponError('');
      } else {
        setCouponError(data.message || 'Invalid coupon');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Connection error');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  useEffect(() => {
    if (addressData.city) {
      fetchShippingCharge(addressData.zip, addressData.state, addressData.city, selectedCourierId, paymentMethod);
    }
  }, [addressData.zip, addressData.state, addressData.city, selectedCourierId, paymentMethod]);

  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || (item.price * item.quantity) || 0), 0);
  const discountAmount = (subtotal * specialDiscount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = taxableAmount * 0.18;
  const shippingCharge = shippingData.charge;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const totalPrice = Math.max(0, taxableAmount + gstAmount + shippingCharge - couponDiscount);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      setAddressData(prev => ({ ...prev, state: value, city: '' }));
    } else {
      setAddressData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    if (addressData.zip.length !== 6) {
      setError("Please enter a valid 6-digit ZIP code");
      return;
    }
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handlePrevStep = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };

  // --- SECURE PAYMENT FLOW ---
  const handlePayment = async () => {
    setIsProcessingPayment(true);
    try {
      // 1. Create order on backend (Backend calculates total from DB)
      const token = getAuthToken();
      const response = await fetch(apiUrl('/api/payment/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, quantity: i.quantity })), // Only send ID and quantity
          shippingAddress: addressData,
          couponCode: appliedCoupon?.code,
          paymentMethod,
          courierId: selectedCourierId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error ? `${errorData.message}: ${errorData.error}` : (errorData.message || 'Order creation failed');
        throw new Error(errorMessage);
      }

      const orderData = await response.json();

      // If COD, bypass payment gateway verification entirely!
      if (paymentMethod === 'COD') {
        dispatch(clearCart());
        
        // Optionally save address to profile if checked
        if (saveThisAddress) {
          fetch(apiUrl('/api/user/addresses'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
            body: JSON.stringify(addressData)
          }).catch(err => console.error("Failed to save address:", err));
        }

        navigate('/order-success', { state: { order: orderData.order } });
        return;
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Fine Bearing & Oil Seal",
        description: "Secure Purchase",
        order_id: orderData.id,
        handler: async function (response) {
          // 3. Verify payment on backend
          try {
            const verifyRes = await fetch(apiUrl('/api/payment/verify'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }),
            });

            if (verifyRes.ok) {
              const result = await verifyRes.json();
              dispatch(clearCart());
              navigate('/order-success', { state: { order: result.order } });
            } else {
              const error = await verifyRes.json();
              navigate('/order-failure', { state: { message: error.message } });
            }
          } catch (err) {
            console.error("Verification Error:", err);
            navigate('/order-failure');
          }
        },
        prefill: {
          name: addressData.fullName,
          email: addressData.email,
          contact: addressData.phone
        },
        theme: { color: "#ea580c" },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
              navigate('/order-failure', { 
                state: { 
                  error: 'Payment was cancelled. If this was a mistake, you can try again.',
                  orderId: orderData.localOrderId 
                } 
              });
            }
          }
       };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        // Record failure in backend for tracking
        fetch(apiUrl('/api/payment/record-failure'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
          body: JSON.stringify({
            razorpay_order_id: orderData.id,
            error_message: response.error.description,
            gateway_response: response.error
          })
        }).catch(err => console.error("Failed to record payment failure:", err));

        navigate('/order-failure', { state: { error: response.error.description, orderId: orderData.localOrderId } });
      });

      // 4. Optionally save address to profile if checked
      if (saveThisAddress) {
        fetch(apiUrl('/api/user/addresses'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
          body: JSON.stringify(addressData)
        }).catch(err => console.error("Failed to save address:", err));
      }

      rzp.open();
    } catch (error) {
      console.error("Payment Error:", error);
      setError(error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (items.length === 0) return <div className="checkout-empty-state"><h2>Empty Cart</h2><button onClick={() => navigate('/products')}>Shop</button></div>;

  return (
    <div className="checkout-page">
      {isProcessingPayment && <PaymentLoader />}
      <div className="container">
        <div className="checkout-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}><div className="step-icon"><MapPin size={18} /></div><span>Shipping</span></div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}><div className="step-icon"><CheckCircle size={18} /></div><span>Review</span></div>
          <div className="progress-line"></div>
          <div className="progress-step"><div className="step-icon"><CreditCard size={18} /></div><span>Payment</span></div>
        </div>

        <div className="checkout-content">
          <div className="checkout-main">
            {step === 1 && (
              <div className="checkout-card">
                <div className="card-header">
                  <div className="header-flex">
                    <div>
                      <h3><MapPin size={20} /> Shipping Address</h3>
                      <p>Enter your details and address for fast delivery.</p>
                    </div>
                    <button type="button" onClick={handleLocateMe} className="locate-btn">
                      <MapPin size={14} /> Detect My Location
                    </button>
                  </div>
                </div>
                
                {savedAddresses.length > 0 && (
                  <div className="saved-addresses-section">
                    <h4><Building size={16} /> Use a Saved Address</h4>
                    <div className="saved-addresses-grid">
                      {savedAddresses.map(addr => (
                        <div 
                          key={addr.id} 
                          className={`saved-address-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                          onClick={() => handleSelectSavedAddress(addr)}
                        >
                          <div className="card-check">
                            <div className="check-circle"></div>
                          </div>
                          <div className="address-info">
                            <strong>{addr.fullName}</strong>
                            <p>{addr.street}, {addr.city}</p>
                            <p>{addr.state} - {addr.zip}</p>
                          </div>
                        </div>
                      ))}
                      <div 
                        className={`saved-address-card new-address ${!selectedAddressId ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedAddressId(null);
                          setAddressSearch('');
                          setAddressData(prev => ({ ...prev, street: '', city: '', state: '', zip: '', landmark: '', nearbyPlaces: '', deliveryInstructions: '' }));
                        }}
                      >
                         <div className="card-check">
                            <div className="check-circle"></div>
                          </div>
                          <div className="address-info">
                            <strong>New Address</strong>
                            <p>Enter a different delivery location</p>
                          </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="map-search-container" ref={dropdownRef}>
                  <div className="search-suggest-box">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Start typing your full address..."
                      value={addressSearch}
                      onChange={(e) => setAddressSearch(e.target.value)}
                      onFocus={() => addressSearch.length >= 3 && setShowDropdown(true)}
                    />
                    {isLoading && <Loader2 className="search-loader animate-spin" size={18} />}
                  </div>

                  {showDropdown && (
                    <div className="suggestions-list">
                      {suggestions.length > 0 ? (
                        suggestions.map((feature, index) => (
                          <div key={index} className="suggestion-item" onClick={() => selectSuggestion(feature)}>
                            <MapPin size={14} />
                            <span>{feature.properties.formatted}</span>
                          </div>
                        ))
                      ) : (
                        !isLoading && <div className="no-results">No address found for "{addressSearch}"</div>
                      )}
                    </div>
                  )}
                </div>

                <form className="address-form" onSubmit={handleNextStep}>
                  <div className="form-grid">
                    <div className="form-group full"><label><User size={14} /> Full Name *</label><input required name="fullName" value={addressData.fullName} onChange={handleInputChange} /></div>
                    <div className="form-group"><label><Phone size={14} /> Phone *</label><input required name="phone" value={addressData.phone} onChange={handleInputChange} /></div>
                    <div className="form-group"><label><Mail size={14} /> Email *</label><input required type="email" name="email" value={addressData.email} onChange={handleInputChange} /></div>

                    <div className="form-group full"><label>Street Address / Full Address *</label>
                      <textarea required name="street" value={addressData.street} onChange={handleInputChange} rows="2" />
                    </div>

                    <div className="form-group">
                      <label>State *</label>
                      <select required name="state" value={addressData.state} onChange={handleInputChange} className="checkout-select">
                        <option value="">Select State</option>
                        {Object.keys(indiaData).sort().map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>City *</label>
                      <select required name="city" value={addressData.city} onChange={handleInputChange} className="checkout-select" disabled={!addressData.state}>
                        <option value="">Select City</option>
                        {addressData.state && indiaData[addressData.state]?.sort().map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group"><label>ZIP Code *</label><input required name="zip" value={addressData.zip} onChange={handleInputChange} placeholder="6-digit Pincode" /></div>
                    <div className="form-group"><label>Country</label><input disabled name="country" value={addressData.country} /></div>
                    <div className="form-group full"><label>GST Number (Optional)</label><input name="gstNumber" placeholder="22AAAAA0000A1Z5" value={addressData.gstNumber} onChange={handleInputChange} /></div>

                    <div className="form-group full"><label>Landmark & Delivery Instructions *</label>
                      <textarea required name="nearbyPlaces" value={addressData.nearbyPlaces} onChange={handleInputChange} placeholder="e.g. Near Metro Pillar 12, Leave at gate" rows="2" />
                    </div>

                    {/* Courier selection & Payment selection */}
                    {courierList.length > 0 && (
                      <div className="form-group full shipping-options-group">
                        <label className="section-subtitle-label">Select Courier Partner</label>
                        <div className="couriers-selection-grid">
                          {courierList.map(courier => (
                            <div 
                              key={courier.id} 
                              className={`courier-option-card ${selectedCourierId === courier.id ? 'selected' : ''}`}
                              onClick={() => setSelectedCourierId(courier.id)}
                            >
                              <div className="courier-card-header">
                                <div className={`custom-radio-dot ${selectedCourierId === courier.id ? 'active' : ''}`}></div>
                                <span className="courier-name">{courier.name}</span>
                              </div>
                              <p className="courier-desc">
                                {courier.type === "aggregator" ? "Express Courier Aggregator" : "Standard Logistics Delivery"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="form-group full payment-options-group">
                      <label className="section-subtitle-label">Select Payment Option</label>
                      <div className="payment-selection-grid">
                        <div 
                          className={`payment-option-card ${paymentMethod === 'PREPAID' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('PREPAID')}
                        >
                          <div className="payment-card-header">
                            <div className={`custom-radio-dot ${paymentMethod === 'PREPAID' ? 'active' : ''}`}></div>
                            <span className="payment-name">Prepaid (Pay Online)</span>
                          </div>
                          <p className="payment-desc">Pay instantly using Cards, UPI, Netbanking or Wallets securely.</p>
                        </div>
                        <div 
                          className={`payment-option-card ${paymentMethod === 'COD' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('COD')}
                        >
                          <div className="payment-card-header">
                            <div className={`custom-radio-dot ${paymentMethod === 'COD' ? 'active' : ''}`}></div>
                            <span className="payment-name">Cash on Delivery (COD)</span>
                          </div>
                          <p className="payment-desc">Pay cash to delivery executive. Surcharge fee applies.</p>
                        </div>
                      </div>
                    </div>

                    <div className="form-group full save-address-check">
                      <label className="checkbox-container">
                        <input 
                          type="checkbox" 
                          checked={saveThisAddress} 
                          onChange={(e) => setSaveThisAddress(e.target.checked)} 
                        />
                        <span className="checkmark"></span>
                        Save this address to my profile for future orders
                      </label>
                    </div>
                  </div>

                  {error && <div className="checkout-error-alert">{error}</div>}

                  <button type="submit" className="btn-primary continue-btn">Continue to Review <ChevronRight size={18} /></button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div className="checkout-card">
                <div className="card-header"><h3><CheckCircle size={20} /> Order Review</h3></div>
                <div className="review-section">
                  <div className="review-address-box">
                    <strong>{addressData.fullName}</strong>
                    <p>{addressData.street}</p>
                    <p>{addressData.city}, {addressData.state} - {addressData.zip}</p>
                    <p className="contact-info">Phone: {addressData.phone}</p>
                    {addressData.gstNumber && <p className="contact-info">GSTIN: {addressData.gstNumber}</p>}
                  </div>
                </div>

                <div className="review-section">
                  <h4 className="section-title">Order Items</h4>
                  <div className="review-items-list">
                    {items.map(item => (
                      <div key={item.id} className="review-item">
                        <img src={resolveImageUrl(item.image)} alt={item.name} />
                        <div className="item-info">
                          <h5>{item.name}</h5>
                          <span>{item.quantity} units</span>
                        </div>
                        <div className="item-price">₹{(item.totalPrice || (item.price * item.quantity) || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <div className="checkout-error-alert">{error}</div>}

                <div className="form-actions">
                  <button onClick={handlePrevStep} className="btn-outline back-btn"><ArrowLeft size={18} /> Back</button>
                  <button onClick={handlePayment} className="btn-primary pay-btn">Pay ₹{totalPrice.toFixed(2)}</button>
                </div>
              </div>
            )}
          </div>

          <aside className="checkout-sidebar">
            <div className="order-summary-card">
              <h3>Order Summary</h3>
              <div className="summary-items">
                {items.map(item => (
                  <div key={item.id} className="summary-item-row">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{(item.totalPrice || (item.price * item.quantity) || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              {discountAmount > 0 && (
                <div className="summary-row discount"><span>Special Discount</span><span>-₹{discountAmount.toFixed(2)}</span></div>
              )}
              <div className="summary-row"><span>Taxable Value</span><span>₹{taxableAmount.toFixed(2)}</span></div>
              <div className="summary-row"><span>GST (18%)</span><span>₹{gstAmount.toFixed(2)}</span></div>

              <div className={`summary-row shipping ${shippingData.loading ? 'loading' : ''}`}>
                <span>Shipping {shippingData.days && `(${shippingData.days})`}</span>
                {shippingData.loading ? <Loader2 size={14} className="animate-spin" /> : <span>₹{shippingCharge.toFixed(2)}</span>}
              </div>

              {appliedCoupon && (
                <div className="summary-row coupon-discount">
                  <div className="coupon-label-flex">
                    <span className="badge">Coupon: {appliedCoupon.code}</span>
                    <button onClick={removeCoupon} className="remove-coupon">Remove</button>
                  </div>
                  <span className="discount-value">-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="summary-divider"></div>

              <div className="coupon-section">
                {!appliedCoupon ? (
                  <div className="coupon-input-group">
                    <input 
                      type="text" 
                      placeholder="Enter Promo Code" 
                      value={couponCode} 
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <button 
                      onClick={handleApplyCoupon} 
                      disabled={isValidatingCoupon || !couponCode}
                    >
                      {isValidatingCoupon ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="coupon-applied-msg">
                    <CheckCircle size={14} /> Coupon Applied: <strong>{appliedCoupon.label}</strong>
                  </div>
                )}
                {couponError && <div className="coupon-error">{couponError}</div>}
              </div>

              {shippingData.weights && (
                <div className="shipping-breakdown-details">
                  <div className="breakdown-header">
                    <Info size={12} /> Shipping Breakdown
                  </div>
                  <div className="breakdown-body">
                    <div className="b-row"><span>Actual Weight</span><span>{shippingData.weights.actual.toFixed(2)} kg</span></div>
                    <div className="b-row"><span>Volumetric Weight</span><span>{shippingData.weights.volumetric.toFixed(2)} kg</span></div>
                    <div className="b-row highlighted"><span>Chargeable Weight</span><span>{shippingData.billableWeight} kg</span></div>
                    <div className="b-divider"></div>
                    <div className="b-row"><span>Base Freight</span><span>₹{shippingData.breakdown.baseFreight}</span></div>
                    <div className="b-row"><span>Fuel Surcharge</span><span>₹{shippingData.breakdown.fuelSurcharge}</span></div>
                    {shippingData.breakdown.ewayBillCharge > 0 && <div className="b-row"><span>E-Way Bill</span><span>₹{shippingData.breakdown.ewayBillCharge}</span></div>}
                    {shippingData.breakdown.handlingCharge > 0 && <div className="b-row"><span>Handling Charge</span><span>₹{shippingData.breakdown.handlingCharge}</span></div>}
                    {shippingData.breakdown.codFee > 0 && <div className="b-row text-orange"><span>COD Fee</span><span>₹{shippingData.breakdown.codFee}</span></div>}
                    <div className="b-row"><span>Logistics GST</span><span>₹{shippingData.breakdown.gstAmount}</span></div>
                  </div>
                </div>
              )}

              {shippingData.isFreeShippingApplied && (
                <div className="free-shipping-applied-alert">
                  <CheckCircle size={16} /> 
                  <div className="alert-content">
                    <strong>FREE SHIPPING!</strong>
                    <span>{shippingData.freeShippingReason}</span>
                  </div>
                </div>
              )}

              {shippingData.apiIntegration && (
                <div className="api-integration-badge">
                  <span className="api-title">Courier API: {shippingData.apiIntegration.provider?.toUpperCase()}</span>
                  <p className="api-msg">{shippingData.apiIntegration.message}</p>
                </div>
              )}

              <div className="summary-total"><span>Total Payable</span><span className="amount">₹{totalPrice.toFixed(2)}</span></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

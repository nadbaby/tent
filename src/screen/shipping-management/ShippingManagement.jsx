import React, { useState, useEffect } from 'react';
import { 
  Truck, Settings2, ShieldCheck, Info, Save, 
  Plus, Trash2, ChevronRight, Calculator, 
  MapPin, Percent, DollarSign, Package,
  Maximize, Weight, AlertCircle, Key, PlusCircle, CheckCircle
} from 'lucide-react';
import { apiUrl } from '../../utils/api';
import './ShippingManagement.css';

const ShippingManagement = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rates');
  const [saving, setSaving] = useState(false);
  const [testInput, setTestInput] = useState({
    weight: 0.5,
    length: 10,
    width: 10,
    height: 10,
    state: 'Punjab',
    city: 'Ludhiana',
    invoiceValue: 5000,
    courierId: '',
    paymentMethod: 'PREPAID'
  });
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/admin/shipping-config'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data.couriers && data.couriers.length > 0) {
          setTestInput(prev => ({ ...prev, courierId: data.couriers[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load admin shipping configuration:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/admin/shipping-config'), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert("Shipping Configuration Saved Successfully!");
        fetchConfig();
      }
    } catch (err) {
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    try {
      const res = await fetch(apiUrl('/api/shipping/preview'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            weightKg: parseFloat(testInput.weight),
            dimensions: {
              length: parseFloat(testInput.length),
              width: parseFloat(testInput.width),
              height: parseFloat(testInput.height)
            },
            quantity: 1
          }],
          state: testInput.state,
          city: testInput.city,
          invoiceValue: parseFloat(testInput.invoiceValue),
          courierId: testInput.courierId || undefined,
          paymentMethod: testInput.paymentMethod
        })
      });
      if (res.ok) {
        const result = await res.json();
        setTestResult(result);
      }
    } catch (err) {
      console.error("Shipping preview calculation failed:", err);
    }
  };

  if (loading) return <div className="shipping-mgmt-loading">Loading configuration...</div>;

  return (
    <div className="shipping-mgmt-wrapper">
      <div className="shipping-mgmt-header">
        <div className="header-title">
          <Truck className="title-icon" />
          <div>
            <h1>Shipping & Logistics Panel</h1>
            <p>Manage volumetric formula, courier API keys, weight slabs, COD surcharges, and overrides</p>
          </div>
        </div>
        <button className={`btn-save ${saving ? 'saving' : ''}`} onClick={handleSave} disabled={saving}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="shipping-tabs">
        <button className={activeTab === 'rates' ? 'active' : ''} onClick={() => setActiveTab('rates')}>
          <DollarSign size={16} /> Rates & Zones
        </button>
        <button className={activeTab === 'surcharges' ? 'active' : ''} onClick={() => setActiveTab('surcharges')}>
          <Percent size={16} /> Surcharges & Handling
        </button>
        <button className={activeTab === 'mapping' ? 'active' : ''} onClick={() => setActiveTab('mapping')}>
          <MapPin size={16} /> Zone Mapping
        </button>
        <button className={activeTab === 'couriers' ? 'active' : ''} onClick={() => setActiveTab('couriers')}>
          <Truck size={16} /> Courier Partners
        </button>
        <button className={activeTab === 'rules' ? 'active' : ''} onClick={() => setActiveTab('rules')}>
          <Settings2 size={16} /> COD & Free Shipping
        </button>
        <button className={activeTab === 'slabs' ? 'active' : ''} onClick={() => setActiveTab('slabs')}>
          <Package size={16} /> Weight Slabs
        </button>
        <button className={activeTab === 'calculator' ? 'active' : ''} onClick={() => setActiveTab('calculator')}>
          <Calculator size={16} /> Calculator Preview
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'rates' && (
          <div className="rates-grid">
            {Object.entries(config.zones).map(([key, zone]) => (
              <div key={key} className="zone-card">
                <h3>{zone.name}</h3>
                <div className="rate-inputs">
                  <div className="input-group">
                    <label>DOX (0-250g)</label>
                    <input 
                      type="number" 
                      value={zone.rates.DOX_250G} 
                      onChange={e => {
                        const newConfig = {...config};
                        newConfig.zones[key].rates.DOX_250G = parseFloat(e.target.value);
                        setConfig(newConfig);
                      }}
                    />
                  </div>
                  <div className="input-group">
                    <label>Parcel (per KG)</label>
                    <input 
                      type="number" 
                      value={zone.rates.PER_KG} 
                      onChange={e => {
                        const newConfig = {...config};
                        newConfig.zones[key].rates.PER_KG = parseFloat(e.target.value);
                        setConfig(newConfig);
                      }}
                    />
                  </div>
                  <div className="input-group">
                    <label>Surface (per 5KG)</label>
                    <input 
                      type="number" 
                      value={zone.rates.PARCEL_5KG_SURFACE} 
                      onChange={e => {
                        const newConfig = {...config};
                        newConfig.zones[key].rates.PARCEL_5KG_SURFACE = parseFloat(e.target.value);
                        setConfig(newConfig);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'surcharges' && (
          <div className="surcharges-panel">
            <div className="config-section">
              <h3>Global Shipping Surcharges</h3>
              <div className="config-grid">
                <div className="input-group">
                  <label>Fuel Surcharge (%)</label>
                  <input 
                    type="number" 
                    value={config.fuelSurcharge} 
                    onChange={e => setConfig({...config, fuelSurcharge: parseFloat(e.target.value)})}
                  />
                  <span className="help-text">Applied on base freight</span>
                </div>
                <div className="input-group">
                  <label>GST Rate (%)</label>
                  <input 
                    type="number" 
                    value={config.gstRate} 
                    onChange={e => setConfig({...config, gstRate: parseFloat(e.target.value)})}
                  />
                  <span className="help-text">Logistics services tax</span>
                </div>
                <div className="input-group">
                  <label>E-Way Bill Surcharge (₹)</label>
                  <input 
                    type="number" 
                    value={config.ewayBillCharge} 
                    onChange={e => setConfig({...config, ewayBillCharge: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="input-group">
                  <label>Invoice Value Fee (%)</label>
                  <input 
                    type="number" 
                    value={config.invoiceValuePercent} 
                    onChange={e => setConfig({...config, invoiceValuePercent: parseFloat(e.target.value)})}
                  />
                  <span className="help-text">Charge on order value</span>
                </div>
              </div>
            </div>

            <div className="config-section">
              <h3>Volumetric Calculator & Handling Fee</h3>
              <div className="config-grid">
                <div className="input-group">
                  <label>Volumetric divisor (Standard divisor: 5000)</label>
                  <input 
                    type="number" 
                    value={config.volumetricDivisor || 5000} 
                    onChange={e => setConfig({...config, volumetricDivisor: parseFloat(e.target.value)})}
                  />
                  <span className="help-text">Formula: (L × W × H) / Divisor</span>
                </div>
                <div className="input-group">
                  <label>Handling Charge Surcharge</label>
                  <input 
                    type="number" 
                    value={config.handlingCharge || 0} 
                    onChange={e => setConfig({...config, handlingCharge: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="input-group">
                  <label>Handling Surcharge Type</label>
                  <select 
                    value={config.handlingChargeType || 'FIXED'} 
                    className="checkout-select"
                    onChange={e => setConfig({...config, handlingChargeType: e.target.value})}
                  >
                    <option value="FIXED">Fixed Rupees (₹)</option>
                    <option value="PERCENTAGE">Percentage of Freight (%)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="config-section">
              <h3>Default Fallback Configurations</h3>
              <div className="config-grid">
                <div className="input-group">
                  <label>Default Fallback Weight (Kg)</label>
                  <input 
                    type="number" 
                    value={config.fallbackWeight} 
                    onChange={e => setConfig({...config, fallbackWeight: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="input-group">
                  <label>Default Fallback Dimensions (LxWxH cm)</label>
                  <div className="dim-row">
                    <input type="number" placeholder="L" value={config.fallbackDimensions.length} onChange={e => setConfig({...config, fallbackDimensions: {...config.fallbackDimensions, length: parseFloat(e.target.value)}})} />
                    <input type="number" placeholder="W" value={config.fallbackDimensions.width} onChange={e => setConfig({...config, fallbackDimensions: {...config.fallbackDimensions, width: parseFloat(e.target.value)}})} />
                    <input type="number" placeholder="H" value={config.fallbackDimensions.height} onChange={e => setConfig({...config, fallbackDimensions: {...config.fallbackDimensions, height: parseFloat(e.target.value)}})} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mapping' && (
          <div className="mapping-panel">
            <div className="mapping-section">
              <h4>Delhi NCR Pincode/Cities List</h4>
              <p className="section-subtext">Comma-separated city lists classified as NCR Zone.</p>
              <textarea 
                rows="4"
                value={config.ncrCities.join(', ')} 
                onChange={e => setConfig({...config, ncrCities: e.target.value.split(',').map(s => s.trim())})}
              />
            </div>
            <div className="mapping-section">
              <h4>North East Serviceable States</h4>
              <p className="section-subtext">Comma-separated states list classified as North East Zone.</p>
              <textarea 
                rows="4"
                value={config.northEastStates.join(', ')} 
                onChange={e => setConfig({...config, northEastStates: e.target.value.split(',').map(s => s.trim())})}
              />
            </div>
            <div className="mapping-section">
              <h4>Punjab/Local Base States</h4>
              <p className="section-subtext">Comma-separated states list classified as Local Punjab Zone.</p>
              <textarea 
                rows="4"
                value={config.punjabStates.join(', ')} 
                onChange={e => setConfig({...config, punjabStates: e.target.value.split(',').map(s => s.trim())})}
              />
            </div>
          </div>
        )}

        {activeTab === 'couriers' && (
          <div className="couriers-panel">
            <div className="panel-actions">
              <div>
                <h3>Courier & Delivery Partners</h3>
                <p className="section-subtext">Manage active courier rate cards, apply service markup scales, and configure API integrations.</p>
              </div>
              <button className="btn-add-item" onClick={() => {
                const newConfig = {...config};
                newConfig.couriers = newConfig.couriers || [];
                newConfig.couriers.push({
                  id: `courier_${Date.now()}`,
                  name: 'New Logistics Partner',
                  isActive: true,
                  type: 'self',
                  baseRateAdjustment: 0,
                  rateMultiplier: 1.0,
                  apiSettings: { apiUrl: '', apiKey: '', apiSecret: '' }
                });
                setConfig(newConfig);
              }}>
                <Plus size={16} /> Add Partner
              </button>
            </div>
            
            <div className="couriers-list-grid">
              {(config.couriers || []).map((courier, index) => (
                <div key={courier.id || index} className="courier-config-card">
                  <div className="courier-card-head">
                    <div className="active-toggle">
                      <label className="checkbox-container">
                        <input 
                          type="checkbox" 
                          checked={courier.isActive} 
                          onChange={e => {
                            const newConfig = {...config};
                            newConfig.couriers[index].isActive = e.target.checked;
                            setConfig(newConfig);
                          }} 
                        />
                        <span className="checkmark"></span>
                        Active
                      </label>
                    </div>
                    <button className="btn-delete-courier" onClick={() => {
                      const newConfig = {...config};
                      newConfig.couriers.splice(index, 1);
                      setConfig(newConfig);
                    }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>

                  <div className="input-group">
                    <label>Logistics Partner Name</label>
                    <input 
                      type="text" 
                      value={courier.name} 
                      onChange={e => {
                        const newConfig = {...config};
                        newConfig.couriers[index].name = e.target.value;
                        setConfig(newConfig);
                      }} 
                    />
                  </div>

                  <div className="input-group">
                    <label>Fulfillment Mode</label>
                    <select 
                      value={courier.type} 
                      className="checkout-select"
                      onChange={e => {
                        const newConfig = {...config};
                        newConfig.couriers[index].type = e.target.value;
                        setConfig(newConfig);
                      }}
                    >
                      <option value="self">Self Operations (Rate cards table)</option>
                      <option value="aggregator">Aggregator API integration (Shiprocket/Delhivery/NimbusPost)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Base Price Markup adjustment (₹)</label>
                    <input 
                      type="number" 
                      value={courier.baseRateAdjustment || 0} 
                      onChange={e => {
                        const newConfig = {...config};
                        newConfig.couriers[index].baseRateAdjustment = parseFloat(e.target.value) || 0;
                        setConfig(newConfig);
                      }} 
                    />
                  </div>

                  <div className="input-group">
                    <label>Fulfillment Scale multiplier (x)</label>
                    <input 
                      type="number" 
                      step="0.05"
                      value={courier.rateMultiplier || 1.0} 
                      onChange={e => {
                        const newConfig = {...config};
                        newConfig.couriers[index].rateMultiplier = parseFloat(e.target.value) || 1.0;
                        setConfig(newConfig);
                      }} 
                    />
                  </div>

                  {courier.type === 'aggregator' && (
                    <div className="api-keys-subform">
                      <h5><Key size={14} /> API Integration Console</h5>
                      <div className="input-group">
                        <label>Fulfillment API Base Endpoint</label>
                        <input 
                          type="text" 
                          placeholder="e.g. https://api.shiprocket.in/v1"
                          value={courier.apiSettings?.apiUrl || ''} 
                          onChange={e => {
                            const newConfig = {...config};
                            newConfig.couriers[index].apiSettings = newConfig.couriers[index].apiSettings || {};
                            newConfig.couriers[index].apiSettings.apiUrl = e.target.value;
                            setConfig(newConfig);
                          }} 
                        />
                      </div>
                      <div className="input-group">
                        <label>API Key / Client Token ID</label>
                        <input 
                          type="text" 
                          value={courier.apiSettings?.apiKey || ''} 
                          onChange={e => {
                            const newConfig = {...config};
                            newConfig.couriers[index].apiSettings = newConfig.couriers[index].apiSettings || {};
                            newConfig.couriers[index].apiSettings.apiKey = e.target.value;
                            setConfig(newConfig);
                          }} 
                        />
                      </div>
                      <div className="input-group">
                        <label>API Auth Secret / Security Token</label>
                        <input 
                          type="password" 
                          value={courier.apiSettings?.apiSecret || ''} 
                          onChange={e => {
                            const newConfig = {...config};
                            newConfig.couriers[index].apiSettings = newConfig.couriers[index].apiSettings || {};
                            newConfig.couriers[index].apiSettings.apiSecret = e.target.value;
                            setConfig(newConfig);
                          }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="rules-panel">
            <div className="config-section">
              <h3>Cash on Delivery (COD) Configuration</h3>
              <div className="config-grid">
                <div className="input-group checkbox-toggle-group">
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={config.isCodFeeEnabled} 
                      onChange={e => setConfig({...config, isCodFeeEnabled: e.target.checked})} 
                    />
                    <span className="checkmark"></span>
                    Enable Cash on Delivery (COD) surcharges at checkout
                  </label>
                </div>
                <div className="input-group">
                  <label>COD Surcharge Fee Value</label>
                  <input 
                    type="number" 
                    value={config.codFee || 0} 
                    onChange={e => setConfig({...config, codFee: parseFloat(e.target.value)})}
                    disabled={!config.isCodFeeEnabled}
                  />
                </div>
                <div className="input-group">
                  <label>Surcharge Mode</label>
                  <select 
                    value={config.codFeeType || 'FIXED'} 
                    className="checkout-select"
                    onChange={e => setConfig({...config, codFeeType: e.target.value})}
                    disabled={!config.isCodFeeEnabled}
                  >
                    <option value="FIXED">Flat Surcharge Fee (₹)</option>
                    <option value="PERCENTAGE">Percentage of Cart Total (%)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="config-section">
              <h3>Free Shipping Eligibility Thresholds</h3>
              <div className="config-grid">
                <div className="input-group checkbox-toggle-group">
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={config.isFreeShippingEnabled} 
                      onChange={e => setConfig({...config, isFreeShippingEnabled: e.target.checked})} 
                    />
                    <span className="checkmark"></span>
                    Enable Free Shipping Rules globally
                  </label>
                </div>
                <div className="input-group">
                  <label>Minimum Order Invoice Value (₹)</label>
                  <input 
                    type="number" 
                    value={config.freeShippingMinOrderValue || 0} 
                    onChange={e => setConfig({...config, freeShippingMinOrderValue: parseFloat(e.target.value)})}
                    disabled={!config.isFreeShippingEnabled}
                  />
                </div>
                <div className="input-group full">
                  <label>Free Shipping Category Whitelists (Comma-separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bearings, Oil Seals, Accessories"
                    value={config.freeShippingCategories?.join(', ') || ''} 
                    onChange={e => setConfig({...config, freeShippingCategories: e.target.value.split(',').map(s => s.trim())})}
                    disabled={!config.isFreeShippingEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="config-section">
              <div className="panel-actions">
                <h3>Location-based Manual Override Shipping Rates</h3>
                <button className="btn-add-item" onClick={() => {
                  const newConfig = {...config};
                  newConfig.manualRules = newConfig.manualRules || [];
                  newConfig.manualRules.push({
                    state: '',
                    city: '',
                    minOrderValue: 0,
                    shippingCharge: 0,
                    description: 'Custom override charge rules'
                  });
                  setConfig(newConfig);
                }}>
                  <Plus size={16} /> Add Override Rule
                </button>
              </div>

              <div className="manual-rules-table-container">
                <table className="config-table">
                  <thead>
                    <tr>
                      <th>Target State *</th>
                      <th>Target City (Optional)</th>
                      <th>Min Order (₹)</th>
                      <th>Shipping Charge (₹)</th>
                      <th>Rule Description / Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(config.manualRules || []).map((rule, idx) => (
                      <tr key={idx}>
                        <td>
                          <input 
                            type="text" 
                            placeholder="e.g. Maharashtra"
                            required
                            value={rule.state} 
                            onChange={e => {
                              const newConfig = {...config};
                              newConfig.manualRules[idx].state = e.target.value;
                              setConfig(newConfig);
                            }} 
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            placeholder="e.g. Mumbai"
                            value={rule.city || ''} 
                            onChange={e => {
                              const newConfig = {...config};
                              newConfig.manualRules[idx].city = e.target.value;
                              setConfig(newConfig);
                            }} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={rule.minOrderValue} 
                            onChange={e => {
                              const newConfig = {...config};
                              newConfig.manualRules[idx].minOrderValue = parseFloat(e.target.value) || 0;
                              setConfig(newConfig);
                            }} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={rule.shippingCharge} 
                            onChange={e => {
                              const newConfig = {...config};
                              newConfig.manualRules[idx].shippingCharge = parseFloat(e.target.value) || 0;
                              setConfig(newConfig);
                            }} 
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            placeholder="Reason for rule"
                            value={rule.description || ''} 
                            onChange={e => {
                              const newConfig = {...config};
                              newConfig.manualRules[idx].description = e.target.value;
                              setConfig(newConfig);
                            }} 
                          />
                        </td>
                        <td>
                          <button className="btn-delete-row" onClick={() => {
                            const newConfig = {...config};
                            newConfig.manualRules.splice(idx, 1);
                            setConfig(newConfig);
                          }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(config.manualRules || []).length === 0 && (
                      <tr>
                        <td colSpan="6" className="empty-table-msg">No custom overrides configured yet. Standard rates apply.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'slabs' && (
          <div className="slabs-panel">
            <div className="panel-actions">
              <div>
                <h3>Weight Slab Tariff Multipliers</h3>
                <p className="section-subtext">Apply custom pricing multipliers to scale base logistics rates based on the overall chargeable package weight slabs.</p>
              </div>
              <button className="btn-add-item" onClick={() => {
                const newConfig = {...config};
                newConfig.weightSlabs = newConfig.weightSlabs || [];
                newConfig.weightSlabs.push({
                  minWeight: 0,
                  maxWeight: 999,
                  rateMultiplier: 1.0
                });
                setConfig(newConfig);
              }}>
                <Plus size={16} /> Add Weight Slab
              </button>
            </div>

            <div className="manual-rules-table-container">
              <table className="config-table">
                <thead>
                  <tr>
                    <th>Min Weight (Kg)</th>
                    <th>Max Weight (Kg)</th>
                    <th>Rate Scale Multiplier (x)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(config.weightSlabs || []).map((slab, idx) => (
                    <tr key={idx}>
                      <td>
                        <input 
                          type="number" 
                          placeholder="0"
                          value={slab.minWeight} 
                          onChange={e => {
                            const newConfig = {...config};
                            newConfig.weightSlabs[idx].minWeight = parseFloat(e.target.value) || 0;
                            setConfig(newConfig);
                          }} 
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          placeholder="999"
                          value={slab.maxWeight} 
                          onChange={e => {
                            const newConfig = {...config};
                            newConfig.weightSlabs[idx].maxWeight = parseFloat(e.target.value) || 999;
                            setConfig(newConfig);
                          }} 
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          step="0.05"
                          placeholder="1.0"
                          value={slab.rateMultiplier} 
                          onChange={e => {
                            const newConfig = {...config};
                            newConfig.weightSlabs[idx].rateMultiplier = parseFloat(e.target.value) || 1.0;
                            setConfig(newConfig);
                          }} 
                        />
                      </td>
                      <td>
                        <button className="btn-delete-row" onClick={() => {
                          const newConfig = {...config};
                          newConfig.weightSlabs.splice(idx, 1);
                          setConfig(newConfig);
                        }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(config.weightSlabs || []).length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-table-msg">No custom weight slab adjustments configured. Standard tariff rates will apply directly.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="calculator-panel">
            <div className="calc-inputs">
              <h3>Real-Time Test Calculation Sandbox</h3>
              <div className="config-grid">
                <div className="input-group">
                  <label>Actual Weight (Kg)</label>
                  <input type="number" value={testInput.weight} onChange={e => setTestInput({...testInput, weight: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Dimensions (LxWxH cm)</label>
                  <div className="dim-row">
                    <input type="number" placeholder="L" value={testInput.length} onChange={e => setTestInput({...testInput, length: e.target.value})} />
                    <input type="number" placeholder="W" value={testInput.width} onChange={e => setTestInput({...testInput, width: e.target.value})} />
                    <input type="number" placeholder="H" value={testInput.height} onChange={e => setTestInput({...testInput, height: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label>State</label>
                  <input type="text" value={testInput.state} onChange={e => setTestInput({...testInput, state: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>City</label>
                  <input type="text" value={testInput.city} onChange={e => setTestInput({...testInput, city: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Cart Invoice Value (₹)</label>
                  <input type="number" value={testInput.invoiceValue} onChange={e => setTestInput({...testInput, invoiceValue: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Courier Partner Choice</label>
                  <select 
                    value={testInput.courierId} 
                    className="checkout-select"
                    onChange={e => setTestInput({...testInput, courierId: e.target.value})}
                  >
                    <option value="">Default Active Partner</option>
                    {(config.couriers || []).filter(c => c.isActive).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Checkout Payment Method</label>
                  <select 
                    value={testInput.paymentMethod} 
                    className="checkout-select"
                    onChange={e => setTestInput({...testInput, paymentMethod: e.target.value})}
                  >
                    <option value="PREPAID">Prepaid (Pay Online)</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>
              </div>
              <button className="btn-run" onClick={runTest}>
                <Calculator size={18} /> Run Simulator
              </button>
            </div>

            {testResult && (
              <div className="calc-results">
                <h3>Calculation Results</h3>
                <div className="result-zone">Detected Zone: <strong>{testResult.zoneName}</strong></div>
                
                <div className="weight-breakdown">
                  <div className="w-item">
                    <span>Actual Weight</span>
                    <strong>{testResult.weights.actual.toFixed(2)} Kg</strong>
                  </div>
                  <div className="w-item">
                    <span>Volumetric Weight</span>
                    <strong>{testResult.weights.volumetric.toFixed(2)} Kg</strong>
                  </div>
                  <div className="w-item highlighted">
                    <span>Chargeable Weight</span>
                    <strong>{Math.ceil(testResult.weights.chargeable)} Kg</strong>
                  </div>
                </div>

                <div className="price-breakdown">
                  {testResult.isFreeShippingApplied && (
                    <div className="free-shipping-applied-badge">
                      <CheckCircle size={14} /> FREE SHIPPING ELIGIBLE: {testResult.freeShippingReason}
                    </div>
                  )}

                  <div className="p-row">
                    <span>Base Freight</span>
                    <span>₹{testResult.breakdown.baseFreight}</span>
                  </div>
                  <div className="p-row">
                    <span>Fuel Surcharge ({config.fuelSurcharge}%)</span>
                    <span>₹{testResult.breakdown.fuelSurcharge}</span>
                  </div>
                  <div className="p-row">
                    <span>E-Way Bill Charge</span>
                    <span>₹{testResult.breakdown.ewayBillCharge}</span>
                  </div>
                  {testResult.breakdown.handlingCharge > 0 && (
                    <div className="p-row">
                      <span>Handling Surcharge ({config.handlingChargeType})</span>
                      <span>₹{testResult.breakdown.handlingCharge}</span>
                    </div>
                  )}
                  {testResult.breakdown.codFee > 0 && (
                    <div className="p-row text-orange">
                      <span>COD Surcharge Fee ({config.codFeeType})</span>
                      <span>₹{testResult.breakdown.codFee}</span>
                    </div>
                  )}
                  <div className="p-row">
                    <span>Invoice Value Charge ({config.invoiceValuePercent}%)</span>
                    <span>₹{testResult.breakdown.invoiceValueCharge}</span>
                  </div>
                  <div className="p-row total">
                    <span>Subtotal</span>
                    <span>₹{testResult.breakdown.subtotal}</span>
                  </div>
                  <div className="p-row">
                    <span>GST ({config.gstRate}%)</span>
                    <span>₹{testResult.breakdown.gstAmount}</span>
                  </div>
                  <div className="p-row grand-total">
                    <span>Final Shipping Cost</span>
                    <span>₹{testResult.finalTotal}</span>
                  </div>

                  {testResult.apiIntegration && (
                    <div className="api-integration-badge-admin">
                      <span>Simulated API Integration: <strong>{testResult.apiIntegration.provider}</strong></span>
                      <p>{testResult.apiIntegration.message}</p>
                      <small>Endpoint: {testResult.apiIntegration.endpoint}</small>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingManagement;

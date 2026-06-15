import React, { useState, useEffect } from 'react';
import { 
  Truck, Settings2, ShieldCheck, Info, Save, 
  Plus, Trash2, ChevronRight, Calculator, 
  MapPin, Percent, DollarSign, Package,
  Maximize, Weight, AlertCircle
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
    invoiceValue: 5000
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
      }
    } catch (err) {
      console.error(err);
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
          invoiceValue: parseFloat(testInput.invoiceValue)
        })
      });
      if (res.ok) {
        const result = await res.json();
        setTestResult(result);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="shipping-mgmt-loading">Loading configuration...</div>;

  return (
    <div className="shipping-mgmt-wrapper">
      <div className="shipping-mgmt-header">
        <div className="header-title">
          <Truck className="title-icon" />
          <div>
            <h1>Shipping & Logistics</h1>
            <p>Manage ZEDEX/Shree Maruti tariff rates and surcharges</p>
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
          <Percent size={16} /> Surcharges & GST
        </button>
        <button className={activeTab === 'mapping' ? 'active' : ''} onClick={() => setActiveTab('mapping')}>
          <MapPin size={16} /> Zone Mapping
        </button>
        <button className={activeTab === 'calculator' ? 'active' : ''} onClick={() => setActiveTab('calculator')}>
          <Calculator size={16} /> Admin Preview
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
              <h3>Global Surcharges</h3>
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
                </div>
                <div className="input-group">
                  <label>E-Way Bill Charge (₹)</label>
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
                  <span className="help-text">Configurable 6% to 8%</span>
                </div>
              </div>
            </div>

            <div className="config-section">
              <h3>Fallback Values (Safety)</h3>
              <div className="config-grid">
                <div className="input-group">
                  <label>Default Weight (Kg)</label>
                  <input 
                    type="number" 
                    value={config.fallbackWeight} 
                    onChange={e => setConfig({...config, fallbackWeight: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="input-group">
                  <label>Default Dimensions (LxWxH cm)</label>
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
              <h4>NCR Cities</h4>
              <textarea 
                value={config.ncrCities.join(', ')} 
                onChange={e => setConfig({...config, ncrCities: e.target.value.split(',').map(s => s.trim())})}
              />
            </div>
            <div className="mapping-section">
              <h4>North East States</h4>
              <textarea 
                value={config.northEastStates.join(', ')} 
                onChange={e => setConfig({...config, northEastStates: e.target.value.split(',').map(s => s.trim())})}
              />
            </div>
            <div className="mapping-section">
              <h4>Punjab/Local States</h4>
              <textarea 
                value={config.punjabStates.join(', ')} 
                onChange={e => setConfig({...config, punjabStates: e.target.value.split(',').map(s => s.trim())})}
              />
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="calculator-panel">
            <div className="calc-inputs">
              <h3>Test Calculation</h3>
              <div className="config-grid">
                <div className="input-group">
                  <label>Actual Weight (Kg)</label>
                  <input type="number" value={testInput.weight} onChange={e => setTestInput({...testInput, weight: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Dimensions (LxWxH)</label>
                  <div className="dim-row">
                    <input type="number" value={testInput.length} onChange={e => setTestInput({...testInput, length: e.target.value})} />
                    <input type="number" value={testInput.width} onChange={e => setTestInput({...testInput, width: e.target.value})} />
                    <input type="number" value={testInput.height} onChange={e => setTestInput({...testInput, height: e.target.value})} />
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
                  <label>Invoice Value (₹)</label>
                  <input type="number" value={testInput.invoiceValue} onChange={e => setTestInput({...testInput, invoiceValue: e.target.value})} />
                </div>
              </div>
              <button className="btn-run" onClick={runTest}>
                <Calculator size={18} /> Calculate Now
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

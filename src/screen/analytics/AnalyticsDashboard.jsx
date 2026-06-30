import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  Truck, 
  CheckCircle, 
  ArrowUpRight,
  RefreshCw,
  Download
} from 'lucide-react';
import { apiUrl } from '../../utils/api';
import './AnalyticsDashboard.css';

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'];

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleDownloadExcel = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const res = await fetch(apiUrl(`/api/admin/reports/excel?${queryParams.toString()}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate report. Make sure you are an administrator.');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GST_Tax_Report_${startDate || 'all_time'}_to_${endDate || 'all_time'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Failed to download report');
    } finally {
      setExporting(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/admin/analytics'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Unauthorized or server error');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="analytics-loading-screen">
      <div className="analytics-spinner-wrapper">
        <RefreshCw className="analytics-spin-icon" size={48} />
        <div className="analytics-pulse-ring"></div>
      </div>
      <p>Analyzing business metrics...</p>
    </div>
  );

  if (error) return (
    <div className="analytics-error-screen">
      <div className="error-icon-wrapper">
        <Package size={48} />
      </div>
      <h2>Analytics Unavailable</h2>
      <p>{error}</p>
      <div className="error-actions">
        <button onClick={fetchAnalytics} className="btn-retry">Try Again</button>
        <p className="error-tip">Tip: Ensure you are logged in as an <strong>Administrator</strong>.</p>
      </div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div>
          <h1>Business Insights</h1>
          <p>Real-time performance overview of Fine Bearing & Oil Seal Store</p>
        </div>
        <div className="analytics-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="date-picker-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="analytics-date-input"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
            />
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="analytics-date-input"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
            />
          </div>
          <button 
            className="btn-excel-download" 
            onClick={handleDownloadExcel} 
            disabled={exporting}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              border: 'none', 
              background: '#16a34a', 
              color: '#fff', 
              fontWeight: '600', 
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <button className="btn-refresh" onClick={fetchAnalytics}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper revenue">
            <DollarSign size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Revenue</span>
            <h3 className="kpi-value">₹{data.summary.totalRevenue.toLocaleString('en-IN')}</h3>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} /> 12% vs last month
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper orders">
            <ShoppingBag size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Orders</span>
            <h3 className="kpi-value">{data.summary.totalOrders}</h3>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} /> 8% vs last month
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper weight">
            <Package size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tonnage Moved</span>
            <h3 className="kpi-value">{(data.summary.totalWeight).toFixed(2)} KG</h3>
            <span className="kpi-trend">Surface Logistics</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper aov">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Avg. Order Value</span>
            <h3 className="kpi-value">₹{Math.round(data.summary.averageOrderValue).toLocaleString('en-IN')}</h3>
            <span className="kpi-trend">B2B Efficiency</span>
          </div>
        </div>
      </div>

      <div className="charts-main-grid">
        {/* Sales Trend Chart */}
        <div className="chart-container large">
          <h3>Sales Trend (Last 7 Days)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.trendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Distribution */}
        <div className="chart-container">
          <h3>Revenue by Shipping Zone</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.zoneData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.zoneData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status */}
        <div className="chart-container">
          <h3>Order Status Distribution</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

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
  RefreshCw
} from 'lucide-react';
import { apiUrl } from '../../utils/api';
import './AnalyticsDashboard.css';

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'];

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState('7');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTxn, setSearchTxn] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      if (days === 'custom' && (!startDate || !endDate)) {
        setLoading(false);
        return;
      }
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({ days });
      if (days === 'custom') {
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
      }
      if (searchTxn) {
        queryParams.append('searchTxn', searchTxn);
      }
      const res = await fetch(apiUrl(`/api/admin/analytics?${queryParams}`), {
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
  }, [days, startDate, endDate, searchTxn]);

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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {days === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>From:</span>
              <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: '#475569', fontSize: '0.9rem' }} />
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>To:</span>
              <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: '#475569', fontSize: '0.9rem' }} />
            </div>
          )}
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#fff',
              fontSize: '0.9rem',
              color: '#475569',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <option value="0">Today</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="365">Last 1 Year</option>
            <option value="-1">All Time</option>
            <option value="custom">Custom Date Range</option>
          </select>
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
          <h3>Sales Trend ({days === '-1' ? 'All Time' : days === 'custom' ? 'Custom Range' : days === '0' ? 'Today' : `Last ${days} Days`})</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.trendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₹${val / 1000}k`} />
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Payments Simple List */}
      <div className="chart-container large" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
          <h3 style={{ margin: 0 }}>Recent Transactions</h3>
          <input
            type="text"
            placeholder="Search Order ID or Customer..."
            value={searchTxn}
            onChange={(e) => setSearchTxn(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '250px', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {data.recentPayments?.map(txn => {
            const d = new Date(txn.date);
            const month = d.toLocaleString('en-IN', { month: 'long' }).toLowerCase();
            const time = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            const dateStr = `${d.getDate()} ${month} ${time}`;

            return (
              <div key={txn.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#0f172a', display: 'block' }}>{txn.customer}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>#{txn.id}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: '700', color: '#16a34a', display: 'block', fontSize: '1.1rem' }}>{txn.amount}rs</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{dateStr}</span>
                </div>
              </div>
            );
          })}
          {(!data.recentPayments || data.recentPayments.length === 0) && (
            <div style={{ padding: '20px', color: '#64748b', gridColumn: '1 / -1' }}>No recent payments.</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsDashboard;

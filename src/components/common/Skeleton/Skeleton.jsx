import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ type, className = '' }) => {
  const classes = `skeleton ${type} ${className}`;
  return <div className={classes}></div>;
};

export const SkeletonProductCard = () => (
  <div className="skeleton-product-card">
    <Skeleton type="skeleton-image img" />
    <Skeleton type="skeleton-text line-1" />
    <Skeleton type="skeleton-text line-2" />
    <div className="btn-row">
      <Skeleton type="skeleton-text price" />
      <Skeleton type="skeleton-btn add" />
    </div>
  </div>
);

export const SkeletonTableRow = ({ columns = 5 }) => {
  if (columns === 6) {
    return (
      <div className="skeleton-table-row">
        <div className="skeleton-cell cell-info">
          <Skeleton type="skeleton-text" style={{ width: '60%', height: '14px' }} />
          <Skeleton type="skeleton-text" style={{ width: '40%', height: '10px' }} />
        </div>
        <div className="skeleton-cell cell-customer">
          <Skeleton type="skeleton-text" style={{ width: '80%', height: '14px' }} />
          <Skeleton type="skeleton-text" style={{ width: '50%', height: '10px' }} />
        </div>
        <div className="skeleton-cell cell-financials">
          <Skeleton type="skeleton-text" style={{ width: '50%', height: '14px' }} />
          <Skeleton type="skeleton-text" style={{ width: '30%', height: '10px' }} />
        </div>
        <div className="skeleton-cell cell-badge">
          <Skeleton type="skeleton-rect" style={{ width: '70px', height: '20px', borderRadius: '10px' }} />
        </div>
        <div className="skeleton-cell cell-badge">
          <Skeleton type="skeleton-rect" style={{ width: '80px', height: '20px', borderRadius: '10px' }} />
        </div>
        <div className="skeleton-cell cell-actions">
          <Skeleton type="skeleton-rect" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
          <Skeleton type="skeleton-rect" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
        </div>
      </div>
    );
  }
  
  if (columns === 7) {
    return (
      <div className="skeleton-table-row">
        <div className="skeleton-cell cell-customer" style={{ flex: 1.5 }}>
          <Skeleton type="skeleton-text" style={{ width: '70%', height: '14px' }} />
          <Skeleton type="skeleton-text" style={{ width: '40%', height: '10px' }} />
        </div>
        <div className="skeleton-cell" style={{ flex: 1.2 }}>
          <Skeleton type="skeleton-text" style={{ width: '80%', height: '14px' }} />
        </div>
        <div className="skeleton-cell" style={{ flex: 1 }}>
          <Skeleton type="skeleton-text" style={{ width: '90%', height: '14px' }} />
        </div>
        <div className="skeleton-cell" style={{ flex: 1.5 }}>
          <Skeleton type="skeleton-text" style={{ width: '85%', height: '14px' }} />
        </div>
        <div className="skeleton-cell" style={{ flex: 1 }}>
          <Skeleton type="skeleton-text" style={{ width: '60%', height: '14px' }} />
        </div>
        <div className="skeleton-cell" style={{ flex: 1 }}>
          <Skeleton type="skeleton-text" style={{ width: '75%', height: '14px' }} />
        </div>
        <div className="skeleton-cell" style={{ flex: 1, alignItems: 'center' }}>
          <Skeleton type="skeleton-rect" style={{ width: '60px', height: '24px', borderRadius: '6px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-table-row">
      {Array(columns).fill(0).map((_, i) => (
        <Skeleton key={i} type="skeleton-text" />
      ))}
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 5 }) => (
  <div className="skeleton-table-container">
    {Array(rows).fill(0).map((_, i) => (
      <SkeletonTableRow key={i} columns={columns} />
    ))}
  </div>
);

export const SkeletonProductGrid = ({ count = 8 }) => (
  <div className="skeleton-grid">
    {Array(count).fill(0).map((_, i) => (
      <SkeletonProductCard key={i} />
    ))}
  </div>
);

export const SkeletonForm = ({ fields = 4 }) => (
  <div className="skeleton-form">
    {Array(fields).fill(0).map((_, i) => (
      <div key={i} className="skeleton-form-group">
        <Skeleton type="skeleton-text label" />
        <Skeleton type="skeleton-rect input" />
      </div>
    ))}
  </div>
);

export const SkeletonDashboardDetail = () => (
  <div className="skeleton-detail-pane">
    <Skeleton type="skeleton-title skeleton-detail-header" />
    <div className="skeleton-detail-grid">
      <Skeleton type="skeleton-rect skeleton-detail-card" />
      <Skeleton type="skeleton-rect skeleton-detail-card" />
    </div>
    <Skeleton type="skeleton-rect" style={{ height: '200px' }} />
  </div>
);

export const SkeletonStatsGrid = ({ count = 4 }) => (
  <div className="dashboard-stats-grid">
    {Array(count).fill(0).map((_, i) => (
      <div key={i} className="stat-pill">
        <Skeleton type="skeleton-text label" style={{ width: '60px' }} />
        <Skeleton type="skeleton-title value" style={{ width: '80px', marginBottom: 0 }} />
      </div>
    ))}
  </div>
);

import React from 'react';
import { SkeletonStatsGrid, SkeletonTable, SkeletonProductGrid } from './Skeleton';

const SkeletonWrapper = ({ type, count = 5, rows = 5, columns = 5 }) => {
  switch (type) {
    case 'stats':
      return <SkeletonStatsGrid count={count} />;
    case 'table':
      return <SkeletonTable rows={rows} columns={columns} />;
    case 'grid':
      return <SkeletonProductGrid count={count} />;
    default:
      return <div className="skeleton-rect" style={{ height: '200px', borderRadius: '12px' }}></div>;
  }
};

export default SkeletonWrapper;

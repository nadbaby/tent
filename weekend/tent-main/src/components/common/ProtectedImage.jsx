import React, { useState } from 'react';
import './ProtectedImage.css';

/**
 * ProtectedImage Component
 * 
 * NOTE: This component provides multiple layers of protection against casual image downloading.
 * While it stops most users (disable right-click, drag, overlay), it cannot prevent 
 * advanced techniques like screenshots or deep browser inspection.
 */
const ProtectedImage = ({ src, alt, className = "", style = {} }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleDragStart = (e) => {
    e.preventDefault();
  };

  return (
    <div 
      className={`protected-image-container ${className}`}
      onContextMenu={handleContextMenu}
    >
      {/* Loading Skeleton */}
      {isLoading && <div className="image-skeleton animate-pulse"></div>}

      {/* Fallback for Errors */}
      {hasError && (
        <div className="image-fallback">
          <span>Image Not Available</span>
        </div>
      )}

      {/* The Actual Image */}
      <img
        src={src}
        alt={alt}
        className={`actual-image ${isLoading ? 'hidden' : 'visible'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        onDragStart={handleDragStart}
        loading="lazy"
        draggable="false"
        style={style}
      />

      {/* Transparent Overlay Layer */}
      <div className="image-overlay" onContextMenu={handleContextMenu}></div>
    </div>
  );
};

export default ProtectedImage;

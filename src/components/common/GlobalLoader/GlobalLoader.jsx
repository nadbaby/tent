import React from 'react';
import './GlobalLoader.css';

const GlobalLoader = ({ isVisible, text }) => {
  if (!isVisible) return null;

  return (
    <div className="global-loader-overlay">
      <div className="loader-content">
        <div className="spinner-container">
          <svg className="sleek-spinner" viewBox="0 0 50 50">
            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
          </svg>
        </div>
        {text && <p className="loader-text">{text}</p>}
      </div>
    </div>
  );
};

export default GlobalLoader;

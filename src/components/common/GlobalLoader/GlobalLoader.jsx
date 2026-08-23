import React from 'react';
import fineLogo from '../../../assets/Fine LOGO.webp';
import './GlobalLoader.css';

const GlobalLoader = ({ isVisible, text }) => {
  if (!isVisible) return null;

  return (
    <div className="global-loader-overlay">
      {/* Ambient glowing orbs in the background */}
      <div className="loader-ambient-glow glow-1"></div>
      <div className="loader-ambient-glow glow-2"></div>
      
      <div className="loader-content">
        <div className="loader-brand-container">
          {/* Premier glowing rotation ring */}
          <div className="loader-glow-ring"></div>
          
          {/* Center logo with smooth pulse */}
          <div className="loader-logo-wrapper">
            <img src={fineLogo} alt="Fine Bearing Logo" className="loader-logo-image" />
          </div>
        </div>
        
        {text && (
          <div className="loader-text-container">
            <p className="loader-text">{text}</p>
            <span className="loader-subtext">Securing Your Connection</span>
            <div className="loader-progress-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalLoader;

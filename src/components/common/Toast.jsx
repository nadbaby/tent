import React, { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`ios-toast-container ${isVisible ? 'visible' : ''}`}>
      <div className={`ios-toast ${type}`}>
        <div className="ios-toast-content">
          {message}
        </div>
      </div>
    </div>
  );
};

export default Toast;

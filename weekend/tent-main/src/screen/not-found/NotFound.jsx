import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="glitch-wrapper">
          <h1 className="glitch" data-text="404">404</h1>
        </div>
        
        <div className="gear-animation">
          <div className="gear big-gear">⚙️</div>
          <div className="gear small-gear">⚙️</div>
        </div>

        <h2 className="not-found-title">Page Not Found</h2>
        <p className="not-found-text">
          Oops! The page or product you're looking for seems to have gone missing in our warehouse. 
          It might have been moved or doesn't exist.
        </p>

        <div className="not-found-actions">
          <button className="nf-btn primary" onClick={() => navigate('/')}>
            <Home size={18} /> Back to Home
          </button>
          <button className="nf-btn secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Go Back
          </button>
          <button className="nf-btn secondary" onClick={() => navigate('/products')}>
            <Search size={18} /> Browse Products
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

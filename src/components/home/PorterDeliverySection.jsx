import React from 'react';
import { Truck, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PorterDeliverySection.css';

const PorterDeliverySection = () => {
  const navigate = useNavigate();

  return (
    <section className="clean-porter-section">
      <div className="container">
        
        <div className="clean-porter-card">
          <div className="clean-porter-content">
            <div className="clean-porter-badge">
              <Truck size={16} /> Partnered with Porter
            </div>
            <h2 className="clean-porter-title">
              Local Delivery in <span className="text-orange">Hours.</span>
            </h2>
            <p className="clean-porter-desc">
              Don't let a broken bearing stop your production line. We offer hyper-local express delivery across Ludhiana to get your machines running instantly.
            </p>
            
            <ul className="clean-porter-features">
              <li><CheckCircle size={20} className="text-orange" /> <span>Real-time GPS tracking on all urgent orders.</span></li>
              <li><CheckCircle size={20} className="text-orange" /> <span>Direct factory-to-factory dispatch.</span></li>
              <li><CheckCircle size={20} className="text-orange" /> <span>Zero delays, 100% transparent logistics pricing.</span></li>
            </ul>

            <div className="clean-porter-actions">
              <button className="clean-btn-primary" onClick={() => navigate('/products')}>
                Order Now <ArrowRight size={18} />
              </button>
            </div>
          </div>
          
          <div className="clean-porter-visual">
            <div className="clean-porter-graphic">
               <div className="graphic-circle"></div>
               <div className="graphic-truck-box">
                  <Truck size={64} className="text-orange icon-moving" />
                  <div className="graphic-speed-lines">
                    <span className="line-1"></span>
                    <span className="line-2"></span>
                    <span className="line-3"></span>
                  </div>
               </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PorterDeliverySection;

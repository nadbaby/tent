import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Zap, Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import './PorterDeliverySection.css';

const PorterDeliverySection = () => {
  const navigate = useNavigate();

  const points = [
    {
      id: 1,
      title: "Same-day local delivery support in Ludhiana",
      desc: "Get your orders delivered within hours of dispatch directly to your warehouse or factory."
    },
    {
      id: 2,
      title: "Useful for urgent machine breakdown requirements",
      desc: "Minimize factory downtime by sourcing replacement parts instantly through fast local logistics."
    },
    {
      id: 3,
      title: "Suitable for bearings, oil seals, hydraulic products & CNC spares",
      desc: "All product categories in our store are eligible for local delivery."
    },
    {
      id: 4,
      title: "Delivery through Porter local delivery network",
      desc: "Reliable and fast tracking via our trusted delivery partner, Porter."
    },
    {
      id: 5,
      title: "Quick order handling by Fine Bearing team",
      desc: "Our priority warehouse team picks, packs, and verfies your items for dispatch within minutes."
    }
  ];

  return (
    <section className="porter-promo-section">
      <div className="container porter-container">
        
        {/* Main Banner Block */}
        <div className="porter-banner-card">
          <div className="porter-badge">
            <Zap size={14} className="icon-pulse" />
            <span>EXPRESS SERVICE</span>
          </div>
          
          <h2 className="porter-heading">
            Fast Local Delivery <br />
            <span>in Ludhiana</span>
          </h2>
          
          <p className="porter-subheading">
            Need bearings, oil seals, hydraulic products or CNC spares urgently? 
            Get fast local delivery in Ludhiana through Porter.
          </p>
          
          <div className="porter-cta-group">
            <button 
              className="porter-btn-primary"
              onClick={() => navigate('/products')}
            >
              <Truck size={18} />
              <span>Choose Fast Delivery</span>
            </button>
            <button 
              className="porter-btn-secondary"
              onClick={() => navigate('/products')}
            >
              <span>Shop Now</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="porter-tagline-footer">
            "Fast Delivery. Less Waiting. More Working."
          </div>
        </div>

        {/* Why Choose Block */}
        <div className="porter-why-choose-card">
          <h3 className="why-choose-title">Why Choose Fast Local Delivery?</h3>
          
          <div className="points-list">
            {points.map(point => (
              <div key={point.id} className="point-item">
                <div className="point-icon-wrapper">
                  <CheckCircle2 size={18} className="point-check" />
                </div>
                <div className="point-content">
                  <h4>{point.title}</h4>
                  <p>{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default PorterDeliverySection;

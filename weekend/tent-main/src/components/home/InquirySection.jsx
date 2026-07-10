import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import './InquirySection.css';

const InquirySection = () => {
  const navigate = useNavigate();
  return (
    <section className="inquiry-section">
      {/* Liquid Background Blobs */}
      <div className="liquid-blob blob-1"></div>
      <div className="liquid-blob blob-2"></div>
      
      <div className="container inquiry-container">
        <div className="inquiry-content">
          <h2 className="section-title">Request a Custom Quote</h2>
          <p className="section-subtitle">
            Need pricing for bulk orders or specialized machinery? Tell us your requirements and our sales engineering team will get back to you within 24 hours.
          </p>
        </div>
        
        <div className="inquiry-form-wrapper">
          <form className="inquiry-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label htmlFor="company">Company Name</label>
                <input type="text" id="company" placeholder="Acme Corp" required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" placeholder="john@example.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Project Requirements</label>
              <textarea id="message" rows="4" placeholder="Describe the machinery, quantities, or custom specs you need..." required></textarea>
            </div>
            
            <button 
              type="button" 
              className="btn btn-primary submit-btn"
              onClick={() => {
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                  navigate('/login?redirect=/quote');
                } else {
                  navigate('/quote');
                }
              }}
            >
              Submit Request <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default InquirySection;

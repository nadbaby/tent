import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './InquirySection.css';

const InquirySection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="clean-inquiry-section">
      <div className="container">
        
        <div className="clean-inquiry-box">
          <div className="clean-inquiry-header">
            <h2>Let's Build Together</h2>
            <p>Our engineering sales team is ready to deliver tailored solutions and bulk pricing within 24 hours.</p>
          </div>
          
          <form className="clean-inquiry-form">
            <div className="form-row-clean">
              <input type="text" placeholder="Full Name" required />
              <input type="email" placeholder="Email Address" required />
            </div>
            <div className="form-row-clean">
              <input type="text" placeholder="Company Name (Optional)" />
              <input type="tel" placeholder="Phone Number" required />
            </div>
            <textarea rows="4" placeholder="Describe your requirements or specific part numbers..." required></textarea>
            
            <button 
              type="button" 
              className="clean-inquiry-submit"
              onClick={() => {
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                  navigate('/login?redirect=/quote');
                } else {
                  navigate('/quote');
                }
              }}
            >
              Get Your Custom Quote <ArrowRight size={18} />
            </button>
          </form>
        </div>

      </div>
    </section>
  );
};

export default InquirySection;

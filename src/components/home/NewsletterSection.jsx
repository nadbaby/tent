import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import './NewsletterSection.css';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }, 1200);
  };

  return (
    <section className="newsletter-section">
      <div className="newsletter-container">
        <div className="newsletter-bg-glow"></div>
        <div className="newsletter-content">
          <div className="newsletter-text">
            <h2>Stay Ahead with Industrial Insights</h2>
            <p>Subscribe to our newsletter for exclusive updates on new bearing technologies, industry trends, and special technical guides.</p>
          </div>
          
          <div className="newsletter-form-container">
            <form onSubmit={handleSubmit} className={`newsletter-form ${status === 'success' ? 'success' : ''}`}>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your professional email" 
                required 
                disabled={status !== 'idle'}
              />
              <button 
                type="submit" 
                disabled={status !== 'idle'}
                className={status}
              >
                {status === 'idle' && <><Send size={18} /> Subscribe</>}
                {status === 'loading' && <span className="loader-dots">...</span>}
                {status === 'success' && <><CheckCircle2 size={18} /> Subscribed</>}
              </button>
            </form>
            <div className="newsletter-disclaimer">
              We respect your privacy. No spam, just pure industrial value.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;

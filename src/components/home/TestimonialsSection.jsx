import React from 'react';
import './TestimonialsSection.css';

const TestimonialsSection = () => {
  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="section-header center">
          <h2 className="section-title">What People Say About Us</h2>
          <p className="section-subtitle">Real feedback from our valued clients and partners.</p>
        </div>

        {/* 
          Using a standard iframe with the Trustindex widget URL 
          to ensure it stays inside this section.
        */}
        <div className="trustindex-widget-container" style={{ width: '100%', overflow: 'hidden' }}>
          <iframe 
            src="https://cdn.trustindex.io/amp-widget.html#f8d4064706d5284e591690190dc" 
            width="100%" 
            height="353" 
            style={{ border: 'none' }}
            title="Trustindex Reviews"
            sandbox="allow-scripts allow-same-origin"
          ></iframe>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

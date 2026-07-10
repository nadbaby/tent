import React from 'react';
import './TestimonialsSection.css';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const reviews = [
    {
      id: 1,
      text: "The quality of pillow block bearings from Fine Bearing is unmatched. Fast delivery and excellent customer support.",
      name: "Rajesh Kumar",
      role: "Maintenance Manager",
      highlight: false
    },
    {
      id: 2,
      text: "We have been sourcing all our oil seals and agricultural bearings from here for the last two years. Highly reliable!",
      name: "Amit Sharma",
      role: "Operations Head",
      highlight: true
    },
    {
      id: 3,
      text: "Exceptional service! The UCP and UCF bearings we received were genuine and perfectly packed. Very happy with the pricing.",
      name: "Sneha Patel",
      role: "Procurement Officer",
      highlight: false
    },
    {
      id: 4,
      text: "I placed a bulk order for industrial belts and they delivered exactly on time via Porter. Excellent B2B platform.",
      name: "Vikram Singh",
      role: "Factory Supervisor",
      highlight: true
    },
    {
      id: 5,
      text: "The team really understands industrial requirements. We got genuine products at the best wholesale rates in the market.",
      name: "Priya Deshmukh",
      role: "Supply Chain Lead",
      highlight: false
    },
    {
      id: 6,
      text: "Very smooth ordering process. The quote system is quick, and the products are always 100% genuine.",
      name: "Anil Gupta",
      role: "Site Engineer",
      highlight: false
    }
  ];

  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="section-header center">
          <p className="section-subtitle-large">
            Trusted by top industrial professionals and factories across India for genuine parts and reliable delivery
          </p>
        </div>

        <div className="marquee-container">
          <div className="marquee-content">
            {[...reviews, ...reviews].map((review, index) => (
              <div key={`${review.id}-${index}`} className={`testimonial-card ${review.highlight ? 'highlight' : ''}`}>
                <div className="rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="#FBBF24" color="#FBBF24" />
                  ))}
                </div>
                <p className="testimonial-text">"{review.text}"</p>
                <div className="testimonial-footer">
                  <div className="author-info">
                    <h4>{review.name}</h4>
                    <p>{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

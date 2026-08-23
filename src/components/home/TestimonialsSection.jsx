import React from 'react';
import { Star } from 'lucide-react';
import './TestimonialsSection.css';

const testimonials = [
  {
    id: 1,
    text: "The quality of pillow block bearings from Fine Bearing is unmatched. Fast delivery and excellent customer support.",
    name: "Rajesh Kumar",
    role: "Maintenance Manager"
  },
  {
    id: 2,
    text: "We source all our hydraulic valves from here. Reliable products and they always have stock when we need it most.",
    name: "Sandeep Singh",
    role: "Production Head"
  },
  {
    id: 3,
    text: "Their electric motors are highly efficient. Our assembly line downtime has reduced by 30% since we switched.",
    name: "Amit Sharma",
    role: "Chief Engineer"
  },
  {
    id: 4,
    text: "Custom hydraulic seals were delivered exactly to our specs within 48 hours. Phenomenal turnaround time.",
    name: "Vikram Mehta",
    role: "Operations Director"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="clean-test-section">
      <div className="container">
        <div className="clean-test-header">
          <h2>Trusted by Industry Leaders</h2>
          <p>See what our enterprise clients have to say about our industrial components.</p>
        </div>
        <div className="clean-test-grid">
          {testimonials.map((test) => (
            <div key={test.id} className="clean-test-card">
              <div className="clean-test-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#ea580c" color="#ea580c" />
                ))}
              </div>
              <p className="clean-test-text">"{test.text}"</p>
              <div className="clean-test-author">
                <div className="author-avatar">{test.name.charAt(0)}</div>
                <div className="author-details">
                  <h4>{test.name}</h4>
                  <span>{test.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

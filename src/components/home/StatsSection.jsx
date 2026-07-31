import React, { useState, useEffect, useRef } from 'react';
import './StatsSection.css';

const stats = [
  { id: 1, value: 250, suffix: "+", label: "Cities Served Across India", desc: "Delivering industrial excellence locally." },
  { id: 2, value: 10, suffix: "k+", label: "Regular Enterprise Clients", desc: "Trusted by top tier factories." },
  { id: 3, value: 45, suffix: "k+", label: "Premium Product Varieties", desc: "The largest catalog of bearings & seals." },
  { id: 4, value: 20, suffix: "+", label: "Years of Engineering Expertise", desc: "Decades of deep industry knowledge." },
];

const Counter = ({ end, suffix }) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => {
      if (nodeRef.current) observer.unobserve(nodeRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const incrementTime = 30;
    const steps = duration / incrementTime;
    
    // Determine raw number part from 'end' if it's passed as a number (currently we pass 10 for 10k+)
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [isVisible, end]);

  return (
    <div className="stat-giant-value" ref={nodeRef}>
      {count}{suffix}
    </div>
  );
};

const StatsSection = () => {
  return (
    <section className="stats-brutalist-section">
      <div className="container">
        <div className="stats-brutalist-grid">
          {stats.map((stat) => (
            <div key={stat.id} className="stat-brutalist-card">
              <Counter end={stat.value} suffix={stat.suffix} />
              <h4 className="stat-brutalist-label">{stat.label}</h4>
              <p className="stat-brutalist-desc">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

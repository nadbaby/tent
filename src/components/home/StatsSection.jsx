import React, { useState, useEffect, useRef } from 'react';
import { Globe, Users, Trophy, Box } from 'lucide-react';
import './StatsSection.css';

const stats = [
  { id: 1, icon: <Globe size={32} />, value: 250, suffix: "+", label: "Cities Served" },
  { id: 2, icon: <Users size={32} />, value: 10000, suffix: "+", label: "Regular Clients" },
  { id: 3, icon: <Box size={32} />, value: 45000, suffix: "+", label: "Products Varieties" },
  { id: 4, icon: <Trophy size={32} />, value: 20, suffix: "", label: "Years Experience" },
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

  // Format large numbers like 10000 -> 10k
  const formattedCount = count >= 1000 ? (count / 1000).toFixed(count % 1000 === 0 ? 0 : 1) + 'k' : count;

  return (
    <div className="stat-value" ref={nodeRef}>
      {formattedCount}{suffix}
    </div>
  );
};

const StatsSection = () => {
  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.id} className="stat-card">
              <div className="stat-icon">
                {stat.icon}
              </div>
              <Counter end={stat.value} suffix={stat.suffix} />
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

import React, { useState } from 'react';
import ProtectedImage from '../common/ProtectedImage';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './CategorySection.css';

const categories = [
  { id: 1, name: "Bearings", count: "142 Products", image: "/categories/bearing-new.jpg" },
  { id: 2, name: "Hydraulic Valves", count: "86 Products", image: "/categories/hydraulic-valve-v2.jpg" },
  { id: 3, name: "Motor", count: "215 Products", image: "/categories/electric-motor-v2.jpg" },
  { id: 4, name: "Pump", count: "112 Products", image: "/categories/hydraulic-pump.jpg" },
  { id: 5, name: "Linear Guideway", count: "54 Products", image: "/categories/linear-guideway-new.png" },
  { id: 6, name: "Coupling", count: "24 Products", image: "/categories/coupling-v3.jpg" },
];

const CategorySection = () => {
  const [activeId, setActiveId] = useState(1);

  return (
    <section className="category-section-new">
      <div className="container">
        <div className="cat-header-new">
          <h2 className="massive-title">Shop by Category.</h2>
          <p className="subtitle-new">Precision components designed for extreme industrial demands.</p>
        </div>

        <div className="cat-bento-grid">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className={`bento-card bento-item-${index + 1}`}
            >
              <div className="cat-bg-wrapper">
                <ProtectedImage src={cat.image} alt={cat.name} className="cat-bg-img" />
              </div>
              <div className="cat-overlay"></div>

              <div className="cat-content">
                <div className="cat-info">
                  <h3>{cat.name}</h3>
                  <p>{cat.count}</p>
                </div>
                <Link to={`/products?category=${cat.name}`} className="cat-explore-btn">
                  Explore <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
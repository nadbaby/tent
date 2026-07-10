import React from 'react';
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
  return (
    <section className="category-section">
      <div className="container">
        <div className="section-header">



          <div>
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Find exactly what you need quickly and efficiently.</p>
          </div>
        </div>

        <div className="category-grid">
          {categories.map((cat) => (
            <Link to={`/products?category=${cat.name}`} key={cat.id} className="category-card">
              <div className="category-image">
                <ProtectedImage src={cat.image} alt={cat.name} />
                <div className="category-overlay"></div>
              </div>
              <div className="category-content">
                <h3>{cat.name}</h3>
                <p>{cat.count}</p>
                <span className="category-link">View Products <ArrowRight size={16} /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};



export default CategorySection;
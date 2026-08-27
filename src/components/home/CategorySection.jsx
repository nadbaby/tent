import React, { useState } from 'react';
import ProtectedImage from '../common/ProtectedImage';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './CategorySection.css';

import bearingsImg from '../../assets/bearingssss.webp';
import valvesImg from '../../assets/valvessss.webp';
import motorsImg from '../../assets/motorsss.webp';
import sealsImg from '../../assets/seallsss_1.webp';
import linearGuidewayImg from '../../assets/linear_guide_wayass.webp';
import couplingsImg from '../../assets/couplingssss.webp';

const categories = [
  { id: 1, name: "Bearings", image: bearingsImg },
  { id: 2, name: "Hydraulic Valves", image: valvesImg },
  { id: 3, name: "Motor", image: motorsImg },
  { id: 4, name: "Seals", searchCategory: "Seals", image: sealsImg },
  { id: 5, name: "Linear Guideway", image: linearGuidewayImg },
  { id: 6, name: "Coupling", image: couplingsImg },
];

const CategorySection = () => {
  const [activeId, setActiveId] = useState(1);
  const navigate = useNavigate();

  return (
    <section className="category-section-new">
      <div className="container">


        <div className="cat-bento-grid">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className={`bento-card bento-item-${index + 1}`}
              onClick={() => navigate(`/products?category=${cat.searchCategory || cat.name}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="cat-bg-wrapper">
                <ProtectedImage src={cat.image} alt={cat.name} className="cat-bg-img" />
              </div>
              <div className="cat-overlay"></div>

              <div className="cat-content">
                <div className="cat-info">
                  <h3>{cat.name}</h3>
                </div>
                <Link to={`/products?category=${cat.searchCategory || cat.name}`} className="cat-explore-btn" onClick={(e) => e.stopPropagation()}>
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
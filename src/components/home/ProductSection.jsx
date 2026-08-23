import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { ArrowRight } from 'lucide-react';
import './ProductSection.css';

const ProductSection = ({ title, subtitle, products, viewAllLink = "/products", bgAlt = false }) => {
  return (
    <section className={`product-section ${bgAlt ? 'bg-alt' : ''}`}>
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">{title}</h2>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
          <Link to={viewAllLink} className="view-all-link">
            View All <ArrowRight size={18} />
          </Link>
        </div>
        
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};


export default ProductSection;

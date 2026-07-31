import React from 'react';
import './BrandsSection.css';
import fagImage from '../../assets/Logo/Fag.png';
import hiwinImage from '../../assets/Logo/Hiwin.png';
import finhyImage from '../../assets/Logo/Finhy.png';
import alpImage from '../../assets/Logo/Alp.png';
import schaefflerImage from '../../assets/Logo/Schaeffler.png';

const brands = [
  { id: 1, name: "HIWIN", src: hiwinImage, bgColor: "#EEF9F1" },
  { id: 2, name: "FINHY", src: finhyImage, bgColor: "#EBF4FA" },
  { id: 3, name: "ALP", src: alpImage, bgColor: "#F5F7F9" },
  { id: 4, name: "FAG", src: fagImage, bgColor: "#FDF2F2" },
  { id: 5, name: "Schaeffler", src: schaefflerImage, bgColor: "#EEF9F1" },
];

const BrandsSection = () => {
  return (
    <section className="brands-section">
      <div className="container">
        <div className="brands-header">
          <h2 className="section-title">Brands We Deal In</h2>
          <p className="section-subtitle">Partnering with global leaders in manufacturing and machinery.</p>
        </div>

        <div className="brands-marquee-wrapper">
          <div className="brands-track">
            {/* Repeat the array for seamless endless scrolling */}
            {[...brands, ...brands, ...brands, ...brands].map((brand, index) => (
              <div key={index} className="brand-logo-card" style={{ backgroundColor: brand.bgColor }}>
                <img src={brand.src} alt={brand.name} className="brand-logo" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;





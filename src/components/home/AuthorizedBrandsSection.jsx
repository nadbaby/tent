import React from 'react';
import ProtectedImage from '../common/ProtectedImage';
import './AuthorizedBrandsSection.css';
import fagImage from '../../assets/Logo/Fag.png';
import arbImage from '../../assets/Logo/Arb.png';
import hiwinImage from '../../assets/Logo/Hiwin.png';
import nskImage from '../../assets/Logo/NSK.png';
import AlpImage from '../../assets/Logo/Alp.png';

const authorizedBrands = [
  { id: 1, name: "FAG", src: fagImage, bgColor: "#FDF2F2" },
  { id: 2, name: "ARB", src: arbImage, bgColor: "#F5F7F9" },
  { id: 3, name: "NSK", src: nskImage, bgColor: "#EBF4FA" },
  { id: 4, name: "ACP", src: AlpImage, bgColor: "#FFF4E5" },
  { id: 5, name: "HIWIN", src: hiwinImage, bgColor: "#EEF9F1" },
];

const AuthorizedBrandsSection = () => {
  return (
    <section className="authorized-brands-section">
      <div className="container">
        <div className="brands-content-split">
          <div className="brands-header">
            <span className="premium-badge">
              <span className="pulse-dot"></span>
              TRUSTED PARTNERS
            </span>
            <h2 className="section-title">Authorized Brands</h2>
            <p className="section-subtitle">We are the proud authorized distributors for these premium global brands.</p>
          </div>

          <div className="carousel-3d-container">
            <div className="carousel-3d">
              {authorizedBrands.map((brand, index) => (
                <div
                  key={brand.id}
                  className="carousel-3d-item"
                  style={{
                    '--index': index,
                    backgroundColor: brand.bgColor
                  }}
                >
                  {brand.src ? (
                    <ProtectedImage src={brand.src} alt={brand.name} />
                  ) : (
                    <div className="text-logo">{brand.textLogo}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthorizedBrandsSection;

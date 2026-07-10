import React from 'react';
import './AuthorizedDealerSection.css';
import skfImage from '../../assets/Logo/Skf.png';
import fagImage from '../../assets/Logo/Fag.png';
import ntnImage from '../../assets/Logo/NTN.png';
import schaefflerImage from '../../assets/Logo/Schaeffler.png';

const authorizedBrands = [
  { id: 1, name: "SKF", src: skfImage, bgColor: "#EBF4FA" },
  { id: 2, name: "FAG", src: fagImage, bgColor: "#FDF2F2" },
  { id: 3, name: "NTN", src: ntnImage, bgColor: "#EBF4FA" },
  { id: 5, name: "Schaeffler", src: schaefflerImage, bgColor: "#EEF9F1" },
];

const AuthorizedDealerSection = () => {
  return (
    <section className="authorized-dealer-section">
      <div className="container">
        <div className="authorized-header">
          <span className="authorized-badge">
            <span className="badge-glow-dot"></span>
            TRUSTED PARTNERS
          </span>
          <h2 className="section-title">Authorized Brands</h2>
          <p className="section-subtitle">
            We are proud authorized dealers for these world-renowned brands, ensuring 100% genuine products with full warranty support.
          </p>
        </div>

        <div className="authorized-carousel-container">
          <div className="authorized-spinner">
            {authorizedBrands.map((brand, index) => (
              <div
                key={brand.id}
                className="card-3d-wrapper"
                style={{ transform: `rotateY(${index * 72}deg) translateZ(var(--orbit-radius))` }}
              >
                <div className="authorized-card">
                  <div className="authorized-card-inner">
                    <img src={brand.src} alt={brand.name} className="authorized-logo" />
                  </div>
                  <div className="authorized-card-footer">
                    <span className="verified-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.25 17.292l-4.5-4.364 1.857-1.858 2.643 2.506 5.643-5.784 1.857 1.858-7.5 7.642z" />
                      </svg>
                    </span>
                    <span className="authorized-name">{brand.name}</span>
                    <span className="explore-arrow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </span>
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

export default AuthorizedDealerSection;

import React from 'react';
import './BrandsSection.css';
import skfImage from '../../assets/Logo/Skf.png';
import yukenImage from '../../assets/Logo/Yuken.png';
import fagImage from '../../assets/Logo/Fag.png';
import hiwinImage from '../../assets/Logo/Hiwin.png';
import finhyImage from '../../assets/Logo/Finhy.png';
import ntnImage from '../../assets/Logo/NTN.png';
import nachiImage from '../../assets/Logo/Nachi.png';
import arbImage from '../../assets/Logo/Arb.png';
import polyhydronImage from '../../assets/Logo/Polyhydron.png';
import alpImage from '../../assets/Logo/Alp.png';
import kluberImage from '../../assets/Logo/Kluber.png';
import loctiteImage from '../../assets/Logo/Loctite.png';
import oksImage from '../../assets/Logo/Oks.png';
import schaefflerImage from '../../assets/Logo/Schaeffler.png';
import walvoilImage from '../../assets/Logo/Walvoil.png';
import pmiImage from '../../assets/Logo/Pmi.png';


const brands = [
  { id: 1, name: "SKF", src: skfImage, bgColor: "#EBF4FA" }, // Blue tint
  { id: 2, name: "Yuken", src: yukenImage, bgColor: "#EBF4FA" },
  { id: 3, name: "FAG", src: fagImage, bgColor: "#FDF2F2" }, // Red tint
  { id: 4, name: "HIWIN", src: hiwinImage, bgColor: "#EEF9F1" }, // Green tint
  { id: 5, name: "FINHY", src: finhyImage, bgColor: "#EBF4FA" },
  { id: 6, name: "NTN", src: ntnImage, bgColor: "#EBF4FA" },
  { id: 7, name: "NACHI", src: nachiImage, bgColor: "#FDF2F2" },
  { id: 8, name: "ARB", src: arbImage, bgColor: "#F5F7F9" }, // Gray tint
  { id: 9, name: "Polyhydron", src: polyhydronImage, bgColor: "#EBF4FA" },
  { id: 10, name: "ALP", src: alpImage, bgColor: "#F5F7F9" },
  { id: 11, name: "KLUBER", src: kluberImage, bgColor: "#F5F7F9" },
  { id: 12, name: "PMI", src: pmiImage, bgColor: "#F5F7F9" },
  { id: 13, name: "Loctite", src: loctiteImage, bgColor: "#FDF2F2" },
  { id: 15, name: "OKS", src: oksImage, bgColor: "#F5F7F9" },
  { id: 16, name: "Schaeffler", src: schaefflerImage, bgColor: "#EEF9F1" },
  { id: 17, name: "Walvoil", src: walvoilImage, bgColor: "#FDF2F2" },
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
            {/* Double the array for seamless endless scrolling */}
            {[...brands, ...brands].map((brand, index) => (
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

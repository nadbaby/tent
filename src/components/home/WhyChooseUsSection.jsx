import React from 'react';
import { Shield, Zap, Wrench, Award } from 'lucide-react';
import './WhyChooseUsSection.css';

const WhyChooseUsSection = () => {
  return (
    <section className="clean-wcu-section">
      <div className="container">
        <div className="clean-wcu-header">
          <h2 className="clean-wcu-title">Why Professionals Choose Us</h2>
          <p className="clean-wcu-subtitle">Setting the gold standard in industrial component supply and manufacturing.</p>
        </div>
        <div className="clean-wcu-grid">
          <div className="clean-wcu-card">
            <div className="clean-wcu-icon-box"><Shield size={28} /></div>
            <h3>Certified Quality</h3>
            <p>Every component meets strict ISO standards. Zero-tolerance for defects ensures your machinery runs flawlessly without interruptions.</p>
          </div>
          <div className="clean-wcu-card">
            <div className="clean-wcu-icon-box"><Zap size={28} /></div>
            <h3>Rapid Dispatch</h3>
            <p>Our streamlined logistics network ensures expedited 48-hour delivery for most critical replacement parts across the country.</p>
          </div>
          <div className="clean-wcu-card">
            <div className="clean-wcu-icon-box"><Award size={28} /></div>
            <h3>Industry Experts</h3>
            <p>Over 20 years of engineering experience working with top factories to help you solve complex load and thermodynamic challenges.</p>
          </div>
          <div className="clean-wcu-card">
            <div className="clean-wcu-icon-box"><Wrench size={28} /></div>
            <h3>Custom Fabrication</h3>
            <p>Need specialized parts? Our in-house CNC facilities can build bespoke seals and machine components directly to your specifications.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;

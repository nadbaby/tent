import React from 'react';
import fineLogo from '../../assets/Fine LOGO.png';
import './about.css';

const About = () => {
  return (
    <main className="about-screen">
      <section className="about-hero">
        <div className="container about-hero-grid">
          <div>
            <span className="section-badge">About Us</span>
            <h1>Fine Bearing & Oil Seal Store</h1>
            <p>
              A trusted industrial components supplier delivering quality bearings,
              oil seals, hydraulic products, pneumatic products, and CNC machine
              spares for businesses across India.
            </p>

            <div className="hero-actions">
              <a href="/products" className="primary-btn">Explore Products</a>
              <a href="/contact" className="secondary-btn">Contact Us</a>
            </div>
          </div>

          <div className="about-logo-card">
            <img src={fineLogo} alt="Fine Bearing & Oil Seal Store" />
          </div>
        </div>
      </section>

      <section className="container about-section">
        <div className="about-content-card">
          <h2>Who We Are</h2>
          <p>
            Fine Bearing & Oil Seal Store is built on trust, technical knowledge,
            and consistent product quality. We help industries source reliable
            mechanical and hydraulic components that keep machines running smoothly.
          </p>
          <p>
            From standard bearing sizes to custom sealing solutions, our focus is
            to provide genuine products, quick availability, and professional support
            for industrial customers.
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>25+</h3>
            <p>Years Experience</p>
          </div>
          <div className="stat-card">
            <h3>10k+</h3>
            <p>Products Available</p>
          </div>
          <div className="stat-card">
            <h3>5k+</h3>
            <p>Happy Customers</p>
          </div>
          <div className="stat-card">
            <h3>100%</h3>
            <p>Quality Focus</p>
          </div>
        </div>
      </section>

      <section className="about-dark-section">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge light">Our Expertise</span>
            <h2>Industrial Products We Deal In</h2>
            <p>
              We supply components for manufacturing units, workshops, automation,
              hydraulic systems, CNC machines, and heavy-duty industrial applications.
            </p>
          </div>

          <div className="expertise-grid">
            <div className="expertise-card">
              <h3>Bearings</h3>
              <p>Ball bearings, roller bearings, UCP, UCF, UC, linear bearings and more.</p>
            </div>
            <div className="expertise-card">
              <h3>Oil Seals</h3>
              <p>Industrial oil seals, hydraulic seals, PU seals, PTFE seals, O-rings and wipers.</p>
            </div>
            <div className="expertise-card">
              <h3>Hydraulic Products</h3>
              <p>Hydraulic motors, valves, power packs, cylinders and related components.</p>
            </div>
            <div className="expertise-card">
              <h3>CNC Machine Spares</h3>
              <p>Reliable CNC spares and motion components for precision machinery.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container values-section">
        <div className="section-heading">
          <span className="section-badge">Why Choose Us</span>
          <h2>Built for Industrial Reliability</h2>
        </div>

        <div className="values-grid">
          <div className="value-card">
            <h3>Genuine Quality</h3>
            <p>We focus on dependable products suitable for demanding industrial use.</p>
          </div>
          <div className="value-card">
            <h3>Technical Support</h3>
            <p>We help customers choose the right product according to size, load and application.</p>
          </div>
          <div className="value-card">
            <h3>Fast Availability</h3>
            <p>Wide product range with quick response for urgent industrial requirements.</p>
          </div>
        </div>
      </section>

      <section className="container about-cta">
        <h2>Need the Right Industrial Component?</h2>
        <p>
          Contact Fine Bearing & Oil Seal Store for bearings, seals, hydraulic products,
          pneumatic products and CNC machine spares.
        </p>
        <a href="/contact" className="primary-btn">Send Enquiry</a>
      </section>
    </main>
  );
};

export default About;
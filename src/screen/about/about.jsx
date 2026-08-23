import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Wrench,
  Zap,
  CircleDot,
  Shield,
  Droplet,
  Cpu,
  ArrowRight,
  TrendingUp,
  Package,
  Users,
  CheckCircle2,
  Boxes
} from 'lucide-react';
import fineLogo from '../../assets/Fine LOGO.webp';
import './about.css';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.1
    }
  },
  viewport: { once: true, margin: "-80px" }
};

const hoverScale = {
  hover: {
    y: -8,
    scale: 1.02,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  }
};

const AboutSkeleton = () => {
  return (
    <div className="about-skeleton-screen">
      {/* Hero Skeleton */}
      <div className="skeleton-hero">
        <div className="container skeleton-hero-grid">
          <div className="skeleton-hero-left">
            <div className="skeleton-badge shimmer"></div>
            <div className="skeleton-title shimmer"></div>
            <div className="skeleton-title shimmer delay-1"></div>
            <div className="skeleton-para shimmer"></div>
            <div className="skeleton-para shimmer delay-1"></div>
            <div className="skeleton-button-group">
              <div className="skeleton-button shimmer"></div>
              <div className="skeleton-button shimmer delay-1"></div>
            </div>
          </div>
          <div className="skeleton-hero-right">
            <div className="skeleton-logo-card shimmer"></div>
          </div>
        </div>
      </div>

      {/* Dashboard Tray Skeleton */}
      <div className="container">
        <div className="skeleton-dashboard-tray">
          <div className="skeleton-features-grid">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-feature-card">
                <div className="skeleton-icon-bubble shimmer"></div>
                <div className="skeleton-card-line shimmer"></div>
              </div>
            ))}
          </div>
          <div className="skeleton-trust-bar">
            <div className="skeleton-bar-line shimmer"></div>
          </div>
        </div>
      </div>

      {/* Stats and Who We Are Skeleton */}
      <div className="container skeleton-about-section">
        <div className="skeleton-about-content">
          <div className="skeleton-subtitle shimmer"></div>
          <div className="skeleton-header shimmer"></div>
          <div className="skeleton-text shimmer"></div>
          <div className="skeleton-text shimmer delay-1"></div>
          <div className="skeleton-text shimmer delay-2"></div>
        </div>
        <div className="skeleton-stats-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-stat-card">
              <div className="skeleton-stat-icon shimmer"></div>
              <div className="skeleton-stat-val shimmer"></div>
              <div className="skeleton-stat-lbl shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const About = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <AboutSkeleton />;
  }

  return (
    <main className="about-screen">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-grid-overlay"></div>
        <div className="hero-glow-orb orb-1"></div>
        <div className="hero-glow-orb orb-2"></div>

        <div className="container about-hero-grid">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hero-text-content"
          >
            <div className="badge-glow-container">
              <span className="section-badge hero-badge">Since 1999</span>
            </div>

            <h1>
              Precision Industrial <br />
              <span className="text-highlight">Components Partner</span>
            </h1>

            <p>
              Fine Bearing & Oil Seal Store is a premium engineering components distributor. We deliver
              high-integrity mechanical bearings, specialized rotary shaft seals, and advanced hydraulic
              & CNC motion solutions built for peak industrial uptime.
            </p>

            <div className="hero-actions">
              <a href="/products" className="primary-btn">
                Explore Products <ArrowRight size={18} className="btn-icon" />
              </a>
              <a href="/contact" className="secondary-btn">Contact Us</a>
            </div>

            {/* Sub-hero trust badges */}
            <div className="hero-trust-badges">
              <div className="trust-badge-pill">
                <span className="pulse-dot"></span>
                <span>Authorized Partner</span>
              </div>
              <div className="trust-badge-pill">
                <span className="pulse-dot"></span>
                <span>Ready Stock</span>
              </div>
              <div className="trust-badge-pill">
                <span className="pulse-dot"></span>
                <span>PAN India Delivery</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="about-logo-card-wrapper"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="about-logo-card">
              <div className="card-engineering-lines"></div>
              <img src={fineLogo} alt="Fine Bearing & Oil Seal Store Logo" />

              {/* Floating year indicator */}
              <motion.div
                className="floating-precision-badge"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="badge-shimmer"></div>
                <Award size={16} className="badge-icon" />
                <span className="badge-bold">25+</span>
                <span className="badge-sub">Years of Trust</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Overlapping Quick Feature Boxes & Trust Brands Logo Bar */}
      <section className="hero-floating-features">
        <div className="container">
          <motion.div
            className="floating-features-grid"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: "-40px" }}
          >
            <motion.div className="floating-feature-card" variants={fadeInUp} whileHover={{ y: -10 }}>
              <div className="feature-icon bg-gradient-orange">
                <CircleDot size={26} />
              </div>
              <h4>High-Precision Bearings</h4>
            </motion.div>

            <motion.div className="floating-feature-card" variants={fadeInUp} whileHover={{ y: -10 }}>
              <div className="feature-icon bg-gradient-orange">
                <Shield size={26} />
              </div>
              <h4>Certified Oil Seals</h4>
            </motion.div>

            <motion.div className="floating-feature-card" variants={fadeInUp} whileHover={{ y: -10 }}>
              <div className="feature-icon bg-gradient-orange">
                <Cpu size={26} />
              </div>
              <h4>CNC Machine Spares</h4>
            </motion.div>

            <motion.div className="floating-feature-card" variants={fadeInUp} whileHover={{ y: -10 }}>
              <div className="feature-icon bg-gradient-orange">
                <Wrench size={26} />
              </div>
              <h4>Engineering Consultation</h4>
            </motion.div>

            <motion.div className="floating-feature-card" variants={fadeInUp} whileHover={{ y: -10 }}>
              <div className="feature-icon bg-gradient-orange">
                <Zap size={26} />
              </div>
              <h4>Pan-India Express Stock</h4>
            </motion.div>
          </motion.div>

          {/* Minimal B2B Brand Logos Bar underneath boxes */}
          <motion.div
            className="floating-features-trust-bar"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="trust-bar-text">
              <div className="trust-bar-line"></div>
              <span>Trusted by 5L+ Happy Clients</span>
              <div className="trust-bar-line"></div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* Who We Are & Stats Section */}
      <section className="container about-section">
        <motion.div
          className="about-content-card"
          variants={fadeInUp}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-100px" }}
        >
          <span className="section-subtitle">Since 1999</span>
          <h2>Who We Are</h2>
          <p>
            Fine Bearing & Oil Seal Store is built on an unwavering commitment to trust,
            deep technical excellence, and premium product quality. We partner with industries
            of all scales, helping them source high-integrity mechanical and hydraulic components
            engineered to keep critical manufacturing operations running seamlessly.
          </p>
          <p>
            From high-precision standard bearings to bespoke fluid sealing solutions, our focus
            is on delivering 100% genuine products, unmatched shelf availability, and expert
            technical consulting tailored to demanding industrial requirements.
          </p>
        </motion.div>

        <motion.div
          className="about-stats-grid"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div className="about-stat-card" variants={fadeInUp} whileHover="hover" custom={0} {...hoverScale}>
            <div className="stat-icon-wrapper">
              <TrendingUp size={24} color="#ea580c" />
            </div>
            <h3>25+</h3>
            <p>Years of Legacy</p>
          </motion.div>

          <motion.div className="about-stat-card" variants={fadeInUp} whileHover="hover" custom={1} {...hoverScale}>
            <div className="stat-icon-wrapper">
              <Package size={24} color="#ea580c" />
            </div>
            <h3>10k+</h3>
            <p>Active SKUs</p>
          </motion.div>

          <motion.div className="about-stat-card" variants={fadeInUp} whileHover="hover" custom={2} {...hoverScale}>
            <div className="stat-icon-wrapper">
              <Users size={24} color="#ea580c" />
            </div>
            <h3>5k+</h3>
            <p>B2B Partnerships</p>
          </motion.div>

          <motion.div className="about-stat-card" variants={fadeInUp} whileHover="hover" custom={3} {...hoverScale}>
            <div className="stat-icon-wrapper">
              <CheckCircle2 size={24} color="#ea580c" />
            </div>
            <h3>100%</h3>
            <p>Genuine Guarantee</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Expertise / Products Section */}
      <section className="about-dark-section">
        <div className="container">
          <motion.div
            className="section-heading"
            variants={fadeInUp}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            <span className="section-badge light">Our Core Expertise</span>
            <h2>Premium Industrial Solutions</h2>
            <p>
              We are an authorized and primary distributor of leading mechanical, motion transmission,
              hydraulic, pneumatic, and electronic spares designed for heavy engineering applications.
            </p>
          </motion.div>

          <motion.div
            className="expertise-grid"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            <motion.div className="expertise-card" variants={fadeInUp} whileHover={{ y: -10, borderColor: "rgba(234, 88, 12, 0.4)" }}>
              <div className="expertise-icon-bubble">
                <CircleDot size={28} />
              </div>
              <h3>Precision Bearings</h3>
              <p>Ball bearings, heavy-duty roller bearings, linear guideways, self-aligning pillow blocks (UCP, UCF, UC) engineered for longevity.</p>
            </motion.div>

            <motion.div className="expertise-card" variants={fadeInUp} whileHover={{ y: -10, borderColor: "rgba(234, 88, 12, 0.4)" }}>
              <div className="expertise-icon-bubble">
                <Shield size={28} />
              </div>
              <h3>Advanced Oil Seals</h3>
              <p>Custom hydraulic seals, PU/PTFE seals, industrial rotary shaft oil seals, premium O-rings, and heavy engineering rod-wipers.</p>
            </motion.div>

            <motion.div className="expertise-card" variants={fadeInUp} whileHover={{ y: -10, borderColor: "rgba(234, 88, 12, 0.4)" }}>
              <div className="expertise-icon-bubble">
                <Droplet size={28} />
              </div>
              <h3>Hydraulic Systems</h3>
              <p>Industrial hydraulic motors, high-pressure control valves, power packs, heavy-duty cylinders, and state-of-the-art flow couplers.</p>
            </motion.div>

            <motion.div className="expertise-card" variants={fadeInUp} whileHover={{ y: -10, borderColor: "rgba(234, 88, 12, 0.4)" }}>
              <div className="expertise-icon-bubble">
                <Cpu size={28} />
              </div>
              <h3>CNC & Spares</h3>
              <p>Premium CNC spindle spares, linear motion guides, precision ball screws, and high-frequency electronic motion controllers.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values / Why Choose Us Section */}
      <section className="container values-section">
        <motion.div
          className="section-heading"
          variants={fadeInUp}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          <span className="section-badge">Why Fine Bearing</span>
          <h2>Built for Maximum Industrial Uptime</h2>
        </motion.div>

        <motion.div
          className="values-grid"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          <motion.div className="value-card" variants={fadeInUp} whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.12)" }}>
            <div className="value-icon-circle bg-orange-soft">
              <Award size={24} className="icon-orange" />
            </div>
            <h3>Certified Genuine</h3>
            <p>Every single component sourced by Fine Bearing undergoes strict batch quality validation, ensuring you only receive parts certified for extreme heavy-duty operations.</p>
          </motion.div>

          <motion.div className="value-card" variants={fadeInUp} whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.12)" }}>
            <div className="value-icon-circle bg-orange-soft">
              <Wrench size={24} className="icon-orange" />
            </div>
            <h3>Elite Engineering Support</h3>
            <p>Our experienced sales engineers help your procurement team select exactly the right size, load tolerance, dynamic capability, and longevity specifications.</p>
          </motion.div>

          <motion.div className="value-card" variants={fadeInUp} whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.12)" }}>
            <div className="value-icon-circle bg-orange-soft">
              <Zap size={24} className="icon-orange" />
            </div>
            <h3>Ultra-Rapid Delivery</h3>
            <p>We boast an industry-leading ready-stock inventory, ensuring lightning fast turnarounds and direct site delivery to minimize expensive production down-time.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container">
        <motion.div
          className="about-cta"
          variants={fadeInUp}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          whileHover={{ scale: 1.01 }}
        >
          <div className="cta-glow-dot"></div>
          <h2>Ready to Optimize Your Procurement?</h2>
          <p>
            Equip your industrial machinery with top-tier components. Contact the engineering sales
            team at Fine Bearing & Oil Seal Store today for custom sizing, quotes, and rapid bulk orders.
          </p>
          <div className="cta-actions">
            <a href="/contact" className="primary-btn">
              Send Procurement Enquiry <ArrowRight size={18} className="btn-icon" />
            </a>
            <a href="/products" className="secondary-btn dark-cta-btn">Browse Catalog</a>
          </div>
        </motion.div>
      </section>
    </main>
  );
};

export default About;
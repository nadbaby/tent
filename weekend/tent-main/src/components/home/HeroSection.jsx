import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './HeroSection.css';
import bearingImage from '../../assets/Bearingss.png';
import Hydraulic from '../../assets/Hydraulic.png';
import OilSeal from '../../assets/Oil_Seal.png';
import Motor from '../../assets/Motor.png';

const heroSlides = [
  {
    id: 1,
    title: "All Bearings",
    subtitle: "High-Precision Bearings Designed for Durability, Efficiency & Zero Downtime – Upgrade Your Machinery Today.",
    primaryCTA: "Buy Now",
    secondaryCTA: "View Products",
    image: bearingImage,
    theme: "light",
    category: "Bearings"
  },
  {
    id: 2,
    title: "All types of CNC Machine Spares",
    subtitle: "Top-Grade CNC Parts & Spares for Smooth Operations, Reduced Wear & Superior Efficiency in Every Cycle.",
    primaryCTA: "Buy Now",
    secondaryCTA: "View Products",
    image: Motor,
    theme: "light",
    category: "CNC Machine Spares"
  },
  {
    id: 3,
    title: "Premium Hydraulic Products",
    subtitle: "Shop Advanced Hydraulic Equipment at Competitive Prices – Engineered for Strength, Smooth Operation & Maximum Output.",
    primaryCTA: "Buy Now",
    secondaryCTA: "View Products",
    image: Hydraulic,
    theme: "light",
    category: "Hydraulics Tools"
  },
  {
    id: 4,
    title: "High-Quality Oil Seals",
    subtitle: "High-Quality Oil Seals for Leak-Proof Performance, Dust Protection & Extended Machinery Life.",
    primaryCTA: "Buy Now",
    secondaryCTA: "View Products",
    image: OilSeal,
    theme: "light",
    category: "Seals"
  },
  {
    id: 5,
    title: "High-Performance Hydraulic Seals",
    subtitle: "Upgrade Your Machinery with Reliable Hydraulic Seals – Reduce Wear, Improve Efficiency & Prevent Fluid Loss.",
    primaryCTA: "Buy Now",
    secondaryCTA: "View Products",
    image: Hydraulic,
    theme: "light",
    category: "Seals"
  },
];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (category) => {
    navigate(`/products?category=${category}`);
  };

  // Auto slide every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  // Handle transition end
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsTransitioning(false);
    }, 300); // matches CSS transition duration
    return () => clearTimeout(timeout);
  }, [currentSlide]);

  return (
    <section className="hero-section">
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`hero-slide ${index === currentSlide ? 'active' : ''} ${slide.theme}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="hero-overlay"></div>

          <div className="container hero-content">
            <div className="hero-text-area">
              <h1 className="hero-title">
                {slide.title}
              </h1>
              <p className="hero-subtitle">
                {slide.subtitle}
              </p>
              <div className="hero-actions">
                <button 
                  className={`btn ${slide.theme === 'dark' ? 'btn-primary' : 'btn-primary'} hero-btn`}
                  onClick={() => handleNavigation(slide.category)}
                >
                  {slide.primaryCTA} <ArrowRight size={18} />
                </button>
                <button 
                  className="btn btn-outline hero-btn-outline"
                  onClick={() => handleNavigation(slide.category)}
                >
                  {slide.secondaryCTA}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Controls */}
      <div className="hero-controls container">
        <div className="slider-indicators">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => {
                if (!isTransitioning && index !== currentSlide) {
                  setIsTransitioning(true);
                  setCurrentSlide(index);
                }
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

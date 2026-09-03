import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './HeroSection.css';
import wwwe28 from '../../assets/wwwe28.webp';
import wwwe24 from '../../assets/wwwe24.webp';
import wwwe25 from '../../assets/wwwe25.webp';

const heroSlides = [
  {
    id: 1,
    image: wwwe28,
    category: "Bearings",
    link: "/products?category=Bearings"
  },
  {
    id: 2,
    image: wwwe24,
    category: "CNC Machine Spares",
    link: "/products?category=CNC Machine Spares"
  },
  {
    id: 3,
    image: wwwe25,
    category: "Hydraulics Tools",
    link: "/products?category=Hydraulics Tools"
  }
];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  // Auto slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(timer);
  }, [currentSlide, isTransitioning]);

  // Handle transition lock
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsTransitioning(false);
    }, 600); // matches transition duration
    return () => clearTimeout(timeout);
  }, [currentSlide]);

  return (
    <section className="hero-section-wrapper container">
      <div className="hero-section">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
            onClick={() => navigate(slide.link)}
          >
            <img
              src={slide.image}
              alt={slide.category}
              fetchPriority={index === 0 ? "high" : "auto"}
              loading={index === 0 ? "eager" : "lazy"}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          className="hero-arrow prev"
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          className="hero-arrow next"
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* Slide Indicators */}
        <div className="slider-indicators">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
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

import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/api';
import HeroSection from '../../components/home/HeroSection';
import AuthorizedBrandsSection from '../../components/home/AuthorizedBrandsSection';
import BrandsSection from '../../components/home/BrandsSection';
import CategorySection from '../../components/home/CategorySection';
import ProductSection from '../../components/home/ProductSection';
import StatsSection from '../../components/home/StatsSection';
import WhyChooseUsSection from '../../components/home/WhyChooseUsSection';
import TestimonialsSection from '../../components/home/TestimonialsSection';
import InquirySection from '../../components/home/InquirySection';
import PorterDeliverySection from '../../components/home/PorterDeliverySection';
import { SkeletonProductGrid, Skeleton } from '../../components/common/Skeleton/Skeleton';
import './home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(apiUrl('/api/products'));
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();

        // Normalize data (handling empty images or other missing fields)
        const normalizedData = data.map(p => ({
          ...p,
          image: p.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600',
          specs: p.description ? p.description.substring(0, 60) + '...' : (p.subcategory || p.brand)
        }));

        setProducts(normalizedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter or slice products for different sections
  const featuredProducts = products.filter(p => p.isActive).slice(0, 4);
  const newArrivals = products.filter(p => p.isActive).reverse().slice(0, 8);

  return (
    <div className="home-screen">
      <HeroSection />
      <CategorySection />
      <AuthorizedBrandsSection />
      <BrandsSection />

      {loading ? (
        <section className="product-section bg-alt" style={{ padding: '60px 0' }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Skeleton type="skeleton-title" style={{ margin: '0 auto 10px', width: '300px' }} />
              <Skeleton type="skeleton-text" style={{ margin: '0 auto', width: '500px' }} />
            </div>
            <SkeletonProductGrid count={4} />
          </div>
        </section>
      ) : (
        featuredProducts.length > 0 && (
          <ProductSection
            title="Featured Industrial Solutions"
            subtitle="Top rated equipment trusted by professionals worldwide."
            products={featuredProducts}
            bgAlt={true}
            viewAllLink="/products"
          />
        )
      )}

      <StatsSection />

      {loading ? (
        <section className="product-section" style={{ padding: '60px 0' }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Skeleton type="skeleton-title" style={{ margin: '0 auto 10px', width: '300px' }} />
              <Skeleton type="skeleton-text" style={{ margin: '0 auto', width: '500px' }} />
            </div>
            <SkeletonProductGrid count={8} />
          </div>
        </section>
      ) : (
        newArrivals.length > 0 && (
          <ProductSection
            title="New Arrivals"
            subtitle="The latest advancements in industrial technology."
            products={newArrivals}
            bgAlt={false}
            viewAllLink="/products"
          />
        )
      )}

      <PorterDeliverySection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <InquirySection />
    </div>
  );
};

export default Home;

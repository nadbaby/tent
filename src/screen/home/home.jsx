import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/api';
import HeroSection from '../../components/home/HeroSection';
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
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('user');
  let isLudhianaUser = false;
  if (userStr) {
    try {
      const userObj = JSON.parse(userStr);
      const address = userObj.address || '';
      const city = userObj.city || '';
      if (address.toLowerCase().includes('ludhiana') || city.toLowerCase().includes('ludhiana')) {
        isLudhianaUser = true;
      }
    } catch (e) { }
  }

  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        const response = await fetch(apiUrl('/api/products/home'));
        if (!response.ok) throw new Error('Failed to fetch home products');

        const data = await response.json();
        setFeaturedProducts(data.featuredProducts || []);
        setNewArrivals(data.newArrivals || []);
      } catch (err) {
        console.error("Error fetching home products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeProducts();
  }, []);

  return (
    <div className="home-screen">
      <HeroSection />
      <CategorySection />
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

      {isLudhianaUser && new Date().getDay() !== 0 && <PorterDeliverySection />}
      <WhyChooseUsSection />
      <TestimonialsSection />
      <InquirySection />
    </div>
  );
};

export default Home;

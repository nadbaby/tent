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
  const [products, setProducts] = useState([]);
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

  // Helper to pick products across different categories & subcategories
  const getDiverseProducts = (allProducts, targetCount, isReverse = false) => {
    let active = allProducts.filter(p => p.isActive);
    if (active.length === 0) return [];
    if (isReverse) {
      active = [...active].reverse();
    }

    // Group products by category
    const categoriesMap = new Map();
    active.forEach(p => {
      const cat = p.category || 'General';
      if (!categoriesMap.has(cat)) {
        categoriesMap.set(cat, []);
      }
      categoriesMap.get(cat).push(p);
    });

    const categories = Array.from(categoriesMap.keys());
    const selected = [];
    const selectedSubcategories = new Set();
    const selectedIds = new Set();

    const pickBestCandidate = (list) => {
      // 1. Try to find featured product
      const featured = list.find(p => p.isFeatured && !selectedIds.has(p.id));
      if (featured) return featured;

      // 2. Try to find candidate from unselected subcategory with min price
      const unselectedSubcatList = list.filter(p => p.subcategory && !selectedSubcategories.has(p.subcategory) && !selectedIds.has(p.id));
      if (unselectedSubcatList.length > 0) {
        return unselectedSubcatList.reduce((minP, curP) => {
          const minVal = (minP.price && Number(minP.price) > 0) ? Number(minP.price) : Infinity;
          const curVal = (curP.price && Number(curP.price) > 0) ? Number(curP.price) : Infinity;
          return curVal < minVal ? curP : minP;
        }, unselectedSubcatList[0]);
      }

      // 3. Fallback: min price item not yet selected
      const unselectedList = list.filter(p => !selectedIds.has(p.id));
      if (unselectedList.length > 0) {
        return unselectedList.reduce((minP, curP) => {
          const minVal = (minP.price && Number(minP.price) > 0) ? Number(minP.price) : Infinity;
          const curVal = (curP.price && Number(curP.price) > 0) ? Number(curP.price) : Infinity;
          return curVal < minVal ? curP : minP;
        }, unselectedList[0]);
      }

      return null;
    };

    // Pass 1: Pick 1 product from each distinct category
    for (const cat of categories) {
      if (selected.length >= targetCount) break;
      const catProducts = categoriesMap.get(cat);
      const candidate = pickBestCandidate(catProducts);
      if (candidate) {
        selected.push(candidate);
        selectedIds.add(candidate.id);
        if (candidate.subcategory) selectedSubcategories.add(candidate.subcategory);
      }
    }

    // Pass 2: Round-robin across categories if more products are needed
    let roundIndex = 0;
    while (selected.length < targetCount && active.length > selected.length) {
      const cat = categories[roundIndex % categories.length];
      const catProducts = categoriesMap.get(cat);
      const candidate = pickBestCandidate(catProducts);
      if (candidate) {
        selected.push(candidate);
        selectedIds.add(candidate.id);
        if (candidate.subcategory) selectedSubcategories.add(candidate.subcategory);
      } else {
        const remaining = active.find(p => !selectedIds.has(p.id));
        if (remaining) {
          selected.push(remaining);
          selectedIds.add(remaining.id);
          if (remaining.subcategory) selectedSubcategories.add(remaining.subcategory);
        } else {
          break;
        }
      }
      roundIndex++;
    }

    return selected;
  };

  // Filter products across different categories
  const featuredProducts = getDiverseProducts(products, 4, false);
  const newArrivals = getDiverseProducts(products, 8, true);

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

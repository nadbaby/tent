import React from 'react';
import { ArrowRight, Calendar } from 'lucide-react';
import './BlogPreviewSection.css';

const posts = [
  {
    id: 1,
    title: "How Automation is Reshaping Heavy Manufacturing in 2024",
    date: "Oct 12, 2023",
    category: "Industry Insights",
    image: "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&q=80&w=600",
    excerpt: "Discover the latest trends in factory automation and how robotic arms are scaling production while reducing..."
  },
  {
    id: 2,
    title: "Understanding Hydraulic Fluid Maintenance",
    date: "Sep 28, 2023",
    category: "Technical Guide",
    image: "https://images.unsplash.com/photo-1580982542474-569d31671af5?auto=format&fit=crop&q=80&w=600",
    excerpt: "A comprehensive guide on when and how to flush hydraulic systems to prevent catastrophic equipment failure."
  },
  {
    id: 3,
    title: "Safety Standards Update: What You Need to Know",
    date: "Sep 15, 2023",
    category: "Compliance",
    image: "https://images.unsplash.com/photo-1542034960-9d0a64966601?auto=format&fit=crop&q=80&w=600",
    excerpt: "New international safety regulations are taking effect this quarter. Ensure your facility remains compliant."
  }
];

const BlogPreviewSection = () => {
  return (
    <section className="blog-section">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Latest Insights & News</h2>
            <p className="section-subtitle">Stay updated with industry trends, technical guides, and company news.</p>
          </div>
          <a href="#" className="view-all-link">
            Read All Articles <ArrowRight size={18} />
          </a>
        </div>

        <div className="blog-grid">
          {posts.map((post) => (
            <article key={post.id} className="blog-card">
              <div className="blog-image">
                <img src={post.image} alt={post.title} />
                <span className="blog-category">{post.category}</span>
              </div>
              <div className="blog-content">
                <div className="blog-date">
                  <Calendar size={14} /> {post.date}
                </div>
                <h3 className="blog-title">{post.title}</h3>
                <p className="blog-excerpt">{post.excerpt}</p>
                <a href="#" className="blog-read-more">Read More <ArrowRight size={16} /></a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPreviewSection;

import React, { useState } from 'react';
import { apiUrl } from '../../utils/api';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  MessageCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import './contact.css';

const Youtube = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const Instagram = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const Facebook = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const Linkedin = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    product: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/request-quote'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setFormData({ name: '', phone: '', email: '', product: '', message: '' });
        }, 3000);
      } else {
        console.error("Server responded with error:", response.status);
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const socialLinks = [
    {
      name: 'YouTube',
      icon: <Youtube size={24} />,
      link: 'https://www.youtube.com/@Finebrg',
      color: '#FF0000',
      description: 'Technical Tutorials & Product Reviews'
    },
    {
      name: 'Instagram',
      icon: <Instagram size={24} />,
      link: 'https://www.instagram.com/finebearings/',
      color: '#E1306C',
      description: 'Daily Updates & Behind the Scenes'
    },
    {
      name: 'Facebook',
      icon: <Facebook size={24} />,
      link: 'https://www.facebook.com/Finebearings',
      color: '#1877F2',
      description: 'Industry News & Community'
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin size={24} />,
      link: 'https://www.linkedin.com/company/fine-bearing-&-oil-seal-store---india/',
      color: '#0A66C2',
      description: 'Professional Network'
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={24} />,
      link: 'https://wa.me/918146119761',
      color: '#25D366',
      description: 'Quick Enquiries & Support'
    }
  ];

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="container">
          <div className="hero-badge">Industrial Solutions Since 1998</div>
          <h1>Get in Touch with Our Experts</h1>
          <p>Partner with India's leading industrial bearing specialists. Whether you need a technical quote or custom industrial solutions, our team is ready to assist.</p>
        </div>
      </section>

      <div className="container">
        <div className="contact-grid">
          <div className="contact-info-column">
            <div className="info-card main-details">
              <h2>Fine Bearing & Oil Seal Store</h2>
              <span className="subtitle">Authorized Industrial Distributors</span>

              <a href="https://maps.google.com/?q=Fine+Bearing+&+Oil+Seal+Store,+Ludhiana" target="_blank" rel="noopener noreferrer" className="detail-link">
                <div className="icon-box"><MapPin size={24} /></div>
                <div>
                  <h3>Our Location</h3>
                  <p>Shere Punjab Building, Link Road,<br />Opposite Industrial Estate, Near Dholewal Bridge,<br />Ludhiana - 141003, Punjab, India</p>
                </div>
              </a>

              <a href="tel:+918146119761" className="detail-link">
                <div className="icon-box"><Phone size={24} /></div>
                <div>
                  <h3>Call / WhatsApp</h3>
                  <p>+91 8146119761</p>
                </div>
              </a>

              <a href="mailto:sales@finebearings.com" className="detail-link">
                <div className="icon-box"><Mail size={24} /></div>
                <div>
                  <h3>Email Address</h3>
                  <p>sales@finebearings.com</p>
                </div>
              </a>

              <div className="detail-item">
                <div className="icon-box"><Clock size={24} /></div>
                <div>
                  <h3>Business Hours</h3>
                  <p>Mon - Sat: 10:00 AM - 7:30 PM</p>
                </div>
              </div>
            </div>

            <div className="social-section">
              <h3>Follow Our Journey</h3>
              <p>Stay updated with the latest industrial technology and product launches.</p>
              <div className="social-cards">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-card"
                    style={{ '--hover-color': social.color }}
                  >
                    <div className="social-icon">{social.icon}</div>
                    <div className="social-text">
                      <h4>{social.name}</h4>
                      <p>{social.description}</p>
                    </div>
                    <ChevronRight size={18} className="arrow" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="contact-form-column">
            <div className="enquiry-card">
              <div className="card-badge"><ShieldCheck size={16} /> Secure Enquiry</div>
              <h2>Send an Enquiry</h2>
              <p>Fill out the form below and our technical team will get back to you within 24 hours.</p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required />
                </div>

                <div className="form-group">
                  <label>Contact Details</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" required />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Product Interested In</label>
                  <input type="text" name="product" value={formData.product} onChange={handleChange} placeholder="e.g. SKF 6205 Bearing, Oil Seals" />
                </div>

                <div className="form-group">
                  <label>Your Message</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Describe your requirement in detail..." rows="5" required></textarea>
                </div>

                <button type="submit" className={`submit-btn ${submitted ? 'success' : ''}`} disabled={loading}>
                  {loading ? 'Sending...' : submitted ? 'Enquiry Sent Successfully!' : <>Send Message <Send size={20} /></>}
                </button>
              </form>

              <div className="whatsapp-fast-track">
                <p>Need a faster response for urgent orders?</p>
                <a href="https://wa.me/918146119761" target="_blank" rel="noopener noreferrer" className="wa-btn">
                  <MessageCircle size={22} /> Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        <section className="youtube-section">
          <div className="section-header">
            <h2>Latest From Our YouTube Channel</h2>
            <p>Expert insights, product comparisons, and maintenance tips for industrial components.</p>
          </div>
          <div className="video-container">
            <iframe
              width="100%"
              height="500"
              src="https://www.youtube.com/embed/gsSraTbyHYY"
              title="Industrial Insights"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="yt-cta">
            <a href="https://www.youtube.com/@finebrg" target="_blank" className="btn-yt">
              <Youtube size={22} /> Subscribe for More
            </a>
          </div>
        </section>

        <section className="maps-section">
          <div className="section-header">
            <h2>Visit Our Store</h2>
            <p>Located in the heart of Ludhiana's industrial hub.</p>
          </div>
          <div className="map-wrapper">
            <iframe src="https://maps.google.com/maps?width=100%25&amp;height=100%25&amp;hl=en&amp;q=Fine%20Bearing%20%26%20Oil%20Seal%20Store,%20Ludhiana+(Fine%20Bearing)&amp;t=&amp;z=16&amp;ie=UTF8&amp;iwloc=B&amp;output=embed" width="100%" height="500" style={{ border: 0 }} allowFullScreen></iframe>
            <div className="map-info">
              <div className="info-badge"><ExternalLink size={14} /> <a href="https://maps.google.com" target="_blank">Open Maps</a></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;

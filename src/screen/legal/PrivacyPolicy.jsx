import React, { useEffect } from 'react';
import './legal.css';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page">
      <div className="container">
        <div className="legal-card">
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-last-updated">Last Updated: May 12, 2026</p>

          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>Welcome to Fine Bearing & Oil Seal Store. We value your privacy and the security of your personal data. This Privacy Policy explains how we collect, use, and protect your information when you visit our website.</p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, such as when you create an account, place an order, or contact our support team. This may include:</p>
            <ul>
              <li>Name, email address, and phone number</li>
              <li>Shipping and billing addresses</li>
              <li>Business details (Company name, GST number)</li>
              <li>Payment information (processed securely through our payment partners)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul>
              <li>Process and fulfill your orders</li>
              <li>Provide customer support and technical assistance</li>
              <li>Send transaction notifications and updates</li>
              <li>Improve our products and user experience</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Data Protection</h2>
            <p>We implement industry-standard security measures, including SSL encryption and secure database protocols, to safeguard your personal data from unauthorized access or disclosure.</p>
          </section>

          <section className="legal-section">
            <h2>5. Cookies</h2>
            <p>Our website uses cookies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can manage your cookie preferences through your browser settings.</p>
          </section>

          <section className="legal-section">
            <h2>6. Third-Party Services</h2>
            <p>We may share your information with trusted third-party service providers (e.g., payment gateways like Razorpay, shipping partners) only to the extent necessary to perform their services.</p>
          </section>

          <section className="legal-section">
            <h2>7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information. You can manage your details through your profile page or contact us for assistance.</p>
          </section>

          <section className="legal-section">
            <h2>8. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at support@finebearingonline.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

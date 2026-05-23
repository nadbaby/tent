import React, { useEffect } from 'react';
import './legal.css';

const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page">
      <div className="container">
        <div className="legal-card">
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-last-updated">Last Updated: May 12, 2026</p>

          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using the Fine Bearing & Oil Seal Store website, you agree to comply with and be bound by these Terms of Service. If you do not agree, please refrain from using our services.</p>
          </section>

          <section className="legal-section">
            <h2>2. User Accounts</h2>
            <p>To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          </section>

          <section className="legal-section">
            <h2>3. Product Information & Pricing</h2>
            <p>We strive to provide accurate product descriptions and pricing. However, we reserve the right to correct any errors and to change prices or product availability without prior notice. For B2B quotes, the final price is subject to confirmation via the official quote system.</p>
          </section>

          <section className="legal-section">
            <h2>4. Orders & Payments</h2>
            <p>All orders are subject to acceptance by us. Payments must be made through our authorized payment gateways. We reserve the right to cancel any order for reasons including product unavailability or suspicion of fraudulent activity.</p>
          </section>

          <section className="legal-section">
            <h2>5. Shipping & Delivery</h2>
            <p>Shipping charges are calculated based on weight and destination zone. While we aim for timely delivery, we are not liable for delays caused by third-party carriers or unforeseen circumstances.</p>
          </section>

          <section className="legal-section">
            <h2>6. Intellectual Property</h2>
            <p>All content on this website, including images, logos, and technical specifications, is the property of Fine Bearing & Oil Seal Store or its partners. Unauthorized use or reproduction is strictly prohibited.</p>
          </section>

          <section className="legal-section">
            <h2>7. Limitation of Liability</h2>
            <p>Fine Bearing & Oil Seal Store shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website.</p>
          </section>

          <section className="legal-section">
            <h2>8. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Punjab, India.</p>
          </section>

          <section className="legal-section">
            <h2>9. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on this website.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

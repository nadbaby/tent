import React from 'react';
import { useLocation } from 'react-router-dom';
import './legal.css';

const Legal = () => {
  const location = useLocation();
  const isPrivacy = location.pathname === '/privacy';

  return (
    <div className="legal-screen">
      <div className="container">
        <header className="page-header">
          <h1>{isPrivacy ? 'Privacy Policy' : 'Terms of Service'}</h1>
          <p>Last Updated: April 24, 2026</p>
        </header>

        <div className="legal-content">
          <section>
            <h2>1. Introduction</h2>
            <p>Welcome to Fine Bearing & Oil Seal Store. We value your business and your trust. This document outlines the {isPrivacy ? 'privacy practices' : 'terms of use'} for our ecommerce platform.</p>
          </section>

          <section>
            <h2>2. {isPrivacy ? 'Data Collection' : 'Account Responsibilities'}</h2>
            <p>{isPrivacy
              ? 'We collect information necessary to process your industrial orders, including company details, shipping addresses, and payment information.'
              : 'As a platform, users are responsible for maintaining the confidentiality of their account credentials.'}
            </p>
          </section>

          <section>
            <h2>3. Contact Us</h2>
            <p>If you have any questions, please contact us at sales@finebearing.in.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Legal;

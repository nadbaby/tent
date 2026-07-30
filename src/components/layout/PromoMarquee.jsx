import React, { useState } from 'react';
import { Tag, ShieldCheck, Sparkles } from 'lucide-react';
import './PromoMarquee.css';

const PromoMarquee = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const copyToClipboard = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  if (!isVisible) return null;

  const promoItems = [
    {
      badge: "SALE",
      text: "Use code ",
      code: "MEFIRST",
      suffix: " for FLAT ₹500 OFF on your first order!",
      icon: <Tag size={14} className="promo-icon" />,
      color: "var(--color-accent)"
    },
    {
      badge: "TRUSTED",
      text: "100% genuine industrial bearings, seals, & spares guaranteed.",
      code: "",
      suffix: "",
      icon: <ShieldCheck size={14} className="promo-icon" />,
      color: "#3b82f6"
    },
    {
      badge: "BULK OFFERS",
      text: "Need industrial volume? Click 'Request Quote' for custom wholesale pricing!",
      code: "",
      suffix: "",
      icon: <Sparkles size={14} className="promo-icon" />,
      color: "#8b5cf6"
    },
    {
      badge: "SALE",
      text: "Use code ",
      code: "MESECOND",
      suffix: " for FLAT ₹1000 OFF on your second order!",
      icon: <Tag size={14} className="promo-icon" />,
      color: "var(--color-accent)"
    }
  ];

  // Duplicate items array multiple times to guarantee enough content for a seamless infinite scroll on wide screens
  const doubledItems = [...promoItems, ...promoItems, ...promoItems];

  const renderItemContent = (item, idx, groupName) => (
    <div key={`${groupName}-${idx}`} className="promo-marquee-item">
      {item.icon}
      <span className="promo-marquee-badge" style={{ backgroundColor: item.color }}>
        {item.badge}
      </span>
      <span className="promo-marquee-text">
        {item.text}
        {item.code && (
          <span
            className={`promo-copyable-code ${copiedCode === item.code ? 'copied' : ''}`}
            onClick={(e) => copyToClipboard(item.code, e)}
            title="Click to copy code"
          >
            {item.code}
            <span className="copy-tooltip">
              {copiedCode === item.code ? 'Copied! ✅' : 'Click to Copy 📋'}
            </span>
          </span>
        )}
        {item.suffix}
      </span>
      <span className="promo-marquee-divider">•</span>
    </div>
  );

  return (
    <div className="promo-marquee-bar">
      <div className="promo-marquee-container">
        <div className="promo-marquee-track">
          <div className="promo-marquee-group">
            {doubledItems.map((item, idx) => renderItemContent(item, idx, "group1"))}
          </div>
          <div className="promo-marquee-group" aria-hidden="true">
            {doubledItems.map((item, idx) => renderItemContent(item, idx, "group2"))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoMarquee;

import React from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import './WhatsAppFloat.css';

const WhatsAppFloat = () => {
  const location = useLocation();

  // Hide on order success/failure pages (often considered payment pages)
  const hiddenPaths = ['/order-success', '/order-failure'];
  const isHidden = hiddenPaths.includes(location.pathname);

  if (isHidden) return null;

  const phoneNumber = "918146119761"; 
  const message = "Hello! I'm interested in your industrial products.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
    >
      <div className="whatsapp-tooltip">Chat with us</div>
      <MessageCircle size={32} />
    </a>
  );
};

export default WhatsAppFloat;

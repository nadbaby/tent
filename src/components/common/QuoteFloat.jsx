import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';
import './QuoteFloat.css';

const QuoteFloat = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on pages where it might interfere
  const hiddenPaths = ['/order-success', '/order-failure', '/quote'];
  const isHidden = hiddenPaths.includes(location.pathname);

  if (isHidden) return null;

  return (
    <button
      className="quote-float"
      onClick={() => navigate('/quote')}
      aria-label="Request a Quote"
    >
      <div className="quote-tooltip">Request Quote</div>
      <FileText size={28} />
    </button>
  );
};

export default QuoteFloat;

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './BackButton.css';

const BackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Hide the back button on the homepage
    if (location.pathname === '/' || location.pathname === '/login') {
        return null;
    }

    return (
        <button
            className="global-back-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
        >
            <ArrowLeft size={20} />
            <span>Back</span>
        </button>
    );
};

export default BackButton;

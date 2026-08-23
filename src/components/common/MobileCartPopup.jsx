import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './MobileCartPopup.css';

const MobileCartPopup = () => {
    const { totalQuantity, items } = useSelector((state) => state.cart);
    const navigate = useNavigate();
    const location = useLocation();

    if (totalQuantity === 0) return null;

    const isHidden = location.pathname === '/checkout' || location.pathname.includes('/order-success');

    return (
        <div className="mobile-cart-popup-container" onClick={(e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login?redirect=/checkout');
            } else {
                navigate('/checkout');
            }
        }} style={{ display: isHidden ? 'none' : 'block' }}>
            <div className="mobile-cart-popup">
                <div className="mobile-cart-popup-left">
                    {items.length > 0 ? (
                        <div className="mobile-cart-images-stack">
                            {items.slice(0, 3).map((item, index) => (
                                <div className="mobile-cart-image-wrapper" key={index} style={{ zIndex: 3 - index }}>
                                    {item.image ? (
                                        <img src={item.image} alt="Cart item" className="mobile-cart-image" />
                                    ) : (
                                        <div className="mobile-cart-image-placeholder" style={{ width: '100%', height: '100%' }}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mobile-cart-image-placeholder"></div>
                    )}
                </div>
                <div className="mobile-cart-popup-center">
                    <span className="mobile-cart-title">View cart</span>
                    <span className="mobile-cart-subtitle">{totalQuantity} {totalQuantity > 1 ? 'Items' : 'Item'}</span>
                </div>
                <div className="mobile-cart-popup-right">
                    <div className="mobile-cart-arrow-wrapper">
                        <ChevronRight size={20} color="white" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileCartPopup;

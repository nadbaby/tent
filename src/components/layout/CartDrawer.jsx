import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addItem, removeItem, clearCart, deleteFromCart } from '../../redux/cartSlice';
import { resolveImageUrl } from '../home/ProductCard';
import { apiUrl } from '../../utils/api';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { items, totalQuantity } = useSelector((state) => state.cart);

  const userData = JSON.parse(localStorage.getItem('user')) || null;
  const specialDiscount = userData?.specialDiscount || 0;

  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || (item.price * item.quantity) || 0), 0);
  const discountAmount = (subtotal * specialDiscount) / 100;
  const totalPrice = subtotal - discountAmount;

  const handleIncrement = (item) => {
    dispatch(addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      size: item.size,
    }));
  };

  const handleDecrement = (item) => {
    dispatch(removeItem({ id: item.id, size: item.size }));
  };

  const handleQuantityChange = (item, newQty) => {
    const qty = parseInt(newQty);
    if (isNaN(qty) || qty < 1) return;

    dispatch(addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: qty,
      size: item.size,
      replace: true
    }));
  };

  const navigate = useNavigate();

  const handleCheckout = () => {
    if (totalPrice <= 0) {
      alert("Please request a quote for items without pricing.");
      return;
    }
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`cart-backdrop ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title">
            <ShoppingBag size={22} />
            <h2>Your Cart</h2>
            {totalQuantity > 0 && (
              <span className="cart-drawer-count">{totalQuantity}</span>
            )}
          </div>
          <button className="cart-drawer-close" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon-wrapper">
                <ShoppingBag size={48} strokeWidth={1.5} />
              </div>
              <h3>Your cart is empty</h3>
              <p>Looks like you haven't added any industrial premium products yet.</p>
            </div>
          ) : (
            <div className="cart-items-list">
              {/* Porter Delivery Notice */}
              <div className="porter-cart-notice" style={{
                background: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                color: '#9a3412',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <Truck size={16} style={{ color: '#ea580c', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Fast Local Delivery</strong> is available for Ludhiana customers. Delivery charges depend on distance, product size, product weight and Porter availability.
                </div>
              </div>
              {items.map((item) => {
                const displayImage = resolveImageUrl(item.image);
                return (
                  <div key={`${item.id}-${item.size || 'default'}`} className="cart-item">
                    <div className="cart-item-image">
                      <img
                        src={displayImage}
                        alt={item.name}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600';
                        }}
                      />
                    </div>
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.name}</h4>
                      {item.size && (
                        <p className="cart-item-size" style={{ fontSize: '0.75rem', color: '#ea580c', margin: '2px 0 6px 0', fontWeight: '600' }}>
                          Size: {item.size}
                        </p>
                      )}
                      <p className="cart-item-price">
                        {item.price > 0 ? `₹${item.price.toLocaleString('en-IN')}` : 'Request Quote'}
                      </p>
                      <div className="cart-item-quantity">
                        <button
                          className="qty-btn"
                          onClick={() => handleDecrement(item)}
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          className="qty-input"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item, e.target.value)}
                          min="1"
                        />
                        <button
                          className="qty-btn"
                          onClick={() => handleIncrement(item)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-total-side">
                      <span className="cart-item-final-price">
                        {(item.totalPrice || (item.price * item.quantity)) > 0
                          ? `₹${(item.totalPrice || (item.price * item.quantity)).toLocaleString('en-IN')}`
                          : '—'}
                      </span>
                      <button
                        className="cart-item-remove"
                        onClick={() => dispatch(deleteFromCart({ id: item.id, size: item.size }))}
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {specialDiscount > 0 && (
                <div className="cart-summary-row discount-row">
                  <span>Special Discount ({specialDiscount}%)</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="cart-total-row">
                <span>Total Amount</span>
                <span className="cart-total-amount">
                  {totalPrice > 0 ? `₹${totalPrice.toLocaleString('en-IN')}` : 'Request Quote'}
                </span>
              </div>
            </div>
            <button className="cart-checkout-btn" onClick={handleCheckout}>
              <span>Proceed to Checkout</span>
              <ArrowRight size={20} />
            </button>
            <button
              className="cart-clear-btn"
              onClick={() => dispatch(clearCart())}
            >
              <Trash2 size={14} />
              Clear Entire Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;

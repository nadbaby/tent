import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, HelpCircle, ShoppingCart } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addItem } from '../../redux/cartSlice';
import { useToast } from '../../context/ToastContext';
import { apiUrl } from '../../utils/api';
import './Chatbot.css';
import ReactMarkdown from 'react-markdown';
import aiAssistantLogo from '../../assets/ai-assistant-logo.png';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello! I am the Fine Bearing AI Assistant. How can I help you find the right industrial products, bearings, or oil seals today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleAddToCart = (product, sku) => {
    // Mandatory Login Check
    const user = localStorage.getItem('user');
    if (!user) {
      if (showToast) showToast("Login required to add to cart", "error");
      setIsOpen(false);
      navigate('/login');
      return;
    }

    if (!product) {
      if (showToast) showToast(`Product SKU: ${sku} is being fetched...`, "error");
      return;
    }

    dispatch(addItem({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      image: product.image,
      quantity: 1,
      replace: false
    }));

    if (showToast) {
      showToast(`${product.name} added to cart successfully!`, "success");
    }
  };

  const suggestions = [
    { label: "🔍 Search bearings by size", query: "Can you help me search for a bearing if I give you the dimensions?" },
    { label: "📦 Track my order", query: "How can I track my order status?" },
    { label: "🏢 Contact sales team", query: "What is your customer support phone number and email?" },
    { label: "⭐ Show top brands", query: "Which bearing brands do you supply?" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom on message list update or when opened
  useEffect(() => {
    if (isOpen) {
      // Delay slightly to allow rendering to complete
      setTimeout(scrollToBottom, 80);
    }
  }, [messages, isOpen]);

  // Handle auto-scroll on input focus for mobile keyboard shift
  const handleInputFocus = () => {
    setTimeout(scrollToBottom, 200);
  };

  const handleSend = async (e, customMsg = '') => {
    e?.preventDefault();
    const msgText = customMsg || input.trim();
    if (!msgText || isTyping) return;

    if (!customMsg) {
      setInput('');
    }

    setMessages(prev => [...prev, { role: 'user', text: msgText }]);
    setIsTyping(true);

    try {
      const response = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          history: messages.slice(1) // exclude initial greeting
        })
      });

      let rawText = '';
      try {
        rawText = await response.clone().text();
      } catch (err) {}

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${rawText.substring(0, 50)}...`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.reply, products: data.products || [] }]);
    } catch (error) {
      console.error("Frontend Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: `Sorry, I encountered a connection issue. Please try again. (Error: ${error.message})` }]);
    } finally {
      setIsTyping(false);
      // Re-focus the input field after sending
      if (window.innerWidth > 768) {
        inputRef.current?.focus();
      }
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        className={`chatbot-toggle-btn ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        title="Chat with our AI Assistant"
      >
        <img src={aiAssistantLogo} alt="AI Assistant" className="chatbot-toggle-img" />
      </button>

      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-header-avatar">
              <img src={aiAssistantLogo} alt="Fine AI Assistant" className="chatbot-avatar-img" />
              <span className="online-indicator"></span>
            </div>
            <div>
              <h3>Fine AI Assistant</h3>
              <p>Industrial Catalog Expert</p>
            </div>
          </div>
          <button className="chatbot-close-btn" onClick={() => setIsOpen(false)} title="Close Chat">
            <X size={20} />
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble-wrapper ${msg.role === 'user' ? 'user' : 'model'}`}>
              {msg.role === 'model' && (
                <div className="chat-avatar">
                  <img src={aiAssistantLogo} alt="AI" className="chat-avatar-img" />
                </div>
              )}
              <div className={`chat-bubble ${msg.role === 'user' ? 'user' : 'model'}`}>
                {msg.role === 'model' ? (
                  <ReactMarkdown
                    components={{
                      a: ({ href, children, ...props }) => {
                        if (href && href.startsWith('add-to-cart:')) {
                          const sku = href.replace('add-to-cart:', '');
                          const prod = msg.products?.find(p => String(p.sku).toLowerCase() === String(sku).toLowerCase());
                          return (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(prod, sku)}
                              className="chatbot-add-to-cart-btn"
                            >
                              <ShoppingCart size={14} />
                              <span>{children || 'Add to Cart'}</span>
                            </button>
                          );
                        }
                        return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                      }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="chat-bubble-wrapper model">
              <div className="chat-avatar">
                <img src={aiAssistantLogo} alt="AI" className="chat-avatar-img" />
              </div>
              <div className="chat-bubble model typing-indicator">
                <div className="typing-indicator-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips - Only show when no user queries have been made yet */}
        {messages.length === 1 && !isTyping && (
          <div className="chatbot-suggestions">
            <div className="chatbot-suggestions-header">
              <HelpCircle size={14} />
              <span>Common Questions:</span>
            </div>
            <div className="chatbot-suggestions-list">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chatbot-suggestion-chip"
                  onClick={() => handleSend(null, sug.query)}
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <form className="chatbot-input-area" onSubmit={(e) => handleSend(e)}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about bearings, sizes, brands..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleInputFocus}
            disabled={isTyping}
          />
          <button type="submit" disabled={!input.trim() || isTyping} title="Send Message">
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
};

export default Chatbot;

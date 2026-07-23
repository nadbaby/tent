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

const typingPhrases = [
  "Fine AI is thinking...",
  "Checking product details...",
  "Finding matching bearings...",
  "Checking stock availability..."
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello! I am the Fine Bearing AI Assistant. How can I help you find the right industrial products, bearings, or oil seals today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState('online'); // 'online', 'reading', 'searching', 'typing'
  const [isExiting, setIsExiting] = useState(false);
  const [typingText, setTypingText] = useState(typingPhrases[0]);
  const [fadeText, setFadeText] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const handleOpenChatbot = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handleOpenChatbot);
    return () => window.removeEventListener('open-chatbot', handleOpenChatbot);
  }, []);

  useEffect(() => {
    if (!isTyping) {
      setTypingText(typingPhrases[0]);
      setFadeText(true);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      setFadeText(false);
      setTimeout(() => {
        index = (index + 1) % typingPhrases.length;
        setTypingText(typingPhrases[index]);
        setFadeText(true);
      }, 250); // wait for fade out
    }, 2500);

    return () => clearInterval(interval);
  }, [isTyping]);

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
    { label: "🛠️ Show all available products", query: "Please show me a list of all the products that have been added to the catalog." },
    { label: "🔍 Search bearings by size", query: "Can you help me search for a bearing if I give you the dimensions?" },
    { label: "📦 Track my order", query: "How can I track my order status?" },
    { label: "🏢 Contact sales team", query: "What is your customer support phone number and email?" }
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

    // Append user message with 'sent' status
    const newMsgIndex = messages.length;
    setMessages(prev => [...prev, { role: 'user', text: msgText, status: 'sent' }]);

    // Set AI status to reading
    setAssistantStatus('reading');
    setIsTyping(true);

    // Wait 600ms to show the sent tick before AI reads it
    await new Promise(resolve => setTimeout(resolve, 600));
    setMessages(prev => prev.map((msg, idx) => idx === newMsgIndex ? { ...msg, status: 'read' } : msg));

    // Set AI status to searching
    setAssistantStatus('searching');

    // Wait another 800ms to simulate the database catalog lookup
    await new Promise(resolve => setTimeout(resolve, 800));
    setAssistantStatus('typing');

    let responseData = null;
    let fetchError = null;

    try {
      const response = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          history: messages.slice(1).map(m => ({ role: m.role, text: m.text }))
        })
      });

      let rawText = '';
      try {
        rawText = await response.clone().text();
      } catch (err) { }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${rawText.substring(0, 50)}...`);
      }

      responseData = await response.json();
    } catch (error) {
      console.error("Frontend Chat Error:", error);
      fetchError = error;
    }

    // Smooth exit transition for typing indicator
    setIsExiting(true);
    await new Promise(resolve => setTimeout(resolve, 250));
    setIsTyping(false);
    setIsExiting(false);
    setAssistantStatus('online');

    if (responseData) {
      setMessages(prev => [...prev, { role: 'model', text: responseData.reply, products: responseData.products || [] }]);
    } else {
      setMessages(prev => [...prev, { role: 'model', text: `Sorry, I encountered a connection issue. Please try again. (Error: ${fetchError?.message || 'Unknown error'})` }]);
    }

    // Re-focus the input field after sending
    if (window.innerWidth > 768) {
      inputRef.current?.focus();
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
            <div className={`chatbot-header-avatar ${assistantStatus !== 'online' ? 'active' : ''}`}>
              <img src={aiAssistantLogo} alt="Fine AI Assistant" className="chatbot-avatar-img" />
              <span className={`online-indicator ${assistantStatus !== 'online' ? 'active' : ''}`}></span>
            </div>
            <div>
              <h3>Fine AI Assistant</h3>
              <p className={`chatbot-status-text ${assistantStatus}`}>
                {assistantStatus === 'online' && "Industrial Catalog Expert"}
                {assistantStatus === 'reading' && "Reading your message..."}
                {assistantStatus === 'searching' && "Searching catalog..."}
                {assistantStatus === 'typing' && "Typing a response..."}
              </p>
            </div>
          </div>
          <button className="chatbot-close-btn" onClick={() => setIsOpen(false)} title="Close Chat">
            <X size={20} />
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble-wrapper ${msg.role === 'user' ? 'user' : 'model'} animate-in`}>
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
                        const isAddToCart = href && (href.startsWith('add-to-cart:') || href.startsWith('https://add-to-cart/') || href.startsWith('http://add-to-cart/'));
                        if (isAddToCart) {
                          const sku = href.replace('https://add-to-cart/', '').replace('http://add-to-cart/', '').replace('add-to-cart:', '');
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
                  <div className="user-message-content">
                    <span className="user-message-text">{msg.text}</span>
                    <span className="message-status-ticks">
                      {msg.status === 'read' ? (
                        <svg className="tick-icon read animate-pop" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M2 12l5.25 5 2.625-3" />
                          <path d="M8 12l5.25 5L22 7" />
                        </svg>
                      ) : (
                        <svg className="tick-icon sent" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Snapchat-style Premium Typing Indicator */}
          {isTyping && (
            <div className={`compact-typing-indicator-container ${isExiting ? 'exit' : 'animate-in'}`}>
              <div className="typing-logo-wrapper">
                {/* Ripple background circles */}
                <div className="ripple-circle ripple-1"></div>
                <div className="ripple-circle ripple-2"></div>

                {/* Rotating glowing bearing ring */}
                <div className="rotating-bearing-ring"></div>

                {/* Circular AI Logo */}
                <img src={aiAssistantLogo} alt="Fine AI" className="typing-ai-logo" />
              </div>

              <div className="typing-indicator-content">
                <span className={`typing-status-label ${fadeText ? 'fade-in' : ''}`}>
                  {typingText}
                </span>
                <div className="typing-indicator-dots-orange">
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

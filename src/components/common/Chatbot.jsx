import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot } from 'lucide-react';
import { apiUrl } from '../../utils/api';
import './Chatbot.css';
import ReactMarkdown from 'react-markdown';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello! I am the Fine Bearing AI Assistant. How can I help you find the right products today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(1) // exclude the initial greeting
        })
      });

      let rawText = '';
      try {
        rawText = await response.clone().text();
      } catch (e) { }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${rawText.substring(0, 50)}...`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (error) {
      console.error("Frontend Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: `Frontend Error: ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        className={`chatbot-toggle-btn ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        title="Chat with our AI Assistant"
      >
        <MessageSquare size={24} />
      </button>

      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <Bot size={24} color="white" />
            <div>
              <h3>Fine Assistant</h3>
              <p>Product Expert</p>
            </div>
          </div>
          <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble-wrapper ${msg.role === 'user' ? 'user' : 'model'}`}>
              {msg.role === 'model' && <div className="chat-avatar"><Bot size={16} /></div>}
              <div className={`chat-bubble ${msg.role === 'user' ? 'user' : 'model'}`}>
                {msg.role === 'model' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-bubble-wrapper model">
              <div className="chat-avatar"><Bot size={16} /></div>
              <div className="chat-bubble model typing-indicator">
                <Loader2 size={16} className="spinner" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input-area" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Ask about bearings, sizes, brands..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
          />
          <button type="submit" disabled={!input.trim() || isTyping}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
};

export default Chatbot;

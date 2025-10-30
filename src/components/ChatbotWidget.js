import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { sendMessage, getConversationHistory, clearConversation } from '../services/chatbotApi';
import ChatbotIcon from './ChatbotIcon';
import { FaPaperPlane, FaTimes, FaTrash, FaRobot } from 'react-icons/fa';

const ChatbotWidget = () => {
  const { user, token } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load conversation history when component mounts or user changes
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Clear messages first to avoid showing old conversation
        setMessages([]);
        
        const response = await getConversationHistory(token);
        if (response.success && response.messages && response.messages.length > 0) {
          setMessages(response.messages);
          console.log(`📚 Loaded ${response.messages.length} messages for user`);
        } else {
          // Start with welcome message if no history
          setMessages([{
            role: 'assistant',
            content: 'Hello! I\'m your Atlasia AI assistant. How can I help you today?',
            createdAt: new Date()
          }]);
        }
      } catch (error) {
        console.error('Failed to load conversation history:', error);
        // Start with welcome message if no history
        setMessages([{
          role: 'assistant',
          content: 'Hello! I\'m your Atlasia AI assistant. How can I help you today?',
          createdAt: new Date()
        }]);
      }
    };

    loadHistory();
  }, [token, user?._id]); // Re-load when user changes

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      createdAt: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await sendMessage(userMessage, token);
      
      if (response.success) {
        // Add assistant response to chat
        const assistantMessage = {
          role: 'assistant',
          content: response.message,
          createdAt: new Date(),
          data: response.data,
          richContent: response.richContent
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = async () => {
    try {
      await clearConversation(token);
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your Atlasia AI assistant. How can I help you today?',
        createdAt: new Date()
      }]);
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  };

  const formatMessage = (message) => {
    // Convert markdown-style formatting to HTML
    return message.content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  const renderRichContent = (richContent) => {
    if (!richContent) return null;

    if (richContent.type === 'property_list') {
      return (
        <div className="mt-3 space-y-3">
          {richContent.items.slice(0, 3).map((property, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-4 border border-secondary-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => {
                if (property.propertyLink) {
                  window.open(property.propertyLink, '_blank');
                }
              }}
            >
              <div className="flex items-start space-x-3">
                {property.image && (
                  <div className="relative">
                    <img 
                      src={property.image} 
                      alt={property.title}
                      className="w-20 h-20 rounded-lg object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {/* Availability badge removed as requested */}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors duration-200 truncate">
                    {property.title}
                  </h4>
                  <p className="text-sm text-secondary-600 truncate">{property.location}</p>
                  <p className="text-sm text-secondary-500 mt-1">
                    {property.guests} guests • {property.bedrooms} bedrooms • {property.bathrooms} bathrooms
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-primary-600">
                        {property.priceWeekdays} MAD/night
                      </span>
                      {property.priceWeekend && property.priceWeekend !== property.priceWeekdays && (
                        <span className="text-xs text-secondary-500">
                          (Weekend: {property.priceWeekend} MAD)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-secondary-500">
                      <span>Click to view →</span>
                    </div>
                  </div>
                  {property.amenities && property.amenities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {property.amenities.slice(0, 3).map((amenity, amenityIndex) => (
                        <span 
                          key={amenityIndex}
                          className="inline-block px-2 py-1 bg-secondary-100 text-secondary-700 rounded-md text-xs"
                        >
                          {amenity}
                        </span>
                      ))}
                      {property.amenities.length > 3 && (
                        <span className="inline-block px-2 py-1 bg-secondary-100 text-secondary-700 rounded-md text-xs">
                          +{property.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {richContent.items.length > 3 && (
            <div className="text-center">
              <span className="text-sm text-secondary-500">
                Showing 3 of {richContent.items.length} properties
              </span>
            </div>
          )}
        </div>
      );
    }

    if (richContent.type === 'booking_list') {
      return (
        <div className="mt-3 space-y-3">
          {richContent.items.map((booking, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-4 border border-secondary-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => {
                if (booking.propertyLink) {
                  window.open(booking.propertyLink, '_blank');
                }
              }}
            >
              <div className="flex items-start space-x-3">
                {booking.propertyImage && (
                  <img 
                    src={booking.propertyImage} 
                    alt={booking.propertyTitle}
                    className="w-16 h-16 rounded-lg object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors duration-200">
                    {booking.propertyTitle}
                  </h4>
                  <p className="text-sm text-secondary-600">
                    {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-secondary-500">
                    {booking.guests} guests • {booking.totalAmount} MAD total
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' 
                        ? 'bg-success-100 text-success-800'
                        : booking.status === 'pending'
                        ? 'bg-warning-100 text-warning-800'
                        : 'bg-error-100 text-error-800'
                    }`}>
                      {booking.status}
                    </span>
                    <div className="flex items-center text-xs text-secondary-500">
                      <span>Click to view →</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <ChatbotIcon 
        onClick={() => setIsOpen(!isOpen)} 
        isOpen={isOpen}
        hasUnreadMessages={false} // You can implement unread message logic
      />
      
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-xl shadow-atlasia-lg border border-secondary-200 z-40 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-secondary-200 bg-secondary-50 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <FaRobot className="text-primary-600" />
              <h3 className="font-semibold text-secondary-900">AI Assistant</h3>
              {user && (
                <span className="text-xs text-secondary-500">({user.role})</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearConversation}
                className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
                title="Clear conversation"
              >
                <FaTrash size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
                title="Close chat"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : message.isError
                      ? 'bg-error-100 text-error-800'
                      : 'bg-white text-secondary-900 border border-secondary-200'
                  }`}
                >
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: formatMessage(message) 
                    }}
                  />
                  {renderRichContent(message.richContent)}
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-secondary-900 px-3 py-2 rounded-lg border border-secondary-200">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-secondary-200 bg-secondary-50 rounded-b-xl">
            {error && (
              <div className="text-error-600 text-sm mb-2">{error}</div>
            )}
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-secondary-900 placeholder-secondary-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;

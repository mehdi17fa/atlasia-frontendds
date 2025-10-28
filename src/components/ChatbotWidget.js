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

  // Load conversation history when component mounts
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await getConversationHistory(token);
        if (response.success && response.messages) {
          setMessages(response.messages);
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
  }, [token]);

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
            <div key={index} className="bg-gray-50 rounded-lg p-3 border">
              <div className="flex items-start space-x-3">
                {property.image && (
                  <img 
                    src={property.image} 
                    alt={property.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{property.title}</h4>
                  <p className="text-sm text-gray-600">{property.location}</p>
                  <p className="text-sm text-gray-500">
                    {property.guests} guests • {property.bedrooms} bedrooms • {property.bathrooms} bathrooms
                  </p>
                  <p className="text-sm font-medium text-green-600">
                    {property.priceWeekdays} MAD/night
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                    property.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {property.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (richContent.type === 'booking_list') {
      return (
        <div className="mt-3 space-y-3">
          {richContent.items.map((booking, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 border">
              <h4 className="font-semibold text-gray-900">{booking.propertyTitle}</h4>
              <p className="text-sm text-gray-600">
                {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">{booking.guests} guests</p>
              <p className="text-sm font-medium text-blue-600">{booking.totalAmount} MAD</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                booking.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800'
                  : booking.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {booking.status}
              </span>
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
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border z-40 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <FaRobot className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
              {user && (
                <span className="text-xs text-gray-500">({user.role})</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearConversation}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear conversation"
              >
                <FaTrash size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close chat"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.isError
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-900'
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
                <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-gray-50 rounded-b-lg">
            {error && (
              <div className="text-red-600 text-sm mb-2">{error}</div>
            )}
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

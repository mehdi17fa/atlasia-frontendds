import React from 'react';
import { FaComments } from 'react-icons/fa';

const ChatbotIcon = ({ onClick, isOpen, hasUnreadMessages = false }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onClick}
        className={`
          relative w-14 h-14 rounded-full shadow-atlasia transition-all duration-300 ease-in-out
          ${isOpen 
            ? 'bg-secondary-600 hover:bg-secondary-700 transform scale-95' 
            : 'bg-primary-500 hover:bg-primary-600 hover:scale-110'
          }
          flex items-center justify-center text-white
          hover:shadow-atlasia-lg
        `}
        aria-label="Open AI Assistant"
      >
        <FaComments 
          className={`transition-transform duration-300 ${
            isOpen ? 'rotate-12' : 'rotate-0'
          }`} 
          size={24} 
        />
        
        {/* Notification badge */}
        {hasUnreadMessages && !isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-error-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        )}
        
        {/* Pulse animation when closed */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-primary-300 animate-ping opacity-20"></div>
        )}
      </button>
    </div>
  );
};

export default ChatbotIcon;

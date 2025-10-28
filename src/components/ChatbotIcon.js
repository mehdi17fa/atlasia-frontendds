import React from 'react';
import { FaComments } from 'react-icons/fa';

const ChatbotIcon = ({ onClick, isOpen, hasUnreadMessages = false }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onClick}
        className={`
          relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-in-out
          ${isOpen 
            ? 'bg-gray-600 hover:bg-gray-700 transform scale-95' 
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'
          }
          flex items-center justify-center text-white
          hover:shadow-xl
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
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        )}
        
        {/* Pulse animation when closed */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
        )}
      </button>
    </div>
  );
};

export default ChatbotIcon;

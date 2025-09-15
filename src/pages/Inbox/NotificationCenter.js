import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const notifications = [
  {
    id: 1,
    sender: 'Atlasia',
    text: 'Well received.',
    timestamp: 'Feb 15, 2023',
    avatar: 'A',
    bgColor: 'bg-black',
    textColor: 'text-white',
  },
  {
    id: 2,
    sender: 'Craig',
    text: 'Update: Reservation canceled',
    timestamp: 'Feb 13 - 14, 2023',
    avatar: 'C',
    bgColor: 'bg-gray-600',
    textColor: 'text-white',
  },
  {
    id: 3,
    sender: 'Erin',
    text: 'New date and time request',
    status: 'Request pending',
    timestamp: 'Feb 16, 2023',
    avatar: 'E',
    bgColor: 'bg-gray-500',
    textColor: 'text-white',
  },
];

export default function NotificationCenter() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedNotificationId = location.state?.selectedNotification;

  const handleBackToInbox = () => {
    navigate('/inbox');
  };

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div className="px-6 py-4">
        <h1 className="text-2xl font-semibold text-black">Inbox</h1>
        
        {/* Tab Navigation */}
        <div className="flex mt-4 border-b border-gray-200">
          <button 
            onClick={handleBackToInbox}
            className="flex items-center space-x-2 pb-2 text-gray-500 hover:text-black transition-colors"
          >
            <span className="font-medium">Messages</span>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gray-400">
              3
            </div>
          </button>
          <button className="ml-8 pb-2 border-b-2" style={{ borderColor: '#005D20' }}>
            <span className="text-black font-medium">Notifications</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-6 space-y-4">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={`flex items-start space-x-3 py-2 transition-all duration-200 ${
              selectedNotificationId === notification.id 
                ? 'bg-green-50 border-l-4 border-green-500 pl-2' 
                : 'hover:bg-gray-50'
            }`}
          >
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full ${notification.bgColor} ${notification.textColor} flex items-center justify-center font-semibold text-lg flex-shrink-0`}>
              {notification.avatar}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-black text-base">{notification.sender}</h3>
                <span className="text-gray-400 text-sm whitespace-nowrap ml-2">{notification.timestamp}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{notification.text}</p>
              {notification.status && (
                <p className="text-gray-500 text-xs mt-1">{notification.status}</p>
              )}
              
              {/* Action buttons for notifications */}
              <div className="flex space-x-2 mt-3">
                <button className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors">
                  Mark as Read
                </button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300 transition-colors">
                  Archive
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
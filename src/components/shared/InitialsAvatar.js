import React from 'react';

const InitialsAvatar = ({ 
  name, 
  size = 'w-12 h-12', 
  className = '',
  textSize = 'text-lg',
  backgroundColor = 'bg-blue-500',
  textColor = 'text-white'
}) => {
  // Extract initials from name
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    
    const words = fullName.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div 
      className={`${size} ${backgroundColor} ${textColor} ${className} rounded-full flex items-center justify-center font-semibold ${textSize} shadow-md`}
      title={name || 'User'}
    >
      {initials}
    </div>
  );
};

export default InitialsAvatar;


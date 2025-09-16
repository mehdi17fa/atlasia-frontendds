import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

const RatingDisplay = ({ 
  rating = 0, 
  reviewCount = 0, 
  size = 'sm',
  showCount = true,
  interactive = false,
  onRate = null 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const handleStarClick = (starRating) => {
    if (interactive && onRate) {
      onRate(starRating);
    }
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      let starColor = 'text-gray-300';
      
      if (i <= fullStars) {
        starColor = 'text-yellow-400';
      } else if (i === fullStars + 1 && hasHalfStar) {
        starColor = 'text-yellow-400';
      }

      stars.push(
        <StarIcon
          key={i}
          className={`${sizeClasses[size]} ${starColor} ${
            interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''
          }`}
          onClick={() => handleStarClick(i)}
        />
      );
    }

    return stars;
  };

  const getRatingText = () => {
    if (rating === 0) return 'Nouveau';
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Très bon';
    if (rating >= 3.0) return 'Bon';
    if (rating >= 2.0) return 'Moyen';
    return 'À améliorer';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        {renderStars()}
      </div>
      <div className="flex items-center space-x-1">
        <span className={`${textSizeClasses[size]} font-medium text-gray-900`}>
          {rating > 0 ? rating.toFixed(1) : 'Nouveau'}
        </span>
        {showCount && reviewCount > 0 && (
          <>
            <span className={`${textSizeClasses[size]} text-gray-500`}>
              ({reviewCount})
            </span>
            <span className={`${textSizeClasses[size]} text-gray-500`}>
              {getRatingText()}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default RatingDisplay;

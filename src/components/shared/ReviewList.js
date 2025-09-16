import React from 'react';
import RatingDisplay from './RatingDisplay';
import InitialsAvatar from './InitialsAvatar';

const ReviewList = ({ 
  reviews = [], 
  propertyRating = 0, 
  reviewCount = 0,
  onLoadMore = null,
  hasMore = false,
  isLoading = false 
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  if (reviews.length === 0 && reviewCount === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun avis pour le moment
        </h3>
        <p className="text-gray-600">
          Soyez le premier à laisser un avis sur cette propriété !
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Rating Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Avis des clients</h2>
        <div className="flex items-center space-x-4 mb-4">
          <RatingDisplay 
            rating={propertyRating} 
            reviewCount={reviewCount} 
            size="lg" 
            showCount={true}
          />
        </div>
        <p className="text-gray-600">
          Basé sur {reviewCount} avis de clients
        </p>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-start space-x-4">
              {/* User Avatar */}
              <InitialsAvatar
                name={review.user?.fullName || review.user?.displayName || 'Client'}
                size="w-12 h-12"
                textSize="text-sm"
                backgroundColor="bg-gradient-to-br from-blue-500 to-green-500"
              />
              
              <div className="flex-1">
                {/* User Info and Rating */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {review.user?.fullName || review.user?.displayName || 'Client anonyme'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <RatingDisplay 
                    rating={review.rating} 
                    reviewCount={0} 
                    size="sm" 
                    showCount={false}
                  />
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <p className="text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>
                )}

                {/* Review Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {review.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Owner Response */}
                {review.response && review.response.comment && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">Réponse du propriétaire</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(review.response.respondedAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      {review.response.comment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Chargement...' : 'Charger plus d\'avis'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;

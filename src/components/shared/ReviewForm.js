import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ReviewForm = ({ 
  propertyId, 
  bookingId, 
  propertyTitle,
  onSubmit, 
  onCancel,
  initialRating = 0,
  initialComment = '',
  isLoading = false 
}) => {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Veuillez sélectionner une note');
      return;
    }
    onSubmit({ rating, comment, propertyId, bookingId });
  };

  const handleStarClick = (starRating) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating) => {
    setHoverRating(starRating);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const getRatingText = (currentRating) => {
    if (currentRating === 0) return 'Sélectionnez une note';
    if (currentRating >= 4.5) return 'Excellent';
    if (currentRating >= 4.0) return 'Très bon';
    if (currentRating >= 3.0) return 'Bon';
    if (currentRating >= 2.0) return 'Moyen';
    return 'À améliorer';
  };

  const renderStars = () => {
    const stars = [];
    const displayRating = hoverRating || rating;

    for (let i = 1; i <= 5; i++) {
      let starColor = 'text-gray-300';
      
      if (i <= displayRating) {
        starColor = 'text-yellow-400';
      }

      stars.push(
        <StarIcon
          key={i}
          className={`w-8 h-8 cursor-pointer transition-colors ${starColor} hover:scale-110 transition-transform`}
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarHover(i)}
          onMouseLeave={handleStarLeave}
        />
      );
    }

    return stars;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Évaluer votre séjour
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Property Info */}
        {propertyTitle && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Propriété:</p>
            <p className="font-medium text-gray-900">{propertyTitle}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Rating Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Note globale
            </label>
            <div className="flex items-center space-x-2 mb-2">
              {renderStars()}
            </div>
            <p className="text-sm text-gray-600">
              {getRatingText(hoverRating || rating)}
            </p>
          </div>

          {/* Comment Section */}
          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec d'autres voyageurs..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 caractères
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || rating === 0}
            >
              {isLoading ? 'Envoi...' : 'Publier l\'avis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;

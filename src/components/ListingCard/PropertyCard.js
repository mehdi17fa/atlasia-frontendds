import React from "react";
import { FaHeart } from "react-icons/fa";
import { useFavorites } from "../../hooks/useFavorites";

export default function PropertyCard({ name, description, location, image, onClick, propertyId }) {
  const { isFavorited, toggleFavorite, isAuthenticated } = useFavorites();

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please log in to save favorites');
      return;
    }
    if (propertyId) {
      await toggleFavorite(propertyId, 'property');
    }
  };

  return (
    <div
      className="flex items-center bg-white rounded-xl shadow border border-gray-200 p-4 mb-2 cursor-pointer hover:shadow-md transition relative"
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') onClick && onClick(); }}
    >
      {/* Heart button */}
      {propertyId && (
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:scale-110 transition-transform"
          title={isFavorited(propertyId) ? "Remove from favorites" : "Add to favorites"}
        >
          <FaHeart
            className={`w-4 h-4 transition-colors duration-300 ${
              isFavorited(propertyId) ? "text-red-500" : "text-gray-400 hover:text-red-400"
            }`}
          />
        </button>
      )}
      
      <img
        src={image}
        alt={name}
        className="w-16 h-16 rounded-lg object-cover mr-4 flex-shrink-0"
      />
      <div className="flex flex-col">
        <span className="font-semibold text-base text-gray-900 mb-1">{name}</span>
        {description && (
          <span className="text-sm text-gray-600 mb-1 line-clamp-2">{description}</span>
        )}
        <span className="text-xs text-gray-500">{location}</span>
      </div>
    </div>
  );
} 
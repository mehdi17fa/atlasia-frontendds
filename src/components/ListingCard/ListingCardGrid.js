import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa";
import S3Image from "../S3Image";
import ImageCarousel from "../ImageCarousel";
import { useFavorites } from "../../hooks/useFavorites";

export default function ListingCardGrid({ listings, onCardClick }) {
  const { favorites, isFavorited, toggleFavorite, isAuthenticated } = useFavorites();
  const [visibleCards, setVisibleCards] = useState([]);

  const handleToggleFavorite = async (e, id) => {
    e.stopPropagation();
    console.log('🔄 ListingCardGrid: handleToggleFavorite called for:', id);
    console.log('🔄 isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      alert('Please log in to save favorites');
      return;
    }
    
    console.log('🔄 Calling toggleFavorite...');
    const result = await toggleFavorite(id, 'property');
    console.log('🔄 toggleFavorite result:', result);
  };

  // Animate cards one by one on mount
  useEffect(() => {
    let timeout;
    listings.forEach((listing, index) => {
      timeout = setTimeout(() => {
        setVisibleCards((prev) => [...prev, listing._id]);
      }, index * 150); // stagger effect
    });
    return () => clearTimeout(timeout);
  }, [listings]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
      {listings.map((listing) => {
        const isFavorite = isFavorited(listing._id);
        const isVisible = visibleCards.includes(listing._id);
        
        // Debug logging for first few items
        if (listings.indexOf(listing) < 3) {
          console.log(`🔄 Listing ${listing._id}: isFavorite = ${isFavorite}, favorites array:`, favorites);
        }

        return (
          <div
            key={listing._id}
            className={`cursor-pointer transform transition 
              duration-300 ease-out
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
              hover:-translate-y-2`}
          >
            {/* Image box with rounded corners and border */}
            <div className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              {/* Heart button (top right) */}
              <button
                onClick={(e) => handleToggleFavorite(e, listing._id)}
                className="absolute top-2 right-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-full p-1.5 shadow-md transform transition hover:scale-110 active:scale-95 z-10"
              >
                <FaHeart
                  className={`w-4 h-4 transition-colors duration-300 ${
                    isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-400"
                  }`}
                />
              </button>

              {/* Image content */}
              <div onClick={() => onCardClick && onCardClick(listing._id)}>
                {listing.photos && listing.photos.length > 0 ? (
                  <ImageCarousel
                    images={listing.photos}
                    className="h-40"
                    showDots={listing.photos.length > 1}
                    showArrows={listing.photos.length > 1}
                  />
                ) : (
                  <S3Image
                    src={listing.image || "/placeholder.jpg"}
                    alt={listing.title}
                    className="w-full h-40 object-cover"
                    fallbackSrc="/placeholder.jpg"
                  />
                )}
              </div>
            </div>
            
            {/* Text content below the image box */}
            <div className="mt-2 leading-tight">
              {/* Location */}
              <p className="text-sm text-gray-600 mb-0.5 leading-tight">
                {listing.localisation?.city || listing.location || "Location"}
              </p>
              
              {/* Title */}
              <h2 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1 leading-tight">
                {listing.title}
              </h2>
              
                {/* Price */}
                <div className="flex items-center space-x-1 leading-tight">
                  <span className="text-sm font-bold text-green-600 leading-tight">
                    {listing.price ? `${listing.price} MAD` : "Prix sur demande"}
                  </span>
                  <span className="text-sm text-gray-500 leading-tight">pour 2 nuits</span>
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

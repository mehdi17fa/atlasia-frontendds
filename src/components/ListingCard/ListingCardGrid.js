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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            className={`relative border rounded-lg overflow-hidden shadow cursor-pointer transform transition 
              duration-500 ease-out
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
              hover:shadow-lg hover:-translate-y-1`}
          >
            {/* Heart button (top right) */}
            <button
              onClick={(e) => handleToggleFavorite(e, listing._id)}
              className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md transform transition hover:scale-110 active:scale-95"
            >
              <FaHeart
                className={`w-6 h-6 transition-colors duration-300 ${
                  isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-400"
                }`}
              />
            </button>

            {/* Card content */}
            <div onClick={() => onCardClick && onCardClick(listing._id)}>
              {listing.photos && listing.photos.length > 0 ? (
                <ImageCarousel
                  images={listing.photos}
                  className="h-48"
                  showDots={listing.photos.length > 1}
                  showArrows={listing.photos.length > 1}
                />
              ) : (
                <S3Image
                  src={listing.image || "/placeholder.jpg"}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                  fallbackSrc="/placeholder.jpg"
                />
              )}
              <div className="p-4">
                <h2 className="font-semibold text-lg">{listing.title}</h2>
                <p className="text-gray-500">{listing.location}</p>
                <p className="mt-2 font-bold">
                  {listing.price ? `${listing.price} MAD / nuit` : ""}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

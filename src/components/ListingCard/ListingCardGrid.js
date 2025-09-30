import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import S3Image from "../S3Image";
import ImageCarousel from "../ImageCarousel";
import { useFavorites } from "../../hooks/useFavorites";
import PropertyOptionsMenu from "../shared/PropertyOptionsMenu";

export default function ListingCardGrid({ 
  listings, 
  onCardClick, 
  showOptionsMenu = false,
  onPropertyEdit,
  onPropertyDelete,
  onPropertyInfo
}) {
  const { favorites, isFavorited, toggleFavorite, isAuthenticated } = useFavorites();
  const [visibleCards, setVisibleCards] = useState([]);
  const navigate = useNavigate();


  const handleToggleFavorite = async (e, id) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Please log in to save favorites');
      return;
    }
    
    await toggleFavorite(id, 'property');
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {listings.map((listing) => {
        const isFavorite = isFavorited(listing._id);
        const isVisible = visibleCards.includes(listing._id);
        

        return (
          <div
            key={listing._id}
            className={`cursor-pointer transform transition 
              duration-300 ease-out
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
              hover:-translate-y-2`}
          >
            {/* Options menu - positioned outside the image container */}
            {showOptionsMenu && (
              <div className="absolute top-2 right-2 z-20">
                <PropertyOptionsMenu
                  property={listing}
                  onEdit={onPropertyEdit}
                  onDelete={onPropertyDelete}
                  onInfo={onPropertyInfo}
                />
              </div>
            )}

            {/* Image box with rounded corners and border */}
            <div className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              {/* Heart button - only show if options menu is not shown */}
              {!showOptionsMenu && (
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={(e) => handleToggleFavorite(e, listing._id)}
                    className="bg-white bg-opacity-90 backdrop-blur-sm rounded-full p-1.5 shadow-md transform transition hover:scale-110 active:scale-95"
                  >
                    <FaHeart
                      className={`w-4 h-4 transition-colors duration-300 ${
                        isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-400"
                      }`}
                    />
                  </button>
                </div>
              )}

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
                    src={listing.image || listing.photos?.[0] || null}
                    alt={listing.title || "Propriété"}
                    className="w-full h-40 object-cover"
                    fallbackSrc={null}
                  />
                )}
              </div>
            </div>
            
            {/* Text content below the image box */}
            <div className="mt-3 px-1 leading-tight">
              {/* Location */}
              <p className="text-sm text-gray-600 mb-1 leading-tight">
                {listing.localisation?.city || 
                 listing.localisation?.address ||
                 listing.location || 
                 listing.city ||
                 listing.adresse?.ville ||
                 "Location non spécifiée"}
              </p>
              
              {/* Title */}
              <h2 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 leading-tight">
                {listing.title || 
                 listing.nom || 
                 listing.propertyName ||
                 "Propriété sans titre"}
              </h2>
              
              {/* Property details */}
              <div className="flex items-center text-xs text-gray-500 mb-2 space-x-3">
                {listing.superficie && (
                  <span>{listing.superficie} m²</span>
                )}
                {listing.nombreChambres && (
                  <span>{listing.nombreChambres} chambres</span>
                )}
                {listing.capaciteAccueil && (
                  <span>{listing.capaciteAccueil} personnes</span>
                )}
              </div>
              
              {/* Price */}
              <div className="flex items-center space-x-1 leading-tight">
                <span className="text-base font-bold text-green-600 leading-tight">
                  {(() => {
                    if (!listing.price) return "Prix sur demande";
                    
                    // Handle different price formats
                    if (typeof listing.price === 'number') {
                      return `${listing.price} MAD`;
                    } else if (typeof listing.price === 'object') {
                      // If price is an object, try to get a reasonable value
                      const priceValue = listing.price.weekdays || 
                                       listing.price.weekend || 
                                       listing.price.price || 
                                       listing.price.pricePerNight ||
                                       listing.price.prixParNuit;
                      return priceValue ? `${priceValue} MAD` : "Prix sur demande";
                    } else {
                      return `${listing.price} MAD`;
                    }
                  })()}
                </span>
                <span className="text-sm text-gray-500 leading-tight">/ nuit</span>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}

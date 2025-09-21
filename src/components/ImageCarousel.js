import React, { useState } from 'react';
import S3Image from './S3Image';

const ImageCarousel = ({ 
  images = [], 
  className = '',
  showDots = true,
  showArrows = true,
  autoHeight = false,
  onImageClick = null
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const nextImage = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index, e) => {
    e?.stopPropagation();
    setCurrentIndex(index);
  };

  const handleImageClick = (e) => {
    if (onImageClick) {
      onImageClick(currentIndex, images[currentIndex], e);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Main Image */}
      <div 
        className={`relative overflow-hidden ${autoHeight ? '' : 'h-full'}`}
        onClick={handleImageClick}
      >
        <S3Image
          src={typeof images[currentIndex] === 'string' ? images[currentIndex] : images[currentIndex]?.url || images[currentIndex]?.src}
          alt={typeof images[currentIndex] === 'object' ? images[currentIndex]?.alt || `Image ${currentIndex + 1}` : `Image ${currentIndex + 1}`}
          className={`w-full object-cover transition-all duration-300 ${autoHeight ? 'h-auto' : 'h-full'}`}
          fallbackSrc="/placeholder.jpg"
        />
        
        {/* Image overlay for better button visibility */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
      </div>

      {/* Navigation Arrows */}
      {showArrows && images.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={prevImage}
            className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 rounded-full p-1.5 shadow-lg transition-all duration-200 z-10 opacity-80 hover:opacity-100"
            aria-label="Previous image"
          >
            <svg className="h-4 w-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={nextImage}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 rounded-full p-1.5 shadow-lg transition-all duration-200 z-10 opacity-80 hover:opacity-100"
            aria-label="Next image"
          >
            <svg className="h-4 w-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToImage(index, e)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white shadow-md' 
                  : 'bg-white bg-opacity-60 hover:bg-opacity-80'
              }`}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default ImageCarousel;

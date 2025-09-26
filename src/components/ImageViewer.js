import React, { useState, useEffect, useRef } from 'react';
import S3Image from './S3Image';

const ImageViewer = ({ 
  images = [], 
  initialIndex = 0, 
  isOpen = false, 
  onClose = () => {} 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const imageRef = useRef(null);

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextImage();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when viewer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false); // Reset zoom when changing images
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false); // Reset zoom when changing images
  };

  const goToImage = (index) => {
    setCurrentIndex(index);
    setIsZoomed(false); // Reset zoom when changing images
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    // Handle swipe navigation
    if (touchStart && touchEnd) {
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe && images.length > 1) {
        nextImage();
      }
      if (isRightSwipe && images.length > 1) {
        prevImage();
      }
    }

    // Handle double-tap zoom
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
      // Double tap detected
      setIsZoomed(!isZoomed);
    }
    setLastTap(currentTime);
  };

  const handleImageClick = (e) => {
    // Handle double-tap on desktop
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
      // Double click detected
      setIsZoomed(!isZoomed);
    }
    setLastTap(currentTime);
  };

  if (!isOpen || !images || images.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-60 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200"
        aria-label="Close image viewer"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main Image Container */}
      <div className="relative max-w-7xl max-h-[90vh] w-full mx-4 flex flex-col items-center justify-center">
        {/* Main Image */}
        <div 
          className="flex items-center justify-center flex-1 relative mb-4 touch-pan-y overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleImageClick}
          ref={imageRef}
        >
          <div className={`relative max-w-full max-h-full transform transition-all duration-300 ease-in-out ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}>
            <S3Image
              key={`image-${currentIndex}`}
              src={typeof images[currentIndex] === 'string' ? images[currentIndex] : images[currentIndex]?.url || images[currentIndex]?.src}
              alt={typeof images[currentIndex] === 'object' ? images[currentIndex]?.alt || `Image ${currentIndex + 1}` : `Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
              fallbackSrc="/placeholder.jpg"
            />
          </div>
        </div>

        {/* Thumbnail Navigation - Below main image */}
        {images.length > 1 && (
          <div className="flex space-x-3 max-w-full overflow-x-auto px-4 pb-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-3 transition-all duration-200 shadow-lg ${
                  index === currentIndex 
                    ? 'border-white shadow-xl scale-105' 
                    : 'border-gray-400 hover:border-white hover:border-opacity-70 hover:scale-105'
                }`}
              >
                <S3Image
                  src={typeof image === 'string' ? image : image?.url || image?.src}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  fallbackSrc="/placeholder.jpg"
                />
              </button>
            ))}
          </div>
        )}
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-60 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all duration-200"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-60 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all duration-200"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

      </div>

      {/* Navigation Hint */}
      <div className="absolute bottom-4 right-4 text-white text-sm opacity-70 hidden md:block">
        Use ← → arrow keys, swipe to navigate, double-tap to zoom
      </div>
    </div>
  );
};

export default ImageViewer;

import React, { useState, useCallback } from 'react';
import S3Image from './S3Image';

const S3ImageGallery = ({ 
  images = [], 
  className = '',
  columns = 'auto',
  gap = 4,
  aspectRatio = 'aspect-square',
  showLightbox = true,
  maxPreviewImages = null,
  onImageClick = null,
  emptyMessage = 'No images available',
  showImageCount = true
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImageClick = useCallback((index, image) => {
    if (onImageClick) {
      onImageClick(index, image);
    } else if (showLightbox) {
      setCurrentImageIndex(index);
      setLightboxOpen(true);
    }
  }, [onImageClick, showLightbox]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleKeyDown = useCallback((event) => {
    if (!lightboxOpen) return;
    
    switch (event.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        prevImage();
        break;
      case 'ArrowRight':
        nextImage();
        break;
      default:
        break;
    }
  }, [lightboxOpen, closeLightbox, prevImage, nextImage]);

  // Add keyboard event listeners
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when lightbox is open
  React.useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [lightboxOpen]);

  if (!images || images.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const displayImages = maxPreviewImages ? images.slice(0, maxPreviewImages) : images;
  const remainingCount = maxPreviewImages && images.length > maxPreviewImages ? images.length - maxPreviewImages : 0;

  // Determine grid columns class
  const getColumnsClass = () => {
    if (columns === 'auto') {
      if (displayImages.length === 1) return 'grid-cols-1';
      if (displayImages.length === 2) return 'grid-cols-2';
      if (displayImages.length === 3) return 'grid-cols-3';
      return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
    return `grid-cols-${columns}`;
  };

  return (
    <div className={`s3-image-gallery ${className}`}>
      {/* Image count */}
      {showImageCount && (
        <div className="mb-4 text-sm text-gray-600">
          {images.length} {images.length === 1 ? 'image' : 'images'}
        </div>
      )}

      {/* Image grid */}
      <div className={`grid ${getColumnsClass()} gap-${gap}`}>
        {displayImages.map((image, index) => (
          <div
            key={index}
            className={`relative ${aspectRatio} overflow-hidden rounded-lg bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity`}
            onClick={() => handleImageClick(index, image)}
          >
            <S3Image
              src={typeof image === 'string' ? image : image.url || image.src}
              alt={typeof image === 'object' ? image.alt || `Image ${index + 1}` : `Image ${index + 1}`}
              className="w-full h-full object-cover"
              showLoader={true}
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <svg className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        ))}

        {/* Show more indicator */}
        {remainingCount > 0 && (
          <div
            className={`relative ${aspectRatio} overflow-hidden rounded-lg bg-gray-800 cursor-pointer hover:bg-gray-700 transition-colors flex items-center justify-center`}
            onClick={() => handleImageClick(maxPreviewImages, images[maxPreviewImages])}
          >
            <div className="text-center text-white">
              <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-lg font-semibold">+{remainingCount}</p>
              <p className="text-sm opacity-80">more</p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && showLightbox && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}

          {/* Main image */}
          <div className="max-w-screen-lg max-h-screen-lg p-4 w-full h-full flex items-center justify-center">
            <S3Image
              src={typeof images[currentImageIndex] === 'string' ? images[currentImageIndex] : images[currentImageIndex].url || images[currentImageIndex].src}
              alt={typeof images[currentImageIndex] === 'object' ? images[currentImageIndex].alt || `Image ${currentImageIndex + 1}` : `Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              showLoader={true}
            />
          </div>

          {/* Click overlay to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeLightbox}
          />
        </div>
      )}
    </div>
  );
};

export default S3ImageGallery; 
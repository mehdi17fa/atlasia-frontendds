import React, { useState, useCallback } from 'react';
import { getS3Url, cleanS3Url } from '../utilities/s3Service';

const S3Image = ({ 
  src, 
  alt = '', 
  className = '',
  fallbackSrc = null,
  showLoader = true,
  loaderClassName = '',
  errorClassName = '',
  onLoad = null,
  onError = null,
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);

  // Initialize the source URL
  React.useEffect(() => {
    if (src) {
      let finalUrl;
      
      // First, try to clean any malformed S3 URLs
      const cleanedUrl = cleanS3Url(src);
      
      // Check if it's a local path
      if (cleanedUrl.startsWith('/') && !cleanedUrl.startsWith('http')) {
        finalUrl = cleanedUrl;
      } else if (cleanedUrl.startsWith('http') && cleanedUrl.includes('amazonaws.com')) {
        // If it's a direct S3 URL, convert to backend proxy URL
        finalUrl = getS3Url(cleanedUrl);
      } else if (cleanedUrl.startsWith('http')) {
        // If it's any other HTTP URL, use as-is
        finalUrl = cleanedUrl;
      } else {
        // If it's an S3 key, convert to full URL
        finalUrl = getS3Url(cleanedUrl);
      }
      
      // Debug logging
      console.log('S3Image Debug:', {
        originalSrc: src,
        cleanedUrl: cleanedUrl,
        finalUrl: finalUrl,
        isFullUrl: src.startsWith('http'),
        isLocalPath: src.startsWith('/'),
        containsS3Bucket: src.includes('atlasia-bucket-1.s3.us-east-2.amazonaws.com')
      });
      
      setCurrentSrc(finalUrl);
    } else {
      setCurrentSrc(null);
    }
    setLoading(true);
    setError(false);
  }, [src]);

  const handleLoad = useCallback((event) => {
    setLoading(false);
    setError(false);
    if (onLoad) {
      onLoad(event);
    }
  }, [onLoad]);

  const handleError = useCallback((event) => {
    console.log('S3Image Error:', {
      currentSrc,
      fallbackSrc,
      error: event,
      errorType: event.target?.status || 'unknown'
    });
    
    setLoading(false);
    setError(true);
    
    // If it's a 403 error and we have a fallback, try it
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      console.log('S3Image: Trying fallback due to access error:', fallbackSrc);
      setCurrentSrc(fallbackSrc);
      setLoading(true);
      setError(false);
      return;
    }
    
    if (onError) {
      onError(event);
    }
  }, [onError, fallbackSrc, currentSrc]);

  // Don't render anything if no source is provided
  if (!currentSrc && !fallbackSrc) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className} ${errorClassName}`}>
        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading spinner */}
      {loading && showLoader && (
        <div className={`absolute inset-0 bg-gray-100 flex items-center justify-center ${className} ${loaderClassName}`}>
          <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className={`bg-gray-100 flex items-center justify-center ${className} ${errorClassName}`}>
          <div className="text-center text-gray-500">
            <svg className="h-6 w-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          onLoad={handleLoad}
          onError={handleError}
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
};

export default S3Image; 
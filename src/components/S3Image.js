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
    const toStringSrc = (input) => {
      try {
        if (!input) return '';
        if (typeof input === 'string') return input;
        if (Array.isArray(input)) return toStringSrc(input[0]);
        if (typeof input === 'object') {
          const direct = input.url || input.location || input.fileUrl || input.downloadUrl || input.key || input.path;
          if (typeof direct === 'string') return direct;
          for (const value of Object.values(input)) {
            if (typeof value === 'string' && (value.startsWith('http') || value.includes('amazonaws.com') || value.includes('/'))) {
              return value;
            }
          }
        }
        return '';
      } catch (_) {
        return '';
      }
    };

    const raw = toStringSrc(src);
    if (raw) {
      let finalUrl;
      
      // First, try to clean any malformed S3 URLs
      const cleanedUrl = cleanS3Url(raw);
      
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
  
  // Temporary fallback for debugging
  if (finalUrl && finalUrl.includes('localhost:4000/s3-proxy')) {
    console.warn('⚠️ Using localhost proxy URL - check if backend is running on port 4000');
  }
      
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
      <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center ${className} ${errorClassName}`}>
        <div className="text-center">
          <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 9.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15l-3.5-3.5a2 2 0 00-2.828 0l-5.672 5.672" />
          </svg>
          <p className="text-xs text-gray-500 font-medium">Photo bientôt disponible</p>
        </div>
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
        <div className={`bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center ${className} ${errorClassName}`}>
          <div className="text-center">
            <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 9.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15l-3.5-3.5a2 2 0 00-2.828 0l-5.672 5.672" />
            </svg>
            <p className="text-xs text-gray-500 font-medium">Image non disponible</p>
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
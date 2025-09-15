import React, { useState, useEffect, useCallback } from 'react';
import { getS3Url, cleanS3Url } from '../utilities/s3Service';

const S3ImageCorsFixed = ({ 
  src, 
  alt = '', 
  className = '',
  fallbackSrc = null,
  showLoader = true,
  onLoad = null,
  onError = null,
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dataUrl, setDataUrl] = useState(null);

  const loadImageAsDataUrl = useCallback(async (imageUrl) => {
    try {
      console.log('Loading image via fetch to avoid CORS:', imageUrl);
      
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'image/*',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const dataURL = URL.createObjectURL(blob);
      
      console.log('Successfully converted to data URL');
      setDataUrl(dataURL);
      setLoading(false);
      setError(false);
      
      if (onLoad) {
        onLoad({ target: { src: dataURL } });
      }

      return dataURL;
    } catch (err) {
      console.error('Failed to load image:', err);
      setError(true);
      setLoading(false);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    }
  }, [onLoad, onError]);

  useEffect(() => {
    if (!src) {
      setDataUrl(null);
      setLoading(false);
      return;
    }

    const loadImage = async () => {
      setLoading(true);
      setError(false);
      
      try {
        // Clean and get the proper URL
        const cleanedUrl = cleanS3Url(src);
        const finalUrl = cleanedUrl.startsWith('http') ? cleanedUrl : getS3Url(cleanedUrl);
        
        console.log('S3ImageCorsFixed: Loading', finalUrl);
        
        await loadImageAsDataUrl(finalUrl);
      } catch (err) {
        // Try fallback if available
        if (fallbackSrc) {
          try {
            console.log('Trying fallback:', fallbackSrc);
            await loadImageAsDataUrl(fallbackSrc);
          } catch (fallbackErr) {
            console.error('Fallback also failed:', fallbackErr);
          }
        }
      }
    };

    loadImage();

    // Cleanup function to revoke object URLs
    return () => {
      if (dataUrl && dataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(dataUrl);
      }
    };
  }, [src, fallbackSrc, loadImageAsDataUrl]);

  // Don't render anything if no source
  if (!src && !fallbackSrc) {
    return null;
  }

  return (
    <div className="relative">
      {/* Loading state */}
      {loading && showLoader && (
        <div className={`bg-gray-100 animate-pulse flex items-center justify-center ${className}`}>
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
          <div className="text-gray-400 text-xs text-center p-2">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {dataUrl && !error && (
        <img
          src={dataUrl}
          alt={alt}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
};

export default S3ImageCorsFixed;

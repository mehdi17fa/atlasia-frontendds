import { api } from '../api';

/**
 * Frontend S3 Service
 * This service handles file uploads through the backend API for security
 * All AWS operations are handled server-side to avoid exposing credentials
 */

/**
 * Upload file to S3 through backend API
 * @param {File} file - The file to upload
 * @param {string} folder - S3 folder (e.g., 'photos', 'documents', 'profile-pics')
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<{key: string, url: string, fileName: string}>}
 */
export const uploadFileToS3 = async (file, folder = 'general', onProgress = null) => {
  try {
    console.log('🔄 Uploading file:', file.name, 'to folder:', folder);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    };

    console.log('📤 Making API call to /api/upload with config:', config);
    const response = await api.post('/api/upload', formData, config);
    console.log('📥 API response received:', response.data);
    
    // Enhanced backend response handling for inconsistent API responses
    const data = response.data;
    
    // Method 1: Check if success is true
    if (data.success === true && (data.url || data.key)) {
      return {
        key: data.key,
        url: data.url || data.key,
        fileName: data.fileName || file.name,
      };
    }
    
    // Method 1.5: Handle nested file object structure
    if (data.file && (data.file.url || data.file.key)) {
      const fileData = data.file;
      return {
        key: fileData.key,
        url: fileData.url || fileData.key,
        fileName: fileData.fileName || data.fileName || file.name,
      };
    }
    
    // Method 1.6: Handle any structure from which URL or key can be extracted
    if (data.url || data.key) {
      return {
        key: data.key,
        url: data.url || data.key,
        fileName: data.fileName || file.name,
      };
    }
    
    // Method 1.7: Try to extract from any nested structure recursively
    const extractUrlFromObject = (obj, visited = new Set()) => {
      if (visited.has(obj) || typeof obj !== 'object' || obj === null) return null;
      visited.add(obj);
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && (value.includes('http') || value.includes('amazonaws'))) {
          return { key, value };
        }
        if (typeof value === 'object' && value !== null) {
          const result = extractUrlFromObject(value, visited);
          if (result) return result;
        }
      }
      return null;
    };
    
    const urlMatch = extractUrlFromObject(data);
    if (urlMatch) {
      const { value: foundUrl } = urlMatch;
      return {
        key: foundUrl.split('/').pop() || file.name,
        url: foundUrl,
        fileName: file.name,
      };
    }
    
    // Method 2: Look for success messages
    const message = data.message || data.error || '';
    const messageLower = message.toLowerCase();
    if (messageLower.includes('successfully') || messageLower.includes('uploaded')) {
      return {
        key: data.key || data.upload_path || data.path,
        url: data.url || data.fileUrl || data.location || data.uploadUrl || data.downloadUrl,
        fileName: data.fileName || data.originalName || file.name,
      };
    }
    
    // Method 3: Check if we have a URL/key in the response (sometimes backend sets success=false but provides the URL)
    if ((data.url || data.key || data.location || data.fileUrl) && !message.includes('error') && !message.includes('fail')) {
      return {
        key: data.key || data.location,
        url: data.url || data.fileUrl || data.location,
        fileName: data.fileName || file.name,
      };
    }
    
    // Method 4: Check response status and look for URLs in any property
    if (response.status >= 200 && response.status < 300) {
      // Search for any string that looks like a URL in the response
      const searchForUrl = (obj, depth = 0) => {
        if (depth > 3) return null; // Prevent deep recursion
        if (!obj || typeof obj !== 'object') return null;
        
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            // Look for URLs starting with http
            const urlMatch = value.match(/https?:\/\/[^\s\n]+[^)]?/i);
            if (urlMatch) {
              return urlMatch[0];
            }
            // Look for S3 keys or paths that could be converted to URLs
            if (value.includes('amazonaws.com') || value.includes('s3') || value.includes('bucket')) {
              return value.includes('http') ? value : `https://${value}`;
            }
          } else if (typeof value === 'object' && value !== null) {
            const found = searchForUrl(value, depth + 1);
            if (found) return found;
          }
        }
        return null;
      };
      
      const extractedUrl = searchForUrl(data);
      if (extractedUrl) {
        return {
          key: extractedUrl.includes('/') ? extractedUrl.split('/').slice(-1)[0] : file.name,
          url: extractedUrl,
          fileName: file.name,
        };
      }
    }
    
    // If none of the success methods worked, throw an error
    throw new Error(`Upload failed: ${message || 'No success indicators found'}`);
    
  } catch (error) {
    // Enhanced error handling to extract URLs from error responses
    console.error('❌ S3 upload failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
    
    try {
      // Even if the upload was "caught as an error", check if it actually succeeded
      const responseData = error.response?.data;
      if (responseData && typeof responseData === 'object') {
        // Look for success indicators in error response
        const messageLower = errorMessage.toLowerCase();
        if (messageLower.includes('successfully') || messageLower.includes('uploaded')) {
          // Try to extract URL from error data
          const possibleUrl = responseData.url || responseData.key || responseData.location || responseData.fileUrl;
          if (possibleUrl) {
            return {
              key: responseData.key || possibleUrl,
              url: possibleUrl,
              fileName: responseData.fileName || file.name,
            };
          }
          
          // Or extract from error message using regex
          const urlMatch = errorMessage.match(/https?:\/\/[^\s\n\)]+/i);
          if (urlMatch) {
            return {
              key: urlMatch[0],
              url: urlMatch[0],
              fileName: file.name,
            };
          }
        }
      }
    } catch (extractError) {
      // Silent fall through
    }
    
    // Re-throw the original error
    throw new Error(
      `${errorMessage.includes('successfully') ? 'Upload successful but URL extraction failed: ' : 'Upload error: '}${errorMessage}`
    );
  }
};

/**
 * Upload multiple files to S3
 * @param {FileList|Array} files - Files to upload
 * @param {string} folder - S3 folder
 * @param {Function} onProgress - Progress callback for each file
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadMultipleFilesToS3 = async (files, folder = 'general', onProgress = null) => {
  const fileArray = Array.from(files);
  const uploadPromises = fileArray.map((file, index) => 
    uploadFileToS3(file, folder, (progress) => {
      if (onProgress) {
        onProgress(index, progress, file.name);
      }
    })
  );

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
};

/**
 * Upload property photos through backend API
 * @param {string} propertyId - Property ID
 * @param {FileList|Array} files - Photo files
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Updated property data
 */
export const uploadPropertyPhotos = async (propertyId, files, onProgress = null) => {
  try {
    const formData = new FormData();
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    };

    const response = await api.post(
      `/api/property/${propertyId}/photos`, 
      formData, 
      config
    );

    if (response.data.success) {
      return response.data.property;
    } else {
      throw new Error(response.data.message || 'Photo upload failed');
    }
  } catch (error) {
    console.error('Error uploading property photos:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to upload photos'
    );
  }
};

/**
 * Upload property documents through backend API
 * @param {string} propertyId - Property ID
 * @param {FileList|Array} files - Document files
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Updated property data
 */
export const uploadPropertyDocuments = async (propertyId, files, onProgress = null) => {
  try {
    const formData = new FormData();
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    };

    const response = await api.post(
      `/api/property/${propertyId}/documents`, 
      formData, 
      config
    );

    if (response.data.success) {
      return response.data.property;
    } else {
      throw new Error(response.data.message || 'Document upload failed');
    }
  } catch (error) {
    console.error('Error uploading property documents:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to upload documents'
    );
  }
};

/**
 * Upload profile picture through backend API
 * @param {File} file - Profile picture file
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Updated user data
 */
export const uploadProfilePicture = async (file, onProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('profilePic', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    };

    const response = await api.put('/api/auth/update-profile', formData, config);

    if (response.data.success) {
      return response.data.user;
    } else {
      throw new Error(response.data.message || 'Profile picture upload failed');
    }
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to upload profile picture'
    );
  }
};

/**
 * Clean and normalize S3 URL to prevent localhost prefixing
 * @param {string} url - URL that might be malformed
 * @returns {string} Clean S3 URL
 */
export const cleanS3Url = (url) => {
  if (!url) return url;
  
  // If it contains our S3 bucket, extract the clean URL
  if (url.includes('atlasia-bucket-1.s3.us-east-2.amazonaws.com')) {
    const s3UrlMatch = url.match(/https:\/\/atlasia-bucket-1\.s3\.us-east-2\.amazonaws\.com\/.+/);
    if (s3UrlMatch) {
      return s3UrlMatch[0];
    }
    
    // If the URL is malformed but contains the S3 path, reconstruct it
    const keyMatch = url.match(/atlasia-bucket-1\.s3\.us-east-2\.amazonaws\.com\/(.+)/);
    if (keyMatch) {
      return `https://atlasia-bucket-1.s3.us-east-2.amazonaws.com/${keyMatch[1]}`;
    }
  }
  
  return url;
};

/**
 * Generate S3 URL from key (for display purposes)
 * This should match the backend implementation
 * @param {string} key - S3 object key
 * @returns {string} Full S3 URL or backend proxy URL
 */
export const getS3Url = (key) => {
  const runtimeBase = (typeof window !== 'undefined' && window.__API_BASE_URL__) || (api?.defaults?.baseURL || '');
  
  // If it's a local file (starts with / or relative path), return as-is
  if (key.startsWith('/') || key.startsWith('./') || key.startsWith('../')) {
    return key;
  }
  
  // If it's already a full HTTP URL, return as-is
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  
  // Only treat explicit placeholders as static
  if (key.includes('placeholder') || key.includes('default-')) {
    return key.includes('http') ? key : `/${key.replace(/^\//, '')}`;
  }
  
  // For S3 keys, use backend proxy to avoid CORS issues
  // Extract just the key part if it's a full S3 URL
  let cleanKey = key;
  if (key.includes('amazonaws.com/')) {
    cleanKey = key.split('amazonaws.com/')[1];
  }
  
  // Parse the S3 key to get folder and filename
  const parts = cleanKey.split('/');
  const basePath = runtimeBase ? runtimeBase : '';
  const pathPrefix = runtimeBase ? '' : '/api';
  if (parts.length >= 2) {
    const folder = parts[0];
    const filename = parts.slice(1).join('/');
    return `${basePath}${pathPrefix}/s3-proxy/${folder}/${encodeURIComponent(filename)}`;
  } else {
    // If no folder specified, default to general uploads (matches backend upload)
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(cleanKey);
    const defaultFolder = hasImageExtension ? 'general-uploads' : 'property-photos';
    return `${basePath}${pathPrefix}/s3-proxy/${defaultFolder}/${encodeURIComponent(cleanKey)}`;
  }
};

/**
 * Extract S3 key from URL
 * @param {string} url - S3 URL
 * @returns {string|null} S3 key or null if invalid
 */
export const extractS3Key = (url) => {
  try {
    const bucketName = process.env.REACT_APP_S3_BUCKET || 'atlasia-bucket-1';
    const region = process.env.REACT_APP_AWS_REGION || 'us-east-2';
    const urlPattern = new RegExp(`https://${bucketName}\\.s3\\.${region}\\.amazonaws\\.com/(.+)`);
    const match = url.match(urlPattern);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    return null;
  }
};

/**
 * Check if URL is an S3 URL
 * @param {string} url - URL to check
 * @returns {boolean} True if it's an S3 URL
 */
export const isS3Url = (url) => {
  const bucketName = process.env.REACT_APP_S3_BUCKET || 'atlasia-bucket-1';
  const region = process.env.REACT_APP_AWS_REGION || 'us-east-2';
  return url && url.includes(`${bucketName}.s3.${region}.amazonaws.com`);
};

/**
 * Validate file for upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {string|null} Error message or null if valid
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return `File size too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`;
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return `File type not supported. Allowed types: ${allowedExtensions.join(', ').toUpperCase()}`;
    }
  }

  return null;
};

/**
 * Create file preview URL
 * @param {File} file - File to create preview for
 * @returns {string|null} Preview URL or null
 */
export const createFilePreview = (file) => {
  try {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  } catch (error) {
    console.error('Error creating file preview:', error);
    return null;
  }
};

/**
 * Clean up file preview URLs to prevent memory leaks
 * @param {string} url - Preview URL to revoke
 */
export const revokeFilePreview = (url) => {
  try {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error revoking file preview:', error);
  }
}; 
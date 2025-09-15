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

    const response = await api.post('/api/upload', formData, config);
    
    if (response.data.success) {
      return {
        key: response.data.key,
        url: response.data.url,
        fileName: response.data.fileName,
      };
    } else {
      throw new Error(response.data.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to upload file'
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
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";
  
  // If it's a local file (starts with / or relative path), return as-is
  if (key.startsWith('/') || key.startsWith('./') || key.startsWith('../')) {
    return key;
  }
  
  // If it's already a full HTTP URL, return as-is
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  
  // If it's a placeholder or static file, return as-is
  if (key.includes('placeholder') || key.includes('default-') || key.endsWith('.jpg') || key.endsWith('.png') || key.endsWith('.gif') || key.endsWith('.webp')) {
    // Check if it's just a filename without path
    if (!key.includes('/') && !key.includes('property-photos') && !key.includes('profile-pics')) {
      return `/${key}`;
    }
  }
  
  // For S3 keys, use backend proxy to avoid CORS issues
  // Extract just the key part if it's a full S3 URL
  let cleanKey = key;
  if (key.includes('amazonaws.com/')) {
    cleanKey = key.split('amazonaws.com/')[1];
  }
  return `${API_URL}/api/images/${encodeURIComponent(cleanKey)}`;
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
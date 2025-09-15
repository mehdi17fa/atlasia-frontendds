import { useState, useCallback } from 'react';
import { uploadFileToS3, uploadMultipleFilesToS3, validateFile } from '../utilities/s3Service';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for managing S3 file uploads
 * @param {Object} options - Configuration options
 * @returns {Object} Upload state and functions
 */
export const useS3Upload = (options = {}) => {
  const {
    folder = 'general',
    multiple = false,
    maxFiles = 10,
    maxSize = 10 * 1024 * 1024, // 10MB default
    acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'],
    acceptedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
    onSuccess = null,
    onError = null,
    showToasts = true
  } = options;

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const validateFiles = useCallback((files) => {
    const validFiles = [];
    const validationErrors = [];

    Array.from(files).forEach((file, index) => {
      const error = validateFile(file, {
        maxSize,
        allowedTypes: acceptedTypes,
        allowedExtensions: acceptedExtensions
      });

      if (error) {
        validationErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    // Check max files limit for multiple uploads
    if (multiple && validFiles.length > maxFiles) {
      validationErrors.push(`Maximum ${maxFiles} files allowed`);
      return { validFiles: validFiles.slice(0, maxFiles), errors: validationErrors };
    }

    // For single upload, only take first file
    if (!multiple && validFiles.length > 1) {
      return { validFiles: [validFiles[0]], errors: validationErrors };
    }

    return { validFiles, errors: validationErrors };
  }, [acceptedTypes, acceptedExtensions, maxSize, multiple, maxFiles]);

  const uploadFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    const { validFiles, errors: validationErrors } = validateFiles(files);
    
    setErrors(validationErrors);

    // Show validation errors
    if (showToasts && validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({});

    try {
      let results;

      if (multiple) {
        // Handle multiple file upload
        const progressTracker = {};
        results = await uploadMultipleFilesToS3(
          validFiles,
          folder,
          (fileIndex, progress, fileName) => {
            progressTracker[fileIndex] = { progress, fileName };
            setUploadProgress({ ...progressTracker });
          }
        );
      } else {
        // Handle single file upload
        results = await uploadFileToS3(
          validFiles[0],
          folder,
          (progress) => {
            setUploadProgress({ 0: { progress, fileName: validFiles[0].name } });
          }
        );
        results = [results]; // Normalize to array
      }

      setUploadedFiles(prev => [...prev, ...results]);

      if (showToasts) {
        toast.success(`${validFiles.length} file(s) uploaded successfully!`);
      }

      if (onSuccess) {
        onSuccess(multiple ? results : results[0]);
      }

      return multiple ? results : results[0];

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Upload failed';
      
      setErrors(prev => [...prev, errorMessage]);
      
      if (showToasts) {
        toast.error(errorMessage);
      }

      if (onError) {
        onError(error);
      }

      throw error;
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }, [validateFiles, multiple, folder, onSuccess, onError, showToasts]);

  const uploadSingleFile = useCallback(async (file) => {
    return await uploadFiles([file]);
  }, [uploadFiles]);

  const reset = useCallback(() => {
    setUploading(false);
    setUploadProgress({});
    setUploadedFiles([]);
    setErrors([]);
  }, []);

  const removeUploadedFile = useCallback((index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    // State
    uploading,
    uploadProgress,
    uploadedFiles,
    errors,
    hasErrors: errors.length > 0,
    
    // Functions
    uploadFiles,
    uploadSingleFile,
    validateFiles,
    reset,
    removeUploadedFile,
    clearErrors,
    
    // Configuration (read-only)
    config: {
      folder,
      multiple,
      maxFiles,
      maxSize,
      acceptedTypes,
      acceptedExtensions
    }
  };
};

/**
 * Hook specifically for image uploads
 * @param {Object} options - Configuration options
 * @returns {Object} Upload state and functions
 */
export const useS3ImageUpload = (options = {}) => {
  return useS3Upload({
    acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    acceptedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxSize: 5 * 1024 * 1024, // 5MB for images
    folder: 'photos',
    ...options
  });
};

/**
 * Hook specifically for document uploads
 * @param {Object} options - Configuration options
 * @returns {Object} Upload state and functions
 */
export const useS3DocumentUpload = (options = {}) => {
  return useS3Upload({
    acceptedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    acceptedExtensions: ['pdf', 'doc', 'docx', 'txt'],
    maxSize: 10 * 1024 * 1024, // 10MB for documents
    folder: 'documents',
    ...options
  });
};

/**
 * Hook for profile picture uploads
 * @param {Object} options - Configuration options
 * @returns {Object} Upload state and functions
 */
export const useS3ProfileUpload = (options = {}) => {
  return useS3Upload({
    acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    acceptedExtensions: ['jpg', 'jpeg', 'png'],
    maxSize: 2 * 1024 * 1024, // 2MB for profile pictures
    folder: 'profile-pics',
    multiple: false,
    ...options
  });
};

export default useS3Upload; 
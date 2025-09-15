import React, { useState, useCallback, useRef } from 'react';
import { uploadFileToS3, uploadMultipleFilesToS3, validateFile, createFilePreview, revokeFilePreview } from '../utilities/s3Service';
import { toast } from 'react-hot-toast';

const S3ImageUpload = ({ 
  onUpload, 
  multiple = false, 
  folder = 'photos',
  maxFiles = 10,
  className = '',
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  acceptedExtensions = ['jpg', 'jpeg', 'png', 'gif'],
  maxSize = 5 * 1024 * 1024, // 5MB default for images
  showPreview = true,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  // Clean up previews on unmount
  React.useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview.url) {
          revokeFilePreview(preview.url);
        }
      });
    };
  }, []);

  const handleFileValidation = useCallback((files) => {
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach((file, index) => {
      const error = validateFile(file, {
        maxSize,
        allowedTypes: acceptedTypes,
        allowedExtensions: acceptedExtensions
      });

      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    // Check max files limit for multiple uploads
    if (multiple && validFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { validFiles: validFiles.slice(0, maxFiles), errors };
    }

    // For single upload, only take first file
    if (!multiple && validFiles.length > 1) {
      return { validFiles: [validFiles[0]], errors };
    }

    return { validFiles, errors };
  }, [acceptedTypes, acceptedExtensions, maxSize, multiple, maxFiles]);

  const createPreviews = useCallback((files) => {
    if (!showPreview) return [];

    return files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      name: file.name,
      size: file.size,
      url: createFilePreview(file)
    }));
  }, [showPreview]);

  const handleUpload = useCallback(async (files) => {
    const { validFiles, errors } = handleFileValidation(files);

    // Show validation errors
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setPreviews(createPreviews(validFiles));

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

      // Clean up previews
      previews.forEach(preview => {
        if (preview.url) {
          revokeFilePreview(preview.url);
        }
      });
      setPreviews([]);

      // Call success callback
      if (onUpload) {
        onUpload(multiple ? results : results[0]);
      }

      toast.success(`${validFiles.length} file(s) uploaded successfully!`);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [handleFileValidation, createPreviews, multiple, folder, onUpload, previews]);

  const handleFileSelect = useCallback((event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  }, [handleUpload]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const triggerFileInput = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  return (
    <div className={`s3-image-upload ${className}`}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple={multiple}
        accept={acceptedExtensions.map(ext => `.${ext}`).join(',')}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      {/* Drop zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileInput}
      >
        {uploading ? (
          <div className="space-y-2">
            <div className="text-blue-600">
              <svg className="animate-spin h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                {acceptedExtensions.join(', ').toUpperCase()} up to {Math.round(maxSize / (1024 * 1024))}MB
                {multiple && ` (max ${maxFiles} files)`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadProgress).map(([index, { progress, fileName }]) => (
            <div key={index} className="bg-gray-50 rounded p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="truncate">{fileName}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview images */}
      {showPreview && previews.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview) => (
              <div key={preview.id} className="relative">
                {preview.url ? (
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="w-full h-24 object-cover rounded border"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-100 rounded border flex items-center justify-center">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1 truncate">{preview.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default S3ImageUpload; 
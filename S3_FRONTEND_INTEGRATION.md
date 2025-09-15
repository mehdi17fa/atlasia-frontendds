# S3 Frontend Integration Guide

## Overview
This guide covers the S3 integration implemented for the frontend application. The integration provides secure file upload, display, and management capabilities through the backend API.

## Architecture
The frontend S3 integration works through the backend API for security reasons:
- All AWS credentials are stored securely on the backend
- Frontend sends files to backend API endpoints
- Backend handles S3 operations and returns URLs
- Frontend displays and manages the returned S3 URLs

## Files Structure
```
src/
├── utilities/
│   └── s3Service.js          # Core S3 service functions
├── components/
│   ├── S3ImageUpload.js      # Reusable upload component
│   ├── S3Image.js            # Image display component
│   ├── S3ImageGallery.js     # Gallery component
│   └── S3ExampleUsage.js     # Usage examples
└── hooks/
    └── useS3Upload.js        # Custom hooks for uploads
```

## Core Service Functions

### `s3Service.js`
The main service file provides these functions:

#### Upload Functions
- `uploadFileToS3(file, folder, onProgress)` - Upload single file
- `uploadMultipleFilesToS3(files, folder, onProgress)` - Upload multiple files
- `uploadPropertyPhotos(propertyId, files, onProgress)` - Property-specific photo upload
- `uploadPropertyDocuments(propertyId, files, onProgress)` - Property-specific document upload
- `uploadProfilePicture(file, onProgress)` - Profile picture upload

#### Utility Functions
- `getS3Url(key)` - Convert S3 key to full URL
- `extractS3Key(url)` - Extract key from S3 URL
- `isS3Url(url)` - Check if URL is an S3 URL
- `validateFile(file, options)` - Validate file before upload
- `createFilePreview(file)` - Create preview URL for images
- `revokeFilePreview(url)` - Clean up preview URLs

## Components

### S3ImageUpload
A comprehensive upload component with drag-and-drop support.

```jsx
import S3ImageUpload from './components/S3ImageUpload';

<S3ImageUpload
  onUpload={(results) => console.log('Uploaded:', results)}
  multiple={true}
  folder="photos"
  maxFiles={5}
  maxSize={5 * 1024 * 1024} // 5MB
  acceptedExtensions={['jpg', 'jpeg', 'png', 'gif']}
  showPreview={true}
  disabled={false}
/>
```

**Props:**
- `onUpload` - Callback function called after successful upload
- `multiple` - Allow multiple file selection (default: false)
- `folder` - S3 folder for uploads (default: 'photos')
- `maxFiles` - Maximum number of files (default: 10)
- `maxSize` - Maximum file size in bytes (default: 5MB)
- `acceptedTypes` - Array of accepted MIME types
- `acceptedExtensions` - Array of accepted file extensions
- `showPreview` - Show image previews (default: true)
- `disabled` - Disable the component (default: false)

### S3Image
Display S3 images with loading states and error handling.

```jsx
import S3Image from './components/S3Image';

<S3Image
  src="photos/image-key.jpg" // S3 key or full URL
  alt="Description"
  className="w-full h-48 object-cover"
  fallbackSrc="/placeholder.jpg"
  showLoader={true}
  onLoad={(event) => console.log('Image loaded')}
  onError={(event) => console.log('Image error')}
/>
```

**Props:**
- `src` - S3 key or full URL
- `alt` - Alt text for accessibility
- `className` - CSS classes
- `fallbackSrc` - Fallback image URL
- `showLoader` - Show loading spinner (default: true)
- `onLoad` - Load event callback
- `onError` - Error event callback

### S3ImageGallery
Display multiple images in a grid with lightbox functionality.

```jsx
import S3ImageGallery from './components/S3ImageGallery';

<S3ImageGallery
  images={['photo1.jpg', 'photo2.jpg', 'photo3.jpg']}
  columns="auto" // or specific number
  aspectRatio="aspect-square"
  showLightbox={true}
  maxPreviewImages={6}
  onImageClick={(index, image) => console.log('Clicked:', index, image)}
/>
```

**Props:**
- `images` - Array of image URLs or objects
- `columns` - Grid columns ('auto' or number)
- `aspectRatio` - CSS aspect ratio class
- `showLightbox` - Enable lightbox view (default: true)
- `maxPreviewImages` - Limit preview images shown
- `onImageClick` - Custom click handler
- `emptyMessage` - Message when no images
- `showImageCount` - Show image count (default: true)

## Custom Hooks

### useS3Upload
General-purpose upload hook with state management.

```jsx
import { useS3Upload } from './hooks/useS3Upload';

const MyComponent = () => {
  const {
    uploading,
    uploadProgress,
    uploadedFiles,
    errors,
    uploadFiles,
    reset
  } = useS3Upload({
    folder: 'documents',
    multiple: true,
    maxFiles: 5,
    onSuccess: (results) => console.log('Success:', results),
    onError: (error) => console.error('Error:', error)
  });

  const handleFileSelect = (event) => {
    uploadFiles(event.target.files);
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileSelect} />
      {uploading && <p>Uploading...</p>}
      {errors.length > 0 && (
        <div>
          {errors.map((error, i) => <p key={i} style={{color: 'red'}}>{error}</p>)}
        </div>
      )}
    </div>
  );
};
```

### Specialized Hooks
- `useS3ImageUpload()` - Pre-configured for images
- `useS3DocumentUpload()` - Pre-configured for documents
- `useS3ProfileUpload()` - Pre-configured for profile pictures

## Usage Examples

### Basic Image Upload
```jsx
import S3ImageUpload from './components/S3ImageUpload';

const PhotoUploader = () => {
  const [photos, setPhotos] = useState([]);

  const handleUpload = (results) => {
    setPhotos(prev => [...prev, ...results]);
  };

  return (
    <div>
      <S3ImageUpload
        onUpload={handleUpload}
        multiple={true}
        folder="gallery"
        maxFiles={10}
      />
      {photos.length > 0 && (
        <S3ImageGallery images={photos.map(p => p.url)} />
      )}
    </div>
  );
};
```

### Property Photos Management
```jsx
import { uploadPropertyPhotos } from './utilities/s3Service';

const PropertyPhotos = ({ propertyId }) => {
  const [photos, setPhotos] = useState([]);

  const handlePhotoUpload = async (files) => {
    try {
      const updatedProperty = await uploadPropertyPhotos(propertyId, files);
      setPhotos(updatedProperty.photos);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <S3ImageUpload
        onUpload={handlePhotoUpload}
        multiple={true}
        folder="photos"
        maxFiles={20}
      />
      <S3ImageGallery images={photos} />
    </div>
  );
};
```

### Profile Picture Upload
```jsx
import { useS3ProfileUpload } from './hooks/useS3Upload';

const ProfilePicture = () => {
  const [profilePic, setProfilePic] = useState(null);
  const profileUpload = useS3ProfileUpload({
    onSuccess: (result) => setProfilePic(result.url)
  });

  return (
    <div>
      <S3Image
        src={profilePic}
        className="w-32 h-32 rounded-full"
        fallbackSrc="/default-avatar.png"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => profileUpload.uploadSingleFile(e.target.files[0])}
      />
    </div>
  );
};
```

## Environment Configuration

Add these environment variables to your `.env` file:

```env
# Optional: Override default S3 configuration for URL generation
REACT_APP_S3_BUCKET=atlasia-bucket-1
REACT_APP_AWS_REGION=us-east-2

# Backend API URL (if different from default)
REACT_APP_API_URL=http://localhost:4000
```

## Error Handling

The integration includes comprehensive error handling:

### File Validation Errors
- File size too large
- Invalid file type
- Too many files

### Upload Errors
- Network errors
- Server errors
- Authentication errors

### Display Errors
- Image load failures
- Fallback handling
- Graceful degradation

## Best Practices

### Performance
1. Use lazy loading for large image galleries
2. Implement proper image optimization
3. Clean up preview URLs to prevent memory leaks
4. Use appropriate image sizes for different contexts

### Security
1. All uploads go through backend validation
2. File type validation on both frontend and backend
3. Size limits enforced
4. No AWS credentials exposed to frontend

### User Experience
1. Show upload progress for large files
2. Provide visual feedback during uploads
3. Handle errors gracefully with user-friendly messages
4. Support drag-and-drop for better UX

### Accessibility
1. Always provide alt text for images
2. Ensure keyboard navigation works
3. Use semantic HTML elements
4. Provide screen reader friendly feedback

## Troubleshooting

### Common Issues

1. **Upload fails with 413 error**
   - Check file size limits
   - Verify backend configuration

2. **Images don't display**
   - Check S3 bucket permissions
   - Verify CORS configuration
   - Check network connectivity

3. **Validation errors**
   - Ensure file types match accepted formats
   - Check file size limits
   - Verify file integrity

### Debug Steps

1. Check browser console for errors
2. Verify network requests in developer tools
3. Test with different file types and sizes
4. Check backend logs for detailed errors

## Migration from Local Storage

If migrating from local file storage:

1. Update image URLs to use S3 URLs
2. Implement URL conversion utilities
3. Handle backward compatibility
4. Migrate existing files to S3 (backend task)

## Testing

Test the integration with:

1. Different file types and sizes
2. Network interruptions
3. Large file uploads
4. Multiple simultaneous uploads
5. Error scenarios
6. Mobile devices and different browsers 
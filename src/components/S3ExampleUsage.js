import React, { useState } from 'react';
import S3ImageUpload from './S3ImageUpload';
import S3Image from './S3Image';
import S3ImageGallery from './S3ImageGallery';
import { useS3ImageUpload, useS3DocumentUpload, useS3ProfileUpload } from '../hooks/useS3Upload';
import { uploadPropertyPhotos, uploadPropertyDocuments, uploadProfilePicture } from '../utilities/s3Service';

const S3ExampleUsage = () => {
  const [propertyPhotos, setPropertyPhotos] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [propertyId] = useState('example-property-id');

  // Using the custom hooks
  const imageUpload = useS3ImageUpload({
    multiple: true,
    maxFiles: 5,
    onSuccess: (results) => {
      console.log('Images uploaded:', results);
    }
  });

  const documentUpload = useS3DocumentUpload({
    multiple: true,
    maxFiles: 3,
    onSuccess: (results) => {
      console.log('Documents uploaded:', results);
      setDocuments(prev => [...prev, ...results]);
    }
  });

  const profileUpload = useS3ProfileUpload({
    onSuccess: (result) => {
      console.log('Profile picture uploaded:', result);
      setProfilePicture(result.url);
    }
  });

  // Example property photo upload
  const handlePropertyPhotosUpload = async (results) => {
    try {
      // This would typically use the property ID from props or context
      const updatedProperty = await uploadPropertyPhotos(propertyId, results);
      setPropertyPhotos(updatedProperty.photos || []);
    } catch (error) {
      console.error('Error uploading property photos:', error);
    }
  };

  // Example document upload
  const handleDocumentUpload = async (results) => {
    try {
      const updatedProperty = await uploadPropertyDocuments(propertyId, results);
      setDocuments(updatedProperty.documents || []);
    } catch (error) {
      console.error('Error uploading documents:', error);
    }
  };

  // Example profile picture upload
  const handleProfileUpload = async (result) => {
    try {
      const updatedUser = await uploadProfilePicture(result.file);
      setProfilePicture(updatedUser.profilePic);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">S3 Integration Examples</h1>

      {/* Basic Image Upload */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Image Upload</h2>
        <S3ImageUpload
          onUpload={(results) => {
            console.log('Basic upload results:', results);
          }}
          multiple={true}
          folder="examples"
          maxFiles={3}
          className="mb-4"
        />
        
        {imageUpload.uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Uploaded Images:</h3>
            <S3ImageGallery images={imageUpload.uploadedFiles.map(file => file.url)} />
          </div>
        )}
      </section>

      {/* Property Photos Upload */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Property Photos Upload</h2>
        <S3ImageUpload
          onUpload={handlePropertyPhotosUpload}
          multiple={true}
          folder="photos"
          maxFiles={10}
          className="mb-4"
        />
        
        {propertyPhotos.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Property Photos:</h3>
            <S3ImageGallery 
              images={propertyPhotos} 
              columns={3}
              aspectRatio="aspect-video"
            />
          </div>
        )}
      </section>

      {/* Profile Picture Upload */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Picture Upload</h2>
        <div className="flex items-start space-x-6">
          <div className="flex-1">
            <S3ImageUpload
              onUpload={handleProfileUpload}
              multiple={false}
              folder="profile-pics"
              maxSize={2 * 1024 * 1024} // 2MB
              className="mb-4"
            />
          </div>
          
          {profilePicture && (
            <div className="flex-shrink-0">
              <h3 className="text-lg font-medium mb-2">Current Profile Picture:</h3>
              <S3Image
                src={profilePicture}
                alt="Profile Picture"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
            </div>
          )}
        </div>
      </section>

      {/* Document Upload */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Document Upload</h2>
        <S3ImageUpload
          onUpload={handleDocumentUpload}
          multiple={true}
          folder="documents"
          acceptedTypes={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
          acceptedExtensions={['pdf', 'doc', 'docx']}
          maxSize={10 * 1024 * 1024} // 10MB
          showPreview={false}
          className="mb-4"
        />
        
        {documents.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Uploaded Documents:</h3>
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <svg className="h-6 w-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium">{doc.fileName || 'Document'}</p>
                    <p className="text-sm text-gray-500">{doc.url}</p>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Hook Usage Examples */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Using Custom Hooks</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Upload Hook */}
          <div>
            <h3 className="text-lg font-medium mb-2">Image Upload Hook</h3>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => imageUpload.uploadFiles(e.target.files)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={imageUpload.uploading}
            />
            
            {imageUpload.uploading && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Uploading...</p>
                {Object.entries(imageUpload.uploadProgress).map(([index, { progress, fileName }]) => (
                  <div key={index} className="mt-1">
                    <div className="flex justify-between text-xs">
                      <span>{fileName}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {imageUpload.errors.length > 0 && (
              <div className="mt-2 text-red-600 text-sm">
                {imageUpload.errors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
            
            {imageUpload.uploadedFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-green-600">
                  {imageUpload.uploadedFiles.length} files uploaded successfully!
                </p>
              </div>
            )}
          </div>

          {/* Document Upload Hook */}
          <div>
            <h3 className="text-lg font-medium mb-2">Document Upload Hook</h3>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={(e) => documentUpload.uploadFiles(e.target.files)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              disabled={documentUpload.uploading}
            />
            
            {documentUpload.uploading && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Uploading documents...</p>
              </div>
            )}
            
            {documentUpload.uploadedFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-green-600">
                  {documentUpload.uploadedFiles.length} documents uploaded!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Reset buttons */}
        <div className="mt-4 flex space-x-4">
          <button
            onClick={imageUpload.reset}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Reset Image Upload
          </button>
          <button
            onClick={documentUpload.reset}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Reset Document Upload
          </button>
        </div>
      </section>

      {/* S3Image Component Examples */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">S3Image Component Examples</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">With Loading State</h3>
            <S3Image
              src="photos/example-image.jpg"
              alt="Example with loading"
              className="w-full h-48 object-cover rounded"
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">With Fallback</h3>
            <S3Image
              src="photos/non-existent-image.jpg"
              fallbackSrc="https://via.placeholder.com/300x200?text=Fallback"
              alt="Example with fallback"
              className="w-full h-48 object-cover rounded"
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Error State</h3>
            <S3Image
              src="invalid-image-url"
              alt="Example with error"
              className="w-full h-48 object-cover rounded"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default S3ExampleUsage; 
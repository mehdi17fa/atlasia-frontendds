/**
 * Test utility for property creation functionality
 * This file contains test functions to verify property creation works correctly
 */

// Test data for property creation
export const testPropertyData = {
  localisation: {
    city: 'Marrakech',
    address: '123 Rue de la Paix',
    postalCode: '40000'
  },
  propertyType: 'Villa',
  info: {
    guests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1
  },
  equipments: ['wifi', 'tv', 'kitchen', 'parking'],
  title: 'Test Villa in Marrakech',
  description: 'A beautiful test villa for testing purposes',
  price: {
    weekdays: 100,
    weekend: 150
  },
  inventory: [
    {
      meuble: 'Table',
      nombre: 1,
      etatEntree: 'B',
      etatSortie: 'B',
      commentaires: 'Test table'
    }
  ],
  availability: {
    start: null,
    end: null
  },
  instantBooking: false,
  status: 'draft'
};

// Test function to validate property data structure
export const validatePropertyData = (data) => {
  const errors = [];
  
  // Required fields validation
  if (!data.localisation?.city) errors.push('City is required');
  if (!data.localisation?.address) errors.push('Address is required');
  if (!data.localisation?.postalCode) errors.push('Postal code is required');
  
  if (!data.propertyType) errors.push('Property type is required');
  if (!data.info?.guests || data.info.guests < 1) errors.push('At least 1 guest is required');
  if (!data.title?.trim()) errors.push('Title is required');
  if (!data.description?.trim()) errors.push('Description is required');
  if (!data.price?.weekdays || data.price.weekdays <= 0) errors.push('Valid price is required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Test function to simulate property creation API call
export const testPropertyCreation = async (apiUrl, token, propertyData) => {
  try {
    const response = await fetch(`${apiUrl}/api/property`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(propertyData)
    });
    
    const result = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: result,
      error: response.ok ? null : result.message || 'Unknown error'
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
};

// Test function to simulate photo upload
export const testPhotoUpload = async (apiUrl, token, propertyId, files) => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('photos', file);
    });
    
    const response = await fetch(`${apiUrl}/api/property/${propertyId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    const result = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: result,
      error: response.ok ? null : result.message || 'Photo upload failed'
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
};

// Test function to simulate document upload
export const testDocumentUpload = async (apiUrl, token, propertyId, files) => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    
    const response = await fetch(`${apiUrl}/api/property/${propertyId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    const result = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: result,
      error: response.ok ? null : result.message || 'Document upload failed'
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
};

// Comprehensive test suite
export const runPropertyCreationTests = async (apiUrl, token) => {
  console.log('🧪 Starting property creation tests...');
  
  const results = {
    dataValidation: null,
    propertyCreation: null,
    photoUpload: null,
    documentUpload: null
  };
  
  // Test 1: Data validation
  console.log('1️⃣ Testing data validation...');
  results.dataValidation = validatePropertyData(testPropertyData);
  console.log('Data validation result:', results.dataValidation);
  
  if (!results.dataValidation.isValid) {
    console.error('❌ Data validation failed:', results.dataValidation.errors);
    return results;
  }
  
  // Test 2: Property creation
  console.log('2️⃣ Testing property creation...');
  results.propertyCreation = await testPropertyCreation(apiUrl, token, testPropertyData);
  console.log('Property creation result:', results.propertyCreation);
  
  if (!results.propertyCreation.success) {
    console.error('❌ Property creation failed:', results.propertyCreation.error);
    return results;
  }
  
  const propertyId = results.propertyCreation.data.property._id;
  console.log('✅ Property created with ID:', propertyId);
  
  // Test 3: Photo upload (mock files)
  console.log('3️⃣ Testing photo upload...');
  const mockPhotoFiles = [
    new File(['photo1'], 'test1.jpg', { type: 'image/jpeg' }),
    new File(['photo2'], 'test2.jpg', { type: 'image/jpeg' })
  ];
  results.photoUpload = await testPhotoUpload(apiUrl, token, propertyId, mockPhotoFiles);
  console.log('Photo upload result:', results.photoUpload);
  
  // Test 4: Document upload (mock files)
  console.log('4️⃣ Testing document upload...');
  const mockDocumentFiles = [
    new File(['doc1'], 'test.pdf', { type: 'application/pdf' })
  ];
  results.documentUpload = await testDocumentUpload(apiUrl, token, propertyId, mockDocumentFiles);
  console.log('Document upload result:', results.documentUpload);
  
  // Summary
  const allTestsPassed = Object.values(results).every(result => 
    result && (result.isValid || result.success)
  );
  
  console.log('🏁 Test suite completed:', allTestsPassed ? '✅ All tests passed' : '❌ Some tests failed');
  
  return {
    ...results,
    allTestsPassed
  };
};

export default {
  testPropertyData,
  validatePropertyData,
  testPropertyCreation,
  testPhotoUpload,
  testDocumentUpload,
  runPropertyCreationTests
};

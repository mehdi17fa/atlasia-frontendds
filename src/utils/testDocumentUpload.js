/**
 * Test script for document upload functionality
 * Run this in the browser console to test the upload endpoint
 */

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:4000/api';

export const testDocumentUpload = async () => {
  console.log('🧪 Starting Document Upload Test...');
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.error('❌ This test must be run in a browser environment');
    return;
  }

  // Get authentication data
  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  console.log('🔐 Authentication Status:');
  console.log('  Token:', token ? `Present (${token.length} chars)` : 'Missing');
  console.log('  User ID:', user._id || 'Missing');
  console.log('  User Role:', user.role || 'Missing');
  console.log('  User Email:', user.email || 'Missing');

  if (!token) {
    console.error('❌ No authentication token found. Please log in first.');
    return { success: false, error: 'No authentication token' };
  }

  if (!user._id) {
    console.error('❌ No user ID found. Please log in first.');
    return { success: false, error: 'No user ID found' };
  }

  if (!['partner', 'owner'].includes(user.role)) {
    console.error('❌ User role not authorized for document upload. Required: partner or owner');
    return { success: false, error: 'User role not authorized' };
  }

  // Test 1: Check if backend is accessible
  console.log('\n🌐 Testing Backend Connectivity...');
  try {
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/`);
    if (healthResponse.ok) {
      console.log('✅ Backend server is accessible');
    } else {
      console.error('❌ Backend server returned error:', healthResponse.status);
      return { success: false, error: 'Backend server error' };
    }
  } catch (error) {
    console.error('❌ Cannot connect to backend server:', error.message);
    return { success: false, error: 'Cannot connect to backend server' };
  }

  // Test 2: Test authentication endpoint
  console.log('\n🔐 Testing Authentication...');
  try {
    const authResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Authentication successful');
      console.log('  Authenticated user:', authData.user?.email || 'Unknown');
    } else {
      console.error('❌ Authentication failed:', authResponse.status, await authResponse.text());
      return { success: false, error: 'Authentication failed' };
    }
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return { success: false, error: 'Authentication test failed' };
  }

  // Test 3: Test CORS preflight
  console.log('\n🌐 Testing CORS...');
  try {
    const corsResponse = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    if (corsResponse.ok) {
      console.log('✅ CORS preflight successful');
      console.log('  CORS Headers:', {
        'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
      });
    } else {
      console.warn('⚠️ CORS preflight returned:', corsResponse.status);
    }
  } catch (error) {
    console.warn('⚠️ CORS preflight test failed:', error.message);
  }

  // Test 4: Test document upload with mock data
  console.log('\n📤 Testing Document Upload...');
  try {
    // Create a mock PDF file
    const mockPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF';
    const mockFile = new File([mockPdfContent], 'test-document.pdf', { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('files', mockFile);
    formData.append('documentTypes', 'kbis');

    console.log('📋 FormData contents:');
    for (let pair of formData.entries()) {
      console.log(`  ${pair[0]}: ${pair[1].name || pair[1]}`);
    }

    const uploadResponse = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData
    });

    console.log('📥 Upload Response Status:', uploadResponse.status);
    console.log('📥 Upload Response Headers:', Object.fromEntries(uploadResponse.headers.entries()));

    const responseData = await uploadResponse.text();
    console.log('📥 Upload Response Body:', responseData);

    if (uploadResponse.ok) {
      console.log('✅ Document upload test successful!');
      return { success: true, data: responseData };
    } else {
      console.error('❌ Document upload failed:', uploadResponse.status, responseData);
      return { success: false, error: `Upload failed: ${uploadResponse.status} - ${responseData}` };
    }

  } catch (error) {
    console.error('❌ Document upload test failed:', error);
    return { success: false, error: error.message };
  }
};

// Auto-run test when imported
if (typeof window !== 'undefined') {
  console.log('🚀 Document Upload Test Script Loaded');
  console.log('💡 Run testDocumentUpload() in the console to test the upload functionality');
  
  // Make it available globally for easy access
  window.testDocumentUpload = testDocumentUpload;
}

export default testDocumentUpload;

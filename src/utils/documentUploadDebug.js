import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:4000/api';

/**
 * Debug utility for document upload functionality
 * This helps identify issues with the document upload endpoint
 */
export class DocumentUploadDebugger {
  constructor() {
    this.token = localStorage.getItem('accessToken');
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  /**
   * Test the document upload endpoint with debug information
   */
  async testDocumentUpload() {
    console.log('🔍 Document Upload Debug Test Starting...');
    
    // Check authentication
    if (!this.token) {
      console.error('❌ No authentication token found');
      return { success: false, error: 'No authentication token' };
    }

    if (!this.user._id) {
      console.error('❌ No user ID found');
      return { success: false, error: 'No user ID found' };
    }

    console.log('✅ Authentication check passed');
    console.log('👤 User:', { id: this.user._id, role: this.user.role, email: this.user.email });

    // Check if user has permission
    if (!['partner', 'owner'].includes(this.user.role)) {
      console.error('❌ User role not authorized for document upload');
      return { success: false, error: 'User role not authorized for document upload' };
    }

    console.log('✅ User role check passed');

    // Test endpoint availability
    try {
      const healthCheck = await axios.get(`${API_BASE_URL.replace('/api', '')}/`);
      console.log('✅ Backend server is running');
    } catch (error) {
      console.error('❌ Backend server not accessible:', error.message);
      return { success: false, error: 'Backend server not accessible' };
    }

    // Test authentication endpoint
    try {
      const authTest = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      console.log('✅ Authentication token is valid');
    } catch (error) {
      console.error('❌ Authentication token is invalid:', error.response?.data || error.message);
      return { success: false, error: 'Authentication token is invalid' };
    }

    // Test document upload with mock data for all required documents
    try {
      const mockFiles = [
        new File(['kbis content'], 'test-kbis.pdf', { type: 'application/pdf' }),
        new File(['identity content'], 'test-identity.pdf', { type: 'application/pdf' }),
        new File(['address content'], 'test-address.pdf', { type: 'application/pdf' }),
        new File(['insurance content'], 'test-insurance.pdf', { type: 'application/pdf' })
      ];
      
      const formData = new FormData();
      const documentTypes = ['kbis', 'identity', 'address', 'insurance'];
      
      // Add all files
      mockFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // Add all document types
      documentTypes.forEach(type => {
        formData.append('documentTypes', type);
      });

      console.log('📤 Testing document upload with all required documents...');
      console.log('📋 FormData contents:');
      for (let pair of formData.entries()) {
        console.log(`  ${pair[0]}: ${pair[1].name || pair[1]}`);
      }

      const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${this.token}`
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('✅ Document upload test successful');
      console.log('📥 Response:', response.data);
      return { success: true, data: response.data };

    } catch (error) {
      console.error('❌ Document upload test failed');
      console.error('📥 Error response:', error.response?.data);
      console.error('📥 Error status:', error.response?.status);
      console.error('📥 Error headers:', error.response?.headers);
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        details: error.response?.data
      };
    }
  }

  /**
   * Test CORS configuration
   */
  async testCORS() {
    console.log('🔍 Testing CORS configuration...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });
      
      console.log('✅ CORS preflight successful');
      console.log('📥 CORS headers:', {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ CORS preflight failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get comprehensive debug information
   */
  async getDebugInfo() {
    const uploadTest = await this.testDocumentUpload();
    const corsTest = await this.testCORS();
    
    return {
      timestamp: new Date().toISOString(),
      environment: {
        apiUrl: API_BASE_URL,
        frontendUrl: window.location.origin,
        userAgent: navigator.userAgent
      },
      authentication: {
        hasToken: !!this.token,
        hasUser: !!this.user._id,
        userRole: this.user.role,
        tokenLength: this.token?.length || 0
      },
      tests: {
        upload: uploadTest,
        cors: corsTest
      }
    };
  }
}

/**
 * Quick debug function for console use
 */
export const debugDocumentUpload = async () => {
  const debuggerInstance = new DocumentUploadDebugger();
  const info = await debuggerInstance.getDebugInfo();
  console.log('🔍 Document Upload Debug Report:', info);
  return info;
};

export default DocumentUploadDebugger;

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';

/**
 * Example component demonstrating how to properly use the useAuth hook
 * This shows the correct pattern for:
 * 1. Handling loading states
 * 2. Checking authentication
 * 3. Making authenticated API calls
 * 4. Redirecting unauthenticated users
 */
const AuthExample = () => {
  const navigate = useNavigate();
  
  // Get all auth-related data and methods from the hook
  const { 
    user, 
    token, 
    isAuthenticated, 
    isLoading, 
    getUserId,
    hasRole,
    logout 
  } = useAuth();

  // Example API call function
  const fetchUserData = async () => {
    // ALWAYS check if auth is ready first
    if (isLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    // ALWAYS check authentication before making API calls
    if (!isAuthenticated || !token) {
      console.log('❌ Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      console.log('🔑 Making authenticated API call with token:', token.substring(0, 20) + '...');
      console.log('👤 Current user:', { id: getUserId(), role: user?.role });

      // Make API call with token
      const response = await axios.get('/api/user/data', {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });

      console.log('✅ API call successful:', response.data);
      
    } catch (error) {
      console.error('❌ API call failed:', error);
      
      // Handle 401 errors (token expired/invalid)
      if (error.response?.status === 401) {
        console.log('🚪 Token invalid, logging out');
        logout();
        navigate('/login');
      }
    }
  };

  // Example useEffect that waits for auth to be ready
  useEffect(() => {
    // Only run when auth is no longer loading
    if (!isLoading) {
      fetchUserData();
    }
  }, [isLoading]); // Re-run when loading state changes

  // ALWAYS show loading state while auth initializes
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // ALWAYS check authentication after loading completes
  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">You must be logged in to view this content.</p>
        <button 
          onClick={() => navigate('/login')}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Now it's safe to render authenticated content
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Authenticated Content</h2>
      
      <div className="space-y-2">
        <p><strong>User ID:</strong> {getUserId()}</p>
        <p><strong>User Name:</strong> {user?.fullName || user?.email}</p>
        <p><strong>User Role:</strong> {user?.role}</p>
        <p><strong>Is Owner:</strong> {hasRole('owner') ? 'Yes' : 'No'}</p>
        <p><strong>Is Partner:</strong> {hasRole('partner') ? 'Yes' : 'No'}</p>
        <p><strong>Token Available:</strong> {token ? 'Yes' : 'No'}</p>
      </div>

      <div className="mt-4 space-x-2">
        <button 
          onClick={fetchUserData}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Refresh Data
        </button>
        
        <button 
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AuthExample;

/**
 * KEY PATTERNS TO FOLLOW:
 * 
 * 1. ALWAYS destructure what you need from useAuth()
 * 2. ALWAYS check isLoading first - show loading UI
 * 3. ALWAYS check isAuthenticated after loading completes
 * 4. ALWAYS use token from useAuth(), never from localStorage directly
 * 5. ALWAYS handle the loading → not authenticated → authenticated flow
 * 6. NEVER make API calls before checking authentication
 * 7. USE useEffect with [isLoading] dependency to trigger actions when auth is ready
 * 8. HANDLE 401 errors by calling logout() and redirecting
 */

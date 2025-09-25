import { useState, useEffect } from 'react';
import { api } from '../api';

export const useProfileData = (userId, shouldFetch = true) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfileData = async () => {
    if (!shouldFetch) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching current user profile');
      console.log('🔍 API URL:', '/api/auth/me');

      const response = await api.get('/api/auth/me');

      console.log('🔍 Response received:', response.data);

      // The /auth/me endpoint returns the user directly, not wrapped in success/user
      if (response.data && response.data._id) {
        setProfileData(response.data);
      } else {
        console.log('❌ Response validation failed:', response.data);
        throw new Error('Failed to fetch profile data - invalid response format');
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      
      // The API interceptor will handle 401 errors and token refresh automatically
      setError(err.response?.data?.message || err.message || 'Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfileData = () => {
    fetchProfileData();
  };

  useEffect(() => {
    // Clear previous profile data when userId changes to prevent stale data
    if (userId) {
      setProfileData(null);
    }
    fetchProfileData();
  }, [userId, shouldFetch]);

  return {
    profileData,
    loading,
    error,
    refreshProfileData
  };
};

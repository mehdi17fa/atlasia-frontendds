import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:4000/api';

export const useProfileData = (userId, shouldFetch = true) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfileData = async () => {
    if (!userId || !shouldFetch) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔍 Fetching profile for userId:', userId);
      console.log('🔍 API URL:', `${API_BASE_URL}/auth/user/${userId}`);
      console.log('🔍 Token exists:', !!token);

      const response = await axios.get(`${API_BASE_URL}/auth/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🔍 Response received:', response.data);

      if (response.data.success && response.data.user) {
        setProfileData(response.data.user);
      } else {
        console.log('❌ Response validation failed:', {
          hasSuccess: !!response.data.success,
          hasUser: !!response.data.user,
          success: response.data.success,
          user: response.data.user
        });
        throw new Error(response.data.message || 'Failed to fetch profile data');
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfileData = () => {
    fetchProfileData();
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId, shouldFetch]);

  return {
    profileData,
    loading,
    error,
    refreshProfileData
  };
};

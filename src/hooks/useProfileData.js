import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:4000/api';

export const useProfileData = (userId, shouldFetch = true) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfileData = async () => {
    if (!shouldFetch) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔍 Fetching current user profile');
      console.log('🔍 API URL:', `${API_BASE_URL}/auth/me`);
      console.log('🔍 Token exists:', !!token);

      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      
      // Handle 401 specifically - token might be expired
      if (err.response?.status === 401) {
        console.log('🔐 Token expired or invalid, clearing auth data');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to fetch profile data');
      }
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

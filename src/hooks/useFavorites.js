import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:4000/api';

export const useFavorites = () => {
  const { user, token } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get token from context or localStorage as fallback
  const authToken = token || localStorage.getItem('accessToken');
  
  // Check if user is logged in and is a tourist
  const isAuthenticated = !!user && !!authToken && user.role === 'tourist';
  
  // Debug authentication status
  console.log('🔍 Auth Debug:', {
    hasUser: !!user,
    hasToken: !!authToken,
    userRole: user?.role,
    isAuthenticated
  });

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!isAuthenticated) {
      console.log('❌ Not authenticated - user:', !!user, 'token:', !!authToken, 'role:', user?.role);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching favorites with token:', authToken ? 'Present' : 'Missing');
      console.log('🔑 Token preview:', authToken ? authToken.substring(0, 20) + '...' : 'NO TOKEN');
      console.log('🔗 API URL:', `${API_BASE_URL}/favorites/`);
      
      const response = await axios.get(`${API_BASE_URL}/favorites/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Favorites fetched successfully:', response.data);
      setFavorites(response.data.favorites.filter(fav => fav && fav.item && fav.item._id).map(fav => fav.item._id));
      console.log('📝 Favorites state updated:', response.data.favorites.filter(fav => fav && fav.item && fav.item._id).map(fav => fav.item._id));
    } catch (err) {
      console.error('❌ Error fetching favorites:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      setError(`Failed to fetch favorites: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Check if an item is favorited
  const isFavorited = (itemId) => {
    const isFav = favorites.includes(itemId);
    console.log(`🔍 isFavorited(${itemId}): ${isFav}, favorites:`, favorites);
    return isFav;
  };

  // Toggle favorite status
  const toggleFavorite = async (itemId, itemType = 'property') => {
    if (!isAuthenticated) {
      console.log('❌ Not authenticated for toggleFavorite');
      setError('Please log in to save favorites');
      return false;
    }

    try {
      const isCurrentlyFavorited = isFavorited(itemId);
      console.log(`🔄 Toggling favorite for ${itemType}: ${itemId}, currently favorited: ${isCurrentlyFavorited}`);
      
      if (isCurrentlyFavorited) {
        // Remove from favorites
        console.log('🗑️ Removing from favorites');
        await axios.delete(`${API_BASE_URL}/favorites/${itemId}?itemType=${itemType}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setFavorites(prev => prev.filter(id => id !== itemId));
        console.log('✅ Removed from favorites');
      } else {
        // Add to favorites
        const requestBody = {
          itemType,
          ...(itemType === 'property' ? { propertyId: itemId } : { packageId: itemId })
        };
        
        console.log('➕ Adding to favorites:', requestBody);
        console.log('🔑 Using token:', authToken ? authToken.substring(0, 20) + '...' : 'NO TOKEN');
        console.log('🔗 API URL:', `${API_BASE_URL}/favorites/add`);
        
        const response = await axios.post(`${API_BASE_URL}/favorites/add`, requestBody, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        console.log('✅ Add favorites response:', response.data);
        setFavorites(prev => [...prev, itemId]);
        console.log('✅ Added to favorites');
      }
      
      return !isCurrentlyFavorited;
    } catch (err) {
      console.error('❌ Error toggling favorite:', err);
      console.error('❌ Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update favorite');
      return false;
    }
  };

  // Check favorite status for a specific item
  const checkFavoriteStatus = async (itemId, itemType = 'property') => {
    if (!isAuthenticated) return false;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/favorites/check/${itemId}?itemType=${itemType}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return response.data.isFavorited;
    } catch (err) {
      console.error('Error checking favorite status:', err);
      return false;
    }
  };

  // Load favorites on mount and when auth changes
  useEffect(() => {
    console.log('🔄 useFavorites useEffect triggered - isAuthenticated:', isAuthenticated, 'authToken:', !!authToken);
    
    if (isAuthenticated) {
      // Test authentication first
      testAuth().then(authWorking => {
        if (authWorking) {
          fetchFavorites();
        } else {
          console.log('❌ Authentication test failed, not fetching favorites');
        }
      });
    }
  }, [isAuthenticated, authToken]);

  // Test authentication endpoint
  const testAuth = async () => {
    if (!authToken) {
      console.log('❌ No token available for auth test');
      return false;
    }
    
    try {
      console.log('🧪 Testing authentication...');
      const response = await axios.get(`${API_BASE_URL}/favorites/test`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Auth test successful:', response.data);
      return true;
    } catch (err) {
      console.error('❌ Auth test failed:', err.response?.data);
      return false;
    }
  };

  return {
    favorites,
    loading,
    error,
    isFavorited,
    toggleFavorite,
    checkFavoriteStatus,
    fetchFavorites,
    testAuth,
    isAuthenticated
  };
};

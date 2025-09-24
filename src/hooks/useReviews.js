import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const useReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewableBookings, setReviewableBookings] = useState([]);
  const { user, token } = useContext(AuthContext);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

  // Get reviews for a property
  const getPropertyReviews = async (propertyId, page = 1, limit = 10, sort = 'newest') => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📖 Fetching reviews for property:', propertyId);
      
      const response = await axios.get(`${API_BASE_URL}/reviews/property/${propertyId}`, {
        params: { page, limit, sort }
      });

      console.log('📖 Reviews fetched successfully:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ Error fetching reviews:', err);
      setError(err.response?.data?.message || 'Error fetching reviews');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get user's reviewable bookings
  const getReviewableBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        console.log('⚠️ No token available, skipping reviewable bookings fetch');
        setReviewableBookings([]);
        return { bookings: [] };
      }
      
      console.log('📋 Fetching reviewable bookings');
      
      const response = await axios.get(`${API_BASE_URL}/reviews/reviewable`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('📋 Reviewable bookings fetched:', response.data);
      setReviewableBookings(response.data.bookings || []);
      return response.data;
    } catch (err) {
      console.error('❌ Error fetching reviewable bookings:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error data:', err.response?.data);
      
      // Don't throw error for 404s, just log and continue
      if (err.response?.status === 404) {
        console.log('⚠️ Reviewable bookings endpoint not found, continuing without error');
        setReviewableBookings([]);
        return { bookings: [] };
      }
      
      setError(err.response?.data?.message || 'Error fetching reviewable bookings');
      // Don't throw the error to prevent app crashes
      return { bookings: [] };
    } finally {
      setLoading(false);
    }
  };

  // Submit a new review
  const submitReview = async (reviewData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      console.log('📝 Submitting review:', reviewData);
      
      const response = await axios.post(`${API_BASE_URL}/reviews`, reviewData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Review submitted successfully:', response.data);
      
      // Refresh reviewable bookings
      await getReviewableBookings();
      
      return response.data;
    } catch (err) {
      console.error('❌ Error submitting review:', err);
      setError(err.response?.data?.message || 'Error submitting review');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing review
  const updateReview = async (reviewId, reviewData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      console.log('✏️ Updating review:', reviewId, reviewData);
      
      const response = await axios.patch(`${API_BASE_URL}/reviews/${reviewId}`, reviewData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Review updated successfully:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ Error updating review:', err);
      setError(err.response?.data?.message || 'Error updating review');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a review
  const deleteReview = async (reviewId) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      console.log('🗑️ Deleting review:', reviewId);
      
      const response = await axios.delete(`${API_BASE_URL}/reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('✅ Review deleted successfully:', response.data);
      
      // Refresh reviewable bookings
      await getReviewableBookings();
      
      return response.data;
    } catch (err) {
      console.error('❌ Error deleting review:', err);
      setError(err.response?.data?.message || 'Error deleting review');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user can review a booking
  const canReviewBooking = (bookingId) => {
    return reviewableBookings.some(booking => booking._id === bookingId);
  };

  // Get review for a specific booking
  const getReviewForBooking = (bookingId) => {
    // This would need to be implemented in the backend
    // For now, we'll assume we don't have this endpoint
    return null;
  };

  // Load reviewable bookings on mount if user is authenticated
  useEffect(() => {
    if (user && token && user.role === 'tourist') {
      console.log('🔄 Auto-loading reviewable bookings for tourist user');
      getReviewableBookings();
    }
  }, [user, token]);

  return {
    reviews,
    reviewableBookings,
    loading,
    error,
    getPropertyReviews,
    getReviewableBookings,
    submitReview,
    updateReview,
    deleteReview,
    canReviewBooking,
    getReviewForBooking,
    clearError: () => setError(null)
  };
};

export default useReviews;
